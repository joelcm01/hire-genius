from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.candidate import Candidate
from app.models.feedback import InterviewFeedback
from app.models.vacancy import Vacancy
from app.schemas.feedback import InterviewFeedbackCreate, InterviewFeedbackResponse

router = APIRouter(tags=["Feedback"])

VALID_RECOMMENDATIONS = {"hire", "second_interview", "reject", "pending"}


@router.post(
    "/interview-feedback",
    response_model=InterviewFeedbackResponse,
    status_code=201,
)
def create_feedback(payload: InterviewFeedbackCreate, db: Session = Depends(get_db)):
    """Record interview feedback for a candidate."""
    # Validate candidate
    candidate = db.query(Candidate).filter_by(candidate_id=payload.candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    # Validate vacancy
    vacancy = db.query(Vacancy).filter_by(vacancy_id=payload.vacancy_id).first()
    if not vacancy:
        raise HTTPException(status_code=404, detail="Vacancy not found")

    # Validate recommendation
    if payload.recommendation not in VALID_RECOMMENDATIONS:
        raise HTTPException(
            status_code=422,
            detail=f"recommendation must be one of: {', '.join(VALID_RECOMMENDATIONS)}",
        )

    feedback = InterviewFeedback(
        candidate_id=payload.candidate_id,
        vacancy_id=payload.vacancy_id,
        interview_date=payload.interview_date,
        rating=payload.rating,
        strengths=payload.strengths,
        improvements=payload.improvements,
        recommendation=payload.recommendation,
        notes=payload.notes,
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return feedback


@router.get(
    "/interview-feedback/{candidate_id}",
    response_model=List[InterviewFeedbackResponse],
)
def get_candidate_feedback(candidate_id: int, db: Session = Depends(get_db)):
    """Retrieve all interview feedback entries for a candidate, most recent first."""
    candidate = db.query(Candidate).filter_by(candidate_id=candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    feedbacks = (
        db.query(InterviewFeedback)
        .filter_by(candidate_id=candidate_id)
        .order_by(InterviewFeedback.created_at.desc())
        .all()
    )
    return feedbacks


@router.get(
    "/interview-feedback/{candidate_id}/{feedback_id}",
    response_model=InterviewFeedbackResponse,
)
def get_feedback(
    candidate_id: int, feedback_id: int, db: Session = Depends(get_db)
):
    """Get a specific feedback entry."""
    feedback = (
        db.query(InterviewFeedback)
        .filter_by(feedback_id=feedback_id, candidate_id=candidate_id)
        .first()
    )
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    return feedback


@router.put(
    "/interview-feedback/{feedback_id}",
    response_model=InterviewFeedbackResponse,
)
def update_feedback(
    feedback_id: int,
    payload: InterviewFeedbackCreate,
    db: Session = Depends(get_db),
):
    """Update an existing feedback record."""
    feedback = db.query(InterviewFeedback).filter_by(feedback_id=feedback_id).first()
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")

    if payload.recommendation not in VALID_RECOMMENDATIONS:
        raise HTTPException(
            status_code=422,
            detail=f"recommendation must be one of: {', '.join(VALID_RECOMMENDATIONS)}",
        )

    feedback.interview_date = payload.interview_date
    feedback.rating = payload.rating
    feedback.strengths = payload.strengths
    feedback.improvements = payload.improvements
    feedback.recommendation = payload.recommendation
    feedback.notes = payload.notes

    db.commit()
    db.refresh(feedback)
    return feedback
