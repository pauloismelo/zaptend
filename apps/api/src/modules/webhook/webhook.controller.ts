import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiHeader,
} from '@nestjs/swagger'
import { SkipThrottle } from '@nestjs/throttler'
import { RawBodyRequest } from '@nestjs/common'
import { Request } from 'express'
import { WebhookService } from './webhook.service'
import { MetaWebhookPayloadDto } from './dto/meta-webhook.dto'
import { VerifyWebhookQueryDto } from './dto/verify-webhook.dto'
import { Public } from '../../common/decorators/public.decorator'

@ApiTags('Webhooks Meta')
@Public()
@SkipThrottle()
@Controller('webhooks/whatsapp')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  /**
   * Verificação do webhook Meta (desafio hub.challenge).
   * O Meta chama este endpoint uma vez ao configurar o webhook no painel.
   */
  @Get(':tenantId')
  @ApiOperation({
    summary: 'Verificar webhook Meta',
    description:
      'Endpoint chamado pelo Meta para confirmar o webhook. Valida o hub.verify_token do tenant e retorna o hub.challenge.',
  })
  @ApiParam({ name: 'tenantId', description: 'ID do tenant' })
  @ApiQuery({ name: 'hub.mode', required: true, example: 'subscribe' })
  @ApiQuery({ name: 'hub.verify_token', required: true, description: 'Token de verificação' })
  @ApiQuery({ name: 'hub.challenge', required: true, description: 'Challenge a retornar' })
  @ApiResponse({ status: 200, description: 'Challenge retornado — webhook verificado com sucesso' })
  @ApiResponse({ status: 400, description: 'Modo inválido' })
  @ApiResponse({ status: 401, description: 'Token inválido' })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async verifyWebhook(
    @Param('tenantId') tenantId: string,
    @Query() query: VerifyWebhookQueryDto,
  ): Promise<string> {
    return this.webhookService.handleVerification(
      tenantId,
      query['hub.mode'],
      query['hub.verify_token'],
      query['hub.challenge'],
    )
  }

  /**
   * Recebimento de mensagens e status do Meta (POST).
   * Valida HMAC-SHA256, responde 200 imediatamente e enfileira no BullMQ.
   */
  @Post(':tenantId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Receber eventos do WhatsApp',
    description:
      'Recebe mensagens, status e outros eventos do Meta. Valida a assinatura HMAC-SHA256 e enfileira no BullMQ (fila messages-inbound) para processamento assíncrono.',
  })
  @ApiParam({ name: 'tenantId', description: 'ID do tenant' })
  @ApiHeader({
    name: 'x-hub-signature-256',
    description: 'Assinatura HMAC-SHA256 do payload (sha256=<hex>)',
    required: true,
  })
  @ApiResponse({ status: 200, description: 'Payload recebido e enfileirado' })
  @ApiResponse({ status: 401, description: 'Assinatura inválida ou ausente' })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: false }))
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Param('tenantId') tenantId: string,
    @Headers('x-hub-signature-256') signature: string,
    @Body() body: MetaWebhookPayloadDto,
  ): Promise<{ status: string }> {
    this.webhookService.verifySignature(req.rawBody ?? Buffer.from(''), signature)
    await this.webhookService.processPayload(tenantId, body)
    return { status: 'ok' }
  }
}
