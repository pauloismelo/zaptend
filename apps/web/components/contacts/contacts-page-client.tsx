'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { useContactsStore } from '@/stores/contacts.store'
import { ContactList } from './contact-list'
import { ContactDrawerWrapper } from './contact-drawer'
import { ContactForm } from './contact-form'

export function ContactsPageClient() {
  const { selectContact, clearSelected } = useContactsStore()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [newContactOpen, setNewContactOpen] = useState(false)

  const handleSelectContact = async (id: string) => {
    await selectContact(id)
    setDrawerOpen(true)
  }

  const handleCloseDrawer = () => {
    setDrawerOpen(false)
    clearSelected()
  }

  const handleNewContact = () => {
    setNewContactOpen(true)
  }

  const handleNewContactSuccess = () => {
    setNewContactOpen(false)
  }

  return (
    <div className="flex h-full relative" data-testid="contacts-page">
      {/* Contact list - full width, or narrower when drawer is open */}
      <div className="flex-1 overflow-hidden">
        <ContactList
          onSelectContact={handleSelectContact}
          onNewContact={handleNewContact}
        />
      </div>

      {/* Drawer */}
      <ContactDrawerWrapper isOpen={drawerOpen} onClose={handleCloseDrawer} />

      {/* New contact modal */}
      {newContactOpen && (
        <>
          <div
            data-testid="new-contact-backdrop"
            className="fixed inset-0 z-50 bg-black/40"
            onClick={() => setNewContactOpen(false)}
          />
          <div
            data-testid="new-contact-modal"
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-card shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold text-foreground">Novo contato</h2>
              <button
                type="button"
                onClick={() => setNewContactOpen(false)}
                aria-label="Fechar"
                className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-4 py-4">
              <ContactForm
                onSuccess={handleNewContactSuccess}
                onCancel={() => setNewContactOpen(false)}
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
