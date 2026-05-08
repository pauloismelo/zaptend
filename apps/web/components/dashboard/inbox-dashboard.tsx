'use client'

import { useEffect } from 'react'
import { Activity, Clock, Loader2, MessageCircle, Star, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useReportsStore } from '@/stores/reports.store'

export function InboxDashboard() {
  const { overview, last24h, unassigned, isLoading, error, fetchDashboard } = useReportsStore()

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  return (
    <section className="border-b border-border bg-background p-4" data-testid="inbox-dashboard">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Visão geral</h1>
          <p className="text-sm text-muted-foreground">Métricas em tempo real do atendimento.</p>
        </div>
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>

      {error && <p className="mb-3 text-sm text-destructive">{error}</p>}

      <div className="grid gap-3 md:grid-cols-4">
        <MetricCard icon={MessageCircle} label="Abertas" value={overview?.openConversations ?? 0} />
        <MetricCard icon={Clock} label="TMA" value={`${overview?.averageAssignmentMinutes ?? 0} min`} />
        <MetricCard icon={Star} label="CSAT" value={(overview?.averageCsat ?? 0).toFixed(1)} />
        <MetricCard icon={Users} label="Agentes online" value={overview?.onlineAgents ?? 0} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="h-44 rounded-lg border border-border bg-card p-3">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
            <Activity className="h-4 w-4 text-primary" />
            Volume nas últimas 24h
          </div>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={last24h}>
              <XAxis dataKey="bucket" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="total" fill="#00B37E" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border border-border bg-card p-3">
          <h2 className="text-sm font-medium text-foreground">Aguardando atribuição</h2>
          <div className="mt-2 space-y-2" data-testid="unassigned-list">
            {unassigned.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma conversa na fila</p>}
            {unassigned.map((conversation) => (
              <div key={conversation.id} className="rounded-md bg-muted px-3 py-2">
                <p className="truncate text-sm font-medium text-foreground">
                  {conversation.contact?.name ?? conversation.contact?.phone ?? 'Contato'}
                </p>
                <p className="text-xs text-muted-foreground">{conversation.contact?.company ?? conversation.status}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function MetricCard({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="h-4 w-4 text-primary" />
        {label}
      </div>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  )
}
