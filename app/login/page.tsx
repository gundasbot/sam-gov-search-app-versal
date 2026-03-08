'use client'

import { useEffect, useState, Suspense } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Eye, EyeOff, Loader2, ShieldCheck, AlertCircle, Mail, KeyRound } from 'lucide-react'

const stats = [
  { value: '900+', label: 'Live opportunities' },
  { value: '98%', label: 'Client success rate' },
  { value: '24/7', label: 'Search automation' },
]

const C = {
  textPrimary:   '#111827',
  textSecondary: '#374151',
  textMuted:     '#6b7280',
  border:        '#e5e7eb',
  surface:       '#ffffff',
  surfaceMuted:  '#f9fafb',
}

type ErrorType = 'EMAIL_NOT_VERIFIED' | 'ACCOUNT_NOT_FOUND' | 'INVALID_CREDENTIALS' | 'SUSPENDED' | 'GENERIC'

interface ErrorState {
  type: ErrorType
  message: string
  suggestion: string
}

function parseError(error: string): ErrorState {
  if (error === 'EMAIL_NOT_VERIFIED' || error.toLowerCase().includes('not verified')) {
    return {
      type: 'EMAIL_NOT_VERIFIED',
      message: "Your email address hasn't been verified yet.",
      suggestion: 'Check your inbox for a verification email, or request a new one below.',
    }
  }
  if (error === 'Account not found' || error.toLowerCase().includes('not found')) {
    return {
      type: 'ACCOUNT_NOT_FOUND',
      message: 'No account found with that email address.',
      suggestion: 'Double-check your email or create a new account to get started.',
    }
  }
  if (error.toLowerCase().includes('suspended')) {
    return {
      type: 'SUSPENDED',
      message: 'Your account has been suspended.',
      suggestion: 'Contact support@precisegovcon.com to resolve this.',
    }
  }
  if (
    error.toLowerCase().includes('invalid') ||
    error.toLowerCase().includes('credentials') ||
    error.toLowerCase().includes('password')
  ) {
    return {
      type: 'INVALID_CREDENTIALS',
      message: 'The password you entered is incorrect.',
      suggestion: 'Try again, reset your password, or request a one-time sign-in code.',
    }
  }
  return {
    type: 'GENERIC',
    message: 'Something went wrong signing you in.',
    suggestion: 'Please try again. If the problem persists, contact support.',
  }
}

function ErrorBlock({
  errorState,
  email,
  onResendOrOTC,
  resendLoading,
  resendSent,
}: {
  errorState: ErrorState
  email: string
  onResendOrOTC: () => void
  resendLoading: boolean
  resendSent: boolean
}) {
  return (
    <div
      className="mt-4 rounded-2xl p-4"
      style={{ background: '#fef2f2', border: '1.5px solid #fecaca' }}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" style={{ color: '#dc2626' }} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold" style={{ color: '#991b1b' }}>
            {errorState.message}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed" style={{ color: '#b91c1c' }}>
            {errorState.suggestion}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">

        {errorState.type === 'EMAIL_NOT_VERIFIED' && (
          <>
            <button
              type="button"
              onClick={onResendOrOTC}
              disabled={resendLoading || resendSent}
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: '#dc2626', color: '#ffffff' }}
            >
              {resendLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
              {resendSent ? '✓ Email sent!' : 'Resend verification email'}
            </button>
            <Link
              href={`/forgot-password${email ? `?email=${encodeURIComponent(email)}` : ''}`}
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all hover:-translate-y-0.5"
              style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' }}
            >
              <KeyRound className="h-3.5 w-3.5" />
              Reset password
            </Link>
          </>
        )}

        {errorState.type === 'INVALID_CREDENTIALS' && (
          <>
            <Link
              href={`/forgot-password${email ? `?email=${encodeURIComponent(email)}` : ''}`}
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all hover:-translate-y-0.5"
              style={{ background: '#dc2626', color: '#ffffff' }}
            >
              <KeyRound className="h-3.5 w-3.5" />
              Reset password
            </Link>
            <button
              type="button"
              onClick={onResendOrOTC}
              disabled={resendLoading || resendSent}
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' }}
            >
              {resendLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
              {resendSent ? '✓ Code sent!' : 'Send one-time code'}
            </button>
          </>
        )}

        {errorState.type === 'ACCOUNT_NOT_FOUND' && (
          <Link
            href="/signup"
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)', color: '#ffffff' }}
          >
            <ArrowRight className="h-3.5 w-3.5" />
            Create a free account
          </Link>
        )}

        {(errorState.type === 'SUSPENDED' || errorState.type === 'GENERIC') && (
          <a
            href="mailto:support@precisegovcon.com"
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all hover:-translate-y-0.5"
            style={{ background: '#dc2626', color: '#ffffff' }}
          >
            <Mail className="h-3.5 w-3.5" />
            Contact support
          </a>
        )}
      </div>
    </div>
  )
}

