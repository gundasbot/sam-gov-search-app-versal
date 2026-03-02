import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Set-Aside Certifications | 8(a) SDVOSB HUBZone | PGC',
  description: 'Get help obtaining 8(a), WOSB, HUBZone, SDVOSB, and other set-aside certifications to access exclusive federal contracting opportunities.',
  alternates: { canonical: 'https://www.precisegovcon.com/services/set-aside-certifications' },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}