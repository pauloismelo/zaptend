import { create } from 'zustand'
import { reportsApi } from '@/lib/api/reports'
import type {
  AgentPerformance,
  HeatmapItem,
  ReportFilters,
  ReportsOverview,
  UnassignedConversation,
  VolumeItem,
} from '@/lib/api/reports'

interface ReportsState {
  overview: ReportsOverview | null
  volume: VolumeItem[]
  last24h: VolumeItem[]
  agents: AgentPerformance[]
  heatmap: HeatmapItem[]
  unassigned: UnassignedConversation[]
  filters: ReportFilters
  isLoading: boolean
  error: string | null

  setFilters: (filters: ReportFilters) => void
  fetchDashboard: () => Promise<void>
  fetchReports: () => Promise<void>
}

export const useReportsStore = create<ReportsState>((set, get) => ({
  overview: null,
  volume: [],
  last24h: [],
  agents: [],
  heatmap: [],
  unassigned: [],
  filters: { period: 'day' },
  isLoading: false,
  error: null,

  setFilters: (filters) => set({ filters }),

  fetchDashboard: async () => {
    set({ isLoading: true, error: null })
    try {
      const [overview, last24h, unassigned] = await Promise.all([
        reportsApi.overview(),
        reportsApi.last24h(),
        reportsApi.unassigned(),
      ])
      set({ overview, last24h, unassigned, isLoading: false })
    } catch (err) {
      set({ error: getErrorMessage(err, 'Erro ao carregar dashboard'), isLoading: false })
    }
  },

  fetchReports: async () => {
    set({ isLoading: true, error: null })
    try {
      const filters = get().filters
      const [overview, volume, agents, heatmap] = await Promise.all([
        reportsApi.overview(filters),
        reportsApi.volume(filters),
        reportsApi.agents(filters),
        reportsApi.heatmap(filters),
      ])
      set({ overview, volume, agents, heatmap, isLoading: false })
    } catch (err) {
      set({ error: getErrorMessage(err, 'Erro ao carregar relatórios'), isLoading: false })
    }
  },
}))

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message
  if (err && typeof err === 'object' && 'response' in err) {
    const response = (err as { response?: { data?: { message?: string } } }).response
    return response?.data?.message ?? fallback
  }
  return fallback
}
