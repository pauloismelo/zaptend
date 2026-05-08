import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { AutomationsService } from './automations.service'

const prismaMock = {
  automationFlow: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}

describe('AutomationsService', () => {
  let service: AutomationsService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AutomationsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile()

    service = module.get(AutomationsService)
  })

  afterEach(() => jest.clearAllMocks())

  it('cria flow com nodes JSONB e trigger', async () => {
    prismaMock.automationFlow.create.mockResolvedValue({ id: 'flow-1' })

    await service.create('tenant-1', {
      name: 'Boas-vindas',
      trigger: 'new_conversation',
      nodes: [{ id: 'n1', type: 'message', config: { text: 'Olá' } }],
    })

    expect(prismaMock.automationFlow.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tenantId: 'tenant-1',
        name: 'Boas-vindas',
        trigger: 'new_conversation',
        nodes: [{ id: 'n1', type: 'message', config: { text: 'Olá' } }],
        isActive: false,
      }),
    })
  })

  it('incrementa versão ao atualizar nodes', async () => {
    prismaMock.automationFlow.findFirst.mockResolvedValue({ id: 'flow-1', version: 2 })
    prismaMock.automationFlow.update.mockResolvedValue({ id: 'flow-1', version: 3 })

    await service.update('flow-1', 'tenant-1', { nodes: [{ id: 'end', type: 'end' }] })

    expect(prismaMock.automationFlow.update).toHaveBeenCalledWith({
      where: { id: 'flow-1' },
      data: {
        nodes: [{ id: 'end', type: 'end' }],
        version: { increment: 1 },
      },
    })
  })

  it('bloqueia remoção fora do tenant', async () => {
    prismaMock.automationFlow.findFirst.mockResolvedValue(null)

    await expect(service.remove('flow-1', 'tenant-1')).rejects.toThrow(NotFoundException)
  })
})
