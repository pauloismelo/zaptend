import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BillingPageClient } from './billing-page-client'
import { useBillingStore } from '@/stores/billing.store'
import type { BillingOverview } from '@/lib/api/billing'

jest.mock('@/stores/billing.store', () => ({
  useBillingStore: jest.fn(),
}))

const mockedUseStore = useBillingStore as jest.MockedFunction<typeof useBillingStore>

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
    invoices: [
      {
        id: 'in_1',
        number: 'INV-001',
        amount: 29700,
        currency: 'brl',
        status: 'paid',
        hostedInvoiceUrl: 'https://stripe.test/invoice',
        paidAt: '2026-05-08T00:00:00.000Z',
        createdAt: '2026-05-08T00:00:00.000Z',
      },
    ],
    ...overrides,
  }
}

function setupStore(overrides: Partial<ReturnType<typeof useBillingStore>> = {}) {
  const fetchOverview = jest.fn().mockResolvedValue(undefined)
  const startCheckout = jest.fn().mockResolvedValue({ id: 'cs_123', url: 'https://stripe.test/checkout' })
  const cancelSubscription = jest.fn().mockResolvedValue(undefined)

  mockedUseStore.mockReturnValue({
    overview: mockOverview(),
    isLoading: false,
    isCheckingOut: false,
    isCancelling: false,
    error: null,
    fetchOverview,
    startCheckout,
    cancelSubscription,
    clearError: jest.fn(),
    ...overrides,
  } as ReturnType<typeof useBillingStore>)

  return { fetchOverview, startCheckout, cancelSubscription }
}

describe('BillingPageClient', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    window.confirm = jest.fn().mockReturnValue(true)
  })

  it('carrega overview ao montar', () => {
    const { fetchOverview } = setupStore()
    render(<BillingPageClient slug="acme" />)
    expect(fetchOverview).toHaveBeenCalledTimes(1)
  })

  it('renderiza plano atual, renovação e uso mensal', () => {
    setupStore()
    render(<BillingPageClient slug="acme" />)

    expect(screen.getByText('Growth')).toBeInTheDocument()
    expect(screen.getByText('R$ 297/mês')).toBeInTheDocument()
    expect(screen.getByText('Ativa')).toBeInTheDocument()
    expect(screen.getByText('Conversas')).toBeInTheDocument()
    expect(screen.getByText('Broadcasts')).toBeInTheDocument()
    expect(screen.getByText('1.200')).toBeInTheDocument()
    expect(screen.getByText('3.000')).toBeInTheDocument()
    expect(screen.getByText('INV-001')).toBeInTheDocument()
  })

  it('mostra skeleton durante carregamento inicial', () => {
    setupStore({ overview: null, isLoading: true })
    render(<BillingPageClient slug="acme" />)
    expect(screen.getByTestId('billing-skeleton')).toBeInTheDocument()
  })

  it('mostra erro quando não há overview', () => {
    setupStore({ overview: null, isLoading: false, error: 'Erro de rede' })
    render(<BillingPageClient slug="acme" />)
    expect(screen.getByTestId('billing-error')).toBeInTheDocument()
    expect(screen.getByText('Erro de rede')).toBeInTheDocument()
  })

  it('inicia checkout ao clicar em upgrade', async () => {
    const { startCheckout } = setupStore()
    render(<BillingPageClient slug="acme" />)

    await userEvent.click(screen.getByRole('button', { name: /Pro R\$ 697\/mês/i }))

    await waitFor(() => {
      expect(startCheckout).toHaveBeenCalledWith('pro', 'acme')
    })
  })

  it('cancela assinatura após confirmação', async () => {
    const { cancelSubscription } = setupStore()
    render(<BillingPageClient slug="acme" />)

    await userEvent.click(screen.getByRole('button', { name: /Cancelar assinatura/i }))

    expect(window.confirm).toHaveBeenCalled()
    expect(cancelSubscription).toHaveBeenCalled()
  })

  it('desabilita cancelamento quando já está agendado', () => {
    setupStore({ overview: mockOverview({ cancelAtPeriodEnd: true }) })
    render(<BillingPageClient slug="acme" />)

    expect(screen.getByRole('button', { name: /Cancelamento agendado/i })).toBeDisabled()
    expect(screen.getByText('A assinatura será encerrada na renovação.')).toBeInTheDocument()
  })

  it('mostra estado vazio de faturas', () => {
    setupStore({ overview: mockOverview({ invoices: [] }) })
    render(<BillingPageClient slug="acme" />)
    expect(screen.getByTestId('empty-invoices')).toBeInTheDocument()
  })
})

