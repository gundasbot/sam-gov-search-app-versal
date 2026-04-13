import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Us | Government Contracting Support',
  description: 'Get help with SAM registration, proposal writing, federal certifications, and contract search. We respond within 1 business day.',
  alternates: { canonical: '/contact' },
  openGraph: { url: '/contact' },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <h1 className="sr-only">Contact Us | Government Contracting Support</h1>
      {children}
    </>
  )
}