function SignInContent() {
  const router = useRouter()
  const { status } = useSession()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
  const safeCallbackUrl = callbackUrl.startsWith('/') && !callbackUrl.startsWith('/login')
    ? callbackUrl
    : '/dashboard'
  const emailParam = searchParams.get('email') || ''

  const [email, setEmail] = useState(emailParam)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorState, setErrorState] = useState<ErrorState | null>(null)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendSent, setResendSent] = useState(false)
  const microsoftEntraEnabled = false

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace(safeCallbackUrl)
    }
  }, [status, router, safeCallbackUrl])

  if (status === 'authenticated') {
    return (
      <div className="pg-container flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: '#f97316' }} />
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErrorState(null)
    setResendSent(false)

    const result = await signIn('credentials', { email, password, redirect: false })

    if (result?.error) {
      setErrorState(parseError(result.error))
      setLoading(false)
      return
    }

    router.push(safeCallbackUrl)
    router.refresh()
  }

  async function handleOAuth(provider: 'google' | 'azure-ad') {
    if (provider === 'azure-ad' && !microsoftEntraEnabled) {
      setErrorState({
        type: 'GENERIC',
        message: 'Microsoft Entra SSO is being finalized.',
        suggestion: 'Please sign in with email or Google Workspace for now.',
      })
      return
    }
    setLoading(true)
    await signIn(provider, { callbackUrl: safeCallbackUrl })
  }

  async function handleResendOrOTC() {
    if (!email) return
    setResendLoading(true)
    try {
      await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setResendSent(true)
    } catch {
      setResendSent(true) // optimistic — don't confuse the user
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div className="relative isolate overflow-hidden py-12 md:py-20" style={{ background: '#f3f4f6' }}>
      <div className="pg-container relative z-10">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-stretch xl:grid-cols-[1.05fr,0.95fr]">

          {/* LEFT PANEL */}
          <section
            className="flex flex-col overflow-hidden rounded-3xl p-8 shadow-xl md:p-10"
            style={{ background: C.surface, border: `1.5px solid ${C.border}` }}
          >
            <span
              className="inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
              style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Secure login
            </span>

            <h1
              className="mt-5 text-4xl font-extrabold md:text-5xl"
              style={{ color: C.textPrimary, fontFamily: 'var(--font-display), system-ui, sans-serif' }}
            >
              Welcome back.
            </h1>

            <p className="mt-4 max-w-lg text-base md:text-lg" style={{ color: C.textSecondary }}>
              Sign in to continue tracking opportunities, alerts, and proposal priorities.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl p-4"
                  style={{ background: C.surfaceMuted, border: `1px solid ${C.border}` }}
                >
                  <p className="text-2xl font-extrabold" style={{ color: C.textPrimary }}>{stat.value}</p>
                  <p className="text-xs uppercase tracking-[0.08em] font-semibold" style={{ color: C.textSecondary }}>{stat.label}</p>
                </div>
              ))}
            </div>

            <div
              className="mt-8 flex-1 rounded-2xl p-5"
              style={{ background: C.surfaceMuted, border: `1px solid ${C.border}` }}
            >
              <div className="flex gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="h-4 w-4" fill="#f97316" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-sm leading-relaxed" style={{ color: C.textPrimary }}>
                &ldquo;We went from missing bids to winning contracts within our first month. The alerts alone are worth the subscription.&rdquo;
              </p>
              <p className="mt-3 text-xs font-bold" style={{ color: C.textSecondary }}>Marcus T. · CEO, Federal Solutions Group</p>
            </div>

            <div
              className="mt-6 rounded-2xl p-5"
              style={{ background: '#fff7ed', border: '1.5px solid #fed7aa' }}
            >
              <p className="text-sm font-bold" style={{ color: C.textPrimary }}>No account yet?</p>
              <p className="mt-1 text-sm" style={{ color: C.textSecondary }}>Start with a 7-day free trial — no credit card required.</p>
              <Link
                href="/signup"
                className="mt-4 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all hover:-translate-y-0.5"
                style={{
                  background: 'linear-gradient(135deg, #f97316, #f59e0b)',
                  color: '#ffffff',
                  boxShadow: '0 4px 14px rgba(251,146,60,0.4)',
                  textDecoration: 'none',
                }}
              >
                Create account — it&apos;s free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>

          {/* RIGHT PANEL */}
          <section className="relative">
            <div
              className="relative rounded-[32px] p-6 shadow-2xl md:p-9"
              style={{ background: C.surface, border: `1.5px solid ${C.border}` }}
            >
              <div
                className="flex flex-wrap items-center justify-between gap-3 pb-5"
                style={{ borderBottom: `1px solid ${C.border}` }}
              >
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: C.textMuted }}>Account Access</p>
                  <h2
                    className="text-3xl font-black"
                    style={{ color: C.textPrimary, fontFamily: 'var(--font-display), system-ui, sans-serif' }}
                  >
                    Sign in
                  </h2>
                </div>
                <div
                  className="rounded-2xl px-3 py-2 text-xs font-bold"
                  style={{ background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}
                >
                  AES-256 encrypted
                </div>
              </div>

              <p className="mt-4 text-sm" style={{ color: C.textSecondary }}>
                Use your workspace credentials or a connected identity provider to continue.
              </p>

              {errorState && (
                <ErrorBlock
                  errorState={errorState}
                  email={email}
                  onResendOrOTC={handleResendOrOTC}
                  resendLoading={resendLoading}
                  resendSent={resendSent}
                />
              )}

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => handleOAuth('google')}
                  disabled={loading}
                  className="h-11 w-full inline-flex items-center justify-center gap-2 rounded-2xl text-sm font-semibold transition-all hover:-translate-y-0.5"
                  style={{ background: C.surfaceMuted, color: C.textPrimary, border: `1.5px solid ${C.border}` }}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Google Workspace
                </button>

                <button
                  type="button"
                  onClick={() => handleOAuth('azure-ad')}
                  disabled={loading || !microsoftEntraEnabled}
                  title={microsoftEntraEnabled ? undefined : 'Microsoft Entra SSO coming soon'}
                  className="h-11 w-full inline-flex items-center justify-center gap-2 rounded-2xl text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ background: C.surfaceMuted, color: C.textPrimary, border: `1.5px solid ${C.border}` }}
                >
                  <svg className="h-4 w-4" viewBox="0 0 21 21" aria-hidden="true">
                    <rect x="1" y="1" width="9" height="9" fill="#F25022" />
                    <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
                    <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
                    <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
                  </svg>
                  {microsoftEntraEnabled ? 'Microsoft Entra' : 'Microsoft Entra (soon)'}
                </button>
              </div>

              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1" style={{ background: C.border }} />
                <span className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: C.textMuted }}>Or email access</span>
                <div className="h-px flex-1" style={{ background: C.border }} />
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="email" className="mb-1.5 block text-xs font-bold uppercase tracking-[0.08em]" style={{ color: C.textSecondary }}>
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                    className="h-12 w-full rounded-2xl px-4 text-sm outline-none focus:ring-2 focus:ring-orange-400"
                    style={{ background: C.surfaceMuted, color: C.textPrimary, border: `1.5px solid ${C.border}` }}
                  />
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <label htmlFor="password" className="block text-xs font-bold uppercase tracking-[0.08em]" style={{ color: C.textSecondary }}>
                      Password
                    </label>
                    <Link
                      href="/forgot-password"
                      className="inline-flex items-center gap-1 rounded-2xl px-3 py-1 text-[0.7rem] font-black uppercase tracking-[0.12em] transition-transform hover:-translate-y-0.5"
                      style={{ background: '#40ffb6', color: '#063626', boxShadow: '0 4px 12px rgba(64,255,182,0.4)' }}
                    >
                      Forgot?
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      className="h-12 w-full rounded-2xl px-4 pr-12 text-sm outline-none focus:ring-2 focus:ring-orange-400"
                      style={{ background: C.surfaceMuted, color: C.textPrimary, border: `1.5px solid ${C.border}` }}
                    />
                    <button
                      type="button"
                      className="absolute right-4 top-1/2 -translate-y-1/2"
                      style={{ color: C.textMuted }}
                      onClick={() => setShowPassword((v) => !v)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="h-12 w-full inline-flex items-center justify-center rounded-2xl text-base font-bold transition-all hover:-translate-y-0.5 disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)', color: '#ffffff', boxShadow: '0 4px 14px rgba(251,146,60,0.4)' }}
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Access dashboard'}
                </button>
              </form>

              <div className="mt-6 space-y-3">
                <div
                  className="flex items-start gap-3 rounded-2xl px-4 py-3 text-xs"
                  style={{ background: C.surfaceMuted, color: C.textSecondary, border: `1px solid ${C.border}` }}
                >
                  <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" style={{ color: '#f97316' }} />
                  <p>Multi-factor authentication is enforced for administrator roles. Contact support to update IdP policies.</p>
                </div>
                {!microsoftEntraEnabled && (
                  <div
                    className="rounded-2xl px-4 py-3 text-xs font-semibold"
                    style={{ background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a' }}
                  >
                    Microsoft Entra single sign-on is being configured. Reach out to support if you need to be added to the pilot group.
                  </div>
                )}
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="pg-container flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: '#f97316' }} />
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  )
}