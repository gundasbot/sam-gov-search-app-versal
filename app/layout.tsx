//app/layout.tsx

import type { Metadata } from 'next'
import ClientLayout from './client-layout'
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  fallback: ['system-ui', 'sans-serif']
})

export const metadata: Metadata = {
  metadataBase: new URL('https://www.precisegovcon.com'),  // Fixed: www to match live domain
  title: {
    default: 'Government Contract Search | PreciseGovCon',
    template: '%s | PreciseGovCon'
  },
  description: 'Find federal contracts fast. Search SAM.gov, track opportunities, get alerts. PreciseGovCon helps contractors win bids.',
  keywords: [
    'government contracts', 'federal contracts', 'state contracts', 'local contracts',
    'SAM.gov', 'government contracting', 'RFP', 'RFQ', 'solicitations',
    'contract opportunities', 'government bids', 'precise govcon', 'precisegovcon',
    'contract search', 'government procurement', 'federal opportunities'
  ],
  authors: [{ name: 'PreciseGovCon' }],
  creator: 'PreciseGovCon',
  publisher: 'PreciseGovCon',
  alternates: {
    canonical: '/',  // Fixes: Canonicals Missing warning
  },
  // Add your Google Search Console verification code here when ready:
  // verification: { google: 'YOUR_CODE_HERE' },
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
    url: 'https://www.precisegovcon.com',  // Fixed: www
    images: [{ url: '/android-chrome-512x512.png', width: 512, height: 512, alt: 'PreciseGovCon' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PreciseGovCon - Find Government Contracts Faster',
    description: 'Search thousands of federal, state, and local government contract opportunities in real-time.',
    creator: '@precisegovcon',
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
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="h-full antialiased scroll-smooth"
    >
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#ffffff" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body
        className={`${inter.className} min-h-screen text-base
          selection:bg-primary-500 selection:text-white
          supports-[overflow-anchor:clip]:overflow-anchor-auto`}
        style={{
          WebkitTextSizeAdjust: '100%',
          textSizeAdjust: '100%',
          isolation: 'isolate'
        }}
      >
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}