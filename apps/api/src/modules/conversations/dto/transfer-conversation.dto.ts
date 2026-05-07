import { IsUUID, IsOptional, IsString, MaxLength } from 'class-validator'
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger'

export class TransferConversationDto {
  @ApiPropertyOptional({ description: 'ID do agente de destino (UUID)' })
  @IsUUID()
  @IsOptional()
  userId?: string

  @ApiPropertyOptional({ description: 'ID do departamento de destino (UUID)' })
  @IsUUID()
  @IsOptional()
  departmentId?: string

  @ApiProperty({ description: 'Nota interna sobre a transferência', example: 'Cliente precisa de suporte técnico.' })
  @IsString()
  @MaxLength(1000)
  note: string
}
