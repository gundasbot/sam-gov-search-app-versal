'use client'

import React, { useState, useEffect, useRef } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  Eye, EyeOff, ArrowRight, ArrowLeft, Loader2, Check, AlertCircle,
  Shield, Zap, Crown, X, Mail, CheckCircle2, XCircle, ShieldCheck,
} from 'lucide-react'

// ─── Plan definitions ──────────────────────────────────────────────────────────
const HARDCODED_PLANS = [
  {
    id: 'BASIC',
    name: 'Basic',
    tagline: 'For getting started',
    bestFor: 'New contractors exploring opportunities',
    monthlyPrice: 24.99,
    annualPrice: 240,
    icon: Shield,
    accentSolid: '#3b82f6',
    savingsBadge: 'bg-blue-100 text-blue-700 border-blue-200',
    checkColor: 'text-blue-500',
    highlight: false,
    features: [
      'Search all SAM.gov opportunities',
      'Basic filters (NAICS, keywords)',
      'Save up to 10 opportunities',
      'Email support',
    ],
  },
  {
    id: 'PROFESSIONAL',
    name: 'Professional',
    tagline: 'For serious bidding teams',
    bestFor: 'Teams actively bidding every week',
    monthlyPrice: 49,
    annualPrice: 490,
    icon: Zap,
    accentSolid: 'var(--color-primary)',
    savingsBadge: 'bg-orange-100 text-orange-700 border-orange-200',
    checkColor: 'text-[var(--color-primary)]',
    highlight: true,
    badge: 'MOST POPULAR',
    features: [
      'Everything in Basic',
      'Unlimited saved opportunities',
      'Saved searches & instant alerts',
      'Export results (CSV)',
      'Priority support',
    ],
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    tagline: 'For organizations at scale',
    bestFor: 'Organizations managing multiple bids',
    monthlyPrice: 199,
    annualPrice: 1990,
    icon: Crown,
    accentSolid: '#7c3aed',
    savingsBadge: 'bg-violet-100 text-violet-700 border-violet-200',
    checkColor: 'text-violet-500',
    highlight: false,
    features: [
      'Everything in Professional',
      'Team accounts & roles',
      'Admin portal controls',
      'Advanced reporting',
      'Dedicated onboarding',
    ],
  },
]

