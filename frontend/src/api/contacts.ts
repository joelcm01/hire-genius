import client from './client'

export const generateWhatsAppLink = (candidateId: number, data: {
  name?: string
  vacancy_title: string
  phone: string
  template?: string
}) => client.post(`/contacts/${candidateId}/whatsapp`, data)

export const sendEmailProposal = (candidateId: number, data: {
  vacancy_id?: number
  proposed_times: string[]
  responsible_email?: string
  additional_message?: string
}) => client.post(`/contacts/${candidateId}/email`, data)

export const logContact = (data: {
  candidate_id: number
  vacancy_id?: number
  contact_method: string
  responsible?: string
  notes?: string
  status?: string
}) => client.post('/contacts', data)

export const getCandidateContacts = (candidateId: number) =>
  client.get(`/contacts/${candidateId}`)
