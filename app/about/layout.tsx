import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About PreciseGovCon — Federal Contracting Platform',
  description: 'PreciseGovCon helps small businesses, veteran-owned, and minority-owned companies find and win federal government contracts using real-time SAM.gov data.',
  alternates: { canonical: 'https://www.precisegovcon.com/about' },
  openGraph: { url: 'https://www.precisegovcon.com/about' },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
