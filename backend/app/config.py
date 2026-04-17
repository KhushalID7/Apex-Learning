from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from .env file."""

    # Supabase
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""  # Public/Anon key
    SUPABASE_SERVICE_KEY: str = ""  # Service role key (bypasses RLS)

    # Upstash Redis
    UPSTASH_REDIS_URL: str = ""

    # Azure Blob Storage
    AZURE_STORAGE_CONNECTION_STRING: str = ""
    AZURE_CONTAINER_NAME: str = "project-files"

    # Razorpay
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""

    # Groq AI
    GROQ_API_KEY: str = ""

    # Resend Email
    RESEND_API_KEY: str = ""

    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:3000"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
