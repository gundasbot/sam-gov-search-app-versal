import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Security & Data Protection',
  description: 'Learn how PreciseGovCon protects your data with enterprise-grade security, encryption, and compliance standards.',
  alternates: { canonical: '/security' },
  openGraph: { url: '/security' },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
