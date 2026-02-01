'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { X, User, Settings, CheckCircle } from 'lucide-react'
import Link from 'next/link'

type Profile = {
  firstName?: string | null
  lastName?: string | null
  phone?: string | null
  city?: string | null
  state?: string | null
}

export default function WelcomeBanner() {
  const { data: session, status } = useSession()
  const [dismissed, setDismissed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)

  // Fetch profile after login
  useEffect(() => {
    if (status !== 'authenticated') return

    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/account/profile')
        if (!res.ok) throw new Error('Profile fetch failed')
        const data = await res.json()
        setProfile(data)
      } catch {
        setProfile(null)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [status])

  // Session-only dismiss (do NOT persist forever)
  const handleDismiss = () => {
    setDismissed(true)
  }

  if (status !== 'authenticated' || loading || dismissed || !profile) {
    return null
  }

  // Determine profile completeness
  const isComplete =
    !!profile.firstName &&
    !!profile.lastName &&
    !!profile.phone &&
    !!profile.city &&
    !!profile.state

  // If profile is complete, never show banner again
  if (isComplete) {
    return null
  }

  const displayName =
    profile.firstName ||
    session.user?.name?.split(' ')[0] ||
    session.user?.email?.split('@')[0] ||
    'there'

  return (
    <div className="mb-6 bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-blue-500/10 border border-emerald-500/30 rounded-lg p-4 backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-500">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
            <User className="h-5 w-5 text-white" />
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-1">
              Welcome, {displayName}! 👋
            </h3>

            <p className="text-sm text-slate-300 mb-3">
              Complete your profile to unlock personalized insights, alerts,
              and recommendations inside Precise GovCon.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/account/profile"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <Settings className="h-4 w-4" />
                Complete Profile
              </Link>

              <button
                onClick={handleDismiss}
                className="inline-flex items-center gap-2 bg-slate-800/50 text-slate-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
              >
                <CheckCircle className="h-4 w-4" />
                Remind me later
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="text-slate-400 hover:text-white transition-colors p-1 flex-shrink-0"
          aria-label="Dismiss welcome message"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
