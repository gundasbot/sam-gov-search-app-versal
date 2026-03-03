import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About PreciseGovCon | Federal Contracting Platform',
  description: 'Learn how PreciseGovCon helps small businesses, veteran-owned, and minority-owned companies find and win federal government contracts through real-time SAM.gov data.',
  alternates: { canonical: 'https://www.precisegovcon.com/about' },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
