'use client'

import { useEffect } from 'react'
import {
  AlertCircle,
  ArrowUpRight,
  Ban,
  CheckCircle2,
  CreditCard,
  FileText,
  Loader2,
  Megaphone,
  MessageCircle,
  RefreshCw,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useBillingStore } from '@/stores/billing.store'
import type { BillingInvoice, BillingOverview, BillingPlan } from '@/lib/api/billing'
import { cn } from '@/lib/utils'

interface BillingPageClientProps {
  slug: string
}

const PLAN_LABELS: Record<BillingPlan, string> = {
  starter: 'Starter',
  growth: 'Growth',
  pro: 'Pro',
  enterprise: 'Enterprise',
  trial: 'Trial',
}

const PLAN_PRICES: Partial<Record<BillingPlan, string>> = {
  starter: 'R$ 97/mês',
  growth: 'R$ 297/mês',
  pro: 'R$ 697/mês',
  enterprise: 'Sob consulta',
  trial: '14 dias grátis',
}

const STATUS_LABELS: Record<BillingOverview['status'], string> = {
  active: 'Ativa',
  trialing: 'Em trial',
  past_due: 'Pagamento pendente',
  canceled: 'Cancelada',
  unpaid: 'Inadimplente',
}

export function BillingPageClient({ slug }: BillingPageClientProps) {
  const {
    overview,
    isLoading,
    isCheckingOut,
    isCancelling,
    error,
    fetchOverview,
    startCheckout,
    cancelSubscription,
  } = useBillingStore()

  useEffect(() => {
    fetchOverview()
  }, [fetchOverview])

  const handleCancel = async () => {
    if (window.confirm('Deseja cancelar a assinatura ao final do período atual?')) {
      await cancelSubscription()
    }
  }

  if (isLoading && !overview) {
    return <BillingSkeleton />
  }

  if (error && !overview) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div
          data-testid="billing-error"
          className="w-full max-w-md rounded-lg border border-border bg-card p-5 text-center"
        >
          <AlertCircle className="mx-auto mb-3 h-8 w-8 text-destructive" />
          <h1 className="text-base font-semibold text-foreground">Não foi possível carregar o billing</h1>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
          <button
            type="button"
            onClick={fetchOverview}
            className="mt-4 inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
          >
            <RefreshCw className="h-4 w-4" />
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  if (!overview) return null

  const upgradePlans: Array<Exclude<BillingPlan, 'enterprise' | 'trial'>> = ['starter', 'growth', 'pro']
  const availableUpgradePlans = upgradePlans.filter((plan) => plan !== overview.plan)

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4 md:p-6" data-testid="billing-page">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Billing</h1>
          <p className="text-sm text-muted-foreground">Plano, consumo mensal, faturas e assinatura.</p>
        </div>
        <button
          type="button"
          onClick={fetchOverview}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground hover:bg-accent"
        >
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <PlanSummary overview={overview} />
        <UpgradePanel
          currentPlan={overview.plan}
          plans={availableUpgradePlans}
          isCheckingOut={isCheckingOut}
          onUpgrade={(plan) => startCheckout(plan, slug)}
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <UsageCard
          icon={MessageCircle}
          label="Conversas"
          used={overview.usage.conversations.used}
          limit={overview.usage.conversations.limit}
          month={overview.usage.month}
        />
        <UsageCard
          icon={Megaphone}
          label="Broadcasts"
          used={overview.usage.broadcasts.used}
          limit={overview.usage.broadcasts.limit}
          month={overview.usage.month}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <InvoicesTable invoices={overview.invoices} />
        <SubscriptionActions
          overview={overview}
          isCancelling={isCancelling}
          onCancel={handleCancel}
        />
      </section>
    </div>
  )
}

function PlanSummary({ overview }: { overview: BillingOverview }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Plano atual</h2>
          </div>
          <div className="mt-4 flex flex-wrap items-end gap-x-3 gap-y-2">
            <span className="text-3xl font-semibold text-foreground">{PLAN_LABELS[overview.plan]}</span>
            <span className="pb-1 text-sm text-muted-foreground">{PLAN_PRICES[overview.plan]}</span>
          </div>
        </div>
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
            overview.status === 'active' || overview.status === 'trialing'
              ? 'bg-primary/10 text-primary'
              : 'bg-destructive/10 text-destructive',
          )}
        >
          {STATUS_LABELS[overview.status]}
        </span>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <InfoRow label="Renovação" value={overview.currentPeriodEnd ? formatDate(overview.currentPeriodEnd) : 'Sem renovação'} />
        <InfoRow label="Cancelamento" value={overview.cancelAtPeriodEnd ? 'Agendado' : 'Não agendado'} />
      </div>
    </div>
  )
}

