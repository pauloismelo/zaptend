import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator'

const triggers = ['new_conversation', 'keyword', 'schedule', 'field_changed'] as const

export class CreateAutomationFlowDto {
  @ApiProperty({ example: 'Boas-vindas' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string

  @ApiProperty({ enum: triggers })
  @IsIn(triggers)
  trigger: typeof triggers[number]

  @ApiPropertyOptional({ example: { keyword: 'oi', matchType: 'contains' } })
  @IsObject()
  @IsOptional()
  triggerConfig?: Record<string, unknown>

  @ApiProperty({ example: [{ id: 'n1', type: 'message', config: { text: 'Olá!' } }] })
  @IsArray()
  @IsObject({ each: true })
  nodes: Array<Record<string, unknown>>

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean
}

export class UpdateAutomationFlowDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string

  @ApiPropertyOptional({ enum: triggers })
  @IsIn(triggers)
  @IsOptional()
  trigger?: typeof triggers[number]

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  triggerConfig?: Record<string, unknown>

  @ApiPropertyOptional()
  @IsArray()
  @IsObject({ each: true })
  @IsOptional()
  nodes?: Array<Record<string, unknown>>

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean
}
