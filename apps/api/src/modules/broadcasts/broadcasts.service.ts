import { InjectQueue } from '@nestjs/bullmq'
import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { Queue } from 'bullmq'
import { Prisma } from '@zaptend/database'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateBroadcastDto } from './dto/broadcast.dto'

export const BROADCAST_SEND_QUEUE = 'broadcast-send'

@Injectable()
export class BroadcastsService {
  private readonly logger = new Logger(BroadcastsService.name)

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(BROADCAST_SEND_QUEUE) private readonly queue: Queue,
  ) {}

  findAll(tenantId: string) {
    return this.prisma.broadcast.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } })
  }

  async create(tenantId: string, userId: string, dto: CreateBroadcastDto) {
    const recipientCount = await this.countEligibleContacts(tenantId, dto.segmentFilters)
    const data: Prisma.BroadcastUncheckedCreateInput = {
      tenantId,
      createdBy: userId,
      name: dto.name,
      templateName: dto.templateName,
      templateVariables: dto.templateVariables as Prisma.InputJsonValue | undefined,
      segmentFilters: dto.segmentFilters as Prisma.InputJsonValue | undefined,
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
      recipientCount,
      status: dto.scheduledAt ? 'scheduled' : 'draft',
    }

    const broadcast = await this.prisma.broadcast.create({ data })

    if (dto.scheduledAt) {
      const delay = Math.max(new Date(dto.scheduledAt).getTime() - Date.now(), 0)
      await this.queue.add('send', { tenantId, broadcastId: broadcast.id }, { attempts: 3, delay })
      this.logger.log(`Broadcast ${broadcast.id} agendado para tenant ${tenantId}`)
    }

    return broadcast
  }

  async start(id: string, tenantId: string) {
    const broadcast = await this.prisma.broadcast.findFirst({ where: { id, tenantId } })
    if (!broadcast) throw new NotFoundException('Broadcast não encontrado')

    const updated = await this.prisma.broadcast.update({
      where: { id },
      data: { status: 'running', startedAt: new Date() },
    })
    await this.queue.add('send', { tenantId, broadcastId: id }, { attempts: 3 })
    this.logger.log(`Broadcast ${id} enfileirado para tenant ${tenantId}`)
    return updated
  }

  private async countEligibleContacts(tenantId: string, filters?: Record<string, unknown>) {
    const fieldFilters = filters?.fields as Record<string, unknown> | undefined
    const where = {
      tenantId,
      deletedAt: null,
      optedOut: false,
      ...(Array.isArray(filters?.tags) && { tags: { hasSome: filters.tags as string[] } }),
    }

    if (!fieldFilters || Object.keys(fieldFilters).length === 0) {
      return this.prisma.contact.count({ where })
    }

    const contacts = await this.prisma.contact.findMany({ where, select: { customFields: true } })
    return contacts.filter((contact) => this.matchesCustomFields(contact.customFields, fieldFilters)).length
  }

  private matchesCustomFields(customFields: unknown, filters: Record<string, unknown>) {
    if (!customFields || typeof customFields !== 'object' || Array.isArray(customFields)) return false
    const fields = customFields as Record<string, unknown>
    return Object.entries(filters).every(([key, value]) => fields[key] === value)
  }
}
