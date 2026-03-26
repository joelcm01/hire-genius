from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class InterviewFeedback(Base):
    __tablename__ = "interview_feedback"

    feedback_id = Column(Integer, primary_key=True, autoincrement=True)
    candidate_id = Column(Integer, ForeignKey("candidates.candidate_id"))
    vacancy_id = Column(Integer, ForeignKey("vacancies.vacancy_id"))
    interview_date = Column(DateTime)
    rating = Column(Integer)  # 1-5
    strengths = Column(Text)
    improvements = Column(Text)
    recommendation = Column(Enum("hire", "second_interview", "reject", "pending"))
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    candidate = relationship("Candidate", back_populates="feedbacks")
    vacancy = relationship("Vacancy")
