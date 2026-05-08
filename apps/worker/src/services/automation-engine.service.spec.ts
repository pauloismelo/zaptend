import { AutomationEngineService } from './automation-engine.service'

const prismaMock = {
  automationFlow: {
    findMany: jest.fn(),
  },
  conversationEvent: {
    create: jest.fn(),
  },
  conversation: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
}

describe('AutomationEngineService', () => {
  let service: AutomationEngineService

  beforeEach(() => {
    service = new AutomationEngineService(prismaMock as any)
    prismaMock.automationFlow.findMany.mockResolvedValue([
      {
        id: 'flow-1',
        nodes: [
          { id: 'n1', type: 'condition', config: { value: 'preço' } },
          { id: 'n2', type: 'message', config: { text: 'Segue o preço' } },
          { id: 'n3', type: 'tag', config: { tag: 'interessado' } },
          { id: 'n4', type: 'assign', config: { userId: 'user-1' } },
          { id: 'n5', type: 'end' },
        ],
      },
    ])
    prismaMock.conversation.findUnique.mockResolvedValue({ tags: ['lead'] })
    prismaMock.conversation.update.mockResolvedValue({})
    prismaMock.conversationEvent.create.mockResolvedValue({})
  })

  afterEach(() => jest.clearAllMocks())

  it('executa nós de flow ativo para um trigger', async () => {
    await service.handleTrigger('tenant-1', 'keyword', {
      conversationId: 'conv-1',
      messageText: 'Quero saber o preço',
    })

    expect(prismaMock.automationFlow.findMany).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', trigger: 'keyword', isActive: true },
      orderBy: { updatedAt: 'asc' },
    })
    expect(prismaMock.conversationEvent.create).toHaveBeenCalledWith({
      data: {
        conversationId: 'conv-1',
        type: 'automation_message',
        metadata: { flowId: 'flow-1', nodeId: 'n2', text: 'Segue o preço' },
      },
    })
    expect(prismaMock.conversation.update).toHaveBeenCalledWith({
      where: { id: 'conv-1' },
      data: { tags: ['lead', 'interessado'] },
    })
    expect(prismaMock.conversation.update).toHaveBeenCalledWith({
      where: { id: 'conv-1' },
      data: { assignedUserId: 'user-1', status: 'attending' },
    })
  })

  it('interrompe flow quando condição não bate', async () => {
    await service.handleTrigger('tenant-1', 'keyword', {
      conversationId: 'conv-1',
      messageText: 'Olá',
    })

    expect(prismaMock.conversationEvent.create).not.toHaveBeenCalled()
    expect(prismaMock.conversation.update).not.toHaveBeenCalled()
  })
})
