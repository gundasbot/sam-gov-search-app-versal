'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Check, Zap, Shield, Users, Star, ArrowRight, Clock, Award, CheckCircle2, Database, Target, Bell, BarChart3, Filter, Download, Share2, Headphones } from 'lucide-react'

const HARDCODED_PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    tagline: 'Perfect for getting started',
    icon: <Shield className="w-6 h-6" />,
    monthlyPrice: 24.99,
    annualPrice: 240,
    bestFor: 'New contractors exploring opportunities',
    features: [
      'Search all SAM.gov opportunities',
      'Basic filters (NAICS, keywords)',
      'Save up to 10 opportunities',
      'Email support within 24 hours'
    ],
    cta: 'Start 7-Day Trial',
    highlight: false,
    badgeText: null,
    buttonGradient: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    buttonHoverGradient: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
  },
  {
    id: 'professional',
    name: 'Professional',
    tagline: 'For serious bidding teams',
    icon: <Zap className="w-6 h-6" />,
    monthlyPrice: 49,
    annualPrice: 490,
    bestFor: 'Teams actively bidding every week',
    features: [
      'Everything in Basic',
      'Unlimited saved opportunities',
      'Saved searches & instant alerts',
      'Export results (CSV, Excel)',
      'Priority support within 4 hours',
      'Advanced analytics dashboard'
    ],
    cta: 'Start 7-Day Trial',
    highlight: true,
    badgeText: 'MOST POPULAR',
    buttonGradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    buttonHoverGradient: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'For organizations at scale',
    icon: <Users className="w-6 h-6" />,
    monthlyPrice: 199,
    annualPrice: 1990,
    bestFor: 'Organizations managing multiple bids',
    features: [
      'Everything in Professional',
      'Team accounts & roles',
      'Admin portal controls',
      'Advanced reporting & insights',
      'Dedicated onboarding & training',
      'SLA guarantee & 24/7 support'
    ],
    cta: 'Start 7-Day Trial',
    highlight: false,
    badgeText: null,
    buttonGradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    buttonHoverGradient: 'linear-gradient(135deg, #059669 0%, #047857 100%)'
  },
]

const leftFeatures = [
  { icon: <Database className="w-5 h-5" />, title: 'Real-time SAM.gov', description: 'Instant syncing with federal database', color: '#3b82f6', bgColor: '#eff6ff' },
  { icon: <Target className="w-5 h-5" />, title: 'AI-powered matching', description: 'Smart opportunity recommendations', color: '#10b981', bgColor: '#ecfdf5' },
  { icon: <Bell className="w-5 h-5" />, title: 'Instant email alerts', description: 'Never miss a deadline', color: '#f97316', bgColor: '#fff7ed' },
  { icon: <BarChart3 className="w-5 h-5" />, title: 'Win rate analytics', description: 'Track and improve performance', color: '#8b5cf6', bgColor: '#f5f3ff' }
]

const rightFeatures = [
  { icon: <Filter className="w-5 h-5" />, title: 'Advanced filters', description: 'NAICS, keywords, set-asides', color: '#06b6d4', bgColor: '#ecfeff' },
  { icon: <Download className="w-5 h-5" />, title: 'Export results', description: 'CSV, Excel, PDF formats', color: '#f59e0b', bgColor: '#fffbeb' },
  { icon: <Share2 className="w-5 h-5" />, title: 'Team collaboration', description: 'Share opportunities with team', color: '#ec489a', bgColor: '#fdf2f8' },
  { icon: <Headphones className="w-5 h-5" />, title: 'Priority support', description: '24/7 expert assistance', color: '#6b7280', bgColor: '#f9fafb' }
]

const wholeNumberFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

const preciseNumberFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export default function PricingClient() {
  const [annual, setAnnual] = useState(false)
  const [plans, setPlans] = useState(HARDCODED_PLANS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/stripe/prices')
      .then(res => res.json())
      .then((stripePrices) => {
        if (!Array.isArray(stripePrices) || stripePrices.length === 0) {
          setLoading(false)
          return
        }
        // Map Stripe prices to plan structure
        const updatedPlans = HARDCODED_PLANS.map(plan => {
          const monthly = stripePrices.find(p => p.tier === plan.id.toUpperCase() && p.interval === 'monthly')
          const annual = stripePrices.find(p => p.tier === plan.id.toUpperCase() && p.interval === 'annual')
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
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const maxAnnualDiscount = Math.max(
    ...plans.map((plan) => ((plan.monthlyPrice * 12 - plan.annualPrice) / (plan.monthlyPrice * 12)) * 100)
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-(--color-bg)">
        <div className="text-center">
          <div className="mx-auto mb-4 h-14 w-14 rounded-full border-4 border-[--color-border] border-t-[--color-primary] animate-spin" />
          <p className="text-lg font-semibold text-[--color-text-secondary]">Loading pricing...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="pg-container">
        {/* Hero Section */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 pt-12 pb-8 border-b border-slate-200">
          <div className="max-w-2xl">
            <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-4 leading-tight">
              Choose your{' '}
              <span className="text-orange-500">
                path to success
              </span>
            </h1>
            <p className="text-xl text-slate-600 font-semibold">
              Start winning federal contracts today. No long-term commitments, cancel anytime.
            </p>
          </div>
          
          {/* Billing Toggle - Fixed with explicit orange color */}
          <div className="shrink-0">
            <div className="bg-slate-100 rounded-2xl p-1 inline-flex gap-1">
              <button
                onClick={() => setAnnual(false)}
                style={{
                  backgroundColor: !annual ? '#f97316' : 'transparent',
                  color: !annual ? 'white' : '#475569',
                  boxShadow: !annual ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none'
                }}
                className="px-8 py-3 rounded-xl font-bold text-base transition-all"
              >
                Monthly
              </button>
              <button
                onClick={() => setAnnual(true)}
                style={{
                  backgroundColor: annual ? '#f97316' : 'transparent',
                  color: annual ? 'white' : '#475569',
                  boxShadow: annual ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none'
                }}
                className="px-8 py-3 rounded-xl font-bold text-base transition-all flex items-center gap-2"
              >
                Annual
                <span 
                  style={{
                    backgroundColor: annual ? 'rgba(255,255,255,0.2)' : '#fed7aa',
                    color: annual ? 'white' : '#f97316'
                  }}
                  className="px-2 py-0.5 rounded-lg text-xs font-black"
                >
                  Save {wholeNumberFormatter.format(maxAnnualDiscount)}%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 py-12">
          {/* Left features */}
          <div className="lg:col-span-2 space-y-6">
            {leftFeatures.map((feature, idx) => (
              <div key={idx} className="flex items-start gap-4">
                <div 
                  className="rounded-xl p-2.5 shrink-0"
                  style={{ backgroundColor: feature.bgColor }}
                >
                  <div style={{ color: feature.color }}>{feature.icon}</div>
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-base">{feature.title}</p>
                  <p className="text-sm text-slate-500 mt-0.5">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Pricing Cards */}
          <div className="lg:col-span-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map((plan) => {
                const annualTotal = plan.annualPrice
                const formattedPrice = annual
                  ? wholeNumberFormatter.format(annualTotal)
                  : preciseNumberFormatter.format(plan.monthlyPrice)
                const annualSavings = Math.max((plan.monthlyPrice * 12) - annualTotal, 0)
                const equivalentMonthly = preciseNumberFormatter.format(annualTotal / 12)

                return (
                  <div
                    key={plan.id}
                    className={`relative rounded-2xl transition-all duration-300 hover:-translate-y-2 flex flex-col ${
                      plan.highlight 
                        ? 'bg-white border-2 border-orange-400 shadow-xl' 
                        : 'bg-white border border-slate-200 shadow-lg'
                    }`}
                  >
                    {/* Most Popular Badge */}
                    {plan.badgeText && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                        <div className="bg-orange-500 text-white px-6 py-1.5 text-xs font-bold shadow-md">
                          {plan.badgeText}
                        </div>
                      </div>
                    )}

                    <div className="p-6 flex flex-col h-full">
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`p-2.5 rounded-xl ${plan.highlight ? 'bg-orange-100' : 'bg-slate-100'}`}>
                          <span className={plan.highlight ? 'text-orange-600' : 'text-slate-700'}>
                            {plan.icon}
                          </span>
                        </div>
                        <div>
                          <h2 className="text-2xl font-black text-slate-900">{plan.name}</h2>
                          <p className="text-sm text-slate-500">{plan.tagline}</p>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="flex items-baseline gap-1">
                          <span className="text-5xl font-black text-slate-900">${formattedPrice}</span>
                          <span className="text-slate-500 font-semibold">
                            {annual ? '/year' : '/month'}
                          </span>
                        </div>
                        {annual && (
                          <p className="text-sm text-orange-600 font-bold mt-1">
                            ~${equivalentMonthly}/month · Save ${preciseNumberFormatter.format(annualSavings)}/year
                          </p>
                        )}
                        {!annual && (
                          <p className="text-sm text-slate-500 mt-1">Billed monthly · Cancel anytime</p>
                        )}
                      </div>

                      <div className="bg-slate-50 rounded-xl p-3 mb-5">
                        <p className="text-sm font-semibold text-slate-700">
                          <span className="text-orange-500 text-base">✓</span> Best for: {plan.bestFor}
                        </p>
                      </div>

                      <div className="grow mb-6">
                        <p className="font-bold text-slate-900 mb-3 text-sm">What's included:</p>
                        <ul className="space-y-2.5">
                          {plan.features.map((feature) => (
                            <li key={feature} className="flex items-start gap-2.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                              <span className="text-sm text-slate-600">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <Link
                        href={`/signup?plan=${plan.id.toUpperCase()}`}
                        className="block w-full text-center py-3.5 rounded-xl font-bold text-base transition-all transform hover:scale-[1.02] text-white shadow-md"
                        style={{ background: plan.buttonGradient }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = plan.buttonHoverGradient
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = plan.buttonGradient
                        }}
                      >
                        {plan.cta}
                        <ArrowRight className="inline ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right features */}
          <div className="lg:col-span-2 space-y-6">
            {rightFeatures.map((feature, idx) => (
              <div key={idx} className="flex items-start gap-4">
                <div 
                  className="rounded-xl p-2.5 shrink-0"
                  style={{ backgroundColor: feature.bgColor }}
                >
                  <div style={{ color: feature.color }}>{feature.icon}</div>
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-base">{feature.title}</p>
                  <p className="text-sm text-slate-500 mt-0.5">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trust Signals Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-6 border-t border-slate-200">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-600" />
              <span className="text-sm font-semibold text-slate-700">No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-600" />
              <span className="text-sm font-semibold text-slate-700">Cancel anytime</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span className="text-sm font-semibold text-slate-700">7-day money-back guarantee</span>
            </div>
          </div>
          <Link
            href="/signup"
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md"
          >
            Start Free Trial →
          </Link>
        </div>
      </div>

      {/* Testimonials */}
      <section className="bg-slate-50 mt-12 py-16 border-t border-slate-200">
        <div className="pg-container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900">Trusted by contractors nationwide</h2>
            <p className="text-lg text-slate-600 mt-2">Join thousands of successful federal contractors</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Marcus T.', role: 'CEO, Federal Solutions Group', quote: 'Went from missing bids to winning contracts within our first month.', metric: '300% ROI' },
              { name: 'Priya S.', role: 'Capture Manager, TechBridge LLC', quote: 'The search filters save our team hours every week. We find the right opportunities instantly.', metric: '15+ hrs/week' },
              { name: 'James W.', role: 'Director, Apex Contracting', quote: 'Finally a platform built for small businesses in the federal space. The value is unmatched.', metric: '$2.3M won' }
            ].map((t, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-md hover:shadow-lg transition-all">
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-orange-400 text-orange-400" />
                  ))}
                </div>
                <p className="text-slate-600 text-base leading-relaxed mb-4">"{t.quote}"</p>
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div>
                    <p className="font-bold text-slate-900">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.role}</p>
                  </div>
                  <div className="bg-orange-50 px-3 py-1 rounded-full">
                    <span className="text-orange-600 font-bold text-xs">{t.metric}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}