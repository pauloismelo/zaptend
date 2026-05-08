'use client'

import { useEffect, useMemo } from 'react'
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { Building2, CircleDollarSign, Loader2, RefreshCw, UserRound } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { usePipelineStore } from '@/stores/pipeline.store'
import type { PipelineColumn } from '@/stores/pipeline.store'
import type { PipelineConversation } from '@/lib/api/pipeline'
import { cn } from '@/lib/utils'

export function PipelineBoard() {
  const {
    columns,
    conversations,
    filters,
    isLoading,
    isMoving,
    error,
    fetchPipeline,
    moveConversation,
    setFilters,
  } = usePipelineStore()

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor))

  useEffect(() => {
    fetchPipeline()
  }, [fetchPipeline, filters])

  const agents = useMemo(() => uniqueOptions(conversations, 'assignedUserId', (item) => item.assignedUser?.name), [conversations])
  const departments = useMemo(() => uniqueOptions(conversations, 'departmentId'), [conversations])
  const totalValue = useMemo(
    () => conversations.reduce((sum, conversation) => sum + toNumber(conversation.pipelineValue), 0),
    [conversations],
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const conversationId = String(event.active.id)
    const stageId = event.over?.id ? String(event.over.id) : null
    if (!stageId) return

    const current = conversations.find((conversation) => conversation.id === conversationId)
    if (!current || (current.pipelineStage ?? 'new') === stageId) return
    await moveConversation(conversationId, stageId)
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <header className="border-b border-border bg-card px-4 py-3 md:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Pipeline</h1>
            <p className="text-sm text-muted-foreground">
              {conversations.length} oportunidades · {formatCurrency(totalValue)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <FilterSelect
              label="Agente"
              icon={UserRound}
              value={filters.assignedUserId ?? ''}
              options={agents}
              onChange={(assignedUserId) => setFilters({ ...filters, assignedUserId: assignedUserId || undefined })}
            />
            <FilterSelect
              label="Departamento"
              icon={Building2}
              value={filters.departmentId ?? ''}
              options={departments}
              onChange={(departmentId) => setFilters({ ...filters, departmentId: departmentId || undefined })}
            />
            <button
              type="button"
              onClick={fetchPipeline}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground hover:bg-accent"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Atualizar
            </button>
          </div>
        </div>
        {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
      </header>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex min-h-0 flex-1 gap-3 overflow-x-auto p-4 md:p-6" data-testid="pipeline-board">
          {columns.map((column) => (
            <PipelineLane
              key={column.id}
              column={column}
              conversations={conversations.filter((conversation) => (conversation.pipelineStage ?? 'new') === column.id)}
              isMoving={isMoving}
            />
          ))}
        </div>
      </DndContext>
    </div>
  )
}

function PipelineLane({
  column,
  conversations,
  isMoving,
}: {
  column: PipelineColumn
  conversations: PipelineConversation[]
  isMoving: boolean
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })
  const value = conversations.reduce((sum, conversation) => sum + toNumber(conversation.pipelineValue), 0)

  return (
    <section
      ref={setNodeRef}
      className={cn(
        'flex h-full min-w-[280px] max-w-[320px] flex-1 flex-col rounded-lg border border-border bg-muted/35',
        isOver && 'border-primary bg-primary/5',
      )}
      data-testid={`pipeline-column-${column.id}`}
    >
      <div className="flex h-16 items-center justify-between border-b border-border px-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn('h-2.5 w-2.5 rounded-full', column.color)} />
            <h2 className="truncate text-sm font-semibold text-foreground">{column.title}</h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {conversations.length} cards · {formatCurrency(value)}
          </p>
        </div>
        {isMoving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2">
        {conversations.map((conversation) => (
          <PipelineCard key={conversation.id} conversation={conversation} />
        ))}
        {conversations.length === 0 && (
          <div className="flex h-24 items-center justify-center rounded-md border border-dashed border-border text-xs text-muted-foreground">
            Sem cards
          </div>
        )}
      </div>
    </section>
  )
}

function PipelineCard({ conversation }: { conversation: PipelineConversation }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: conversation.id })
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined
  const contactName = conversation.contact?.name ?? conversation.contact?.phone ?? 'Contato'

  return (
    <article
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        'cursor-grab rounded-lg border border-border bg-card p-3 shadow-sm outline-none transition hover:border-primary/50 active:cursor-grabbing',
        isDragging && 'opacity-60',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-foreground">{contactName}</h3>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {conversation.subject ?? conversation.contact?.company ?? 'Sem assunto'}
          </p>
        </div>
        <div className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
          <CircleDollarSign className="h-3.5 w-3.5" />
          {formatCurrency(toNumber(conversation.pipelineValue))}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1">
        {conversation.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="rounded-md bg-accent px-2 py-1 text-xs text-accent-foreground">
            {tag}
          </span>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span className="truncate">{conversation.assignedUser?.name ?? 'Sem agente'}</span>
        <span>{conversation.lastMessageAt ? formatDate(conversation.lastMessageAt) : 'Sem atividade'}</span>
      </div>
    </article>
  )
}

function FilterSelect({
  label,
  icon: Icon,
  value,
  options,
  onChange,
}: {
  label: string
  icon: LucideIcon
  value: string
  options: Array<{ value: string; label: string }>
  onChange: (value: string) => void
}) {
  return (
    <label className="inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm text-foreground">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="bg-transparent text-sm outline-none"
        aria-label={label}
      >
        <option value="">Todos</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function uniqueOptions(
  conversations: PipelineConversation[],
  key: 'assignedUserId' | 'departmentId',
  label?: (conversation: PipelineConversation) => string | undefined,
) {
  const options = new Map<string, string>()
  for (const conversation of conversations) {
    const value = conversation[key]
    if (value) options.set(value, label?.(conversation) ?? value)
  }
  return Array.from(options.entries()).map(([value, optionLabel]) => ({ value, label: optionLabel }))
}

function toNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined) return 0
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(new Date(value))
}
