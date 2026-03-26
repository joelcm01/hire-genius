from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Float, Boolean, JSON
from sqlalchemy.orm import relationship

from app.database import Base


class Vacancy(Base):
    __tablename__ = "vacancies"

    vacancy_id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    department = Column(String(255))
    required_experience_years = Column(Float)
    open_positions = Column(Integer, default=1)
    requirements = Column(JSON)   # list of strings
    values = Column(JSON)         # list of strings
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    evaluations = relationship("Evaluation", back_populates="vacancy")
