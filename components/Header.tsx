// components/Header.tsx - FIXED: Ticker animation, Services highlighting, 5 services, Alerts & Searches

'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import {
  LogOut,
  LogIn,
  Menu,
  X,
  ChevronDown,
  CreditCard,
  Shield,
  Search,
  Award,
  TrendingUp,
  BarChart3,
  Settings,
  Briefcase,
  ExternalLink,
  Clock,
  LayoutDashboard,
  LineChart,
  Zap,
  Sparkles,
  Building,
  User,
  Loader2,
  Mail,
  Bell,
  FileText,
  ShieldCheck,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import AccessControlModal from './AccessControlModal'

/* ================= TYPES ================= */
type NavItem = {
  label: string
  href: string
  accent?: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'premium'
  icon?: React.ReactNode
}

type ServiceItem = {
  label: string
  href: string
  description: string
  icon: React.ReactNode
  badge?: string
}

type TickerItem = {
  id: string
  title: string
  solicitationNumber: string
  agency: string
  postedDate: string
  type: string
  samUrl: string
  naics?: string
  setAside?: string
  responseDeadLine?: string
  state?: string
}

/* ================= URL HELPERS ================= */
function normalizeExternalUrl(raw?: string | null): string | null {
  const s = String(raw ?? '').trim()
  if (!s) return null
  if (/^https?:\/\//i.test(s)) return s
  if (s.startsWith('//')) return `https:${s}`
  const cleanNumber = s.split('?')[0].split('#')[0]
  if (/^[A-Za-z0-9-]+$/i.test(cleanNumber)) {
    return `https://sam.gov/opp/${cleanNumber}/view`
  }
  return null
}

function getSamGovUrl(solicitationNumber: string): string {
  if (!solicitationNumber || solicitationNumber === 'N/A') return 'https://sam.gov'
  const cleanNum = solicitationNumber.trim().replace(/[^\w-]/g, '').replace(/\s+/g, '')
  if (!cleanNum) return 'https://sam.gov'
  return `https://sam.gov/opp/${cleanNum}/view`
}

/* ================= MAIN COMPONENT ================= */
export default function Header() {
  // ✅ FIX: hooks must be inside the component body (never at module scope)
  const router = useRouter()
  const pathname = usePathname()
  const redirectTo = pathname || '/dashboard'

  const { data: session, status } = useSession()
  const isAuthed = status === 'authenticated'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [tickerData, setTickerData] = useState<{ count: number; opportunities: TickerItem[] } | null>(null)
  const [loadingTicker, setLoadingTicker] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [servicesOpen, setServicesOpen] = useState(false)
  const [showSignInModal, setShowSignInModal] = useState(false)
  const currentPath = usePathname() || '/'
  const [scrolled, setScrolled] = useState(false)
  const [tickerPaused, setTickerPaused] = useState(false)
  const [tickerError, setTickerError] = useState<string | null>(null)
  const accountRef = useRef<HTMLDivElement>(null)
  const servicesRef = useRef<HTMLDivElement>(null)

  const welcomeName = useMemo(() => {
    const n = String(session?.user?.name ?? '').trim()
    if (n) return n.split(/\s+/)[0] || n
    const email = session?.user?.email || ''
    const local = email.split('@')[0] ?? ''
    const cleaned = local.replace(/[._-]+/g, ' ').trim()
    if (!cleaned) return 'User'
    return cleaned
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
  }, [session])

  /* ================= SCROLL EFFECT ================= */
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  /* ================= NAV ITEMS ================= */
  // ✅ UPDATED: 5 services (removed Bid Search dropdown, removed Compliance)
  const serviceItems: ServiceItem[] = [
    {
      label: 'SAM Registration',
      href: '/services/sam-registration',
      description: 'Complete SAM.gov registration & annual renewals',
      icon: <FileText className="w-5 h-5" />,
      badge: 'Most Popular',
    },
    {
      label: 'Proposal Writing',
      href: '/services/proposal-writing',
      description: 'Professional proposals that win federal contracts',
      icon: <Award className="w-5 h-5" />,
    },
    {
      label: 'Bid/No-Bid Analysis',
      href: '/services/bid-no-bid-review',
      description: 'AI-powered bid decision analysis & strategy',
      icon: <Zap className="w-5 h-5" />,
      badge: 'AI Powered',
    },
    {
      label: 'Set-Aside Certifications',
      href: '/services/set-aside-certifications',
      description: '8(a), SDVOSB, HUBZone, WOSB/EDWOSB certification',
      icon: <ShieldCheck className="w-5 h-5" />,
      badge: 'Gov Special',
    },
    {
      label: 'Capability Statements',
      href: '/services/capability-statements',
      description: 'Professional one-pagers that showcase your strengths',
      icon: <TrendingUp className="w-5 h-5" />,
    },
  ]

  const navItems: NavItem[] = [
    { label: 'Search', href: '/search', icon: <Search className="w-5 h-5" /> },
    { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'Opportunities', href: '/opportunities', icon: <Briefcase className="w-5 h-5" /> },
    { label: 'Alerts & Searches', href: '/alerts', icon: <Bell className="w-5 h-5" /> }, // ✅ UPDATED label
    { label: 'Insights', href: '/insights', icon: <LineChart className="w-5 h-5" /> },
    { label: 'Pricing', href: '/pricing', icon: <CreditCard className="w-5 h-5" /> },
  ]

  /* ================= LIVE TICKER (NON-FATAL) ================= */
  useEffect(() => {
    let mounted = true
    const fetchTicker = async () => {
      if (!mounted) return
      setLoadingTicker(true)
      setTickerError(null)
      try {
        const res = await fetch('/api/sam/live-ticker')
        if (!res.ok) {
          console.warn('Live ticker unavailable:', res.status)
          if (mounted) {
            setTickerError('Live opportunities temporarily unavailable')
            setTickerData(null)
          }
          return
        }
        const data = await res.json()
        if (mounted) setTickerData(data)
      } catch (err) {
        console.warn('Ticker fetch failed:', err)
        if (mounted) {
          setTickerError('Live opportunities temporarily unavailable')
          setTickerData(null)
        }
      } finally {
        if (mounted) setLoadingTicker(false)
      }
    }

    fetchTicker()
    const interval = setInterval(fetchTicker, 120000)
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  /* ================= CLICK OUTSIDE ================= */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) setAccountOpen(false)
      if (servicesRef.current && !servicesRef.current.contains(e.target as Node)) setServicesOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <>
      {/* ✅ FIXED: Added @keyframes for ticker animation */}
      <style jsx global>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-scroll {
          animation: scroll 60s linear infinite;
        }
      `}</style>

      {/* LIVE TICKER (STICKY) */}
      <div className="sticky top-0 z-50 bg-slate-800 text-white shadow-lg border-b border-slate-700">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 font-bold text-sm">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="hidden sm:inline">LIVE OPPORTUNITIES</span>
                <span className="sm:hidden">LIVE</span>
              </div>
              {tickerData && (
                <span className="px-2 py-1 bg-slate-700/50 backdrop-blur-sm rounded-lg text-xs font-bold">
                  {tickerData.count.toLocaleString()} Active Contracts
                </span>
              )}
            </div>

            {loadingTicker && !tickerData ? (
              <div className="text-sm text-slate-300 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading opportunities...
              </div>
            ) : tickerError ? (
              <div className="text-sm text-slate-400">{tickerError}</div>
            ) : tickerData?.opportunities && tickerData.opportunities.length > 0 ? (
              <div
                className="flex-1 overflow-hidden mx-4"
                onMouseEnter={() => setTickerPaused(true)}
                onMouseLeave={() => setTickerPaused(false)}
              >
                <div className={`flex gap-8 ${tickerPaused ? '' : 'animate-scroll'}`}>
                  {[...tickerData.opportunities, ...tickerData.opportunities].map((item, idx) => {
                    const url = normalizeExternalUrl(item.samUrl) || getSamGovUrl(item.solicitationNumber)
                    return (
                      <a
                        key={`${item.id}-${idx}`}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 flex items-center gap-2 text-sm hover:text-emerald-400 transition-colors group"
                      >
                        <span className="font-semibold truncate max-w-[300px]">{item.title}</span>
                        <span className="text-slate-400 text-xs whitespace-nowrap">
                          Posted {new Date(item.postedDate).toLocaleDateString()}
                        </span>
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    )
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* MAIN HEADER (DARK, STICKY UNDER TICKER) */}
      <header
        className={`sticky top-[52px] z-40 transition-all duration-300 ${
          scrolled ? 'bg-slate-950/95 backdrop-blur-lg shadow-2xl border-b border-white/10' : 'bg-slate-950'
        }`}
      >
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-24 py-6">
            {/* Logo */}
            <Link href={isAuthed ? '/dashboard' : '/'} className="flex items-center gap-3 group">
              <Image src="/logo.png" alt="Precise GovCon Logo" width={52} height={52} className="w-13 h-13" />
              <div>
                <div className="text-xl font-black text-white">
                  PRECISE <span className="text-orange-500">GOVCON</span>
                </div>
                <div className="text-xs font-semibold text-slate-400 -mt-1">
                  contracting intelligence and procurement experts
                </div>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              <Link
                href="/search"
                className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold transition-all ${
                  currentPath === '/search'
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Search className="w-4 h-4" />
                Search
              </Link>

              <Link
                href="/dashboard"
                className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold transition-all ${
                  currentPath === '/dashboard'
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>

              <Link
                href="/opportunities"
                className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold transition-all ${
                  currentPath === '/opportunities'
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                Opportunities
              </Link>

              <Link
                href="/alerts"
                className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold transition-all ${
                  currentPath === '/alerts'
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Bell className="w-4 h-4" />
                Alerts & Searches
              </Link>

              {/* ✅ FIXED: Services Dropdown - highlights when on /services/* */}
              <div className="relative" ref={servicesRef}>
                <button
                  onClick={() => setServicesOpen(!servicesOpen)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold transition-all ${
                    servicesOpen || currentPath.startsWith('/services')
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Building className="w-4 h-4" />
                  Services
                  <ChevronDown className={`w-4 h-4 transition-transform ${servicesOpen ? 'rotate-180' : ''}`} />
                </button>

                {servicesOpen && (
                  <div className="absolute top-full right-0 mt-2 w-80 bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
                    <div className="p-2">
                      {serviceItems.map((service, index) => (
                        <Link
                          key={index}
                          href={service.href}
                          onClick={() => setServicesOpen(false)}
                          className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group"
                        >
                          <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-lg flex items-center justify-center text-orange-400 group-hover:from-orange-500/30 group-hover:to-orange-600/30 transition-colors">
                            {service.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-white group-hover:text-orange-400 transition-colors">
                                {service.label}
                              </span>
                              {service.badge && (
                                <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs font-bold rounded-full">
                                  {service.badge}
                                </span>
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

              <Link
                href="/insights"
                className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold transition-all ${
                  currentPath === '/insights'
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <LineChart className="w-4 h-4" />
                Insights
              </Link>

              <Link
                href="/pricing"
                className={`flex items-center gap-2 px-4 py-3 rounded-xl font-bold transition-all ${
                  currentPath === '/pricing'
                    ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                Pricing
              </Link>
            </nav>

            {/* Auth Buttons */}
            <div className="flex items-center gap-3">
              {isAuthed ? (
                <div className="relative" ref={accountRef}>
                  <button
                    onClick={() => setAccountOpen(!accountOpen)}
                    className="flex items-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/15 rounded-xl transition-colors text-white font-bold"
                  >
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline">{welcomeName}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${accountOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {accountOpen && (
                    <div className="absolute top-full right-0 mt-2 w-64 bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
                      <div className="p-2">
                        <Link
                          href="/account"
                          onClick={() => setAccountOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-white font-semibold"
                        >
                          <User className="w-4 h-4" />
                          Account
                        </Link>
                        <Link
                          href="/account?tab=profile"
                          onClick={() => setAccountOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-white font-semibold"
                        >
                          <Settings className="w-4 h-4" />
                          Settings
                        </Link>

                        {/* ✅ NEW: Support & Contact */}
                        <div className="my-2 border-t border-white/10"></div>

                        <Link
                          href="/support"
                          onClick={() => setAccountOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-white font-semibold"
                        >
                          <Mail className="w-4 h-4" />
                          Contact Support
                        </Link>

                        <Link
                          href="/about"
                          onClick={() => setAccountOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-white font-semibold"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          About Us
                        </Link>

                        <a
                          href="tel:804-404-4005"
                          className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-emerald-400 font-semibold"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                            />
                          </svg>
                          (804) 404-4005
                        </a>

                        <div className="my-2 border-t border-white/10"></div>

                        <button
                          onClick={() => {
                            setAccountOpen(false)
                            signOut({ callbackUrl: '/' })
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 transition-colors text-red-400 font-semibold"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/"
                  className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl font-bold transition-all shadow-lg"
                >
                  <LogIn className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign In</span>
                </Link>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl hover:bg-white/5 transition-colors text-white"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* MOBILE MENU */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-lg lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div className="h-full overflow-y-auto px-6 py-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-white">Menu</h2>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-xl hover:bg-white/5 transition-colors text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-2 mb-8">
              {navItems.map(({ label, href, icon }) => {
                const isActive = currentPath === href
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-lg transition-colors group ${
                      isActive
                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg'
                        : 'hover:bg-white/5 text-slate-200 hover:text-white'
                    }`}
                  >
                    {icon}
                    {label}
                    {isActive && <Sparkles className="w-4 h-4 ml-auto" />}
                  </Link>
                )
              })}
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-bold text-slate-400 mb-3 px-4">Services</h3>
              <div className="space-y-1">
                {serviceItems.map((service, index) => (
                  <Link
                    key={index}
                    href={service.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block p-3 rounded-xl hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-1">
                      <div className="flex-shrink-0 w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center text-orange-400">
                        {service.icon}
                      </div>
                      <span className="font-bold text-white">{service.label}</span>
                      {service.badge && (
                        <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs font-bold rounded-full">
                          {service.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-400 pl-11">{service.description}</p>
                  </Link>
                ))}
              </div>
            </div>

            {!isAuthed && (
              <div className="pt-6 border-t border-white/10">
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl font-bold transition-all shadow-lg"
                >
                  <LogIn className="w-5 h-5" />
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Auth Modal */}
      {showSignInModal && (
        <AccessControlModal
          isOpen={showSignInModal}
          onClose={() => setShowSignInModal(false)}
          featureName="Sign In"
          initialMode="signin"
          redirectTo={redirectTo}
          onAccessGranted={() => {
            setShowSignInModal(false)
          }}
        />
      )}
    </>
  )
}