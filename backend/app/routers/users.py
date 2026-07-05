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

_MOCK_USERS = [
    {"id": "demo123", "email": "mock@example.com", "display_name": "Demo User", "role": "patient", "phone": "+919876543210"},
]


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get the currently authenticated user's profile."""
    try:
        user = _repo.get(current_user.get("uid"))
        if not user:
            # Return the token payload if user not in Firestore yet
            return current_user
        return user
    except RuntimeError:
        # Firestore unavailable — return token payload
        return current_user


@router.get("/{user_id}")
async def get_user(user_id: str, current_user: dict = Depends(get_current_user)):
    """Get a user by ID."""
    try:
        user = _repo.get(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user
    except RuntimeError:
        # Firestore unavailable — check mock data
        for u in _MOCK_USERS:
            if u["id"] == user_id:
                return u
        # If the requested user matches the current user, return their info
        if current_user.get("uid") == user_id:
            return {
                "id": user_id,
                "email": current_user.get("email", ""),
                "display_name": current_user.get("display_name", current_user.get("displayName", "User")),
                "role": current_user.get("role", "patient"),
                "phone": current_user.get("phone"),
            }
        raise HTTPException(status_code=404, detail="User not found")


@router.get("")
async def list_users(
    limit: int = Query(100, le=500),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user),
):
    """List users (admin-only in production, but open for demo)."""
    try:
        return _repo.list_all(limit=limit, offset=offset)
    except RuntimeError:
        return _MOCK_USERS[offset : offset + limit]


@router.post("", status_code=201)
async def create_user(user: UserCreate, current_user: dict = Depends(get_current_user)):
    """Create a new user record."""
    try:
        return _repo.create(user.model_dump())
    except RuntimeError:
        import uuid
        mock = {"id": str(uuid.uuid4())[:8], **user.model_dump()}
        _MOCK_USERS.append(mock)
        return mock


@router.put("/{user_id}")
async def update_user(user_id: str, body: UserUpdate, current_user: dict = Depends(get_current_user)):
    """Update an existing user."""
    updates = body.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update.")

    try:
        updated = _repo.update(user_id, updates)
        if not updated:
            raise HTTPException(status_code=404, detail="User not found")
        return updated
    except RuntimeError:
        for i, u in enumerate(_MOCK_USERS):
            if u["id"] == user_id:
                _MOCK_USERS[i] = {**u, **updates}
                return _MOCK_USERS[i]
        raise HTTPException(status_code=404, detail="User not found")
