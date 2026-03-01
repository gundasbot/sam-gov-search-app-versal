import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Changelog | PreciseGovCon Platform Updates',
  description: 'Stay up to date with the latest PreciseGovCon platform improvements, new features, and bug fixes.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
