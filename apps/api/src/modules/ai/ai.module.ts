import { Module } from '@nestjs/common'
import { PrismaModule } from '../../prisma/prisma.module'
import { BillingModule } from '../billing/billing.module'
import { AiController } from './ai.controller'
import { AiFacadeService } from './ai-facade.service'
import { AiService } from './ai.service'

@Module({
  imports: [PrismaModule, BillingModule],
  controllers: [AiController],
  providers: [AiService, AiFacadeService],
  exports: [AiService],
})
export class AiModule {}
