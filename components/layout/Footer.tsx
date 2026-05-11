'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { Mail, Phone } from 'lucide-react'
import { BRAND_CONFIG } from '@/lib/brand-config'

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
)

const TwitterXIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.736-8.858L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
)

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
)

const YouTubeIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
)

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
  </svg>
)

const social = [
  { label: 'LinkedIn',  href: 'https://www.linkedin.com/company/precise-analytics-llc/',  icon: <LinkedInIcon />,  color: '#0A66C2' },
  { label: 'X / Twitter', href: 'https://x.com/preciseanalytics',               icon: <TwitterXIcon />, color: '#111827' },
  { label: 'Facebook', href: 'https://facebook.com/preciseanalytics',            icon: <FacebookIcon />, color: '#1877F2' },
  { label: 'YouTube',  href: 'https://youtube.com/@preciseanalytics',            icon: <YouTubeIcon />,  color: '#FF0000' },
  { label: 'Instagram',href: 'https://instagram.com/preciseanalytics',           icon: <InstagramIcon />,color: '#E1306C' },
]

export default function Footer() {
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)

  const { status } = useSession()
  const pathname = usePathname()
  const isOpportunitiesRoute = pathname?.startsWith('/opportunities')
  const isAuthRoute = pathname === '/login' || pathname === '/signup'
  const isAuthed = status === 'authenticated'
  const { contact, tagline, wordmark } = BRAND_CONFIG
  const formattedTagline = tagline
    .split(' ')
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
    .join(' ')

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
      <footer className={isOpportunitiesRoute || isAuthRoute ? 'mt-0 bg-white' : 'mt-16 bg-white'}>
        <div className="max-w-480 mx-auto px-4 sm:px-6 lg:px-8 py-12">

          {/* Single row: Logo col + 5 nav columns — all equal, no divider */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8">

            {/* Col 1: Logo + tagline + contact — mirrors header */}
            <div className="col-span-2 sm:col-span-3 lg:col-span-1">
              <Link
                href="/"
                className="inline-flex items-center gap-0 overflow-hidden rounded-md transition-all mb-2"
                aria-label="Navigate to Precise GovCon homepage"
                prefetch={false}
              >
                <Image
                  src="/logo.png"
                  alt="Precise GovCon logo"
                  width={44}
                  height={44}
                  className="h-11 w-11 flex-shrink-0"
                />
                <div
                  className="inline-flex items-center h-11 px-3 font-black leading-none tracking-tight"
                  style={{ backgroundColor: wordmark.colors.background, fontSize: 'clamp(1.1rem, 1.5vw, 1.4rem)' }}
                >
                  <span style={{ color: wordmark.colors.precise, marginRight: '0.2em' }}>Precise</span>
                  <span style={{ color: wordmark.colors.govcon }}>GovCon</span>
                </div>
              </Link>
              <p className="text-[0.82rem] font-black tracking-wide text-slate-600 mb-3">{formattedTagline}</p>
              <div className="flex flex-col gap-1.5 text-[0.85rem] font-medium text-slate-600">
                <a href={`mailto:${contact.email}`} className="flex items-center gap-1.5 hover:text-slate-900 transition-colors">
                  <Mail className="h-3.5 w-3.5 flex-shrink-0" /> {contact.email}
                </a>
                <a href={`tel:${contact.phone.replace(/[^0-9]/g, '')}`} className="flex items-center gap-1.5 hover:text-slate-900 transition-colors">
                  <Phone className="h-3.5 w-3.5 flex-shrink-0" /> {contact.phone}
                </a>
              </div>
            </div>

            {/* Col 2: Platform */}
            <div>
              <h4 className="text-[0.95rem] font-black tracking-wide mb-3" style={{ color: '#f97316' }}>Platform</h4>
              <ul className="space-y-2">
                <li><Link href="/search" onClick={(e) => handleNav(e, '/search')} className="text-[0.92rem] font-semibold text-slate-700 hover:text-slate-900 transition-colors">Search</Link></li>
                <li><Link href="/dashboard" onClick={(e) => handleNav(e, '/dashboard')} className="text-[0.92rem] font-semibold text-slate-700 hover:text-slate-900 transition-colors">Dashboard</Link></li>
                <li><Link href="/opportunities" className="text-[0.92rem] font-semibold text-slate-700 hover:text-slate-900 transition-colors">Opportunities</Link></li>
                <li><Link href="/alerts" className="text-[0.92rem] font-semibold text-slate-700 hover:text-slate-900 transition-colors">Alerts</Link></li>
              </ul>
            </div>

            {/* Col 3: Services */}
            <div>
              <h4 className="text-[0.95rem] font-black tracking-wide mb-3" style={{ color: '#f97316' }}>Services</h4>
              <ul className="space-y-2">
                <li><Link href="/services/sam-registration" className="text-[0.92rem] font-semibold text-slate-700 hover:text-slate-900 transition-colors">SAM registration</Link></li>
                <li><Link href="/services/proposal-writing" className="text-[0.92rem] font-semibold text-slate-700 hover:text-slate-900 transition-colors">Proposal writing</Link></li>
                <li><Link href="/services/bid-no-bid-review" className="text-[0.92rem] font-semibold text-slate-700 hover:text-slate-900 transition-colors">Bid/no-bid analysis</Link></li>
                <li><Link href="/services/set-aside-certifications" className="text-[0.92rem] font-semibold text-slate-700 hover:text-slate-900 transition-colors">Certifications</Link></li>
              </ul>
            </div>

            {/* Col 4: Company */}
            <div>
              <h4 className="text-[0.95rem] font-black tracking-wide mb-3" style={{ color: '#f97316' }}>Company</h4>
              <ul className="space-y-2">
                <li><Link href="/about" className="text-[0.92rem] font-semibold text-slate-700 hover:text-slate-900 transition-colors">About</Link></li>
                <li><Link href="/pricing" className="text-[0.92rem] font-semibold text-slate-700 hover:text-slate-900 transition-colors">Pricing</Link></li>
                <li><Link href="/support" className="text-[0.92rem] font-semibold text-slate-700 hover:text-slate-900 transition-colors">Support</Link></li>
                <li><Link href="/privacy" className="text-[0.92rem] font-semibold text-slate-700 hover:text-slate-900 transition-colors">Privacy</Link></li>
                <li><Link href="/cookie-policy" className="text-[0.92rem] font-semibold text-slate-700 hover:text-slate-900 transition-colors">Cookie policy</Link></li>
              </ul>
            </div>

            {/* Col 5: Get Started */}
            <div>
              <h4 className="text-[0.95rem] font-black tracking-wide mb-3" style={{ color: '#f97316' }}>Get started</h4>
              <ul className="space-y-2">
                <li><Link href="/support#book" className="text-[0.92rem] font-semibold text-slate-700 hover:text-slate-900 transition-colors">Book a meeting</Link></li>
                <li><Link href="/support?openContact=1" className="text-[0.92rem] font-semibold text-slate-700 hover:text-slate-900 transition-colors">Contact us</Link></li>
                <li><Link href="/signup" className="text-[0.92rem] font-semibold text-slate-700 hover:text-slate-900 transition-colors">Start free trial</Link></li>
              </ul>
            </div>

            {/* Col 6: Follow Us */}
            <div>
              <h4 className="text-[0.95rem] font-black tracking-wide mb-3" style={{ color: '#f97316' }}>Follow us</h4>
              <div className="flex flex-wrap gap-2">
                {social.map(({ label, href, icon, color }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    title={`Follow us on ${label}`}
                    className="flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 bg-slate-50 transition-all duration-200 hover:scale-110 hover:shadow-md"
                    style={{ color: '#64748b' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = color; (e.currentTarget as HTMLAnchorElement).style.borderColor = color }}
                    onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#64748b'; (e.currentTarget as HTMLAnchorElement).style.borderColor = '#e2e8f0' }}
                  >
                    {icon}
                  </a>
                ))}
              </div>
            </div>

          </div>
        </div>
      </footer>

      {showLoginPrompt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-bold text-slate-900">Sign In Required</h3>
            <p className="mb-4 text-sm text-slate-600">Please sign in to access Contract Search.</p>
            <div className="flex gap-3">
              <Link href="/login" className="flex-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 text-sm font-semibold text-center" onClick={() => setShowLoginPrompt(false)}>Sign In</Link>
              <button onClick={() => setShowLoginPrompt(false)} className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
