'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { X, User, Settings, CheckCircle, Rocket, Clock, CreditCard } from 'lucide-react'
import Link from 'next/link'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type Profile = {
  firstName?: string | null
  lastName?: string | null
  phone?: string | null
  city?: string | null
  state?: string | null
}

type VerifiedWelcomeData = {
  firstName: string
  planTier: 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE'
}

const planLabels: Record<string, string> = {
  BASIC: 'Basic',
  PROFESSIONAL: 'Professional',
  ENTERPRISE: 'Enterprise',
}

// ─────────────────────────────────────────────────────────────────────────────
// Banner 1: Post-verification welcome (cookie-based, shows ONCE after clicking
//           the email verification link — cookie is set by verify-email/route.ts)
// ─────────────────────────────────────────────────────────────────────────────

function VerifiedWelcomeBanner() {
  const [data, setData] = useState<VerifiedWelcomeData | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const raw = document.cookie
        .split('; ')
        .find((row) => row.startsWith('pgc_welcome='))
        ?.split('=')
        .slice(1)
        .join('=')

      if (!raw) return

      const parsed: VerifiedWelcomeData = JSON.parse(decodeURIComponent(raw))
      setData(parsed)
      setVisible(true)

      // Clear the cookie immediately — only ever shows once
      document.cookie = 'pgc_welcome=; path=/; max-age=0'
    } catch {
      // Ignore parse errors silently
    }
  }, [])

  if (!visible || !data) return null

  const planLabel = planLabels[data.planTier] ?? 'Professional'

  return (
    <div
      role="alert"
      style={{
        marginBottom: '1.5rem',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
        borderRadius: '1rem',
        overflow: 'hidden',
        boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
        animation: 'pgcSlideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}
    >
      {/* Top accent bar */}
      <div style={{ height: '4px', background: 'linear-gradient(90deg, #10b981, #3b82f6, #f97316)' }} />

      <div style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
        {/* Icon */}
        <div
          style={{
            flexShrink: 0,
            width: '48px',
            height: '48px',
            background: 'rgba(16,185,129,0.15)',
            border: '2px solid rgba(16,185,129,0.4)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Rocket style={{ width: '22px', height: '22px', color: '#10b981' }} />
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: '0 0 0.25rem', fontSize: '1.125rem', fontWeight: 800, color: '#ffffff' }}>
            Welcome aboard, {data.firstName}! 🎉
          </p>
          <p style={{ margin: '0 0 0.875rem', fontSize: '0.9375rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>
            Your email is verified and your{' '}
            <strong style={{ color: '#10b981' }}>{planLabel} 7-day free trial</strong> is now active.
            Start exploring government contract opportunities below.
          </p>

          {/* Status pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.625rem' }}>
            {[
              { Icon: CheckCircle, color: '#10b981', label: 'Account verified' },
              { Icon: Clock,       color: '#3b82f6', label: '7-day trial active' },
              { Icon: CreditCard,  color: '#f97316', label: 'Cancel anytime' },
            ].map(({ Icon, color, label }) => (
              <div
                key={label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  padding: '0.3rem 0.75rem',
                  background: 'rgba(255,255,255,0.08)',
                  borderRadius: '9999px',
                  border: '1px solid rgba(255,255,255,0.12)',
                }}
              >
                <Icon style={{ width: '13px', height: '13px', color, flexShrink: 0 }} />
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Dismiss button */}
        <button
          onClick={() => setVisible(false)}
          aria-label="Dismiss welcome message"
          style={{
            flexShrink: 0,
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'rgba(255,255,255,0.6)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.15)'
            e.currentTarget.style.color = '#fff'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
            e.currentTarget.style.color = 'rgba(255,255,255,0.6)'
          }}
        >
          <X style={{ width: '16px', height: '16px' }} />
        </button>
      </div>

      <style>{`
        @keyframes pgcSlideDown {
          from { opacity: 0; transform: translateY(-12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Banner 2: Profile completion nudge (session-based, persists across page loads
//           until firstName, lastName, phone, city, and state are all filled in)
// ─────────────────────────────────────────────────────────────────────────────

function ProfileCompletionBanner() {
  const { data: session, status } = useSession()
  const [dismissed, setDismissed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)

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

  if (status !== 'authenticated' || loading || dismissed || !profile) return null

  const isComplete =
    !!profile.firstName &&
    !!profile.lastName &&
    !!profile.phone &&
    !!profile.city &&
    !!profile.state

  // Don't show if profile is already complete
  if (isComplete) return null

  const displayName =
    profile.firstName ||
    session?.user?.name?.split(' ')[0] ||
    session?.user?.email?.split('@')[0] ||
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
                onClick={() => setDismissed(true)}
                className="inline-flex items-center gap-2 bg-slate-800/50 text-slate-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
              >
                <CheckCircle className="h-4 w-4" />
                Remind me later
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={() => setDismissed(true)}
          className="text-slate-400 hover:text-white transition-colors p-1 flex-shrink-0"
          aria-label="Dismiss welcome message"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Default export
//
// Renders both banners in the correct priority order:
//
//   1. VerifiedWelcomeBanner    — fires ONCE right after email verification
//                                 (reads the pgc_welcome cookie, then clears it)
//
//   2. ProfileCompletionBanner  — nudges the user to finish their profile on
//                                 subsequent visits until all fields are complete
//
// Usage: add <WelcomeBanner /> at the top of your /search or /dashboard layout.
// No props required.
// ─────────────────────────────────────────────────────────────────────────────

export default function WelcomeBanner() {
  return (
    <>
      <VerifiedWelcomeBanner />
      <ProfileCompletionBanner />
    </>
  )
}
