'use client'

import { cn } from '@/lib/utils'
import type { Conversation } from '@/stores/conversations.store'
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

export function getInitials(name?: string, phone?: string): string {
  if (name?.trim()) {
    return name
      .trim()
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0].toUpperCase())
      .join('')
  }
  return phone?.slice(-2) ?? '?'
}

export function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr)
    const diffMs = Date.now() - date.getTime()
    const diffMin = Math.floor(diffMs / 60_000)
    const diffH = Math.floor(diffMs / 3_600_000)
    const diffD = Math.floor(diffMs / 86_400_000)
    if (diffMin < 1) return 'agora'
    if (diffMin < 60) return `${diffMin}min`
    if (diffH < 24) return `${diffH}h`
    if (diffD === 1) return 'ontem'
    if (diffD < 7) return ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'][date.getDay()]
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`
  } catch {
    return ''
  }
}

interface ConversationItemProps {
  conversation: Conversation
  isActive?: boolean
  onSelect: (id: string) => void
}

export function ConversationItem({ conversation, isActive, onSelect }: ConversationItemProps) {
  const initials = getInitials(conversation.contactName, conversation.contactPhone)

  return (
    <button
      type="button"
      aria-pressed={isActive}
      data-testid="conversation-item"
      onClick={() => onSelect(conversation.id)}
      className={cn(
        'w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-accent border-b border-border last:border-b-0',
        isActive && 'bg-accent',
      )}
    >
      <div className="relative flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-foreground select-none">
          {initials}
        </div>
        <span
          title={STATUS_LABELS[conversation.status]}
          className={cn(
            'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card',
            STATUS_COLORS[conversation.status],
          )}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-medium text-foreground">
            {conversation.contactName ?? conversation.contactPhone}
          </span>
          <span className="flex-shrink-0 text-xs text-muted-foreground">
            {formatRelativeTime(conversation.lastMessageAt)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className="truncate text-xs text-muted-foreground">
            {conversation.lastMessage ?? 'Sem mensagens'}
          </p>
          {conversation.unreadCount > 0 && (
            <span className="flex-shrink-0 min-w-[1.25rem] h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center px-1">
              {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

export function ConversationItemSkeleton() {
  return (
    <div
      data-testid="conversation-item-skeleton"
      className="flex items-start gap-3 px-4 py-3 animate-pulse border-b border-border"
    >
      <div className="w-10 h-10 rounded-full bg-muted flex-shrink-0" />
      <div className="flex-1 space-y-2 py-1">
        <div className="flex justify-between items-center">
          <div className="h-3.5 bg-muted rounded w-28" />
          <div className="h-3 bg-muted rounded w-8" />
        </div>
        <div className="h-3 bg-muted rounded w-40" />
      </div>
    </div>
  )
}
