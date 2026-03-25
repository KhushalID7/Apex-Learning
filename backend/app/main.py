from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.auth.router import router as auth_router
from app.courses.router import router as courses_router
from app.courses.stats_router import router as stats_router
from app.lectures.router import router as lectures_router

app = FastAPI(
    title="AWT Learning Platform",
    version="0.1.0",
    description="Backend API for the AWT Learning Platform",
)

# ---------- CORS ----------
# Allow the Next.js frontend during local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Routers ----------
app.include_router(auth_router)
app.include_router(stats_router)
app.include_router(courses_router)
app.include_router(lectures_router)

# ---------- Health check ----------
@app.get("/health")
async def health_check():
    """Simple health-check endpoint to verify the server is running."""
    return {"status": "ok"}
