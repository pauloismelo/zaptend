import { PartialType } from '@nestjs/swagger'
import { IsBoolean, IsOptional } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'
import { CreateContactDto } from './create-contact.dto'

export class UpdateContactDto extends PartialType(CreateContactDto) {
  @ApiPropertyOptional({ description: 'Bloquear/desbloquear contato', example: false })
  @IsBoolean()
  @IsOptional()
  isBlocked?: boolean
}
