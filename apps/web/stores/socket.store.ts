import { create } from 'zustand'
import type { Socket } from 'socket.io-client'

interface SocketState {
  socket: Socket | null
  connected: boolean
}

export const useSocketStore = create<SocketState>(() => ({
  socket: null,
  connected: false,
}))
