'use client'

import Link from 'next/link'
import Script from 'next/script'
import {
  Clock,
  Target,
  Search,
  Globe,
  Award,
  ArrowUpRight,
  Shield,
  TrendingUp,
  Users,
  Zap,
  BarChart3,
  Bell,
  FileText,
  Filter,
  ChevronRight,
  Database,
  RefreshCw,
  Lock,
  Sparkles,
  MessageSquare,
  Calendar,
  DollarSign,
  Building2,
  MapPin,
  CheckCircle2,
} from 'lucide-react'

export default function FeaturesPage() {
  const coreFeatures = [
    {
      icon: RefreshCw,
      title: 'Real-Time SAM.gov Integration',
      description: 'Live data feed directly from SAM.gov',
      details: [
        'Instant updates as opportunities are posted',
        'Auto-refresh every 15 minutes',
        'Live ticker showing newest contracts',
        'Zero delay between posting and notification',
      ],
      color: 'emerald',
      gradient: 'from-emerald-500 to-teal-500',
    },
    {
      icon: Sparkles,
      title: 'AI-Powered Smart Matching',
      description: 'Intelligent recommendations based on your profile',
      details: [
        'Analyzes your NAICS codes and capabilities',
        'Learns from your saved searches',
        'Scores opportunities by relevance',
        'Surfaces hidden gems you might miss',
      ],
      color: 'cyan',
      gradient: 'from-cyan-500 to-blue-500',
    },
    {
      icon: Filter,
      title: 'Advanced Multi-Filter Search',
      description: 'Powerful search with unlimited combinations',
      details: [
        'Filter by NAICS, PSC, agency, location',
        'Set-aside type filtering (SDVOSB, 8(a), etc.)',
        'Contract value ranges',
        'Date ranges and deadlines',
        'Combine multiple filters at once',
      ],
      color: 'purple',
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      icon: Globe,
      title: 'Federal + State Coverage',
      description: 'All government levels in one platform',
      details: [
        'Federal opportunities from SAM.gov',
        'State procurement systems (eVA, eMMA, etc.)',
        'Local government contracts',
        'Unified search across all sources',
      ],
      color: 'orange',
      gradient: 'from-orange-500 to-amber-500',
    },
    {
      icon: Bell,
      title: 'Custom Alert System',
      description: 'Never miss the perfect opportunity',
      details: [
        'Email and SMS notifications',
        'Custom alert criteria',
        'Instant alerts for urgent opportunities',
        'Daily digest summaries',
      ],
      color: 'teal',
      gradient: 'from-teal-500 to-emerald-500',
    },
    {
      icon: BarChart3,
      title: 'Interactive Analytics Dashboard',
      description: 'Visualize trends and track your pipeline',
      details: [
        'Opportunity volume by agency',
        'Contract value trends',
        'Set-aside distribution charts',
        'Due date calendar views',
        'Custom date range filtering (7D, 30D, 90D)',
      ],
      color: 'blue',
      gradient: 'from-blue-500 to-indigo-500',
    },
  ]

  const businessFeatures = [
    {
      icon: Award,
      title: 'Set-Aside Specialization',
      description: 'Dedicated filters for all set-aside types',
      items: ['SDVOSB', 'VOSB', '8(a)', 'HUBZone', 'WOSB', 'EDWOSB', 'Small Business'],
    },
    {
      icon: Building2,
      title: 'Agency Intelligence',
      description: 'Track spending and opportunities by agency',
      items: ['Top agencies dashboard', 'Historical spending data', 'Agency-specific trends', 'Direct links to agency portals'],
    },
    {
      icon: MapPin,
      title: 'Geographic Targeting',
      description: 'Find opportunities in your service area',
      items: ['Filter by state', 'Place of performance tracking', 'Multi-state coverage', 'Local preferences identification'],
    },
    {
      icon: DollarSign,
      title: 'Contract Value Tracking',
      description: 'Focus on opportunities in your range',
      items: ['Total value visualization', 'Value range filters', 'Estimated award amounts', 'Budget trend analysis'],
    },
    {
      icon: Calendar,
      title: 'Deadline Management',
      description: 'Stay on top of critical dates',
      items: ['Due date tracking', 'Response deadline alerts', 'Q&A deadline notifications', 'Proposal submission reminders'],
    },
    {
      icon: Database,
      title: 'NAICS & PSC Intelligence',
      description: 'Industry code-based discovery',
      items: ['NAICS code search', 'PSC code filtering', 'Industry trend analysis', 'Code recommendation engine'],
    },
  ]

  const platformFeatures = [
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Bank-level security and compliance',
    },
    {
      icon: Lock,
      title: 'Data Privacy',
      description: 'Your searches and data stay private',
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Share opportunities with your team',
    },
    {
      icon: MessageSquare,
      title: 'Expert Support',
      description: 'Federal contracting experts on call',
    },
    {
      icon: FileText,
      title: 'Document Library',
      description: 'Store capability statements & certs',
    },
    {
      icon: TrendingUp,
      title: 'Win Rate Tracking',
      description: 'Measure your success over time',
    },
  ]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Precise GovCon Features',
    description:
      'Explore Precise GovCon features: real-time SAM.gov integration, AI-powered matching, multi-filter search, alerts, analytics, and federal/state coverage.',
    url: 'https://precisegovcon.com/features',
    isPartOf: {
      '@type': 'WebSite',
      name: 'Precise GovCon',
      url: 'https://precisegovcon.com',
    },
  }

  return (
    <main
      className="min-h-screen pt-8 relative overflow-hidden"
      style={{
        background: 'var(--color-surface)',
        color: 'var(--color-text-primary)',
      }}
    >
      <Script id="precisegovcon-features-jsonld" type="application/ld+json" strategy="afterInteractive">
        {JSON.stringify(jsonLd)}
      </Script>

      {/* Animated background elements (matches /login) */}
      {/* Remove fixed color blobs for theme consistency, or replace with theme-aware variables if needed */}

      {/* Grid pattern overlay */}
      {/* Remove fixed grid overlay or make theme-aware if needed */}

      {/* Hero Section */}
      <section
        className="relative z-10 pt-24 pb-16 px-6"
        style={{ background: 'var(--color-surface)' }}
      >
        <div className="max-w-7xl mx-auto text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
            style={{
              background: 'var(--color-surface-muted)',
              border: '1px solid var(--color-border-card)',
            }}
          >
            <Zap className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-semibold text-emerald-300">Complete Feature Suite</span>
          </div>

          <h1
            className="text-5xl md:text-6xl font-black mb-6"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Everything You Need
            <br />
            To Win Government Contracts
          </h1>

          <p
            className="text-xl max-w-3xl mx-auto mb-8 leading-relaxed"
            style={{ color: 'var(--color-text-body)' }}
          >
            From real-time opportunity discovery to AI-powered matching and advanced analytics — Precise GovCon provides a complete toolkit
            for federal contractors and growing teams.
          </p>

          <Link
            href="/search"
            className="inline-flex items-center gap-2 px-8 py-4 font-bold text-lg rounded-xl transition-all hover:scale-105"
            style={{
              background: 'var(--color-accent)',
              color: 'var(--color-on-accent)',
              boxShadow: '0 3px 14px var(--color-shadow-card)',
            }}
          >
            <Search className="w-5 h-5" />
            Try It Now
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Core Features - Detailed Cards */}
      <section
        className="relative z-10 py-16 px-6"
        style={{ background: 'var(--color-surface)' }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2
              className="text-3xl md:text-4xl font-bold mb-4"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Core Platform Features
            </h2>
            <p className="text-lg" style={{ color: 'var(--color-text-body)' }}>
              Powerful tools that give you the competitive edge
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {coreFeatures.map((feature, index) => (
              <div
                key={feature.title}
                className="group relative backdrop-blur-xl border rounded-2xl p-8 transition-all duration-300"
                style={{
                  background: 'var(--color-surface-card)',
                  border: '1.5px solid var(--color-border-card)',
                  color: 'var(--color-text-primary)',
                  animationDelay: `${index * 100}ms`,
                }}
              >
                {/* Icon with gradient background */}
                <div
                  className={`inline-flex items-center justify-center w-16 h-16 bg-linear-to-br ${feature.gradient} rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}
                >
                  <feature.icon className="w-8 h-8 text-white" />
                </div>

                <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>{feature.title}</h3>
                <p className="mb-4" style={{ color: 'var(--color-text-body)' }}>{feature.description}</p>

                <ul className="space-y-2">
                  {feature.details.map((detail) => (
                    <li key={detail} className="flex items-start gap-2 text-sm" style={{ color: 'var(--color-text-body)' }}>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>

                {/* Hover gradient border effect */}
                <div
                  className={`absolute inset-0 rounded-2xl bg-linear-to-r ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none`}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Business Intelligence Features */}
      <section
        className="relative z-10 py-16 px-6"
        style={{ background: 'var(--color-surface-muted)' }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2
              className="text-3xl md:text-4xl font-bold mb-4"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Business Intelligence Tools
            </h2>
            <p className="text-lg" style={{ color: 'var(--color-text-body)' }}>
              Data-driven insights to guide your strategy
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {businessFeatures.map((feature) => (
              <div
                key={feature.title}
                className="backdrop-blur-xl border rounded-xl p-6 transition-all"
                style={{
                  background: 'var(--color-surface-card)',
                  border: '1.5px solid var(--color-border-card)',
                  color: 'var(--color-text-primary)',
                }}
              >
                <div className="inline-flex items-center justify-center w-12 h-12 bg-linear-to-br from-cyan-500/20 to-emerald-500/20 rounded-xl mb-4">
                  <feature.icon className="w-6 h-6 text-cyan-400" />
                </div>
                <h4 className="text-lg font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>{feature.title}</h4>
                <p className="text-sm mb-4" style={{ color: 'var(--color-text-body)' }}>{feature.description}</p>
                <ul className="space-y-1.5">
                  {feature.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-body)' }}>
                      <div className="w-1 h-1 bg-emerald-400 rounded-full" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Features Grid */}
      <section
        className="relative z-10 py-16 px-6"
        style={{ background: 'var(--color-surface)' }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2
              className="text-3xl md:text-4xl font-bold mb-4"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Platform Capabilities
            </h2>
            <p className="text-lg" style={{ color: 'var(--color-text-body)' }}>
              Enterprise-grade features for serious contractors
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {platformFeatures.map((feature) => (
              <div
                key={feature.title}
                className="group backdrop-blur-xl border rounded-xl p-6 transition-all text-center"
                style={{
                  background: 'var(--color-surface-card)',
                  border: '1.5px solid var(--color-border-card)',
                  color: 'var(--color-text-primary)',
                }}
              >
                <div className="inline-flex items-center justify-center w-12 h-12 bg-linear-to-br from-emerald-500/20 to-cyan-500/20 rounded-xl mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-emerald-300" />
                </div>
                <h4 className="text-lg font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>{feature.title}</h4>
                <p className="text-sm" style={{ color: 'var(--color-text-body)' }}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison */}
      <section
        className="relative z-10 py-16 px-6"
        style={{ background: 'var(--color-surface-muted)' }}
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2
              className="text-3xl md:text-4xl font-bold mb-4"
              style={{ color: 'var(--color-text-primary)' }}
            >
              Why Precise GovCon Stands Out
            </h2>
            <p style={{ color: 'var(--color-text-body)' }}>
              Built for contractors who need speed, coverage, and clarity — not another spreadsheet.
            </p>
          </div>

          <div
            className="backdrop-blur-xl border rounded-2xl overflow-hidden"
            style={{
              background: 'var(--color-surface-card)',
              border: '1.5px solid var(--color-border-card)',
              color: 'var(--color-text-primary)',
            }}
          >
            <div className="grid grid-cols-3 gap-px bg-slate-700/30">
              {/* Header */}
              <div className="bg-slate-900 p-4">
                <div className="font-bold text-white">Feature</div>
              </div>
              <div className="bg-slate-900 p-4 text-center">
                <div className="font-bold text-slate-400">Other Tools</div>
              </div>
              <div className="bg-slate-900 p-4 text-center">
                <div className="font-bold text-emerald-400">Precise GovCon</div>
              </div>

              {/* Rows */}
              {[
                ['Real-time SAM.gov Data', false, true],
                ['State Procurement Systems', false, true],
                ['AI-Powered Matching', false, true],
                ['Interactive Dashboard', false, true],
                ['Unlimited Searches', false, true],
                ['Custom Alerts', true, true],
                ['Mobile Responsive', true, true],
                ['Expert Support', false, true],
              ].map(([feature, other, precise], idx) => (
                <div key={idx} className="contents">
                  <div className="bg-slate-900/80 p-4 text-slate-300 text-sm">{feature}</div>
                  <div className="bg-slate-900/80 p-4 text-center">
                    {other ? <CheckCircle2 className="w-5 h-5 text-slate-500 mx-auto" /> : <X className="w-5 h-5 text-red-400 mx-auto" />}
                  </div>
                  <div className="bg-slate-900/80 p-4 text-center">
                    {precise && <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto" />}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-start gap-3 bg-slate-900/40 border border-slate-700/40 rounded-xl p-4">
              <Zap className="w-5 h-5 text-emerald-400 mt-0.5" />
              <div>
                <div className="text-white font-semibold">Faster discovery</div>
                <div className="text-slate-400">Live updates + saved searches keep you ahead of competitors.</div>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-slate-900/40 border border-slate-700/40 rounded-xl p-4">
              <Target className="w-5 h-5 text-cyan-400 mt-0.5" />
              <div>
                <div className="text-white font-semibold">Better fit</div>
                <div className="text-slate-400">AI scoring helps prioritize what to bid and what to skip.</div>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-slate-900/40 border border-slate-700/40 rounded-xl p-4">
              <Shield className="w-5 h-5 text-teal-400 mt-0.5" />
              <div>
                <div className="text-white font-semibold">Built for teams</div>
                <div className="text-slate-400">Share, collaborate, and track wins without tool sprawl.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            <span className="bg-linear-to-r from-emerald-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">Ready to Get Started?</span>
          </h2>
          <p className="text-xl text-slate-300 mb-8">Start discovering federal opportunities with a platform designed for speed and clarity.</p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/search"
              className="group relative px-8 py-4 bg-linear-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 text-white font-bold text-lg rounded-xl shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all hover:scale-105 overflow-hidden"
            >
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <span className="relative flex items-center gap-2">
                <Search className="w-5 h-5" />
                Start Searching Now
              </span>
            </Link>

            <Link
              href="/about"
              className="px-8 py-4 border-2 border-slate-600 hover:border-cyan-500/50 bg-linear-to-r from-slate-800/80 to-slate-900/80 hover:from-slate-800 hover:to-slate-900 text-white font-bold text-lg rounded-xl transition-all hover:scale-105"
            >
              Learn More About Us
            </Link>
          </div>

          <div className="mt-10 flex items-center justify-center gap-6 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-300" />
              <span>Secure by design</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-300" />
              <span>Federal + expanding state/local</span>
            </div>
            <div className="flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-teal-300" />
              <span>Built for busy bid teams</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

const X = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)
