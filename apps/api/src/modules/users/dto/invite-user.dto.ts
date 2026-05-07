import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { UserRole } from '@prisma/client'

export class InviteUserDto {
  @ApiProperty({ example: 'agente@empresa.com', description: 'E-mail do usuário a ser convidado' })
  @IsEmail({}, { message: 'E-mail inválido' })
  @IsNotEmpty({ message: 'E-mail é obrigatório' })
  email: string

  @ApiProperty({ example: 'João Silva', description: 'Nome completo do usuário' })
  @IsString({ message: 'Nome deve ser uma string' })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  name: string

  @ApiPropertyOptional({
    enum: UserRole,
    default: UserRole.agent,
    description: 'Papel do usuário no tenant',
  })
  @IsEnum(UserRole, { message: 'Role inválida' })
  role?: UserRole = UserRole.agent
}
