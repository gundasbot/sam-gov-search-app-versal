'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Search, LayoutDashboard, Bell, User, TrendingUp, Link2,
  ChevronRight, Loader2, FileText, Shield, BookOpen, Target,
  ExternalLink, Zap, Award,
} from 'lucide-react'

const quickActions = [
  {
    icon: Search,
    label: 'Search Contracts',
    href: '/search',
    desc: 'Search open, renewing, and re-compete SAM.gov opportunities by NAICS, keywords, agency, or set-aside.',
    cta: 'Start searching',
    color: '#f97316',
    bg: 'rgba(249,115,22,0.08)',
    border: 'rgba(249,115,22,0.2)',
  },
  {
    icon: LayoutDashboard,
    label: 'My Dashboard',
    href: '/dashboard',
    desc: 'View saved searches, AI match scores, upcoming deadlines, and your full opportunity pipeline.',
    cta: 'Open dashboard',
    color: '#16a34a',
    bg: 'rgba(22,163,74,0.08)',
    border: 'rgba(22,163,74,0.2)',
  },
  {
    icon: Bell,
    label: 'Alerts & Searches',
    href: '/alerts',
    desc: 'Automate email alerts for new contracts matching your NAICS codes, PSC codes, and keywords.',
    cta: 'Manage alerts',
    color: '#2563eb',
    bg: 'rgba(37,99,235,0.08)',
    border: 'rgba(37,99,235,0.2)',
  },
  {
    icon: TrendingUp,
    label: 'Insights',
    href: '/insights',
    desc: 'Agency spend trends, win rate analytics, opportunity pipeline analytics, and market intelligence.',
    cta: 'View insights',
    color: '#7c3aed',
    bg: 'rgba(124,58,237,0.08)',
    border: 'rgba(124,58,237,0.2)',
  },
  {
    icon: Link2,
    label: 'Gov Resources',
    href: '/gov-links',
    desc: 'Quick links to SAM.gov, SBA, USASpending, DSBS, GSA eLibrary, NAICS codes, and federal procurement sites.',
    cta: 'View resources',
    color: '#0891b2',
    bg: 'rgba(8,145,178,0.08)',
    border: 'rgba(8,145,178,0.2)',
  },
  {
    icon: User,
    label: 'My Account',
    href: '/account',
    desc: 'Manage your profile, subscription, billing, and business registration details.',
    cta: 'View account',
    color: '#64748b',
    bg: 'rgba(100,116,139,0.08)',
    border: 'rgba(100,116,139,0.2)',
  },
]

const featureSections = [
  {
    icon: Search,
    title: 'Search & Discovery',
    desc: 'Form-fill and keyword searches to find open, renewing, and re-compete federal contract opportunities. Filter by NAICS, PSC, agency, set-aside, state, and contract value. View Government contacts, award history, top primes, and business profiles.',
  },
  {
    icon: Bell,
    title: 'Alerts & Automation',
    desc: 'Configure saved searches and automated daily or weekly email alerts for new solicitations matching your profile. Edit frequency, manage multiple alert sets, and troubleshoot delivery from a central hub.',
  },
  {
    icon: LayoutDashboard,
    title: 'Dashboard & Pipeline',
    desc: 'Access your business profile, NAICS and PSC codes, saved searches, and quick-search queries. Monitor upcoming deadlines, track saved opportunities, and view AI match scores for opportunities ranked by fit.',
  },
  {
    icon: Zap,
    title: 'AI Match Scoring',
    desc: 'Every opportunity in search results and your pipeline is scored by AI based on your business profile, certifications, historical wins, NAICS codes, and geographic focus — so you know where to spend your BD time.',
  },
  {
    icon: TrendingUp,
    title: 'Insights & Analytics',
    desc: 'View agency spend trends, opportunity pipeline analytics, and market intelligence. Understand which agencies award the most contracts in your space and track your win rates over time.',
  },
  {
    icon: Link2,
    title: 'Government Resources',
    desc: 'Pre-populated quick links to SAM.gov, SBA.gov, USASpending, DSBS, GSA eLibrary, NAICS codes, PSC codes, HUBZone maps, DFARS, and FAR reports — everything a government contractor needs in one place.',
  },
  {
    icon: FileText,
    title: 'Documents & Templates',
    desc: 'Access government contracting document templates: capability statements, FOIA request templates, prime contractor phone scripts, agency introduction emails, and proposal support tools.',
    badge: 'Coming Soon',
  },
  {
    icon: Award,
    title: 'Set-Aside Certifications',
    desc: 'Guidance on 8(a), SDVOSB, HUBZone, WOSB/EDWOSB, and other small business set-aside programs. Understand which certifications fit your business and how to pursue them.',
    href: '/services/set-aside-certifications',
  },
]

