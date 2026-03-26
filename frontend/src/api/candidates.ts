import client from './client'
import type {
  Candidate,
  CandidateListParams,
  PaginatedResponse,
  UpdateStatusPayload,
  Contact,
  InterviewFeedback,
  LogContactPayload,
  AddFeedbackPayload,
} from './types'
import type { AxiosResponse } from 'axios'

export const getCandidates = (
  params?: CandidateListParams,
): Promise<AxiosResponse<PaginatedResponse<Candidate>>> =>
  client.get('/candidates', { params })

export const getCandidate = (id: number): Promise<AxiosResponse<Candidate>> =>
  client.get(`/candidates/${id}`)

export const updateCandidateStatus = (
  id: number,
  data: UpdateStatusPayload,
): Promise<AxiosResponse<Candidate>> =>
  client.post(`/candidates/${id}/status`, data)

export const getCandidateCVUrl = (
  id: number,
): Promise<AxiosResponse<{ url: string; expires_in: number }>> =>
  client.get(`/candidates/${id}/cv-url`)

export const getCandidateContacts = (
  id: number,
): Promise<AxiosResponse<Contact[]>> =>
  client.get(`/contacts/${id}`)

export const logContact = (
  id: number,
  data: LogContactPayload,
): Promise<AxiosResponse<Contact>> =>
  client.post('/contacts', { candidate_id: id, ...data })

export const getCandidateFeedback = (
  id: number,
): Promise<AxiosResponse<InterviewFeedback[]>> =>
  client.get(`/interview-feedback/${id}`)

export const addInterviewFeedback = (
  id: number,
  data: AddFeedbackPayload,
): Promise<AxiosResponse<InterviewFeedback>> =>
  client.post('/interview-feedback', { candidate_id: id, ...data })
