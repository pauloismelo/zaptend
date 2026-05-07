import { render, screen, waitFor } from '@testing-library/react'
import { ChatPanel } from './chat-panel'
import { useConversationsStore } from '@/stores/conversations.store'
import { useMessagesStore } from '@/stores/messages.store'
import type { Conversation } from '@/stores/conversations.store'
import type { Message } from '@/stores/messages.store'

const mockFetchMessages = jest.fn()
const mockSetCurrentConversation = jest.fn()
const mockSendMessage = jest.fn()

jest.mock('@/stores/conversations.store', () => ({
  useConversationsStore: jest.fn(),
}))

jest.mock('@/stores/messages.store', () => ({
  useMessagesStore: jest.fn(),
}))

const mockConv = (overrides: Partial<Conversation> = {}): Conversation => ({
  id: 'conv-1',
  status: 'open',
  contactName: 'Maria Santos',
  contactPhone: '11999990000',
  unreadCount: 0,
  ...overrides,
})

const mockMsg = (overrides: Partial<Message> = {}): Message => ({
  id: 'msg-1',
  conversationId: 'conv-1',
  direction: 'inbound',
  type: 'text',
  content: 'Olá!',
  status: 'delivered',
  createdAt: '2026-05-06T10:00:00Z',
  ...overrides,
})

function setupConvStore(overrides: Partial<ReturnType<typeof useConversationsStore>> = {}) {
  ;(useConversationsStore as jest.Mock).mockReturnValue({
    conversations: [],
    activeConversationId: null,
    ...overrides,
  })
}

function setupMsgStore(overrides: Partial<ReturnType<typeof useMessagesStore>> = {}) {
  ;(useMessagesStore as jest.Mock).mockReturnValue({
    messages: [],
    isLoading: false,
    error: null,
    fetchMessages: mockFetchMessages,
    setCurrentConversation: mockSetCurrentConversation,
    sendMessage: mockSendMessage,
    ...overrides,
  })
}

describe('ChatPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    setupConvStore()
    setupMsgStore()
  })

  it('renderiza estado vazio quando não há conversa ativa', () => {
    render(<ChatPanel />)
    expect(screen.getByTestId('chat-panel-empty')).toBeInTheDocument()
    expect(screen.getByText('Selecione uma conversa')).toBeInTheDocument()
  })

  it('não renderiza chat quando activeConversationId é null', () => {
    render(<ChatPanel />)
    expect(screen.queryByTestId('chat-panel')).not.toBeInTheDocument()
  })

  it('renderiza o chat quando há conversa ativa', () => {
    setupConvStore({
      conversations: [mockConv()],
      activeConversationId: 'conv-1',
    })
    render(<ChatPanel />)
    expect(screen.getByTestId('chat-panel')).toBeInTheDocument()
  })

  it('exibe o nome do contato no cabeçalho', () => {
    setupConvStore({
      conversations: [mockConv({ contactName: 'Maria Santos' })],
      activeConversationId: 'conv-1',
    })
    render(<ChatPanel />)
    expect(screen.getByText('Maria Santos')).toBeInTheDocument()
  })

  it('exibe o telefone no cabeçalho', () => {
    setupConvStore({
      conversations: [mockConv()],
      activeConversationId: 'conv-1',
    })
    render(<ChatPanel />)
    expect(screen.getByText('11999990000')).toBeInTheDocument()
  })

  it('exibe o status da conversa no cabeçalho', () => {
    setupConvStore({
      conversations: [mockConv({ status: 'resolved' })],
      activeConversationId: 'conv-1',
    })
    render(<ChatPanel />)
    expect(screen.getByText('Resolvida')).toBeInTheDocument()
  })

  it('chama fetchMessages quando activeConversationId muda', async () => {
    setupConvStore({
      conversations: [mockConv()],
      activeConversationId: 'conv-1',
    })
    render(<ChatPanel />)
    await waitFor(() => {
      expect(mockFetchMessages).toHaveBeenCalledWith('conv-1')
    })
  })

  it('chama setCurrentConversation quando activeConversationId muda', async () => {
    setupConvStore({
      conversations: [mockConv()],
      activeConversationId: 'conv-1',
    })
    render(<ChatPanel />)
    await waitFor(() => {
      expect(mockSetCurrentConversation).toHaveBeenCalledWith('conv-1')
    })
  })

  it('renderiza skeletons quando isLoading=true', () => {
    setupConvStore({
      conversations: [mockConv()],
      activeConversationId: 'conv-1',
    })
    setupMsgStore({ isLoading: true })
    render(<ChatPanel />)
    expect(screen.getAllByTestId('message-item-skeleton')).toHaveLength(5)
  })

  it('renderiza mensagens quando carregadas', () => {
    setupConvStore({
      conversations: [mockConv()],
      activeConversationId: 'conv-1',
    })
    setupMsgStore({ messages: [mockMsg(), mockMsg({ id: 'msg-2', content: 'Como posso ajudar?' })] })
    render(<ChatPanel />)
    expect(screen.getAllByTestId('message-item')).toHaveLength(2)
  })

  it('exibe "Nenhuma mensagem ainda" quando lista vazia', () => {
    setupConvStore({
      conversations: [mockConv()],
      activeConversationId: 'conv-1',
    })
    setupMsgStore({ messages: [] })
    render(<ChatPanel />)
    expect(screen.getByTestId('no-messages')).toBeInTheDocument()
  })

  it('renderiza o campo de input', () => {
    setupConvStore({
      conversations: [mockConv()],
      activeConversationId: 'conv-1',
    })
    render(<ChatPanel />)
    expect(screen.getByTestId('message-textarea')).toBeInTheDocument()
  })
})
