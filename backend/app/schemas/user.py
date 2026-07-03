from pydantic import BaseModel, EmailStr, Field
from typing import Optional


class UserCreate(BaseModel):
    email: str = Field(..., description="User email address")
    display_name: str = Field(..., min_length=1, description="Display name")
    role: str = Field("patient", description="User role: patient | doctor | caregiver | admin")
    phone: Optional[str] = None

    model_config = {"json_schema_extra": {"example": {
        "email": "john@example.com",
        "display_name": "John Doe",
        "role": "patient",
        "phone": "+919876543210",
    }}}


class UserResponse(BaseModel):
    id: str
    email: str
    display_name: str
    role: str
    phone: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class UserUpdate(BaseModel):
    display_name: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None
