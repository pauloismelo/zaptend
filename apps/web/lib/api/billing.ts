import { apiClient } from './client'

export type BillingPlan = 'starter' | 'growth' | 'pro' | 'enterprise' | 'trial'
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid'

export interface BillingUsageMetric {
  used: number
  limit: number
}

export interface BillingInvoice {
  id: string
  number: string
  amount: number
  currency: string
  status: 'paid' | 'open' | 'void' | 'uncollectible' | 'draft'
  hostedInvoiceUrl?: string
  paidAt?: string
  dueDate?: string
  createdAt: string
}

export interface BillingOverview {
  plan: BillingPlan
  status: SubscriptionStatus
  currentPeriodEnd?: string
  cancelAtPeriodEnd: boolean
  usage: {
    month: string
    conversations: BillingUsageMetric
    broadcasts: BillingUsageMetric
  }
  invoices: BillingInvoice[]
}

export interface CreateCheckoutSessionData {
  plan: Exclude<BillingPlan, 'enterprise' | 'trial'>
  successUrl: string
  cancelUrl: string
}

export interface CheckoutSessionResponse {
  id: string
  url: string
}

export const billingApi = {
  getOverview: () =>
    apiClient.get<BillingOverview>('/billing/overview').then((r) => r.data),

  createCheckoutSession: (data: CreateCheckoutSessionData) =>
    apiClient.post<CheckoutSessionResponse>('/billing/checkout-session', data).then((r) => r.data),

  cancelSubscription: () =>
    apiClient.post<BillingOverview>('/billing/cancel').then((r) => r.data),
}

