import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Super Admin' }

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Admin Sidebar */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
