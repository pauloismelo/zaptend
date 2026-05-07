import { render, screen } from '@testing-library/react'
import { ContactTimeline } from './contact-timeline'
import type { ConversationSummary } from '@/lib/api/contacts'

function mockConv(overrides: Partial<ConversationSummary> = {}): ConversationSummary {
  return {
    id: 'conv-1',
    status: 'open',
    lastMessageAt: new Date().toISOString(),
    ...overrides,
  }
}

describe('ContactTimeline', () => {
  it('exibe estado vazio quando não há conversas', () => {
    render(<ContactTimeline conversations={[]} />)
    expect(screen.getByTestId('timeline-empty')).toBeInTheDocument()
    expect(screen.getByText('Nenhuma conversa registrada')).toBeInTheDocument()
  })

  it('exibe a lista de conversas quando há itens', () => {
    const convs = [mockConv({ id: 'c1' }), mockConv({ id: 'c2', status: 'resolved' })]
    render(<ContactTimeline conversations={convs} />)
    expect(screen.getByTestId('timeline-list')).toBeInTheDocument()
    expect(screen.getAllByTestId('timeline-item')).toHaveLength(2)
  })

  it('exibe badge de status "Aberta" para status open', () => {
    render(<ContactTimeline conversations={[mockConv({ id: 'c1', status: 'open' })]} />)
    expect(screen.getByTestId('status-badge-c1')).toHaveTextContent('Aberta')
  })

  it('exibe badge de status "Resolvida" para status resolved', () => {
    render(<ContactTimeline conversations={[mockConv({ id: 'c2', status: 'resolved' })]} />)
    expect(screen.getByTestId('status-badge-c2')).toHaveTextContent('Resolvida')
  })

  it('exibe badge de status "Em Atendimento" para status attending', () => {
    render(<ContactTimeline conversations={[mockConv({ id: 'c3', status: 'attending' })]} />)
    expect(screen.getByTestId('status-badge-c3')).toHaveTextContent('Em Atendimento')
  })

  it('exibe badge de status "Aguardando Cliente" para status waiting_customer', () => {
    render(<ContactTimeline conversations={[mockConv({ id: 'c4', status: 'waiting_customer' })]} />)
    expect(screen.getByTestId('status-badge-c4')).toHaveTextContent('Aguardando Cliente')
  })

  it('exibe "—" quando lastMessageAt não está definido', () => {
    render(<ContactTimeline conversations={[mockConv({ lastMessageAt: undefined })]} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('exibe data formatada no padrão dd/MM/yyyy HH:mm', () => {
    const date = new Date('2024-03-15T10:30:00.000Z')
    render(<ContactTimeline conversations={[mockConv({ lastMessageAt: date.toISOString() })]} />)
    const items = screen.getAllByTestId('timeline-item')
    expect(items[0]).toBeDefined()
  })

  it('não exibe ícone de MessageCircle no estado vazio como estado de lista', () => {
    render(<ContactTimeline conversations={[]} />)
    expect(screen.queryByTestId('timeline-list')).not.toBeInTheDocument()
  })

  it('renderiza múltiplas conversas corretamente', () => {
    const convs = [
      mockConv({ id: 'c1', status: 'open' }),
      mockConv({ id: 'c2', status: 'resolved' }),
      mockConv({ id: 'c3', status: 'pending' as ConversationSummary['status'] }),
    ]
    render(<ContactTimeline conversations={convs} />)
    expect(screen.getAllByTestId('timeline-item')).toHaveLength(3)
  })
})
