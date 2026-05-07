import { create } from 'zustand'
import type { MessageId, ConversationId, MessageStatus, MessageType, MessageDirection } from '@zaptend/types'

export interface Message {
  id: MessageId
  conversationId: ConversationId
  direction: MessageDirection
  type: MessageType
  content: string
  status: MessageStatus
  createdAt: string
  authorId?: string
  authorName?: string
  mediaUrl?: string
}

interface MessagesState {
  messages: Message[]
  currentConversationId: ConversationId | null
  isLoading: boolean
  error: string | null
  setCurrentConversation: (id: ConversationId | null) => void
  fetchMessages: (conversationId: ConversationId) => Promise<void>
  addMessage: (message: Message) => void
  updateMessageStatus: (id: MessageId, status: MessageStatus) => void
  sendMessage: (conversationId: ConversationId, content: string) => Promise<void>
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

export const useMessagesStore = create<MessagesState>((set, get) => ({
  messages: [],
  currentConversationId: null,
  isLoading: false,
  error: null,

  setCurrentConversation: (id) => {
    if (id !== get().currentConversationId) {
      set({ currentConversationId: id, messages: [] })
    }
  },

  fetchMessages: async (conversationId) => {
    set({ isLoading: true, error: null })
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
      const token = getStoredAccessToken()
      const res = await fetch(`${apiUrl}/conversations/${conversationId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Falha ao carregar mensagens')
      const data = (await res.json()) as Message[]
      set({ messages: data, currentConversationId: conversationId, isLoading: false })
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false })
    }
  },

  addMessage: (message) => {
    if (message.conversationId !== get().currentConversationId) return
    set((state) => ({ messages: [...state.messages, message] }))
  },

  updateMessageStatus: (id, status) =>
    set((state) => ({
      messages: state.messages.map((m) => (m.id === id ? { ...m, status } : m)),
    })),

  sendMessage: async (conversationId, content) => {
    const tempId = `temp-${Date.now()}`
    const tempMessage: Message = {
      id: tempId,
      conversationId,
      direction: 'outbound',
      type: 'text',
      content,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }

    if (conversationId === get().currentConversationId) {
      set((state) => ({ messages: [...state.messages, tempMessage] }))
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
      const token = getStoredAccessToken()
      const res = await fetch(`${apiUrl}/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content, type: 'text' }),
      })
      if (!res.ok) throw new Error('Falha ao enviar mensagem')
      const saved = (await res.json()) as Message
      set((state) => ({
        messages: state.messages.map((m) => (m.id === tempId ? saved : m)),
      }))
    } catch {
      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === tempId ? { ...m, status: 'failed' as MessageStatus } : m,
        ),
      }))
      throw new Error('Falha ao enviar mensagem')
    }
  },
}))
