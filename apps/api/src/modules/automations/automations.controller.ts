import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { JwtPayload } from '@zaptend/types'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { Roles } from '../../common/decorators/roles.decorator'
import { RequireFeature } from '../billing/decorators/require-feature.decorator'
import { PlanGuard } from '../billing/guards/plan.guard'
import { AutomationsService } from './automations.service'
import { CreateAutomationFlowDto, UpdateAutomationFlowDto } from './dto/automation-flow.dto'

@ApiTags('Automações')
@ApiBearerAuth()
@UseGuards(PlanGuard)
@RequireFeature('flowBuilder')
@Controller('automations')
export class AutomationsController {
  constructor(private readonly service: AutomationsService) {}

  @Get()
  @Roles('admin', 'owner', 'supervisor')
  @ApiOperation({ summary: 'Listar fluxos de automação' })
  findAll(@CurrentUser() user: JwtPayload) {
    return this.service.findAll(user.tenantId)
  }

  @Get(':id')
  @Roles('admin', 'owner', 'supervisor')
  @ApiOperation({ summary: 'Buscar fluxo de automação' })
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.findOne(id, user.tenantId)
  }

  @Post()
  @Roles('admin', 'owner', 'supervisor')
  @ApiOperation({ summary: 'Criar fluxo de automação' })
  @ApiBody({ type: CreateAutomationFlowDto })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateAutomationFlowDto) {
    return this.service.create(user.tenantId, dto)
  }

  @Patch(':id')
  @Roles('admin', 'owner', 'supervisor')
  @ApiOperation({ summary: 'Atualizar fluxo de automação' })
  @ApiBody({ type: UpdateAutomationFlowDto })
  update(@Param('id') id: string, @CurrentUser() user: JwtPayload, @Body() dto: UpdateAutomationFlowDto) {
    return this.service.update(id, user.tenantId, dto)
  }

  @Delete(':id')
  @Roles('admin', 'owner', 'supervisor')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover fluxo de automação' })
  async remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.service.remove(id, user.tenantId)
  }
}

