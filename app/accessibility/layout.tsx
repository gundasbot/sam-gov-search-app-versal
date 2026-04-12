import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Accessibility',
  description: 'PreciseGovCon is committed to making our government contract platform accessible to all users.',
  alternates: { canonical: 'https://www.precisegovcon.com/accessibility' },
  openGraph: { url: 'https://www.precisegovcon.com/accessibility' },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
