'use client'

import { create } from 'zustand'
import type { ConversationId, ConversationStatus } from '@zaptend/types'

interface Conversation {
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
  setActiveConversation: (id: ConversationId | null) => void
  setLoading: (loading: boolean) => void
  fetchConversations: () => Promise<void>
}

export const useConversationsStore = create<ConversationsState>((set, get) => ({
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
  setActiveConversation: (activeConversationId) => set({ activeConversationId }),
  setLoading: (isLoading) => set({ isLoading }),
  fetchConversations: async () => {
    set({ isLoading: true, error: null })
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
      const { tokens } = get() as { tokens: { accessToken: string } | null }
      const res = await fetch(`${apiUrl}/conversations`, {
        headers: { Authorization: `Bearer ${tokens?.accessToken}` },
      })
      if (!res.ok) throw new Error('Falha ao carregar conversas')
      const data = await res.json()
      set({ conversations: data, isLoading: false })
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false })
    }
  },
}))
