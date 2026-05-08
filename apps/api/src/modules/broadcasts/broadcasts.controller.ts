import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger'
import { JwtPayload } from '@zaptend/types'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { Roles } from '../../common/decorators/roles.decorator'
import { RequireFeature } from '../billing/decorators/require-feature.decorator'
import { PlanGuard } from '../billing/guards/plan.guard'
import { BroadcastsService } from './broadcasts.service'
import { CreateBroadcastDto } from './dto/broadcast.dto'

@ApiTags('Broadcasts')
@ApiBearerAuth()
@UseGuards(PlanGuard)
@RequireFeature('broadcasts')
@Controller('broadcasts')
export class BroadcastsController {
  constructor(private readonly service: BroadcastsService) {}

  @Get()
  @Roles('admin', 'owner', 'supervisor')
  @ApiOperation({ summary: 'Listar broadcasts' })
  findAll(@CurrentUser() user: JwtPayload) {
    return this.service.findAll(user.tenantId)
  }

  @Post()
  @Roles('admin', 'owner', 'supervisor')
  @ApiOperation({ summary: 'Criar broadcast' })
  @ApiBody({ type: CreateBroadcastDto })
  @ApiResponse({ status: 201, description: 'Broadcast criado' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateBroadcastDto) {
    return this.service.create(user.tenantId, user.sub, dto)
  }

  @Post(':id/start')
  @Roles('admin', 'owner', 'supervisor')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar envio do broadcast' })
  @ApiParam({ name: 'id' })
  start(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.start(id, user.tenantId)
  }
}

