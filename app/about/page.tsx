'use client'

import Image from 'next/image'
import Link from 'next/link'
import Script from 'next/script'
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
  Globe,
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
      title: 'About Us | Federal Contracting Tools | PreciseGovCon',
      description:
        'We empower businesses of all sizes to compete and win in the federal, state, and local marketplace — with clarity, speed, and confidence.',
      gradient: 'from-emerald-500 to-teal-600',
      image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80',
    },
    {
      icon: Shield,
      title: 'About Us | Federal Contracting Tools | PreciseGovCon',
      description:
        'We treat your search activity, saved opportunities, and business intel as sensitive data — built with privacy-first design and secure practices.',
      gradient: 'from-cyan-500 to-blue-600',
      image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&q=80',
    },
    {
      icon: Zap,
      title: 'About Us | Federal Contracting Tools | PreciseGovCon',
      description:
        'We use modern analytics and AI to help you spot the right opportunities faster, prioritize your pipeline, and act before deadlines.',
      gradient: 'from-teal-500 to-cyan-600',
      image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80',
    },
    {
      icon: Heart,
      title: 'About Us | Federal Contracting Tools | PreciseGovCon',
      description:
        'Contractors at every stage deserve access to tools and guidance — from first bid to long-term growth.',
      gradient: 'from-emerald-500 to-cyan-600',
      image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80',
    },
  ]

  const whoWeServe = [
    {
      title: 'About Us | Federal Contracting Tools | PreciseGovCon',
      desc: 'Startups and small contractors looking for their first government contracts',
      icon: Sparkles,
      gradient: 'from-cyan-500 to-blue-600',
    },
    {
      title: 'About Us | Federal Contracting Tools | PreciseGovCon',
      desc: 'Companies with existing contracts seeking new opportunities',
      icon: Building2,
      gradient: 'from-emerald-500 to-teal-600',
    },
    {
      title: 'About Us | Federal Contracting Tools | PreciseGovCon',
      desc: 'VOSB, SDVOSB, 8(a), HUBZone, WOSB, and minority-owned firms',
      icon: Award,
      gradient: 'from-teal-500 to-cyan-600',
    },
  ]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: 'About Precise GovCon',
    description: 'PreciseGovCon helps small businesses and SDVOSBs find, track, and win federal contracts with AI-powered tools.',
    url: 'https://precisegovcon.com/about',
    isPartOf: {
      '@type': 'WebSite',
      name: 'Precise GovCon',
      url: 'https://precisegovcon.com',
    },
    about: {
      '@type': 'Organization',
      name: 'Precise GovCon',
      url: 'https://precisegovcon.com',
    },
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      <Script id="precisegovcon-about-jsonld" type="application/ld+json" strategy="afterInteractive">
        {JSON.stringify(jsonLd)}
      </Script>

      {/* Animated background elements (matches /login) */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: '1000ms' }}
        />
        <div
          className="absolute top-1/2 left-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: '2000ms' }}
        />
      </div>

      {/* Grid pattern overlay */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="relative z-10">
        {/* Hero Section */}
        <section className="pt-24 pb-12 px-6">
          <div className="max-w-7xl mx-auto text-center">
            <div className="inline-flex items-center gap-3 bg-emerald-500/10 border border-emerald-400/30 rounded-full px-6 py-2 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shadow-lg">
                <Globe className="w-6 h-6 text-white" aria-hidden="true" />
              </div>
              <span className="text-emerald-300 font-medium tracking-wide">PRECISE GOVCON • ABOUT</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-black mb-8 leading-tight animate-fade-in">
              <span className="block bg-gradient-to-r from-emerald-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent mb-3">
                Government Contracting
              </span>
              <span className="block bg-gradient-to-r from-cyan-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Made Searchable. Actionable. Winnable.
              </span>
            </h1>

            <p className="text-2xl text-slate-300 max-w-4xl mx-auto leading-relaxed mb-16">
              Whether you're a small business, established contractor, or just getting started —
              <span className="text-cyan-400 font-bold"> Precise GovCon</span> helps you discover and win federal, state, and local government contracts.
            </p>

            {/* Stats Grid - 2x2 with Images */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
              {stats.map((stat, idx) => {
                const Icon = stat.icon
                return (
                  <div
                    key={stat.label}
                    className="group relative overflow-hidden bg-slate-800/50 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 hover:scale-105 transition-all duration-500 animate-slide-up"
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    {/* Background Image */}
                    <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity">
                      <img src={stat.image} alt={stat.label} className="w-full h-full object-cover" />
                      <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} mix-blend-multiply`} />
                    </div>

                    <div className="relative flex flex-col items-center">
                      <div
                        className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center mb-4 shadow-xl group-hover:scale-110 transition-transform`}
                      >
                        <Icon className="w-7 h-7 text-white" aria-hidden="true" />
                      </div>
                      <div className="text-4xl font-black text-white mb-2">{stat.value}</div>
                      <div className="text-sm text-slate-300 font-bold">{stat.label}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-16 px-6 bg-gradient-to-r from-emerald-500/5 via-cyan-500/5 to-teal-500/5">
          <div className="max-w-5xl mx-auto">
            <div className="bg-gradient-to-br from-slate-800/70 to-slate-900/70 backdrop-blur-2xl border border-white/10 rounded-3xl p-10 md:p-14 hover:border-cyan-500/30 transition-all">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/30 to-teal-500/30 backdrop-blur-xl">
                  <Target className="w-10 h-10 text-emerald-400" aria-hidden="true" />
                </div>
                <h2 className="text-4xl font-black text-white">Our Mission</h2>
              </div>

              <p className="text-xl text-slate-300 leading-relaxed mb-6">
                Precise GovCon is dedicated to helping businesses of all sizes navigate the complex world of government contracting. We believe that
                <span className="text-cyan-400 font-bold"> every qualified contractor</span> should have access to opportunities at the federal, state, and local levels.
              </p>

              <p className="text-xl text-slate-300 leading-relaxed mb-8">
                Based in <span className="text-emerald-400 font-bold">Virginia</span>, we combine analytics expertise with modern technology to bring you real-time intelligence,
                AI-powered matching, and comprehensive tools that level the playing field in government contracting.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex items-start gap-3 p-4 bg-white/5 rounded-xl backdrop-blur-xl hover:bg-white/10 transition-all">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 mt-1 flex-shrink-0" aria-hidden="true" />
                  <div>
                    <h4 className="font-black text-white mb-1 text-lg">Real-Time Intelligence</h4>
                    <p className="text-sm text-slate-400">Live updates from SAM.gov and state procurement systems</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-white/5 rounded-xl backdrop-blur-xl hover:bg-white/10 transition-all">
                  <CheckCircle2 className="w-6 h-6 text-cyan-400 mt-1 flex-shrink-0" aria-hidden="true" />
                  <div>
                    <h4 className="font-black text-white mb-1 text-lg">AI-Powered Matching</h4>
                    <p className="text-sm text-slate-400">Smart recommendations based on your capabilities</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-white/5 rounded-xl backdrop-blur-xl hover:bg-white/10 transition-all">
                  <CheckCircle2 className="w-6 h-6 text-teal-400 mt-1 flex-shrink-0" aria-hidden="true" />
                  <div>
                    <h4 className="font-black text-white mb-1 text-lg">Set-Asides & Filters</h4>
                    <p className="text-sm text-slate-400">Filter for VOSB, SDVOSB, 8(a), HUBZone, WOSB, and more</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 bg-white/5 rounded-xl backdrop-blur-xl hover:bg-white/10 transition-all">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 mt-1 flex-shrink-0" aria-hidden="true" />
                  <div>
                    <h4 className="font-black text-white mb-1 text-lg">Contractor-First Support</h4>
                    <p className="text-sm text-slate-400">Guidance built for the realities of bidding and proposal timelines</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section - 2x2 Grid with Images */}
        <section className="py-16 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-5xl font-black text-white mb-4">
                <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">Our Core Values</span>
              </h2>
              <p className="text-xl text-slate-400">The principles that guide everything we do</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {values.map((value) => {
                const Icon = value.icon
                return (
                  <div
                    key={value.title}
                    className="group relative overflow-hidden bg-slate-800/50 backdrop-blur-2xl border border-white/10 rounded-3xl p-10 hover:border-cyan-500/30 hover:scale-[1.02] transition-all duration-500"
                  >
                    {/* Background Image */}
                    <div className="absolute inset-0 opacity-15 group-hover:opacity-20 transition-opacity">
                      <img src={value.image} alt={value.title} className="w-full h-full object-cover" />
                      <div className={`absolute inset-0 bg-gradient-to-br ${value.gradient} mix-blend-multiply`} />
                    </div>

                    <div className="relative">
                      <div
                        className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${value.gradient} rounded-2xl mb-6 shadow-2xl group-hover:scale-110 transition-transform`}
                      >
                        <Icon className="w-8 h-8 text-white" aria-hidden="true" />
                      </div>

                      <h3 className="text-2xl font-black text-white mb-4">{value.title}</h3>
                      <p className="text-slate-300 leading-relaxed text-lg">{value.description}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* Who We Serve */}
        <section className="py-16 px-6 bg-gradient-to-r from-emerald-500/5 via-cyan-500/5 to-teal-500/5">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-black text-white mb-4">Who We Serve</h2>
              <p className="text-xl text-slate-400">Contractors across industries and experience levels</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {whoWeServe.map((group) => {
                const Icon = group.icon
                return (
                  <div
                    key={group.title}
                    className="group bg-slate-800/50 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 hover:border-cyan-500/30 hover:scale-105 transition-all text-center"
                  >
                    <div
                      className={`inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br ${group.gradient} rounded-2xl mb-4 shadow-xl group-hover:scale-110 transition-transform`}
                    >
                      <Icon className="w-7 h-7 text-white" aria-hidden="true" />
                    </div>
                    <h3 className="text-2xl font-black text-white mb-3">{group.title}</h3>
                    <p className="text-slate-400 leading-relaxed">{group.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-5xl md:text-6xl font-black text-white mb-6">
              <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">Ready to Get Started?</span>
            </h2>

            <p className="text-2xl text-slate-300 mb-10 leading-relaxed">
              Start building a smarter pipeline — discover, qualify, track, and act on the right opportunities.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
              <Link
                href="/search"
                className="group relative px-10 py-5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 text-white font-black text-xl rounded-2xl shadow-2xl shadow-emerald-500/50 hover:shadow-emerald-500/70 transition-all hover:scale-105 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <span className="relative flex items-center gap-3">
                  <Search className="w-6 h-6" aria-hidden="true" />
                  Start Searching Contracts
                  <ChevronRight className="w-6 h-6" aria-hidden="true" />
                </span>
              </Link>

              <a
                href="mailto:support@precisegovcon.com?subject=Precise%20GovCon%20Inquiry"
                className="group px-10 py-5 bg-white/10 hover:bg-white/20 backdrop-blur-xl border-2 border-white/20 hover:border-cyan-400/50 text-white font-black text-xl rounded-2xl transition-all hover:scale-105"
              >
                <span className="flex items-center gap-3">
                  <Mail className="w-6 h-6 text-cyan-400" aria-hidden="true" />
                  Contact Us
                </span>
              </a>
            </div>

            <div className="mt-10 flex items-center justify-center gap-3 text-base text-slate-400">
              <Clock className="w-5 h-5 text-cyan-400" aria-hidden="true" />
              <span className="font-medium">Mon–Fri • 9am–5pm ET</span>
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
