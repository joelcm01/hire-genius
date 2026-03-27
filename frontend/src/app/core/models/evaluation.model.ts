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

export interface CreateEvaluationDto {
  candidateId: string;
  vacancyId: string;
}
