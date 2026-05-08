import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Prisma } from '@zaptend/database'
import { PrismaService } from '../../prisma/prisma.service'
import {
  ACTIVE_SUBSCRIPTION_STATUSES,
  BILLING_PLANS,
  BILLING_TRIAL_DAYS,
  BillingPlan,
  PLAN_FEATURES,
  STRIPE_CLIENT,
  StripeSubscriptionStatus,
} from './billing.constants'
import {
  CheckoutSessionResponseDto,
  CreateCheckoutSessionDto,
} from './dto/create-checkout-session.dto'

type StripeIdRef = string | { id: string } | null | undefined

type StripeWebhookEvent = {
  id: string
  type: string
  data: { object: unknown }
}

type StripeCheckoutSession = {
  customer?: StripeIdRef
  subscription?: StripeIdRef
  client_reference_id?: string | null
  metadata?: Record<string, string> | null
  expires_at?: number | null
}

type StripeSubscription = {
  id: string
  customer: StripeIdRef
  metadata?: Record<string, string> | null
  status: StripeSubscriptionStatus
  trial_end?: number | null
  cancel_at_period_end: boolean
  items: {
    data: Array<{
      current_period_start?: number
      current_period_end?: number
    }>
  }
}

type StripeInvoice = {
  customer?: StripeIdRef
  parent?: {
    subscription_details?: {
      subscription?: StripeIdRef
    } | null
  } | null
}

type StripeClient = {
  customers: {
    create(params: {
      name: string
      email: string
      metadata: Record<string, string>
    }): Promise<{ id: string }>
  }
  checkout: {
    sessions: {
      create(params: Record<string, unknown>): Promise<{ id: string; url: string | null }>
    }
  }
  subscriptions?: {
    update(id: string, params: Record<string, unknown>): Promise<unknown>
  }
  webhooks: {
    constructEvent(rawBody: Buffer, signature: string, secret: string): StripeWebhookEvent
  }
}

export type BillingOverview = {
  plan: BillingPlan
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid'
  currentPeriodEnd?: Date
  cancelAtPeriodEnd: boolean
  usage: {
    month: string
    conversations: { used: number; limit: number }
    broadcasts: { used: number; limit: number }
  }
  invoices: Array<{
    id: string
    number: string
    amount: number
    currency: string
    status: 'paid' | 'open' | 'void' | 'uncollectible' | 'draft'
    hostedInvoiceUrl?: string
    paidAt?: string
    dueDate?: string
    createdAt: string
  }>
}

type SupportedStripeEvent =
  | 'checkout.session.completed'
  | 'customer.subscription.updated'
  | 'customer.subscription.deleted'
  | 'invoice.payment_failed'
  | 'invoice.payment_succeeded'

