import { IsString, IsOptional, IsEnum, IsObject, MaxLength, IsNotEmpty } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { MessageTypeEnum } from './message-type.enum'

export class SendMessageDto {
  @ApiProperty({ enum: MessageTypeEnum, description: 'Tipo da mensagem' })
  @IsEnum(MessageTypeEnum)
  @IsNotEmpty()
  type: MessageTypeEnum

  @ApiPropertyOptional({ description: 'Conteúdo de texto (obrigatório para type=text)' })
  @IsString()
  @MaxLength(4096)
  @IsOptional()
  content?: string

  @ApiPropertyOptional({ description: 'URL da mídia no S3 (obrigatório para image/audio/video/document)' })
  @IsString()
  @IsOptional()
  mediaUrl?: string

  @ApiPropertyOptional({ description: 'Nome do template (obrigatório para type=template)' })
  @IsString()
  @IsOptional()
  templateName?: string

  @ApiPropertyOptional({ description: 'Variáveis do template', additionalProperties: { type: 'string' } })
  @IsObject()
  @IsOptional()
  templateVariables?: Record<string, string>
}
