import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'System Status | PreciseGovCon',
  description: 'Check the current operational status of PreciseGovCon services and infrastructure.',
  alternates: { canonical: 'https://www.precisegovcon.com/status' },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
