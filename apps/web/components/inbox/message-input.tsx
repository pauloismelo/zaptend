'use client'

import { useState, useRef, useCallback, type KeyboardEvent } from 'react'
import { Send, Paperclip, Smile, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMessagesStore } from '@/stores/messages.store'
import type { ConversationId } from '@zaptend/types'

const EMOJIS = [
  '😀', '😊', '😂', '😍', '🤔', '👍', '👎', '❤️',
  '🔥', '✅', '❌', '😢', '😮', '🎉', '🙏', '💪',
  '😅', '🤝', '👋', '💬',
]

const QUICK_REPLIES = [
  { id: '1', shortcut: '/oi', text: 'Olá! Como posso ajudar?' },
  { id: '2', shortcut: '/ok', text: 'Ok, entendido!' },
  { id: '3', shortcut: '/aguarde', text: 'Aguarde um momento, por favor.' },
  { id: '4', shortcut: '/encerrar', text: 'Obrigado pelo contato! Encerrando a conversa.' },
  { id: '5', shortcut: '/breve', text: 'Em breve retornarei seu contato.' },
]

interface MessageInputProps {
  conversationId: ConversationId
  onMessageSent?: () => void
}

export function MessageInput({ conversationId, onMessageSent }: MessageInputProps) {
  const [text, setText] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { sendMessage } = useMessagesStore()

  const quickRepliesVisible = text.startsWith('/')
  const filteredReplies = quickRepliesVisible
    ? QUICK_REPLIES.filter(
        (r) =>
          r.shortcut.startsWith(text.toLowerCase()) ||
          r.text.toLowerCase().includes(text.slice(1).toLowerCase()),
      )
    : []

  const handleSend = useCallback(async () => {
    const content = text.trim()
    if (!content || isSending) return

    setText('')
    setIsSending(true)
    setShowEmoji(false)
    try {
      await sendMessage(conversationId, content)
      onMessageSent?.()
    } catch {
      // status de falha já atualizado na store
    } finally {
      setIsSending(false)
    }
    textareaRef.current?.focus()
  }, [text, isSending, conversationId, sendMessage, onMessageSent])

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSend()
    }
    if (e.key === 'Escape') setShowEmoji(false)
  }

  const insertEmoji = (emoji: string) => {
    setText((prev) => prev + emoji)
    textareaRef.current?.focus()
  }

  const selectQuickReply = (replyText: string) => {
    setText(replyText)
    textareaRef.current?.focus()
  }

  return (
    <div className="relative border-t border-border bg-card px-4 py-3 flex-shrink-0">
      {quickRepliesVisible && filteredReplies.length > 0 && (
        <div
          data-testid="quick-replies"
          className="absolute bottom-full left-4 right-4 mb-1 rounded-lg border border-border bg-card shadow-lg overflow-hidden z-10"
        >
          {filteredReplies.map((reply) => (
            <button
              key={reply.id}
              type="button"
              onClick={() => selectQuickReply(reply.text)}
              className="w-full flex flex-col px-3 py-2 text-left hover:bg-accent transition-colors border-b border-border last:border-b-0"
            >
              <span className="text-xs font-mono text-primary">{reply.shortcut}</span>
              <span className="text-sm text-foreground truncate">{reply.text}</span>
            </button>
          ))}
        </div>
      )}

      {showEmoji && (
        <div
          data-testid="emoji-picker"
          className="absolute bottom-full right-4 mb-1 rounded-lg border border-border bg-card p-3 shadow-lg z-10"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-muted-foreground font-medium">Emojis</span>
            <button
              type="button"
              onClick={() => setShowEmoji(false)}
              aria-label="Fechar emojis"
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <div className="grid grid-cols-5 gap-1">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => insertEmoji(emoji)}
                aria-label={emoji}
                className="w-8 h-8 flex items-center justify-center text-lg hover:bg-accent rounded transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-end gap-2">
        <button
          type="button"
          aria-label="Anexar arquivo"
          onClick={() => fileInputRef.current?.click()}
          className="flex-shrink-0 p-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Paperclip className="w-5 h-5" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          aria-hidden="true"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
        />

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite uma mensagem... (Ctrl+Enter para enviar, / para respostas rápidas)"
          rows={1}
          data-testid="message-textarea"
          className="flex-1 resize-none rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary max-h-32 overflow-y-auto"
          style={{ minHeight: '40px' }}
        />

        <button
          type="button"
          aria-label="Emojis"
          onClick={() => setShowEmoji((v) => !v)}
          className={cn(
            'flex-shrink-0 p-2 transition-colors',
            showEmoji ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Smile className="w-5 h-5" />
        </button>

        <button
          type="button"
          aria-label="Enviar mensagem"
          onClick={handleSend}
          disabled={!text.trim() || isSending}
          data-testid="send-button"
          className={cn(
            'flex-shrink-0 p-2 rounded-lg transition-colors',
            text.trim() && !isSending
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'bg-muted text-muted-foreground cursor-not-allowed',
          )}
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
