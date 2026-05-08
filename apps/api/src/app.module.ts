import { Module, MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler'
import { BullModule } from '@nestjs/bullmq'
import { PrismaModule } from './prisma/prisma.module'
import { TenantContextMiddleware } from './common/middleware/tenant-context.middleware'
import { JwtAuthGuard } from './common/guards/jwt-auth.guard'
import { RolesGuard } from './common/guards/roles.guard'
import { AuthModule } from './modules/auth/auth.module'
import { WhatsAppConfigModule } from './modules/whatsapp-config/whatsapp-config.module'
import { WebhookModule } from './modules/webhook/webhook.module'
import { WhatsAppModule } from './modules/whatsapp/whatsapp.module'
import { ConversationsModule } from './modules/conversations/conversations.module'
import { MessagesModule } from './modules/messages/messages.module'
import { ContactsModule } from './modules/contacts/contacts.module'
import { GatewaysModule } from './gateways/gateways.module'
import { UsersModule } from './modules/users/users.module'
import { DepartmentsModule } from './modules/departments/departments.module'
import { BillingModule } from './modules/billing/billing.module'
import { QuickRepliesModule } from './modules/quick-replies/quick-replies.module'
import { BroadcastsModule } from './modules/broadcasts/broadcasts.module'
import { AutomationsModule } from './modules/automations/automations.module'
import { AiModule } from './modules/ai/ai.module'
import { ReportsModule } from './modules/reports/reports.module'
import { SuperAdminModule } from './modules/super-admin/super-admin.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    BullModule.forRootAsync({
      useFactory: () => ({
        connection: { url: process.env.REDIS_URL ?? 'redis://localhost:6379' },
      }),
    }),
    PrismaModule,
    AuthModule,
    WhatsAppConfigModule,
    WebhookModule,
    WhatsAppModule,
    ConversationsModule,
    MessagesModule,
    ContactsModule,
    GatewaysModule,
    UsersModule,
    DepartmentsModule,
    BillingModule,
    QuickRepliesModule,
    BroadcastsModule,
    AutomationsModule,
    AiModule,
    ReportsModule,
    SuperAdminModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantContextMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL })
  }
}
