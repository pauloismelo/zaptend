import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class ConversationSummaryDto {
  @ApiProperty() id: string
  @ApiProperty() status: string
  @ApiProperty() channel: string
  @ApiPropertyOptional() lastMessageAt: Date | null
  @ApiProperty() createdAt: Date
}

export class ContactResponseDto {
  @ApiProperty() id: string
  @ApiProperty() tenantId: string
  @ApiProperty() phone: string
  @ApiPropertyOptional() name: string | null
  @ApiPropertyOptional() email: string | null
  @ApiPropertyOptional() company: string | null
  @ApiPropertyOptional() avatarUrl: string | null
  @ApiProperty({ type: [String] }) tags: string[]
  @ApiPropertyOptional({ type: Object }) customFields: Record<string, unknown> | null
  @ApiProperty() isBlocked: boolean
  @ApiProperty() optedOut: boolean
  @ApiPropertyOptional() notes: string | null
  @ApiProperty() createdAt: Date
  @ApiProperty() updatedAt: Date
  @ApiPropertyOptional({ type: [ConversationSummaryDto] }) conversations?: ConversationSummaryDto[]
}

export class PaginatedContactsDto {
  @ApiProperty({ type: [ContactResponseDto] }) data: ContactResponseDto[]
  @ApiProperty() total: number
  @ApiProperty() page: number
  @ApiProperty() limit: number
  @ApiProperty() totalPages: number
}
