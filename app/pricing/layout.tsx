import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing | PreciseGovCon Government Contract Software',
  description: 'Affordable pricing plans for government contractors. Start with a free trial and access real-time SAM.gov opportunities, AI-powered bid scoring, and contract alerts.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}