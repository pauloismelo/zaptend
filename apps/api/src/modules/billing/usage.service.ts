import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import {
  ACTIVE_SUBSCRIPTION_STATUSES,
  BillingPlan,
  PLAN_FEATURES,
  UsageMetric,
} from './billing.constants'

export type UsageLimitResult = {
  metric: UsageMetric
  month: string
  used: number
  limit: number
  remaining: number
  withinLimit: boolean
}

@Injectable()
export class UsageService {
  constructor(private readonly prisma: PrismaService) {}

  async recordConversation(tenantId: string, quantity = 1): Promise<UsageLimitResult> {
    await this.incrementUsage(tenantId, 'conversations', quantity)
    return this.assertWithinLimit(tenantId, 'conversations')
  }

  async recordBroadcast(tenantId: string, quantity = 1): Promise<UsageLimitResult> {
    await this.assertFeatureEnabled(tenantId, 'broadcasts')
    await this.incrementUsage(tenantId, 'broadcasts', quantity)
    return this.assertWithinLimit(tenantId, 'broadcasts')
  }

  async assertWithinLimit(tenantId: string, metric: UsageMetric): Promise<UsageLimitResult> {
    const { plan } = await this.getActivePlan(tenantId)
    const usage = await this.getCurrentUsage(tenantId)
    const used = usage[metric]
    const limit = metric === 'conversations'
      ? PLAN_FEATURES[plan].maxConversations
      : PLAN_FEATURES[plan].broadcastsLimit
    const remaining = Math.max(limit - used, 0)
    const withinLimit = used <= limit

    if (!withinLimit) {
      throw new ForbiddenException(
        `Limite mensal de ${metric === 'conversations' ? 'conversas' : 'broadcasts'} excedido para o plano ${plan}`,
      )
    }

    return {
      metric,
      month: usage.month,
      used,
      limit,
      remaining,
      withinLimit,
    }
  }

  async getCurrentUsage(tenantId: string): Promise<{
    month: string
    conversations: number
    broadcasts: number
    aiRequests: number
  }> {
    const month = this.currentMonth()
    const usage = await this.prisma.usageRecord.findUnique({
      where: { tenantId_month: { tenantId, month } },
      select: { month: true, conversations: true, broadcasts: true, aiRequests: true },
    })

    return usage ?? { month, conversations: 0, broadcasts: 0, aiRequests: 0 }
  }

  async assertFeatureEnabled(
    tenantId: string,
    feature: 'broadcasts' | 'flowBuilder' | 'apiAccess' | 'aiCopilot',
  ): Promise<void> {
    const { plan } = await this.getActivePlan(tenantId)

    if (!PLAN_FEATURES[plan][feature]) {
      throw new ForbiddenException(
        `Funcionalidade "${feature}" não disponível no plano ${plan}`,
      )
    }
  }

  private async incrementUsage(
    tenantId: string,
    metric: UsageMetric,
    quantity: number,
  ): Promise<void> {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new BadRequestException('Quantidade de uso deve ser um inteiro positivo')
    }

    const month = this.currentMonth()
    await this.prisma.usageRecord.upsert({
      where: { tenantId_month: { tenantId, month } },
      create: {
        tenantId,
        month,
        conversations: metric === 'conversations' ? quantity : 0,
        broadcasts: metric === 'broadcasts' ? quantity : 0,
      },
      update: {
        [metric]: { increment: quantity },
      },
    })
  }

  private async getActivePlan(tenantId: string): Promise<{ plan: BillingPlan }> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { tenantId },
      select: { plan: true, status: true },
    })

    if (!subscription) {
      throw new NotFoundException('Assinatura do tenant não encontrada')
    }
    if (!ACTIVE_SUBSCRIPTION_STATUSES.includes(subscription.status)) {
      throw new ForbiddenException('Assinatura inativa')
    }

    return { plan: this.resolvePlan(subscription.plan) }
  }

  private resolvePlan(plan: string): BillingPlan {
    if (plan === 'starter' || plan === 'growth' || plan === 'pro') {
      return plan
    }

    return 'starter'
  }

  private currentMonth(): string {
    return new Date().toISOString().slice(0, 7)
  }
}
