import { BullModule } from '@nestjs/bullmq'
import { Module } from '@nestjs/common'
import { PrismaModule } from '../../prisma/prisma.module'
import { BillingModule } from '../billing/billing.module'
import { BroadcastsController } from './broadcasts.controller'
import { BROADCAST_SEND_QUEUE, BroadcastsService } from './broadcasts.service'

@Module({
  imports: [PrismaModule, BillingModule, BullModule.registerQueue({ name: BROADCAST_SEND_QUEUE })],
  controllers: [BroadcastsController],
  providers: [BroadcastsService],
})
export class BroadcastsModule {}

