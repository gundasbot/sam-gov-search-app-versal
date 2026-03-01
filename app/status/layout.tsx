import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'System Status | PreciseGovCon',
  description: 'Check the current operational status of PreciseGovCon services and infrastructure.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
