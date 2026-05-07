'use client'

import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ConversationStatus } from '@zaptend/types'

export interface InboxFilters {
  search: string
  status: ConversationStatus | 'all'
  departmentId: string | null
}

export const DEFAULT_INBOX_FILTERS: InboxFilters = {
  search: '',
  status: 'all',
  departmentId: null,
}

const STATUS_OPTIONS: Array<{ label: string; value: ConversationStatus | 'all' }> = [
  { label: 'Todas', value: 'all' },
  { label: 'Abertas', value: 'open' },
  { label: 'Atendendo', value: 'attending' },
  { label: 'Aguardando', value: 'waiting_customer' },
  { label: 'Resolvidas', value: 'resolved' },
]

interface ConversationFiltersProps {
  filters: InboxFilters
  onChange: (filters: InboxFilters) => void
}

export function ConversationFilters({ filters, onChange }: ConversationFiltersProps) {
  return (
    <div className="flex flex-col gap-2 px-3 py-3 border-b border-border flex-shrink-0">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar conversa..."
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          aria-label="Buscar conversa"
          data-testid="search-input"
          className="w-full rounded-md border border-border bg-muted px-3 py-2 pl-9 pr-8 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
        {filters.search && (
          <button
            type="button"
            onClick={() => onChange({ ...filters, search: '' })}
            aria-label="Limpar busca"
            data-testid="clear-search"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div
        className="flex items-center gap-1 overflow-x-auto pb-0.5"
        role="tablist"
        aria-label="Filtro por status"
      >
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={filters.status === opt.value}
            onClick={() => onChange({ ...filters, status: opt.value })}
            data-testid={`status-filter-${opt.value}`}
            className={cn(
              'flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors',
              filters.status === opt.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground',
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
