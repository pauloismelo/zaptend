import { render, screen, fireEvent } from '@testing-library/react'
import {
  ConversationItem,
  ConversationItemSkeleton,
  getInitials,
  formatRelativeTime,
} from './conversation-item'
import type { Conversation } from '@/stores/conversations.store'

const mockConv = (overrides: Partial<Conversation> = {}): Conversation => ({
  id: 'conv-1',
  status: 'open',
  contactName: 'João Silva',
  contactPhone: '31999990000',
  lastMessage: 'Olá, preciso de ajuda',
  lastMessageAt: new Date().toISOString(),
  unreadCount: 0,
  ...overrides,
})

describe('getInitials', () => {
  it('retorna iniciais do nome', () => {
    expect(getInitials('João Silva')).toBe('JS')
  })

  it('retorna inicial quando nome tem uma palavra', () => {
    expect(getInitials('João')).toBe('J')
  })

  it('retorna últimos 2 dígitos do telefone quando sem nome', () => {
    expect(getInitials(undefined, '31999990000')).toBe('00')
  })

  it('retorna ? quando sem nome e sem telefone', () => {
    expect(getInitials()).toBe('?')
  })
})

describe('formatRelativeTime', () => {
  it('retorna string vazia quando sem data', () => {
    expect(formatRelativeTime()).toBe('')
  })

  it('retorna "agora" para menos de 1 minuto atrás', () => {
    expect(formatRelativeTime(new Date().toISOString())).toBe('agora')
  })

  it('retorna minutos para menos de 1 hora', () => {
    const date = new Date(Date.now() - 30 * 60_000).toISOString()
    expect(formatRelativeTime(date)).toBe('30min')
  })

  it('retorna horas para menos de 24h', () => {
    const date = new Date(Date.now() - 3 * 3_600_000).toISOString()
    expect(formatRelativeTime(date)).toBe('3h')
  })

  it('retorna "ontem" para 1 dia atrás', () => {
    const date = new Date(Date.now() - 25 * 3_600_000).toISOString()
    expect(formatRelativeTime(date)).toBe('ontem')
  })
})

describe('ConversationItem', () => {
  it('renderiza o nome do contato', () => {
    render(<ConversationItem conversation={mockConv()} onSelect={jest.fn()} />)
    expect(screen.getByText('João Silva')).toBeInTheDocument()
  })

  it('renderiza o telefone quando não há nome', () => {
    render(
      <ConversationItem
        conversation={mockConv({ contactName: undefined })}
        onSelect={jest.fn()}
      />,
    )
    expect(screen.getByText('31999990000')).toBeInTheDocument()
  })

  it('renderiza a última mensagem', () => {
    render(<ConversationItem conversation={mockConv()} onSelect={jest.fn()} />)
    expect(screen.getByText('Olá, preciso de ajuda')).toBeInTheDocument()
  })

  it('renderiza "Sem mensagens" quando lastMessage não definido', () => {
    render(
      <ConversationItem
        conversation={mockConv({ lastMessage: undefined })}
        onSelect={jest.fn()}
      />,
    )
    expect(screen.getByText('Sem mensagens')).toBeInTheDocument()
  })

  it('chama onSelect com o id da conversa ao clicar', () => {
    const onSelect = jest.fn()
    render(<ConversationItem conversation={mockConv()} onSelect={onSelect} />)
    fireEvent.click(screen.getByTestId('conversation-item'))
    expect(onSelect).toHaveBeenCalledWith('conv-1')
  })

  it('exibe badge de não lidas quando unreadCount > 0', () => {
    render(<ConversationItem conversation={mockConv({ unreadCount: 5 })} onSelect={jest.fn()} />)
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('exibe "99+" quando unreadCount > 99', () => {
    render(
      <ConversationItem conversation={mockConv({ unreadCount: 150 })} onSelect={jest.fn()} />,
    )
    expect(screen.getByText('99+')).toBeInTheDocument()
  })

  it('não exibe badge quando unreadCount é 0', () => {
    render(<ConversationItem conversation={mockConv({ unreadCount: 0 })} onSelect={jest.fn()} />)
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('aplica bg-accent quando isActive=true', () => {
    render(<ConversationItem conversation={mockConv()} onSelect={jest.fn()} isActive />)
    expect(screen.getByTestId('conversation-item')).toHaveClass('bg-accent')
  })

  it('não aplica bg-accent quando isActive=false', () => {
    render(
      <ConversationItem conversation={mockConv()} onSelect={jest.fn()} isActive={false} />,
    )
    expect(screen.getByTestId('conversation-item')).not.toHaveClass('bg-accent')
  })

  it('exibe indicador de status com título correto para status open', () => {
    render(<ConversationItem conversation={mockConv({ status: 'open' })} onSelect={jest.fn()} />)
    expect(screen.getByTitle('Aberta')).toBeInTheDocument()
  })

  it('exibe indicador de status com título correto para status resolved', () => {
    render(
      <ConversationItem conversation={mockConv({ status: 'resolved' })} onSelect={jest.fn()} />,
    )
    expect(screen.getByTitle('Resolvida')).toBeInTheDocument()
  })
})

describe('ConversationItemSkeleton', () => {
  it('renderiza o skeleton com data-testid correto', () => {
    render(<ConversationItemSkeleton />)
    expect(screen.getByTestId('conversation-item-skeleton')).toBeInTheDocument()
  })

  it('tem classe animate-pulse', () => {
    render(<ConversationItemSkeleton />)
    expect(screen.getByTestId('conversation-item-skeleton')).toHaveClass('animate-pulse')
  })
})
