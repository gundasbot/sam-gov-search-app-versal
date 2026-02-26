//app/client-layout.tsx

"use client";

import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/layout/Footer'
import AuthProvider from './providers'
import AuthModalProvider from '@/components/auth/AuthModalProvider'
import SmoothScrollProvider from '@/components/SmoothScrollProvider'
import FloatingCTA from '@/components/FloatingCTA'
import BrowsingTimerBanner from '@/components/BrowsingTimerBanner'
import CookieConsent from '@/components/CookieConsent'
import { Manrope, Sora } from 'next/font/google'
import { useEffect } from 'react'

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

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const applySystemTheme = () => {
      const pref = (localStorage.getItem('theme-preference') || 'system') as 'light' | 'dark' | 'system'
      if (pref !== 'system') return

      const resolved = media.matches ? 'dark' : 'light'
      document.documentElement.setAttribute('data-theme', resolved)
      document.documentElement.style.colorScheme = resolved
    }

    media.addEventListener('change', applySystemTheme)

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered with scope:', registration.scope)
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error)
        })
    }
    return () => media.removeEventListener('change', applySystemTheme)
  }, [])

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${manrope.variable} ${sora.variable} h-full antialiased scroll-smooth`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var pref = localStorage.getItem('theme-preference') || 'system';
                  var isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var resolved = pref === 'system' ? (isDark ? 'dark' : 'light') : pref;
                  document.documentElement.setAttribute('data-theme', resolved);
                  document.documentElement.setAttribute('data-theme-preference', pref);
                  document.documentElement.style.colorScheme = resolved;
                } catch (e) {}
              })();
            `,
          }}
        />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <meta name="theme-color" content="#f5f7fb" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" href="/favicon.ico" />
      </head>

      <body
        className="pg-uniform min-h-screen text-[0.95rem] sm:text-base supports-[overflow-anchor:clip]:overflow-anchor-auto"
        style={{
          fontFamily: 'var(--font-ui), system-ui, sans-serif',
          WebkitTextSizeAdjust: '100%',
          textSizeAdjust: '100%',
          isolation: 'isolate',
        }}
      >
        <AuthProvider>
          <AuthModalProvider>
            <SmoothScrollProvider>
              <div className="w-full">
                <div className="w-full">
                  <Header />
                  <BrowsingTimerBanner />
                </div>

                <main className="w-full">
                  {children}
                </main>

                <Footer />
              </div>

              <FloatingCTA />
              <CookieConsent />
            </SmoothScrollProvider>
          </AuthModalProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
