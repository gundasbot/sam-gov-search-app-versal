"use client"

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import {
  Search,
  FileText,
  Award,
  ShieldCheck,
  Zap,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Users,
  Target,
  Sparkles,
  Clock,
  Phone,
} from 'lucide-react'

export default function ServicesClient() {
  const router = useRouter()
  const pathname = usePathname()

  const services = [
    {
      title: 'Bid Search',
      description: 'Live federal opportunities',
      href: '/search',
      anchor: 'bid-search',
      icon: <Search className="h-6 w-6" />,
      gradient: 'from-emerald-500 to-blue-600',
      image: '/auth-cards/auth-bid-search.jpg',
      longDescription: 'Search and discover federal contracting opportunities in real-time.',
      features: ['Real-time updates', 'Advanced filters', 'Save searches'],
    },
    {
      title: 'SAM Registration',
      description: 'Expert guidance & support',
      href: '/services/sam-registration',
      anchor: 'sam-registration',
      icon: <ShieldCheck className="h-6 w-6" />,
      gradient: 'from-blue-500 to-cyan-600',
      image: '/auth-cards/auth-sam-registration.jpg',
      longDescription: 'Complete SAM.gov registration and annual renewals with expert assistance.',
      features: ['Registration support', 'Annual renewals', 'Compliance guidance'],
      badge: 'Most Popular',
    },
    {
      title: 'Proposal Writing',
      description: 'AI-powered assistance',
      href: '/services/proposal-writing',
      anchor: 'proposal-writing',
      icon: <FileText className="h-6 w-6" />,
      gradient: 'from-orange-500 to-red-600',
      image: '/auth-cards/auth-proposals.jpg',
      longDescription: 'Professional proposals that win federal contracts with AI assistance.',
      features: ['AI-powered drafting', 'Expert review', 'Competitive pricing'],
    },
    {
      title: 'Bid/No-Bid Analysis',
      description: 'Strategic pursuit decisions',
      href: '/services/bid-no-bid-review',
      anchor: 'bid-no-bid-review',
      icon: <Zap className="h-6 w-6" />,
      gradient: 'from-indigo-500 to-blue-600',
      image: '/auth-cards/auth-compliance.jpg',
      longDescription: 'AI-powered bid decision analysis to maximize win probability.',
      features: ['Win probability analysis', 'Risk assessment', 'Strategic recommendations'],
      badge: 'AI Powered',
    },
    {
      title: 'Set-Aside Certifications',
      description: 'Set-aside compliance',
      href: '/services/set-aside-certifications',
      anchor: 'set-aside-certifications',
      icon: <Award className="h-6 w-6" />,
      gradient: 'from-purple-500 to-pink-600',
      image: '/auth-cards/auth-certifications.jpg',
      longDescription: '8(a), SDVOSB, HUBZone, WOSB/EDWOSB certification assistance.',
      features: ['8(a) certification', 'SDVOSB/VOSB', 'HUBZone & WOSB'],
      badge: 'Gov Special',
    },
    {
      title: 'Capability Statements',
      description: 'Professional one-pagers',
      href: '/services/capability-statements',
      anchor: 'capability-statements',
      icon: <TrendingUp className="h-6 w-6" />,
      gradient: 'from-teal-500 to-green-600',
      image: '/auth-cards/auth-pipeline.jpg',
      longDescription: 'Professional capability statements that showcase your strengths.',
      features: ['Professional design', 'Fast turnaround', 'Unlimited revisions'],
    },
  ]

  const activeAnchor = services.find((s) => pathname?.startsWith(s.href))?.anchor

  return (
    <div className="mx-auto w-full max-w-[1920px] min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-900">
      {/* Compact Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-white">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-emerald-50 via-cyan-50 to-orange-50 opacity-90" />
        
        <div className="relative w-full px-3 sm:px-5 lg:px-6 py-12">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Heading & Description */}
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-white/80 px-4 py-2 shadow-sm">
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                <span className="text-sm font-semibold uppercase tracking-wide text-emerald-600">
                  Your Partner in Federal Contracting
                </span>
              </div>

              <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl lg:text-5xl mb-6">
                Win More Federal Contracts with <span className="bg-gradient-to-r from-emerald-500 via-cyan-500 to-orange-500 bg-clip-text text-transparent">Expert Guidance</span>
              </h1>

              <p className="text-lg leading-relaxed text-slate-600 mb-8">
                From SAM registration to winning proposals, we're with you every step of the way. 
                Our team of federal contracting experts brings decades of experience to help you 
                compete with confidence and win more contracts.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  href="/search"
                  className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 px-6 py-3 text-base font-bold text-white shadow-lg shadow-emerald-500/25 transition-all hover:scale-105 hover:shadow-xl hover:shadow-emerald-500/40"
                >
                  Start Searching
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-6 py-3 text-base font-bold text-emerald-700 shadow-sm transition-all hover:bg-emerald-50"
                >
                  View Pricing
                </Link>
              </div>

              <div className="mt-4 max-w-sm rounded-xl border border-emerald-100 bg-white p-3 shadow-sm">
                <label htmlFor="service-jump" className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600">
                  Jump to a Service Page
                </label>
                <select
                  id="service-jump"
                  defaultValue=""
                  onChange={(e) => {
                    const path = e.target.value
                    if (!path) return
                    router.push(path)
                    e.currentTarget.value = ''
                  }}
                  className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500"
                >
                  <option value="">Select a service...</option>
                  {services.map((service) => (
                    <option key={service.href} value={service.href}>
                      {service.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Right: Trust Indicators */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">Trusted by 500+ Contractors</h3>
                    <p className="text-sm text-slate-600">Join businesses winning federal contracts nationwide</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-cyan-100 bg-white p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-100 text-cyan-600">
                    <Target className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">$2.3B in Contracts Won</h3>
                    <p className="text-sm text-slate-600">Our clients have secured billions in federal awards</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">AI-Powered Intelligence</h3>
                    <p className="text-sm text-slate-600">Cutting-edge technology meets expert guidance</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
      </section>

      {/* Why Choose Us Section */}
      <section className="w-full px-3 sm:px-5 lg:px-6 py-12">
        <div className="grid lg:grid-cols-3 gap-6 mb-12">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <Clock className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Fast Response Time</h3>
            <p className="text-slate-600">Get answers within 1 business day. No waiting, no runaround—just expert help when you need it.</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-100 text-cyan-600">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Dedicated Support</h3>
            <p className="text-slate-600">Work directly with experienced federal contracting professionals who know your business.</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Proven Results</h3>
            <p className="text-slate-600">Our clients win more contracts. It's that simple. We've helped businesses secure billions in federal awards.</p>
          </div>
        </div>
      </section>

      {/* Services Grid - More Compact */}
      <section className="w-full px-3 sm:px-5 lg:px-6 py-8">
        <div className="sticky top-16 z-20 mb-6 rounded-xl border border-emerald-100 bg-white/90 backdrop-blur shadow-sm px-4 py-3 flex flex-wrap items-center gap-3">
          <span className="text-sm font-semibold text-slate-700">Jump to a service</span>
          <select
            defaultValue=""
            onChange={(e) => {
              const anchor = e.target.value
              if (!anchor) return
              const el = document.getElementById(anchor)
              if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }) }
              e.currentTarget.value = ''
            }}
            className="w-56 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none transition focus:border-emerald-500"
          >
            <option value="">Select a service...</option>
            {services.map((service) => (
              <option key={service.anchor} value={service.anchor}>
                {service.title}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-12 text-center">
          <h2 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl mb-3">
            Our Professional Services
          </h2>
          <p className="text-lg text-slate-600">
            Click any service to learn more or get started today
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, index) => (
            <Link
              key={index}
              href={service.href}
              className={[
                "group relative overflow-hidden rounded-2xl border bg-white shadow-md transition-all",
                "hover:border-emerald-300 hover:shadow-lg",
                "focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none",
                activeAnchor === service.anchor
                  ? "border-emerald-400 ring-2 ring-emerald-300"
                  : "border-slate-200"
              ].join(" ")}
              id={service.anchor}
            >
              {service.badge && (
                <div className="absolute right-4 top-4 z-10 rounded-full bg-orange-500 px-3 py-1 text-xs font-bold text-white shadow-lg">
                  {service.badge}
                </div>
              )}

              <div className={`relative h-40 w-full overflow-hidden bg-gradient-to-br ${service.gradient}`}>
                <Image
                  src={service.image}
                  alt={service.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.opacity = '0'
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/30 to-transparent" />
                
                <div className="absolute bottom-4 left-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/30 text-white backdrop-blur-sm transition-all group-hover:scale-105">
                    {service.icon}
                  </div>
                </div>
              </div>

              <div className="p-5">
                <h3 className="text-lg font-black text-slate-900 transition-colors group-hover:text-emerald-600 mb-2">
                  {service.title}
                </h3>
                <p className="text-sm text-slate-600 mb-4">
                  {service.longDescription}
                </p>

                <ul className="space-y-1.5 mb-4">
                  {service.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-xs text-slate-600">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <div className="flex items-center gap-2 text-sm font-bold text-emerald-700 transition-colors group-hover:text-emerald-800">
                  Learn more
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Partnership CTA */}
      <section className="w-full px-3 sm:px-5 lg:px-6 py-16">
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-2xl">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl mb-4">
              Ready to Win More Contracts?
            </h2>
            <p className="text-lg text-slate-600 mb-8">
              Let's talk about your goals. Our federal contracting experts are here to create 
              a winning strategy tailored to your business.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Link
                href="/support"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 px-8 py-4 text-lg font-bold text-white shadow-lg shadow-emerald-500/25 transition-all hover:scale-105 hover:shadow-xl hover:shadow-emerald-500/40"
              >
                Schedule a Consultation
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
                Free consultation
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                No obligation
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-orange-400" />
                Expert guidance
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
