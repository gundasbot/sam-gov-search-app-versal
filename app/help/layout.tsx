import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Help Center',
  description: 'Find answers to common questions about using PreciseGovCon to search and win government contracts.',
  alternates: { canonical: 'https://www.precisegovcon.com/help' },
  openGraph: { url: 'https://www.precisegovcon.com/help' },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
