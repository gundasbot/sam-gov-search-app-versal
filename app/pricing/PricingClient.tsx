'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Check, Zap, Shield, Users, Star, ArrowRight } from 'lucide-react'

const plans = [
  {
    id: 'basic',
    name: 'Basic',
    tagline: 'For getting started',
    icon: <Shield className="w-5 h-5 text-slate-500" />,
    monthlyPrice: 24.99,
    annualPrice: 19.99,
    bestFor: 'New contractors exploring opportunities',
    features: [
      'Search all SAM.gov opportunities',
      'Basic filters (NAICS, keywords)',
      'Save up to 10 opportunities',
      'Email support',
    ],
    cta: 'Start 7-Day Free Trial',
    highlight: false,
    gradient: 'from-[#dbeafe] via-[#eff6ff] to-white',
  },
  {
    id: 'professional',
    name: 'Professional',
    tagline: 'For serious bidding teams',
    icon: <Zap className="w-5 h-5 text-[var(--color-primary)]" />,
    monthlyPrice: 49,
    annualPrice: 39,
    bestFor: 'Teams actively bidding every week',
    features: [
      'Everything in Basic',
      'Unlimited saved opportunities',
      'Saved searches & instant alerts',
      'Export results (CSV)',
      'Priority support',
    ],
    cta: 'Start 7-Day Free Trial',
    highlight: true,
    gradient: 'from-[#fef3c7] via-[#fde68a] to-[#fbcfe8]',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'For organizations at scale',
    icon: <Users className="w-5 h-5 text-slate-600" />,
    monthlyPrice: 199,
    annualPrice: 159,
    bestFor: 'Organizations managing multiple bids',
    features: [
      'Everything in Professional',
      'Team accounts & roles',
      'Admin portal controls',
      'Advanced reporting',
      'Dedicated onboarding',
    ],
    cta: 'Start 7-Day Free Trial',
    highlight: false,
    gradient: 'from-[#ede9fe] via-[#f5d0fe] to-[#cffafe]',
  },
]

