'use client'
export const dynamic = 'force-dynamic';
import React, { useCallback, useEffect, useMemo, useState, Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import CookieConsent from '../components/CookieConsent'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn, useSession } from 'next-auth/react'
import {
  CheckCircle2, AlertTriangle, Loader2, Eye, EyeOff,
  ShieldCheck, RefreshCw, Search, FileText, Award, Lock
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
  return sp.get('token') || sp.get('verification_token') || sp.get('verifyToken') || sp.get('reset_token') || sp.get('resetToken') || ''
}

async function safeJson(res: Response) {
  const text = await res.text()
  try { return JSON.parse(text) } catch { return { message: text } }
}

async function postWithFallback(endpoints: string[], body: Record<string, any>): Promise<{ ok: boolean; status?: number; error?: string; data?: any }> {
  let lastErr = { ok: false, error: 'No endpoints tried' }
  for (const url of endpoints) {
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (res.status === 404) { lastErr = { ok: false, error: `Not found: ${url}` }; continue }
      const json = await safeJson(res)
      if (!res.ok) return { ok: false, status: res.status, error: json?.error || json?.message || `Request failed (${res.status})`, data: json }
      return { ok: true, status: res.status, data: json }
    } catch (e: any) { lastErr = { ok: false, error: e?.message || 'Network error' } }
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
        <Image key={s.src} src={s.src} alt={s.alt} fill priority={i === 0}
          style={{ objectFit: 'cover', transition: 'opacity 1s', opacity: i === index ? 0.2 : 0 }} />
      ))}
    </div>
  )
}

function InlineNotice({ variant, title, description, action }: {
  variant: 'success' | 'warning' | 'info' | 'error'; title: string; description?: string; action?: React.ReactNode
}) {
  const colors: Record<string, { border: string; bg: string; text: string; descText: string }> = {
    success: { border: '#10b981', bg: '#d1fae5', text: '#065f46', descText: '#047857' },
    warning: { border: '#f59e0b', bg: '#fef3c7', text: '#92400e', descText: '#b45309' },
    error:   { border: '#ef4444', bg: '#fee2e2', text: '#991b1b', descText: '#dc2626' },
    info:    { border: '#3b82f6', bg: '#dbeafe', text: '#1e40af', descText: '#2563eb' },
  }
  const c = colors[variant]
  const Icon = variant === 'success' ? CheckCircle2 : variant === 'info' ? ShieldCheck : AlertTriangle
  return (
    <div style={{ display: 'flex', gap: '0.75rem', borderRadius: '0.75rem', border: `2px solid ${c.border}`, background: c.bg, color: c.text, padding: '1rem 1.25rem', fontSize: '0.875rem' }}>
      <Icon style={{ width: '1.25rem', height: '1.25rem', flexShrink: 0, marginTop: '0.1rem' }} />
      <div>
        <p style={{ fontWeight: 700, margin: 0, fontSize: '0.9375rem' }}>{title}</p>
        {description && <p style={{ fontSize: '0.8125rem', color: c.descText, fontWeight: 500, margin: '0.375rem 0 0', lineHeight: 1.5 }}>{description}</p>}
        {action && <div style={{ marginTop: '0.25rem' }}>{action}</div>}
      </div>
    </div>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input {...props} style={{ height: '3rem', width: '100%', borderRadius: '0.75rem', border: '1px solid #cbd5e1', background: 'rgba(255,255,255,0.9)', padding: '0 1rem', fontSize: '0.875rem', color: '#0f172a', outline: 'none', boxSizing: 'border-box', ...(props.style || {}) }}
      className={props.className} />
  )
}

