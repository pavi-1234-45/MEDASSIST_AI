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

_MOCK_ALERTS = [
    {"id": "al1", "type": "Emergency", "patient_name": "Emma Brown", "symptom": "Severe chest pain", "status": "unread", "time": "5 mins ago"},
    {"id": "al2", "type": "Missed Medicine", "patient_name": "Alice Smith", "symptom": "Lisinopril 10mg", "status": "unread", "time": "2 hours ago"},
    {"id": "al3", "type": "Emergency", "patient_name": "John Doe", "symptom": "Fainted", "status": "Resolved", "time": "1 day ago"},
]


@router.get("", response_model=list[AlertResponse])
async def list_alerts(
    status: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    limit: int = Query(100, le=500),
    offset: int = Query(0, ge=0),
    user: dict = Depends(get_current_user),
):
    """List alerts with optional filters."""
    try:
        filters = {}
        if status:
            filters["status"] = status
        if type:
            filters["type"] = type
        return _repo.list_all(filters=filters if filters else None, limit=limit, offset=offset)
    except RuntimeError:
        results = _MOCK_ALERTS
        if status:
            results = [a for a in results if a["status"] == status]
        if type:
            results = [a for a in results if a["type"] == type]
        return results[offset : offset + limit]


@router.post("", response_model=AlertResponse, status_code=201)
async def create_alert(body: AlertCreate, user: dict = Depends(get_current_user)):
    """Create a new alert (e.g., emergency trigger)."""
    try:
        data = body.model_dump()
        return _repo.create(data)
    except RuntimeError:
        import uuid
        mock = {"id": str(uuid.uuid4())[:8], **body.model_dump()}
        _MOCK_ALERTS.append(mock)
        return mock


@router.put("/{alert_id}/status", response_model=AlertResponse)
async def update_alert_status(
    alert_id: str,
    body: AlertStatusUpdate,
    user: dict = Depends(get_current_user),
):
    """Update alert status (read, Resolved)."""
    try:
        updated = _repo.update(alert_id, {"status": body.status})
        if not updated:
            raise HTTPException(status_code=404, detail="Alert not found")
        return updated
    except RuntimeError:
        for i, a in enumerate(_MOCK_ALERTS):
            if a["id"] == alert_id:
                _MOCK_ALERTS[i]["status"] = body.status
                return _MOCK_ALERTS[i]
        raise HTTPException(status_code=404, detail="Alert not found")
