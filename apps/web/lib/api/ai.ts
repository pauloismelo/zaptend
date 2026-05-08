import { apiClient } from './client'

export interface AiSuggestionResponse {
  suggestion: string
}

export interface AiSummaryResponse {
  bullets: string[]
}

export interface AiIntentResponse {
  intent: 'suporte' | 'compra' | 'cancelamento' | 'reclamação' | 'dúvida'
}

export interface MoodItem {
  id: string
  sentiment: 'positive' | 'neutral' | 'negative' | 'urgent'
  sentimentScore: number
  content: string | null
  createdAt: string
}

export const aiApi = {
  async suggest(conversationId: string, instruction?: string) {
    const { data } = await apiClient.post<AiSuggestionResponse>(
      `/conversations/${conversationId}/ai/suggest`,
      { instruction },
    )
    return data
  },

  async summarize(conversationId: string) {
    const { data } = await apiClient.post<AiSummaryResponse>(`/conversations/${conversationId}/ai/summarize`)
    return data
  },

  async intent(conversationId: string) {
    const { data } = await apiClient.post<AiIntentResponse>(`/conversations/${conversationId}/ai/intent`)
    return data
  },

  async mood(conversationId: string) {
    const { data } = await apiClient.get<MoodItem[]>(`/conversations/${conversationId}/mood`)
    return data
  },
}
