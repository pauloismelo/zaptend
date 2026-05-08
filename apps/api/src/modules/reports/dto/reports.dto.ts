import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsDateString, IsIn, IsInt, IsOptional, Max, Min } from 'class-validator'

export class ReportPeriodDto {
  @ApiPropertyOptional({ example: '2026-05-01T00:00:00.000Z' })
  @IsDateString()
  @IsOptional()
  startDate?: string

  @ApiPropertyOptional({ example: '2026-05-31T23:59:59.999Z' })
  @IsDateString()
  @IsOptional()
  endDate?: string
}

export class ReportVolumeQueryDto extends ReportPeriodDto {
  @ApiPropertyOptional({ enum: ['day', 'week', 'month'], default: 'day' })
  @IsIn(['day', 'week', 'month'])
  @IsOptional()
  period?: 'day' | 'week' | 'month'
}

export class ReportLimitQueryDto extends ReportPeriodDto {
  @ApiPropertyOptional({ default: 24, minimum: 1, maximum: 168 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(168)
  @IsOptional()
  hours?: number
}

export class ReportsOverviewDto {
  @ApiProperty() openConversations: number
  @ApiProperty() averageAssignmentMinutes: number
  @ApiProperty() averageResolutionMinutes: number
  @ApiProperty() averageCsat: number
  @ApiProperty() onlineAgents: number
}

export class VolumeItemDto {
  @ApiProperty() bucket: string
  @ApiProperty() total: number
  @ApiPropertyOptional() departmentId: string | null
  @ApiPropertyOptional() agentId: string | null
}

export class AgentPerformanceDto {
  @ApiProperty() agentId: string
  @ApiProperty() agentName: string
  @ApiProperty() conversations: number
  @ApiProperty() averageAssignmentMinutes: number
  @ApiProperty() averageResolutionMinutes: number
  @ApiProperty() averageCsat: number
}

export class HeatmapItemDto {
  @ApiProperty() dayOfWeek: number
  @ApiProperty() hour: number
  @ApiProperty() total: number
}
