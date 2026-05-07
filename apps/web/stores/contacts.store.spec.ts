import { act } from 'react'
import { useContactsStore } from './contacts.store'
import { contactsApi } from '@/lib/api/contacts'
import type { ContactSummary, ContactDetail } from '@/lib/api/contacts'

jest.mock('@/lib/api/contacts', () => ({
  contactsApi: {
    list: jest.fn(),
    getById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  },
}))

const mockedApi = contactsApi as jest.Mocked<typeof contactsApi>

function mockContact(overrides: Partial<ContactSummary> = {}): ContactSummary {
  return {
    id: 'c1',
    phone: '11999990000',
    name: 'João Silva',
    tags: [],
    isBlocked: false,
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

function mockDetail(overrides: Partial<ContactDetail> = {}): ContactDetail {
  return {
    ...mockContact(),
    conversations: [],
    ...overrides,
  }
}

function resetStore() {
  useContactsStore.setState({
    contacts: [],
    selectedContact: null,
    isLoading: false,
    isLoadingDetail: false,
    error: null,
    total: 0,
    page: 1,
    filters: {},
  })
}

describe('useContactsStore', () => {
  beforeEach(() => {
    resetStore()
    jest.clearAllMocks()
  })

  describe('fetchContacts', () => {
    it('popula contacts e total após sucesso', async () => {
      const data = [mockContact({ id: 'c1' }), mockContact({ id: 'c2' })]
      mockedApi.list.mockResolvedValue({ data, total: 2, page: 1, limit: 20 })

      await act(async () => {
        await useContactsStore.getState().fetchContacts()
      })

      const state = useContactsStore.getState()
      expect(state.contacts).toEqual(data)
      expect(state.total).toBe(2)
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
    })

    it('define error quando API rejeita', async () => {
      mockedApi.list.mockRejectedValue(new Error('Erro de rede'))

      await act(async () => {
        await useContactsStore.getState().fetchContacts()
      })

      const state = useContactsStore.getState()
      expect(state.error).toBe('Erro de rede')
      expect(state.isLoading).toBe(false)
    })

    it('define isLoading=true durante o request', async () => {
      let resolveList!: (v: unknown) => void
      mockedApi.list.mockReturnValue(new Promise((r) => { resolveList = r }) as ReturnType<typeof mockedApi.list>)

      act(() => { useContactsStore.getState().fetchContacts() })
      expect(useContactsStore.getState().isLoading).toBe(true)

      await act(async () => {
        resolveList({ data: [], total: 0, page: 1, limit: 20 })
      })
      expect(useContactsStore.getState().isLoading).toBe(false)
    })

    it('aplica os filtros passados', async () => {
      mockedApi.list.mockResolvedValue({ data: [], total: 0, page: 1, limit: 20 })

      await act(async () => {
        await useContactsStore.getState().fetchContacts({ search: 'João' })
      })

      expect(mockedApi.list).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'João', page: 1 }),
      )
    })

    it('reseta page para 1 ao buscar', async () => {
      useContactsStore.setState({ page: 3 })
      mockedApi.list.mockResolvedValue({ data: [], total: 0, page: 1, limit: 20 })

      await act(async () => {
        await useContactsStore.getState().fetchContacts()
      })

      expect(useContactsStore.getState().page).toBe(1)
    })
  })

  describe('selectContact', () => {
    it('carrega e armazena o detalhe do contato', async () => {
      const detail = mockDetail({ id: 'c1', name: 'Maria' })
      mockedApi.getById.mockResolvedValue(detail)

      await act(async () => {
        await useContactsStore.getState().selectContact('c1')
      })

      expect(useContactsStore.getState().selectedContact).toEqual(detail)
      expect(useContactsStore.getState().isLoadingDetail).toBe(false)
    })

    it('define error quando getById rejeita', async () => {
      mockedApi.getById.mockRejectedValue(new Error('Não encontrado'))

      await act(async () => {
        await useContactsStore.getState().selectContact('c-nao-existe')
      })

      expect(useContactsStore.getState().error).toBe('Não encontrado')
      expect(useContactsStore.getState().isLoadingDetail).toBe(false)
    })
  })

  describe('createContact', () => {
    it('adiciona novo contato no início da lista', async () => {
      useContactsStore.setState({ contacts: [mockContact({ id: 'c1' })], total: 1 })
      const created = mockContact({ id: 'c2', name: 'Novo' })
      mockedApi.create.mockResolvedValue(created)

      await act(async () => {
        await useContactsStore.getState().createContact({ phone: '11999990001' })
      })

      const { contacts, total } = useContactsStore.getState()
      expect(contacts[0]).toEqual(created)
      expect(contacts).toHaveLength(2)
      expect(total).toBe(2)
    })

    it('retorna o contato criado', async () => {
      const created = mockContact({ id: 'c-new' })
      mockedApi.create.mockResolvedValue(created)

      let result!: ContactSummary
      await act(async () => {
        result = await useContactsStore.getState().createContact({ phone: '11999990000' })
      })

      expect(result).toEqual(created)
    })

    it('propaga erro quando create falha', async () => {
      mockedApi.create.mockRejectedValue(new Error('Telefone duplicado'))

      await act(async () => {
        await expect(
          useContactsStore.getState().createContact({ phone: '11999990000' }),
        ).rejects.toThrow('Telefone duplicado')
      })
    })
  })

  describe('updateContact', () => {
    it('atualiza contato na lista', async () => {
      useContactsStore.setState({ contacts: [mockContact({ id: 'c1', name: 'Antigo' })], total: 1 })
      const updated = mockContact({ id: 'c1', name: 'Novo Nome' })
      mockedApi.update.mockResolvedValue(updated)

      await act(async () => {
        await useContactsStore.getState().updateContact('c1', { name: 'Novo Nome' })
      })

      expect(useContactsStore.getState().contacts[0].name).toBe('Novo Nome')
    })

    it('atualiza selectedContact se for o mesmo id', async () => {
      const detail = mockDetail({ id: 'c1', name: 'Antigo' })
      useContactsStore.setState({ selectedContact: detail, contacts: [] })
      const updated = mockContact({ id: 'c1', name: 'Atualizado' })
      mockedApi.update.mockResolvedValue(updated)

      await act(async () => {
        await useContactsStore.getState().updateContact('c1', { name: 'Atualizado' })
      })

      expect(useContactsStore.getState().selectedContact?.name).toBe('Atualizado')
    })

    it('não altera selectedContact se id diferente', async () => {
      const detail = mockDetail({ id: 'c2', name: 'Outro' })
      useContactsStore.setState({
        selectedContact: detail,
        contacts: [mockContact({ id: 'c1' })],
      })
      mockedApi.update.mockResolvedValue(mockContact({ id: 'c1', name: 'Updated' }))

      await act(async () => {
        await useContactsStore.getState().updateContact('c1', { name: 'Updated' })
      })

      expect(useContactsStore.getState().selectedContact?.name).toBe('Outro')
    })
  })

  describe('removeContact', () => {
    it('remove contato da lista e decrementa total', async () => {
      useContactsStore.setState({
        contacts: [mockContact({ id: 'c1' }), mockContact({ id: 'c2' })],
        total: 2,
      })
      mockedApi.remove.mockResolvedValue(undefined)

      await act(async () => {
        await useContactsStore.getState().removeContact('c1')
      })

      const { contacts, total } = useContactsStore.getState()
      expect(contacts).toHaveLength(1)
      expect(contacts[0].id).toBe('c2')
      expect(total).toBe(1)
    })

    it('limpa selectedContact se for o contato removido', async () => {
      useContactsStore.setState({
        contacts: [mockContact({ id: 'c1' })],
        selectedContact: mockDetail({ id: 'c1' }),
        total: 1,
      })
      mockedApi.remove.mockResolvedValue(undefined)

      await act(async () => {
        await useContactsStore.getState().removeContact('c1')
      })

      expect(useContactsStore.getState().selectedContact).toBeNull()
    })

    it('propaga erro quando remove falha', async () => {
      mockedApi.remove.mockRejectedValue(new Error('Erro ao excluir'))

      await act(async () => {
        await expect(
          useContactsStore.getState().removeContact('c1'),
        ).rejects.toThrow('Erro ao excluir')
      })
    })
  })

  describe('setFilters', () => {
    it('atualiza os filtros do state', () => {
      useContactsStore.getState().setFilters({ search: 'Maria', isBlocked: true })
      const { filters } = useContactsStore.getState()
      expect(filters.search).toBe('Maria')
      expect(filters.isBlocked).toBe(true)
    })
  })

  describe('clearSelected', () => {
    it('limpa o contato selecionado', () => {
      useContactsStore.setState({ selectedContact: mockDetail() })
      useContactsStore.getState().clearSelected()
      expect(useContactsStore.getState().selectedContact).toBeNull()
    })
  })
})
