import {
  Controller,
  Get,
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
import { MessagesService } from './messages.service'
import { ListMessagesDto } from './dto/list-messages.dto'
import { SendMessageDto } from './dto/send-message.dto'
import { MessageResponseDto, PaginatedMessagesDto } from './dto/message-response.dto'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { Roles } from '../../common/decorators/roles.decorator'
import { JwtPayload } from '@zaptend/types'

@ApiTags('Mensagens')
@ApiBearerAuth()
@Controller('conversations/:conversationId/messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  @Roles('agent', 'supervisor', 'admin', 'owner')
  @ApiOperation({
    summary: 'Listar mensagens da conversa',
    description: 'Retorna mensagens com paginação cursor-based (mais recentes primeiro). Use nextCursor para carregar mensagens anteriores.',
  })
  @ApiParam({ name: 'conversationId', description: 'ID da conversa' })
  @ApiQuery({ name: 'cursor', type: String, required: false, description: 'ID da mensagem a partir da qual buscar anteriores' })
  @ApiQuery({ name: 'limit', type: Number, required: false, example: 30 })
  @ApiResponse({ status: 200, description: 'Lista de mensagens', type: PaginatedMessagesDto })
  @ApiResponse({ status: 404, description: 'Conversa não encontrada' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  findByConversation(
    @Param('conversationId') conversationId: string,
    @CurrentUser() user: JwtPayload,
    @Query() query: ListMessagesDto,
  ): Promise<PaginatedMessagesDto> {
    return this.messagesService.findByConversation(conversationId, user.tenantId, query)
  }

  @Post()
  @Roles('agent', 'supervisor', 'admin', 'owner')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Enviar mensagem',
    description: 'Cria e enfileira uma mensagem outbound: text, image, document, audio ou template.',
  })
  @ApiParam({ name: 'conversationId', description: 'ID da conversa' })
  @ApiBody({ type: SendMessageDto })
  @ApiResponse({ status: 201, description: 'Mensagem criada e enfileirada para envio', type: MessageResponseDto })
  @ApiResponse({ status: 404, description: 'Conversa não encontrada' })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou conversa encerrada' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  send(
    @Param('conversationId') conversationId: string,
    @Body() dto: SendMessageDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<MessageResponseDto> {
    return this.messagesService.send(conversationId, user.tenantId, dto, user.sub)
  }
}
