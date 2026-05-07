'use client'

import { useRouter } from 'next/navigation'
import { Bell, LogOut, Wifi, WifiOff } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { useSocketStore } from '@/stores/socket.store'

export function Header() {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const tenant = useAuthStore((s) => s.tenant)
  const logout = useAuthStore((s) => s.logout)
  const connected = useSocketStore((s) => s.connected)

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  const initials = user?.name?.charAt(0).toUpperCase() ?? 'U'

  return (
    <header
      data-testid="header"
      className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-6"
    >
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-foreground">{tenant?.name}</span>
        {connected ? (
          <Wifi
            data-testid="icon-connected"
            className="w-3.5 h-3.5 text-green-500"
            aria-label="Conectado"
          />
        ) : (
          <WifiOff
            data-testid="icon-disconnected"
            className="w-3.5 h-3.5 text-destructive"
            aria-label="Desconectado"
          />
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Notificações"
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <Bell className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2">
          <div
            data-testid="user-avatar"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
          >
            {initials}
          </div>
          <span className="hidden text-sm text-muted-foreground sm:block">{user?.name}</span>
        </div>

        <button
          type="button"
          aria-label="Sair"
          onClick={handleLogout}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}
