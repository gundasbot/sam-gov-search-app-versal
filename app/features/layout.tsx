import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Features | PreciseGovCon Contract Search Tools',
  description: 'Explore PreciseGovCon powerful features including real-time SAM.gov search, AI bid scoring, contract alerts, pipeline tracking, and compliance management.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}