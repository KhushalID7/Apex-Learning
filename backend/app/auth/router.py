from fastapi import APIRouter, HTTPException, status, Depends, Request
from app.auth.schemas import RegisterRequest, LoginRequest, UserResponse
from app.auth.dependencies import get_current_user
from app.limiter import limiter
from app.supabase_client import supabase

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest):
    """Register a new user via Supabase Auth and create a profile row."""

    # Validate role
    if payload.role not in ("student", "teacher"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Role must be 'student' or 'teacher'",
        )

    try:
        # Sign up with Supabase Auth
        auth_response = supabase.auth.sign_up(
            {
                "email": payload.email,
                "password": payload.password,
            }
        )

        user = auth_response.user
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Registration failed — email may already be in use",
            )

        # Insert profile row
        supabase.table("profiles").insert(
            {
                "id": user.id,
                "full_name": payload.full_name,
                "role": payload.role,
            }
        ).execute()

        return {
            "message": "Registration successful",
            "user_id": user.id,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post("/login")
@limiter.limit("5/minute")
async def login(request: Request, payload: LoginRequest):
    """Sign in with email + password and return session tokens."""

    try:
        auth_response = supabase.auth.sign_in_with_password(
            {
                "email": payload.email,
                "password": payload.password,
            }
        )

        session = auth_response.session
        if session is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        return {
            "access_token": session.access_token,
            "refresh_token": session.refresh_token,
            "token_type": "bearer",
            "expires_in": session.expires_in,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Return the authenticated user's profile."""
    return current_user
