import { IsBoolean, IsNotEmpty } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class UpdateOnlineStatusDto {
  @ApiProperty({ example: true, description: 'Status online do usuário' })
  @IsBoolean({ message: 'isOnline deve ser um booleano' })
  @IsNotEmpty({ message: 'isOnline é obrigatório' })
  isOnline: boolean
}
