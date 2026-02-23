'use client'

// app/pricing/PricingClient.tsx
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Check, Zap, Shield, Users, Star, ArrowRight } from 'lucide-react'

const plans = [
  {
    id: 'basic',
    name: 'Basic',
    tagline: 'For getting started',
    icon: <Shield className="w-5 h-5 text-slate-400" />,
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
    ctaStyle: 'bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white',
  },
  {
    id: 'professional',
    name: 'Professional',
    tagline: 'For serious bidding teams',
    icon: <Zap className="w-5 h-5 text-orange-400" />,
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
    ctaStyle: 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/25',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'For organizations at scale',
    icon: <Users className="w-5 h-5 text-cyan-400" />,
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
    ctaStyle: 'bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white',
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

export default function PricingClient() {
  const [annual, setAnnual] = useState(false)

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* ── Hero Section ── */}
      <div className="relative overflow-hidden">
        {/* Background image with overlay */}
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1600&h=600&fit=crop&q=80"
            alt="Federal buildings"
            fill
            className="object-cover opacity-10"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-slate-950/80 to-slate-950" />
        </div>

        {/* Decorative glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-400 tracking-wider uppercase">
              7-Day Free Trial · No Credit Card Required
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4">
            Simple,{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              Transparent
            </span>{' '}
            Pricing
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto mb-8">
            Win more federal contracts without overpaying for tools. Cancel anytime.
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center gap-3 bg-slate-900 border border-slate-700 rounded-xl p-1">
            <button
              onClick={() => setAnnual(false)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                !annual ? 'bg-white text-slate-900 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                annual ? 'bg-white text-slate-900 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Annual
              <span className="px-1.5 py-0.5 bg-emerald-500 text-white text-[10px] font-bold rounded-md">
                SAVE 20%
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Pricing Cards ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl p-6 flex flex-col transition-all duration-300 ${
                plan.highlight
                  ? 'bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-orange-500 shadow-2xl shadow-orange-500/10 scale-[1.02]'
                  : 'bg-slate-900 border border-slate-700/60 hover:border-slate-600'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-bold uppercase tracking-widest rounded-full shadow-lg">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Plan header */}
              <div className="flex items-center gap-2 mb-1">
                {plan.icon}
                <h2 className="text-lg font-bold text-white">{plan.name}</h2>
              </div>
              <p className="text-sm text-slate-400 mb-4">{plan.tagline}</p>

              {/* Price */}
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-extrabold text-white">
                  ${annual ? plan.annualPrice : plan.monthlyPrice}
                </span>
                <span className="text-slate-400 text-sm">/mo</span>
              </div>
              {annual && (
                <p className="text-xs text-emerald-400 font-semibold mb-2">
                  Billed annually · Save ${((plan.monthlyPrice - plan.annualPrice) * 12).toFixed(0)}/yr
                </p>
              )}

              {/* Best for */}
              <p className="text-xs text-slate-400 mb-5">
                <span className="font-semibold text-slate-300">Best for:</span> {plan.bestFor}
              </p>

              {/* Divider */}
              <div className="border-t border-slate-700/60 mb-5" />

              {/* Features */}
              <ul className="space-y-2.5 flex-1 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-300">{f}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href="/register"
                className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold transition-all ${plan.ctaStyle}`}
              >
                {plan.cta}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>

        {/* ── Trust Bar ── */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400">
          {['SAM.gov Data', 'No Credit Card', 'Cancel Anytime', 'SOC 2 Compliant'].map((item) => (
            <div key={item} className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{item}</span>
            </div>
          ))}
        </div>

        {/* ── Value Banner ── */}
        <div className="mt-8 rounded-xl border border-amber-500/30 bg-amber-500/5 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <p className="text-sm text-amber-200 font-medium">
              <span className="font-bold">Elevate your business for less!</span>{' '}
              Same capabilities and functionality at up to 75% less than competitors.
            </p>
          </div>
          <Link
            href="/features"
            className="text-xs font-bold text-amber-400 hover:text-amber-300 whitespace-nowrap transition-colors"
          >
            Compare Features →
          </Link>
        </div>

        {/* ── Testimonials ── */}
        <div className="mt-20">
          <div className="text-center mb-10">
            <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-2">Trusted by contractors nationwide</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">What our customers say</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-slate-900 border border-slate-700/60 rounded-2xl p-6 hover:border-slate-600 transition-all">
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-300 leading-relaxed mb-5">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <Image
                    src={t.avatar}
                    alt={t.name}
                    width={40}
                    height={40}
                    className="rounded-full object-cover w-10 h-10 ring-2 ring-slate-700"
                  />
                  <div>
                    <p className="text-sm font-semibold text-white">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── FAQ teaser ── */}
        <div className="mt-16 text-center">
          <p className="text-slate-400 text-sm">
            Have questions?{' '}
            <Link href="/support" className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">
              Visit our support center
            </Link>{' '}
            or{' '}
            <button className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors">
              chat with us
            </button>
            .
          </p>
        </div>
      </div>
    </div>
  )
}