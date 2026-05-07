import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateDepartmentDto } from './dto/create-department.dto'
import { UpdateDepartmentDto } from './dto/update-department.dto'
import { AssignAgentsDto } from './dto/assign-agents.dto'

@Injectable()
export class DepartmentsService {
  private readonly logger = new Logger(DepartmentsService.name)

  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string) {
    const departments = await this.prisma.department.findMany({
      where: { tenantId },
      include: {
        agents: {
          select: { id: true, name: true, avatarUrl: true, email: true, role: true, isOnline: true },
        },
      },
      orderBy: { name: 'asc' },
    })

    this.logger.log(`Listados ${departments.length} departamentos para o tenant ${tenantId}`)
    return departments
  }

  async create(tenantId: string, dto: CreateDepartmentDto) {
    const existing = await this.prisma.department.findFirst({
      where: { tenantId, name: dto.name },
    })
    if (existing) {
      throw new ConflictException('Já existe um departamento com este nome neste tenant')
    }

    const department = await this.prisma.department.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description,
        color: dto.color ?? '#00B37E',
      },
      include: {
        agents: {
          select: { id: true, name: true, avatarUrl: true, email: true, role: true, isOnline: true },
        },
      },
    })

    this.logger.log(`Departamento "${dto.name}" criado no tenant ${tenantId}`)
    return department
  }

  async update(id: string, tenantId: string, dto: UpdateDepartmentDto) {
    const department = await this.prisma.department.findFirst({
      where: { id, tenantId },
    })
    if (!department) {
      throw new NotFoundException('Departamento não encontrado')
    }

    if (dto.name && dto.name !== department.name) {
      const duplicate = await this.prisma.department.findFirst({
        where: { tenantId, name: dto.name },
      })
      if (duplicate) {
        throw new ConflictException('Já existe um departamento com este nome neste tenant')
      }
    }

    const updated = await this.prisma.department.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.color !== undefined && { color: dto.color }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      include: {
        agents: {
          select: { id: true, name: true, avatarUrl: true, email: true, role: true, isOnline: true },
        },
      },
    })

    this.logger.log(`Departamento ${id} atualizado no tenant ${tenantId}`)
    return updated
  }

  async remove(id: string, tenantId: string) {
    const department = await this.prisma.department.findFirst({
      where: { id, tenantId },
    })
    if (!department) {
      throw new NotFoundException('Departamento não encontrado')
    }

    const updated = await this.prisma.department.update({
      where: { id },
      data: { isActive: false },
      select: {
        id: true,
        name: true,
        isActive: true,
        updatedAt: true,
      },
    })

    this.logger.log(`Departamento ${id} desativado no tenant ${tenantId}`)
    return updated
  }

  async assignAgents(id: string, tenantId: string, dto: AssignAgentsDto) {
    const department = await this.prisma.department.findFirst({
      where: { id, tenantId },
    })
    if (!department) {
      throw new NotFoundException('Departamento não encontrado')
    }

    const users = await this.prisma.user.findMany({
      where: { id: { in: dto.userIds }, tenantId, deletedAt: null },
      select: { id: true },
    })

    if (users.length !== dto.userIds.length) {
      throw new BadRequestException(
        'Um ou mais usuários não foram encontrados ou não pertencem a este tenant',
      )
    }

    const updated = await this.prisma.department.update({
      where: { id },
      data: {
        agents: {
          connect: dto.userIds.map((userId) => ({ id: userId })),
        },
      },
      include: {
        agents: {
          select: { id: true, name: true, avatarUrl: true, email: true, role: true, isOnline: true },
        },
      },
    })

    this.logger.log(
      `${dto.userIds.length} agente(s) associado(s) ao departamento ${id} no tenant ${tenantId}`,
    )
    return updated
  }

  async removeAgent(id: string, userId: string, tenantId: string) {
    const department = await this.prisma.department.findFirst({
      where: { id, tenantId },
    })
    if (!department) {
      throw new NotFoundException('Departamento não encontrado')
    }

    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId, deletedAt: null },
    })
    if (!user) {
      throw new NotFoundException('Agente não encontrado neste tenant')
    }

    const updated = await this.prisma.department.update({
      where: { id },
      data: {
        agents: {
          disconnect: { id: userId },
        },
      },
      include: {
        agents: {
          select: { id: true, name: true, avatarUrl: true, email: true, role: true, isOnline: true },
        },
      },
    })

    this.logger.log(`Agente ${userId} removido do departamento ${id} no tenant ${tenantId}`)
    return updated
  }
}
