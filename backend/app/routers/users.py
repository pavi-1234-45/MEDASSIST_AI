from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from app.database.firestore import UserRepository
from app.security.auth import get_current_user, require_role

router = APIRouter(prefix="/users", tags=["Users"])
user_repo = UserRepository()

class UserCreate(BaseModel):
    email: str
    displayName: str
    role: str

@router.get("/")
def get_users(current_user: dict = Depends(require_role("admin"))):
    # In a real scenario, implement list users
    return {"message": "List of users"}

@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    user = user_repo.get(current_user.get("uid"))
    if not user:
        # Return the token payload if user not in firestore yet
        return current_user
    return user

@router.post("/")
def create_user(user: UserCreate, current_user: dict = Depends(require_role("admin"))):
    created = user_repo.create(user.model_dump())
    return created
