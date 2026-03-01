import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Government Contracting Services | PreciseGovCon',
  description: 'Expert government contracting services including SAM registration, proposal writing, bid/no-bid analysis, set-aside certifications, and capability statements.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
