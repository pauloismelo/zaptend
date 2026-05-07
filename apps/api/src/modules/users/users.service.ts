import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common'
import * as bcrypt from 'bcrypt'
import * as crypto from 'crypto'
import { PrismaService } from '../../prisma/prisma.service'
import { InviteUserDto } from './dto/invite-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { UpdateOnlineStatusDto } from './dto/update-online-status.dto'
import { FilterUsersDto } from './dto/filter-users.dto'

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name)

  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, filters: FilterUsersDto) {
    const isActive = filters.isActive !== undefined ? filters.isActive : true

    const where = {
      tenantId,
      deletedAt: null,
      isActive,
      ...(filters.role !== undefined && { role: filters.role }),
      ...(filters.isOnline !== undefined && { isOnline: filters.isOnline }),
    }

    const users = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        tenantId: true,
        email: true,
        name: true,
        avatarUrl: true,
        role: true,
        isOnline: true,
        lastSeenAt: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        departments: { select: { id: true, name: true, color: true } },
      },
      orderBy: { name: 'asc' },
    })

    this.logger.log(`Listados ${users.length} usuários para o tenant ${tenantId}`)
    return users
  }

  async invite(tenantId: string, dto: InviteUserDto) {
    const existing = await this.prisma.user.findFirst({
      where: { tenantId, email: dto.email, deletedAt: null },
    })
    if (existing) {
      throw new ConflictException('Já existe um usuário com este e-mail neste tenant')
    }

    const temporaryPassword = crypto.randomBytes(4).toString('hex') // 8 chars hex
    const passwordHash = await bcrypt.hash(temporaryPassword, 12)

    const user = await this.prisma.user.create({
      data: {
        tenantId,
        email: dto.email,
        name: dto.name,
        role: dto.role,
        passwordHash,
        isActive: false,
      },
      select: {
        id: true,
        tenantId: true,
        email: true,
        name: true,
        avatarUrl: true,
        role: true,
        isOnline: true,
        isActive: true,
        createdAt: true,
      },
    })

    this.logger.log(
      `Convite enviado para ${dto.email} no tenant ${tenantId} — senha temporária gerada (simulado)`,
    )

    return { ...user, temporaryPassword }
  }

  async update(id: string, tenantId: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId, deletedAt: null },
    })
    if (!user) {
      throw new NotFoundException('Usuário não encontrado')
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
        ...(dto.role !== undefined && { role: dto.role }),
      },
      select: {
        id: true,
        tenantId: true,
        email: true,
        name: true,
        avatarUrl: true,
        role: true,
        isOnline: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    this.logger.log(`Usuário ${id} atualizado no tenant ${tenantId}`)
    return updated
  }

  async remove(id: string, tenantId: string, actorId: string) {
    if (id === actorId) {
      throw new ForbiddenException('Não é possível desativar o próprio usuário')
    }

    const user = await this.prisma.user.findFirst({
      where: { id, tenantId, deletedAt: null },
    })
    if (!user) {
      throw new NotFoundException('Usuário não encontrado')
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        updatedAt: true,
      },
    })

    this.logger.log(`Usuário ${id} desativado no tenant ${tenantId} pelo ator ${actorId}`)
    return updated
  }

  async updateOnlineStatus(id: string, tenantId: string, dto: UpdateOnlineStatusDto) {
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId, deletedAt: null },
    })
    if (!user) {
      throw new NotFoundException('Usuário não encontrado')
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        isOnline: dto.isOnline,
        ...(dto.isOnline && { lastSeenAt: new Date() }),
      },
      select: {
        id: true,
        isOnline: true,
        lastSeenAt: true,
        updatedAt: true,
      },
    })

    this.logger.log(
      `Status online do usuário ${id} atualizado para ${dto.isOnline} no tenant ${tenantId}`,
    )
    return updated
  }
}
