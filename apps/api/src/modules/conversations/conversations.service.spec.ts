import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException, BadRequestException } from '@nestjs/common'
import { ConversationsService } from './conversations.service'
import { PrismaService } from '../../prisma/prisma.service'

const prismaMock = {
  conversation: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
  },
  user: {
    findFirst: jest.fn(),
  },
  department: {
    findFirst: jest.fn(),
  },
  conversationEvent: {
    create: jest.fn(),
  },
  internalNote: {
    create: jest.fn(),
  },
  $transaction: jest.fn(),
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
  lastMessageAt: new Date('2026-01-10'),
  resolvedAt: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  contact: { id: 'contact-1', phone: '+5511999', name: 'João', avatarUrl: null, company: null, tags: [] },
  assignedUser: { id: 'user-1', name: 'Agente', avatarUrl: null, email: 'agent@t.com' },
}

const mockAgent = {
  id: 'user-1',
  tenantId: 'tenant-a',
  isActive: true,
  deletedAt: null,
}

describe('ConversationsService', () => {
  let service: ConversationsService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConversationsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile()

    service = module.get<ConversationsService>(ConversationsService)
  })

  afterEach(() => jest.clearAllMocks())

  // ── findAll ─────────────────────────────────────────

  describe('findAll', () => {
    it('deve retornar conversas paginadas do tenant correto', async () => {
      prismaMock.conversation.findMany.mockResolvedValue([mockConversation])
      prismaMock.conversation.count.mockResolvedValue(1)

      const result = await service.findAll('tenant-a', { page: 1, limit: 20 })

      expect(prismaMock.conversation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: 'tenant-a', deletedAt: null }),
        }),
      )
      expect(result.data).toHaveLength(1)
      expect(result.total).toBe(1)
      expect(result.page).toBe(1)
      expect(result.limit).toBe(20)
      expect(result.totalPages).toBe(1)
    })

    it('não deve retornar conversas de outro tenant', async () => {
      prismaMock.conversation.findMany.mockResolvedValue([])
      prismaMock.conversation.count.mockResolvedValue(0)

      const result = await service.findAll('tenant-b', {})

      expect(prismaMock.conversation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: 'tenant-b' }),
        }),
      )
      expect(result.data).toHaveLength(0)
    })

    it('deve aplicar filtro de status quando fornecido', async () => {
      prismaMock.conversation.findMany.mockResolvedValue([])
      prismaMock.conversation.count.mockResolvedValue(0)

      await service.findAll('tenant-a', { status: 'open' as any })

      expect(prismaMock.conversation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'open' }),
        }),
      )
    })

    it('deve aplicar filtro de assignedUserId quando fornecido', async () => {
      prismaMock.conversation.findMany.mockResolvedValue([])
      prismaMock.conversation.count.mockResolvedValue(0)

      await service.findAll('tenant-a', { assignedUserId: 'user-1' })

      expect(prismaMock.conversation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ assignedUserId: 'user-1' }),
        }),
      )
    })

    it('deve aplicar filtro de tags quando fornecido', async () => {
      prismaMock.conversation.findMany.mockResolvedValue([])
      prismaMock.conversation.count.mockResolvedValue(0)

      await service.findAll('tenant-a', { tags: 'lead' })

      expect(prismaMock.conversation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tags: { hasSome: ['lead'] } }),
        }),
      )
    })

    it('deve calcular totalPages corretamente', async () => {
      prismaMock.conversation.findMany.mockResolvedValue([])
      prismaMock.conversation.count.mockResolvedValue(45)

      const result = await service.findAll('tenant-a', { limit: 20 })

      expect(result.totalPages).toBe(3)
    })

    it('deve usar defaults de page e limit quando não fornecidos', async () => {
      prismaMock.conversation.findMany.mockResolvedValue([])
      prismaMock.conversation.count.mockResolvedValue(0)

      const result = await service.findAll('tenant-a', {})

      expect(result.page).toBe(1)
      expect(result.limit).toBe(20)
      expect(prismaMock.conversation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 20, skip: 0 }),
      )
    })
  })

  // ── findOne ─────────────────────────────────────────

  describe('findOne', () => {
    it('deve retornar a conversa com mensagens e contato', async () => {
      prismaMock.conversation.findFirst.mockResolvedValue(mockConversation)

      const result = await service.findOne('conv-1', 'tenant-a')

      expect(prismaMock.conversation.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'conv-1', tenantId: 'tenant-a', deletedAt: null },
        }),
      )
      expect(result).toBeDefined()
    })

    it('deve lançar NotFoundException se não encontrar', async () => {
      prismaMock.conversation.findFirst.mockResolvedValue(null)

      await expect(service.findOne('id-inexistente', 'tenant-a')).rejects.toThrow(NotFoundException)
    })

    it('deve lançar NotFoundException para conversa de outro tenant', async () => {
      prismaMock.conversation.findFirst.mockResolvedValue(null)

      await expect(service.findOne('conv-1', 'tenant-b')).rejects.toThrow(NotFoundException)
    })
  })

  // ── update ──────────────────────────────────────────

  describe('update', () => {
    it('deve atualizar campos fornecidos', async () => {
      prismaMock.conversation.findFirst.mockResolvedValue(mockConversation)
      prismaMock.conversation.update.mockResolvedValue({
        ...mockConversation,
        tags: ['vip', 'urgente'],
      })

      const result = await service.update('conv-1', 'tenant-a', { tags: ['vip', 'urgente'] })

      expect(prismaMock.conversation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'conv-1' },
          data: expect.objectContaining({ tags: ['vip', 'urgente'] }),
        }),
      )
      expect(result).toBeDefined()
    })

    it('deve lançar NotFoundException se conversa não existir', async () => {
      prismaMock.conversation.findFirst.mockResolvedValue(null)

      await expect(service.update('conv-x', 'tenant-a', { pipelineStage: 'proposta' })).rejects.toThrow(
        NotFoundException,
      )
      expect(prismaMock.conversation.update).not.toHaveBeenCalled()
    })

    it('deve lançar NotFoundException para conversa de outro tenant', async () => {
      prismaMock.conversation.findFirst.mockResolvedValue(null)

      await expect(service.update('conv-1', 'tenant-b', { status: 'resolved' as any })).rejects.toThrow(
        NotFoundException,
      )
    })
  })

  // ── assign ──────────────────────────────────────────

  describe('assign', () => {
    it('deve atribuir conversa ao agente e criar evento', async () => {
      prismaMock.conversation.findFirst.mockResolvedValue(mockConversation)
      prismaMock.user.findFirst.mockResolvedValue(mockAgent)
      prismaMock.$transaction.mockResolvedValue([
        { ...mockConversation, assignedUserId: 'user-2', status: 'attending' },
        {},
      ])

      const result = await service.assign('conv-1', 'tenant-a', { userId: 'user-2' }, 'actor-1')

      expect(prismaMock.user.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ id: 'user-2', tenantId: 'tenant-a' }) }),
      )
      expect(prismaMock.$transaction).toHaveBeenCalled()
      expect(result).toBeDefined()
    })

    it('deve lançar NotFoundException se agente não existir no tenant', async () => {
      prismaMock.conversation.findFirst.mockResolvedValue(mockConversation)
      prismaMock.user.findFirst.mockResolvedValue(null)

      await expect(
        service.assign('conv-1', 'tenant-a', { userId: 'user-fantasma' }, 'actor-1'),
      ).rejects.toThrow(NotFoundException)
      expect(prismaMock.$transaction).not.toHaveBeenCalled()
    })

    it('deve lançar NotFoundException se conversa não pertencer ao tenant', async () => {
      prismaMock.conversation.findFirst.mockResolvedValue(null)

      await expect(
        service.assign('conv-1', 'tenant-b', { userId: 'user-1' }, 'actor-1'),
      ).rejects.toThrow(NotFoundException)
    })
  })

  // ── transfer ─────────────────────────────────────────

  describe('transfer', () => {
    it('deve transferir conversa para agente com nota interna', async () => {
      prismaMock.conversation.findFirst.mockResolvedValue(mockConversation)
      prismaMock.user.findFirst.mockResolvedValue(mockAgent)
      prismaMock.$transaction.mockResolvedValue([
        { ...mockConversation, assignedUserId: 'user-2' },
        {},
        {},
      ])

      const dto = { userId: 'user-2', note: 'Precisa de suporte técnico' }
      const result = await service.transfer('conv-1', 'tenant-a', dto, 'actor-1')

      expect(prismaMock.$transaction).toHaveBeenCalled()
      expect(result).toBeDefined()
    })

    it('deve lançar BadRequestException se nem userId nem departmentId for informado', async () => {
      await expect(
        service.transfer('conv-1', 'tenant-a', { note: 'sem destino' }, 'actor-1'),
      ).rejects.toThrow(BadRequestException)
    })

    it('deve lançar NotFoundException se departamento de destino não existir', async () => {
      prismaMock.conversation.findFirst.mockResolvedValue(mockConversation)
      prismaMock.department.findFirst.mockResolvedValue(null)

      await expect(
        service.transfer('conv-1', 'tenant-a', { departmentId: 'dept-x', note: 'test' }, 'actor-1'),
      ).rejects.toThrow(NotFoundException)
    })

    it('deve lançar NotFoundException se conversa não pertencer ao tenant', async () => {
      prismaMock.conversation.findFirst.mockResolvedValue(null)

      await expect(
        service.transfer('conv-1', 'tenant-b', { userId: 'user-1', note: 'test' }, 'actor-1'),
      ).rejects.toThrow(NotFoundException)
    })
  })

  // ── resolve ──────────────────────────────────────────

  describe('resolve', () => {
    it('deve marcar conversa como resolvida e criar evento', async () => {
      prismaMock.conversation.findFirst.mockResolvedValue(mockConversation)
      prismaMock.$transaction.mockResolvedValue([
        { ...mockConversation, status: 'resolved', resolvedAt: new Date() },
        {},
      ])

      const result = await service.resolve('conv-1', 'tenant-a', 'actor-1')

      expect(prismaMock.$transaction).toHaveBeenCalled()
      expect(result).toBeDefined()
    })

    it('deve lançar NotFoundException se conversa não existir', async () => {
      prismaMock.conversation.findFirst.mockResolvedValue(null)

      await expect(service.resolve('conv-x', 'tenant-a', 'actor-1')).rejects.toThrow(NotFoundException)
      expect(prismaMock.$transaction).not.toHaveBeenCalled()
    })

    it('deve lançar NotFoundException para conversa de outro tenant', async () => {
      prismaMock.conversation.findFirst.mockResolvedValue(null)

      await expect(service.resolve('conv-1', 'tenant-b', 'actor-1')).rejects.toThrow(NotFoundException)
    })
  })
})
