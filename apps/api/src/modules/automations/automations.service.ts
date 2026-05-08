import { Injectable, NotFoundException } from '@nestjs/common'
import { Prisma } from '@zaptend/database'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateAutomationFlowDto, UpdateAutomationFlowDto } from './dto/automation-flow.dto'

@Injectable()
export class AutomationsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(tenantId: string) {
    return this.prisma.automationFlow.findMany({ where: { tenantId }, orderBy: { updatedAt: 'desc' } })
  }

  async findOne(id: string, tenantId: string) {
    const flow = await this.prisma.automationFlow.findFirst({ where: { id, tenantId } })
    if (!flow) throw new NotFoundException('Fluxo de automação não encontrado')
    return flow
  }

  create(tenantId: string, dto: CreateAutomationFlowDto) {
    const data: Prisma.AutomationFlowUncheckedCreateInput = {
      tenantId,
      name: dto.name,
      description: dto.description,
      trigger: dto.trigger,
      triggerConfig: dto.triggerConfig as Prisma.InputJsonValue | undefined,
      nodes: dto.nodes as Prisma.InputJsonValue,
      isActive: dto.isActive ?? false,
    }

    return this.prisma.automationFlow.create({
      data,
    })
  }

  async update(id: string, tenantId: string, dto: UpdateAutomationFlowDto) {
    await this.findOne(id, tenantId)
    const data: Prisma.AutomationFlowUncheckedUpdateInput = {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.trigger !== undefined && { trigger: dto.trigger }),
      ...(dto.triggerConfig !== undefined && { triggerConfig: dto.triggerConfig as Prisma.InputJsonValue }),
      ...(dto.nodes !== undefined && {
        nodes: dto.nodes as Prisma.InputJsonValue,
        version: { increment: 1 },
      }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
    }

    return this.prisma.automationFlow.update({
      where: { id },
      data,
    })
  }

  async remove(id: string, tenantId: string): Promise<void> {
    await this.findOne(id, tenantId)
    await this.prisma.automationFlow.delete({ where: { id } })
  }
}
