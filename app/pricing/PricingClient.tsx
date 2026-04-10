'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Check, Crown, TrendingUp, ShieldCheck, Loader2, Zap,
  Users, Lock, Globe, ArrowRight, Star, ChevronDown, ChevronUp,
  Phone, Mail, CalendarClock, Rocket, BadgeCheck,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

// ─── Plan data ────────────────────────────────────────────────────────────────

const PLANS: {
  id: string; name: string; tagline: string; monthlyPrice: number; annualPrice: number; annualPerMonth: number
  description: string; icon: React.ElementType; ctaIcon: React.ElementType; popular?: boolean
  gradient: string; headerGradient: string; glowColor: string; accentColor: string; badgeText?: string
  features: string[]; notIncluded: string[]
}[] = [
  {
    id: 'BASIC',
    name: 'Basic',
    tagline: 'Start winning contracts',
    monthlyPrice: 24.99,
    annualPrice: 240,
    annualPerMonth: 20,
    description: 'Perfect for individual contractors getting started with SAM.gov searches and opportunity tracking.',
    icon: ShieldCheck,
    ctaIcon: Rocket,
    gradient: 'linear-gradient(160deg, #1e3a5f 0%, #1d4ed8 50%, #3b82f6 100%)',
    headerGradient: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 60%, #60a5fa 100%)',
    glowColor: 'rgba(59,130,246,0.45)',
    accentColor: '#60a5fa',
    features: [
      '500 searches / month',
      '10 CSV exports / month',
      '5 saved opportunities',
      'Email alerts',
      'Basic filtering & keyword search',
    ],
    notIncluded: ['API access', 'Dedicated support', 'Custom integrations'],
  },
  {
    id: 'PROFESSIONAL',
    name: 'Professional',
    tagline: 'Serious bidders only',
    monthlyPrice: 49,
    annualPrice: 490,
    annualPerMonth: 40.83,
    description: 'Full platform access for GovCon teams actively bidding on federal opportunities every week.',
    icon: TrendingUp,
    ctaIcon: TrendingUp,
    popular: true,
    badgeText: 'MOST POPULAR',
    gradient: 'linear-gradient(160deg, #1a3a2a 0%, #15803d 50%, #22c55e 100%)',
    headerGradient: 'linear-gradient(135deg, #166534 0%, #16a34a 55%, #4ade80 100%)',
    glowColor: 'rgba(34,197,94,0.5)',
    accentColor: '#4ade80',
    features: [
      '5,000 searches / month',
      '100 CSV exports / month',
      '50 saved opportunities',
      'Real-time alerts',
      'Advanced filters (NAICS, PSC, set-aside)',
      'API access',
      'Priority email support',
    ],
    notIncluded: ['Dedicated account manager', 'Custom integrations'],
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    tagline: 'Unlimited everything',
    monthlyPrice: 199,
    annualPrice: 1990,
    annualPerMonth: 165.83,
    description: 'Built for organizations managing high-volume GovCon operations with dedicated support and SLA.',
    icon: Crown,
    ctaIcon: BadgeCheck,
    badgeText: 'BEST VALUE',
    gradient: 'linear-gradient(160deg, #431407 0%, #c2410c 50%, #f97316 100%)',
    headerGradient: 'linear-gradient(135deg, #9a3412 0%, #ea580c 55%, #fb923c 100%)',
    glowColor: 'rgba(249,115,22,0.5)',
    accentColor: '#fb923c',
    features: [
      'Unlimited searches',
      'Unlimited CSV exports',
      'Unlimited saved opportunities',
      'Custom alerts & webhooks',
      'Full API access',
      'Dedicated account manager',
      'Custom integrations',
      'SLA guarantee',
    ],
    notIncluded: [],
  },
]

