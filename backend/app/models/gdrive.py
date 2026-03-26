from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, JSON

from app.database import Base


class GDriveSyncLog(Base):
    __tablename__ = "gdrive_sync_log"

    sync_id = Column(Integer, primary_key=True, autoincrement=True)
    folder_id = Column(String(255))
    folder_name = Column(String(255))
    sync_date = Column(DateTime, default=datetime.utcnow)
    files_processed = Column(Integer, default=0)
    files_new = Column(Integer, default=0)
    files_updated = Column(Integer, default=0)
    errors_count = Column(Integer, default=0)
    error_details = Column(JSON)
    duration_seconds = Column(Float)


class GDriveFolder(Base):
    __tablename__ = "gdrive_folders"

    folder_id = Column(String(255), primary_key=True)
    folder_name = Column(String(255))
    is_active = Column(Boolean, default=True)
    last_sync_date = Column(DateTime, nullable=True)
    added_at = Column(DateTime, default=datetime.utcnow)
