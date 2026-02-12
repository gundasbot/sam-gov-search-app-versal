// components/layout/Footer.tsx
'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { usePathname, useRouter } from 'next/navigation'
import ContactModal from './ContactModal'
import { Mail, MapPin, Phone } from 'lucide-react'

export default function CompactFooter() {
  const year = new Date().getFullYear()
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)

  const { status } = useSession()
  const router = useRouter()
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
      {/* Compact Footer */}
      <footer className="relative bg-slate-950 border-t border-slate-800/50">
        {/* Subtle gradient accent */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
            
            {/* Brand Column */}
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="inline-flex items-center gap-2 group mb-4">
                <Image
                  src="/logo.png"
                  alt="Precise GovCon"
                  width={36}
                  height={36}
                  className="w-9 h-9 rounded-lg group-hover:scale-105 transition-transform"
                />
                <div className="leading-tight">
                  <div className="text-lg font-bold text-white">
                    Precise <span className="text-orange-500">GovCon</span>
                  </div>
                  <div className="text-xs text-slate-500 font-medium">contracting intelligence Experts</div>
                </div>
              </Link>
              
              <div className="space-y-2 text-sm">
                <a
                  href="mailto:support@precisegovcon.com"
                  className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <span className="text-xs">support@precisegovcon.com</span>
                </a>
                <div className="flex items-center gap-2 text-slate-400">
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  <span className="text-xs">Mon–Fri · 9am–5pm ET</span>
                </div>
              </div>
            </div>

            {/* Platform Links */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Platform</h4>
              <ul className="space-y-2">
                {[
                  { href: '/', label: 'Home' },
                  { href: '/features', label: 'Features' },
                  { href: '/search', label: 'Search' },
                  { href: '/dashboard', label: 'Dashboard' },
                ].map(link => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={(e) => handleNav(e, link.href)}
                      className="text-sm text-slate-400 hover:text-cyan-400 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Company</h4>
              <ul className="space-y-2">
                {[
                  { href: '/about', label: 'About' },
                  { href: '/support', label: 'Support' },
                  { href: '/privacy', label: 'Privacy' },
                  { href: '/terms', label: 'Terms' },
                ].map(link => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-400 hover:text-cyan-400 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA Column */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Get Started</h4>
              <div className="space-y-2">
                <Link
                  href="/support#book"
                  className="block w-full px-4 py-2 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white text-sm font-semibold rounded-lg text-center transition-all shadow-lg shadow-emerald-900/20"
                >
                  Book a Meeting
                </Link>
                <button
                  onClick={() => setIsContactModalOpen(true)}
                  className="block w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-lg transition-all shadow-lg shadow-orange-900/20"
                >
                  Contact Us
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-8 pt-6 border-t border-slate-800/50">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
              <p>© {year} Precise GovCon. All rights reserved.</p>
              <div className="flex gap-4">
                <Link href="/security" className="hover:text-cyan-400 transition-colors">
                  Security
                </Link>
                <Link href="/accessibility" className="hover:text-cyan-400 transition-colors">
                  Accessibility
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Contact Modal */}
      <ContactModal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} />

      {/* Login Prompt */}
      {showLoginPrompt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md mx-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Sign In Required</h3>
            <p className="text-sm text-slate-300 mb-4">Please sign in to access Contract Search.</p>
            <div className="flex gap-3">
              <Link
                href="/login"
                className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white text-sm font-semibold rounded-lg text-center transition-all"
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