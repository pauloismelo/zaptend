import { Test, TestingModule } from '@nestjs/testing'
import { NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { SuperAdminService } from './super-admin.service'

const prismaMock = {
  tenant: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
  },
  subscription: {
    findMany: jest.fn(),
  },
  usageRecord: {
    findMany: jest.fn(),
  },
}

describe('SuperAdminService', () => {
  let service: SuperAdminService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuperAdminService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile()
    service = module.get(SuperAdminService)
  })

  afterEach(() => jest.clearAllMocks())

  it('lista tenants com filtros e paginação', async () => {
    prismaMock.tenant.findMany.mockResolvedValue([{ id: 'tenant-1' }])
    prismaMock.tenant.count.mockResolvedValue(1)

    const result = await service.tenants({ search: 'acme', status: 'active', page: 2, limit: 10 })

    expect(prismaMock.tenant.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ deletedAt: null, status: 'active' }),
        skip: 10,
        take: 10,
      }),
    )
    expect(result.totalPages).toBe(1)
  })

  it('retorna detalhes do tenant', async () => {
    prismaMock.tenant.findFirst.mockResolvedValue({ id: 'tenant-1' })

    await expect(service.tenant('tenant-1')).resolves.toEqual({ id: 'tenant-1' })
  })

  it('lança NotFound para tenant inexistente', async () => {
    prismaMock.tenant.findFirst.mockResolvedValue(null)

    await expect(service.tenant('tenant-x')).rejects.toThrow(NotFoundException)
  })

  it('atualiza status do tenant', async () => {
    prismaMock.tenant.findFirst.mockResolvedValue({ id: 'tenant-1' })
    prismaMock.tenant.update.mockResolvedValue({ id: 'tenant-1', status: 'suspended' })

    await service.updateStatus('tenant-1', { status: 'suspended' })

    expect(prismaMock.tenant.update).toHaveBeenCalledWith({
      where: { id: 'tenant-1' },
      data: { status: 'suspended' },
    })
  })

  it('calcula métricas globais', async () => {
    prismaMock.subscription.findMany.mockResolvedValue([{ plan: 'starter' }, { plan: 'growth' }])
    prismaMock.tenant.count.mockResolvedValueOnce(2).mockResolvedValueOnce(4).mockResolvedValueOnce(1)

    await expect(service.metrics()).resolves.toEqual({
      mrr: 39400,
      activeTenants: 2,
      totalTenants: 4,
      growthLast30Days: 1,
    })
  })
})
