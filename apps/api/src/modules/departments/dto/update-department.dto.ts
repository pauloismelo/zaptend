import { PartialType } from '@nestjs/swagger'
import { IsBoolean, IsOptional } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'
import { CreateDepartmentDto } from './create-department.dto'

export class UpdateDepartmentDto extends PartialType(CreateDepartmentDto) {
  @ApiPropertyOptional({ example: true, description: 'Status ativo do departamento' })
  @IsBoolean({ message: 'isActive deve ser um booleano' })
  @IsOptional()
  isActive?: boolean
}
