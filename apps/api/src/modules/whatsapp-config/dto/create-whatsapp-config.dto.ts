import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  MaxLength,
  ValidateNested,
  MinLength,
} from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { BusinessHoursDto } from './business-hours.dto'

export class CreateWhatsAppConfigDto {
  @ApiProperty({
    description: 'ID do número de telefone no Meta (phone_number_id)',
    example: '123456789012345',
  })
  @IsString()
  @IsNotEmpty()
  phoneNumberId: string

  @ApiProperty({
    description: 'ID da conta WhatsApp Business (WABA ID)',
    example: '987654321098765',
  })
  @IsString()
  @IsNotEmpty()
  wabaId: string

  @ApiProperty({
    description: 'Número de telefone no formato E.164',
    example: '+5511999999999',
  })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string

  @ApiProperty({
    description: 'Nome de exibição do número no WhatsApp',
    example: 'Suporte ZapTend',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  displayName: string

  @ApiProperty({
    description: 'Access token da Meta API (será criptografado com KMS antes de salvar)',
    example: 'EAABwzLixnjYBO...',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  accessToken: string

  @ApiPropertyOptional({
    description: 'Mensagem de boas-vindas enviada ao iniciar nova conversa',
    example: 'Olá! Seja bem-vindo ao nosso atendimento. Como posso ajudar?',
  })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  welcomeMessage?: string

  @ApiPropertyOptional({
    description: 'Mensagem enviada fora do horário de atendimento',
    example: 'No momento estamos fora do horário de atendimento. Retornaremos em breve!',
  })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  awayMessage?: string

  @ApiPropertyOptional({
    description: 'Ativa ou desativa o horário de atendimento',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  businessHoursEnabled?: boolean

  @ApiPropertyOptional({
    type: BusinessHoursDto,
    description: 'Configuração de horário de atendimento por dia da semana',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => BusinessHoursDto)
  businessHours?: BusinessHoursDto

  @ApiPropertyOptional({ description: 'Ativa o bot de IA', default: false })
  @IsBoolean()
  @IsOptional()
  botEnabled?: boolean

  @ApiPropertyOptional({
    description: 'Prompt de sistema para o bot de IA',
    example: 'Você é um assistente de atendimento da empresa XYZ...',
  })
  @IsString()
  @IsOptional()
  @MaxLength(4000)
  botSystemPrompt?: string

  @ApiPropertyOptional({ description: 'Ativa pesquisa de CSAT ao resolver conversa', default: true })
  @IsBoolean()
  @IsOptional()
  csatEnabled?: boolean
}
