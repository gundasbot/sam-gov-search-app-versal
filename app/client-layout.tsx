//app/client-layout.tsx

"use client";

import Header from '@/components/Header'
import Footer from '@/components/layout/Footer'
import AuthProvider from './providers'
import AuthModalProvider from '@/components/auth/AuthModalProvider'
import SmoothScrollProvider from '@/components/SmoothScrollProvider'
import FloatingCTA from '@/components/FloatingCTA'
import CookieConsent from '@/components/CookieConsent'
import { useEffect } from 'react'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const applyTheme = () => {
      const pref = (localStorage.getItem('theme-preference') || 'system') as 'light' | 'dark' | 'system'
      const resolved = pref === 'system' ? (media.matches ? 'dark' : 'light') : pref
      document.documentElement.setAttribute('data-theme', resolved)
      document.documentElement.setAttribute('data-theme-preference', pref)
      document.documentElement.style.colorScheme = resolved
    }

    applyTheme()
    media.addEventListener('change', applyTheme)

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered with scope:', registration.scope)
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error)
        })
    }
    return () => media.removeEventListener('change', applyTheme)
  }, [])

  return (
    <AuthProvider>
      <AuthModalProvider>
        <SmoothScrollProvider>
          <div className="w-full">
            <div className="w-full">
              <Header />
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
