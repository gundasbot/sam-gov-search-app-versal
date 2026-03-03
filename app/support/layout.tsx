import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Support | PreciseGovCon Help Center',
  description: 'Get help with the PreciseGovCon government contract search platform. Browse FAQs, contact support, or schedule a demo with our team.',
  alternates: { canonical: 'https://www.precisegovcon.com/support' },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
