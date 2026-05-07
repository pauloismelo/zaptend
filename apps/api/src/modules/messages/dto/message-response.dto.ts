import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class MessageSenderDto {
  @ApiProperty() id: string
  @ApiProperty() name: string
  @ApiPropertyOptional() avatarUrl: string | null
}

export class MessageResponseDto {
  @ApiProperty() id: string
  @ApiProperty() tenantId: string
  @ApiProperty() conversationId: string
  @ApiPropertyOptional() waMessageId: string | null
  @ApiProperty() direction: string
  @ApiProperty() type: string
  @ApiPropertyOptional() content: string | null
  @ApiPropertyOptional() mediaUrl: string | null
  @ApiPropertyOptional() mediaType: string | null
  @ApiPropertyOptional() mediaFilename: string | null
  @ApiPropertyOptional() templateName: string | null
  @ApiProperty() status: string
  @ApiPropertyOptional() sentBy: string | null
  @ApiPropertyOptional({ type: MessageSenderDto }) sentByUser?: MessageSenderDto | null
  @ApiProperty() isBot: boolean
  @ApiPropertyOptional() sentiment: string | null
  @ApiPropertyOptional() sentAt: Date | null
  @ApiPropertyOptional() deliveredAt: Date | null
  @ApiPropertyOptional() readAt: Date | null
  @ApiPropertyOptional() failedAt: Date | null
  @ApiPropertyOptional() failureReason: string | null
  @ApiProperty() createdAt: Date
}

export class PaginatedMessagesDto {
  @ApiProperty({ type: [MessageResponseDto] }) data: MessageResponseDto[]
  @ApiPropertyOptional() nextCursor: string | null
  @ApiProperty() hasMore: boolean
}
