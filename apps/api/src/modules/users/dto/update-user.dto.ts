import { IsEnum, IsOptional, IsString, IsUrl } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'
import { UserRole } from '@prisma/client'

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Maria Souza', description: 'Nome do usuário' })
  @IsString({ message: 'Nome deve ser uma string' })
  @IsOptional()
  name?: string

  @ApiPropertyOptional({
    example: 'https://example.com/avatar.png',
    description: 'URL do avatar do usuário',
  })
  @IsUrl({}, { message: 'avatarUrl deve ser uma URL válida' })
  @IsOptional()
  avatarUrl?: string

  @ApiPropertyOptional({ enum: UserRole, description: 'Papel do usuário no tenant' })
  @IsEnum(UserRole, { message: 'Role inválida' })
  @IsOptional()
  role?: UserRole
}
