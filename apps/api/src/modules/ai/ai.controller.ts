import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger'
import { JwtPayload } from '@zaptend/types'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { Roles } from '../../common/decorators/roles.decorator'
import { RequireFeature } from '../billing/decorators/require-feature.decorator'
import { PlanGuard } from '../billing/guards/plan.guard'
import { AiFacadeService } from './ai-facade.service'
import {
  AiIntentResponseDto,
  AiSuggestDto,
  AiSuggestionResponseDto,
  AiSummaryResponseDto,
  MoodItemDto,
} from './dto/ai.dto'

@ApiTags('AI')
@ApiBearerAuth()
@Controller('conversations/:id')
export class AiController {
  constructor(private readonly facade: AiFacadeService) {}

  @Get('mood')
  @Roles('agent', 'supervisor', 'admin', 'owner')
  @ApiOperation({ summary: 'Histórico de sentimentos da conversa' })
  @ApiParam({ name: 'id', description: 'ID da conversa' })
  @ApiResponse({ status: 200, type: [MoodItemDto] })
  mood(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.facade.getMood(id, user.tenantId)
  }

  @Post('ai/suggest')
  @Roles('agent', 'supervisor', 'admin', 'owner')
  @UseGuards(PlanGuard)
  @RequireFeature('aiCopilot')
  @ApiOperation({ summary: 'Sugerir resposta com AI Co-Pilot' })
  @ApiParam({ name: 'id', description: 'ID da conversa' })
  @ApiBody({ type: AiSuggestDto })
  @ApiResponse({ status: 201, type: AiSuggestionResponseDto })
  suggest(@Param('id') id: string, @CurrentUser() user: JwtPayload, @Body() dto: AiSuggestDto) {
    return this.facade.suggestReply(id, user.tenantId, dto)
  }

  @Post('ai/summarize')
  @Roles('agent', 'supervisor', 'admin', 'owner')
  @UseGuards(PlanGuard)
  @RequireFeature('aiCopilot')
  @ApiOperation({ summary: 'Resumir conversa em 3 bullets' })
  @ApiParam({ name: 'id', description: 'ID da conversa' })
  @ApiResponse({ status: 201, type: AiSummaryResponseDto })
  summarize(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.facade.summarize(id, user.tenantId)
  }

  @Post('ai/intent')
  @Roles('agent', 'supervisor', 'admin', 'owner')
  @UseGuards(PlanGuard)
  @RequireFeature('aiCopilot')
  @ApiOperation({ summary: 'Detectar intenção principal da conversa' })
  @ApiParam({ name: 'id', description: 'ID da conversa' })
  @ApiResponse({ status: 201, type: AiIntentResponseDto })
  intent(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.facade.detectIntent(id, user.tenantId)
  }
}
