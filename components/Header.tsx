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

export default function Header() {
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

  return (
    <>
      <style jsx global>{`
        @keyframes scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-scroll { animation: scroll 60s linear infinite; }
      `}</style>

      {/* ── LIVE TICKER ── */}
      <div ref={tickerRef} className="sticky top-0 z-50 bg-slate-800 text-white shadow-lg border-b border-slate-700">
        <div className="max-w-[1920px] mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-2 sm:py-3 min-h-[44px]">
            {/* Label + count */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                <span className="hidden sm:inline whitespace-nowrap">LIVE OPPORTUNITIES</span>
                <span className="sm:hidden">LIVE</span>
              </div>
              {tickerData && (
                <span className="px-2 py-0.5 bg-slate-700/50 rounded-lg text-xs font-bold whitespace-nowrap">
                  {tickerData.count.toLocaleString()}
                  <span className="hidden sm:inline"> Active</span>
                </span>
              )}
            </div>

            {/* Ticker scroll area */}
            {loadingTicker && !tickerData ? (
              <div className="text-xs sm:text-sm text-slate-300 flex items-center gap-1.5 ml-3">
                <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
                <span className="hidden sm:inline">Loading...</span>
              </div>
            ) : tickerError ? (
              <div className="text-xs text-slate-400 ml-3 truncate">{tickerError}</div>
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
                        className="flex-shrink-0 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm hover:text-emerald-400 transition-colors group"
                      >
                        <span className="font-semibold truncate max-w-[160px] sm:max-w-[300px]">{item.title}</span>
                        <span className="text-slate-400 text-xs whitespace-nowrap hidden sm:inline">
                          {new Date(item.postedDate).toLocaleDateString()}
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
        className={`sticky top-[44px] sm:top-[52px] z-40 transition-all duration-300 ${
          scrolled ? 'bg-slate-800/95 backdrop-blur-lg shadow-2xl border-b border-white/10' : 'bg-slate-800'
        }`}
      >
        <div className="max-w-[1920px] mx-auto px-3 sm:px-6 lg:px-8">
          {/* Reduced height on mobile: h-16 mobile, h-20 sm, h-24 lg */}
          <div className="flex items-center justify-between h-16 sm:h-20 lg:h-24">

            {/* ── Logo ── */}
            <Link
              href={isAuthed ? '/dashboard' : '/'}
              className="flex items-center gap-2 sm:gap-3 group flex-shrink-0"
              prefetch={false}
              onClick={() => { setAccountOpen(false); setServicesOpen(false); setMobileMenuOpen(false) }}
            >
              <Image
                src="/logo.png"
                alt="Precise GovCon"
                width={56}
                height={56}
                className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 group-hover:scale-105 transition-transform flex-shrink-0"
              />
              <div className="flex flex-col gap-0.5">
                <div className="text-base sm:text-xl lg:text-3xl font-black leading-none tracking-tight">
                  <span className="text-white">PRECISE</span>{' '}
                  <span className="text-[#f97316]">GOVCON</span>
                </div>
                {/* Tagline: hidden on smallest screens */}
                <div className="hidden sm:block text-xs lg:text-sm font-medium text-slate-400 tracking-wide truncate max-w-[220px] lg:max-w-none">
                  Contracting Intelligence and Procurement Experts
                </div>
              </div>
            </Link>

            {/* ── Desktop Nav ── */}
            <nav className="hidden lg:flex items-center gap-1">
              {[
                { href: '/search', label: 'Search', icon: <Search className="w-4 h-4" /> },
                { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
                { href: '/opportunities', label: 'Opportunities', icon: <Briefcase className="w-4 h-4" /> },
                { href: '/alerts', label: 'Alerts & Searches', icon: <Bell className="w-4 h-4" /> },
              ].map(({ href, label, icon }) => (
                <Link key={href} href={href} prefetch={false}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold transition-all ${
                    isActive(href)
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {icon}{label}
                </Link>
              ))}

              {/* Services dropdown */}
              <div className="relative" ref={servicesRef}>
                <div className={`flex items-center rounded-xl overflow-hidden transition-all ${
                  servicesOpen || pathname.startsWith('/services')
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 shadow-lg' : 'bg-transparent'
                }`}>
                  <Link href="/services" prefetch={false}
                    className={`flex items-center gap-2 px-4 py-3 font-bold transition-all flex-1 ${
                      servicesOpen || pathname.startsWith('/services') ? 'text-white' : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                    onClick={() => setServicesOpen(false)}
                  >
                    <Building className="w-4 h-4" />Services
                  </Link>
                  <button type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setServicesOpen(v => !v); setAccountOpen(false) }}
                    className={`px-2 py-3 font-bold transition-all border-l ${
                      servicesOpen || pathname.startsWith('/services')
                        ? 'text-white border-white/20 hover:bg-white/10'
                        : 'text-slate-300 hover:text-white hover:bg-white/5 border-transparent'
                    }`}
                    aria-label="Toggle services menu"
                  >
                    <ChevronDown className={`w-4 h-4 transition-transform ${servicesOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {servicesOpen && (
                  <div className="absolute top-full right-0 mt-2 w-80 bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
                    <div className="p-2" onClick={e => e.stopPropagation()}>
                      <Link href="/services" prefetch={false} onClick={() => setServicesOpen(false)}
                        className="flex items-center gap-2 p-3 mb-1 rounded-xl bg-gradient-to-r from-orange-500/10 to-orange-600/10 hover:from-orange-500/20 hover:to-orange-600/20 transition-colors border border-orange-500/20"
                      >
                        <Building className="w-5 h-5 text-orange-400" />
                        <span className="font-bold text-white flex-1">View All Services</span>
                        <ChevronDown className="w-4 h-4 text-orange-400 -rotate-90" />
                      </Link>
                      <div className="h-px bg-white/10 my-2" />
                      {serviceItems.map((service) => (
                        <Link key={service.href} href={service.href} prefetch={false} onClick={() => setServicesOpen(false)}
                          className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group"
                        >
                          <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-lg flex items-center justify-center text-orange-400 group-hover:from-orange-500/30 group-hover:to-orange-600/30 transition-colors">
                            {service.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-white group-hover:text-orange-400 transition-colors">{service.label}</span>
                              {service.badge && (
                                <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs font-bold rounded-full">{service.badge}</span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 leading-snug">{service.description}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {[
                { href: '/insights', label: 'Insights', icon: <LineChart className="w-4 h-4" /> },
                { href: '/pricing', label: 'Pricing', icon: <CreditCard className="w-4 h-4" /> },
                { href: '/support', label: 'Support', icon: <Mail className="w-4 h-4" /> },
              ].map(({ href, label, icon }) => (
                <Link key={href} href={href} prefetch={false}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold transition-all ${
                    isActive(href)
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {icon}{label}
                </Link>
              ))}
            </nav>

            {/* ── Auth + Hamburger ── */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {isAuthed ? (
                <div className="relative" ref={accountRef}>
                  <button type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setAccountOpen(v => !v); setServicesOpen(false) }}
                    className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-white/10 hover:bg-white/15 rounded-xl transition-colors text-white font-bold"
                  >
                    <User className="w-4 h-4 flex-shrink-0" />
                    <span className="hidden sm:inline truncate max-w-[100px]">{welcomeName}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform flex-shrink-0 ${accountOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {accountOpen && (
                    <div className="absolute top-full right-0 mt-2 w-64 bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
                      <div className="p-2" onClick={e => e.stopPropagation()}>
                        <Link href="/account" prefetch={false} onClick={() => setAccountOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-white font-semibold"><User className="w-4 h-4" />Account</Link>
                        <Link href="/account?tab=profile" prefetch={false} onClick={() => setAccountOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-white font-semibold"><Settings className="w-4 h-4" />Settings</Link>
                        <div className="my-2 border-t border-white/10" />
                        <Link href="/support#contact" prefetch={false} onClick={() => setAccountOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-white font-semibold"><Mail className="w-4 h-4" />Contact Support</Link>
                        <Link href="/about" prefetch={false} onClick={() => setAccountOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-white font-semibold"><ShieldCheck className="w-4 h-4" />About Us</Link>
                        <a href="tel:804-404-4005" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-emerald-400 font-semibold">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                          (804) 404-4005
                        </a>
                        <div className="my-2 border-t border-white/10" />
                        <button type="button" onClick={() => { setAccountOpen(false); signOut({ callbackUrl: '/' }) }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 transition-colors text-red-400 font-semibold"><LogOut className="w-4 h-4" />Sign Out</button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 sm:py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl font-bold transition-all shadow-lg text-sm sm:text-base"
                >
                  <LogIn className="w-4 h-4 flex-shrink-0" />
                  <span>Sign In</span>
                </Link>
              )}

              {/* Hamburger — visible below lg */}
              <button type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMobileMenuOpen(v => !v); setAccountOpen(false); setServicesOpen(false) }}
                className="lg:hidden p-2 rounded-xl hover:bg-white/5 transition-colors text-white"
                aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── MOBILE MENU ── */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-lg lg:hidden transition-opacity duration-300 ${
          mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileMenuOpen(false)}
      >
        {/* Drawer panel — stop propagation so clicks inside don't close */}
        <div
          className="h-full overflow-y-auto px-4 sm:px-6 py-5 max-w-lg mx-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* Drawer header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="Logo" width={36} height={36} className="w-9 h-9" />
              <span className="text-xl font-black text-white">Menu</span>
            </div>
            <button type="button" onClick={() => setMobileMenuOpen(false)} className="p-2 rounded-xl hover:bg-white/5 transition-colors text-white" aria-label="Close menu">
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
                    active ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg' : 'hover:bg-white/5 text-slate-200 hover:text-white'
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
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-4">Services</h3>
            <div className="space-y-1">
              {serviceItems.map((service) => (
                <Link key={service.href} href={service.href} prefetch={false} onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center text-orange-400">
                    {service.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm truncate">{service.label}</span>
                      {service.badge && (
                        <span className="flex-shrink-0 px-1.5 py-0.5 bg-orange-500/20 text-orange-400 text-xs font-bold rounded-full">{service.badge}</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 truncate">{service.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Auth section */}
          {isAuthed ? (
            <div className="border-t border-white/10 pt-4 space-y-1">
              <div className="px-4 py-2">
                <p className="text-xs text-slate-400">Signed in as</p>
                <p className="text-sm font-bold text-white truncate">{session?.user?.email}</p>
              </div>
              <Link href="/account" prefetch={false} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-white font-semibold text-sm"><User className="w-4 h-4" />Account</Link>
              <Link href="/account?tab=profile" prefetch={false} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-white font-semibold text-sm"><Settings className="w-4 h-4" />Settings</Link>
              <button type="button" onClick={() => { setMobileMenuOpen(false); signOut({ callbackUrl: '/' }) }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 transition-colors text-red-400 font-semibold text-sm"><LogOut className="w-4 h-4" />Sign Out</button>
            </div>
          ) : (
            <div className="border-t border-white/10 pt-4">
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  setShowSignInModal(true)
                }}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl font-bold transition-all shadow-lg"
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