// components/BrowsingTimerBanner.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Clock, X, Zap, AlertTriangle, ArrowRight, Home, FileText, DollarSign, HelpCircle } from 'lucide-react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

export default function BrowsingTimerBanner() {
  const { status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [isExpired, setIsExpired] = useState(false)
  const [delayCount, setDelayCount] = useState(0)
  const [maxDelays, setMaxDelays] = useState(2)
  const [isDismissed, setIsDismissed] = useState(false)
  const [showModal, setShowModal] = useState(false)

  // Auto-dismiss the modal when the user navigates away from /search
  useEffect(() => {
    if (!pathname.startsWith('/search')) {
      setShowModal(false)
    }
  }, [pathname])

  useEffect(() => {
    if (status === 'authenticated') return

    const checkTimer = async () => {
      try {
        const response = await fetch('/api/browsing-status')
        const data = await response.json()

        if (data.timeRemaining !== undefined) {
          setTimeRemaining(data.timeRemaining)
        }

        if (data.isExpired) {
          setIsExpired(true)
          setDelayCount(data.delayCount || 0)
          setMaxDelays(data.maxDelays || 2)
          // Only show the modal if the user is currently on the search page
          if (pathname.startsWith('/search')) {
            setShowModal(true)
          }
        }
      } catch (error) {
        console.error('Error checking browsing status:', error)
      }
    }

    checkTimer()
    const interval = setInterval(checkTimer, 30000)
    return () => clearInterval(interval)
  }, [status, pathname])

  useEffect(() => {
    if (timeRemaining !== null && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev === null || prev <= 0) return 0
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [timeRemaining])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleDelay = async () => {
    try {
      const response = await fetch('/api/delay-signin', { method: 'POST' })
      if (response.ok) {
        const data = await response.json()
        setTimeRemaining(data.newTimeLimit)
        setDelayCount(data.delayCount)
        setShowModal(false)
        setIsExpired(false)
      }
    } catch (error) {
      console.error('Error delaying sign-in:', error)
    }
  }

  const handleSignIn = () => {
    router.push('/login?callbackUrl=' + window.location.pathname)
  }

  const handleDismissModal = () => {
    setShowModal(false)
    setIsDismissed(true)
  }

  const handleNavigateAway = (path: string) => {
    setShowModal(false)
    router.push(path)
  }

  if (status === 'authenticated' || isDismissed) return null

  // ── Expired modal ──
  if (showModal && isExpired) {
    const canDelay = delayCount < maxDelays
    const delaysRemaining = maxDelays - delayCount

    return (
      <>
        {/* Backdrop - clicking outside dismisses */}
        <div
          className="fixed inset-0 z-[99] bg-slate-950/70 backdrop-blur-sm transition-opacity"
          onClick={handleDismissModal}
        />
        
        {/* Modal */}
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none">
          <div
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden pointer-events-auto animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with gradient */}
            <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-8 pt-8 pb-6">
              {/* Close button - prominent X in corner */}
              <button
                onClick={handleDismissModal}
                aria-label="Close and continue browsing"
                className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
                  <Clock className="w-8 h-8 text-white" />
                </div>
              </div>
              
              <h2 className="text-2xl font-bold text-white text-center mb-2">
                {canDelay ? 'Your Search Session Expired' : 'Sign In to Continue Searching'}
              </h2>
              
              <p className="text-slate-300 text-center text-sm leading-relaxed">
                {canDelay
                  ? `You've used your 15-minute free search session. Sign up for unlimited access, or extend your session.`
                  : `You've used all your free extensions. Create a free account to keep searching federal contracts.`
                }
              </p>
            </div>

            {/* Body */}
            <div className="px-8 py-6">
              {/* Extension warning */}
              {canDelay && (
                <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-900">
                      {delaysRemaining} extension{delaysRemaining !== 1 ? 's' : ''} remaining
                    </p>
                    <p className="text-xs text-amber-700 mt-1">
                      You can extend your session twice before signing up.
                    </p>
                  </div>
                </div>
              )}

              {/* Primary actions */}
              <div className="space-y-3 mb-6">
                <button
                  onClick={handleSignIn}
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-semibold transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 group"
                >
                  <Zap className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  Sign In or Create Free Account
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                {canDelay && (
                  <button
                    onClick={handleDelay}
                    className="w-full py-3.5 px-6 rounded-xl border-2 border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    <Clock className="w-5 h-5 text-slate-500" />
                    Extend 15 Minutes ({delaysRemaining} left)
                  </button>
                )}
              </div>

              {/* Browse other pages section */}
              <div className="border-t border-slate-200 pt-6">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 text-center">
                  Or continue browsing these pages
                </p>
                
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    href="/"
                    onClick={() => setShowModal(false)}
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center group-hover:shadow-sm transition-shadow">
                      <Home className="w-5 h-5 text-slate-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-slate-900">Home</p>
                      <p className="text-xs text-slate-500">Learn about us</p>
                    </div>
                  </Link>

                  <Link
                    href="/pricing"
                    onClick={() => setShowModal(false)}
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center group-hover:shadow-sm transition-shadow">
                      <DollarSign className="w-5 h-5 text-slate-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-slate-900">Pricing</p>
                      <p className="text-xs text-slate-500">View plans</p>
                    </div>
                  </Link>

                  <Link
                    href="/services"
                    onClick={() => setShowModal(false)}
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center group-hover:shadow-sm transition-shadow">
                      <FileText className="w-5 h-5 text-slate-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-slate-900">Services</p>
                      <p className="text-xs text-slate-500">What we offer</p>
                    </div>
                  </Link>

                  <Link
                    href="/support"
                    onClick={() => setShowModal(false)}
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center group-hover:shadow-sm transition-shadow">
                      <HelpCircle className="w-5 h-5 text-slate-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-slate-900">Support</p>
                      <p className="text-xs text-slate-500">Get help</p>
                    </div>
                  </Link>
                </div>
              </div>

              {/* Footer note */}
              <p className="text-xs text-slate-400 text-center mt-6">
                Free accounts include 7-day trial with full access to all features
              </p>
            </div>
          </div>
        </div>
      </>
    )
  }

  // ── Low-time warning banner (last 5 min) ──
  if (timeRemaining !== null && timeRemaining > 0 && timeRemaining <= 300) {
    const isUrgent = timeRemaining <= 60

    return (
      <div className={`fixed top-20 left-0 right-0 z-50 ${isDismissed ? 'hidden' : ''}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className={`rounded-2xl border-2 shadow-2xl backdrop-blur-xl ${
            isUrgent
              ? 'bg-red-500/20 border-red-500/50'
              : 'bg-amber-500/20 border-amber-500/50'
          }`}>
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isUrgent
                    ? 'bg-red-500/20 border-2 border-red-500/50'
                    : 'bg-amber-500/20 border-2 border-amber-500/50'
                }`}>
                  <Clock className={`w-6 h-6 ${isUrgent ? 'text-red-400' : 'text-amber-400'}`} />
                </div>

                <div>
                  <h3 className="text-white font-bold flex items-center gap-2">
                    {isUrgent ? (
                      <>
                        <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        Time Running Out!
                      </>
                    ) : (
                      'Search Session Ending Soon'
                    )}
                  </h3>
                  <p className="text-sm text-slate-300">
                    <strong className={isUrgent ? 'text-red-400' : 'text-amber-400'}>
                      {formatTime(timeRemaining)}
                    </strong>{' '}
                    of search time remaining. Sign in for unlimited access.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleSignIn}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold transition-all text-sm flex items-center gap-2 shadow-lg"
                >
                  <Zap className="w-4 h-4" />
                  Sign In
                </button>

                <button
                  onClick={() => setIsDismissed(true)}
                  className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}