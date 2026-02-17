// app/page.tsx
'use client'

export const dynamic = 'force-dynamic'

import React, { useCallback, useEffect, useMemo, useState, Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn, useSession } from 'next-auth/react'
import CustomSignupModal from '../components/CustomSignupModal'
import {
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Eye,
  EyeOff,
  ShieldCheck,
  RefreshCw,
  Search,
  FileText,
  Award,
  Lock,
  ArrowRight,
} from 'lucide-react'

type Mode = 'login' | 'verify' | 'resend' | 'forgot' | 'reset'

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ')
}

function getMode(sp: ReturnType<typeof useSearchParams>): Mode {
  if (!sp) return 'login'
  const m = sp.get('mode')?.toLowerCase()
  if (m === 'verify') return 'verify'
  if (m === 'resend') return 'resend'
  if (m === 'forgot') return 'forgot'
  if (m === 'reset') return 'reset'
  return 'login'
}

function getQueryToken(sp: ReturnType<typeof useSearchParams>) {
  if (!sp) return
  return (
    sp.get('token') ||
    sp.get('verificationtoken') ||
    sp.get('verifyToken') ||
    sp.get('resettoken') ||
    sp.get('resetToken')
  )
}

async function safeJson(res: Response) {
  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch {
    return { message: text }
  }
}

async function postWithFallback(
  endpoints: string[],
  body: Record<string, any>
): Promise<{ ok: boolean; status?: number; error?: string; data?: any }> {
  let lastErr = { ok: false, error: 'No endpoints tried' }
  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.status === 404) {
        lastErr = { ok: false, error: `Not found: ${url}` }
        continue
      }
      const json = await safeJson(res)
      if (!res.ok) {
        return {
          ok: false,
          status: res.status,
          error: json?.error || json?.message || `Request failed (${res.status})`,
          data: json,
        }
      }
      return { ok: true, status: res.status, data: json }
    } catch (e: any) {
      lastErr = { ok: false, error: e?.message || 'Network error' }
    }
  }
  return lastErr
}

const BG_SLIDES = [
  { src: '/auth-slides/01.jpg', alt: 'Contractors reviewing solicitations' },
  { src: '/auth-slides/02.jpg', alt: 'Consulting meeting' },
  { src: '/auth-slides/03.jpg', alt: 'Compliance documents and laptop' },
  { src: '/auth-slides/04.jpg', alt: 'Government district skyline' },
]

function HeroBackgroundSlides() {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % BG_SLIDES.length), 8500)
    return () => clearInterval(id)
  }, [])
  return (
    <div style={{ pointerEvents: 'none', position: 'absolute', inset: 0, overflow: 'hidden' }}>
      {BG_SLIDES.map((s, i) => (
        <Image
          key={s.src}
          src={s.src}
          alt={s.alt}
          fill
          priority={i === 0}
          style={{ objectFit: 'cover', transition: 'opacity 1s', opacity: i === index ? 0.2 : 0 }}
        />
      ))}
    </div>
  )
}

function InlineNotice({
  variant,
  title,
  description,
  action,
}: {
  variant: 'success' | 'warning' | 'info' | 'error'
  title: string
  description?: string
  action?: React.ReactNode
}) {
  const colors: Record<string, { border: string; bg: string; text: string; descText: string }> = {
    success: { border: '#10b981', bg: '#d1fae5', text: '#065f46', descText: '#047857' },
    warning: { border: '#f59e0b', bg: '#fef3c7', text: '#92400e', descText: '#b45309' },
    error: { border: '#ef4444', bg: '#fee2e2', text: '#991b1b', descText: '#dc2626' },
    info: { border: '#3b82f6', bg: '#dbeafe', text: '#1e40af', descText: '#2563eb' },
  }
  const c = colors[variant]
  const Icon = variant === 'success' ? CheckCircle2 : variant === 'info' ? ShieldCheck : AlertTriangle
  return (
    <div
      style={{
        display: 'flex',
        gap: '0.75rem',
        borderRadius: '0.75rem',
        border: `2px solid ${c.border}`,
        background: c.bg,
        color: c.text,
        padding: '1rem 1.25rem',
        fontSize: '0.875rem',
      }}
    >
      <Icon style={{ width: '1.25rem', height: '1.25rem', flexShrink: 0, marginTop: '0.1rem' }} />
      <div>
        <p style={{ fontWeight: 700, margin: 0, fontSize: '0.9375rem' }}>{title}</p>
        {description && (
          <p
            style={{
              fontSize: '0.8125rem',
              color: c.descText,
              fontWeight: 500,
              margin: '0.375rem 0 0',
              lineHeight: 1.5,
            }}
          >
            {description}
          </p>
        )}
        {action && <div style={{ marginTop: '0.25rem' }}>{action}</div>}
      </div>
    </div>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{
        height: '3rem',
        width: '100%',
        borderRadius: '0.75rem',
        border: '1px solid #cbd5e1',
        background: 'rgba(255,255,255,0.9)',
        padding: '0 1rem',
        fontSize: '0.875rem',
        color: '#0f172a',
        outline: 'none',
        boxSizing: 'border-box',
        ...props.style,
      }}
      className={props.className}
    />
  )
}

