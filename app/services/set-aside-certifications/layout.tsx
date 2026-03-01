import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Set-Aside Certifications for Government Contracts | PreciseGovCon',
  description: 'Get help obtaining 8(a), WOSB, HUBZone, SDVOSB, and other set-aside certifications to access exclusive federal contracting opportunities.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
