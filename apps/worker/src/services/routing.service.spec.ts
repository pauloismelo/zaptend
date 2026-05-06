import { Test, TestingModule } from '@nestjs/testing'
import { RoutingService } from './routing.service'
import { PrismaService } from '../prisma/prisma.service'

// ── Mocks ─────────────────────────────────────────────────────────────────────

const prismaMock = {
  user: {
    findMany: jest.fn(),
  },
  conversation: {
    count: jest.fn(),
    update: jest.fn(),
  },
  conversationEvent: {
    create: jest.fn(),
  },
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

const TENANT_ID = 'tenant-abc'
const CONVERSATION_ID = 'conv-001'

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('RoutingService', () => {
  let service: RoutingService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoutingService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile()

    service = module.get<RoutingService>(RoutingService)
  })

  afterEach(() => jest.clearAllMocks())

  // ── assignConversation ───────────────────────────────────────────────────────

  describe('assignConversation()', () => {
    it('deve atribuir ao agente com menor carga de conversas', async () => {
      prismaMock.user.findMany.mockResolvedValue([
        { id: 'agent-A' },
        { id: 'agent-B' },
        { id: 'agent-C' },
      ])
      // agent-A: 5 conversas, agent-B: 2 conversas, agent-C: 8 conversas
      prismaMock.conversation.count
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(8)
      prismaMock.conversation.update.mockResolvedValue({})
      prismaMock.conversationEvent.create.mockResolvedValue({})

      await service.assignConversation(TENANT_ID, CONVERSATION_ID)

      expect(prismaMock.conversation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: CONVERSATION_ID },
          data: expect.objectContaining({
            assignedUserId: 'agent-B',
            status: 'attending',
            lastAssignedAt: expect.any(Date),
          }),
        }),
      )
    })

    it('deve criar evento de conversa com reason auto_routing', async () => {
      prismaMock.user.findMany.mockResolvedValue([{ id: 'agent-A' }])
      prismaMock.conversation.count.mockResolvedValue(0)
      prismaMock.conversation.update.mockResolvedValue({})
      prismaMock.conversationEvent.create.mockResolvedValue({})

      await service.assignConversation(TENANT_ID, CONVERSATION_ID)

      expect(prismaMock.conversationEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            conversationId: CONVERSATION_ID,
            type: 'assigned',
            actorId: null,
            metadata: expect.objectContaining({
              assignedTo: 'agent-A',
              reason: 'auto_routing',
            }),
          }),
        }),
      )
    })

    it('deve atribuir ao único agente disponível com 0 conversas', async () => {
      prismaMock.user.findMany.mockResolvedValue([{ id: 'agent-solo' }])
      prismaMock.conversation.count.mockResolvedValue(0)
      prismaMock.conversation.update.mockResolvedValue({})
      prismaMock.conversationEvent.create.mockResolvedValue({})

      await service.assignConversation(TENANT_ID, CONVERSATION_ID)

      expect(prismaMock.conversation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ assignedUserId: 'agent-solo' }),
        }),
      )
    })

    it('não deve atribuir quando nenhum agente está online', async () => {
      prismaMock.user.findMany.mockResolvedValue([])

      await service.assignConversation(TENANT_ID, CONVERSATION_ID)

      expect(prismaMock.conversation.update).not.toHaveBeenCalled()
      expect(prismaMock.conversationEvent.create).not.toHaveBeenCalled()
    })

    it('deve buscar agentes somente do tenant correto — isolamento', async () => {
      prismaMock.user.findMany.mockResolvedValue([])

      await service.assignConversation(TENANT_ID, CONVERSATION_ID)

      expect(prismaMock.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: TENANT_ID }),
        }),
      )
    })

    it('deve contar conversas ativas somente do tenant correto', async () => {
      prismaMock.user.findMany.mockResolvedValue([{ id: 'agent-A' }])
      prismaMock.conversation.count.mockResolvedValue(3)
      prismaMock.conversation.update.mockResolvedValue({})
      prismaMock.conversationEvent.create.mockResolvedValue({})

      await service.assignConversation(TENANT_ID, CONVERSATION_ID)

      expect(prismaMock.conversation.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: TENANT_ID,
            assignedUserId: 'agent-A',
            status: { in: ['open', 'attending', 'waiting_customer'] },
          }),
        }),
      )
    })

    it('deve preferir agente com 0 conversas em relação a agente ocupado', async () => {
      prismaMock.user.findMany.mockResolvedValue([
        { id: 'agent-ocupado' },
        { id: 'agent-livre' },
      ])
      prismaMock.conversation.count
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(0)
      prismaMock.conversation.update.mockResolvedValue({})
      prismaMock.conversationEvent.create.mockResolvedValue({})

      await service.assignConversation(TENANT_ID, CONVERSATION_ID)

      expect(prismaMock.conversation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ assignedUserId: 'agent-livre' }),
        }),
      )
    })
  })
})
