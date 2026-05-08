import { Type } from 'class-transformer'
import { IsString, IsOptional, IsEnum, IsUUID, IsArray, IsNumber, Min } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'
import { ConversationStatusEnum } from './conversation-status.enum'

export class UpdateConversationDto {
  @ApiPropertyOptional({ enum: ConversationStatusEnum, description: 'Novo status da conversa' })
  @IsEnum(ConversationStatusEnum)
  @IsOptional()
  status?: ConversationStatusEnum

  @ApiPropertyOptional({ description: 'ID do agente responsável (UUID)' })
  @IsUUID()
  @IsOptional()
  assignedUserId?: string

  @ApiPropertyOptional({ type: [String], description: 'Tags da conversa' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[]

  @ApiPropertyOptional({ description: 'Etapa do pipeline (ex: negociação, proposta)' })
  @IsString()
  @IsOptional()
  pipelineStage?: string

  @ApiPropertyOptional({ description: 'Valor estimado no pipeline' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  pipelineValue?: number
}
