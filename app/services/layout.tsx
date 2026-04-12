import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Government Contracting Services | PreciseGovCon',
  description: 'Expert government contracting services including SAM registration, proposal writing, bid/no-bid analysis, set-aside certifications, and capability statements.',
  alternates: { canonical: 'https://www.precisegovcon.com/services' },
}

const servicesFontFamily = "'Aptos', 'Aptos Display', 'Segoe UI Variable', 'Segoe UI', 'Inter', system-ui, sans-serif"

export default function Layout({ children }: { children: React.ReactNode }) {
  return <div style={{ fontFamily: servicesFontFamily }}>{children}</div>
}
