from pydantic_settings import BaseSettings
from pydantic import Field
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = Field(
        default="mysql+pymysql://user:password@localhost:3306/hire_genius",
        description="MySQL database URL"
    )

    # Redis
    REDIS_URL: str = Field(
        default="redis://localhost:6379/0",
        description="Redis connection URL"
    )

    # AWS S3
    AWS_ACCESS_KEY_ID: str = Field(default="", description="AWS Access Key ID")
    AWS_SECRET_ACCESS_KEY: str = Field(default="", description="AWS Secret Access Key")
    AWS_REGION: str = Field(default="us-east-1", description="AWS Region")
    S3_BUCKET_NAME: str = Field(default="hire-genius-cvs", description="S3 Bucket Name")

    # Google OAuth2
    GOOGLE_CLIENT_ID: str = Field(default="", description="Google OAuth2 Client ID")
    GOOGLE_CLIENT_SECRET: str = Field(default="", description="Google OAuth2 Client Secret")
    GOOGLE_REDIRECT_URI: str = Field(
        default="http://localhost:8000/api/gdrive/auth-callback",
        description="Google OAuth2 Redirect URI"
    )

    # Anthropic
    ANTHROPIC_API_KEY: str = Field(default="", description="Anthropic API Key")

    # Google Drive Sync
    GDRIVE_SYNC_INTERVAL_MINUTES: int = Field(
        default=30,
        description="Interval in minutes for Google Drive sync"
    )

    # JWT
    SECRET_KEY: str = Field(
        default="change-me-in-production-use-a-long-random-string",
        description="JWT Secret Key"
    )
    ALGORITHM: str = Field(default="HS256", description="JWT Algorithm")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=60, description="JWT expiry in minutes")

    # CORS
    ALLOWED_ORIGINS: list[str] = Field(
        default=["http://localhost:5173", "http://localhost:3000"],
        description="Allowed CORS origins"
    )

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
    }


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