const fmt0 = new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
const fmt2 = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: '8+ characters', pass: password.length >= 8 },
    { label: 'Uppercase', pass: /[A-Z]/.test(password) },
    { label: 'Number', pass: /[0-9]/.test(password) },
  ]
  if (!password) return null
  return (
    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
      {checks.map(c => (
        <div key={c.label} className="flex items-center gap-1">
          {c.pass ? <Check className="w-3 h-3 text-emerald-500" /> : <X className="w-3 h-3 text-red-400" />}
          <span className={`text-xs ${c.pass ? 'text-emerald-600' : 'text-gray-400'}`}>{c.label}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Input component for consistency ──────────────────────────────────────────
function Field({
  label, required, hint, children,
}: {
  label: string
  required?: boolean
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-1.5" style={{ color: '#374151' }}>
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
        {hint && <span className="ml-1.5 font-normal text-xs" style={{ color: '#9ca3af' }}>{hint}</span>}
      </label>
      {children}
    </div>
  )
}

const inputCls = 'w-full h-11 rounded-lg px-4 text-sm outline-none transition-all focus:ring-2 focus:ring-orange-200 focus:border-orange-400'
const inputStyle = { background: '#f8fafc', color: '#0f172a', border: '1.5px solid #e2e8f0' }

export default function SignUpClient() {
  const searchParams = useSearchParams()
  const emailParam = searchParams.get('email') ?? ''
  const codeParam = searchParams.get('code') ?? ''
  const planParam = searchParams.get('plan')?.toUpperCase()

  const [step, setStep] = useState<1 | 2>(1)
  const [plans, setPlans] = useState(HARDCODED_PLANS)
  const [plansLoading, setPlansLoading] = useState(true)

  const initialPlan = planParam && HARDCODED_PLANS.find(p => p.id === planParam) ? planParam : 'PROFESSIONAL'

  // Form fields
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [company, setCompany] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [email, setEmail] = useState(emailParam)
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [trialCode, setTrialCode] = useState(codeParam)
  const [codeFromEmail, setCodeFromEmail] = useState(!!codeParam)
  const [codeStatus, setCodeStatus] = useState<
    null | 'validating' | { valid: true; trialDays?: number; type: string; discount?: string | null } | { valid: false; reason: string }
  >(null)

  // Plan picker
  const [selectedPlan, setSelectedPlan] = useState(initialPlan)
  const [annual, setAnnual] = useState(false)

  // Submission
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [registered, setRegistered] = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState('')

  const errorRef = useRef<HTMLDivElement>(null)
  const codeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Pre-validate offer code from URL
  useEffect(() => {
    if (!codeParam) return
    setCodeStatus('validating')
    fetch(`/api/offer-code/validate?code=${encodeURIComponent(codeParam)}`)
      .then(r => r.json())
      .then(data => setCodeStatus(data))
      .catch(() => setCodeStatus(null))
  }, [codeParam])

  // Handle return from Stripe setup
  useEffect(() => {
    const setup = searchParams.get('setup')
    const returnedEmail = searchParams.get('email')
    if ((setup === 'done' || setup === 'skip') && returnedEmail) {
      setRegisteredEmail(returnedEmail)
      setRegistered(true)
    }
  }, [searchParams])

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [error])

  // Fetch live Stripe prices
  useEffect(() => {
    fetch('/api/stripe/prices')
      .then(res => res.json())
      .then((stripePrices) => {
        if (!Array.isArray(stripePrices) || stripePrices.length === 0) { setPlansLoading(false); return }
        const updatedPlans = HARDCODED_PLANS.map(plan => {
          const monthly = stripePrices.find((p: any) => p.tier === plan.id && p.interval === 'monthly')
          const ann = stripePrices.find((p: any) => p.tier === plan.id && p.interval === 'annual')
          return {
            ...plan,
            monthlyPrice: monthly ? monthly.unitAmount / 100 : plan.monthlyPrice,
            annualPrice: ann ? ann.unitAmount / 100 : plan.annualPrice,
          }
        })
        setPlans(updatedPlans)
        setPlansLoading(false)
      })
      .catch(() => setPlansLoading(false))
  }, [])

  async function handleOAuth(provider: 'google') {
    setLoading(true)
    await signIn(provider, { callbackUrl: '/home' })
  }

  function formatPhone(value: string): string {
    const d = value.replace(/\D/g, '').slice(0, 10)
    if (d.length === 0) return ''
    if (d.length <= 3) return `(${d}`
    if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
  }

  function isValidPhone(v: string): boolean {
    if (!v.trim()) return true
    return v.replace(/\D/g, '').length === 10
  }

  // Step 1 validation → advance to step 2
  function handleStep1(e: React.FormEvent) {
    e.preventDefault()
    if (!firstName.trim()) { setError('Please enter your first name.'); return }
    if (!lastName.trim())  { setError('Please enter your last name.'); return }
    if (!email.trim())     { setError('Please enter your email address.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return }
    if (phone && !isValidPhone(phone)) { setError('Please enter a valid 10-digit phone number.'); return }
    setError('')
    setStep(2)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit() {
    setLoading(true)
    setError('')
    try {
      const cleanPhone = phone.replace(/\D/g, '') || undefined
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          company,
          jobTitle: jobTitle.trim() || undefined,
          email,
          phone: cleanPhone,
          password,
          plan: selectedPlan,
          billing: annual ? 'annual' : 'monthly',
          trialCode: trialCode.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data?.error || data?.message || 'Registration failed.'); setLoading(false); return }
      if (data.setupUrl) { window.location.href = data.setupUrl; return }
      setRegisteredEmail(email)
      setRegistered(true)
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const activePlan = plans.find(p => p.id === selectedPlan)!
  const displayPrice = annual ? activePlan.annualPrice : activePlan.monthlyPrice
  const annualSavings = Math.round((activePlan.monthlyPrice * 12) - activePlan.annualPrice)
  const annualMonthlyEquivalent = activePlan.annualPrice / 12
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword

  // ── Success screen ─────────────────────────────────────────────────────────
  if (registered) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', padding: '40px 16px' }}>
        <div style={{ width: '100%', maxWidth: '480px' }}>
          <div style={{ borderRadius: '20px', overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.12)', border: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
            <div style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)', padding: '24px 32px' }}>
              <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)' }}>Account Created</p>
              <h1 style={{ margin: '4px 0 0', fontSize: '22px', fontWeight: 900, color: '#ffffff' }}>Welcome to Precise GovCon</h1>
            </div>
            <div style={{ padding: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, #f97316, #f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(249,115,22,0.35)' }}>
                  <CheckCircle2 style={{ width: '28px', height: '28px', color: '#ffffff' }} />
                </div>
              </div>
              <h2 style={{ margin: '0 0 6px', fontSize: '20px', fontWeight: 900, color: '#111827', textAlign: 'center' }}>
                You&apos;re almost in, {firstName}!
              </h2>
              <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#6b7280', textAlign: 'center' }}>
                Your account has been created successfully.
              </p>
              <div style={{ borderRadius: '12px', border: '1px solid #fed7aa', backgroundColor: '#fff7ed', padding: '18px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Mail style={{ width: '15px', height: '15px', color: '#ffffff' }} />
                  </div>
                  <div>
                    <p style={{ margin: '0 0 3px', fontSize: '13px', fontWeight: 700, color: '#9a3412' }}>Check your inbox</p>
                    <p style={{ margin: '0 0 3px', fontSize: '12px', color: '#c2410c' }}>We sent a verification link to <strong>{registeredEmail}</strong></p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#ea580c' }}>Click the link to activate your account and start your free trial.</p>
                  </div>
                </div>
              </div>
              <div style={{ borderRadius: '12px', border: '1px solid #e5e7eb', backgroundColor: '#f9fafb', padding: '16px', marginBottom: '20px' }}>
                <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b7280' }}>What happens next</p>
                {[
                  'Open the email from noreply@precisegovcon.com',
                  'Click "Verify My Email & Activate Trial"',
                  'Sign in and access live opportunities',
                  'Set up alerts for your NAICS codes',
                ].map((text, i) => (
                  <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: '10px', fontWeight: 900, color: '#ffffff' }}>{i + 1}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', color: '#374151' }}>{text}</p>
                  </div>
                ))}
              </div>
              <Link
                href={`/login?email=${encodeURIComponent(registeredEmail)}&registered=true`}
                style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'center', gap: '8px', borderRadius: '12px', background: '#f97316', padding: '13px 24px', fontSize: '15px', fontWeight: 700, color: '#ffffff', textDecoration: 'none', boxShadow: '0 4px 16px rgba(249,115,22,0.35)' }}
              >
                Go to Sign In <ArrowRight style={{ width: '16px', height: '16px' }} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (plansLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f1f5f9' }}>
        <Loader2 className="h-7 w-7 animate-spin" style={{ color: '#f97316' }} />
      </div>
    )
  }

  // ── STEP 1 — Account details ───────────────────────────────────────────────
  if (step === 1) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10" style={{ background: '#f1f5f9' }}>
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <Image src="/precise-govcon-logo.jpg" alt="Precise GovCon" width={52} height={52} className="rounded-xl mb-3" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.12)' }} />
          <div className="font-black text-xl" style={{ color: '#0f172a' }}>Precise GovCon</div>
          <div className="text-sm font-medium mt-0.5" style={{ color: '#64748b' }}>Government Contracting Intelligence</div>
        </div>

        {/* Card */}
        <div className="w-full max-w-lg rounded-2xl px-8 py-8" style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white" style={{ background: '#f97316' }}>1</div>
              <span className="text-sm font-bold" style={{ color: '#0f172a' }}>Your details</span>
            </div>
            <div className="flex-1 h-px mx-2" style={{ background: '#e2e8f0' }} />
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: '#f1f5f9', color: '#94a3b8', border: '1.5px solid #e2e8f0' }}>2</div>
              <span className="text-sm font-medium" style={{ color: '#94a3b8' }}>Choose plan</span>
            </div>
          </div>

          <div className="mb-6">
            <h1 className="text-2xl font-black" style={{ color: '#0f172a' }}>Create your account</h1>
            <p className="mt-1 text-sm font-medium" style={{ color: '#64748b' }}>
              Start your 7-day free trial. No credit card required to begin.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div ref={errorRef} className="mb-5 flex items-start gap-3 rounded-xl p-4" style={{ background: '#fef2f2', border: '1.5px solid #fecaca' }}>
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-red-700">{error}</p>
              </div>
              <button type="button" onClick={() => setError('')} className="flex-shrink-0">
                <X className="h-4 w-4 text-red-400 hover:text-red-600" />
              </button>
            </div>
          )}

          {/* Google */}
          <button
            type="button"
            onClick={() => handleOAuth('google')}
            disabled={loading}
            className="w-full h-11 flex items-center justify-center gap-3 rounded-lg text-sm font-semibold transition-all hover:bg-gray-50 disabled:opacity-60 mb-5"
            style={{ background: '#fff', color: '#1e293b', border: '1.5px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
          >
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="h-px flex-1" style={{ background: '#e2e8f0' }} />
            <span className="text-xs font-semibold" style={{ color: '#94a3b8' }}>or register with email</span>
            <div className="h-px flex-1" style={{ background: '#e2e8f0' }} />
          </div>

          <form onSubmit={handleStep1} className="space-y-4">
            {/* First + Last name */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="First Name" required>
                <input
                  type="text" value={firstName} onChange={e => setFirstName(e.target.value)}
                  placeholder="Jane" required className={inputCls} style={inputStyle}
                />
              </Field>
              <Field label="Last Name" required>
                <input
                  type="text" value={lastName} onChange={e => setLastName(e.target.value)}
                  placeholder="Smith" required className={inputCls} style={inputStyle}
                />
              </Field>
            </div>

            {/* Company + Job Title */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Company" hint="(optional)">
                <input
                  type="text" value={company} onChange={e => setCompany(e.target.value)}
                  placeholder="Acme Corp" className={inputCls} style={inputStyle}
                />
              </Field>
              <Field label="Job Title" hint="(optional)">
                <input
                  type="text" value={jobTitle} onChange={e => setJobTitle(e.target.value)}
                  placeholder="CEO, BD Director" className={inputCls} style={inputStyle}
                />
              </Field>
            </div>

            {/* Email */}
            <Field label="Work Email" required>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com" required className={inputCls} style={inputStyle}
              />
            </Field>

            {/* Phone */}
            <Field label="Phone" hint="(optional)">
              <input
                type="tel" value={phone} onChange={e => setPhone(formatPhone(e.target.value))}
                placeholder="(555) 123-4567"
                className={`${inputCls} ${phone && !isValidPhone(phone) ? 'border-red-400' : ''}`}
                style={inputStyle}
              />
              {phone && !isValidPhone(phone) && (
                <p className="mt-1 text-xs text-red-500">Please enter a valid 10-digit phone number</p>
              )}
              <p className="mt-1.5 text-xs leading-relaxed" style={{ color: '#9ca3af' }}>
                By providing your phone number you consent to receive SMS messages from Precise Analytics.
                Msg &amp; data rates may apply. Reply STOP to opt out.{' '}
                <Link href="/privacy" className="underline">Privacy Policy</Link> ·{' '}
                <Link href="/terms" className="underline">Terms</Link>
              </p>
            </Field>

            {/* Password */}
            <Field label="Password" required>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 8 characters" required minLength={8}
                  className={`${inputCls} pr-11`} style={inputStyle}
                />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#9ca3af' }}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <PasswordStrength password={password} />
            </Field>

            {/* Confirm Password */}
            <Field label="Confirm Password" required>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'} value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password" required
                  className={`${inputCls} pr-14 ${passwordsMismatch ? 'border-red-400' : passwordsMatch ? 'border-emerald-400' : ''}`}
                  style={inputStyle}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  {passwordsMatch && <Check className="w-4 h-4 text-emerald-500" />}
                  {passwordsMismatch && <X className="w-4 h-4 text-red-400" />}
                  <button type="button" onClick={() => setShowConfirm(v => !v)} style={{ color: '#9ca3af' }}>
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {passwordsMismatch && <p className="mt-1 text-xs text-red-500">Passwords do not match</p>}
              {passwordsMatch && <p className="mt-1 text-xs text-emerald-600">Passwords match ✓</p>}
            </Field>

            {/* Trial Code */}
            <Field label="Trial Code" hint="(optional)">
              {codeFromEmail && codeStatus && codeStatus !== 'validating' && (codeStatus as any).valid && (
                <div className="mb-2 flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d' }}>
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                  {(codeStatus as any).trialDays ? `${(codeStatus as any).trialDays}-day trial pre-applied` : 'Offer code pre-applied'}
                </div>
              )}
              <div className="relative">
                <input
                  type="text" value={trialCode}
                  onChange={e => {
                    const val = e.target.value.toUpperCase()
                    setTrialCode(val); setCodeFromEmail(false); setCodeStatus(null)
                    if (codeDebounceRef.current) clearTimeout(codeDebounceRef.current)
                    if (val.length >= 4) {
                      setCodeStatus('validating')
                      codeDebounceRef.current = setTimeout(() => {
                        fetch(`/api/offer-code/validate?code=${encodeURIComponent(val)}`)
                          .then(r => r.json()).then(d => setCodeStatus(d)).catch(() => setCodeStatus(null))
                      }, 600)
                    }
                  }}
                  placeholder="Enter code if you have one"
                  className={`${inputCls} pr-10 font-mono uppercase`} style={inputStyle}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {trialCode && codeStatus === 'validating' && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
                  {trialCode && codeStatus && codeStatus !== 'validating' && (codeStatus as any).valid && <Check className="w-4 h-4 text-emerald-500" />}
                  {trialCode && codeStatus && codeStatus !== 'validating' && !(codeStatus as any).valid && <XCircle className="w-4 h-4 text-red-400" />}
                </div>
              </div>
              {trialCode && codeStatus && codeStatus !== 'validating' && (codeStatus as any).valid && (
                <p className="mt-1 text-xs text-emerald-600">
                  {(codeStatus as any).trialDays ? `Valid — ${(codeStatus as any).trialDays}-day trial will be applied` : 'Valid code — discount will be applied'}
                </p>
              )}
              {trialCode && codeStatus && codeStatus !== 'validating' && !(codeStatus as any).valid && (
                <p className="mt-1 text-xs text-red-500">{(codeStatus as any).reason || 'Invalid code — you can still sign up without it'}</p>
              )}
            </Field>

            {/* Continue button */}
            <button
              type="submit"
              disabled={loading || passwordsMismatch}
              className="w-full h-11 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              style={{ background: '#f97316', color: '#fff', boxShadow: '0 2px 8px rgba(249,115,22,0.3)' }}
            >
              Continue to Plan Selection <ArrowRight className="h-4 w-4" />
            </button>

            <p className="text-center text-xs" style={{ color: '#9ca3af' }}>
              Already have an account?{' '}
              <Link href="/login" className="font-semibold" style={{ color: '#f97316' }}>Sign in</Link>
            </p>
          </form>
        </div>

        {/* Trust line */}
        <div className="flex items-center justify-center gap-2 mt-5">
          <ShieldCheck className="h-3.5 w-3.5" style={{ color: '#16a34a' }} />
          <span className="text-xs font-medium" style={{ color: '#94a3b8' }}>Bank-grade security · SOC 2 compliant · Encrypted end-to-end</span>
        </div>
      </div>
    )
  }

  // ── STEP 2 — Plan selection ────────────────────────────────────────────────
  return (
    <div className="min-h-screen px-4 py-10" style={{ background: '#f1f5f9' }}>
      <div className="max-w-4xl mx-auto">

        {/* Back + step indicator */}
        <div className="flex items-center gap-4 mb-8">
          <button
            type="button"
            onClick={() => { setStep(1); setError('') }}
            className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors hover:text-gray-900"
            style={{ color: '#64748b' }}
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: '#16a34a' }}>
                <Check className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-sm font-medium" style={{ color: '#16a34a' }}>Your details</span>
            </div>
            <div className="w-8 h-px" style={{ background: '#e2e8f0' }} />
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white" style={{ background: '#f97316' }}>2</div>
              <span className="text-sm font-bold" style={{ color: '#0f172a' }}>Choose plan</span>
            </div>
          </div>
        </div>

        <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-black" style={{ color: '#0f172a' }}>Choose your plan</h1>
            <p className="mt-1 text-sm font-medium" style={{ color: '#64748b' }}>All plans start with a 7-day free trial. Cancel anytime.</p>
          </div>
          {/* Monthly / Annual toggle */}
          <div className="inline-flex items-center rounded-xl p-1" style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)' }}>
            <button type="button" onClick={() => setAnnual(false)}
              className="rounded-lg px-4 py-1.5 text-xs font-bold transition-all"
              style={{ background: !annual ? '#ffffff' : 'transparent', color: !annual ? '#0f172a' : 'rgba(255,255,255,0.55)', boxShadow: !annual ? '0 1px 4px rgba(0,0,0,0.2)' : 'none' }}>
              Monthly
            </button>
            <button type="button" onClick={() => setAnnual(true)}
              className="flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-bold transition-all"
              style={{ background: annual ? '#f97316' : 'transparent', color: annual ? '#ffffff' : 'rgba(255,255,255,0.55)' }}>
              Annual
              <span className="rounded px-1.5 py-0.5 text-[9px] font-black" style={{ background: annual ? 'rgba(255,255,255,0.25)' : 'rgba(249,115,22,0.35)', color: annual ? '#fff' : '#fb923c' }}>SAVE 20%</span>
            </button>
          </div>
        </div>

        {/* Error on step 2 */}
        {error && (
          <div ref={errorRef} className="mb-5 flex items-start gap-3 rounded-xl p-4" style={{ background: '#fef2f2', border: '1.5px solid #fecaca' }}>
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-semibold text-red-700 flex-1">{error}</p>
            <button type="button" onClick={() => setError('')}><X className="h-4 w-4 text-red-400" /></button>
          </div>
        )}

        {/* What's included banner */}
        <div className="rounded-xl mb-6 overflow-hidden" style={{ border: '1px solid #e2e8f0', background: '#ffffff' }}>
          <div className="px-5 py-3 border-b" style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}>
            <p className="text-sm font-bold" style={{ color: '#0f172a' }}>✨ What&apos;s Included in Your 7-Day Trial</p>
          </div>
          <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {[
              '🔍 Unlimited federal opportunity searches',
              '📧 Email alerts for matching opportunities',
              '📊 Advanced NAICS & set-aside filters',
              '💾 Save unlimited opportunities',
              '📥 Export search results to CSV',
              '⏱️ Auto-saved search preferences',
            ].map(f => (
              <div key={f} className="flex items-center gap-2.5">
                <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(249,115,22,0.12)' }}>
                  <Check className="w-2.5 h-2.5" style={{ color: '#f97316' }} />
                </div>
                <span className="text-sm" style={{ color: '#475569' }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {plans.map(plan => {
            const Icon = plan.icon
            const active = selectedPlan === plan.id
            const price = annual ? plan.annualPrice : plan.monthlyPrice
            const savings = Math.round((plan.monthlyPrice * 12) - plan.annualPrice)
            const moEquiv = plan.annualPrice / 12
            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => setSelectedPlan(plan.id)}
                className="relative w-full text-left rounded-2xl overflow-hidden flex flex-col transition-all duration-200"
                style={{
                  border: active ? `2px solid var(--color-primary)` : '2px solid #e2e8f0',
                  boxShadow: active ? '0 4px 20px rgba(22,163,74,0.15)' : '0 1px 3px rgba(0,0,0,0.05)',
                  background: '#ffffff',
                }}
              >
                {'badge' in plan && (plan as any).badge && (
                  <div className="text-white text-xs font-black tracking-widest uppercase text-center py-2 flex-shrink-0"
                    style={{ background: plan.accentSolid }}>
                    {(plan as any).badge}
                  </div>
                )}
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: plan.accentSolid }}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-black text-base" style={{ color: '#0f172a' }}>{plan.name}</p>
                      <p className="text-xs font-medium" style={{ color: '#64748b' }}>{plan.tagline}</p>
                    </div>
                  </div>

                  <div className="mb-4 pb-4" style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black" style={{ color: '#0f172a' }}>
                        ${annual ? fmt0.format(price) : fmt2.format(price)}
                      </span>
                      <span className="text-sm font-medium" style={{ color: '#64748b' }}>{annual ? '/yr' : '/mo'}</span>
                    </div>
                    {annual && savings > 0 ? (
                      <p className="text-xs font-semibold mt-1" style={{ color: '#16a34a' }}>Save ${savings}/yr · ${fmt2.format(moEquiv)}/mo</p>
                    ) : (
                      <p className="text-xs font-semibold mt-1" style={{ color: '#f97316' }}>7-Day Free Trial</p>
                    )}
                    <p className="text-xs mt-1" style={{ color: '#94a3b8' }}><span style={{ color: '#374151', fontWeight: 600 }}>Best for:</span> {plan.bestFor}</p>
                  </div>

                  <ul className="space-y-2 flex-1">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: active ? '#16a34a' : '#94a3b8' }} />
                        <span className="text-xs" style={{ color: active ? '#374151' : '#64748b' }}>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4 rounded-lg py-2.5 text-xs font-bold text-center flex-shrink-0"
                    style={{ background: active ? plan.accentSolid : '#f1f5f9', color: active ? '#ffffff' : '#64748b' }}>
                    {active ? '✓ Selected' : 'Select →'}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* All plans include */}
        <div className="rounded-xl mb-6 overflow-hidden" style={{ border: '1px solid #e2e8f0', background: '#ffffff' }}>
          <div className="px-5 py-3 border-b flex items-center justify-between" style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}>
            <p className="text-sm font-bold" style={{ color: '#0f172a' }}>All plans include</p>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full" style={{ background: 'rgba(249,115,22,0.1)', color: '#f97316', border: '1px solid rgba(249,115,22,0.25)' }}>7-DAY FREE</span>
          </div>
          <div className="px-5 py-4 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
            {['Real-time SAM.gov data', 'NAICS matching', 'Email & portal alerts', 'Cancel anytime', 'No lock-in', 'Onboarding support'].map(f => (
              <div key={f} className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#16a34a' }} />
                <span className="text-sm" style={{ color: '#475569' }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Summary + CTA */}
        <div className="rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5" style={{ background: '#ffffff', border: '2px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: activePlan.accentSolid }}>
              {(() => { const Icon = activePlan.icon; return <Icon className="w-6 h-6 text-white" /> })()}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#64748b' }}>Selected plan</p>
              <p className="font-black text-xl" style={{ color: '#0f172a' }}>{activePlan.name}</p>
              <p className="text-sm font-medium" style={{ color: '#64748b' }}>
                ${annual ? fmt0.format(displayPrice) : fmt2.format(displayPrice)}{annual ? '/yr' : '/mo'} · 7-day free trial
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: '#f97316', color: '#fff', boxShadow: '0 4px 14px rgba(249,115,22,0.35)', minWidth: '220px' }}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><span>Start My Free Trial</span><ArrowRight className="h-4 w-4" /></>}
          </button>
        </div>

        <p className="text-center text-xs mt-4" style={{ color: '#94a3b8' }}>
          By signing up you agree to our{' '}
          <Link href="/terms" className="underline">Terms</Link> and{' '}
          <Link href="/privacy" className="underline">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  )
}
