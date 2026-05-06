import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Logger } from '@nestjs/common'
import { Job } from 'bullmq'
import type { InboundMessageJobPayload } from '@zaptend/types'
import { QUEUE_MESSAGES_INBOUND } from '../app.module'

@Processor(QUEUE_MESSAGES_INBOUND, { concurrency: 10 })
export class MessagesInboundProcessor extends WorkerHost {
  private readonly logger = new Logger(MessagesInboundProcessor.name)

  async process(job: Job<InboundMessageJobPayload>) {
    const { tenantId, rawPayload } = job.data
    this.logger.log(`Processando mensagem inbound — tenant: ${tenantId}, job: ${job.id}`)

    for (const entry of rawPayload.changes) {
      const { value } = entry

      if (value.messages?.length) {
        for (const message of value.messages) {
          await this.handleInboundMessage(tenantId, message, value.contacts?.[0]?.profile.name)
        }
      }

      if (value.statuses?.length) {
        for (const status of value.statuses) {
          await this.handleStatusUpdate(tenantId, status.id, status.status)
        }
      }
    }
  }

  private async handleInboundMessage(
    tenantId: string,
    message: InboundMessageJobPayload['rawPayload']['changes'][0]['value']['messages'][0],
    contactName?: string,
  ) {
    this.logger.debug(`Nova mensagem de ${message.from} — tipo: ${message.type}`)
    // TODO: Implementar fluxo completo:
    // 1. Criar/atualizar Contact pelo telefone
    // 2. Buscar ou criar Conversation aberta
    // 3. Persistir Message com waMessageId
    // 4. Emitir evento Socket.io para agentes online
    // 5. Aplicar regras de roteamento automático
    // 6. Verificar se bot está ativo → enviar para AI Engine
    void contactName
  }

  private async handleStatusUpdate(
    tenantId: string,
    waMessageId: string,
    status: string,
  ) {
    this.logger.debug(`Status update — ${waMessageId}: ${status}`)
    // TODO: Atualizar Message.status no banco
    void tenantId
  }
}
