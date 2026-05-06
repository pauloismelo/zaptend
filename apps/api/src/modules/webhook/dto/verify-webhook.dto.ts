import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString } from 'class-validator'

/**
 * Query params enviados pelo Meta para verificação de webhook.
 * Ex: GET /webhooks/whatsapp/:tenantId?hub.mode=subscribe&hub.verify_token=TOKEN&hub.challenge=CHALLENGE
 *
 * Com qs (Express padrão, allowDots=false), "hub.mode" é tratado como
 * chave literal — NÃO como objeto aninhado — então @Query() mapeia direto.
 */
export class VerifyWebhookQueryDto {
  @ApiProperty({ name: 'hub.mode', example: 'subscribe', description: 'Deve ser "subscribe"' })
  @IsString()
  @IsNotEmpty()
  'hub.mode': string

  @ApiProperty({ name: 'hub.verify_token', description: 'Token de verificação configurado no webhook' })
  @IsString()
  @IsNotEmpty()
  'hub.verify_token': string

  @ApiProperty({ name: 'hub.challenge', description: 'Challenge que deve ser retornado ao Meta' })
  @IsString()
  @IsNotEmpty()
  'hub.challenge': string
}
