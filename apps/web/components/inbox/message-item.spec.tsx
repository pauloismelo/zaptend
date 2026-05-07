import { render, screen } from '@testing-library/react'
import { MessageItem, MessageItemSkeleton } from './message-item'
import type { Message } from '@/stores/messages.store'

const mockMessage = (overrides: Partial<Message> = {}): Message => ({
  id: 'msg-1',
  conversationId: 'conv-1',
  direction: 'inbound',
  type: 'text',
  content: 'Olá, preciso de ajuda!',
  status: 'delivered',
  createdAt: '2026-05-06T14:30:00Z',
  ...overrides,
})

describe('MessageItem', () => {
  it('renderiza o conteúdo da mensagem', () => {
    render(<MessageItem message={mockMessage()} />)
    expect(screen.getByText('Olá, preciso de ajuda!')).toBeInTheDocument()
  })

  it('mensagem inbound é alinhada à esquerda', () => {
    render(<MessageItem message={mockMessage({ direction: 'inbound' })} />)
    const container = screen.getByTestId('message-item')
    expect(container).toHaveClass('justify-start')
  })

  it('mensagem outbound é alinhada à direita', () => {
    render(<MessageItem message={mockMessage({ direction: 'outbound' })} />)
    const container = screen.getByTestId('message-item')
    expect(container).toHaveClass('justify-end')
  })

  it('exibe o horário da mensagem', () => {
    render(<MessageItem message={mockMessage({ createdAt: '2026-05-06T14:30:00Z' })} />)
    expect(screen.getByText(/\d{1,2}:\d{2}/)).toBeInTheDocument()
  })

  it('exibe ícone de status para mensagem outbound (sent)', () => {
    render(<MessageItem message={mockMessage({ direction: 'outbound', status: 'sent' })} />)
    expect(screen.getByLabelText('Enviado')).toBeInTheDocument()
  })

  it('exibe ícone de status para mensagem outbound (delivered)', () => {
    render(<MessageItem message={mockMessage({ direction: 'outbound', status: 'delivered' })} />)
    expect(screen.getByLabelText('Entregue')).toBeInTheDocument()
  })

  it('exibe ícone de status para mensagem outbound (read)', () => {
    render(<MessageItem message={mockMessage({ direction: 'outbound', status: 'read' })} />)
    expect(screen.getByLabelText('Lido')).toBeInTheDocument()
  })

  it('exibe ícone de status para mensagem outbound (pending)', () => {
    render(<MessageItem message={mockMessage({ direction: 'outbound', status: 'pending' })} />)
    expect(screen.getByLabelText('Pendente')).toBeInTheDocument()
  })

  it('exibe ícone de falha para mensagem outbound (failed)', () => {
    render(<MessageItem message={mockMessage({ direction: 'outbound', status: 'failed' })} />)
    expect(screen.getByLabelText('Falhou')).toBeInTheDocument()
  })

  it('não exibe ícone de status para mensagem inbound', () => {
    render(<MessageItem message={mockMessage({ direction: 'inbound', status: 'delivered' })} />)
    expect(screen.queryByLabelText('Entregue')).not.toBeInTheDocument()
  })

  it('exibe nome do autor para mensagem inbound com authorName', () => {
    render(
      <MessageItem message={mockMessage({ direction: 'inbound', authorName: 'Maria Ops' })} />,
    )
    expect(screen.getByText('Maria Ops')).toBeInTheDocument()
  })

  it('não exibe nome do autor para mensagem outbound', () => {
    render(
      <MessageItem
        message={mockMessage({ direction: 'outbound', authorName: 'Agente' })}
      />,
    )
    expect(screen.queryByText('Agente')).not.toBeInTheDocument()
  })

  it('renderiza link de documento quando type=document e mediaUrl definido', () => {
    render(
      <MessageItem
        message={mockMessage({ type: 'document', mediaUrl: 'https://example.com/file.pdf' })}
      />,
    )
    const link = screen.getByText('Documento')
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', 'https://example.com/file.pdf')
  })
})

describe('MessageItemSkeleton', () => {
  it('renderiza o skeleton com data-testid correto', () => {
    render(<MessageItemSkeleton />)
    expect(screen.getByTestId('message-item-skeleton')).toBeInTheDocument()
  })

  it('tem classe animate-pulse', () => {
    render(<MessageItemSkeleton />)
    expect(screen.getByTestId('message-item-skeleton')).toHaveClass('animate-pulse')
  })
})
