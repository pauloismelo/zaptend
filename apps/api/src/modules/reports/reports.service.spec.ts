import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from '../../prisma/prisma.service'
import { ReportsService } from './reports.service'

const prismaMock = {
  conversation: {
    count: jest.fn(),
    findMany: jest.fn(),
  },
  user: {
    count: jest.fn(),
    findMany: jest.fn(),
  },
}

describe('ReportsService', () => {
  let service: ReportsService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile()
    service = module.get(ReportsService)
  })

  afterEach(() => jest.clearAllMocks())

  it('calcula overview filtrado por tenantId e período', async () => {
    prismaMock.conversation.count.mockResolvedValue(5)
    prismaMock.conversation.findMany.mockResolvedValue([
      {
        createdAt: new Date('2026-05-01T10:00:00Z'),
        lastAssignedAt: new Date('2026-05-01T10:10:00Z'),
        resolvedAt: new Date('2026-05-01T11:00:00Z'),
        csatScore: 5,
      },
      {
        createdAt: new Date('2026-05-01T12:00:00Z'),
        lastAssignedAt: null,
        resolvedAt: null,
        csatScore: 3,
      },
    ])
    prismaMock.user.count.mockResolvedValue(2)

    const result = await service.overview('tenant-1', {
      startDate: '2026-05-01T00:00:00.000Z',
      endDate: '2026-05-31T00:00:00.000Z',
    })

    expect(prismaMock.conversation.count).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1', deletedAt: null, status: { in: ['open', 'attending', 'waiting_customer'] } },
    })
    expect(result).toEqual({
      openConversations: 5,
      averageAssignmentMinutes: 10,
      averageResolutionMinutes: 60,
      averageCsat: 4,
      onlineAgents: 2,
    })
  })

  it('agrupa volume por dia, departamento e agente', async () => {
    prismaMock.conversation.findMany.mockResolvedValue([
      { createdAt: new Date('2026-05-01T10:00:00Z'), departmentId: 'sales', assignedUserId: 'user-1' },
      { createdAt: new Date('2026-05-01T12:00:00Z'), departmentId: 'sales', assignedUserId: 'user-1' },
    ])

    const result = await service.volume('tenant-1', { period: 'day' })

    expect(prismaMock.conversation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ tenantId: 'tenant-1' }) }),
    )
    expect(result).toEqual([
      { bucket: '2026-05-01', departmentId: 'sales', agentId: 'user-1', total: 2 },
    ])
  })

  it('calcula performance por agente', async () => {
    prismaMock.user.findMany.mockResolvedValue([
      {
        id: 'user-1',
        name: 'Ana',
        assignedConversations: [
          {
            createdAt: new Date('2026-05-01T10:00:00Z'),
            lastAssignedAt: new Date('2026-05-01T10:05:00Z'),
            resolvedAt: new Date('2026-05-01T10:30:00Z'),
            csatScore: 4,
          },
        ],
      },
    ])

    await expect(service.agents('tenant-1', {})).resolves.toEqual([
      {
        agentId: 'user-1',
        agentName: 'Ana',
        conversations: 1,
        averageAssignmentMinutes: 5,
        averageResolutionMinutes: 30,
        averageCsat: 4,
      },
    ])
  })

  it('gera heatmap por hora e dia da semana', async () => {
    prismaMock.conversation.findMany.mockResolvedValue([
      { createdAt: new Date('2026-05-03T10:00:00Z') },
      { createdAt: new Date('2026-05-03T10:30:00Z') },
    ])

    await expect(service.heatmap('tenant-1', {})).resolves.toEqual([
      { dayOfWeek: new Date('2026-05-03T10:00:00Z').getDay(), hour: 10, total: 2 },
    ])
  })
})
