'use client'

import React, { useState, useEffect, useRef } from 'react'
import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  Eye, EyeOff, ArrowRight, ArrowLeft, Loader2, Check, AlertCircle,
  Shield, Zap, Crown, X, Mail, CheckCircle2, XCircle, ShieldCheck,
  Search, Bell, BarChart3, FileDown, Users, Lock, LogIn,
} from 'lucide-react'

// ─── Plan definitions ──────────────────────────────────────────────────────────
const HARDCODED_PLANS = [
  {
    id: 'BASIC',
    name: 'Basic',
    tagline: 'Get started with federal contracting',
    monthlyPrice: 24.99,
    annualPrice: 240,
    icon: Shield,
    accent: '#3b82f6',
    features: [
      'Search all SAM.gov opportunities',
      'Basic NAICS & keyword filters',
      'Save up to 10 opportunities',
      'Email support',
    ],
  },
  {
    id: 'PROFESSIONAL',
    name: 'Professional',
    tagline: 'For teams actively bidding every week',
    monthlyPrice: 49,
    annualPrice: 490,
    icon: Zap,
    accent: '#f97316',
    badge: 'MOST POPULAR',
    features: [
      'Everything in Basic',
      'Unlimited saved opportunities',
      'Saved searches & instant alerts',
      'Export results to CSV',
      'Priority support',
    ],
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    tagline: 'For organizations managing multiple bids',
    monthlyPrice: 199,
    annualPrice: 1990,
    icon: Crown,
    accent: '#7c3aed',
    features: [
      'Everything in Professional',
      'Team accounts & roles',
      'Admin portal controls',
      'Advanced reporting',
      'Dedicated onboarding',
    ],
  },
]

const BRAND_FEATURES = [
  { icon: Search,   label: 'Live SAM.gov opportunity search across all agencies' },
  { icon: Bell,     label: 'Automated alerts for matching opportunities' },
  { icon: BarChart3,label: 'Insights, analytics & performance tracking' },
  { icon: FileDown, label: 'Export results, save searches, and track deadlines' },
  { icon: Users,    label: 'Set-aside filtering: 8(a), HUBZone, WOSB, SDVOSB' },
  { icon: Lock,     label: 'Bank-grade security, encrypted end-to-end' },
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
    <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
      {checks.map(c => (
        <div key={c.label} className="flex items-center gap-1">
          {c.pass ? <Check className="w-3 h-3 text-emerald-500" /> : <X className="w-3 h-3 text-slate-300" />}
          <span className={`text-[11px] ${c.pass ? 'text-emerald-600' : 'text-slate-400'}`}>{c.label}</span>
        </div>
      ))}
    </div>
  )
}

