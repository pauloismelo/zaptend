import { act } from 'react'
import { useConversationsStore } from './conversations.store'
import type { Conversation } from './conversations.store'

const mockConv = (id: string, status: Conversation['status'] = 'open'): Conversation => ({
  id,
  status,
  contactPhone: '31999990000',
  contactName: `Contato ${id}`,
  unreadCount: 0,
})

function resetStore() {
  useConversationsStore.setState({
    conversations: [],
    activeConversationId: null,
    isLoading: false,
    error: null,
  })
}

const mockFetch = jest.fn()
global.fetch = mockFetch

describe('useConversationsStore', () => {
  beforeEach(() => {
    resetStore()
    jest.clearAllMocks()
    jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(
      JSON.stringify({ state: { accessToken: 'test-token' } }),
    )
  })

  describe('fetchConversations', () => {
    it('popula conversations e limpa isLoading após sucesso', async () => {
      const data = [mockConv('c1'), mockConv('c2')]
      mockFetch.mockResolvedValue({ ok: true, json: async () => data })

      await act(async () => {
        await useConversationsStore.getState().fetchConversations()
      })

      const state = useConversationsStore.getState()
      expect(state.conversations).toEqual(data)
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
    })

    it('define error quando resposta não é ok', async () => {
      mockFetch.mockResolvedValue({ ok: false })

      await act(async () => {
        await useConversationsStore.getState().fetchConversations()
      })

      const state = useConversationsStore.getState()
      expect(state.error).toBe('Falha ao carregar conversas')
      expect(state.isLoading).toBe(false)
    })

    it('define error quando fetch rejeita', async () => {
      mockFetch.mockRejectedValue(new Error('Network Error'))

      await act(async () => {
        await useConversationsStore.getState().fetchConversations()
      })

      expect(useConversationsStore.getState().error).toBe('Network Error')
      expect(useConversationsStore.getState().isLoading).toBe(false)
    })

    it('define isLoading=true durante o request', async () => {
      let resolve!: (v: unknown) => void
      mockFetch.mockReturnValue(new Promise((r) => { resolve = r }))

      act(() => { useConversationsStore.getState().fetchConversations() })
      expect(useConversationsStore.getState().isLoading).toBe(true)

      await act(async () => { resolve({ ok: true, json: async () => [] }) })
      expect(useConversationsStore.getState().isLoading).toBe(false)
    })

    it('envia Authorization header com token', async () => {
      mockFetch.mockResolvedValue({ ok: true, json: async () => [] })

      await act(async () => {
        await useConversationsStore.getState().fetchConversations()
      })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/conversations'),
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
        }),
      )
    })
  })

  describe('addConversation', () => {
    it('adiciona nova conversa no início da lista', () => {
      useConversationsStore.setState({ conversations: [mockConv('c1')] })

      useConversationsStore.getState().addConversation(mockConv('c2'))

      const { conversations } = useConversationsStore.getState()
      expect(conversations[0].id).toBe('c2')
      expect(conversations).toHaveLength(2)
    })
  })

  describe('updateConversation', () => {
    it('atualiza campos da conversa pelo id', () => {
      useConversationsStore.setState({ conversations: [mockConv('c1', 'open')] })

      useConversationsStore.getState().updateConversation('c1', { status: 'resolved' })

      expect(useConversationsStore.getState().conversations[0].status).toBe('resolved')
    })

    it('não altera outras conversas', () => {
      useConversationsStore.setState({ conversations: [mockConv('c1'), mockConv('c2')] })

      useConversationsStore.getState().updateConversation('c1', { unreadCount: 5 })

      expect(useConversationsStore.getState().conversations[1].unreadCount).toBe(0)
    })
  })

  describe('removeConversation', () => {
    it('remove conversa pelo id', () => {
      useConversationsStore.setState({ conversations: [mockConv('c1'), mockConv('c2')] })

      useConversationsStore.getState().removeConversation('c1')

      const { conversations } = useConversationsStore.getState()
      expect(conversations).toHaveLength(1)
      expect(conversations[0].id).toBe('c2')
    })
  })

  describe('setActiveConversation', () => {
    it('atualiza activeConversationId', () => {
      useConversationsStore.getState().setActiveConversation('c1')
      expect(useConversationsStore.getState().activeConversationId).toBe('c1')
    })

    it('aceita null para deselecionar', () => {
      useConversationsStore.setState({ activeConversationId: 'c1' })
      useConversationsStore.getState().setActiveConversation(null)
      expect(useConversationsStore.getState().activeConversationId).toBeNull()
    })
  })

  describe('setConversations', () => {
    it('substitui a lista inteira de conversas', () => {
      useConversationsStore.setState({ conversations: [mockConv('c1')] })

      const newList = [mockConv('c2'), mockConv('c3')]
      useConversationsStore.getState().setConversations(newList)

      expect(useConversationsStore.getState().conversations).toEqual(newList)
    })
  })
})
