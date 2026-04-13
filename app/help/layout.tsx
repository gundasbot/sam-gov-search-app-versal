import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Help Center | Government Contract Search Support',
  description: 'Find answers to common questions about using PreciseGovCon to search, track, and win government contracts.',
  alternates: { canonical: '/help' },
  openGraph: { url: '/help' },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
