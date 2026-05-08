import { ApiProperty } from '@nestjs/swagger'
import { IsInt, IsOptional, Min } from 'class-validator'

export class RecordUsageDto {
  @ApiProperty({ example: 1, required: false, minimum: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  quantity?: number
}

export class UsageLimitResponseDto {
  @ApiProperty({ example: 'conversations', enum: ['conversations', 'broadcasts'] })
  metric: 'conversations' | 'broadcasts'

  @ApiProperty({ example: '2026-05' })
  month: string

  @ApiProperty({ example: 120 })
  used: number

  @ApiProperty({ example: 500 })
  limit: number

  @ApiProperty({ example: 380 })
  remaining: number

  @ApiProperty({ example: true })
  withinLimit: boolean
}

