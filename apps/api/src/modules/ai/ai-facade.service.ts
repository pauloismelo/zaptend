import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { AiService } from './ai.service'
import { AiSuggestDto } from './dto/ai.dto'

@Injectable()
export class AiFacadeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
  ) {}

  async getMood(conversationId: string, tenantId: string) {
    await this.assertConversation(conversationId, tenantId)
    return this.prisma.message.findMany({
      where: {
        tenantId,
        conversationId,
        direction: 'inbound',
        sentiment: { not: null },
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        sentiment: true,
        sentimentScore: true,
        content: true,
        createdAt: true,
      },
    })
  }

  async suggestReply(conversationId: string, tenantId: string, dto: AiSuggestDto) {
    const messages = await this.getConversationMessages(conversationId, tenantId)
    const suggestion = await this.ai.suggestReply(messages, dto.instruction)
    return { suggestion }
  }

  async summarize(conversationId: string, tenantId: string) {
    const messages = await this.getConversationMessages(conversationId, tenantId)
    const bullets = await this.ai.summarizeConversation(messages)
    return { bullets }
  }

  async detectIntent(conversationId: string, tenantId: string) {
    const messages = await this.getConversationMessages(conversationId, tenantId)
    const intent = await this.ai.detectIntent(messages)
    return { intent }
  }

  private async assertConversation(conversationId: string, tenantId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, tenantId, deletedAt: null },
      select: { id: true },
    })
    if (!conversation) throw new NotFoundException('Conversa não encontrada')
  }

  private async getConversationMessages(conversationId: string, tenantId: string) {
    await this.assertConversation(conversationId, tenantId)
    const messages = await this.prisma.message.findMany({
      where: { tenantId, conversationId },
      orderBy: { createdAt: 'asc' },
      take: 50,
      select: { direction: true, content: true },
    })

    return messages
      .filter((message) => message.content)
      .map((message) => `${message.direction === 'inbound' ? 'Cliente' : 'Atendente'}: ${message.content}`)
  }
}
