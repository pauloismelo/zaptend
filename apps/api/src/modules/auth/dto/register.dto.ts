import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength, Matches } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class RegisterDto {
  @ApiProperty({ description: 'Nome da empresa / tenant', example: 'Minha Empresa' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  tenantName: string

  @ApiProperty({ description: 'Slug único do tenant (usado como subdomínio)', example: 'minha-empresa' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Matches(/^[a-z0-9-]+$/, { message: 'Slug deve conter apenas letras minúsculas, números e hífens' })
  tenantSlug: string

  @ApiProperty({ description: 'Nome do proprietário', example: 'João Silva' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string

  @ApiProperty({ description: 'Email do proprietário', example: 'joao@empresa.com' })
  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty()
  email: string

  @ApiProperty({ description: 'Senha (mínimo 8 caracteres)', example: 'Senha@123' })
  @IsString()
  @MinLength(8, { message: 'Senha deve ter no mínimo 8 caracteres' })
  @MaxLength(100)
  password: string
}
