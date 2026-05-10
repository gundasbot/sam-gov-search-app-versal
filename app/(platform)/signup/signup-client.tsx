//app/signup/signup-client.tsx

'use client'

import React, { useState, useEffect, useRef } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Eye, EyeOff, ArrowRight, Loader2, Check, AlertCircle,
  Shield, Zap, Crown, X, Mail, CheckCircle2, Phone, XCircle,
} from 'lucide-react'

// ─── Plan definitions — mirrors PricingClient exactly ─────────────────────────
const HARDCODED_PLANS = [
  {
    id: 'BASIC',
    name: 'Basic',
    tagline: 'For getting started',
    bestFor: 'New contractors exploring opportunities',
    monthlyPrice: 24.99,
    annualPrice: 240,
    icon: Shield,
    gradient: 'from-[#dbeafe] via-[#eff6ff] to-white',
    gradientActive: 'from-[#bfdbfe] via-[#dbeafe] to-[#eff6ff]',
    accent: 'from-blue-500 to-blue-600',
    accentSolid: '#3b82f6',
    accentLight: 'text-blue-600',
    savingsBadge: 'bg-blue-100 text-blue-700 border-blue-200',
    ring: 'ring-blue-400/40',
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
    gradient: 'from-[#fef3c7] via-[#fde68a] to-[#fbcfe8]',
    gradientActive: 'from-[#fde68a] via-[#fcd34d] to-[#f9a8d4]',
    accent: 'from-amber-500 to-orange-500',
    accentSolid: 'var(--color-primary)',
    accentLight: 'text-[var(--color-primary)]',
    savingsBadge: 'bg-orange-100 text-orange-700 border-orange-200',
    ring: 'ring-[var(--color-primary)]/40',
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
    gradient: 'from-[#ede9fe] via-[#f5d0fe] to-[#cffafe]',
    gradientActive: 'from-[#ddd6fe] via-[#e9d5ff] to-[#a5f3fc]',
    accent: 'from-violet-500 to-purple-600',
    accentSolid: '#7c3aed',
    accentLight: 'text-violet-600',
    savingsBadge: 'bg-violet-100 text-violet-700 border-violet-200',
    ring: 'ring-violet-400/40',
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
    { label: 'Uppercase',     pass: /[A-Z]/.test(password) },
    { label: 'Number',        pass: /[0-9]/.test(password) },
  ]
  if (!password) return null
  return (
    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
      {checks.map(c => (
        <div key={c.label} className="flex items-center gap-1">
          {c.pass
            ? <Check className="w-3 h-3 text-(--color-primary)" />
            : <X     className="w-3 h-3 text-red-400" />}
          <span className={`text-xs ${c.pass ? 'text-(--color-primary)' : 'text-(--color-text-subtle)'}`}>{c.label}</span>
        </div>
      ))}
    </div>
  )
}

