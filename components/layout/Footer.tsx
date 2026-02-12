// components/layout/Footer.tsx
'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { usePathname, useRouter } from 'next/navigation'
import ContactModal from './ContactModal'
import { Mail, Clock, X, ChevronUp, LifeBuoy, CalendarClock, Send } from 'lucide-react'

const STORAGE_KEY = 'pgc_footer_dismissed_v1'

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export default function CompactFooter() {
  const year = new Date().getFullYear()
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt]       = useState(false)
  const [showFooter, setShowFooter]                 = useState(false)
  const [dismissed, setDismissed]                   = useState(false)

  const { status } = useSession()
  const router     = useRouter()
  const pathname   = usePathname()
  const isAuthed   = status === 'authenticated'

  const isProtected = (href: string) => href === '/search'

  const scrollTop = (smooth = true) => {
    const el = document.querySelector('main')
    if (el) el.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' })
    else window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' })
  }

  const handleNav = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (isProtected(href) && !isAuthed) { e.preventDefault(); setShowLoginPrompt(true); return }
    if (pathname === href) { e.preventDefault(); scrollTop(true); return }
    e.preventDefault()
    router.push(href)
    setTimeout(() => scrollTop(false), 50)
  }

  useEffect(() => {
    try { if (localStorage.getItem(STORAGE_KEY) === '1') setDismissed(true) } catch {}
  }, [])

  useEffect(() => {
    const onScroll = () => {
      if (dismissed) return
      setShowFooter(window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 300)
    }
    window.addEventListener('scroll', onScroll)
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [dismissed])

  const closeFooter = () => {
    setShowFooter(false); setDismissed(true)
    try { localStorage.setItem(STORAGE_KEY, '1') } catch {}
  }

  const openFooter = () => {
    setDismissed(false); setShowFooter(true)
    try { localStorage.removeItem(STORAGE_KEY) } catch {}
  }

  const showHandle = useMemo(() => !showFooter, [showFooter])

  return (
    <div style={{ fontFamily: 'Aptos, system-ui, -apple-system, sans-serif' }}>

      {/* ── Floating handle ── */}
      {showHandle && (
        <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2">
          <button
            onClick={openFooter}
            className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/90 backdrop-blur-xl px-5 py-2.5 shadow-xl hover:bg-slate-800/90 transition-all"
            aria-label="Open footer"
          >
            <ChevronUp className="w-5 h-5 text-cyan-300 group-hover:animate-bounce" />
            <span className="text-base font-black text-white">Menu</span>
          </button>
          <Link
            href="/support#contact"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-700 hover:to-emerald-700 px-5 py-2.5 shadow-xl transition-all"
          >
            <LifeBuoy className="w-5 h-5 text-white" />
            <span className="text-base font-black text-white">Support</span>
          </Link>
        </div>
      )}

      {/* ── Slide-up footer (fixed, zero impact on page layout) ── */}
      <footer
        className={cx(
          'fixed bottom-0 left-0 right-0 z-50 overflow-hidden transition-transform duration-500 ease-in-out',
          showFooter ? 'translate-y-0' : 'translate-y-full'
        )}
        style={{
          borderTop: '1px solid rgba(6,182,212,.2)',
          background: 'linear-gradient(180deg,#0b1a2e 0%,#06101e 100%)',
        }}
      >
        {/* Top accent bar */}
        <div className="h-1 bg-gradient-to-r from-cyan-500 via-emerald-500 to-orange-500" />

        {/* Ambient glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-emerald-500/5 pointer-events-none" />

        {/* ── 4-column grid ── */}
        <div className="relative w-full max-w-[1400px] mx-auto px-8 py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 items-start">

            {/* ── Col 1: Brand ── */}
            <div className="flex flex-col gap-3">
              <Link
                href="/"
                onClick={(e) => handleNav(e, '/')}
                className="flex items-center gap-3 hover:opacity-90 transition-opacity group w-fit"
              >
                <Image
                  src="/logo.png"
                  alt="Precise GovCon"
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-xl group-hover:scale-105 transition-transform flex-shrink-0"
                  priority
                />
                <div>
                  <div className="text-3xl font-black leading-tight tracking-tight">
                    <span className="text-white">PRECISE </span>
                    <span className="text-orange-500">GOVCON</span>
                  </div>
                  <div className="text-sm text-slate-500 font-bold tracking-wide mt-0.5">
                    contracting intelligence
                  </div>
                </div>
              </Link>

              <a
                href="mailto:support@precisegovcon.com"
                className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 text-lg font-bold transition-colors"
              >
                <Mail className="w-4 h-4 flex-shrink-0" />
                support@precisegovcon.com
              </a>
              <div className="flex items-center gap-2 text-slate-400 text-lg font-bold">
                <Clock className="w-4 h-4 flex-shrink-0" />
                Mon–Fri · 9am–5pm ET
              </div>
              <span className="text-base text-slate-500 font-bold">© {year} Precise GovCon</span>
            </div>

            {/* ── Col 2: CTAs ── */}
            <div className="flex flex-col gap-3">
              <h4 className="text-xl font-black uppercase tracking-widest text-slate-400">Get In Touch</h4>

              <Link
                href="/support#book"
                className="flex items-center justify-center gap-2 rounded-xl text-white text-xl font-black py-3.5 px-4 transition-all hover:scale-[1.03] shadow-lg"
                style={{ background: 'linear-gradient(135deg,#059669,#06b6d4)' }}
              >
                <CalendarClock className="w-5 h-5 flex-shrink-0" />
                Book a Meeting
              </Link>

              <button
                onClick={() => setIsContactModalOpen(true)}
                className="flex items-center justify-center gap-2 rounded-xl text-white text-xl font-black py-3.5 px-4 transition-all hover:scale-[1.03] shadow-lg w-full"
                style={{ background: 'linear-gradient(135deg,#ea580c,#f97316)' }}
              >
                <Send className="w-5 h-5 flex-shrink-0" />
                Contact Us
              </button>
            </div>

            {/* ── Col 3: Quick Links ── */}
            <div>
              <h4 className="text-xl font-black uppercase tracking-widest text-slate-400 mb-3">Quick Links</h4>
              <ul className="grid grid-cols-2 gap-x-3 gap-y-3">
                {[
                  { href: '/',          label: 'Home' },
                  { href: '/features',  label: 'Features' },
                  { href: '/search',    label: 'Search' },
                  { href: '/dashboard', label: 'Dashboard' },
                  { href: '/about',     label: 'About' },
                  { href: '/support',   label: 'Help Center' },
                ].map(link => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={(e) => handleNav(e, link.href)}
                      className="text-xl font-bold text-slate-300 hover:text-cyan-400 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* ── Col 4: Legal ── */}
            <div>
              <h4 className="text-xl font-black uppercase tracking-widest text-slate-400 mb-3">Legal</h4>
              <ul className="grid grid-cols-2 gap-x-3 gap-y-3">
                {[
                  { href: '/privacy',       label: 'Privacy' },
                  { href: '/terms',         label: 'Terms' },
                  { href: '/security',      label: 'Security' },
                  { href: '/accessibility', label: 'Accessibility' },
                ].map(link => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={(e) => handleNav(e, link.href)}
                      className="text-xl font-bold text-slate-300 hover:text-orange-400 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>

              <button
                onClick={closeFooter}
                className="mt-4 flex items-center justify-center gap-2 w-full rounded-xl text-white text-xl font-black py-3.5 px-4 transition-all hover:scale-[1.03] shadow-lg"
                style={{ background: 'linear-gradient(135deg,#334155,#475569)' }}
              >
                <X className="w-5 h-5 flex-shrink-0" />
                Close Menu
              </button>
            </div>

          </div>
        </div>

        {/* Bottom accent bar */}
        <div className="h-1 bg-gradient-to-r from-orange-500 via-emerald-500 to-cyan-500" />
      </footer>

      {/* Contact Modal */}
      <ContactModal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} />

      {/* Login Prompt */}
      {showLoginPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md mx-4 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-3">Sign In Required</h3>
            <p className="text-slate-300 mb-4 text-base">Please sign in to access Contract Search.</p>
            <div className="flex gap-3">
              <Link
                href="/login"
                className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white font-bold rounded-lg text-center transition-all text-base"
                onClick={() => setShowLoginPrompt(false)}
              >
                Sign In
              </Link>
              <button
                onClick={() => setShowLoginPrompt(false)}
                className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition-all text-base"
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