function PrimaryButton({ children, loading, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button {...props} style={{ display: 'inline-flex', height: '3rem', width: '100%', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', borderRadius: '0.75rem', background: 'linear-gradient(to right, #10b981, #059669)', border: 'none', color: 'white', fontSize: '0.875rem', fontWeight: 700, cursor: props.disabled ? 'not-allowed' : 'pointer', opacity: props.disabled ? 0.6 : 1, ...(props.style || {}) }}>
      {loading && <Loader2 style={{ width: '1rem', height: '1rem', animation: 'spin 1s linear infinite' }} />}
      <span>{children}</span>
    </button>
  )
}

function SecondaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props} style={{ display: 'inline-flex', height: '3rem', width: '100%', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', borderRadius: '0.75rem', border: '2px solid #e2e8f0', background: 'white', color: '#334155', fontSize: '0.875rem', fontWeight: 600, cursor: props.disabled ? 'not-allowed' : 'pointer', opacity: props.disabled ? 0.6 : 1, ...(props.style || {}) }} />
  )
}

const GoogleIcon = () => (
  <svg style={{ width: '1.25rem', height: '1.25rem' }} viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
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
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [company, setCompany] = useState('')
  const [phone, setPhone] = useState('')
  const [title, setTitle] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showPw2, setShowPw2] = useState(false)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<null | { variant: 'success' | 'warning' | 'info' | 'error'; title: string; description?: string }>(null)
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null)
  const token = useMemo(() => getQueryToken(sp), [sp])

  // Email validation
  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  
  // Password validation rules
  const passwordRules = {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  }
  
  const isPasswordValid = passwordRules.minLength && passwordRules.hasUpperCase && passwordRules.hasLowerCase && passwordRules.hasNumber
  const passwordsMatch = password2 === password && password.length > 0
  
  // Phone formatting function
  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length === 0) return ''
    if (cleaned.length <= 3) return cleaned
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`
    if (cleaned.length <= 10) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setPhone(formatted)
  }

  const setUrlMode = useCallback((nextMode: Mode, params?: Record<string, string>) => {
    const query = new URLSearchParams(params)
    query.set('mode', nextMode)
    router.push(`?${query.toString()}`, { scroll: false })
  }, [router])

  useEffect(() => { if (status === 'authenticated') router.push('/dashboard') }, [status, router])

  useEffect(() => {
    if (redirectCountdown !== null && redirectCountdown > 0) {
      const t = setTimeout(() => setRedirectCountdown(redirectCountdown - 1), 1000)
      return () => clearTimeout(t)
    } else if (redirectCountdown === 0) setUrlMode('login')
  }, [redirectCountdown, setUrlMode])

  useEffect(() => {
    if (mode !== 'verify' || !token || busy) return
    setBusy(true)
    ;(async () => {
      try {
        const res = await postWithFallback(['/api/auth/verify', '/api/auth/verify-email'], { token })
        if (res.ok) { setNotice({ variant: 'success', title: 'Email verified!', description: 'Redirecting in 5 seconds...' }); setRedirectCountdown(5) }
        else setNotice({ variant: 'error', title: 'Verification failed', description: res.error || 'Please try again.' })
      } catch { setNotice({ variant: 'error', title: 'Verification failed', description: 'Please try again.' }) }
      finally { setBusy(false) }
    })()
  }, [mode, token, busy])

  useEffect(() => {
    const t = getQueryToken(sp)
    if (!t || sp?.get('mode')) return
    setUrlMode('verify')
  }, [sp, setUrlMode])

  const onLogin = useCallback(async () => {
    setBusy(true); setNotice(null)
    const result = await signIn('credentials', { redirect: false, email, password })
    setBusy(false)
    if (result?.error) {
      const msg = String(result.error)
      if (msg.toLowerCase().includes('not verified')) { setNotice({ variant: 'warning', title: 'Email verification required', description: 'Please verify your email before logging in.' }); setUrlMode('resend'); return }
      setNotice({ variant: 'error', title: 'Login failed', description: msg }); return
    }
    router.push('/dashboard')
  }, [email, password, router, setUrlMode])

  const onGoogle = useCallback(async () => { setBusy(true); await signIn('google', { callbackUrl: '/dashboard' }); setBusy(false) }, [])

  const onRegister = useCallback(async () => {
    setBusy(true); setNotice(null)
    
    // Validation
    if (!firstName.trim() || !lastName.trim()) {
      setNotice({ variant: 'warning', title: 'Name required', description: 'Please enter your first and last name.' })
      setBusy(false)
      return
    }
    if (!isValidEmail(email)) {
      setNotice({ variant: 'warning', title: 'Invalid email', description: 'Please enter a valid email address.' })
      setBusy(false)
      return
    }
    if (!isPasswordValid) {
      setNotice({ variant: 'warning', title: 'Password requirements not met', description: 'Please ensure your password meets all requirements.' })
      setBusy(false)
      return
    }
    if (!passwordsMatch) {
      setNotice({ variant: 'warning', title: 'Passwords do not match', description: 'Please make sure both password fields match.' })
      setBusy(false)
      return
    }
    
    const res = await postWithFallback(['/api/auth/register', '/api/auth/signup'], { name: `${firstName} ${lastName}`.trim(), first_name: firstName, last_name: lastName, email, password, company: company || undefined, phone: phone || undefined, title: title || undefined })
    setBusy(false)
    if (!res.ok) { setNotice({ variant: 'error', title: 'Registration failed', description: res.error || 'Please check your details.' }); return }
    setNotice({ variant: 'success', title: `We've sent an email to ${email}`, description: 'Please check your inbox and follow the instructions. Be sure to check your spam folder if you don\'t see it within a few minutes.' })
    setRedirectCountdown(5)
  }, [email, firstName, lastName, password, password2, company, phone, title])

  const onResend = useCallback(async () => {
    setBusy(true); setNotice(null)
    const res = await postWithFallback(['/api/auth/resend-verification', '/api/auth/send-verification'], { email })
    setBusy(false)
    if (!res.ok) { setNotice({ variant: 'error', title: 'Resend failed', description: res.error || 'Please try again.' }); return }
    setNotice({ variant: 'success', title: 'Verification email sent', description: 'Please check your inbox.' })
  }, [email])

  const onForgot = useCallback(async () => {
    setBusy(true); setNotice(null)
    const res = await postWithFallback(['/api/auth/forgot-password', '/api/forgot-password'], { email })
    setBusy(false)
    if (!res.ok) { setNotice({ variant: 'error', title: 'Request failed', description: res.error || 'Please try again.' }); return }
    setNotice({ variant: 'success', title: 'Reset link sent', description: 'Check your email. Redirecting in 3 seconds...' })
    setTimeout(() => setUrlMode('login'), 3000)
  }, [email, setUrlMode])

  const onReset = useCallback(async () => {
    if (!token) { setNotice({ variant: 'error', title: 'Missing reset token', description: 'Please use the link from your email.' }); return }
    if (password.length < 8) { setNotice({ variant: 'warning', title: 'Password too short', description: 'Use at least 8 characters.' }); return }
    if (password !== password2) { setNotice({ variant: 'warning', title: 'Passwords do not match' }); return }
    setBusy(true); setNotice(null)
    const res = await postWithFallback(['/api/auth/reset-password', '/api/reset-password'], { token, password })
    setBusy(false)
    if (!res.ok) { setNotice({ variant: 'error', title: 'Reset failed', description: res.error || 'Your link may have expired.' }); return }
    setNotice({ variant: 'success', title: 'Password updated' })
    setPassword(''); setPassword2(''); setUrlMode('login')
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
    if (mode === 'verify') return token ? 'Verifying your email…' : 'Open the link from your email.'
    if (mode === 'resend') return 'Enter your email for a new link.'
    if (mode === 'forgot') return 'We will email you a reset link.'
    if (mode === 'reset') return token ? 'Create a new password.' : 'Your reset link is missing a token.'
    return mode === 'register' ? 'Start building a stronger GovCon pipeline.' : 'Access your Precise GovCon dashboard.'
  }, [mode, token])

  if (status === 'loading') {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f8fafc, #ecfdf5, #f0f9ff)' }}>
        <Loader2 style={{ width: '2.5rem', height: '2.5rem', color: '#10b981', animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }

  // Shared login card body
  const loginCardBody = (
    <>
      <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>{cardTitle}</h2>
        <p style={{ fontSize: '0.875rem', color: '#475569', marginTop: '0.375rem' }}>{cardSubtitle}</p>
      </div>

      {notice && <InlineNotice variant={notice.variant} title={notice.title} description={notice.description} />}

      {redirectCountdown !== null && redirectCountdown > 0 && (
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <p style={{ fontSize: '0.875rem', color: '#475569' }}>Redirecting in <strong style={{ color: '#10b981' }}>{redirectCountdown}</strong>s…</p>
          <button onClick={() => { setRedirectCountdown(null); setUrlMode('login') }} style={{ fontSize: '0.875rem', color: '#10b981', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Go to login now</button>
        </div>
      )}

      {isMainTabs && (
        <div style={{ display: 'flex', gap: '0.5rem', background: '#f1f5f9', borderRadius: '0.75rem', padding: '0.25rem', marginTop: '1.25rem' }}>
          {(['login', 'register'] as Mode[]).map(m => (
            <button key={m} type="button" onClick={() => setUrlMode(m)} style={{ flex: 1, borderRadius: '0.5rem', padding: '0.625rem', fontSize: '0.875rem', fontWeight: 600, border: 'none', cursor: 'pointer', background: mode === m ? 'linear-gradient(to right, #ea580c, #f97316)' : 'transparent', color: mode === m ? 'white' : '#64748b', boxShadow: mode === m ? '0 1px 3px rgba(234,88,12,0.3)' : 'none', transition: 'all 0.15s' }}>
              {m === 'login' ? 'Log in' : 'Sign up'}
            </button>
          ))}
        </div>
      )}

      {/* LOGIN */}
      {mode === 'login' && (
        <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#334155', marginBottom: '0.375rem' }}>Email</label>
            <Input 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder="you@company.com" 
              type="email" 
              autoComplete="email"
              style={{ 
                borderColor: email && !isValidEmail(email) ? '#ef4444' : undefined
              }}
            />
            {email && !isValidEmail(email) && (
              <p style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem' }}>Please enter a valid email address</p>
            )}
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#334155', marginBottom: '0.375rem' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Input value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" type={showPw ? 'text' : 'password'} autoComplete="current-password" style={{ paddingRight: '3rem' }} />
              <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '0.375rem' }}>
                {showPw ? <EyeOff style={{ width: '1rem', height: '1rem' }} /> : <Eye style={{ width: '1rem', height: '1rem' }} />}
              </button>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <button type="button" onClick={() => setUrlMode('forgot')} style={{ fontSize: '0.875rem', color: '#10b981', background: 'none', border: 'none', cursor: 'pointer' }}>Forgot password?</button>
          </div>
          <PrimaryButton type="button" onClick={onLogin} loading={busy}>Log in</PrimaryButton>
          <SecondaryButton type="button" onClick={onGoogle} disabled={busy}><GoogleIcon />Continue with Google</SecondaryButton>
          <p style={{ textAlign: 'center', fontSize: '0.875rem', color: '#64748b' }}>
            Need to verify? <button type="button" onClick={() => setUrlMode('resend')} style={{ fontWeight: 600, color: '#10b981', background: 'none', border: 'none', cursor: 'pointer' }}>Resend</button>
          </p>
        </div>
      )}

      {/* REGISTER */}
      {mode === 'register' && redirectCountdown === null && (
        <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#334155', marginBottom: '0.375rem' }}>First name <span style={{ color: '#ef4444' }}>*</span></label>
              <Input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="John" autoComplete="given-name" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#334155', marginBottom: '0.375rem' }}>Last name <span style={{ color: '#ef4444' }}>*</span></label>
              <Input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Doe" autoComplete="family-name" />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#334155', marginBottom: '0.375rem' }}>Email <span style={{ color: '#ef4444' }}>*</span></label>
            <Input 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder="you@company.com" 
              type="email" 
              autoComplete="email"
              style={{ 
                borderColor: email && !isValidEmail(email) ? '#ef4444' : undefined
              }}
            />
            {email && !isValidEmail(email) && (
              <p style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem' }}>Please enter a valid email address</p>
            )}
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#334155', marginBottom: '0.375rem' }}>Password <span style={{ color: '#ef4444' }}>*</span></label>
            <div style={{ position: 'relative' }}>
              <Input value={password} onChange={e => setPassword(e.target.value)} placeholder="Create password" type={showPw ? 'text' : 'password'} autoComplete="new-password" style={{ paddingRight: '3rem' }} />
              <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '0.375rem' }}>
                {showPw ? <EyeOff style={{ width: '1rem', height: '1rem' }} /> : <Eye style={{ width: '1rem', height: '1rem' }} />}
              </button>
            </div>
            {password.length > 0 && (
              <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '0.5rem', fontSize: '0.75rem' }}>
                <p style={{ fontWeight: 600, color: '#334155', margin: '0 0 0.375rem 0' }}>Password must contain:</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: passwordRules.minLength ? '#10b981' : '#64748b' }}>
                    <CheckCircle2 style={{ width: '0.875rem', height: '0.875rem', flexShrink: 0 }} />
                    <span>At least 8 characters</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: passwordRules.hasUpperCase ? '#10b981' : '#64748b' }}>
                    <CheckCircle2 style={{ width: '0.875rem', height: '0.875rem', flexShrink: 0 }} />
                    <span>One uppercase letter (A-Z)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: passwordRules.hasLowerCase ? '#10b981' : '#64748b' }}>
                    <CheckCircle2 style={{ width: '0.875rem', height: '0.875rem', flexShrink: 0 }} />
                    <span>One lowercase letter (a-z)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: passwordRules.hasNumber ? '#10b981' : '#64748b' }}>
                    <CheckCircle2 style={{ width: '0.875rem', height: '0.875rem', flexShrink: 0 }} />
                    <span>One number (0-9)</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#334155', marginBottom: '0.375rem' }}>Confirm password <span style={{ color: '#ef4444' }}>*</span></label>
            <div style={{ position: 'relative' }}>
              <Input 
                value={password2} 
                onChange={e => setPassword2(e.target.value)} 
                placeholder="Re-enter password" 
                type={showPw2 ? 'text' : 'password'} 
                autoComplete="new-password"
                style={{ 
                  paddingRight: '3rem',
                  borderColor: password2.length > 0 && !passwordsMatch ? '#ef4444' : undefined
                }}
              />
              <button type="button" onClick={() => setShowPw2(v => !v)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '0.375rem' }}>
                {showPw2 ? <EyeOff style={{ width: '1rem', height: '1rem' }} /> : <Eye style={{ width: '1rem', height: '1rem' }} />}
              </button>
            </div>
            {password2.length > 0 && !passwordsMatch && (
              <p style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem' }}>Passwords do not match</p>
            )}
            {password2.length > 0 && passwordsMatch && (
              <p style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <CheckCircle2 style={{ width: '0.875rem', height: '0.875rem' }} />
                Passwords match
              </p>
            )}
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#334155', marginBottom: '0.375rem' }}>Company</label>
            <Input value={company} onChange={e => setCompany(e.target.value)} placeholder="Your company name" autoComplete="organization" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#334155', marginBottom: '0.375rem' }}>Phone</label>
            <Input value={phone} onChange={handlePhoneChange} placeholder="(555) 123-4567" type="tel" autoComplete="tel" />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#334155', marginBottom: '0.375rem' }}>Job title</label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Business Development Manager" autoComplete="organization-title" />
          </div>
          <PrimaryButton type="button" onClick={onRegister} loading={busy}>Create account</PrimaryButton>
          <SecondaryButton type="button" onClick={onGoogle} disabled={busy}><GoogleIcon />Continue with Google</SecondaryButton>
          <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#64748b' }}>
            By signing up you agree to our <Link href="/terms" style={{ color: '#10b981', fontWeight: 500 }}>Terms</Link> and <Link href="/privacy" style={{ color: '#10b981', fontWeight: 500 }}>Privacy Policy</Link>.
          </p>
        </div>
      )}

      {/* VERIFY */}
      {mode === 'verify' && (
        <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {!token && <InlineNotice variant="info" title="Verification link required" description="Use the link sent to your email." action={<button type="button" onClick={() => setUrlMode('resend')} style={{ fontWeight: 600, color: '#1d4ed8', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem' }}>Resend</button>} />}
          {busy && <InlineNotice variant="info" title="Verifying your email…" description="This will only take a moment." />}
          <SecondaryButton type="button" onClick={() => setUrlMode('login')} disabled={busy}>Back to login</SecondaryButton>
        </div>
      )}

      {/* RESEND */}
      {mode === 'resend' && (
        <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#334155', marginBottom: '0.375rem' }}>Email</label>
            <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" type="email" />
          </div>
          <PrimaryButton type="button" onClick={onResend} loading={busy}>Resend verification</PrimaryButton>
          <SecondaryButton type="button" onClick={() => setUrlMode('login')} disabled={busy}>Back to login</SecondaryButton>
        </div>
      )}

      {/* FORGOT */}
      {mode === 'forgot' && (
        <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#334155', marginBottom: '0.375rem' }}>Email</label>
            <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" type="email" />
          </div>
          <PrimaryButton type="button" onClick={onForgot} loading={busy}>Send reset link</PrimaryButton>
          <SecondaryButton type="button" onClick={() => setUrlMode('login')} disabled={busy}>Back to login</SecondaryButton>
        </div>
      )}

      {/* RESET */}
      {mode === 'reset' && (
        <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {!token ? (
            <><InlineNotice variant="error" title="Reset link issue" description="Your link is missing a token." />
            <SecondaryButton type="button" onClick={() => setUrlMode('forgot')}>Request new link</SecondaryButton></>
          ) : (
            <>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#334155', marginBottom: '0.375rem' }}>New password</label>
                <div style={{ position: 'relative' }}>
                  <Input value={password} onChange={e => setPassword(e.target.value)} placeholder="New password" type={showPw ? 'text' : 'password'} autoComplete="new-password" style={{ paddingRight: '3rem' }} />
                  <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '0.375rem' }}>
                    {showPw ? <EyeOff style={{ width: '1rem', height: '1rem' }} /> : <Eye style={{ width: '1rem', height: '1rem' }} />}
                  </button>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#334155', marginBottom: '0.375rem' }}>Confirm password</label>
                <div style={{ position: 'relative' }}>
                  <Input value={password2} onChange={e => setPassword2(e.target.value)} placeholder="Confirm password" type={showPw2 ? 'text' : 'password'} autoComplete="new-password" style={{ paddingRight: '3rem' }} />
                  <button type="button" onClick={() => setShowPw2(v => !v)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '0.375rem' }}>
                    {showPw2 ? <EyeOff style={{ width: '1rem', height: '1rem' }} /> : <Eye style={{ width: '1rem', height: '1rem' }} />}
                  </button>
                </div>
              </div>
              <PrimaryButton type="button" onClick={onReset} loading={busy}>Reset password</PrimaryButton>
              <SecondaryButton type="button" onClick={() => setUrlMode('login')} disabled={busy}>Back to login</SecondaryButton>
            </>
          )}
        </div>
      )}
    </>
  )

  const serviceCards = [
    { href: '/search', image: '/auth-cards/auth-bid-search.jpg', alt: 'Bid search', gradient: 'linear-gradient(135deg,#10b981,#3b82f6)', icon: Search, label: 'Bid Search', sub: 'Live federal opportunities' },
    { href: '/services/sam-registration', image: '/auth-cards/auth-sam-registration.jpg', alt: 'SAM registration', gradient: 'linear-gradient(135deg,#3b82f6,#06b6d4)', icon: ShieldCheck, label: 'SAM Registration', sub: 'Expert guidance & support' },
    { href: '/services/set-aside-certifications', image: '/auth-cards/auth-certifications.jpg', alt: 'Certifications', gradient: 'linear-gradient(135deg,#a855f7,#ec4899)', icon: Award, label: 'Certifications', sub: 'Set-aside compliance' },
    { href: '/services/proposal-writing', image: '/auth-cards/auth-proposals.jpg', alt: 'Proposals', gradient: 'linear-gradient(135deg,#f97316,#ef4444)', icon: FileText, label: 'Proposals', sub: 'AI-powered assistance' },
    { href: '/services/bid-no-bid-review', image: '/auth-cards/auth-compliance.jpg', alt: 'Bid/No-Bid', gradient: 'linear-gradient(135deg,#6366f1,#3b82f6)', icon: Lock, label: 'Bid/No-Bid Analysis', sub: 'Strategic pursuit decisions' },
    { href: '/services/capability-statements', image: '/auth-cards/auth-pipeline.jpg', alt: 'Capability Statements', gradient: 'linear-gradient(135deg,#14b8a6,#22c55e)', icon: RefreshCw, label: 'Capability Statements', sub: 'Professional one-pagers' },
  ]

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: 'linear-gradient(135deg, #f8fafc 0%, #ecfdf5 50%, #f0f9ff 100%)', overflowX: 'hidden' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Desktop: two-row layout ── */
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

        /* ── Mobile: stacked layout ── */
        @media (max-width: 767px) {
          .mobile-only { display: block !important; }
          .desktop-only { display: none !important; }
          .login-page-outer { width: 100%; padding: 1rem; box-sizing: border-box; }
          .mobile-login-card {
            border-radius: 1rem; border: 1px solid rgba(226,232,240,0.8);
            background: rgba(255,255,255,0.95); backdrop-filter: blur(8px);
            box-shadow: 0 10px 30px rgba(0,0,0,0.12); padding: 1.5rem; margin-bottom: 1rem;
            max-height: 80vh;
            overflow-y: auto;
          }
          .mobile-cards-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
          .svc-card-img { height: 90px; flex: none; }
        }
      `}</style>

      <HeroBackgroundSlides />

      <div className="login-page-outer" style={{ position: 'relative', zIndex: 10 }}>

        {/* ── DESKTOP layout ── */}
        <div className="desktop-only">
          <div className="login-row1">
            {/* Hero */}
            <div className="login-hero">
              <p style={{ fontSize: 'clamp(1rem, 1.6vw, 1.8rem)', fontWeight: 800, color: '#14532d', lineHeight: 1.2, margin: 0 }}>
                Welcome to Precise GovCon.
              </p>
              <p style={{ fontSize: 'clamp(0.9rem, 1.3vw, 1.5rem)', fontWeight: 600, color: '#ea580c', margin: 0 }}>
                Your contracting and Procurement partner. We are here to ensure your success in the contracting market space.
              </p>
              <h1 style={{ fontSize: 'clamp(1.8rem, 3.2vw, 3.8rem)', fontWeight: 700, color: '#0f172a', lineHeight: 1.15, margin: 0 }}>
                Find. Qualify. Win.<br />
                <span style={{ color: '#14532d' }}>Government contracting</span> — with precision.
              </h1>
              <p style={{ fontSize: 'clamp(0.85rem, 1.15vw, 1.25rem)', color: '#334155', lineHeight: 1.6, margin: 0 }}>
                Unified opportunity search across federal, state, and local sources — plus workflows and expert support to help you compete with confidence.
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
            {serviceCards.map(c => (
              <Link key={c.href} href={c.href} target="_blank" rel="noopener noreferrer" className="svc-card">
                <div className="svc-card-img" style={{ background: c.gradient }}>
                  <Image src={c.image} alt={c.alt} fill style={{ objectFit: 'cover', transition: 'transform 0.3s' }}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '0' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }} />
                </div>
                <div className="svc-card-label">
                  <c.icon style={{ width: 'clamp(0.8rem,1vw,1.2rem)', height: 'clamp(0.8rem,1vw,1.2rem)', flexShrink: 0, color: '#059669' }} />
                  <div>
                    <p style={{ fontSize: 'clamp(0.65rem,0.85vw,1rem)', fontWeight: 600, color: '#0f172a', margin: 0, lineHeight: 1.2 }}>{c.label}</p>
                    <p style={{ fontSize: 'clamp(0.55rem,0.7vw,0.8rem)', color: '#475569', margin: 0, lineHeight: 1.3 }}>{c.sub}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── MOBILE layout ── */}
        <div className="mobile-only">
          <div className="mobile-login-card">{loginCardBody}</div>
          <div className="mobile-cards-grid">
            {serviceCards.map(c => (
              <Link key={c.href} href={c.href} target="_blank" rel="noopener noreferrer" className="svc-card">
                <div className="svc-card-img" style={{ background: c.gradient }}>
                  <Image src={c.image} alt={c.alt} fill style={{ objectFit: 'cover' }}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '0' }} />
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
    </div>
  )
}

export default function LoginPage() {
  return (
    <>
      <Suspense fallback={
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '2rem', height: '2rem', border: '2px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
      }>
        <LoginPageContent />
      </Suspense>
      <CookieConsent />
    </>
  )
}