import { apiClient } from './client'

export interface ReportsOverview {
  openConversations: number
  averageAssignmentMinutes: number
  averageResolutionMinutes: number
  averageCsat: number
  onlineAgents: number
}

export interface VolumeItem {
  bucket: string
  total: number
  departmentId?: string | null
  agentId?: string | null
}

export interface AgentPerformance {
  agentId: string
  agentName: string
  conversations: number
  averageAssignmentMinutes: number
  averageResolutionMinutes: number
  averageCsat: number
}

export interface HeatmapItem {
  dayOfWeek: number
  hour: number
  total: number
}

export interface UnassignedConversation {
  id: string
  status: string
  lastMessageAt: string | null
  contact?: { id: string; name: string | null; phone: string; company: string | null }
}

export interface ReportFilters {
  startDate?: string
  endDate?: string
  period?: 'day' | 'week' | 'month'
}

export const reportsApi = {
  async overview(filters: ReportFilters = {}) {
    const { data } = await apiClient.get<ReportsOverview>('/reports/overview', { params: filters })
    return data
  },

  async volume(filters: ReportFilters = {}) {
    const { data } = await apiClient.get<VolumeItem[]>('/reports/volume', { params: filters })
    return data
  },

  async agents(filters: ReportFilters = {}) {
    const { data } = await apiClient.get<AgentPerformance[]>('/reports/agents', { params: filters })
    return data
  },

  async heatmap(filters: ReportFilters = {}) {
    const { data } = await apiClient.get<HeatmapItem[]>('/reports/heatmap', { params: filters })
    return data
  },

  async last24h() {
    const { data } = await apiClient.get<VolumeItem[]>('/reports/last-24h', { params: { hours: 24 } })
    return data
  },

  async unassigned() {
    const { data } = await apiClient.get<UnassignedConversation[]>('/reports/unassigned')
    return data
  },
}
