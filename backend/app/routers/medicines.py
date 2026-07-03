"""Medicine endpoints — /api/medicines"""
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from app.schemas.medicine import MedicineCreate, MedicineResponse
from app.security.auth import get_current_user
from app.database.firestore import MedicineRepository

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/medicines", tags=["Medicines"])

_repo = MedicineRepository()
_MOCK_MEDICINES: list[dict] = []


@router.get("", response_model=list[MedicineResponse])
async def list_medicines(
    patient_id: Optional[str] = Query(None),
    limit: int = Query(100, le=500),
    offset: int = Query(0, ge=0),
    user: dict = Depends(get_current_user),
):
    """List medicines, optionally filtered by patient."""
    try:
        filters = {}
        if patient_id:
            filters["patient_id"] = patient_id
        return _repo.list_all(filters=filters if filters else None, limit=limit, offset=offset)
    except RuntimeError:
        results = _MOCK_MEDICINES
        if patient_id:
            results = [m for m in results if m.get("patient_id") == patient_id]
        return results[offset : offset + limit]


@router.get("/{medicine_id}", response_model=MedicineResponse)
async def get_medicine(medicine_id: str, user: dict = Depends(get_current_user)):
    """Get a single medicine by ID."""
    try:
        med = _repo.get(medicine_id)
        if not med:
            raise HTTPException(status_code=404, detail="Medicine not found")
        return med
    except RuntimeError:
        for m in _MOCK_MEDICINES:
            if m["id"] == medicine_id:
                return m
        raise HTTPException(status_code=404, detail="Medicine not found")


@router.post("", response_model=MedicineResponse, status_code=201)
async def create_medicine(body: MedicineCreate, user: dict = Depends(get_current_user)):
    """Add a new medicine / reminder."""
    try:
        return _repo.create(body.model_dump())
    except RuntimeError:
        import uuid
        mock = {"id": str(uuid.uuid4())[:8], **body.model_dump()}
        _MOCK_MEDICINES.append(mock)
        return mock


@router.put("/{medicine_id}", response_model=MedicineResponse)
async def update_medicine(
    medicine_id: str, body: MedicineCreate, user: dict = Depends(get_current_user)
):
    """Update an existing medicine record."""
    try:
        updated = _repo.update(medicine_id, body.model_dump())
        if not updated:
            raise HTTPException(status_code=404, detail="Medicine not found")
        return updated
    except RuntimeError:
        for i, m in enumerate(_MOCK_MEDICINES):
            if m["id"] == medicine_id:
                _MOCK_MEDICINES[i] = {"id": medicine_id, **body.model_dump()}
                return _MOCK_MEDICINES[i]
        raise HTTPException(status_code=404, detail="Medicine not found")


@router.delete("/{medicine_id}", status_code=204)
async def delete_medicine(medicine_id: str, user: dict = Depends(get_current_user)):
    """Soft-delete a medicine record."""
    try:
        if not _repo.soft_delete(medicine_id):
            raise HTTPException(status_code=404, detail="Medicine not found")
    except RuntimeError:
        global _MOCK_MEDICINES
        _MOCK_MEDICINES = [m for m in _MOCK_MEDICINES if m["id"] != medicine_id]
