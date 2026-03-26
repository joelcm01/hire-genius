import logging
from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from app.models.candidate import Candidate, CandidateSkill, CandidateExperience
from app.models.gdrive import GDriveFolder, GDriveSyncLog
from app.services.ai_service import AIService
from app.services.cv_processor import CVProcessor
from app.services.gdrive_service import GDriveService
from app.services.s3_service import S3Service

logger = logging.getLogger(__name__)

PDF_MIME = "application/pdf"
DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"


class SyncService:
    """Orchestrates the full Google Drive → S3 → DB candidate sync pipeline."""

    def __init__(
        self,
        gdrive_service: GDriveService,
        cv_processor: CVProcessor,
        ai_service: AIService,
        s3_service: S3Service,
        db: Session,
    ):
        self.gdrive_service = gdrive_service
        self.cv_processor = cv_processor
        self.ai_service = ai_service
        self.s3_service = s3_service
        self.db = db

    def sync_folder(self, folder_id: str, folder_name: str) -> dict:
        """
        Full sync of a Google Drive folder.

        Steps per file:
          1. List files modified since last sync
          2. Download from Drive
          3. Extract text
          4. AI-extract structured candidate data
          5. Upload original to S3
          6. Save/update candidate in DB
          7. Log results

        Returns a dict with sync statistics.
        """
        start_time = datetime.utcnow()
        stats = {
            "files_processed": 0,
            "files_new": 0,
            "files_updated": 0,
            "errors": [],
        }

        # ── Get last sync time for this folder ───────────────────────────────
        folder_record = (
            self.db.query(GDriveFolder).filter_by(folder_id=folder_id).first()
        )
        last_sync: Optional[datetime] = (
            folder_record.last_sync_date if folder_record else None
        )

        # ── List files ────────────────────────────────────────────────────────
        try:
            files = self.gdrive_service.list_cv_files(
                folder_id, modified_after=last_sync
            )
        except Exception as exc:
            logger.error("Failed to list files in folder %s: %s", folder_id, exc)
            self._write_sync_log(
                folder_id,
                folder_name,
                stats,
                start_time,
                [{"file": "N/A", "error": f"list_files failed: {exc}"}],
            )
            return stats

        # ── Process each file ─────────────────────────────────────────────────
        for file in files:
            file_name = file.get("name", "unknown")
            try:
                existing = (
                    self.db.query(Candidate)
                    .filter_by(gdrive_file_id=file["id"])
                    .first()
                )

                # Determine MIME type
                mime_type = file.get("mimeType", "")
                if not mime_type:
                    mime_type = (
                        PDF_MIME if file_name.lower().endswith(".pdf") else DOCX_MIME
                    )

                # Download
                file_bytes = self.gdrive_service.download_file(file["id"])

                # Extract text
                text = self.cv_processor.extract_text(file_bytes, mime_type)
                truncated_text = self.cv_processor.truncate_text(text)

                # AI data extraction
                data = self.ai_service.extract_candidate_data(truncated_text)

                # S3 upload
                s3_path = self.s3_service.upload_cv(
                    file_bytes,
                    data.get("name") or "unknown",
                    file["id"],
                    content_type=mime_type,
                )

                if existing:
                    self._update_candidate(existing, data, s3_path, text)
                    stats["files_updated"] += 1
                else:
                    self._create_candidate(data, file["id"], s3_path, text)
                    stats["files_new"] += 1

                stats["files_processed"] += 1

            except Exception as exc:
                logger.exception("Error processing file %s: %s", file_name, exc)
                stats["errors"].append({"file": file_name, "error": str(exc)})

        # ── Update folder last_sync_date ──────────────────────────────────────
        sync_time = datetime.utcnow()
        if folder_record:
            folder_record.last_sync_date = sync_time
        else:
            folder_record = GDriveFolder(
                folder_id=folder_id,
                folder_name=folder_name,
                last_sync_date=sync_time,
                is_active=True,
            )
            self.db.add(folder_record)
        self.db.commit()

        # ── Write sync log ────────────────────────────────────────────────────
        duration = (datetime.utcnow() - start_time).total_seconds()
        self._write_sync_log(folder_id, folder_name, stats, start_time, stats["errors"], duration)

        return stats

    # ── Private helpers ───────────────────────────────────────────────────────

    def _create_candidate(
        self, data: dict, gdrive_file_id: str, s3_path: str, raw_text: str
    ) -> Candidate:
        candidate = Candidate(
            name=data.get("name") or "Unknown",
            email=data.get("email"),
            phone=data.get("phone"),
            location=data.get("location"),
            gdrive_file_id=gdrive_file_id,
            cv_s3_path=s3_path,
            raw_cv_text=raw_text,
        )
        self.db.add(candidate)
        self.db.flush()  # get candidate_id

        for skill_data in data.get("skills", []) or []:
            skill = CandidateSkill(
                candidate_id=candidate.candidate_id,
                skill_name=skill_data.get("name", ""),
                skill_type=skill_data.get("type", "technical"),
                proficiency_level=skill_data.get("level"),
            )
            self.db.add(skill)

        for exp_data in data.get("experience", []) or []:
            exp = CandidateExperience(
                candidate_id=candidate.candidate_id,
                company=exp_data.get("company"),
                position=exp_data.get("position"),
                duration_months=exp_data.get("duration_months"),
                start_date=exp_data.get("start_date"),
                end_date=exp_data.get("end_date"),
                description=exp_data.get("description"),
            )
            self.db.add(exp)

        self.db.commit()
        logger.info("Created new candidate: %s (id=%s)", candidate.name, candidate.candidate_id)
        return candidate

    def _update_candidate(
        self, candidate: Candidate, data: dict, s3_path: str, raw_text: str
    ) -> None:
        candidate.name = data.get("name") or candidate.name
        candidate.email = data.get("email") or candidate.email
        candidate.phone = data.get("phone") or candidate.phone
        candidate.location = data.get("location") or candidate.location
        candidate.cv_s3_path = s3_path
        candidate.raw_cv_text = raw_text
        candidate.updated_at = datetime.utcnow()

        # Replace skills and experience
        self.db.query(CandidateSkill).filter_by(
            candidate_id=candidate.candidate_id
        ).delete()
        self.db.query(CandidateExperience).filter_by(
            candidate_id=candidate.candidate_id
        ).delete()
        self.db.flush()

        for skill_data in data.get("skills", []) or []:
            skill = CandidateSkill(
                candidate_id=candidate.candidate_id,
                skill_name=skill_data.get("name", ""),
                skill_type=skill_data.get("type", "technical"),
                proficiency_level=skill_data.get("level"),
            )
            self.db.add(skill)

        for exp_data in data.get("experience", []) or []:
            exp = CandidateExperience(
                candidate_id=candidate.candidate_id,
                company=exp_data.get("company"),
                position=exp_data.get("position"),
                duration_months=exp_data.get("duration_months"),
                start_date=exp_data.get("start_date"),
                end_date=exp_data.get("end_date"),
                description=exp_data.get("description"),
            )
            self.db.add(exp)

        self.db.commit()
        logger.info("Updated candidate: %s (id=%s)", candidate.name, candidate.candidate_id)

    def _write_sync_log(
        self,
        folder_id: str,
        folder_name: str,
        stats: dict,
        start_time: datetime,
        errors: list,
        duration: Optional[float] = None,
    ) -> None:
        if duration is None:
            duration = (datetime.utcnow() - start_time).total_seconds()
        log = GDriveSyncLog(
            folder_id=folder_id,
            folder_name=folder_name,
            files_processed=stats["files_processed"],
            files_new=stats["files_new"],
            files_updated=stats["files_updated"],
            errors_count=len(errors),
            error_details=errors if errors else [],
            duration_seconds=duration,
        )
        self.db.add(log)
        self.db.commit()
