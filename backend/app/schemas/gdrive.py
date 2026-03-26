from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel


class GDriveFolderAdd(BaseModel):
    folder_id: str
    folder_name: str


class GDriveFolderResponse(BaseModel):
    folder_id: str
    folder_name: str
    is_active: bool
    last_sync_date: Optional[datetime] = None
    added_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class GDriveSyncStatus(BaseModel):
    folder_id: str
    folder_name: str
    last_sync_date: Optional[datetime] = None
    is_active: bool


class SyncLogResponse(BaseModel):
    sync_id: int
    folder_id: str
    folder_name: Optional[str] = None
    sync_date: Optional[datetime] = None
    files_processed: int
    files_new: int
    files_updated: int
    errors_count: int
    error_details: Optional[List[Any]] = []
    duration_seconds: Optional[float] = None

    model_config = {"from_attributes": True}


class SyncTriggerResponse(BaseModel):
    message: str
    files_processed: int
    files_new: int
    files_updated: int
    errors_count: int
    duration_seconds: Optional[float] = None
