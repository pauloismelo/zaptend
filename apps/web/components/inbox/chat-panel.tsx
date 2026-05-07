'use client'

import { useEffect, useRef, useCallback } from 'react'
import { Phone, MoreVertical, User, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useConversationsStore } from '@/stores/conversations.store'
import { useMessagesStore } from '@/stores/messages.store'
import { MessageItem, MessageItemSkeleton } from './message-item'
import { MessageInput } from './message-input'
import type { ConversationStatus } from '@zaptend/types'

const STATUS_LABELS: Record<ConversationStatus, string> = {
  open: 'Aberta',
  attending: 'Em Atendimento',
  waiting_customer: 'Aguardando Cliente',
  resolved: 'Resolvida',
  spam: 'Spam',
}

const STATUS_COLORS: Record<ConversationStatus, string> = {
  open: 'bg-emerald-500',
  attending: 'bg-blue-500',
  waiting_customer: 'bg-yellow-500',
  resolved: 'bg-gray-400',
  spam: 'bg-destructive',
}

export function ChatPanel() {
  const { conversations, activeConversationId } = useConversationsStore()
  const { messages, isLoading, fetchMessages, setCurrentConversation } = useMessagesStore()
  const bottomRef = useRef<HTMLDivElement>(null)

  const activeConversation = conversations.find((c) => c.id === activeConversationId) ?? null

  useEffect(() => {
    if (!activeConversationId) return
    setCurrentConversation(activeConversationId)
    fetchMessages(activeConversationId)
  }, [activeConversationId, fetchMessages, setCurrentConversation])

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  if (!activeConversationId || !activeConversation) {
    return (
      <div
        data-testid="chat-panel-empty"
        className="flex flex-1 flex-col items-center justify-center gap-4 text-center px-8"
      >
        <MessageCircle className="w-16 h-16 text-muted-foreground" />
        <div>
          <p className="text-foreground font-medium">Selecione uma conversa</p>
          <p className="text-sm text-muted-foreground mt-1">
            Escolha uma conversa na lista ao lado para começar
          </p>
        </div>
      </div>
    )
  }

  return (
    <div data-testid="chat-panel" className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card flex-shrink-0">
        <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-foreground truncate">
              {activeConversation.contactName ?? activeConversation.contactPhone}
            </span>
            <span
              className={cn(
                'flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium text-white',
                STATUS_COLORS[activeConversation.status],
              )}
            >
              {STATUS_LABELS[activeConversation.status]}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{activeConversation.contactPhone}</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            aria-label="Ligar"
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Phone className="w-4 h-4" />
          </button>
          <button
            type="button"
            aria-label="Mais opções"
            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        data-testid="messages-container"
        className="flex-1 overflow-y-auto px-4 py-4 flex flex-col"
      >
        {isLoading &&
          Array.from({ length: 5 }).map((_, i) => <MessageItemSkeleton key={i} />)}

        {!isLoading && messages.length === 0 && (
          <div className="flex-1 flex items-center justify-center" data-testid="no-messages">
            <p className="text-sm text-muted-foreground">Nenhuma mensagem ainda</p>
          </div>
        )}

        {!isLoading && messages.map((msg) => <MessageItem key={msg.id} message={msg} />)}

        <div ref={bottomRef} />
      </div>

      <MessageInput conversationId={activeConversationId} onMessageSent={scrollToBottom} />
    </div>
  )
}
