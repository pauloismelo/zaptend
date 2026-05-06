import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { Job } from 'bullmq'
import type { InboundMessageJobPayload, WhatsAppInboundMessage } from '@zaptend/types'
import { withTenant } from '@zaptend/database'
import { PrismaService } from '../prisma/prisma.service'
import { MetaApiService } from '../services/meta-api.service'
import { S3Service } from '../services/s3.service'
import { SocketEmitterService } from '../services/socket-emitter.service'
import { RoutingService } from '../services/routing.service'
import { QUEUE_MESSAGES_INBOUND } from '../app.module'

const MEDIA_TYPES = new Set(['image', 'audio', 'video', 'document', 'sticker'])

@Processor(QUEUE_MESSAGES_INBOUND, { concurrency: 10 })
export class MessagesInboundProcessor extends WorkerHost {
  private readonly logger = new Logger(MessagesInboundProcessor.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly metaApi: MetaApiService,
    private readonly s3: S3Service,
    private readonly socketEmitter: SocketEmitterService,
    private readonly routing: RoutingService,
  ) {
    super()
  }

  async process(job: Job<InboundMessageJobPayload>): Promise<void> {
    const { tenantId, rawPayload } = job.data
    this.logger.log(`Processando job ${job.id} — tenant: ${tenantId}`)

    for (const entry of rawPayload.changes) {
      const { value } = entry
      const contactName = value.contacts?.[0]?.profile.name

      if (value.messages?.length) {
        for (const message of value.messages) {
          try {
            await this.handleInboundMessage(tenantId, message, contactName)
          } catch (err) {
            this.logger.error(
              `Erro ao processar mensagem ${message.id} do tenant ${tenantId}: ${(err as Error).message}`,
              (err as Error).stack,
            )
          }
        }
      }

      if (value.statuses?.length) {
        for (const status of value.statuses) {
          try {
            await this.handleStatusUpdate(tenantId, status.id, status.status)
          } catch (err) {
            this.logger.error(
              `Erro ao atualizar status ${status.id}: ${(err as Error).message}`,
              (err as Error).stack,
            )
          }
        }
      }
    }
  }

