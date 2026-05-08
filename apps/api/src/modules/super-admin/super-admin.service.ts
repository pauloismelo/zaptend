import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { BILLING_PLANS } from '../billing/billing.constants'
import { SuperAdminTenantsQueryDto, UpdateTenantStatusDto } from './dto/super-admin.dto'

@Injectable()
export class SuperAdminService {
  constructor(private readonly prisma: PrismaService) {}

  async tenants(query: SuperAdminTenantsQueryDto) {
    const page = query.page ?? 1
    const limit = query.limit ?? 20
    const where = {
      deletedAt: null,
      ...(query.status && { status: query.status }),
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' as const } },
          { slug: { contains: query.search, mode: 'insensitive' as const } },
          { email: { contains: query.search, mode: 'insensitive' as const } },
        ],
      }),
    }

    const [data, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        include: {
          subscription: true,
          _count: { select: { users: true, conversations: true, contacts: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.tenant.count({ where }),
    ])

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async tenant(id: string) {
    const tenant = await this.prisma.tenant.findFirst({
      where: { id, deletedAt: null },
      include: {
        subscription: true,
        usageRecords: { orderBy: { month: 'desc' }, take: 6 },
        _count: { select: { users: true, conversations: true, contacts: true, messages: true } },
      },
    })
    if (!tenant) throw new NotFoundException('Tenant não encontrado')
    return tenant
  }

  async updateStatus(id: string, dto: UpdateTenantStatusDto) {
    await this.tenant(id)
    return this.prisma.tenant.update({ where: { id }, data: { status: dto.status } })
  }

  async metrics() {
    const [subscriptions, activeTenants, totalTenants, recentTenants] = await Promise.all([
      this.prisma.subscription.findMany({ where: { status: { in: ['active', 'trialing'] } }, select: { plan: true } }),
      this.prisma.tenant.count({ where: { status: 'active', deletedAt: null } }),
      this.prisma.tenant.count({ where: { deletedAt: null } }),
      this.prisma.tenant.count({
        where: {
          deletedAt: null,
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      }),
    ])

    const mrr = subscriptions.reduce((sum, subscription) => {
      if (subscription.plan === 'starter' || subscription.plan === 'growth' || subscription.plan === 'pro') {
        return sum + BILLING_PLANS[subscription.plan].amount
      }
      return sum
    }, 0)

    return {
      mrr,
      activeTenants,
      totalTenants,
      growthLast30Days: recentTenants,
    }
  }

  async usage(month = new Date().toISOString().slice(0, 7)) {
    return this.prisma.usageRecord.findMany({
      where: { month },
      include: { tenant: { select: { id: true, name: true, slug: true, status: true } } },
      orderBy: { conversations: 'desc' },
    })
  }
}
