// components/layout/Footer.tsx
'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import ContactModal from './ContactModal'
import { Mail, Phone } from 'lucide-react'

export default function CompactFooter() {
  const year = new Date().getFullYear()
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)

  const { status } = useSession()
  const pathname = usePathname()
  const isAuthed = status === 'authenticated'

  const isProtected = (href: string) => href === '/search'

  const handleNav = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (isProtected(href) && !isAuthed) {
      e.preventDefault()
      setShowLoginPrompt(true)
      return
    }
    if (pathname === href) {
      e.preventDefault()
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
  }

  return (
    <>
      <footer className="relative bg-slate-950 border-t border-slate-800/50">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">

          {/* ── Desktop layout (md+): 4-col grid ── */}
          <div className="hidden md:grid md:grid-cols-4 gap-3 items-start">

            {/* Brand */}
            <div>
              <Link href="/" className="inline-flex items-center gap-2 group mb-2">
                <Image src="/logo.png" alt="Precise GovCon" width={28} height={28}
                  className="w-7 h-7 rounded-lg group-hover:scale-105 transition-transform" />
                <div className="leading-tight">
                  <div className="text-sm font-bold text-white">PRECISE <span className="text-orange-500">GOVCON</span></div>
                  <div className="text-[10px] text-slate-500">contracting intelligence</div>
                </div>
              </Link>
              <div className="space-y-1 mb-3">
                <a href="mailto:support@precisegovcon.com"
                  className="flex items-center gap-1.5 text-[19px] text-slate-300 hover:text-cyan-400 transition-colors">
                  <Mail className="w-5 h-5 flex-shrink-0" />support@precisegovcon.com
                </a>
                <div className="flex items-center gap-1.5 text-[19px] text-slate-300">
                  <Phone className="w-5 h-5 flex-shrink-0" />Mon–Fri · 9am–5pm ET
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex gap-3">
                  <Link href="/security" className="text-[17px] text-slate-300 hover:text-cyan-400 transition-colors">Security</Link>
                  <Link href="/accessibility" className="text-[17px] text-slate-300 hover:text-cyan-400 transition-colors">Accessibility</Link>
                </div>
              </div>
            </div>

            {/* Platform */}
            <div>
              <h4 className="text-[19px] font-semibold text-white mb-2 uppercase tracking-wide">Platform</h4>
              <ul className="space-y-1">
                {[['/', 'Home'], ['/features', 'Features'], ['/search', 'Search'], ['/dashboard', 'Dashboard']].map(([href, label]) => (
                  <li key={href}>
                    <Link href={href} onClick={(e) => handleNav(e, href)}
                      className="text-[19px] text-slate-300 hover:text-cyan-400 transition-colors">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-[19px] font-semibold text-white mb-2 uppercase tracking-wide">Company</h4>
              <ul className="space-y-1">
                {[['/about', 'About'], ['/support', 'Support'], ['/privacy', 'Privacy'], ['/terms', 'Terms']].map(([href, label]) => (
                  <li key={href}>
                    <Link href={href} className="text-[19px] text-slate-300 hover:text-cyan-400 transition-colors">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA */}
            <div>
              <h4 className="text-[19px] font-semibold text-white mb-2 uppercase tracking-wide">Get Started</h4>
              <div className="space-y-1.5">
                <Link href="/support#book"
                  className="block w-full px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white text-[19px] font-semibold rounded-lg text-center transition-all">
                  Book a Meeting
                </Link>
                <button onClick={() => setIsContactModalOpen(true)}
                  className="block w-full px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-[19px] font-semibold rounded-lg transition-all">
                  Contact Us
                </button>
                 <p className="text-[17px] text-slate-300">© {year} Precise GovCon.</p>
              </div>
            </div>
          </div>

          {/* ── Mobile layout: ultra-compact single block ── */}
          <div className="md:hidden">
            {/* Row 1: brand left, CTA buttons right */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <Link href="/" className="inline-flex items-center gap-1.5 group">
                <Image src="/logo.png" alt="Precise GovCon" width={22} height={22}
                  className="w-5 h-5 rounded-md" />
                <span className="text-xs font-bold text-white">PRECISE <span className="text-orange-500">GOVCON</span></span>
              </Link>
              <div className="flex gap-1.5">
                <Link href="/support#book"
                  className="px-2 py-1 bg-gradient-to-r from-emerald-600 to-cyan-600 text-white text-[10px] font-semibold rounded-md whitespace-nowrap">
                  Book a Meeting
                </Link>
                <button onClick={() => setIsContactModalOpen(true)}
                  className="px-2 py-1 bg-orange-600 text-white text-[10px] font-semibold rounded-md whitespace-nowrap">
                  Contact Us
                </button>
              </div>
            </div>

            {/* Row 2: all nav links in one horizontal wrapping row */}
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mb-2">
              {[['/', 'Home'], ['/features', 'Features'], ['/search', 'Search'], ['/dashboard', 'Dashboard'],
                ['/about', 'About'], ['/support', 'Support'], ['/privacy', 'Privacy'], ['/terms', 'Terms']].map(([href, label]) => (
                <Link key={href} href={href} onClick={(e) => handleNav(e, href)}
                  className="text-[10px] text-slate-400 hover:text-cyan-400 transition-colors">
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>

      <ContactModal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} />

      {showLoginPrompt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md mx-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Sign In Required</h3>
            <p className="text-sm text-slate-300 mb-4">Please sign in to access Contract Search.</p>
            <div className="flex gap-3">
              <Link href="/login"
                className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-600 to-cyan-600 text-white text-sm font-semibold rounded-lg text-center transition-all"
                onClick={() => setShowLoginPrompt(false)}>
                Sign In
              </Link>
              <button onClick={() => setShowLoginPrompt(false)}
                className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold rounded-lg transition-all">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}