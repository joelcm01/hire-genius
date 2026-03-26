from datetime import datetime
from sqlalchemy import Column, Integer, Float, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship

from app.database import Base


class Evaluation(Base):
    __tablename__ = "evaluations"

    evaluation_id = Column(Integer, primary_key=True, autoincrement=True)
    candidate_id = Column(Integer, ForeignKey("candidates.candidate_id"))
    vacancy_id = Column(Integer, ForeignKey("vacancies.vacancy_id"))
    compatibility_score = Column(Float)           # 0-100
    values_alignment_score = Column(Float)        # 0-100
    requirements_score = Column(Float)            # 0-100
    experience_relevance_score = Column(Float)    # 0-100
    stability_score = Column(Float)               # 0-100
    reasoning = Column(Text)
    strengths = Column(JSON)   # list of strings
    gaps = Column(JSON)        # list of strings
    created_at = Column(DateTime, default=datetime.utcnow)

    candidate = relationship("Candidate", back_populates="evaluations")
    vacancy = relationship("Vacancy", back_populates="evaluations")
