import { Injectable, Logger } from '@nestjs/common'
import { Prisma } from '@zaptend/database'
import { PrismaService } from '../prisma/prisma.service'

type AutomationTrigger = 'new_conversation' | 'keyword' | 'schedule' | 'field_changed'

interface AutomationContext {
  conversationId?: string
  messageText?: string
  contactId?: string
  [key: string]: unknown
}

interface AutomationNode {
  id?: string
  type?: 'message' | 'condition' | 'delay' | 'assign' | 'tag' | 'webhook' | 'end'
  config?: Record<string, unknown>
}

@Injectable()
export class AutomationEngineService {
  private readonly logger = new Logger(AutomationEngineService.name)

  constructor(private readonly prisma: PrismaService) {}

  async handleTrigger(tenantId: string, trigger: AutomationTrigger, context: AutomationContext) {
    const flows = await this.prisma.automationFlow.findMany({
      where: { tenantId, trigger, isActive: true },
      orderBy: { updatedAt: 'asc' },
    })

    for (const flow of flows) {
      await this.executeNodes(tenantId, flow.id, flow.nodes as AutomationNode[], context)
    }
  }

  private async executeNodes(
    tenantId: string,
    flowId: string,
    nodes: AutomationNode[],
    context: AutomationContext,
  ) {
    for (const node of nodes) {
      const shouldContinue = await this.executeNode(tenantId, flowId, node, context)
      if (!shouldContinue) break
    }
  }

  private async executeNode(
    tenantId: string,
    flowId: string,
    node: AutomationNode,
    context: AutomationContext,
  ) {
    switch (node.type) {
      case 'message':
        await this.registerEvent(context.conversationId, 'automation_message', {
          flowId,
          nodeId: node.id,
          text: node.config?.text,
        })
        return true
      case 'condition':
        return this.matchesCondition(node.config ?? {}, context)
      case 'delay':
        await this.wait(Math.min(Number(node.config?.seconds ?? 0) * 1000, 5000))
        return true
      case 'assign':
        await this.updateConversation(context.conversationId, {
          assignedUserId: String(node.config?.userId ?? ''),
          status: 'attending',
        })
        return true
      case 'tag':
        await this.addTag(context.conversationId, String(node.config?.tag ?? ''))
        return true
      case 'webhook':
        await this.callWebhook(node.config?.url, { tenantId, flowId, nodeId: node.id, context })
        return true
      case 'end':
        return false
      default:
        this.logger.warn(`Nó de automação sem tipo suportado: ${node.type ?? 'unknown'}`)
        return true
    }
  }

  private matchesCondition(config: Record<string, unknown>, context: AutomationContext) {
    const value = String(config.value ?? '').toLowerCase()
    const source = String(context.messageText ?? '').toLowerCase()
    if (!value) return true

    if (config.operator === 'equals') return source === value
    return source.includes(value)
  }

  private async registerEvent(conversationId: string | undefined, type: string, metadata: Record<string, unknown>) {
    if (!conversationId) return
    await this.prisma.conversationEvent.create({
      data: { conversationId, type, metadata: metadata as Prisma.InputJsonValue },
    })
  }

  private async updateConversation(conversationId: string | undefined, data: Record<string, unknown>) {
    if (!conversationId || !data.assignedUserId) return
    await this.prisma.conversation.update({ where: { id: conversationId }, data })
  }

  private async addTag(conversationId: string | undefined, tag: string) {
    if (!conversationId || !tag) return
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { tags: true },
    })
    if (!conversation || conversation.tags.includes(tag)) return

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { tags: [...conversation.tags, tag] },
    })
    await this.registerEvent(conversationId, 'tag_added', { tag })
  }

  private async callWebhook(url: unknown, payload: Record<string, unknown>) {
    if (typeof url !== 'string' || !url.startsWith('http')) return
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  }

  private wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
