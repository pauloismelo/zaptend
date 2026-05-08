import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { SuperAdminTenantsQueryDto, UpdateTenantStatusDto } from './dto/super-admin.dto'
import { SuperAdminGuard } from './guards/super-admin.guard'
import { SuperAdminService } from './super-admin.service'

@ApiTags('Super Admin')
@ApiBearerAuth()
@UseGuards(SuperAdminGuard)
@Controller('admin')
export class SuperAdminController {
  constructor(private readonly service: SuperAdminService) {}

  @Get('tenants')
  @ApiOperation({ summary: 'Listar tenants com filtros e paginação' })
  tenants(@Query() query: SuperAdminTenantsQueryDto) {
    return this.service.tenants(query)
  }

  @Get('tenants/:id')
  @ApiOperation({ summary: 'Detalhes do tenant, uso e subscription' })
  @ApiParam({ name: 'id' })
  tenant(@Param('id') id: string) {
    return this.service.tenant(id)
  }

  @Patch('tenants/:id/status')
  @ApiOperation({ summary: 'Ativar ou suspender tenant' })
  @ApiParam({ name: 'id' })
  @ApiBody({ type: UpdateTenantStatusDto })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateTenantStatusDto) {
    return this.service.updateStatus(id, dto)
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Métricas globais do SaaS' })
  metrics() {
    return this.service.metrics()
  }

  @Get('usage')
  @ApiOperation({ summary: 'Uso por tenant no mês' })
  usage(@Query('month') month?: string) {
    return this.service.usage(month)
  }
}
