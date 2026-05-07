import { IsBoolean, IsEnum, IsOptional } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'
import { Transform } from 'class-transformer'
import { UserRole } from '@prisma/client'

export class FilterUsersDto {
  @ApiPropertyOptional({ enum: UserRole, description: 'Filtrar por papel' })
  @IsEnum(UserRole, { message: 'Role inválida' })
  @IsOptional()
  role?: UserRole

  @ApiPropertyOptional({ example: true, description: 'Filtrar por status online' })
  @Transform(({ value }) => {
    if (value === 'true') return true
    if (value === 'false') return false
    return value
  })
  @IsBoolean({ message: 'isOnline deve ser um booleano' })
  @IsOptional()
  isOnline?: boolean

  @ApiPropertyOptional({ example: true, description: 'Filtrar por status ativo (default: true)' })
  @Transform(({ value }) => {
    if (value === 'true') return true
    if (value === 'false') return false
    return value
  })
  @IsBoolean({ message: 'isActive deve ser um booleano' })
  @IsOptional()
  isActive?: boolean
}
