import { act } from 'react'
import { useAuthStore } from './auth.store'
import { authApi } from '@/lib/api/auth'
import type { AuthResponse } from '@/lib/api/auth'

jest.mock('@/lib/api/auth', () => ({
  authApi: {
    login: jest.fn(),
    register: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
  },
}))

const mockAuthResponse: AuthResponse = {
  accessToken: 'access-token-123',
  refreshToken: 'refresh-token-456',
  user: { id: 'user-1', email: 'joao@empresa.com', name: 'João Silva', role: 'admin' },
  tenant: { id: 'tenant-1', slug: 'minha-empresa', name: 'Minha Empresa' },
}

function resetStore() {
  useAuthStore.setState({
    user: null,
    tenant: null,
    accessToken: null,
    _refreshToken: null,
    isLoading: false,
    error: null,
  })
}

describe('useAuthStore', () => {
  beforeEach(() => {
    resetStore()
    jest.clearAllMocks()
  })

  describe('login', () => {
    it('popula user, tenant e accessToken após login com sucesso', async () => {
      ;(authApi.login as jest.Mock).mockResolvedValue(mockAuthResponse)

      await act(async () => {
        await useAuthStore.getState().login('joao@empresa.com', '123456')
      })

      const state = useAuthStore.getState()
      expect(state.user).toEqual(mockAuthResponse.user)
      expect(state.tenant).toEqual(mockAuthResponse.tenant)
      expect(state.accessToken).toBe('access-token-123')
      expect(state._refreshToken).toBe('refresh-token-456')
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
    })

    it('define error e relança exceção em caso de falha', async () => {
      const apiError = Object.assign(new Error('Unauthorized'), {
        response: { data: { message: 'E-mail ou senha inválidos' } },
      })
      ;(authApi.login as jest.Mock).mockRejectedValue(apiError)

      await act(async () => {
        await expect(
          useAuthStore.getState().login('wrong@email.com', 'wrong'),
        ).rejects.toThrow()
      })

      const state = useAuthStore.getState()
      expect(state.error).toBe('E-mail ou senha inválidos')
      expect(state.user).toBeNull()
      expect(state.accessToken).toBeNull()
      expect(state.isLoading).toBe(false)
    })

    it('usa mensagem padrão quando API não retorna mensagem de erro', async () => {
      ;(authApi.login as jest.Mock).mockRejectedValue(new Error('Network Error'))

      await act(async () => {
        await expect(useAuthStore.getState().login('a@b.com', '123')).rejects.toThrow()
      })

      expect(useAuthStore.getState().error).toBe('E-mail ou senha inválidos')
    })

    it('define isLoading=true durante o request', async () => {
      let resolveLogin!: (v: AuthResponse) => void
      ;(authApi.login as jest.Mock).mockReturnValue(
        new Promise<AuthResponse>((r) => { resolveLogin = r }),
      )

      act(() => { useAuthStore.getState().login('a@b.com', '123') })
      expect(useAuthStore.getState().isLoading).toBe(true)

      await act(async () => { resolveLogin(mockAuthResponse) })
      expect(useAuthStore.getState().isLoading).toBe(false)
    })
  })

  describe('logout', () => {
    it('limpa todos os dados de autenticação', async () => {
      useAuthStore.setState({
        user: mockAuthResponse.user,
        tenant: mockAuthResponse.tenant,
        accessToken: 'token',
        _refreshToken: 'refresh',
      })
      ;(authApi.logout as jest.Mock).mockResolvedValue(undefined)

      await act(async () => {
        await useAuthStore.getState().logout()
      })

      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.tenant).toBeNull()
      expect(state.accessToken).toBeNull()
      expect(state._refreshToken).toBeNull()
    })
  })

  describe('refreshToken', () => {
    it('atualiza accessToken e _refreshToken com sucesso', async () => {
      useAuthStore.setState({ _refreshToken: 'old-refresh', accessToken: 'old-access' })
      ;(authApi.refresh as jest.Mock).mockResolvedValue({
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
      })

      await act(async () => {
        await useAuthStore.getState().refreshToken()
      })

      const state = useAuthStore.getState()
      expect(state.accessToken).toBe('new-access')
      expect(state._refreshToken).toBe('new-refresh')
    })

    it('não faz nada quando _refreshToken é null', async () => {
      useAuthStore.setState({ _refreshToken: null })

      await act(async () => {
        await useAuthStore.getState().refreshToken()
      })

      expect(authApi.refresh).not.toHaveBeenCalled()
    })

    it('limpa state quando refresh falha', async () => {
      useAuthStore.setState({
        _refreshToken: 'expired-refresh',
        user: mockAuthResponse.user,
        tenant: mockAuthResponse.tenant,
      })
      ;(authApi.refresh as jest.Mock).mockRejectedValue(new Error('Expired'))

      await act(async () => {
        await expect(useAuthStore.getState().refreshToken()).rejects.toThrow()
      })

      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.tenant).toBeNull()
      expect(state.accessToken).toBeNull()
    })
  })

  describe('clearError', () => {
    it('limpa o campo error', () => {
      useAuthStore.setState({ error: 'algum erro' })
      useAuthStore.getState().clearError()
      expect(useAuthStore.getState().error).toBeNull()
    })
  })
})
