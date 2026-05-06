import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common'
import { InjectQueue } from '@nestjs/bullmq'
import { Queue } from 'bullmq'
import * as crypto from 'crypto'
import { PrismaService } from '../../prisma/prisma.service'
import { MetaWebhookPayloadDto, MetaEntry, MetaChangeValue } from './dto/meta-webhook.dto'

export const MESSAGES_INBOUND_QUEUE = 'messages-inbound'

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name)

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(MESSAGES_INBOUND_QUEUE) private readonly messageQueue: Queue,
  ) {}

  /**
   * Valida a assinatura HMAC-SHA256 do Meta.
   * Deve ser chamado ANTES de qualquer processamento da request POST.
   */
  verifySignature(rawBody: Buffer, signature: string): void {
    if (!signature) {
      throw new UnauthorizedException('Assinatura do webhook ausente')
    }

    const appSecret = process.env.META_APP_SECRET
    if (!appSecret) {
      this.logger.error('META_APP_SECRET não configurado')
      throw new BadRequestException('Configuração do servidor incompleta')
    }

    const expected = `sha256=${crypto
      .createHmac('sha256', appSecret)
      .update(rawBody)
      .digest('hex')}`

    const sigBuf = Buffer.from(signature)
    const expBuf = Buffer.from(expected)

    // timingSafeEqual exige buffers de mesmo tamanho — verificar antes
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      throw new UnauthorizedException('Assinatura do webhook inválida')
    }
  }

  /**
   * Verifica o webhook Meta (GET).
   * Retorna o hub.challenge se o token for válido para o tenant.
   */
  async handleVerification(
    tenantId: string,
    mode: string,
    token: string,
    challenge: string,
  ): Promise<string> {
    if (mode !== 'subscribe') {
      throw new BadRequestException('Modo de verificação inválido')
    }

    const config = await this.prisma.whatsAppConfig.findFirst({
      where: { tenantId, webhookVerifyToken: token, isActive: true },
    })

    if (!config) {
      throw new UnauthorizedException('Token de verificação inválido')
    }

    this.logger.log(`Webhook verificado para tenant ${tenantId} (phoneNumberId: ${config.phoneNumberId})`)
    return challenge
  }

  /**
   * Processa o payload do Meta (POST).
   * Enfileira mensagens e atualizações de status no BullMQ.
   */
  async processPayload(tenantId: string, payload: MetaWebhookPayloadDto): Promise<void> {
    const entries = (payload.entry as MetaEntry[]) ?? []

    for (const entry of entries) {
      for (const change of entry.changes ?? []) {
        if (change.field !== 'messages') continue

        const value = change.value as MetaChangeValue
        if (!value) continue

        await this.enqueueStatusUpdates(tenantId, value)
        await this.enqueueInboundMessages(tenantId, value)
      }
    }
  }

  private async enqueueStatusUpdates(tenantId: string, value: MetaChangeValue): Promise<void> {
    if (!value.statuses?.length) return

    for (const status of value.statuses) {
      await this.messageQueue.add(
        'update-status',
        {
          tenantId,
          waMessageId: status.id,
          status: status.status,
          timestamp: status.timestamp,
          recipientId: status.recipient_id,
        },
        { removeOnComplete: 100, removeOnFail: 50 },
      )
      this.logger.debug(`Status [${status.status}] enfileirado para msgId=${status.id}`)
    }
  }

  private async enqueueInboundMessages(tenantId: string, value: MetaChangeValue): Promise<void> {
    if (!value.messages?.length) return

    for (const message of value.messages) {
      const contact = value.contacts?.find((c) => c.wa_id === message.from) ?? {
        wa_id: message.from,
        profile: { name: message.from },
      }

      await this.messageQueue.add(
        'process-inbound',
        {
          tenantId,
          message,
          contact,
          metadata: value.metadata,
        },
        { removeOnComplete: 100, removeOnFail: 50 },
      )

      this.logger.log(
        `Mensagem [${message.type}] enfileirada: tenant=${tenantId} from=${message.from} id=${message.id}`,
      )
    }
  }
}
