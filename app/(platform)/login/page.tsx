'use client'

import { useEffect, useState, Suspense } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Eye, EyeOff, Loader2, ShieldCheck, AlertCircle, Mail, KeyRound, CheckCircle2, Lock, Sparkles, UserPlus } from 'lucide-react'

type ErrorType = 'EMAIL_NOT_VERIFIED' | 'ACCOUNT_NOT_FOUND' | 'INVALID_CREDENTIALS' | 'SUSPENDED' | 'TWO_FACTOR_REQUIRED' | 'GENERIC'

interface ErrorState {
  type: ErrorType
  message: string
  suggestion: string
}


function parseError(error: string): ErrorState {
  const e = error.toLowerCase()

  // OTP-specific errors
  if (e.includes('not found') || e === 'account not found') {
    return {
      type: 'ACCOUNT_NOT_FOUND',
      message: 'No account found for that email.',
      suggestion: 'Double-check the spelling, or create a free account to get started.',
    }
  }
  if (e.includes('not verified') || e === 'email_not_verified') {
    return {
      type: 'EMAIL_NOT_VERIFIED',
      message: 'Please verify your email before signing in.',
      suggestion: "We sent a verification link to your inbox — check spam if it's missing.",
    }
  }
  if (e.includes('password_login_not_enabled') || e.includes('password login not enabled')) {
    return {
      type: 'GENERIC',
      message: 'Password login is not enabled for this account.',
      suggestion: 'Use the Code / Magic Link tab to sign in, or reset your password to enable password login.',
    }
  }
  if (e.includes('two_factor_required') || e.includes('2fa required') || e.includes('two factor required')) {
    return {
      type: 'TWO_FACTOR_REQUIRED',
      message: 'Two-factor authentication is enabled for this account.',
      suggestion: 'Enter your authenticator app code (or backup code) below to finish sign-in.',
    }
  }
  if (e.includes('two_factor_invalid') || e.includes('invalid 2fa') || e.includes('invalid two factor')) {
    return {
      type: 'TWO_FACTOR_REQUIRED',
      message: 'Your two-factor code is invalid or expired.',
      suggestion: 'Enter a fresh authenticator code, or use a backup code.',
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
      message: 'Sorry, that password isn\'t right.',
      suggestion: 'Try again, or reset your password if you\'ve forgotten it.',
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
      message: 'Your account access is currently restricted.',
      suggestion: 'Email support@precisegovcon.com to restore access.',
    }
  }

  return {
    type: 'GENERIC',
    message: 'Sorry, we couldn\'t sign you in.',
    suggestion: 'Check your email and password, then try again.',
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
    <div className="rounded-xl p-3.5" style={{ background: '#fffbeb', border: '1.5px solid #fcd34d' }}>
      <div className="flex items-start gap-2.5">
        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" style={{ color: '#d97706' }} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold leading-snug" style={{ color: '#78350f' }}>
            {errorState.message}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed" style={{ color: '#92400e' }}>
            {errorState.suggestion}
          </p>
        </div>
      </div>

      <div className="mt-2.5 flex flex-wrap gap-2">
        {(errorState.type === 'INVALID_CREDENTIALS' || errorState.type === 'GENERIC') && (
          <>
            <Link
              href={`/forgot-password${email ? `?email=${encodeURIComponent(email)}` : ''}`}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all hover:opacity-90"
              style={{ background: '#d97706', color: '#ffffff' }}
            >
              <KeyRound className="h-3 w-3" /> Reset my password
            </Link>
            <button
              type="button"
              onClick={onResendOrOTC}
              disabled={resendLoading || resendSent}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: '#ffffff', color: '#78350f', border: '1.5px solid #fcd34d' }}
            >
              {resendLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Mail className="h-3 w-3" />}
              {resendSent ? '✓ Code sent!' : 'Sign in with a code instead'}
            </button>
          </>
        )}

        {errorState.type === 'EMAIL_NOT_VERIFIED' && (
          <>
            <button
              type="button"
              onClick={onResendOrOTC}
              disabled={resendLoading || resendSent}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: '#d97706', color: '#ffffff' }}
            >
              {resendLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Mail className="h-3 w-3" />}
              {resendSent ? '✓ Email sent!' : 'Resend verification email'}
            </button>
            <Link
              href={`/forgot-password${email ? `?email=${encodeURIComponent(email)}` : ''}`}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all hover:opacity-90"
              style={{ background: '#ffffff', color: '#78350f', border: '1.5px solid #fcd34d' }}
            >
              <KeyRound className="h-3 w-3" /> Reset password
            </Link>
          </>
        )}

        {errorState.type === 'ACCOUNT_NOT_FOUND' && (
          <Link
            href="/signup"
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)', color: '#ffffff' }}
          >
            <ArrowRight className="h-3 w-3" /> Create a free account
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
  const callbackUrl = searchParams.get('callbackUrl') || '/home'
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
  const [twoFactorToken, setTwoFactorToken] = useState('')
  const [twoFactorBackupCode, setTwoFactorBackupCode] = useState('')
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

    try {
      const check = await fetch('/api/auth/pre-login-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!check.ok) {
        const data = await check.json().catch(() => ({}))
        setErrorState(parseError(data?.code || 'GENERIC'))
        setLoading(false)
        return
      }
    } catch {
      // Fail open so NextAuth remains the source of truth.
    }

    let result: Awaited<ReturnType<typeof signIn>>
    try {
      result = await signIn('credentials', {
        email,
        password,
        twoFactorToken,
        twoFactorBackupCode,
        redirect: false,
      })
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

    setTwoFactorToken('')
    setTwoFactorBackupCode('')

    router.push(safeCallbackUrl)
    router.refresh()
  }

  async function handleGoogleOAuth() {
    setLoading(true)
    const callback =
      typeof window !== 'undefined'
        ? `${window.location.origin}${safeCallbackUrl}`
        : safeCallbackUrl
    await signIn('google', { callbackUrl: callback })
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
        let apiError = ''
        try {
          const contentType = res.headers.get('content-type') || ''
          if (contentType.includes('application/json')) {
            const data = await res.json().catch(() => ({} as any))
            apiError = typeof data?.error === 'string' ? data.error : ''
          } else {
            const text = await res.text().catch(() => '')
            apiError = text?.trim() || ''
          }
        } catch {
          // fall back to status-based message below
        }

        const fallback =
          res.status === 404 ? 'Account not found' :
          res.status === 400 ? 'Email not verified' :
          'Failed to send code'

        setErrorState(parseError(apiError || fallback))
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
    <div style={{ background: '#eef2f7' }}>
      {status === 'authenticated' ? (
        <div className="flex w-full items-center justify-center" style={{ minHeight: '400px' }}>
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: '#f97316' }} />
        </div>
      ) : (
      <div className="mx-auto w-full max-w-480 px-3 py-4 sm:px-5 lg:px-6">
      <div className="w-full flex flex-col lg:flex-row border-x border-slate-200 overflow-hidden rounded-xl bg-white shadow-lg">
        {/* ── LEFT: Welcome panel ── */}
        <div className="hidden lg:flex flex-col justify-center px-10 xl:px-12 py-8 relative overflow-hidden" style={{ width: '44%', minWidth: 420, maxWidth: 580, flexShrink: 0, background: '#f8fafc', borderRight: '1px solid #e2e8f0' }}>
          {/* Subtle decorative accent */}
          <div className="absolute top-0 left-0 w-1 h-full" style={{ background: 'linear-gradient(180deg, #f97316, #f59e0b)' }} />

          <div className="mb-3">
            <span className="inline-block text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full" style={{ background: 'rgba(249,115,22,0.1)', color: '#f97316', border: '1px solid rgba(249,115,22,0.2)' }}>
              Precise GovCon Platform
            </span>
          </div>

          <h1 className="text-4xl font-black leading-tight mb-3" style={{ color: '#0f172a' }}>
            Welcome back.<br />
            <span style={{ color: '#f97316' }}>Your pipeline awaits.</span>
          </h1>
          <p className="text-base leading-relaxed mb-6" style={{ color: '#475569' }}>
            Sign in to access live SAM.gov opportunities, your saved searches, deadline tracker, and automated alerts — all in one place.
          </p>

          {/* Stats row */}
          <div className="flex gap-6 mb-7">
            {[
              { value: '900+', label: 'Live opportunities daily' },
              { value: '7-day', label: 'Free trial included' },
              { value: '24 / 7', label: 'Automated alerts' },
            ].map(s => (
              <div key={s.label}>
                <div className="text-2xl font-black" style={{ color: '#0f172a' }}>{s.value}</div>
                <div className="text-xs font-semibold mt-0.5" style={{ color: '#64748b' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Feature bullets */}
          <div className="space-y-3 mb-7">
            {[
              'Search and filter all active federal solicitations',
              'NAICS code matching and set-aside opportunity filters',
              'Saved searches with real-time email alerts',
              'Deadline tracking, saved opportunities, and CSV export',
              'Analytics, insights, and contracting intelligence',
            ].map(f => (
              <div key={f} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.25)' }}>
                  <CheckCircle2 className="w-3 h-3" style={{ color: '#f97316' }} />
                </div>
                <span className="text-sm font-medium leading-snug" style={{ color: '#374151' }}>{f}</span>
              </div>
            ))}
          </div>

          {/* Bottom trust */}
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0" style={{ color: '#16a34a' }} />
            <span className="text-xs font-semibold" style={{ color: '#64748b' }}>Bank-grade security · SOC 2 compliant · Encrypted end-to-end</span>
          </div>
        </div>

        {/* ── RIGHT: Form panel ── */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 sm:px-10 py-8" style={{ background: '#ffffff', fontFamily: '"Aptos", "Segoe UI", Inter, system-ui, -apple-system, sans-serif' }}>
          <div className="w-full max-w-md">

          <div className="mb-7">
            <h2 className="text-3xl font-black mb-1" style={{ color: '#0f172a' }}>Sign in to your account</h2>
            <p className="text-base mb-3" style={{ color: '#64748b' }}>Don&apos;t have an account?</p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-black transition-all hover:opacity-90 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)', color: '#ffffff', boxShadow: '0 2px 10px rgba(249,115,22,0.3)' }}
            >
              <UserPlus className="h-4 w-4" /> Start your free trial
            </Link>
          </div>

          <div suppressHydrationWarning>

            {/* Google */}
            <button
              type="button"
              onClick={handleGoogleOAuth}
              disabled={loading}
              className="mt-4 h-12 w-full inline-flex items-center justify-center gap-3 rounded-xl text-base font-semibold transition-all hover:bg-gray-50 disabled:opacity-60"
              style={{ background: '#fff', color: '#1e293b', border: '1.5px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>

            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1" style={{ background: '#e2e8f0' }} />
              <span className="text-xs font-semibold" style={{ color: '#94a3b8' }}>or</span>
              <div className="h-px flex-1" style={{ background: '#e2e8f0' }} />
            </div>

            {/* Auth mode tabs */}
            <div className="flex rounded-xl p-1 mb-5" style={{ background: '#f1f5f9' }}>
              <button
                type="button"
                onClick={() => { setAuthMode('password'); setErrorState(null); setOtpCode(''); setOtpSent(false); setOtpTimeRemaining(0); setMagicLinkSent(false) }}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold transition-all"
                style={{
                  background: authMode === 'password' ? '#ffffff' : 'transparent',
                  color: authMode === 'password' ? '#0f172a' : '#64748b',
                  boxShadow: authMode === 'password' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                <Lock className="h-3.5 w-3.5" /> Password
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('otp'); setErrorState(null); setPassword(''); setOtpEmail(email); setOtpSent(false); setOtpCode(''); setMagicLinkSent(false) }}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold transition-all"
                style={{
                  background: authMode === 'otp' ? '#ffffff' : 'transparent',
                  color: authMode === 'otp' ? '#0f172a' : '#64748b',
                  boxShadow: authMode === 'otp' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                <Sparkles className="h-3.5 w-3.5" /> Code / Magic Link
              </button>
            </div>

            {/* ── Password form ── */}
            {authMode === 'password' && (
              <form onSubmit={handleSubmit} className="space-y-4" suppressHydrationWarning>
                <div>
                  <label htmlFor="email" className="block text-base font-bold mb-1.5" style={{ color: '#1e293b' }}>
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: '#94a3b8' }} />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      required
                      className="h-12 w-full rounded-xl pl-10 pr-4 text-base outline-none transition-all focus:ring-2 focus:ring-orange-200"
                      style={{ background: '#ffffff', color: '#0f172a', border: '2px solid #cbd5e1' }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="password" className="text-base font-bold" style={{ color: '#1e293b' }}>
                      Password
                    </label>
                    <Link
                      href={`/forgot-password${email ? `?email=${encodeURIComponent(email)}` : ''}`}
                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all hover:opacity-90"
                      style={{ background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa' }}
                    >
                      <KeyRound className="h-3 w-3" /> Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: '#94a3b8' }} />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      className="h-12 w-full rounded-xl pl-10 pr-11 text-base outline-none transition-all focus:ring-2 focus:ring-orange-200"
                      style={{ background: '#ffffff', color: '#0f172a', border: '2px solid #cbd5e1' }}
                    />
                    <button
                      type="button"
                      className="absolute right-3.5 top-1/2 -translate-y-1/2"
                      style={{ color: '#94a3b8' }}
                      onClick={() => setShowPassword((v) => !v)}
                    >
                      {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                    </button>
                  </div>
                </div>

                {errorState?.type === 'TWO_FACTOR_REQUIRED' && (
                  <>
                    <div>
                      <label htmlFor="two-factor-code" className="block text-base font-bold mb-1.5" style={{ color: '#1e293b' }}>
                        Authenticator Code
                      </label>
                      <input
                        id="two-factor-code"
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={twoFactorToken}
                        onChange={(e) => setTwoFactorToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="123456"
                        className="h-12 w-full rounded-xl px-4 text-base outline-none transition-all focus:ring-2 focus:ring-orange-200"
                        style={{ background: '#ffffff', color: '#0f172a', border: '2px solid #cbd5e1' }}
                      />
                    </div>
                    <div>
                      <label htmlFor="two-factor-backup" className="block text-base font-bold mb-1.5" style={{ color: '#1e293b' }}>
                        Backup Code <span className="font-normal text-sm" style={{ color: '#94a3b8' }}>(optional)</span>
                      </label>
                      <input
                        id="two-factor-backup"
                        type="text"
                        value={twoFactorBackupCode}
                        onChange={(e) => setTwoFactorBackupCode(e.target.value.replace(/\s+/g, ''))}
                        placeholder="8-digit backup code"
                        className="h-12 w-full rounded-xl px-4 text-base outline-none transition-all focus:ring-2 focus:ring-orange-200"
                        style={{ background: '#ffffff', color: '#0f172a', border: '2px solid #cbd5e1' }}
                      />
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="h-13 w-full inline-flex items-center justify-center gap-2 rounded-xl text-base font-black transition-all hover:opacity-90 active:scale-98 disabled:opacity-60 mt-2"
                  style={{ background: '#f97316', color: '#fff', boxShadow: '0 4px 14px rgba(249,115,22,0.4)', height: '52px' }}
                >
                  {loading
                    ? <Loader2 className="h-5 w-5 animate-spin" />
                    : <>{errorState?.type === 'TWO_FACTOR_REQUIRED' ? 'Verify & Sign In' : 'Sign In'} <ArrowRight className="h-5 w-5" /></>}
                </button>
              </form>
            )}

            {/* ── OTP / Magic Link form ── */}
            {authMode === 'otp' && (
              <form onSubmit={(e) => { e.preventDefault(); handleVerifyOTP() }} className="space-y-4" suppressHydrationWarning>
                <div>
                  <label htmlFor="otp-email" className="block text-base font-bold mb-1.5" style={{ color: '#1e293b' }}>
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: '#94a3b8' }} />
                    <input
                      id="otp-email"
                      type="email"
                      value={otpEmail}
                      onChange={(e) => { setOtpEmail(e.target.value); setOtpSent(false); setMagicLinkSent(false); setErrorState(null) }}
                      placeholder="you@company.com"
                      disabled={otpSent || magicLinkSent}
                      className="h-12 w-full rounded-xl pl-10 pr-4 text-base outline-none transition-all focus:ring-2 focus:ring-orange-200 disabled:opacity-60"
                      style={{ background: '#ffffff', color: '#0f172a', border: '2px solid #cbd5e1' }}
                    />
                  </div>
                </div>

                {magicLinkSent ? (
                  <div className="rounded-lg overflow-hidden" style={{ border: '1.5px solid #f97316' }}>
                    <div className="px-4 py-3 flex items-center gap-2" style={{ background: '#0f172a' }}>
                      <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: '#f97316' }}>
                        <CheckCircle2 className="h-3 w-3 text-white" />
                      </div>
                      <p className="font-bold text-sm" style={{ color: '#ffffff' }}>Sign-in link sent to {otpEmail}</p>
                    </div>
                    <div className="px-4 py-4" style={{ background: '#ffffff' }}>
                      <p className="text-sm font-medium mb-1" style={{ color: '#374151' }}>Check your inbox and click the sign-in link.</p>
                      <p className="text-xs mb-4" style={{ color: '#64748b' }}>Look for Precise GovCon · subject: "Your sign-in link". Check spam if missing.</p>
                      <div className="flex gap-2 flex-wrap">
                        <button type="button"
                          onClick={() => { setMagicLinkSent(false); setOtpSent(false); setOtpCode(''); setErrorState(null); handleSendMagicLink() }}
                          disabled={magicLinkSending}
                          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-all disabled:opacity-60"
                          style={{ background: '#f97316', color: '#ffffff' }}>
                          <Mail className="h-3.5 w-3.5" /> Resend link
                        </button>
                        <button type="button"
                          onClick={() => { setMagicLinkSent(false); setOtpSent(false); setOtpCode(''); setErrorState(null) }}
                          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-all"
                          style={{ background: '#f1f5f9', color: '#1e293b', border: '2px solid #94a3b8' }}>
                          Use a different method
                        </button>
                      </div>
                    </div>
                  </div>
                ) : !otpSent ? (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleSendMagicLink}
                        disabled={magicLinkSending || otpSending || !otpEmail}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold transition-all disabled:opacity-60"
                        style={{ background: '#f97316', color: '#ffffff', opacity: otpSending ? 0.35 : 1 }}
                      >
                        {magicLinkSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Mail className="h-4 w-4" /> Send sign-in link</>}
                      </button>
                      <button
                        type="button"
                        onClick={handleSendOTP}
                        disabled={otpSending || magicLinkSending || !otpEmail}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold transition-all disabled:opacity-60"
                        style={{ background: '#1d4ed8', color: '#ffffff', opacity: magicLinkSending ? 0.35 : 1 }}
                      >
                        {otpSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Send 6-digit code</>}
                      </button>
                    </div>
                    <p className="text-xs text-center font-medium" style={{ color: '#94a3b8' }}>
                      We&apos;ll send a link or code to your registered email.
                    </p>
                  </div>
                ) : !magicLinkSent && otpTimeRemaining === 0 ? (
                  <div className="space-y-3">
                    <div className="rounded-lg px-4 py-3 text-center" style={{ background: '#fef2f2', border: '1.5px solid #fecaca' }}>
                      <p className="font-bold text-sm" style={{ color: '#991b1b' }}>Your code has expired</p>
                      <p className="text-xs mt-0.5" style={{ color: '#b91c1c' }}>Codes are valid for 15 minutes. Request a new one.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setOtpSent(false); setOtpCode(''); setOtpTimeRemaining(0); handleSendOTP() }}
                      disabled={otpSending}
                      className="h-11 w-full inline-flex items-center justify-center gap-2 rounded-lg text-sm font-bold transition-all disabled:opacity-60"
                      style={{ background: '#1d4ed8', color: '#ffffff' }}
                    >
                      {otpSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Mail className="h-4 w-4" /> Request new code</>}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAuthMode('password'); setOtpSent(false); setOtpCode(''); setOtpTimeRemaining(0); setErrorState(null) }}
                      className="h-10 w-full inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-all"
                      style={{ background: '#f1f5f9', color: '#1e293b', border: '2px solid #94a3b8' }}
                    >
                      <KeyRound className="h-4 w-4" /> Use password instead
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="rounded-lg px-4 py-3 text-center" style={{ background: '#0f172a', border: '1.5px solid #f97316' }}>
                      <p className="font-bold text-sm" style={{ color: '#ffffff' }}>Code sent to {otpEmail}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>Enter the 6-digit code from your inbox</p>
                    </div>
                    <div>
                      <label htmlFor="otp-code" className="block text-base font-bold mb-1.5" style={{ color: '#1e293b' }}>
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
                        className="h-16 w-full rounded-xl px-4 text-4xl font-mono text-center outline-none transition-all focus:ring-2 focus:ring-orange-200"
                        style={{ background: '#f8fafc', color: '#0f172a', border: '2px solid #cbd5e1', letterSpacing: '14px' }}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading || otpCode.length !== 6}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl text-base font-black transition-all hover:opacity-90 active:scale-98 disabled:opacity-60"
                      style={{ background: '#f97316', color: '#fff', boxShadow: '0 4px 14px rgba(249,115,22,0.4)', height: '52px' }}
                    >
                      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Verify & Sign In <ArrowRight className="h-5 w-5" /></>}
                    </button>
                    <button
                      type="button"
                      onClick={async () => { setOtpCode(''); setOtpTimeRemaining(0); setOtpSent(false); await handleSendOTP() }}
                      disabled={otpSending}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-60"
                      style={{ background: '#f1f5f9', color: '#1e293b', border: '2px solid #cbd5e1', height: '44px' }}
                    >
                      {otpSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Mail className="h-4 w-4" /> Resend code</>}
                    </button>
                  </>
                )}
              </form>
            )}

            {/* Error — shown below the active form */}
            {errorState && !(authMode === 'otp' && otpSent) && !magicLinkSent && (
              <div className="mt-4">
                <ErrorBlock
                  errorState={errorState}
                  email={email}
                  onResendOrOTC={handleResendOrOTC}
                  resendLoading={resendLoading}
                  resendSent={resendSent}
                />
              </div>
            )}

            {/* Footer */}
            <div className="mt-6 pt-5" style={{ borderTop: '1px solid #e2e8f0' }}>
              <Link
                href={`/forgot-password${email ? `?email=${encodeURIComponent(email)}` : ''}`}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-3 text-base font-bold transition-all hover:opacity-90 active:scale-98"
                style={{ background: '#1e40af', color: '#ffffff', height: '52px', boxShadow: '0 2px 8px rgba(30,64,175,0.25)' }}
              >
                <KeyRound className="h-5 w-5" /> Forgot your password? Reset it here
              </Link>
            </div>
          </div>
        </div>
        </div>
      </div>
      </div>
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
