from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.candidate import Candidate
from app.models.evaluation import Evaluation
from app.models.vacancy import Vacancy
from app.services.pdf_service import generate_interview_compilation
from app.dependencies import get_s3_service

router = APIRouter(tags=["Reports"])


@router.get("/reports/interview-compilation")
def interview_compilation_report(
    vacancy_id: int = Query(..., description="Vacancy ID for the compilation"),
    candidate_ids: str = Query(
        ...,
        description="Comma-separated list of candidate IDs, e.g. '1,2,3'",
    ),
    include_cv_links: bool = Query(True, description="Include presigned CV download links"),
    db: Session = Depends(get_db),
    s3=Depends(get_s3_service),
):
    """
    Generate and return a PDF compilation report for selected candidates
    evaluated for a given vacancy.
    """
    # Parse candidate IDs
    try:
        cid_list = [int(cid.strip()) for cid in candidate_ids.split(",") if cid.strip()]
    except ValueError:
        raise HTTPException(
            status_code=422,
            detail="candidate_ids must be a comma-separated list of integers",
        )

    if not cid_list:
        raise HTTPException(status_code=422, detail="At least one candidate_id is required")

    # Fetch vacancy
    vacancy = db.query(Vacancy).filter_by(vacancy_id=vacancy_id).first()
    if not vacancy:
        raise HTTPException(status_code=404, detail="Vacancy not found")

    vacancy_dict = {
        "vacancy_id": vacancy.vacancy_id,
        "title": vacancy.title,
        "department": vacancy.department,
        "required_experience_years": vacancy.required_experience_years,
        "requirements": vacancy.requirements or [],
        "values": vacancy.values or [],
        "description": vacancy.description,
    }

    # Build candidate data list
    candidates_data = []
    for cid in cid_list:
        candidate = db.query(Candidate).filter_by(candidate_id=cid).first()
        if not candidate:
            continue  # Skip missing candidates

        # Get latest evaluation for this vacancy
        evaluation = (
            db.query(Evaluation)
            .filter_by(candidate_id=cid, vacancy_id=vacancy_id)
            .order_by(Evaluation.created_at.desc())
            .first()
        )

        # Get presigned CV URL if available
        cv_url = None
        if include_cv_links and candidate.cv_s3_path:
            try:
                cv_url = s3.get_presigned_url(candidate.cv_s3_path, expiry_seconds=3600)
            except Exception:
                cv_url = None

        candidate_entry = {
            "candidate_id": candidate.candidate_id,
            "name": candidate.name,
            "email": candidate.email,
            "phone": candidate.phone,
            "location": candidate.location,
            "skills": [
                {
                    "skill_id": s.skill_id,
                    "skill_name": s.skill_name,
                    "skill_type": s.skill_type,
                    "proficiency_level": s.proficiency_level,
                }
                for s in candidate.skills
            ],
            "cv_url": cv_url,
        }

        if evaluation:
            candidate_entry.update(
                {
                    "compatibility_score": evaluation.compatibility_score,
                    "values_alignment_score": evaluation.values_alignment_score,
                    "requirements_score": evaluation.requirements_score,
                    "experience_relevance_score": evaluation.experience_relevance_score,
                    "stability_score": evaluation.stability_score,
                    "reasoning": evaluation.reasoning,
                    "strengths": evaluation.strengths or [],
                    "gaps": evaluation.gaps or [],
                    "recommendation": None,  # not stored in Evaluation model
                }
            )

        candidates_data.append(candidate_entry)

    if not candidates_data:
        raise HTTPException(
            status_code=404,
            detail="No valid candidates found for the provided IDs",
        )

    try:
        pdf_bytes = generate_interview_compilation(candidates_data, vacancy_dict)
    except Exception as exc:
        raise HTTPException(
            status_code=500, detail=f"PDF generation failed: {exc}"
        )

    filename = f"interview_compilation_{vacancy_id}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Length": str(len(pdf_bytes)),
        },
    )
