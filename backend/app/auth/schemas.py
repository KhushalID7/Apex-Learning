from pydantic import BaseModel, EmailStr
from typing import Optional


class RegisterRequest(BaseModel):
    """Request body for user registration."""
    email: EmailStr
    password: str
    full_name: str
    role: str = "student"  # "student" | "teacher"


class LoginRequest(BaseModel):
    """Request body for user login."""
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """Response model for authenticated user profile."""
    id: str
    email: str
    full_name: str
    role: str
    created_at: Optional[str] = None
