'use client'

import { useEffect, useState, Suspense } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Eye, EyeOff, Loader2, ShieldCheck, AlertCircle, Mail, KeyRound, CheckCircle2, Clock3, Sparkles } from 'lucide-react'

// Aptos font stack — Microsoft's modern default, falls back to Calibri then Noto Sans
const aptosFontStyle = ''

const stats = [
  { value: '900+', label: 'Live opportunities' },
  { value: '98%', label: 'Client success rate' },
  { value: '24/7', label: 'Search automation' },
]

const loginHighlights = [
  { title: 'Saved searches sync instantly', icon: CheckCircle2 },
  { title: 'AI-ranked opportunities by fit', icon: Sparkles },
  { title: 'Deadline tracking updates in real time', icon: Clock3 },
]

const C = {
  textPrimary:   'var(--color-text-primary)',
  textSecondary: 'var(--color-text-secondary)',
  textMuted:     'var(--color-text-subtle)',
  border:        'var(--color-border)',
  surface:       'var(--color-surface)',
  surfaceMuted:  'var(--color-surface-muted)',
}

type ErrorType = 'EMAIL_NOT_VERIFIED' | 'ACCOUNT_NOT_FOUND' | 'INVALID_CREDENTIALS' | 'SUSPENDED' | 'GENERIC'

interface ErrorState {
  type: ErrorType
  message: string
  suggestion: string
}

function buildSupportHref(email: string, errorState: ErrorState): string {
  const params = new URLSearchParams({
    openContact: '1',
    category: 'Account & Access',
    email,
    subject: `Login access issue (${errorState.type})`,
    message: `${errorState.message} ${errorState.suggestion}`,
  })
  return `/support?${params.toString()}`
}