const testimonials = [
  {
    quote: 'We went from missing bids to winning contracts within our first month. The alerts alone are worth the subscription.',
    name: 'Marcus T.',
    role: 'CEO, Federal Solutions Group',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face',
  },
  {
    quote: 'The search filters save our team hours every week. We find the right opportunities instead of digging through noise.',
    name: 'Priya S.',
    role: 'Capture Manager, TechBridge LLC',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face',
  },
  {
    quote: 'Finally a platform built for small businesses competing in the federal space. The value is unmatched.',
    name: 'James W.',
    role: 'Director, Apex Contracting',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face',
  },
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

  return (
    <div className="pb-16">
      <section className="pg-container pt-12 md:pt-16">
        <div className="pg-card relative overflow-hidden p-8 md:p-12 text-center">
          <div className="pointer-events-none absolute -top-28 right-[-120px] h-64 w-64 rounded-full bg-[var(--color-accent-soft)] blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 left-[-120px] h-64 w-64 rounded-full bg-[var(--color-accent-soft)] blur-3xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-accent-soft)] px-3 py-1.5">
              <span className="h-2 w-2 rounded-full bg-[var(--color-primary)]" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-primary)]">
                7-Day Free Trial - No Credit Card Required
              </span>
            </div>

            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-[var(--color-text-primary)] md:text-6xl" style={{ fontFamily: 'var(--font-display), system-ui, sans-serif' }}>
              Simple, transparent pricing
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base md:text-lg">
              Win more federal contracts without overpaying. Start monthly, switch anytime, and flip to annual when you are ready to lock in savings.
            </p>

            <div className="mt-8 inline-flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1">
              <button
                onClick={() => setAnnual(false)}
                className={`rounded-lg px-5 py-2 text-sm font-semibold transition-all ${!annual ? 'bg-[var(--color-primary)] text-white shadow' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setAnnual(true)}
                className={`flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold transition-all ${annual ? 'bg-[var(--color-primary)] text-white shadow' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'}`}
              >
                Annual
                <span className="rounded-md bg-[var(--color-primary)] px-1.5 py-0.5 text-[10px] font-bold text-white">SAVE 20%</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="pg-container mt-10">
        <div className="pg-card-grid">
          {plans.map((plan) => {
            const annualTotal = plan.annualPrice * 12
            const formattedPrice = annual
              ? wholeNumberFormatter.format(annualTotal)
              : preciseNumberFormatter.format(plan.monthlyPrice)
            const annualSavings = Math.max((plan.monthlyPrice - plan.annualPrice) * 12, 0)
            const equivalentMonthly = preciseNumberFormatter.format(plan.annualPrice)

            return (
              <div
                key={plan.id}
                className={`relative overflow-hidden rounded-2xl border p-6 transition-all bg-gradient-to-b ${plan.gradient} ${plan.highlight ? 'border-[var(--color-primary)] shadow-[var(--shadow-lg)] ring-1 ring-[var(--color-primary)]/20' : 'border-[var(--color-border)] shadow-[var(--shadow-sm)]'}`}
              >
                {plan.highlight && (
                  <span className="mb-4 inline-flex rounded-full bg-[var(--color-primary)] px-3 py-1 text-xs font-bold uppercase tracking-widest text-white">
                    Most Popular
                  </span>
                )}

                <div className="mb-1 flex items-center gap-2">
                  {plan.icon}
                  <h2 className="text-lg font-bold text-[var(--color-text-primary)]">{plan.name}</h2>
                </div>
                <p className="mb-4 text-sm text-[var(--color-text-secondary)]">{plan.tagline}</p>

                <div className="mb-1 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-[var(--color-text-primary)]">${formattedPrice}</span>
                  <span className="text-sm text-[var(--color-text-secondary)]">{annual ? '/yr' : '/mo'}</span>
                </div>
                {annual ? (
                  <p className="mb-2 text-xs font-semibold text-[var(--color-primary)]">
                    Billed annually · Equivalent to ${equivalentMonthly}/mo{annualSavings > 0 ? ` · Save $${wholeNumberFormatter.format(annualSavings)}/yr` : ''}
                  </p>
                ) : (
                  <p className="mb-2 text-xs font-semibold text-[var(--color-primary)]">
                    Billed monthly · Cancel anytime
                  </p>
                )}

                <p className="mb-5 text-xs text-[var(--color-text-secondary)]">
                  <span className="font-semibold text-[var(--color-text-primary)]">Best for:</span> {plan.bestFor}
                </p>
                <div className="mb-5 border-t border-[var(--color-border)]" />

                <ul className="mb-6 flex-1 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--color-primary)]" />
                      <span className="text-sm text-[var(--color-text-primary)]">{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/register"
                  className={`pg-btn w-full rounded-xl py-3 text-sm font-bold ${plan.highlight ? 'pg-btn-primary' : 'pg-btn-secondary text-[var(--color-text-primary)]'}`}
                >
                  {plan.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )
          })}
        </div>

        <div className="mt-8 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-6 py-4">
          <p className="text-sm font-medium text-[var(--color-text-primary)]">
            <span className="font-bold">Elevate your business for less.</span> Same capabilities and functionality at up to 75% less than competitors.
          </p>
        </div>

        <div className="mt-16">
          <div className="mb-10 text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--color-text-secondary)]">Trusted by contractors nationwide</p>
            <h2 className="text-2xl font-extrabold text-[var(--color-text-primary)] md:text-3xl" style={{ fontFamily: 'var(--font-display), system-ui, sans-serif' }}>
              What our customers say
            </h2>
          </div>
          <div className="pg-card-grid">
            {testimonials.map((t) => (
              <div key={t.name} className="pg-surface p-6">
                <div className="mb-3 flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-[var(--color-primary)] text-[var(--color-primary)]" />
                  ))}
                </div>
                <p className="mb-5 text-sm leading-relaxed text-[var(--color-text-primary)]">&quot;{t.quote}&quot;</p>
                <div className="flex items-center gap-3">
                  <Image
                    src={t.avatar}
                    alt={t.name}
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-full object-cover ring-2 ring-[var(--color-border)]"
                  />
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">{t.name}</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 text-center text-sm text-[var(--color-text-secondary)]">
          Have questions?{' '}
          <Link href="/support" className="font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]">
            Visit our support center
          </Link>{' '}
          or contact our team.
        </div>
      </section>
    </div>
  )
}

