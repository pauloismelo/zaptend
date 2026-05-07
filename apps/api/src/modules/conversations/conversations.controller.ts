import {
  Controller,
  Get,
  Patch,
  Post,
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
  ApiQuery,
} from '@nestjs/swagger'
import { ConversationStatusEnum } from './dto/conversation-status.enum'
import { ConversationsService } from './conversations.service'
import { ListConversationsDto } from './dto/list-conversations.dto'
import { UpdateConversationDto } from './dto/update-conversation.dto'
import { AssignConversationDto } from './dto/assign-conversation.dto'
import { TransferConversationDto } from './dto/transfer-conversation.dto'
import {
  ConversationResponseDto,
  PaginatedConversationsDto,
} from './dto/conversation-response.dto'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { Roles } from '../../common/decorators/roles.decorator'
import { JwtPayload } from '@zaptend/types'

@ApiTags('Conversas')
@ApiBearerAuth()
@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Get()
  @Roles('agent', 'supervisor', 'admin', 'owner')
  @ApiOperation({
    summary: 'Listar conversas',
    description: 'Retorna conversas do tenant paginadas, com filtros opcionais.',
  })
  @ApiQuery({ name: 'status', enum: ConversationStatusEnum, required: false })
  @ApiQuery({ name: 'assignedUserId', type: String, required: false })
  @ApiQuery({ name: 'departmentId', type: String, required: false })
  @ApiQuery({ name: 'tags', type: [String], required: false })
  @ApiQuery({ name: 'search', type: String, required: false })
  @ApiQuery({ name: 'page', type: Number, required: false, example: 1 })
  @ApiQuery({ name: 'limit', type: Number, required: false, example: 20 })
  @ApiResponse({ status: 200, description: 'Lista paginada de conversas', type: PaginatedConversationsDto })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListConversationsDto,
  ): Promise<PaginatedConversationsDto> {
    return this.conversationsService.findAll(user.tenantId, query)
  }

  @Get(':id')
  @Roles('agent', 'supervisor', 'admin', 'owner')
  @ApiOperation({
    summary: 'Buscar conversa por ID',
    description: 'Retorna a conversa com mensagens e dados do contato.',
  })
  @ApiParam({ name: 'id', description: 'ID da conversa' })
  @ApiResponse({ status: 200, description: 'Detalhes da conversa', type: ConversationResponseDto })
  @ApiResponse({ status: 404, description: 'Conversa não encontrada' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<ConversationResponseDto> {
    return this.conversationsService.findOne(id, user.tenantId)
  }

  @Patch(':id')
  @Roles('agent', 'supervisor', 'admin', 'owner')
  @ApiOperation({
    summary: 'Atualizar conversa',
    description: 'Atualiza parcialmente: status, agente atribuído, tags e/ou pipeline stage.',
  })
  @ApiParam({ name: 'id', description: 'ID da conversa' })
  @ApiBody({ type: UpdateConversationDto })
  @ApiResponse({ status: 200, description: 'Conversa atualizada', type: ConversationResponseDto })
  @ApiResponse({ status: 404, description: 'Conversa não encontrada' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateConversationDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ConversationResponseDto> {
    return this.conversationsService.update(id, user.tenantId, dto)
  }

  @Post(':id/assign')
  @Roles('agent', 'supervisor', 'admin', 'owner')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Atribuir conversa a um agente',
    description: 'Atribui a conversa ao agente informado e altera status para "attending".',
  })
  @ApiParam({ name: 'id', description: 'ID da conversa' })
  @ApiBody({ type: AssignConversationDto })
  @ApiResponse({ status: 200, description: 'Conversa atribuída', type: ConversationResponseDto })
  @ApiResponse({ status: 404, description: 'Conversa ou agente não encontrado' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  assign(
    @Param('id') id: string,
    @Body() dto: AssignConversationDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ConversationResponseDto> {
    return this.conversationsService.assign(id, user.tenantId, dto, user.sub)
  }

  @Post(':id/transfer')
  @Roles('agent', 'supervisor', 'admin', 'owner')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Transferir conversa',
    description: 'Transfere para outro agente e/ou departamento, criando uma nota interna.',
  })
  @ApiParam({ name: 'id', description: 'ID da conversa' })
  @ApiBody({ type: TransferConversationDto })
  @ApiResponse({ status: 200, description: 'Conversa transferida', type: ConversationResponseDto })
  @ApiResponse({ status: 404, description: 'Conversa, agente ou departamento não encontrado' })
  @ApiResponse({ status: 400, description: 'Informe ao menos userId ou departmentId' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  transfer(
    @Param('id') id: string,
    @Body() dto: TransferConversationDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ConversationResponseDto> {
    return this.conversationsService.transfer(id, user.tenantId, dto, user.sub)
  }

  @Post(':id/resolve')
  @Roles('agent', 'supervisor', 'admin', 'owner')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resolver (fechar) conversa',
    description: 'Marca a conversa como resolvida e registra o evento na timeline.',
  })
  @ApiParam({ name: 'id', description: 'ID da conversa' })
  @ApiResponse({ status: 200, description: 'Conversa resolvida', type: ConversationResponseDto })
  @ApiResponse({ status: 404, description: 'Conversa não encontrada' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  resolve(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<ConversationResponseDto> {
    return this.conversationsService.resolve(id, user.tenantId, user.sub)
  }
}