function UpgradePanel({
  currentPlan,
  plans,
  isCheckingOut,
  onUpgrade,
}: {
  currentPlan: BillingPlan
  plans: Array<Exclude<BillingPlan, 'enterprise' | 'trial'>>
  isCheckingOut: boolean
  onUpgrade: (plan: Exclude<BillingPlan, 'enterprise' | 'trial'>) => void
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h2 className="text-sm font-semibold text-foreground">Upgrade</h2>
      <p className="mt-1 text-sm text-muted-foreground">Mude de plano pelo checkout seguro da Stripe.</p>
      <div className="mt-4 flex flex-col gap-2">
        {plans.map((plan) => (
          <button
            key={plan}
            type="button"
            disabled={isCheckingOut}
            onClick={() => onUpgrade(plan)}
            className="flex h-11 items-center justify-between rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span>{PLAN_LABELS[plan]}</span>
            <span className="flex items-center gap-2 text-muted-foreground">
              {PLAN_PRICES[plan]}
              {isCheckingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUpRight className="h-4 w-4" />}
            </span>
          </button>
        ))}
        {plans.length === 0 && (
          <div className="rounded-md border border-border bg-background px-3 py-3 text-sm text-muted-foreground">
            Você já está no plano {PLAN_LABELS[currentPlan]}.
          </div>
        )}
      </div>
    </div>
  )
}

function UsageCard({
  icon: Icon,
  label,
  used,
  limit,
  month,
}: {
  icon: LucideIcon
  label: string
  used: number
  limit: number
  month: string
}) {
  const percentage = limit > 0 ? Math.min(Math.round((used / limit) * 100), 100) : 0
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">{label}</h2>
        </div>
        <span className="text-xs text-muted-foreground">{formatMonth(month)}</span>
      </div>
      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <span className="text-2xl font-semibold text-foreground">{formatNumber(used)}</span>
          <span className="ml-1 text-sm text-muted-foreground">/ {formatNumber(limit)}</span>
        </div>
        <span className="text-sm font-medium text-muted-foreground">{percentage}%</span>
      </div>
      <progress
        className={cn(
          'mt-3 h-2 w-full overflow-hidden rounded-full [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:rounded-full [&::-moz-progress-bar]:rounded-full',
          percentage >= 90
            ? '[&::-webkit-progress-value]:bg-destructive [&::-moz-progress-bar]:bg-destructive'
            : percentage >= 75
              ? '[&::-webkit-progress-value]:bg-primary/70 [&::-moz-progress-bar]:bg-primary/70'
              : '[&::-webkit-progress-value]:bg-primary [&::-moz-progress-bar]:bg-primary',
        )}
        value={percentage}
        max={100}
        aria-label={`Uso de ${label}`}
      />
    </div>
  )
}

function InvoicesTable({ invoices }: { invoices: BillingInvoice[] }) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <FileText className="h-5 w-5 text-primary" />
        <h2 className="text-sm font-semibold text-foreground">Histórico de faturas</h2>
      </div>
      {invoices.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-muted-foreground" data-testid="empty-invoices">
          Nenhuma fatura encontrada.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                <th className="px-4 py-3 font-medium">Fatura</th>
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3 font-medium">Valor</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Ação</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium text-foreground">{invoice.number}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(invoice.paidAt ?? invoice.createdAt)}</td>
                  <td className="px-4 py-3 text-foreground">{formatCurrency(invoice.amount, invoice.currency)}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {invoice.hostedInvoiceUrl ? (
                      <a
                        href={invoice.hostedInvoiceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                      >
                        Abrir
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function SubscriptionActions({
  overview,
  isCancelling,
  onCancel,
}: {
  overview: BillingOverview
  isCancelling: boolean
  onCancel: () => void
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <Ban className="h-5 w-5 text-destructive" />
        <h2 className="text-sm font-semibold text-foreground">Assinatura</h2>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        O cancelamento mantém o acesso até o fim do período já pago.
      </p>
      <button
        type="button"
        onClick={onCancel}
        disabled={isCancelling || overview.cancelAtPeriodEnd || overview.status === 'canceled'}
        className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-destructive px-3 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isCancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
        {overview.cancelAtPeriodEnd ? 'Cancelamento agendado' : 'Cancelar assinatura'}
      </button>
      {overview.cancelAtPeriodEnd && (
        <div className="mt-3 flex items-center gap-2 rounded-md bg-primary/10 px-3 py-2 text-sm text-primary">
          <CheckCircle2 className="h-4 w-4" />
          A assinatura será encerrada na renovação.
        </div>
      )}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-medium text-foreground">{value}</div>
    </div>
  )
}

function BillingSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4 md:p-6" data-testid="billing-skeleton">
      <div className="h-10 w-56 animate-pulse rounded-md bg-muted" />
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="h-48 animate-pulse rounded-lg bg-muted" />
        <div className="h-48 animate-pulse rounded-lg bg-muted" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-36 animate-pulse rounded-lg bg-muted" />
        <div className="h-36 animate-pulse rounded-lg bg-muted" />
      </div>
    </div>
  )
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value))
}

function formatMonth(value: string): string {
  const [year, month] = value.split('-').map(Number)
  return new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric' }).format(new Date(year, month - 1, 1))
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: currency.toUpperCase() }).format(amount / 100)
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value)
}
