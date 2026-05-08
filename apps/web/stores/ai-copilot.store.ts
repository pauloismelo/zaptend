import { create } from 'zustand'
import { aiApi } from '@/lib/api/ai'

interface AiCopilotState {
  suggestion: string | null
  summary: string[]
  intent: string | null
  isSuggesting: boolean
  isSummarizing: boolean
  isDetectingIntent: boolean
  error: string | null

  suggestReply: (conversationId: string) => Promise<string>
  summarize: (conversationId: string) => Promise<string[]>
  detectIntent: (conversationId: string) => Promise<string>
  clear: () => void
}

export const useAiCopilotStore = create<AiCopilotState>((set) => ({
  suggestion: null,
  summary: [],
  intent: null,
  isSuggesting: false,
  isSummarizing: false,
  isDetectingIntent: false,
  error: null,

  suggestReply: async (conversationId) => {
    set({ isSuggesting: true, error: null })
    try {
      const response = await aiApi.suggest(conversationId)
      set({ suggestion: response.suggestion, isSuggesting: false })
      return response.suggestion
    } catch (err) {
      set({ error: getErrorMessage(err, 'Erro ao sugerir resposta'), isSuggesting: false })
      throw err
    }
  },

  summarize: async (conversationId) => {
    set({ isSummarizing: true, error: null })
    try {
      const response = await aiApi.summarize(conversationId)
      set({ summary: response.bullets, isSummarizing: false })
      return response.bullets
    } catch (err) {
      set({ error: getErrorMessage(err, 'Erro ao resumir conversa'), isSummarizing: false })
      throw err
    }
  },

  detectIntent: async (conversationId) => {
    set({ isDetectingIntent: true, error: null })
    try {
      const response = await aiApi.intent(conversationId)
      set({ intent: response.intent, isDetectingIntent: false })
      return response.intent
    } catch (err) {
      set({ error: getErrorMessage(err, 'Erro ao detectar intenção'), isDetectingIntent: false })
      throw err
    }
  },

  clear: () => set({ suggestion: null, summary: [], intent: null, error: null }),
}))

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message
  if (err && typeof err === 'object' && 'response' in err) {
    const response = (err as { response?: { data?: { message?: string } } }).response
    return response?.data?.message ?? fallback
  }
  return fallback
}
