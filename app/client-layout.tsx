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
import { Inter } from 'next/font/google'
import { useEffect } from 'react'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  fallback: ['system-ui', 'sans-serif']
})

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Client-side service worker registration
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered with scope:', registration.scope);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }, []);

  return (
    <html 
      lang="en" 
      suppressHydrationWarning 
      className="h-full antialiased scroll-smooth"
    >
      <head>
        {/* Explicit mobile viewport meta */}
        <meta 
          name="viewport" 
          content="width=device-width, initial-scale=1, viewport-fit=cover" 
        />
        {/* PWA meta tags */}
        <meta name="theme-color" content="#ffffff" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      
      <body 
        className={`${inter.className} h-full text-base 
          selection:bg-primary-500 selection:text-white
          supports-[overflow-anchor:clip]:overflow-anchor-auto`} 
        style={{ 
          WebkitTextSizeAdjust: '100%', 
          textSizeAdjust: '100%',
          isolation: 'isolate' 
        }}
      >
        <AuthProvider>
          <AuthModalProvider>
            <SmoothScrollProvider>
              {/* Container with enhanced flexbox layout */}
              <div className="h-full flex flex-col min-h-screen">
                {/* Fixed Header - flex-none prevents shrinking */}
                <div className="flex-none sticky top-0 z-50">
                  <Header />
                  <BrowsingTimerBanner />
                </div>
                
                {/* Scrollable Content - flex-1 takes remaining space */}
                <main 
                  className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden 
                    will-change-scroll touch-pan-y"
                  style={{ minHeight: 0 }}
                >
                  {/* Special handling for login page - no extra padding */}
                  <div className="flex-1">
                    {children}
                  </div>
                </main>

                {/* Fixed Footer - flex-none prevents shrinking */}
                <div className="flex-none">
                  <Footer />
                </div>
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