export default function HomePage() {
  const { data: session, status } = useSession()
  const firstName = (session?.user?.name ?? '').split(' ')[0] || 'there'

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
      </div>
    )
  }

  return (
    <main className="min-h-screen" style={{ background: '#f8fafc' }}>
      {/* Header bar */}
      <div style={{ background: '#0f172a', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/precise-govcon-logo.jpg" alt="Precise GovCon" width={36} height={36} className="rounded-lg" />
            <div>
              <div className="font-black text-base text-white leading-none">Precise GovCon</div>
              <div className="text-xs font-medium mt-0.5" style={{ color: '#64748b' }}>Government Contracting Intelligence</div>
            </div>
          </div>
          <Link
            href="/account"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:bg-white/10"
            style={{ color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            {session?.user?.email}
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">

        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-black" style={{ color: '#0f172a' }}>
            Welcome, {firstName}
          </h1>
          <p className="mt-1.5 text-base font-medium" style={{ color: '#64748b' }}>
            Contracting intelligence and procurement experts. Choose a section below to get started.
          </p>
        </div>

        {/* Quick action cards — 3-col grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {quickActions.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex flex-col rounded-xl p-5 transition-all hover:shadow-lg hover:-translate-y-0.5"
                style={{ background: '#ffffff', border: `1.5px solid ${item.border}` }}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: item.bg, border: `1px solid ${item.border}` }}
                  >
                    <Icon className="h-6 w-6" style={{ color: item.color }} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-base" style={{ color: '#0f172a' }}>{item.label}</div>
                  </div>
                </div>
                <p className="text-sm leading-relaxed flex-1" style={{ color: '#475569' }}>{item.desc}</p>
                <div
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold group-hover:gap-2.5 transition-all"
                  style={{ color: item.color }}
                >
                  {item.cta} <ChevronRight className="h-4 w-4" />
                </div>
              </Link>
            )
          })}
        </div>

        {/* Feature overview — SelectGCR-style list */}
        <div style={{ borderTop: '1.5px solid #e2e8f0' }} className="pt-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: '#f97316' }}>
              <span className="text-white font-black text-xs">P</span>
            </div>
            <h2 className="text-sm font-black uppercase tracking-wider" style={{ color: '#f97316' }}>
              Product Features
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
            {featureSections.map((section) => {
              const Icon = section.icon
              const content = (
                <div className="flex gap-3">
                  <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: '#f97316' }} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-black text-sm" style={{ color: '#0f172a' }}>{section.title}</span>
                      {section.badge && (
                        <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: '#f1f5f9', color: '#64748b' }}>
                          {section.badge}
                        </span>
                      )}
                      {section.href && (
                        <ExternalLink className="h-3 w-3 flex-shrink-0" style={{ color: '#94a3b8' }} />
                      )}
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>{section.desc}</p>
                  </div>
                </div>
              )

              return section.href ? (
                <Link key={section.title} href={section.href} className="group hover:opacity-80 transition-opacity">
                  {content}
                </Link>
              ) : (
                <div key={section.title}>{content}</div>
              )
            })}
          </div>
        </div>

        {/* Contact us strip */}
        <div className="mt-12 rounded-xl p-5 flex items-center justify-between gap-4" style={{ background: '#0f172a' }}>
          <div>
            <div className="font-bold text-white text-sm">Need help getting started?</div>
            <div className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>Our team specializes in federal contracting — no question is too big or too small.</div>
          </div>
          <Link
            href="/support"
            className="flex-shrink-0 inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition-all hover:opacity-90"
            style={{ background: '#f97316', color: '#ffffff' }}
          >
            Contact Support <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

      </div>
    </main>
  )
}
