import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Gov Contracting Insights & Analytics',
  description: 'Data-driven insights and analytics for government contractors. Understand market trends, agency spending, and competitor activity to win more federal contracts.',
  alternates: { canonical: '/insights' },
  openGraph: { url: '/insights' },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <h1 className="sr-only">Gov Contracting Insights &amp; Analytics</h1>
      {children}
    </>
  )
}