  private async handleInboundMessage(
    tenantId: string,
    message: WhatsAppInboundMessage,
    contactName?: string,
  ): Promise<void> {
    this.logger.debug(`Nova mensagem de ${message.from} — tipo: ${message.type}`)

    // 1. Upsert Contact pelo telefone + tenantId
    const contact = await this.prisma.contact.upsert({
      where: { tenantId_phone: { tenantId, phone: message.from } },
      create: withTenant(tenantId, {
        phone: message.from,
        ...(contactName && { name: contactName }),
      }),
      update: contactName ? { name: contactName } : {},
    })

    // 2. Buscar conversa aberta ou criar nova
    const existingConversation = await this.prisma.conversation.findFirst({
      where: withTenant(tenantId, {
        contactId: contact.id,
        status: { in: ['open', 'attending', 'waiting_customer'] },
        deletedAt: null,
      }),
      orderBy: { lastMessageAt: 'desc' },
    })

    const isNewConversation = !existingConversation
    const sentAt = new Date(Number(message.timestamp) * 1000)

    const conversation =
      existingConversation ??
      (await this.prisma.conversation.create({
        data: withTenant(tenantId, {
          contactId: contact.id,
          channel: 'whatsapp',
          status: 'open',
          lastMessageAt: sentAt,
        }),
      }))

    // 3. Resolver URL de mídia: baixar da Meta e enviar ao S3
    const mediaUrl = await this.resolveMediaUrl(tenantId, message)

    // 4. Lookup replyTo por waMessageId (se houver contexto)
    let replyToId: string | undefined
    if (message.context?.id) {
      const replyTo = await this.prisma.message.findUnique({
        where: { waMessageId: message.context.id },
        select: { id: true },
      })
      replyToId = replyTo?.id
    }

    // 5. Criar a Message no banco
    const dbMessage = await this.prisma.message.create({
      data: {
        tenantId,
        conversationId: conversation.id,
        waMessageId: message.id,
        direction: 'inbound',
        type: message.type,
        content: this.extractContent(message),
        mediaUrl: mediaUrl ?? undefined,
        mediaType: this.extractMediaMimeType(message),
        latitude: message.location?.latitude,
        longitude: message.location?.longitude,
        reactionEmoji: message.reaction?.emoji,
        replyToId,
        status: 'delivered',
        sentAt,
      },
    })

    // Atualizar lastMessageAt da conversa
    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: sentAt },
    })

    // 6. Emitir eventos Socket.io para agentes online
    if (isNewConversation) {
      this.socketEmitter.emitToTenant(tenantId, 'conversation:new', { conversation })
    } else {
      this.socketEmitter.emitToTenant(tenantId, 'conversation:updated', {
        conversationId: conversation.id,
        changes: { lastMessageAt: sentAt },
      })
    }

    this.socketEmitter.emitToTenant(tenantId, 'message:new', {
      conversationId: conversation.id,
      message: dbMessage,
    })

    // 7. Aplicar roteamento automático se conversa sem atribuição
    if (!conversation.assignedUserId) {
      await this.routing.assignConversation(tenantId, conversation.id)
    }
  }

  private async resolveMediaUrl(
    tenantId: string,
    message: WhatsAppInboundMessage,
  ): Promise<string | null> {
    if (!MEDIA_TYPES.has(message.type)) return null

    const mediaObj = message[message.type as keyof WhatsAppInboundMessage] as
      | { id: string; mime_type?: string; filename?: string }
      | undefined

    if (!mediaObj?.id) return null

    const config = await this.prisma.whatsAppConfig.findFirst({
      where: withTenant(tenantId, { isActive: true }),
      select: { accessTokenEncrypted: true },
    })

    if (!config) {
      this.logger.warn(`Configuração WhatsApp não encontrada para tenant ${tenantId}`)
      return null
    }

    // Em produção: descriptografar com AWS KMS antes de usar.
    // Aqui usamos o token diretamente (ambiente de desenvolvimento).
    const accessToken = config.accessTokenEncrypted

    try {
      const { buffer, mimeType } = await this.metaApi.downloadMedia(mediaObj.id, accessToken)
      const filename = 'filename' in mediaObj ? (mediaObj.filename as string) : undefined
      return await this.s3.upload(tenantId, buffer, mimeType, filename)
    } catch (err) {
      this.logger.error(
        `Falha ao processar mídia ${mediaObj.id}: ${(err as Error).message}`,
        (err as Error).stack,
      )
      return null
    }
  }

  private extractContent(message: WhatsAppInboundMessage): string | undefined {
    switch (message.type) {
      case 'text':
        return message.text?.body
      case 'image':
        return message.image?.caption
      case 'video':
        return message.video?.caption
      case 'document':
        return message.document?.caption ?? message.document?.filename
      case 'location': {
        const parts = [message.location?.name, message.location?.address].filter(Boolean)
        return parts.length ? parts.join(', ') : undefined
      }
      case 'reaction':
        return message.reaction?.emoji
      default:
        return undefined
    }
  }

  private extractMediaMimeType(message: WhatsAppInboundMessage): string | undefined {
    const mediaTypes = ['image', 'audio', 'video', 'document', 'sticker'] as const
    for (const t of mediaTypes) {
      const obj = message[t]
      if (obj && typeof obj === 'object' && 'mime_type' in obj) {
        return (obj as { mime_type?: string }).mime_type
      }
    }
    return undefined
  }

  private async handleStatusUpdate(
    tenantId: string,
    waMessageId: string,
    status: string,
  ): Promise<void> {
    this.logger.debug(`Status update — ${waMessageId}: ${status}`)

    const validStatuses = new Set(['sent', 'delivered', 'read', 'failed'])
    if (!validStatuses.has(status)) return

    const message = await this.prisma.message.findUnique({
      where: { waMessageId },
      select: { id: true, tenantId: true },
    })

    // Garantia de isolamento: só atualiza mensagens do próprio tenant
    if (!message || message.tenantId !== tenantId) return

    const now = new Date()
    const statusFields: Record<string, unknown> = { status }

    if (status === 'delivered') statusFields.deliveredAt = now
    else if (status === 'read') statusFields.readAt = now
    else if (status === 'failed') statusFields.failedAt = now

    await this.prisma.message.update({
      where: { waMessageId },
      data: statusFields,
    })

    this.socketEmitter.emitToTenant(tenantId, 'message:status', {
      messageId: message.id,
      status,
    })
  }
}
