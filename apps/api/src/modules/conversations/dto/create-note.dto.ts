import { ApiProperty } from '@nestjs/swagger'
import { IsString, MaxLength, MinLength } from 'class-validator'

export class CreateInternalNoteDto {
  @ApiProperty({ example: 'Cliente pediu retorno amanhã às 10h.' })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content: string
}

