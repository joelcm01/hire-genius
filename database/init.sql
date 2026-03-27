-- =============================================================
-- HireGenius Database Initialization Script
-- MySQL 8.0 | utf8mb4 | hire_genius
-- =============================================================

CREATE DATABASE IF NOT EXISTS hire_genius
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'hgenius'@'%' IDENTIFIED BY 'hgenius_pass';
GRANT ALL PRIVILEGES ON hire_genius.* TO 'hgenius'@'%';
FLUSH PRIVILEGES;

USE hire_genius;

-- =============================================================
-- TABLES
-- =============================================================

-- candidates
CREATE TABLE candidates (
  candidate_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(50),
  location VARCHAR(255),
  gdrive_file_id VARCHAR(500) UNIQUE,
  cv_s3_path VARCHAR(1000),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (candidate_id),
  INDEX idx_candidates_email (email),
  INDEX idx_candidates_gdrive (gdrive_file_id)
);

-- candidate_skills
CREATE TABLE candidate_skills (
  skill_id CHAR(36) NOT NULL,
  candidate_id CHAR(36) NOT NULL,
  skill_name VARCHAR(255) NOT NULL,
  skill_type ENUM('Technical', 'Soft') NOT NULL DEFAULT 'Technical',
  proficiency_level VARCHAR(100),
  PRIMARY KEY (skill_id),
  FOREIGN KEY (candidate_id) REFERENCES candidates(candidate_id) ON DELETE CASCADE,
  INDEX idx_skills_candidate (candidate_id)
);

-- candidate_experience
CREATE TABLE candidate_experience (
  experience_id CHAR(36) NOT NULL,
  candidate_id CHAR(36) NOT NULL,
  company VARCHAR(255) NOT NULL,
  position VARCHAR(255) NOT NULL,
  start_date DATE,
  end_date DATE,
  duration_months INT,
  PRIMARY KEY (experience_id),
  FOREIGN KEY (candidate_id) REFERENCES candidates(candidate_id) ON DELETE CASCADE,
  INDEX idx_experience_candidate (candidate_id)
);

-- vacancies
CREATE TABLE vacancies (
  vacancy_id CHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  department VARCHAR(255) NOT NULL,
  description TEXT,
  requirements JSON,
  `values` JSON,
  required_experience_years INT DEFAULT 0,
  open_positions INT DEFAULT 1,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (vacancy_id),
  INDEX idx_vacancies_active (is_active)
);

-- evaluations
CREATE TABLE evaluations (
  evaluation_id CHAR(36) NOT NULL,
  candidate_id CHAR(36) NOT NULL,
  vacancy_id CHAR(36) NOT NULL,
  compatibility_score DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  reasoning TEXT,
  strengths JSON,
  gaps JSON,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (evaluation_id),
  UNIQUE KEY uq_evaluation_candidate_vacancy (candidate_id, vacancy_id),
  FOREIGN KEY (candidate_id) REFERENCES candidates(candidate_id) ON DELETE CASCADE,
  FOREIGN KEY (vacancy_id) REFERENCES vacancies(vacancy_id) ON DELETE CASCADE,
  INDEX idx_evaluations_vacancy (vacancy_id),
  INDEX idx_evaluations_score (compatibility_score DESC)
);

-- contacts
CREATE TABLE contacts (
  contact_id CHAR(36) NOT NULL,
  candidate_id CHAR(36) NOT NULL,
  vacancy_id CHAR(36),
  contact_method ENUM('Email', 'WhatsApp', 'Phone') NOT NULL,
  contact_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  responsible VARCHAR(255),
  notes TEXT,
  whatsapp_url VARCHAR(2000),
  PRIMARY KEY (contact_id),
  FOREIGN KEY (candidate_id) REFERENCES candidates(candidate_id) ON DELETE CASCADE,
  INDEX idx_contacts_candidate (candidate_id)
);

