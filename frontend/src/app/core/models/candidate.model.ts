export interface Candidate {
  candidateId: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  gdriveFileId?: string;
  cvS3Path?: string;
  createdAt: string;
  skills?: CandidateSkill[];
  experience?: CandidateExperience[];
  latestStatus?: CandidateStatus;
  evaluations?: Evaluation[];
}

export interface CandidateSkill {
  skillId: string;
  skillName: string;
  skillType: 'Technical' | 'Soft';
  proficiencyLevel: string;
}

export interface CandidateExperience {
  experienceId: string;
  company: string;
  position: string;
  startDate: string;
  endDate?: string;
  durationMonths: number;
}

export type CandidateStatusEnum =
  | 'en_proceso'
  | 'contratado'
  | 'no_apto'
  | 'en_espera'
  | 'descartado';

export interface CandidateStatus {
  statusId: string;
  status: CandidateStatusEnum;
  vacancyId?: string;
  hireDate?: string;
}

export interface Evaluation {
  evaluationId: string;
  candidateId: string;
  candidateName?: string;
  vacancyId: string;
  vacancyTitle?: string;
  compatibilityScore: number;
  reasoning: string;
  strengths: string[];
  gaps: string[];
  createdAt: string;
}

export interface CandidateListParams {
  search?: string;
  status?: CandidateStatusEnum;
  page?: number;
  pageSize?: number;
}
