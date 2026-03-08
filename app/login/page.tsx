'use client'

import { useEffect, useState, Suspense } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Eye, EyeOff, Loader2, ShieldCheck, AlertCircle, Mail, KeyRound, CheckCircle2, Clock3, Sparkles } from 'lucide-react'

// Aptos font stack — Microsoft's modern default, falls back to Calibri then Noto Sans
const aptosFontStyle = `
  .aptos-page, .aptos-page * {
    font-family: 'Aptos', 'Aptos Display', 'Calibri', ui-sans-serif, system-ui, -apple-system, sans-serif !important;
    -webkit-font-smoothing: antialiased;
  }
  .aptos-page h1, .aptos-page h2, .aptos-page h3, .aptos-page h4,
  .aptos-page .font-black, .aptos-page .font-extrabold, .aptos-page .font-bold {
    font-weight: 800 !important;
    letter-spacing: -0.01em;
  }
  .aptos-page p, .aptos-page span, .aptos-page a, .aptos-page label {
    font-weight: 600;
  }
  .aptos-page input::placeholder { font-weight: 400; }
`

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

  if (e.includes('credentialssignin') || e.includes('invalid') || e.includes('credentials') || e.includes('password')) {
    return {
      type: 'INVALID_CREDENTIALS',
      message: 'The password you entered is incorrect.',
      suggestion: 'Try again, reset your password, or request a one-time sign-in code.',
    }
  }
  if (e.includes('oauthaccountnotlinked')) {
    return {
      type: 'GENERIC',
      message: 'This email is linked to a different sign-in method.',
      suggestion: 'Use your original OAuth provider, or reset password to continue with email access.',
    }
  }
  if (e.includes('oauthsignin') || e.includes('oauthcallback') || e.includes('callback')) {
    return {
      type: 'GENERIC',
      message: 'Your identity provider sign-in did not complete.',
      suggestion: 'Try again in a new tab, or use email/password while we verify provider access.',
    }
  }
  if (e.includes('accessdenied')) {
    return {
      type: 'SUSPENDED',
      message: 'Access to this account is currently restricted.',
      suggestion: 'Contact support to restore account access or update permissions.',
    }
  }

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

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace(safeCallbackUrl)
    }
  }, [status, router, safeCallbackUrl])

  useEffect(() => {
    if (!errorParam) return
    setErrorState(parseError(errorParam))
  }, [errorParam])

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

  return (
    <div className="aptos-page min-h-screen" style={{ background: '#f1f5f9' }}>
      <style dangerouslySetInnerHTML={{ __html: aptosFontStyle }} />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">

        {/* ── TWO-COLUMN LAYOUT ── */}
        <div className="grid gap-8 lg:grid-cols-5 lg:gap-12 items-start">

          {/* ── LEFT: Login Form Card (2 cols) ── */}
          <div className="lg:col-span-2">
            <div className="rounded-3xl bg-white shadow-xl overflow-hidden" style={{ border: '1.5px solid #e2e8f0' }}>

              {/* Card header bar */}
              <div className="px-8 py-5" style={{ background: 'linear-gradient(135deg,#1e293b 0%,#1e3a5f 100%)', borderBottom: '2px solid #f97316' }}>
                <p className="text-xs font-black uppercase tracking-widest" style={{ color: '#fdba74' }}>Account Access</p>
                <h2 className="text-2xl font-black text-white mt-0.5">Sign in to Precise GovCon</h2>
                <div className="mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: 'rgba(34,197,94,0.2)', color: '#86efac', border: '1px solid rgba(34,197,94,0.3)' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  AES-256 encrypted
                </div>
              </div>

              <div className="px-8 py-7 space-y-5">

                {/* Error block */}
                {errorState && (
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
                  className="h-12 w-full inline-flex items-center justify-center gap-3 rounded-xl text-sm font-semibold transition-all hover:shadow-md hover:-translate-y-0.5 disabled:opacity-60"
                  style={{ background: '#ffffff', color: C.textPrimary, border: '1.5px solid #d1d5db', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
                >
                  <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </button>
                <p className="text-center text-xs" style={{ color: C.textMuted }}>
                  New here? Google sign-in creates your account automatically.
                </p>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1" style={{ background: C.border }} />
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: C.textMuted }}>or</span>
                  <div className="h-px flex-1" style={{ background: C.border }} />
                </div>

                {/* Email form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="email" className="mb-1.5 block text-xs font-bold uppercase tracking-wide" style={{ color: C.textSecondary }}>
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      required
                      className="h-12 w-full rounded-xl px-4 text-sm outline-none transition-all focus:ring-2 focus:ring-orange-300"
                      style={{ background: C.surfaceMuted, color: C.textPrimary, border: `1.5px solid ${C.border}` }}
                    />
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label htmlFor="password" className="text-xs font-bold uppercase tracking-wide" style={{ color: C.textSecondary }}>
                        Password
                      </label>
                      <Link
                        href={`/forgot-password${email ? `?email=${encodeURIComponent(email)}` : ''}`}
                        className="text-xs font-semibold hover:underline"
                        style={{ color: '#ea580c' }}
                      >
                        Forgot password?
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
                        className="h-12 w-full rounded-xl px-4 pr-12 text-sm outline-none transition-all focus:ring-2 focus:ring-orange-300"
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

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="h-12 w-full inline-flex items-center justify-center gap-2 rounded-xl text-base font-bold transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60"
                    style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)', color: '#ffffff', boxShadow: '0 4px 14px rgba(249,115,22,0.35)' }}
                  >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Access Dashboard <ArrowRight className="h-4 w-4" /></>}
                  </button>
                </form>

                {/* Footer helpers */}
                <div className="pt-1 flex items-center justify-between text-xs flex-wrap gap-2" style={{ borderTop: `1px solid ${C.border}` }}>
                  <div className="flex items-center gap-1.5" style={{ color: C.textMuted }}>
                    <ShieldCheck className="h-3.5 w-3.5 shrink-0" style={{ color: '#f97316' }} />
                    MFA enforced for admin roles
                  </div>
                  <div className="flex gap-3 font-semibold">
                    <Link href={`/forgot-password${email ? `?email=${encodeURIComponent(email)}` : ''}`} style={{ color: '#ea580c' }}>Reset</Link>
                    <Link href="/support?openContact=1&category=Account%20%26%20Access" style={{ color: '#0f766e' }}>Support</Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Sign-up prompt below card */}
            <div className="mt-4 rounded-2xl p-5 flex items-center justify-between gap-4" style={{ background: '#fff7ed', border: '1.5px solid #fed7aa' }}>
              <div>
                <p className="text-sm font-bold" style={{ color: C.textPrimary }}>No account yet?</p>
                <p className="text-xs mt-0.5" style={{ color: C.textSecondary }}>7-day free trial — no card required.</p>
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

          {/* ── RIGHT: Value Panel (3 cols) ── */}
          <div className="lg:col-span-3 space-y-6">

            {/* Headline */}
            <div>
              <p className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: '#f97316' }}>Why PreciseGovCon</p>
              <h3 className="text-3xl font-black leading-tight" style={{ color: C.textPrimary }}>
                Built for serious<br />federal pursuit teams
              </h3>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: C.textSecondary }}>
                Your login is the front door to live opportunities, AI-ranked fit signals, and automated alert workflows.
              </p>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-2xl p-5 text-center" style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                  <p className="text-3xl font-black" style={{ color: '#f97316' }}>{stat.value}</p>
                  <p className="text-xs font-semibold uppercase tracking-wide mt-1" style={{ color: C.textSecondary }}>{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Feature highlights */}
            <div className="grid gap-3 sm:grid-cols-3">
              {loginHighlights.map((item) => (
                <div key={item.title} className="rounded-2xl p-4 flex gap-3 items-start" style={{ background: '#ffffff', border: '1.5px solid #e2e8f0' }}>
                  <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5" style={{ background: '#fff7ed' }}>
                    <item.icon className="h-4 w-4" style={{ color: '#f97316' }} />
                  </div>
                  <p className="text-sm font-semibold leading-snug" style={{ color: C.textPrimary }}>{item.title}</p>
                </div>
              ))}
            </div>

            {/* Testimonial */}
            <div className="rounded-2xl p-6" style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
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
            <div className="rounded-2xl p-4 flex items-start gap-3" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <ShieldCheck className="h-5 w-5 shrink-0 mt-0.5" style={{ color: '#16a34a' }} />
              <div>
                <p className="text-sm font-bold" style={{ color: '#14532d' }}>Security-first access</p>
                <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#166534' }}>
                  Auth sessions are encrypted end-to-end. Account recovery is always available from the sign-in page.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="aptos-page pg-container flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: '#f97316' }} />
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  )
}