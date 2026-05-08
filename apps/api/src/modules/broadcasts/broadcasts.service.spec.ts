import { Test, TestingModule } from '@nestjs/testing'
import { getQueueToken } from '@nestjs/bullmq'
import { NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { BROADCAST_SEND_QUEUE, BroadcastsService } from './broadcasts.service'

const prismaMock = {
  broadcast: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  contact: {
    count: jest.fn(),
    findMany: jest.fn(),
  },
}

const queueMock = {
  add: jest.fn(),
}

describe('BroadcastsService', () => {
  let service: BroadcastsService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BroadcastsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: getQueueToken(BROADCAST_SEND_QUEUE), useValue: queueMock },
      ],
    }).compile()

    service = module.get(BroadcastsService)
  })

  afterEach(() => jest.clearAllMocks())

  it('cria broadcast agendado com contagem de contatos elegíveis', async () => {
    prismaMock.contact.count.mockResolvedValue(12)
    prismaMock.broadcast.create.mockResolvedValue({ id: 'broadcast-1' })

    const result = await service.create('tenant-1', 'user-1', {
      name: 'Campanha',
      templateName: 'promo',
      segmentFilters: { tags: ['lead'] },
      scheduledAt: '2026-05-08T15:00:00.000Z',
    })

    expect(prismaMock.contact.count).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
        deletedAt: null,
        optedOut: false,
        tags: { hasSome: ['lead'] },
      },
    })
    expect(prismaMock.broadcast.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ recipientCount: 12, status: 'scheduled' }),
      }),
    )
    expect(queueMock.add).toHaveBeenCalledWith(
      'send',
      { tenantId: 'tenant-1', broadcastId: 'broadcast-1' },
      { attempts: 3, delay: expect.any(Number) },
    )
    expect(result).toEqual({ id: 'broadcast-1' })
  })

  it('segmenta por customFields quando fields é informado', async () => {
    prismaMock.contact.findMany.mockResolvedValue([
      { customFields: { plano: 'pro' } },
      { customFields: { plano: 'starter' } },
    ])
    prismaMock.broadcast.create.mockResolvedValue({ id: 'broadcast-1' })

    await service.create('tenant-1', 'user-1', {
      name: 'Campanha',
      templateName: 'promo',
      segmentFilters: { fields: { plano: 'pro' } },
    })

    expect(prismaMock.broadcast.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ recipientCount: 1 }),
      }),
    )
  })

  it('inicia broadcast e enfileira job de envio', async () => {
    prismaMock.broadcast.findFirst.mockResolvedValue({ id: 'broadcast-1' })
    prismaMock.broadcast.update.mockResolvedValue({ id: 'broadcast-1', status: 'running' })

    await service.start('broadcast-1', 'tenant-1')

    expect(prismaMock.broadcast.update).toHaveBeenCalledWith({
      where: { id: 'broadcast-1' },
      data: { status: 'running', startedAt: expect.any(Date) },
    })
    expect(queueMock.add).toHaveBeenCalledWith('send', { tenantId: 'tenant-1', broadcastId: 'broadcast-1' }, { attempts: 3 })
  })

  it('bloqueia start fora do tenant', async () => {
    prismaMock.broadcast.findFirst.mockResolvedValue(null)

    await expect(service.start('broadcast-1', 'tenant-1')).rejects.toThrow(NotFoundException)
  })
})
