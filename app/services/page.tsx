// app/services/page.tsx
'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
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

export default function ServicesPage() {
  const services = [
    {
      title: 'Bid Search',
      description: 'Live federal opportunities',
      href: '/search',
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
      icon: <TrendingUp className="h-6 w-6" />,
      gradient: 'from-teal-500 to-green-600',
      image: '/auth-cards/auth-pipeline.jpg',
      longDescription: 'Professional capability statements that showcase your strengths.',
      features: ['Professional design', 'Fast turnaround', 'Unlimited revisions'],
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Compact Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="absolute inset-0 bg-grid-slate-700/25 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
        
        <div className="relative mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Heading & Description */}
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 backdrop-blur-sm">
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                <span className="text-sm font-semibold uppercase tracking-wide text-emerald-400">
                  Your Partner in Federal Contracting
                </span>
              </div>

              <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl mb-6">
                Win More Federal Contracts with <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-orange-400 bg-clip-text text-transparent">Expert Guidance</span>
              </h1>

              <p className="text-lg leading-relaxed text-slate-300 mb-8">
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
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-base font-bold text-white backdrop-blur-sm transition-all hover:bg-white/20"
                >
                  View Pricing
                </Link>
              </div>
            </div>

            {/* Right: Trust Indicators */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-emerald-500/20 bg-slate-800/50 p-6 backdrop-blur-sm">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                    <Users className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">Trusted by 500+ Contractors</h3>
                    <p className="text-sm text-slate-300">Join businesses winning federal contracts nationwide</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-cyan-500/20 bg-slate-800/50 p-6 backdrop-blur-sm">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400">
                    <Target className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">$2.3B in Contracts Won</h3>
                    <p className="text-sm text-slate-300">Our clients have secured billions in federal awards</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-orange-500/20 bg-slate-800/50 p-6 backdrop-blur-sm">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/20 text-orange-400">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">AI-Powered Intelligence</h3>
                    <p className="text-sm text-slate-300">Cutting-edge technology meets expert guidance</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
      </section>

      {/* Why Choose Us Section */}
      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
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
      <section className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
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
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md transition-all hover:border-emerald-300 hover:shadow-xl hover:-translate-y-1"
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
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                
                <div className="absolute bottom-4 left-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-sm transition-all group-hover:scale-110 group-hover:bg-white/30">
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

                <div className="flex items-center gap-2 text-sm font-bold text-emerald-600 transition-colors group-hover:text-emerald-700">
                  Learn more
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Partnership CTA */}
      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-12 text-center shadow-2xl">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl mb-4">
              Ready to Win More Contracts?
            </h2>
            <p className="text-lg text-slate-300 mb-8">
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
                href="tel:804-404-4005"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-8 py-4 text-lg font-bold text-white backdrop-blur-sm transition-all hover:bg-white/20"
              >
                <Phone className="h-5 w-5" />
                (804) 404-4005
              </a>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400">
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
