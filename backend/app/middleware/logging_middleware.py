"""
Structured Logging Middleware
─────────────────────────────
Logs every request with timing, status, and request ID.
"""
import logging
import time
import uuid

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

logger = logging.getLogger("medassist.access")


class LoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware that logs each request with:
    - Request ID (X-Request-ID header)
    - Method, path, status code
    - Response time in milliseconds
    """

    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("X-Request-ID", str(uuid.uuid4())[:8])
        start = time.perf_counter()

        # Attach request ID to response
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id

        elapsed_ms = (time.perf_counter() - start) * 1000

        logger.info(
            "[%s] %s %s → %d (%.1fms)",
            request_id,
            request.method,
            request.url.path,
            response.status_code,
            elapsed_ms,
        )

        return response
