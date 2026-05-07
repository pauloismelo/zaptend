'use client'

import { MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ConversationSummary } from '@/lib/api/contacts'

const STATUS_LABELS: Record<ConversationSummary['status'], string> = {
  open: 'Aberta',
  attending: 'Em Atendimento',
  waiting_customer: 'Aguardando Cliente',
  resolved: 'Resolvida',
  spam: 'Spam',
}

const STATUS_CLASSES: Record<ConversationSummary['status'], string> = {
  open: 'bg-emerald-500/20 text-emerald-400',
  attending: 'bg-blue-500/20 text-blue-400',
  waiting_customer: 'bg-yellow-500/20 text-yellow-400',
  resolved: 'bg-muted text-muted-foreground',
  spam: 'bg-destructive/20 text-destructive',
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—'
  try {
    const d = new Date(dateStr)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  } catch {
    return '—'
  }
}

interface ContactTimelineProps {
  conversations: ConversationSummary[]
}

export function ContactTimeline({ conversations }: ContactTimelineProps) {
  if (conversations.length === 0) {
    return (
      <div
        data-testid="timeline-empty"
        className="flex flex-col items-center justify-center gap-2 py-8 text-center"
      >
        <MessageCircle className="w-8 h-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Nenhuma conversa registrada</p>
      </div>
    )
  }

  return (
    <ul data-testid="timeline-list" className="space-y-2">
      {conversations.map((conv) => (
        <li
          key={conv.id}
          data-testid="timeline-item"
          className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5"
        >
          <MessageCircle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                data-testid={`status-badge-${conv.id}`}
                className={cn(
                  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                  STATUS_CLASSES[conv.status],
                )}
              >
                {STATUS_LABELS[conv.status]}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDate(conv.lastMessageAt)}
              </span>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}
