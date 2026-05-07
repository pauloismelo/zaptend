import { IsUUID, IsNotEmpty } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class AssignConversationDto {
  @ApiProperty({ description: 'ID do agente que receberá a conversa', example: 'clx1abc...' })
  @IsUUID()
  @IsNotEmpty()
  userId: string
}
