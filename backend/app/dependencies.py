import json
import os
from typing import Generator

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.config import settings
from app.database import SessionLocal


def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _load_google_credentials():
    """Load Google OAuth2 credentials from token file."""
    try:
        from google.oauth2.credentials import Credentials

        token_path = os.getenv("GOOGLE_TOKEN_PATH", "/tmp/google_token.json")
        if not os.path.exists(token_path):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Google Drive not connected. Complete OAuth flow at GET /api/gdrive/auth-url",
            )
        with open(token_path) as f:
            token_data = json.load(f)

        return Credentials(
            token=token_data.get("token"),
            refresh_token=token_data.get("refresh_token"),
            token_uri="https://oauth2.googleapis.com/token",
            client_id=settings.GOOGLE_CLIENT_ID,
            client_secret=settings.GOOGLE_CLIENT_SECRET,
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load Google credentials: {exc}",
        )


def get_gdrive_service():
    """Dependency that provides a GDriveService instance."""
    from app.services.gdrive_service import GDriveService

    creds = _load_google_credentials()
    return GDriveService(credentials=creds)


def get_ai_service():
    """Dependency that provides an AIService instance."""
    from app.services.ai_service import AIService

    if not settings.ANTHROPIC_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="ANTHROPIC_API_KEY is not configured",
        )
    return AIService(api_key=settings.ANTHROPIC_API_KEY)


def get_s3_service():
    """Dependency that provides an S3Service instance."""
    from app.services.s3_service import S3Service

    return S3Service(
        bucket_name=settings.S3_BUCKET_NAME,
        aws_access_key=settings.AWS_ACCESS_KEY_ID,
        aws_secret_key=settings.AWS_SECRET_ACCESS_KEY,
        region=settings.AWS_REGION,
    )


def get_calendar_service():
    """Dependency that provides a CalendarService instance."""
    from app.services.calendar_service import CalendarService

    creds = _load_google_credentials()
    return CalendarService(credentials=creds)


def get_cv_processor():
    """Dependency that provides a CVProcessor instance."""
    from app.services.cv_processor import CVProcessor

    return CVProcessor()


def get_sync_service(
    db: Session = Depends(get_db),
):
    """Dependency that provides a SyncService instance with all sub-services."""
    from app.services.sync_service import SyncService
    from app.services.gdrive_service import GDriveService
    from app.services.cv_processor import CVProcessor
    from app.services.ai_service import AIService
    from app.services.s3_service import S3Service

    try:
        creds = _load_google_credentials()
        gdrive_svc = GDriveService(credentials=creds)
    except HTTPException:
        raise

    cv_processor = CVProcessor()

    ai_svc = None
    if settings.ANTHROPIC_API_KEY:
        ai_svc = AIService(api_key=settings.ANTHROPIC_API_KEY)

    s3_svc = S3Service(
        bucket_name=settings.S3_BUCKET_NAME,
        aws_access_key=settings.AWS_ACCESS_KEY_ID,
        aws_secret_key=settings.AWS_SECRET_ACCESS_KEY,
        region=settings.AWS_REGION,
    )

    return SyncService(
        gdrive_service=gdrive_svc,
        cv_processor=cv_processor,
        ai_service=ai_svc,
        s3_service=s3_svc,
        db=db,
    )
