import os
import logging
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

import firebase_admin
from firebase_admin import credentials, firestore

from app.config.settings import settings

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────────────
# Firebase Admin SDK initialisation (singleton)
# ──────────────────────────────────────────────────────────────────────
_db = None


def _init_firebase() -> None:
    """Initialise the Firebase Admin SDK exactly once."""
    try:
        firebase_admin.get_app()
        return  # already initialised
    except ValueError:
        pass

    try:
        cred_path = settings.FIREBASE_CREDENTIALS_PATH
        if cred_path and os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
            logger.info("Firebase Admin initialised with service-account key.")
        else:
            firebase_admin.initialize_app()
            logger.info("Firebase Admin initialised with ADC / default credentials.")
    except Exception as exc:
        logger.warning("Firebase Admin init failed: %s — Firestore will be disabled.", exc)


def get_db():
    """Return the Firestore client (lazy singleton)."""
    global _db
    if _db is not None:
        return _db

    _init_firebase()

    try:
        _db = firestore.client()
    except Exception as exc:
        logger.warning("Firestore client creation failed: %s", exc)
        _db = None

    return _db


# ──────────────────────────────────────────────────────────────────────
# Base Repository — generic CRUD with soft-delete & timestamps
# ──────────────────────────────────────────────────────────────────────
class BaseRepository:
    """Generic Firestore repository with CRUD, pagination, soft-delete."""

    def __init__(self, collection_name: str):
        self.collection_name = collection_name

    # ── helpers ──────────────────────────────────────────────────────
    @property
    def collection(self):
        db = get_db()
        if not db:
            raise RuntimeError("Firestore is not initialised.")
        return db.collection(self.collection_name)

    @staticmethod
    def _now() -> str:
        return datetime.now(timezone.utc).isoformat()

    # ── READ ─────────────────────────────────────────────────────────
    def get(self, doc_id: str) -> Optional[Dict[str, Any]]:
        doc = self.collection.document(doc_id).get()
        if doc.exists:
            data = doc.to_dict()
            if data.get("deleted"):
                return None  # treat soft-deleted as absent
            return {"id": doc.id, **data}
        return None

    def list_all(
        self,
        filters: Optional[Dict[str, Any]] = None,
        order_by: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[Dict[str, Any]]:
        """
        List documents with optional equality filters, ordering, and pagination.
        Soft-deleted documents are excluded automatically.
        """
        query = self.collection.where("deleted", "==", False)

        if filters:
            for field, value in filters.items():
                query = query.where(field, "==", value)

        if order_by:
            query = query.order_by(order_by)

        query = query.offset(offset).limit(limit)

        results = []
        for doc in query.stream():
            results.append({"id": doc.id, **doc.to_dict()})
        return results

    # ── CREATE ───────────────────────────────────────────────────────
    def create(self, data: dict, doc_id: Optional[str] = None) -> Dict[str, Any]:
        data["created_at"] = self._now()
        data["updated_at"] = self._now()
        data["deleted"] = False

        if doc_id:
            self.collection.document(doc_id).set(data)
            return {"id": doc_id, **data}
        else:
            _ts, doc_ref = self.collection.add(data)
            return {"id": doc_ref.id, **data}

    # ── UPDATE ───────────────────────────────────────────────────────
    def update(self, doc_id: str, data: dict) -> Optional[Dict[str, Any]]:
        doc_ref = self.collection.document(doc_id)
        doc = doc_ref.get()
        if not doc.exists:
            return None

        data["updated_at"] = self._now()
        doc_ref.update(data)

        updated = doc_ref.get().to_dict()
        return {"id": doc_id, **updated}

    # ── SOFT DELETE ──────────────────────────────────────────────────
    def soft_delete(self, doc_id: str) -> bool:
        doc_ref = self.collection.document(doc_id)
        doc = doc_ref.get()
        if not doc.exists:
            return False

        doc_ref.update({
            "deleted": True,
            "deleted_at": self._now(),
            "updated_at": self._now(),
        })
        return True

    # ── HARD DELETE (use sparingly) ──────────────────────────────────
    def hard_delete(self, doc_id: str) -> bool:
        doc_ref = self.collection.document(doc_id)
        doc = doc_ref.get()
        if not doc.exists:
            return False
        doc_ref.delete()
        return True


# ──────────────────────────────────────────────────────────────────────
# Domain-specific repositories
# ──────────────────────────────────────────────────────────────────────
class UserRepository(BaseRepository):
    def __init__(self):
        super().__init__("users")

    def get_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        docs = self.collection.where("email", "==", email).limit(1).stream()
        for doc in docs:
            data = doc.to_dict()
            if not data.get("deleted"):
                return {"id": doc.id, **data}
        return None


class PatientRepository(BaseRepository):
    def __init__(self):
        super().__init__("patients")

    def get_by_caregiver(self, caregiver_id: str) -> List[Dict[str, Any]]:
        return self.list_all(filters={"caregiver_id": caregiver_id})


class DoctorRepository(BaseRepository):
    def __init__(self):
        super().__init__("doctors")


class AppointmentRepository(BaseRepository):
    def __init__(self):
        super().__init__("appointments")

    def get_by_patient(self, patient_id: str) -> List[Dict[str, Any]]:
        return self.list_all(filters={"patient_id": patient_id})

    def get_by_doctor(self, doctor_id: str) -> List[Dict[str, Any]]:
        return self.list_all(filters={"doctor_id": doctor_id})


class AlertRepository(BaseRepository):
    def __init__(self):
        super().__init__("alerts")


class MedicineRepository(BaseRepository):
    def __init__(self):
        super().__init__("medicines")

    def get_by_patient(self, patient_id: str) -> List[Dict[str, Any]]:
        return self.list_all(filters={"patient_id": patient_id})


class ReportRepository(BaseRepository):
    def __init__(self):
        super().__init__("reports")

    def get_by_patient(self, patient_id: str) -> List[Dict[str, Any]]:
        return self.list_all(filters={"patient_id": patient_id})