-- interview_feedback
CREATE TABLE interview_feedback (
  feedback_id CHAR(36) NOT NULL,
  candidate_id CHAR(36) NOT NULL,
  vacancy_id CHAR(36) NOT NULL,
  rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  strengths TEXT,
  areas_for_improvement TEXT,
  recommendation ENUM('Hire', 'Reject', 'Maybe') NOT NULL,
  notes TEXT,
  interviewer VARCHAR(255),
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (feedback_id),
  FOREIGN KEY (candidate_id) REFERENCES candidates(candidate_id) ON DELETE CASCADE,
  FOREIGN KEY (vacancy_id) REFERENCES vacancies(vacancy_id) ON DELETE CASCADE,
  INDEX idx_feedback_candidate (candidate_id)
);

-- candidate_status
CREATE TABLE candidate_status (
  status_id CHAR(36) NOT NULL,
  candidate_id CHAR(36) NOT NULL,
  vacancy_id CHAR(36),
  status ENUM('en_proceso', 'contratado', 'no_apto', 'en_espera', 'descartado') NOT NULL DEFAULT 'en_proceso',
  hire_date DATE,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (status_id),
  UNIQUE KEY uq_status_candidate_vacancy (candidate_id, vacancy_id),
  FOREIGN KEY (candidate_id) REFERENCES candidates(candidate_id) ON DELETE CASCADE,
  INDEX idx_status_candidate (candidate_id),
  INDEX idx_status_value (status)
);

-- gdrive_folders
CREATE TABLE gdrive_folders (
  folder_id CHAR(36) NOT NULL,
  gdrive_folder_id VARCHAR(500) NOT NULL UNIQUE,
  folder_name VARCHAR(255) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (folder_id)
);

-- gdrive_sync_log
CREATE TABLE gdrive_sync_log (
  sync_id CHAR(36) NOT NULL,
  folder_id CHAR(36),
  sync_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  files_processed INT DEFAULT 0,
  files_new INT DEFAULT 0,
  files_updated INT DEFAULT 0,
  errors_count INT DEFAULT 0,
  duration_seconds DECIMAL(8,2),
  error_details JSON,
  PRIMARY KEY (sync_id),
  FOREIGN KEY (folder_id) REFERENCES gdrive_folders(folder_id) ON DELETE SET NULL,
  INDEX idx_sync_log_date (sync_date DESC)
);

-- =============================================================
-- SEED DATA
-- =============================================================

-- Vacancies
INSERT INTO vacancies (vacancy_id, title, department, description, requirements, `values`, required_experience_years, open_positions, is_active)
VALUES
(
  '11111111-1111-1111-1111-111111111111',
  'Senior Software Engineer',
  'Engineering',
  'We are looking for a Senior Software Engineer to join our backend platform team. You will design and build scalable microservices, collaborate with cross-functional teams, and mentor junior engineers.',
  JSON_ARRAY('C# / .NET 8', 'ASP.NET Core REST APIs', 'MySQL or PostgreSQL', 'Docker & Kubernetes', 'CI/CD pipelines', 'System design'),
  JSON_ARRAY('Ownership mindset', 'Continuous learning', 'Collaborative spirit', 'Attention to detail'),
  4,
  2,
  1
),
(
  '22222222-2222-2222-2222-222222222222',
  'HR Manager',
  'Human Resources',
  'We are seeking an experienced HR Manager to lead talent acquisition, employee relations, and HR operations. You will partner with leadership to drive people-first strategies.',
  JSON_ARRAY('5+ years HR experience', 'Talent acquisition expertise', 'Labor law knowledge', 'HRIS systems', 'Strong communication skills'),
  JSON_ARRAY('Empathy', 'Integrity', 'Strategic thinking', 'Team player'),
  5,
  1,
  1
);

-- Candidates
INSERT INTO candidates (candidate_id, name, email, phone, location, gdrive_file_id, cv_s3_path)
VALUES
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Ana Garcia',
  'ana.garcia@example.com',
  '+34 612 345 678',
  'Madrid, Spain',
  'gdrive_file_001',
  'cvs/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/ana_garcia_cv.pdf'
),
(
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  'Carlos Lopez',
  'carlos.lopez@example.com',
  '+34 623 456 789',
  'Barcelona, Spain',
  'gdrive_file_002',
  'cvs/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb/carlos_lopez_cv.pdf'
),
(
  'cccccccc-cccc-cccc-cccc-cccccccccccc',
  'Maria Santos',
  'maria.santos@example.com',
  '+34 634 567 890',
  'Valencia, Spain',
  'gdrive_file_003',
  'cvs/cccccccc-cccc-cccc-cccc-cccccccccccc/maria_santos_cv.pdf'
);

