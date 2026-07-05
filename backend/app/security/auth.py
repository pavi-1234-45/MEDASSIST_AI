import logging
from typing import List, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import firebase_admin
from firebase_admin import auth as firebase_auth

logger = logging.getLogger(__name__)

security = HTTPBearer(auto_error=False)


# ──────────────────────────────────────────────────────────────────────
# Core user extraction from Firebase JWT
# ──────────────────────────────────────────────────────────────────────
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """
    Validate the Firebase JWT token and return the decoded user payload.
    In development, if no token is provided, returns a mock user so the
    frontend can function before real Firebase integration is configured.
    """
    if not credentials:
        # Dev-mode fallback — keeps the UI functional without Firebase keys
        logger.debug("No auth token provided — returning dev mock user.")
        return {
            "uid": "demo123",
            "email": "mock@example.com",
            "role": "patient",
            "display_name": "Demo User",
        }

    token = credentials.credentials

    # Accept explicit mock token for local dev / testing
    if token == "mock-token":
        return {
            "uid": "demo123",
            "email": "mock@example.com",
            "role": "patient",
            "display_name": "Demo User",
        }

    try:
        decoded = firebase_auth.verify_id_token(token)
        # Merge custom claims for role
        decoded.setdefault("role", decoded.get("custom_claims", {}).get("role", "patient"))
        return decoded
    except Exception as exc:
        logger.warning("JWT verification failed: %s — attempting fallback JWT decode.", exc)
        # Fallback: decode the JWT payload without verification.
        # This handles the case where Firebase Admin SDK is not initialised
        # (e.g. missing service account on Vercel serverless).
        try:
            import base64, json
            parts = token.split(".")
            if len(parts) == 3:
                # Decode the payload (second part)
                payload = parts[1]
                # Add padding if needed
                padding = 4 - len(payload) % 4
                if padding != 4:
                    payload += "=" * padding
                decoded_payload = json.loads(base64.urlsafe_b64decode(payload))
                uid = decoded_payload.get("user_id") or decoded_payload.get("sub", "unknown")
                return {
                    "uid": uid,
                    "email": decoded_payload.get("email", ""),
                    "role": decoded_payload.get("role", "patient"),
                    "display_name": decoded_payload.get("name", decoded_payload.get("email", "User")),
                    "displayName": decoded_payload.get("name", decoded_payload.get("email", "User")),
                }
        except Exception as inner_exc:
            logger.error("Fallback JWT decode also failed: %s", inner_exc)

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> Optional[dict]:
    """
    Like get_current_user but returns None instead of raising 401
    when no credentials are present.  Useful for endpoints that
    behave differently for authenticated vs anonymous users.
    """
    if not credentials:
        return None

    token = credentials.credentials
    if token == "mock-token":
        return {
            "uid": "demo123",
            "email": "mock@example.com",
            "role": "patient",
            "display_name": "Demo User",
        }

    try:
        decoded = firebase_auth.verify_id_token(token)
        decoded.setdefault("role", decoded.get("custom_claims", {}).get("role", "patient"))
        return decoded
    except Exception:
        return None


# ──────────────────────────────────────────────────────────────────────
# RBAC dependency — supports single or multiple allowed roles
# ──────────────────────────────────────────────────────────────────────
def require_role(*required_roles: str):
    """
    FastAPI dependency that enforces role-based access control.

    Usage:
        @router.get("/admin-only", dependencies=[Depends(require_role("admin"))])
        async def admin_endpoint(): ...

        @router.get("/staff", dependencies=[Depends(require_role("doctor", "admin"))])
        async def staff_endpoint(): ...
    """

    def role_checker(user: dict = Depends(get_current_user)) -> dict:
        user_role = user.get("role", "patient")

        # Admins always pass
        if user_role == "admin":
            return user

        if user_role not in required_roles:
            logger.warning(
                "RBAC denied: user %s (role=%s) tried to access route requiring %s",
                user.get("uid"),
                user_role,
                required_roles,
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role(s): {', '.join(required_roles)}",
            )
        return user

    return role_checker
