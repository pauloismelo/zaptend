import { Test, TestingModule } from '@nestjs/testing'
import { JwtService } from '@nestjs/jwt'
import { MessagesGateway } from './messages.gateway'

const jwtServiceMock = {
  verify: jest.fn(),
}

const buildSocket = () => ({
  id: 'socket-1',
  handshake: { auth: {}, headers: {} as Record<string, string> },
  data: {} as Record<string, unknown>,
  join: jest.fn(),
  leave: jest.fn(),
  to: jest.fn().mockReturnThis(),
  emit: jest.fn(),
  disconnect: jest.fn(),
})

const mockServer = {
  to: jest.fn().mockReturnThis(),
  emit: jest.fn(),
}

describe('MessagesGateway', () => {
  let gateway: MessagesGateway
  let mockSocket: ReturnType<typeof buildSocket>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesGateway,
        { provide: JwtService, useValue: jwtServiceMock },
      ],
    }).compile()

    gateway = module.get<MessagesGateway>(MessagesGateway)
    gateway.server = mockServer as never
    mockSocket = buildSocket()
    jest.clearAllMocks()
    mockSocket.to.mockReturnThis()
    mockServer.to.mockReturnThis()
  })

  describe('handleConnection', () => {
    it('deve autenticar via auth.token e entrar na sala do tenant', async () => {
      const payload = { sub: 'user-1', tenantId: 'tenant-1', email: 'a@b.com', role: 'agent', tenantSlug: 's' }
      jwtServiceMock.verify.mockReturnValue(payload)
      mockSocket.handshake.auth = { token: 'valid-token' }

      await gateway.handleConnection(mockSocket as never)

      expect(mockSocket.data.user).toEqual(payload)
      expect(mockSocket.join).toHaveBeenCalledWith('tenant:tenant-1')
      expect(mockSocket.disconnect).not.toHaveBeenCalled()
    })

    it('deve autenticar via Authorization header', async () => {
      const payload = { sub: 'user-2', tenantId: 'tenant-2', email: 'b@b.com', role: 'agent', tenantSlug: 's' }
      jwtServiceMock.verify.mockReturnValue(payload)
      mockSocket.handshake.auth = {}
      mockSocket.handshake.headers = { authorization: 'Bearer header-token' }

      await gateway.handleConnection(mockSocket as never)

      expect(jwtServiceMock.verify).toHaveBeenCalledWith('header-token')
      expect(mockSocket.join).toHaveBeenCalledWith('tenant:tenant-2')
    })

    it('deve colocar supervisores na sala de alertas', async () => {
      const payload = { sub: 'user-3', tenantId: 'tenant-1', email: 's@b.com', role: 'supervisor', tenantSlug: 's' }
      jwtServiceMock.verify.mockReturnValue(payload)
      mockSocket.handshake.auth = { token: 'valid-token' }

      await gateway.handleConnection(mockSocket as never)

      expect(mockSocket.join).toHaveBeenCalledWith('tenant:tenant-1')
      expect(mockSocket.join).toHaveBeenCalledWith('tenant:tenant-1:supervisors')
    })

    it('deve autenticar worker via workerSecret', async () => {
      process.env.WORKER_SECRET = 'worker-secret'
      mockSocket.handshake.auth = { workerSecret: 'worker-secret' }

      await gateway.handleConnection(mockSocket as never)

      expect(mockSocket.data.worker).toBe(true)
      expect(jwtServiceMock.verify).not.toHaveBeenCalled()
      expect(mockSocket.disconnect).not.toHaveBeenCalled()
    })

    it('deve desconectar quando nenhum token fornecido', async () => {
      mockSocket.handshake.auth = {}
      mockSocket.handshake.headers = {}

      await gateway.handleConnection(mockSocket as never)

      expect(mockSocket.disconnect).toHaveBeenCalled()
      expect(mockSocket.join).not.toHaveBeenCalled()
    })

    it('deve desconectar quando token inválido', async () => {
      jwtServiceMock.verify.mockImplementation(() => { throw new Error('invalid token') })
      mockSocket.handshake.auth = { token: 'bad-token' }

      await gateway.handleConnection(mockSocket as never)

      expect(mockSocket.disconnect).toHaveBeenCalled()
    })
  })

  describe('handleDisconnect', () => {
    it('deve registrar desconexão sem lançar erros', () => {
      expect(() => gateway.handleDisconnect(mockSocket as never)).not.toThrow()
    })
  })

  describe('handleRoomJoin', () => {
    it('deve entrar na sala quando tenantId corresponde ao usuário', () => {
      mockSocket.data.user = { tenantId: 'tenant-1' }

      gateway.handleRoomJoin(mockSocket as never, { tenantId: 'tenant-1' })

      expect(mockSocket.join).toHaveBeenCalledWith('tenant:tenant-1')
    })

    it('não deve entrar na sala de outro tenant', () => {
      mockSocket.data.user = { tenantId: 'tenant-1' }

      gateway.handleRoomJoin(mockSocket as never, { tenantId: 'tenant-outro' })

      expect(mockSocket.join).not.toHaveBeenCalled()
    })
  })

  describe('handleRoomLeave', () => {
    it('deve sair da sala do tenant', () => {
      gateway.handleRoomLeave(mockSocket as never, { tenantId: 'tenant-1' })

      expect(mockSocket.leave).toHaveBeenCalledWith('tenant:tenant-1')
    })
  })

  describe('handleTypingStart', () => {
    it('deve emitir user:typing com isTyping=true para a sala do tenant', () => {
      mockSocket.data.user = { tenantId: 'tenant-1', sub: 'user-1' }

      gateway.handleTypingStart(mockSocket as never, { conversationId: 'conv-1' })

      expect(mockSocket.to).toHaveBeenCalledWith('tenant:tenant-1')
      expect(mockSocket.emit).toHaveBeenCalledWith('user:typing', {
        conversationId: 'conv-1',
        userId: 'user-1',
        isTyping: true,
      })
    })
  })

  describe('handleTypingStop', () => {
    it('deve emitir user:typing com isTyping=false para a sala do tenant', () => {
      mockSocket.data.user = { tenantId: 'tenant-1', sub: 'user-1' }

      gateway.handleTypingStop(mockSocket as never, { conversationId: 'conv-1' })

      expect(mockSocket.to).toHaveBeenCalledWith('tenant:tenant-1')
      expect(mockSocket.emit).toHaveBeenCalledWith('user:typing', {
        conversationId: 'conv-1',
        userId: 'user-1',
        isTyping: false,
      })
    })
  })

  describe('handleWorkerEmit', () => {
    it('deve retransmitir evento do worker para sala do tenant', () => {
      mockSocket.data.worker = true

      gateway.handleWorkerEmit(mockSocket as never, {
        tenantId: 'tenant-1',
        event: 'message:new',
        data: { id: 'msg-1' },
      })

      expect(mockServer.to).toHaveBeenCalledWith('tenant:tenant-1')
      expect(mockServer.emit).toHaveBeenCalledWith('message:new', { id: 'msg-1' })
    })

    it('deve enviar supervisor:alert apenas para sala de supervisores', () => {
      mockSocket.data.worker = true

      gateway.handleWorkerEmit(mockSocket as never, {
        tenantId: 'tenant-1',
        event: 'supervisor:alert',
        data: { conversationId: 'conv-1' },
      })

      expect(mockServer.to).toHaveBeenCalledWith('tenant:tenant-1:supervisors')
      expect(mockServer.emit).toHaveBeenCalledWith('supervisor:alert', { conversationId: 'conv-1' })
    })
  })

  describe('emit methods', () => {
    it('emitConversationNew deve emitir conversation:new para sala do tenant', () => {
      gateway.emitConversationNew('tenant-1', { id: 'conv-1', status: 'open' })

      expect(mockServer.to).toHaveBeenCalledWith('tenant:tenant-1')
      expect(mockServer.emit).toHaveBeenCalledWith('conversation:new', {
        conversation: { id: 'conv-1', status: 'open' },
      })
    })

    it('emitMessageNew deve emitir message:new para sala do tenant', () => {
      gateway.emitMessageNew('tenant-1', 'conv-1', { id: 'msg-1', content: 'Oi' })

      expect(mockServer.to).toHaveBeenCalledWith('tenant:tenant-1')
      expect(mockServer.emit).toHaveBeenCalledWith('message:new', {
        conversationId: 'conv-1',
        message: { id: 'msg-1', content: 'Oi' },
      })
    })

    it('emitConversationUpdated deve emitir conversation:updated para sala do tenant', () => {
      gateway.emitConversationUpdated('tenant-1', 'conv-1', { status: 'resolved' })

      expect(mockServer.to).toHaveBeenCalledWith('tenant:tenant-1')
      expect(mockServer.emit).toHaveBeenCalledWith('conversation:updated', {
        conversationId: 'conv-1',
        changes: { status: 'resolved' },
      })
    })

    it('emitMessageStatus deve emitir message:status para sala do tenant', () => {
      gateway.emitMessageStatus('tenant-1', 'msg-1', 'delivered')

      expect(mockServer.to).toHaveBeenCalledWith('tenant:tenant-1')
      expect(mockServer.emit).toHaveBeenCalledWith('message:status', {
        messageId: 'msg-1',
        status: 'delivered',
      })
    })
  })
})
