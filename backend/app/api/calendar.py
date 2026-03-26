from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from app.dependencies import get_calendar_service

router = APIRouter(tags=["Calendar"])


class EventCreateRequest(BaseModel):
    title: str
    description: Optional[str] = ""
    attendees: List[str]          # list of email addresses
    start_time: str               # RFC 3339 datetime string, e.g. "2025-04-01T10:00:00Z"
    end_time: str                 # RFC 3339 datetime string
    location: Optional[str] = None


class AvailabilityRequest(BaseModel):
    email: str
    time_min: str   # RFC 3339
    time_max: str   # RFC 3339


@router.get("/calendar/availability")
def check_availability(
    email: str = Query(..., description="Email address to check calendar for"),
    time_min: str = Query(..., description="RFC 3339 start datetime, e.g. 2025-04-01T00:00:00Z"),
    time_max: str = Query(..., description="RFC 3339 end datetime, e.g. 2025-04-07T23:59:59Z"),
    calendar_service=Depends(get_calendar_service),
):
    """
    Check busy time slots for a given calendar/email within a date range.
    Returns a list of busy intervals.
    """
    try:
        busy_slots = calendar_service.get_availability(email, time_min, time_max)
    except Exception as exc:
        raise HTTPException(
            status_code=503, detail=f"Calendar service unavailable: {exc}"
        )

    return {
        "email": email,
        "time_min": time_min,
        "time_max": time_max,
        "busy_slots": busy_slots,
    }


@router.post("/calendar/event")
def create_event(
    payload: EventCreateRequest,
    calendar_service=Depends(get_calendar_service),
):
    """
    Create a Google Calendar meeting event and send invitations to all attendees.
    Returns the created event including the Google Meet link if generated.
    """
    if not payload.attendees:
        raise HTTPException(
            status_code=422, detail="At least one attendee is required"
        )

    try:
        event = calendar_service.create_event(
            title=payload.title,
            description=payload.description or "",
            attendees=payload.attendees,
            start_time=payload.start_time,
            end_time=payload.end_time,
            location=payload.location,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=503, detail=f"Failed to create calendar event: {exc}"
        )

    # Extract Meet link if present
    meet_link = None
    conference = event.get("conferenceData", {})
    for entry in conference.get("entryPoints", []):
        if entry.get("entryPointType") == "video":
            meet_link = entry.get("uri")
            break

    return {
        "event_id": event.get("id"),
        "html_link": event.get("htmlLink"),
        "meet_link": meet_link,
        "summary": event.get("summary"),
        "start": event.get("start"),
        "end": event.get("end"),
        "attendees": [a.get("email") for a in event.get("attendees", [])],
    }
