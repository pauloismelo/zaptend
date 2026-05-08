import { ApiProperty } from '@nestjs/swagger'
import { IsEnum, IsUrl } from 'class-validator'
import { BillingPlan } from '../billing.constants'

export enum CheckoutPlanDto {
  starter = 'starter',
  growth = 'growth',
  pro = 'pro',
}

export class CreateCheckoutSessionDto {
  @ApiProperty({ enum: CheckoutPlanDto, example: CheckoutPlanDto.growth })
  @IsEnum(CheckoutPlanDto)
  plan: BillingPlan

  @ApiProperty({ example: 'https://app.zaptend.com.br/billing/success' })
  @IsUrl({ require_tld: false })
  successUrl: string

  @ApiProperty({ example: 'https://app.zaptend.com.br/billing/cancel' })
  @IsUrl({ require_tld: false })
  cancelUrl: string
}

export class CheckoutSessionResponseDto {
  @ApiProperty({ example: 'cs_test_123' })
  id: string

  @ApiProperty({ example: 'https://checkout.stripe.com/c/pay/cs_test_123' })
  url: string
}
