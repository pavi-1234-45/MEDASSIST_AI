"""Appointment endpoints — /api/appointments"""
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from app.schemas.appointment import AppointmentCreate, AppointmentResponse, AppointmentStatusUpdate
from app.security.auth import get_current_user
from app.database.firestore import AppointmentRepository

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/appointments", tags=["Appointments"])

_repo = AppointmentRepository()


@router.get("", response_model=list[AppointmentResponse])
async def list_appointments(
    patient_id: Optional[str] = Query(None),
    doctor_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(100, le=500),
    offset: int = Query(0, ge=0),
    user: dict = Depends(get_current_user),
):
    """List appointments with optional filters."""
    filters = {}
    if patient_id:
        filters["patient_id"] = patient_id
    if doctor_id:
        filters["doctor_id"] = doctor_id
    if status:
        filters["status"] = status
    return _repo.list_all(filters=filters if filters else None, limit=limit, offset=offset)


@router.get("/{appointment_id}", response_model=AppointmentResponse)
async def get_appointment(appointment_id: str, user: dict = Depends(get_current_user)):
    """Get a single appointment by ID."""
    appt = _repo.get(appointment_id)
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return appt


@router.post("", response_model=AppointmentResponse, status_code=201)
async def create_appointment(body: AppointmentCreate, user: dict = Depends(get_current_user)):
    """Create a new appointment."""
    data = body.model_dump()
    data["created_by"] = user.get("uid")
    return _repo.create(data)


@router.put("/{appointment_id}/status", response_model=AppointmentResponse)
async def update_appointment_status(
    appointment_id: str,
    body: AppointmentStatusUpdate,
    user: dict = Depends(get_current_user),
):
    """Update appointment status."""
    updated = _repo.update(appointment_id, {"status": body.status})
    if not updated:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return updated


@router.put("/{appointment_id}", response_model=AppointmentResponse)
async def update_appointment(
    appointment_id: str,
    body: AppointmentCreate,
    user: dict = Depends(get_current_user),
):
    """Update an existing appointment."""
    updated = _repo.update(appointment_id, body.model_dump())
    if not updated:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return updated


@router.delete("/{appointment_id}", status_code=204)
async def delete_appointment(appointment_id: str, user: dict = Depends(get_current_user)):
    """Soft-delete an appointment."""
    if not _repo.soft_delete(appointment_id):
        raise HTTPException(status_code=404, detail="Appointment not found")
