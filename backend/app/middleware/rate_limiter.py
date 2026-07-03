"""
Rate Limiting Middleware
────────────────────────
Redis-backed sliding window rate limiter.
Returns 429 Too Many Requests with Retry-After header.
"""
import logging

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from app.database.redis_cache import check_rate_limit
from app.config.settings import settings

logger = logging.getLogger(__name__)

# Paths that are exempt from rate limiting
EXEMPT_PATHS = {"/api/health", "/api/health/ready", "/docs", "/openapi.json", "/redoc"}


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Middleware that enforces per-IP rate limiting using Redis.
    Falls back to allow-all if Redis is unavailable.
    """

    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for health checks and docs
        if request.url.path in EXEMPT_PATHS:
            return await call_next(request)

        # Use client IP as the rate limit key
        client_ip = request.client.host if request.client else "unknown"

        # Check if user has auth token — use UID if available
        auth_header = request.headers.get("authorization", "")
        rate_key = client_ip
        if auth_header.startswith("Bearer ") and auth_header != "Bearer mock-token":
            # Use a portion of the token as key to rate limit per-user
            rate_key = f"user:{auth_header[-16:]}"

        allowed = check_rate_limit(
            client_id=rate_key,
            max_requests=settings.RATE_LIMIT_PER_MINUTE,
            window_seconds=60,
        )

        if not allowed:
            logger.warning("Rate limit exceeded for %s on %s", rate_key, request.url.path)
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Please try again later."},
                headers={"Retry-After": "60"},
            )

        return await call_next(request)
