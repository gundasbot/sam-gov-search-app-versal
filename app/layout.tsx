//app/layout.tsx

import type { Metadata } from 'next'
import ClientLayout from './client-layout'

export const metadata: Metadata = {
  title: {
    default: 'PreciseGovCon - Find Government Contracts Faster | Federal, State & Local Opportunities',
    template: '%s | PreciseGovCon'
  },
  description: 'Search thousands of federal, state, and local government contract opportunities in real-time. Advanced filtering, instant alerts, and powerful analytics to help you win more contracts.',
  keywords: [
    'government contracts',
    'federal contracts',
    'state contracts',
    'local contracts',
    'SAM.gov',
    'government contracting',
    'RFP',
    'RFQ',
    'solicitations',
    'contract opportunities',
    'government bids',
    'precise govcon',
    'precisegovcon',
    'contract search',
    'government procurement',
    'federal opportunities'
  ],
  authors: [{ name: 'PreciseGovCon' }],
  creator: 'PreciseGovCon',
  publisher: 'PreciseGovCon',
  openGraph: {
    title: 'PreciseGovCon - Find Government Contracts Faster',
    description: 'Search thousands of federal, state, and local government contract opportunities in real-time.',
    type: 'website',
    locale: 'en_US',
    siteName: 'PreciseGovCon',
    url: 'https://precisegovcon.com',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PreciseGovCon - Find Government Contracts Faster',
    description: 'Search thousands of federal, state, and local government contract opportunities in real-time.',
    creator: '@precisegovcon',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default'
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <ClientLayout>{children}</ClientLayout>
}