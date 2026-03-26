from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class VacancyCreate(BaseModel):
    title: str
    department: Optional[str] = None
    required_experience_years: Optional[float] = None
    open_positions: int = 1
    requirements: Optional[List[str]] = []
    values: Optional[List[str]] = []
    description: Optional[str] = None
    is_active: bool = True


class VacancyUpdate(BaseModel):
    title: Optional[str] = None
    department: Optional[str] = None
    required_experience_years: Optional[float] = None
    open_positions: Optional[int] = None
    requirements: Optional[List[str]] = None
    values: Optional[List[str]] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class VacancyResponse(BaseModel):
    vacancy_id: int
    title: str
    department: Optional[str] = None
    required_experience_years: Optional[float] = None
    open_positions: int
    requirements: Optional[List[str]] = []
    values: Optional[List[str]] = []
    description: Optional[str] = None
    is_active: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
