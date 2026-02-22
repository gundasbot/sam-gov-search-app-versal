// app/signup/page.tsx
'use client'

import { useState, useEffect, Suspense } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

const PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    price: '$24.99',
    period: '/month',
    annual: '$249.90/yr — save 16%',
    description: 'Perfect for solo contractors',
    features: [
      'Unlimited opportunity searches',
      'Advanced filtering (all criteria)',
      'Save unlimited opportunities',
      'Daily email digest alerts',
      'Search history (30 days)',
      'Export to CSV',
      'Email support',
    ],
    color: 'border-slate-600',
    badge: null,
  },
  {
    id: 'professional',
    name: 'Professional',
    price: '$49.99',
    period: '/month',
    annual: '$499.90/yr — save 16%',
    description: 'For growing businesses',
    features: [
      'Everything in Basic',
      'Real-time opportunity alerts',
      'Advanced analytics dashboard',
      'Competitor tracking',
      '25 custom alert criteria',
      'Search history (1 year)',
      'API access (1,000 calls/mo)',
      'Excel export with formatting',
      'Team collaboration (3 users)',
      'Priority support',
    ],
    color: 'border-orange-500',
    badge: 'Most Popular',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '$199.99',
    period: '/month',
    annual: '$1,999.90/yr — save 16%',
    description: 'For large prime contractors',
    features: [
      'Everything in Professional',
      'Unlimited team members',
      'Dedicated account manager',
      'Custom integrations',
      'Unlimited API access',
      'White-label reporting',
      'Custom training sessions',
      'SLA guarantees (99.9%)',
      'Phone & priority support',
      'Historical data (5+ years)',
    ],
    color: 'border-slate-600',
    badge: null,
  },
]

