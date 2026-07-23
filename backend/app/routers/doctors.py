"""Doctor endpoints — /api/doctors"""
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from app.schemas.doctor import DoctorCreate, DoctorResponse
from app.security.auth import get_current_user
from app.database.firestore import DoctorRepository

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/doctors", tags=["Doctors"])

_repo = DoctorRepository()


@router.get("", response_model=list[DoctorResponse])
async def list_doctors(
    specialization: Optional[str] = Query(None),
    limit: int = Query(100, le=500),
    offset: int = Query(0, ge=0),
    user: dict = Depends(get_current_user),
):
    """List all doctors."""
    filters = {}
    if specialization:
        filters["specialization"] = specialization
    return _repo.list_all(filters=filters if filters else None, limit=limit, offset=offset)


@router.get("/{doctor_id}", response_model=DoctorResponse)
async def get_doctor(doctor_id: str, user: dict = Depends(get_current_user)):
    """Get a single doctor by ID."""
    doctor = _repo.get(doctor_id)
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return doctor


@router.post("", response_model=DoctorResponse, status_code=201)
async def create_doctor(body: DoctorCreate, user: dict = Depends(get_current_user)):
    """Register a new doctor profile."""
    data = body.model_dump()
    data["user_id"] = user.get("uid")
    return _repo.create(data)
