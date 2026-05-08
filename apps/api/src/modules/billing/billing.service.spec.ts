import { Test, TestingModule } from '@nestjs/testing'
import { BadRequestException, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { BillingService } from './billing.service'
import { STRIPE_CLIENT } from './billing.constants'
import { PrismaService } from '../../prisma/prisma.service'

const prismaMock = {
  tenant: {
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  subscription: {
    create: jest.fn(),
    upsert: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    findUnique: jest.fn(),
  },
  usageRecord: {
    findUnique: jest.fn(),
  },
  stripeWebhookEvent: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
}

const stripeMock = {
  customers: {
    create: jest.fn(),
  },
  checkout: {
    sessions: {
      create: jest.fn(),
    },
  },
  subscriptions: {
    update: jest.fn(),
  },
  webhooks: {
    constructEvent: jest.fn(),
  },
}

const configMock = {
  get: jest.fn((key: string) => {
    const values: Record<string, string> = {
      STRIPE_WEBHOOK_SECRET: 'whsec_test',
      STRIPE_PRICE_STARTER: 'price_starter',
      STRIPE_PRICE_GROWTH: 'price_growth',
      STRIPE_PRICE_PRO: 'price_pro',
    }
    return values[key]
  }),
}

describe('BillingService', () => {
  let service: BillingService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: ConfigService, useValue: configMock },
        { provide: STRIPE_CLIENT, useValue: stripeMock },
      ],
    }).compile()

    service = module.get(BillingService)
    prismaMock.tenant.update.mockResolvedValue({})
    prismaMock.stripeWebhookEvent.findUnique.mockResolvedValue(null)
    prismaMock.stripeWebhookEvent.create.mockResolvedValue({})
    prismaMock.usageRecord.findUnique.mockResolvedValue(null)
  })

  afterEach(() => jest.clearAllMocks())

  describe('overview e cancelamento', () => {
    it('deve retornar resumo de billing com uso mensal', async () => {
      prismaMock.subscription.findUnique.mockResolvedValue({
        plan: 'growth',
        status: 'active',
        currentPeriodEnd: new Date('2026-06-08T00:00:00.000Z'),
        cancelAtPeriodEnd: false,
      })
      prismaMock.usageRecord.findUnique.mockResolvedValue({
        conversations: 1200,
        broadcasts: 3000,
      })

      const result = await service.getOverview('tenant-1')

      expect(result.plan).toBe('growth')
      expect(result.usage.conversations).toEqual({ used: 1200, limit: 2000 })
      expect(result.usage.broadcasts).toEqual({ used: 3000, limit: 10000 })
      expect(result.invoices).toEqual([])
    })

    it('deve agendar cancelamento na Stripe e no banco', async () => {
      prismaMock.subscription.findUnique
        .mockResolvedValueOnce({ stripeSubscriptionId: 'sub_123' })
        .mockResolvedValueOnce({
          plan: 'growth',
          status: 'active',
          currentPeriodEnd: null,
          cancelAtPeriodEnd: true,
        })
      prismaMock.subscription.update.mockResolvedValue({})

      await service.cancelSubscription('tenant-1')

      expect(stripeMock.subscriptions.update).toHaveBeenCalledWith('sub_123', {
        cancel_at_period_end: true,
      })
      expect(prismaMock.subscription.update).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1' },
        data: { cancelAtPeriodEnd: true },
      })
    })
  })

  describe('createCheckoutSession', () => {
    it('deve criar customer, assinatura trial e checkout session para o plano Growth', async () => {
      prismaMock.tenant.findFirst.mockResolvedValue({
        id: 'tenant-1',
        slug: 'acme',
        name: 'Acme',
        email: 'admin@acme.com',
        subscription: null,
      })
      stripeMock.customers.create.mockResolvedValue({ id: 'cus_123' })
      prismaMock.subscription.create.mockResolvedValue({})
      stripeMock.checkout.sessions.create.mockResolvedValue({
        id: 'cs_123',
        url: 'https://checkout.stripe.com/c/pay/cs_123',
      })

      const result = await service.createCheckoutSession('tenant-1', {
        plan: 'growth',
        successUrl: 'https://app.local/success',
        cancelUrl: 'https://app.local/cancel',
      })

      expect(stripeMock.customers.create).toHaveBeenCalledWith({
        name: 'Acme',
        email: 'admin@acme.com',
        metadata: { tenantId: 'tenant-1', tenantSlug: 'acme' },
      })
      expect(prismaMock.subscription.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId: 'tenant-1',
            stripeCustomerId: 'cus_123',
            plan: 'growth',
            status: 'trialing',
            trialEndsAt: expect.any(Date),
          }),
        }),
      )
      expect(stripeMock.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'subscription',
          customer: 'cus_123',
          client_reference_id: 'tenant-1',
          subscription_data: expect.objectContaining({
            trial_period_days: 14,
            metadata: { tenantId: 'tenant-1', plan: 'growth' },
          }),
          line_items: [{ price: 'price_growth', quantity: 1 }],
        }),
      )
      expect(result).toEqual({ id: 'cs_123', url: 'https://checkout.stripe.com/c/pay/cs_123' })
    })

    it('deve reaproveitar customer existente', async () => {
      prismaMock.tenant.findFirst.mockResolvedValue({
        id: 'tenant-1',
        slug: 'acme',
        name: 'Acme',
        email: 'admin@acme.com',
        subscription: { stripeCustomerId: 'cus_existing' },
      })
      stripeMock.checkout.sessions.create.mockResolvedValue({
        id: 'cs_123',
        url: 'https://checkout.stripe.com/c/pay/cs_123',
      })

      await service.createCheckoutSession('tenant-1', {
        plan: 'starter',
        successUrl: 'https://app.local/success',
        cancelUrl: 'https://app.local/cancel',
      })

      expect(stripeMock.customers.create).not.toHaveBeenCalled()
      expect(prismaMock.subscription.create).not.toHaveBeenCalled()
      expect(stripeMock.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({ customer: 'cus_existing' }),
      )
    })

    it('deve lançar NotFoundException quando tenant não existir', async () => {
      prismaMock.tenant.findFirst.mockResolvedValue(null)

      await expect(
        service.createCheckoutSession('tenant-x', {
          plan: 'pro',
          successUrl: 'https://app.local/success',
          cancelUrl: 'https://app.local/cancel',
        }),
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('handleWebhook', () => {
    it('deve validar assinatura e ativar tenant no checkout.session.completed', async () => {
      stripeMock.webhooks.constructEvent.mockReturnValue({
        id: 'evt_checkout',
        type: 'checkout.session.completed',
        data: {
          object: {
            customer: 'cus_123',
            subscription: 'sub_123',
            client_reference_id: 'tenant-1',
            metadata: { tenantId: 'tenant-1', plan: 'pro' },
          },
        },
      })
      prismaMock.subscription.upsert.mockResolvedValue({})

      const result = await service.handleWebhook(Buffer.from('{}'), 'sig')

      expect(stripeMock.webhooks.constructEvent).toHaveBeenCalledWith(
        Buffer.from('{}'),
        'sig',
        'whsec_test',
      )
      expect(prismaMock.subscription.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: 'tenant-1' },
          update: expect.objectContaining({
            stripeCustomerId: 'cus_123',
            stripeSubscriptionId: 'sub_123',
            plan: 'pro',
          }),
        }),
      )
      expect(prismaMock.tenant.update).toHaveBeenCalledWith({
        where: { id: 'tenant-1' },
        data: { status: 'trialing' },
      })
      expect(prismaMock.stripeWebhookEvent.create).toHaveBeenCalledWith({
        data: {
          stripeEventId: 'evt_checkout',
          type: 'checkout.session.completed',
          tenantId: 'tenant-1',
        },
      })
      expect(result).toEqual({ received: true })
    })

    it('deve sincronizar assinatura updated e ativar tenant', async () => {
      stripeMock.webhooks.constructEvent.mockReturnValue({
        id: 'evt_sub_updated',
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_123',
            customer: 'cus_123',
            metadata: { tenantId: 'tenant-1', plan: 'starter' },
            status: 'active',
            trial_end: null,
            cancel_at_period_end: false,
            items: { data: [{ current_period_start: 1716000000, current_period_end: 1718592000 }] },
          },
        },
      })
      prismaMock.subscription.upsert.mockResolvedValue({})

      await service.handleWebhook(Buffer.from('{}'), 'sig')

      expect(prismaMock.subscription.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            status: 'active',
            currentPeriodStart: new Date(1716000000 * 1000),
            currentPeriodEnd: new Date(1718592000 * 1000),
          }),
        }),
      )
      expect(prismaMock.tenant.update).toHaveBeenCalledWith({
        where: { id: 'tenant-1' },
        data: { status: 'active' },
      })
    })

    it('deve suspender tenant em customer.subscription.deleted', async () => {
      stripeMock.webhooks.constructEvent.mockReturnValue({
        id: 'evt_sub_deleted',
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_123',
            customer: 'cus_123',
            metadata: { tenantId: 'tenant-1', plan: 'starter' },
            status: 'canceled',
            trial_end: null,
            cancel_at_period_end: false,
            items: { data: [] },
          },
        },
      })
      prismaMock.subscription.upsert.mockResolvedValue({})

      await service.handleWebhook(Buffer.from('{}'), 'sig')

      expect(prismaMock.tenant.update).toHaveBeenCalledWith({
        where: { id: 'tenant-1' },
        data: { status: 'suspended' },
      })
    })

    it('deve suspender tenant em invoice.payment_failed', async () => {
      stripeMock.webhooks.constructEvent.mockReturnValue({
        id: 'evt_invoice_failed',
        type: 'invoice.payment_failed',
        data: {
          object: {
            customer: 'cus_123',
            parent: { subscription_details: { subscription: 'sub_123' } },
          },
        },
      })
      prismaMock.subscription.findUnique.mockResolvedValue({ tenantId: 'tenant-1' })

      await service.handleWebhook(Buffer.from('{}'), 'sig')

      expect(prismaMock.subscription.updateMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1' },
        data: { status: 'past_due' },
      })
      expect(prismaMock.tenant.update).toHaveBeenCalledWith({
        where: { id: 'tenant-1' },
        data: { status: 'suspended' },
      })
    })

    it('deve reativar tenant em invoice.payment_succeeded', async () => {
      stripeMock.webhooks.constructEvent.mockReturnValue({
        id: 'evt_invoice_paid',
        type: 'invoice.payment_succeeded',
        data: {
          object: {
            customer: 'cus_123',
            parent: { subscription_details: { subscription: 'sub_123' } },
          },
        },
      })
      prismaMock.subscription.findUnique.mockResolvedValue({ tenantId: 'tenant-1' })

      await service.handleWebhook(Buffer.from('{}'), 'sig')

      expect(prismaMock.subscription.updateMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1' },
        data: { status: 'active' },
      })
      expect(prismaMock.tenant.update).toHaveBeenCalledWith({
        where: { id: 'tenant-1' },
        data: { status: 'active' },
      })
    })

    it('deve ignorar evento já processado', async () => {
      stripeMock.webhooks.constructEvent.mockReturnValue({
        id: 'evt_existing',
        type: 'invoice.payment_succeeded',
        data: { object: {} },
      })
      prismaMock.stripeWebhookEvent.findUnique.mockResolvedValue({ id: 'processed-1' })

      await service.handleWebhook(Buffer.from('{}'), 'sig')

      expect(prismaMock.subscription.updateMany).not.toHaveBeenCalled()
      expect(prismaMock.stripeWebhookEvent.create).not.toHaveBeenCalled()
    })

    it('deve rejeitar webhook sem assinatura', async () => {
      await expect(service.handleWebhook(Buffer.from('{}'), '')).rejects.toThrow(BadRequestException)
    })
  })
})
