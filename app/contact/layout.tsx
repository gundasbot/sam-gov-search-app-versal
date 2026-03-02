import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact PreciseGovCon | Government Contracting Support',
  description: 'Contact PreciseGovCon for expert help with SAM registration, proposal writing, federal certifications, and government contract search. We respond within 1 business day.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}