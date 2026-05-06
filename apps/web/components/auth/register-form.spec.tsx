import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RegisterForm } from './register-form'
import { useAuthStore } from '@/stores/auth.store'
import { authApi } from '@/lib/api/auth'
import type { AuthResponse } from '@/lib/api/auth'

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: jest.fn() }),
}))

jest.mock('@/stores/auth.store', () => ({
  useAuthStore: Object.assign(jest.fn(), { setState: jest.fn() }),
}))

jest.mock('@/lib/api/auth', () => ({
  authApi: { register: jest.fn() },
}))

const mockAuthResponse: AuthResponse = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  user: { id: 'u1', email: 'joao@emp.com', name: 'João', role: 'owner' },
  tenant: { id: 't1', slug: 'emp', name: 'Emp' },
}

function setupStore(tenant: AuthResponse['tenant'] | null = null) {
  ;(useAuthStore as unknown as jest.Mock).mockReturnValue({ tenant })
}

async function fillForm(overrides: Partial<{
  name: string
  companyName: string
  email: string
  password: string
  confirmPassword: string
}> = {}) {
  const data = {
    name: 'João Silva',
    companyName: 'Minha Empresa',
    email: 'joao@empresa.com',
    password: 'Senha1234',
    confirmPassword: 'Senha1234',
    ...overrides,
  }
  await userEvent.type(screen.getByLabelText('Nome completo'), data.name)
  await userEvent.type(screen.getByLabelText('Nome da empresa'), data.companyName)
  await userEvent.type(screen.getByLabelText('E-mail'), data.email)
  await userEvent.type(screen.getByLabelText('Senha'), data.password)
  await userEvent.type(screen.getByLabelText('Confirmar senha'), data.confirmPassword)
}

describe('RegisterForm', () => {
  beforeEach(() => {
    setupStore()
    jest.clearAllMocks()
  })

  it('renderiza todos os campos obrigatórios', () => {
    render(<RegisterForm />)
    expect(screen.getByLabelText('Nome completo')).toBeInTheDocument()
    expect(screen.getByLabelText('Nome da empresa')).toBeInTheDocument()
    expect(screen.getByLabelText('E-mail')).toBeInTheDocument()
    expect(screen.getByLabelText('Senha')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirmar senha')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /criar conta/i })).toBeInTheDocument()
  })

  it('exibe erro quando nome tem menos de 2 caracteres', async () => {
    render(<RegisterForm />)
    await userEvent.type(screen.getByLabelText('Nome completo'), 'J')
    fireEvent.click(screen.getByRole('button', { name: /criar conta/i }))
    await screen.findByText('Nome deve ter pelo menos 2 caracteres')
  })

  it('exibe erro para e-mail inválido', async () => {
    render(<RegisterForm />)
    await userEvent.type(screen.getByLabelText('Nome completo'), 'João')
    await userEvent.type(screen.getByLabelText('Nome da empresa'), 'Empresa')
    await userEvent.type(screen.getByLabelText('E-mail'), 'invalido')
    fireEvent.click(screen.getByRole('button', { name: /criar conta/i }))
    await screen.findByText('E-mail inválido')
  })

  it('exibe erro quando senha tem menos de 8 caracteres', async () => {
    render(<RegisterForm />)
    await userEvent.type(screen.getByLabelText('Nome completo'), 'João')
    await userEvent.type(screen.getByLabelText('Nome da empresa'), 'Empresa')
    await userEvent.type(screen.getByLabelText('E-mail'), 'j@e.com')
    await userEvent.type(screen.getByLabelText('Senha'), 'Ab1')
    fireEvent.click(screen.getByRole('button', { name: /criar conta/i }))
    await screen.findByText('Senha deve ter pelo menos 8 caracteres')
  })

  it('exibe erro quando as senhas não coincidem', async () => {
    render(<RegisterForm />)
    await fillForm({ confirmPassword: 'SenhaDiferente9' })
    fireEvent.click(screen.getByRole('button', { name: /criar conta/i }))
    await screen.findByText('As senhas não coincidem')
  })

  it('chama authApi.register com dados corretos ao submeter', async () => {
    ;(authApi.register as jest.Mock).mockResolvedValue(mockAuthResponse)
    render(<RegisterForm />)
    await fillForm()
    fireEvent.click(screen.getByRole('button', { name: /criar conta/i }))

    await waitFor(() => {
      expect(authApi.register).toHaveBeenCalledWith({
        name: 'João Silva',
        companyName: 'Minha Empresa',
        email: 'joao@empresa.com',
        password: 'Senha1234',
      })
    })
  })

  it('atualiza a store com os dados do usuário após registro bem-sucedido', async () => {
    ;(authApi.register as jest.Mock).mockResolvedValue(mockAuthResponse)
    render(<RegisterForm />)
    await fillForm()
    fireEvent.click(screen.getByRole('button', { name: /criar conta/i }))

    await waitFor(() => {
      expect(useAuthStore.setState).toHaveBeenCalledWith(
        expect.objectContaining({
          user: mockAuthResponse.user,
          tenant: mockAuthResponse.tenant,
          accessToken: 'access-token',
        }),
      )
    })
  })

  it('exibe mensagem de erro da API quando registro falha', async () => {
    const apiError = Object.assign(new Error('Conflict'), {
      response: { data: { message: 'E-mail já cadastrado' } },
    })
    ;(authApi.register as jest.Mock).mockRejectedValue(apiError)

    render(<RegisterForm />)
    await fillForm()
    fireEvent.click(screen.getByRole('button', { name: /criar conta/i }))

    await screen.findByRole('alert')
    expect(screen.getByRole('alert')).toHaveTextContent('E-mail já cadastrado')
  })

  it('exibe mensagem padrão quando API não retorna mensagem de erro', async () => {
    ;(authApi.register as jest.Mock).mockRejectedValue(new Error('Network'))

    render(<RegisterForm />)
    await fillForm()
    fireEvent.click(screen.getByRole('button', { name: /criar conta/i }))

    await screen.findByRole('alert')
    expect(screen.getByRole('alert')).toHaveTextContent('Erro ao criar conta')
  })

  it('desabilita o botão durante isSubmitting', async () => {
    let resolve!: (v: AuthResponse) => void
    ;(authApi.register as jest.Mock).mockReturnValue(new Promise<AuthResponse>((r) => { resolve = r }))

    render(<RegisterForm />)
    await fillForm()
    fireEvent.click(screen.getByRole('button', { name: /criar conta/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /criar conta/i })).toBeDisabled()
    })

    resolve(mockAuthResponse)
  })
})
