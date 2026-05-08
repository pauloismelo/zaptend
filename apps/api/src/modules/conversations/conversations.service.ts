import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { ListConversationsDto } from './dto/list-conversations.dto'
import { UpdateConversationDto } from './dto/update-conversation.dto'
import { AssignConversationDto } from './dto/assign-conversation.dto'
import { TransferConversationDto } from './dto/transfer-conversation.dto'
import { CreateInternalNoteDto } from './dto/create-note.dto'
import {
  ConversationResponseDto,
  PaginatedConversationsDto,
} from './dto/conversation-response.dto'

@Injectable()
export class ConversationsService {
  private readonly logger = new Logger(ConversationsService.name)

  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, filters: ListConversationsDto): Promise<PaginatedConversationsDto> {
    const page = filters.page ?? 1
    const limit = filters.limit ?? 20
    const skip = (page - 1) * limit

    const tags = filters.tags
      ? Array.isArray(filters.tags)
        ? filters.tags
        : [filters.tags]
      : undefined

    const where = {
      tenantId,
      deletedAt: null,
      ...(filters.status && { status: filters.status }),
      ...(filters.assignedUserId && { assignedUserId: filters.assignedUserId }),
      ...(filters.departmentId && { departmentId: filters.departmentId }),
      ...(tags?.length && { tags: { hasSome: tags } }),
      ...(filters.search && {
        contact: {
          OR: [
            { name: { contains: filters.search, mode: 'insensitive' as const } },
            { phone: { contains: filters.search, mode: 'insensitive' as const } },
          ],
        },
      }),
    }

    const [data, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where,
        include: {
          contact: { select: { id: true, phone: true, name: true, avatarUrl: true, company: true, tags: true } },
          assignedUser: { select: { id: true, name: true, avatarUrl: true, email: true } },
        },
        orderBy: { lastMessageAt: 'desc' },
        take: limit,
        skip,
      }),
      this.prisma.conversation.count({ where }),
    ])

    return {
      data: data.map(this.toResponse),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  async findOne(id: string, tenantId: string): Promise<ConversationResponseDto> {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        contact: { select: { id: true, phone: true, name: true, avatarUrl: true, company: true, tags: true } },
        assignedUser: { select: { id: true, name: true, avatarUrl: true, email: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            direction: true,
            type: true,
            content: true,
            mediaUrl: true,
            status: true,
            createdAt: true,
          },
        },
      },
    })

    if (!conversation) {
      throw new NotFoundException('Conversa não encontrada')
    }

    return this.toResponse(conversation)
  }

  async update(id: string, tenantId: string, dto: UpdateConversationDto): Promise<ConversationResponseDto> {
    const current = await this.findOne(id, tenantId)

    const data: Record<string, unknown> = {}
    if (dto.status !== undefined) data.status = dto.status
    if (dto.assignedUserId !== undefined) data.assignedUserId = dto.assignedUserId
    if (dto.tags !== undefined) data.tags = dto.tags
    if (dto.pipelineStage !== undefined) data.pipelineStage = dto.pipelineStage
    if (dto.pipelineValue !== undefined) data.pipelineValue = dto.pipelineValue

    const events = []
    if (dto.status !== undefined && dto.status !== current.status) {
      events.push(this.prisma.conversationEvent.create({
        data: { conversationId: id, type: 'status_changed', metadata: { from: current.status, to: dto.status } },
      }))
    }
    if (dto.tags?.length) {
      const previousTags = new Set((current.tags ?? []) as string[])
      for (const tag of dto.tags) {
        if (!previousTags.has(tag)) {
          events.push(this.prisma.conversationEvent.create({
            data: { conversationId: id, type: 'tag_added', metadata: { tag } },
          }))
        }
      }
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.conversation.update({
        where: { id },
        data,
        include: {
          contact: { select: { id: true, phone: true, name: true, avatarUrl: true, company: true, tags: true } },
          assignedUser: { select: { id: true, name: true, avatarUrl: true, email: true } },
        },
      }),
      ...events,
    ])

    this.logger.log(`Conversa ${id} atualizada pelo tenant ${tenantId}`)
    return this.toResponse(updated)
  }

  async createNote(id: string, tenantId: string, userId: string, dto: CreateInternalNoteDto) {
    await this.findOne(id, tenantId)
    return this.prisma.internalNote.create({
      data: { conversationId: id, userId, content: dto.content },
      include: { user: { select: { id: true, name: true, email: true } } },
    })
  }

  async listNotes(id: string, tenantId: string) {
    await this.findOne(id, tenantId)
    return this.prisma.internalNote.findMany({
      where: { conversationId: id },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    })
  }

  async listEvents(id: string, tenantId: string) {
    await this.findOne(id, tenantId)
    return this.prisma.conversationEvent.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: 'desc' },
    })
  }

  async assign(
    id: string,
    tenantId: string,
    dto: AssignConversationDto,
    actorId: string,
  ): Promise<ConversationResponseDto> {
    await this.findOne(id, tenantId)

    const agentExists = await this.prisma.user.findFirst({
      where: { id: dto.userId, tenantId, isActive: true, deletedAt: null },
    })
    if (!agentExists) {
      throw new NotFoundException('Agente não encontrado ou inativo')
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.conversation.update({
        where: { id },
        data: {
          assignedUserId: dto.userId,
          lastAssignedAt: new Date(),
          status: 'attending',
        },
        include: {
          contact: { select: { id: true, phone: true, name: true, avatarUrl: true, company: true, tags: true } },
          assignedUser: { select: { id: true, name: true, avatarUrl: true, email: true } },
        },
      }),
      this.prisma.conversationEvent.create({
        data: {
          conversationId: id,
          type: 'assigned',
          actorId,
          metadata: { assignedTo: dto.userId },
        },
      }),
    ])

    this.logger.log(`Conversa ${id} atribuída ao agente ${dto.userId} pelo ator ${actorId}`)
    return this.toResponse(updated)
  }

  async transfer(
    id: string,
    tenantId: string,
    dto: TransferConversationDto,
    actorId: string,
  ): Promise<ConversationResponseDto> {
    if (!dto.userId && !dto.departmentId) {
      throw new BadRequestException('Informe ao menos um destino: userId ou departmentId')
    }

    await this.findOne(id, tenantId)

    if (dto.userId) {
      const agentExists = await this.prisma.user.findFirst({
        where: { id: dto.userId, tenantId, isActive: true, deletedAt: null },
      })
      if (!agentExists) {
        throw new NotFoundException('Agente de destino não encontrado ou inativo')
      }
    }

    if (dto.departmentId) {
      const deptExists = await this.prisma.department.findFirst({
        where: { id: dto.departmentId, tenantId },
      })
      if (!deptExists) {
        throw new NotFoundException('Departamento de destino não encontrado')
      }
    }

    const updateData: Record<string, unknown> = {}
    if (dto.userId !== undefined) {
      updateData.assignedUserId = dto.userId
      updateData.lastAssignedAt = new Date()
    }
    if (dto.departmentId !== undefined) {
      updateData.departmentId = dto.departmentId
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.conversation.update({
        where: { id },
        data: updateData,
        include: {
          contact: { select: { id: true, phone: true, name: true, avatarUrl: true, company: true, tags: true } },
          assignedUser: { select: { id: true, name: true, avatarUrl: true, email: true } },
        },
      }),
      this.prisma.internalNote.create({
        data: {
          conversationId: id,
          userId: actorId,
          content: dto.note,
        },
      }),
      this.prisma.conversationEvent.create({
        data: {
          conversationId: id,
          type: 'transferred',
          actorId,
          metadata: {
            transferredTo: dto.userId ?? null,
            departmentId: dto.departmentId ?? null,
            note: dto.note,
          },
        },
      }),
    ])

    this.logger.log(`Conversa ${id} transferida pelo ator ${actorId}`)
    return this.toResponse(updated)
  }

  async resolve(id: string, tenantId: string, actorId: string): Promise<ConversationResponseDto> {
    const current = await this.findOne(id, tenantId)

    const [updated] = await this.prisma.$transaction([
      this.prisma.conversation.update({
        where: { id },
        data: {
          status: 'resolved',
          resolvedAt: new Date(),
        },
        include: {
          contact: { select: { id: true, phone: true, name: true, avatarUrl: true, company: true, tags: true } },
          assignedUser: { select: { id: true, name: true, avatarUrl: true, email: true } },
        },
      }),
      this.prisma.conversationEvent.create({
        data: {
          conversationId: id,
          type: 'status_changed',
          actorId,
          metadata: { from: current.status, to: 'resolved' },
        },
      }),
    ])

    this.logger.log(`Conversa ${id} resolvida pelo ator ${actorId}`)
    return this.toResponse(updated)
  }

  private toResponse(conversation: Record<string, unknown>): ConversationResponseDto {
    return conversation as unknown as ConversationResponseDto
  }
}
