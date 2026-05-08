import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type React from 'react'
import { ReportsPageClient } from './reports-page-client'
import { useReportsStore } from '@/stores/reports.store'

jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CartesianGrid: () => <div />,
  Line: () => <div />,
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
  const fetchReports = jest.fn()
  const setFilters = jest.fn()
  mockedUseReportsStore.mockReturnValue({
    overview: { openConversations: 4, averageAssignmentMinutes: 5, averageResolutionMinutes: 40, averageCsat: 4.2, onlineAgents: 2 },
    volume: [{ bucket: '2026-05-01', total: 10 }],
    agents: [{ agentId: 'u1', agentName: 'Ana', conversations: 7, averageAssignmentMinutes: 3, averageResolutionMinutes: 30, averageCsat: 4.8 }],
    heatmap: [{ dayOfWeek: 1, hour: 10, total: 4 }],
    filters: { period: 'day' },
    isLoading: false,
    error: null,
    setFilters,
    fetchReports,
    ...overrides,
  })
  return { fetchReports, setFilters }
}

describe('ReportsPageClient', () => {
  beforeEach(() => jest.clearAllMocks())

  it('renderiza relatórios, tabela de agentes e heatmap', () => {
    const { fetchReports } = setup()
    render(<ReportsPageClient />)

    expect(fetchReports).toHaveBeenCalled()
    expect(screen.getByTestId('reports-page')).toBeInTheDocument()
    expect(screen.getByText('Relatórios')).toBeInTheDocument()
    expect(screen.getByText('Ana')).toBeInTheDocument()
    expect(screen.getByTestId('heatmap-grid')).toBeInTheDocument()
  })

  it('altera filtro de período', async () => {
    const { setFilters } = setup()
    render(<ReportsPageClient />)

    await userEvent.selectOptions(screen.getByLabelText('Período'), 'week')

    await waitFor(() => {
      expect(setFilters).toHaveBeenCalledWith({ period: 'week' })
    })
  })
})
