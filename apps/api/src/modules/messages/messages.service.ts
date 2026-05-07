import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common'
import { InjectQueue } from '@nestjs/bullmq'
import { Queue } from 'bullmq'
import { PrismaService } from '../../prisma/prisma.service'
import { ListMessagesDto } from './dto/list-messages.dto'
import { SendMessageDto } from './dto/send-message.dto'
import { MessageResponseDto, PaginatedMessagesDto } from './dto/message-response.dto'
import { MessageTypeEnum } from './dto/message-type.enum'

const MEDIA_TYPES: MessageTypeEnum[] = [
  MessageTypeEnum.image,
  MessageTypeEnum.audio,
  MessageTypeEnum.video,
  MessageTypeEnum.document,
]

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name)

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('messages-outbound') private readonly outboundQueue: Queue,
  ) {}

  async findByConversation(
    conversationId: string,
    tenantId: string,
    dto: ListMessagesDto,
  ): Promise<PaginatedMessagesDto> {
    const limit = dto.limit ?? 30

    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, tenantId, deletedAt: null },
    })
    if (!conversation) {
      throw new NotFoundException('Conversa não encontrada')
    }

    const messages = await this.prisma.message.findMany({
      where: { conversationId, tenantId },
      include: {
        sentByUser: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(dto.cursor && { cursor: { id: dto.cursor }, skip: 1 }),
    })

    const hasMore = messages.length > limit
    if (hasMore) messages.pop()

    const nextCursor = hasMore ? messages[messages.length - 1].id : null

    return {
      data: messages as unknown as MessageResponseDto[],
      nextCursor,
      hasMore,
    }
  }

  async send(
    conversationId: string,
    tenantId: string,
    dto: SendMessageDto,
    actorId: string,
  ): Promise<MessageResponseDto> {
    if (dto.type === MessageTypeEnum.text && !dto.content) {
      throw new BadRequestException('Conteúdo é obrigatório para mensagens de texto')
    }
    if (MEDIA_TYPES.includes(dto.type) && !dto.mediaUrl) {
      throw new BadRequestException('mediaUrl é obrigatório para mensagens de mídia')
    }
    if (dto.type === MessageTypeEnum.template && !dto.templateName) {
      throw new BadRequestException('templateName é obrigatório para mensagens de template')
    }

    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, tenantId, deletedAt: null },
      select: { id: true, status: true, contact: { select: { phone: true } } },
    })
    if (!conversation) {
      throw new NotFoundException('Conversa não encontrada')
    }
    if (conversation.status === 'resolved' || conversation.status === 'spam') {
      throw new BadRequestException(
        'Não é possível enviar mensagens para conversas resolvidas ou marcadas como spam',
      )
    }

    const message = await this.prisma.message.create({
      data: {
        tenantId,
        conversationId,
        direction: 'outbound',
        type: dto.type,
        content: dto.content ?? null,
        mediaUrl: dto.mediaUrl ?? null,
        templateName: dto.templateName ?? null,
        status: 'pending',
        sentBy: actorId,
      },
      include: {
        sentByUser: { select: { id: true, name: true, avatarUrl: true } },
      },
    })

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    })

    await this.outboundQueue.add('send', {
      tenantId,
      conversationId,
      messageId: message.id,
      to: conversation.contact.phone,
      type: dto.type,
      content: dto.content ?? '',
      mediaUrl: dto.mediaUrl,
      templateName: dto.templateName,
      templateVariables: dto.templateVariables,
    })

    this.logger.log(`Mensagem ${message.id} enfileirada para envio na conversa ${conversationId}`)
    return message as unknown as MessageResponseDto
  }
}
