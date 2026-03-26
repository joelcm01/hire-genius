"""Initial schema

Revision ID: 0001
Revises:
Create Date: 2026-03-26
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = '0001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # candidates table
    op.create_table('candidates',
        sa.Column('candidate_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('email', sa.String(255), nullable=True),
        sa.Column('phone', sa.String(50), nullable=True),
        sa.Column('location', sa.String(255), nullable=True),
        sa.Column('gdrive_file_id', sa.String(255), nullable=True),
        sa.Column('cv_s3_path', sa.String(500), nullable=True),
        sa.Column('raw_cv_text', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('candidate_id'),
        sa.UniqueConstraint('email')
    )

    # candidate_skills table
    op.create_table('candidate_skills',
        sa.Column('skill_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('candidate_id', sa.Integer(), nullable=True),
        sa.Column('skill_name', sa.String(255), nullable=False),
        sa.Column('skill_type', sa.Enum('technical', 'soft'), nullable=True),
        sa.Column('proficiency_level', sa.String(50), nullable=True),
        sa.ForeignKeyConstraint(['candidate_id'], ['candidates.candidate_id']),
        sa.PrimaryKeyConstraint('skill_id')
    )

    # candidate_experience table
    op.create_table('candidate_experience',
        sa.Column('experience_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('candidate_id', sa.Integer(), nullable=True),
        sa.Column('company', sa.String(255), nullable=True),
        sa.Column('position', sa.String(255), nullable=True),
        sa.Column('duration_months', sa.Integer(), nullable=True),
        sa.Column('start_date', sa.String(50), nullable=True),
        sa.Column('end_date', sa.String(50), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['candidate_id'], ['candidates.candidate_id']),
        sa.PrimaryKeyConstraint('experience_id')
    )

    # vacancies table
    op.create_table('vacancies',
        sa.Column('vacancy_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('department', sa.String(255), nullable=True),
        sa.Column('required_experience_years', sa.Float(), nullable=True),
        sa.Column('open_positions', sa.Integer(), nullable=True, default=1),
        sa.Column('requirements', mysql.JSON(), nullable=True),
        sa.Column('values', mysql.JSON(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True, default=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('vacancy_id')
    )

    # evaluations table
    op.create_table('evaluations',
        sa.Column('evaluation_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('candidate_id', sa.Integer(), nullable=True),
        sa.Column('vacancy_id', sa.Integer(), nullable=True),
        sa.Column('compatibility_score', sa.Float(), nullable=True),
        sa.Column('values_alignment_score', sa.Float(), nullable=True),
        sa.Column('requirements_score', sa.Float(), nullable=True),
        sa.Column('experience_relevance_score', sa.Float(), nullable=True),
        sa.Column('stability_score', sa.Float(), nullable=True),
        sa.Column('reasoning', sa.Text(), nullable=True),
        sa.Column('strengths', mysql.JSON(), nullable=True),
        sa.Column('gaps', mysql.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['candidate_id'], ['candidates.candidate_id']),
        sa.ForeignKeyConstraint(['vacancy_id'], ['vacancies.vacancy_id']),
        sa.PrimaryKeyConstraint('evaluation_id')
    )

    # contacts table
    op.create_table('contacts',
        sa.Column('contact_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('candidate_id', sa.Integer(), nullable=True),
        sa.Column('vacancy_id', sa.Integer(), nullable=True),
        sa.Column('contact_method', sa.Enum('email', 'whatsapp', 'phone', 'other'), nullable=True),
        sa.Column('contact_date', sa.DateTime(), nullable=True),
        sa.Column('responsible', sa.String(255), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('status', sa.Enum('sent', 'responded', 'no_response'), nullable=True, default='sent'),
        sa.ForeignKeyConstraint(['candidate_id'], ['candidates.candidate_id']),
        sa.ForeignKeyConstraint(['vacancy_id'], ['vacancies.vacancy_id']),
        sa.PrimaryKeyConstraint('contact_id')
    )

    # interview_feedback table
    op.create_table('interview_feedback',
        sa.Column('feedback_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('candidate_id', sa.Integer(), nullable=True),
        sa.Column('vacancy_id', sa.Integer(), nullable=True),
        sa.Column('interview_date', sa.DateTime(), nullable=True),
        sa.Column('rating', sa.Integer(), nullable=True),
        sa.Column('strengths', sa.Text(), nullable=True),
        sa.Column('improvements', sa.Text(), nullable=True),
        sa.Column('recommendation', sa.Enum('hire', 'second_interview', 'reject', 'pending'), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['candidate_id'], ['candidates.candidate_id']),
        sa.ForeignKeyConstraint(['vacancy_id'], ['vacancies.vacancy_id']),
        sa.PrimaryKeyConstraint('feedback_id')
    )

    # candidate_status table
    op.create_table('candidate_status',
        sa.Column('status_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('candidate_id', sa.Integer(), nullable=True),
        sa.Column('vacancy_id', sa.Integer(), nullable=True),
        sa.Column('status', sa.Enum('en_proceso', 'contratado', 'no_apto', 'en_espera', 'descartado'), nullable=True),
        sa.Column('hire_date', sa.DateTime(), nullable=True),
        sa.Column('changed_at', sa.DateTime(), nullable=True),
        sa.Column('changed_by', sa.String(255), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['candidate_id'], ['candidates.candidate_id']),
        sa.ForeignKeyConstraint(['vacancy_id'], ['vacancies.vacancy_id']),
        sa.PrimaryKeyConstraint('status_id')
    )

    # gdrive_folders table
    op.create_table('gdrive_folders',
        sa.Column('folder_id', sa.String(255), nullable=False),
        sa.Column('folder_name', sa.String(255), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True, default=True),
        sa.Column('last_sync_date', sa.DateTime(), nullable=True),
        sa.Column('added_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('folder_id')
    )

    # gdrive_sync_log table
    op.create_table('gdrive_sync_log',
        sa.Column('sync_id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('folder_id', sa.String(255), nullable=True),
        sa.Column('folder_name', sa.String(255), nullable=True),
        sa.Column('sync_date', sa.DateTime(), nullable=True),
        sa.Column('files_processed', sa.Integer(), nullable=True, default=0),
        sa.Column('files_new', sa.Integer(), nullable=True, default=0),
        sa.Column('files_updated', sa.Integer(), nullable=True, default=0),
        sa.Column('errors_count', sa.Integer(), nullable=True, default=0),
        sa.Column('error_details', mysql.JSON(), nullable=True),
        sa.Column('duration_seconds', sa.Float(), nullable=True),
        sa.PrimaryKeyConstraint('sync_id')
    )


def downgrade():
    op.drop_table('gdrive_sync_log')
    op.drop_table('gdrive_folders')
    op.drop_table('candidate_status')
    op.drop_table('interview_feedback')
    op.drop_table('contacts')
    op.drop_table('evaluations')
    op.drop_table('vacancies')
    op.drop_table('candidate_experience')
    op.drop_table('candidate_skills')
    op.drop_table('candidates')
