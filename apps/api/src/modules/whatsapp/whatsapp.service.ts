import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common'
import { Message } from '@zaptend/database'
import { PrismaService } from '../../prisma/prisma.service'
import { KmsService } from '../../common/kms/kms.service'

const META_API_BASE = `https://graph.facebook.com/${process.env.META_API_VERSION ?? 'v20.0'}`

interface MetaApiResponse {
  messages?: Array<{ id: string }>
  error?: { message: string; code: number }
}

interface MetaCredentials {
  phoneNumberId: string
  accessToken: string
}

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly kmsService: KmsService,
  ) {}

  // ── Métodos Públicos ──────────────────────────────────────────────────────

  async sendTextMessage(tenantId: string, to: string, text: string): Promise<Message> {
    await this.assert24hWindow(tenantId, to)

    const { phoneNumberId, accessToken } = await this.getCredentials(tenantId)

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: { preview_url: false, body: text },
    }

    const waMessageId = await this.callMetaApi(phoneNumberId, accessToken, payload)
    const conversationId = await this.findConversationId(tenantId, to)

    return this.saveMessage({
      tenantId,
      conversationId,
      waMessageId,
      type: 'text',
      content: text,
    })
  }

  async sendMediaMessage(
    tenantId: string,
    to: string,
    mediaType: string,
    mediaUrl: string,
    caption?: string,
  ): Promise<Message> {
    await this.assert24hWindow(tenantId, to)

    const { phoneNumberId, accessToken } = await this.getCredentials(tenantId)

    const mediaPayload: Record<string, string | undefined> = { link: mediaUrl }
    if (caption && ['image', 'video', 'document'].includes(mediaType)) {
      mediaPayload.caption = caption
    }

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: mediaType,
      [mediaType]: mediaPayload,
    }

    const waMessageId = await this.callMetaApi(phoneNumberId, accessToken, payload)
    const conversationId = await this.findConversationId(tenantId, to)

    return this.saveMessage({
      tenantId,
      conversationId,
      waMessageId,
      type: this.resolveMediaType(mediaType),
      content: caption,
      mediaUrl,
      mediaType,
    })
  }

  async sendTemplate(
    tenantId: string,
    to: string,
    templateName: string,
    variables: string[],
  ): Promise<Message> {
    const { phoneNumberId, accessToken } = await this.getCredentials(tenantId)

    const components = variables.length
      ? [{ type: 'body', parameters: variables.map((v) => ({ type: 'text', text: v })) }]
      : []

    const payload = {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: 'pt_BR' },
        components,
      },
    }

    const waMessageId = await this.callMetaApi(phoneNumberId, accessToken, payload)
    const conversationId = await this.findConversationId(tenantId, to)

    return this.saveMessage({
      tenantId,
      conversationId,
      waMessageId,
      type: 'template',
      templateName,
    })
  }

  async sendReaction(
    tenantId: string,
    to: string,
    messageId: string,
    emoji: string,
  ): Promise<Message> {
    const { phoneNumberId, accessToken } = await this.getCredentials(tenantId)

    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'reaction',
      reaction: { message_id: messageId, emoji },
    }

    const waMessageId = await this.callMetaApi(phoneNumberId, accessToken, payload)
    const conversationId = await this.findConversationId(tenantId, to)

    return this.saveMessage({
      tenantId,
      conversationId,
      waMessageId,
      type: 'reaction',
      reactionEmoji: emoji,
    })
  }

  // ── Helpers Privados ──────────────────────────────────────────────────────

  private async getCredentials(tenantId: string): Promise<MetaCredentials> {
    const config = await this.prisma.whatsAppConfig.findFirst({
      where: { tenantId, isActive: true },
      select: { phoneNumberId: true, accessTokenEncrypted: true },
    })
    if (!config) {
      throw new NotFoundException(
        'Configuração WhatsApp não encontrada ou inativa para este tenant',
      )
    }
    const accessToken = await this.kmsService.decrypt(config.accessTokenEncrypted)
    return { phoneNumberId: config.phoneNumberId, accessToken }
  }

  private async assert24hWindow(tenantId: string, phone: string): Promise<void> {
    const contact = await this.prisma.contact.findFirst({
      where: { tenantId, phone, deletedAt: null },
      select: { id: true },
    })

    if (!contact) {
      throw new BadRequestException(
        `Fora da janela de 24h: contato ${phone} não encontrado neste tenant`,
      )
    }

    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const lastInbound = await this.prisma.message.findFirst({
      where: {
        tenantId,
        direction: 'inbound',
        createdAt: { gte: cutoff },
        conversation: { contactId: contact.id },
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    })

    if (!lastInbound) {
      throw new BadRequestException(
        'Fora da janela de 24h: o contato não enviou mensagem nas últimas 24 horas. Use um template aprovado pelo Meta.',
      )
    }
  }

  private async findConversationId(tenantId: string, phone: string): Promise<string> {
    const contact = await this.prisma.contact.findFirst({
      where: { tenantId, phone, deletedAt: null },
      select: { id: true },
    })
    if (!contact) {
      throw new NotFoundException(`Contato com número ${phone} não encontrado`)
    }

    const conversation = await this.prisma.conversation.findFirst({
      where: { tenantId, contactId: contact.id, deletedAt: null },
      orderBy: { lastMessageAt: 'desc' },
      select: { id: true },
    })
    if (!conversation) {
      throw new NotFoundException(`Nenhuma conversa encontrada para o contato ${phone}`)
    }

    return conversation.id
  }

  private async callMetaApi(
    phoneNumberId: string,
    accessToken: string,
    payload: Record<string, unknown>,
  ): Promise<string> {
    const url = `${META_API_BASE}/${phoneNumberId}/messages`

    let response: Response
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
    } catch (err) {
      this.logger.error('Erro de rede ao chamar Meta API', (err as Error).stack)
      throw new InternalServerErrorException('Erro de rede ao enviar mensagem via WhatsApp')
    }

    const data = (await response.json()) as MetaApiResponse

    if (!response.ok || data.error) {
      const reason = data.error?.message ?? `HTTP ${response.status}`
      this.logger.error(`Meta API retornou erro: ${reason}`)
      throw new InternalServerErrorException(`Falha ao enviar mensagem via WhatsApp: ${reason}`)
    }

    const waMessageId = data.messages?.[0]?.id
    if (!waMessageId) {
      throw new InternalServerErrorException('Meta API não retornou ID da mensagem')
    }

    this.logger.debug(`Meta API: mensagem enviada waId=${waMessageId}`)
    return waMessageId
  }

  private async saveMessage(params: {
    tenantId: string
    conversationId: string
    waMessageId: string
    type: string
    content?: string
    mediaUrl?: string
    mediaType?: string
    templateName?: string
    reactionEmoji?: string
  }): Promise<Message> {
    const now = new Date()

    const [message] = await this.prisma.$transaction([
      this.prisma.message.create({
        data: {
          tenantId: params.tenantId,
          conversationId: params.conversationId,
          waMessageId: params.waMessageId,
          direction: 'outbound',
          type: params.type as never,
          content: params.content ?? null,
          mediaUrl: params.mediaUrl ?? null,
          mediaType: params.mediaType ?? null,
          templateName: params.templateName ?? null,
          reactionEmoji: params.reactionEmoji ?? null,
          status: 'sent',
          sentAt: now,
        },
      }),
      this.prisma.conversation.update({
        where: { id: params.conversationId },
        data: { lastMessageAt: now },
      }),
    ])

    this.logger.log(
      `Mensagem outbound salva: id=${message.id} waId=${params.waMessageId} tenant=${params.tenantId}`,
    )
    return message as Message
  }

  private resolveMediaType(
    mediaType: string,
  ): 'image' | 'video' | 'audio' | 'document' | 'sticker' | 'unsupported' {
    const supported = ['image', 'video', 'audio', 'document', 'sticker'] as const
    return supported.includes(mediaType as (typeof supported)[number])
      ? (mediaType as (typeof supported)[number])
      : 'unsupported'
  }
}
