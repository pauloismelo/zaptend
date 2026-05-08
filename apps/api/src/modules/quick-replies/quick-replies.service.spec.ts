import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { QuickRepliesService } from './quick-replies.service'

const prismaMock = {
  quickReply: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}

describe('QuickRepliesService', () => {
  let service: QuickRepliesService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuickRepliesService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile()

    service = module.get(QuickRepliesService)
  })

  afterEach(() => jest.clearAllMocks())

  it('lista respostas rápidas do tenant com busca e categoria', async () => {
    prismaMock.quickReply.findMany.mockResolvedValue([])

    await service.findAll('tenant-1', { search: 'preço', category: 'vendas' })

    expect(prismaMock.quickReply.findMany).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
        category: 'vendas',
        OR: [
          { name: { contains: 'preço', mode: 'insensitive' } },
          { content: { contains: 'preço', mode: 'insensitive' } },
        ],
      },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    })
  })

  it('cria resposta rápida vinculada ao tenant e usuário', async () => {
    prismaMock.quickReply.create.mockResolvedValue({ id: 'qr-1' })

    const result = await service.create('tenant-1', 'user-1', {
      name: 'Preço',
      content: 'Segue tabela',
    })

    expect(prismaMock.quickReply.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: 'tenant-1',
        createdBy: 'user-1',
        name: 'Preço',
        content: 'Segue tabela',
        isShared: true,
      }),
    })
    expect(result).toEqual({ id: 'qr-1' })
  })

  it('bloqueia update fora do tenant', async () => {
    prismaMock.quickReply.findFirst.mockResolvedValue(null)

    await expect(service.update('qr-1', 'tenant-1', { name: 'Novo' })).rejects.toThrow(NotFoundException)

    expect(prismaMock.quickReply.update).not.toHaveBeenCalled()
  })
})
