import type { Metadata } from 'next'
import SetAsideClient from './SetAsideClient'

export const metadata: Metadata = {
  title: 'Set-Aside Certifications | SDVOSB, 8(a) & HUBZone',
  description: 'Get certified as SDVOSB, 8(a), HUBZone, WOSB, or EDWOSB. Eligibility screening, application support, and compliance guidance for federal set-aside programs.',
  alternates: { canonical: 'https://www.precisegovcon.com/services/set-aside-certifications' },
  openGraph: { url: 'https://www.precisegovcon.com/services/set-aside-certifications' },
}

export default function SetAsideCertificationsPage() {
  return <SetAsideClient />
}
