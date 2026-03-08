// components/Header.tsx
'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import {
  LogOut, LogIn, Menu, X, ChevronDown, CreditCard, Search, Award,
  TrendingUp, Settings, Briefcase, ExternalLink, LayoutDashboard,
  LineChart, Zap, Sparkles, Building, User, Loader2, Mail, Bell,
  FileText, ShieldCheck,
} from 'lucide-react'
import AccessControlModal from './AccessControlModal'
import ThemeToggle from './ThemeToggle'
import { BRAND_CONFIG } from '@/lib/brand-config'

type NavItem = { label: string; href: string; icon?: React.ReactNode }
type ServiceItem = { label: string; href: string; description: string; icon: React.ReactNode; badge?: string }
type TickerItem = {
  id: string; title: string; solicitationNumber: string; agency: string
  postedDate: string; type: string; samUrl: string
  naics?: string; setAside?: string; responseDeadLine?: string; state?: string
}

function normalizeExternalUrl(raw?: string | null): string | null {
  const s = String(raw ?? '').trim()
  if (!s) return null
  if (/^https?:\/\//i.test(s)) return s
  if (s.startsWith('//')) return `https:${s}`
  const cleanNumber = s.split('?')[0].split('#')[0]
  if (/^[A-Za-z0-9-]+$/i.test(cleanNumber)) return `https://sam.gov/opp/${cleanNumber}/view`
  return null
}

function getSamGovUrl(solicitationNumber: string): string {
  if (!solicitationNumber || solicitationNumber === 'N/A') return 'https://sam.gov'
  const cleanNum = solicitationNumber.trim().replace(/[^\w-]/g, '').replace(/\s+/g, '')
  return cleanNum ? `https://sam.gov/opp/${cleanNum}/view` : 'https://sam.gov'
}

function formatTickerDate(dateStr?: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'UTC',
  }).format(d)
}