const SUPPORTED_EVENTS: SupportedStripeEvent[] = [
  'checkout.session.completed',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_failed',
  'invoice.payment_succeeded',
]

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    @Inject(STRIPE_CLIENT) private readonly stripe: StripeClient,
  ) {}

  async createCheckoutSession(
    tenantId: string,
    dto: CreateCheckoutSessionDto,
  ): Promise<CheckoutSessionResponseDto> {
    const tenant = await this.prisma.tenant.findFirst({
      where: { id: tenantId, deletedAt: null },
      include: { subscription: true },
    })

    if (!tenant) {
      throw new NotFoundException('Tenant não encontrado')
    }

    const stripeCustomerId = tenant.subscription?.stripeCustomerId
      ?? await this.createStripeCustomer(tenant)

    if (!tenant.subscription) {
      const trialEndsAt = new Date()
      trialEndsAt.setDate(trialEndsAt.getDate() + BILLING_TRIAL_DAYS)

      await this.prisma.subscription.create({
        data: {
          tenantId,
          stripeCustomerId,
          plan: dto.plan,
          status: 'trialing',
          trialEndsAt,
        },
      })
    }

    const plan = BILLING_PLANS[dto.plan]
    const priceId = this.configService.get<string>(plan.envPriceKey)

    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: stripeCustomerId,
      success_url: dto.successUrl,
      cancel_url: dto.cancelUrl,
      payment_method_collection: 'if_required',
      client_reference_id: tenantId,
      metadata: { tenantId, plan: dto.plan },
      subscription_data: {
        trial_period_days: BILLING_TRIAL_DAYS,
        metadata: { tenantId, plan: dto.plan },
      },
      line_items: [
        priceId
          ? { price: priceId, quantity: 1 }
          : {
              quantity: 1,
              price_data: {
                currency: 'brl',
                unit_amount: plan.amount,
                recurring: { interval: 'month' },
                product_data: { name: plan.name },
              },
            },
      ],
    })

    if (!session.url) {
      throw new BadRequestException('Stripe não retornou URL de checkout')
    }

    return { id: session.id, url: session.url }
  }

  async getOverview(tenantId: string): Promise<BillingOverview> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { tenantId },
      select: {
        plan: true,
        status: true,
        currentPeriodEnd: true,
        cancelAtPeriodEnd: true,
      },
    })

    if (!subscription) {
      throw new NotFoundException('Assinatura do tenant não encontrada')
    }

    const plan = this.resolvePlan(subscription.plan)
    const month = this.currentMonth()
    const usage = await this.prisma.usageRecord.findUnique({
      where: { tenantId_month: { tenantId, month } },
      select: { conversations: true, broadcasts: true },
    })

    return {
      plan,
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd ?? undefined,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      usage: {
        month,
        conversations: {
          used: usage?.conversations ?? 0,
          limit: PLAN_FEATURES[plan].maxConversations,
        },
        broadcasts: {
          used: usage?.broadcasts ?? 0,
          limit: PLAN_FEATURES[plan].broadcastsLimit,
        },
      },
      invoices: [],
    }
  }

  async cancelSubscription(tenantId: string): Promise<BillingOverview> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { tenantId },
      select: { stripeSubscriptionId: true },
    })

    if (!subscription) {
      throw new NotFoundException('Assinatura do tenant não encontrada')
    }

    if (subscription.stripeSubscriptionId && this.stripe.subscriptions) {
      await this.stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true,
      })
    }

    await this.prisma.subscription.update({
      where: { tenantId },
      data: { cancelAtPeriodEnd: true },
    })

    return this.getOverview(tenantId)
  }

  async handleWebhook(rawBody: Buffer, signature: string): Promise<{ received: true }> {
    if (!signature) {
      throw new BadRequestException('Assinatura Stripe ausente')
    }

    const secret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET')
    if (!secret) {
      throw new BadRequestException('STRIPE_WEBHOOK_SECRET não configurado')
    }

    const event = this.stripe.webhooks.constructEvent(rawBody, signature, secret)

    if (!SUPPORTED_EVENTS.includes(event.type as SupportedStripeEvent)) {
      this.logger.log(`Evento Stripe ignorado: ${event.type}`)
      return { received: true }
    }

    const existing = await this.prisma.stripeWebhookEvent.findUnique({
      where: { stripeEventId: event.id },
    })
    if (existing) {
      this.logger.log(`Evento Stripe já processado: ${event.id}`)
      return { received: true }
    }

    const tenantId = await this.processSupportedEvent(event)

    try {
      await this.prisma.stripeWebhookEvent.create({
        data: {
          stripeEventId: event.id,
          type: event.type,
          tenantId,
        },
      })
    } catch (error) {
      if (!this.isUniqueConstraintError(error)) {
        throw error
      }
    }

    return { received: true }
  }

  private async createStripeCustomer(tenant: {
    id: string
    name: string
    email: string
    slug: string
  }): Promise<string> {
    const customer = await this.stripe.customers.create({
      name: tenant.name,
      email: tenant.email,
      metadata: { tenantId: tenant.id, tenantSlug: tenant.slug },
    })

    return customer.id
  }

  private async processSupportedEvent(event: StripeWebhookEvent): Promise<string | undefined> {
    switch (event.type as SupportedStripeEvent) {
      case 'checkout.session.completed':
        return this.handleCheckoutCompleted(event.data.object as StripeCheckoutSession)
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        return this.syncSubscription(event.data.object as StripeSubscription)
      case 'invoice.payment_failed':
        return this.handleInvoicePaymentFailed(event.data.object as StripeInvoice)
      case 'invoice.payment_succeeded':
        return this.handleInvoicePaymentSucceeded(event.data.object as StripeInvoice)
      default:
        return undefined
    }
  }

  private async handleCheckoutCompleted(session: StripeCheckoutSession): Promise<string> {
    const tenantId = this.requireTenantId(session.metadata?.tenantId ?? session.client_reference_id)
    const plan = this.resolvePlan(session.metadata?.plan)
    const subscriptionId = this.resolveId(session.subscription)
    const customerId = this.resolveId(session.customer)

    await this.prisma.subscription.upsert({
      where: { tenantId },
      create: {
        tenantId,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        plan,
        status: 'trialing',
        trialEndsAt: this.defaultTrialEndsAt(),
      },
      update: {
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        plan,
        status: 'trialing',
      },
    })

    await this.activateTenant(tenantId, 'trialing')
    return tenantId
  }

  private async syncSubscription(subscription: StripeSubscription): Promise<string> {
    const tenantId = this.requireTenantId(subscription.metadata?.tenantId)
    const plan = this.resolvePlan(subscription.metadata?.plan)
    const status = this.toSubscriptionStatus(subscription.status)
    const tenantStatus = ACTIVE_SUBSCRIPTION_STATUSES.includes(subscription.status)
      ? 'active'
      : 'suspended'

    await this.prisma.subscription.upsert({
      where: { tenantId },
      create: {
        tenantId,
        stripeCustomerId: this.resolveId(subscription.customer),
        stripeSubscriptionId: subscription.id,
        plan,
        status,
        currentPeriodStart: this.fromUnix(this.subscriptionPeriod(subscription, 'current_period_start')),
        currentPeriodEnd: this.fromUnix(this.subscriptionPeriod(subscription, 'current_period_end')),
        trialEndsAt: this.fromUnix(subscription.trial_end),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
      update: {
        stripeCustomerId: this.resolveId(subscription.customer),
        stripeSubscriptionId: subscription.id,
        plan,
        status,
        currentPeriodStart: this.fromUnix(this.subscriptionPeriod(subscription, 'current_period_start')),
        currentPeriodEnd: this.fromUnix(this.subscriptionPeriod(subscription, 'current_period_end')),
        trialEndsAt: this.fromUnix(subscription.trial_end),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    })

    await this.updateTenantStatus(tenantId, tenantStatus)
    return tenantId
  }

  private async handleInvoicePaymentFailed(invoice: StripeInvoice): Promise<string | undefined> {
    const tenantId = await this.findTenantIdFromInvoice(invoice)
    if (!tenantId) {
      return undefined
    }

    await this.prisma.subscription.updateMany({
      where: { tenantId },
      data: { status: 'past_due' },
    })
    await this.updateTenantStatus(tenantId, 'suspended')
    return tenantId
  }

  private async handleInvoicePaymentSucceeded(invoice: StripeInvoice): Promise<string | undefined> {
    const tenantId = await this.findTenantIdFromInvoice(invoice)
    if (!tenantId) {
      return undefined
    }

    await this.prisma.subscription.updateMany({
      where: { tenantId },
      data: { status: 'active' },
    })
    await this.updateTenantStatus(tenantId, 'active')
    return tenantId
  }

  private async findTenantIdFromInvoice(invoice: StripeInvoice): Promise<string | undefined> {
    const subscriptionId = this.resolveId(invoice.parent?.subscription_details?.subscription)
    if (subscriptionId) {
      const subscription = await this.prisma.subscription.findUnique({
        where: { stripeSubscriptionId: subscriptionId },
        select: { tenantId: true },
      })
      if (subscription) {
        return subscription.tenantId
      }
    }

    const customerId = this.resolveId(invoice.customer)
    if (!customerId) {
      return undefined
    }

    const subscription = await this.prisma.subscription.findUnique({
      where: { stripeCustomerId: customerId },
      select: { tenantId: true },
    })

    return subscription?.tenantId
  }

  private async activateTenant(tenantId: string, status: 'trialing' | 'active'): Promise<void> {
    await this.updateTenantStatus(tenantId, status)
  }

  private async updateTenantStatus(
    tenantId: string,
    status: 'trialing' | 'active' | 'suspended',
  ): Promise<void> {
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { status },
    })
  }

  private resolvePlan(plan: string | null | undefined): BillingPlan {
    if (plan === 'starter' || plan === 'growth' || plan === 'pro') {
      return plan
    }

    return 'starter'
  }

  private toSubscriptionStatus(status: StripeSubscriptionStatus) {
    if (status === 'trialing' || status === 'active' || status === 'past_due' || status === 'unpaid') {
      return status
    }

    return 'canceled'
  }

  private requireTenantId(tenantId: string | null | undefined): string {
    if (!tenantId) {
      throw new BadRequestException('Evento Stripe sem tenantId')
    }

    return tenantId
  }

  private resolveId(value: StripeIdRef): string {
    if (!value) {
      return ''
    }

    return typeof value === 'string' ? value : value.id
  }

  private fromUnix(value: number | null | undefined): Date | undefined {
    return value ? new Date(value * 1000) : undefined
  }

  private subscriptionPeriod(
    subscription: StripeSubscription,
    field: 'current_period_start' | 'current_period_end',
  ): number | undefined {
    return subscription.items.data[0]?.[field]
  }

  private defaultTrialEndsAt(): Date {
    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + BILLING_TRIAL_DAYS)
    return trialEndsAt
  }

  private currentMonth(): string {
    return new Date().toISOString().slice(0, 7)
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002'
  }
}
