'use client'

// app/signup/signup-client.tsx

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Eye, EyeOff, ArrowRight, Loader2, Check, AlertCircle,
  Shield, Zap, Crown, X,
} from 'lucide-react'

const PLANS = [
  {
    id: 'BASIC',
    name: 'Basic',
    tagline: 'For getting started',
    price: 24.99,
    icon: Shield,
    cardBg: '#1a2332',
    cardBgActive: '#0f1c2d',
    accent: 'from-slate-500 to-slate-600',
    accentSolid: '#64748b',
    accentLight: 'text-slate-300',
    ring: 'ring-slate-400/60',
    checkColor: 'text-slate-300',
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
    price: 49,
    icon: Zap,
    cardBg: '#1c1a14',
    cardBgActive: '#1f1508',
    accent: 'from-orange-500 to-orange-600',
    accentSolid: '#f97316',
    accentLight: 'text-orange-300',
    ring: 'ring-orange-500/60',
    checkColor: 'text-orange-300',
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
    price: 199,
    icon: Crown,
    cardBg: '#1c1a10',
    cardBgActive: '#1a1800',
    accent: 'from-amber-500 to-amber-600',
    accentSolid: '#f59e0b',
    accentLight: 'text-amber-300',
    ring: 'ring-amber-500/60',
    checkColor: 'text-amber-300',
    features: [
      'Everything in Professional',
      'Team accounts & roles',
      'Admin portal controls',
      'Advanced reporting',
      'Dedicated onboarding',
    ],
  },
]

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: '8+ characters', pass: password.length >= 8 },
    { label: 'Uppercase', pass: /[A-Z]/.test(password) },
    { label: 'Number', pass: /[0-9]/.test(password) },
  ]
  if (!password) return null
  return (
    <div className="mt-1.5 flex gap-4">
      {checks.map(c => (
        <div key={c.label} className="flex items-center gap-1">
          {c.pass ? <Check className="w-3 h-3 text-teal-500" /> : <X className="w-3 h-3 text-red-400" />}
          <span className={`text-xs ${c.pass ? 'text-teal-600' : 'text-slate-400'}`}>{c.label}</span>
        </div>
      ))}
    </div>
  )
}

