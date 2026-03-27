export interface InterviewFeedback {
  feedbackId: string;
  candidateId: string;
  vacancyId: string;
  rating: number;
  strengths: string;
  areasForImprovement: string;
  recommendation: 'Hire' | 'Reject' | 'Maybe';
  notes?: string;
  interviewer: string;
  createdAt: string;
}

export interface CreateFeedbackDto {
  candidateId: string;
  vacancyId: string;
  rating: number;
  strengths: string;
  areasForImprovement: string;
  recommendation: 'Hire' | 'Reject' | 'Maybe';
  notes?: string;
  interviewer: string;
}