function parseError(error: string): ErrorState {
  const e = error.toLowerCase()

  // OTP-specific errors
  if (e.includes('not found') || e === 'account not found') {
    return {
      type: 'ACCOUNT_NOT_FOUND',
      message: 'No account found with that email address.',
      suggestion: 'Double-check your email or create a free account to get started.',
    }
  }
  if (e.includes('not verified') || e === 'email_not_verified') {
    return {
      type: 'EMAIL_NOT_VERIFIED',
      message: "Your email address hasn't been verified yet.",
      suggestion: 'Check your inbox for a verification email, or request a new one below.',
    }
  }
  if (e.includes('expired')) {
    return {
      type: 'GENERIC',
      message: 'Your sign-in code has expired.',
      suggestion: 'Request a new code and try again — codes are valid for 15 minutes.',
    }
  }
  if (e.includes('already used')) {
    return {
      type: 'GENERIC',
      message: 'This code has already been used.',
      suggestion: 'Request a new code to sign in.',
    }
  }
  if (e.includes('invalid code') || e.includes('invalid_code')) {
    return {
      type: 'INVALID_CREDENTIALS',
      message: 'The code you entered is incorrect.',
      suggestion: 'Double-check the 6-digit code from your email and try again.',
    }
  }
  if (e.includes('failed to send') || e.includes('send otp')) {
    return {
      type: 'GENERIC',
      message: 'We couldn\'t send the sign-in code.',
      suggestion: 'Check your email address and try again. If the problem persists, use password sign-in or contact support.',
    }
  }

  // Password / credentials errors
  if (e.includes('credentialssignin') || (e.includes('invalid') && !e.includes('code')) || e.includes('credentials') || e.includes('password')) {
    return {
      type: 'INVALID_CREDENTIALS',
      message: 'The password you entered is incorrect.',
      suggestion: 'Try again, reset your password, or use the Code tab for a one-time sign-in.',
    }
  }
  if (e.includes('oauthaccountnotlinked')) {
    return {
      type: 'GENERIC',
      message: 'This email is linked to a different sign-in method.',
      suggestion: 'Use your original sign-in method, or reset your password to use email/password.',
    }
  }
  if (e.includes('oauthsignin') || e.includes('oauthcallback') || e.includes('callback')) {
    return {
      type: 'GENERIC',
      message: 'Google sign-in didn\'t complete.',
      suggestion: 'Try again, or use email + password or the Code tab instead.',
    }
  }
  if (e.includes('accessdenied') || e.includes('suspended')) {
    return {
      type: 'SUSPENDED',
      message: 'Access to this account is currently restricted.',
      suggestion: 'Contact support@precisegovcon.com to restore access.',
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
  supportHref,
}: {
  errorState: ErrorState
  email: string
  onResendOrOTC: () => void
  resendLoading: boolean
  resendSent: boolean
  supportHref: string
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
          <Link
            href={supportHref}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all hover:-translate-y-0.5"
            style={{ background: '#dc2626', color: '#ffffff' }}
          >
            <Mail className="h-3.5 w-3.5" />
            Open support request
          </Link>
        )}

        {(errorState.type === 'SUSPENDED' || errorState.type === 'GENERIC' || errorState.type === 'INVALID_CREDENTIALS') && (
          <Link
            href="/status"
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-all hover:-translate-y-0.5"
            style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' }}
          >
            Check system status
          </Link>
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
  const errorParam = searchParams.get('error') || ''
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

  // OTP mode state
  const [authMode, setAuthMode] = useState<'password' | 'otp'>('password')
  const [otpEmail, setOtpEmail] = useState(emailParam)
  const [otpCode, setOtpCode] = useState('')
  const [otpSending, setOtpSending] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otpTimeRemaining, setOtpTimeRemaining] = useState(0)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [magicLinkSending, setMagicLinkSending] = useState(false)

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace(safeCallbackUrl)
    }
  }, [status, router, safeCallbackUrl])

  useEffect(() => {
    if (!errorParam) return
    setErrorState(parseError(errorParam))
    // Clear the error from the URL so it doesn't re-appear after OTP login
    const url = new URL(window.location.href)
    url.searchParams.delete('error')
    window.history.replaceState({}, '', url.toString())
  }, [errorParam])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErrorState(null)
    setResendSent(false)

    let result: Awaited<ReturnType<typeof signIn>>
    try {
      result = await signIn('credentials', { email, password, redirect: false })
    } catch {
      setErrorState(parseError('GENERIC'))
      setLoading(false)
      return
    }

    if (result?.error) {
      setErrorState(parseError(result.error))
      setLoading(false)
      return
    }

    if (!result?.ok) {
      setErrorState(parseError('GENERIC'))
      setLoading(false)
      return
    }

    router.push(safeCallbackUrl)
    router.refresh()
  }

  async function handleGoogleOAuth() {
    setLoading(true)
    await signIn('google', { callbackUrl: safeCallbackUrl })
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

  async function handleSendOTP() {
    if (!otpEmail) return
    setOtpSending(true)
    setErrorState(null)
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: otpEmail }),
      })
      if (res.ok) {
        setOtpSent(true)
        setOtpTimeRemaining(900) // 15 minutes = 900 seconds
        setErrorState(null) // Clear any previous errors
        setErrorState(null) // Clear any stale password errors
      } else {
        const data = await res.json()
        // Pass raw API error so parseError can match specific messages
        setErrorState(parseError(data.error || 'Failed to send code'))
        // Log for debugging
        console.error('send-otp error:', data)
      }
    } catch (err) {
      setErrorState(parseError('Failed to send code'))
    } finally {
      setOtpSending(false)
    }
  }

  async function handleVerifyOTP() {
    if (!otpEmail || !otpCode) return
    setLoading(true)
    setErrorState(null)
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: otpEmail, code: otpCode }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorState(parseError(data.error || 'Invalid code'))
        setLoading(false)
        return
      }

      // Use auto-login token from verify-otp response
      const result = await signIn('credentials', {
        autoLoginToken: data.autoLoginToken,
        redirect: false,
      })

      if (result?.error) {
        setErrorState(parseError(result.error))
        setLoading(false)
        return
      }

      if (!result?.ok) {
        setErrorState(parseError('GENERIC'))
        setLoading(false)
        return
      }

      router.push(safeCallbackUrl)
      router.refresh()
    } catch (err) {
      setErrorState(parseError('GENERIC'))
      setLoading(false)
    }
  }

  async function handleSendMagicLink() {
    if (!otpEmail) return
    setMagicLinkSending(true)
    setErrorState(null)
    try {
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: otpEmail }),
      })
      if (res.ok) {
        setMagicLinkSent(true)
        setErrorState(null)  // clear any stale errors
        setOtpSent(false)    // clear OTP state
        setOtpCode('')
      } else {
        const data = await res.json()
        setErrorState(parseError(data.error || 'Failed to send link'))
      }
    } catch {
      setErrorState(parseError('Failed to send link'))
    } finally {
      setMagicLinkSending(false)
    }
  }

  // Countdown timer effect
  useEffect(() => {
    if (!otpSent || otpTimeRemaining <= 0) return
    const interval = setInterval(() => {
      setOtpTimeRemaining((t) => Math.max(0, t - 1))
    }, 1000)
    return () => clearInterval(interval)
  }, [otpSent, otpTimeRemaining])

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      {status === 'authenticated' ? (
        <div className="pg-container flex min-h-screen items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: '#f97316' }} />
        </div>
      ) : (
      <>
      <style dangerouslySetInnerHTML={{ __html: aptosFontStyle }} />

      <div className="mx-auto max-w-[1920px] px-4 pt-4 pb-0 sm:px-6 lg:px-8" style={{ minHeight: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column' }}>

        {/* ── SINGLE UNIFIED CARD containing both panels ── */}
        <div className="rounded-3xl shadow-xl overflow-hidden flex-1 flex flex-col" style={{ background: 'var(--color-surface)', border: '1.5px solid var(--color-border)' }}>
          <div className="grid lg:grid-cols-2 lg:items-stretch flex-1">

          {/* ── LEFT: Login Form ── */}
          <div className="flex flex-col" style={{ borderRight: '1px solid var(--color-border)' }}>
            <div className="overflow-hidden">
              {/* Card header bar styled like signup */}
              <div className="px-6 py-5 flex items-start sm:items-center justify-between gap-3 shrink-0" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f172a 100%)', borderBottom: '1px solid rgba(249,115,22,0.25)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                    <span className="text-sm font-extrabold uppercase tracking-widest text-orange-400" style={{letterSpacing: '0.08em'}}>7-Day Free Trial</span>
                  </div>
                  <h1 className="font-black text-2xl sm:text-3xl leading-tight" style={{ color: '#fff', textShadow: '0 2px 8px #000a' }}>
                    Sign in to <span style={{ color: '#f97316', textShadow: '0 2px 8px #000a' }}>Precise GovCon</span>
                  </h1>
                  <p className="text-base sm:text-lg mt-1 leading-snug font-semibold" style={{ color: '#f1f5f9', textShadow: '0 1px 4px #0006' }}>
                    Secure access · Cancel anytime
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap justify-end">
                  <div className="hidden sm:flex items-center gap-2 rounded-lg px-4 py-2" style={{ background: 'rgba(249,115,22,0.15)', border: '1px solid #fb923c' }}>
                    <CheckCircle2 className="w-6 h-6" style={{ color: '#fb923c' }} />
                    <span className="text-lg font-extrabold" style={{ color: '#fb923c' }}>Free 7-day trial</span>
                  </div>
                  <Link
                    href="/signup"
                    className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-base font-extrabold transition-all focus:outline-none focus:ring-2 focus:ring-orange-400"
                    style={{ color: '#ffffff', background: '#f97316', boxShadow: '0 2px 8px rgba(249,115,22,0.4)' }}
                    onMouseEnter={e => ((e.currentTarget as HTMLAnchorElement).style.background = '#ea580c')}
                    onMouseLeave={e => ((e.currentTarget as HTMLAnchorElement).style.background = '#f97316')}
                  >
                    <ArrowRight className="w-4 h-4" />
                    Create Account
                  </Link>
                </div>
              </div>

              <div className="px-6 py-6 space-y-3" suppressHydrationWarning>

                {/* Error block — hide when OTP was sent successfully */}
                {errorState && !(authMode === 'otp' && otpSent) && !magicLinkSent && (
                  <ErrorBlock
                    errorState={errorState}
                    email={email}
                    onResendOrOTC={handleResendOrOTC}
                    resendLoading={resendLoading}
                    resendSent={resendSent}
                    supportHref={buildSupportHref(email, errorState)}
                  />
                )}

                {/* Google OAuth */}
                <button
                  type="button"
                  onClick={handleGoogleOAuth}
                  disabled={loading}
                  className="h-14 w-full inline-flex items-center justify-center gap-3 rounded-xl text-xl font-extrabold transition-all hover:shadow-md hover:-translate-y-0.5 disabled:opacity-60"
                  style={{ background: '#fff', color: '#0f172a', border: '2px solid var(--color-border)', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
                >
                  <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </button>
                <p className="text-center text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                  New here? Google sign-in creates your account automatically.
                </p>

                {/* Divider */}
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1" style={{ background: 'var(--color-border)' }} />
                  <span className="text-xs font-extrabold uppercase tracking-widest" style={{ color: 'var(--color-text-subtle)', letterSpacing: '0.15em' }}>or</span>
                  <div className="h-px flex-1" style={{ background: 'var(--color-border)' }} />
                </div>

                {/* Auth mode toggle */}
                <div className="flex items-center gap-1 rounded-xl border" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-muted)', padding: '4px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('password')
                      setErrorState(null)
                      setOtpCode('')
                      setOtpSent(false)
                      setOtpTimeRemaining(0)
                      setMagicLinkSent(false)
                    }}
                    className="flex-1 rounded-lg px-3 py-3 text-lg font-extrabold transition-all"
                    style={{
                      background: authMode === 'password' ? 'var(--color-primary)' : 'transparent',
                      color: authMode === 'password' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                    }}
                  >
                    Password
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('otp')
                      setErrorState(null)
                      setPassword('')
                      setOtpEmail(email)
                      setOtpSent(false)
                      setOtpCode('')
                      setMagicLinkSent(false)
                    }}
                    className="flex-1 rounded-lg px-3 py-3 text-lg font-extrabold transition-all"
                    style={{
                      background: authMode === 'otp' ? 'var(--color-primary)' : 'transparent',
                      color: authMode === 'otp' ? '#ffffff' : 'var(--color-text-secondary)',
                    }}
                  >
                    Code
                  </button>
                </div>

                {/* Password form */}
                {authMode === 'password' && (
                <form onSubmit={handleSubmit} className="space-y-2" suppressHydrationWarning>
                  <div>
                    <label htmlFor="email" className="mb-1 block text-base font-extrabold uppercase tracking-wide" style={{ color: 'var(--color-text-primary)' }}>
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      required
                      className="h-14 w-full rounded-xl px-5 text-lg outline-none transition-all focus:ring-2 focus:ring-orange-300"
                      style={{ background: 'var(--color-surface-muted)', color: 'var(--color-text-primary)', border: '2px solid var(--color-border)' }}
                    />
                  </div>

                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <label htmlFor="password" className="text-base font-extrabold uppercase tracking-wide" style={{ color: 'var(--color-text-primary)' }}>
                        Password
                      </label>
                      <Link
                        href={`/forgot-password${email ? `?email=${encodeURIComponent(email)}` : ''}`}
                        className="text-xs font-semibold hover:underline"
                        style={{ color: '#ea580c' }}
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
                        className="h-14 w-full rounded-xl px-5 pr-12 text-lg outline-none transition-all focus:ring-2 focus:ring-orange-300"
                        style={{ background: 'var(--color-surface-muted)', color: 'var(--color-text-primary)', border: '2px solid var(--color-border)' }}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        style={{ color: '#f97316' }}
                        onClick={() => setShowPassword((v) => !v)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="h-14 w-full inline-flex items-center justify-center gap-2 rounded-xl text-xl font-extrabold transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60"
                    style={{ background: '#f97316', color: '#fff', boxShadow: '0 4px 14px #f97316a0' }}
                  >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Access Dashboard <ArrowRight className="h-4 w-4" /></>}
                  </button>
                </form>
                )}

                {/* OTP form */}
                {authMode === 'otp' && (
                <form onSubmit={(e) => { e.preventDefault(); handleVerifyOTP() }} className="space-y-2" suppressHydrationWarning>
                  <div>
                    <label htmlFor="otp-email" className="mb-1 block text-base font-extrabold uppercase tracking-wide" style={{ color: 'var(--color-text-primary)' }}>
                      Email
                    </label>
                    <input
                      id="otp-email"
                      type="email"
                      value={otpEmail}
                      onChange={(e) => { setOtpEmail(e.target.value); setOtpSent(false); setMagicLinkSent(false); setErrorState(null) }}
                      placeholder="you@company.com"
                      disabled={otpSent || magicLinkSent}
                      className="h-14 w-full rounded-xl px-5 text-lg outline-none transition-all focus:ring-2 focus:ring-orange-300 disabled:opacity-60"
                      style={{ background: 'var(--color-surface-muted)', color: 'var(--color-text-primary)', border: '2px solid var(--color-border)' }}
                    />
                  </div>

                  {magicLinkSent ? (
                    /* ── MAGIC LINK SENT ── */
                    <div className="rounded-xl p-4 text-center" style={{ background: '#0f172a', border: '1.5px solid #f97316' }}>
                      <p className="font-black text-base" style={{ color: '#ffffff' }}>✓ Sign-in link sent to {otpEmail}</p>
                      <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>Check your inbox and click the link to sign in</p>
                      <button type="button" onClick={() => { setMagicLinkSent(false); setOtpSent(false); setOtpCode(''); setErrorState(null); }}
                        className="mt-3 text-xs font-bold hover:underline" style={{ color: '#f97316', background: 'none', border: 'none', cursor: 'pointer' }}>
                        Use a different method
                      </button>
                    </div>
                  ) : !otpSent ? (
                    <div className="space-y-2">
                      {/* Magic link button — primary option */}
                      <button
                        type="button"
                        onClick={handleSendMagicLink}
                        disabled={magicLinkSending || !otpEmail}
                        className="h-12 w-full inline-flex items-center justify-center gap-2 rounded-xl text-base font-bold transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60"
                        style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)', color: '#ffffff', boxShadow: '0 4px 14px rgba(249,115,22,0.35)' }}
                      >
                        {magicLinkSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Mail className="h-4 w-4" /> Send Sign-In Link</>}
                      </button>
                      {/* Divider */}
                      <div className="flex items-center gap-2 py-1">
                        <div className="h-px flex-1" style={{ background: 'var(--color-border)' }} />
                        <span className="text-xs font-bold" style={{ color: 'var(--color-text-subtle)' }}>or enter a code instead</span>
                        <div className="h-px flex-1" style={{ background: 'var(--color-border)' }} />
                      </div>
                      {/* Code button — secondary option */}
                      <button
                        type="button"
                        onClick={handleSendOTP}
                        disabled={otpSending || !otpEmail}
                        className="h-11 w-full inline-flex items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5 disabled:opacity-60"
                        style={{ background: 'var(--color-surface-muted)', color: 'var(--color-text-primary)', border: '1.5px solid var(--color-border)' }}
                      >
                        {otpSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Send 6-Digit Code</>}
                      </button>
                    </div>
                  ) : !magicLinkSent && otpTimeRemaining === 0 ? (
                    /* ── EXPIRED STATE ── */
                    <div className="space-y-3">
                      <div className="rounded-xl p-4 text-center" style={{ background: '#fef2f2', border: '1.5px solid #fecaca' }}>
                        <p className="font-black text-base" style={{ color: '#991b1b' }}>⏱ Your sign-in code has expired</p>
                        <p className="text-sm mt-1" style={{ color: '#b91c1c' }}>
                          Codes are valid for 15 minutes. Request a new one to continue.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setOtpSent(false); setOtpCode(''); setOtpTimeRemaining(0); handleSendOTP(); }}
                        disabled={otpSending}
                        className="h-12 w-full inline-flex items-center justify-center gap-2 rounded-xl text-base font-bold transition-all hover:-translate-y-0.5 disabled:opacity-60"
                        style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)', color: '#ffffff', boxShadow: '0 4px 14px rgba(249,115,22,0.3)' }}
                      >
                        {otpSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Mail className="h-4 w-4" /> Send a new code</>}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setAuthMode('password'); setOtpSent(false); setOtpCode(''); setOtpTimeRemaining(0); setErrorState(null); }}
                        className="h-10 w-full inline-flex items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5"
                        style={{ background: 'var(--color-surface-muted)', color: 'var(--color-text-primary)', border: '1.5px solid var(--color-border)' }}
                      >
                        <KeyRound className="h-4 w-4" /> Sign in with password instead
                      </button>
                    </div>
                  ) : (
                    /* ── ACTIVE CODE STATE ── */
                    <>
                      <div className="rounded-xl p-4 text-center" style={{ background: '#0f172a', border: '1.5px solid #f97316' }}>
                        <p className="font-black text-base" style={{ color: '#ffffff' }}>
                          ✓ Code sent to {otpEmail}
                        </p>
                        <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>Check your inbox and enter the 6-digit code below</p>
                      </div>

                      <div>
                        <label htmlFor="otp-code" className="mb-1 block text-base font-extrabold uppercase tracking-wide" style={{ color: 'var(--color-text-primary)' }}>
                          6-Digit Code
                        </label>
                        <input
                          id="otp-code"
                          type="text"
                          maxLength={6}
                          inputMode="numeric"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                          placeholder="000000"
                          className="h-14 w-full rounded-xl px-5 text-2xl font-mono text-center outline-none transition-all focus:ring-2 focus:ring-orange-300"
                          style={{ background: 'var(--color-surface-muted)', color: 'var(--color-text-primary)', border: '2px solid var(--color-border)', letterSpacing: '12px' }}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading || otpCode.length !== 6}
                        className="h-14 w-full inline-flex items-center justify-center gap-2 rounded-xl text-xl font-extrabold transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60"
                        style={{ background: '#f97316', color: '#fff', boxShadow: '0 4px 14px #f97316a0' }}
                      >
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Verify & Sign In <ArrowRight className="h-4 w-4" /></>}
                      </button>

                      <button
                        type="button"
                        onClick={async () => { setOtpCode(''); setOtpTimeRemaining(0); setOtpSent(false); await handleSendOTP(); }}
                        disabled={otpSending}
                        className="h-10 w-full inline-flex items-center justify-center gap-2 rounded-xl text-sm font-bold transition-all hover:-translate-y-0.5 disabled:opacity-60"
                        style={{ background: 'var(--color-surface-muted)', color: 'var(--color-text-primary)', border: '1.5px solid var(--color-border)' }}
                      >
                        {otpSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Mail className="h-4 w-4" /> Didn't receive it? Send a new code</>}
                      </button>
                    </>
                  )}
                </form>
                )}

                {/* Footer helpers */}
                <div className="pt-3 flex items-center justify-center gap-3 flex-wrap" style={{ borderTop: '1.5px solid var(--color-border)' }}>
                  <Link
                    href={`/forgot-password${email ? `?email=${encodeURIComponent(email)}` : ''}`}
                    className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold transition-all hover:-translate-y-0.5"
                    style={{ background: 'var(--color-surface-muted)', color: 'var(--color-text-primary)', border: '1.5px solid var(--color-border)' }}
                  >
                    <KeyRound className="h-3.5 w-3.5" />
                    Reset Password
                  </Link>
                  <Link
                    href="/support?openContact=1&category=Account%20%26%20Access"
                    className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold transition-all hover:-translate-y-0.5"
                    style={{ background: 'var(--color-surface-muted)', color: 'var(--color-text-primary)', border: '1.5px solid var(--color-border)' }}
                  >
                    <Mail className="h-3.5 w-3.5" />
                    Support
                  </Link>
                </div>
              </div>
            </div>

            {/* Sign-up prompt — inside card bottom */}
            <div className="mx-6 mb-6 rounded-xl p-3 flex items-center justify-between gap-2" style={{ background: 'var(--color-surface-muted)', border: '1.5px solid var(--color-border)' }}>
              <div>
                <p className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>No account yet?</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>7-day free trial — no card required.</p>
              </div>
              <Link
                href="/signup"
                className="shrink-0 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg,#f97316,#f59e0b)', color: '#ffffff', boxShadow: '0 4px 12px rgba(249,115,22,0.3)', textDecoration: 'none' }}
              >
                Create account <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* ── RIGHT: Value Panel ── */}
          <div className="flex flex-col justify-between space-y-6 p-6 sm:p-8 h-full">

            {/* Headline */}
            <div>
              <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: '#f97316' }}>Why PreciseGovCon</p>
              <h3 className="text-3xl font-black leading-tight" style={{ color: C.textPrimary }}>
                Built for serious federal pursuit teams
              </h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: C.textSecondary }}>
                Your login is the front door to live opportunities, AI-ranked fit signals, and automated alert workflows.
              </p>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-2xl p-5 text-center" style={{ background: 'var(--color-surface)', border: '1.5px solid var(--color-border)', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                  <p className="text-3xl font-black" style={{ color: '#f97316' }}>{stat.value}</p>
                  <p className="text-xs font-semibold uppercase tracking-wide mt-1" style={{ color: C.textSecondary }}>{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Feature highlights */}
            <div className="grid gap-3 sm:grid-cols-3">
              {loginHighlights.map((item) => (
                <div key={item.title} className="rounded-2xl p-4 flex gap-3 items-start" style={{ background: 'var(--color-surface)', border: '1.5px solid var(--color-border)' }}>
                  <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5" style={{ background: 'var(--color-accent-soft)' }}>
                    <item.icon className="h-4 w-4" style={{ color: '#f97316' }} />
                  </div>
                  <p className="text-sm font-semibold leading-snug" style={{ color: C.textPrimary }}>{item.title}</p>
                </div>
              ))}
            </div>

            {/* Testimonial */}
            <div className="rounded-2xl p-6" style={{ background: 'var(--color-surface)', border: '1.5px solid var(--color-border)', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div className="flex gap-0.5 mb-3">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="h-4 w-4" fill="#f97316" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-base leading-relaxed font-medium" style={{ color: C.textPrimary }}>
                &ldquo;We went from missing bids to winning contracts within our first month. The alerts alone are worth the subscription.&rdquo;
              </p>
              <p className="mt-3 text-xs font-bold" style={{ color: C.textMuted }}>Marcus T. · CEO, Federal Solutions Group</p>
            </div>

            {/* Security note */}
            <div className="rounded-2xl p-4 flex items-start gap-3" style={{ background: 'var(--color-accent-soft)', border: '1px solid var(--color-border)' }}>
              <ShieldCheck className="h-5 w-5 shrink-0 mt-0.5" style={{ color: 'var(--color-primary)' }} />
              <div>
                <p className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>Security-first access</p>
                <p className="text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                  Auth sessions are encrypted end-to-end. Account recovery is always available from the sign-in page.
                </p>
              </div>
            </div>
          </div>

          </div>{/* end grid */}
        </div>{/* end unified card */}
      </div>
      </>
      )}
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