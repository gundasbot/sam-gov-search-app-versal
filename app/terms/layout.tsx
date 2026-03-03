import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | PreciseGovCon',
  description: 'Read the PreciseGovCon terms of service for our government contract search and management platform.',
  alternates: { canonical: 'https://www.precisegovcon.com/terms' },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
