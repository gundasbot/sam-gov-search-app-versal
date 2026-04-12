import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Read the PreciseGovCon terms of service for our government contract search and management platform.',
  alternates: { canonical: '/terms' },
  openGraph: { url: '/terms' },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
