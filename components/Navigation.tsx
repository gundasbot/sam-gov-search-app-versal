'use client'

import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { LogOut, Shield, Menu, X, Lock } from 'lucide-react'
import AccessControlModal from './AccessControlModal'

type AccessFeature = 'Dashboard' | 'Bid Search' | 'State Coverage'

export default function Navigation() {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const isAuthenticated = status === 'authenticated'
  const isLoading = status === 'loading'

  const [showAccessModal, setShowAccessModal] = useState(false)
  const [accessFeature, setAccessFeature] = useState<AccessFeature>('Dashboard')

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isActive = (path: string) => pathname === path

  const navLinks = [
    { href: '/', label: 'Home', protected: false },
    { href: '/search', label: 'Bid Search', protected: true },
    { href: '/dashboard', label: 'Dashboard', protected: false },
    { href: '/about', label: 'About', protected: false },
  ]

  const openAccessModal = (feature: AccessFeature) => {
    setAccessFeature(feature)
    setShowAccessModal(true)
  }

  const handleProtectedClick = (e: React.MouseEvent, label: string) => {
    if (!isAuthenticated) {
      e.preventDefault()
      openAccessModal(label as AccessFeature)
    }
  }

  return (
    <>
      <header className="bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 sticky top-0 z-50">
        <div className="w-full px-8 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-lg font-bold text-white leading-tight">Precise GovCon</div>
                <div className="text-xs text-emerald-400 uppercase tracking-wider leading-tight">
                  Federal Contract Intelligence
                </div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => {
                if (link.protected && !isAuthenticated) {
                  return (
                    <button
                      key={link.href}
                      onClick={(e) => handleProtectedClick(e, link.label)}
                      className={`font-semibold text-lg transition-colors flex items-center gap-2 ${
                        isActive(link.href)
                          ? 'text-emerald-400'
                          : 'text-slate-300 hover:text-emerald-400'
                      }`}
                    >
                      {link.label}
                      <Lock className="w-3 h-3 text-cyan-400" />
                    </button>
                  )
                }

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`font-semibold text-lg transition-colors ${
                      isActive(link.href)
                        ? 'text-emerald-400'
                        : 'text-slate-300 hover:text-emerald-400'
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              })}
            </nav>

            {/* Auth Actions - Desktop */}
            <div className="hidden md:flex items-center gap-3">
              {isLoading ? (
                <div className="w-24 h-10 bg-slate-800 animate-pulse rounded-lg" />
              ) : isAuthenticated ? (
                <>
                  {session?.user?.name && (
                    <div className="text-sm text-slate-400">
                      Welcome, <span className="text-emerald-400 font-semibold">{session.user.name}</span>
                    </div>
                  )}
                  <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 text-white font-semibold text-sm rounded-lg transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-5 py-2.5 border border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-slate-50 font-semibold text-sm rounded-lg transition-all"
                  >
                    Sign In
                  </Link>

                  {/* Get Access -> option chooser (same as today) */}
                  <button
                    onClick={() => openAccessModal('Dashboard')}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-lg transition-all"
                  >
                    Get Access
                  </button>

                  {/* OPTIONAL: Add a separate button if you want it in the nav bar too */}
                  {/*
                  <button
                    onClick={() =>
                      openAccessModal({
                        feature: 'State Coverage',
                        defaultOption: 'contact',
                        contactContext: 'state-notify',
                      })
                    }
                    className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm rounded-lg transition-all"
                  >
                    Get Notified
                  </button>
                  */}
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-slate-800 text-slate-300"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-slate-800 mt-3">
              <div className="space-y-2">
                {navLinks.map((link) => {
                  if (link.protected && !isAuthenticated) {
                    return (
                      <button
                        key={link.href}
                        onClick={(e) => {
                          handleProtectedClick(e, link.label)
                          setMobileMenuOpen(false)
                        }}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-slate-50 transition font-semibold"
                      >
                        <span>{link.label}</span>
                        <Lock className="w-4 h-4 text-cyan-400" />
                      </button>
                    )
                  }

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`block px-4 py-3 rounded-lg transition font-semibold ${
                        isActive(link.href)
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-slate-50'
                      }`}
                    >
                      {link.label}
                    </Link>
                  )
                })}

                {/* Mobile Auth Actions */}
                <div className="pt-4 border-t border-slate-800 space-y-2">
                  {isAuthenticated ? (
                    <>
                      {session?.user?.name && (
                        <div className="px-4 py-2 text-sm text-slate-400">
                          Welcome, <span className="text-emerald-400 font-semibold">{session.user.name}</span>
                        </div>
                      )}
                      <button
                        onClick={() => {
                          signOut({ callbackUrl: '/login' })
                          setMobileMenuOpen(false)
                        }}
                        className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold rounded-lg transition-all"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block w-full px-5 py-3 border border-slate-700 hover:bg-slate-800 text-slate-300 text-center font-semibold rounded-lg transition-all"
                      >
                        Sign In
                      </Link>

                      {/* Get Access -> option chooser */}
                      <button
                        onClick={() => {
                          openAccessModal('Dashboard')
                          setMobileMenuOpen(false)
                        }}
                        className="w-full px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-all"
                      >
                        Get Access
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Access Control Modal */}
      <AccessControlModal
        isOpen={showAccessModal}
        onClose={() => setShowAccessModal(false)}
        featureName={accessFeature === 'State Coverage' ? 'State Coverage' : accessFeature}
      />
    </>
  )
}
