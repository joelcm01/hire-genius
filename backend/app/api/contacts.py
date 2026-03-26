import urllib.parse
from typing import List

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.candidate import Candidate
from app.models.contact import Contact
from app.models.vacancy import Vacancy
from app.schemas.contact import (
    ContactCreate,
    ContactResponse,
    EmailMeetingRequest,
    WhatsAppContactRequest,
)

router = APIRouter(tags=["Contacts"])

# ── Default message templates ──────────────────────────────────────────────────
DEFAULT_WHATSAPP_TEMPLATE = (
    "Hola {name}, te contactamos de HireGenius. "
    "Estamos interesados en tu perfil para la posición de {vacancy_title}. "
    "¿Tendrías disponibilidad para conversar sobre la oportunidad?"
)

DEFAULT_EMAIL_SUBJECT = "Invitación a entrevista – {vacancy_title}"
DEFAULT_EMAIL_BODY = (
    "Estimado/a {name},\n\n"
    "Nos complace invitarte a una entrevista para la posición de {vacancy_title}.\n\n"
    "Horarios propuestos:\n{proposed_times}\n\n"
    "Por favor, indícanos tu preferencia o sugiérenos otro horario conveniente.\n\n"
    "Saludos,\nEl equipo de HireGenius"
)


@router.post("/contacts/{candidate_id}/whatsapp")
def generate_whatsapp_link(
    candidate_id: int,
    payload: WhatsAppContactRequest,
    db: Session = Depends(get_db),
):
    """
    Generate a WhatsApp deep-link with a pre-filled message and log the contact.
    Returns the wa.me URL.
    """
    candidate = db.query(Candidate).filter_by(candidate_id=candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    template = payload.template or DEFAULT_WHATSAPP_TEMPLATE
    message = template.format(
        name=payload.name or candidate.name,
        vacancy_title=payload.vacancy_title,
    )

    # Sanitize phone: keep digits and leading +
    phone_digits = "".join(c for c in payload.phone if c.isdigit() or c == "+")
    encoded_message = urllib.parse.quote(message)
    whatsapp_url = f"https://wa.me/{phone_digits}?text={encoded_message}"

    # Log the contact
    contact = Contact(
        candidate_id=candidate_id,
        contact_method="whatsapp",
        notes=f"WhatsApp link generated for vacancy: {payload.vacancy_title}",
        status="sent",
    )
    db.add(contact)
    db.commit()

    return {
        "whatsapp_url": whatsapp_url,
        "message_preview": message,
        "contact_id": contact.contact_id,
    }


@router.post("/contacts/{candidate_id}/email")
def send_email_meeting_proposal(
    candidate_id: int,
    payload: EmailMeetingRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """
    Prepare an email meeting proposal and log the contact.
    Returns the email content (actual sending is handled by the background task or
    frontend mailer integration).
    """
    candidate = db.query(Candidate).filter_by(candidate_id=candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    vacancy = None
    if payload.vacancy_id:
        vacancy = db.query(Vacancy).filter_by(vacancy_id=payload.vacancy_id).first()

    vacancy_title = vacancy.title if vacancy else "the open position"

    formatted_times = "\n".join(
        f"  • {t}" for t in payload.proposed_times
    )
    email_subject = DEFAULT_EMAIL_SUBJECT.format(vacancy_title=vacancy_title)
    email_body = DEFAULT_EMAIL_BODY.format(
        name=candidate.name,
        vacancy_title=vacancy_title,
        proposed_times=formatted_times,
    )

    if payload.additional_message:
        email_body += f"\n\nAdditional notes:\n{payload.additional_message}"

    # Log the contact
    contact = Contact(
        candidate_id=candidate_id,
        vacancy_id=payload.vacancy_id,
        contact_method="email",
        notes=f"Meeting proposal sent. Subject: {email_subject}",
        status="sent",
        responsible=payload.responsible_email,
    )
    db.add(contact)
    db.commit()

    return {
        "contact_id": contact.contact_id,
        "to": candidate.email,
        "subject": email_subject,
        "body": email_body,
        "proposed_times": payload.proposed_times,
    }


@router.post("/contacts", response_model=ContactResponse, status_code=201)
def log_contact(payload: ContactCreate, db: Session = Depends(get_db)):
    """Manually log a contact event (call, meeting, etc.)."""
    candidate = db.query(Candidate).filter_by(candidate_id=payload.candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    valid_methods = {"email", "whatsapp", "phone", "other"}
    if payload.contact_method not in valid_methods:
        raise HTTPException(
            status_code=422,
            detail=f"contact_method must be one of: {', '.join(valid_methods)}",
        )

    valid_statuses = {"sent", "responded", "no_response"}
    if payload.status not in valid_statuses:
        raise HTTPException(
            status_code=422,
            detail=f"status must be one of: {', '.join(valid_statuses)}",
        )

    contact = Contact(
        candidate_id=payload.candidate_id,
        vacancy_id=payload.vacancy_id,
        contact_method=payload.contact_method,
        responsible=payload.responsible,
        notes=payload.notes,
        status=payload.status,
    )
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return contact


@router.get("/contacts/{candidate_id}", response_model=List[ContactResponse])
def get_candidate_contacts(candidate_id: int, db: Session = Depends(get_db)):
    """Get all contact history for a candidate."""
    candidate = db.query(Candidate).filter_by(candidate_id=candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    contacts = (
        db.query(Contact)
        .filter_by(candidate_id=candidate_id)
        .order_by(Contact.contact_date.desc())
        .all()
    )
    return contacts


@router.patch("/contacts/{contact_id}/status", response_model=ContactResponse)
def update_contact_status(
    contact_id: int,
    new_status: str,
    db: Session = Depends(get_db),
):
    """Update the status of a contact record (e.g., mark as responded)."""
    contact = db.query(Contact).filter_by(contact_id=contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")

    valid_statuses = {"sent", "responded", "no_response"}
    if new_status not in valid_statuses:
        raise HTTPException(
            status_code=422,
            detail=f"status must be one of: {', '.join(valid_statuses)}",
        )

    contact.status = new_status
    db.commit()
    db.refresh(contact)
    return contact
