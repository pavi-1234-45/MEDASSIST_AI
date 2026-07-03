from pydantic import BaseModel, Field
from typing import Optional


class AlertCreate(BaseModel):
    type: str = Field(..., description="Emergency | Missed Medicine | Warning")
    patient_name: str = Field(...)
    symptom: str = Field(...)
    status: str = Field("unread", description="unread | read | Resolved")
    time: Optional[str] = None

    model_config = {"json_schema_extra": {"example": {
        "type": "Emergency",
        "patient_name": "Emma Brown",
        "symptom": "Severe chest pain",
        "status": "unread",
    }}}


class AlertResponse(BaseModel):
    id: str
    type: str
    patient_name: str
    symptom: str
    status: str = "unread"
    time: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class AlertStatusUpdate(BaseModel):
    status: str = Field(..., description="New status: read | Resolved")
