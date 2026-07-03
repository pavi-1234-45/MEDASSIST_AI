"""Patient endpoints — /api/patients"""
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from app.schemas.patient import PatientCreate, PatientResponse, PatientUpdate
from app.security.auth import get_current_user
from app.database.firestore import PatientRepository

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/patients", tags=["Patients"])

_repo = PatientRepository()

# ── Seed data (used when Firestore is unavailable) ───────────────────
_MOCK_PATIENTS = [
    {"id": "p1", "name": "John Doe", "age": 45, "gender": "Male", "phone": "1234567890", "condition": "Diabetes", "caregiver": "Jane Doe", "adherence": 85, "last_alert": "2 hours ago", "status": "Active"},
    {"id": "p2", "name": "Alice Smith", "age": 62, "gender": "Female", "phone": "0987654321", "condition": "Hypertension", "caregiver": "Bob Smith", "adherence": 60, "last_alert": "1 day ago", "status": "Needs Attention"},
    {"id": "p3", "name": "Michael Johnson", "age": 34, "gender": "Male", "phone": "5551234567", "condition": "Asthma", "caregiver": "Sarah Johnson", "adherence": 95, "last_alert": None, "status": "Stable"},
    {"id": "p4", "name": "Emma Brown", "age": 78, "gender": "Female", "phone": "5559876543", "condition": "Arthritis", "caregiver": "Tom Brown", "adherence": 40, "last_alert": "5 mins ago", "status": "Critical"},
]


@router.get("", response_model=list[PatientResponse])
async def list_patients(
    status: Optional[str] = Query(None),
    limit: int = Query(100, le=500),
    offset: int = Query(0, ge=0),
    user: dict = Depends(get_current_user),
):
    """List patients. Doctors/admins see all; patients see only themselves."""
    try:
        filters = {}
        if status:
            filters["status"] = status

        role = user.get("role", "patient")
        if role == "patient":
            filters["user_id"] = user.get("uid")

        return _repo.list_all(filters=filters if filters else None, limit=limit, offset=offset)
    except RuntimeError:
        # Firestore unavailable — return mock data
        results = _MOCK_PATIENTS
        if status:
            results = [p for p in results if p.get("status") == status]
        return results[offset : offset + limit]


@router.get("/{patient_id}", response_model=PatientResponse)
async def get_patient(patient_id: str, user: dict = Depends(get_current_user)):
    """Get a single patient by ID."""
    try:
        patient = _repo.get(patient_id)
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        return patient
    except RuntimeError:
        for p in _MOCK_PATIENTS:
            if p["id"] == patient_id:
                return p
        raise HTTPException(status_code=404, detail="Patient not found")


@router.post("", response_model=PatientResponse, status_code=201)
async def create_patient(body: PatientCreate, user: dict = Depends(get_current_user)):
    """Create a new patient record."""
    try:
        data = body.model_dump()
        data["user_id"] = user.get("uid")
        return _repo.create(data)
    except RuntimeError:
        import uuid
        mock = {"id": str(uuid.uuid4())[:8], **body.model_dump()}
        _MOCK_PATIENTS.append(mock)
        return mock


@router.put("/{patient_id}", response_model=PatientResponse)
async def update_patient(
    patient_id: str, body: PatientUpdate, user: dict = Depends(get_current_user)
):
    """Update an existing patient record."""
    updates = body.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update.")

    try:
        updated = _repo.update(patient_id, updates)
        if not updated:
            raise HTTPException(status_code=404, detail="Patient not found")
        return updated
    except RuntimeError:
        for i, p in enumerate(_MOCK_PATIENTS):
            if p["id"] == patient_id:
                _MOCK_PATIENTS[i] = {**p, **updates}
                return _MOCK_PATIENTS[i]
        raise HTTPException(status_code=404, detail="Patient not found")


@router.delete("/{patient_id}", status_code=204)
async def delete_patient(patient_id: str, user: dict = Depends(get_current_user)):
    """Soft-delete a patient record."""
    try:
        if not _repo.soft_delete(patient_id):
            raise HTTPException(status_code=404, detail="Patient not found")
    except RuntimeError:
        global _MOCK_PATIENTS
        _MOCK_PATIENTS = [p for p in _MOCK_PATIENTS if p["id"] != patient_id]
