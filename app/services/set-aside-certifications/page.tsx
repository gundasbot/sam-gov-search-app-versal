import type { Metadata } from 'next'
import SetAsideClient from './SetAsideClient'

export const metadata: Metadata = {
  title: 'Set-Aside Certifications | 8(a), SDVOSB, HUBZone',
  description: 'Get certified as SDVOSB, 8(a), HUBZone, WOSB, or EDWOSB. Eligibility screening, application support, and compliance guidance for federal set-aside programs.',
  alternates: { canonical: '/services/set-aside-certifications' },
  openGraph: { url: '/services/set-aside-certifications' },
}

export default function SetAsideCertificationsPage() {
  return <SetAsideClient />
}
