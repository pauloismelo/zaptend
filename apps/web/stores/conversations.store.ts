import { create } from 'zustand'
import type { ConversationId, ConversationStatus } from '@zaptend/types'

export interface Conversation {
  id: ConversationId
  status: ConversationStatus
  contactName?: string
  contactPhone: string
  lastMessage?: string
  lastMessageAt?: string
  assignedUserId?: string
  departmentId?: string
  unreadCount: number
}

interface ConversationsState {
  conversations: Conversation[]
  activeConversationId: ConversationId | null
  isLoading: boolean
  error: string | null
  setConversations: (conversations: Conversation[]) => void
  addConversation: (conversation: Conversation) => void
  updateConversation: (id: ConversationId, changes: Partial<Conversation>) => void
  removeConversation: (id: ConversationId) => void
  setActiveConversation: (id: ConversationId | null) => void
  fetchConversations: () => Promise<void>
}

function getStoredAccessToken(): string | null {
  try {
    const raw = localStorage.getItem('zaptend-auth')
    if (!raw) return null
    const parsed = JSON.parse(raw) as { state?: { accessToken?: string } }
    return parsed?.state?.accessToken ?? null
  } catch {
    return null
  }
}

export const useConversationsStore = create<ConversationsState>((set) => ({
  conversations: [],
  activeConversationId: null,
  isLoading: false,
  error: null,

  setConversations: (conversations) => set({ conversations }),

  addConversation: (conversation) =>
    set((state) => ({ conversations: [conversation, ...state.conversations] })),

  updateConversation: (id, changes) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === id ? { ...c, ...changes } : c,
      ),
    })),

  removeConversation: (id) =>
    set((state) => ({
      conversations: state.conversations.filter((c) => c.id !== id),
    })),

  setActiveConversation: (activeConversationId) => set({ activeConversationId }),

  fetchConversations: async () => {
    set({ isLoading: true, error: null })
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
      const token = getStoredAccessToken()
      const res = await fetch(`${apiUrl}/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Falha ao carregar conversas')
      const data = (await res.json()) as Conversation[]
      set({ conversations: data, isLoading: false })
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false })
    }
  },
}))
