import json
import time
import logging
import functools
from typing import Optional, Callable, Any

try:
    import redis
except ImportError:
    redis = None  # Not available in serverless (Vercel)

from app.config.settings import settings

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────────────
# Redis client singleton
# ──────────────────────────────────────────────────────────────────────
_redis_client: Optional[Any] = None
_redis_warned: bool = False


def get_redis() -> Optional["redis.Redis"]:
    """Return a Redis client (lazy singleton). Returns None if unavailable."""
    global _redis_client, _redis_warned
    if redis is None:
        return None
    if _redis_client is not None:
        return _redis_client

    try:
        _redis_client = redis.Redis.from_url(
            settings.REDIS_URL, decode_responses=True
        )
        _redis_client.ping()
        logger.info("Redis connected at %s", settings.REDIS_URL)
    except Exception as exc:
        if not _redis_warned:
            logger.warning("Redis unavailable (%s). Caching disabled.", exc)
            _redis_warned = True
        _redis_client = None

    return _redis_client


# ──────────────────────────────────────────────────────────────────────
# Basic cache operations
# ──────────────────────────────────────────────────────────────────────
def get_cache(key: str) -> Optional[str]:
    """Get a value from Redis cache. Returns None on miss or if Redis is down."""
    r = get_redis()
    if r:
        try:
            return r.get(key)
        except Exception:
            return None
    return None


def set_cache(key: str, value: str, expire: int = 3600) -> None:
    """Set a cache entry with expiration (default 1 hour)."""
    r = get_redis()
    if r:
        try:
            r.setex(key, expire, value)
        except Exception:
            pass


def delete_cache(key: str) -> None:
    """Delete a cache entry."""
    r = get_redis()
    if r:
        try:
            r.delete(key)
        except Exception:
            pass


def get_cache_json(key: str) -> Optional[Any]:
    """Get a JSON-deserialized value from cache."""
    raw = get_cache(key)
    if raw:
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            return None
    return None


def set_cache_json(key: str, value: Any, expire: int = 3600) -> None:
    """Serialize value as JSON and store in cache."""
    try:
        set_cache(key, json.dumps(value, default=str), expire)
    except Exception:
        pass


# ──────────────────────────────────────────────────────────────────────
# Cache decorator for endpoint / function results
# ──────────────────────────────────────────────────────────────────────
def cache_response(prefix: str, expire: int = 300):
    """
    Decorator that caches the JSON-serializable return value of an
    async or sync function.  The cache key is built from `prefix`
    plus all positional and keyword arguments.

    Usage:
        @cache_response("openfda_label", expire=600)
        async def fetch_label(drug_name: str): ...
    """

    def decorator(func: Callable):
        @functools.wraps(func)
        async def async_wrapper(*args, **kwargs):
            cache_key = f"{prefix}:{_build_key(args, kwargs)}"
            cached = get_cache_json(cache_key)
            if cached is not None:
                return cached
            result = await func(*args, **kwargs)
            if result is not None:
                set_cache_json(cache_key, result, expire)
            return result

        @functools.wraps(func)
        def sync_wrapper(*args, **kwargs):
            cache_key = f"{prefix}:{_build_key(args, kwargs)}"
            cached = get_cache_json(cache_key)
            if cached is not None:
                return cached
            result = func(*args, **kwargs)
            if result is not None:
                set_cache_json(cache_key, result, expire)
            return result

        import asyncio

        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper

    return decorator


def _build_key(args, kwargs) -> str:
    """Build a deterministic string key from function arguments."""
    parts = [str(a) for a in args]
    parts.extend(f"{k}={v}" for k, v in sorted(kwargs.items()))
    return ":".join(parts) if parts else "default"


# ──────────────────────────────────────────────────────────────────────
# Rate limiting (sliding window via Redis)
# ──────────────────────────────────────────────────────────────────────
def check_rate_limit(
    client_id: str, max_requests: Optional[int] = None, window_seconds: int = 60
) -> bool:
    """
    Sliding-window rate limiter backed by Redis sorted sets.
    Returns True if the request is **allowed**, False if rate-limited.
    If Redis is unavailable, always allows (fail-open).
    """
    r = get_redis()
    if not r:
        return True  # fail-open

    if max_requests is None:
        max_requests = settings.RATE_LIMIT_PER_MINUTE

    key = f"rate_limit:{client_id}"
    now = time.time()
    window_start = now - window_seconds

    pipe = r.pipeline()
    try:
        pipe.zremrangebyscore(key, 0, window_start)
        pipe.zadd(key, {str(now): now})
        pipe.zcard(key)
        pipe.expire(key, window_seconds + 1)
        results = pipe.execute()
        current_count = results[2]
        return current_count <= max_requests
    except Exception:
        return True  # fail-open on error
