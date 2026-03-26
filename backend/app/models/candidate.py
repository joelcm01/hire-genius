from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base


class Candidate(Base):
    __tablename__ = "candidates"

    candidate_id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True)
    phone = Column(String(50))
    location = Column(String(255))
    gdrive_file_id = Column(String(255))
    cv_s3_path = Column(String(500))
    raw_cv_text = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    skills = relationship(
        "CandidateSkill",
        back_populates="candidate",
        cascade="all, delete-orphan"
    )
    experiences = relationship(
        "CandidateExperience",
        back_populates="candidate",
        cascade="all, delete-orphan"
    )
    evaluations = relationship("Evaluation", back_populates="candidate")
    contacts = relationship("Contact", back_populates="candidate")
    statuses = relationship("CandidateStatus", back_populates="candidate")
    feedbacks = relationship("InterviewFeedback", back_populates="candidate")


class CandidateSkill(Base):
    __tablename__ = "candidate_skills"

    skill_id = Column(Integer, primary_key=True, autoincrement=True)
    candidate_id = Column(Integer, ForeignKey("candidates.candidate_id"))
    skill_name = Column(String(255), nullable=False)
    skill_type = Column(Enum("technical", "soft"), default="technical")
    proficiency_level = Column(String(50))

    candidate = relationship("Candidate", back_populates="skills")


class CandidateExperience(Base):
    __tablename__ = "candidate_experience"

    experience_id = Column(Integer, primary_key=True, autoincrement=True)
    candidate_id = Column(Integer, ForeignKey("candidates.candidate_id"))
    company = Column(String(255))
    position = Column(String(255))
    duration_months = Column(Integer)
    start_date = Column(String(50))
    end_date = Column(String(50))
    description = Column(Text)

    candidate = relationship("Candidate", back_populates="experiences")
