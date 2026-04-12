//app/layout.tsx

import type { Metadata } from 'next'
import ClientLayout from './client-layout'
import './globals.css'
import { Manrope, Sora, Inter } from 'next/font/google'

function resolveMetadataBase(): URL {
  const candidates: Array<string | undefined> = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.SITE_URL,
    process.env.NEXTAUTH_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  ]

  for (const raw of candidates) {
    if (!raw) continue
    try {
      return new URL(raw)
    } catch {
      // ignore invalid values
    }
  }

  return new URL('https://www.precisegovcon.com')
}

const METADATA_BASE = resolveMetadataBase()

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

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  metadataBase: METADATA_BASE,
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
      className={`${manrope.variable} ${sora.variable} ${inter.variable} h-full antialiased scroll-smooth`}
     data-theme="light">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#ffffff" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" href="/favicon.ico" />
        {/* Add Google Fonts link as fallback */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap" rel="stylesheet" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body
        className="min-h-screen text-base sm:text-[1.06rem]
          selection:bg-primary-500 selection:text-white
          supports-[overflow-anchor:clip]:overflow-anchor-auto"
        style={{
          fontFamily: "Inter, var(--font-inter), Aptos, 'Segoe UI', var(--font-ui), system-ui, sans-serif",
          WebkitTextSizeAdjust: '100%',
          textSizeAdjust: '100%',
          isolation: 'isolate'
        }}
      >
      <script dangerouslySetInnerHTML={{__html:`
    (function(){
      try{localStorage.setItem('theme','light')}catch(e){}
      document.documentElement.setAttribute('data-theme','light');
      document.documentElement.classList.remove('dark');
    })();
  `}} />
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}
