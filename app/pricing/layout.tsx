import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing | Government Contract Software',
  description: 'Affordable pricing plans for government contractors. Access real-time SAM.gov opportunities, AI-powered bid scoring, and contract alerts.',
  alternates: { canonical: 'https://www.precisegovcon.com/pricing' },
  openGraph: { url: 'https://www.precisegovcon.com/pricing' },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
