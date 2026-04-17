from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.config import get_settings

from app.limiter import limiter, rate_limit_exceeded_handler
from app.auth.router import router as auth_router
from app.courses.router import router as courses_router
from app.courses.stats_router import router as stats_router
from app.lectures.router import router as lectures_router
from app.quizzes.router import router as quizzes_router
from app.doubts.router import router as doubts_router

settings = get_settings()

app = FastAPI(
    title="AWT Learning Platform",
    version="0.1.0",
    description="Backend API for the AWT Learning Platform",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# ---------- CORS ----------
# Use origins from settings (comma-separated string converted to list)
origins = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Routers ----------
app.include_router(auth_router)
app.include_router(stats_router)
app.include_router(courses_router)
app.include_router(lectures_router)
app.include_router(quizzes_router)
app.include_router(doubts_router)

# ---------- Health check ----------
@app.get("/health")
async def health_check():
    """Simple health-check endpoint to verify the server is running."""
    return {"status": "ok"}


@app.get("/", response_class=JSONResponse)
async def root():
    """Root endpoint – returns a friendly message or redirects to /health."""
    return {"message": "Welcome to the AWT Learning Platform API. Use /health for a quick status check."}