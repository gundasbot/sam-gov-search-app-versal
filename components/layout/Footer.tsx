// components/layout/CompactFooter.tsx
// Updated: Always-accessible footer handle after closing + localStorage dismissal

'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { usePathname, useRouter } from 'next/navigation'
import ContactModal from './ContactModal'
import { Mail, Clock, X, ChevronUp, MessageSquareText, LifeBuoy } from 'lucide-react'

const STORAGE_KEY = 'pgc_footer_dismissed_v1'

export default function CompactFooter() {
  const year = new Date().getFullYear()
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)

  // Controls actual visibility of slide-up footer
  const [showFooter, setShowFooter] = useState(false)

  // If user dismisses footer, do not auto-show until they manually open
  const [dismissed, setDismissed] = useState(false)

  const { status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  const isAuthed = status === 'authenticated'

  const isProtected = (href: string) => href === '/search'

  const scrollTop = (smooth = true) => {
    const mainContent = document.querySelector('main')
    if (mainContent) {
      mainContent.scrollTo({ top: 0, left: 0, behavior: smooth ? 'smooth' : 'auto' })
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: smooth ? 'smooth' : 'auto' })
    }
  }

  const handleNav = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (isProtected(href) && !isAuthed) {
      e.preventDefault()
      setShowLoginPrompt(true)
      return
    }

    if (pathname === href) {
      e.preventDefault()
      scrollTop(true)
      return
    }

    e.preventDefault()
    router.push(href)
    setTimeout(() => scrollTop(false), 50)
  }

  // Load dismissal state
  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY)
      if (v === '1') setDismissed(true)
    } catch {
      // ignore
    }
  }, [])

  // Auto-show footer when near bottom (unless dismissed)
  useEffect(() => {
    const handleScroll = () => {
      if (dismissed) return

      const scrollPosition = window.scrollY + window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      const threshold = 300 // Show footer when within 300px of bottom

      setShowFooter(scrollPosition >= documentHeight - threshold)
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [dismissed])

  const closeFooter = () => {
    setShowFooter(false)
    setDismissed(true)
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      // ignore
    }
  }

  const openFooter = () => {
    setDismissed(false)
    setShowFooter(true)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
  }

  // Show the floating handle when footer is not visible
  const showHandle = useMemo(() => !showFooter, [showFooter])

  return (
    <div style={{ fontFamily: 'Aptos, system-ui, -apple-system, sans-serif' }}>
      {/* FLOATING HANDLE (Always allows reopening) */}
      {showHandle && (
        <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2">
          <button
            onClick={openFooter}
            className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/80 backdrop-blur-xl px-4 py-2 shadow-xl hover:bg-slate-800/80 transition-all"
            aria-label="Open footer"
          >
            <ChevronUp className="w-4 h-4 text-cyan-300 group-hover:text-cyan-200 transition-colors" />
            <span className="text-sm font-black text-white/90">Open menu</span>
          </button>

          <Link
            href="/support#contact"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 px-4 py-2 shadow-xl transition-all"
          >
            <LifeBuoy className="w-4 h-4 text-white" />
            <span className="text-sm font-black text-white">Support</span>
          </Link>
        </div>
      )}

      {/* Slide-up footer */}
      <footer
        className={cx(
          'fixed bottom-0 left-0 right-0 z-50 border-t border-slate-700 bg-slate-800 overflow-hidden transition-transform duration-500 ease-in-out',
          showFooter ? 'translate-y-0' : 'translate-y-full'
        )}
      >
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-emerald-500/5 pointer-events-none" />

        {/* Close button */}
        <button
          onClick={closeFooter}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white transition-colors z-10"
          aria-label="Close footer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Container */}
        <div className="relative w-[90%] mx-auto px-6 py-10 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-12 items-start">
            {/* Brand */}
            <div>
              <Link
                href="/"
                onClick={(e) => handleNav(e, '/')}
                className="flex items-center gap-2 mb-4 hover:opacity-90 transition-opacity cursor-pointer group"
              >
                <Image
                  src="/logo.png"
                  alt="Precise GovCon"
                  width={48}
                  height={48}
                  className="w-12 h-12 group-hover:scale-105 transition-transform"
                  priority
                />
                <div className="flex flex-col">
                  <div className="text-2xl font-black leading-tight tracking-tight">
                    <span className="text-white">PRECISE</span>{' '}
                    <span className="text-[#f97316]">GOVCON</span>
                  </div>
                  <div className="text-xs font-bold text-slate-400 tracking-wide">contracting intelligence</div>
                </div>
              </Link>

              <div className="space-y-2">
                <a
                  className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 text-lg font-black transition-colors"
                  href="mailto:support@precisegovcon.com"
                >
                  <Mail className="w-5 h-5" />
                  support@precisegovcon.com
                </a>
                <div className="flex items-center gap-1.5 text-slate-400 text-sm font-black">
                  <Clock className="w-4 h-4" />
                  Mon–Fri • 9am–5pm ET
                </div>

                <div className="pt-3">
                  <Link
                    href="/support#contact"
                    className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-2 transition-all"
                  >
                    <MessageSquareText className="w-4 h-4 text-emerald-300" />
                    <span className="text-sm font-black text-white">Help & Support</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-white font-black text-lg uppercase tracking-wider mb-4">QUICK LINKS</h4>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
                {[
                  { href: '/', label: 'Home' },
                  { href: '/features', label: 'Features' },
                  { href: '/search', label: 'Contract Search' },
                  { href: '/dashboard', label: 'Dashboard' },
                  { href: '/about', label: 'About' },
                  { href: '/support', label: 'Help Center' },
                ].map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={(e) => handleNav(e, link.href)}
                      className="text-slate-300 hover:text-cyan-300 text-lg font-black transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-white font-black text-lg uppercase tracking-wider mb-4">LEGAL</h4>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
                {[
                  { href: '/privacy', label: 'Privacy Policy' },
                  { href: '/terms', label: 'Terms of Use' },
                  { href: '/security', label: 'Security' },
                  { href: '/accessibility', label: 'Accessibility' },
                ].map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={(e) => handleNav(e, link.href)}
                      className="text-slate-300 hover:text-emerald-300 text-lg font-black transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-white font-black text-lg uppercase tracking-wider mb-4">GET IN TOUCH</h4>

              <div className="grid gap-3">
                <Link
                  href="/support#book"
                  className="w-full rounded-lg bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white px-4 py-3 text-xl font-black transition-all shadow-lg uppercase tracking-wide text-center"
                >
                  Book a Meeting
                </Link>

                <button
                  onClick={() => setIsContactModalOpen(true)}
                  className="w-full rounded-lg bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 text-white px-4 py-3 text-xl font-black transition-all shadow-lg uppercase tracking-wide"
                >
                  Contact Us
                </button>
              </div>

              <p className="text-sm text-slate-400 mt-4 font-black">© {year} Precise Analytics</p>
            </div>
          </div>
        </div>

        {/* Decorative bottom gradient */}
        <div className="h-0.5 bg-gradient-to-r from-cyan-500 via-emerald-500 to-orange-500" />
      </footer>

      {/* Contact Modal */}
      <ContactModal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} />

      {/* Login Prompt Modal */}
      {showLoginPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md mx-4 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-3">Sign In Required</h3>
            <p className="text-slate-300 mb-4 text-sm">Please sign in to access Contract Search features.</p>
            <div className="flex gap-3">
              <Link
                href="/login"
                className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white font-bold rounded-lg text-center transition-all text-sm"
                onClick={() => setShowLoginPrompt(false)}
              >
                Sign In
              </Link>
              <button
                onClick={() => setShowLoginPrompt(false)}
                className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition-all text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}
