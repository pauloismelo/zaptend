import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard' }

export default function TenantLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar será adicionada aqui */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
