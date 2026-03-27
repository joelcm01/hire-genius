export interface Vacancy {
  vacancyId: string;
  title: string;
  department: string;
  description: string;
  requirements: string[];
  values: string[];
  requiredExperienceYears: number;
  openPositions: number;
  isActive: boolean;
  createdAt: string;
}

export interface CreateVacancyDto {
  title: string;
  department: string;
  description: string;
  requirements: string[];
  values: string[];
  requiredExperienceYears: number;
  openPositions: number;
  isActive?: boolean;
}

export interface RankedCandidate {
  candidateId: string;
  name: string;
  email: string;
  compatibilityScore: number;
  reasoning: string;
  strengths: string[];
  gaps: string[];
  status?: string;
  whatsappUrl?: string;
  rank?: number;
}
