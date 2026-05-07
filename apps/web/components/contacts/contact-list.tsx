'use client'

import { useEffect, useState, useCallback } from 'react'
import { Search, Users, MoreVertical, Plus, Eye, Pencil, Ban, Trash2 } from 'lucide-react'
import { useContactsStore } from '@/stores/contacts.store'
import type { ContactSummary } from '@/lib/api/contacts'
import { cn } from '@/lib/utils'

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

function ContactItemSkeleton() {
  return (
    <div
      data-testid="contact-skeleton"
      className="flex items-center gap-3 px-4 py-3 animate-pulse border-b border-border"
    >
      <div className="w-10 h-10 rounded-full bg-muted flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 bg-muted rounded w-32" />
        <div className="h-3 bg-muted rounded w-24" />
      </div>
    </div>
  )
}

interface ContactActionsMenuProps {
  contact: ContactSummary
  onView: () => void
  onEdit: () => void
  onBlock: () => void
  onDelete: () => void
}

function ContactActionsMenu({ contact, onView, onEdit, onBlock, onDelete }: ContactActionsMenuProps) {
  const [open, setOpen] = useState(false)

  const handleAction = (fn: () => void) => {
    fn()
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Ações"
        onClick={(e) => {
          e.stopPropagation()
          setOpen((prev) => !prev)
        }}
        className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        data-testid="contact-actions-btn"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div
            data-testid="contact-actions-menu"
            className="absolute right-0 top-full z-20 mt-1 w-44 rounded-md border border-border bg-card shadow-lg overflow-hidden"
          >
            <button
              type="button"
              onClick={() => handleAction(onView)}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
            >
              <Eye className="w-4 h-4" />
              Ver detalhes
            </button>
            <button
              type="button"
              onClick={() => handleAction(onEdit)}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
            >
              <Pencil className="w-4 h-4" />
              Editar
            </button>
            <button
              type="button"
              onClick={() => handleAction(onBlock)}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
            >
              <Ban className="w-4 h-4" />
              {contact.isBlocked ? 'Desbloquear' : 'Bloquear'}
            </button>
            <button
              type="button"
              onClick={() => handleAction(onDelete)}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Excluir
            </button>
          </div>
        </>
      )}
    </div>
  )
}

interface ContactListProps {
  onSelectContact: (id: string, mode?: 'view' | 'edit') => void
  onNewContact: () => void
}

export function ContactList({ onSelectContact, onNewContact }: ContactListProps) {
  const {
    contacts,
    isLoading,
    error,
    total,
    filters,
    fetchContacts,
    loadMore,
    removeContact,
    updateContact,
    setFilters,
  } = useContactsStore()

  const [searchValue, setSearchValue] = useState(filters.search ?? '')
  const [blockedOnly, setBlockedOnly] = useState(filters.isBlocked ?? false)

  useEffect(() => {
    fetchContacts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSearch = useCallback(
    (value: string) => {
      setSearchValue(value)
      const updated = { ...filters, search: value || undefined }
      setFilters(updated)
      fetchContacts(updated)
    },
    [filters, setFilters, fetchContacts],
  )

  const handleBlockedToggle = useCallback(() => {
    const nextBlocked = !blockedOnly
    setBlockedOnly(nextBlocked)
    const updated = { ...filters, isBlocked: nextBlocked || undefined }
    setFilters(updated)
    fetchContacts(updated)
  }, [blockedOnly, filters, setFilters, fetchContacts])

  const handleDelete = async (id: string) => {
    if (window.confirm('Deseja excluir este contato?')) {
      await removeContact(id)
    }
  }

  const handleBlock = async (contact: ContactSummary) => {
    await updateContact(contact.id, { isBlocked: !contact.isBlocked })
  }

  const hasMore = contacts.length < total

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
        <h2 className="text-sm font-semibold text-foreground">
          Contatos{total > 0 && <span className="ml-1 text-muted-foreground">({total})</span>}
        </h2>
        <button
          type="button"
          onClick={onNewContact}
          data-testid="new-contact-btn"
          className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Novo contato
        </button>
      </div>

      {/* Filters */}
      <div className="px-4 py-2 border-b border-border flex-shrink-0 space-y-2">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="search"
            placeholder="Buscar contato..."
            value={searchValue}
            onChange={(e) => handleSearch(e.target.value)}
            data-testid="search-input"
            className="w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Blocked filter */}
        <label className="flex items-center gap-2 cursor-pointer select-none w-fit">
          <input
            type="checkbox"
            checked={blockedOnly}
            onChange={handleBlockedToggle}
            data-testid="blocked-filter"
            className="h-4 w-4 rounded border-input accent-primary"
          />
          <span className="text-sm text-muted-foreground">Apenas bloqueados</span>
        </label>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto" data-testid="contact-list-scroll">
        {isLoading && contacts.length === 0 &&
          Array.from({ length: 6 }).map((_, i) => <ContactItemSkeleton key={i} />)}

        {!isLoading && error && (
          <div
            className="flex flex-col items-center justify-center gap-2 p-8 text-center"
            data-testid="error-state"
          >
            <p className="text-sm text-destructive">{error}</p>
            <button
              type="button"
              onClick={() => fetchContacts()}
              className="text-xs text-primary hover:underline"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {!isLoading && !error && contacts.length === 0 && (
          <div
            className="flex flex-col items-center justify-center gap-3 p-8 text-center"
            data-testid="empty-state"
          >
            <Users className="w-10 h-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {filters.search || filters.isBlocked
                ? 'Nenhum contato encontrado'
                : 'Nenhum contato ainda'}
            </p>
          </div>
        )}

        {contacts.map((contact) => {
          const initials = getInitials(contact.name, contact.phone)
          return (
            <div
              key={contact.id}
              data-testid="contact-item"
              className="flex items-center gap-3 px-4 py-3 border-b border-border hover:bg-accent transition-colors cursor-pointer"
              onClick={() => onSelectContact(contact.id)}
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-foreground select-none">
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
                {contact.isBlocked && (
                  <span
                    title="Bloqueado"
                    className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card bg-destructive"
                  />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {contact.name ?? contact.phone}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {contact.name ? contact.phone : contact.email ?? ''}
                </p>
                {contact.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {contact.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className={cn(
                          'rounded-full px-1.5 py-0.5 text-xs font-medium',
                          'bg-primary/20 text-primary',
                        )}
                      >
                        {tag}
                      </span>
                    ))}
                    {contact.tags.length > 3 && (
                      <span className="text-xs text-muted-foreground">
                        +{contact.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div onClick={(e) => e.stopPropagation()}>
                <ContactActionsMenu
                  contact={contact}
                  onView={() => onSelectContact(contact.id, 'view')}
                  onEdit={() => onSelectContact(contact.id, 'edit')}
                  onBlock={() => handleBlock(contact)}
                  onDelete={() => handleDelete(contact.id)}
                />
              </div>
            </div>
          )
        })}

        {/* Load more */}
        {hasMore && (
          <div className="flex justify-center py-4">
            <button
              type="button"
              onClick={loadMore}
              disabled={isLoading}
              data-testid="load-more-btn"
              className="rounded-md border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-accent transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Carregando...' : 'Carregar mais'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
