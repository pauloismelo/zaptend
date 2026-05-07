import { IsString, IsOptional, IsEnum, IsUUID, IsInt, Min, Max } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { ConversationStatusEnum } from './conversation-status.enum'

export class ListConversationsDto {
  @ApiPropertyOptional({ enum: ConversationStatusEnum, description: 'Filtrar por status' })
  @IsEnum(ConversationStatusEnum)
  @IsOptional()
  status?: ConversationStatusEnum

  @ApiPropertyOptional({ description: 'Filtrar por agente atribuído (UUID)' })
  @IsUUID()
  @IsOptional()
  assignedUserId?: string

  @ApiPropertyOptional({ description: 'Filtrar por departamento (UUID)' })
  @IsUUID()
  @IsOptional()
  departmentId?: string

  @ApiPropertyOptional({
    description: 'Filtrar por tag (aceita múltiplos valores)',
    type: [String],
  })
  @IsString({ each: true })
  @IsOptional()
  tags?: string | string[]

  @ApiPropertyOptional({ description: 'Busca por nome do contato ou telefone' })
  @IsString()
  @IsOptional()
  search?: string

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
