import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ContactForm } from './contact-form'
import { useContactsStore } from '@/stores/contacts.store'

jest.mock('@/stores/contacts.store', () => ({
  useContactsStore: jest.fn(),
}))

const mockedUseStore = useContactsStore as jest.MockedFunction<typeof useContactsStore>

function setupStore(overrides: Partial<ReturnType<typeof useContactsStore>> = {}) {
  const createContact = jest.fn().mockResolvedValue({ id: 'new', phone: '11999990000', tags: [], isBlocked: false, createdAt: '' })
  mockedUseStore.mockReturnValue({
    createContact,
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
    updateContact: jest.fn(),
    removeContact: jest.fn(),
    setFilters: jest.fn(),
    clearSelected: jest.fn(),
    ...overrides,
  } as ReturnType<typeof useContactsStore>)
  return { createContact }
}

describe('ContactForm', () => {
  it('renderiza o campo de telefone obrigatório', () => {
    setupStore()
    render(<ContactForm />)
    expect(screen.getByLabelText(/telefone/i)).toBeInTheDocument()
  })

  it('renderiza campos de nome, email, empresa e tags', () => {
    setupStore()
    render(<ContactForm />)
    expect(screen.getByLabelText(/nome/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/empresa/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/tags/i)).toBeInTheDocument()
  })

  it('exibe erro quando telefone está vazio ao submeter', async () => {
    setupStore()
    render(<ContactForm />)
    await userEvent.click(screen.getByRole('button', { name: /criar contato/i }))
    await waitFor(() => {
      expect(screen.getByText('Telefone é obrigatório')).toBeInTheDocument()
    })
  })

  it('exibe erro quando telefone tem menos de 10 dígitos', async () => {
    setupStore()
    render(<ContactForm />)
    await userEvent.type(screen.getByLabelText(/telefone/i), '11999')
    await userEvent.click(screen.getByRole('button', { name: /criar contato/i }))
    await waitFor(() => {
      expect(screen.getByText(/10 ou 11 dígitos/i)).toBeInTheDocument()
    })
  })

  it('exibe erro quando telefone contém letras', async () => {
    setupStore()
    render(<ContactForm />)
    await userEvent.type(screen.getByLabelText(/telefone/i), 'abc1234567')
    await userEvent.click(screen.getByRole('button', { name: /criar contato/i }))
    await waitFor(() => {
      expect(screen.getByText(/10 ou 11 dígitos/i)).toBeInTheDocument()
    })
  })

  it('exibe erro quando email é inválido', async () => {
    setupStore()
    render(<ContactForm />)
    await userEvent.type(screen.getByLabelText(/telefone/i), '11999990000')
    await userEvent.type(screen.getByLabelText(/e-mail/i), 'emailinvalido')
    await userEvent.click(screen.getByRole('button', { name: /criar contato/i }))
    await waitFor(() => {
      expect(screen.getByText('E-mail inválido')).toBeInTheDocument()
    })
  })

  it('chama createContact com os dados corretos ao submeter', async () => {
    const { createContact } = setupStore()
    const onSuccess = jest.fn()
    render(<ContactForm onSuccess={onSuccess} />)

    await userEvent.type(screen.getByLabelText(/telefone/i), '11999990000')
    await userEvent.type(screen.getByLabelText(/nome/i), 'Maria Silva')
    await userEvent.type(screen.getByLabelText(/tags/i), 'vip, cliente')
    await userEvent.click(screen.getByRole('button', { name: /criar contato/i }))

    await waitFor(() => {
      expect(createContact).toHaveBeenCalledWith(
        expect.objectContaining({
          phone: '11999990000',
          name: 'Maria Silva',
          tags: ['vip', 'cliente'],
        }),
      )
    })
  })

  it('chama onSuccess após submissão bem-sucedida', async () => {
    setupStore()
    const onSuccess = jest.fn()
    render(<ContactForm onSuccess={onSuccess} />)

    await userEvent.type(screen.getByLabelText(/telefone/i), '11999990000')
    await userEvent.click(screen.getByRole('button', { name: /criar contato/i }))

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled()
    })
  })

  it('chama onCancel ao clicar em Cancelar', async () => {
    setupStore()
    const onCancel = jest.fn()
    render(<ContactForm onCancel={onCancel} />)
    await userEvent.click(screen.getByRole('button', { name: /cancelar/i }))
    expect(onCancel).toHaveBeenCalled()
  })

  it('exibe mensagem de erro da API quando createContact rejeita', async () => {
    const createContact = jest.fn().mockRejectedValue(new Error('Telefone já cadastrado'))
    mockedUseStore.mockReturnValue({
      createContact,
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
      updateContact: jest.fn(),
      removeContact: jest.fn(),
      setFilters: jest.fn(),
      clearSelected: jest.fn(),
    } as ReturnType<typeof useContactsStore>)

    render(<ContactForm />)
    await userEvent.type(screen.getByLabelText(/telefone/i), '11999990000')
    await userEvent.click(screen.getByRole('button', { name: /criar contato/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Telefone já cadastrado')
    })
  })

  it('mostra Loader2 durante submissão', async () => {
    let resolveCreate!: (v: unknown) => void
    const createContact = jest.fn().mockReturnValue(
      new Promise((r) => { resolveCreate = r }),
    )
    mockedUseStore.mockReturnValue({
      createContact,
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
      updateContact: jest.fn(),
      removeContact: jest.fn(),
      setFilters: jest.fn(),
      clearSelected: jest.fn(),
    } as ReturnType<typeof useContactsStore>)

    render(<ContactForm />)
    await userEvent.type(screen.getByLabelText(/telefone/i), '11999990000')
    await userEvent.click(screen.getByRole('button', { name: /criar contato/i }))

    expect(screen.getByRole('button', { name: /criar contato/i })).toBeDisabled()
    resolveCreate({ id: 'x', phone: '11999990000', tags: [], isBlocked: false, createdAt: '' })
  })
})
