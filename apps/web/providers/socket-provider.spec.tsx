import { render, act } from '@testing-library/react'
import { SocketProvider } from './socket-provider'
import { useSocketStore } from '@/stores/socket.store'
import { useConversationsStore } from '@/stores/conversations.store'
import { useMessagesStore } from '@/stores/messages.store'
import { useAuthStore } from '@/stores/auth.store'

type EventHandler = (...args: unknown[]) => void

const mockSocketEmit = jest.fn()
const mockSocketDisconnect = jest.fn()
const mockSocketOn = jest.fn()
const mockSocketOff = jest.fn()

const mockSocketInstance = {
  emit: mockSocketEmit,
  disconnect: mockSocketDisconnect,
  on: mockSocketOn,
  off: mockSocketOff,
  id: 'socket-test-id',
}

const mockIo = jest.fn(() => mockSocketInstance)

jest.mock('socket.io-client', () => ({ io: (...args: unknown[]) => mockIo(...args) }))

jest.mock('@/stores/auth.store', () => ({
  useAuthStore: jest.fn(),
}))

const mockAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>

function getEventHandler(eventName: string): EventHandler {
  const call = mockSocketOn.mock.calls.find(([name]: [string]) => name === eventName)
  if (!call) throw new Error(`Nenhum handler registrado para "${eventName}"`)
  return call[1] as EventHandler
}

describe('SocketProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useSocketStore.setState({ socket: null, connected: false })
    useConversationsStore.setState({ conversations: [], activeConversationId: null, isLoading: false, error: null })
    useMessagesStore.setState({ messages: [], currentConversationId: null, isLoading: false, error: null })

    mockAuthStore.mockImplementation((selector: (s: ReturnType<typeof useAuthStore>) => unknown) =>
      selector({
        user: null,
        tenant: { id: 'tenant-1', slug: 'empresa', name: 'Empresa' },
        accessToken: 'access-token-123',
        _refreshToken: null,
        isLoading: false,
        error: null,
        login: jest.fn(),
        logout: jest.fn(),
        refreshToken: jest.fn(),
        clearError: jest.fn(),
      } as unknown as ReturnType<typeof useAuthStore>),
    )
  })

  it('cria conexão socket com tenantId e token quando autenticado', () => {
    render(<SocketProvider><div /></SocketProvider>)

    expect(mockIo).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        auth: { tenantId: 'tenant-1', token: 'access-token-123' },
      }),
    )
  })

  it('não cria socket quando tenant é null', () => {
    mockAuthStore.mockImplementation((selector: (s: ReturnType<typeof useAuthStore>) => unknown) =>
      selector({
        tenant: null,
        accessToken: null,
      } as unknown as ReturnType<typeof useAuthStore>),
    )

    render(<SocketProvider><div /></SocketProvider>)

    expect(mockIo).not.toHaveBeenCalled()
  })

  it('emite room:join ao conectar e marca connected=true', () => {
    render(<SocketProvider><div /></SocketProvider>)

    act(() => {
      getEventHandler('connect')()
    })

    expect(mockSocketEmit).toHaveBeenCalledWith('room:join', { tenantId: 'tenant-1' })
    expect(useSocketStore.getState().connected).toBe(true)
  })

  it('marca connected=false ao desconectar', () => {
    render(<SocketProvider><div /></SocketProvider>)

    act(() => { getEventHandler('connect')() })
    act(() => { getEventHandler('disconnect')() })

    expect(useSocketStore.getState().connected).toBe(false)
  })

  it('adiciona conversa ao receber conversation:new', () => {
    render(<SocketProvider><div /></SocketProvider>)

    const conversation = {
      id: 'c1',
      status: 'open',
      contactPhone: '31999990000',
      unreadCount: 1,
    }

    act(() => {
      getEventHandler('conversation:new')({ conversation })
    })

    expect(useConversationsStore.getState().conversations[0]).toMatchObject({ id: 'c1' })
  })

  it('adiciona mensagem ao receber message:new para conversa ativa', () => {
    useMessagesStore.setState({ currentConversationId: 'c1', messages: [] })
    render(<SocketProvider><div /></SocketProvider>)

    const message = {
      id: 'm1',
      conversationId: 'c1',
      direction: 'inbound',
      type: 'text',
      content: 'Olá',
      status: 'delivered',
      createdAt: '2026-05-06T10:00:00Z',
    }

    act(() => {
      getEventHandler('message:new')({ conversationId: 'c1', message })
    })

    expect(useMessagesStore.getState().messages[0]).toMatchObject({ id: 'm1' })
  })

  it('atualiza conversa ao receber conversation:updated', () => {
    useConversationsStore.setState({
      conversations: [{ id: 'c1', status: 'open', contactPhone: '0', unreadCount: 0 }],
    })
    render(<SocketProvider><div /></SocketProvider>)

    act(() => {
      getEventHandler('conversation:updated')({ conversationId: 'c1', changes: { status: 'resolved' } })
    })

    expect(useConversationsStore.getState().conversations[0].status).toBe('resolved')
  })

  it('desconecta e limpa stores ao desmontar', () => {
    const { unmount } = render(<SocketProvider><div /></SocketProvider>)

    act(() => { getEventHandler('connect')() })
    unmount()

    expect(mockSocketEmit).toHaveBeenCalledWith('room:leave', { tenantId: 'tenant-1' })
    expect(mockSocketDisconnect).toHaveBeenCalled()
    expect(useSocketStore.getState().socket).toBeNull()
    expect(useSocketStore.getState().connected).toBe(false)
  })
})
