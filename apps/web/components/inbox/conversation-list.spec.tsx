import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ConversationList } from './conversation-list'
import { useConversationsStore } from '@/stores/conversations.store'
import type { Conversation } from '@/stores/conversations.store'

const mockFetchConversations = jest.fn()
const mockSetActiveConversation = jest.fn()

jest.mock('@/stores/conversations.store', () => ({
  useConversationsStore: jest.fn(),
}))

const mockConv = (id: string, overrides: Partial<Conversation> = {}): Conversation => ({
  id,
  status: 'open',
  contactName: `Contato ${id}`,
  contactPhone: `3199999${id}`,
  lastMessage: `Mensagem ${id}`,
  lastMessageAt: new Date().toISOString(),
  unreadCount: 0,
  ...overrides,
})

function setupStore(overrides: Partial<ReturnType<typeof useConversationsStore>> = {}) {
  ;(useConversationsStore as jest.Mock).mockReturnValue({
    conversations: [],
    activeConversationId: null,
    isLoading: false,
    error: null,
    fetchConversations: mockFetchConversations,
    setActiveConversation: mockSetActiveConversation,
    ...overrides,
  })
}

describe('ConversationList', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    setupStore()
  })

  it('chama fetchConversations ao montar', async () => {
    render(<ConversationList />)
    await waitFor(() => {
      expect(mockFetchConversations).toHaveBeenCalledTimes(1)
    })
  })

  it('renderiza skeletons quando isLoading=true', () => {
    setupStore({ isLoading: true })
    render(<ConversationList />)
    expect(screen.getAllByTestId('conversation-item-skeleton')).toHaveLength(5)
  })

  it('renderiza mensagem de erro quando error está definido', () => {
    setupStore({ error: 'Falha ao carregar conversas' })
    render(<ConversationList />)
    expect(screen.getByTestId('error-state')).toBeInTheDocument()
    expect(screen.getByText('Falha ao carregar conversas')).toBeInTheDocument()
  })

  it('chama fetchConversations ao clicar em Tentar novamente', async () => {
    setupStore({ error: 'Erro de rede' })
    render(<ConversationList />)
    fireEvent.click(screen.getByText('Tentar novamente'))
    await waitFor(() => {
      expect(mockFetchConversations).toHaveBeenCalledTimes(2)
    })
  })

  it('renderiza empty state quando não há conversas', () => {
    render(<ConversationList />)
    expect(screen.getByTestId('empty-state')).toBeInTheDocument()
    expect(screen.getByText('Nenhuma conversa ainda')).toBeInTheDocument()
  })

  it('renderiza conversas quando há dados', () => {
    setupStore({ conversations: [mockConv('c1'), mockConv('c2')] })
    render(<ConversationList />)
    expect(screen.getAllByTestId('conversation-item')).toHaveLength(2)
  })

  it('renderiza os nomes das conversas', () => {
    setupStore({ conversations: [mockConv('c1')] })
    render(<ConversationList />)
    expect(screen.getByText('Contato c1')).toBeInTheDocument()
  })

  it('filtra conversas por status ao selecionar filtro', () => {
    setupStore({
      conversations: [
        mockConv('c1', { status: 'open' }),
        mockConv('c2', { status: 'resolved' }),
      ],
    })
    render(<ConversationList />)
    fireEvent.click(screen.getByTestId('status-filter-open'))
    expect(screen.getAllByTestId('conversation-item')).toHaveLength(1)
    expect(screen.getByText('Contato c1')).toBeInTheDocument()
    expect(screen.queryByText('Contato c2')).not.toBeInTheDocument()
  })

  it('filtra conversas por busca (nome)', () => {
    setupStore({
      conversations: [mockConv('c1', { contactName: 'Maria Lima' }), mockConv('c2')],
    })
    render(<ConversationList />)
    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'maria' } })
    expect(screen.getAllByTestId('conversation-item')).toHaveLength(1)
    expect(screen.getByText('Maria Lima')).toBeInTheDocument()
  })

  it('filtra conversas por busca (telefone)', () => {
    setupStore({
      conversations: [
        mockConv('c1', { contactPhone: '11999999999' }),
        mockConv('c2', { contactPhone: '21888888888' }),
      ],
    })
    render(<ConversationList />)
    fireEvent.change(screen.getByTestId('search-input'), { target: { value: '11999' } })
    expect(screen.getAllByTestId('conversation-item')).toHaveLength(1)
  })

  it('exibe "Nenhuma conversa encontrada" quando filtro não retorna resultados', () => {
    setupStore({ conversations: [mockConv('c1', { status: 'open' })] })
    render(<ConversationList />)
    fireEvent.click(screen.getByTestId('status-filter-resolved'))
    expect(screen.getByText('Nenhuma conversa encontrada')).toBeInTheDocument()
  })

  it('chama setActiveConversation ao clicar em uma conversa', () => {
    setupStore({ conversations: [mockConv('c1')] })
    render(<ConversationList />)
    fireEvent.click(screen.getByTestId('conversation-item'))
    expect(mockSetActiveConversation).toHaveBeenCalledWith('c1')
  })

  it('marca conversa ativa corretamente', () => {
    setupStore({
      conversations: [mockConv('c1')],
      activeConversationId: 'c1',
    })
    render(<ConversationList />)
    expect(screen.getByTestId('conversation-item')).toHaveClass('bg-accent')
  })
})
