import {
  IsString,
  IsOptional,
  IsBoolean,
  MaxLength,
  ValidateNested,
  MinLength,
} from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { BusinessHoursDto } from './business-hours.dto'

export class UpdateWhatsAppConfigDto {
  @ApiPropertyOptional({
    description: 'Nome de exibição do número no WhatsApp',
    example: 'Suporte ZapTend',
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  displayName?: string

  @ApiPropertyOptional({
    description: 'Novo access token da Meta API (será re-criptografado com KMS)',
    example: 'EAABwzLixnjYBO...',
  })
  @IsString()
  @IsOptional()
  @MinLength(10)
  accessToken?: string

  @ApiPropertyOptional({
    description: 'Mensagem de boas-vindas enviada ao iniciar nova conversa',
    example: 'Olá! Seja bem-vindo ao nosso atendimento.',
  })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  welcomeMessage?: string

  @ApiPropertyOptional({
    description: 'Mensagem enviada fora do horário de atendimento',
    example: 'No momento estamos fora do horário de atendimento.',
  })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  awayMessage?: string

  @ApiPropertyOptional({ description: 'Ativa ou desativa o horário de atendimento' })
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

  @ApiPropertyOptional({ description: 'Ativa o número no sistema' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean

  @ApiPropertyOptional({ description: 'Ativa o bot de IA' })
  @IsBoolean()
  @IsOptional()
  botEnabled?: boolean

  @ApiPropertyOptional({
    description: 'Prompt de sistema para o bot de IA',
  })
  @IsString()
  @IsOptional()
  @MaxLength(4000)
  botSystemPrompt?: string

  @ApiPropertyOptional({ description: 'Ativa pesquisa de CSAT ao resolver conversa' })
  @IsBoolean()
  @IsOptional()
  csatEnabled?: boolean
}
