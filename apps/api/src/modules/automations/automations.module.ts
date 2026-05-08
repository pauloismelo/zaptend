import { Module } from '@nestjs/common'
import { PrismaModule } from '../../prisma/prisma.module'
import { BillingModule } from '../billing/billing.module'
import { AutomationsController } from './automations.controller'
import { AutomationsService } from './automations.service'

@Module({
  imports: [PrismaModule, BillingModule],
  controllers: [AutomationsController],
  providers: [AutomationsService],
})
export class AutomationsModule {}

