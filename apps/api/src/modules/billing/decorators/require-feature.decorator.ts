import { SetMetadata } from '@nestjs/common'
import { PlanFeature } from '../billing.constants'

export const REQUIRED_FEATURES_KEY = 'billing:required_features'
export const RequireFeature = (...features: PlanFeature[]) =>
  SetMetadata(REQUIRED_FEATURES_KEY, features)

