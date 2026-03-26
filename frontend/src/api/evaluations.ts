import client from './client'
import type { Evaluation, EvaluatePayload } from './types'
import type { AxiosResponse } from 'axios'

export const evaluateCandidate = (
  data: EvaluatePayload,
): Promise<AxiosResponse<Evaluation>> =>
  client.post('/evaluations', data)

export const evaluateAllCandidates = (
  vacancyId: number,
): Promise<AxiosResponse<{ evaluated: number; errors: number }>> =>
  client.post(`/evaluations/vacancy/${vacancyId}/evaluate-all`)

export const getVacancyRanking = (
  vacancyId: number,
): Promise<AxiosResponse<Evaluation[]>> =>
  client.get(`/evaluations/vacancy/${vacancyId}`)

export const getCandidateEvaluations = (
  candidateId: number,
): Promise<AxiosResponse<Evaluation[]>> =>
  client.get(`/evaluations/candidate/${candidateId}`)

export const generateReport = (
  vacancyId: number,
  candidateIds: number[],
): Promise<AxiosResponse<Blob>> =>
  client.get(
    `/reports/interview-compilation`,
    {
      params: { vacancy_id: vacancyId, candidate_ids: candidateIds.join(',') },
      responseType: 'blob',
    },
  )
