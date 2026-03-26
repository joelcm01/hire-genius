"""
Celery task for periodic Google Drive synchronization.
"""
import logging

from app.celery_app import celery_app
from app.config import settings

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, max_retries=3, default_retry_delay=60)
def sync_google_drive(self):
    """
    Sync all active Google Drive folders.
    Scheduled every GDRIVE_SYNC_INTERVAL_MINUTES minutes via Celery Beat.
    """
    from app.database import SessionLocal
    from app.models.gdrive import GDriveFolder
    from app.services.gdrive_service import GDriveService
    from app.services.cv_processor import CVProcessor
    from app.services.ai_service import AIService
    from app.services.s3_service import S3Service
    from app.services.sync_service import SyncService
    import os
    import json

    db = SessionLocal()
    try:
        token_path = os.getenv("GOOGLE_TOKEN_PATH", "/tmp/google_token.json")
        if not os.path.exists(token_path):
            logger.warning("Google Drive not connected - skipping sync")
            return {"skipped": True, "reason": "No Google credentials"}

        from google.oauth2.credentials import Credentials

        with open(token_path) as f:
            token_data = json.load(f)

        creds = Credentials(
            token=token_data.get("token"),
            refresh_token=token_data.get("refresh_token"),
            token_uri="https://oauth2.googleapis.com/token",
            client_id=settings.GOOGLE_CLIENT_ID,
            client_secret=settings.GOOGLE_CLIENT_SECRET,
        )

        gdrive_svc = GDriveService(credentials=creds)
        cv_processor = CVProcessor()
        ai_svc = AIService(api_key=settings.ANTHROPIC_API_KEY) if settings.ANTHROPIC_API_KEY else None
        s3_svc = S3Service(
            bucket_name=settings.S3_BUCKET_NAME,
            aws_access_key=settings.AWS_ACCESS_KEY_ID,
            aws_secret_key=settings.AWS_SECRET_ACCESS_KEY,
            region=settings.AWS_REGION,
        )

        sync_svc = SyncService(
            gdrive_service=gdrive_svc,
            cv_processor=cv_processor,
            ai_service=ai_svc,
            s3_service=s3_svc,
            db=db,
        )

        folders = db.query(GDriveFolder).filter_by(is_active=True).all()
        if not folders:
            logger.info("No active Google Drive folders configured")
            return {"folders_synced": 0}

        results = []
        for folder in folders:
            try:
                stats = sync_svc.sync_folder(folder.folder_id, folder.folder_name or folder.folder_id)
                results.append({"folder": folder.folder_name, "stats": stats})
                logger.info("Synced folder '%s': %s", folder.folder_name, stats)
            except Exception as exc:
                logger.error("Failed to sync folder '%s': %s", folder.folder_name, exc)
                results.append({"folder": folder.folder_name, "error": str(exc)})

        return {"folders_synced": len(folders), "results": results}

    except Exception as exc:
        logger.error("Sync task failed: %s", exc)
        raise self.retry(exc=exc)
    finally:
        db.close()
