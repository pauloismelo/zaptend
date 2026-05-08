import { Injectable, Logger, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateQuickReplyDto, FilterQuickRepliesDto, UpdateQuickReplyDto } from './dto/quick-reply.dto'

@Injectable()
export class QuickRepliesService {
  private readonly logger = new Logger(QuickRepliesService.name)

  constructor(private readonly prisma: PrismaService) {}

  findAll(tenantId: string, filters: FilterQuickRepliesDto) {
    return this.prisma.quickReply.findMany({
      where: {
        tenantId,
        ...(filters.category && { category: filters.category }),
        ...(filters.search && {
          OR: [
            { name: { contains: filters.search, mode: 'insensitive' } },
            { content: { contains: filters.search, mode: 'insensitive' } },
          ],
        }),
      },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    })
  }

  async findOne(id: string, tenantId: string) {
    const quickReply = await this.prisma.quickReply.findFirst({ where: { id, tenantId } })
    if (!quickReply) throw new NotFoundException('Resposta rápida não encontrada')
    return quickReply
  }

  create(tenantId: string, userId: string, dto: CreateQuickReplyDto) {
    this.logger.log(`Criando resposta rápida para tenant ${tenantId}`)
    return this.prisma.quickReply.create({
      data: { tenantId, createdBy: userId, isShared: true, ...dto },
    })
  }

  async update(id: string, tenantId: string, dto: UpdateQuickReplyDto) {
    await this.findOne(id, tenantId)
    return this.prisma.quickReply.update({ where: { id }, data: dto })
  }

  async remove(id: string, tenantId: string): Promise<void> {
    await this.findOne(id, tenantId)
    await this.prisma.quickReply.delete({ where: { id } })
  }
}

