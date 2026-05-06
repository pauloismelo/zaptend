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
import { WhatsAppConfigService } from './whatsapp-config.service'
import { CreateWhatsAppConfigDto } from './dto/create-whatsapp-config.dto'
import { UpdateWhatsAppConfigDto } from './dto/update-whatsapp-config.dto'
import { WhatsAppConfigResponseDto } from './dto/whatsapp-config-response.dto'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { Roles } from '../../common/decorators/roles.decorator'
import { JwtPayload } from '@zaptend/types'

@ApiTags('WhatsApp Config')
@ApiBearerAuth()
@Controller('whatsapp-config')
export class WhatsAppConfigController {
  constructor(private readonly whatsAppConfigService: WhatsAppConfigService) {}

  @Get()
  @Roles('admin', 'owner')
  @ApiOperation({
    summary: 'Listar configurações WhatsApp',
    description: 'Retorna todas as configurações WhatsApp do tenant autenticado.',
  })
  @ApiResponse({ status: 200, description: 'Lista de configurações', type: [WhatsAppConfigResponseDto] })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  findAll(@CurrentUser() user: JwtPayload): Promise<WhatsAppConfigResponseDto[]> {
    return this.whatsAppConfigService.findAll(user.tenantId)
  }

  @Get(':id')
  @Roles('admin', 'owner')
  @ApiOperation({ summary: 'Buscar configuração WhatsApp por ID' })
  @ApiParam({ name: 'id', description: 'ID da configuração WhatsApp' })
  @ApiResponse({ status: 200, type: WhatsAppConfigResponseDto })
  @ApiResponse({ status: 404, description: 'Configuração não encontrada' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  findOne(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<WhatsAppConfigResponseDto> {
    return this.whatsAppConfigService.findOne(id, user.tenantId)
  }

  @Post()
  @Roles('admin', 'owner')
  @ApiOperation({
    summary: 'Criar configuração WhatsApp',
    description:
      'Conecta um número WhatsApp Business ao tenant. O accessToken é criptografado com AWS KMS antes de salvar.',
  })
  @ApiBody({ type: CreateWhatsAppConfigDto })
  @ApiResponse({ status: 201, description: 'Configuração criada com sucesso', type: WhatsAppConfigResponseDto })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 409, description: 'Número já cadastrado na plataforma' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  create(
    @Body() dto: CreateWhatsAppConfigDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<WhatsAppConfigResponseDto> {
    return this.whatsAppConfigService.create(user.tenantId, dto)
  }

  @Patch(':id')
  @Roles('admin', 'owner')
  @ApiOperation({
    summary: 'Atualizar configuração WhatsApp',
    description:
      'Atualiza parcialmente a configuração. Se accessToken for enviado, será re-criptografado com KMS.',
  })
  @ApiParam({ name: 'id', description: 'ID da configuração WhatsApp' })
  @ApiBody({ type: UpdateWhatsAppConfigDto })
  @ApiResponse({ status: 200, description: 'Configuração atualizada', type: WhatsAppConfigResponseDto })
  @ApiResponse({ status: 404, description: 'Configuração não encontrada' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateWhatsAppConfigDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<WhatsAppConfigResponseDto> {
    return this.whatsAppConfigService.update(id, user.tenantId, dto)
  }

  @Delete(':id')
  @Roles('owner')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remover configuração WhatsApp',
    description: 'Remove permanentemente a configuração do número WhatsApp. Apenas owners podem executar.',
  })
  @ApiParam({ name: 'id', description: 'ID da configuração WhatsApp' })
  @ApiResponse({ status: 204, description: 'Configuração removida com sucesso' })
  @ApiResponse({ status: 404, description: 'Configuração não encontrada' })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissão (somente owner)' })
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    await this.whatsAppConfigService.remove(id, user.tenantId)
  }
}
