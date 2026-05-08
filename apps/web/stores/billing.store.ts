import { create } from 'zustand'
import { billingApi } from '@/lib/api/billing'
import type {
  BillingOverview,
  BillingPlan,
  CheckoutSessionResponse,
} from '@/lib/api/billing'

type UpgradePlan = Exclude<BillingPlan, 'enterprise' | 'trial'>

interface BillingState {
  overview: BillingOverview | null
  isLoading: boolean
  isCheckingOut: boolean
  isCancelling: boolean
  error: string | null

  fetchOverview: () => Promise<void>
  startCheckout: (plan: UpgradePlan, slug: string) => Promise<CheckoutSessionResponse>
  cancelSubscription: () => Promise<void>
  clearError: () => void
}

export const useBillingStore = create<BillingState>((set) => ({
  overview: null,
  isLoading: false,
  isCheckingOut: false,
  isCancelling: false,
  error: null,

  fetchOverview: async () => {
    set({ isLoading: true, error: null })
    try {
      const overview = await billingApi.getOverview()
      set({ overview, isLoading: false })
    } catch (err) {
      set({ error: getErrorMessage(err, 'Erro ao carregar faturamento'), isLoading: false })
    }
  },

  startCheckout: async (plan, slug) => {
    set({ isCheckingOut: true, error: null })
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const session = await billingApi.createCheckoutSession({
        plan,
        successUrl: `${origin}/${slug}/settings/billing?checkout=success`,
        cancelUrl: `${origin}/${slug}/settings/billing?checkout=cancel`,
      })
      set({ isCheckingOut: false })

      if (typeof window !== 'undefined') {
        window.location.assign(session.url)
      }

      return session
    } catch (err) {
      set({ error: getErrorMessage(err, 'Erro ao iniciar checkout'), isCheckingOut: false })
      throw err
    }
  },

  cancelSubscription: async () => {
    set({ isCancelling: true, error: null })
    try {
      const overview = await billingApi.cancelSubscription()
      set({ overview, isCancelling: false })
    } catch (err) {
      set({ error: getErrorMessage(err, 'Erro ao cancelar assinatura'), isCancelling: false })
      throw err
    }
  },

  clearError: () => set({ error: null }),
}))

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message
  if (err && typeof err === 'object' && 'response' in err) {
    const response = (err as { response?: { data?: { message?: string } } }).response
    return response?.data?.message ?? fallback
  }
  return fallback
}

