//app/page.tsx

'use client'
export const dynamic = 'force-dynamic';
import React, { useCallback, useEffect, useMemo, useState , Suspense} from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn, useSession } from 'next-auth/react'
import {
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  RefreshCw,
  Search,
  FileText,
  Award,
} from 'lucide-react'

type Mode = 'login' | 'register' | 'verify' | 'resend' | 'forgot' | 'reset'

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ')
}

function getMode(sp: ReturnType<typeof useSearchParams>): Mode {
  if (!sp) return 'login'
  const m = (sp.get('mode') || '').toLowerCase()
  if (m === 'register') return 'register'
  if (m === 'verify') return 'verify'
  if (m === 'resend') return 'resend'
  if (m === 'forgot') return 'forgot'
  if (m === 'reset') return 'reset'
  return 'login'
}

function getQueryToken(sp: ReturnType<typeof useSearchParams>) {
  if (!sp) return ''
  return (
    sp.get('token') ||
    sp.get('verification_token') ||
    sp.get('verifyToken') ||
    sp.get('reset_token') ||
    sp.get('resetToken') ||
    ''
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
  let lastErr: { ok: boolean; status?: number; error?: string } = {
    ok: false,
    error: 'No endpoints tried',
  }

  for (const url of endpoints) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.status === 404) {
        lastErr = { ok: false, status: 404, error: `Not found: ${url}` }
        continue
      }

      const json = await safeJson(res)
      if (!res.ok) {
        const msg =
          json?.error ||
          json?.message ||
          (typeof json === 'string' ? json : undefined) ||
          `Request failed (${res.status})`
        return { ok: false, status: res.status, error: msg, data: json }
      }

      return { ok: true, status: res.status, data: json }
    } catch (e: any) {
      lastErr = { ok: false, error: e?.message || 'Network error' }
      continue
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
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % BG_SLIDES.length)
    }, 8500)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {BG_SLIDES.map((s, i) => (
        <Image
          key={s.src}
          src={s.src}
          alt={s.alt}
          fill
          priority={i === 0}
          className={cn(
            'object-cover transition-opacity duration-1000',
            i === index ? 'opacity-20' : 'opacity-0'
          )}
        />
      ))}

      <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
        {BG_SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={cn(
              'h-2 w-2 rounded-full transition-all',
              i === index
                ? 'w-6 bg-emerald-500 shadow-lg shadow-emerald-500/50'
                : 'bg-slate-400/60 hover:bg-slate-400'
            )}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
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
  const styles =
    variant === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
      : variant === 'warning'
      ? 'border-amber-200 bg-amber-50 text-amber-900'
      : variant === 'error'
      ? 'border-red-200 bg-red-50 text-red-900'
      : 'border-blue-200 bg-blue-50 text-blue-900'

  const Icon =
    variant === 'success'
      ? CheckCircle2
      : variant === 'warning'
      ? AlertTriangle
      : variant === 'error'
      ? AlertTriangle
      : ShieldCheck

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl border px-4 py-3 text-sm',
        styles
      )}
    >
      <div className="mt-0.5">
        <Icon className="h-4 w-4" />
      </div>
      <div className="space-y-1">
        <p className="font-semibold">{title}</p>
        {description ? (
          <p className="text-xs leading-snug opacity-90">{description}</p>
        ) : null}
        {action ? <div className="pt-1">{action}</div> : null}
      </div>
    </div>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        'h-12 w-full rounded-xl border border-slate-300 bg-white/90 backdrop-blur-sm px-4 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 focus:bg-white',
        props.className
      )}
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
      className={cn(
        'inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 text-sm font-bold text-white shadow-lg shadow-emerald-500/30 transition-all hover:from-emerald-600 hover:to-emerald-700 hover:shadow-emerald-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 disabled:cursor-not-allowed disabled:opacity-60',
        props.className
      )}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : null}
      <span>{children}</span>
    </button>
  )
}

function SecondaryButton(
  props: React.ButtonHTMLAttributes<HTMLButtonElement>
) {
  return (
    <button
      {...props}
      className={cn(
        'inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:cursor-not-allowed disabled:opacity-60',
        props.className
      )}
    />
  )
}

