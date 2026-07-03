from pydantic import BaseModel, Field
from typing import Optional


class DoctorCreate(BaseModel):
    name: str = Field(..., min_length=1)
    specialization: str = Field(...)
    hospital: str = Field(...)
    appointments: int = Field(0, ge=0)
    emergencies: int = Field(0, ge=0)

    model_config = {"json_schema_extra": {"example": {
        "name": "Dr. Sarah Wilson",
        "specialization": "Cardiologist",
        "hospital": "City General",
        "appointments": 12,
        "emergencies": 2,
    }}}


class DoctorResponse(BaseModel):
    id: str
    name: str
    specialization: str
    hospital: str
    appointments: int = 0
    emergencies: int = 0
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