const FAQS = [
  {
    q: 'Can I cancel at any time?',
    a: 'Yes. You can cancel your subscription from your account page at any time. Access continues until the end of your current billing period.',
  },
  {
    q: 'What counts as a "search"?',
    a: 'Each query submitted to the SAM.gov opportunity feed counts as one search. Browsing and filtering results does not consume additional searches.',
  },
  {
    q: 'Is there a free trial?',
    a: 'Yes — we offer a free trial so you can evaluate the platform before committing. No credit card required to start.',
  },
  {
    q: 'Can I switch plans later?',
    a: 'Absolutely. You can upgrade or downgrade your plan at any time from the Billing tab in your account. Prorated credits are applied automatically.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept all major credit and debit cards through Stripe. Annual plans can also be invoiced — contact us for details.',
  },
  {
    q: 'Do you offer discounts for non-profits or government?',
    a: 'Yes — reach out to our team and we\'ll be happy to discuss options.',
  },
]

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function PricingClient() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--color-primary)' }} />
      </div>
    }>
      <PricingContent />
    </Suspense>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function PricingContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [interval, setInterval] = useState<'monthly' | 'annual'>('monthly')
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [currentTier, setCurrentTier] = useState<'NONE' | 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE'>('NONE')
  const [currentTierLoaded, setCurrentTierLoaded] = useState(false)

  const PLAN_RANK: Record<'NONE' | 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE', number> = {
    NONE: 0,
    BASIC: 1,
    PROFESSIONAL: 2,
    ENTERPRISE: 3,
  }

  useEffect(() => {
    let cancelled = false

    const loadCurrentTier = async () => {
      if (status !== 'authenticated') {
        setCurrentTier('NONE')
        setCurrentTierLoaded(true)
        return
      }

      setCurrentTierLoaded(false)

      try {
        const res = await fetch('/api/account/plan', { cache: 'no-store' })
        if (!res.ok) {
          if (!cancelled) setCurrentTierLoaded(true)
          return
        }

        const data = await res.json()
        const tier = String(data?.tier || 'NONE').toUpperCase()
        const normalized = tier === 'BASIC' || tier === 'PROFESSIONAL' || tier === 'ENTERPRISE' ? tier : 'NONE'
        if (!cancelled) {
          setCurrentTier(normalized)
          setCurrentTierLoaded(true)
        }
      } catch {
        if (!cancelled) {
          setCurrentTier('NONE')
          setCurrentTierLoaded(true)
        }
      }
    }

    loadCurrentTier()
    return () => { cancelled = true }
  }, [status])

  const getPlanAction = (targetTier: 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE', targetName: string) => {
    if (!session) {
      return { allowed: true, label: 'Start Free Trial', type: 'signup' as const }
    }

    if (!currentTierLoaded) {
      return { allowed: false, label: 'Checking plan...', type: 'loading' as const }
    }

    if (currentTier === 'NONE') {
      return { allowed: true, label: `Get ${targetName}`, type: 'change' as const }
    }

    if (targetTier === currentTier) {
      return { allowed: true, label: 'Manage Billing', type: 'manage' as const }
    }

    const diff = PLAN_RANK[targetTier] - PLAN_RANK[currentTier]
    if (Math.abs(diff) > 1) {
      return { allowed: false, label: 'Unavailable', type: 'blocked' as const }
    }

    if (diff > 0) {
      return { allowed: true, label: `Upgrade to ${targetName}`, type: 'change' as const }
    }

    return { allowed: true, label: `Downgrade to ${targetName}`, type: 'change' as const }
  }

  const handleSelectPlan = async (planId: string) => {
    if (!session) {
      router.push(`/pricing/checkout?plan=${planId.toLowerCase()}&billing=${interval}`)
      return
    }

    const plan = PLANS.find((p) => p.id === planId)
    if (!plan) return
    const action = getPlanAction(plan.id as 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE', plan.name)
    if (!action.allowed) return
    if (action.type === 'manage') {
      router.push('/account?tab=billing')
      return
    }

    setLoadingPlan(planId)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: planId,
          interval: interval === 'annual' ? 'annual' : 'monthly',
          successUrl: `${window.location.origin}/account?success=true`,
          cancelUrl: `${window.location.origin}/pricing`,
        }),
      })
      if (res.ok) {
        const { url } = await res.json()
        if (url) window.location.href = url
      }
    } catch (err) {
      console.error('Checkout error:', err)
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <main
      className="min-h-screen bg-gray-50"
      style={{ fontFamily: "'Inter','Segoe UI',system-ui,sans-serif" }}
    >

      <div className="mx-auto max-w-480 px-4 sm:px-6 lg:px-8 py-12 sm:py-16">

        {/* ── Hero ── */}
        <div className="mb-8">
          <div className="flex flex-col gap-5 mb-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 items-center gap-4 lg:gap-8 text-center">
              <div className="flex justify-center lg:justify-center">
                <div
                  className="inline-flex items-center rounded-2xl border-2 overflow-hidden shadow-sm"
                  style={{ background: '#ffffff', borderColor: '#fb923c' }}
                >
                  <span
                    className="inline-flex items-center justify-center px-3 py-2"
                    style={{ background: '#fff7ed', borderRight: '2px solid #fdba74' }}
                  >
                    <Star className="h-3.5 w-3.5" style={{ color: '#ea580c' }} />
                  </span>
                  <span className="px-4 py-2.5 text-sm font-black tracking-wide">
                    <span style={{ color: '#ea580c' }}>Simple, Transparent Pricing</span>
                    <span style={{ color: '#15803d' }}> · 7-Day Free Trial</span>
                  </span>
                </div>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-gray-900 lg:whitespace-nowrap">
                Win more{' '}
                <span className="font-black" style={{ background: 'linear-gradient(90deg, #f97316, #ea580c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  federal contracts
                </span>
              </h1>
              <p className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight max-w-2xl mx-auto">
                <span className="font-black" style={{ color: '#1d4ed8' }}>Real-time SAM.gov data</span>,{' '}
                <span className="font-black" style={{ color: '#15803d' }}>AI-powered bid scoring</span>,{' '}
                <span className="font-black" style={{ color: '#ea580c' }}>and smart alerts</span>{' '}
                <span className="font-black" style={{ color: '#111827' }}>- built for serious government contractors.</span>
              </p>
            </div>

            {/* Interval toggle */}
            <div className="flex items-center justify-center gap-4 shrink-0 pt-1">
              <div className="inline-flex items-center rounded-2xl border p-1.5 shadow-sm" style={{ background: '#ffffff', borderColor: '#d1d5db' }}>
                <button
                  onClick={() => setInterval('monthly')}
                  className="px-6 py-2.5 rounded-xl text-base font-black transition-all"
                  style={{
                    background: interval === 'monthly' ? '#111827' : '#e5e7eb',
                    color: interval === 'monthly' ? '#ffffff' : '#4b5563',
                  }}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setInterval('annual')}
                  className="px-6 py-2.5 rounded-xl text-base font-black transition-all"
                  style={{
                    background: interval === 'annual' ? '#111827' : '#e5e7eb',
                    color: interval === 'annual' ? '#ffffff' : '#4b5563',
                  }}
                >
                  Annual
                </button>
              </div>
              <span className="text-sm font-black px-4 py-2 rounded-full" style={{ background: '#f97316', color: '#ffffff' }}>
                Save ~20%
              </span>
            </div>
        </div>
        </div>

        {/* ── Plan cards ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-16 items-stretch">
          {PLANS.map((plan, idx) => {
            const isLoading = loadingPlan === plan.id
            const isHovered = hoveredPlan === plan.id
            const CTA = plan.ctaIcon
            const action = getPlanAction(plan.id as 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE', plan.name)
            const isCurrentPlan = !!session && currentTier === plan.id

            return (
              <div
                key={plan.id}
                className="relative flex flex-col rounded-3xl overflow-hidden cursor-pointer select-none"
                style={{
                  transform: isHovered ? 'translateY(-6px) scale(1.01)' : 'translateY(0)',
                  transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.25s ease',
                  boxShadow: isHovered
                    ? `0 16px 36px ${plan.glowColor}, 0 0 0 2px ${plan.accentColor}`
                    : '0 4px 14px rgba(15,23,42,0.16)',
                }}
                onMouseEnter={() => setHoveredPlan(plan.id)}
                onMouseLeave={() => setHoveredPlan(null)}
              >
                {/* Badge ribbon */}
                {plan.badgeText && (
                  <div
                    className="absolute top-5 -right-8 z-10 px-10 py-1 text-[11px] font-black tracking-widest text-white rotate-45 shadow-lg"
                    style={{ background: plan.accentColor }}
                  >
                    {plan.badgeText}
                  </div>
                )}

                {/* Gradient header */}
                <div className="relative px-7 pt-8 pb-7 overflow-hidden" style={{ background: plan.headerGradient }}>
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
                        style={{ background: '#0f172a', border: '1px solid #111827' }}>
                        <plan.icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-white/70 text-sm font-semibold uppercase tracking-widest">{plan.tagline}</p>
                        <h2 className="text-2xl font-black text-white">{plan.name}</h2>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="flex items-end gap-2">
                      <span className="text-5xl font-black text-white leading-none">
                        ${interval === 'annual' ? plan.annualPrice : plan.monthlyPrice}
                      </span>
                      <div className="mb-2">
                        <span className="text-white/60 text-lg font-bold">
                          {interval === 'annual' ? '/yr' : '/mo'}
                        </span>
                        {interval === 'annual' && (
                          <p className="text-sm font-bold mt-0.5" style={{ color: plan.accentColor }}>
                            ${plan.annualPerMonth.toFixed(2)}/mo billed annually
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card body */}
                <div className="flex flex-col flex-1 px-7 py-6 bg-white">

                  <p className="text-gray-700 text-base font-semibold leading-relaxed mb-6">{plan.description}</p>

                  {isCurrentPlan && (
                    <div className="mb-4 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-black text-white bg-orange-500 border border-orange-600 w-fit">
                      <Check className="h-4 w-4" />
                      This is your current plan
                    </div>
                  )}

                  {/* CTA button */}
                  <button
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={isLoading || !action.allowed}
                    className="w-full py-4 rounded-2xl font-black text-base transition-all flex items-center justify-center gap-2.5 mb-8 disabled:cursor-not-allowed"
                    style={{
                      background: action.allowed ? plan.accentColor : '#9ca3af',
                      color: '#fff',
                      border: '1.5px solid transparent',
                      boxShadow: isHovered ? `0 8px 24px ${plan.glowColor}` : 'none',
                      transform: isHovered ? 'scale(1.02)' : 'scale(1)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {isLoading
                      ? <Loader2 className="h-5 w-5 animate-spin" />
                      : session
                        ? <><ArrowRight className="h-5 w-5" /> {action.label}</>
                        : <><CTA className="h-5 w-5" /> Start Free Trial</>}
                  </button>

                  {/* Divider */}
                  <div className="mb-6 h-px bg-gray-100" />

                  {/* Feature list */}
                  <ul className="space-y-3.5 flex-1">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-3 text-base font-semibold text-gray-800">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                          style={{ background: `color-mix(in srgb, white 75%, ${plan.accentColor} 25%)` }}>
                          <Check className="h-3 w-3" style={{ color: plan.accentColor }} />
                        </div>
                        {f}
                      </li>
                    ))}
                    {plan.notIncluded.map((f, i) => (
                      <li key={i} className="flex items-start gap-3 text-base text-gray-500">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-gray-100">
                          <span className="text-xs leading-none">—</span>
                        </div>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Included in all plans ── */}
        <div className="rounded-3xl border border-gray-200 bg-white p-10 mb-16">
          <h2 className="text-3xl font-black text-center mb-10 text-gray-900">
            Included in every plan
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-7">
            {[
              { icon: Globe,      label: 'Live SAM.gov data',    desc: 'Real-time opportunity feed',      color: '#60a5fa' },
              { icon: Zap,        label: 'AI bid scoring',       desc: 'Instant match percentages',       color: '#4ade80' },
              { icon: Lock,       label: 'Secure & encrypted',   desc: 'SOC 2 compliant platform',        color: '#f97316' },
              { icon: Users,      label: 'Account management',   desc: 'Profile, billing & support',      color: '#a78bfa' },
              { icon: Mail,       label: 'Email alerts',         desc: 'Keyword-matched notifications',   color: '#fb923c' },
              { icon: ArrowRight, label: 'CSV exports',          desc: 'Download opportunity data',       color: '#34d399' },
              { icon: ShieldCheck,label: 'Set-aside filters',    desc: 'SDVOSB, 8(a), HUBZone & more',   color: '#f472b6' },
              { icon: Star,       label: '7-day free trial',     desc: 'No credit card required',         color: '#facc15' },
            ].map(item => (
              <div key={item.label} className="flex items-start gap-4 group">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-transform group-hover:scale-110"
                  style={{ background: item.color, border: `1px solid ${item.color}` }}>
                  <item.icon className="h-5 w-5" style={{ color: '#ffffff' }} />
                </div>
                <div>
                  <p className="font-bold text-base text-gray-800">{item.label}</p>
                  <p className="text-sm mt-0.5 text-gray-500">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── FAQ ── */}
        <div className="mb-20">
          <h2 className="text-4xl font-black text-center mb-10 text-gray-900">
            Frequently asked questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {FAQS.map((faq, i) => (
              <div key={i} className="rounded-2xl border overflow-hidden transition-all h-fit"
                style={{
                  borderColor: openFaq === i ? '#f97316' : '#e5e7eb',
                  background: openFaq === i ? '#fff7ed' : '#fff',
                }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left min-h-30"
                >
                  <span className="font-bold text-lg pr-4 text-gray-900">{faq.q}</span>
                  {openFaq === i
                    ? <ChevronUp className="h-5 w-5 shrink-0 text-orange-500" />
                    : <ChevronDown className="h-5 w-5 shrink-0 text-gray-400" />}
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-6 text-base leading-relaxed text-gray-600 border-t border-orange-100">
                    <p className="pt-4">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Enterprise CTA ── */}
        <div className="rounded-3xl p-8 sm:p-10 text-center border border-orange-200 bg-linear-to-r from-orange-50 to-amber-50">
          <div className="relative">
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4">Need a custom solution?</h2>
            <p className="text-gray-700 text-xl font-semibold mb-8 max-w-2xl mx-auto">
              Large teams, volume licensing, or specific integrations — talk to us and we&apos;ll build a plan that fits.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="mailto:support@preciseanalytics.io"
                className="flex items-center gap-3 px-7 py-4 rounded-2xl font-black text-base transition-all hover:scale-105"
                style={{ background: '#f3f4f6', color: '#111827', border: '1.5px solid #e5e7eb' }}>
                <Mail className="h-5 w-5" /> Email Sales
              </a>
              <a href="tel:+18044046005"
                className="flex items-center gap-3 px-7 py-4 rounded-2xl font-black text-base transition-all hover:scale-105"
                style={{ background: '#f3f4f6', color: '#111827', border: '1.5px solid #e5e7eb' }}>
                <Phone className="h-5 w-5" /> (804) 404-6005
              </a>
              <a href="https://calendly.com/precisegovcon/30min" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-base transition-all hover:scale-105 hover:shadow-xl"
                style={{ background: 'linear-gradient(90deg, #f97316, #ea580c)', color: '#fff' }}>
                <CalendarClock className="h-5 w-5" /> Book Priority Support
              </a>
            </div>
          </div>
        </div>

        <p className="text-center text-base mt-10 text-gray-400 font-bold">
          All plans include a 7-day free trial. No credit card required to start.{' '}
          <Link href="/support" className="font-semibold hover:underline text-gray-600">
            Questions? Contact support →
          </Link>
        </p>
      </div>
    </main>
  )
}