export default function SignUpClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [offerCode, setOfferCode] = useState('')
  const [selectedPlan, setSelectedPlan] = useState('PROFESSIONAL')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const emailParam = searchParams.get('email')
    const codeParam = searchParams.get('code')
    const planParam = searchParams.get('plan')?.toUpperCase()
    if (emailParam) setEmail(emailParam)
    if (codeParam) setOfferCode(codeParam)
    if (planParam && PLANS.find(p => p.id === planParam)) setSelectedPlan(planParam)
  }, [searchParams])

  async function handleOAuth(provider: 'google' | 'azure-ad') {
    setLoading(true)
    await signIn(provider, { callbackUrl: '/dashboard' })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, company, email, password, offerCode, plan: selectedPlan }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data?.error || data?.message || 'Registration failed.'); setLoading(false); return }
      const result = await signIn('credentials', { email, password, redirect: false })
      if (result?.error) router.push(`/signin?email=${encodeURIComponent(email)}`)
      else { router.push('/dashboard'); router.refresh() }
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const activePlan = PLANS.find(p => p.id === selectedPlan)!
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword

  return (
    <>
      {/* Trust bar */}
      <div className="bg-[#0a1628] py-2 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1920px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <span className="text-teal-300 text-sm font-bold">7-DAY FREE TRIAL — NO CREDIT CARD REQUIRED</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-white/50">
            <span><span className="text-white font-bold">2,400+</span> contractors</span>
            <span><span className="text-white font-bold">4.9/5</span> rating</span>
            <span><span className="text-white font-bold">SOC 2</span> secure</span>
          </div>
        </div>
      </div>

      {/*
        Full-height two-column layout.
        LEFT (form): takes 55% — it's the primary action
        RIGHT (plan picker): takes 45% — supporting context
        Both columns fill viewport height and scroll internally.
        Offset = ticker ~36px + nav ~72px + trust ~36px = 144px
      */}
      <div
        className="flex max-w-[1920px] mx-auto"
        style={{ height: 'calc(100vh - 144px)' }}
      >

        {/* ══════════════════════════════════════
            LEFT: Sign-up form — PRIMARY, 55% width
        ══════════════════════════════════════ */}
        <div className="w-[55%] flex flex-col overflow-y-auto bg-white border-r border-slate-200">

          {/* Header */}
          <div className="bg-teal-600 px-8 py-5 flex items-center justify-between flex-shrink-0">
            <div>
              <h1 className="text-white font-black text-2xl">Create your account</h1>
              <p className="text-teal-100/80 text-base mt-0.5">Get started in 60 seconds — no credit card needed</p>
            </div>
            <div className="flex items-center gap-2 bg-white/20 rounded-xl px-4 py-2 flex-shrink-0">
              <Check className="w-5 h-5 text-white" />
              <span className="text-white text-base font-bold">Free 7-day trial</span>
            </div>
          </div>

          {/* Form content — grows and distributes space */}
          <div className="flex-1 px-8 py-6 flex flex-col justify-between">

            <div className="flex flex-col gap-5">

              {error && (
                <div className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 p-4">
                  <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-base text-red-700">{error}</p>
                </div>
              )}

              {/* Google OAuth */}
              <button type="button" onClick={() => handleOAuth('google')} disabled={loading}
                className="w-full flex items-center justify-center gap-3 h-13 py-3.5 rounded-xl border-2 border-slate-200 bg-white text-base font-semibold text-slate-700 hover:bg-slate-50 transition-all disabled:opacity-50 shadow-sm">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
                <div className="relative flex justify-center"><span className="bg-white px-4 text-sm text-slate-400 font-medium">or register with email</span></div>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Full Name *</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith" required
                      className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Company</label>
                    <input type="text" value={company} onChange={e => setCompany(e.target.value)} placeholder="Optional"
                      className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Work Email *</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required
                    className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all" />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Password *</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="Min. 8 characters" required minLength={8}
                      className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 pr-12 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <PasswordStrength password={password} />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1.5 uppercase tracking-wide">Confirm Password *</label>
                  <div className="relative">
                    <input type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your password" required
                      className={[
                        'w-full h-12 rounded-xl border bg-slate-50 px-4 pr-16 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all',
                        passwordsMismatch ? 'border-red-400 focus:ring-red-400/30' :
                        passwordsMatch   ? 'border-teal-400 focus:ring-teal-500/30' :
                                           'border-slate-200 focus:ring-teal-500/30 focus:border-teal-500',
                      ].join(' ')} />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                      {passwordsMatch    && <Check className="w-4 h-4 text-teal-500" />}
                      {passwordsMismatch && <X className="w-4 h-4 text-red-400" />}
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="text-slate-400 hover:text-slate-600">
                        {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  {passwordsMismatch && <p className="mt-1.5 text-sm text-red-500 font-medium">Passwords do not match</p>}
                  {passwordsMatch    && <p className="mt-1.5 text-sm text-teal-600 font-medium">✓ Passwords match</p>}
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                    Offer Code <span className="normal-case font-normal text-slate-400">(optional)</span>
                  </label>
                  <input type="text" value={offerCode} onChange={e => setOfferCode(e.target.value)} placeholder="e.g. NEW-REGISTRANT"
                    className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 text-base font-mono text-slate-900 placeholder:text-slate-400 placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all" />
                </div>

                {/* Selected plan summary */}
                <div className="rounded-xl px-5 py-4 flex items-center justify-between" style={{ backgroundColor: '#0a1628' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: activePlan.accentSolid + '33' }}>
                      {(() => { const Icon = activePlan.icon; return <Icon className={`w-5 h-5 ${activePlan.accentLight}`} /> })()}
                    </div>
                    <div>
                      <p className="text-white/50 text-xs font-semibold uppercase tracking-wide">Selected plan</p>
                      <p className="text-white text-lg font-black leading-tight">{activePlan.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-black leading-none ${activePlan.accentLight}`}>
                      ${activePlan.price}<span className="text-sm font-medium text-white/40">/mo</span>
                    </p>
                    <p className="text-teal-400 text-xs font-semibold mt-0.5">Free 7-day trial → pick plan on right</p>
                  </div>
                </div>

                <button type="submit" disabled={loading || passwordsMismatch}
                  className="w-full py-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-lg font-black flex items-center justify-center gap-2 transition-all disabled:opacity-60 shadow-lg shadow-orange-500/25">
                  {loading
                    ? <Loader2 className="w-5 h-5 animate-spin" />
                    : <><span>Start My Free Trial</span><ArrowRight className="w-5 h-5" /></>}
                </button>

                <p className="text-center text-sm text-slate-400">
                  By signing up you agree to our{' '}
                  <Link href="/terms" className="underline hover:text-slate-600">Terms</Link> &amp;{' '}
                  <Link href="/privacy" className="underline hover:text-slate-600">Privacy Policy</Link>.{' '}
                  No card required.{' · '}
                  <Link href="/signin" className="text-teal-600 font-semibold hover:text-teal-700">Sign in</Link>
                </p>
              </form>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════
            RIGHT: Plan picker — SUPPORTING, 45% width
        ══════════════════════════════════════ */}
        <div className="w-[45%] overflow-y-auto flex flex-col gap-4 px-6 py-5 bg-[#0b1525]">

          <p className="text-base font-bold text-white/40 uppercase tracking-widest flex-shrink-0">
            Choose your plan
          </p>

          {/* Plan cards — stretch to fill available height */}
          <div className="grid grid-cols-3 gap-3 flex-1 min-h-0">
            {PLANS.map(plan => {
              const Icon = plan.icon
              const active = selectedPlan === plan.id
              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedPlan(plan.id)}
                  style={{ backgroundColor: active ? plan.cardBgActive : plan.cardBg }}
                  className={[
                    'relative w-full text-left rounded-2xl border-2 transition-all duration-200 overflow-hidden group flex flex-col',
                    active
                      ? `border-transparent ring-2 ${plan.ring} shadow-2xl`
                      : 'border-white/10 hover:border-white/25 hover:shadow-xl',
                  ].join(' ')}
                >
                  {plan.badge && (
                    <div className="text-white text-[11px] font-black tracking-widest uppercase text-center py-2 flex-shrink-0"
                      style={{ backgroundColor: plan.accentSolid }}>
                      {plan.badge}
                    </div>
                  )}

                  <div className="p-4 flex flex-col flex-1">
                    <div className="flex items-center gap-2.5 mb-3 flex-shrink-0">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${plan.accent} flex items-center justify-center shadow-lg flex-shrink-0`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-black text-sm">{plan.name}</p>
                        <p className="text-white/50 text-xs">{plan.tagline}</p>
                      </div>
                    </div>

                    <div className="mb-3 pb-3 border-b border-white/10 flex-shrink-0">
                      <div className="flex items-baseline gap-1">
                        <span className={`text-4xl font-black ${active ? plan.accentLight : 'text-white'}`}>${plan.price}</span>
                        <span className="text-white/40 text-base">/mo</span>
                      </div>
                      <p className="text-teal-400 text-xs font-semibold mt-1">7-Day Free Trial</p>
                    </div>

                    <ul className="flex flex-col gap-2 flex-1">
                      {plan.features.map(f => (
                        <li key={f} className="flex items-start gap-2">
                          <Check className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${active ? plan.checkColor : 'text-white/25'}`} />
                          <span className={`text-xs leading-snug ${active ? 'text-white/85' : 'text-white/45'}`}>{f}</span>
                        </li>
                      ))}
                    </ul>

                    <div
                      className={['mt-3 w-full rounded-xl py-2.5 text-xs font-black text-center transition-all flex-shrink-0',
                        active ? 'text-white' : 'text-white/50 group-hover:text-white/70'].join(' ')}
                      style={{ backgroundColor: active ? plan.accentSolid : 'rgba(255,255,255,0.07)' }}>
                      {active ? '✓ Selected' : 'Select →'}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* All plans include */}
          <div className="rounded-2xl overflow-hidden border border-white/10 flex-shrink-0" style={{ backgroundColor: '#111d2e' }}>
            <div className="px-5 py-2.5 border-b border-white/10 flex items-center justify-between" style={{ backgroundColor: '#0d1728' }}>
              <p className="text-white text-sm font-bold">All plans include</p>
              <span className="text-xs font-bold text-teal-400 rounded-full px-2.5 py-0.5 border border-teal-400/30"
                style={{ backgroundColor: 'rgba(45,212,191,0.1)' }}>7-DAY FREE</span>
            </div>
            <div className="px-5 py-3 grid grid-cols-2 gap-x-4 gap-y-2">
              {['Real-time SAM.gov data', 'NAICS matching', 'Email & portal alerts', 'Cancel anytime', 'No lock-in', 'Onboarding support'].map(f => (
                <div key={f} className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
                  <span className="text-white/60 text-sm">{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-2 gap-2.5 flex-shrink-0">
            {[
              { label: 'Virginia VOSB', sub: 'Verified' },
              { label: 'Minority-Owned', sub: 'Certified MBE' },
              { label: 'SAM.gov Data', sub: 'Official source' },
              { label: 'SOC 2 Secure', sub: 'Enterprise-grade' },
            ].map(b => (
              <div key={b.label} className="rounded-xl px-3 py-2.5 flex items-center gap-2 border border-white/10" style={{ backgroundColor: '#1a2535' }}>
                <Check className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-white/80">{b.label}</p>
                  <p className="text-xs text-white/40">{b.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  )
}