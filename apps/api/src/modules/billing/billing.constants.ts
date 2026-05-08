export const STRIPE_CLIENT = Symbol('STRIPE_CLIENT')
export const BILLING_TRIAL_DAYS = 14

export const BILLING_PLANS = {
  starter: {
    name: 'ZapTend Starter',
    amount: 9700,
    envPriceKey: 'STRIPE_PRICE_STARTER',
  },
  growth: {
    name: 'ZapTend Growth',
    amount: 29700,
    envPriceKey: 'STRIPE_PRICE_GROWTH',
  },
  pro: {
    name: 'ZapTend Pro',
    amount: 69700,
    envPriceKey: 'STRIPE_PRICE_PRO',
  },
} as const

export type BillingPlan = keyof typeof BILLING_PLANS

export const PLAN_FEATURES = {
  starter: {
    maxAgents: 3,
    maxConversations: 500,
    broadcasts: false,
    broadcastsLimit: 0,
    aiCopilot: false,
    flowBuilder: false,
    apiAccess: false,
  },
  growth: {
    maxAgents: 10,
    maxConversations: 2000,
    broadcasts: true,
    broadcastsLimit: 10000,
    aiCopilot: 'basic',
    flowBuilder: true,
    apiAccess: false,
  },
  pro: {
    maxAgents: Infinity,
    maxConversations: 10000,
    broadcasts: true,
    broadcastsLimit: 50000,
    aiCopilot: 'full',
    flowBuilder: true,
    apiAccess: true,
  },
} as const

export type PlanFeature = Exclude<keyof typeof PLAN_FEATURES.starter, 'maxAgents' | 'maxConversations' | 'broadcastsLimit'>
export type UsageMetric = 'conversations' | 'broadcasts'

export type StripeSubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'incomplete'
  | 'incomplete_expired'
  | 'paused'

export const ACTIVE_SUBSCRIPTION_STATUSES: StripeSubscriptionStatus[] = [
  'active',
  'trialing',
]
