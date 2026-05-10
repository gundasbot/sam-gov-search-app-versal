"use client"

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Search,
  FileText,
  Award,
  ShieldCheck,
  Zap,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Clock,
  Phone,
  Users,
} from 'lucide-react'

export default function ServicesClient() {
  const pathname = usePathname()

  const services = [
    {
      title: 'Bid Search',
      description: 'Opportunity discovery',
      href: '/search',
      anchor: 'bid-search',
      icon: <Search className="h-6 w-6" />,
      gradient: 'from-emerald-500 to-teal-600',
      image: '/auth-slides/hero-contract-strategy.jpg',
      longDescription: 'Find live SAM.gov opportunities with practical filters, saved searches, and a cleaner review process.',
      features: ['Live opportunity search', 'NAICS and set-aside filters', 'Saved searches and follow-up'],
      bestFor: 'Teams that need a faster way to review what is actually worth pursuing.',
      theme: {
        hover: 'hover:border-emerald-300',
        active: 'border-emerald-400 ring-2 ring-emerald-300',
        heading: 'text-emerald-700',
        title: 'group-hover:text-emerald-700',
        label: 'border-emerald-200 bg-emerald-50/90 text-emerald-700',
        icon: 'text-emerald-500',
        cta: 'text-emerald-700 group-hover:text-emerald-800',
      },
    },
    {
      title: 'SAM Registration',
      description: 'Registration support',
      href: '/services/sam-registration',
      anchor: 'sam-registration',
      icon: <ShieldCheck className="h-6 w-6" />,
      gradient: 'from-blue-500 to-cyan-600',
      image: '/auth-cards/auth-sam-registration.jpg',
      longDescription: 'Hands-on help with new registrations, renewals, and keeping your entity record in good standing.',
      features: ['Initial registrations', 'Annual renewals', 'Entity record guidance'],
      bestFor: 'Businesses that want a steadier registration process and fewer avoidable delays.',
      theme: {
        hover: 'hover:border-blue-300',
        active: 'border-blue-400 ring-2 ring-blue-300',
        heading: 'text-blue-700',
        title: 'group-hover:text-blue-700',
        label: 'border-blue-200 bg-blue-50/90 text-blue-700',
        icon: 'text-blue-500',
        cta: 'text-blue-700 group-hover:text-blue-800',
      },
    },
    {
      title: 'Proposal Writing',
      description: 'Writing and review',
      href: '/services/proposal-writing',
      anchor: 'proposal-writing',
      icon: <FileText className="h-6 w-6" />,
      gradient: 'from-orange-500 to-red-600',
      image: '/auth-cards/auth-proposals.jpg',
      longDescription: 'Drafting and review support that helps teams respond with stronger structure, compliance, and clarity.',
      features: ['Draft support', 'Expert review', 'Compliance-minded organization'],
      bestFor: 'Teams that need help turning technical input into a more polished response package.',
      theme: {
        hover: 'hover:border-orange-300',
        active: 'border-orange-400 ring-2 ring-orange-300',
        heading: 'text-orange-700',
        title: 'group-hover:text-orange-700',
        label: 'border-orange-200 bg-orange-50/90 text-orange-700',
        icon: 'text-orange-500',
        cta: 'text-orange-700 group-hover:text-orange-800',
      },
    },
    {
      title: 'Bid/No-Bid Analysis',
      description: 'Pursuit evaluation',
      href: '/services/bid-no-bid-review',
      anchor: 'bid-no-bid-review',
      icon: <Zap className="h-6 w-6" />,
      gradient: 'from-indigo-500 to-blue-600',
      image: '/auth-cards/auth-compliance.jpg',
      longDescription: 'A structured review of fit, effort, timing, and risk before your team commits valuable resources.',
      features: ['Fit and readiness review', 'Risk and effort assessment', 'Next-step recommendations'],
      bestFor: 'Contractors who want a more disciplined way to decide what deserves attention.',
      theme: {
        hover: 'hover:border-indigo-300',
        active: 'border-indigo-400 ring-2 ring-indigo-300',
        heading: 'text-indigo-700',
        title: 'group-hover:text-indigo-700',
        label: 'border-indigo-200 bg-indigo-50/90 text-indigo-700',
        icon: 'text-indigo-500',
        cta: 'text-indigo-700 group-hover:text-indigo-800',
      },
    },
    {
      title: 'Set-Aside Certifications',
      description: 'Certification guidance',
      href: '/services/set-aside-certifications',
      anchor: 'set-aside-certifications',
      icon: <Award className="h-6 w-6" />,
      gradient: 'from-emerald-500 to-teal-600',
      image: '/auth-slides/hero-government-context.jpg',
      longDescription: 'Guidance for evaluating and preparing 8(a), SDVOSB/VOSB, HUBZone, and WOSB or EDWOSB pathways.',
      features: ['Eligibility review', 'Application preparation', 'Documentation guidance'],
      bestFor: 'Small businesses planning their next certification step and wanting clearer direction.',
      theme: {
        hover: 'hover:border-teal-300',
        active: 'border-teal-400 ring-2 ring-teal-300',
        heading: 'text-teal-700',
        title: 'group-hover:text-teal-700',
        label: 'border-teal-200 bg-teal-50/90 text-teal-700',
        icon: 'text-teal-500',
        cta: 'text-teal-700 group-hover:text-teal-800',
      },
    },
    {
      title: 'Capability Statements',
      description: 'Positioning materials',
      href: '/services/capability-statements',
      anchor: 'capability-statements',
      icon: <TrendingUp className="h-6 w-6" />,
      gradient: 'from-blue-500 to-indigo-600',
      image: '/auth-cards/auth-pipeline.jpg',
      longDescription: 'Capability statements shaped for outreach, teaming conversations, and agency introductions.',
      features: ['Message development', 'Professional layout', 'Revision support'],
      bestFor: 'Firms that need a sharper introduction for primes, agencies, and partners.',
      theme: {
        hover: 'hover:border-blue-300',
        active: 'border-blue-400 ring-2 ring-blue-300',
        heading: 'text-blue-700',
        title: 'group-hover:text-blue-700',
        label: 'border-blue-200 bg-blue-50/90 text-blue-700',
        icon: 'text-blue-500',
        cta: 'text-blue-700 group-hover:text-blue-800',
      },
    },
  ]

  const activeAnchor = services.find((s) => pathname?.startsWith(s.href))?.anchor

  return (
    <div className="mx-auto w-full max-w-480 min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900">
      <section className="relative overflow-hidden bg-white">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-emerald-50 via-slate-50 to-cyan-50 opacity-90" />
        <div className="w-full px-3 py-8 sm:px-5 lg:px-6 lg:py-10">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.12fr_0.88fr] lg:items-start">
            <div className="lg:pr-6">
              <div className="mb-3 text-4xl font-black tracking-tight text-emerald-700 md:text-5xl">
                Every Bottleneck Has a Fix.
              </div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-5 py-2.5 text-base font-bold text-emerald-700 shadow-sm">
                <Zap className="w-5 h-5" />
                <span>6 Specialized Federal Contracting Services</span>
              </div>

              <h1 className="mb-5 text-5xl font-black leading-tight text-slate-900 md:text-6xl">
                Choose the service that matches your next bottleneck
              </h1>

              <p className="mb-4 text-2xl font-semibold leading-relaxed text-slate-700">
                Registrations, certifications, bid search, proposal support, and positioning materials — all in one place.
              </p>

              <p className="mb-7 max-w-4xl text-lg leading-8 text-slate-600 md:text-xl">
                Whether you&apos;re getting into federal contracting for the first time or scaling an existing pipeline, we have focused support for the stage you&apos;re in.
              </p>

              <div className="mb-7 flex flex-wrap gap-3">
                <Link
                  href="/support"
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-7 py-3.5 text-lg font-bold text-white shadow-xl transition-all hover:scale-105 hover:bg-emerald-700"
                >
                  <Phone className="w-5 h-5" />
                  Talk With Our Team
                </Link>
                <select
                  defaultValue=""
                  onChange={(e) => {
                    const anchor = e.target.value
                    if (!anchor) return
                    const el = document.getElementById(anchor)
                    if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }) }
                    e.currentTarget.value = ''
                  }}
                  className="rounded-xl border border-emerald-200 bg-white px-5 py-3.5 text-base font-bold text-slate-800 shadow-sm outline-none transition focus:border-emerald-500 hover:bg-emerald-50 cursor-pointer"
                >
                  <option value="">Jump to a service...</option>
                  {services.map((service) => (
                    <option key={service.anchor} value={service.anchor}>
                      {service.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-5 text-slate-700">
                <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-emerald-600" /><span className="font-semibold text-base">SAM registration & renewals</span></div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-emerald-600" /><span className="font-semibold text-base">Proposal support</span></div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-emerald-600" /><span className="font-semibold text-base">Set-aside certifications</span></div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white border border-emerald-100 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-4 mb-4"><Search className="w-12 h-12 text-emerald-500" /><div><div className="text-2xl font-black text-slate-900">Find opportunities</div></div></div>
                <p className="text-sm text-slate-700">Bid search, saved searches, and NAICS filters so your team reviews fewer irrelevant results.</p>
              </div>
              <div className="bg-white border border-emerald-100 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-4 mb-4"><FileText className="w-12 h-12 text-orange-500" /><div><div className="text-2xl font-black text-slate-900">Respond & compete</div></div></div>
                <p className="text-sm text-slate-700">Proposal writing, bid/no-bid analysis, and capability statements for a stronger pursuit process.</p>
              </div>
              <div className="bg-white border border-emerald-100 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-4"><ShieldCheck className="w-12 h-12 text-blue-500" /><div><div className="text-2xl font-black text-slate-900">Stay registered & compliant</div><div className="text-sm font-semibold text-slate-600 mt-1">SAM registration, renewals, certifications, and compliance monitoring.</div></div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section id="services-grid" className="w-full px-3 pt-4 pb-8 sm:px-5 lg:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, index) => (
            <Link
              key={index}
              href={service.href}
              className={[
                "group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-white shadow-md transition-all duration-200",
                "hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/80",
                "focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none",
                activeAnchor === service.anchor
                  ? service.theme.active
                  : "border-slate-200",
                activeAnchor === service.anchor ? "" : service.theme.hover,
              ].join(" ")}
              id={service.anchor}
            >
              <div className={`relative aspect-[16/6] w-full overflow-hidden bg-gradient-to-br ${service.gradient}`}>
                <Image
                  src={service.image}
                  alt={service.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.opacity = '0'
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/15 to-transparent" />
                
                <div className="absolute left-4 top-4">
                  <div className={[
                    "rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] shadow-sm backdrop-blur-sm",
                    service.theme.label,
                  ].join(" ")}>
                    {service.description}
                  </div>
                </div>

                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/25 text-white backdrop-blur-sm transition-all group-hover:scale-105">
                    {service.icon}
                  </div>
                  <div className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                    Learn more
                  </div>
                </div>
              </div>

              <div className="flex flex-1 flex-col p-4">
                <h3 className={["text-base font-black transition-colors", service.theme.heading, service.theme.title].join(" ")}>
                  {service.title}
                </h3>
                <p className="mt-2 text-sm leading-5 text-slate-600">
                  {service.longDescription}
                </p>

                <ul className="mt-3 space-y-1.5">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-xs text-slate-600">
                      <CheckCircle2 className={["h-3.5 w-3.5 flex-shrink-0", service.theme.icon].join(" ")} />
                      {feature}
                    </li>
                  ))}
                </ul>

                <p className="mt-3 text-xs leading-5 text-slate-500">
                  <span className="font-bold uppercase tracking-[0.16em] text-slate-600">Best for </span>
                  {service.bestFor}
                </p>

                <div className="mt-auto flex items-center justify-between border-t border-slate-200 pt-3">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Explore service
                  </span>
                  <div className={["flex items-center gap-2 text-sm font-bold transition-colors", service.theme.cta].join(" ")}>
                  Learn more
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-6 grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[1.15fr_1fr]">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                title: 'Start with the bottleneck',
                body: 'Pick the service tied to the step that is currently slowing your team down the most.',
              },
              {
                title: 'Read for fit',
                body: 'Each card is written to clarify where the service is useful, not to oversell it.',
              },
              {
                title: 'Combine support when needed',
                body: 'Registration, search, certification, and proposal work often connect naturally as you grow.',
              },
            ].map((item) => (
              <div key={item.title} className="rounded-xl bg-slate-50 px-4 py-4 text-left">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">{item.body}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Where we can help</p>
                <p className="text-sm leading-6 text-slate-600">
                  Search, registrations, certifications, proposals, and positioning materials, without the chest-thumping.
                </p>
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Use the service pages when you want more detail on scope, fit, and how to get started.
            </p>
          </div>
        </div>
      </section>

      {/* Working Style Section */}
      <section className="w-full px-3 sm:px-5 lg:px-6 py-12">
        <div className="mb-8 max-w-3xl">
          <h2 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            A steady partner, not a loud one
          </h2>
          <p className="mt-3 text-lg leading-8 text-slate-600">
            We would rather be specific than flashy. The work is to help you move through federal contracting with better information, cleaner materials, and fewer avoidable mistakes.
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <Clock className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Clear next steps</h3>
            <p className="text-slate-600">We focus on what needs to happen next, what can wait, and where effort is best spent.</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-100 text-cyan-600">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Responsive communication</h3>
            <p className="text-slate-600">Questions get answers, documents get reviewed, and you do not have to guess where things stand.</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Support matched to your stage</h3>
            <p className="text-slate-600">Some teams need registration help. Others need a second set of eyes on a bid. We meet you where the work is.</p>
          </div>
        </div>
      </section>

      {/* Partnership CTA */}
      <section className="w-full px-3 sm:px-5 lg:px-6 py-16">
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-2xl">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl mb-4">
              Need help choosing the right service?
            </h2>
            <p className="text-lg text-slate-600 mb-8">
              Tell us where you are stuck and we will help you decide what support makes sense now,
              whether that is registration help, certification guidance, search support, or proposal review.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Link
                href="/support"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 px-8 py-4 text-lg font-bold text-white shadow-lg shadow-emerald-500/25 transition-all hover:scale-105 hover:shadow-xl hover:shadow-emerald-500/40"
              >
                Contact Support
                <ArrowRight className="h-5 w-5" />
              </Link>
              <a
                href="tel:804-404-6005"
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-8 py-4 text-lg font-bold text-emerald-700 shadow-sm transition-all hover:bg-emerald-50"
              >
                <Phone className="h-5 w-5" />
                (804) 404-6005
              </a>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Straight answers
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                Practical guidance
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-orange-400" />
                No pressure
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
