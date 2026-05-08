import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString, MaxLength } from 'class-validator'

export const SENTIMENTS = ['positive', 'neutral', 'negative', 'urgent'] as const
export const INTENTS = ['suporte', 'compra', 'cancelamento', 'reclamação', 'dúvida'] as const

export class AiSuggestDto {
  @ApiPropertyOptional({ description: 'Instrução adicional para a sugestão' })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  instruction?: string
}

export class AiSuggestionResponseDto {
  @ApiProperty()
  suggestion: string
}

export class AiSummaryResponseDto {
  @ApiProperty({ type: [String] })
  bullets: string[]
}

export class AiIntentResponseDto {
  @ApiProperty({ enum: INTENTS })
  intent: typeof INTENTS[number]
}

export class MoodItemDto {
  @ApiProperty() id: string
  @ApiProperty({ enum: SENTIMENTS }) sentiment: typeof SENTIMENTS[number]
  @ApiProperty() sentimentScore: number
  @ApiProperty() content: string
  @ApiProperty() createdAt: Date
}
