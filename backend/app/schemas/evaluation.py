from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class EvaluationCreate(BaseModel):
    candidate_id: int
    vacancy_id: int


class EvaluationResponse(BaseModel):
    evaluation_id: int
    candidate_id: int
    vacancy_id: int
    compatibility_score: Optional[float] = None
    values_alignment_score: Optional[float] = None
    requirements_score: Optional[float] = None
    experience_relevance_score: Optional[float] = None
    stability_score: Optional[float] = None
    reasoning: Optional[str] = None
    strengths: Optional[List[str]] = []
    gaps: Optional[List[str]] = []
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class EvaluationRankingResponse(BaseModel):
    """A candidate's evaluation result as shown in a ranked list for a vacancy."""
    evaluation_id: int
    candidate_id: int
    candidate_name: str
    candidate_email: Optional[str] = None
    candidate_phone: Optional[str] = None
    candidate_location: Optional[str] = None
    compatibility_score: Optional[float] = None
    values_alignment_score: Optional[float] = None
    requirements_score: Optional[float] = None
    experience_relevance_score: Optional[float] = None
    stability_score: Optional[float] = None
    strengths: Optional[List[str]] = []
    gaps: Optional[List[str]] = []
    reasoning: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class BatchEvaluationRequest(BaseModel):
    vacancy_id: int
    candidate_ids: List[int]