function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { status } = useSession()

  const offerCodeParam = searchParams.get('code') || ''
  const emailParam = searchParams.get('email') || ''

  const [selectedPlan, setSelectedPlan] = useState('professional')
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [email, setEmail] = useState(emailParam)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [offerCode, setOfferCode] = useState(offerCodeParam)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (status === 'authenticated') router.replace('/dashboard')
  }, [status, router])

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, company, email, password, offerCode, plan: selectedPlan }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Registration failed')
      setDone(true)
    } catch (err: any) {
      setErrorMsg(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">✉️</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">Check your inbox</h2>
          <p className="text-slate-400 mb-2">We sent a verification link to</p>
          <p className="text-white font-semibold mb-6">{email}</p>
          {offerCode && (
            <div className="mb-6 p-3 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-300 text-sm">
              🎁 Offer code <strong>{offerCode}</strong> will activate automatically after verification.
            </div>
          )}
          <p className="text-slate-500 text-sm">
            Already verified?{' '}
            <Link href="/login" className="text-orange-400 hover:text-orange-300">Sign in →</Link>
          </p>
        </div>
      </div>
    )
  }

  const plan = PLANS.find(p => p.id === selectedPlan)!

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* ── LEFT PANEL — Plan Selection ── */}
      <div className="lg:w-1/2 xl:w-3/5 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex flex-col p-8 lg:p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-20 left-20 w-72 h-72 bg-orange-500 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-600 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3 mb-10">
            <Image src="/precise-govcon-logo.jpg" alt="PreciseGovCon" width={40} height={40} className="rounded-lg" />
            <div>
              <span className="text-white font-bold text-lg">PRECISE</span>
              <span className="text-orange-500 font-bold text-lg">GOVCON</span>
            </div>
          </Link>

          <h1 className="text-3xl xl:text-4xl font-bold text-white mb-2">
            Start your <span className="text-orange-500">7-day free trial</span>
          </h1>
          <p className="text-slate-400 mb-8">No credit card required. Cancel anytime.</p>

          {/* Billing toggle */}
          <div className="flex items-center gap-3 mb-6">
            <span className={`text-sm font-medium ${billing === 'monthly' ? 'text-white' : 'text-slate-400'}`}>Monthly</span>
            <button
              onClick={() => setBilling(billing === 'monthly' ? 'annual' : 'monthly')}
              className={`relative w-12 h-6 rounded-full transition-colors ${billing === 'annual' ? 'bg-orange-500' : 'bg-slate-700'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${billing === 'annual' ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
            <span className={`text-sm font-medium ${billing === 'annual' ? 'text-white' : 'text-slate-400'}`}>
              Annual <span className="text-green-400 text-xs font-bold ml-1">-16%</span>
            </span>
          </div>

          {/* Plan cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PLANS.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedPlan(p.id)}
                className={`relative text-left p-4 rounded-xl border-2 transition-all ${
                  selectedPlan === p.id
                    ? p.id === 'professional'
                      ? 'border-orange-500 bg-orange-500/10'
                      : 'border-blue-500 bg-blue-500/10'
                    : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                }`}
              >
                {p.badge && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                    {p.badge}
                  </span>
                )}
                <div className="font-bold text-white mb-0.5">{p.name}</div>
                <div className="text-orange-400 font-bold text-lg">{p.price}<span className="text-slate-400 text-xs font-normal">/mo</span></div>
                {billing === 'annual' && (
                  <div className="text-green-400 text-xs mt-0.5">{p.annual}</div>
                )}
              </button>
            ))}
          </div>

          {/* Selected plan features */}
          <div className="mt-6 p-4 rounded-xl bg-slate-800/50 border border-slate-700">
            <div className="flex justify-between items-center mb-3">
              <span className="font-semibold text-white">{plan.name} plan includes:</span>
              <span className="text-slate-400 text-sm">{plan.description}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {plan.features.map(f => (
                <div key={f} className="flex items-center gap-2 text-slate-300 text-sm">
                  <span className="text-green-400 flex-shrink-0">✓</span>
                  {f}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL — Registration Form ── */}
      <div className="w-full lg:w-1/2 xl:w-2/5 flex flex-col justify-center items-center px-6 py-12 bg-slate-900">
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-bold text-white mb-1">Create your account</h2>
          <p className="text-slate-400 mb-8">
            Already have one?{' '}
            <Link href="/login" className="text-orange-400 hover:text-orange-300 font-medium">Sign in →</Link>
          </p>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {errorMsg}
            </div>
          )}

          {/* OAuth */}
          <div className="space-y-3 mb-6">
            <button
              onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-slate-700" />
            <span className="text-slate-500 text-sm">or register with email</span>
            <div className="flex-1 h-px bg-slate-700" />
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Jane Smith"
                  required
                  className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Company</label>
                <input
                  type="text"
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                  placeholder="Acme Corp"
                  className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Work Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  minLength={8}
                  required
                  className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors pr-12"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {offerCode ? (
              <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-300 text-sm flex items-center gap-2">
                🎁 Offer code <strong>{offerCode}</strong> applied
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Offer Code <span className="text-slate-500 font-normal">(optional)</span></label>
                <input
                  type="text"
                  value={offerCode}
                  onChange={e => setOfferCode(e.target.value.toUpperCase())}
                  placeholder="GOVCON2026"
                  className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors font-mono"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-lg bg-orange-500 hover:bg-orange-400 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-base transition-colors"
            >
              {loading ? 'Creating account…' : `Start Free Trial — ${plan.name}`}
            </button>
          </form>

          <p className="mt-4 text-slate-500 text-xs text-center">
            By signing up you agree to our{' '}
            <Link href="/privacy" className="text-slate-400 hover:text-white">Privacy Policy</Link>
            {' & '}
            <Link href="/terms" className="text-slate-400 hover:text-white">Terms of Service</Link>
          </p>
        </div>

        <p className="mt-8 text-slate-600 text-xs text-center">
          © 2026 PreciseGovCon ·{' '}
          <Link href="/privacy" className="hover:text-slate-400">Privacy</Link>
          {' · '}
          <Link href="/support" className="hover:text-slate-400">Support</Link>
        </p>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SignupForm />
    </Suspense>
  )
}
