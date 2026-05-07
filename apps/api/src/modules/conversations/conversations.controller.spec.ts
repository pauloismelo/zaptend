import { Test, TestingModule } from '@nestjs/testing'
import { ConversationsController } from './conversations.controller'
import { ConversationsService } from './conversations.service'
import { JwtPayload } from '@zaptend/types'

const serviceMock = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  assign: jest.fn(),
  transfer: jest.fn(),
  resolve: jest.fn(),
}

const mockUser: JwtPayload = {
  sub: 'user-1',
  email: 'agent@tenant.com',
  role: 'agent',
  tenantId: 'tenant-a',
  tenantSlug: 'acme',
}

const mockConversation = {
  id: 'conv-1',
  tenantId: 'tenant-a',
  contactId: 'contact-1',
  assignedUserId: 'user-1',
  departmentId: 'dept-1',
  channel: 'whatsapp',
  status: 'open',
  subject: null,
  tags: ['lead'],
  pipelineStage: null,
  isBot: false,
  slaDeadline: null,
  slaBreached: false,
  lastMessageAt: new Date(),
  resolvedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockPaginated = {
  data: [mockConversation],
  total: 1,
  page: 1,
  limit: 20,
  totalPages: 1,
}

describe('ConversationsController', () => {
  let controller: ConversationsController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConversationsController],
      providers: [{ provide: ConversationsService, useValue: serviceMock }],
    }).compile()

    controller = module.get<ConversationsController>(ConversationsController)
  })

  afterEach(() => jest.clearAllMocks())

  // ── findAll ─────────────────────────────────────────

  describe('findAll', () => {
    it('deve chamar service.findAll com tenantId do usuário autenticado', async () => {
      serviceMock.findAll.mockResolvedValue(mockPaginated)

      const result = await controller.findAll(mockUser, { page: 1, limit: 20 })

      expect(serviceMock.findAll).toHaveBeenCalledWith('tenant-a', { page: 1, limit: 20 })
      expect(result).toEqual(mockPaginated)
    })

    it('deve repassar filtros para o service', async () => {
      serviceMock.findAll.mockResolvedValue(mockPaginated)

      const filters = { status: 'open' as any, assignedUserId: 'user-1' }
      await controller.findAll(mockUser, filters)

      expect(serviceMock.findAll).toHaveBeenCalledWith('tenant-a', filters)
    })
  })

  // ── findOne ─────────────────────────────────────────

  describe('findOne', () => {
    it('deve chamar service.findOne com id e tenantId do usuário', async () => {
      serviceMock.findOne.mockResolvedValue(mockConversation)

      const result = await controller.findOne('conv-1', mockUser)

      expect(serviceMock.findOne).toHaveBeenCalledWith('conv-1', 'tenant-a')
      expect(result).toEqual(mockConversation)
    })
  })

  // ── update ──────────────────────────────────────────

  describe('update', () => {
    it('deve chamar service.update com id, tenantId e dto', async () => {
      const updatedConv = { ...mockConversation, tags: ['vip'] }
      serviceMock.update.mockResolvedValue(updatedConv)

      const dto = { tags: ['vip'] }
      const result = await controller.update('conv-1', dto, mockUser)

      expect(serviceMock.update).toHaveBeenCalledWith('conv-1', 'tenant-a', dto)
      expect(result).toEqual(updatedConv)
    })
  })

  // ── assign ──────────────────────────────────────────

  describe('assign', () => {
    it('deve chamar service.assign com id, tenantId, dto e userId do ator', async () => {
      const assignedConv = { ...mockConversation, assignedUserId: 'user-2', status: 'attending' }
      serviceMock.assign.mockResolvedValue(assignedConv)

      const dto = { userId: 'user-2' }
      const result = await controller.assign('conv-1', dto, mockUser)

      expect(serviceMock.assign).toHaveBeenCalledWith('conv-1', 'tenant-a', dto, 'user-1')
      expect(result).toEqual(assignedConv)
    })
  })

  // ── transfer ─────────────────────────────────────────

  describe('transfer', () => {
    it('deve chamar service.transfer com id, tenantId, dto e userId do ator', async () => {
      const transferredConv = { ...mockConversation, assignedUserId: 'user-3' }
      serviceMock.transfer.mockResolvedValue(transferredConv)

      const dto = { userId: 'user-3', note: 'Encaminhado para suporte técnico' }
      const result = await controller.transfer('conv-1', dto, mockUser)

      expect(serviceMock.transfer).toHaveBeenCalledWith('conv-1', 'tenant-a', dto, 'user-1')
      expect(result).toEqual(transferredConv)
    })
  })

  // ── resolve ──────────────────────────────────────────

  describe('resolve', () => {
    it('deve chamar service.resolve com id, tenantId e userId do ator', async () => {
      const resolvedConv = { ...mockConversation, status: 'resolved', resolvedAt: new Date() }
      serviceMock.resolve.mockResolvedValue(resolvedConv)

      const result = await controller.resolve('conv-1', mockUser)

      expect(serviceMock.resolve).toHaveBeenCalledWith('conv-1', 'tenant-a', 'user-1')
      expect(result).toEqual(resolvedConv)
    })
  })
})
