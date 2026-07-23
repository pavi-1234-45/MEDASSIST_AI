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


@router.get("", response_model=list[MedicineResponse])
async def list_medicines(
    patient_id: Optional[str] = Query(None),
    limit: int = Query(100, le=500),
    offset: int = Query(0, ge=0),
    user: dict = Depends(get_current_user),
):
    """List medicines, optionally filtered by patient."""
    filters = {}
    if patient_id:
        filters["patient_id"] = patient_id
    return _repo.list_all(filters=filters if filters else None, limit=limit, offset=offset)


@router.get("/{medicine_id}", response_model=MedicineResponse)
async def get_medicine(medicine_id: str, user: dict = Depends(get_current_user)):
    """Get a single medicine by ID."""
    med = _repo.get(medicine_id)
    if not med:
        raise HTTPException(status_code=404, detail="Medicine not found")
    return med


@router.post("", response_model=MedicineResponse, status_code=201)
async def create_medicine(body: MedicineCreate, user: dict = Depends(get_current_user)):
    """Add a new medicine / reminder."""
    return _repo.create(body.model_dump())


@router.put("/{medicine_id}", response_model=MedicineResponse)
async def update_medicine(
    medicine_id: str, body: MedicineCreate, user: dict = Depends(get_current_user)
):
    """Update an existing medicine record."""
    updated = _repo.update(medicine_id, body.model_dump())
    if not updated:
        raise HTTPException(status_code=404, detail="Medicine not found")
    return updated


@router.delete("/{medicine_id}", status_code=204)
async def delete_medicine(medicine_id: str, user: dict = Depends(get_current_user)):
    """Soft-delete a medicine record."""
    if not _repo.soft_delete(medicine_id):
        raise HTTPException(status_code=404, detail="Medicine not found")
