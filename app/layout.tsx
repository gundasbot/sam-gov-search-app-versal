//app/layout.tsx

import type { Metadata } from 'next'
import ClientLayout from './client-layout'
import './globals.css'
import { Manrope, Sora } from 'next/font/google'

const manrope = Manrope({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-ui',
})

const sora = Sora({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://www.precisegovcon.com'),
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
  alternates: { canonical: '/' },
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
    url: 'https://www.precisegovcon.com',
    images: [{ url: '/logo.png', width: 1024, height: 1024, alt: 'PreciseGovCon' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PreciseGovCon - Find Government Contracts Faster',
    description: 'Search thousands of federal, state, and local government contract opportunities in real-time.',
    creator: '@precisegovcon',
    images: ['/logo.png']
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
  manifest: '/site.webmanifest',
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default'
  },
}

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'PreciseGovCon',
  url: 'https://www.precisegovcon.com',
  logo: 'https://www.precisegovcon.com/logo.png',
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'support@precisegovcon.com',
    contactType: 'customer support',
    availableLanguage: 'English',
  },
  sameAs: ['https://twitter.com/precisegovcon'],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${manrope.variable} ${sora.variable} h-full antialiased scroll-smooth`}
    >
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#ffffff" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" href="/favicon.ico" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body
        className="pg-uniform min-h-screen text-base sm:text-[1.06rem]
          selection:bg-primary-500 selection:text-white
          supports-[overflow-anchor:clip]:overflow-anchor-auto"
        style={{
          fontFamily: "Aptos, 'Segoe UI', var(--font-ui), system-ui, sans-serif",
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