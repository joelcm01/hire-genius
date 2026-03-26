import io
import json
import os
from datetime import datetime
from typing import List, Optional

from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload

from app.config import settings

SCOPES = [
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/calendar",
]


class GDriveService:
    """Service for interacting with Google Drive API."""

    def __init__(self, credentials: Credentials):
        self.credentials = credentials
        self.service = build("drive", "v3", credentials=credentials)

    def list_cv_files(
        self, folder_id: str, modified_after: Optional[datetime] = None
    ) -> List[dict]:
        """List PDF/Word files in a folder, optionally filtered by modification date."""
        query = f"'{folder_id}' in parents and trashed=false"
        if modified_after:
            iso = modified_after.strftime("%Y-%m-%dT%H:%M:%S")
            query += f" and modifiedTime > '{iso}Z'"
        query += (
            " and (mimeType='application/pdf'"
            " or mimeType='application/vnd.openxmlformats-officedocument.wordprocessingml.document')"
        )

        results = (
            self.service.files()
            .list(
                q=query,
                fields="files(id,name,modifiedTime,size,mimeType)",
                pageSize=1000,
            )
            .execute()
        )
        return results.get("files", [])

    def download_file(self, file_id: str) -> bytes:
        """Download file content as bytes."""
        request = self.service.files().get_media(fileId=file_id)
        fh = io.BytesIO()
        downloader = MediaIoBaseDownload(fh, request)
        done = False
        while not done:
            _, done = downloader.next_chunk()
        return fh.getvalue()

    def get_file_metadata(self, file_id: str) -> dict:
        """Get metadata for a specific file."""
        return (
            self.service.files()
            .get(fileId=file_id, fields="id,name,mimeType,modifiedTime,size")
            .execute()
        )

    @staticmethod
    def get_oauth_url(redirect_uri: str) -> str:
        """Get Google OAuth2 authorization URL."""
        client_config = {
            "web": {
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uris": [redirect_uri],
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        }
        flow = Flow.from_client_config(client_config, scopes=SCOPES)
        flow.redirect_uri = redirect_uri
        auth_url, _ = flow.authorization_url(
            access_type="offline",
            include_granted_scopes="true",
            prompt="consent",
        )
        return auth_url

    @staticmethod
    def exchange_code(code: str, redirect_uri: str) -> dict:
        """Exchange an authorization code for OAuth tokens."""
        client_config = {
            "web": {
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uris": [redirect_uri],
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        }
        flow = Flow.from_client_config(client_config, scopes=SCOPES)
        flow.redirect_uri = redirect_uri
        flow.fetch_token(code=code)
        creds = flow.credentials
        return {
            "token": creds.token,
            "refresh_token": creds.refresh_token,
            "token_uri": creds.token_uri,
            "client_id": creds.client_id,
            "client_secret": creds.client_secret,
            "scopes": list(creds.scopes) if creds.scopes else SCOPES,
        }

    @staticmethod
    def credentials_from_token_dict(token_dict: dict) -> Credentials:
        """Build a Credentials object from a stored token dictionary."""
        creds = Credentials(
            token=token_dict.get("token"),
            refresh_token=token_dict.get("refresh_token"),
            token_uri=token_dict.get("token_uri", "https://oauth2.googleapis.com/token"),
            client_id=token_dict.get("client_id", settings.GOOGLE_CLIENT_ID),
            client_secret=token_dict.get("client_secret", settings.GOOGLE_CLIENT_SECRET),
            scopes=token_dict.get("scopes", SCOPES),
        )
        # Refresh if expired
        if creds.expired and creds.refresh_token:
            creds.refresh(Request())
        return creds

    @staticmethod
    def get_credentials_from_settings() -> Optional[Credentials]:
        """Load credentials from application settings (GOOGLE_TOKEN_JSON)."""
        if not settings.GOOGLE_TOKEN_JSON:
            return None
        try:
            token_dict = json.loads(settings.GOOGLE_TOKEN_JSON)
            return GDriveService.credentials_from_token_dict(token_dict)
        except (json.JSONDecodeError, Exception):
            return None
