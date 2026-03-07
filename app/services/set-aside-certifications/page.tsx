import type { Metadata } from 'next'
import SetAsideClient from './SetAsideClient'

export const metadata: Metadata = {
  title: 'Set-Aside Certifications | SDVOSB & 8(a) | PreciseGovCon',
  description: 'Get certified as SDVOSB, 8(a), HUBZone, or WOSB. We guide you through the entire federal set-aside certification process.',
  alternates: { canonical: 'https://www.precisegovcon.com/services/set-aside-certifications' },
}

export default function SetAsideCertificationsPage() {
  return <SetAsideClient />
}
