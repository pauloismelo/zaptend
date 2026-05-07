import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ContactList } from './contact-list'
import { useContactsStore } from '@/stores/contacts.store'
import type { ContactSummary } from '@/lib/api/contacts'

jest.mock('@/stores/contacts.store', () => ({
  useContactsStore: jest.fn(),
}))

const mockedUseStore = useContactsStore as jest.MockedFunction<typeof useContactsStore>

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

function setupStore(overrides: Partial<ReturnType<typeof useContactsStore>> = {}) {
  const fetchContacts = jest.fn().mockResolvedValue(undefined)
  const loadMore = jest.fn().mockResolvedValue(undefined)
  const removeContact = jest.fn().mockResolvedValue(undefined)
  const updateContact = jest.fn().mockResolvedValue(undefined)
  const setFilters = jest.fn()

  mockedUseStore.mockReturnValue({
    contacts: [],
    selectedContact: null,
    isLoading: false,
    isLoadingDetail: false,
    error: null,
    total: 0,
    page: 1,
    filters: {},
    fetchContacts,
    loadMore,
    selectContact: jest.fn(),
    createContact: jest.fn(),
    updateContact,
    removeContact,
    setFilters,
    clearSelected: jest.fn(),
    ...overrides,
  } as ReturnType<typeof useContactsStore>)

  return { fetchContacts, loadMore, removeContact, updateContact, setFilters }
}

