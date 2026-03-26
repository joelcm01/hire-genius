from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field


# ── Skill schemas ─────────────────────────────────────────────────────────────

class CandidateSkillCreate(BaseModel):
    skill_name: str
    skill_type: str = "technical"   # "technical" | "soft"
    proficiency_level: Optional[str] = None


class CandidateSkillResponse(CandidateSkillCreate):
    skill_id: int
    candidate_id: int

    model_config = {"from_attributes": True}


# ── Experience schemas ────────────────────────────────────────────────────────

class CandidateExperienceCreate(BaseModel):
    company: Optional[str] = None
    position: Optional[str] = None
    duration_months: Optional[int] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    description: Optional[str] = None


class CandidateExperienceResponse(CandidateExperienceCreate):
    experience_id: int
    candidate_id: int

    model_config = {"from_attributes": True}


# ── Candidate schemas ─────────────────────────────────────────────────────────

class CandidateCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    gdrive_file_id: Optional[str] = None
    cv_s3_path: Optional[str] = None
    raw_cv_text: Optional[str] = None
    skills: Optional[List[CandidateSkillCreate]] = []
    experiences: Optional[List[CandidateExperienceCreate]] = []


class CandidateUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    cv_s3_path: Optional[str] = None


class CandidateResponse(BaseModel):
    candidate_id: int
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    gdrive_file_id: Optional[str] = None
    cv_s3_path: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    skills: List[CandidateSkillResponse] = []
    experiences: List[CandidateExperienceResponse] = []

    model_config = {"from_attributes": True}


class CandidateListResponse(BaseModel):
    """Used when returning a ranked list of candidates with an optional compatibility score."""
    candidate_id: int
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    compatibility_score: Optional[float] = None
    skills: List[CandidateSkillResponse] = []
    current_status: Optional[str] = None

    model_config = {"from_attributes": True}


class CandidateStatusUpdate(BaseModel):
    status: str  # en_proceso | contratado | no_apto | en_espera | descartado
    vacancy_id: Optional[int] = None
    hire_date: Optional[datetime] = None
    changed_by: Optional[str] = None
    notes: Optional[str] = None
