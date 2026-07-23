"""User endpoints — /api/users"""
import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from app.schemas.user import UserCreate, UserResponse, UserUpdate
from app.security.auth import get_current_user, require_role
from app.database.firestore import UserRepository

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/users", tags=["Users"])

_repo = UserRepository()


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get the currently authenticated user's profile.
    Auto-creates a Firestore document if the user doesn't exist yet (first login sync).
    """
    uid = current_user.get("uid")
    try:
        user = _repo.get(uid)
        if user:
            return user
    except RuntimeError:
        pass

    # User not in Firestore yet — auto-create from JWT payload
    new_user = {
        "email": current_user.get("email", ""),
        "display_name": current_user.get("display_name", current_user.get("displayName", "User")),
        "role": current_user.get("role", "patient"),
        "phone": current_user.get("phone"),
    }
    try:
        return _repo.create(new_user, doc_id=uid)
    except RuntimeError:
        # Firestore not available — return token payload as best effort
        return {
            "id": uid,
            **new_user,
        }


@router.get("/{user_id}")
async def get_user(user_id: str, current_user: dict = Depends(get_current_user)):
    """Get a user by ID."""
    user = _repo.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("")
async def list_users(
    limit: int = Query(100, le=500),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user),
):
    """List users (admin-only in production)."""
    return _repo.list_all(limit=limit, offset=offset)


@router.post("", status_code=201)
async def create_user(user: UserCreate, current_user: dict = Depends(get_current_user)):
    """Create a new user record."""
    data = user.model_dump()
    # Use the authenticated user's uid as the document ID for consistency
    uid = current_user.get("uid")
    return _repo.create(data, doc_id=uid)


@router.put("/{user_id}")
async def update_user(user_id: str, body: UserUpdate, current_user: dict = Depends(get_current_user)):
    """Update an existing user."""
    updates = body.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update.")

    updated = _repo.update(user_id, updates)
    if not updated:
        raise HTTPException(status_code=404, detail="User not found")
    return updated
