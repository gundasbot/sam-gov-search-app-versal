// app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/layout/Footer'
import AuthProvider from './providers'
import AuthModalProvider from '@/components/auth/AuthModalProvider'
import SmoothScrollProvider from '@/components/SmoothScrollProvider'
import FloatingCTA from '@/components/FloatingCTA'
import BrowsingTimerBanner from '@/components/BrowsingTimerBanner'
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})

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
  verification: {
    // Add your verification codes when you have them:
    // google: 'your-google-verification-code',
    // bing: 'your-bing-verification-code',
  },
  alternates: {
    canonical: 'https://precisegovcon.com',
  },
  category: 'Business',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen`} style={{ isolation: 'isolate' }}>
        <AuthProvider>
          <AuthModalProvider>
            <SmoothScrollProvider>
              <Header />
              <BrowsingTimerBanner />
              
              <main>
                {children}
              </main>

              <Footer />
              <FloatingCTA />
            </SmoothScrollProvider>
          </AuthModalProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
