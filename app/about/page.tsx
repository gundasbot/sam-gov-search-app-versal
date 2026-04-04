'use client'

import Image from 'next/image'
import Link from 'next/link'
import {
  Target,
  Users,
  Award,
  TrendingUp,
  Shield,
  Zap,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Building2,
  MapPin,
  Mail,
  Clock,
  Search,
  Heart,
} from 'lucide-react'

export default function AboutPage() {
  const stats = [
    {
      label: 'Founded',
      value: '2024',
      icon: Building2,
      gradient: 'from-emerald-500 to-teal-600',
      image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&q=80',
    },
    {
      label: 'Headquarters',
      value: 'Virginia',
      icon: MapPin,
      gradient: 'from-cyan-500 to-blue-600',
      image: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600&q=80',
    },
    {
      label: 'Opportunities',
      value: '10,000+',
      icon: TrendingUp,
      gradient: 'from-emerald-500 to-cyan-600',
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80',
    },
    {
      label: 'Users Served',
      value: 'Growing',
      icon: Users,
      gradient: 'from-teal-500 to-cyan-600',
      image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&q=80',
    },
  ]

  const values = [
    {
      icon: Target,
      title: 'Empowerment',
      description:
        'We empower businesses of all sizes to compete and win in the federal, state, and local marketplace — with clarity, speed, and confidence.',
      gradient: 'from-emerald-500 to-teal-600',
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80',
    },
    {
      icon: Shield,
      title: 'Privacy First',
      description:
        'We treat your search activity, saved opportunities, and business intel as sensitive data — built with privacy-first design and secure practices.',
      gradient: 'from-cyan-500 to-blue-600',
      image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&q=80',
    },
    {
      icon: Zap,
      title: 'Smart Intelligence',
      description:
        'We use modern analytics and AI to help you spot the right opportunities faster, prioritize your pipeline, and act before deadlines.',
      gradient: 'from-teal-500 to-cyan-600',
      image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80',
    },
    {
      icon: Heart,
      title: 'Inclusive Access',
      description:
        'Contractors at every stage deserve access to tools and guidance — from first bid to long-term growth.',
      gradient: 'from-emerald-500 to-cyan-600',
      image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80',
    },
  ]

  const whoWeServe = [
    {
      title: 'New Entrants',
      desc: 'Startups and small contractors looking for their first government contracts',
      icon: Sparkles,
      gradient: 'from-cyan-500 to-blue-600',
    },
    {
      title: 'Growing Businesses',
      desc: 'Companies with existing contracts seeking new opportunities',
      icon: Building2,
      gradient: 'from-emerald-500 to-teal-600',
    },
    {
      title: 'Certified & Set-Aside Firms',
      desc: 'VOSB, SDVOSB, 8(a), HUBZone, WOSB, and minority-owned firms',
      icon: Award,
      gradient: 'from-teal-500 to-cyan-600',
    },
  ]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: 'About PreciseGovCon',
    description: 'PreciseGovCon helps small businesses and SDVOSBs find, track, and win federal contracts with AI-powered tools.',
    url: 'https://www.precisegovcon.com/about',
    isPartOf: {
      '@type': 'WebSite',
      name: 'PreciseGovCon',
      url: 'https://www.precisegovcon.com',
    },
    about: {
      '@type': 'Organization',
      name: 'PreciseGovCon',
      url: 'https://www.precisegovcon.com',
    },
  }

  return (
    <main
      className="min-h-screen relative overflow-x-hidden"
      style={{ background: 'var(--color-bg)', color: 'var(--color-text-primary)' }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="relative z-10">
        {/* Hero Section */}
        <section className="pt-10 pb-4 md:pt-12 md:pb-6">
          <div className="mx-auto w-full max-w-480 px-3 sm:px-4 lg:px-6 xl:px-8">

            {/* Hero heading — all inline, same line */}
            <h1 className="text-4xl sm:text-5xl xl:text-6xl font-black mb-5 leading-[1.05] animate-fade-in">
              <span style={{ color: 'var(--color-text-primary)' }}>Precise GovCon · About — </span>
              <span className="bg-linear-to-r from-emerald-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
                Government Contracting —
              </span>{' '}
              <span className="bg-linear-to-r from-cyan-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Made Searchable. Actionable. Winnable.
              </span>
            </h1>

            {/* Row 3: subtext — full width, bold */}
            <p className="text-xl font-bold leading-relaxed mb-10" style={{ color: 'var(--color-text-secondary)' }}>
              Whether you&apos;re a small business, established contractor, or just getting started —{' '}
              <span style={{ color: 'var(--color-accent-sky)', fontWeight: 900 }}>Precise GovCon</span>{' '}
              helps you discover and win federal, state, and local government contracts.
            </p>


          </div>
        </section>

        {/* Values Section - 2x2 Grid with Images */}
        <section className="pt-6 pb-14 md:pt-8 md:pb-16">
          <div className="mx-auto w-full max-w-480 px-3 sm:px-4 lg:px-6 xl:px-8">
            <div className="text-center mb-6">
              <h2 className="text-5xl font-black mb-2" style={{ color: 'var(--color-text-primary)' }}>
                <span className="bg-linear-to-r from-emerald-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">Our Core Values</span>
              </h2>
              <p className="text-xl" style={{ color: 'var(--color-text-secondary)' }}>The principles that guide everything we do</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {values.map((value) => {
                const Icon = value.icon
                return (
                  <div
                    key={value.title}
                    className="group relative overflow-hidden rounded-3xl hover:scale-[1.02] transition-all duration-500 flex flex-col justify-end"
                    style={{ minHeight: '320px' }}
                  >
                    <div className="absolute inset-0">
                      <img src={value.image} alt={value.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.88) 55%, rgba(0,0,0,0.15) 100%)' }} />
                    </div>
                    <div className="relative p-8 pt-6">
                      <div className={`inline-flex items-center justify-center w-14 h-14 bg-linear-to-br ${value.gradient} rounded-2xl mb-4 shadow-2xl group-hover:scale-110 transition-transform`}>
                        <Icon className="w-7 h-7 text-white" aria-hidden="true" />
                      </div>
                      <h3 className="text-2xl font-black mb-3" style={{ color: 'white' }}>{value.title}</h3>
                      <p className="leading-relaxed text-base" style={{ color: 'rgba(255,255,255,0.9)' }}>{value.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-14 md:py-16" style={{ background: 'var(--color-surface-muted)' }}>
          <div className="mx-auto w-full max-w-480 px-3 sm:px-4 lg:px-6 xl:px-8">
            <div className="rounded-3xl p-8 md:p-12 border" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
              <div className="flex items-center gap-4 mb-8">
                <div className="p-4 rounded-2xl" style={{ background: 'color-mix(in srgb, var(--color-primary) 15%, transparent)' }}>
                  <Target className="w-10 h-10 text-emerald-400" aria-hidden="true" />
                </div>
                <h2 className="text-4xl font-black" style={{ color: 'var(--color-text-primary)' }}>Our Mission</h2>
              </div>

              <p className="text-xl leading-relaxed mb-6" style={{ color: 'var(--color-text-secondary)' }}>
                Precise GovCon is dedicated to helping businesses of all sizes navigate the complex world of government contracting. We believe that
                <span className="text-cyan-400 font-bold"> every qualified contractor</span> should have access to opportunities at the federal, state, and local levels.
              </p>

              <p className="text-xl leading-relaxed mb-8" style={{ color: 'var(--color-text-secondary)' }}>
                Based in <span className="text-emerald-400 font-bold">Virginia</span>, we combine analytics expertise with modern technology to bring you real-time intelligence,
                AI-powered matching, and comprehensive tools that level the playing field in government contracting.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex items-start gap-3 p-4 rounded-xl transition-all" style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--color-border)' }}>
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 mt-1 shrink-0" aria-hidden="true" />
                  <div>
                    <h4 className="font-black mb-1 text-lg" style={{ color: 'var(--color-text-primary)' }}>Real-Time Intelligence</h4>
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Live updates from SAM.gov and state procurement systems</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-xl transition-all" style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--color-border)' }}>
                  <CheckCircle2 className="w-6 h-6 text-cyan-500 mt-1 shrink-0" aria-hidden="true" />
                  <div>
                    <h4 className="font-black mb-1 text-lg" style={{ color: 'var(--color-text-primary)' }}>AI-Powered Matching</h4>
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Smart recommendations based on your capabilities</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-xl transition-all" style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--color-border)' }}>
                  <CheckCircle2 className="w-6 h-6 text-teal-500 mt-1 shrink-0" aria-hidden="true" />
                  <div>
                    <h4 className="font-black mb-1 text-lg" style={{ color: 'var(--color-text-primary)' }}>Set-Asides & Filters</h4>
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Filter for VOSB, SDVOSB, 8(a), HUBZone, WOSB, and more</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 rounded-xl transition-all" style={{ background: 'var(--color-surface-muted)', border: '1px solid var(--color-border)' }}>
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 mt-1 shrink-0" aria-hidden="true" />
                  <div>
                    <h4 className="font-black mb-1 text-lg" style={{ color: 'var(--color-text-primary)' }}>Contractor-First Support</h4>
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Guidance built for the realities of bidding and proposal timelines</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Who We Serve */}
        <section className="py-14 md:py-16" style={{ background: 'var(--color-surface-muted)' }}>
          <div className="mx-auto w-full max-w-480 px-3 sm:px-4 lg:px-6 xl:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-black mb-4" style={{ color: 'var(--color-text-primary)' }}>Who We Serve</h2>
              <p className="text-xl" style={{ color: 'var(--color-text-secondary)' }}>Contractors across industries and experience levels</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {whoWeServe.map((group) => {
                const Icon = group.icon
                return (
                  <div
                    key={group.title}
                    className="group rounded-3xl p-8 hover:scale-105 transition-all text-center"
                    style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                  >
                    <div
                      className={`inline-flex items-center justify-center w-14 h-14 bg-linear-to-br ${group.gradient} rounded-2xl mb-4 shadow-xl group-hover:scale-110 transition-transform`}
                    >
                      <Icon className="w-7 h-7 text-white" aria-hidden="true" />
                    </div>
                    <h3 className="text-2xl font-black mb-3" style={{ color: 'var(--color-text-primary)' }}>{group.title}</h3>
                    <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{group.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-20">
          <div className="mx-auto w-full max-w-480 px-3 sm:px-4 lg:px-6 xl:px-8">
            <div className="text-center max-w-6xl mx-auto">
            <h2 className="text-5xl md:text-6xl font-black mb-6" style={{ color: 'var(--color-text-primary)' }}>
              <span className="bg-linear-to-r from-emerald-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">Ready to Get Started?</span>
            </h2>

            <p className="text-2xl mb-10 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              Start building a smarter pipeline — discover, qualify, track, and act on the right opportunities.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
              <Link
                href="/search"
                className="group relative px-10 py-5 bg-linear-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 text-white font-black text-xl rounded-2xl shadow-2xl shadow-emerald-500/50 hover:shadow-emerald-500/70 transition-all hover:scale-105 overflow-hidden"
              >
                <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <span className="relative flex items-center gap-3">
                  <Search className="w-6 h-6" aria-hidden="true" />
                  Start Searching Contracts
                  <ChevronRight className="w-6 h-6" aria-hidden="true" />
                </span>
              </Link>

              <a
                href="mailto:support@precisegovcon.com?subject=Precise%20GovCon%20Inquiry"
                className="group px-10 py-5 font-black text-xl rounded-2xl transition-all hover:scale-105"
                style={{ background: 'var(--color-surface)', border: '2px solid var(--color-border)', color: 'var(--color-text-primary)' }}
              >
                <span className="flex items-center gap-3">
                  <Mail className="w-6 h-6 text-cyan-400" aria-hidden="true" />
                  Contact Us
                </span>
              </a>
            </div>

            <div className="mt-10 flex items-center justify-center gap-3 text-base" style={{ color: 'var(--color-text-secondary)' }}>
              <Clock className="w-5 h-5 text-cyan-400" aria-hidden="true" />
              <span className="font-medium">Mon–Fri • 9am–5pm ET</span>
            </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-14 md:py-16" style={{ background: 'var(--color-surface-muted)' }}>
          <div className="mx-auto w-full max-w-480 px-3 sm:px-4 lg:px-6 xl:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat, idx) => {
                const Icon = stat.icon
                return (
                  <div
                    key={stat.label}
                    className="group relative overflow-hidden rounded-3xl hover:scale-105 transition-all duration-500 animate-slide-up"
                    style={{ animationDelay: `${idx * 0.1}s`, minHeight: '180px' }}
                  >
                    <div className="absolute inset-0">
                      <img src={stat.image} alt={stat.label} className="w-full h-full object-cover" />
                      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.80) 50%, rgba(0,0,0,0.20) 100%)' }} />
                    </div>
                    <div className="relative flex flex-col items-center justify-end h-full p-5" style={{ minHeight: '180px' }}>
                      <div className={`w-10 h-10 rounded-xl bg-linear-to-br ${stat.gradient} flex items-center justify-center mb-2 shadow-xl group-hover:scale-110 transition-transform`}>
                        <Icon className="w-5 h-5 text-white" aria-hidden="true" />
                      </div>
                      <div className="text-3xl font-black mb-0.5" style={{ color: 'white' }}>{stat.value}</div>
                      <div className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.85)' }}>{stat.label}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 1s ease-out forwards;
        }
        .animate-slide-up {
          animation: slide-up 1s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </main>
  )
}
