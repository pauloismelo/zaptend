import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { BullModule } from '@nestjs/bullmq'
import { MessagesInboundProcessor } from './processors/messages-inbound.processor'
import { PrismaService } from './prisma/prisma.service'
import { MetaApiService } from './services/meta-api.service'
import { S3Service } from './services/s3.service'
import { SocketEmitterService } from './services/socket-emitter.service'
import { RoutingService } from './services/routing.service'

export const QUEUE_MESSAGES_INBOUND = 'messages-inbound'
export const QUEUE_MESSAGES_OUTBOUND = 'messages-outbound'
export const QUEUE_NOTIFICATIONS = 'notifications'
export const QUEUE_BILLING = 'billing'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRootAsync({
      useFactory: () => ({
        connection: { url: process.env.REDIS_URL ?? 'redis://localhost:6379' },
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
          removeOnComplete: { count: 1000 },
          removeOnFail: { count: 5000 },
        },
      }),
    }),
    BullModule.registerQueue(
      { name: QUEUE_MESSAGES_INBOUND },
      { name: QUEUE_MESSAGES_OUTBOUND },
      { name: QUEUE_NOTIFICATIONS },
      { name: QUEUE_BILLING },
    ),
  ],
  providers: [
    PrismaService,
    MetaApiService,
    S3Service,
    SocketEmitterService,
    RoutingService,
    MessagesInboundProcessor,
  ],
})
export class AppModule {}
