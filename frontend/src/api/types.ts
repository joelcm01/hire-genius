export interface Candidate {
  candidate_id: number
  name: string
  email: string
  phone: string
  location: string
  gdrive_file_id: string
  cv_s3_path: string
  created_at: string
  skills: CandidateSkill[]
  experiences: CandidateExperience[]
  latest_status?: CandidateStatus
}

export interface CandidateSkill {
  skill_id: number
  skill_name: string
  skill_type: 'technical' | 'soft'
  proficiency_level: string
}

export interface CandidateExperience {
  experience_id: number
  company: string
  position: string
  duration_months: number
  start_date: string
  end_date: string
  description: string
}

export interface Vacancy {
  vacancy_id: number
  title: string
  department: string
  required_experience_years: number
  open_positions: number
  requirements: string[]
  values: string[]
  description: string
  is_active: boolean
  created_at: string
}

export interface Evaluation {
  evaluation_id: number
  candidate_id: number
  vacancy_id: number
  compatibility_score: number
  values_alignment_score: number
  requirements_score: number
  experience_relevance_score: number
  stability_score: number
  reasoning: string
  strengths: string[]
  gaps: string[]
  created_at: string
  candidate?: Candidate
}

export interface CandidateStatus {
  status: 'en_proceso' | 'contratado' | 'no_apto' | 'en_espera' | 'descartado'
  hire_date?: string
  changed_at: string
}

export interface Contact {
  contact_id: number
  contact_method: string
  contact_date: string
  responsible: string
  notes: string
}

export interface InterviewFeedback {
  feedback_id: number
  interview_date: string
  rating: number
  strengths: string
  improvements: string
  recommendation: string
  notes: string
}

export interface SyncStatus {
  last_sync?: string
  files_processed: number
  files_new: number
  files_updated: number
  errors_count: number
  duration_seconds: number
}

export interface GDriveFolder {
  folder_id: string
  folder_name: string
  is_active: boolean
  last_sync_date?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}

export interface CandidateListParams {
  search?: string
  status?: CandidateStatus['status'] | ''
  page?: number
  page_size?: number
}

export interface CreateVacancyPayload {
  title: string
  department: string
  required_experience_years: number
  open_positions: number
  requirements: string[]
  values: string[]
  description: string
}

export interface UpdateStatusPayload {
  status: CandidateStatus['status']
  hire_date?: string
  notes?: string
}

export interface EvaluatePayload {
  candidate_id: number
  vacancy_id: number
}

export interface LogContactPayload {
  contact_method: string
  contact_date: string
  responsible: string
  notes: string
}

export interface AddFeedbackPayload {
  interview_date: string
  rating: number
  strengths: string
  improvements: string
  recommendation: string
  notes: string
}

export interface AddFolderPayload {
  folder_id: string
}
