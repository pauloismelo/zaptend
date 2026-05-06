import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Painel Admin' }

export default function AdminPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Super Admin</h1>
      <p className="text-muted-foreground">Gerencie todos os tenants da plataforma</p>
    </div>
  )
}
