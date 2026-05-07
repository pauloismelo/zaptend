import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ContactDrawer, ContactDrawerWrapper } from './contact-drawer'
import { useContactsStore } from '@/stores/contacts.store'
import type { ContactDetail } from '@/lib/api/contacts'

jest.mock('@/stores/contacts.store', () => ({
  useContactsStore: jest.fn(),
}))

const mockedUseStore = useContactsStore as jest.MockedFunction<typeof useContactsStore>

function mockContactDetail(overrides: Partial<ContactDetail> = {}): ContactDetail {
  return {
    id: 'c1',
    phone: '11999990000',
    name: 'João Silva',
    email: 'joao@email.com',
    company: 'Empresa XYZ',
    tags: ['vip', 'cliente'],
    isBlocked: false,
    createdAt: new Date().toISOString(),
    conversations: [
      { id: 'conv-1', status: 'open', lastMessageAt: new Date().toISOString() },
    ],
    notes: 'Notas do contato',
    ...overrides,
  }
}

function setupStore(overrides: Partial<ReturnType<typeof useContactsStore>> = {}) {
  const updateContact = jest.fn().mockResolvedValue(undefined)
  mockedUseStore.mockReturnValue({
    contacts: [],
    selectedContact: null,
    isLoading: false,
    isLoadingDetail: false,
    error: null,
    total: 0,
    page: 1,
    filters: {},
    fetchContacts: jest.fn(),
    loadMore: jest.fn(),
    selectContact: jest.fn(),
    createContact: jest.fn(),
    updateContact,
    removeContact: jest.fn(),
    setFilters: jest.fn(),
    clearSelected: jest.fn(),
    ...overrides,
  } as ReturnType<typeof useContactsStore>)
  return { updateContact }
}

