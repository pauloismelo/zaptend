import { create } from 'zustand'
import { contactsApi } from '@/lib/api/contacts'
import type {
  ContactSummary,
  ContactDetail,
  ContactFilters,
  CreateContactData,
  UpdateContactData,
} from '@/lib/api/contacts'

export type { ContactSummary as Contact, ContactDetail, ContactFilters }

interface ContactsState {
  contacts: ContactSummary[]
  selectedContact: ContactDetail | null
  isLoading: boolean
  isLoadingDetail: boolean
  error: string | null
  total: number
  page: number
  filters: ContactFilters

  fetchContacts: (filters?: ContactFilters) => Promise<void>
  loadMore: () => Promise<void>
  selectContact: (id: string) => Promise<void>
  createContact: (data: CreateContactData) => Promise<ContactSummary>
  updateContact: (id: string, data: UpdateContactData) => Promise<void>
  removeContact: (id: string) => Promise<void>
  setFilters: (filters: ContactFilters) => void
  clearSelected: () => void
}

const DEFAULT_LIMIT = 20

export const useContactsStore = create<ContactsState>((set, get) => ({
  contacts: [],
  selectedContact: null,
  isLoading: false,
  isLoadingDetail: false,
  error: null,
  total: 0,
  page: 1,
  filters: {},

  fetchContacts: async (filters?: ContactFilters) => {
    const resolvedFilters = filters ?? get().filters
    set({ isLoading: true, error: null, filters: resolvedFilters, page: 1 })
    try {
      const response = await contactsApi.list({
        ...resolvedFilters,
        page: 1,
        limit: DEFAULT_LIMIT,
      })
      set({
        contacts: response.data,
        total: response.total,
        page: 1,
        isLoading: false,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar contatos'
      set({ error: message, isLoading: false })
    }
  },

  loadMore: async () => {
    const { isLoading, contacts, total, page, filters } = get()
    if (isLoading || contacts.length >= total) return
    const nextPage = page + 1
    set({ isLoading: true, error: null })
    try {
      const response = await contactsApi.list({
        ...filters,
        page: nextPage,
        limit: DEFAULT_LIMIT,
      })
      set((state) => ({
        contacts: [...state.contacts, ...response.data],
        total: response.total,
        page: nextPage,
        isLoading: false,
      }))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar mais contatos'
      set({ error: message, isLoading: false })
    }
  },

  selectContact: async (id: string) => {
    set({ isLoadingDetail: true, error: null })
    try {
      const detail = await contactsApi.getById(id)
      set({ selectedContact: detail, isLoadingDetail: false })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar contato'
      set({ error: message, isLoadingDetail: false })
    }
  },

  createContact: async (data: CreateContactData) => {
    const created = await contactsApi.create(data)
    set((state) => ({
      contacts: [created, ...state.contacts],
      total: state.total + 1,
    }))
    return created
  },

  updateContact: async (id: string, data: UpdateContactData) => {
    const updated = await contactsApi.update(id, data)
    set((state) => ({
      contacts: state.contacts.map((c) => (c.id === id ? { ...c, ...updated } : c)),
      selectedContact:
        state.selectedContact?.id === id
          ? { ...state.selectedContact, ...updated }
          : state.selectedContact,
    }))
  },

  removeContact: async (id: string) => {
    await contactsApi.remove(id)
    set((state) => ({
      contacts: state.contacts.filter((c) => c.id !== id),
      total: state.total - 1,
      selectedContact: state.selectedContact?.id === id ? null : state.selectedContact,
    }))
  },

  setFilters: (filters: ContactFilters) => {
    set({ filters })
  },

  clearSelected: () => {
    set({ selectedContact: null })
  },
}))
