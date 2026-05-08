import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common'
import { RawBodyRequest } from '@nestjs/common'
import { Request } from 'express'
import {
  ApiBearerAuth,
  ApiBody,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { SkipThrottle } from '@nestjs/throttler'
import { BillingService } from './billing.service'
import { UsageService } from './usage.service'
import { PlanGuard } from './guards/plan.guard'
import { RequireFeature } from './decorators/require-feature.decorator'
import {
  CheckoutSessionResponseDto,
  CreateCheckoutSessionDto,
} from './dto/create-checkout-session.dto'
import { RecordUsageDto, UsageLimitResponseDto } from './dto/usage.dto'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { Public } from '../../common/decorators/public.decorator'
import { Roles } from '../../common/decorators/roles.decorator'
import { JwtPayload } from '@zaptend/types'

@ApiTags('Billing')
@Controller('billing')
export class BillingController {
  constructor(
    private readonly billingService: BillingService,
    private readonly usageService: UsageService,
  ) {}

  @Post('checkout-session')
  @Roles('admin', 'owner')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Criar sessão de checkout Stripe',
    description: 'Cria uma sessão de assinatura para os planos Starter, Growth ou Pro com trial de 14 dias.',
  })
  @ApiBody({ type: CreateCheckoutSessionDto })
  @ApiResponse({ status: 201, description: 'Sessão criada', type: CheckoutSessionResponseDto })
  @ApiResponse({ status: 404, description: 'Tenant não encontrado' })
  createCheckoutSession(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateCheckoutSessionDto,
  ): Promise<CheckoutSessionResponseDto> {
    return this.billingService.createCheckoutSession(user.tenantId, dto)
  }

  @Get('overview')
  @Roles('admin', 'owner')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resumo de billing do tenant' })
  @ApiResponse({ status: 200, description: 'Plano, uso mensal e histórico de faturas' })
  getOverview(@CurrentUser() user: JwtPayload) {
    return this.billingService.getOverview(user.tenantId)
  }

  @Post('cancel')
  @Roles('admin', 'owner')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancelar assinatura ao fim do período atual' })
  @ApiResponse({ status: 201, description: 'Cancelamento agendado' })
  cancelSubscription(@CurrentUser() user: JwtPayload) {
    return this.billingService.cancelSubscription(user.tenantId)
  }

  @Post('usage/conversations')
  @Roles('admin', 'owner')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Registrar uso de conversas',
    description: 'Incrementa o UsageRecord mensal de conversas e valida o limite do plano.',
  })
  @ApiBody({ type: RecordUsageDto })
  @ApiResponse({ status: 201, description: 'Uso registrado', type: UsageLimitResponseDto })
  @ApiResponse({ status: 403, description: 'Limite mensal excedido ou assinatura inativa' })
  recordConversationUsage(
    @CurrentUser() user: JwtPayload,
    @Body() dto: RecordUsageDto,
  ): Promise<UsageLimitResponseDto> {
    return this.usageService.recordConversation(user.tenantId, dto.quantity ?? 1)
  }

  @UseGuards(PlanGuard)
  @RequireFeature('broadcasts')
  @Post('usage/broadcasts')
  @Roles('admin', 'owner')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Registrar uso de broadcasts',
    description: 'Endpoint premium: exige feature broadcasts, incrementa UsageRecord mensal e valida limite do plano.',
  })
  @ApiBody({ type: RecordUsageDto })
  @ApiResponse({ status: 201, description: 'Uso registrado', type: UsageLimitResponseDto })
  @ApiResponse({ status: 403, description: 'Feature indisponível, limite excedido ou assinatura inativa' })
  recordBroadcastUsage(
    @CurrentUser() user: JwtPayload,
    @Body() dto: RecordUsageDto,
  ): Promise<UsageLimitResponseDto> {
    return this.usageService.recordBroadcast(user.tenantId, dto.quantity ?? 1)
  }

  @Get('usage/conversations/limit')
  @Roles('admin', 'owner')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verificar limite mensal de conversas' })
  @ApiResponse({ status: 200, description: 'Status do limite', type: UsageLimitResponseDto })
  checkConversationLimit(
    @CurrentUser() user: JwtPayload,
  ): Promise<UsageLimitResponseDto> {
    return this.usageService.assertWithinLimit(user.tenantId, 'conversations')
  }

  @UseGuards(PlanGuard)
  @RequireFeature('broadcasts')
  @Get('usage/broadcasts/limit')
  @Roles('admin', 'owner')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verificar limite mensal de broadcasts' })
  @ApiResponse({ status: 200, description: 'Status do limite', type: UsageLimitResponseDto })
  @ApiResponse({ status: 403, description: 'Feature indisponível, limite excedido ou assinatura inativa' })
  checkBroadcastLimit(
    @CurrentUser() user: JwtPayload,
  ): Promise<UsageLimitResponseDto> {
    return this.usageService.assertWithinLimit(user.tenantId, 'broadcasts')
  }

  @UseGuards(PlanGuard)
  @RequireFeature('flowBuilder')
  @Get('features/flow-builder')
  @Roles('admin', 'owner')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Verificar acesso ao Flow Builder',
    description: 'Endpoint premium protegido por @RequireFeature("flowBuilder").',
  })
  @ApiResponse({ status: 200, description: 'Feature disponível' })
  checkFlowBuilderAccess(): { feature: 'flowBuilder'; allowed: true } {
    return { feature: 'flowBuilder', allowed: true }
  }

  @UseGuards(PlanGuard)
  @RequireFeature('apiAccess')
  @Get('features/api-access')
  @Roles('admin', 'owner')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Verificar acesso à API pública',
    description: 'Endpoint premium protegido por @RequireFeature("apiAccess").',
  })
  @ApiResponse({ status: 200, description: 'Feature disponível' })
  checkApiAccess(): { feature: 'apiAccess'; allowed: true } {
    return { feature: 'apiAccess', allowed: true }
  }

  @Public()
  @SkipThrottle()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Receber webhooks Stripe',
    description:
      'Valida a assinatura Stripe e processa eventos de checkout, assinatura e pagamento com idempotência.',
  })
  @ApiHeader({
    name: 'stripe-signature',
    description: 'Assinatura Stripe do payload bruto',
    required: true,
  })
  @ApiResponse({ status: 200, description: 'Evento recebido' })
  @ApiResponse({ status: 400, description: 'Assinatura inválida ou payload sem tenantId' })
  handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ): Promise<{ received: true }> {
    return this.billingService.handleWebhook(req.rawBody ?? Buffer.from(''), signature)
  }
}
