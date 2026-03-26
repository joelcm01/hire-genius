from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.vacancy import Vacancy
from app.schemas.vacancy import VacancyCreate, VacancyResponse, VacancyUpdate

router = APIRouter(tags=["Vacancies"])


@router.get("/vacancies", response_model=List[VacancyResponse])
def list_vacancies(
    active_only: bool = Query(True, description="Filter to active vacancies only"),
    department: Optional[str] = Query(None),
    search: Optional[str] = Query(None, description="Search in title or description"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """List vacancies with optional filters."""
    query = db.query(Vacancy)

    if active_only:
        query = query.filter(Vacancy.is_active == True)
    if department:
        query = query.filter(Vacancy.department.ilike(f"%{department}%"))
    if search:
        like = f"%{search}%"
        query = query.filter(
            (Vacancy.title.ilike(like)) | (Vacancy.description.ilike(like))
        )

    return query.offset((page - 1) * page_size).limit(page_size).all()


@router.post("/vacancies", response_model=VacancyResponse, status_code=201)
def create_vacancy(payload: VacancyCreate, db: Session = Depends(get_db)):
    """Create a new vacancy."""
    vacancy = Vacancy(
        title=payload.title,
        department=payload.department,
        required_experience_years=payload.required_experience_years,
        open_positions=payload.open_positions,
        requirements=payload.requirements or [],
        values=payload.values or [],
        description=payload.description,
        is_active=payload.is_active,
    )
    db.add(vacancy)
    db.commit()
    db.refresh(vacancy)
    return vacancy


@router.get("/vacancies/{vacancy_id}", response_model=VacancyResponse)
def get_vacancy(vacancy_id: int, db: Session = Depends(get_db)):
    """Get a single vacancy by ID."""
    vacancy = db.query(Vacancy).filter_by(vacancy_id=vacancy_id).first()
    if not vacancy:
        raise HTTPException(status_code=404, detail="Vacancy not found")
    return vacancy


@router.put("/vacancies/{vacancy_id}", response_model=VacancyResponse)
def update_vacancy(
    vacancy_id: int,
    payload: VacancyUpdate,
    db: Session = Depends(get_db),
):
    """Update vacancy fields."""
    vacancy = db.query(Vacancy).filter_by(vacancy_id=vacancy_id).first()
    if not vacancy:
        raise HTTPException(status_code=404, detail="Vacancy not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(vacancy, field, value)

    db.commit()
    db.refresh(vacancy)
    return vacancy


@router.delete("/vacancies/{vacancy_id}", response_model=dict)
def deactivate_vacancy(vacancy_id: int, db: Session = Depends(get_db)):
    """
    Soft-delete a vacancy by marking it inactive.
    Use ?hard=true to permanently delete (admin only).
    """
    vacancy = db.query(Vacancy).filter_by(vacancy_id=vacancy_id).first()
    if not vacancy:
        raise HTTPException(status_code=404, detail="Vacancy not found")

    vacancy.is_active = False
    db.commit()
    return {"message": f"Vacancy {vacancy_id} deactivated", "vacancy_id": vacancy_id}
