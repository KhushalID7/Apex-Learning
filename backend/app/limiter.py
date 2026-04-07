from fastapi import Request
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.config import get_settings

settings = get_settings()


def get_client_ip(request: Request) -> str:
    """Prefer proxy-forwarded client IP while safely falling back to direct remote address."""
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        client_ip = forwarded_for.split(",")[0].strip()
        if client_ip:
            return client_ip

    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip.strip()

    return get_remote_address(request) or "unknown"


limiter = Limiter(
    key_func=get_client_ip,
    default_limits=["120/minute"],
    storage_uri=settings.UPSTASH_REDIS_URL or "memory://",
)


def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    """Return a consistent 429 payload for throttled requests."""
    return JSONResponse(
        status_code=429,
        content={
            "detail": "Too Many Requests",
            "error": "rate_limit_exceeded",
        },
    )
