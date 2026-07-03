from pydantic import BaseModel, Field
from typing import Optional


class PatientCreate(BaseModel):
    name: str = Field(..., min_length=1)
    age: int = Field(..., ge=0, le=150)
    gender: str = Field(..., description="Male | Female | Other")
    phone: str = Field(...)
    condition: str = Field(...)
    caregiver: Optional[str] = None
    caregiver_id: Optional[str] = None
    adherence: int = Field(0, ge=0, le=100, description="Medicine adherence %")
    status: str = Field("Active", description="Active | Stable | Needs Attention | Critical")

    model_config = {"json_schema_extra": {"example": {
        "name": "John Doe",
        "age": 45,
        "gender": "Male",
        "phone": "1234567890",
        "condition": "Diabetes",
        "caregiver": "Jane Doe",
        "adherence": 85,
        "status": "Active",
    }}}


class PatientResponse(BaseModel):
    id: str
    name: str
    age: int
    gender: str
    phone: str
    condition: str
    caregiver: Optional[str] = None
    caregiver_id: Optional[str] = None
    adherence: int = 0
    last_alert: Optional[str] = None
    status: str = "Active"
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class PatientUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    condition: Optional[str] = None
    caregiver: Optional[str] = None
    caregiver_id: Optional[str] = None
    adherence: Optional[int] = None
    status: Optional[str] = None
    last_alert: Optional[str] = None