function PrimaryButton({
  children,
  loading,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      {...props}
      style={{
        display: 'inline-flex',
        height: '3rem',
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        borderRadius: '0.75rem',
        background: 'linear-gradient(to right, #10b981, #059669)',
        border: 'none',
        color: 'white',
        fontSize: '0.875rem',
        fontWeight: 700,
        cursor: props.disabled ? 'not-allowed' : 'pointer',
        opacity: props.disabled ? 0.6 : 1,
        ...props.style,
      }}
    >
      {loading && (
        <Loader2 style={{ width: '1rem', height: '1rem', animation: 'spin 1s linear infinite' }} />
      )}
      <span>{children}</span>
    </button>
  )
}

function SecondaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      style={{
        display: 'inline-flex',
        height: '3rem',
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        borderRadius: '0.75rem',
        border: '2px solid #e2e8f0',
        background: 'white',
        color: '#334155',
        fontSize: '0.875rem',
        fontWeight: 600,
        cursor: props.disabled ? 'not-allowed' : 'pointer',
        opacity: props.disabled ? 0.6 : 1,
        ...props.style,
      }}
    >
      {props.children}
    </button>
  )
}

const GoogleIcon = (
  <svg style={{ width: '1.25rem', height: '1.25rem' }} viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
)

function LoginPageContent() {
  const router = useRouter()
  const sp = useSearchParams()
  const { status } = useSession()

  const mode = useMemo(() => getMode(sp), [sp])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showPw2, setShowPw2] = useState(false)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<null | {
    variant: 'success' | 'warning' | 'info' | 'error'
    title: string
    description?: string
  }>(null)
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null)

  const token = useMemo(() => getQueryToken(sp), [sp])

  // NEW Mobile state to control auth form visibility
  const [showMobileAuth, setShowMobileAuth] = useState(false)

  // Desktop modal state
  const [showDesktopModal, setShowDesktopModal] = useState(false)

  // Email validation
  const isValidEmail = (email: string) => /\S+@\S+\.\S+/.test(email)

  const setUrlMode = useCallback(
    (nextMode: Mode, params?: Record<string, string>) => {
      const query = new URLSearchParams(params)
      query.set('mode', nextMode)
      router.push(`?${query.toString()}`, { scroll: false })
    },
    [router]
  )

  useEffect(() => {
    if (status === 'authenticated') router.push('/search')
  }, [status, router])

  useEffect(() => {
    if (redirectCountdown !== null && redirectCountdown > 0) {
      const t = setTimeout(() => setRedirectCountdown(redirectCountdown - 1), 1000)
      return () => clearTimeout(t)
    } else if (redirectCountdown === 0) {
      setUrlMode('login')
    }
  }, [redirectCountdown, setUrlMode])

  useEffect(() => {
    if (mode !== 'verify' || !token || busy) return
    setBusy(true)
    ;(async () => {
      try {
        const res = await postWithFallback(['/api/auth/verify', '/api/auth/verify-email'], { token })
        if (res.ok) {
          setNotice({
            variant: 'success',
            title: 'Email verified!',
            description: 'Redirecting in 5 seconds...',
          })
          setRedirectCountdown(5)
        } else {
          setNotice({ variant: 'error', title: 'Verification failed', description: res.error || 'Please try again.' })
        }
      } catch {
        setNotice({ variant: 'error', title: 'Verification failed', description: 'Please try again.' })
      } finally {
        setBusy(false)
      }
    })()
  }, [mode, token, busy])

  useEffect(() => {
    const t = getQueryToken(sp)
    if (!t || sp?.get('mode')) return
    setUrlMode('verify')
  }, [sp, setUrlMode])

  // After email verification, pre-fill email and show success message
  useEffect(() => {
    const autoLogin = sp?.get('autoLogin')
    const emailParam = sp?.get('email')
    const verified = sp?.get('verified')

    if (autoLogin === 'true' && emailParam && verified === 'true') {
      setEmail(decodeURIComponent(emailParam))
      setNotice({
        variant: 'success',
        title: '✅ Email Verified!',
        description: 'Your trial is active. Enter your password below to sign in.',
      })
      setUrlMode('login')
    }
  }, [sp])

  const onLogin = useCallback(async () => {
    setBusy(true)
    setNotice(null)
    const result = await signIn('credentials', { redirect: false, email, password, callbackUrl: '/search' })
    setBusy(false)
    if (result?.error) {
      const msg = String(result.error)
      // Unverified email - carry email into resend flow
      if (
        msg.toLowerCase().includes('not verified') ||
        msg.toLowerCase().includes('email not verified') ||
        msg.toLowerCase().includes('verify your email')
      ) {
        setNotice({
          variant: 'warning',
          title: 'Email verification required',
          description: 'Your email is not yet verified. We can send you a new verification link.',
        })
        setUrlMode('resend')
        return
      }
      // Account not found after password reset - user may have typed wrong email
      if (
        msg.toLowerCase().includes('account not found') ||
        msg.toLowerCase().includes('no user') ||
        msg.toLowerCase().includes('user not found')
      ) {
        setNotice({
          variant: 'error',
          title: 'Account not found',
          description: 'No account exists with this email address. Please check the email or create a new account.',
        })
        return
      }
      // Generic credentials error - don't expose internal message
      if (msg.toLowerCase().includes('credentialssignin') || msg.toLowerCase().includes('invalid credentials')) {
        setNotice({
          variant: 'error',
          title: 'Login failed',
          description: 'Incorrect email or password. Please try again.',
        })
        return
      }
      setNotice({ variant: 'error', title: 'Login failed', description: msg })
      return
    }
    window.location.href = '/search'
  }, [email, password, router, setUrlMode])

  const onGoogle = useCallback(async () => {
    setBusy(true)
    signIn('google', { callbackUrl: '/search', redirect: true })
  }, [])

  const onResend = useCallback(async () => {
    setBusy(true)
    setNotice(null)
    const res = await postWithFallback(['/api/auth/resend-verification', '/api/auth/send-verification'], { email })
    setBusy(false)
    if (!res.ok) {
      setNotice({ variant: 'error', title: 'Resend failed', description: res.error || 'Please try again.' })
      return
    }
    setNotice({ variant: 'success', title: 'Verification email sent', description: 'Please check your inbox.' })
  }, [email])

  const onForgot = useCallback(async () => {
    setBusy(true)
    setNotice(null)
    const res = await postWithFallback(['/api/auth/forgot-password', '/api/forgot-password'], { email })
    setBusy(false)
    if (!res.ok) {
      setNotice({ variant: 'error', title: 'Request failed', description: res.error || 'Please try again.' })
      return
    }
    setNotice({
      variant: 'success',
      title: 'Reset link sent',
      description: 'Check your email. Redirecting in 3 seconds...',
    })
    setTimeout(() => setUrlMode('login'), 3000)
  }, [email, setUrlMode])

  const onReset = useCallback(async () => {
    if (!token) {
      setNotice({
        variant: 'error',
        title: 'Missing reset token',
        description: 'Please use the link from your email.',
      })
      return
    }
    if (password.length < 8) {
      setNotice({ variant: 'warning', title: 'Password too short', description: 'Use at least 8 characters.' })
      return
    }
    if (password !== password2) {
      setNotice({ variant: 'warning', title: 'Passwords do not match' })
      return
    }
    setBusy(true)
    setNotice(null)
    const res = await postWithFallback(['/api/auth/reset-password', '/api/reset-password'], { token, password })
    setBusy(false)
    if (!res.ok) {
      setNotice({
        variant: 'error',
        title: 'Reset failed',
        description: res.error || 'Your link may have expired.',
      })
      return
    }
    setPassword('')
    setPassword2('')
    setNotice({
      variant: 'success',
      title: 'Password updated!',
      description: 'Your password has been changed. Please sign in with your new password.',
    })
    // Stay on login mode - do NOT auto-redirect, so user can see the success message
    setUrlMode('login')
  }, [password, password2, setUrlMode, token])

  const cardTitle = useMemo(() => {
    if (mode === 'verify') return 'Verify email'
    if (mode === 'resend') return 'Resend verification'
    if (mode === 'forgot') return 'Forgot password'
    if (mode === 'reset') return 'Reset password'
    return 'Welcome back'
  }, [mode])

  const cardSubtitle = useMemo(() => {
    if (mode === 'verify') return token ? 'Verifying your email…' : 'Open the link from your email.'
    if (mode === 'resend') return 'Enter your email for a new link.'
    if (mode === 'forgot') return "We'll email you a reset link."
    if (mode === 'reset') return token ? 'Create a new password.' : 'Your reset link is missing a token.'
    return 'Access your Precise GovCon dashboard.'
  }, [mode, token])

  // Modal state - all account creation goes through CustomSignupModal
  const [signupModalOpen, setSignupModalOpen] = useState(false)

  // Check if we should open signup modal on load (e.g., from header "Sign In" button)
  useEffect(() => {
    if (sp?.get('signup') === 'true' || sp?.get('action') === 'signup') {
      setSignupModalOpen(true)
    }
  }, [sp])

  // ESC key to close modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && signupModalOpen) setSignupModalOpen(false)
    }
    if (signupModalOpen) {
      document.addEventListener('keydown', handleEsc)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
      return () => {
        document.removeEventListener('keydown', handleEsc)
        document.body.style.overflow = 'unset'
      }
    }
  }, [signupModalOpen])

  if (status === 'loading') {
    return (
      <div
        style={{
          display: 'flex',
          minHeight: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #f8fafc, #ecfdf5, #f0f9ff)',
        }}
      >
        <Loader2 style={{ width: '2.5rem', height: '2.5rem', color: '#10b981', animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }

  // Shared login card body
  const loginCardBody = (
    <>
      {/* Tab Switcher - Sign In / Sign Up */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '1.5rem',
          borderBottom: '2px solid #e2e8f0',
          padding: '0 0 0.5rem 0',
        }}
      >
        <button
          onClick={() => {
            /* Already on sign in view */
          }}
          style={{
            flex: 1,
            padding: '0.75rem 1rem',
            background: 'linear-gradient(to right, #10b981, #059669)',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem 0.5rem 0 0',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)',
          }}
        >
          Sign In
        </button>
        <button
          onClick={() => setSignupModalOpen(true)}
          style={{
            flex: 1,
            padding: '0.75rem 1rem',
            background: 'transparent',
            color: '#64748b',
            border: 'none',
            borderRadius: '0.5rem 0.5rem 0 0',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f1f5f9'
            e.currentTarget.style.color = '#10b981'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = '#64748b'
          }}
        >
          Sign Up
        </button>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>{cardTitle}</h2>
        <p style={{ fontSize: '0.875rem', color: '#475569', marginTop: '0.375rem' }}>{cardSubtitle}</p>
      </div>

      {notice && <InlineNotice variant={notice.variant} title={notice.title} description={notice.description} />}

      {redirectCountdown !== null && redirectCountdown >= 0 && (
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <p style={{ fontSize: '0.875rem', color: '#475569' }}>
            Redirecting in <strong style={{ color: '#10b981' }}>{redirectCountdown}</strong>s…
          </p>
          <button
            onClick={() => {
              setRedirectCountdown(null)
              setUrlMode('login')
            }}
            style={{
              fontSize: '0.875rem',
              color: '#10b981',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Go to login now
          </button>
        </div>
      )}

      {/* LOGIN */}
      {mode === 'login' && (
        <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#334155', marginBottom: '0.375rem' }}>
              Email
            </label>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              type="email"
              autoComplete="email"
              style={{ borderColor: email && !isValidEmail(email) ? '#ef4444' : undefined }}
            />
            {email && !isValidEmail(email) && (
              <p style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem' }}>
                Please enter a valid email address
              </p>
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#334155', marginBottom: '0.375rem' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                type={showPw ? 'text' : 'password'}
                autoComplete="current-password"
                style={{ paddingRight: '3rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#64748b',
                  padding: '0.375rem',
                }}
              >
                {showPw ? <EyeOff style={{ width: '1rem', height: '1rem' }} /> : <Eye style={{ width: '1rem', height: '1rem' }} />}
              </button>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <button
              type="button"
              onClick={() => setUrlMode('forgot')}
              style={{ fontSize: '0.875rem', color: '#10b981', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Forgot password?
            </button>
          </div>

          <PrimaryButton type="button" onClick={onLogin} loading={busy}>
            Log in
          </PrimaryButton>
          <SecondaryButton type="button" onClick={onGoogle} disabled={busy}>
            {GoogleIcon} Continue with Google
          </SecondaryButton>

          <p style={{ textAlign: 'center', fontSize: '0.875rem', color: '#64748b' }}>
            Need to verify?{' '}
            <button
              type="button"
              onClick={() => setUrlMode('resend')}
              style={{ fontWeight: 600, color: '#10b981', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Resend
            </button>
          </p>

          <p style={{ textAlign: 'center', fontSize: '0.875rem', color: '#64748b' }}>
            New here?{' '}
            <button
              type="button"
              onClick={() => setSignupModalOpen(true)}
              style={{ fontWeight: 600, color: '#10b981', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Create a free account
            </button>
          </p>
        </div>
      )}

      {/* VERIFY */}
      {mode === 'verify' && (
        <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {!token && (
            <InlineNotice
              variant="info"
              title="Verification link required"
              description="Use the link sent to your email."
              action={
                <button
                  type="button"
                  onClick={() => setUrlMode('resend')}
                  style={{
                    fontWeight: 600,
                    color: '#1d4ed8',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                  }}
                >
                  Resend
                </button>
              }
            />
          )}
          {busy && <InlineNotice variant="info" title="Verifying your email…" description="This will only take a moment." />}
          <SecondaryButton type="button" onClick={() => setUrlMode('login')} disabled={busy}>
            Back to login
          </SecondaryButton>
        </div>
      )}

      {/* RESEND */}
      {mode === 'resend' && (
        <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {email && (
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '0.75rem',
                background: '#dbeafe',
                border: '1px solid #93c5fd',
                fontSize: '0.875rem',
                color: '#1e40af',
              }}
            >
              Sending to <strong>{email}</strong>
            </div>
          )}
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#334155', marginBottom: '0.375rem' }}>
              Email address
            </label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" type="email" />
          </div>
          <PrimaryButton type="button" onClick={onResend} loading={busy}>
            Send verification link
          </PrimaryButton>
          <SecondaryButton type="button" onClick={() => setUrlMode('login')} disabled={busy}>
            Back to login
          </SecondaryButton>
        </div>
      )}

      {/* FORGOT */}
      {mode === 'forgot' && (
        <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#334155', marginBottom: '0.375rem' }}>
              Email address
            </label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" type="email" autoFocus />
            {email && <p style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.25rem' }}>✓ Email pre-filled from your login attempt</p>}
          </div>
          <PrimaryButton type="button" onClick={onForgot} loading={busy}>
            Send reset link
          </PrimaryButton>
          <SecondaryButton type="button" onClick={() => setUrlMode('login')} disabled={busy}>
            Back to login
          </SecondaryButton>
        </div>
      )}

      {/* RESET */}
      {mode === 'reset' && (
        <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {!token ? (
            <InlineNotice variant="error" title="Reset link issue" description="Your link is missing a token." />
          ) : (
            <>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#334155', marginBottom: '0.375rem' }}>
                  New password
                </label>
                <div style={{ position: 'relative' }}>
                  <Input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="New password"
                    type={showPw ? 'text' : 'password'}
                    autoComplete="new-password"
                    style={{ paddingRight: '3rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#64748b',
                      padding: '0.375rem',
                    }}
                  >
                    {showPw ? <EyeOff style={{ width: '1rem', height: '1rem' }} /> : <Eye style={{ width: '1rem', height: '1rem' }} />}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#334155', marginBottom: '0.375rem' }}>
                  Confirm password
                </label>
                <div style={{ position: 'relative' }}>
                  <Input
                    value={password2}
                    onChange={(e) => setPassword2(e.target.value)}
                    placeholder="Confirm password"
                    type={showPw2 ? 'text' : 'password'}
                    autoComplete="new-password"
                    style={{ paddingRight: '3rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw2((v) => !v)}
                    style={{
                      position: 'absolute',
                      right: '0.75rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#64748b',
                      padding: '0.375rem',
                    }}
                  >
                    {showPw2 ? <EyeOff style={{ width: '1rem', height: '1rem' }} /> : <Eye style={{ width: '1rem', height: '1rem' }} />}
                  </button>
                </div>
              </div>
            </>
          )}
          <PrimaryButton type="button" onClick={onReset} loading={busy}>
            Reset password
          </PrimaryButton>
          <SecondaryButton type="button" onClick={() => setUrlMode('login')} disabled={busy}>
            Back to login
          </SecondaryButton>
        </div>
      )}
    </>
  )

  // Signup modal - triggered by "Create a free account" link
  const signupModal = (
    <CustomSignupModal
      isOpen={signupModalOpen}
      onClose={() => setSignupModalOpen(false)}
      onSuccess={() => {
        router.push('/search')
      }}
    />
  )

  const serviceCards = [
    {
      href: '/search',
      image: '/auth-cards/auth-bid-search.jpg',
      alt: 'Bid search',
      gradient: 'linear-gradient(135deg,#10b981,#3b82f6)',
      icon: Search,
      label: 'Bid Search',
      sub: 'Live federal opportunities',
    },
    {
      href: '/services/sam-registration',
      image: '/auth-cards/auth-sam-registration.jpg',
      alt: 'SAM registration',
      gradient: 'linear-gradient(135deg,#3b82f6,#06b6d4)',
      icon: ShieldCheck,
      label: 'SAM Registration',
      sub: 'Expert guidance & support',
    },
    {
      href: '/services/set-aside-certifications',
      image: '/auth-cards/auth-certifications.jpg',
      alt: 'Certifications',
      gradient: 'linear-gradient(135deg,#a855f7,#ec4899)',
      icon: Award,
      label: 'Certifications',
      sub: 'Set-aside compliance',
    },
    {
      href: '/services/proposal-writing',
      image: '/auth-cards/auth-proposals.jpg',
      alt: 'Proposals',
      gradient: 'linear-gradient(135deg,#f97316,#ef4444)',
      icon: FileText,
      label: 'Proposals',
      sub: 'AI-powered assistance',
    },
    {
      href: '/services/bid-no-bid-review',
      image: '/auth-cards/auth-compliance.jpg',
      alt: 'Bid/No-Bid',
      gradient: 'linear-gradient(135deg,#6366f1,#3b82f6)',
      icon: Lock,
      label: 'Bid/No-Bid Analysis',
      sub: 'Strategic pursuit decisions',
    },
    {
      href: '/services/capability-statements',
      image: '/auth-cards/auth-pipeline.jpg',
      alt: 'Capability Statements',
      gradient: 'linear-gradient(135deg,#14b8a6,#22c55e)',
      icon: RefreshCw,
      label: 'Capability Statements',
      sub: 'Professional one-pagers',
    },
  ]

  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #ecfdf5 50%, #f0f9ff 100%)',
        overflowX: 'hidden',
      }}
    >
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        /* Ensure modals appear above all content */
        [role="dialog"], [data-modal="true"] {
          z-index: 10000 !important;
        }

        /* Desktop two-row layout */
        .login-page-outer {
          margin: 0 auto;
          width: 80%;
          padding-top: 1.5vh;
          padding-bottom: 1.5vh;
          min-height: 97vh;
          display: flex;
          flex-direction: column;
        }
        .login-row1 {
          height: 50vh;
          display: grid;
          grid-template-columns: 1fr 34%;
          gap: 2%;
          margin-bottom: 0.5vh;
          flex-shrink: 0;
        }
        .login-hero {
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          gap: 0.3vh;
          padding: 0;
        }
        .login-card-wrap {
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        .login-card {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border-radius: 1rem;
          border: 1px solid rgba(226,232,240,0.8);
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(8px);
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.15);
          max-height: 100%;
        }
        .login-card-inner {
          flex: 1;
          overflow-y: auto;
          padding: clamp(0.8rem, 1.6vw, 2rem);
          max-height: 56vh;
          scrollbar-width: thin;
          scrollbar-color: #10b981 #e2e8f0;
        }
        .login-card-inner::-webkit-scrollbar {
          width: 6px;
        }
        .login-card-inner::-webkit-scrollbar-track {
          background: #e2e8f0;
          border-radius: 3px;
        }
        .login-card-inner::-webkit-scrollbar-thumb {
          background: #10b981;
          border-radius: 3px;
        }
        .login-row2 {
          height: 46vh;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          grid-template-rows: repeat(2, 1fr);
          gap: 1.5%;
          flex-shrink: 0;
          align-items: stretch;
        }
        .svc-card {
          display: flex;
          flex-direction: column;
          border-radius: 1rem;
          border: 1px solid #e2e8f0;
          background: white;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          transition: all 0.2s;
          text-decoration: none;
          height: 100%;
        }
        .svc-card:hover {
          border-color: #6ee7b7;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          transform: translateY(-2px);
        }
        .svc-card-img {
          flex: 1;
          position: relative;
          min-height: 0;
          height: 100%;
        }
        .svc-card-label {
          display: flex;
          align-items: center;
          gap: 0.5vw;
          padding: 0.6vh 0.8vw;
          flex-shrink: 0;
          background: white;
          border-top: 1px solid #e2e8f0;
        }
        .mobile-only { display: none !important; }
        .desktop-only { display: block; }
        .mobile-hero {
          border-radius: 1rem;
          border: 1px solid rgba(226,232,240,0.6);
          background: rgba(255,255,255,0.5);
          backdrop-filter: blur(10px);
          box-shadow: 0 10px 40px rgba(0,0,0,0.08);
          padding: 1.5rem;
          margin-bottom: 1rem;
        }
        .mobile-cta-buttons {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-top: 1.25rem;
        }
        
        /* Mobile stacked layout */
        @media (max-width: 767px) {
          .mobile-only { display: block !important; }
          .desktop-only { display: none !important; }
          .login-page-outer {
            width: 100%;
            padding: 1rem;
            box-sizing: border-box;
            min-height: auto;
          }
          .mobile-login-card {
            border-radius: 1rem;
            border: 1px solid rgba(226,232,240,0.8);
            background: rgba(255,255,255,0.95);
            backdrop-filter: blur(8px);
            box-shadow: 0 10px 30px rgba(0,0,0,0.12);
            padding: 1.5rem;
            margin-bottom: 1rem;
            max-height: 80vh;
            overflow-y: auto;
          }
          .mobile-cards-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.75rem;
          }
          .svc-card-img {
            height: 90px;
            flex: none;
          }
        }
      `}</style>

      <HeroBackgroundSlides />

      <div className="login-page-outer" style={{ position: 'relative', zIndex: 10 }}>
        {/* DESKTOP layout */}
        <div className="desktop-only">
          <div className="login-row1">
            {/* Hero */}
            <div className="login-hero">
              <div style={{ marginBottom: '1.5rem' }}>
                <Image
                  src="/logo.png"
                  alt="Precise GovCon"
                  width={200}
                  height={60}
                  priority
                  style={{ maxWidth: '100%', height: 'auto' }}
                />
              </div>
              <h1 style={{ fontSize: 'clamp(2rem, 3.5vw, 4rem)', fontWeight: 800, color: '#0f172a', lineHeight: 1.15, margin: '0 0 1rem 0' }}>
                Welcome to <span style={{ color: '#10b981' }}>Precise GovCon</span>
              </h1>
              <p style={{ fontSize: 'clamp(1.1rem, 1.5vw, 1.75rem)', fontWeight: 600, color: '#475569', lineHeight: 1.4, margin: '0 0 1.5rem 0' }}>
                Your trusted partner in government contracting success
              </p>
              <div style={{ 
                background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                border: '2px solid #10b981',
                borderRadius: '1rem',
                padding: '1.5rem',
                marginBottom: '1.5rem',
              }}>
                <p style={{ fontSize: 'clamp(1rem, 1.3vw, 1.5rem)', fontWeight: 700, color: '#065f46', lineHeight: 1.5, margin: 0 }}>
                  Sign up to get started with your <span style={{ color: '#10b981' }}>7-day free trial</span>
                </p>
              </div>
              <h2 style={{ fontSize: 'clamp(1.5rem, 2.5vw, 3rem)', fontWeight: 700, color: '#0f172a', lineHeight: 1.2, margin: '0 0 1rem 0' }}>
                Find. Qualify. Win.
              </h2>
              <p style={{ fontSize: 'clamp(0.95rem, 1.2vw, 1.35rem)', color: '#334155', lineHeight: 1.6, margin: 0 }}>
                Unified opportunity search across federal, state, and local sources — plus workflows and expert support to help you
                compete with confidence.
              </p>
            </div>

            {/* Login card */}
            <div className="login-card-wrap">
              <div className="login-card">
                <div className="login-card-inner">{loginCardBody}</div>
              </div>
            </div>
          </div>

          {/* Service cards */}
          <div className="login-row2">
            {serviceCards.map((c) => (
              <Link key={c.href} href={c.href} className="svc-card">
                <div className="svc-card-img" style={{ background: c.gradient }}>
                  <Image
                    src={c.image}
                    alt={c.alt}
                    fill
                    style={{ objectFit: 'cover', transition: 'transform 0.3s' }}
                    onError={(e) => ((e.currentTarget as HTMLImageElement).style.opacity = '0')}
                  />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }} />
                </div>
                <div className="svc-card-label">
                  <c.icon
                    style={{ width: 'clamp(0.8rem,1vw,1.2rem)', height: 'clamp(0.8rem,1vw,1.2rem)', flexShrink: 0, color: '#059669' }}
                  />
                  <div>
                    <p style={{ fontSize: 'clamp(0.65rem,0.85vw,1rem)', fontWeight: 600, color: '#0f172a', margin: 0, lineHeight: 1.2 }}>
                      {c.label}
                    </p>
                    <p style={{ fontSize: 'clamp(0.55rem,0.7vw,0.8rem)', color: '#475569', margin: 0, lineHeight: 1.3 }}>{c.sub}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* MOBILE layout with HERO FIRST */}
        <div className="mobile-only">
          {/* Hero Section - Always visible on mobile */}
          <div className="mobile-hero">
            <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
              <Image
                src="/logo.png"
                alt="Precise GovCon"
                width={150}
                height={45}
                priority
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            </div>

            <div
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: 'white',
                padding: '1rem',
                borderRadius: '0.75rem',
                marginBottom: '1rem',
                textAlign: 'center',
              }}
            >
              <p style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
                🎉 7-Day Free Trial - No Credit Card Required
              </p>
            </div>

            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2, margin: '0 0 0.75rem', textAlign: 'center' }}>
              Welcome to <span style={{ color: '#10b981' }}>Precise GovCon</span>
            </h1>
            <p style={{ fontSize: '1rem', fontWeight: 600, color: '#475569', lineHeight: 1.4, margin: '0 0 1rem', textAlign: 'center' }}>
              Your trusted partner in government contracting
            </p>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', lineHeight: 1.15, margin: '0 0 0.75rem' }}>
              Find. Qualify. Win.
            </h2>
            <p style={{ fontSize: '0.95rem', color: '#334155', lineHeight: 1.5, margin: '0 0 1rem' }}>
              Unified opportunity search across federal, state, and local sources — plus workflows and expert support to help you
              compete with confidence.
            </p>

            {/* CTAs - Only show when auth form is NOT visible */}
            {!showMobileAuth && (
              <div className="mobile-cta-buttons">
                <PrimaryButton onClick={() => setSignupModalOpen(true)}>
                  Get Started <ArrowRight style={{ width: '1rem', height: '1rem' }} />
                </PrimaryButton>
                <Link href="/search" style={{ textDecoration: 'none', width: '100%' }}>
                  <SecondaryButton style={{ width: '100%' }}>Browse Opportunities</SecondaryButton>
                </Link>
                <button
                  onClick={() => setShowMobileAuth(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '0.875rem',
                    color: '#059669',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    padding: '0.5rem',
                  }}
                >
                  Already have an account? Sign in
                </button>
              </div>
            )}
          </div>

          {/* Auth Card - Only show when user clicks CTA */}
          {showMobileAuth && (
            <div className="mobile-login-card">
              <button
                onClick={() => setShowMobileAuth(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '0.875rem',
                  color: '#059669',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginBottom: '1rem',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                ← Back
              </button>
              {loginCardBody}
            </div>
          )}

          {/* Service Cards - Always visible */}
          <div className="mobile-cards-grid">
            {serviceCards.map((c) => (
              <Link key={c.href} href={c.href} className="svc-card">
                <div className="svc-card-img" style={{ background: c.gradient }}>
                  <Image
                    src={c.image}
                    alt={c.alt}
                    fill
                    style={{ objectFit: 'cover' }}
                    onError={(e) => ((e.currentTarget as HTMLImageElement).style.opacity = '0')}
                  />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', flexShrink: 0 }}>
                  <c.icon style={{ width: '0.875rem', height: '0.875rem', flexShrink: 0, color: '#059669' }} />
                  <div>
                    <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0f172a', margin: 0 }}>{c.label}</p>
                    <p style={{ fontSize: '0.65rem', color: '#475569', margin: 0 }}>{c.sub}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {signupModal}
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div
            style={{
              width: '2rem',
              height: '2rem',
              border: '2px solid #3b82f6',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  )
}