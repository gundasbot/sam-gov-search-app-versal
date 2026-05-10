import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Support | Help Center',
  description: 'Get help with the PreciseGovCon government contract search platform. Browse FAQs, contact support, or schedule a demo with our team.',
  alternates: { canonical: '/support' },
  openGraph: { url: '/support' },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
