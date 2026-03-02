import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Gov Contracting Insights & Analytics | PreciseGovCon',
  description: 'Data-driven insights and analytics for government contractors. Understand market trends, agency spending, and competitor activity to win more federal contracts.',
  alternates: { canonical: 'https://www.precisegovcon.com/insights' },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
