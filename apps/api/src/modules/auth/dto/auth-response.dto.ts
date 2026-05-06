import { ApiProperty } from '@nestjs/swagger'

export class AuthUserDto {
  @ApiProperty({ example: 'clx1abc123' })
  id: string

  @ApiProperty({ example: 'joao@empresa.com' })
  email: string

  @ApiProperty({ example: 'João Silva' })
  name: string

  @ApiProperty({ example: 'owner', enum: ['agent', 'supervisor', 'admin', 'owner'] })
  role: string

  @ApiProperty({ example: 'clx1tenant123' })
  tenantId: string

  @ApiProperty({ example: 'minha-empresa' })
  tenantSlug: string
}

export class AuthResponseDto {
  @ApiProperty({ description: 'JWT access token (expira em 15 minutos)' })
  accessToken: string

  @ApiProperty({ description: 'Refresh token opaco (expira em 7 dias)' })
  refreshToken: string

  @ApiProperty({ type: AuthUserDto })
  user: AuthUserDto
}

export class AccessTokenResponseDto {
  @ApiProperty({ description: 'Novo JWT access token (expira em 15 minutos)' })
  accessToken: string
}