function Field({ label, required, hint, error, children }: {
  label: string; required?: boolean; hint?: string; error?: string; children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-base font-bold mb-1.5" style={{ color: '#1e293b' }}>
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
        {hint && <span className="ml-1.5 font-normal text-sm" style={{ color: '#64748b' }}>{hint}</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

const inp = 'w-full h-12 rounded-xl px-3.5 text-base font-medium outline-none transition-all focus:ring-2 focus:ring-orange-300 focus:border-orange-500'
const inpStyle = { background: '#ffffff', color: '#0f172a', border: '2px solid #cbd5e1', fontFamily: '"Aptos", "Segoe UI", Inter, system-ui, -apple-system, sans-serif' }

// ─── Left brand panel ──────────────────────────────────────────────────────────
function BrandPanel() {
  return (
    <div
      className="hidden lg:flex flex-col justify-between px-10 xl:px-12 py-8 relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #0f1f3d 0%, #162952 60%, #1e3a6e 100%)', width: '44%', minWidth: 420, maxWidth: 580, flexShrink: 0 }}
    >
      {/* Logo */}
      <div>
        <div className="flex items-center gap-3 mb-10">
          <Image src="/precise-govcon-logo.jpg" alt="Precise GovCon" width={44} height={44} className="rounded-xl" style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }} />
          <div>
            <div className="font-black text-lg leading-tight text-white">Precise GovCon</div>
            <div className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>Government Contracting Intelligence</div>
          </div>
        </div>

          <div className="mb-6">
          <div className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: '#f97316' }}>Why contractors choose us</div>
          <h2 className="text-2xl font-black leading-tight text-white mb-2">
            Find and win more<br />federal contracts.
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
            The all-in-one platform for searching SAM.gov opportunities, tracking deadlines, and building a winning pipeline.
          </p>
        </div>

        <div className="space-y-3 mb-7">
          {BRAND_FEATURES.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.25)' }}>
                <Icon className="w-3.5 h-3.5" style={{ color: '#fb923c' }} />
              </div>
              <p className="text-sm leading-snug pt-0.5" style={{ color: 'rgba(255,255,255,0.75)' }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: '900+', label: 'Live daily opps' },
            { value: '7-day', label: 'Free trial' },
            { value: '100%', label: 'SAM.gov data' },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="font-black text-lg text-white">{s.value}</div>
              <div className="text-[10px] font-semibold mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom trust */}
      <div className="flex items-center gap-2 pt-6">
        <ShieldCheck className="w-4 h-4 shrink-0" style={{ color: 'rgba(255,255,255,0.35)' }} />
        <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>Bank-grade security · SOC 2 compliant · Encrypted end-to-end</span>
      </div>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function SignUpClient() {
  const searchParams = useSearchParams()
  const emailParam  = searchParams.get('email') ?? ''
  const codeParam   = searchParams.get('code') ?? ''
  const planParam   = searchParams.get('plan')?.toUpperCase()

  const [step, setStep] = useState<1 | 2>(1)
  const [plans, setPlans] = useState(HARDCODED_PLANS)
  const [plansLoading, setPlansLoading] = useState(true)

  const initialPlan = planParam && HARDCODED_PLANS.find(p => p.id === planParam) ? planParam : 'PROFESSIONAL'

  // Form state
  const [firstName,       setFirstName]       = useState('')
  const [lastName,        setLastName]         = useState('')
  const [company,         setCompany]          = useState('')
  const [jobTitle,        setJobTitle]         = useState('')
  const [email,           setEmail]            = useState(emailParam)
  const [phone,           setPhone]            = useState('')
  const [password,        setPassword]         = useState('')
  const [confirmPassword, setConfirmPassword]  = useState('')
  const [showPassword,    setShowPassword]     = useState(false)
  const [showConfirm,     setShowConfirm]      = useState(false)
  const [trialCode,       setTrialCode]        = useState(codeParam)
  const [codeFromEmail,   setCodeFromEmail]    = useState(!!codeParam)
  const [codeStatus, setCodeStatus] = useState<
    null | 'validating' | { valid: true; trialDays?: number; type: string; discount?: string | null } | { valid: false; reason: string }
  >(null)

  // Plan picker
  const [selectedPlan, setSelectedPlan] = useState(initialPlan)
  const [annual,       setAnnual]       = useState(false)

  // Submission
  const [loading,         setLoading]         = useState(false)
  const [error,           setError]           = useState('')
  const [registered,      setRegistered]      = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState('')

  const errorRef      = useRef<HTMLDivElement>(null)
  const codeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!codeParam) return
    setCodeStatus('validating')
    fetch(`/api/offer-code/validate?code=${encodeURIComponent(codeParam)}`)
      .then(r => r.json()).then(d => setCodeStatus(d)).catch(() => setCodeStatus(null))
  }, [codeParam])

  useEffect(() => {
    const setup = searchParams.get('setup')
    const returnedEmail = searchParams.get('email')
    if ((setup === 'done' || setup === 'skip') && returnedEmail) {
      setRegisteredEmail(returnedEmail); setRegistered(true)
    }
  }, [searchParams])

  useEffect(() => {
    if (error && errorRef.current) errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [error])

  useEffect(() => {
    fetch('/api/stripe/prices')
      .then(r => r.json())
      .then((stripePrices) => {
        if (!Array.isArray(stripePrices) || stripePrices.length === 0) { setPlansLoading(false); return }
        setPlans(HARDCODED_PLANS.map(plan => {
          const monthly = stripePrices.find((p: any) => p.tier === plan.id && p.interval === 'monthly')
          const ann     = stripePrices.find((p: any) => p.tier === plan.id && p.interval === 'annual')
          return {
            ...plan,
            monthlyPrice: monthly ? monthly.unitAmount / 100 : plan.monthlyPrice,
            annualPrice:  ann     ? ann.unitAmount  / 100 : plan.annualPrice,
          }
        }))
        setPlansLoading(false)
      })
      .catch(() => setPlansLoading(false))
  }, [])

  async function handleOAuth(provider: 'google') {
    setLoading(true)
    await signIn(provider, { callbackUrl: '/home' })
  }

  function formatPhone(v: string) {
    const d = v.replace(/\D/g, '').slice(0, 10)
    if (!d.length) return ''
    if (d.length <= 3) return `(${d}`
    if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
  }
  const validPhone = (v: string) => !v.trim() || v.replace(/\D/g, '').length === 10

  function handleStep1(e: React.FormEvent) {
    e.preventDefault()
    if (!firstName.trim())  { setError('First name is required.'); return }
    if (!lastName.trim())   { setError('Last name is required.'); return }
    if (!email.trim())      { setError('Work email is required.'); return }
    if (password.length < 8){ setError('Password must be at least 8 characters.'); return }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return }
    if (phone && !validPhone(phone))  { setError('Enter a valid 10-digit phone number.'); return }
    setError('')
    setStep(2)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit() {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName:  lastName.trim(),
          company,
          jobTitle:  jobTitle.trim() || undefined,
          email,
          phone:     phone.replace(/\D/g, '') || undefined,
          password,
          plan:      selectedPlan,
          billing:   annual ? 'annual' : 'monthly',
          trialCode: trialCode.trim() || undefined,
        }),
      })
      const raw = await res.text()
      let data: any = {}
      try {
        data = raw ? JSON.parse(raw) : {}
      } catch {
        data = { error: raw }
      }
      if (!res.ok) {
        setError(data?.error || data?.message || 'Registration failed. Please try again.')
        setLoading(false)
        return
      }
      if (data.setupUrl) { window.location.href = data.setupUrl; return }
      setRegisteredEmail(email); setRegistered(true)
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const passwordsMatch    = confirmPassword.length > 0 && password === confirmPassword
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword
  const activePlan        = plans.find(p => p.id === selectedPlan)!
  const displayPrice      = annual ? activePlan.annualPrice : activePlan.monthlyPrice
  const annualSavings     = Math.round((activePlan.monthlyPrice * 12) - activePlan.annualPrice)

  // ── Success ─────────────────────────────────────────────────────────────────
  if (registered) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: '#f1f5f9' }}>
        <div className="w-full max-w-lg rounded-2xl overflow-hidden" style={{ boxShadow: '0 12px 48px rgba(0,0,0,0.12)', border: '1px solid #e2e8f0', background: '#fff' }}>
          <div className="px-8 py-6" style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)' }}>
            <p className="text-[11px] font-black uppercase tracking-widest text-white/70 mb-1">Account Created</p>
            <h1 className="text-2xl font-black text-white">Welcome to Precise GovCon</h1>
          </div>
          <div className="px-8 py-8">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)', boxShadow: '0 6px 24px rgba(249,115,22,0.35)' }}>
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
            </div>
            <h2 className="text-xl font-black text-center mb-1" style={{ color: '#0f172a' }}>You&apos;re almost in, {firstName}!</h2>
            <p className="text-sm text-center mb-6" style={{ color: '#64748b' }}>Your account has been created successfully.</p>

            <div className="rounded-xl p-4 mb-4" style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: '#f97316' }}>
                  <Mail className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold mb-0.5" style={{ color: '#9a3412' }}>Check your inbox</p>
                  <p className="text-xs" style={{ color: '#c2410c' }}>We sent a verification link to <strong>{registeredEmail}</strong>. Click it to activate your account and start your free trial.</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl p-4 mb-6" style={{ background: '#f9fafb', border: '1px solid #e5e7eb' }}>
              <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: '#9ca3af' }}>What happens next</p>
              {['Open the email from noreply@precisegovcon.com', 'Click "Verify My Email & Activate Trial"', 'Sign in and access live opportunities', 'Set up alerts for your NAICS codes'].map((t, i) => (
                <div key={t} className="flex items-center gap-3 mb-2 last:mb-0">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: '#f97316' }}>
                    <span className="text-[10px] font-black text-white">{i + 1}</span>
                  </div>
                  <p className="text-sm" style={{ color: '#374151' }}>{t}</p>
                </div>
              ))}
            </div>

            <Link
              href={`/login?email=${encodeURIComponent(registeredEmail)}&registered=true`}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-black text-white"
              style={{ background: '#f97316', boxShadow: '0 4px 16px rgba(249,115,22,0.35)' }}
            >
              Go to Sign In <ArrowRight className="w-4 h-4" />
            </Link>
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

  // ══════════════════════════════════════════════════════════════════════════════
  // STEP 1 — Account details  (split: brand left | form right)
  // ══════════════════════════════════════════════════════════════════════════════
  if (step === 1) {
    return (
      <div style={{ background: '#eef2f7' }}>
        <div className="mx-auto w-full max-w-480 px-3 py-4 sm:px-5 lg:px-6">
        <div className="w-full flex flex-col lg:flex-row border-x border-slate-200 overflow-hidden rounded-xl bg-white shadow-lg">
        <BrandPanel />

        {/* Right — form panel */}
        <div className="flex-1 overflow-y-auto" style={{ background: '#ffffff', fontFamily: '"Aptos", "Segoe UI", Inter, system-ui, -apple-system, sans-serif' }}>
          <div className="max-w-2xl mx-auto w-full px-6 sm:px-10 py-8">

            {/* Mobile logo (shown only when BrandPanel is hidden) */}
            <div className="flex items-center gap-3 mb-8 lg:hidden">
              <Image src="/precise-govcon-logo.jpg" alt="Precise GovCon" width={40} height={40} className="rounded-xl" />
              <span className="font-black text-lg" style={{ color: '#0f172a' }}>Precise GovCon</span>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-8">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white" style={{ background: '#f97316' }}>1</div>
                <span className="text-sm font-black" style={{ color: '#0f172a' }}>Your Details</span>
              </div>
              <div className="flex-1 h-px mx-3" style={{ background: '#e2e8f0' }} />
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: '#f1f5f9', color: '#94a3b8', border: '1.5px solid #e2e8f0' }}>2</div>
                <span className="text-sm font-medium" style={{ color: '#94a3b8' }}>Choose Plan</span>
              </div>
            </div>

            <div className="mb-7">
              <h1 className="text-3xl font-black" style={{ color: '#0f172a' }}>Create your account</h1>
              <p className="mt-1.5 text-sm" style={{ color: '#64748b' }}>
                Start your 7-day free trial.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div ref={errorRef} className="mb-5 flex items-start gap-3 rounded-xl p-4" style={{ background: '#fef2f2', border: '1.5px solid #fecaca' }}>
                <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm font-semibold text-red-700 flex-1">{error}</p>
                <button type="button" onClick={() => setError('')}><X className="h-4 w-4 text-red-400" /></button>
              </div>
            )}

            {/* Google */}
            <button
              type="button"
              onClick={() => handleOAuth('google')}
              disabled={loading}
              className="w-full h-12 flex items-center justify-center gap-3 rounded-xl text-base font-semibold transition-all hover:shadow-md disabled:opacity-60 mb-5"
              style={{ background: '#fff', color: '#1e293b', border: '1.5px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="h-px flex-1" style={{ background: '#e2e8f0' }} />
              <span className="text-xs font-semibold" style={{ color: '#94a3b8' }}>or register with email</span>
              <div className="h-px flex-1" style={{ background: '#e2e8f0' }} />
            </div>

            <form onSubmit={handleStep1} className="space-y-4">
              {/* Name row */}
              <div className="grid grid-cols-2 gap-4">
                <Field label="First Name" required>
                  <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)}
                    placeholder="Jane" required className={inp} style={inpStyle} />
                </Field>
                <Field label="Last Name" required>
                  <input type="text" value={lastName} onChange={e => setLastName(e.target.value)}
                    placeholder="Smith" required className={inp} style={inpStyle} />
                </Field>
              </div>

              {/* Company + Title */}
              <div className="grid grid-cols-2 gap-4">
                <Field label="Company" hint="(optional)">
                  <input type="text" value={company} onChange={e => setCompany(e.target.value)}
                    placeholder="Acme Federal LLC" className={inp} style={inpStyle} />
                </Field>
                <Field label="Job Title" hint="(optional)">
                  <input type="text" value={jobTitle} onChange={e => setJobTitle(e.target.value)}
                    placeholder="BD Director" className={inp} style={inpStyle} />
                </Field>
              </div>

              {/* Email */}
              <Field label="Work Email" required>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@company.com" required className={inp} style={inpStyle} />
              </Field>

              {/* Phone */}
              <Field label="Phone" hint="(optional)">
                <input type="tel" value={phone} onChange={e => setPhone(formatPhone(e.target.value))}
                  placeholder="(555) 123-4567"
                  className={`${inp} ${phone && !validPhone(phone) ? 'border-red-400' : ''}`}
                  style={inpStyle} />
                {phone && !validPhone(phone) && <p className="mt-1 text-[11px] text-red-500">Enter a valid 10-digit number</p>}
                <p className="mt-1.5 text-[11px] leading-relaxed" style={{ color: '#9ca3af' }}>
                  By providing your number you consent to SMS from Precise Analytics. Msg &amp; data rates may apply.{' '}
                  <Link href="/privacy" className="underline">Privacy</Link> · <Link href="/terms" className="underline">Terms</Link>
                </p>
              </Field>

              {/* Password row */}
              <div className="grid grid-cols-2 gap-4">
                <Field label="Password" required>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Min. 8 characters" required minLength={8}
                      className={`${inp} pr-10`} style={inpStyle} />
                    <button type="button" onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#9ca3af' }}>
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <PasswordStrength password={password} />
                </Field>
                <Field label="Confirm Password" required>
                  <div className="relative">
                    <input type={showConfirm ? 'text' : 'password'} value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password" required
                      className={`${inp} pr-14 ${passwordsMismatch ? 'border-red-400' : passwordsMatch ? 'border-emerald-400' : ''}`}
                      style={inpStyle} />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                      {passwordsMatch   && <Check    className="w-3.5 h-3.5 text-emerald-500" />}
                      {passwordsMismatch && <X       className="w-3.5 h-3.5 text-red-400" />}
                      <button type="button" onClick={() => setShowConfirm(v => !v)} style={{ color: '#9ca3af' }}>
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  {passwordsMismatch && <p className="mt-1 text-[11px] text-red-500">Passwords do not match</p>}
                  {passwordsMatch    && <p className="mt-1 text-[11px] text-emerald-600">Passwords match ✓</p>}
                </Field>
              </div>

              {/* Trial Code */}
              <Field label="Trial / Offer Code" hint="(optional)">
                {codeFromEmail && codeStatus && codeStatus !== 'validating' && (codeStatus as any).valid && (
                  <div className="mb-2 flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d' }}>
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    {(codeStatus as any).trialDays ? `${(codeStatus as any).trialDays}-day trial pre-applied` : 'Offer code pre-applied'}
                  </div>
                )}
                <div className="relative">
                  <input type="text" value={trialCode}
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
                    className={`${inp} pr-10 font-mono uppercase`} style={inpStyle}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {trialCode && codeStatus === 'validating' && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
                    {trialCode && codeStatus && codeStatus !== 'validating' && (codeStatus as any).valid  && <Check   className="w-4 h-4 text-emerald-500" />}
                    {trialCode && codeStatus && codeStatus !== 'validating' && !(codeStatus as any).valid && <XCircle className="w-4 h-4 text-red-400" />}
                  </div>
                </div>
                {trialCode && codeStatus && codeStatus !== 'validating' && (codeStatus as any).valid  && <p className="mt-1 text-[11px] text-emerald-600">{(codeStatus as any).trialDays ? `Valid — ${(codeStatus as any).trialDays}-day trial will be applied` : 'Valid — discount will be applied'}</p>}
                {trialCode && codeStatus && codeStatus !== 'validating' && !(codeStatus as any).valid && <p className="mt-1 text-[11px] text-red-500">{(codeStatus as any).reason || 'Invalid code — you can still sign up without it'}</p>}
              </Field>

              <div className="pt-2 space-y-3">
                <button
                  type="submit"
                  disabled={loading || passwordsMismatch}
                  className="w-full rounded-xl text-base font-black flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: '#f97316', color: '#fff', boxShadow: '0 4px 16px rgba(249,115,22,0.35)', height: '52px' }}
                >
                  Continue to Plan Selection <ArrowRight className="h-5 w-5" />
                </button>

                <Link
                  href="/login"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl text-base font-bold transition-all hover:opacity-90 active:scale-98"
                  style={{ background: '#f8fafc', color: '#1e293b', border: '2px solid #cbd5e1', height: '48px' }}
                >
                  <LogIn className="h-4 w-4" /> Already have an account? Sign in
                </Link>
              </div>
            </form>
          </div>
        </div>
        </div>
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // STEP 2 — Plan selection  (full-width, dark header, plan cards)
  // ══════════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen" style={{ background: '#f1f5f9' }}>

      {/* Page header bar */}
      <div className="sticky top-0 z-20 px-6 py-4 flex items-center justify-between" style={{ background: '#0f1f3d', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => { setStep(1); setError('') }}
            className="flex items-center gap-1.5 text-sm font-semibold transition-colors hover:text-white"
            style={{ color: 'rgba(255,255,255,0.6)' }}
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="h-5 w-px" style={{ background: 'rgba(255,255,255,0.15)' }} />
          <div className="flex items-center gap-3">
            <Image src="/precise-govcon-logo.jpg" alt="Precise GovCon" width={30} height={30} className="rounded-lg" />
            <span className="font-black text-sm text-white hidden sm:block">Precise GovCon</span>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: '#16a34a' }}>
              <Check className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-xs font-semibold hidden sm:block" style={{ color: 'rgba(255,255,255,0.6)' }}>Your Details</span>
          </div>
          <div className="w-8 h-px" style={{ background: 'rgba(255,255,255,0.2)' }} />
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white" style={{ background: '#f97316' }}>2</div>
            <span className="text-xs font-black text-white hidden sm:block">Choose Plan</span>
          </div>
        </div>

        {/* Billing toggle */}
        <div className="flex items-center rounded-xl p-1 gap-0.5" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
          <button type="button" onClick={() => setAnnual(false)}
            className="rounded-lg px-3 py-1.5 text-xs font-bold transition-all"
            style={{ background: !annual ? '#ffffff' : 'transparent', color: !annual ? '#0f172a' : 'rgba(255,255,255,0.5)' }}>
            Monthly
          </button>
          <button type="button" onClick={() => setAnnual(true)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all"
            style={{ background: annual ? '#f97316' : 'transparent', color: annual ? '#ffffff' : 'rgba(255,255,255,0.5)' }}>
            Annual
            <span className="rounded px-1.5 py-0.5 text-[9px] font-black"
              style={{ background: annual ? 'rgba(255,255,255,0.2)' : 'rgba(249,115,22,0.3)', color: annual ? '#fff' : '#fb923c' }}>
              −20%
            </span>
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

        <div className="text-center mb-10">
          <div className="text-xs font-black uppercase tracking-widest mb-2" style={{ color: '#f97316' }}>Step 2 of 2</div>
          <h1 className="text-3xl font-black" style={{ color: '#0f172a' }}>Choose your plan</h1>
          <p className="mt-2 text-base" style={{ color: '#64748b' }}>
            All plans start with a <strong>7-day free trial</strong>. Cancel anytime, no questions asked.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div ref={errorRef} className="mb-6 flex items-start gap-3 rounded-xl p-4 max-w-2xl mx-auto" style={{ background: '#fef2f2', border: '1.5px solid #fecaca' }}>
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm font-semibold text-red-700 flex-1">{error}</p>
            <button type="button" onClick={() => setError('')}><X className="h-4 w-4 text-red-400" /></button>
          </div>
        )}

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          {plans.map(plan => {
            const Icon    = plan.icon
            const active  = selectedPlan === plan.id
            const price   = annual ? plan.annualPrice : plan.monthlyPrice
            const savings = Math.round((plan.monthlyPrice * 12) - plan.annualPrice)
            const moEquiv = plan.annualPrice / 12
            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => setSelectedPlan(plan.id)}
                className="relative text-left rounded-2xl flex flex-col overflow-hidden transition-all duration-200 w-full"
                style={{
                  border:     active ? `2.5px solid ${plan.accent}` : '2px solid #e2e8f0',
                  boxShadow:  active ? `0 8px 32px ${plan.accent}28` : '0 2px 8px rgba(0,0,0,0.05)',
                  background: '#ffffff',
                  transform:  active ? 'translateY(-2px)' : 'none',
                }}
              >
                {/* Badge */}
                {'badge' in plan && plan.badge && (
                  <div className="text-white text-[10px] font-black tracking-widest uppercase text-center py-2 shrink-0"
                    style={{ background: plan.accent }}>
                    {plan.badge}
                  </div>
                )}

                <div className="p-6 flex flex-col flex-1">
                  {/* Icon + name */}
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: plan.accent }}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-black text-lg leading-tight" style={{ color: '#0f172a' }}>{plan.name}</p>
                      <p className="text-xs" style={{ color: '#64748b' }}>{plan.tagline}</p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-5 pb-5" style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="text-4xl font-black" style={{ color: '#0f172a' }}>
                        ${annual ? fmt0.format(price) : fmt2.format(price)}
                      </span>
                      <span className="text-sm font-medium" style={{ color: '#64748b' }}>{annual ? '/yr' : '/mo'}</span>
                    </div>
                    {annual && savings > 0
                      ? <p className="text-xs font-semibold" style={{ color: '#16a34a' }}>Save ${savings}/yr · equiv. ${fmt2.format(moEquiv)}/mo</p>
                      : <p className="text-xs font-semibold" style={{ color: '#f97316' }}>7-Day Free Trial Included</p>}
                  </div>

                  {/* Features */}
                  <ul className="space-y-2.5 flex-1 mb-5">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2.5">
                        <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: active ? `${plan.accent}18` : '#f1f5f9' }}>
                          <Check className="w-2.5 h-2.5" style={{ color: active ? plan.accent : '#94a3b8' }} />
                        </div>
                        <span className="text-sm" style={{ color: active ? '#374151' : '#64748b' }}>{f}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Select button */}
                  <div className="rounded-xl py-3 text-sm font-black text-center shrink-0 transition-all"
                    style={{ background: active ? plan.accent : '#f8fafc', color: active ? '#ffffff' : '#64748b', border: active ? 'none' : '1.5px solid #e2e8f0' }}>
                    {active ? '✓ Selected' : 'Select this plan'}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* What's included banner */}
        <div className="rounded-2xl mb-6 overflow-hidden" style={{ border: '1px solid #e2e8f0', background: '#ffffff' }}>
          <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #f1f5f9' }}>
            <p className="font-black text-sm" style={{ color: '#0f172a' }}>All plans include during your 7-day trial</p>
            <span className="text-xs font-black px-3 py-1 rounded-full" style={{ background: 'rgba(249,115,22,0.1)', color: '#f97316', border: '1px solid rgba(249,115,22,0.2)' }}>FREE TRIAL</span>
          </div>
          <div className="px-6 py-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {['Real-time SAM.gov data', 'NAICS code matching', 'Email & portal alerts', 'CSV export', 'Cancel anytime', 'Onboarding support'].map(f => (
              <div key={f} className="flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" style={{ color: '#16a34a' }} />
                <span className="text-sm" style={{ color: '#475569' }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Summary + CTA */}
        <div className="rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5"
          style={{ background: '#0f1f3d', border: '2px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: activePlan.accent }}>
              {(() => { const Icon = activePlan.icon; return <Icon className="w-6 h-6 text-white" /> })()}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest mb-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>Selected plan</p>
              <p className="font-black text-xl text-white">{activePlan.name}</p>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
                ${annual ? fmt0.format(displayPrice) : fmt2.format(displayPrice)}{annual ? '/yr' : '/mo'} · 7-day free trial
                {annual && annualSavings > 0 && <span className="ml-1.5 text-emerald-400 font-semibold">· Save ${annualSavings}/yr</span>}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full sm:w-auto px-10 py-4 rounded-xl text-base font-black flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            style={{ background: '#f97316', color: '#fff', boxShadow: '0 4px 20px rgba(249,115,22,0.4)', minWidth: '240px' }}
          >
            {loading
              ? <Loader2 className="h-5 w-5 animate-spin" />
              : <><span>Start My Free Trial</span><ArrowRight className="h-5 w-5" /></>}
          </button>
        </div>

        <p className="text-center text-xs mt-5" style={{ color: '#94a3b8' }}>
          By signing up you agree to our{' '}
          <Link href="/terms" className="underline font-medium">Terms of Service</Link> and{' '}
          <Link href="/privacy" className="underline font-medium">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  )
}