describe('ContactList', () => {
  const onSelectContact = jest.fn()
  const onNewContact = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renderiza a lista com contatos', () => {
    setupStore({ contacts: [mockContact({ id: 'c1', name: 'João Silva' })], total: 1 })
    render(<ContactList onSelectContact={onSelectContact} onNewContact={onNewContact} />)
    expect(screen.getByText('João Silva')).toBeInTheDocument()
  })

  it('exibe o telefone quando o contato não tem nome', () => {
    setupStore({ contacts: [mockContact({ name: undefined })], total: 1 })
    render(<ContactList onSelectContact={onSelectContact} onNewContact={onNewContact} />)
    expect(screen.getByText('11999990000')).toBeInTheDocument()
  })

  it('exibe estado vazio quando não há contatos', () => {
    setupStore()
    render(<ContactList onSelectContact={onSelectContact} onNewContact={onNewContact} />)
    expect(screen.getByTestId('empty-state')).toBeInTheDocument()
    expect(screen.getByText('Nenhum contato ainda')).toBeInTheDocument()
  })

  it('exibe estado de loading com skeletons', () => {
    setupStore({ isLoading: true, contacts: [] })
    render(<ContactList onSelectContact={onSelectContact} onNewContact={onNewContact} />)
    expect(screen.getAllByTestId('contact-skeleton')).toHaveLength(6)
  })

  it('exibe mensagem de erro', () => {
    setupStore({ error: 'Erro de rede', contacts: [], isLoading: false })
    render(<ContactList onSelectContact={onSelectContact} onNewContact={onNewContact} />)
    expect(screen.getByTestId('error-state')).toBeInTheDocument()
    expect(screen.getByText('Erro de rede')).toBeInTheDocument()
  })

  it('chama fetchContacts ao montar', () => {
    const { fetchContacts } = setupStore()
    render(<ContactList onSelectContact={onSelectContact} onNewContact={onNewContact} />)
    expect(fetchContacts).toHaveBeenCalledTimes(1)
  })

  it('chama onSelectContact ao clicar em um contato', () => {
    setupStore({ contacts: [mockContact({ id: 'c1' })], total: 1 })
    render(<ContactList onSelectContact={onSelectContact} onNewContact={onNewContact} />)
    fireEvent.click(screen.getByTestId('contact-item'))
    expect(onSelectContact).toHaveBeenCalledWith('c1')
  })

  it('chama onNewContact ao clicar em "Novo contato"', () => {
    setupStore()
    render(<ContactList onSelectContact={onSelectContact} onNewContact={onNewContact} />)
    fireEvent.click(screen.getByTestId('new-contact-btn'))
    expect(onNewContact).toHaveBeenCalled()
  })

  it('exibe total de contatos no header', () => {
    setupStore({ contacts: [mockContact()], total: 42 })
    render(<ContactList onSelectContact={onSelectContact} onNewContact={onNewContact} />)
    expect(screen.getByText('(42)')).toBeInTheDocument()
  })

  it('exibe botão "Carregar mais" quando há mais contatos', () => {
    const contacts = [mockContact({ id: 'c1' })]
    setupStore({ contacts, total: 50 })
    render(<ContactList onSelectContact={onSelectContact} onNewContact={onNewContact} />)
    expect(screen.getByTestId('load-more-btn')).toBeInTheDocument()
  })

  it('não exibe "Carregar mais" quando todos os contatos estão carregados', () => {
    setupStore({ contacts: [mockContact()], total: 1 })
    render(<ContactList onSelectContact={onSelectContact} onNewContact={onNewContact} />)
    expect(screen.queryByTestId('load-more-btn')).not.toBeInTheDocument()
  })

  it('chama loadMore ao clicar em "Carregar mais"', () => {
    const { loadMore } = setupStore({ contacts: [mockContact()], total: 50 })
    render(<ContactList onSelectContact={onSelectContact} onNewContact={onNewContact} />)
    fireEvent.click(screen.getByTestId('load-more-btn'))
    expect(loadMore).toHaveBeenCalled()
  })

  it('chama fetchContacts com novo search ao digitar na busca', async () => {
    const { fetchContacts, setFilters } = setupStore()
    render(<ContactList onSelectContact={onSelectContact} onNewContact={onNewContact} />)

    await userEvent.type(screen.getByTestId('search-input'), 'Maria')

    await waitFor(() => {
      expect(fetchContacts).toHaveBeenCalledWith(expect.objectContaining({ search: 'Maria' }))
    })
    expect(setFilters).toHaveBeenCalled()
  })

  it('exibe tags como badges', () => {
    setupStore({
      contacts: [mockContact({ tags: ['vip', 'cliente'] })],
      total: 1,
    })
    render(<ContactList onSelectContact={onSelectContact} onNewContact={onNewContact} />)
    expect(screen.getByText('vip')).toBeInTheDocument()
    expect(screen.getByText('cliente')).toBeInTheDocument()
  })

  it('exibe indicador de bloqueado quando isBlocked=true', () => {
    setupStore({ contacts: [mockContact({ isBlocked: true })], total: 1 })
    render(<ContactList onSelectContact={onSelectContact} onNewContact={onNewContact} />)
    expect(screen.getByTitle('Bloqueado')).toBeInTheDocument()
  })

  it('exibe "Nenhum contato encontrado" quando há filtro de busca ativo', () => {
    setupStore({ contacts: [], total: 0, filters: { search: 'xyz' } })
    render(<ContactList onSelectContact={onSelectContact} onNewContact={onNewContact} />)
    expect(screen.getByText('Nenhum contato encontrado')).toBeInTheDocument()
  })

  it('abre menu de ações ao clicar em MoreVertical', async () => {
    setupStore({ contacts: [mockContact()], total: 1 })
    render(<ContactList onSelectContact={onSelectContact} onNewContact={onNewContact} />)
    await userEvent.click(screen.getByTestId('contact-actions-btn'))
    expect(screen.getByTestId('contact-actions-menu')).toBeInTheDocument()
  })

  it('chama onSelectContact com "view" ao clicar em "Ver detalhes"', async () => {
    setupStore({ contacts: [mockContact({ id: 'c1' })], total: 1 })
    render(<ContactList onSelectContact={onSelectContact} onNewContact={onNewContact} />)
    await userEvent.click(screen.getByTestId('contact-actions-btn'))
    await userEvent.click(screen.getByText('Ver detalhes'))
    expect(onSelectContact).toHaveBeenCalledWith('c1', 'view')
  })

  it('chama onSelectContact com "edit" ao clicar em "Editar"', async () => {
    setupStore({ contacts: [mockContact({ id: 'c1' })], total: 1 })
    render(<ContactList onSelectContact={onSelectContact} onNewContact={onNewContact} />)
    await userEvent.click(screen.getByTestId('contact-actions-btn'))
    await userEvent.click(screen.getByText('Editar'))
    expect(onSelectContact).toHaveBeenCalledWith('c1', 'edit')
  })

  it('chama updateContact ao clicar em "Bloquear"', async () => {
    const { updateContact } = setupStore({ contacts: [mockContact({ id: 'c1' })], total: 1 })
    render(<ContactList onSelectContact={onSelectContact} onNewContact={onNewContact} />)
    await userEvent.click(screen.getByTestId('contact-actions-btn'))
    await userEvent.click(screen.getByText('Bloquear'))
    expect(updateContact).toHaveBeenCalledWith('c1', { isBlocked: true })
  })

  it('exibe "Desbloquear" quando contato está bloqueado', async () => {
    setupStore({ contacts: [mockContact({ isBlocked: true })], total: 1 })
    render(<ContactList onSelectContact={onSelectContact} onNewContact={onNewContact} />)
    await userEvent.click(screen.getByTestId('contact-actions-btn'))
    expect(screen.getByText('Desbloquear')).toBeInTheDocument()
  })

  it('chama removeContact quando confirma exclusão', async () => {
    const { removeContact } = setupStore({ contacts: [mockContact({ id: 'c1' })], total: 1 })
    window.confirm = jest.fn().mockReturnValue(true)
    render(<ContactList onSelectContact={onSelectContact} onNewContact={onNewContact} />)
    await userEvent.click(screen.getByTestId('contact-actions-btn'))
    await userEvent.click(screen.getByText('Excluir'))
    await waitFor(() => {
      expect(removeContact).toHaveBeenCalledWith('c1')
    })
  })

  it('não chama removeContact quando cancela exclusão', async () => {
    const { removeContact } = setupStore({ contacts: [mockContact({ id: 'c1' })], total: 1 })
    window.confirm = jest.fn().mockReturnValue(false)
    render(<ContactList onSelectContact={onSelectContact} onNewContact={onNewContact} />)
    await userEvent.click(screen.getByTestId('contact-actions-btn'))
    await userEvent.click(screen.getByText('Excluir'))
    expect(removeContact).not.toHaveBeenCalled()
  })

  it('fecha o menu ao clicar no backdrop do menu', async () => {
    setupStore({ contacts: [mockContact()], total: 1 })
    render(<ContactList onSelectContact={onSelectContact} onNewContact={onNewContact} />)
    await userEvent.click(screen.getByTestId('contact-actions-btn'))
    expect(screen.getByTestId('contact-actions-menu')).toBeInTheDocument()
    // Click the invisible backdrop div
    fireEvent.click(document.querySelector('div.fixed.inset-0.z-10')!)
    expect(screen.queryByTestId('contact-actions-menu')).not.toBeInTheDocument()
  })

  it('chama fetchContacts ao clicar em "Tentar novamente"', async () => {
    const { fetchContacts } = setupStore({ error: 'Erro', contacts: [], isLoading: false })
    render(<ContactList onSelectContact={onSelectContact} onNewContact={onNewContact} />)
    await userEvent.click(screen.getByText('Tentar novamente'))
    expect(fetchContacts).toHaveBeenCalledTimes(2)
  })

  it('alterna filtro de bloqueados', async () => {
    const { fetchContacts, setFilters } = setupStore()
    render(<ContactList onSelectContact={onSelectContact} onNewContact={onNewContact} />)
    await userEvent.click(screen.getByTestId('blocked-filter'))
    expect(setFilters).toHaveBeenCalled()
    expect(fetchContacts).toHaveBeenCalledTimes(2)
  })

  it('exibe "+N" quando há mais de 3 tags', () => {
    setupStore({
      contacts: [mockContact({ tags: ['a', 'b', 'c', 'd', 'e'] })],
      total: 1,
    })
    render(<ContactList onSelectContact={onSelectContact} onNewContact={onNewContact} />)
    expect(screen.getByText('+2')).toBeInTheDocument()
  })
})
