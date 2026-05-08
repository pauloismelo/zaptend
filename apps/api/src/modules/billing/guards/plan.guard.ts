import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { JwtPayload } from '@zaptend/types'
import { PrismaService } from '../../../prisma/prisma.service'
import {
  ACTIVE_SUBSCRIPTION_STATUSES,
  BillingPlan,
  PLAN_FEATURES,
  PlanFeature,
} from '../billing.constants'
import { REQUIRED_FEATURES_KEY } from '../decorators/require-feature.decorator'

@Injectable()
export class PlanGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredFeatures = this.reflector.getAllAndOverride<PlanFeature[]>(
      REQUIRED_FEATURES_KEY,
      [context.getHandler(), context.getClass()],
    )

    if (!requiredFeatures?.length) {
      return true
    }

    const request = context.switchToHttp().getRequest<{ user?: JwtPayload }>()
    const tenantId = request.user?.tenantId
    if (!tenantId) {
      throw new ForbiddenException('Tenant não identificado')
    }

    const subscription = await this.prisma.subscription.findUnique({
      where: { tenantId },
      select: { plan: true, status: true },
    })

    if (!subscription || !ACTIVE_SUBSCRIPTION_STATUSES.includes(subscription.status)) {
      throw new ForbiddenException('Assinatura inativa ou inexistente')
    }

    const plan = this.resolvePlan(subscription.plan)
    const features = PLAN_FEATURES[plan]
    const missingFeature = requiredFeatures.find((feature) => !features[feature])

    if (missingFeature) {
      throw new ForbiddenException(
        `Funcionalidade "${missingFeature}" não disponível no plano ${plan}`,
      )
    }

    return true
  }

  private resolvePlan(plan: string): BillingPlan {
    if (plan === 'starter' || plan === 'growth' || plan === 'pro') {
      return plan
    }

    return 'starter'
  }
}

