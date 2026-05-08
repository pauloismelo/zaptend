import { act } from 'react'
import { useBillingStore } from './billing.store'
import { billingApi } from '@/lib/api/billing'
import type { BillingOverview } from '@/lib/api/billing'

jest.mock('@/lib/api/billing', () => ({
  billingApi: {
    getOverview: jest.fn(),
    createCheckoutSession: jest.fn(),
    cancelSubscription: jest.fn(),
  },
}))

const mockedApi = billingApi as jest.Mocked<typeof billingApi>

function mockOverview(overrides: Partial<BillingOverview> = {}): BillingOverview {
  return {
    plan: 'growth',
    status: 'active',
    currentPeriodEnd: '2026-06-08T00:00:00.000Z',
    cancelAtPeriodEnd: false,
    usage: {
      month: '2026-05',
      conversations: { used: 1200, limit: 2000 },
      broadcasts: { used: 3000, limit: 10000 },
    },
    invoices: [],
    ...overrides,
  }
}

function resetStore() {
  useBillingStore.setState({
    overview: null,
    isLoading: false,
    isCheckingOut: false,
    isCancelling: false,
    error: null,
  })
}

describe('useBillingStore', () => {
  const originalLocation = window.location

  beforeEach(() => {
    resetStore()
    jest.clearAllMocks()
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, origin: 'https://acme.zaptend.com.br', assign: jest.fn() },
    })
  })

  afterAll(() => {
    Object.defineProperty(window, 'location', { configurable: true, value: originalLocation })
  })

  it('carrega overview de billing', async () => {
    const overview = mockOverview()
    mockedApi.getOverview.mockResolvedValue(overview)

    await act(async () => {
      await useBillingStore.getState().fetchOverview()
    })

    expect(useBillingStore.getState().overview).toEqual(overview)
    expect(useBillingStore.getState().isLoading).toBe(false)
    expect(useBillingStore.getState().error).toBeNull()
  })

  it('define erro quando fetchOverview falha', async () => {
    mockedApi.getOverview.mockRejectedValue(new Error('Falha de rede'))

    await act(async () => {
      await useBillingStore.getState().fetchOverview()
    })

    expect(useBillingStore.getState().error).toBe('Falha de rede')
    expect(useBillingStore.getState().isLoading).toBe(false)
  })

  it('cria checkout session e redireciona para Stripe', async () => {
    mockedApi.createCheckoutSession.mockResolvedValue({
      id: 'cs_123',
      url: 'https://checkout.stripe.com/c/pay/cs_123',
    })

    await act(async () => {
      await useBillingStore.getState().startCheckout('pro', 'acme')
    })

    expect(mockedApi.createCheckoutSession).toHaveBeenCalledWith({
      plan: 'pro',
      successUrl: 'https://acme.zaptend.com.br/acme/settings/billing?checkout=success',
      cancelUrl: 'https://acme.zaptend.com.br/acme/settings/billing?checkout=cancel',
    })
    expect(window.location.assign).toHaveBeenCalledWith('https://checkout.stripe.com/c/pay/cs_123')
    expect(useBillingStore.getState().isCheckingOut).toBe(false)
  })

  it('atualiza overview ao cancelar assinatura', async () => {
    const overview = mockOverview({ cancelAtPeriodEnd: true })
    mockedApi.cancelSubscription.mockResolvedValue(overview)

    await act(async () => {
      await useBillingStore.getState().cancelSubscription()
    })

    expect(useBillingStore.getState().overview?.cancelAtPeriodEnd).toBe(true)
    expect(useBillingStore.getState().isCancelling).toBe(false)
  })

  it('limpa erro', () => {
    useBillingStore.setState({ error: 'Erro' })
    useBillingStore.getState().clearError()
    expect(useBillingStore.getState().error).toBeNull()
  })
})

