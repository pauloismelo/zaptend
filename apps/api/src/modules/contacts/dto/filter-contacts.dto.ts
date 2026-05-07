import { IsString, IsOptional, IsBoolean, IsInt, Min, Max, IsArray } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'
import { Type, Transform } from 'class-transformer'

export class FilterContactsDto {
  @ApiPropertyOptional({
    description: 'Busca por nome, telefone ou e-mail do contato',
    example: 'João',
  })
  @IsString()
  @IsOptional()
  search?: string

  @ApiPropertyOptional({
    description: 'Filtrar por tags (aceita múltiplos valores)',
    type: [String],
    example: ['vip', 'lead'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string | string[]

  @ApiPropertyOptional({
    description: 'Filtrar por status de bloqueio',
    example: false,
  })
  @Transform(({ value }) => {
    if (value === 'true') return true
    if (value === 'false') return false
    return value
  })
  @IsBoolean()
  @IsOptional()
  isBlocked?: boolean

  @ApiPropertyOptional({ description: 'Página (default: 1)', example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number

  @ApiPropertyOptional({ description: 'Itens por página (default: 20, máx: 100)', example: 20 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number
}
