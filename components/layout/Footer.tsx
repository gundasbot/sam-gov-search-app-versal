'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import ContactModal from './ContactModal'
import { Mail, Phone, ExternalLink } from 'lucide-react'
import { BRAND_CONFIG } from '@/lib/brand-config'

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

  return (
    <>
      <footer className="mt-16 border-t border-[var(--color-border)] bg-[var(--color-surface)]/90 backdrop-blur-sm">
        <div className="pg-container max-w-[1920px] px-3 sm:px-5 lg:px-6 py-10">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
            <div className="col-span-1 sm:col-span-2 md:col-span-1">
              <Link
                href="/"
                className="group mb-3 flex items-center gap-2.5"
                aria-label="Navigate to Precise GovCon homepage"
                prefetch={false}
              >
                <Image
                  src="/logo.png"
                  alt="Precise GovCon logo"
                  width={56}
                  height={56}
                  className="h-10 w-10 flex-shrink-0 rounded-lg transition-transform group-hover:scale-105"
                />
                <div className="flex flex-col gap-0.5">
                  <div
                    className="inline-flex w-fit items-center rounded-md px-2 py-1 text-[1.5rem] font-black leading-none tracking-tight"
                    style={{ backgroundColor: wordmark.colors.background }}
                  >
                    <span style={{ color: wordmark.colors.precise }}>{wordmark.preciseText}</span>{' '}
                    <span style={{ color: wordmark.colors.govcon }}>{wordmark.govconText}</span>
                  </div>
                  <div className="text-[1.125rem] italic font-semibold tracking-wide text-[var(--color-text-secondary)]">
                    {formattedTagline}
                  </div>
                </div>
              </Link>
              <div className="mb-4" />
              <div className="space-y-1.5">
                <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-[1.3125rem] font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
                  <Mail className="h-4 w-4" /> {contact.email}
                </a>
                <a href={`tel:${contact.phone.replace(/[^0-9]/g, '')}`} className="flex items-center gap-2 text-[1.3125rem] font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
                  <Phone className="h-4 w-4" /> {contact.phone}
                </a>
              </div>
            </div>

            <div>
              <h4 className="mb-2.5 text-[1.125rem] font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Platform</h4>
              <ul className="space-y-2">
                {[
                  { label: 'Search', href: '/search' },
                  { label: 'Dashboard', href: '/dashboard' },
                  { label: 'Opportunities', href: '/opportunities' },
                  { label: 'Alerts', href: '/alerts' },
                ].map(({ label, href }) => (
                  <li key={href}>
                    <Link href={href} onClick={(e) => handleNav(e, href)} className="text-[1.3125rem] font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="mb-2.5 text-[1.125rem] font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Services</h4>
              <ul className="space-y-2">
                {[
                  { label: 'SAM Registration', href: '/services/sam-registration' },
                  { label: 'Proposal Writing', href: '/services/proposal-writing' },
                  { label: 'Bid/No-Bid Analysis', href: '/services/bid-no-bid-review' },
                  { label: 'Certifications', href: '/services/set-aside-certifications' },
                ].map(({ label, href }) => (
                  <li key={href}>
                    <Link href={href} className="text-[1.3125rem] font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="mb-2.5 text-[1.125rem] font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Company</h4>
              <ul className="space-y-2">
                {[
                  { label: 'About', href: '/about' },
                  { label: 'Pricing', href: '/pricing' },
                  { label: 'Support', href: '/support' },
                  { label: 'Privacy', href: '/privacy' },
                ].map(({ label, href }) => (
                  <li key={href}>
                    <Link href={href} className="text-[1.3125rem] font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="col-span-1 sm:col-span-2 md:col-span-4 lg:col-span-1">
              <h4 className="mb-2.5 text-[1.125rem] font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">Get Started</h4>
              <div className="space-y-2">
                <Link href="/support#book" className="pg-btn pg-btn-primary w-full rounded-xl px-4 py-2.5 text-[1.3125rem] font-bold">
                  Book a Meeting <ExternalLink className="h-3.5 w-3.5" />
                </Link>
                <button onClick={() => setIsContactModalOpen(true)} className="pg-btn pg-btn-secondary w-full rounded-xl px-4 py-2.5 text-[1.3125rem] font-bold">
                  Contact Us
                </button>
                <Link href="/signup" className="pg-btn pg-btn-tertiary w-full rounded-xl px-4 py-2.5 text-[1.3125rem] font-bold">
                  Start Free Trial
                </Link>
              </div>
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
              <Link href="/login" className="pg-btn pg-btn-primary flex-1 rounded-lg px-4 py-2 text-sm font-semibold" onClick={() => setShowLoginPrompt(false)}>
                Sign In
              </Link>
              <button onClick={() => setShowLoginPrompt(false)} className="pg-btn pg-btn-secondary flex-1 rounded-lg px-4 py-2 text-sm font-semibold">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
