import { Controller, Get, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { JwtPayload } from '@zaptend/types'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { Roles } from '../../common/decorators/roles.decorator'
import {
  AgentPerformanceDto,
  HeatmapItemDto,
  ReportLimitQueryDto,
  ReportPeriodDto,
  ReportsOverviewDto,
  ReportVolumeQueryDto,
  VolumeItemDto,
} from './dto/reports.dto'
import { ReportsService } from './reports.service'

@ApiTags('Relatórios')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get('overview')
  @Roles('agent', 'supervisor', 'admin', 'owner')
  @ApiOperation({ summary: 'Resumo de métricas operacionais' })
  @ApiResponse({ status: 200, type: ReportsOverviewDto })
  overview(@CurrentUser() user: JwtPayload, @Query() query: ReportPeriodDto) {
    return this.service.overview(user.tenantId, query)
  }

  @Get('volume')
  @Roles('supervisor', 'admin', 'owner')
  @ApiOperation({ summary: 'Volume por período, departamento e agente' })
  @ApiResponse({ status: 200, type: [VolumeItemDto] })
  volume(@CurrentUser() user: JwtPayload, @Query() query: ReportVolumeQueryDto) {
    return this.service.volume(user.tenantId, query)
  }

  @Get('agents')
  @Roles('supervisor', 'admin', 'owner')
  @ApiOperation({ summary: 'Performance por agente' })
  @ApiResponse({ status: 200, type: [AgentPerformanceDto] })
  agents(@CurrentUser() user: JwtPayload, @Query() query: ReportPeriodDto) {
    return this.service.agents(user.tenantId, query)
  }

  @Get('heatmap')
  @Roles('supervisor', 'admin', 'owner')
  @ApiOperation({ summary: 'Mapa de calor de volume por hora e dia' })
  @ApiResponse({ status: 200, type: [HeatmapItemDto] })
  heatmap(@CurrentUser() user: JwtPayload, @Query() query: ReportPeriodDto) {
    return this.service.heatmap(user.tenantId, query)
  }

  @Get('last-24h')
  @Roles('agent', 'supervisor', 'admin', 'owner')
  @ApiOperation({ summary: 'Volume das últimas horas para dashboard' })
  lastHours(@CurrentUser() user: JwtPayload, @Query() query: ReportLimitQueryDto) {
    return this.service.lastHoursVolume(user.tenantId, query)
  }

  @Get('unassigned')
  @Roles('agent', 'supervisor', 'admin', 'owner')
  @ApiOperation({ summary: 'Conversas aguardando atribuição' })
  unassigned(@CurrentUser() user: JwtPayload) {
    return this.service.unassigned(user.tenantId)
  }
}
