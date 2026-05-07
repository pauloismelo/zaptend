'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  MessageCircle,
  Users,
  LayoutGrid,
  Megaphone,
  GitBranch,
  BarChart2,
  Settings,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { label: 'Inbox', href: 'inbox', icon: MessageCircle },
  { label: 'Contatos', href: 'contacts', icon: Users },
  { label: 'Pipeline', href: 'pipeline', icon: LayoutGrid },
  { label: 'Broadcasts', href: 'broadcasts', icon: Megaphone },
  { label: 'Fluxos', href: 'flows', icon: GitBranch },
  { label: 'Relatórios', href: 'reports', icon: BarChart2 },
] as const

interface SidebarProps {
  slug: string
}

export function Sidebar({ slug }: SidebarProps) {
  const pathname = usePathname()

  const isActive = (href: string) => pathname.includes(`/${slug}/${href}`)

  const navLinkClass = (active: boolean) =>
    cn(
      'flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
      active
        ? 'bg-primary text-primary-foreground'
        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
    )

  return (
    <aside
      data-testid="sidebar"
      className="flex h-screen w-16 flex-col items-center border-r border-border bg-card py-4 gap-1"
    >
      <div className="mb-4 flex h-10 w-10 items-center justify-center">
        <Zap className="w-6 h-6 text-primary" />
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={`/${slug}/${href}`}
            title={label}
            aria-label={label}
            className={navLinkClass(isActive(href))}
          >
            <Icon className="w-5 h-5" />
          </Link>
        ))}
      </nav>

      <Link
        href={`/${slug}/settings`}
        title="Configurações"
        aria-label="Configurações"
        className={navLinkClass(isActive('settings'))}
      >
        <Settings className="w-5 h-5" />
      </Link>
    </aside>
  )
}
