import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from './login-form'
import { useAuthStore } from '@/stores/auth.store'

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: jest.fn() }),
}))

jest.mock('@/stores/auth.store', () => ({
  useAuthStore: jest.fn(),
}))

const mockLogin = jest.fn()
const mockClearError = jest.fn()

function setupStore(overrides: Partial<ReturnType<typeof useAuthStore>> = {}) {
  const defaults = {
    isLoading: false,
    error: null,
    tenant: null,
    login: mockLogin,
    clearError: mockClearError,
  }
  ;(useAuthStore as unknown as jest.Mock).mockReturnValue({ ...defaults, ...overrides })
}

describe('LoginForm', () => {
  beforeEach(() => {
    setupStore()
    jest.clearAllMocks()
  })

  it('renderiza campos de e-mail e senha', () => {
    render(<LoginForm />)
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument()
    expect(screen.getByLabelText('Senha')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument()
  })

  it('exibe erro de validação para e-mail inválido', async () => {
    render(<LoginForm />)
    await userEvent.type(screen.getByLabelText('E-mail'), 'nao-e-email')
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }))
    await screen.findByText('E-mail inválido')
  })

  it('exibe erro de validação quando senha está vazia', async () => {
    render(<LoginForm />)
    await userEvent.type(screen.getByLabelText('E-mail'), 'joao@empresa.com')
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }))
    await screen.findByText('Senha é obrigatória')
  })

  it('chama login com email e password corretos ao submeter', async () => {
    mockLogin.mockResolvedValue(undefined)
    render(<LoginForm />)

    await userEvent.type(screen.getByLabelText('E-mail'), 'joao@empresa.com')
    await userEvent.type(screen.getByLabelText('Senha'), 'minhaSenha123')
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }))

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('joao@empresa.com', 'minhaSenha123')
    })
  })

  it('desabilita o botão durante isLoading', () => {
    setupStore({ isLoading: true })
    render(<LoginForm />)
    expect(screen.getByRole('button', { name: /entrar/i })).toBeDisabled()
  })

  it('exibe spinner durante isLoading', () => {
    setupStore({ isLoading: true })
    render(<LoginForm />)
    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('exibe mensagem de erro da store', () => {
    setupStore({ error: 'E-mail ou senha inválidos' })
    render(<LoginForm />)
    expect(screen.getByRole('alert')).toHaveTextContent('E-mail ou senha inválidos')
  })

  it('chama clearError ao submeter', async () => {
    mockLogin.mockResolvedValue(undefined)
    render(<LoginForm />)
    await userEvent.type(screen.getByLabelText('E-mail'), 'joao@empresa.com')
    await userEvent.type(screen.getByLabelText('Senha'), 'senha123')
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }))

    await waitFor(() => expect(mockClearError).toHaveBeenCalled())
  })
})