export default function SignUpClient() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const emailParam   = searchParams.get('email') ?? ''
  const codeParam    = searchParams.get('code') ?? ''
  const planParam    = searchParams.get('plan')?.toUpperCase()
  const [plans, setPlans] = useState(HARDCODED_PLANS)
  const [plansLoading, setPlansLoading] = useState(true)
  const initialPlan  = planParam && plans.find(p => p.id === planParam) ? planParam : 'PROFESSIONAL'

  const [name,            setName]            = useState('')
  const [company,         setCompany]         = useState('')
  const [jobTitle,        setJobTitle]        = useState('')
  const [email,           setEmail]           = useState(emailParam)
  const [phone,           setPhone]           = useState('')
  const [password,        setPassword]        = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword,    setShowPassword]    = useState(false)
  const [showConfirm,     setShowConfirm]     = useState(false)
  const [selectedPlan,    setSelectedPlan]    = useState(initialPlan)
  const [annual,          setAnnual]          = useState(false)
  const [loading,         setLoading]         = useState(false)
  const [error,           setError]           = useState('')
  const [registered,      setRegistered]      = useState(false)
  const [registeredEmail, setRegisteredEmail] = useState('')
  const [trialCode,       setTrialCode]       = useState(codeParam)
  const [codeFromEmail,   setCodeFromEmail]   = useState(!!codeParam)
  const [codeStatus,      setCodeStatus]      = useState<
    null | 'validating' | { valid: true; trialDays?: number; type: string; discount?: string | null } | { valid: false; reason: string }
  >(null)

  const errorRef        = useRef<HTMLDivElement>(null)
  const codeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Pre-validate offer code when it arrives via URL (email link)
  useEffect(() => {
    if (!codeParam) return
    setCodeStatus('validating')
    fetch(`/api/offer-code/validate?code=${encodeURIComponent(codeParam)}`)
      .then(r => r.json())
      .then(data => setCodeStatus(data))
      .catch(() => setCodeStatus(null))
  }, [codeParam])

  // Handle return from Stripe setup (setup=done or setup=skip)
  useEffect(() => {
    const setup = searchParams.get('setup')
    const returnedEmail = searchParams.get('email')
    if ((setup === 'done' || setup === 'skip') && returnedEmail) {
      setRegisteredEmail(returnedEmail)
      setRegistered(true)
    }
  }, [searchParams])
  
  // Scroll to error when it appears
  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [error])

  // Fetch live Stripe prices on mount
  useEffect(() => {
    fetch('/api/stripe/prices')
      .then(res => res.json())
      .then((stripePrices) => {
        if (!Array.isArray(stripePrices) || stripePrices.length === 0) {
          setPlansLoading(false)
          return
        }
        // Map Stripe prices to plan structure
        const updatedPlans = HARDCODED_PLANS.map(plan => {
          const monthly = stripePrices.find(p => p.tier === plan.id && p.interval === 'monthly')
          const annual = stripePrices.find(p => p.tier === plan.id && p.interval === 'annual')
          return {
            ...plan,
            monthlyPrice: monthly ? monthly.unitAmount / 100 : plan.monthlyPrice,
            annualPrice: annual ? annual.unitAmount / 100 : plan.annualPrice,
            monthlyPriceId: monthly ? monthly.priceId : undefined,
            annualPriceId: annual ? annual.priceId : undefined,
            currency: monthly ? monthly.currency : (annual ? annual.currency : 'usd'),
          }
        })
        setPlans(updatedPlans)
        setPlansLoading(false)
      })
      .catch(() => setPlansLoading(false))
  }, [])

  async function handleOAuth(provider: 'google' | 'azure-ad') {
    setLoading(true)
    await signIn(provider, { callbackUrl: '/dashboard' })
  }

  // Format phone number as user types (US format)
  function formatPhoneNumber(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 10)
    if (digits.length === 0) return ''
    if (digits.length <= 3) return `(${digits}`
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }

  // Validate phone number (optional, but if provided must be valid)
  function isValidPhone(value: string): boolean {
    if (!value.trim()) return true // empty is valid (optional field)
    const digits = value.replace(/\D/g, '')
    return digits.length === 10
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8)        { setError('Password must be at least 8 characters.'); return }
    if (password !== confirmPassword){ setError('Passwords do not match.'); return }
    if (phone && !isValidPhone(phone)) { setError('Please enter a valid 10-digit phone number.'); return }
    setLoading(true); setError('')
    try {
      const nameParts = name.trim().split(' ')
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''
      // Strip formatting from phone for storage
      const cleanPhone = phone.replace(/\D/g, '') || undefined
      const res  = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          firstName, 
          lastName, 
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
      // If Stripe returned a setup URL, redirect to collect payment method first
      if (data.setupUrl) {
        window.location.href = data.setupUrl
        return
      }
      // No setup URL — fall back to showing verify-email screen directly
      setRegisteredEmail(email)
      setRegistered(true)
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const activePlan    = plans.find(p => p.id === selectedPlan)!
  const annualTotal   = activePlan.annualPrice
  const displayPrice  = annual ? annualTotal : activePlan.monthlyPrice
  const annualSavings = Math.round((activePlan.monthlyPrice * 12) - activePlan.annualPrice)
  const annualMonthlyEquivalent = activePlan.annualPrice / 12

  const passwordsMatch    = confirmPassword.length > 0 && password === confirmPassword
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword

  // ── Success screen after registration ──────────────────────────────────────
  if (registered) {
    const firstName = name?.split(' ')[0] || 'there'
    // ⚠️ This modal uses 100% inline styles to defeat dark mode CSS variable inheritance
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15,23,42,0.85)', padding: '40px 16px' }}>
        <div style={{ position: 'relative', width: '100%', maxWidth: '480px' }}>
          {/* Glow */}
          <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
            <div style={{ position: 'absolute', top: '-160px', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(251,146,60,0.15), transparent 65%)', filter: 'blur(40px)' }} />
          </div>
          {/* Card */}
          <div style={{ position: 'relative', zIndex: 1, borderRadius: '24px', overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.4)', border: '1px solid rgba(251,146,60,0.3)', backgroundColor: '#ffffff' }}>
            {/* Orange header */}
            <div style={{ background: 'linear-gradient(135deg, #f97316, #f59e0b)', padding: '24px 32px' }}>
              <p style={{ margin: 0, fontSize: '11px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)' }}>Account Created</p>
              <h1 style={{ margin: '4px 0 0', fontSize: '22px', fontWeight: 900, color: '#ffffff' }}>
                PRECISE<span style={{ color: 'rgba(255,255,255,0.65)' }}>GOVCON</span>
              </h1>
            </div>
            {/* Body */}
            <div style={{ backgroundColor: '#ffffff', padding: '32px' }}>
              {/* Check icon */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, #f97316, #f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(251,146,60,0.4)' }}>
                  <CheckCircle2 style={{ width: '32px', height: '32px', color: '#ffffff' }} />
                </div>
              </div>
              <h2 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: 900, color: '#111827', textAlign: 'center' }}>
                You&apos;re almost in, {firstName}!
              </h2>
              <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#6b7280', textAlign: 'center' }}>
                Your account has been created successfully.
              </p>

              {/* Email inbox card */}
              <div style={{ borderRadius: '16px', border: '1px solid #fed7aa', backgroundColor: '#fff7ed', padding: '20px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #f97316, #f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Mail style={{ width: '16px', height: '16px', color: '#ffffff' }} />
                  </div>
                  <div>
                    <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 700, color: '#9a3412' }}>Check your inbox</p>
                    <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#c2410c' }}>
                      We sent a verification link to <strong>{registeredEmail}</strong>
                    </p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#ea580c' }}>
                      Click the link to activate your account and start your 7-day free trial.
                    </p>
                  </div>
                </div>
              </div>

              {/* Steps card */}
              <div style={{ borderRadius: '16px', border: '1px solid #e5e7eb', backgroundColor: '#f9fafb', padding: '20px', marginBottom: '24px' }}>
                <p style={{ margin: '0 0 12px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b7280' }}>What happens next</p>
                {[
                  { step: '1', text: 'Open the email from noreply@precisegovcon.com' },
                  { step: '2', text: 'Click "Verify My Email & Activate Trial"' },
                  { step: '3', text: 'Sign in and access 1,500+ live opportunities' },
                  { step: '4', text: 'Set up alerts for your NAICS codes' },
                ].map(({ step, text }) => (
                  <div key={step} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'linear-gradient(135deg, #f97316, #f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: '10px', fontWeight: 900, color: '#ffffff' }}>{step}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', color: '#374151' }}>{text}</p>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <Link
                href={`/login?email=${encodeURIComponent(registeredEmail)}&registered=true`}
                style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'center', gap: '8px', borderRadius: '14px', background: 'linear-gradient(135deg, #f97316, #f59e0b)', padding: '14px 24px', fontSize: '15px', fontWeight: 700, color: '#ffffff', textDecoration: 'none', boxShadow: '0 6px 20px rgba(251,146,60,0.4)', marginBottom: '12px' }}
              >
                Go to Sign In <ArrowRight style={{ width: '16px', height: '16px' }} />
              </Link>
              <p style={{ margin: 0, textAlign: 'center', fontSize: '12px', color: '#9ca3af' }}>
                Didn&apos;t receive the email?{' '}
                <button onClick={() => setRegistered(false)} style={{ background: 'none', border: 'none', padding: 0, color: '#f97316', fontWeight: 600, cursor: 'pointer', fontSize: '12px' }}>
                  Go back
                </button>
                {' '}or check your spam folder.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (plansLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-(--color-bg)">
        <div className="text-center">
          <div className="mx-auto mb-4 h-14 w-14 rounded-full border-4 border-[--color-border] border-t-[--color-primary] animate-spin" />
          <p className="text-lg font-semibold text-[--color-text-secondary]">Loading plans...</p>
        </div>
      </div>
    )
  }
  return (
    <div className="pg-theme-cleanup pg-uniform">

      {/* ── Top notice bar ─────────────────────────────────────────────────── */}
      <div className="bg-(--color-surface) border-b border-(--color-border) py-2 px-4 sm:px-6 lg:px-8">
        <div className="max-w-480 mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-2 h-2 rounded-full bg-(--color-primary) animate-pulse shrink-0" />
            <span className="text-(--color-primary) text-xs sm:text-sm font-bold leading-tight truncate">
              7-DAY FREE TRIAL · CANCEL ANYTIME
            </span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-(--color-text-secondary) shrink-0">
            <span><span className="text-(--color-text-primary) font-bold">2,400+</span> contractors</span>
            <span><span className="text-(--color-text-primary) font-bold">4.9/5</span> rating</span>
            <span><span className="text-(--color-text-primary) font-bold">SOC 2</span> secure</span>
          </div>
        </div>
      </div>

      {/* ── Main two-column layout ──────────────────────────────────────────── */}
      <div
        className="max-w-480 mx-auto flex flex-col lg:flex-row lg:overflow-hidden"
        style={{ minHeight: 'calc(100dvh - 144px)' }}
      >

        {/* ════════════════════════════════════════════════════════════════════
            LEFT — registration form
        ════════════════════════════════════════════════════════════════════ */}
        <div className="w-full lg:w-[55%] flex flex-col bg-(--color-surface) border-b lg:border-b-0 lg:border-r border-(--color-border) lg:overflow-y-auto">

          {/* Header banner */}
          <div
            className="px-4 sm:px-8 py-5 sm:py-6 flex items-start sm:items-center justify-between gap-3 shrink-0"
            style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f172a 100%)',
              borderBottom: '1px solid rgba(249,115,22,0.25)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
            }}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                <span className="text-sm font-extrabold uppercase tracking-widest text-orange-500 drop-shadow" style={{letterSpacing: '0.08em', textShadow: '0 1px 2px #0008'}}>
                  7-Day Free Trial
                </span>
              </div>
              <h1
                className="font-black text-2xl sm:text-3xl leading-tight drop-shadow"
                style={{ color: '#fff', textShadow: '0 2px 8px #000a' }}
              >
                Create your{' '}
                <span style={{ color: '#f97316', textShadow: '0 2px 8px #000a' }}>account</span>
              </h1>
              <p className="text-sm sm:text-lg mt-1 leading-snug font-semibold" style={{ color: '#f1f5f9', textShadow: '0 1px 4px #0006' }}>
                Get started in 60 seconds · <span className="font-bold">Cancel anytime</span>
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap justify-end">
              <div
                className="hidden sm:flex items-center gap-2 rounded-lg px-4 py-2 text-base font-extrabold border shadow-md transition-all focus:outline-none focus:ring-2"
                style={{
                  color: '#22ff6e',
                  background: 'rgba(34,255,110,0.12)',
                  border: '2px solid #22ff6e',
                  boxShadow: '0 2px 8px 0 rgba(34,255,110,0.08)'
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#22ff6e')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(34,255,110,0.12)')}
              >
                <Check className="w-6 h-6" style={{ color: '#22ff6e' }} />
                <span style={{ color: 'inherit' }}>Free 7-day trial</span>
              </div>
              <Link
                href={`/login${email ? `?email=${encodeURIComponent(email)}` : ''}`}
                className="flex items-center gap-1 sm:gap-1.5 rounded-lg px-3 sm:px-4 py-2 text-sm sm:text-base font-extrabold transition-all border border-orange-500 shadow-md focus:outline-none focus:ring-2 focus:ring-orange-400"
                style={{ color: '#fff', background: 'linear-gradient(135deg, #f97316 60%, #f59e0b 100%)', textShadow: '0 1px 4px #0006' }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#f97316';
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #f97316 60%, #f59e0b 100%)';
                  e.currentTarget.style.color = '#fff';
                }}
              >
                <ArrowRight className="w-5 h-5 sm:w-7 sm:h-7 rotate-180" style={{ color: '#fff' }} />
                <span className="hidden xs:inline sm:inline">Back to </span>
                <span>Sign In</span>
              </Link>
            </div>
          </div>

          <div className="flex-1 px-4 sm:px-8 py-5 sm:py-6">
            <div className="flex flex-col gap-5">

              {/* Error - Prominent orange banner */}
              {error && (
                <div 
                  ref={errorRef}
                  className="relative flex items-center gap-3 rounded-xl p-4 shadow-lg animate-in fade-in slide-in-from-top-2 duration-300"
                  style={{ 
                    backgroundColor: '#ea580c',
                    border: '2px solid #c2410c',
                  }}
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                    <XCircle className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white uppercase tracking-wide">Error</p>
                    <p className="text-base font-semibold text-white">{error}</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setError('')}
                    className="flex-shrink-0 p-1.5 rounded-lg hover:bg-white/20 transition"
                    aria-label="Dismiss error"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              )}

              {/* Google OAuth */}
              <button
                type="button"
                onClick={() => handleOAuth('google')}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 h-12 rounded-xl border-2 border-(--color-border) bg-(--color-surface) text-base font-semibold text-(--color-text-primary) hover:bg-(--color-surface-muted) transition-all disabled:opacity-50 shadow-sm"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-(--color-border)" /></div>
                <div className="relative flex justify-center">
                  <span className="bg-(--color-surface) px-4 text-xs font-bold uppercase tracking-widest text-(--color-text-subtle)">or register with email</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">

                {/* Name + Company */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-(--color-text-secondary) mb-1.5 uppercase tracking-wide">Full Name *</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith" required
                      className="pg-input h-12 px-4 text-base bg-(--color-surface-muted) placeholder:text-(--color-text-subtle)" />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-(--color-text-secondary) mb-1.5 uppercase tracking-wide">
                      Company <span className="font-normal text-(--color-text-subtle)">(optional)</span>
                    </label>
                    <input type="text" value={company} onChange={e => setCompany(e.target.value)} placeholder="Acme Corp"
                      className="pg-input h-12 px-4 text-base bg-(--color-surface-muted) placeholder:text-(--color-text-subtle)" />
                  </div>
                </div>

                {/* Job Title */}
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-(--color-text-secondary) mb-1.5 uppercase tracking-wide">
                    Job Title / Role <span className="font-normal text-(--color-text-subtle)">(optional)</span>
                  </label>
                  <input 
                    type="text" 
                    value={jobTitle} 
                    onChange={e => setJobTitle(e.target.value)} 
                    placeholder="e.g. CEO, Contracts Manager, BD Director"
                    className="pg-input h-12 px-4 text-base bg-(--color-surface-muted) placeholder:text-(--color-text-subtle)" 
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-(--color-text-secondary) mb-1.5 uppercase tracking-wide">Work Email *</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required
                    className="pg-input h-12 px-4 text-base bg-(--color-surface-muted) placeholder:text-(--color-text-subtle)" />
                </div>

                {/* Phone (optional) */}
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-(--color-text-secondary) mb-1.5 uppercase tracking-wide">
                    Phone <span className="font-normal text-(--color-text-subtle)">(optional)</span>
                  </label>
                  <input 
                    type="tel" 
                    value={phone} 
                    onChange={e => setPhone(formatPhoneNumber(e.target.value))} 
                    placeholder="(555) 123-4567"
                    className={[
                      'pg-input h-12 px-4 text-base bg-(--color-surface-muted) placeholder:text-(--color-text-subtle)',
                      phone && !isValidPhone(phone) ? 'border-red-400 focus:ring-red-400/30' : '',
                    ].join(' ')} 
                  />
                  {phone && !isValidPhone(phone) && (
                    <p className="mt-1.5 text-xs text-red-500 font-medium">Please enter a valid 10-digit phone number</p>
                  )}
                  <p className="mt-1.5 text-xs text-(--color-text-subtle) leading-relaxed">
                    By providing your phone number you consent to receive SMS messages from{' '}
                    <strong className="text-(--color-text-secondary)">Precise Analytics</strong> about your
                    account, federal contracting opportunities, and platform updates. Message frequency varies.
                    Msg &amp; data rates may apply. Reply <strong>STOP</strong> to opt out,{' '}
                    <strong>HELP</strong> for assistance. See our{' '}
                    <Link href="/privacy" className="underline hover:text-(--color-text-primary)">Privacy Policy</Link>{' '}
                    and <Link href="/terms" className="underline hover:text-(--color-text-primary)">Terms</Link>.
                  </p>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-(--color-text-secondary) mb-1.5 uppercase tracking-wide">Password *</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="Min. 8 characters" required minLength={8}
                      className="pg-input h-12 px-4 pr-12 text-base bg-(--color-surface-muted) placeholder:text-(--color-text-subtle)" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-(--color-text-subtle) hover:text-(--color-text-secondary)"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}>
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <PasswordStrength password={password} />
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-(--color-text-secondary) mb-1.5 uppercase tracking-wide">Confirm Password *</label>
                  <div className="relative">
                    <input type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your password" required
                      className={[
                        'w-full h-12 rounded-xl border bg-(--color-surface-muted) px-4 pr-16 text-base text-(--color-text-primary) placeholder:text-(--color-text-subtle) focus:outline-none focus:ring-2 transition-all',
                        passwordsMismatch ? 'border-red-400 focus:ring-red-400/30'
                          : passwordsMatch ? 'border-(--color-primary) focus:ring-(--color-primary)/30'
                          : 'border-(--color-border) focus:ring-(--color-primary)/30 focus:border-(--color-primary)',
                      ].join(' ')} />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                      {passwordsMatch    && <Check className="w-4 h-4 text-(--color-primary)" />}
                      {passwordsMismatch && <X     className="w-4 h-4 text-red-400" />}
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                        className="text-(--color-text-subtle) hover:text-(--color-text-secondary)"
                        aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}>
                        {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  {passwordsMismatch && <p className="mt-1.5 text-sm text-red-500 font-medium">Passwords do not match</p>}
                  {passwordsMatch    && <p className="mt-1.5 text-sm text-[var(--color-primary)] font-medium">Passwords match ✓</p>}
                </div>

                {/* Trial/Promo Code */}
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-(--color-text-secondary) mb-1.5 uppercase tracking-wide">
                    Trial Code <span className="font-normal text-(--color-text-subtle)">(optional)</span>
                  </label>

                  {/* "Applied from email" pill — shown when code arrived via URL */}
                  {codeFromEmail && codeStatus && codeStatus !== 'validating' && codeStatus.valid && (
                    <div className="mb-2 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold w-fit">
                      <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                      {(codeStatus as any).trialDays
                        ? `${(codeStatus as any).trialDays}-day trial pre-applied from your invitation`
                        : 'Offer code pre-applied from your invitation'}
                    </div>
                  )}

                  <div className="relative">
                    <input
                      type="text"
                      value={trialCode}
                      onChange={e => {
                        const val = e.target.value.toUpperCase()
                        setTrialCode(val)
                        setCodeFromEmail(false)
                        setCodeStatus(null)
                        if (codeDebounceRef.current) clearTimeout(codeDebounceRef.current)
                        if (val.length >= 4) {
                          setCodeStatus('validating')
                          codeDebounceRef.current = setTimeout(() => {
                            fetch(`/api/offer-code/validate?code=${encodeURIComponent(val)}`)
                              .then(r => r.json())
                              .then(data => setCodeStatus(data))
                              .catch(() => setCodeStatus(null))
                          }, 600)
                        }
                      }}
                      placeholder="Enter code if you have one"
                      className={[
                        'pg-input h-12 px-4 text-base font-mono uppercase bg-(--color-surface-muted) placeholder:text-(--color-text-subtle) placeholder:normal-case placeholder:font-sans',
                        trialCode && codeStatus && codeStatus !== 'validating' && codeStatus.valid
                          ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                          : trialCode && codeStatus && codeStatus !== 'validating' && !codeStatus.valid
                          ? 'border-red-400 ring-2 ring-red-400/20'
                          : trialCode
                          ? 'border-(--color-primary) ring-2 ring-(--color-primary)/20'
                          : '',
                      ].join(' ')}
                    />
                    {trialCode && codeStatus === 'validating' && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <Loader2 className="w-4 h-4 text-(--color-text-subtle) animate-spin" />
                      </div>
                    )}
                    {trialCode && codeStatus && codeStatus !== 'validating' && codeStatus.valid && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <Check className="w-4 h-4 text-emerald-600" />
                      </div>
                    )}
                    {trialCode && codeStatus && codeStatus !== 'validating' && !codeStatus.valid && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <XCircle className="w-4 h-4 text-red-400" />
                      </div>
                    )}
                  </div>

                  {/* Validation feedback */}
                  {trialCode && codeStatus && codeStatus !== 'validating' && codeStatus.valid && (
                    <p className="mt-1.5 text-xs text-emerald-600 font-medium flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      {(codeStatus as any).trialDays
                        ? `Valid — ${(codeStatus as any).trialDays}-day trial will be applied`
                        : `Valid code — discount will be applied`}
                    </p>
                  )}
                  {trialCode && codeStatus && codeStatus !== 'validating' && !codeStatus.valid && (
                    <p className="mt-1.5 text-xs text-red-500 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {(codeStatus as any).reason || 'Invalid code — you can still sign up without it'}
                    </p>
                  )}
                  {trialCode && !codeStatus && (
                    <p className="mt-1.5 text-xs text-(--color-primary) font-medium flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Code entered: {trialCode}
                    </p>
                  )}
                </div>

                {/* ── Selected plan summary bar ────────────────────────────── */}
                <div
                  className="rounded-xl px-4 sm:px-5 py-5 flex items-start sm:items-center justify-between gap-3 border-2 shadow-lg"
                  style={{
                    color: activePlan.accentSolid,
                    borderColor: activePlan.accentSolid,
                    background: '#fff',
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 shadow"
                      style={{ background: activePlan.accentSolid }}>
                      {(() => { const Icon = activePlan.icon; return <Icon className="w-7 h-7 text-white" /> })()}
                    </div>
                    <div className="min-w-0">
                      <p style={{ color: activePlan.accentSolid }} className="text-sm font-extrabold uppercase tracking-wide">Selected plan</p>
                      <p style={{ color: activePlan.accentSolid }} className="text-xl sm:text-2xl font-black leading-tight truncate">{activePlan.name}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-3xl sm:text-4xl font-black leading-none" style={{ color: activePlan.accentSolid }}>
                      ${annual ? fmt0.format(displayPrice) : fmt2.format(displayPrice)}
                      <span className="text-lg font-bold" style={{ color: activePlan.accentSolid }}>{annual ? '/yr' : '/mo'}</span>
                    </p>
                    {annual && annualSavings > 0
                      ? (
                        <p className="mt-2 rounded-md px-3 py-1 text-base font-extrabold leading-tight" style={{ color: activePlan.accentSolid, borderColor: activePlan.accentSolid, background: '#fff', borderWidth: 1, borderStyle: 'solid' }}>
                          Save ${annualSavings}/yr
                          <span className="text-[var(--color-text-secondary)] font-bold"> · ${fmt2.format(annualMonthlyEquivalent)}/mo equivalent</span>
                        </p>
                      )
                      : <p className="text-base font-bold mt-1" style={{ color: activePlan.accentSolid }}>Free 7-day trial</p>
                    }
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading || passwordsMismatch}
                  className="w-full py-4 rounded-xl text-white text-lg font-black flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: 'linear-gradient(135deg, #f97316, #ea580c)',
                    boxShadow: '0 4px 18px rgba(249,115,22,0.4)',
                  }}
                  onMouseEnter={e => { if (!loading && !passwordsMismatch) (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 24px rgba(249,115,22,0.6)' }}
                  onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 18px rgba(249,115,22,0.4)'}
                >
                  {loading
                    ? <Loader2 className="w-5 h-5 animate-spin" />
                    : <><span>Start My Free Trial</span><ArrowRight className="w-5 h-5" /></>}
                </button>

                <p className="text-center text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  By signing up you agree to our{' '}
                  <Link href="/terms" className="underline hover:text-[var(--color-text-primary)]">Terms</Link>,{' '}
                  <Link href="/privacy" className="underline hover:text-[var(--color-text-primary)]">Privacy Policy</Link>,
                  {' '}and SMS communications (if phone provided).{' '}
                  Already have an account?{' '}
                  <Link href="/login" className="text-[var(--color-primary)] font-semibold hover:text-[var(--color-primary-hover)]">Sign in</Link>
                </p>
              </form>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            RIGHT — plan picker
        ════════════════════════════════════════════════════════════════════ */}
        <div className="w-full lg:w-[45%] flex flex-col gap-4 px-4 sm:px-6 py-5 lg:overflow-y-auto" style={{ background: "var(--color-surface-muted, #f1f5f9)" }}>

          {/* Header: title + monthly/annual toggle */}
          <div className="flex items-center justify-between gap-3 flex-shrink-0 flex-wrap">
            <p className="text-sm sm:text-base font-black text-[var(--color-text-primary)] uppercase tracking-widest">
              Choose your plan
            </p>

            {/* Billing toggle */}
            <div
              className="inline-flex items-center rounded-xl p-1"
              style={{
                background: '#1e293b',
                border: '1px solid rgba(255,255,255,0.12)',
              }}
            >
              <button
                type="button"
                onClick={() => setAnnual(false)}
                className="rounded-lg px-4 py-1.5 text-xs font-bold transition-all"
                style={{
                  background: !annual ? '#ffffff' : 'transparent',
                  color: !annual ? '#0f172a' : 'rgba(255,255,255,0.55)',
                  boxShadow: !annual ? '0 1px 6px rgba(0,0,0,0.25)' : 'none',
                }}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setAnnual(true)}
                className="flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-bold transition-all"
                style={{
                  background: annual ? '#f97316' : 'transparent',
                  color: annual ? '#ffffff' : 'rgba(255,255,255,0.55)',
                  boxShadow: annual ? '0 1px 8px rgba(249,115,22,0.45)' : 'none',
                }}
              >
                Annual
                <span
                  className="rounded px-1.5 py-0.5 text-[9px] font-black"
                  style={{
                    background: annual ? 'rgba(255,255,255,0.25)' : 'rgba(249,115,22,0.35)',
                    color: annual ? '#fff' : '#fb923c',
                  }}
                >
                  SAVE 20%
                </span>
              </button>
            </div>
          </div>

          {/* ── What's Included in Your 7-Day Trial ──────────────────────────── */}
          <div className="rounded-2xl overflow-hidden border border-[var(--color-border)] flex-shrink-0 bg-gradient-to-br from-[var(--color-surface)] via-[var(--color-surface)] to-[var(--color-surface-muted)] shadow-sm">
            <div className="px-5 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]">
              <p className="text-[var(--color-text-primary)] text-sm font-bold">✨ What's Included in Your 7-Day Trial</p>
            </div>
            <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5">
              {[
                '🔍 Unlimited federal opportunity searches',
                '📧 Email alerts for matching opportunities',
                '📊 Advanced NAICS & set-aside filters',
                '💾 Save unlimited opportunities',
                '📥 Export search results to CSV',
                '⏱️ Auto-saved search preferences',
              ].map(f => (
                <div key={f} className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-[var(--color-primary)]/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-2.5 h-2.5 text-[var(--color-primary)]" />
                  </div>
                  <span className="text-[var(--color-text-secondary)] text-xs sm:text-sm">{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Plan cards ──────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {plans.map(plan => {
              const Icon    = plan.icon
              const active  = selectedPlan === plan.id
              const annualPlanTotal = plan.annualPrice
              const price   = annual ? annualPlanTotal : plan.monthlyPrice
              const savings = Math.round((plan.monthlyPrice * 12) - plan.annualPrice)
              const monthlyEquivalent = plan.annualPrice / 12

              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedPlan(plan.id)}
                  className={[
                    'relative w-full text-left rounded-2xl border-2 transition-all duration-200 overflow-hidden group flex flex-col',
                    active
                      ? 'bg-white border-[var(--color-primary)] ring-2 ring-[var(--color-primary)] shadow-2xl'
                      : 'bg-white border-[var(--color-border)] hover:shadow-xl hover:border-[var(--color-primary)] hover:ring-2 hover:ring-[var(--color-primary)]',
                  ].join(' ')}
                  style={{ color: active ? 'var(--color-primary)' : 'var(--color-text-primary)' }}
                >
                  {/* Most Popular banner */}
                  {'badge' in plan && (plan as typeof plan & { badge?: string }).badge && (
                    <div
                      className="text-white text-[11px] font-black tracking-widest uppercase text-center py-2 flex-shrink-0"
                      style={{ backgroundColor: plan.accentSolid }}
                    >
                      {(plan as typeof plan & { badge?: string }).badge}
                    </div>
                  )}

                  <div className="p-4 flex flex-col flex-1">
                    {/* Icon + plan name */}
                    <div className="flex items-center gap-2.5 mb-3 flex-shrink-0">
                      <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)] flex items-center justify-center shadow-lg flex-shrink-0">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[var(--color-primary)] font-black text-base truncate">{plan.name}</p>
                        <p className="text-[var(--color-text-secondary)] text-sm truncate font-semibold">{plan.tagline}</p>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mb-3 pb-3 border-b border-black/10 flex-shrink-0">
                      <div className="flex items-baseline gap-1">
                        <span className={`text-3xl sm:text-4xl font-black ${active ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-primary)]'}`}>
                          ${annual ? fmt0.format(price) : fmt2.format(price)}
                        </span>
                        <span className="text-[var(--color-text-secondary)] text-base font-bold">{annual ? '/yr' : '/mo'}</span>
                      </div>

                      {/* Annual savings badge OR free trial label */}
                      {annual && savings > 0 ? (
                        <span className={`inline-flex mt-1.5 items-center rounded-lg border px-2.5 py-1 text-xs font-extrabold leading-tight ${plan.savingsBadge}`}>
                          Save ${savings}/yr · ${fmt2.format(monthlyEquivalent)}/mo equivalent
                        </span>
                      ) : (
                        <p className="text-[var(--color-primary)] text-xs font-semibold mt-1">7-Day Free Trial</p>
                      )}

                      {/* Best for */}
                      <p className="text-[var(--color-text-secondary)] text-[10px] mt-1.5 leading-snug">
                        <span className="font-semibold text-[var(--color-text-primary)]">Best for:</span> {plan.bestFor}
                      </p>
                    </div>

                    {/* Features */}
                    <ul className="flex flex-col gap-2 flex-1">
                      {plan.features.map(f => (
                        <li key={f} className="flex items-start gap-2">
                          <Check className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${active ? plan.checkColor : 'text-[var(--color-text-subtle)]'}`} />
                          <span className={`text-xs leading-snug ${active ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]'}`}>{f}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Select / Selected button */}
                    <div
                      className={[
                        'mt-3 w-full rounded-xl py-2.5 text-xs font-black text-center transition-all flex-shrink-0',
                        active ? 'text-white' : 'text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)]',
                      ].join(' ')}
                      style={{ backgroundColor: active ? plan.accentSolid : 'rgba(0,0,0,0.06)' }}
                    >
                      {active ? '✓ Selected' : 'Select →'}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* ── All plans include ────────────────────────────────────────────── */}
          <div className="rounded-2xl overflow-hidden border border-[var(--color-border)] flex-shrink-0 bg-[var(--color-surface)]">
            <div className="px-5 py-2.5 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-surface-muted)]">
              <p className="text-[var(--color-text-primary)] text-sm font-bold">All plans include</p>
              <span className="text-xs font-bold text-[var(--color-primary)] rounded-full px-2.5 py-0.5 border border-[var(--color-primary)]/30 bg-[var(--color-accent-soft)]">
                7-DAY FREE
              </span>
            </div>
            <div className="px-5 py-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
              {['Real-time SAM.gov data', 'NAICS matching', 'Email & portal alerts', 'Cancel anytime', 'No lock-in', 'Onboarding support'].map(f => (
                <div key={f} className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[var(--color-primary)] flex-shrink-0" />
                  <span className="text-[var(--color-text-secondary)] text-sm">{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Plan Comparison Table ────────────────────────────────────────── */}
          <div className="rounded-2xl overflow-hidden border border-[var(--color-border)] flex-shrink-0 bg-[var(--color-surface)]">
            <div className="px-5 py-2.5 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]">
              <p className="text-[var(--color-text-primary)] text-sm font-bold">Plan comparison</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[var(--color-border)]">
                    <th className="px-5 py-3 text-left font-bold text-[var(--color-text-secondary)]">Feature</th>
                    {plans.map(plan => (
                      <th key={plan.id} className={`px-4 py-3 text-center font-bold whitespace-nowrap ${plan.highlight ? 'bg-[var(--color-accent-soft)]' : ''}`}>
                        <span className={plan.highlight ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-primary)]'}>{plan.name}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: 'Saved opportunities', basic: '10', pro: 'Unlimited', ent: 'Unlimited' },
                    { feature: 'Email alerts', basic: '-', pro: '✓', ent: '✓' },
                    { feature: 'CSV export', basic: '-', pro: '✓', ent: '✓' },
                    { feature: 'Team accounts', basic: '-', pro: '-', ent: '✓' },
                    { feature: 'Advanced reporting', basic: '-', pro: '-', ent: '✓' },
                  ].map((row, idx) => (
                    <tr key={row.feature} className={idx % 2 === 1 ? 'bg-[var(--color-surface-muted)]' : ''}>
                      <td className="px-5 py-2.5 font-medium text-[var(--color-text-secondary)]">{row.feature}</td>
                      <td className="px-4 py-2.5 text-center text-[var(--color-text-secondary)]">{row.basic}</td>
                      <td className="px-4 py-2.5 text-center bg-[var(--color-accent-soft)] text-[var(--color-primary)] font-semibold">{row.pro}</td>
                      <td className="px-4 py-2.5 text-center text-[var(--color-text-secondary)]">{row.ent}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Trust badges ─────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 flex-shrink-0">
            {[
              { label: 'SAM.gov Data',       sub: 'Official federal source' },
              { label: 'SOC 2 Secure',       sub: 'Enterprise-grade security' },
              { label: 'AES-256 Encrypted',  sub: 'End-to-end protection' },
              { label: '2,400+ Contractors', sub: 'Trusted nationwide' },
            ].map(b => (
              <div key={b.label} className="rounded-xl px-3 py-2.5 flex items-center gap-2 border border-[var(--color-border)] bg-[var(--color-surface)]">
                <Check className="w-3.5 h-3.5 text-[var(--color-primary)] flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[var(--color-text-primary)] truncate">{b.label}</p>
                  <p className="text-xs text-[var(--color-text-secondary)] truncate">{b.sub}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  )
}