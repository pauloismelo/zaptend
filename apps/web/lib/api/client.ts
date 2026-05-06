import axios from 'axios'

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001',
  headers: { 'Content-Type': 'application/json' },
})

const STORAGE_KEY = 'zaptend-auth'

function getStoredState(): Record<string, unknown> | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Record<string, unknown>) : null
  } catch {
    return null
  }
}

apiClient.interceptors.request.use((config) => {
  const stored = getStoredState()
  const state = stored?.state as Record<string, unknown> | undefined
  const token = state?.accessToken as string | undefined
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let isRefreshing = false
let refreshQueue: Array<(token: string) => void> = []

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean }

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve) => {
        refreshQueue.push((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          resolve(apiClient(originalRequest))
        })
      })
    }

    originalRequest._retry = true
    isRefreshing = true

    const stored = getStoredState()
    const state = stored?.state as Record<string, unknown> | undefined
    const refreshToken = state?._refreshToken as string | undefined

    if (!refreshToken) {
      isRefreshing = false
      if (typeof window !== 'undefined') window.location.href = '/login'
      return Promise.reject(error)
    }

    try {
      const { data } = await axios.post<{ accessToken: string; refreshToken: string }>(
        `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/auth/refresh`,
        { refreshToken },
      )

      // Update persisted store with new tokens
      if (stored && typeof stored === 'object') {
        const updatedStored = {
          ...stored,
          state: { ...(stored.state as object), accessToken: data.accessToken, _refreshToken: data.refreshToken },
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedStored))
      }

      originalRequest.headers.Authorization = `Bearer ${data.accessToken}`
      refreshQueue.forEach((cb) => cb(data.accessToken))
      refreshQueue = []

      return apiClient(originalRequest)
    } catch (refreshError) {
      refreshQueue = []
      localStorage.removeItem(STORAGE_KEY)
      if (typeof window !== 'undefined') window.location.href = '/login'
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  },
)
