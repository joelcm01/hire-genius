import client from './client'

export const createFeedback = (data: {
  candidate_id: number
  vacancy_id: number
  interview_date?: string
  rating: number
  strengths: string
  improvements: string
  recommendation: string
  notes?: string
}) => client.post('/interview-feedback', data)

export const getCandidateFeedback = (candidateId: number) =>
  client.get(`/interview-feedback/${candidateId}`)
