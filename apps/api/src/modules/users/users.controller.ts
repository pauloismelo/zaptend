import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
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
import { UsersService } from './users.service'
import { InviteUserDto } from './dto/invite-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { UpdateOnlineStatusDto } from './dto/update-online-status.dto'
import { FilterUsersDto } from './dto/filter-users.dto'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { Roles } from '../../common/decorators/roles.decorator'
import { JwtPayload } from '@zaptend/types'

@ApiTags('Usuários')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles('agent', 'supervisor', 'admin', 'owner')
  @ApiOperation({
    summary: 'Listar usuários do tenant',
    description: 'Retorna todos os usuários ativos do tenant, com filtros opcionais por role, isOnline e isActive.',
  })
  @ApiResponse({ status: 200, description: 'Lista de usuários retornada com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query() filters: FilterUsersDto,
  ) {
    return this.usersService.findAll(user.tenantId, filters)
  }

  @Post('invite')
  @Roles('admin', 'owner')
  @ApiOperation({
    summary: 'Convidar usuário por e-mail',
    description: 'Cria um usuário inativo com senha temporária aleatória e simula envio de convite.',
  })
  @ApiBody({ type: InviteUserDto })
  @ApiResponse({ status: 201, description: 'Usuário convidado com sucesso' })
  @ApiResponse({ status: 409, description: 'E-mail já cadastrado neste tenant' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  invite(
    @CurrentUser() user: JwtPayload,
    @Body() dto: InviteUserDto,
  ) {
    return this.usersService.invite(user.tenantId, dto)
  }

  @Patch(':id')
  @Roles('admin', 'owner')
  @ApiOperation({
    summary: 'Atualizar usuário',
    description: 'Atualiza nome, avatarUrl e/ou role do usuário. O usuário deve pertencer ao mesmo tenant.',
  })
  @ApiParam({ name: 'id', description: 'ID do usuário' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({ status: 200, description: 'Usuário atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.usersService.update(id, user.tenantId, dto)
  }

  @Delete(':id')
  @Roles('admin', 'owner')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Desativar usuário',
    description: 'Seta isActive=false no usuário. Não é permitido desativar o próprio usuário logado.',
  })
  @ApiParam({ name: 'id', description: 'ID do usuário' })
  @ApiResponse({ status: 200, description: 'Usuário desativado com sucesso' })
  @ApiResponse({ status: 403, description: 'Não é possível desativar o próprio usuário' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  remove(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.usersService.remove(id, user.tenantId, user.sub)
  }

  @Patch(':id/online-status')
  @Roles('agent', 'supervisor', 'admin', 'owner')
  @ApiOperation({
    summary: 'Atualizar status online do usuário',
    description: 'Atualiza isOnline e, quando verdadeiro, registra lastSeenAt com o momento atual.',
  })
  @ApiParam({ name: 'id', description: 'ID do usuário' })
  @ApiBody({ type: UpdateOnlineStatusDto })
  @ApiResponse({ status: 200, description: 'Status online atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  updateOnlineStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOnlineStatusDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.usersService.updateOnlineStatus(id, user.tenantId, dto)
  }
}
