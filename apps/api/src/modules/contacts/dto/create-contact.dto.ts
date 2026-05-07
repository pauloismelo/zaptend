import {
  IsString,
  IsOptional,
  IsEmail,
  IsUrl,
  IsArray,
  IsObject,
  IsNotEmpty,
  MaxLength,
} from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreateContactDto {
  @ApiProperty({ description: 'Número de telefone do contato (formato: DDI + DDD + número)', example: '5511999999999' })
  @IsString()
  @IsNotEmpty()
  phone: string

  @ApiPropertyOptional({ description: 'Nome do contato', example: 'João Silva' })
  @IsString()
  @MaxLength(255)
  @IsOptional()
  name?: string

  @ApiPropertyOptional({ description: 'E-mail do contato', example: 'joao@exemplo.com.br' })
  @IsEmail({}, { message: 'E-mail inválido' })
  @IsOptional()
  email?: string

  @ApiPropertyOptional({ description: 'Empresa do contato', example: 'Acme Ltda' })
  @IsString()
  @MaxLength(255)
  @IsOptional()
  company?: string

  @ApiPropertyOptional({ description: 'URL do avatar do contato', example: 'https://cdn.exemplo.com/avatar.jpg' })
  @IsUrl({}, { message: 'URL do avatar inválida' })
  @IsOptional()
  avatarUrl?: string

  @ApiPropertyOptional({
    description: 'Tags associadas ao contato',
    type: [String],
    example: ['vip', 'lead'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[]

  @ApiPropertyOptional({
    description: 'Campos customizados (chave-valor livre)',
    example: { cpf: '123.456.789-00', cargo: 'Gerente' },
  })
  @IsObject()
  @IsOptional()
  customFields?: Record<string, unknown>

  @ApiPropertyOptional({ description: 'Notas internas sobre o contato', example: 'Cliente VIP - atender com prioridade' })
  @IsString()
  @IsOptional()
  notes?: string
}
