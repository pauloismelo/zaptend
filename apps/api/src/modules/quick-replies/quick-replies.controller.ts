import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger'
import { JwtPayload } from '@zaptend/types'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { Roles } from '../../common/decorators/roles.decorator'
import { CreateQuickReplyDto, FilterQuickRepliesDto, UpdateQuickReplyDto } from './dto/quick-reply.dto'
import { QuickRepliesService } from './quick-replies.service'

@ApiTags('Respostas rápidas')
@ApiBearerAuth()
@Controller('quick-replies')
export class QuickRepliesController {
  constructor(private readonly service: QuickRepliesService) {}

  @Get()
  @Roles('agent', 'supervisor', 'admin', 'owner')
  @ApiOperation({ summary: 'Listar respostas rápidas' })
  findAll(@CurrentUser() user: JwtPayload, @Query() query: FilterQuickRepliesDto) {
    return this.service.findAll(user.tenantId, query)
  }

  @Get(':id')
  @Roles('agent', 'supervisor', 'admin', 'owner')
  @ApiOperation({ summary: 'Buscar resposta rápida' })
  @ApiParam({ name: 'id' })
  findOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.service.findOne(id, user.tenantId)
  }

  @Post()
  @Roles('supervisor', 'admin', 'owner')
  @ApiOperation({ summary: 'Criar resposta rápida' })
  @ApiBody({ type: CreateQuickReplyDto })
  @ApiResponse({ status: 201, description: 'Criada' })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateQuickReplyDto) {
    return this.service.create(user.tenantId, user.sub, dto)
  }

  @Patch(':id')
  @Roles('supervisor', 'admin', 'owner')
  @ApiOperation({ summary: 'Atualizar resposta rápida' })
  @ApiBody({ type: UpdateQuickReplyDto })
  update(@Param('id') id: string, @CurrentUser() user: JwtPayload, @Body() dto: UpdateQuickReplyDto) {
    return this.service.update(id, user.tenantId, dto)
  }

  @Delete(':id')
  @Roles('supervisor', 'admin', 'owner')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover resposta rápida' })
  async remove(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    await this.service.remove(id, user.tenantId)
  }
}

