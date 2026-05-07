'use client'

import { useEffect } from 'react'
import { io } from 'socket.io-client'
import { useSocketStore } from '@/stores/socket.store'
import { useConversationsStore } from '@/stores/conversations.store'
import { useMessagesStore } from '@/stores/messages.store'
import { useAuthStore } from '@/stores/auth.store'
import type { Conversation } from '@/stores/conversations.store'
import type { Message } from '@/stores/messages.store'

interface SocketPayloadConversationNew {
  conversation: Conversation
}

interface SocketPayloadMessageNew {
  conversationId: string
  message: Message
}

interface SocketPayloadConversationUpdated {
  conversationId: string
  changes: Partial<Conversation>
}

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const tenant = useAuthStore((s) => s.tenant)
  const accessToken = useAuthStore((s) => s.accessToken)

  useEffect(() => {
    if (!tenant?.id || !accessToken) return

    const tenantId = tenant.id
    const socket = io(process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3001', {
      auth: { tenantId, token: accessToken },
    })

    socket.on('connect', () => {
      useSocketStore.setState({ connected: true, socket })
      socket.emit('room:join', { tenantId })
    })

    socket.on('disconnect', () => {
      useSocketStore.setState({ connected: false })
    })

    socket.on('conversation:new', (payload: SocketPayloadConversationNew) => {
      useConversationsStore.getState().addConversation(payload.conversation)
    })

    socket.on('message:new', (payload: SocketPayloadMessageNew) => {
      useMessagesStore.getState().addMessage(payload.message)
      useConversationsStore.getState().updateConversation(payload.conversationId, {
        lastMessageAt: payload.message.createdAt,
      })
    })

    socket.on('conversation:updated', (payload: SocketPayloadConversationUpdated) => {
      useConversationsStore.getState().updateConversation(payload.conversationId, payload.changes)
    })

    return () => {
      socket.emit('room:leave', { tenantId })
      socket.disconnect()
      useSocketStore.setState({ socket: null, connected: false })
    }
  }, [tenant?.id, accessToken])

  return <>{children}</>
}
