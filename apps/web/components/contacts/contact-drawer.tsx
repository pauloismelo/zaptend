'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Pencil, Loader2, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useContactsStore } from '@/stores/contacts.store'
import { ContactTimeline } from './contact-timeline'
import type { ContactDetail } from '@/lib/api/contacts'

const editSchema = z.object({
  name: z.string().optional(),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  company: z.string().optional(),
  tags: z.string().optional(),
  notes: z.string().optional(),
  isBlocked: z.boolean().optional(),
})

type EditFormData = z.infer<typeof editSchema>

function getInitials(name?: string, phone?: string): string {
  if (name?.trim()) {
    return name
      .trim()
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0].toUpperCase())
      .join('')
  }
  return phone?.slice(-2) ?? '?'
}

interface ContactDrawerProps {
  contact: ContactDetail
  onClose: () => void
}

export function ContactDrawer({ contact, onClose }: ContactDrawerProps) {
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const { updateContact } = useContactsStore()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    reset,
  } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: contact.name ?? '',
      email: contact.email ?? '',
      company: contact.company ?? '',
      tags: contact.tags.join(', '),
      notes: contact.notes ?? '',
      isBlocked: contact.isBlocked,
    },
  })

  const handleEdit = () => {
    reset({
      name: contact.name ?? '',
      email: contact.email ?? '',
      company: contact.company ?? '',
      tags: contact.tags.join(', '),
      notes: contact.notes ?? '',
      isBlocked: contact.isBlocked,
    })
    setMode('edit')
  }

  const handleCancel = () => setMode('view')

  const onSubmit = async (data: EditFormData) => {
    try {
      const tags = data.tags
        ? data.tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : []

      await updateContact(contact.id, {
        name: data.name || undefined,
        email: data.email || undefined,
        company: data.company || undefined,
        tags,
        notes: data.notes || undefined,
        isBlocked: data.isBlocked,
      })
      setMode('view')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar contato'
      setError('root', { message })
    }
  }

  const initials = getInitials(contact.name, contact.phone)

  const inputClass =
    'w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50'

  const labelClass = 'block text-sm font-medium text-foreground mb-1'

  return (
    <>
      {/* Backdrop */}
      <div
        data-testid="drawer-backdrop"
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <aside
        data-testid="contact-drawer"
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-card border-l border-border shadow-xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Detalhes do contato"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3 flex-shrink-0">
          <h2 className="text-sm font-semibold text-foreground">
            {mode === 'edit' ? 'Editar contato' : 'Detalhes do contato'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {mode === 'view' ? (
            <div data-testid="drawer-view-mode">
              {/* Avatar + basic info */}
              <div className="flex flex-col items-center gap-3 px-4 py-6 border-b border-border">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-xl font-semibold text-foreground select-none">
                  {contact.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={contact.avatarUrl}
                      alt={contact.name ?? contact.phone}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-foreground">
                    {contact.name ?? 'Contato sem nome'}
                  </h3>
                  <p className="text-sm text-muted-foreground">{contact.phone}</p>
                </div>
                {contact.isBlocked && (
                  <span className="rounded-full bg-destructive/20 px-3 py-1 text-xs font-medium text-destructive">
                    Bloqueado
                  </span>
                )}
              </div>

              {/* Details */}
              <div className="px-4 py-4 space-y-3 border-b border-border">
                {contact.email && (
                  <div>
                    <p className="text-xs text-muted-foreground">E-mail</p>
                    <p className="text-sm text-foreground">{contact.email}</p>
                  </div>
                )}
                {contact.company && (
                  <div>
                    <p className="text-xs text-muted-foreground">Empresa</p>
                    <p className="text-sm text-foreground">{contact.company}</p>
                  </div>
                )}
                {contact.tags.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Tags</p>
                    <div className="flex flex-wrap gap-1" data-testid="tags-list">
                      {contact.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {contact.notes && (
                  <div>
                    <p className="text-xs text-muted-foreground">Notas</p>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{contact.notes}</p>
                  </div>
                )}
              </div>

              {/* Timeline */}
              <div className="px-4 py-4">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Histórico de conversas
                </h4>
                <ContactTimeline conversations={contact.conversations} />
              </div>
            </div>
          ) : (
            <form
              data-testid="drawer-edit-mode"
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              className="px-4 py-4 space-y-4"
            >
              <div>
                <label htmlFor="edit-name" className={labelClass}>
                  Nome
                </label>
                <input
                  id="edit-name"
                  type="text"
                  placeholder="Nome completo"
                  disabled={isSubmitting}
                  {...register('name')}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="edit-email" className={labelClass}>
                  E-mail
                </label>
                <input
                  id="edit-email"
                  type="email"
                  placeholder="contato@empresa.com.br"
                  disabled={isSubmitting}
                  {...register('email')}
                  className={inputClass}
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="edit-company" className={labelClass}>
                  Empresa
                </label>
                <input
                  id="edit-company"
                  type="text"
                  placeholder="Nome da empresa"
                  disabled={isSubmitting}
                  {...register('company')}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="edit-tags" className={labelClass}>
                  Tags
                </label>
                <input
                  id="edit-tags"
                  type="text"
                  placeholder="vip, cliente, lead"
                  disabled={isSubmitting}
                  {...register('tags')}
                  className={inputClass}
                />
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Separe as tags por vírgula
                </p>
              </div>

              <div>
                <label htmlFor="edit-notes" className={labelClass}>
                  Notas
                </label>
                <textarea
                  id="edit-notes"
                  rows={3}
                  placeholder="Observações sobre o contato..."
                  disabled={isSubmitting}
                  {...register('notes')}
                  className={cn(inputClass, 'resize-none')}
                />
              </div>

              <div className="flex items-center gap-3">
                <label htmlFor="edit-blocked" className="text-sm font-medium text-foreground">
                  Bloqueado
                </label>
                <input
                  id="edit-blocked"
                  type="checkbox"
                  disabled={isSubmitting}
                  {...register('isBlocked')}
                  className="h-4 w-4 rounded border-input accent-primary"
                />
              </div>

              {errors.root && (
                <div
                  role="alert"
                  className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  {errors.root.message}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex flex-1 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Salvar
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                  className="flex-1 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer (view mode only) */}
        {mode === 'view' && (
          <div className="flex-shrink-0 border-t border-border px-4 py-3">
            <button
              type="button"
              onClick={handleEdit}
              data-testid="edit-button"
              className="flex w-full items-center justify-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              <Pencil className="w-4 h-4" />
              Editar
            </button>
          </div>
        )}
      </aside>
    </>
  )
}

interface ContactDrawerWrapperProps {
  isOpen: boolean
  onClose: () => void
}

export function ContactDrawerWrapper({ isOpen, onClose }: ContactDrawerWrapperProps) {
  const { selectedContact, isLoadingDetail } = useContactsStore()

  if (!isOpen) return null

  if (isLoadingDetail) {
    return (
      <>
        <div
          data-testid="drawer-backdrop"
          className="fixed inset-0 z-40 bg-black/40"
          onClick={onClose}
        />
        <aside
          data-testid="contact-drawer"
          className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col items-center justify-center bg-card border-l border-border shadow-xl"
        >
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </aside>
      </>
    )
  }

  if (!selectedContact) {
    return (
      <>
        <div
          data-testid="drawer-backdrop"
          className="fixed inset-0 z-40 bg-black/40"
          onClick={onClose}
        />
        <aside
          data-testid="contact-drawer"
          className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col items-center justify-center gap-3 bg-card border-l border-border shadow-xl"
        >
          <User className="w-10 h-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Nenhum contato selecionado</p>
        </aside>
      </>
    )
  }

  return <ContactDrawer contact={selectedContact} onClose={onClose} />
}
