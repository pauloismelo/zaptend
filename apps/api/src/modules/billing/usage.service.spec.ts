import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from '../../prisma/prisma.service'
import { UsageService } from './usage.service'

const prismaMock = {
  subscription: {
    findUnique: jest.fn(),
  },
  usageRecord: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
  },
}

describe('UsageService', () => {
  let service: UsageService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsageService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile()

    service = module.get(UsageService)
    prismaMock.subscription.findUnique.mockResolvedValue({ plan: 'growth', status: 'active' })
    prismaMock.usageRecord.upsert.mockResolvedValue({})
  })

  afterEach(() => jest.clearAllMocks())

  it('deve registrar conversa no UsageRecord mensal e validar limite do plano', async () => {
    prismaMock.usageRecord.findUnique.mockResolvedValue({
      month: currentMonth(),
      conversations: 25,
      broadcasts: 0,
      aiRequests: 0,
    })

    const result = await service.recordConversation('tenant-1', 2)

    expect(prismaMock.usageRecord.upsert).toHaveBeenCalledWith({
      where: { tenantId_month: { tenantId: 'tenant-1', month: currentMonth() } },
      create: {
        tenantId: 'tenant-1',
        month: currentMonth(),
        conversations: 2,
        broadcasts: 0,
      },
      update: { conversations: { increment: 2 } },
    })
    expect(result).toEqual({
      metric: 'conversations',
      month: currentMonth(),
      used: 25,
      limit: 2000,
      remaining: 1975,
      withinLimit: true,
    })
  })

  it('deve registrar broadcasts quando a feature está disponível', async () => {
    prismaMock.usageRecord.findUnique.mockResolvedValue({
      month: currentMonth(),
      conversations: 0,
      broadcasts: 50,
      aiRequests: 0,
    })

    const result = await service.recordBroadcast('tenant-1', 10)

    expect(prismaMock.usageRecord.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ broadcasts: 10 }),
        update: { broadcasts: { increment: 10 } },
      }),
    )
    expect(result.limit).toBe(10000)
    expect(result.remaining).toBe(9950)
  })

  it('deve bloquear broadcast no plano Starter', async () => {
    prismaMock.subscription.findUnique.mockResolvedValue({ plan: 'starter', status: 'active' })

    await expect(service.recordBroadcast('tenant-1')).rejects.toThrow(ForbiddenException)

    expect(prismaMock.usageRecord.upsert).not.toHaveBeenCalled()
  })

  it('deve bloquear quando conversas excedem limite mensal', async () => {
    prismaMock.subscription.findUnique.mockResolvedValue({ plan: 'starter', status: 'active' })
    prismaMock.usageRecord.findUnique.mockResolvedValue({
      month: currentMonth(),
      conversations: 501,
      broadcasts: 0,
      aiRequests: 0,
    })

    await expect(service.assertWithinLimit('tenant-1', 'conversations')).rejects.toThrow(
      ForbiddenException,
    )
  })

  it('deve retornar uso zerado quando ainda não há UsageRecord mensal', async () => {
    prismaMock.usageRecord.findUnique.mockResolvedValue(null)

    const usage = await service.getCurrentUsage('tenant-1')

    expect(usage).toEqual({
      month: currentMonth(),
      conversations: 0,
      broadcasts: 0,
      aiRequests: 0,
    })
  })

  it('deve rejeitar quantidade inválida', async () => {
    await expect(service.recordConversation('tenant-1', 0)).rejects.toThrow(BadRequestException)
  })

  it('deve rejeitar tenant sem assinatura', async () => {
    prismaMock.subscription.findUnique.mockResolvedValue(null)

    await expect(service.assertWithinLimit('tenant-1', 'conversations')).rejects.toThrow(
      NotFoundException,
    )
  })

  it('deve rejeitar assinatura inativa', async () => {
    prismaMock.subscription.findUnique.mockResolvedValue({ plan: 'growth', status: 'past_due' })

    await expect(service.assertWithinLimit('tenant-1', 'conversations')).rejects.toThrow(
      ForbiddenException,
    )
  })
})

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7)
}

