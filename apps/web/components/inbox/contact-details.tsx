'use client'

import { Phone, Mail, Building, User, Clock, MessageSquare } from 'lucide-react'
import { useConversationsStore } from '@/stores/conversations.store'
import { getInitials } from './conversation-item'
import type { ConversationStatus } from '@zaptend/types'

const STATUS_LABELS: Record<ConversationStatus, string> = {
  open: 'Aberta',
  attending: 'Em Atendimento',
  waiting_customer: 'Aguardando Cliente',
  resolved: 'Resolvida',
  spam: 'Spam',
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return '—'
  }
}

interface DetailRowProps {
  icon: React.ElementType
  label: string
  value: React.ReactNode
}

function DetailRow({ icon: Icon, label, value }: DetailRowProps) {
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm text-foreground break-words">{value}</p>
      </div>
    </div>
  )
}

export function ContactDetails() {
  const { conversations, activeConversationId } = useConversationsStore()
  const conversation = conversations.find((c) => c.id === activeConversationId) ?? null

  if (!conversation) {
    return (
      <div
        data-testid="contact-details-empty"
        className="flex flex-col items-center justify-center h-full gap-3 text-center px-4"
      >
        <User className="w-10 h-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Selecione uma conversa para ver os detalhes do contato
        </p>
      </div>
    )
  }

  const initials = getInitials(conversation.contactName, conversation.contactPhone)

  return (
    <div data-testid="contact-details" className="flex flex-col h-full overflow-y-auto">
      <div className="flex flex-col items-center gap-3 px-4 py-6 border-b border-border flex-shrink-0">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-xl font-semibold text-foreground">
          {initials}
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-foreground">
            {conversation.contactName ?? 'Contato sem nome'}
          </h3>
          <p className="text-sm text-muted-foreground">{conversation.contactPhone}</p>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
          {STATUS_LABELS[conversation.status]}
        </span>
      </div>

      <div className="px-4 py-2 border-b border-border">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
          Contato
        </h4>
        <DetailRow icon={Phone} label="Telefone" value={conversation.contactPhone} />
        <DetailRow icon={Mail} label="E-mail" value="—" />
      </div>

      <div className="px-4 py-2 border-b border-border">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
          Conversa
        </h4>
        <DetailRow
          icon={Building}
          label="Departamento"
          value={conversation.departmentId ?? '—'}
        />
        <DetailRow
          icon={User}
          label="Responsável"
          value={conversation.assignedUserId ?? 'Não atribuído'}
        />
        <DetailRow
          icon={MessageSquare}
          label="Não lidas"
          value={
            conversation.unreadCount > 0
              ? `${conversation.unreadCount} ${conversation.unreadCount > 1 ? 'mensagens' : 'mensagem'}`
              : 'Nenhuma'
          }
        />
        <DetailRow
          icon={Clock}
          label="Última mensagem"
          value={formatDate(conversation.lastMessageAt)}
        />
      </div>

      <div className="px-4 py-3">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Tags
        </h4>
        <div className="flex flex-wrap gap-1" data-testid="tags-container">
          <span className="text-xs text-muted-foreground">Nenhuma tag</span>
        </div>
      </div>
    </div>
  )
}
