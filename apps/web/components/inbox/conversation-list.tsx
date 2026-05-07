'use client'

import { useEffect, useMemo, useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { useConversationsStore } from '@/stores/conversations.store'
import { ConversationItem, ConversationItemSkeleton } from './conversation-item'
import {
  ConversationFilters,
  DEFAULT_INBOX_FILTERS,
  type InboxFilters,
} from './conversation-filters'

export function ConversationList() {
  const {
    conversations,
    isLoading,
    error,
    fetchConversations,
    setActiveConversation,
    activeConversationId,
  } = useConversationsStore()

  const [filters, setFilters] = useState<InboxFilters>(DEFAULT_INBOX_FILTERS)

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  const filtered = useMemo(() => {
    return conversations
      .filter((c) => {
        if (filters.status !== 'all' && c.status !== filters.status) return false
        if (filters.departmentId && c.departmentId !== filters.departmentId) return false
        if (filters.search) {
          const q = filters.search.toLowerCase()
          return (
            (c.contactName?.toLowerCase().includes(q) ?? false) ||
            c.contactPhone.includes(q) ||
            (c.lastMessage?.toLowerCase().includes(q) ?? false)
          )
        }
        return true
      })
      .sort((a, b) => {
        if (!a.lastMessageAt) return 1
        if (!b.lastMessageAt) return -1
        return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
      })
  }, [conversations, filters])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex-shrink-0">
        <h2 className="text-sm font-semibold text-foreground">Conversas</h2>
      </div>

      <ConversationFilters filters={filters} onChange={setFilters} />

      <div className="flex-1 overflow-y-auto" data-testid="conversation-list-scroll">
        {isLoading &&
          Array.from({ length: 5 }).map((_, i) => <ConversationItemSkeleton key={i} />)}

        {!isLoading && error && (
          <div
            className="flex flex-col items-center justify-center gap-2 p-8 text-center"
            data-testid="error-state"
          >
            <p className="text-sm text-destructive">{error}</p>
            <button
              type="button"
              onClick={() => fetchConversations()}
              className="text-xs text-primary hover:underline"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {!isLoading && !error && filtered.length === 0 && (
          <div
            className="flex flex-col items-center justify-center gap-3 p-8 text-center"
            data-testid="empty-state"
          >
            <MessageCircle className="w-10 h-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {filters.search || filters.status !== 'all'
                ? 'Nenhuma conversa encontrada'
                : 'Nenhuma conversa ainda'}
            </p>
          </div>
        )}

        {!isLoading &&
          !error &&
          filtered.map((conv) => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isActive={activeConversationId === conv.id}
              onSelect={setActiveConversation}
            />
          ))}
      </div>
    </div>
  )
}
