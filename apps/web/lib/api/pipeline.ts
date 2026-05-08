import { apiClient } from './client'

export interface PipelineContact {
  id: string
  phone: string
  name: string | null
  company: string | null
  tags: string[]
}

export interface PipelineAgent {
  id: string
  name: string
  email: string
}

export interface PipelineConversation {
  id: string
  status: string
  subject: string | null
  tags: string[]
  pipelineStage: string | null
  pipelineValue: string | number | null
  lastMessageAt: string | null
  assignedUserId: string | null
  departmentId: string | null
  contact?: PipelineContact
  assignedUser?: PipelineAgent | null
}

interface PaginatedPipelineResponse {
  data: PipelineConversation[]
}

export interface PipelineFilters {
  assignedUserId?: string
  departmentId?: string
}

export const pipelineApi = {
  async list(filters: PipelineFilters = {}) {
    const { data } = await apiClient.get<PaginatedPipelineResponse>('/conversations', {
      params: { limit: 100, ...filters },
    })
    return data.data
  },

  async moveConversation(id: string, pipelineStage: string) {
    const { data } = await apiClient.patch<PipelineConversation>(`/conversations/${id}`, {
      pipelineStage,
    })
    return data
  },
}
