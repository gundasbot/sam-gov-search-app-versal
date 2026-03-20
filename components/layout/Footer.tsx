'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import ContactModal from './ContactModal'
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
  { label: 'LinkedIn',  href: 'https://linkedin.com/company/precise-analytics',  icon: <LinkedInIcon />,  color: '#0A66C2' },
  { label: 'X / Twitter', href: 'https://x.com/preciseanalytics',               icon: <TwitterXIcon />, color: '#111827' },
  { label: 'Facebook', href: 'https://facebook.com/preciseanalytics',            icon: <FacebookIcon />, color: '#1877F2' },
  { label: 'YouTube',  href: 'https://youtube.com/@preciseanalytics',            icon: <YouTubeIcon />,  color: '#FF0000' },
  { label: 'Instagram',href: 'https://instagram.com/preciseanalytics',           icon: <InstagramIcon />,color: '#E1306C' },
]

export default function Footer() {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)

  const { status } = useSession()
  const pathname = usePathname()
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

  const colLink = 'text-[1.3125rem] font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors'

  return (
    <>
      <footer className="mt-16 border-t border-[var(--color-border)] bg-[var(--color-surface)]/90 backdrop-blur-sm">
        <div className="pg-container max-w-[1920px] px-3 sm:px-5 lg:px-6 py-10">

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5">

            {/* ── Brand column ── */}
            <div className="col-span-1 sm:col-span-2 md:col-span-1">
              <Link href="/" className="group mb-3 flex items-center gap-2.5" aria-label="Navigate to Precise GovCon homepage" prefetch={false}>
                <Image src="/logo.png" alt="Precise GovCon logo" width={56} height={56} className="h-10 w-10 flex-shrink-0 rounded-lg transition-transform group-hover:scale-105" />
                <div className="flex flex-col gap-0.5">
                  <div className="inline-flex w-fit items-center rounded-md px-2 py-1 text-[1.5rem] font-black leading-none tracking-tight" style={{ backgroundColor: wordmark.colors.background }}>
                    <span style={{ color: wordmark.colors.precise, marginRight: '0.28em' }}>{wordmark.preciseText}</span>
                    <span style={{ color: wordmark.colors.govcon }}>{wordmark.govconText}</span>
                  </div>
                  <div className="text-[1.125rem] font-semibold tracking-wide text-[var(--color-text-secondary)]">
                    {formattedTagline}
                  </div>
                </div>
              </Link>

              <div className="mb-4" />

              {/* Contact */}
              <div className="space-y-1.5 mb-6">
                <a href={`mailto:${contact.email}`} className={`flex items-center gap-2 ${colLink}`}>
                  <Mail className="h-4 w-4 shrink-0" /> {contact.email}
                </a>
                <a href={`tel:${contact.phone.replace(/[^0-9]/g, '')}`} className={`flex items-center gap-2 ${colLink}`}>
                  <Phone className="h-4 w-4 shrink-0" /> {contact.phone}
                </a>
              </div>

              {/* Social icons */}
              <div>
                <p className="mb-2.5 text-[0.75rem] font-black uppercase tracking-widest" style={{ color: '#ea580c' }}>
                  Connect With Us
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  {social.map(({ label, href, icon, color }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      title={`Follow us on ${label}`}
                      className="flex items-center justify-center w-9 h-9 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)] transition-all duration-200 hover:scale-110 hover:shadow-md"
                      style={{ color: 'var(--color-text-subtle)' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = color; (e.currentTarget as HTMLAnchorElement).style.borderColor = color }}
                      onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--color-text-subtle)'; (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--color-border)' }}
                    >
                      {icon}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Platform ── */}
            <div>
              <h4 className="mb-2.5 text-[1.125rem] font-black uppercase tracking-wider" style={{ color: '#ea580c' }}>Platform</h4>
              <ul className="space-y-2">
                {[
                  { label: 'Search', href: '/search' },
                  { label: 'Dashboard', href: '/dashboard' },
                  { label: 'Opportunities', href: '/opportunities' },
                  { label: 'Alerts', href: '/alerts' },
                ].map(({ label, href }) => (
                  <li key={href}>
                    <Link href={href} onClick={(e) => handleNav(e, href)} className={colLink}>{label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* ── Services ── */}
            <div>
              <h4 className="mb-2.5 text-[1.125rem] font-black uppercase tracking-wider" style={{ color: '#ea580c' }}>Services</h4>
              <ul className="space-y-2">
                {[
                  { label: 'SAM Registration', href: '/services/sam-registration' },
                  { label: 'Proposal Writing', href: '/services/proposal-writing' },
                  { label: 'Bid/No-Bid Analysis', href: '/services/bid-no-bid-review' },
                  { label: 'Certifications', href: '/services/set-aside-certifications' },
                ].map(({ label, href }) => (
                  <li key={href}>
                    <Link href={href} className={colLink}>{label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* ── Company ── */}
            <div>
              <h4 className="mb-2.5 text-[1.125rem] font-black uppercase tracking-wider" style={{ color: '#ea580c' }}>Company</h4>
              <ul className="space-y-2">
                {[
                  { label: 'About', href: '/about' },
                  { label: 'Pricing', href: '/pricing' },
                  { label: 'Support', href: '/support' },
                  { label: 'Privacy', href: '/privacy' },
                ].map(({ label, href }) => (
                  <li key={href}>
                    <Link href={href} className={colLink}>{label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* ── Get Started ── */}
            <div className="col-span-1 sm:col-span-2 md:col-span-4 lg:col-span-1">
              <h4 className="mb-2.5 text-[1.125rem] font-black uppercase tracking-wider" style={{ color: '#ea580c' }}>Get Started</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/support#book" className={colLink}>Book a Meeting</Link>
                </li>
                <li>
                  <button onClick={() => setIsContactModalOpen(true)} className={`${colLink} bg-transparent border-none cursor-pointer p-0 text-left`}>
                    Contact Us
                  </button>
                </li>
                <li>
                  <Link href="/signup" className={colLink}>Start Free Trial</Link>
                </li>
              </ul>
            </div>
          </div>

          {/* ── Bottom bar ── */}
          <div className="mt-10 pt-6 border-t border-[var(--color-border)] flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[0.875rem] text-[var(--color-text-subtle)] text-center sm:text-left">
              © {new Date().getFullYear()} Precise GovCon®. All rights reserved.
              <span className="mx-1.5 hidden sm:inline">·</span>
              <span className="block sm:inline">SDVOSB · VOSB · Minority-Owned Small Business</span>
            </p>
            <div className="flex items-center gap-4 text-[0.875rem] text-[var(--color-text-subtle)]">
              <Link href="/privacy" className="hover:text-[var(--color-text-primary)] transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-[var(--color-text-primary)] transition-colors">Terms</Link>
              <Link href="/sitemap" className="hover:text-[var(--color-text-primary)] transition-colors">Sitemap</Link>
            </div>
          </div>

        </div>
      </footer>

      <ContactModal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} />

      {showLoginPrompt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-modal)]">
            <h3 className="mb-2 text-lg font-bold text-[var(--color-text-primary)]">Sign In Required</h3>
            <p className="mb-4 text-sm text-[var(--color-text-secondary)]">Please sign in to access Contract Search.</p>
            <div className="flex gap-3">
              <Link href="/login" className="pg-btn pg-btn-primary flex-1 rounded-lg px-4 py-2 text-sm font-semibold" onClick={() => setShowLoginPrompt(false)}>Sign In</Link>
              <button onClick={() => setShowLoginPrompt(false)} className="pg-btn pg-btn-secondary flex-1 rounded-lg px-4 py-2 text-sm font-semibold">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}