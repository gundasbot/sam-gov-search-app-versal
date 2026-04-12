import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Read the PreciseGovCon privacy policy to understand how we collect, use, and protect your data.',
  alternates: { canonical: 'https://www.precisegovcon.com/privacy' },
  openGraph: { url: 'https://www.precisegovcon.com/privacy' },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