function LoginPageContent() {
  const router = useRouter()
  const sp = useSearchParams()
  const { data: session, status } = useSession()

  const mode = useMemo(() => getMode(sp), [sp])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [company, setCompany] = useState('')
  const [phone, setPhone] = useState('')
  const [title, setTitle] = useState('')

  const [showPw, setShowPw] = useState(false)
  const [showPw2, setShowPw2] = useState(false)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<null | {
    variant: 'success' | 'warning' | 'info' | 'error'
    title: string
    description?: string
  }>(null)
  
  // Track auto-redirect countdown
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null)

  const token = useMemo(() => getQueryToken(sp), [sp])

  const setUrlMode = useCallback(
    (nextMode: Mode, params?: Record<string, string>) => {
      const query = new URLSearchParams(params)
      query.set('mode', nextMode)
      router.push(`?${query.toString()}`, { scroll: false })
    },
    [router]
  )

  // Redirect if already authenticated
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/account')
    }
  }, [status, router])

  // Auto-redirect countdown after successful verification
  useEffect(() => {
    if (redirectCountdown !== null && redirectCountdown > 0) {
      const timer = setTimeout(() => {
        setRedirectCountdown(redirectCountdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (redirectCountdown === 0) {
      setUrlMode('login')
    }
  }, [redirectCountdown, setUrlMode])

  // Handle verification from email link
  useEffect(() => {
    if (mode !== 'verify' || !token || busy) return

    setBusy(true)
    ;(async () => {
      try {
        const res = await postWithFallback(
          ['/api/auth/verify', '/api/auth/verify-email'],
          { token }
        )

        if (res.ok) {
          setNotice({
            variant: 'success',
            title: 'Email verified successfully!',
            description: 'You can now log in to your account. Redirecting in 5 seconds...',
          })
          // Start countdown
          setRedirectCountdown(5)
        } else {
          setNotice({
            variant: 'error',
            title: 'Verification failed',
            description: res.error || 'Please try again or request a new verification email.',
          })
        }
      } catch {
        setNotice({
          variant: 'error',
          title: 'Verification failed',
          description: 'Please try again or request a new verification email.',
        })
      } finally {
        setBusy(false)
      }
    })()
  }, [mode, token, busy])

  useEffect(() => {
    const t = getQueryToken(sp)
    if (!t) return
    if (sp?.get('mode')) return
    setUrlMode('verify')
  }, [sp, setUrlMode])

  const onLogin = useCallback(async () => {
    setBusy(true)
    setNotice(null)
    const result = await signIn('credentials', {
      redirect: false,
      email,
      password,
    })
    setBusy(false)

    if (result?.error) {
      const msg = String(result.error)
      if (msg.toLowerCase().includes('not verified')) {
        setNotice({
          variant: 'warning',
          title: 'Email verification required',
          description:
            'Please verify your email before logging in. If you did not receive the email, resend it below.',
        })
        setUrlMode('resend')
        return
      }

      setNotice({ variant: 'error', title: 'Login failed', description: msg })
      return
    }

    setNotice({
      variant: 'success',
      title: 'Welcome back',
      description: 'Redirecting to your account…',
    })
    router.push('/account')
  }, [email, password, router, setUrlMode])

  const onGoogle = useCallback(async () => {
    setBusy(true)
    setNotice(null)
    await signIn('google', { callbackUrl: '/account' })
    setBusy(false)
  }, [])

  const onRegister = useCallback(async () => {
    setBusy(true)
    setNotice(null)
    const res = await postWithFallback(
      ['/api/auth/register', '/api/auth/signup'],
      { 
        name: `${firstName} ${lastName}`.trim(),
        firstName,
        lastName,
        email, 
        password,
        company: company || undefined,
        phone: phone || undefined,
        title: title || undefined,
      }
    )
    setBusy(false)

    if (!res.ok) {
      setNotice({
        variant: 'error',
        title: 'Registration failed',
        description: res.error || 'Please check your details and try again.',
      })
      return
    }

    setNotice({
      variant: 'success',
      title: 'Account created successfully!',
      description:
        'Please check your email for a verification link. Redirecting to login in 5 seconds...',
    })
    
    // Start countdown to redirect to login
    setRedirectCountdown(5)
  }, [email, firstName, lastName, password, company, phone, title])

  const onResend = useCallback(async () => {
    setBusy(true)
    setNotice(null)
    const res = await postWithFallback(
      ['/api/auth/resend-verification', '/api/auth/send-verification'],
      { email }
    )
    setBusy(false)

    if (!res.ok) {
      setNotice({
        variant: 'error',
        title: 'Resend failed',
        description: res.error || 'Please try again.',
      })
      return
    }

    setNotice({
      variant: 'success',
      title: 'Verification email sent',
      description: 'Please check your inbox and spam folder.',
    })
  }, [email])

  const onForgot = useCallback(async () => {
    setBusy(true)
    setNotice(null)
    const res = await postWithFallback(
      ['/api/auth/forgot-password', '/api/forgot-password'],
      { email }
    )
    setBusy(false)

    if (!res.ok) {
      setNotice({
        variant: 'error',
        title: 'Request failed',
        description: res.error || 'Please try again.',
      })
      return
    }

    setNotice({
      variant: 'success',
      title: 'Reset link sent',
      description: 'Please check your email for password reset instructions.',
    })
  }, [email])

  const onReset = useCallback(async () => {
    if (!token) {
      setNotice({
        variant: 'error',
        title: 'Missing reset token',
        description:
          'Your reset link is missing a token. Please use the link from your email.',
      })
      return
    }

    if (password.length < 8) {
      setNotice({
        variant: 'warning',
        title: 'Password too short',
        description: 'Use at least 8 characters.',
      })
      return
    }

    if (password !== password2) {
      setNotice({
        variant: 'warning',
        title: 'Passwords do not match',
        description: 'Please confirm your new password.',
      })
      return
    }

    setBusy(true)
    setNotice(null)
    const res = await postWithFallback(
      ['/api/auth/reset-password', '/api/reset-password'],
      { token, password }
    )
    setBusy(false)

    if (!res.ok) {
      setNotice({
        variant: 'error',
        title: 'Password reset failed',
        description:
          res.error ||
          'Your reset link may have expired. Please request a new one.',
      })
      return
    }

    setNotice({
      variant: 'success',
      title: 'Password updated',
      description: 'You can now log in with your new password.',
    })
    setPassword('')
    setPassword2('')
    setUrlMode('login')
  }, [password, password2, setUrlMode, token])

  const isMainTabs = mode === 'login' || mode === 'register'

  const cardTitle = useMemo(() => {
    if (mode === 'verify') return 'Verify email'
    if (mode === 'resend') return 'Resend verification'
    if (mode === 'forgot') return 'Forgot password'
    if (mode === 'reset') return 'Reset password'
    return mode === 'register' ? 'Create your account' : 'Welcome back'
  }, [mode])

  const cardSubtitle = useMemo(() => {
    if (mode === 'verify')
      return token
        ? 'We are verifying your email address…'
        : 'Open the verification link from your email.'
    if (mode === 'resend') return 'Enter your email and we will send a new link.'
    if (mode === 'forgot') return 'We will email you a secure reset link.'
    if (mode === 'reset')
      return token
        ? 'Create a new password for your account.'
        : 'Your reset link is missing a token.'
    return mode === 'register'
      ? 'Start building a stronger GovCon pipeline in minutes.'
      : 'Access your Precise GovCon dashboard and tools.'
  }, [mode, token])

  // Show loading while checking session
  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-emerald-50/30 to-sky-50">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-emerald-500 mb-4" />
          <p className="text-sm text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-emerald-50/30 to-sky-50">
      {/* Subtle animated gradient overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-100/40 via-transparent to-transparent" />
      
      <HeroBackgroundSlides />

      {/* Main content wrapper - 85% width */}
      <div className="relative z-10 flex min-h-screen flex-col">
        <main className="flex flex-1 items-center justify-center px-6 py-12">
          <div className="mx-auto flex w-full max-w-[85vw] items-center justify-between gap-10">
            {/* LEFT - Hero content (60% width) */}
            <section className="flex-[0.6] space-y-8">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-700 backdrop-blur-sm">
                  <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                  Precise GovCon • Contractor Intelligence Platform
                </div>

                <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl lg:text-6xl">
                  Find. Qualify. Win.
                  <br />
                  <span className="text-emerald-600">Government contracting</span> — with precision.
                </h1>

                <p className="max-w-2xl text-lg text-slate-700 md:text-xl">
                  Unified opportunity search across federal, state, and local sources—plus workflows and expert support to help you compete with confidence.
                </p>
              </div>

              {/* Feature cards using public images - 3 columns WITH CLICKABLE LINKS */}
              <div className="grid grid-cols-3 gap-4">
                {/* Bid Search */}
                <Link
                  href="/search"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emerald-300 hover:shadow-md hover:-translate-y-1 cursor-pointer"
                >
                  <div className="relative mb-3 h-28 w-full overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500 to-blue-600">
                    <Image
                      src="/auth-cards/auth-bid-search.jpg"
                      alt="Bid search"
                      fill
                      className="object-cover transition group-hover:scale-105 relative z-10"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.opacity = '0'
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-20" />
                  </div>
                  <div className="flex items-start gap-2">
                    <Search className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
                    <div>
                      <p className="font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors">Bid Search</p>
                      <p className="mt-1 text-xs text-slate-600">
                        Live federal opportunities
                      </p>
                    </div>
                  </div>
                </Link>

                {/* SAM Registration */}
                <Link
                  href="/services/sam-registration"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emerald-300 hover:shadow-md hover:-translate-y-1 cursor-pointer"
                >
                  <div className="relative mb-3 h-28 w-full overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600">
                    <Image
                      src="/auth-cards/auth-sam-registration.jpg"
                      alt="SAM registration"
                      fill
                      className="object-cover transition group-hover:scale-105 relative z-10"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.opacity = '0'
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-20" />
                  </div>
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
                    <div>
                      <p className="font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors">SAM Registration</p>
                      <p className="mt-1 text-xs text-slate-600">
                        Expert guidance & support
                      </p>
                    </div>
                  </div>
                </Link>

                {/* Certifications */}
                <Link
                  href="/services/set-aside-certifications"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emerald-300 hover:shadow-md hover:-translate-y-1 cursor-pointer"
                >
                  <div className="relative mb-3 h-28 w-full overflow-hidden rounded-xl bg-gradient-to-br from-purple-500 to-pink-600">
                    <Image
                      src="/auth-cards/auth-certifications.jpg"
                      alt="Certifications"
                      fill
                      className="object-cover transition group-hover:scale-105 relative z-10"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.opacity = '0'
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-20" />
                  </div>
                  <div className="flex items-start gap-2">
                    <Award className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
                    <div>
                      <p className="font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors">Certifications</p>
                      <p className="mt-1 text-xs text-slate-600">
                        Set-aside compliance
                      </p>
                    </div>
                  </div>
                </Link>

                {/* Proposals */}
                <Link
                  href="/services/proposal-writing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emerald-300 hover:shadow-md hover:-translate-y-1 cursor-pointer"
                >
                  <div className="relative mb-3 h-28 w-full overflow-hidden rounded-xl bg-gradient-to-br from-orange-500 to-red-600">
                    <Image
                      src="/auth-cards/auth-proposals.jpg"
                      alt="Proposals"
                      fill
                      className="object-cover transition group-hover:scale-105 relative z-10"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.opacity = '0'
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-20" />
                  </div>
                  <div className="flex items-start gap-2">
                    <FileText className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
                    <div>
                      <p className="font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors">Proposals</p>
                      <p className="mt-1 text-xs text-slate-600">
                        AI-powered assistance
                      </p>
                    </div>
                  </div>
                </Link>

                {/* Bid/No-Bid Analysis */}
                <Link
                  href="/services/bid-no-bid-review"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emerald-300 hover:shadow-md hover:-translate-y-1 cursor-pointer"
                >
                  <div className="relative mb-3 h-28 w-full overflow-hidden rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600">
                    <Image
                      src="/auth-cards/auth-compliance.jpg"
                      alt="Bid/No-Bid Analysis"
                      fill
                      className="object-cover transition group-hover:scale-105 relative z-10"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.opacity = '0'
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-20" />
                  </div>
                  <div className="flex items-start gap-2">
                    <Lock className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
                    <div>
                      <p className="font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors">Bid/No-Bid Analysis</p>
                      <p className="mt-1 text-xs text-slate-600">
                        Strategic pursuit decisions
                      </p>
                    </div>
                  </div>
                </Link>

                {/* Capability Statements */}
                <Link
                  href="/services/capability-statements"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emerald-300 hover:shadow-md hover:-translate-y-1 cursor-pointer"
                >
                  <div className="relative mb-3 h-28 w-full overflow-hidden rounded-xl bg-gradient-to-br from-teal-500 to-green-600">
                    <Image
                      src="/auth-cards/auth-pipeline.jpg"
                      alt="Capability Statements"
                      fill
                      className="object-cover transition group-hover:scale-105 relative z-10"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.opacity = '0'
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-20" />
                  </div>
                  <div className="flex items-start gap-2">
                    <RefreshCw className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
                    <div>
                      <p className="font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors">Capability Statements</p>
                      <p className="mt-1 text-xs text-slate-600">
                        Professional one-pagers
                      </p>
                    </div>
                  </div>
                </Link>
              </div>
            </section>

            {/* RIGHT - Auth card (35% width) */}
            <section className="flex-[0.35]">
              <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white/70 backdrop-blur-md shadow-2xl">
                <div className="p-8">
                  <div className="mb-6 text-center">
                    <h2 className="text-2xl font-bold text-slate-900">
                      {cardTitle}
                    </h2>
                    <p className="mt-2 text-sm text-slate-600">{cardSubtitle}</p>
                  </div>

                  {notice ? (
                    <InlineNotice
                      variant={notice.variant}
                      title={notice.title}
                      description={notice.description}
                    />
                  ) : null}

                  {/* Show countdown if redirecting */}
                  {redirectCountdown !== null && redirectCountdown > 0 ? (
                    <div className="mt-4 text-center">
                      <p className="text-sm text-slate-600">
                        Redirecting in <span className="font-bold text-emerald-600">{redirectCountdown}</span> seconds...
                      </p>
                      <button
                        onClick={() => {
                          setRedirectCountdown(null)
                          setUrlMode('login')
                        }}
                        className="mt-2 text-sm text-emerald-600 hover:text-emerald-700 underline"
                      >
                        Go to login now
                      </button>
                    </div>
                  ) : null}

                  {isMainTabs ? (
                    <div className="mt-6 flex gap-2 rounded-xl bg-slate-100 p-1">
                      <button
                        type="button"
                        onClick={() => setUrlMode('login')}
                        className={cn(
                          'flex-1 rounded-lg py-2.5 text-sm font-semibold transition',
                          mode === 'login'
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        )}
                      >
                        Log in
                      </button>
                      <button
                        type="button"
                        onClick={() => setUrlMode('register')}
                        className={cn(
                          'flex-1 rounded-lg py-2.5 text-sm font-semibold transition',
                          mode === 'register'
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        )}
                      >
                        Sign up
                      </button>
                    </div>
                  ) : null}

                  {/* LOGIN */}
                  {mode === 'login' ? (
                    <>
                      <div className="mt-6 space-y-4">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">
                            Email
                          </label>
                          <Input
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@company.com"
                            type="email"
                            autoComplete="email"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">
                            Password
                          </label>
                          <div className="relative">
                            <Input
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="Enter password"
                              type={showPw ? 'text' : 'password'}
                              autoComplete="current-password"
                              className="pr-12"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPw((v) => !v)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                              aria-label={
                                showPw ? 'Hide password' : 'Show password'
                              }
                            >
                              {showPw ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 text-right">
                        <button
                          type="button"
                          onClick={() => setUrlMode('forgot')}
                          className="text-sm text-emerald-600 hover:text-emerald-700 transition"
                        >
                          Forgot password?
                        </button>
                      </div>

                      <div className="mt-6 space-y-3">
                        <PrimaryButton
                          type="button"
                          onClick={onLogin}
                          loading={busy}
                        >
                          Log in
                        </PrimaryButton>
                        <SecondaryButton
                          type="button"
                          onClick={onGoogle}
                          disabled={busy}
                        >
                          <svg className="h-5 w-5" viewBox="0 0 24 24">
                            <path
                              fill="currentColor"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                              fill="currentColor"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                              fill="currentColor"
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                              fill="currentColor"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                          </svg>
                          Continue with Google
                        </SecondaryButton>
                      </div>

                      <p className="mt-6 text-center text-sm text-slate-600">
                        Need to verify your email?{' '}
                        <button
                          type="button"
                          onClick={() => setUrlMode('resend')}
                          className="font-semibold text-emerald-600 hover:text-emerald-700 transition"
                        >
                          Resend verification
                        </button>
                      </p>
                    </>
                  ) : null}

                  {notice?.variant === 'success' && mode === 'register' && redirectCountdown !== null ? (
                    <div className="mt-6 space-y-4">
                      <InlineNotice
                        variant="success"
                        title="Registration successful!"
                        description="Check your email for the verification link. You'll be redirected shortly."
                      />
                    </div>
                  ) : null}

                  {/* REGISTER FORM */}
                  {mode === 'register' && redirectCountdown === null ? (
                    <>
                      <div className="mt-6 space-y-4">
                        {/* First Name - Required */}
                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">
                            First name <span className="text-red-500">*</span>
                          </label>
                          <Input
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="John"
                            autoComplete="given-name"
                            required
                          />
                        </div>

                        {/* Last Name - Required */}
                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">
                            Last name <span className="text-red-500">*</span>
                          </label>
                          <Input
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder="Doe"
                            autoComplete="family-name"
                            required
                          />
                        </div>

                        {/* Email - Required and Immutable */}
                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">
                            Email <span className="text-red-500">*</span>
                          </label>
                          <Input
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@company.com"
                            type="email"
                            autoComplete="email"
                            required
                          />
                        </div>

                        {/* Password - Required */}
                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">
                            Password <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <Input
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="Create a password"
                              type={showPw ? 'text' : 'password'}
                              autoComplete="new-password"
                              className="pr-12"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowPw((v) => !v)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                              aria-label={showPw ? 'Hide password' : 'Show password'}
                            >
                              {showPw ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                          <p className="mt-1.5 text-xs text-slate-500">
                            Use at least 8 characters.
                          </p>
                        </div>

                        {/* Company - Optional */}
                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">
                            Company
                          </label>
                          <Input
                            value={company}
                            onChange={(e) => setCompany(e.target.value)}
                            placeholder="Your company name"
                            autoComplete="organization"
                          />
                        </div>

                        {/* Phone - Optional */}
                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">
                            Phone
                          </label>
                          <Input
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+1 (555) 123-4567"
                            type="tel"
                            autoComplete="tel"
                          />
                        </div>

                        {/* Title - Optional */}
                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">
                            Job title
                          </label>
                          <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Business Development Manager"
                            autoComplete="organization-title"
                          />
                        </div>
                      </div>

                      <div className="mt-6 space-y-3">
                        <PrimaryButton
                          type="button"
                          onClick={onRegister}
                          loading={busy}
                        >
                          Create account
                        </PrimaryButton>
                        <SecondaryButton
                          type="button"
                          onClick={onGoogle}
                          disabled={busy}
                        >
                          <svg className="h-5 w-5" viewBox="0 0 24 24">
                            <path
                              fill="currentColor"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                              fill="currentColor"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                              fill="currentColor"
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                              fill="currentColor"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                          </svg>
                          Continue with Google
                        </SecondaryButton>
                      </div>

                      <p className="mt-4 text-center text-xs text-slate-500">
                        By signing up, you agree to our{' '}
                        <Link
                          href="/terms"
                          className="font-medium text-emerald-600 hover:text-emerald-700"
                        >
                          Terms
                        </Link>{' '}
                        and{' '}
                        <Link
                          href="/privacy"
                          className="font-medium text-emerald-600 hover:text-emerald-700"
                        >
                          Privacy Policy
                        </Link>
                        .
                      </p>
                    </>
                  ) : null}

                  {/* VERIFY */}
                  {mode === 'verify' ? (
                    <>
                      {!token ? (
                        <div className="mt-6 space-y-4">
                          <InlineNotice
                            variant="info"
                            title="Verification link required"
                            description="Please use the verification link sent to your email."
                            action={
                              <button
                                type="button"
                                onClick={() => setUrlMode('resend')}
                                className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                              >
                                Resend verification
                              </button>
                            }
                          />
                        </div>
                      ) : busy ? (
                        <div className="mt-6 space-y-4">
                          <InlineNotice
                            variant="info"
                            title="Verifying your email…"
                            description="This will only take a moment."
                          />
                        </div>
                      ) : null}

                      <SecondaryButton
                        type="button"
                        onClick={() => setUrlMode('login')}
                        disabled={busy}
                        className="mt-6"
                      >
                        Back to login
                      </SecondaryButton>
                    </>
                  ) : null}

                  {/* RESEND */}
                  {mode === 'resend' ? (
                    <>
                      <div className="mt-6 space-y-4">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">
                            Email
                          </label>
                          <Input
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@company.com"
                            type="email"
                            autoComplete="email"
                          />
                        </div>
                      </div>

                      <div className="mt-6 space-y-3">
                        <PrimaryButton
                          type="button"
                          onClick={onResend}
                          loading={busy}
                        >
                          Resend verification
                        </PrimaryButton>
                        <SecondaryButton
                          type="button"
                          onClick={() => setUrlMode('login')}
                          disabled={busy}
                        >
                          Back to login
                        </SecondaryButton>
                      </div>
                    </>
                  ) : null}

                  {/* FORGOT */}
                  {mode === 'forgot' ? (
                    <>
                      <div className="mt-6 space-y-4">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-700">
                            Email
                          </label>
                          <Input
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@company.com"
                            type="email"
                            autoComplete="email"
                          />
                        </div>
                      </div>

                      <div className="mt-6 space-y-3">
                        <PrimaryButton
                          type="button"
                          onClick={onForgot}
                          loading={busy}
                        >
                          Send reset link
                        </PrimaryButton>
                        <SecondaryButton
                          type="button"
                          onClick={() => setUrlMode('login')}
                          disabled={busy}
                        >
                          Back to login
                        </SecondaryButton>
                      </div>
                    </>
                  ) : null}

                  {/* RESET */}
                  {mode === 'reset' ? (
                    <>
                      {!token ? (
                        <div className="mt-6 space-y-4">
                          <InlineNotice
                            variant="error"
                            title="Reset link issue"
                            description="Your reset link is missing a token. Request a new one."
                          />
                          <SecondaryButton
                            type="button"
                            onClick={() => setUrlMode('forgot')}
                          >
                            Request new reset link
                          </SecondaryButton>
                        </div>
                      ) : (
                        <>
                          <div className="mt-6 space-y-4">
                            <div>
                              <label className="mb-2 block text-sm font-medium text-slate-700">
                                New password
                              </label>
                              <div className="relative">
                                <Input
                                  value={password}
                                  onChange={(e) => setPassword(e.target.value)}
                                  placeholder="New password"
                                  type={showPw ? 'text' : 'password'}
                                  autoComplete="new-password"
                                  className="pr-12"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPw((v) => !v)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                                  aria-label={
                                    showPw ? 'Hide password' : 'Show password'
                                  }
                                >
                                  {showPw ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                              <p className="mt-1.5 text-xs text-slate-500">
                                Use at least 8 characters.
                              </p>
                            </div>

                            <div>
                              <label className="mb-2 block text-sm font-medium text-slate-700">
                                Confirm password
                              </label>
                              <div className="relative">
                                <Input
                                  value={password2}
                                  onChange={(e) => setPassword2(e.target.value)}
                                  placeholder="Confirm password"
                                  type={showPw2 ? 'text' : 'password'}
                                  autoComplete="new-password"
                                  className="pr-12"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPw2((v) => !v)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                                  aria-label={
                                    showPw2 ? 'Hide password' : 'Show password'
                                  }
                                >
                                  {showPw2 ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="mt-6 space-y-3">
                            <PrimaryButton
                              type="button"
                              onClick={onReset}
                              loading={busy}
                            >
                              Reset password
                            </PrimaryButton>
                            <SecondaryButton
                              type="button"
                              onClick={() => setUrlMode('login')}
                              disabled={busy}
                            >
                              Back to login
                            </SecondaryButton>
                          </div>
                        </>
                      )}
                    </>
                  ) : null}

                  {/* Footer */}
                  <footer className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4 text-xs text-slate-600">
                    <span>© {new Date().getFullYear()} Precise GovCon</span>
                    <div className="flex gap-3">
                      <Link href="/support" className="hover:text-emerald-600">
                        Support
                      </Link>
                      <Link href="/privacy" className="hover:text-emerald-600">
                        Privacy
                      </Link>
                      <Link href="/terms" className="hover:text-emerald-600">
                        Terms
                      </Link>
                    </div>
                  </footer>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  )
}