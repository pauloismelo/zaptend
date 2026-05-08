import { act } from 'react'
import { reportsApi } from '@/lib/api/reports'
import { useReportsStore } from './reports.store'

jest.mock('@/lib/api/reports', () => ({
  reportsApi: {
    overview: jest.fn(),
    volume: jest.fn(),
    agents: jest.fn(),
    heatmap: jest.fn(),
    last24h: jest.fn(),
    unassigned: jest.fn(),
  },
}))

const mockedApi = reportsApi as jest.Mocked<typeof reportsApi>

function resetStore() {
  useReportsStore.setState({
    overview: null,
    volume: [],
    last24h: [],
    agents: [],
    heatmap: [],
    unassigned: [],
    filters: { period: 'day' },
    isLoading: false,
    error: null,
  })
}

describe('useReportsStore', () => {
  beforeEach(() => {
    resetStore()
    jest.clearAllMocks()
  })

  it('carrega dashboard', async () => {
    mockedApi.overview.mockResolvedValue({ openConversations: 4, averageAssignmentMinutes: 3, averageResolutionMinutes: 20, averageCsat: 4.5, onlineAgents: 2 })
    mockedApi.last24h.mockResolvedValue([{ bucket: '10:00', total: 2 }])
    mockedApi.unassigned.mockResolvedValue([{ id: 'conv-1', status: 'open', lastMessageAt: null }])

    await act(async () => {
      await useReportsStore.getState().fetchDashboard()
    })

    expect(useReportsStore.getState().overview?.openConversations).toBe(4)
    expect(useReportsStore.getState().last24h).toHaveLength(1)
    expect(useReportsStore.getState().unassigned).toHaveLength(1)
  })

  it('carrega relatórios com filtros', async () => {
    mockedApi.overview.mockResolvedValue({ openConversations: 1, averageAssignmentMinutes: 1, averageResolutionMinutes: 2, averageCsat: 5, onlineAgents: 1 })
    mockedApi.volume.mockResolvedValue([{ bucket: '2026-05-01', total: 2 }])
    mockedApi.agents.mockResolvedValue([{ agentId: 'u1', agentName: 'Ana', conversations: 2, averageAssignmentMinutes: 1, averageResolutionMinutes: 2, averageCsat: 5 }])
    mockedApi.heatmap.mockResolvedValue([{ dayOfWeek: 1, hour: 10, total: 2 }])
    useReportsStore.getState().setFilters({ period: 'week' })

    await act(async () => {
      await useReportsStore.getState().fetchReports()
    })

    expect(mockedApi.volume).toHaveBeenCalledWith({ period: 'week' })
    expect(useReportsStore.getState().agents[0].agentName).toBe('Ana')
  })
})
