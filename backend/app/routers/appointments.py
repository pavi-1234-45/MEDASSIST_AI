from fastapi import APIRouter, Depends
from typing import List
from pydantic import BaseModel
from app.database.firestore import BaseRepository
from app.security.auth import get_current_user

router = APIRouter(prefix="/appointments", tags=["Appointments"])

class AppointmentRepository(BaseRepository):
    def __init__(self):
        super().__init__("appointments")

appointment_repo = AppointmentRepository()

class AppointmentCreate(BaseModel):
    doctor_id: str
    patient_id: str
    date: str
    notes: str

@router.get("/")
def get_appointments(current_user: dict = Depends(get_current_user)):
    return {"message": "List of appointments"}

@router.post("/")
def create_appointment(appt: AppointmentCreate, current_user: dict = Depends(get_current_user)):
    data = appt.model_dump()
    data["created_by"] = current_user.get("uid")
    created = appointment_repo.create(data)
    return created
