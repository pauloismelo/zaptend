import { Module } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Stripe from 'stripe'
import { PrismaModule } from '../../prisma/prisma.module'
import { BillingController } from './billing.controller'
import { BillingService } from './billing.service'
import { UsageService } from './usage.service'
import { PlanGuard } from './guards/plan.guard'
import { STRIPE_CLIENT } from './billing.constants'

@Module({
  imports: [PrismaModule],
  controllers: [BillingController],
  providers: [
    BillingService,
    UsageService,
    PlanGuard,
    {
      provide: STRIPE_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const apiKey = configService.get<string>('STRIPE_SECRET_KEY') ?? 'sk_test_missing'
        return new Stripe(apiKey)
      },
    },
  ],
  exports: [BillingService, UsageService, PlanGuard],
})
export class BillingModule {}
