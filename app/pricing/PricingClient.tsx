// app/pricing/PricingClient.tsx
'use client'

import { useState } from 'react'
import { Check, ArrowRight, Shield, Zap, Users, Star } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

type PlanPricing = {
  monthly: number
  annual: number
}

type Plan = {
  id: string
  name: string
  icon: typeof Shield
  price: PlanPricing
  bestFor: string
  features: string[]
  highlight: boolean
}

const plans: Plan[] = [
  {
    id: 'basic',
    name: 'Basic',
    icon: Shield,
    price: { monthly: 24.99, annual: 240 },
    bestFor: 'New contractors',
    features: [
      'Search all SAM.gov opportunities',
      'Basic filters (NAICS, keywords)',
      'Save up to 10 opportunities',
      'Email support',
    ],
    highlight: false,
  },
  {
    id: 'professional',
    name: 'Professional',
    icon: Zap,
    price: { monthly: 49, annual: 490 },
    bestFor: 'Active bidding teams',
    features: [
      'Everything in Basic',
      'Unlimited saved opportunities',
      'Saved searches & instant alerts',
      'Export results (CSV)',
      'Priority support',
    ],
    highlight: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    icon: Users,
    price: { monthly: 199, annual: 1990 },
    bestFor: 'Organizations at scale',
    features: [
      'Everything in Professional',
      'Team accounts & roles',
      'Admin portal controls',
      'Advanced reporting',
      'Dedicated onboarding',
    ],
    highlight: false,
  },
]

const testimonials = [
  {
    quote: 'We went from missing bids to winning contracts within our first month.',
    name: 'Marcus T.',
    role: 'CEO, Federal Solutions Group',
  },
  {
    quote: 'The search filters save our team hours every week.',
    name: 'Priya S.',
    role: 'Capture Manager, TechBridge LLC',
  },
  {
    quote: 'Finally a platform built for small businesses competing in federal space.',
    name: 'James W.',
    role: 'Director, Apex Contracting',
  },
]

