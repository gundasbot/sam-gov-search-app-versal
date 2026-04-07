// app/cookie-policy/CookiePolicyClient.tsx
'use client'

import Link from 'next/link'
import { Shield, BarChart3, Cookie, Settings, ArrowLeft, ExternalLink, Check } from 'lucide-react'

const LAST_UPDATED = 'March 20, 2026'
const CONTACT_EMAIL = 'privacy@precisegovcon.com'

const cookieTypes = [
  {
    icon: Shield,
    title: 'Strictly Necessary Cookies',
    badge: 'Always Active',
    badgeColor: '#15803d',
    badgeBg: '#dcfce7',
    badgeBorder: '#bbf7d0',
    iconBg: '#f0fdf4',
    iconColor: '#16a34a',
    description:
      'These cookies are essential for the platform to function and cannot be disabled. They are set in response to actions you take such as logging in, saving searches, or setting your privacy preferences.',
    examples: [
      { name: 'next-auth.session-token', purpose: 'Maintains your authenticated session securely', duration: 'Session / 30 days' },
      { name: 'cookie-consent', purpose: 'Stores your cookie preference selections', duration: '1 year' },
      { name: '__Host-next-auth.csrf-token', purpose: 'Prevents cross-site request forgery attacks', duration: 'Session' },
    ],
  },
  {
    icon: BarChart3,
    title: 'Analytics Cookies',
    badge: 'Optional',
    badgeColor: '#c2410c',
    badgeBg: '#fff7ed',
    badgeBorder: '#fed7aa',
    iconBg: '#fff7ed',
    iconColor: '#f97316',
    description:
      'These cookies help us understand how contractors use PreciseGovCon — which search filters are used most, which opportunity types get the most engagement, and where users encounter friction. All data is aggregated and anonymous.',
    examples: [
      { name: '_ga, _ga_*', purpose: 'Google Analytics — tracks page views, session duration, and feature usage', duration: '2 years' },
      { name: '_gid', purpose: 'Google Analytics — distinguishes users across sessions', duration: '24 hours' },
    ],
  },
  {
    icon: Settings,
    title: 'Preference Cookies',
    badge: 'Optional',
    badgeColor: '#c2410c',
    badgeBg: '#fff7ed',
    badgeBorder: '#fed7aa',
    iconBg: '#fff7ed',
    iconColor: '#f97316',
    description:
      "These cookies remember your platform settings so you don't have to reconfigure them each visit — including your selected NAICS codes, saved filter preferences, dashboard layout, and dark/light mode choice.",
    examples: [
      { name: 'pgc_prefs', purpose: 'Stores your NAICS code preferences and default search filters', duration: '6 months' },
      { name: 'pgc_theme', purpose: 'Remembers your dark/light mode preference', duration: '1 year' },
    ],
  },
  {
    icon: Cookie,
    title: 'Marketing Cookies',
    badge: 'Optional',
    badgeColor: '#c2410c',
    badgeBg: '#fff7ed',
    badgeBorder: '#fed7aa',
    iconBg: '#fff7ed',
    iconColor: '#f97316',
    description:
      'These cookies measure the effectiveness of our outreach to federal contractors and small businesses. They help us understand which channels bring contractors to the platform so we can improve marketing relevance.',
    examples: [
      { name: '_fbp', purpose: 'Facebook Pixel — measures ad campaign reach and conversions', duration: '3 months' },
      { name: 'li_fat_id', purpose: 'LinkedIn Insight Tag — tracks LinkedIn ad effectiveness', duration: '30 days' },
    ],
  },
]

const thirdParties = [
  { name: 'Google Analytics', purpose: 'Platform usage analytics', link: 'https://policies.google.com/privacy' },
  { name: 'Stripe', purpose: 'Payment processing & fraud prevention', link: 'https://stripe.com/privacy' },
  { name: 'Resend', purpose: 'Transactional email delivery', link: 'https://resend.com/privacy' },
  { name: 'Vercel', purpose: 'Hosting & edge performance', link: 'https://vercel.com/legal/privacy-policy' },
  { name: 'Neon', purpose: 'Database infrastructure', link: 'https://neon.tech/privacy-policy' },
]