export default function Header() {
  const { wordmark } = BRAND_CONFIG
  const pathname = usePathname() || '/'
  const { data: session, status } = useSession()
  const isAuthed = status === 'authenticated'
  const redirectTo = pathname || '/dashboard'

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [tickerData, setTickerData] = useState<{ count: number; opportunities: TickerItem[] } | null>(null)
  const [loadingTicker, setLoadingTicker] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [servicesOpen, setServicesOpen] = useState(false)
  const [showSignInModal, setShowSignInModal] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [tickerPaused, setTickerPaused] = useState(false)
  const [tickerError, setTickerError] = useState<string | null>(null)

  const accountRef = useRef<HTMLDivElement>(null)
  const servicesRef = useRef<HTMLDivElement>(null)
  const tickerRef = useRef<HTMLDivElement>(null)

  const welcomeName = useMemo(() => {
    const n = String(session?.user?.name ?? '').trim()
    if (n) return n.split(/\s+/)[0] || n
    const email = session?.user?.email || ''
    const local = email.split('@')[0] ?? ''
    const cleaned = local.replace(/[._-]+/g, ' ').trim()
    if (!cleaned) return 'User'
    return cleaned.split(/\s+/).filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }, [session])

  /* ── Scroll effect ── */
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  /* ── Lock body scroll when mobile menu open ── */
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileMenuOpen])

  /* ── Close menus on route change ── */
  useEffect(() => {
    setMobileMenuOpen(false)
    setAccountOpen(false)
    setServicesOpen(false)
  }, [pathname])

  /* ── Nav items ── */
  const serviceItems: ServiceItem[] = [
    { label: 'SAM Registration', href: '/services/sam-registration', description: 'Complete SAM.gov registration & annual renewals', icon: <FileText className="w-5 h-5" />, badge: 'Most Popular' },
    { label: 'Proposal Writing', href: '/services/proposal-writing', description: 'Professional proposals that win federal contracts', icon: <Award className="w-5 h-5" /> },
    { label: 'Bid/No-Bid Analysis', href: '/services/bid-no-bid-review', description: 'AI-powered bid decision analysis & strategy', icon: <Zap className="w-5 h-5" />, badge: 'AI Powered' },
    { label: 'Set-Aside Certifications', href: '/services/set-aside-certifications', description: '8(a), SDVOSB, HUBZone, WOSB/EDWOSB certification', icon: <ShieldCheck className="w-5 h-5" />, badge: 'Gov Special' },
    { label: 'Capability Statements', href: '/services/capability-statements', description: 'Professional one-pagers that showcase your strengths', icon: <TrendingUp className="w-5 h-5" /> },
  ]

  const navItems: NavItem[] = [
    { label: 'Search', href: '/search', icon: <Search className="w-5 h-5" /> },
    { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'Opportunities', href: '/opportunities', icon: <Briefcase className="w-5 h-5" /> },
    { label: 'Alerts & Searches', href: '/alerts', icon: <Bell className="w-5 h-5" /> },
    { label: 'Insights', href: '/insights', icon: <LineChart className="w-5 h-5" /> },
    { label: 'Pricing', href: '/pricing', icon: <CreditCard className="w-5 h-5" /> },
    { label: 'Support', href: '/support', icon: <Mail className="w-5 h-5" /> },
  ]

  /* ── Live ticker ── */
  useEffect(() => {
    let mounted = true
    const fetchTicker = async () => {
      if (!mounted) return
      setLoadingTicker(true)
      setTickerError(null)
      try {
        const res = await fetch('/api/sam/live-ticker')
        if (!res.ok) { if (mounted) { setTickerError('Live opportunities temporarily unavailable'); setTickerData(null) }; return }
        const data = await res.json()
        if (mounted) setTickerData(data)
      } catch {
        if (mounted) { setTickerError('Live opportunities temporarily unavailable'); setTickerData(null) }
      } finally {
        if (mounted) setLoadingTicker(false)
      }
    }
    fetchTicker()
    const interval = setInterval(fetchTicker, 120000)
    return () => { mounted = false; clearInterval(interval) }
  }, [])

  /* ── Click outside ── */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) setAccountOpen(false)
      if (servicesRef.current && !servicesRef.current.contains(e.target as Node)) setServicesOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname === href)
  const activePillClasses = 'bg-[#ff7a18] text-white shadow-[0_12px_22px_rgba(255,122,24,0.42)] border border-[#ffb366]/60 ring-2 ring-[#ff7a18] ring-offset-1 ring-offset-white'
  const inactivePillClasses = 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-transparent'

  // Shared nav link classes — tighter at lg, comfortable at xl+
  const navLinkBase = 'flex items-center gap-1.5 whitespace-nowrap rounded-xl font-semibold tracking-tight transition-all'
  const navLinkSize = 'px-2 py-1.5 text-[0.8rem] xl:px-3 xl:py-2 xl:text-[0.9rem] 2xl:px-3.5 2xl:text-[0.95rem]'

  return (
    <>
      <style jsx global>{`
        @keyframes scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-scroll { animation: scroll 60s linear infinite; }
        .header-nav-scroll {
          scrollbar-width: none;
        }
        .header-nav-scroll::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {/* ── LIVE TICKER ── */}
      <div ref={tickerRef} className="fixed inset-x-0 top-0 z-50 border-b border-slate-200 bg-white text-slate-900 shadow-sm">
        <div className="w-full px-3 sm:px-5 lg:px-6">
          <div className="flex items-center justify-between py-2 sm:py-3 min-h-[44px]">
            {/* Label + count */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold">
                <div className="w-2 h-2 rounded-full bg-[#ff7a18] animate-pulse flex-shrink-0" />
                <span className="hidden sm:inline whitespace-nowrap">LIVE OPPORTUNITIES</span>
                <span className="sm:hidden">LIVE</span>
              </div>
              {tickerData && (
                <span className="whitespace-nowrap rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700">
                  {tickerData.count.toLocaleString()}
                  <span className="hidden sm:inline"> Active</span>
                </span>
              )}
            </div>

            {/* Ticker scroll area */}
            {loadingTicker && !tickerData ? (
              <div className="ml-3 flex items-center gap-1.5 text-xs sm:text-sm text-slate-600">
                <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
                <span className="hidden sm:inline">Loading...</span>
              </div>
            ) : tickerError ? (
              <div className="ml-3 truncate text-xs text-slate-600">{tickerError}</div>
            ) : tickerData?.opportunities && tickerData.opportunities.length > 0 ? (
              <div
                className="flex-1 overflow-hidden mx-3 sm:mx-4"
                onMouseEnter={() => setTickerPaused(true)}
                onMouseLeave={() => setTickerPaused(false)}
              >
                <div className="flex gap-6 sm:gap-8 animate-scroll" style={{ animationPlayState: tickerPaused ? 'paused' : 'running' }}>
                  {[...tickerData.opportunities, ...tickerData.opportunities].map((item, idx) => {
                    const url = normalizeExternalUrl(item.samUrl) || getSamGovUrl(item.solicitationNumber)
                    return (
                      <a
                        key={`${item.id}-${idx}`}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex flex-shrink-0 items-center gap-1.5 text-xs text-slate-800 transition-colors hover:text-[#ff7a18] sm:gap-2 sm:text-sm"
                      >
                        <span className="font-semibold truncate max-w-[160px] sm:max-w-[300px]">{item.title}</span>
                        <span className="hidden whitespace-nowrap text-xs text-slate-500 sm:inline">
                          {formatTickerDate(item.postedDate)}
                        </span>
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      </a>
                    )
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* ── MAIN HEADER ── */}
      <header
        className={`fixed inset-x-0 top-[44px] sm:top-[52px] z-40 transition-all duration-300 w-full ${
          scrolled
            ? 'border-b border-slate-200 bg-white shadow-sm backdrop-blur-lg'
            : 'border-b border-slate-200 bg-white'
        }`}
      >
        <div className="mx-auto w-full max-w-[1920px] px-3 sm:px-4 lg:px-6 xl:px-8">
          <div className="flex h-20 items-center justify-between gap-3 sm:h-20 lg:h-[88px] xl:gap-5">

            {/* ── Logo ── */}
            <Link
              href="/"
              className="group flex flex-shrink-0 items-center gap-3 lg:gap-3"
              aria-label="Go to homepage"
              prefetch={false}
              onClick={() => { setAccountOpen(false); setServicesOpen(false); setMobileMenuOpen(false) }}
            >
              <Image
                src="/logo.png"
                alt="Precise GovCon"
                width={56}
                height={56}
                className="h-10 w-10 flex-shrink-0 transition-transform group-hover:scale-105 sm:h-10 sm:w-10 lg:h-12 lg:w-12 xl:h-12 xl:w-12"
              />
              <div className="flex flex-col gap-0.5">
                <div
                  className="inline-flex w-fit items-center rounded-md px-2 py-1 text-[0.95rem] font-black leading-none tracking-tight lg:text-[1.05rem] xl:text-[1.1rem] 2xl:text-[1.2rem]"
                  style={{ backgroundColor: wordmark.colors.background }}
                >
                  <span style={{ color: wordmark.colors.precise }}>{wordmark.preciseText}</span>{' '}
                  <span style={{ color: wordmark.colors.govcon }}>{wordmark.govconText}</span>
                </div>
                <div className="hidden max-w-[240px] truncate text-[0.56rem] italic font-semibold tracking-wide text-slate-600 2xl:block 2xl:max-w-none 2xl:text-[0.7rem]">
                  Contracting Intelligence and Procurement Experts
                </div>
              </div>
            </Link>

            {/* ── Desktop Nav ── */}
            <div className="hidden min-w-0 flex-1 justify-center lg:flex">
              <nav className="header-nav-scroll flex w-full flex-nowrap items-center justify-center gap-1 rounded-2xl border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm shadow-sm overflow-x-auto xl:gap-1.5 xl:px-2.5">
                {[
                  { href: '/search', label: 'Search', icon: <Search className="w-3.5 h-3.5 xl:w-4 xl:h-4" /> },
                  { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-3.5 h-3.5 xl:w-4 xl:h-4" /> },
                  { href: '/opportunities', label: 'Opportunities', icon: <Briefcase className="w-3.5 h-3.5 xl:w-4 xl:h-4" /> },
                  { href: '/alerts', label: 'Alerts & Searches', icon: <Bell className="w-3.5 h-3.5 xl:w-4 xl:h-4" /> },
                ].map(({ href, label, icon }) => (
                  <Link key={href} href={href} prefetch={false}
                    className={`${navLinkBase} ${navLinkSize} ${isActive(href) ? activePillClasses : inactivePillClasses}`}
                  >
                    {icon}{label}
                  </Link>
                ))}

                {/* Services dropdown */}
                <div
                  className="relative"
                  ref={servicesRef}
                  onMouseEnter={() => setServicesOpen(true)}
                  onMouseLeave={() => setServicesOpen(false)}
                >
                  <Link
                    href="/services"
                    prefetch={false}
                    onFocus={() => setServicesOpen(true)}
                    onClick={() => {
                      setServicesOpen(false)
                      setAccountOpen(false)
                    }}
                    className={`${navLinkBase} ${navLinkSize} ${
                      servicesOpen || pathname.startsWith('/services')
                        ? activePillClasses
                        : inactivePillClasses
                    }`}
                    aria-haspopup="true"
                    aria-expanded={servicesOpen}
                  >
                    <Building className="w-3.5 h-3.5 xl:w-4 xl:h-4" />
                    <span>Services</span>
                    <ChevronDown className={`w-3.5 h-3.5 xl:w-4 xl:h-4 transition-transform ${servicesOpen ? 'rotate-180' : ''}`} />
                  </Link>

                  {servicesOpen && (
                    <div className="fixed mt-2 w-80 rounded-2xl border border-slate-200 bg-white shadow-2xl z-[200]"
                      style={{
                        top: servicesRef.current
                          ? servicesRef.current.getBoundingClientRect().bottom + 8
                          : 0,
                        left: servicesRef.current
                          ? Math.min(
                              servicesRef.current.getBoundingClientRect().left,
                              window.innerWidth - 320 - 16
                            )
                          : 0,
                      }}
                    >
                      <div className="p-2 overflow-hidden rounded-2xl" onClick={e => e.stopPropagation()}>
                        <Link href="/services" prefetch={false} onClick={() => setServicesOpen(false)}
                          className="mb-1 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 transition-colors hover:bg-emerald-50"
                        >
                          <Building className="w-5 h-5 text-emerald-600" />
                          <span className="flex-1 font-bold text-slate-900">View All Services</span>
                          <ChevronDown className="w-4 h-4 text-emerald-600 -rotate-90" />
                        </Link>
                        <div className="my-2 h-px bg-slate-100" />
                        {serviceItems.map((service) => (
                          <Link key={service.href} href={service.href} prefetch={false} onClick={() => setServicesOpen(false)}
                            className="group flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-slate-50"
                          >
                            <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-emerald-600 bg-emerald-50 transition-colors group-hover:bg-emerald-100">
                              {service.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-slate-900 transition-colors group-hover:text-emerald-600">{service.label}</span>
                                {service.badge && (
                                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-full border border-emerald-100">{service.badge}</span>
                                )}
                              </div>
                              <p className="text-xs leading-snug text-slate-500">{service.description}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {[
                  { href: '/insights', label: 'Insights', icon: <LineChart className="w-3.5 h-3.5 xl:w-4 xl:h-4" /> },
                  { href: '/pricing', label: 'Pricing', icon: <CreditCard className="w-3.5 h-3.5 xl:w-4 xl:h-4" /> },
                  { href: '/support', label: 'Support', icon: <Mail className="w-3.5 h-3.5 xl:w-4 xl:h-4" /> },
                ].map(({ href, label, icon }) => (
                  <Link key={href} href={href} prefetch={false}
                    className={`${navLinkBase} ${navLinkSize} ${isActive(href) ? activePillClasses : inactivePillClasses}`}
                  >
                    {icon}{label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* ── Auth + Hamburger ── */}
            <div className="flex flex-shrink-0 items-center gap-1.5 sm:gap-2">
              <div className="block flex-shrink-0">
                <ThemeToggle />
              </div>
              {isAuthed ? (
                <>
                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="hidden lg:inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[0.85rem] font-bold text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 xl:px-3.5 xl:text-[0.9rem] 2xl:px-4 2xl:text-[0.95rem]"
                    aria-label="Sign out"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden xl:inline">Logout</span>
                  </button>

                  <div className="relative" ref={accountRef}>
                    <button type="button"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setAccountOpen(v => !v); setServicesOpen(false) }}
                      className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 font-bold text-slate-900 transition-colors hover:bg-slate-200 xl:gap-2 xl:px-3.5 xl:py-2.5"
                    >
                      <User className="w-4.5 h-4.5 flex-shrink-0" />
                      <span className="hidden xl:inline truncate max-w-[96px] text-[0.95rem]">{welcomeName}</span>
                      <ChevronDown className={`w-4.5 h-4.5 transition-transform flex-shrink-0 ${accountOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {accountOpen && (
                      <div className="absolute right-0 top-full mt-2 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                        <div className="p-2" onClick={e => e.stopPropagation()}>
                          <Link href="/account" prefetch={false} onClick={() => setAccountOpen(false)} className="flex items-center gap-3 rounded-xl px-4 py-3 font-semibold text-slate-900 transition-colors hover:bg-slate-50"><User className="w-4 h-4" />Account</Link>
                          <Link href="/account?tab=profile" prefetch={false} onClick={() => setAccountOpen(false)} className="flex items-center gap-3 rounded-xl px-4 py-3 font-semibold text-slate-900 transition-colors hover:bg-slate-50"><Settings className="w-4 h-4" />Settings</Link>
                          <div className="my-2 border-t border-slate-200" />
                          <Link href="/support#contact" prefetch={false} onClick={() => setAccountOpen(false)} className="flex items-center gap-3 rounded-xl px-4 py-3 font-semibold text-slate-900 transition-colors hover:bg-slate-50"><Mail className="w-4 h-4" />Contact Support</Link>
                          <Link href="/about" prefetch={false} onClick={() => setAccountOpen(false)} className="flex items-center gap-3 rounded-xl px-4 py-3 font-semibold text-slate-900 transition-colors hover:bg-slate-50"><ShieldCheck className="w-4 h-4" />About Us</Link>
                          <a href="tel:804-404-6005" className="flex items-center gap-3 rounded-xl px-4 py-3 font-semibold text-emerald-600 transition-colors hover:bg-slate-50">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                            (804) 404-6005
                          </a>
                          <div className="my-2 border-t border-slate-200" />
                          <button type="button" onClick={() => { setAccountOpen(false); signOut({ callbackUrl: '/' }) }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 transition-colors text-red-400 font-semibold"><LogOut className="w-4 h-4" />Sign Out</button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <Link
                  href="/login"
                  className="pg-btn pg-btn-primary inline-flex items-center gap-1 rounded-xl px-2.5 py-2 text-sm font-bold text-white shadow-md transition-all sm:gap-1.5 sm:px-4 sm:py-2.5 sm:text-sm"
                >
                  <LogIn className="w-4 h-4 flex-shrink-0" />
                  <span>Sign In</span>
                </Link>
              )}

              {/* Hamburger — visible below lg */}
              <button type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMobileMenuOpen(v => !v); setAccountOpen(false); setServicesOpen(false) }}
                className="text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 lg:hidden p-2 rounded-xl flex-shrink-0"
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>
      <div aria-hidden className="h-[132px] sm:h-[138px] lg:h-[154px]" />

      {/* ── MOBILE MENU ── */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/50 backdrop-blur-sm xl:hidden transition-opacity duration-300 ${
          mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileMenuOpen(false)}
      >
        {/* Drawer panel — stop propagation so clicks inside don't close */}
        <div
          className="h-full overflow-y-auto px-4 sm:px-6 py-5 max-w-lg mx-auto bg-white border border-slate-200 rounded-2xl"
          onClick={e => e.stopPropagation()}
        >
          {/* Drawer header */}
          <div className="flex items-center justify-between mb-6">
            <Link
              href="/"
              prefetch={false}
              aria-label="Go to homepage"
              className="flex items-center gap-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Image src="/logo.png" alt="Logo" width={36} height={36} className="w-9 h-9" />
              <span className="text-xl font-black text-slate-900">Menu</span>
            </Link>
            <button type="button" onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-xl hover:bg-slate-50 transition-colors text-slate-900" aria-label="Close menu">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Nav links */}
          <div className="space-y-1 mb-6">
            {navItems.map(({ label, href, icon }) => {
              const active = pathname === href
              return (
                <Link key={href} href={href} prefetch={false} onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-base transition-colors ${
                    active ? 'bg-[#ff7a18] text-white shadow-[0_8px_18px_rgba(255,122,24,0.35)]' : 'hover:bg-slate-50 text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {icon}{label}
                  {active && <Sparkles className="w-4 h-4 ml-auto flex-shrink-0" />}
                </Link>
              )
            })}
          </div>

          {/* Services section */}
          <div className="mb-6">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 px-4">Services</h3>
            <div className="space-y-1">
              {serviceItems.map((service) => (
                <Link key={service.href} href={service.href} prefetch={false} onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600">
                    {service.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm truncate">{service.label}</span>
                      {service.badge && (
                        <span className="flex-shrink-0 px-1.5 py-0.5 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-full">{service.badge}</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate">{service.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Auth section */}
          {isAuthed ? (
            <div className="border-t border-slate-200 pt-4 space-y-1">
              <div className="px-4 py-2">
                <p className="text-xs text-slate-500">Signed in as</p>
                <p className="text-sm font-bold text-slate-900 truncate">{session?.user?.email}</p>
              </div>
              <Link href="/account" prefetch={false} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 transition-colors text-slate-900 font-semibold text-sm"><User className="w-4 h-4" />Account</Link>
              <Link href="/account?tab=profile" prefetch={false} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 transition-colors text-slate-900 font-semibold text-sm"><Settings className="w-4 h-4" />Settings</Link>
              <button type="button" onClick={() => { setMobileMenuOpen(false); signOut({ callbackUrl: '/' }) }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 transition-colors text-red-400 font-semibold text-sm"><LogOut className="w-4 h-4" />Sign Out</button>
            </div>
          ) : (
            <div className="border-t border-slate-200 pt-4">
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  setShowSignInModal(true)
                }}
                className="pg-btn pg-btn-primary w-full flex items-center justify-center gap-2 px-6 py-3 text-white rounded-xl font-bold transition-all shadow-md"
              >
                <LogIn className="w-5 h-5" />Sign In
              </button>
            </div>
          )}
        </div>
      </div>

      {showSignInModal && (
        <AccessControlModal isOpen={showSignInModal} onClose={() => setShowSignInModal(false)} featureName="Sign In" initialMode="signin" redirectTo={redirectTo} onAccessGranted={() => setShowSignInModal(false)} />
      )}
    </>
  )
}