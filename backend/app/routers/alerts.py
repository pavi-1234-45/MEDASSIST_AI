"""Alert endpoints — /api/alerts"""
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from app.schemas.alert import AlertCreate, AlertResponse, AlertStatusUpdate
from app.security.auth import get_current_user
from app.database.firestore import AlertRepository

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/alerts", tags=["Alerts"])

_repo = AlertRepository()


@router.get("", response_model=list[AlertResponse])
async def list_alerts(
    status: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    limit: int = Query(100, le=500),
    offset: int = Query(0, ge=0),
    user: dict = Depends(get_current_user),
):
    """List alerts with optional filters."""
    filters = {}
    if status:
        filters["status"] = status
    if type:
        filters["type"] = type
    return _repo.list_all(filters=filters if filters else None, limit=limit, offset=offset)


@router.post("", response_model=AlertResponse, status_code=201)
async def create_alert(body: AlertCreate, user: dict = Depends(get_current_user)):
    """Create a new alert (e.g., emergency trigger)."""
    data = body.model_dump()
    data["user_id"] = user.get("uid")
    return _repo.create(data)


@router.put("/{alert_id}/status", response_model=AlertResponse)
async def update_alert_status(
    alert_id: str,
    body: AlertStatusUpdate,
    user: dict = Depends(get_current_user),
):
    """Update alert status (read, Resolved)."""
    updated = _repo.update(alert_id, {"status": body.status})
    if not updated:
        raise HTTPException(status_code=404, detail="Alert not found")
    return updated
