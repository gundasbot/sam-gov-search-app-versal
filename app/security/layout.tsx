import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Security | PreciseGovCon Data Protection',
  description: 'Learn how PreciseGovCon protects your data with enterprise-grade security, encryption, and compliance standards.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
