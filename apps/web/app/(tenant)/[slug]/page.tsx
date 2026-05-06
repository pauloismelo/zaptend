import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Visão Geral' }

interface Props {
  params: Promise<{ slug: string }>
}

export default async function TenantDashboardPage({ params }: Props) {
  const { slug } = await params
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="text-muted-foreground">Tenant: {slug}</p>
    </div>
  )
}
