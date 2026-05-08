import { Test, TestingModule } from '@nestjs/testing'
import { BillingController } from './billing.controller'
import { BillingService } from './billing.service'
import { UsageService } from './usage.service'
import { PrismaService } from '../../prisma/prisma.service'

const billingServiceMock = {
  createCheckoutSession: jest.fn(),
  getOverview: jest.fn(),
  cancelSubscription: jest.fn(),
  handleWebhook: jest.fn(),
}

const usageServiceMock = {
  recordConversation: jest.fn(),
  recordBroadcast: jest.fn(),
  assertWithinLimit: jest.fn(),
}

const prismaMock = {
  subscription: {
    findUnique: jest.fn(),
  },
}

const mockUser = {
  sub: 'user-1',
  email: 'owner@acme.com',
  role: 'owner' as const,
  tenantId: 'tenant-1',
  tenantSlug: 'acme',
}

describe('BillingController', () => {
  let controller: BillingController

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BillingController],
      providers: [
        { provide: BillingService, useValue: billingServiceMock },
        { provide: UsageService, useValue: usageServiceMock },
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile()

    controller = module.get(BillingController)
  })

  afterEach(() => jest.clearAllMocks())

  it('deve criar checkout session usando tenantId do usuário autenticado', async () => {
    billingServiceMock.createCheckoutSession.mockResolvedValue({
      id: 'cs_123',
      url: 'https://checkout.stripe.com/c/pay/cs_123',
    })

    const dto = {
      plan: 'growth' as const,
      successUrl: 'https://app.local/success',
      cancelUrl: 'https://app.local/cancel',
    }

    const result = await controller.createCheckoutSession(mockUser, dto)

    expect(billingServiceMock.createCheckoutSession).toHaveBeenCalledWith('tenant-1', dto)
    expect(result.url).toBe('https://checkout.stripe.com/c/pay/cs_123')
  })

  it('deve registrar uso de conversas pelo tenant autenticado', async () => {
    usageServiceMock.recordConversation.mockResolvedValue({
      metric: 'conversations',
      month: '2026-05',
      used: 1,
      limit: 500,
      remaining: 499,
      withinLimit: true,
    })

    const result = await controller.recordConversationUsage(mockUser, { quantity: 1 })

    expect(usageServiceMock.recordConversation).toHaveBeenCalledWith('tenant-1', 1)
    expect(result.metric).toBe('conversations')
  })

  it('deve buscar overview usando tenantId autenticado', async () => {
    billingServiceMock.getOverview.mockResolvedValue({ plan: 'growth' })

    const result = await controller.getOverview(mockUser)

    expect(billingServiceMock.getOverview).toHaveBeenCalledWith('tenant-1')
    expect(result).toEqual({ plan: 'growth' })
  })

  it('deve cancelar assinatura usando tenantId autenticado', async () => {
    billingServiceMock.cancelSubscription.mockResolvedValue({ cancelAtPeriodEnd: true })

    const result = await controller.cancelSubscription(mockUser)

    expect(billingServiceMock.cancelSubscription).toHaveBeenCalledWith('tenant-1')
    expect(result).toEqual({ cancelAtPeriodEnd: true })
  })

  it('deve registrar uso de broadcasts pelo tenant autenticado', async () => {
    usageServiceMock.recordBroadcast.mockResolvedValue({
      metric: 'broadcasts',
      month: '2026-05',
      used: 10,
      limit: 10000,
      remaining: 9990,
      withinLimit: true,
    })

    const result = await controller.recordBroadcastUsage(mockUser, { quantity: 10 })

    expect(usageServiceMock.recordBroadcast).toHaveBeenCalledWith('tenant-1', 10)
    expect(result.metric).toBe('broadcasts')
  })

  it('deve encaminhar rawBody e stripe-signature para o service no webhook', async () => {
    billingServiceMock.handleWebhook.mockResolvedValue({ received: true })
    const rawBody = Buffer.from('{"id":"evt_123"}')
    const req = { rawBody }

    const result = await controller.handleWebhook(req as never, 'stripe-signature')

    expect(billingServiceMock.handleWebhook).toHaveBeenCalledWith(rawBody, 'stripe-signature')
    expect(result).toEqual({ received: true })
  })
})
