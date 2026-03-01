import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact PreciseGovCon | Government Contracting Support',
  description: 'Get in touch with the PreciseGovCon team for support, sales, or questions about our government contract search platform.',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
