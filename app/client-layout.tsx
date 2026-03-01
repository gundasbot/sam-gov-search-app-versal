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
import Script from 'next/script'
import { useEffect } from 'react'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => console.log('SW registered:', reg.scope))
        .catch((err) => console.error('SW registration failed:', err))
    }
  }, [])

  return (
    <AuthProvider>
      <AuthModalProvider>
        <SmoothScrollProvider>
          {/* Load Google GSI lazily — prevents 403 on non-auth pages */}
          <Script
            src="https://accounts.google.com/gsi/client"
            strategy="lazyOnload"
          />

          <div className="relative">
            <div className="sticky top-0 z-[101] w-full">
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
  )
}
