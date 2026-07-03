"""Report endpoints — /api/reports"""
import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from app.schemas.report import ReportCreate, ReportResponse
from app.security.auth import get_current_user
from app.database.firestore import ReportRepository

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/reports", tags=["Reports"])

_repo = ReportRepository()
_MOCK_REPORTS: list[dict] = []


@router.get("", response_model=list[ReportResponse])
async def list_reports(
    patient_id: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    limit: int = Query(100, le=500),
    offset: int = Query(0, ge=0),
    user: dict = Depends(get_current_user),
):
    """List reports with optional filters."""
    try:
        filters = {}
        if patient_id:
            filters["patient_id"] = patient_id
        if type:
            filters["type"] = type
        return _repo.list_all(filters=filters if filters else None, limit=limit, offset=offset)
    except RuntimeError:
        results = _MOCK_REPORTS
        if patient_id:
            results = [r for r in results if r.get("patient_id") == patient_id]
        return results[offset : offset + limit]


@router.get("/{report_id}", response_model=ReportResponse)
async def get_report(report_id: str, user: dict = Depends(get_current_user)):
    """Get a single report by ID."""
    try:
        report = _repo.get(report_id)
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        return report
    except RuntimeError:
        for r in _MOCK_REPORTS:
            if r["id"] == report_id:
                return r
        raise HTTPException(status_code=404, detail="Report not found")


@router.post("", response_model=ReportResponse, status_code=201)
async def create_report(body: ReportCreate, user: dict = Depends(get_current_user)):
    """Generate a new report."""
    try:
        data = body.model_dump()
        data["generated_at"] = datetime.now(timezone.utc).isoformat()
        return _repo.create(data)
    except RuntimeError:
        import uuid
        mock = {
            "id": str(uuid.uuid4())[:8],
            **body.model_dump(),
            "generated_at": datetime.now(timezone.utc).isoformat(),
        }
        _MOCK_REPORTS.append(mock)
        return mock
