from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class Contact(Base):
    __tablename__ = "contacts"

    contact_id = Column(Integer, primary_key=True, autoincrement=True)
    candidate_id = Column(Integer, ForeignKey("candidates.candidate_id"))
    vacancy_id = Column(Integer, ForeignKey("vacancies.vacancy_id"), nullable=True)
    contact_method = Column(Enum("email", "whatsapp", "phone", "other"))
    contact_date = Column(DateTime, default=datetime.utcnow)
    responsible = Column(String(255))
    notes = Column(Text)
    status = Column(Enum("sent", "responded", "no_response"), default="sent")

    candidate = relationship("Candidate", back_populates="contacts")
    vacancy = relationship("Vacancy")
