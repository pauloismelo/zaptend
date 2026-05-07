import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger'
import { DepartmentsService } from './departments.service'
import { CreateDepartmentDto } from './dto/create-department.dto'
import { UpdateDepartmentDto } from './dto/update-department.dto'
import { AssignAgentsDto } from './dto/assign-agents.dto'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { Roles } from '../../common/decorators/roles.decorator'
import { JwtPayload } from '@zaptend/types'

@ApiTags('Departamentos')
@ApiBearerAuth()
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Get()
  @Roles('agent', 'supervisor', 'admin', 'owner')
  @ApiOperation({
    summary: 'Listar departamentos do tenant',
    description: 'Retorna todos os departamentos do tenant com seus agentes associados.',
  })
  @ApiResponse({ status: 200, description: 'Lista de departamentos retornada com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  findAll(@CurrentUser() user: JwtPayload) {
    return this.departmentsService.findAll(user.tenantId)
  }

  @Post()
  @Roles('admin', 'owner')
  @ApiOperation({
    summary: 'Criar departamento',
    description: 'Cria um novo departamento no tenant. Nome deve ser único por tenant.',
  })
  @ApiBody({ type: CreateDepartmentDto })
  @ApiResponse({ status: 201, description: 'Departamento criado com sucesso' })
  @ApiResponse({ status: 409, description: 'Já existe um departamento com este nome' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  create(
    @Body() dto: CreateDepartmentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.departmentsService.create(user.tenantId, dto)
  }

  @Patch(':id')
  @Roles('admin', 'owner')
  @ApiOperation({
    summary: 'Atualizar departamento',
    description: 'Atualiza nome, descrição, cor e/ou status ativo do departamento.',
  })
  @ApiParam({ name: 'id', description: 'ID do departamento' })
  @ApiBody({ type: UpdateDepartmentDto })
  @ApiResponse({ status: 200, description: 'Departamento atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Departamento não encontrado' })
  @ApiResponse({ status: 409, description: 'Já existe um departamento com este nome' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDepartmentDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.departmentsService.update(id, user.tenantId, dto)
  }

  @Delete(':id')
  @Roles('admin', 'owner')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Desativar departamento',
    description: 'Realiza soft delete via isActive=false. O departamento não é removido do banco.',
  })
  @ApiParam({ name: 'id', description: 'ID do departamento' })
  @ApiResponse({ status: 200, description: 'Departamento desativado com sucesso' })
  @ApiResponse({ status: 404, description: 'Departamento não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  remove(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.departmentsService.remove(id, user.tenantId)
  }

  @Post(':id/agents')
  @Roles('admin', 'owner')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Associar agentes ao departamento',
    description: 'Conecta múltiplos agentes ao departamento via operação connect em massa.',
  })
  @ApiParam({ name: 'id', description: 'ID do departamento' })
  @ApiBody({ type: AssignAgentsDto })
  @ApiResponse({ status: 200, description: 'Agentes associados com sucesso' })
  @ApiResponse({ status: 404, description: 'Departamento não encontrado' })
  @ApiResponse({ status: 400, description: 'Um ou mais usuários não encontrados no tenant' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  assignAgents(
    @Param('id') id: string,
    @Body() dto: AssignAgentsDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.departmentsService.assignAgents(id, user.tenantId, dto)
  }

  @Delete(':id/agents/:userId')
  @Roles('admin', 'owner')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Remover agente do departamento',
    description: 'Desconecta um agente específico do departamento.',
  })
  @ApiParam({ name: 'id', description: 'ID do departamento' })
  @ApiParam({ name: 'userId', description: 'ID do agente a remover' })
  @ApiResponse({ status: 200, description: 'Agente removido do departamento com sucesso' })
  @ApiResponse({ status: 404, description: 'Departamento ou agente não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  removeAgent(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.departmentsService.removeAgent(id, userId, user.tenantId)
  }
}
