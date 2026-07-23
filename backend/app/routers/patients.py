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


@router.get("", response_model=list[PatientResponse])
async def list_patients(
    status: Optional[str] = Query(None),
    limit: int = Query(100, le=500),
    offset: int = Query(0, ge=0),
    user: dict = Depends(get_current_user),
):
    """List patients. Doctors/admins see all; patients see only themselves."""
    filters = {}
    if status:
        filters["status"] = status

    role = user.get("role", "patient")
    if role == "patient":
        filters["user_id"] = user.get("uid")

    return _repo.list_all(filters=filters if filters else None, limit=limit, offset=offset)


@router.get("/{patient_id}", response_model=PatientResponse)
async def get_patient(patient_id: str, user: dict = Depends(get_current_user)):
    """Get a single patient by ID."""
    patient = _repo.get(patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


@router.post("", response_model=PatientResponse, status_code=201)
async def create_patient(body: PatientCreate, user: dict = Depends(get_current_user)):
    """Create a new patient record."""
    data = body.model_dump()
    data["user_id"] = user.get("uid")
    return _repo.create(data)


@router.put("/{patient_id}", response_model=PatientResponse)
async def update_patient(
    patient_id: str, body: PatientUpdate, user: dict = Depends(get_current_user)
):
    """Update an existing patient record."""
    updates = body.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update.")

    updated = _repo.update(patient_id, updates)
    if not updated:
        raise HTTPException(status_code=404, detail="Patient not found")
    return updated


@router.delete("/{patient_id}", status_code=204)
async def delete_patient(patient_id: str, user: dict = Depends(get_current_user)):
    """Soft-delete a patient record."""
    if not _repo.soft_delete(patient_id):
        raise HTTPException(status_code=404, detail="Patient not found")
