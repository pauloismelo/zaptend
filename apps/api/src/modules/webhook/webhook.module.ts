import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bullmq'
import { WebhookController } from './webhook.controller'
import { WebhookService, MESSAGES_INBOUND_QUEUE } from './webhook.service'
import { PrismaModule } from '../../prisma/prisma.module'

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({ name: MESSAGES_INBOUND_QUEUE }),
  ],
  controllers: [WebhookController],
  providers: [WebhookService],
  exports: [WebhookService],
})
export class WebhookModule {}
