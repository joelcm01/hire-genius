import json
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.gdrive import GDriveFolder, GDriveSyncLog
from app.schemas.gdrive import (
    GDriveFolderAdd,
    GDriveFolderResponse,
    SyncLogResponse,
    SyncTriggerResponse,
)
from app.services.gdrive_service import GDriveService
from app.dependencies import get_gdrive_service, get_sync_service

router = APIRouter(tags=["Google Drive"])

# In-memory token store (replace with DB/secrets manager in production)
_token_store: dict = {}


@router.get("/gdrive/auth-url")
def get_auth_url():
    """Return the Google OAuth2 authorization URL."""
    try:
        url = GDriveService.get_oauth_url(redirect_uri=settings.GOOGLE_REDIRECT_URI)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate OAuth URL: {exc}",
        )
    return {"auth_url": url}


@router.get("/gdrive/auth-callback")
def auth_callback(
    code: str = Query(..., description="OAuth authorization code from Google"),
    state: str = Query(None),
):
    """
    Handle the Google OAuth2 callback.
    Exchanges the code for tokens and stores them.
    """
    try:
        token_dict = GDriveService.exchange_code(
            code=code, redirect_uri=settings.GOOGLE_REDIRECT_URI
        )
        # Store in settings (persist to env/DB in production)
        _token_store["google_token"] = token_dict
        return {
            "message": "Google Drive authorized successfully",
            "scopes": token_dict.get("scopes", []),
        }
    except Exception as exc:
        raise HTTPException(
            status_code=400, detail=f"OAuth callback failed: {exc}"
        )


@router.post("/gdrive/sync", response_model=SyncTriggerResponse)
def trigger_sync(
    folder_id: str = Query(None, description="Specific folder ID to sync; syncs all if omitted"),
    db: Session = Depends(get_db),
    sync_service=Depends(get_sync_service),
):
    """
    Trigger a manual Google Drive sync.
    Syncs a specific folder if folder_id is provided, otherwise all active folders.
    """
    if folder_id:
        folder = db.query(GDriveFolder).filter_by(folder_id=folder_id).first()
        folder_name = folder.folder_name if folder else folder_id
        try:
            stats = sync_service.sync_folder(folder_id, folder_name)
        except Exception as exc:
            raise HTTPException(status_code=503, detail=f"Sync failed: {exc}")

        return SyncTriggerResponse(
            message=f"Sync completed for folder: {folder_name}",
            files_processed=stats["files_processed"],
            files_new=stats["files_new"],
            files_updated=stats["files_updated"],
            errors_count=len(stats["errors"]),
        )
    else:
        # Sync all active folders
        folders = db.query(GDriveFolder).filter_by(is_active=True).all()
        if not folders:
            raise HTTPException(
                status_code=404,
                detail="No active folders configured. Add folders via POST /api/gdrive/folders",
            )

        total_stats = {
            "files_processed": 0,
            "files_new": 0,
            "files_updated": 0,
            "errors": [],
        }
        for folder in folders:
            try:
                stats = sync_service.sync_folder(folder.folder_id, folder.folder_name)
                total_stats["files_processed"] += stats["files_processed"]
                total_stats["files_new"] += stats["files_new"]
                total_stats["files_updated"] += stats["files_updated"]
                total_stats["errors"].extend(stats.get("errors", []))
            except Exception as exc:
                total_stats["errors"].append(
                    {"folder": folder.folder_name, "error": str(exc)}
                )

        return SyncTriggerResponse(
            message=f"Sync completed for {len(folders)} folder(s)",
            files_processed=total_stats["files_processed"],
            files_new=total_stats["files_new"],
            files_updated=total_stats["files_updated"],
            errors_count=len(total_stats["errors"]),
        )


@router.get("/gdrive/sync-status", response_model=List[SyncLogResponse])
def get_sync_status(
    limit: int = Query(10, ge=1, le=100),
    folder_id: str = Query(None),
    db: Session = Depends(get_db),
):
    """Return the most recent sync log entries."""
    query = db.query(GDriveSyncLog)
    if folder_id:
        query = query.filter_by(folder_id=folder_id)
    logs = query.order_by(GDriveSyncLog.sync_date.desc()).limit(limit).all()
    return logs


@router.get("/gdrive/folders", response_model=List[GDriveFolderResponse])
def list_folders(db: Session = Depends(get_db)):
    """List all configured Google Drive folders."""
    return db.query(GDriveFolder).all()


@router.post("/gdrive/folders", response_model=GDriveFolderResponse, status_code=201)
def add_folder(payload: GDriveFolderAdd, db: Session = Depends(get_db)):
    """Add a new Google Drive folder to monitor."""
    existing = db.query(GDriveFolder).filter_by(folder_id=payload.folder_id).first()
    if existing:
        # Re-activate if it was disabled
        existing.is_active = True
        existing.folder_name = payload.folder_name
        db.commit()
        db.refresh(existing)
        return existing

    folder = GDriveFolder(
        folder_id=payload.folder_id,
        folder_name=payload.folder_name,
        is_active=True,
    )
    db.add(folder)
    db.commit()
    db.refresh(folder)
    return folder


@router.delete("/gdrive/folders/{folder_id}", response_model=dict)
def remove_folder(folder_id: str, db: Session = Depends(get_db)):
    """Stop monitoring a Google Drive folder (soft delete)."""
    folder = db.query(GDriveFolder).filter_by(folder_id=folder_id).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")

    folder.is_active = False
    db.commit()
    return {"message": f"Folder '{folder.folder_name}' deactivated", "folder_id": folder_id}
