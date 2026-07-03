from pydantic import BaseModel, Field
from typing import Optional, Any


class ReportCreate(BaseModel):
    patient_id: str = Field(...)
    type: str = Field(..., description="Health Summary | Lab Results | Adherence Report")
    data: Any = Field(default=None, description="Arbitrary report payload")

    model_config = {"json_schema_extra": {"example": {
        "patient_id": "p1",
        "type": "Health Summary",
        "data": {"blood_sugar": "120 mg/dL", "bp": "130/85"},
    }}}


class ReportResponse(BaseModel):
    id: str
    patient_id: str
    type: str
    data: Any = None
    generated_at: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
