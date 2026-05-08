import { create } from 'zustand'
import { pipelineApi } from '@/lib/api/pipeline'
import type { PipelineConversation, PipelineFilters } from '@/lib/api/pipeline'

export interface PipelineColumn {
  id: string
  title: string
  color: string
}

export const DEFAULT_PIPELINE_COLUMNS: PipelineColumn[] = [
  { id: 'new', title: 'Novo', color: 'bg-sky-500' },
  { id: 'qualified', title: 'Qualificado', color: 'bg-emerald-500' },
  { id: 'proposal', title: 'Proposta', color: 'bg-amber-500' },
  { id: 'won', title: 'Ganho', color: 'bg-teal-600' },
  { id: 'lost', title: 'Perdido', color: 'bg-rose-500' },
]

interface PipelineState {
  columns: PipelineColumn[]
  conversations: PipelineConversation[]
  filters: PipelineFilters
  isLoading: boolean
  isMoving: boolean
  error: string | null

  setColumns: (columns: PipelineColumn[]) => void
  setFilters: (filters: PipelineFilters) => void
  fetchPipeline: () => Promise<void>
  moveConversation: (conversationId: string, stageId: string) => Promise<void>
}

export const usePipelineStore = create<PipelineState>((set, get) => ({
  columns: DEFAULT_PIPELINE_COLUMNS,
  conversations: [],
  filters: {},
  isLoading: false,
  isMoving: false,
  error: null,

  setColumns: (columns) => set({ columns }),
  setFilters: (filters) => set({ filters }),

  fetchPipeline: async () => {
    set({ isLoading: true, error: null })
    try {
      const conversations = await pipelineApi.list(get().filters)
      set({ conversations, isLoading: false })
    } catch (err) {
      set({ error: getErrorMessage(err, 'Erro ao carregar pipeline'), isLoading: false })
    }
  },

  moveConversation: async (conversationId, stageId) => {
    const previous = get().conversations
    set({
      isMoving: true,
      error: null,
      conversations: previous.map((conversation) =>
        conversation.id === conversationId
          ? { ...conversation, pipelineStage: stageId }
          : conversation,
      ),
    })

    try {
      const updated = await pipelineApi.moveConversation(conversationId, stageId)
      set((state) => ({
        isMoving: false,
        conversations: state.conversations.map((conversation) =>
          conversation.id === conversationId ? { ...conversation, ...updated } : conversation,
        ),
      }))
    } catch (err) {
      set({ conversations: previous, isMoving: false, error: getErrorMessage(err, 'Erro ao mover card') })
      throw err
    }
  },
}))

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message
  if (err && typeof err === 'object' && 'response' in err) {
    const response = (err as { response?: { data?: { message?: string } } }).response
    return response?.data?.message ?? fallback
  }
  return fallback
}