export default function CookiePolicyClient() {
  return (
    <div className="min-h-screen" style={{ background: '#f1f5f9' }}>

      {/* ── Hero banner — full width, matches header ── */}
      <div style={{ background: '#0f172a', borderBottom: '1px solid #1e3a5f' }}>
        <div className="mx-auto max-w-480 px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Left: back + title */}
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs font-semibold transition-colors flex-shrink-0"
                style={{ color: '#94a3b8' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
                onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </Link>
              <div style={{ width: 1, height: 28, background: '#334155' }} />
              <div
                className="rounded-lg p-2 flex-shrink-0"
                style={{ background: '#1e293b', border: '1px solid #f97316' }}
              >
                <Cookie className="w-5 h-5" style={{ color: '#f97316' }} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded"
                    style={{ background: '#1e3a5f', color: '#fb923c', border: '1px solid #2d5a8e' }}
                  >
                    Legal
                  </span>
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight" style={{ color: '#ffffff' }}>
                    Cookie Policy
                  </h1>
                </div>
                <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>
                  Last updated: {LAST_UPDATED} · precisegovcon.com
                </p>
              </div>
            </div>

            {/* Right: Update Preferences button */}
            <button
              type="button"
              onClick={() => { localStorage.removeItem('cookie-consent'); window.location.reload() }}
              className="flex-shrink-0 flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-black transition-all whitespace-nowrap self-start sm:self-auto"
              style={{ background: '#f97316', color: '#ffffff' }}
              onMouseEnter={e => ((e.currentTarget as HTMLButtonElement).style.background = '#ea580c')}
              onMouseLeave={e => ((e.currentTarget as HTMLButtonElement).style.background = '#f97316')}
            >
              <Settings className="w-4 h-4" />
              Update Preferences
            </button>
          </div>
        </div>
      </div>

      {/* ── Body — full width matching header ── */}
      <div className="mx-auto max-w-480 px-4 sm:px-6 lg:px-8 py-6">

        {/* ── Two-column layout: main content + sidebar ── */}
        <div className="flex flex-col lg:flex-row gap-6">

          {/* ── LEFT: main content ── */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* Intro card */}
            <div className="rounded-xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
              <div className="px-5 py-3" style={{ background: '#1e293b', borderBottom: '1px solid #334155' }}>
                <h2 className="text-sm font-black uppercase tracking-widest" style={{ color: '#ffffff' }}>What are cookies?</h2>
              </div>
              <div className="px-5 py-4 text-sm leading-relaxed space-y-2" style={{ color: '#475569' }}>
                <p>Cookies are small text files placed on your device when you visit a website. They help the site remember your preferences, keep you logged in, and understand how you use the platform so we can improve it.</p>
                <p>PreciseGovCon uses cookies to power core features like authentication and saved searches, and optionally to measure how contractors engage with our platform. You are always in control — optional cookies require your explicit consent.</p>
              </div>
            </div>

            {/* Cookie type cards */}
            <div>
              <h2 className="text-base font-black uppercase tracking-widest mb-3" style={{ color: '#1e293b' }}>Cookies we use</h2>
              <div className="space-y-4">
                {cookieTypes.map((ct) => {
                  const Icon = ct.icon
                  return (
                    <div key={ct.title} className="rounded-xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
                      {/* Header */}
                      <div
                        className="flex items-center justify-between gap-3 px-5 py-3"
                        style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="rounded-lg p-1.5" style={{ background: ct.iconBg }}>
                            <Icon className="w-4 h-4" style={{ color: ct.iconColor }} />
                          </div>
                          <h3 className="font-black text-sm" style={{ color: '#0f172a' }}>{ct.title}</h3>
                        </div>
                        <span
                          className="flex-shrink-0 text-[11px] font-black px-2.5 py-0.5 rounded-full"
                          style={{ background: ct.badgeBg, border: `1px solid ${ct.badgeBorder}`, color: ct.badgeColor }}
                        >
                          {ct.badge}
                        </span>
                      </div>
                      {/* Body */}
                      <div className="px-5 py-4">
                        <p className="text-sm leading-relaxed mb-3" style={{ color: '#475569' }}>{ct.description}</p>
                        {/* Table */}
                        <div className="rounded-lg overflow-hidden" style={{ border: '1px solid #e2e8f0' }}>
                          <div
                            className="grid text-[11px] font-black uppercase tracking-wider px-4 py-2"
                            style={{ gridTemplateColumns: '2fr 3fr 1.5fr', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}
                          >
                            <span>Cookie</span><span>Purpose</span><span>Duration</span>
                          </div>
                          {ct.examples.map((ex, i) => (
                            <div
                              key={ex.name}
                              className="grid px-4 py-2.5"
                              style={{ gridTemplateColumns: '2fr 3fr 1.5fr', borderTop: i > 0 ? '1px solid #f1f5f9' : undefined, background: i % 2 === 1 ? '#fafafa' : '#ffffff' }}
                            >
                              <code className="text-xs font-mono self-center" style={{ color: '#f97316' }}>{ex.name}</code>
                              <span className="text-xs pr-4 self-center" style={{ color: '#475569' }}>{ex.purpose}</span>
                              <span className="text-xs self-center font-semibold" style={{ color: '#64748b' }}>{ex.duration}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* How to control */}
            <div className="rounded-xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
              <div className="px-5 py-3" style={{ background: '#1e293b', borderBottom: '1px solid #334155' }}>
                <h2 className="text-sm font-black uppercase tracking-widest" style={{ color: '#ffffff' }}>How to control cookies</h2>
              </div>
              <div className="px-5 py-4 text-sm leading-relaxed space-y-2.5" style={{ color: '#475569' }}>
                <p><span className="font-bold" style={{ color: '#0f172a' }}>On PreciseGovCon:</span> Use the cookie banner or click "Update Preferences" in the header above to change your choices at any time.</p>
                <p><span className="font-bold" style={{ color: '#0f172a' }}>In your browser:</span> Most browsers let you view, delete, and block cookies through their settings. Blocking strictly necessary cookies will prevent login and key platform features.</p>
                <p><span className="font-bold" style={{ color: '#0f172a' }}>Opt-out:</span> For Google Analytics, install the{' '}
                  <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2" style={{ color: '#f97316' }}>Google Analytics Opt-out Add-on</a>.
                </p>
              </div>
            </div>

          </div>

          {/* ── RIGHT: sidebar ── */}
          <div className="w-full lg:w-80 xl:w-96 flex-shrink-0 space-y-4">

            {/* Third parties */}
            <div className="rounded-xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
              <div className="px-4 py-3" style={{ background: '#1e293b', borderBottom: '1px solid #334155' }}>
                <h2 className="text-sm font-black uppercase tracking-widest" style={{ color: '#ffffff' }}>Third-party services</h2>
              </div>
              <div className="px-4 py-2">
                {thirdParties.map((tp, i) => (
                  <div
                    key={tp.name}
                    className="flex items-center justify-between gap-3 py-3"
                    style={{ borderTop: i > 0 ? '1px solid #f1f5f9' : undefined }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#f97316' }} />
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate" style={{ color: '#0f172a' }}>{tp.name}</p>
                        <p className="text-xs truncate" style={{ color: '#64748b' }}>{tp.purpose}</p>
                      </div>
                    </div>
                    <a
                      href={tp.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 flex items-center gap-1 text-xs font-semibold"
                      style={{ color: '#f97316' }}
                    >
                      Policy <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Changes */}
            <div className="rounded-xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
              <div className="px-4 py-3" style={{ background: '#1e293b', borderBottom: '1px solid #334155' }}>
                <h2 className="text-sm font-black uppercase tracking-widest" style={{ color: '#ffffff' }}>Policy updates</h2>
              </div>
              <p className="px-4 py-3 text-sm leading-relaxed" style={{ color: '#475569' }}>
                We may update this policy as we add features or as laws change. We will update the date above and notify users of material changes via email or a platform banner.
              </p>
            </div>

            {/* Contact */}
            <div className="rounded-xl overflow-hidden" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
              <div className="px-4 py-3" style={{ background: '#1e293b', borderBottom: '1px solid #334155' }}>
                <h2 className="text-sm font-black uppercase tracking-widest" style={{ color: '#ffffff' }}>Questions?</h2>
              </div>
              <div className="px-4 py-3 text-sm" style={{ color: '#475569' }}>
                <p className="mb-3">Contact our privacy team or review the full Privacy Policy.</p>
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold mb-2"
                  style={{ background: '#fff7ed', border: '1px solid #fed7aa', color: '#c2410c' }}
                >
                  <span>✉</span> {CONTACT_EMAIL}
                </a>
                <Link
                  href="/privacy"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold"
                  style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#1e293b' }}
                >
                  <Shield className="w-3.5 h-3.5" /> Privacy Policy →
                </Link>
              </div>
            </div>

            {/* Footer links */}
            <div
              className="rounded-xl px-4 py-3 flex flex-wrap gap-x-4 gap-y-1 text-xs"
              style={{ background: '#ffffff', border: '1px solid #e2e8f0', color: '#94a3b8' }}
            >
              <span>© {new Date().getFullYear()} Precise Analytics LLC</span>
              <Link href="/privacy" className="hover:underline" style={{ color: '#64748b' }}>Privacy</Link>
              <Link href="/terms" className="hover:underline" style={{ color: '#64748b' }}>Terms</Link>
              <Link href="/support" className="hover:underline" style={{ color: '#64748b' }}>Support</Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}