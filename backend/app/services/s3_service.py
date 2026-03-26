import logging
from typing import Optional

import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)


class S3Service:
    """Handles CV storage and retrieval on Amazon S3."""

    def __init__(
        self,
        bucket_name: str,
        aws_access_key: str,
        aws_secret_key: str,
        region: str,
    ):
        self.bucket = bucket_name
        self.region = region
        self.s3 = boto3.client(
            "s3",
            region_name=region,
            aws_access_key_id=aws_access_key,
            aws_secret_access_key=aws_secret_key,
        )

    def upload_cv(
        self,
        file_bytes: bytes,
        candidate_name: str,
        gdrive_file_id: str,
        content_type: str = "application/pdf",
    ) -> str:
        """
        Upload a CV file to S3 and return the object key (path).

        Key pattern: cvs/<gdrive_file_id>/<sanitized_name>.<ext>
        """
        ext = "pdf" if "pdf" in content_type else "docx"
        safe_name = candidate_name.replace(" ", "_").replace("/", "-")[:100]
        key = f"cvs/{gdrive_file_id}/{safe_name}.{ext}"

        try:
            self.s3.put_object(
                Bucket=self.bucket,
                Key=key,
                Body=file_bytes,
                ContentType=content_type,
            )
            logger.info("Uploaded CV to S3: %s", key)
            return key
        except ClientError as exc:
            logger.error("S3 upload failed for key %s: %s", key, exc)
            raise RuntimeError(f"S3 upload failed: {exc}") from exc

    def get_presigned_url(self, s3_key: str, expiry_seconds: int = 3600) -> str:
        """
        Generate a presigned URL for temporary access to a CV file.

        Default expiry is 1 hour.
        """
        try:
            url = self.s3.generate_presigned_url(
                "get_object",
                Params={"Bucket": self.bucket, "Key": s3_key},
                ExpiresIn=expiry_seconds,
            )
            return url
        except ClientError as exc:
            logger.error("Failed to generate presigned URL for %s: %s", s3_key, exc)
            raise RuntimeError(f"Presigned URL generation failed: {exc}") from exc

    def delete_file(self, s3_key: str) -> bool:
        """Delete a file from S3. Returns True on success."""
        try:
            self.s3.delete_object(Bucket=self.bucket, Key=s3_key)
            logger.info("Deleted S3 object: %s", s3_key)
            return True
        except ClientError as exc:
            logger.error("Failed to delete S3 object %s: %s", s3_key, exc)
            return False

    def file_exists(self, s3_key: str) -> bool:
        """Check whether a file exists in S3."""
        try:
            self.s3.head_object(Bucket=self.bucket, Key=s3_key)
            return True
        except ClientError:
            return False
