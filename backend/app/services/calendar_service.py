import logging
from datetime import datetime, timezone
from typing import List, Optional

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

logger = logging.getLogger(__name__)


class CalendarService:
    """Wraps the Google Calendar API for availability checks and event creation."""

    def __init__(self, credentials: Credentials):
        self.service = build("calendar", "v3", credentials=credentials)

    def get_availability(
        self, email: str, time_min: str, time_max: str
    ) -> List[dict]:
        """
        Check free/busy slots for a given email address.

        Args:
            email:    Calendar owner's email address.
            time_min: RFC 3339 datetime string for the start of the range.
            time_max: RFC 3339 datetime string for the end of the range.

        Returns:
            List of busy intervals: [{"start": "...", "end": "..."}]
        """
        body = {
            "timeMin": time_min,
            "timeMax": time_max,
            "timeZone": "UTC",
            "items": [{"id": email}],
        }
        try:
            result = self.service.freebusy().query(body=body).execute()
            calendar_data = result.get("calendars", {}).get(email, {})
            return calendar_data.get("busy", [])
        except Exception as exc:
            logger.error("Failed to get availability for %s: %s", email, exc)
            raise RuntimeError(f"Calendar availability check failed: {exc}") from exc

    def create_event(
        self,
        title: str,
        description: str,
        attendees: List[str],
        start_time: str,
        end_time: str,
        location: Optional[str] = None,
        send_notifications: bool = True,
    ) -> dict:
        """
        Create a Google Calendar event and send email invitations.

        Args:
            title:              Event summary / title.
            description:        Event description / body.
            attendees:          List of attendee email addresses.
            start_time:         RFC 3339 datetime string.
            end_time:           RFC 3339 datetime string.
            location:           Optional location string.
            send_notifications: Whether to send email invites (default True).

        Returns:
            The created event resource dict (includes 'id', 'htmlLink', etc.).
        """
        event_body = {
            "summary": title,
            "description": description,
            "start": {
                "dateTime": start_time,
                "timeZone": "UTC",
            },
            "end": {
                "dateTime": end_time,
                "timeZone": "UTC",
            },
            "attendees": [{"email": addr} for addr in attendees],
            "reminders": {
                "useDefault": False,
                "overrides": [
                    {"method": "email", "minutes": 24 * 60},
                    {"method": "popup", "minutes": 30},
                ],
            },
            "conferenceData": {
                "createRequest": {
                    "requestId": f"hiregenius-{datetime.now(timezone.utc).timestamp()}",
                    "conferenceSolutionKey": {"type": "hangoutsMeet"},
                }
            },
        }
        if location:
            event_body["location"] = location

        try:
            event = (
                self.service.events()
                .insert(
                    calendarId="primary",
                    body=event_body,
                    sendNotifications=send_notifications,
                    conferenceDataVersion=1,
                )
                .execute()
            )
            logger.info("Created calendar event: %s (id=%s)", title, event.get("id"))
            return event
        except Exception as exc:
            logger.error("Failed to create calendar event '%s': %s", title, exc)
            raise RuntimeError(f"Calendar event creation failed: {exc}") from exc

    def delete_event(self, event_id: str) -> bool:
        """Delete a calendar event by ID. Returns True on success."""
        try:
            self.service.events().delete(
                calendarId="primary", eventId=event_id
            ).execute()
            return True
        except Exception as exc:
            logger.error("Failed to delete event %s: %s", event_id, exc)
            return False
