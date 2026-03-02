import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Security | PreciseGovCon Data Protection',
  description: 'Learn how PreciseGovCon protects your data with enterprise-grade security, encryption, and compliance standards.',
  alternates: { canonical: 'https://www.precisegovcon.com/security' },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
