// ─────────────────────────────────────────────
// Scalars
// ─────────────────────────────────────────────
export type TenantId = string
export type UserId = string
export type ConversationId = string
export type ContactId = string
export type MessageId = string

// ─────────────────────────────────────────────
// Enums (espelha o schema Prisma)
// ─────────────────────────────────────────────
export type PlanType = 'starter' | 'growth' | 'pro' | 'enterprise' | 'trial'

export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid'

export type UserRole = 'agent' | 'supervisor' | 'admin' | 'owner'

export type ConversationStatus =
  | 'open'
  | 'attending'
  | 'waiting_customer'
  | 'resolved'
  | 'spam'

export type MessageDirection = 'inbound' | 'outbound'

export type MessageType =
  | 'text'
  | 'image'
  | 'audio'
  | 'video'
  | 'document'
  | 'location'
  | 'contact'
  | 'sticker'
  | 'reaction'
  | 'template'
  | 'interactive'
  | 'system'
  | 'unsupported'

export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed'

export type BroadcastStatus = 'draft' | 'scheduled' | 'running' | 'completed' | 'failed' | 'cancelled'

// ─────────────────────────────────────────────
// JWT / Auth
// ─────────────────────────────────────────────
export interface JwtPayload {
  sub: UserId
  email: string
  role: UserRole
  tenantId: TenantId
  tenantSlug: string
  iat?: number
  exp?: number
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

// ─────────────────────────────────────────────
// BullMQ Job Payloads
// ─────────────────────────────────────────────
export interface InboundMessageJobPayload {
  tenantId: TenantId
  rawPayload: WhatsAppWebhookEntry
}

export interface OutboundMessageJobPayload {
  tenantId: TenantId
  conversationId: ConversationId
  messageId: MessageId
  to: string
  type: MessageType
  content: string
  mediaUrl?: string
  templateName?: string
  templateVariables?: Record<string, string>
}

// ─────────────────────────────────────────────
// WhatsApp Cloud API (Meta)
// ─────────────────────────────────────────────
export interface WhatsAppWebhookPayload {
  object: 'whatsapp_business_account'
  entry: WhatsAppWebhookEntry[]
}

export interface WhatsAppWebhookEntry {
  id: string
  changes: WhatsAppWebhookChange[]
}

export interface WhatsAppWebhookChange {
  value: WhatsAppWebhookValue
  field: 'messages'
}

export interface WhatsAppWebhookValue {
  messaging_product: 'whatsapp'
  metadata: {
    display_phone_number: string
    phone_number_id: string
  }
  contacts?: Array<{
    profile: { name: string }
    wa_id: string
  }>
  messages?: WhatsAppInboundMessage[]
  statuses?: WhatsAppMessageStatus[]
}

export interface WhatsAppInboundMessage {
  from: string
  id: string
  timestamp: string
  type: MessageType
  text?: { body: string }
  image?: { id: string; mime_type: string; sha256: string; caption?: string }
  audio?: { id: string; mime_type: string }
  video?: { id: string; mime_type: string; caption?: string }
  document?: { id: string; mime_type: string; filename: string; caption?: string }
  location?: { latitude: number; longitude: number; name?: string; address?: string }
  reaction?: { message_id: string; emoji: string }
  sticker?: { id: string; mime_type: string; animated: boolean }
  context?: { from: string; id: string }
}

export interface WhatsAppMessageStatus {
  id: string
  status: 'sent' | 'delivered' | 'read' | 'failed'
  timestamp: string
  recipient_id: string
  errors?: Array<{ code: number; title: string }>
}

// ─────────────────────────────────────────────
// Socket.io Events
// ─────────────────────────────────────────────
export interface SocketEvents {
  // Server → Client
  'conversation:new': { conversation: Record<string, unknown> }
  'conversation:updated': { conversationId: ConversationId; changes: Record<string, unknown> }
  'message:new': { conversationId: ConversationId; message: Record<string, unknown> }
  'message:status': { messageId: MessageId; status: MessageStatus }
  'agent:online': { userId: UserId }
  'agent:offline': { userId: UserId }
  // Client → Server
  'room:join': { tenantId: TenantId }
  'room:leave': { tenantId: TenantId }
  'typing:start': { conversationId: ConversationId }
  'typing:stop': { conversationId: ConversationId }
}
