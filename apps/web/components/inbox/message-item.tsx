'use client'

import { Check, CheckCheck, Clock, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Message } from '@/stores/messages.store'
import type { MessageStatus } from '@zaptend/types'

function formatTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

function StatusIcon({ status }: { status: MessageStatus }) {
  if (status === 'pending') return <Clock className="w-3 h-3 text-muted-foreground" aria-label="Pendente" />
  if (status === 'sent') return <Check className="w-3 h-3 text-muted-foreground" aria-label="Enviado" />
  if (status === 'delivered') return <CheckCheck className="w-3 h-3 text-muted-foreground" aria-label="Entregue" />
  if (status === 'read') return <CheckCheck className="w-3 h-3 text-primary" aria-label="Lido" />
  if (status === 'failed') return <AlertCircle className="w-3 h-3 text-destructive" aria-label="Falhou" />
  return null
}

interface MessageItemProps {
  message: Message
}

export function MessageItem({ message }: MessageItemProps) {
  const isOutbound = message.direction === 'outbound'

  return (
    <div
      data-testid="message-item"
      className={cn('flex mb-2', isOutbound ? 'justify-end' : 'justify-start')}
    >
      <div
        className={cn(
          'max-w-[70%] rounded-2xl px-4 py-2 text-sm break-words',
          isOutbound
            ? 'rounded-br-sm bg-primary text-primary-foreground'
            : 'rounded-bl-sm bg-card text-foreground border border-border',
        )}
      >
        {message.authorName && !isOutbound && (
          <p className="text-xs font-semibold text-primary mb-1">{message.authorName}</p>
        )}

        {message.type === 'image' && message.mediaUrl ? (
          <img
            src={message.mediaUrl}
            alt="Imagem"
            className="rounded-lg max-w-full mb-1 block"
          />
        ) : message.type === 'document' && message.mediaUrl ? (
          <a
            href={message.mediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'underline',
              isOutbound ? 'text-primary-foreground' : 'text-primary',
            )}
          >
            Documento
          </a>
        ) : (
          <p className="whitespace-pre-wrap">{message.content}</p>
        )}

        <div
          className={cn(
            'flex items-center gap-1 mt-1',
            isOutbound ? 'justify-end' : 'justify-start',
          )}
        >
          <span
            className={cn(
              'text-xs',
              isOutbound ? 'text-primary-foreground/70' : 'text-muted-foreground',
            )}
          >
            {formatTime(message.createdAt)}
          </span>
          {isOutbound && <StatusIcon status={message.status} />}
        </div>
      </div>
    </div>
  )
}

export function MessageItemSkeleton() {
  return (
    <div
      data-testid="message-item-skeleton"
      className="flex mb-2 justify-start animate-pulse"
    >
      <div className="h-12 w-48 rounded-2xl rounded-bl-sm bg-muted" />
    </div>
  )
}
