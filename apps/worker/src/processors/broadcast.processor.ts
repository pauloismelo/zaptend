import { Processor, WorkerHost } from '@nestjs/bullmq'
import { Injectable, Logger } from '@nestjs/common'
import { Job } from 'bullmq'
import { PrismaService } from '../prisma/prisma.service'
import { MetaApiService } from '../services/meta-api.service'
import { QUEUE_BROADCAST_SEND } from '../app.module'

interface BroadcastJobData {
  tenantId: string
  broadcastId: string
}

interface BroadcastFilters {
  tags?: string[]
  fields?: Record<string, unknown>
}

const RATE_LIMIT_INTERVAL_MS = 13

@Injectable()
@Processor(QUEUE_BROADCAST_SEND, { concurrency: 1 })
export class BroadcastProcessor extends WorkerHost {
  private readonly logger = new Logger(BroadcastProcessor.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly metaApi: MetaApiService,
  ) {
    super()
  }

  async process(job: Job<BroadcastJobData>): Promise<void> {
    const { tenantId, broadcastId } = job.data
    const broadcast = await this.prisma.broadcast.findFirst({ where: { id: broadcastId, tenantId } })
    if (!broadcast) {
      this.logger.warn(`Broadcast ${broadcastId} não encontrado para tenant ${tenantId}`)
      return
    }

    const config = await this.prisma.whatsAppConfig.findFirst({
      where: { tenantId, isActive: true },
      select: { phoneNumberId: true, accessTokenEncrypted: true },
    })
    if (!config) {
      await this.prisma.broadcast.update({ where: { id: broadcastId }, data: { status: 'failed' } })
      throw new Error(`Tenant ${tenantId} sem configuração WhatsApp ativa`)
    }

    const filters = (broadcast.segmentFilters ?? {}) as BroadcastFilters
    const contacts = await this.findEligibleContacts(tenantId, filters)
    await this.prisma.broadcast.update({
      where: { id: broadcastId },
      data: {
        recipientCount: contacts.length,
        status: 'running',
        startedAt: broadcast.startedAt ?? new Date(),
      },
    })

    for (const contact of contacts) {
      try {
        await this.metaApi.sendTemplate({
          phoneNumberId: config.phoneNumberId,
          accessToken: config.accessTokenEncrypted,
          to: contact.phone,
          templateName: broadcast.templateName,
          variables: this.renderVariables((broadcast.templateVariables ?? {}) as Record<string, unknown>, contact),
        })
        await this.prisma.broadcast.update({
          where: { id: broadcastId },
          data: { sentCount: { increment: 1 } },
        })
      } catch (error) {
        this.logger.warn(`Falha no broadcast ${broadcastId} para contato ${contact.id}: ${(error as Error).message}`)
        await this.prisma.broadcast.update({
          where: { id: broadcastId },
          data: { failedCount: { increment: 1 } },
        })
      }

      await this.wait(RATE_LIMIT_INTERVAL_MS)
    }

    await this.prisma.broadcast.update({
      where: { id: broadcastId },
      data: { status: 'completed', completedAt: new Date() },
    })
  }

  private async findEligibleContacts(tenantId: string, filters: BroadcastFilters) {
    const contacts = await this.prisma.contact.findMany({
      where: {
        tenantId,
        deletedAt: null,
        optedOut: false,
        ...(filters.tags?.length && { tags: { hasSome: filters.tags } }),
      },
      select: {
        id: true,
        phone: true,
        name: true,
        email: true,
        company: true,
        tags: true,
        customFields: true,
      },
    })

    if (!filters.fields || Object.keys(filters.fields).length === 0) return contacts
    return contacts.filter((contact) => this.matchesCustomFields(contact.customFields, filters.fields ?? {}))
  }

  private matchesCustomFields(customFields: unknown, filters: Record<string, unknown>) {
    if (!customFields || typeof customFields !== 'object' || Array.isArray(customFields)) return false
    const fields = customFields as Record<string, unknown>
    return Object.entries(filters).every(([key, value]) => fields[key] === value)
  }

  private renderVariables(templateVariables: Record<string, unknown>, contact: Record<string, unknown>) {
    const customFields = (contact.customFields ?? {}) as Record<string, unknown>
    return Object.fromEntries(
      Object.entries(templateVariables).map(([key, value]) => [
        key,
        typeof value === 'string'
          ? value
              .replace('{{contact.name}}', String(contact.name ?? ''))
              .replace('{{contact.phone}}', String(contact.phone ?? ''))
              .replace('{{contact.company}}', String(contact.company ?? ''))
              .replace(/\{\{customFields\.([^}]+)\}\}/g, (_, field: string) => String(customFields[field] ?? ''))
          : value,
      ]),
    )
  }

  private wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