-- Candidate Skills
INSERT INTO candidate_skills (skill_id, candidate_id, skill_name, skill_type, proficiency_level)
VALUES
-- Ana Garcia (Software Engineer profile)
('sk000001-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'C#', 'Technical', 'Expert'),
('sk000001-0000-0000-0000-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '.NET 8', 'Technical', 'Expert'),
('sk000001-0000-0000-0000-000000000003', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ASP.NET Core', 'Technical', 'Advanced'),
('sk000001-0000-0000-0000-000000000004', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'MySQL', 'Technical', 'Advanced'),
('sk000001-0000-0000-0000-000000000005', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Docker', 'Technical', 'Intermediate'),
('sk000001-0000-0000-0000-000000000006', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Problem Solving', 'Soft', 'Expert'),
-- Carlos Lopez (Software Engineer profile)
('sk000002-0000-0000-0000-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'C#', 'Technical', 'Advanced'),
('sk000002-0000-0000-0000-000000000002', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '.NET 6', 'Technical', 'Advanced'),
('sk000002-0000-0000-0000-000000000003', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Azure', 'Technical', 'Intermediate'),
('sk000002-0000-0000-0000-000000000004', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Kubernetes', 'Technical', 'Intermediate'),
('sk000002-0000-0000-0000-000000000005', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Teamwork', 'Soft', 'Expert'),
-- Maria Santos (HR Manager profile)
('sk000003-0000-0000-0000-000000000001', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Talent Acquisition', 'Technical', 'Expert'),
('sk000003-0000-0000-0000-000000000002', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'HRIS Systems', 'Technical', 'Advanced'),
('sk000003-0000-0000-0000-000000000003', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Labor Law', 'Technical', 'Advanced'),
('sk000003-0000-0000-0000-000000000004', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Employee Relations', 'Technical', 'Expert'),
('sk000003-0000-0000-0000-000000000005', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Empathy', 'Soft', 'Expert'),
('sk000003-0000-0000-0000-000000000006', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Communication', 'Soft', 'Expert');

-- Candidate Experience
INSERT INTO candidate_experience (experience_id, candidate_id, company, position, start_date, end_date, duration_months)
VALUES
-- Ana Garcia
('ex000001-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Accenture', 'Software Engineer', '2019-03-01', '2022-06-30', 39),
('ex000001-0000-0000-0000-000000000002', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Telefonica', 'Senior Software Engineer', '2022-07-01', NULL, NULL),
-- Carlos Lopez
('ex000002-0000-0000-0000-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Indra', 'Junior Developer', '2018-09-01', '2020-08-31', 24),
('ex000002-0000-0000-0000-000000000002', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'BBVA', 'Software Engineer', '2020-09-01', '2024-01-31', 40),
('ex000002-0000-0000-0000-000000000003', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Glovo', 'Senior Engineer', '2024-02-01', NULL, NULL),
-- Maria Santos
('ex000003-0000-0000-0000-000000000001', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Randstad', 'HR Recruiter', '2017-01-01', '2020-12-31', 48),
('ex000003-0000-0000-0000-000000000002', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Santander', 'HR Business Partner', '2021-01-01', '2023-06-30', 30),
('ex000003-0000-0000-0000-000000000003', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'Mango', 'HR Manager', '2023-07-01', NULL, NULL);

-- Candidate Status
INSERT INTO candidate_status (status_id, candidate_id, vacancy_id, status)
VALUES
('st000001-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'en_proceso'),
('st000002-0000-0000-0000-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'en_espera'),
('st000003-0000-0000-0000-000000000001', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '22222222-2222-2222-2222-222222222222', 'en_proceso');
