import { ExecutionContext, ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from '../../../prisma/prisma.service'
import { PlanGuard } from './plan.guard'

const reflectorMock = {
  getAllAndOverride: jest.fn(),
}

const prismaMock = {
  subscription: {
    findUnique: jest.fn(),
  },
}

describe('PlanGuard', () => {
  let guard: PlanGuard

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlanGuard,
        { provide: Reflector, useValue: reflectorMock },
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile()

    guard = module.get(PlanGuard)
  })

  afterEach(() => jest.clearAllMocks())

  it('deve permitir quando não há feature requerida', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue(undefined)

    await expect(guard.canActivate(context())).resolves.toBe(true)

    expect(prismaMock.subscription.findUnique).not.toHaveBeenCalled()
  })

  it('deve permitir feature disponível no plano Growth', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue(['broadcasts'])
    prismaMock.subscription.findUnique.mockResolvedValue({ plan: 'growth', status: 'active' })

    await expect(guard.canActivate(context())).resolves.toBe(true)

    expect(prismaMock.subscription.findUnique).toHaveBeenCalledWith({
      where: { tenantId: 'tenant-1' },
      select: { plan: true, status: true },
    })
  })

  it('deve bloquear feature indisponível no plano Starter', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue(['apiAccess'])
    prismaMock.subscription.findUnique.mockResolvedValue({ plan: 'starter', status: 'active' })

    await expect(guard.canActivate(context())).rejects.toThrow(ForbiddenException)
  })

  it('deve bloquear assinatura inativa', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue(['broadcasts'])
    prismaMock.subscription.findUnique.mockResolvedValue({ plan: 'growth', status: 'past_due' })

    await expect(guard.canActivate(context())).rejects.toThrow(ForbiddenException)
  })

  it('deve bloquear request sem tenant autenticado', async () => {
    reflectorMock.getAllAndOverride.mockReturnValue(['broadcasts'])

    await expect(guard.canActivate(context(undefined))).rejects.toThrow(ForbiddenException)
  })
})

function context(user = { tenantId: 'tenant-1' }): ExecutionContext {
  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext
}

