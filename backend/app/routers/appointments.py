"""Appointment endpoints — /api/appointments"""
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from app.schemas.appointment import AppointmentCreate, AppointmentResponse, AppointmentStatusUpdate
from app.security.auth import get_current_user
from app.database.firestore import AppointmentRepository

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/appointments", tags=["Appointments"])

_repo = AppointmentRepository()

_MOCK_APPOINTMENTS = [
    {"id": "a1", "patient_id": "demo123", "patient_name": "John Doe", "doctor_id": "d1", "doctor_name": "Dr. Sarah Wilson", "date": "2025-11-15", "time": "10:00 AM", "status": "Confirmed", "department": "Cardiology", "mode": "Hospital Visit", "notes": "Regular checkup"},
    {"id": "a2", "patient_id": "demo123", "patient_name": "John Doe", "doctor_id": "d2", "doctor_name": "Dr. James Chen", "date": "2025-11-16", "time": "02:30 PM", "status": "Scheduled", "department": "Endocrinology", "mode": "Online", "notes": "Follow-up"},
    {"id": "a3", "patient_id": "p4", "patient_name": "Emma Brown", "doctor_id": "d3", "doctor_name": "Dr. Emily Davis", "date": "2025-11-14", "time": "11:00 AM", "status": "Completed", "department": "General", "mode": "Hospital Visit", "notes": ""},
    {"id": "a4", "patient_id": "p3", "patient_name": "Michael Johnson", "doctor_id": "d3", "doctor_name": "Dr. Emily Davis", "date": "2025-11-10", "time": "09:00 AM", "status": "Missed", "department": "General", "mode": "Online", "notes": ""},
]


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
    try:
        filters = {}
        if patient_id:
            filters["patient_id"] = patient_id
        if doctor_id:
            filters["doctor_id"] = doctor_id
        if status:
            filters["status"] = status
        return _repo.list_all(filters=filters if filters else None, limit=limit, offset=offset)
    except RuntimeError:
        results = list(_MOCK_APPOINTMENTS)
        if patient_id:
            results = [a for a in results if a.get("patient_id") == patient_id]
        if doctor_id:
            results = [a for a in results if a.get("doctor_id") == doctor_id]
        if status:
            results = [a for a in results if a.get("status") == status]
        return results[offset : offset + limit]


@router.get("/{appointment_id}", response_model=AppointmentResponse)
async def get_appointment(appointment_id: str, user: dict = Depends(get_current_user)):
    """Get a single appointment by ID."""
    try:
        appt = _repo.get(appointment_id)
        if not appt:
            raise HTTPException(status_code=404, detail="Appointment not found")
        return appt
    except RuntimeError:
        for a in _MOCK_APPOINTMENTS:
            if a["id"] == appointment_id:
                return a
        raise HTTPException(status_code=404, detail="Appointment not found")


@router.post("", response_model=AppointmentResponse, status_code=201)
async def create_appointment(body: AppointmentCreate, user: dict = Depends(get_current_user)):
    """Create a new appointment."""
    try:
        data = body.model_dump()
        data["created_by"] = user.get("uid")
        return _repo.create(data)
    except RuntimeError:
        import uuid
        mock = {"id": str(uuid.uuid4())[:8], **body.model_dump(), "created_by": user.get("uid")}
        _MOCK_APPOINTMENTS.append(mock)
        return mock


@router.put("/{appointment_id}/status", response_model=AppointmentResponse)
async def update_appointment_status(
    appointment_id: str,
    body: AppointmentStatusUpdate,
    user: dict = Depends(get_current_user),
):
    """Update appointment status."""
    try:
        updated = _repo.update(appointment_id, {"status": body.status})
        if not updated:
            raise HTTPException(status_code=404, detail="Appointment not found")
        return updated
    except RuntimeError:
        for i, a in enumerate(_MOCK_APPOINTMENTS):
            if a["id"] == appointment_id:
                _MOCK_APPOINTMENTS[i]["status"] = body.status
                return _MOCK_APPOINTMENTS[i]
        raise HTTPException(status_code=404, detail="Appointment not found")


@router.put("/{appointment_id}", response_model=AppointmentResponse)
async def update_appointment(
    appointment_id: str,
    body: AppointmentCreate,
    user: dict = Depends(get_current_user),
):
    """Update an existing appointment."""
    try:
        updated = _repo.update(appointment_id, body.model_dump())
        if not updated:
            raise HTTPException(status_code=404, detail="Appointment not found")
        return updated
    except RuntimeError:
        for i, a in enumerate(_MOCK_APPOINTMENTS):
            if a["id"] == appointment_id:
                _MOCK_APPOINTMENTS[i] = {"id": appointment_id, **body.model_dump()}
                return _MOCK_APPOINTMENTS[i]
        raise HTTPException(status_code=404, detail="Appointment not found")


@router.delete("/{appointment_id}", status_code=204)
async def delete_appointment(appointment_id: str, user: dict = Depends(get_current_user)):
    """Soft-delete an appointment."""
    try:
        if not _repo.soft_delete(appointment_id):
            raise HTTPException(status_code=404, detail="Appointment not found")
    except RuntimeError:
        global _MOCK_APPOINTMENTS
        _MOCK_APPOINTMENTS = [a for a in _MOCK_APPOINTMENTS if a["id"] != appointment_id]
