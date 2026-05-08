import { render, screen } from '@testing-library/react'
import type React from 'react'
import { InboxDashboard } from './inbox-dashboard'
import { useReportsStore } from '@/stores/reports.store'

jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Bar: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  Tooltip: () => <div />,
}))

jest.mock('@/stores/reports.store', () => ({
  useReportsStore: jest.fn(),
}))

const mockedUseReportsStore = useReportsStore as unknown as jest.Mock

function setup(overrides: Partial<ReturnType<typeof useReportsStore>> = {}) {
  const fetchDashboard = jest.fn()
  mockedUseReportsStore.mockReturnValue({
    overview: { openConversations: 8, averageAssignmentMinutes: 4, averageResolutionMinutes: 30, averageCsat: 4.7, onlineAgents: 3 },
    last24h: [{ bucket: '10:00', total: 2 }],
    unassigned: [{ id: 'conv-1', status: 'open', lastMessageAt: null, contact: { id: 'c1', name: 'Ana', phone: '55', company: 'ACME' } }],
    isLoading: false,
    error: null,
    fetchDashboard,
    ...overrides,
  })
  return { fetchDashboard }
}

describe('InboxDashboard', () => {
  beforeEach(() => jest.clearAllMocks())

  it('renderiza métricas e conversas aguardando atribuição', () => {
    const { fetchDashboard } = setup()
    render(<InboxDashboard />)

    expect(fetchDashboard).toHaveBeenCalled()
    expect(screen.getByTestId('inbox-dashboard')).toBeInTheDocument()
    expect(screen.getByText('Abertas')).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument()
    expect(screen.getByText('Ana')).toBeInTheDocument()
  })

  it('mostra erro do store', () => {
    setup({ error: 'Falha' })
    render(<InboxDashboard />)
    expect(screen.getByText('Falha')).toBeInTheDocument()
  })
})
