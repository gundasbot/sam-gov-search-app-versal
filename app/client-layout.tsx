//app/client-layout.tsx

"use client";

import Header from '@/components/Header'
import Footer from '@/components/layout/Footer'
import AuthProvider from './providers'
import AuthModalProvider from '@/components/auth/AuthModalProvider'
import SmoothScrollProvider from '@/components/SmoothScrollProvider'
import CookieConsent from '@/components/CookieConsent'
import { useEffect } from 'react'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Force light theme everywhere to avoid dark-mode overrides conflicting with pill/text colors.
    const resolved: 'light' = 'light'
    document.documentElement.setAttribute('data-theme', resolved)
    document.documentElement.setAttribute('data-theme-preference', resolved)
    document.documentElement.style.colorScheme = resolved

    if ('serviceWorker' in navigator) {
      if (process.env.NODE_ENV === 'production') {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('Service Worker registered with scope:', registration.scope)
          })
          .catch((error) => {
            console.error('Service Worker registration failed:', error)
          })
      } else {
        // Dev safeguard: old SW caches can return stale _next chunks and cause ChunkLoadError.
        navigator.serviceWorker.getRegistrations()
          .then((registrations) => {
            registrations.forEach((registration) => {
              registration.unregister()
            })
          })
          .catch(() => {
            // Ignore unregister failures in development.
          })
      }
    }
  }, [])

  return (
    <AuthProvider>
      <AuthModalProvider>
        <SmoothScrollProvider>
          <div className="w-full">
            <div className="w-full">
              <Header />
            </div>

            <main className="w-full" style={{ overflowX: 'hidden' }}>
              {children}
            </main>

            <Footer />
          </div>

          <CookieConsent />
        </SmoothScrollProvider>
      </AuthModalProvider>
    </AuthProvider>
  )
}
