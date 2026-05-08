import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { ReportLimitQueryDto, ReportPeriodDto, ReportVolumeQueryDto } from './dto/reports.dto'

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(tenantId: string, query: ReportPeriodDto) {
    const range = this.resolveRange(query)
    const [openConversations, conversations, onlineAgents] = await Promise.all([
      this.prisma.conversation.count({
        where: { tenantId, deletedAt: null, status: { in: ['open', 'attending', 'waiting_customer'] } },
      }),
      this.prisma.conversation.findMany({
        where: { tenantId, deletedAt: null, createdAt: range },
        select: { createdAt: true, lastAssignedAt: true, resolvedAt: true, csatScore: true },
      }),
      this.prisma.user.count({ where: { tenantId, isOnline: true, isActive: true, deletedAt: null } }),
    ])

    return {
      openConversations,
      averageAssignmentMinutes: averageMinutes(conversations, 'createdAt', 'lastAssignedAt'),
      averageResolutionMinutes: averageMinutes(conversations, 'createdAt', 'resolvedAt'),
      averageCsat: averageNumber(conversations.map((item) => item.csatScore)),
      onlineAgents,
    }
  }

  async volume(tenantId: string, query: ReportVolumeQueryDto) {
    const range = this.resolveRange(query)
    const conversations = await this.prisma.conversation.findMany({
      where: { tenantId, deletedAt: null, createdAt: range },
      select: { createdAt: true, departmentId: true, assignedUserId: true },
    })

    const period = query.period ?? 'day'
    const groups = new Map<string, { bucket: string; departmentId: string | null; agentId: string | null; total: number }>()
    for (const conversation of conversations) {
      const bucket = formatBucket(conversation.createdAt, period)
      const key = `${bucket}:${conversation.departmentId ?? 'none'}:${conversation.assignedUserId ?? 'none'}`
      const current = groups.get(key) ?? {
        bucket,
        departmentId: conversation.departmentId,
        agentId: conversation.assignedUserId,
        total: 0,
      }
      current.total += 1
      groups.set(key, current)
    }

    return Array.from(groups.values()).sort((a, b) => a.bucket.localeCompare(b.bucket))
  }

  async agents(tenantId: string, query: ReportPeriodDto) {
    const range = this.resolveRange(query)
    const agents = await this.prisma.user.findMany({
      where: { tenantId, deletedAt: null },
      select: {
        id: true,
        name: true,
        assignedConversations: {
          where: { tenantId, deletedAt: null, createdAt: range },
          select: { createdAt: true, lastAssignedAt: true, resolvedAt: true, csatScore: true },
        },
      },
      orderBy: { name: 'asc' },
    })

    return agents.map((agent) => ({
      agentId: agent.id,
      agentName: agent.name,
      conversations: agent.assignedConversations.length,
      averageAssignmentMinutes: averageMinutes(agent.assignedConversations, 'createdAt', 'lastAssignedAt'),
      averageResolutionMinutes: averageMinutes(agent.assignedConversations, 'createdAt', 'resolvedAt'),
      averageCsat: averageNumber(agent.assignedConversations.map((item) => item.csatScore)),
    }))
  }

  async heatmap(tenantId: string, query: ReportPeriodDto) {
    const range = this.resolveRange(query)
    const conversations = await this.prisma.conversation.findMany({
      where: { tenantId, deletedAt: null, createdAt: range },
      select: { createdAt: true },
    })
    const groups = new Map<string, { dayOfWeek: number; hour: number; total: number }>()

    for (const conversation of conversations) {
      const dayOfWeek = conversation.createdAt.getUTCDay()
      const hour = conversation.createdAt.getUTCHours()
      const key = `${dayOfWeek}:${hour}`
      const current = groups.get(key) ?? { dayOfWeek, hour, total: 0 }
      current.total += 1
      groups.set(key, current)
    }

    return Array.from(groups.values()).sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.hour - b.hour)
  }

  async lastHoursVolume(tenantId: string, query: ReportLimitQueryDto) {
    const hours = query.hours ?? 24
    const start = new Date(Date.now() - hours * 60 * 60 * 1000)
    const conversations = await this.prisma.conversation.findMany({
      where: { tenantId, deletedAt: null, createdAt: { gte: start } },
      select: { createdAt: true },
    })
    const buckets = new Map<string, number>()
    for (let i = hours - 1; i >= 0; i -= 1) {
      const date = new Date(Date.now() - i * 60 * 60 * 1000)
      buckets.set(`${date.getHours().toString().padStart(2, '0')}:00`, 0)
    }
    for (const conversation of conversations) {
      const key = `${conversation.createdAt.getHours().toString().padStart(2, '0')}:00`
      buckets.set(key, (buckets.get(key) ?? 0) + 1)
    }
    return Array.from(buckets.entries()).map(([bucket, total]) => ({ bucket, total }))
  }

  async unassigned(tenantId: string) {
    return this.prisma.conversation.findMany({
      where: {
        tenantId,
        deletedAt: null,
        assignedUserId: null,
        status: { in: ['open', 'waiting_customer'] },
      },
      include: { contact: { select: { id: true, name: true, phone: true, company: true } } },
      orderBy: { lastMessageAt: 'desc' },
      take: 10,
    })
  }

  private resolveRange(query: ReportPeriodDto) {
    const end = query.endDate ? new Date(query.endDate) : new Date()
    const start = query.startDate ? new Date(query.startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000)
    return { gte: start, lte: end }
  }
}

function averageMinutes<T extends Record<string, unknown>>(items: T[], from: keyof T, to: keyof T) {
  const durations = items
    .map((item) => {
      const fromValue = item[from]
      const toValue = item[to]
      if (!(fromValue instanceof Date) || !(toValue instanceof Date)) return null
      if (!fromValue || !toValue) return null
      return (toValue.getTime() - fromValue.getTime()) / 60000
    })
    .filter((value): value is number => value !== null && Number.isFinite(value))
  return Math.round(averageNumber(durations))
}

function averageNumber(values: Array<number | null>) {
  const valid = values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
  if (!valid.length) return 0
  return Number((valid.reduce((sum, value) => sum + value, 0) / valid.length).toFixed(2))
}

function formatBucket(date: Date, period: 'day' | 'week' | 'month') {
  if (period === 'month') return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  if (period === 'week') {
    const firstDay = new Date(date)
    firstDay.setDate(date.getDate() - date.getDay())
    return firstDay.toISOString().slice(0, 10)
  }
  return date.toISOString().slice(0, 10)
}
