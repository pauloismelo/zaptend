import { ApiProperty } from '@nestjs/swagger'

export class ImportContactsDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description:
      'Arquivo CSV com colunas: phone (obrigatório), name, email, company, tags (separadas por |)',
  })
  file: Express.Multer.File
}

export class ImportContactsResultDto {
  @ApiProperty({ description: 'Total de linhas processadas', example: 50 })
  processed: number

  @ApiProperty({ description: 'Total de contatos criados ou atualizados', example: 48 })
  upserted: number

  @ApiProperty({ description: 'Total de linhas ignoradas (sem phone)', example: 2 })
  skipped: number

  @ApiProperty({
    description: 'Erros por linha, se houver',
    example: [{ line: 3, error: 'E-mail inválido' }],
  })
  errors: Array<{ line: number; error: string }>
}
