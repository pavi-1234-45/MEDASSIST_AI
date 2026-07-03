from pydantic import BaseModel, Field
from typing import Optional, Any


class AuditLogCreate(BaseModel):
    record_type: str = Field(..., description="Type: medical_record | consent | prescription | access_log")
    record_id: str = Field(..., description="ID of the source record")
    actor_id: str = Field(..., description="User ID who performed the action")
    action: str = Field(..., description="Action: create | read | update | delete | verify")
    data_hash: Optional[str] = None
    metadata: Optional[Any] = None

    model_config = {"json_schema_extra": {"example": {
        "record_type": "medical_record",
        "record_id": "mr-001",
        "actor_id": "doctor-123",
        "action": "create",
    }}}


class AuditLogResponse(BaseModel):
    id: str
    record_type: str
    record_id: str
    actor_id: str
    action: str
    data_hash: str
    previous_hash: str
    block_hash: str
    timestamp: str
    block_index: int
    verified: bool = True


class ConsentCreate(BaseModel):
    patient_id: str = Field(...)
    consent_type: str = Field(..., description="data_sharing | treatment | research")
    granted_to: str = Field(..., description="Entity receiving consent (doctor ID, org, etc.)")
    details: Optional[str] = None

    model_config = {"json_schema_extra": {"example": {
        "patient_id": "p1",
        "consent_type": "data_sharing",
        "granted_to": "d1",
        "details": "Sharing lab results for treatment.",
    }}}


class ConsentResponse(BaseModel):
    id: str
    patient_id: str
    consent_type: str
    granted_to: str
    details: Optional[str] = None
    consent_hash: str
    timestamp: str
    verified: bool = True


class ConsentVerify(BaseModel):
    consent_hash: str = Field(..., description="SHA-256 hash of the consent to verify")
