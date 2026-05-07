import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'

export class ListMessagesDto {
  @ApiPropertyOptional({ description: 'ID da mensagem cursor (busca mensagens mais antigas)' })
  @IsString()
  @IsOptional()
  cursor?: string

  @ApiPropertyOptional({ description: 'Quantidade de mensagens (default: 30, máx: 100)', example: 30 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number
}
