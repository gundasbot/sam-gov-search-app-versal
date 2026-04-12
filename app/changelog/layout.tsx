import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Changelog | Platform Updates',
  description: 'Stay up to date with the latest PreciseGovCon platform improvements, new features, and bug fixes.',
  alternates: { canonical: 'https://www.precisegovcon.com/changelog' },
  openGraph: { url: 'https://www.precisegovcon.com/changelog' },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