export default function PricingClient() {
  const [annual, setAnnual] = useState(false)
  const { status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const handleCheckout = async (planId: string) => {
    if (status !== 'authenticated') {
      router.push(`/signup?plan=${planId.toUpperCase()}`)
      return
    }

    setLoading(planId)
    try {
      const priceMap: Record<string, { monthly: string; annual: string }> = {
        basic: { monthly: 'price_1SrWKwL0qhATKGOJo4ginD8u', annual: 'price_1SrWE8L0qhATKGOJovDYe1T4' },
        professional: { monthly: 'price_1SpfzWL0qhATKGOJGIiLnkhU', annual: 'price_1Spg08L0qhATKGOJlgQeSrUW' },
        enterprise: { monthly: 'price_1Spg0aL0qhATKGOJZcXETI7D', annual: 'price_1Spg1CL0qhATKGOJG9iRaIhq' },
      }

      const priceId = priceMap[planId]?.[annual ? 'annual' : 'monthly']
      if (!priceId) throw new Error('Invalid plan')

      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, tier: planId, billing: annual ? 'annual' : 'monthly' }),
      })

      if (!res.ok) throw new Error('Checkout failed')
      const { url } = await res.json()
      if (url) window.location.href = url
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Failed to start checkout. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div
      className="min-h-screen"
      style={{
        fontFamily: "'Aptos', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
        background:
          'linear-gradient(135deg, #1e3a8a 0%, #0f172a 25%, #1f2937 50%, #111827 75%, #0f172a 100%)',
      }}
    >
      <div className="max-w-[1920px] mx-auto px-3 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full border border-slate-700 bg-slate-800/50 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-sm font-semibold text-slate-300">7-Day Free Trial - No Credit Card</span>
          </div>

          <h1 className="text-4xl font-black text-white mb-2">Simple, transparent pricing</h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-4">
            Win more federal contracts without overpaying. Cancel anytime.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg p-1">
            <button
              onClick={() => setAnnual(false)}
              className={`px-5 py-2 rounded-lg font-semibold text-sm transition-all ${
                !annual ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`flex items-center gap-1.5 px-5 py-2 rounded-lg font-semibold text-sm transition-all ${
                annual ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Annual
              {annual && (
                <span className="bg-emerald-500/20 text-emerald-400 text-xs font-bold px-1.5 py-0.5 rounded">
                  SAVE 20%
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
          {plans.map((plan) => {
            const Icon = plan.icon
            const price = annual ? plan.price.annual : plan.price.monthly
            const savings = annual ? (plan.price.monthly * 12 - plan.price.annual).toFixed(2) : null

            return (
              <div
                key={plan.id}
                className={`rounded-2xl border backdrop-blur-sm transition-all duration-300 ${
                  plan.highlight
                    ? 'border-orange-500/60 bg-gradient-to-br from-orange-600/25 via-orange-500/10 to-slate-900/50 shadow-2xl shadow-orange-500/30 md:scale-[1.08] hover:shadow-orange-500/50 hover:border-orange-400/80'
                    : 'border-slate-600/50 bg-gradient-to-br from-slate-700/30 to-slate-800/30 hover:border-slate-500/70 hover:shadow-xl hover:shadow-slate-900/50'
                }`}
              >
                {plan.highlight && (
                  <div className="flex justify-center pt-4 pb-2">
                    <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-orange-600 to-orange-500 text-white text-xs font-black px-3 py-1 rounded-full shadow-lg shadow-orange-500/40">
                      ⭐ MOST POPULAR
                    </span>
                  </div>
                )}

                <div className="px-6 pt-5 pb-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-3 rounded-xl ${plan.highlight ? 'bg-gradient-to-br from-orange-500/30 to-orange-600/20' : 'bg-slate-700/50'}`}>
                      <Icon className={`w-6 h-6 ${plan.highlight ? 'text-orange-300' : 'text-slate-300'}`} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-white">{plan.name}</h3>
                      <p className="text-xs text-slate-400">{plan.bestFor}</p>
                    </div>
                  </div>

                  <div className="mb-5 pb-5 border-b border-slate-600/30">
                    <div className="flex items-baseline gap-1.5 mb-1">
                      <span className="text-4xl font-black text-white">${price.toFixed(2)}</span>
                      <span className="text-slate-300 text-base">{annual ? '/year' : '/mo'}</span>
                    </div>
                    {savings && <p className="text-sm text-emerald-400 font-bold">💰 Save ${savings}/year</p>}
                  </div>

                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${plan.highlight ? 'bg-orange-500/30' : 'bg-slate-700/50'}`}>
                          <Check className={`w-3.5 h-3.5 ${plan.highlight ? 'text-orange-300' : 'text-slate-300'}`} />
                        </div>
                        <span className="text-slate-200 text-sm leading-snug">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleCheckout(plan.id)}
                    disabled={loading === plan.id}
                    className={`w-full py-3 px-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all duration-300 ${
                      plan.highlight
                        ? 'bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white shadow-xl shadow-orange-500/40 hover:shadow-orange-500/60'
                        : 'bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white shadow-lg hover:shadow-xl'
                    } disabled:opacity-50`}
                  >
                    {loading === plan.id ? 'Opening...' : 'Start Free Trial'}
                    {!loading && <ArrowRight className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Trust signals */}
        <div className="flex flex-wrap justify-center gap-6 text-center mb-5">
          {['SAM.gov Data', 'No Credit Card', 'Cancel Anytime', 'SOC 2 Compliant'].map((item) => (
            <div key={item} className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-500" />
              <span className="text-sm text-slate-300 font-medium">{item}</span>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div>
          <div className="text-center mb-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">Trusted by contractors</p>
            <h2 className="text-2xl font-black text-white">What customers say</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-slate-800/40 border border-slate-700 rounded-lg p-4">
                <div className="flex gap-0.5 mb-2">
                  {[...Array(5)].map((_, index) => (
                    <Star key={index} className="w-4 h-4 fill-orange-500 text-orange-500" />
                  ))}
                </div>
                <p className="text-slate-300 mb-2 text-sm">"{t.quote}"</p>
                <p className="text-slate-200 font-bold text-sm">{t.name}</p>
                <p className="text-slate-400 text-xs">{t.role}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}