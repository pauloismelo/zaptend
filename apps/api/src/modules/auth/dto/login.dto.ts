import { IsEmail, IsNotEmpty, IsString } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class LoginDto {
  @ApiProperty({ description: 'Slug do tenant', example: 'minha-empresa' })
  @IsString()
  @IsNotEmpty()
  tenantSlug: string

  @ApiProperty({ description: 'Email do usuário', example: 'joao@empresa.com' })
  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty()
  email: string

  @ApiProperty({ description: 'Senha do usuário', example: 'Senha@123' })
  @IsString()
  @IsNotEmpty()
  password: string
}
