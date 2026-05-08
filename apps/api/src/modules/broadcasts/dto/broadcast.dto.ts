import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsDateString, IsObject, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'

export class CreateBroadcastDto {
  @ApiProperty({ example: 'Campanha Maio' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name: string

  @ApiProperty({ example: 'promo_maio_2026' })
  @IsString()
  @MinLength(2)
  templateName: string

  @ApiPropertyOptional({ example: { nome: '{{contact.name}}' } })
  @IsObject()
  @IsOptional()
  templateVariables?: Record<string, unknown>

  @ApiPropertyOptional({ example: { tags: ['lead'], fields: { plano: 'premium' } } })
  @IsObject()
  @IsOptional()
  segmentFilters?: Record<string, unknown>

  @ApiPropertyOptional({ example: '2026-05-08T15:00:00.000Z' })
  @IsDateString()
  @IsOptional()
  scheduledAt?: string
}

