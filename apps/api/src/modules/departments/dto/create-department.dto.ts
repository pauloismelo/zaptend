import { IsHexColor, IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreateDepartmentDto {
  @ApiProperty({ example: 'Suporte', description: 'Nome do departamento' })
  @IsString({ message: 'Nome deve ser uma string' })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  name: string

  @ApiPropertyOptional({ example: 'Atendimento de suporte técnico', description: 'Descrição do departamento' })
  @IsString({ message: 'Descrição deve ser uma string' })
  @IsOptional()
  description?: string

  @ApiPropertyOptional({ example: '#00B37E', description: 'Cor em hexadecimal', default: '#00B37E' })
  @IsHexColor({ message: 'Cor deve ser um valor hexadecimal válido (ex: #00B37E)' })
  @IsOptional()
  color?: string = '#00B37E'
}
