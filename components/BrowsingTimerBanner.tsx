// components/BrowsingTimerBanner.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Image from 'next/image'
import {
  Clock, X, ArrowRight,
  Home, FileText, DollarSign, HelpCircle,
  Shield, Bell, CheckCircle,
} from 'lucide-react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

// ─── helpers ──────────────────────────────────────────────────────────────────
function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function TimerRing({
  seconds,
  total = 300,
  size = 64,
  stroke = 6,
  color = '#16a34a',
}: {
  seconds: number
  total?: number
  size?: number
  stroke?: number
  color?: string
}) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const dash = circ * Math.max(0, seconds / total)
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.8s ease-out' }}
      />
    </svg>
  )
}

// ─── component ────────────────────────────────────────────────────────────────
export default function BrowsingTimerBanner() {
  const { status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [isExpired, setIsExpired] = useState(false)
  const [delayCount, setDelayCount] = useState(0)
  const [maxDelays, setMaxDelays] = useState(2)
  const [isDismissed, setIsDismissed] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('browsing-timer-dismissed-permanently') === 'true'
  })
  const [dontAskAgain, setDontAskAgain] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('browsing-timer-dismissed-permanently') === 'true'
  })
  const [showModal, setShowModal] = useState(false)

  const STORAGE_KEY = 'browsing-timer-dismissed-permanently'

  // Show gentle banner when ≤5 min left
  const showBanner =
    timeRemaining !== null &&
    timeRemaining > 0 &&
    timeRemaining <= 300 &&
    !isDismissed &&
    !dontAskAgain

  // Poll server for browsing status
  useEffect(() => {
    if (status === 'authenticated' || dontAskAgain) return

    const check = async () => {
      try {
        const res = await fetch('/api/browsing-status')
        const data = await res.json()

        if (data.timeRemaining !== undefined) {
          setTimeRemaining(data.timeRemaining)
        }

        if (data.isExpired) {
          setIsExpired(true)
          setDelayCount(data.delayCount || 0)
          setMaxDelays(data.maxDelays || 2)
          if (pathname.startsWith('/search') && !dontAskAgain) {
            setShowModal(true)
          }
        }
      } catch {
        // silent fail
      }
    }

    check()
    const id = setInterval(check, 25000)
    return () => clearInterval(id)
  }, [status, pathname, dontAskAgain])

  // Client-side countdown
  useEffect(() => {
    if (!timeRemaining || timeRemaining <= 0) return
    const id = setInterval(() => {
      setTimeRemaining((p) => (p && p > 0 ? p - 1 : 0))
    }, 1000)
    return () => clearInterval(id)
  }, [timeRemaining])

  const handleDelay = async () => {
    try {
      const res = await fetch('/api/delay-signin', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setTimeRemaining(data.newTimeLimit)
        setDelayCount(data.delayCount)
        setShowModal(false)
        setIsExpired(false)
      }
    } catch {
      // silent
    }
  }

  const handleSignIn = () => {
    router.push('/login?callbackUrl=' + encodeURIComponent(window.location.pathname))
  }

  const handleDontAskAgain = () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setDontAskAgain(true)
    setIsDismissed(true)
    setShowModal(false)
  }

  const handleBannerDismiss = () => {
    setIsDismissed(true)
  }

  if (status === 'authenticated' || dontAskAgain || isDismissed) return null

  // ── Expired modal ─────────────────────────────────────────────────────────────
  if (showModal && isExpired && pathname.startsWith('/search')) {
    const canDelay = delayCount < maxDelays
    const delaysRemaining = maxDelays - delayCount

    const perks = [
      { icon: <Shield className="w-5 h-5" />, text: 'Unlimited SAM.gov searches' },
      { icon: <Bell className="w-5 h-5" />, text: 'Email alerts for new bid posts' },
      { icon: <CheckCircle className="w-5 h-5" />, text: 'Save & track opportunities' },
      { icon: <FileText className="w-5 h-5" />, text: 'Export to CSV, JSON & more' },
    ]

    const navLinks = [
      { href: '/', icon: <Home className="w-5 h-5" />, label: 'Home', sub: 'Learn more' },
      { href: '/pricing', icon: <DollarSign className="w-5 h-5" />, label: 'Pricing', sub: 'View plans' },
      { href: '/services', icon: <FileText className="w-5 h-5" />, label: 'Services', sub: 'What we offer' },
      { href: '/support', icon: <HelpCircle className="w-5 h-5" />, label: 'Support', sub: 'Get help' },
    ]

    return (
      <>
        <div
          className="fixed inset-0 z-[99] bg-black/50 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        />

        <div className="fixed inset-0 z-[100] overflow-y-auto p-2 sm:p-4">
          <div
            className="relative mx-auto my-2 sm:my-4 w-[min(100%,56rem)] max-h-[88dvh] overflow-y-auto bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-gray-200"
            onClick={(e) => e.stopPropagation()}
            style={{ fontFamily: 'Aptos, "Segoe UI", system-ui, sans-serif' }}
          >
            <div className="h-3 w-full bg-green-600" />

            <div className="px-4 pt-5 pb-4 sm:px-6 sm:pt-7 sm:pb-5 text-center relative">
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 sm:top-5 sm:right-5 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-gray-200 text-gray-800 hover:bg-gray-300 transition-all shadow"
                aria-label="Close"
              >
                <X className="w-5 h-5 sm:w-7 sm:h-7" />
              </button>

              <div className="mx-auto mb-4 sm:mb-6 w-16 h-16 sm:w-20 sm:h-20 relative">
                <Image
                  src="/precise-govcon-logo.jpg"
                  alt="Precise GovCon Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>

              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-2 sm:mb-3 tracking-tight">
                Your free preview has ended
              </h2>
              <p className="text-sm sm:text-base text-gray-700 font-medium max-w-xl mx-auto">
                Sign up free to pick up right where you left off — no credit card required.
              </p>
            </div>

            <div className="grid md:grid-cols-2 border-t border-gray-200">
              <div className="px-5 py-5 sm:px-8 sm:py-8 bg-gray-50">
                <p className="text-sm sm:text-base font-bold text-green-700 uppercase tracking-wide mb-4 sm:mb-6">
                  Free Account Benefits
                </p>
                <ul className="space-y-3 sm:space-y-4">
                  {perks.map(({ icon, text }) => (
                    <li key={text} className="flex items-center gap-3 sm:gap-4">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-green-100 text-green-700 flex items-center justify-center flex-shrink-0">
                        {icon}
                      </div>
                      <span className="text-sm sm:text-base font-bold text-gray-900">{text}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-5 sm:mt-6 p-4 sm:p-5 rounded-2xl bg-green-50 border border-green-200">
                  <p className="text-base sm:text-lg font-bold text-green-800">7-day free trial included</p>
                  <p className="text-xs sm:text-sm text-green-700 mt-1">
                    No card required • Cancel anytime
                  </p>
                </div>
              </div>

              <div className="px-5 py-5 sm:px-8 sm:py-8 flex flex-col gap-6 sm:gap-8">
                <div className="space-y-3 sm:space-y-4">
                  <button
                    onClick={handleSignIn}
                    className="w-full py-3.5 sm:py-4 rounded-2xl font-extrabold text-base sm:text-lg text-white flex items-center justify-center gap-2 sm:gap-3 shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all active:scale-95"
                    style={{
                      background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                    }}
                  >
                    Create free account
                    <ArrowRight className="w-6 h-6" />
                  </button>

                  {canDelay && (
                    <button
                      onClick={handleDelay}
                      className="w-full py-3 sm:py-3.5 rounded-2xl text-sm sm:text-base font-bold text-green-800 bg-green-100 hover:bg-green-200 border-2 border-green-300 transition-all flex items-center justify-center gap-2 sm:gap-3"
                    >
                      <Clock className="w-5 h-5" />
                      Extend time ({delaysRemaining} left)
                    </button>
                  )}

                  <button
                    onClick={() => setShowModal(false)}
                    className="w-full py-3 sm:py-3.5 rounded-2xl text-sm sm:text-base font-bold text-gray-700 bg-white hover:bg-gray-100 border-2 border-gray-300 transition-all"
                  >
                    Continue browsing without saving
                  </button>
                </div>

                <div>
                  <p className="text-xs sm:text-sm font-bold text-gray-600 uppercase tracking-wider mb-3 sm:mb-4 text-center">
                    Explore More
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    {navLinks.map(({ href, icon, label, sub }) => (
                      <Link
                        key={href}
                        href={href}
                        onClick={() => setShowModal(false)}
                        className="flex items-center gap-3 p-3 sm:p-4 rounded-xl border border-gray-200 hover:border-green-300 hover:bg-green-50/40 transition-all group"
                      >
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gray-50 text-green-600 flex items-center justify-center flex-shrink-0 group-hover:bg-green-100 transition-colors">
                          {icon}
                        </div>
                        <div>
                          <p className="text-sm sm:text-base font-bold text-gray-900 group-hover:text-green-800">
                            {label}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-600">{sub}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                <p className="text-center text-xs sm:text-sm text-gray-700 font-medium">
                  Free 7-day trial • No credit card • Cancel anytime
                </p>
              </div>
            </div>

            <div className="px-5 sm:px-8 py-4 sm:py-5 bg-gray-50 border-t border-gray-200 text-center">
              <label className="inline-flex items-center gap-3 cursor-pointer text-sm sm:text-base text-gray-800 hover:text-gray-900">
                <input
                  type="checkbox"
                  checked={dontAskAgain}
                  onChange={handleDontAskAgain}
                  className="w-5 h-5 rounded border-gray-400 text-green-600 focus:ring-green-500"
                />
                Don&apos;t show this again on this device
              </label>
            </div>
          </div>
        </div>
      </>
    )
  }

  // ── Gentle low-time banner (≤ 5 min left) ────────────────────────────────────
  if (showBanner) {
    const isVeryLow = timeRemaining! <= 90

    return (
      <div className="fixed top-16 sm:top-20 left-0 right-0 z-50 px-3 sm:px-5 pointer-events-auto">
        <div className="max-w-4xl mx-auto">
          <div
            className="rounded-2xl shadow-xl flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 sm:py-4 bg-white border border-gray-200"
            style={{
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
              fontFamily: 'Aptos, "Segoe UI", system-ui, sans-serif',
            }}
          >
            <div className="relative flex-shrink-0">
              <TimerRing
                seconds={timeRemaining!}
                total={300}
                size={56}
                stroke={5}
                color={isVeryLow ? '#f97316' : '#16a34a'}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span
                  className="text-base font-bold tabular-nums tracking-tight"
                  style={{ color: isVeryLow ? '#c2410c' : '#15803d' }}
                >
                  {formatTime(timeRemaining!)}
                </span>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-base sm:text-lg font-bold text-gray-900">
                {isVeryLow ? 'Free preview almost up!' : 'Enjoying the search?'}
              </p>
              <p className="text-sm text-gray-700 mt-1 font-medium">
                {isVeryLow
                  ? 'Sign up free to keep exploring opportunities.'
                  : 'A few minutes remain — sign up free to continue!'}
              </p>
            </div>

            <div className="flex items-center gap-4 flex-shrink-0">
              <button
                onClick={handleSignIn}
                className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold text-sm text-white shadow-lg hover:shadow-xl transition-all active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                }}
              >
                Sign up free
              </button>

              <button
                onClick={handleBannerDismiss}
                className="p-2 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all"
                aria-label="Dismiss banner"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
