'use client'

import { useEffect } from 'react'
import type React from 'react'
import { BarChart3, Calendar, Loader2, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useReportsStore } from '@/stores/reports.store'

export function ReportsPageClient() {
  const {
    overview,
    volume,
    agents,
    heatmap,
    filters,
    isLoading,
    error,
    setFilters,
    fetchReports,
  } = useReportsStore()

  useEffect(() => {
    fetchReports()
  }, [fetchReports, filters])

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 p-4 md:p-6" data-testid="reports-page">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Relatórios</h1>
          <p className="text-sm text-muted-foreground">Volume, performance dos agentes e mapa de calor.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <input
            aria-label="Início"
            type="date"
            value={filters.startDate?.slice(0, 10) ?? ''}
            onChange={(event) => setFilters({ ...filters, startDate: toIsoStart(event.target.value) })}
            className="h-8 rounded-md border border-input bg-background px-2 text-sm"
          />
          <input
            aria-label="Fim"
            type="date"
            value={filters.endDate?.slice(0, 10) ?? ''}
            onChange={(event) => setFilters({ ...filters, endDate: toIsoEnd(event.target.value) })}
            className="h-8 rounded-md border border-input bg-background px-2 text-sm"
          />
          <select
            aria-label="Período"
            value={filters.period ?? 'day'}
            onChange={(event) => setFilters({ ...filters, period: event.target.value as 'day' | 'week' | 'month' })}
            className="h-8 rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="day">Dia</option>
            <option value="week">Semana</option>
            <option value="month">Mês</option>
          </select>
        </div>
      </div>

      {error && <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      {isLoading && <p className="inline-flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando relatórios</p>}

      <section className="grid gap-3 md:grid-cols-4">
        <ReportMetric label="Abertas" value={overview?.openConversations ?? 0} />
        <ReportMetric label="TMA" value={`${overview?.averageAssignmentMinutes ?? 0} min`} />
        <ReportMetric label="TMR" value={`${overview?.averageResolutionMinutes ?? 0} min`} />
        <ReportMetric label="CSAT" value={(overview?.averageCsat ?? 0).toFixed(1)} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <ChartPanel title="Volume" icon={BarChart3}>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={volume}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="bucket" fontSize={12} />
              <YAxis allowDecimals={false} fontSize={12} />
              <Tooltip />
              <Line type="monotone" dataKey="total" stroke="#00B37E" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="Heatmap" icon={Calendar}>
          <div className="grid grid-cols-6 gap-2" data-testid="heatmap-grid">
            {heatmap.map((item) => (
              <div
                key={`${item.dayOfWeek}-${item.hour}`}
                className="rounded-md bg-primary/10 p-2 text-center text-xs text-primary"
                title={`Dia ${item.dayOfWeek}, ${item.hour}h`}
              >
                <div className="font-semibold">{item.total}</div>
                <div>{item.hour}h</div>
              </div>
            ))}
            {heatmap.length === 0 && <p className="col-span-6 text-sm text-muted-foreground">Sem dados no período</p>}
          </div>
        </ChartPanel>
      </section>

      <section className="rounded-lg border border-border bg-card">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Users className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Performance por agente</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-muted text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Agente</th>
                <th className="px-4 py-2 font-medium">Conversas</th>
                <th className="px-4 py-2 font-medium">TMA</th>
                <th className="px-4 py-2 font-medium">TMR</th>
                <th className="px-4 py-2 font-medium">CSAT</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((agent) => (
                <tr key={agent.agentId} className="border-t border-border">
                  <td className="px-4 py-2 font-medium text-foreground">{agent.agentName}</td>
                  <td className="px-4 py-2">{agent.conversations}</td>
                  <td className="px-4 py-2">{agent.averageAssignmentMinutes} min</td>
                  <td className="px-4 py-2">{agent.averageResolutionMinutes} min</td>
                  <td className="px-4 py-2">{agent.averageCsat.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function ReportMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  )
}

function ChartPanel({ title, icon: Icon, children }: { title: string; icon: LucideIcon; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
        <Icon className="h-4 w-4 text-primary" />
        {title}
      </div>
      {children}
    </div>
  )
}

function toIsoStart(value: string) {
  return value ? `${value}T00:00:00.000Z` : undefined
}

function toIsoEnd(value: string) {
  return value ? `${value}T23:59:59.999Z` : undefined
}
