import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Documentation | PreciseGovCon API & Platform Docs',
  description: 'Technical documentation for the PreciseGovCon platform and API integration guides.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
