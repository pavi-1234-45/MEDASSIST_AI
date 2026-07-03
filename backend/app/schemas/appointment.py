from pydantic import BaseModel, Field
from typing import Optional


class AppointmentCreate(BaseModel):
    patient_id: str = Field(...)
    patient_name: str = Field(...)
    doctor_id: str = Field(...)
    doctor_name: str = Field(...)
    date: str = Field(..., description="ISO date string YYYY-MM-DD")
    time: str = Field(..., description="Time string e.g. '10:00 AM'")
    status: str = Field("Scheduled", description="Scheduled | Confirmed | Completed | Missed | Cancelled")

    model_config = {"json_schema_extra": {"example": {
        "patient_id": "p1",
        "patient_name": "John Doe",
        "doctor_id": "d1",
        "doctor_name": "Dr. Sarah Wilson",
        "date": "2023-11-15",
        "time": "10:00 AM",
        "status": "Scheduled",
    }}}


class AppointmentResponse(BaseModel):
    id: str
    patient_id: str
    patient_name: str
    doctor_id: str
    doctor_name: str
    date: str
    time: str
    status: str = "Scheduled"
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class AppointmentStatusUpdate(BaseModel):
    status: str = Field(..., description="New status: Confirmed | Completed | Missed | Cancelled")
