from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.candidate import Candidate, CandidateSkill, CandidateExperience
from app.models.evaluation import Evaluation
from app.models.status import CandidateStatus
from app.schemas.candidate import (
    CandidateCreate,
    CandidateListResponse,
    CandidateResponse,
    CandidateStatusUpdate,
    CandidateUpdate,
)
from app.dependencies import get_s3_service

router = APIRouter(tags=["Candidates"])


@router.get("/candidates", response_model=List[CandidateListResponse])
def list_candidates(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None, description="Search by name, email, or location"),
    status_filter: Optional[str] = Query(None, alias="status"),
    vacancy_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    """
    List candidates with optional search, status filter, and pagination.
    When vacancy_id is provided, compatibility scores are included.
    """
    query = db.query(Candidate)

    if search:
        like = f"%{search}%"
        query = query.filter(
            (Candidate.name.ilike(like))
            | (Candidate.email.ilike(like))
            | (Candidate.location.ilike(like))
        )

    if status_filter:
        query = query.join(
            CandidateStatus, Candidate.candidate_id == CandidateStatus.candidate_id
        ).filter(CandidateStatus.status == status_filter)

    total = query.count()
    candidates = query.offset((page - 1) * page_size).limit(page_size).all()

    result = []
    for c in candidates:
        # Get latest status
        latest_status = (
            db.query(CandidateStatus)
            .filter_by(candidate_id=c.candidate_id)
            .order_by(CandidateStatus.changed_at.desc())
            .first()
        )
        # Get compatibility score for vacancy if specified
        compat_score = None
        if vacancy_id:
            eval_record = (
                db.query(Evaluation)
                .filter_by(candidate_id=c.candidate_id, vacancy_id=vacancy_id)
                .order_by(Evaluation.created_at.desc())
                .first()
            )
            if eval_record:
                compat_score = eval_record.compatibility_score

        item = CandidateListResponse(
            candidate_id=c.candidate_id,
            name=c.name,
            email=c.email,
            phone=c.phone,
            location=c.location,
            compatibility_score=compat_score,
            skills=[
                {
                    "skill_id": s.skill_id,
                    "candidate_id": s.candidate_id,
                    "skill_name": s.skill_name,
                    "skill_type": s.skill_type,
                    "proficiency_level": s.proficiency_level,
                }
                for s in c.skills[:10]
            ],
            current_status=latest_status.status if latest_status else None,
        )
        result.append(item)

    return result


@router.get("/candidates/{candidate_id}", response_model=CandidateResponse)
def get_candidate(candidate_id: int, db: Session = Depends(get_db)):
    """Return full candidate detail including skills, experience, and history."""
    candidate = db.query(Candidate).filter_by(candidate_id=candidate_id).first()
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Candidate {candidate_id} not found",
        )
    return candidate


@router.put("/candidates/{candidate_id}", response_model=CandidateResponse)
def update_candidate(
    candidate_id: int,
    payload: CandidateUpdate,
    db: Session = Depends(get_db),
):
    """Update candidate information (name, email, phone, location)."""
    candidate = db.query(Candidate).filter_by(candidate_id=candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(candidate, field, value)

    db.commit()
    db.refresh(candidate)
    return candidate


@router.post("/candidates/{candidate_id}/status", response_model=dict)
def update_status(
    candidate_id: int,
    payload: CandidateStatusUpdate,
    db: Session = Depends(get_db),
):
    """Record a status change for a candidate."""
    candidate = db.query(Candidate).filter_by(candidate_id=candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    valid_statuses = {"en_proceso", "contratado", "no_apto", "en_espera", "descartado"}
    if payload.status not in valid_statuses:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}",
        )

    status_record = CandidateStatus(
        candidate_id=candidate_id,
        vacancy_id=payload.vacancy_id,
        status=payload.status,
        hire_date=payload.hire_date,
        changed_by=payload.changed_by,
        notes=payload.notes,
    )
    db.add(status_record)
    db.commit()

    return {
        "message": "Status updated",
        "status_id": status_record.status_id,
        "status": status_record.status,
    }


@router.get("/candidates/{candidate_id}/cv-url")
def get_cv_url(
    candidate_id: int,
    expiry_seconds: int = Query(3600, ge=300, le=86400),
    db: Session = Depends(get_db),
    s3=Depends(get_s3_service),
):
    """Generate a presigned S3 URL for CV download."""
    candidate = db.query(Candidate).filter_by(candidate_id=candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    if not candidate.cv_s3_path:
        raise HTTPException(status_code=404, detail="No CV file stored for this candidate")

    url = s3.get_presigned_url(candidate.cv_s3_path, expiry_seconds=expiry_seconds)
    return {"cv_url": url, "expires_in_seconds": expiry_seconds}


@router.post("/candidates", response_model=CandidateResponse, status_code=201)
def create_candidate(payload: CandidateCreate, db: Session = Depends(get_db)):
    """Manually create a candidate record (skips Drive/S3 pipeline)."""
    # Check duplicate email
    if payload.email:
        existing = db.query(Candidate).filter_by(email=payload.email).first()
        if existing:
            raise HTTPException(
                status_code=409,
                detail=f"Candidate with email '{payload.email}' already exists",
            )

    candidate = Candidate(
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        location=payload.location,
        gdrive_file_id=payload.gdrive_file_id,
        cv_s3_path=payload.cv_s3_path,
        raw_cv_text=payload.raw_cv_text,
    )
    db.add(candidate)
    db.flush()

    for skill_data in payload.skills or []:
        skill = CandidateSkill(
            candidate_id=candidate.candidate_id,
            skill_name=skill_data.skill_name,
            skill_type=skill_data.skill_type,
            proficiency_level=skill_data.proficiency_level,
        )
        db.add(skill)

    for exp_data in payload.experiences or []:
        exp = CandidateExperience(
            candidate_id=candidate.candidate_id,
            company=exp_data.company,
            position=exp_data.position,
            duration_months=exp_data.duration_months,
            start_date=exp_data.start_date,
            end_date=exp_data.end_date,
            description=exp_data.description,
        )
        db.add(exp)

    db.commit()
    db.refresh(candidate)
    return candidate


@router.delete("/candidates/{candidate_id}", status_code=204)
def delete_candidate(candidate_id: int, db: Session = Depends(get_db)):
    """Permanently delete a candidate and all related records."""
    candidate = db.query(Candidate).filter_by(candidate_id=candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    db.delete(candidate)
    db.commit()
