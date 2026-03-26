import client from './client'
import type { Vacancy, CreateVacancyPayload } from './types'
import type { AxiosResponse } from 'axios'

export const getVacancies = (): Promise<AxiosResponse<Vacancy[]>> =>
  client.get('/vacancies')

export const getVacancy = (id: number): Promise<AxiosResponse<Vacancy>> =>
  client.get(`/vacancies/${id}`)

export const createVacancy = (
  data: CreateVacancyPayload,
): Promise<AxiosResponse<Vacancy>> =>
  client.post('/vacancies', data)

export const updateVacancy = (
  id: number,
  data: Partial<CreateVacancyPayload>,
): Promise<AxiosResponse<Vacancy>> =>
  client.put(`/vacancies/${id}`, data)

export const toggleVacancyActive = (
  id: number,
  is_active: boolean,
): Promise<AxiosResponse<Vacancy>> =>
  client.patch(`/vacancies/${id}`, { is_active })
