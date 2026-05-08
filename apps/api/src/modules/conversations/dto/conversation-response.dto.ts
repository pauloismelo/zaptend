import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { ConversationStatusEnum } from './conversation-status.enum'

export class ContactSummaryDto {
  @ApiProperty() id: string
  @ApiProperty() phone: string
  @ApiPropertyOptional() name: string | null
  @ApiPropertyOptional() avatarUrl: string | null
  @ApiPropertyOptional() company: string | null
  @ApiProperty({ type: [String] }) tags: string[]
}

export class UserSummaryDto {
  @ApiProperty() id: string
  @ApiProperty() name: string
  @ApiPropertyOptional() avatarUrl: string | null
  @ApiProperty() email: string
}

export class MessageSummaryDto {
  @ApiProperty() id: string
  @ApiProperty() direction: string
  @ApiProperty() type: string
  @ApiPropertyOptional() content: string | null
  @ApiPropertyOptional() mediaUrl: string | null
  @ApiProperty() status: string
  @ApiProperty() createdAt: Date
}

export class ConversationResponseDto {
  @ApiProperty() id: string
  @ApiProperty() tenantId: string
  @ApiProperty() contactId: string
  @ApiPropertyOptional() assignedUserId: string | null
  @ApiPropertyOptional() departmentId: string | null
  @ApiProperty() channel: string
  @ApiProperty({ enum: ConversationStatusEnum }) status: ConversationStatusEnum
  @ApiPropertyOptional() subject: string | null
  @ApiProperty({ type: [String] }) tags: string[]
  @ApiPropertyOptional() pipelineStage: string | null
  @ApiPropertyOptional() pipelineValue: string | number | null
  @ApiProperty() isBot: boolean
  @ApiPropertyOptional() slaDeadline: Date | null
  @ApiProperty() slaBreached: boolean
  @ApiPropertyOptional() lastMessageAt: Date | null
  @ApiPropertyOptional() resolvedAt: Date | null
  @ApiProperty() createdAt: Date
  @ApiProperty() updatedAt: Date
  @ApiPropertyOptional({ type: ContactSummaryDto }) contact?: ContactSummaryDto
  @ApiPropertyOptional({ type: UserSummaryDto }) assignedUser?: UserSummaryDto | null
  @ApiPropertyOptional({ type: [MessageSummaryDto] }) messages?: MessageSummaryDto[]
}

export class PaginatedConversationsDto {
  @ApiProperty({ type: [ConversationResponseDto] }) data: ConversationResponseDto[]
  @ApiProperty() total: number
  @ApiProperty() page: number
  @ApiProperty() limit: number
  @ApiProperty() totalPages: number
}
