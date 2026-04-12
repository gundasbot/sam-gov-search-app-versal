import type { Metadata } from 'next'
export const metadata: Metadata = {
  title: 'Contract Alerts & Saved Searches | PreciseGovCon',
  robots: { index: false, follow: false },
}
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
