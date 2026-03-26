from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.candidate import Candidate
from app.models.evaluation import Evaluation
from app.models.vacancy import Vacancy
from app.schemas.evaluation import (
    BatchEvaluationRequest,
    EvaluationCreate,
    EvaluationRankingResponse,
    EvaluationResponse,
)
from app.dependencies import get_ai_service

router = APIRouter(tags=["Evaluations"])


def _candidate_to_dict(candidate: Candidate) -> dict:
    """Convert a Candidate ORM object to a plain dict for the AI service."""
    return {
        "name": candidate.name,
        "email": candidate.email,
        "phone": candidate.phone,
        "location": candidate.location,
        "skills": [
            {
                "name": s.skill_name,
                "type": s.skill_type,
                "level": s.proficiency_level,
            }
            for s in candidate.skills
        ],
        "experience": [
            {
                "company": e.company,
                "position": e.position,
                "duration_months": e.duration_months,
                "start_date": e.start_date,
                "end_date": e.end_date,
                "description": e.description,
            }
            for e in candidate.experiences
        ],
    }


def _vacancy_to_dict(vacancy: Vacancy) -> dict:
    return {
        "vacancy_id": vacancy.vacancy_id,
        "title": vacancy.title,
        "department": vacancy.department,
        "required_experience_years": vacancy.required_experience_years,
        "requirements": vacancy.requirements or [],
        "values": vacancy.values or [],
        "description": vacancy.description,
    }


@router.post("/evaluations", response_model=EvaluationResponse, status_code=201)
def evaluate_candidate(
    payload: EvaluationCreate,
    db: Session = Depends(get_db),
    ai=Depends(get_ai_service),
):
    """
    Trigger an AI evaluation of a candidate for a specific vacancy.
    Creates and returns a new Evaluation record.
    """
    candidate = db.query(Candidate).filter_by(candidate_id=payload.candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    vacancy = db.query(Vacancy).filter_by(vacancy_id=payload.vacancy_id).first()
    if not vacancy:
        raise HTTPException(status_code=404, detail="Vacancy not found")

    try:
        result = ai.evaluate_candidate(
            _candidate_to_dict(candidate), _vacancy_to_dict(vacancy)
        )
    except Exception as exc:
        raise HTTPException(
            status_code=503, detail=f"AI evaluation failed: {exc}"
        )

    evaluation = Evaluation(
        candidate_id=payload.candidate_id,
        vacancy_id=payload.vacancy_id,
        compatibility_score=result.get("compatibility_score"),
        values_alignment_score=result.get("values_alignment_score"),
        requirements_score=result.get("requirements_score"),
        experience_relevance_score=result.get("experience_relevance_score"),
        stability_score=result.get("stability_score"),
        reasoning=result.get("reasoning"),
        strengths=result.get("strengths", []),
        gaps=result.get("gaps", []),
    )
    db.add(evaluation)
    db.commit()
    db.refresh(evaluation)
    return evaluation


@router.get("/evaluations/vacancy/{vacancy_id}", response_model=List[EvaluationRankingResponse])
def get_ranked_candidates(vacancy_id: int, db: Session = Depends(get_db)):
    """
    Return all candidates evaluated for a vacancy,
    ranked by compatibility_score descending.
    """
    vacancy = db.query(Vacancy).filter_by(vacancy_id=vacancy_id).first()
    if not vacancy:
        raise HTTPException(status_code=404, detail="Vacancy not found")

    evaluations = (
        db.query(Evaluation)
        .filter_by(vacancy_id=vacancy_id)
        .order_by(Evaluation.compatibility_score.desc().nullslast())
        .all()
    )

    result = []
    for ev in evaluations:
        c = ev.candidate
        result.append(
            EvaluationRankingResponse(
                evaluation_id=ev.evaluation_id,
                candidate_id=ev.candidate_id,
                candidate_name=c.name if c else "Unknown",
                candidate_email=c.email if c else None,
                candidate_phone=c.phone if c else None,
                candidate_location=c.location if c else None,
                compatibility_score=ev.compatibility_score,
                values_alignment_score=ev.values_alignment_score,
                requirements_score=ev.requirements_score,
                experience_relevance_score=ev.experience_relevance_score,
                stability_score=ev.stability_score,
                strengths=ev.strengths,
                gaps=ev.gaps,
                reasoning=ev.reasoning,
                created_at=ev.created_at,
            )
        )
    return result


@router.post("/evaluations/batch", response_model=List[EvaluationResponse])
def batch_evaluate(
    payload: BatchEvaluationRequest,
    db: Session = Depends(get_db),
    ai=Depends(get_ai_service),
):
    """
    Evaluate multiple candidates for a single vacancy.
    Returns a list of Evaluation records created.
    """
    vacancy = db.query(Vacancy).filter_by(vacancy_id=payload.vacancy_id).first()
    if not vacancy:
        raise HTTPException(status_code=404, detail="Vacancy not found")

    vacancy_dict = _vacancy_to_dict(vacancy)
    created = []
    errors = []

    for cid in payload.candidate_ids:
        candidate = db.query(Candidate).filter_by(candidate_id=cid).first()
        if not candidate:
            errors.append({"candidate_id": cid, "error": "Not found"})
            continue

        try:
            result = ai.evaluate_candidate(_candidate_to_dict(candidate), vacancy_dict)
        except Exception as exc:
            errors.append({"candidate_id": cid, "error": str(exc)})
            continue

        evaluation = Evaluation(
            candidate_id=cid,
            vacancy_id=payload.vacancy_id,
            compatibility_score=result.get("compatibility_score"),
            values_alignment_score=result.get("values_alignment_score"),
            requirements_score=result.get("requirements_score"),
            experience_relevance_score=result.get("experience_relevance_score"),
            stability_score=result.get("stability_score"),
            reasoning=result.get("reasoning"),
            strengths=result.get("strengths", []),
            gaps=result.get("gaps", []),
        )
        db.add(evaluation)
        db.flush()
        created.append(evaluation)

    db.commit()
    for ev in created:
        db.refresh(ev)

    if errors:
        # Still return successes but attach error info in headers or body
        pass  # Errors are silently skipped; callers can detect missing IDs

    return created


@router.get("/evaluations/{evaluation_id}", response_model=EvaluationResponse)
def get_evaluation(evaluation_id: int, db: Session = Depends(get_db)):
    """Get a single evaluation by ID."""
    evaluation = db.query(Evaluation).filter_by(evaluation_id=evaluation_id).first()
    if not evaluation:
        raise HTTPException(status_code=404, detail="Evaluation not found")
    return evaluation
