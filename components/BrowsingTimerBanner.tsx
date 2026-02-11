// components/BrowsingTimerBanner.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, X, Zap, AlertTriangle } from 'lucide-react'
import { useSession } from 'next-auth/react'

export default function BrowsingTimerBanner() {
  const { status } = useSession()
  const router = useRouter()
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [isExpired, setIsExpired] = useState(false)
  const [delayCount, setDelayCount] = useState(0)
  const [maxDelays, setMaxDelays] = useState(2)
  const [isDismissed, setIsDismissed] = useState(false)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    // Don't show timer if user is authenticated
    if (status === 'authenticated') {
      return
    }

    // Check for browsing timer headers
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
          setShowModal(true)
        }
      } catch (error) {
        console.error('Error checking browsing status:', error)
      }
    }

    checkTimer()
    const interval = setInterval(checkTimer, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [status])

  useEffect(() => {
    if (timeRemaining !== null && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev === null || prev <= 0) {
            return 0
          }
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
      const response = await fetch('/api/delay-signin', {
        method: 'POST',
      })

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

  // Don't show anything if user is authenticated or dismissed
  if (status === 'authenticated' || isDismissed) {
    return null
  }

  // Show modal if time expired
  if (showModal && isExpired) {
    const canDelay = delayCount < maxDelays
    const delaysRemaining = maxDelays - delayCount

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="relative w-full max-w-md bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl border-2 border-emerald-500/50 shadow-2xl overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500"></div>
          
          <div className="p-8">
            <div className="flex items-center justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border-2 border-emerald-500/50 flex items-center justify-center">
                <Clock className="w-10 h-10 text-emerald-400" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-white text-center mb-3">
              {canDelay ? 'Browsing Time Expired' : 'Sign In Required'}
            </h2>

            <p className="text-slate-300 text-center mb-6">
              {canDelay
                ? `Your 15-minute browsing period has ended. Sign in to continue, or extend your browsing time for another 15 minutes.`
                : `You've used all your browsing extensions. Please sign in to continue accessing premium features.`}
            </p>

            {canDelay && (
              <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <div className="flex items-center gap-2 text-amber-400 text-sm font-semibold">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{delaysRemaining} browsing extension{delaysRemaining !== 1 ? 's' : ''} remaining</span>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={handleSignIn}
                className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-bold transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <Zap className="w-5 h-5" />
                Sign In to Continue
              </button>

              {canDelay && (
                <button
                  onClick={handleDelay}
                  className="w-full py-3 px-6 rounded-xl border-2 border-white/10 bg-white/5 hover:bg-white/10 text-white font-semibold transition-all"
                >
                  Browse 15 More Minutes ({delaysRemaining} left)
                </button>
              )}
            </div>

            <p className="text-xs text-slate-400 text-center mt-6">
              Create a free account to get unlimited access
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Show banner if time is running low (last 5 minutes)
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
                        <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                        Time Running Out!
                      </>
                    ) : (
                      'Browsing Time Limited'
                    )}
                  </h3>
                  <p className="text-sm text-slate-300">
                    <strong className={isUrgent ? 'text-red-400' : 'text-amber-400'}>
                      {formatTime(timeRemaining)}
                    </strong> remaining. Sign in for unlimited access.
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
