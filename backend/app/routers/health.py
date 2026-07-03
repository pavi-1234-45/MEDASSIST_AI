"""Health check endpoints — /api/health"""
import logging

from fastapi import APIRouter
from app.database.redis_cache import get_redis
from app.database.firestore import get_db

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/health", tags=["Health"])


@router.get("")
async def health_check():
    """Basic health check — always returns OK if the server is running."""
    status_detail = {"status": "healthy", "services": {}}

    # Redis check
    try:
        r = get_redis()
        if r and r.ping():
            status_detail["services"]["redis"] = "connected"
        else:
            status_detail["services"]["redis"] = "unavailable"
    except Exception:
        status_detail["services"]["redis"] = "unavailable"

    # Firestore check
    try:
        db = get_db()
        status_detail["services"]["firestore"] = "connected" if db else "unavailable"
    except Exception:
        status_detail["services"]["firestore"] = "unavailable"

    return status_detail


@router.get("/ready")
async def readiness_probe():
    """Kubernetes-style readiness probe."""
    return {"ready": True}
