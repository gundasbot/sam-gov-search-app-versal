// components/layout/Footer.tsx
'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import ContactModal from './ContactModal'
import { Mail, Phone, ExternalLink } from 'lucide-react'

export default function Footer() {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)

  const { status } = useSession()
  const pathname = usePathname()
  const isAuthed = status === 'authenticated'

  const handleNav = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href === '/search' && !isAuthed) {
      e.preventDefault()
      setShowLoginPrompt(true)
      return
    }
    if (pathname === href) {
      e.preventDefault()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <>
      <footer
        className="bg-slate-950"
        // Most reliable way right now — prefers Aptos when available
        style={{
          fontFamily:
            '"Aptos", "Segoe UI Variable", "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", Arial, sans-serif',
        }}
      >
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-4 items-start">
            
            {/* Column 1: Brand + Contact */}
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-2.5 mb-3">
                <Image src="/logo.png" alt="PreciseGovCon" width={32} height={32} className="w-8 h-8 rounded-lg" />
                <span className="text-base font-bold text-white tracking-tight">
                  PRECISE <span className="text-orange-500">GOVCON</span>
                </span>
              </Link>
              <div className="space-y-1.5">
                <a
                  href="mailto:support@precisegovcon.com"
                  className="flex items-center gap-2 text-sm font-semibold text-white/60 hover:text-emerald-400 transition-colors"
                >
                  <Mail className="w-4 h-4" /> support@precisegovcon.com
                </a>
                <a
                  href="tel:8044044005"
                  className="flex items-center gap-2 text-sm font-semibold text-white/60 hover:text-emerald-400 transition-colors"
                >
                  <Phone className="w-4 h-4" /> (804) 404-4005
                </a>
              </div>
            </div>

            {/* Column 2: Platform */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white/40 mb-2.5">Platform</h4>
              <ul className="space-y-2">
                {[
                  { label: 'Search', href: '/search' },
                  { label: 'Dashboard', href: '/dashboard' },
                  { label: 'Opportunities', href: '/opportunities' },
                  { label: 'Alerts', href: '/alerts' },
                ].map(({ label, href }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={(e) => handleNav(e, href)}
                      className="text-sm font-bold text-white/70 hover:text-white transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Services */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white/40 mb-2.5">Services</h4>
              <ul className="space-y-2">
                {[
                  { label: 'SAM Registration', href: '/services/sam-registration' },
                  { label: 'Proposal Writing', href: '/services/proposal-writing' },
                  { label: 'Bid/No-Bid Analysis', href: '/services/bid-no-bid-review' },
                  { label: 'Certifications', href: '/services/set-aside-certifications' },
                ].map(({ label, href }) => (
                  <li key={href}>
                    <Link href={href} className="text-sm font-bold text-white/70 hover:text-white transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 4: Company */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white/40 mb-2.5">Company</h4>
              <ul className="space-y-2">
                {[
                  { label: 'About', href: '/about' },
                  { label: 'Pricing', href: '/pricing' },
                  { label: 'Support', href: '/support' },
                  { label: 'Privacy', href: '/privacy' },
                ].map(({ label, href }) => (
                  <li key={href}>
                    <Link href={href} className="text-sm font-bold text-white/70 hover:text-white transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 5: CTAs */}
            <div className="col-span-2 md:col-span-4 lg:col-span-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white/40 mb-2.5">Get Started</h4>
              <div className="space-y-2">
                <Link
                  href="/support#book"
                  className="flex items-center justify-center gap-1.5 w-full px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-sm font-bold rounded-lg transition-all"
                >
                  Book a Meeting <ExternalLink className="w-3.5 h-3.5" />
                </Link>
                <button
                  onClick={() => setIsContactModalOpen(true)}
                  className="w-full px-4 py-2.5 bg-[#D9520A] hover:bg-[#e65d12] text-white text-sm font-bold rounded-lg transition-all"
                >
                  Contact Us
                </button>
                <Link
                  href="/signup"
                  className="flex items-center justify-center w-full px-4 py-2.5 border border-white/25 hover:border-white/50 text-white/90 hover:text-white text-sm font-bold rounded-lg transition-all"
                >
                  Start Free Trial
                </Link>
              </div>
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
              <Link
                href="/login"
                className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-600 to-cyan-600 text-white text-sm font-semibold rounded-lg text-center"
                onClick={() => setShowLoginPrompt(false)}
              >
                Sign In
              </Link>
              <button
                onClick={() => setShowLoginPrompt(false)}
                className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold rounded-lg transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}