import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class WhatsAppConfigResponseDto {
  @ApiProperty({ example: 'clx1abc123' })
  id: string

  @ApiProperty({ example: 'tenant-123' })
  tenantId: string

  @ApiProperty({ example: '123456789012345' })
  phoneNumberId: string

  @ApiProperty({ example: '987654321098765' })
  wabaId: string

  @ApiProperty({ example: '+5511999999999' })
  phoneNumber: string

  @ApiProperty({ example: 'Suporte ZapTend' })
  displayName: string

  @ApiProperty({ description: 'Token de verificação único do webhook' })
  webhookVerifyToken: string

  @ApiProperty({ example: true })
  isActive: boolean

  @ApiProperty({ example: false })
  botEnabled: boolean

  @ApiPropertyOptional({ example: 'Você é um assistente...' })
  botSystemPrompt: string | null

  @ApiProperty({ example: false })
  businessHoursEnabled: boolean

  @ApiPropertyOptional({
    description: 'Horário de atendimento por dia',
    example: { mon: { start: '09:00', end: '18:00', enabled: true } },
  })
  businessHours: Record<string, unknown> | null

  @ApiPropertyOptional({ example: 'Olá! Como posso ajudar?' })
  welcomeMessage: string | null

  @ApiPropertyOptional({ example: 'Retornaremos em breve!' })
  awayMessage: string | null

  @ApiProperty({ example: true })
  csatEnabled: boolean

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  createdAt: Date

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  updatedAt: Date
}
