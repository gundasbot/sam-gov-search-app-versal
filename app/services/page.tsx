import type { Metadata } from 'next'
import ServicesClient from './ServicesClient'

export const metadata: Metadata = {
  title: 'Federal Contracting Services | PreciseGovCon',
  description: 'Explore PreciseGovCon services: SAM registration, proposal writing, compliance monitoring, capability statements, and bid analysis.',
  alternates: { canonical: '/services' },
}

export default function ServicesPage() {
  return (
    <>
      <h1 className="sr-only">Federal Contracting Services</h1>
      <ServicesClient />
    </>
  )
}
