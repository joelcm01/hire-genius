from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class ContactCreate(BaseModel):
    candidate_id: int
    vacancy_id: Optional[int] = None
    contact_method: str   # email | whatsapp | phone | other
    responsible: Optional[str] = None
    notes: Optional[str] = None
    status: str = "sent"  # sent | responded | no_response


class ContactResponse(BaseModel):
    contact_id: int
    candidate_id: int
    vacancy_id: Optional[int] = None
    contact_method: str
    contact_date: Optional[datetime] = None
    responsible: Optional[str] = None
    notes: Optional[str] = None
    status: str

    model_config = {"from_attributes": True}


class WhatsAppContactRequest(BaseModel):
    """Request body for generating a WhatsApp deep-link message."""
    name: str
    vacancy_title: str
    phone: str
    template: Optional[str] = None  # custom message template; uses default if None


class EmailMeetingRequest(BaseModel):
    """Request body for sending an email meeting proposal."""
    candidate_id: int
    vacancy_id: int
    proposed_times: List[str]       # ISO-8601 datetime strings
    meeting_duration_minutes: int = 60
    additional_message: Optional[str] = None
    responsible_email: Optional[str] = None
