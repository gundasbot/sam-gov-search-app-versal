import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Documentation | API & Platform Docs',
  description: 'Technical documentation for the PreciseGovCon platform and API integration guides.',
  alternates: { canonical: '/docs' },
  openGraph: { url: '/docs' },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
