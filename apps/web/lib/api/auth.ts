import { apiClient } from './client'

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  companyName: string
  email: string
  password: string
}

export interface AuthUser {
  id: string
  email: string
  name: string
  role: string
}

export interface AuthTenant {
  id: string
  slug: string
  name: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: AuthUser
  tenant: AuthTenant
}

export interface RefreshResponse {
  accessToken: string
  refreshToken: string
}

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<AuthResponse>('/auth/login', data).then((r) => r.data),

  register: (data: RegisterRequest) =>
    apiClient.post<AuthResponse>('/auth/register', data).then((r) => r.data),

  refresh: (refreshToken: string) =>
    apiClient
      .post<RefreshResponse>('/auth/refresh', { refreshToken })
      .then((r) => r.data),

  logout: () => apiClient.post('/auth/logout').catch(() => undefined),
}
