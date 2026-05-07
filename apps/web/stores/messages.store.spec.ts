import { act } from 'react'
import { useMessagesStore } from './messages.store'
import type { Message } from './messages.store'

const mockMessage = (id: string, conversationId = 'conv-1'): Message => ({
  id,
  conversationId,
  direction: 'inbound',
  type: 'text',
  content: `Mensagem ${id}`,
  status: 'delivered',
  createdAt: '2026-05-06T10:00:00Z',
})

function resetStore() {
  useMessagesStore.setState({
    messages: [],
    currentConversationId: null,
    isLoading: false,
    error: null,
  })
}

const mockFetch = jest.fn()
global.fetch = mockFetch

describe('useMessagesStore', () => {
  beforeEach(() => {
    resetStore()
    jest.clearAllMocks()
    jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(
      JSON.stringify({ state: { accessToken: 'test-token' } }),
    )
  })

  describe('fetchMessages', () => {
    it('popula messages e define currentConversationId após sucesso', async () => {
      const data = [mockMessage('m1'), mockMessage('m2')]
      mockFetch.mockResolvedValue({ ok: true, json: async () => data })

      await act(async () => {
        await useMessagesStore.getState().fetchMessages('conv-1')
      })

      const state = useMessagesStore.getState()
      expect(state.messages).toEqual(data)
      expect(state.currentConversationId).toBe('conv-1')
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
    })

    it('define error quando resposta não é ok', async () => {
      mockFetch.mockResolvedValue({ ok: false })

      await act(async () => {
        await useMessagesStore.getState().fetchMessages('conv-1')
      })

      const state = useMessagesStore.getState()
      expect(state.error).toBe('Falha ao carregar mensagens')
      expect(state.isLoading).toBe(false)
    })

    it('define error quando fetch rejeita', async () => {
      mockFetch.mockRejectedValue(new Error('Timeout'))

      await act(async () => {
        await useMessagesStore.getState().fetchMessages('conv-1')
      })

      expect(useMessagesStore.getState().error).toBe('Timeout')
    })

    it('define isLoading=true durante o request', async () => {
      let resolve!: (v: unknown) => void
      mockFetch.mockReturnValue(new Promise((r) => { resolve = r }))

      act(() => { useMessagesStore.getState().fetchMessages('conv-1') })
      expect(useMessagesStore.getState().isLoading).toBe(true)

      await act(async () => { resolve({ ok: true, json: async () => [] }) })
      expect(useMessagesStore.getState().isLoading).toBe(false)
    })

    it('usa o conversationId na URL', async () => {
      mockFetch.mockResolvedValue({ ok: true, json: async () => [] })

      await act(async () => {
        await useMessagesStore.getState().fetchMessages('conv-abc')
      })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/conversations/conv-abc/messages'),
        expect.any(Object),
      )
    })
  })

  describe('addMessage', () => {
    it('adiciona mensagem ao final quando conversationId bate com currentConversationId', () => {
      useMessagesStore.setState({
        currentConversationId: 'conv-1',
        messages: [mockMessage('m1')],
      })

      useMessagesStore.getState().addMessage(mockMessage('m2', 'conv-1'))

      const { messages } = useMessagesStore.getState()
      expect(messages).toHaveLength(2)
      expect(messages[1].id).toBe('m2')
    })

    it('ignora mensagem de outra conversa', () => {
      useMessagesStore.setState({
        currentConversationId: 'conv-1',
        messages: [mockMessage('m1')],
      })

      useMessagesStore.getState().addMessage(mockMessage('m99', 'conv-other'))

      expect(useMessagesStore.getState().messages).toHaveLength(1)
    })

    it('ignora mensagem quando nenhuma conversa está ativa', () => {
      useMessagesStore.setState({ currentConversationId: null, messages: [] })

      useMessagesStore.getState().addMessage(mockMessage('m1', 'conv-1'))

      expect(useMessagesStore.getState().messages).toHaveLength(0)
    })
  })

  describe('updateMessageStatus', () => {
    it('atualiza status da mensagem pelo id', () => {
      useMessagesStore.setState({ messages: [mockMessage('m1')] })

      useMessagesStore.getState().updateMessageStatus('m1', 'read')

      expect(useMessagesStore.getState().messages[0].status).toBe('read')
    })

    it('não altera outras mensagens', () => {
      useMessagesStore.setState({
        messages: [mockMessage('m1'), mockMessage('m2')],
      })

      useMessagesStore.getState().updateMessageStatus('m1', 'read')

      expect(useMessagesStore.getState().messages[1].status).toBe('delivered')
    })
  })

  describe('setCurrentConversation', () => {
    it('atualiza currentConversationId e limpa messages ao trocar conversa', () => {
      useMessagesStore.setState({
        currentConversationId: 'conv-1',
        messages: [mockMessage('m1')],
      })

      useMessagesStore.getState().setCurrentConversation('conv-2')

      const state = useMessagesStore.getState()
      expect(state.currentConversationId).toBe('conv-2')
      expect(state.messages).toHaveLength(0)
    })

    it('não limpa messages quando o id é o mesmo', () => {
      useMessagesStore.setState({
        currentConversationId: 'conv-1',
        messages: [mockMessage('m1')],
      })

      useMessagesStore.getState().setCurrentConversation('conv-1')

      expect(useMessagesStore.getState().messages).toHaveLength(1)
    })

    it('aceita null para limpar a conversa ativa', () => {
      useMessagesStore.setState({ currentConversationId: 'conv-1', messages: [mockMessage('m1')] })

      useMessagesStore.getState().setCurrentConversation(null)

      const state = useMessagesStore.getState()
      expect(state.currentConversationId).toBeNull()
      expect(state.messages).toHaveLength(0)
    })
  })
})
