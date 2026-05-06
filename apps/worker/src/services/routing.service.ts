import { Injectable, Logger } from '@nestjs/common'
import { withTenant } from '@zaptend/database'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class RoutingService {
  private readonly logger = new Logger(RoutingService.name)

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Atribui a conversa ao agente online com menor carga de conversas ativas.
   * Se nenhum agente estiver online, a conversa permanece sem atribuição.
   */
  async assignConversation(tenantId: string, conversationId: string): Promise<void> {
    const onlineAgents = await this.prisma.user.findMany({
      where: withTenant(tenantId, {
        isOnline: true,
        isActive: true,
        deletedAt: null,
      }),
      select: { id: true },
    })

    if (!onlineAgents.length) {
      this.logger.log(
        `Nenhum agente online no tenant ${tenantId} — conversa ${conversationId} sem atribuição automática`,
      )
      return
    }

    const agentLoads = await Promise.all(
      onlineAgents.map(async (agent) => {
        const count = await this.prisma.conversation.count({
          where: withTenant(tenantId, {
            assignedUserId: agent.id,
            status: { in: ['open', 'attending', 'waiting_customer'] },
            deletedAt: null,
          }),
        })
        return { agentId: agent.id, count }
      }),
    )

    const leastLoaded = agentLoads.reduce((min, curr) => (curr.count < min.count ? curr : min))

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        assignedUserId: leastLoaded.agentId,
        status: 'attending',
        lastAssignedAt: new Date(),
      },
    })

    await this.prisma.conversationEvent.create({
      data: {
        conversationId,
        type: 'assigned',
        actorId: null,
        metadata: {
          assignedTo: leastLoaded.agentId,
          reason: 'auto_routing',
          activeConversations: leastLoaded.count,
        },
      },
    })

    this.logger.log(
      `Conversa ${conversationId} atribuída ao agente ${leastLoaded.agentId} ` +
        `(${leastLoaded.count} conversas ativas)`,
    )
  }
}
