import { IsBoolean, IsOptional, IsString, Matches, ValidateNested } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'

export class DayScheduleDto {
  @ApiPropertyOptional({ example: '09:00', description: 'Hora de início (HH:mm)' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'Formato inválido. Use HH:mm (ex: 09:00)' })
  start: string

  @ApiPropertyOptional({ example: '18:00', description: 'Hora de encerramento (HH:mm)' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'Formato inválido. Use HH:mm (ex: 18:00)' })
  end: string

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  enabled: boolean
}

export class BusinessHoursDto {
  @ApiPropertyOptional({ type: DayScheduleDto, description: 'Segunda-feira' })
  @IsOptional()
  @ValidateNested()
  @Type(() => DayScheduleDto)
  mon?: DayScheduleDto

  @ApiPropertyOptional({ type: DayScheduleDto, description: 'Terça-feira' })
  @IsOptional()
  @ValidateNested()
  @Type(() => DayScheduleDto)
  tue?: DayScheduleDto

  @ApiPropertyOptional({ type: DayScheduleDto, description: 'Quarta-feira' })
  @IsOptional()
  @ValidateNested()
  @Type(() => DayScheduleDto)
  wed?: DayScheduleDto

  @ApiPropertyOptional({ type: DayScheduleDto, description: 'Quinta-feira' })
  @IsOptional()
  @ValidateNested()
  @Type(() => DayScheduleDto)
  thu?: DayScheduleDto

  @ApiPropertyOptional({ type: DayScheduleDto, description: 'Sexta-feira' })
  @IsOptional()
  @ValidateNested()
  @Type(() => DayScheduleDto)
  fri?: DayScheduleDto

  @ApiPropertyOptional({ type: DayScheduleDto, description: 'Sábado' })
  @IsOptional()
  @ValidateNested()
  @Type(() => DayScheduleDto)
  sat?: DayScheduleDto

  @ApiPropertyOptional({ type: DayScheduleDto, description: 'Domingo' })
  @IsOptional()
  @ValidateNested()
  @Type(() => DayScheduleDto)
  sun?: DayScheduleDto
}
