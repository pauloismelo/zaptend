import { render, screen } from '@testing-library/react'
import { ContactDetails } from './contact-details'
import { useConversationsStore } from '@/stores/conversations.store'
import type { Conversation } from '@/stores/conversations.store'

jest.mock('@/stores/conversations.store', () => ({
  useConversationsStore: jest.fn(),
}))

const mockConv = (overrides: Partial<Conversation> = {}): Conversation => ({
  id: 'conv-1',
  status: 'open',
  contactName: 'João Silva',
  contactPhone: '31999990000',
  unreadCount: 2,
  assignedUserId: 'user-abc',
  departmentId: 'dept-1',
  lastMessageAt: '2026-05-06T12:00:00Z',
  ...overrides,
})

function setupStore(overrides: Partial<ReturnType<typeof useConversationsStore>> = {}) {
  ;(useConversationsStore as jest.Mock).mockReturnValue({
    conversations: [],
    activeConversationId: null,
    ...overrides,
  })
}

describe('ContactDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    setupStore()
  })

  it('renderiza estado vazio quando não há conversa ativa', () => {
    render(<ContactDetails />)
    expect(screen.getByTestId('contact-details-empty')).toBeInTheDocument()
  })

  it('exibe mensagem orientando a selecionar uma conversa', () => {
    render(<ContactDetails />)
    expect(
      screen.getByText('Selecione uma conversa para ver os detalhes do contato'),
    ).toBeInTheDocument()
  })

  it('renderiza detalhes do contato quando conversa está ativa', () => {
    setupStore({
      conversations: [mockConv()],
      activeConversationId: 'conv-1',
    })
    render(<ContactDetails />)
    expect(screen.getByTestId('contact-details')).toBeInTheDocument()
  })

  it('exibe o nome do contato', () => {
    setupStore({
      conversations: [mockConv()],
      activeConversationId: 'conv-1',
    })
    render(<ContactDetails />)
    expect(screen.getByText('João Silva')).toBeInTheDocument()
  })

  it('exibe o telefone do contato', () => {
    setupStore({
      conversations: [mockConv()],
      activeConversationId: 'conv-1',
    })
    render(<ContactDetails />)
    expect(screen.getAllByText('31999990000')).toHaveLength(2)
  })

  it('exibe "Contato sem nome" quando contactName não definido', () => {
    setupStore({
      conversations: [mockConv({ contactName: undefined })],
      activeConversationId: 'conv-1',
    })
    render(<ContactDetails />)
    expect(screen.getByText('Contato sem nome')).toBeInTheDocument()
  })

  it('exibe as iniciais do avatar', () => {
    setupStore({
      conversations: [mockConv({ contactName: 'João Silva' })],
      activeConversationId: 'conv-1',
    })
    render(<ContactDetails />)
    expect(screen.getByText('JS')).toBeInTheDocument()
  })

  it('exibe o status formatado', () => {
    setupStore({
      conversations: [mockConv({ status: 'attending' })],
      activeConversationId: 'conv-1',
    })
    render(<ContactDetails />)
    expect(screen.getByText('Em Atendimento')).toBeInTheDocument()
  })

  it('exibe o departamento', () => {
    setupStore({
      conversations: [mockConv()],
      activeConversationId: 'conv-1',
    })
    render(<ContactDetails />)
    expect(screen.getByText('dept-1')).toBeInTheDocument()
  })

  it('exibe "—" para departamento quando não definido', () => {
    setupStore({
      conversations: [mockConv({ departmentId: undefined })],
      activeConversationId: 'conv-1',
    })
    render(<ContactDetails />)
    expect(screen.getAllByText('—').length).toBeGreaterThan(0)
  })

  it('exibe o id do responsável', () => {
    setupStore({
      conversations: [mockConv()],
      activeConversationId: 'conv-1',
    })
    render(<ContactDetails />)
    expect(screen.getByText('user-abc')).toBeInTheDocument()
  })

  it('exibe "Não atribuído" quando sem responsável', () => {
    setupStore({
      conversations: [mockConv({ assignedUserId: undefined })],
      activeConversationId: 'conv-1',
    })
    render(<ContactDetails />)
    expect(screen.getByText('Não atribuído')).toBeInTheDocument()
  })

  it('exibe contagem de mensagens não lidas', () => {
    setupStore({
      conversations: [mockConv({ unreadCount: 3 })],
      activeConversationId: 'conv-1',
    })
    render(<ContactDetails />)
    expect(screen.getByTestId('contact-details')).toHaveTextContent(/3 mensagens/)
  })

  it('exibe "Nenhuma" quando unreadCount é 0', () => {
    setupStore({
      conversations: [mockConv({ unreadCount: 0 })],
      activeConversationId: 'conv-1',
    })
    render(<ContactDetails />)
    expect(screen.getByText('Nenhuma')).toBeInTheDocument()
  })

  it('exibe a data da última mensagem', () => {
    setupStore({
      conversations: [mockConv({ lastMessageAt: '2026-05-06T12:00:00Z' })],
      activeConversationId: 'conv-1',
    })
    render(<ContactDetails />)
    expect(screen.getByText(/06\/05\/2026/)).toBeInTheDocument()
  })

  it('exibe "Nenhuma tag" quando sem tags', () => {
    setupStore({
      conversations: [mockConv()],
      activeConversationId: 'conv-1',
    })
    render(<ContactDetails />)
    expect(screen.getByText('Nenhuma tag')).toBeInTheDocument()
  })
})
