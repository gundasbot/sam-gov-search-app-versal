import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Federal Contract Opportunities | Live SAM.gov Search',
  description: 'Browse thousands of live federal contract opportunities from SAM.gov. Filter by NAICS code, agency, set-aside type, and contract value in real-time.',
  alternates: { canonical: 'https://www.precisegovcon.com/opportunities' },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
