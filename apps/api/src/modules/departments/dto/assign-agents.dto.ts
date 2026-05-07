import { IsArray, IsNotEmpty, IsString } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class AssignAgentsDto {
  @ApiProperty({
    example: ['user-001', 'user-002'],
    description: 'IDs dos agentes a associar ao departamento',
    type: [String],
  })
  @IsArray({ message: 'userIds deve ser um array' })
  @IsString({ each: true, message: 'Cada userId deve ser uma string' })
  @IsNotEmpty({ message: 'userIds é obrigatório' })
  userIds: string[]
}
