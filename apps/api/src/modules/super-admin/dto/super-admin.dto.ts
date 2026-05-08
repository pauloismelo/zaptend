import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsEmail, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator'

export class SuperAdminTenantsQueryDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search?: string

  @ApiPropertyOptional({ enum: ['trialing', 'active', 'suspended'] })
  @IsIn(['trialing', 'active', 'suspended'])
  @IsOptional()
  status?: 'trialing' | 'active' | 'suspended'

  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number

  @ApiPropertyOptional({ default: 20, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number
}

export class UpdateTenantStatusDto {
  @ApiProperty({ enum: ['trialing', 'active', 'suspended'] })
  @IsIn(['trialing', 'active', 'suspended'])
  status: 'trialing' | 'active' | 'suspended'
}

export class SuperAdminAuthDto {
  @ApiProperty({ example: 'admin@zaptend.com.br' })
  @IsEmail()
  email: string
}
