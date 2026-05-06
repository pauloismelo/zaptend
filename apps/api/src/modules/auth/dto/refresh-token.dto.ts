import { IsNotEmpty, IsString } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token obtido no login', example: 'a3f9b2c1...' })
  @IsString()
  @IsNotEmpty()
  refreshToken: string
}
