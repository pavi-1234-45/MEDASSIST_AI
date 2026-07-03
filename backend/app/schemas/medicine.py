from pydantic import BaseModel, Field
from typing import Optional, List


class MedicineCreate(BaseModel):
    name: str = Field(..., min_length=1)
    dosage: str = Field(...)
    frequency: str = Field(..., description="e.g. 'Twice daily', 'Morning and Night'")
    patient_id: str = Field(...)
    reminder_times: List[str] = Field(default_factory=list, description="List of reminder times")
    notes: Optional[str] = None

    model_config = {"json_schema_extra": {"example": {
        "name": "Metformin",
        "dosage": "500mg",
        "frequency": "Twice daily",
        "patient_id": "p1",
        "reminder_times": ["08:00", "20:00"],
    }}}


class MedicineResponse(BaseModel):
    id: str
    name: str
    dosage: str
    frequency: str
    patient_id: str
    reminder_times: List[str] = []
    notes: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
