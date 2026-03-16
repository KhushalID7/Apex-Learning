from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.supabase_client import supabase
from typing import Callable

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """
    Decode the Supabase JWT and fetch the user's profile.
    Returns a dict with: id, email, full_name, role.
    """
    token = credentials.credentials

    try:
        # Verify the token with Supabase — this returns the auth user
        user_response = supabase.auth.get_user(token)
        user = user_response.user

        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
            )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    # Fetch the profile from the profiles table
    profile_response = (
        supabase.table("profiles")
        .select("*")
        .eq("id", user.id)
        .single()
        .execute()
    )

    if not profile_response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User profile not found",
        )

    profile = profile_response.data
    return {
        "id": user.id,
        "email": user.email,
        "full_name": profile["full_name"],
        "role": profile["role"],
        "created_at": profile.get("created_at"),
    }


def require_role(*allowed_roles: str) -> Callable:
    """
    Dependency factory that restricts access to specific roles.
    Usage: Depends(require_role("teacher", "master"))
    """

    async def role_checker(
        current_user: dict = Depends(get_current_user),
    ) -> dict:
        if current_user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role: {', '.join(allowed_roles)}",
            )
        return current_user

    return role_checker
