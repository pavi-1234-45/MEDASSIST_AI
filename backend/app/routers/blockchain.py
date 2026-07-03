"""Blockchain audit & consent endpoints — /api/blockchain"""
import logging

from fastapi import APIRouter, Depends, HTTPException

from app.schemas.blockchain import (
    AuditLogCreate,
    AuditLogResponse,
    ConsentCreate,
    ConsentResponse,
    ConsentVerify,
)
from app.security.auth import get_current_user
from app.services.blockchain import blockchain_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/blockchain", tags=["Blockchain"])


@router.post("/audit", response_model=AuditLogResponse, status_code=201)
async def create_audit_log(body: AuditLogCreate, user: dict = Depends(get_current_user)):
    """Log an auditable action to the blockchain."""
    try:
        entry = blockchain_service.create_audit_log(
            record_type=body.record_type,
            record_id=body.record_id,
            actor_id=body.actor_id,
            action=body.action,
            data_hash=body.data_hash,
            metadata=body.metadata,
        )
        return entry
    except Exception as exc:
        logger.error("Blockchain audit error: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to create audit log")


@router.get("/audit/{record_id}", response_model=list[AuditLogResponse])
async def get_audit_trail(record_id: str, user: dict = Depends(get_current_user)):
    """Get the full audit trail for a record."""
    entries = blockchain_service.get_audit_trail(record_id)
    if not entries:
        raise HTTPException(status_code=404, detail="No audit trail found for this record.")
    return entries


@router.post("/consent", response_model=ConsentResponse, status_code=201)
async def register_consent(body: ConsentCreate, user: dict = Depends(get_current_user)):
    """Register a patient consent on the blockchain."""
    try:
        consent = blockchain_service.create_consent(
            patient_id=body.patient_id,
            consent_type=body.consent_type,
            granted_to=body.granted_to,
            details=body.details,
        )
        return consent
    except Exception as exc:
        logger.error("Consent creation error: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to register consent")


@router.get("/consent/verify/{consent_hash}")
async def verify_consent(consent_hash: str, user: dict = Depends(get_current_user)):
    """Verify the integrity of a consent record."""
    result = blockchain_service.verify_consent(consent_hash)
    if result is None:
        raise HTTPException(status_code=404, detail="Consent hash not found.")
    return result
