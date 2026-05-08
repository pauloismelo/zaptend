import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'

export class CreateQuickReplyDto {
  @ApiProperty({ example: 'Saudação' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name: string

  @ApiProperty({ example: 'Olá {{nome}}, tudo bem? Como posso ajudar?' })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content: string

  @ApiPropertyOptional({ example: 'Atendimento' })
  @IsString()
  @IsOptional()
  @MaxLength(80)
  category?: string

  @ApiPropertyOptional({ example: 'https://cdn.zaptend.com.br/demo.png' })
  @IsString()
  @IsOptional()
  mediaUrl?: string

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isShared?: boolean
}

export class UpdateQuickReplyDto {
  @ApiPropertyOptional({ example: 'Saudação' })
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(80)
  name?: string

  @ApiPropertyOptional({ example: 'Olá {{nome}}, tudo bem?' })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(2000)
  content?: string

  @ApiPropertyOptional({ example: 'Atendimento' })
  @IsString()
  @IsOptional()
  @MaxLength(80)
  category?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  mediaUrl?: string

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isShared?: boolean
}

export class FilterQuickRepliesDto {
  @ApiPropertyOptional({ description: 'Busca por nome ou conteúdo' })
  @IsString()
  @IsOptional()
  search?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  category?: string
}

