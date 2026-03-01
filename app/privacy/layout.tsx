import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | PreciseGovCon',
  description: 'Read the PreciseGovCon privacy policy to understand how we collect, use, and protect your data.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
