//app/layout.tsx

import type { Metadata } from 'next'
import ClientLayout from './client-layout'

export const metadata: Metadata = {
  // ✅ Critical so OG/Twitter images resolve as absolute URLs
  metadataBase: new URL('https://precisegovcon.com'),

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

  // ✅ THIS replaces the Vercel favicon in browsers + many previews
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' }
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }]
  },

  openGraph: {
    title: 'PreciseGovCon - Find Government Contracts Faster',
    description: 'Search thousands of federal, state, and local government contract opportunities in real-time.',
    type: 'website',
    locale: 'en_US',
    siteName: 'PreciseGovCon',
    url: 'https://precisegovcon.com',

    // ✅ THIS is what shows as the big preview image in emails/link unfurls
    images: [
      {
        url: '/android-chrome-512x512.png',
        width: 512,
        height: 512,
        alt: 'PreciseGovCon'
      }
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'PreciseGovCon - Find Government Contracts Faster',
    description: 'Search thousands of federal, state, and local government contract opportunities in real-time.',
    creator: '@precisegovcon',

    // ✅ Twitter/Slack/Discord/Gmail often uses this
    images: ['/android-chrome-512x512.png']
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
