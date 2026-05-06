export { PrismaClient, Prisma } from '@prisma/client'
export type {
  Tenant,
  Subscription,
  UsageRecord,
  User,
  WhatsAppConfig,
  Department,
  Contact,
  Conversation,
  Message,
  InternalNote,
  ConversationEvent,
  QuickReply,
  AutomationFlow,
  Broadcast,
  ApiKey,
  PlanType,
  SubscriptionStatus,
  UserRole,
  ConversationStatus,
  ConversationChannel,
  MessageDirection,
  MessageType,
  MessageStatus,
  BroadcastStatus,
} from '@prisma/client'

/**
 * Garante que toda query inclua filtro por tenantId.
 * Uso: prisma.contact.findMany({ where: withTenant(tenantId, { phone: '...' }) })
 */
export function withTenant<W extends object = Record<string, never>>(
  tenantId: string,
  where?: W,
): W & { tenantId: string } {
  return { ...where, tenantId } as W & { tenantId: string }
}
