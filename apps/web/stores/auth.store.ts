import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { authApi, type AuthUser, type AuthTenant } from '@/lib/api/auth'

interface AuthState {
  user: AuthUser | null
  tenant: AuthTenant | null
  accessToken: string | null
  _refreshToken: string | null
  isLoading: boolean
  error: string | null

  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshToken: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tenant: null,
      accessToken: null,
      _refreshToken: null,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          const data = await authApi.login({ email, password })
          set({
            user: data.user,
            tenant: data.tenant,
            accessToken: data.accessToken,
            _refreshToken: data.refreshToken,
            isLoading: false,
          })
        } catch (err: unknown) {
          const message = getErrorMessage(err) ?? 'E-mail ou senha inválidos'
          set({ error: message, isLoading: false })
          throw err
        }
      },

      logout: async () => {
        await authApi.logout()
        set({ user: null, tenant: null, accessToken: null, _refreshToken: null, error: null })
      },

      refreshToken: async () => {
        const currentRefresh = get()._refreshToken
        if (!currentRefresh) return

        set({ isLoading: true })
        try {
          const data = await authApi.refresh(currentRefresh)
          set({ accessToken: data.accessToken, _refreshToken: data.refreshToken, isLoading: false })
        } catch (err: unknown) {
          set({ user: null, tenant: null, accessToken: null, _refreshToken: null, isLoading: false })
          throw err
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'zaptend-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        tenant: state.tenant,
        accessToken: state.accessToken,
        _refreshToken: state._refreshToken,
      }),
    },
  ),
)

function getErrorMessage(err: unknown): string | null {
  if (err && typeof err === 'object' && 'response' in err) {
    const response = (err as { response?: { data?: { message?: string } } }).response
    return response?.data?.message ?? null
  }
  return null
}
