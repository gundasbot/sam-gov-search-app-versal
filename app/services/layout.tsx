import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Government Contracting Services',
  description: 'Expert government contracting services including SAM registration, proposal writing, bid/no-bid analysis, set-aside certifications, and capability statements.',
  alternates: { canonical: '/services' },
  openGraph: { url: '/services' },
}

const servicesFontFamily = "Inter, var(--font-inter), Aptos, 'Segoe UI', var(--font-ui), system-ui, sans-serif"

export default function Layout({ children }: { children: React.ReactNode }) {
  return <div style={{ fontFamily: servicesFontFamily }}>{children}</div>
}
