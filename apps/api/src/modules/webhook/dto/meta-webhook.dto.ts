import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsArray, IsOptional, IsString } from 'class-validator'

// ─── TypeScript interfaces para tipos internos (não validados recursivamente) ───

export interface MetaMetadata {
  display_phone_number: string
  phone_number_id: string
}

export interface MetaContactProfile {
  name: string
}

export interface MetaContact {
  profile: MetaContactProfile
  wa_id: string
}

export interface MetaStatus {
  id: string
  status: 'sent' | 'delivered' | 'read' | 'failed'
  timestamp: string
  recipient_id: string
  errors?: Array<{ code: number; title: string }>
}

export interface MetaMessageText {
  body: string
}

export interface MetaMessageMedia {
  id: string
  mime_type?: string
  sha256?: string
  caption?: string
  filename?: string
  animated?: boolean
  voice?: boolean
}

export interface MetaMessageLocation {
  latitude: number
  longitude: number
  name?: string
  address?: string
}

export interface MetaMessageContactName {
  formatted_name: string
  first_name?: string
  last_name?: string
}

export interface MetaMessageContactPhone {
  phone: string
  type?: string
  wa_id?: string
}

export interface MetaMessageContact {
  name: MetaMessageContactName
  phones?: MetaMessageContactPhone[]
  emails?: Array<{ email: string; type?: string }>
}

export interface MetaMessageReaction {
  message_id: string
  emoji: string
}

export interface MetaMessageContext {
  from: string
  id: string
}

export type MetaMessageType =
  | 'text'
  | 'image'
  | 'audio'
  | 'video'
  | 'document'
  | 'location'
  | 'contacts'
  | 'sticker'
  | 'reaction'
  | 'interactive'
  | 'template'
  | 'unsupported'

export interface MetaMessage {
  from: string
  id: string
  timestamp: string
  type: MetaMessageType
  text?: MetaMessageText
  image?: MetaMessageMedia
  audio?: MetaMessageMedia
  video?: MetaMessageMedia
  document?: MetaMessageMedia
  sticker?: MetaMessageMedia
  location?: MetaMessageLocation
  contacts?: MetaMessageContact[]
  reaction?: MetaMessageReaction
  context?: MetaMessageContext
  errors?: Array<{ code: number; title: string; details?: string; href?: string }>
}

export interface MetaChangeValue {
  messaging_product: string
  metadata: MetaMetadata
  contacts?: MetaContact[]
  messages?: MetaMessage[]
  statuses?: MetaStatus[]
}

export interface MetaChange {
  value: MetaChangeValue
  field: string
}

export interface MetaEntry {
  id: string
  changes: MetaChange[]
}

// ─── DTO (validado apenas no nível raiz) ─────────────────────────────────────

export class MetaWebhookPayloadDto {
  @ApiProperty({ example: 'whatsapp_business_account' })
  @IsString()
  @IsOptional()
  object?: string

  @ApiPropertyOptional({ description: 'Entradas do webhook Meta', type: 'array' })
  @IsArray()
  @IsOptional()
  entry?: MetaEntry[]
}
