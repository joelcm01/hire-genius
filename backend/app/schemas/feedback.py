from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class InterviewFeedbackCreate(BaseModel):
    candidate_id: int
    vacancy_id: int
    interview_date: Optional[datetime] = None
    rating: int = Field(..., ge=1, le=5, description="Rating from 1 to 5")
    strengths: Optional[str] = None
    improvements: Optional[str] = None
    recommendation: str  # hire | second_interview | reject | pending
    notes: Optional[str] = None


class InterviewFeedbackResponse(BaseModel):
    feedback_id: int
    candidate_id: int
    vacancy_id: int
    interview_date: Optional[datetime] = None
    rating: int
    strengths: Optional[str] = None
    improvements: Optional[str] = None
    recommendation: str
    notes: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
