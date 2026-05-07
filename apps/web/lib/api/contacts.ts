import { apiClient } from './client'

export interface ContactSummary {
  id: string
  phone: string
  name?: string
  email?: string
  company?: string
  avatarUrl?: string
  tags: string[]
  isBlocked: boolean
  createdAt: string
}

export interface ConversationSummary {
  id: string
  status: 'open' | 'attending' | 'waiting_customer' | 'resolved' | 'spam'
  lastMessageAt?: string
}

export interface ContactDetail extends ContactSummary {
  conversations: ConversationSummary[]
  notes?: string
}

export interface ContactFilters {
  search?: string
  tags?: string[]
  isBlocked?: boolean
  page?: number
  limit?: number
}

export interface ContactsListResponse {
  data: ContactSummary[]
  total: number
  page: number
  limit: number
}

export interface CreateContactData {
  phone: string
  name?: string
  email?: string
  company?: string
  tags?: string[]
  notes?: string
}

export interface UpdateContactData {
  name?: string
  email?: string
  company?: string
  tags?: string[]
  notes?: string
  isBlocked?: boolean
}

export const contactsApi = {
  list: (filters?: ContactFilters) =>
    apiClient
      .get<ContactsListResponse>('/contacts', { params: filters })
      .then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<ContactDetail>(`/contacts/${id}`).then((r) => r.data),

  create: (data: CreateContactData) =>
    apiClient.post<ContactSummary>('/contacts', data).then((r) => r.data),

  update: (id: string, data: UpdateContactData) =>
    apiClient.patch<ContactSummary>(`/contacts/${id}`, data).then((r) => r.data),

  remove: (id: string) =>
    apiClient.delete(`/contacts/${id}`).then((r) => r.data),
}