describe('ContactDrawer', () => {
  const onClose = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renderiza o drawer com detalhes do contato', () => {
    setupStore()
    render(<ContactDrawer contact={mockContactDetail()} onClose={onClose} />)
    expect(screen.getByTestId('contact-drawer')).toBeInTheDocument()
    expect(screen.getByTestId('drawer-view-mode')).toBeInTheDocument()
  })

  it('exibe nome e telefone do contato', () => {
    setupStore()
    render(<ContactDrawer contact={mockContactDetail()} onClose={onClose} />)
    expect(screen.getByText('João Silva')).toBeInTheDocument()
    expect(screen.getByText('11999990000')).toBeInTheDocument()
  })

  it('exibe email do contato', () => {
    setupStore()
    render(<ContactDrawer contact={mockContactDetail()} onClose={onClose} />)
    expect(screen.getByText('joao@email.com')).toBeInTheDocument()
  })

  it('exibe empresa do contato', () => {
    setupStore()
    render(<ContactDrawer contact={mockContactDetail()} onClose={onClose} />)
    expect(screen.getByText('Empresa XYZ')).toBeInTheDocument()
  })

  it('exibe tags como badges', () => {
    setupStore()
    render(<ContactDrawer contact={mockContactDetail()} onClose={onClose} />)
    expect(screen.getByText('vip')).toBeInTheDocument()
    expect(screen.getByText('cliente')).toBeInTheDocument()
  })

  it('exibe badge "Bloqueado" quando isBlocked=true', () => {
    setupStore()
    render(<ContactDrawer contact={mockContactDetail({ isBlocked: true })} onClose={onClose} />)
    expect(screen.getByText('Bloqueado')).toBeInTheDocument()
  })

  it('exibe notas do contato', () => {
    setupStore()
    render(<ContactDrawer contact={mockContactDetail()} onClose={onClose} />)
    expect(screen.getByText('Notas do contato')).toBeInTheDocument()
  })

  it('exibe timeline de conversas', () => {
    setupStore()
    render(<ContactDrawer contact={mockContactDetail()} onClose={onClose} />)
    expect(screen.getByTestId('timeline-list')).toBeInTheDocument()
  })

  it('chama onClose ao clicar no botão fechar', () => {
    setupStore()
    render(<ContactDrawer contact={mockContactDetail()} onClose={onClose} />)
    fireEvent.click(screen.getByLabelText('Fechar'))
    expect(onClose).toHaveBeenCalled()
  })

  it('chama onClose ao clicar no backdrop', () => {
    setupStore()
    render(<ContactDrawer contact={mockContactDetail()} onClose={onClose} />)
    fireEvent.click(screen.getByTestId('drawer-backdrop'))
    expect(onClose).toHaveBeenCalled()
  })

  it('entra no modo edição ao clicar em "Editar"', async () => {
    setupStore()
    render(<ContactDrawer contact={mockContactDetail()} onClose={onClose} />)
    await userEvent.click(screen.getByTestId('edit-button'))
    expect(screen.getByTestId('drawer-edit-mode')).toBeInTheDocument()
  })

  it('volta para view mode ao clicar em "Cancelar" no modo edição', async () => {
    setupStore()
    render(<ContactDrawer contact={mockContactDetail()} onClose={onClose} />)
    await userEvent.click(screen.getByTestId('edit-button'))
    expect(screen.getByTestId('drawer-edit-mode')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /cancelar/i }))
    expect(screen.getByTestId('drawer-view-mode')).toBeInTheDocument()
  })

  it('preenche o formulário com os dados atuais do contato', async () => {
    setupStore()
    render(<ContactDrawer contact={mockContactDetail()} onClose={onClose} />)
    await userEvent.click(screen.getByTestId('edit-button'))
    expect(screen.getByDisplayValue('João Silva')).toBeInTheDocument()
    expect(screen.getByDisplayValue('joao@email.com')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Empresa XYZ')).toBeInTheDocument()
  })

  it('chama updateContact ao submeter o formulário de edição', async () => {
    const { updateContact } = setupStore()
    render(<ContactDrawer contact={mockContactDetail()} onClose={onClose} />)
    await userEvent.click(screen.getByTestId('edit-button'))

    const nameInput = screen.getByDisplayValue('João Silva')
    await userEvent.clear(nameInput)
    await userEvent.type(nameInput, 'Maria Silva')
    await userEvent.click(screen.getByRole('button', { name: /salvar/i }))

    await waitFor(() => {
      expect(updateContact).toHaveBeenCalledWith(
        'c1',
        expect.objectContaining({ name: 'Maria Silva' }),
      )
    })
  })

  it('volta para modo view após salvar com sucesso', async () => {
    setupStore()
    render(<ContactDrawer contact={mockContactDetail()} onClose={onClose} />)
    await userEvent.click(screen.getByTestId('edit-button'))
    await userEvent.click(screen.getByRole('button', { name: /salvar/i }))

    await waitFor(() => {
      expect(screen.getByTestId('drawer-view-mode')).toBeInTheDocument()
    })
  })

  it('exibe mensagem de erro quando updateContact falha', async () => {
    const updateContact = jest.fn().mockRejectedValue(new Error('Erro ao salvar'))
    setupStore({ updateContact } as Partial<ReturnType<typeof useContactsStore>>)

    render(<ContactDrawer contact={mockContactDetail()} onClose={onClose} />)
    await userEvent.click(screen.getByTestId('edit-button'))
    await userEvent.click(screen.getByRole('button', { name: /salvar/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Erro ao salvar')
    })
  })
})

describe('ContactDrawerWrapper', () => {
  beforeEach(() => jest.clearAllMocks())

  it('não renderiza quando isOpen=false', () => {
    setupStore()
    render(<ContactDrawerWrapper isOpen={false} onClose={jest.fn()} />)
    expect(screen.queryByTestId('contact-drawer')).not.toBeInTheDocument()
  })

  it('exibe loading quando isLoadingDetail=true', () => {
    setupStore({ isLoadingDetail: true, selectedContact: null })
    render(<ContactDrawerWrapper isOpen={true} onClose={jest.fn()} />)
    expect(screen.getByTestId('contact-drawer')).toBeInTheDocument()
  })

  it('exibe mensagem quando não há contato selecionado', () => {
    setupStore({ isLoadingDetail: false, selectedContact: null })
    render(<ContactDrawerWrapper isOpen={true} onClose={jest.fn()} />)
    expect(screen.getByText('Nenhum contato selecionado')).toBeInTheDocument()
  })

  it('renderiza ContactDrawer quando há contato selecionado', () => {
    setupStore({ selectedContact: mockContactDetail(), isLoadingDetail: false })
    render(<ContactDrawerWrapper isOpen={true} onClose={jest.fn()} />)
    expect(screen.getByTestId('drawer-view-mode')).toBeInTheDocument()
  })
})
