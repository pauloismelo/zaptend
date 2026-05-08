import { BillingPageClient } from '@/components/billing/billing-page-client'

interface BillingPageProps {
  params: Promise<{ slug: string }>
}

export default async function BillingPage({ params }: BillingPageProps) {
  const { slug } = await params
  return <BillingPageClient slug={slug} />
}

