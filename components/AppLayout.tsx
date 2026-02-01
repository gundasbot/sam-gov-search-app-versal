'use client'

import { SessionProvider } from 'next-auth/react'
import Navigation from './Navigation'

interface LayoutProps {
  children: React.ReactNode
  session?: any
}

export default function AppLayout({ children, session }: LayoutProps) {
  return (
    <SessionProvider session={session}>
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Navigation />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </SessionProvider>
  )
}