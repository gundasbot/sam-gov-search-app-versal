import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Accessibility Statement',
  description: 'PreciseGovCon is committed to making our government contract search platform accessible to all users, including those using assistive technologies.',
  alternates: { canonical: '/accessibility' },
  openGraph: { url: '/accessibility' },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
