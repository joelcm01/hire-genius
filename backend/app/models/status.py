from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class CandidateStatus(Base):
    __tablename__ = "candidate_status"

    status_id = Column(Integer, primary_key=True, autoincrement=True)
    candidate_id = Column(Integer, ForeignKey("candidates.candidate_id"))
    vacancy_id = Column(Integer, ForeignKey("vacancies.vacancy_id"), nullable=True)
    status = Column(
        Enum("en_proceso", "contratado", "no_apto", "en_espera", "descartado")
    )
    hire_date = Column(DateTime, nullable=True)
    changed_at = Column(DateTime, default=datetime.utcnow)
    changed_by = Column(String(255))
    notes = Column(Text)

    candidate = relationship("Candidate", back_populates="statuses")
    vacancy = relationship("Vacancy")
