import { useSocketStore } from './socket.store'
import type { Socket } from 'socket.io-client'

function resetStore() {
  useSocketStore.setState({ socket: null, connected: false })
}

describe('useSocketStore', () => {
  beforeEach(resetStore)

  it('inicia com socket null e connected false', () => {
    const state = useSocketStore.getState()
    expect(state.socket).toBeNull()
    expect(state.connected).toBe(false)
  })

  it('setState({ connected: true }) marca conexão ativa', () => {
    useSocketStore.setState({ connected: true })
    expect(useSocketStore.getState().connected).toBe(true)
  })

  it('setState({ socket }) armazena a instância do socket', () => {
    const mockSocket = { id: 'socket-1' } as unknown as Socket
    useSocketStore.setState({ socket: mockSocket })
    expect(useSocketStore.getState().socket).toBe(mockSocket)
  })

  it('setState({ socket: null, connected: false }) limpa o estado ao desconectar', () => {
    const mockSocket = { id: 'socket-1' } as unknown as Socket
    useSocketStore.setState({ socket: mockSocket, connected: true })

    useSocketStore.setState({ socket: null, connected: false })

    const state = useSocketStore.getState()
    expect(state.socket).toBeNull()
    expect(state.connected).toBe(false)
  })
})
