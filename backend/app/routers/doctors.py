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

_MOCK_DOCTORS = [
    {"id": "d1", "name": "Dr. Sarah Wilson", "specialization": "Cardiologist", "hospital": "City General", "appointments": 12, "emergencies": 2},
    {"id": "d2", "name": "Dr. James Chen", "specialization": "Endocrinologist", "hospital": "Metro Health", "appointments": 8, "emergencies": 0},
    {"id": "d3", "name": "Dr. Emily Davis", "specialization": "General Physician", "hospital": "City General", "appointments": 15, "emergencies": 5},
]


@router.get("", response_model=list[DoctorResponse])
async def list_doctors(
    specialization: Optional[str] = Query(None),
    limit: int = Query(100, le=500),
    offset: int = Query(0, ge=0),
    user: dict = Depends(get_current_user),
):
    """List all doctors."""
    try:
        filters = {}
        if specialization:
            filters["specialization"] = specialization
        return _repo.list_all(filters=filters if filters else None, limit=limit, offset=offset)
    except RuntimeError:
        results = _MOCK_DOCTORS
        if specialization:
            results = [d for d in results if d.get("specialization") == specialization]
        return results[offset : offset + limit]


@router.get("/{doctor_id}", response_model=DoctorResponse)
async def get_doctor(doctor_id: str, user: dict = Depends(get_current_user)):
    """Get a single doctor by ID."""
    try:
        doctor = _repo.get(doctor_id)
        if not doctor:
            raise HTTPException(status_code=404, detail="Doctor not found")
        return doctor
    except RuntimeError:
        for d in _MOCK_DOCTORS:
            if d["id"] == doctor_id:
                return d
        raise HTTPException(status_code=404, detail="Doctor not found")


@router.post("", response_model=DoctorResponse, status_code=201)
async def create_doctor(body: DoctorCreate, user: dict = Depends(get_current_user)):
    """Register a new doctor profile."""
    try:
        return _repo.create(body.model_dump())
    except RuntimeError:
        import uuid
        mock = {"id": str(uuid.uuid4())[:8], **body.model_dump()}
        _MOCK_DOCTORS.append(mock)
        return mock
