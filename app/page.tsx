'use client'
// app/page.tsx — PreciseGovCon Landing Page
// Uses app-wide container width (max 1600px) · Aptos font · compact hero

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import {
  Search, Bell, BarChart3, Shield, ArrowRight, ChevronLeft, ChevronRight,
} from 'lucide-react'

// ─── Font stack: Aptos (Win11/Office) → Segoe UI → system-ui ─────────────────
const F = `Aptos, 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif`

// ─── Shared container — matches header/global width (max 1920px) ────────────
const W: React.CSSProperties = { maxWidth: 1920, margin: '0 auto', padding: '0 clamp(16px, 2.5vw, 40px)' }

// ─── Slides ───────────────────────────────────────────────────────────────────
const SLIDES = [
  {
    id: 0, dir: 'ltr',
    eyebrow: 'AI-Powered Federal Intelligence',
    heading: 'Find & Win Government',
    accent1: 'Contracts Faster',
    body: 'PreciseGovCon surfaces the right SAM.gov opportunities for your certifications, NAICS codes, and target agencies — AI-scored before you even open them.',
    cta: { label: 'Start Free Trial', href: '/register' },
    ctaAlt: { label: 'Explore Search', href: '/search' },
    stats: [{ v: '1,300+', l: 'Live opps' }, { v: '83%', l: 'Avg match' }, { v: '<24h', l: 'Alert time' }],
    accent: '#0f766e', aLight: '#ccfbf1', aMid: '#0d9488',
    bg: '#f0fdfa', Icon: Search, badge: '🟢 SAM.gov Live', tab: 'Search',
  },
  {
    id: 1, dir: 'ttb',
    eyebrow: 'Built for Set-Aside Winners',
    heading: 'SDVOSB · VOSB · 8(a)',
    accent1: 'Certifications That Pay Off',
    body: "Every opportunity is filtered and scored against your exact small business certifications. Stop scrolling through contracts that don't apply to you.",
    cta: { label: 'Set Up My Profile', href: '/register' },
    ctaAlt: { label: 'How It Works', href: '/services' },
    stats: [{ v: '18+', l: 'Set-aside types' }, { v: '60%', l: 'Coverage' }, { v: '500+', l: 'Contractors' }],
    accent: '#c2410c', aLight: '#ffedd5', aMid: '#ea580c',
    bg: '#fff7ed', Icon: Shield, badge: '🛡 SDVOSB · VOSB · 8(a)', tab: 'Set-Asides',
  },
  {
    id: 2, dir: 'rtl',
    eyebrow: 'Never Miss a Deadline Again',
    heading: 'Real-Time Alerts &',
    accent1: 'Deadline Intelligence',
    body: 'Get instant notifications the moment matching contracts post. Track deadlines across your pipeline with urgency scoring — Critical, High, Act Soon.',
    cta: { label: 'Set Up Alerts', href: '/register' },
    ctaAlt: { label: 'View Pricing', href: '/pricing' },
    stats: [{ v: '76+', l: 'Agencies' }, { v: '5', l: 'Posted today' }, { v: '29', l: 'Expiring ≤7d' }],
    accent: '#6d28d9', aLight: '#ede9fe', aMid: '#7c3aed',
    bg: '#f5f3ff', Icon: Bell, badge: '🔔 Instant alerts', tab: 'Alerts',
  },
  {
    id: 3, dir: 'btt',
    eyebrow: 'GovCon Intelligence Dashboard',
    heading: 'Your Pipeline,',
    accent1: 'Analyzed & Prioritized',
    body: 'Beyond search — the Insights Dashboard shows top agencies, set-aside mix, market trends, and AI priority scores so you know exactly where to focus.',
    cta: { label: 'Open Insights', href: '/insights' },
    ctaAlt: { label: 'View Demo', href: '/register' },
    stats: [{ v: '34%', l: 'AI/ML growth' }, { v: '$2.3B', l: 'Contracts won' }, { v: '100', l: 'Curated opps' }],
    accent: '#0369a1', aLight: '#e0f2fe', aMid: '#0ea5e9',
    bg: '#f0f9ff', Icon: BarChart3, badge: '📊 Live analytics', tab: 'Insights',
  },
]

const ENTER: Record<string, string> = {
  ltr: 'translateX(-36px)', rtl: 'translateX(36px)',
  ttb: 'translateY(-24px)', btt: 'translateY(24px)',
}
const EXIT: Record<string, string> = {
  ltr: 'translateX(36px)',  rtl: 'translateX(-36px)',
  ttb: 'translateY(24px)',  btt: 'translateY(-24px)',
}

// ─── Static data ──────────────────────────────────────────────────────────────
const FEATURES = [
  { Icon: Search,    title: 'Smart Contract Search',   desc: 'Search all SAM.gov with NAICS, set-aside type, agency, deadline urgency, and contract value filters.',       color: '#0d9488', bg: '#f0fdfa', href: '/search'   },
  { Icon: Bell,      title: 'Instant Deadline Alerts', desc: 'Saved searches notify you the moment matching contracts post — track critical deadlines before competitors.', color: '#c2410c', bg: '#fff7ed', href: '/alerts'   },
  { Icon: BarChart3, title: 'Intelligence Dashboard',  desc: 'Agency trends, set-aside mix, urgency scoring, and AI priority briefs curated daily for your sectors.',       color: '#6d28d9', bg: '#f5f3ff', href: '/insights' },
  { Icon: Shield,    title: 'Certification Filtering', desc: 'Filter by SDVOSB, VOSB, 8(a), WOSB, HUBZone and more — your certifications as a built-in search lever.',    color: '#0369a1', bg: '#f0f9ff', href: '/register' },
]

const STEPS = [
  { n: '01', title: 'Define Your Target Profile',  desc: 'Set NAICS codes, agencies, geography, set-aside posture, and contract size range — once.', color: '#0d9488', bg: '#f0fdfa' },
  { n: '02', title: 'Run Saved Search Workflows',  desc: 'Build repeatable playbooks. Get alerts the moment new matches post — zero manual checking.', color: '#c2410c', bg: '#fff7ed' },
  { n: '03', title: 'Act on AI Prioritization',    desc: 'AI scores every opportunity against your profile. Focus BD time on contracts you can win.',  color: '#6d28d9', bg: '#f5f3ff' },
]

// ─── Mock opportunity rows for preview card ────────────────────────────────────
const OPPS = [
  { title: 'Zero Trust Engineering Support', agency: 'Dept of the Army',  match: 90, deadline: '5d',  sa: 'SDVOSB', val: '$3.2M' },
  { title: 'DHS Cloud Migration Surge',      agency: 'Homeland Security', match: 84, deadline: '8d',  sa: 'SBA',    val: '$2.1M' },
  { title: 'VA Analytics Modernization',     agency: 'Veterans Affairs',  match: 78, deadline: '12d', sa: 'VOSB',   val: '$1.5M' },
]

// ─── Section label pill ───────────────────────────────────────────────────────
function Pill({ label }: { label: string }) {
  return (
    <span style={{ display: 'inline-block', padding: '3px 12px', borderRadius: 100, background: '#f0fdfa', border: '1px solid #99f6e4', fontSize: 12, fontWeight: 700, color: '#0d9488', letterSpacing: '0.07em', textTransform: 'uppercase' as const, marginBottom: 14, fontFamily: F }}>
      {label}
    </span>
  )
}

// ─── Hero Slider ──────────────────────────────────────────────────────────────
function HeroSlider() {
  const [cur, setCur]         = useState(0)
  const [phase, setPhase]     = useState<'idle' | 'out' | 'in'>('idle')
  const [playing, setPlaying] = useState(true)
  const timerRef              = useRef<ReturnType<typeof setInterval> | null>(null)

  const goTo = useCallback((idx: number) => {
    if (idx === cur || phase !== 'idle') return
    setPhase('out')
    setTimeout(() => {
      setCur(idx)
      setPhase('in')
      setTimeout(() => setPhase('idle'), 450)
    }, 270)
  }, [cur, phase])

  const advance = useCallback(() => goTo((cur + 1) % SLIDES.length), [cur, goTo])

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (playing) timerRef.current = setInterval(advance, 6500)
  }, [playing, advance])

  useEffect(() => {
    resetTimer()
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [resetTimer])

  const s = SLIDES[cur]
  const SlideIcon = s.Icon

  const anim: React.CSSProperties = {
    opacity: phase === 'idle' ? 1 : 0,
    transform: phase === 'out' ? EXIT[s.dir] : phase === 'in' ? ENTER[s.dir] : 'none',
    transition: phase === 'out'
      ? 'opacity 0.24s ease, transform 0.27s ease'
      : phase === 'in'
      ? 'opacity 0.42s ease 0.04s, transform 0.42s ease 0.04s'
      : 'none',
  }

  return (
    <div style={{ width: '100%' }}>
      <div style={W}>
        <div style={{ background: s.bg, transition: 'background 0.5s ease', position: 'relative', overflow: 'hidden', borderRadius: 18 }}>

          {/* ── Animated slide content ── */}
          <div style={anim}>
            <div style={{ padding: '18px clamp(14px, 2.2vw, 32px) 30px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) clamp(360px, 46vw, 720px)', gap: 32, alignItems: 'center' }}>

              {/* Left: copy */}
              <div style={{ background: '#ffffff', border: `1px solid ${s.aMid}2a`, borderRadius: 16, padding: '20px 22px' }}>
              {/* Eyebrow */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 100, padding: '4px 11px', background: s.aLight, border: `1px solid ${s.aMid}38`, marginBottom: 14 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.aMid, display: 'inline-block', flexShrink: 0 }} />
                <span style={{ fontSize: 'clamp(13px, 1vw, 16px)', fontWeight: 700, color: s.accent, letterSpacing: '0.07em', textTransform: 'uppercase', fontFamily: F }}>{s.eyebrow}</span>
              </div>

              {/* Heading */}
              <h1 style={{ fontSize: 'clamp(38px, 4.1vw, 60px)', fontWeight: 800, lineHeight: 1.04, color: '#0f172a', margin: '0 0 2px', letterSpacing: '-0.022em', fontFamily: F }}>
                {s.heading}
              </h1>
              <h1 style={{ fontSize: 'clamp(38px, 4.1vw, 60px)', fontWeight: 800, lineHeight: 1.04, color: s.accent, margin: '0 0 16px', letterSpacing: '-0.022em', fontFamily: F }}>
                {s.accent1}
              </h1>

              {/* Body */}
              <p style={{ fontSize: 'clamp(20px, 1.6vw, 28px)', color: '#475569', lineHeight: 1.55, maxWidth: 760, margin: '0 0 22px', fontFamily: F }}>
                {s.body}
              </p>

              {/* CTA buttons */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 28 }}>
                <Link
                  href={s.cta.href}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '13px 28px', borderRadius: 10, background: s.accent, color: '#fff', fontSize: 16, fontWeight: 700, boxShadow: `0 3px 14px ${s.aMid}38`, fontFamily: F, textDecoration: 'none' }}
                >
                  {s.cta.label} <ArrowRight style={{ width: 14, height: 14 }} />
                </Link>
                <Link
                  href={s.ctaAlt.href}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '13px 26px', borderRadius: 10, background: '#fff', color: '#374151', border: '1.5px solid #d1d5db', fontSize: 16, fontWeight: 600, fontFamily: F, textDecoration: 'none' }}
                >
                  {s.ctaAlt.label}
                </Link>
              </div>

              {/* Stats */}
              <div style={{ display: 'flex', gap: 32 }}>
                {s.stats.map(st => (
                  <div key={st.l}>
                    <p style={{ fontSize: 'clamp(42px, 3.8vw, 56px)', fontWeight: 800, color: s.accent, margin: 0, lineHeight: 1, fontFamily: F }}>{st.v}</p>
                    <p style={{ fontSize: 'clamp(15px, 1.1vw, 19px)', color: '#94a3b8', margin: '5px 0 0', fontWeight: 600, fontFamily: F }}>{st.l}</p>
                  </div>
                ))}
              </div>
            </div>

              {/* Right: expanded preview card */}
              <div style={{ background: '#fff', borderRadius: 18, border: `1.5px solid ${s.aMid}1e`, boxShadow: '0 12px 34px rgba(0,0,0,0.08)', padding: 24, overflow: 'hidden' }}>

                  {/* Card header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${s.aLight}` }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: s.aLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <SlideIcon style={{ width: 18, height: 18, color: s.accent }} />
                </div>
                <div>
                  <p style={{ fontSize: 'clamp(16px, 1.25vw, 22px)', fontWeight: 800, color: '#0f172a', margin: 0, fontFamily: F }}>PreciseGovCon</p>
                  <p style={{ fontSize: 'clamp(12px, 1vw, 16px)', color: '#94a3b8', margin: 0, fontFamily: F }}>{s.badge}</p>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, fontSize: 'clamp(11px, 0.95vw, 14px)', fontWeight: 700, color: '#0d9488', background: '#f0fdfa', border: '1px solid #99f6e4', borderRadius: 100, padding: '4px 10px', fontFamily: F }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#0d9488', display: 'inline-block' }} />
                  LIVE
                </div>
              </div>

                  {/* Opportunity rows */}
                  {OPPS.map((opp, i) => (
                    <div key={i} style={{ padding: '11px 12px', borderRadius: 10, background: i === 0 ? s.aLight : '#f8fafc', border: `1px solid ${i === 0 ? s.aMid + '22' : '#f1f5f9'}`, marginBottom: i < 2 ? 8 : 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <p style={{ fontSize: 'clamp(14px, 1.2vw, 20px)', fontWeight: 700, color: '#0f172a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: F }}>{opp.title}</p>
                    <span style={{ flexShrink: 0, fontSize: 'clamp(11px, 1vw, 15px)', fontWeight: 800, color: opp.match >= 85 ? '#0d9488' : '#0369a1', background: opp.match >= 85 ? '#f0fdfa' : '#f0f9ff', border: `1px solid ${opp.match >= 85 ? '#99f6e4' : '#bae6fd'}`, borderRadius: 6, padding: '1px 6px', fontFamily: F }}>
                      {opp.match}%
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ fontSize: 'clamp(11px, 0.95vw, 15px)', color: '#94a3b8', fontWeight: 600, fontFamily: F, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>{opp.agency}</span>
                    <span style={{ flexShrink: 0, fontSize: 'clamp(10px, 0.9vw, 14px)', fontWeight: 700, color: '#c2410c', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 4, padding: '0 5px', fontFamily: F }}>{opp.deadline}</span>
                    <span style={{ flexShrink: 0, fontSize: 'clamp(10px, 0.9vw, 14px)', fontWeight: 700, color: s.accent, background: s.aLight, border: `1px solid ${s.aMid}1e`, borderRadius: 4, padding: '0 5px', fontFamily: F }}>{opp.sa}</span>
                    <span style={{ fontSize: 'clamp(10px, 0.9vw, 14px)', color: '#64748b', fontWeight: 700, marginLeft: 'auto', fontFamily: F }}>{opp.val}</span>
                  </div>
                    </div>
                  ))}

                  <p style={{ fontSize: 'clamp(12px, 1vw, 16px)', color: '#94a3b8', fontWeight: 600, margin: '12px 0 0', textAlign: 'center', fontFamily: F }}>3 of 1,328 live opportunities</p>
                </div>

              </div>
            </div>
          </div>

          {/* ── Controls bar — same width as hero panel ── */}
          <div style={{ borderTop: `1px solid ${s.aMid}26`, background: '#ffffff' }}>
            <div style={{ padding: '0 clamp(14px, 2.2vw, 32px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {/* Named tabs */}
              <div style={{ display: 'flex' }}>
            {SLIDES.map((sl, i) => (
              <button
                key={i}
                onClick={() => { goTo(i) }}
                style={{ padding: '12px 20px', fontSize: 'clamp(14px, 1vw, 18px)', fontWeight: 700, color: i === cur ? sl.accent : '#9ca3af', background: 'transparent', border: 'none', borderBottom: `2px solid ${i === cur ? sl.accent : 'transparent'}`, transition: 'all 0.18s', cursor: 'pointer', fontFamily: F }}
              >
                {sl.tab}
              </button>
            ))}
          </div>

              {/* Prev / pause / next */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            {(
              [
                { fn: () => { goTo((cur - 1 + SLIDES.length) % SLIDES.length) }, el: <ChevronLeft style={{ width: 13, height: 13 }} /> },
                {
                  fn: () => setPlaying(p => !p),
                  el: playing
                    ? <span style={{ display: 'flex', gap: 2 }}><span style={{ width: 2, height: 10, background: '#6b7280', borderRadius: 1 }} /><span style={{ width: 2, height: 10, background: '#6b7280', borderRadius: 1 }} /></span>
                    : <span style={{ marginLeft: 1, width: 0, height: 0, borderTop: '4px solid transparent', borderBottom: '4px solid transparent', borderLeft: '8px solid #6b7280' }} />,
                },
                { fn: () => { goTo((cur + 1) % SLIDES.length) }, el: <ChevronRight style={{ width: 13, height: 13 }} /> },
              ] as Array<{ fn: () => void; el: React.ReactNode }>
            ).map((b, i) => (
              <button
                key={i}
                onClick={b.fn}
                style={{ width: 28, height: 28, borderRadius: 6, background: '#f1f5f9', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6b7280' }}
              >
                {b.el}
              </button>
            ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <>
      <style>{`
        .land * { box-sizing: border-box; }
        .land a { text-decoration: none; color: inherit; }
        .feature-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
        .step-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
        .fcard  { transition: transform 0.16s ease, box-shadow 0.16s ease; }
        .fcard:hover  { transform: translateY(-4px); box-shadow: 0 16px 36px rgba(0,0,0,0.09) !important; }
        .scard  { transition: transform 0.16s ease; }
        .scard:hover  { transform: translateY(-3px); }
        .pcard  { transition: transform 0.18s ease; }
        .pcard:hover  { transform: translateY(-3px); }
        @media (max-width: 1200px) {
          .feature-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .step-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 760px) {
          .feature-grid { grid-template-columns: 1fr; }
          .step-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="land" style={{ fontFamily: F, background: '#f8fafc', color: '#0f172a' }}>

        {/* ── Hero slider — zero gap from nav ── */}
        <HeroSlider />

        {/* ── Features ── */}
        <div style={{ ...W, paddingTop: 56, paddingBottom: 56 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <Pill label="Platform Features" />
            <h2 style={{ fontSize: 'clamp(28px, 2.6vw, 40px)', fontWeight: 800, color: '#0f172a', margin: '0 0 12px', letterSpacing: '-0.02em', fontFamily: F }}>
              Everything you need to win more contracts
            </h2>
            <p style={{ fontSize: 18, color: '#1e293b', maxWidth: 560, margin: '0 auto', lineHeight: 1.7, fontFamily: F, fontWeight: 500 }}>
              Purpose-built tools for government contractors serious about growing their pipeline.
            </p>
          </div>

          <div className="feature-grid">
            {FEATURES.map((f) => (
              <Link
                key={f.title}
                href={f.href}
                className="fcard"
                style={{ display: 'flex', flexDirection: 'column', borderRadius: 14, background: '#fff', border: '1.5px solid #d8e3ef', padding: '22px 20px', boxShadow: '0 2px 8px rgba(15,23,42,0.05)', textDecoration: 'none', minHeight: 252 }}
              >
                <div style={{ width: 38, height: 38, borderRadius: 9, background: f.bg, border: `1px solid ${f.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <f.Icon style={{ width: 17, height: 17, color: f.color }} />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '0 0 10px', fontFamily: F }}>{f.title}</h3>
                <p style={{ fontSize: 16, color: '#1e293b', lineHeight: 1.65, margin: '0 0 16px', fontFamily: F, fontWeight: 500 }}>
                  {f.desc}
                </p>
                <span style={{ marginTop: 'auto', display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 14, fontWeight: 800, color: f.color, fontFamily: F }}>
                  Learn more <ArrowRight style={{ width: 12, height: 12 }} />
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* ── How it works ── */}
        <div style={{ background: '#eef2f7', width: '100%', padding: '56px 0' }}>
          <div style={{ ...W }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <Pill label="How It Works" />
              <h2 style={{ fontSize: 'clamp(28px, 2.6vw, 40px)', fontWeight: 800, color: '#0f172a', margin: '0 0 12px', letterSpacing: '-0.02em', fontFamily: F }}>
                A repeatable bid pipeline in three steps
              </h2>
              <p style={{ fontSize: 18, color: '#1e293b', maxWidth: 540, margin: '0 auto', lineHeight: 1.7, fontFamily: F, fontWeight: 500 }}>
                Reduce manual effort and improve win rate by turning one-off searching into a system.
              </p>
            </div>

            <div className="step-grid" style={{ marginBottom: 30 }}>
              {STEPS.map((step) => (
                <div
                  key={step.n}
                  className="scard"
                  style={{ borderRadius: 14, background: '#fff', border: `1.5px solid ${step.color}22`, padding: '22px 20px', boxShadow: '0 2px 9px rgba(15,23,42,0.05)', minHeight: 236 }}
                >
                  <div style={{ fontSize: 38, fontWeight: 900, lineHeight: 1, color: step.bg, WebkitTextStroke: `2px ${step.color}2e`, marginBottom: 12, fontFamily: F }}>
                    {step.n}
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '0 0 10px', fontFamily: F }}>{step.title}</h3>
                  <p style={{ fontSize: 16, color: '#1e293b', lineHeight: 1.68, margin: 0, fontFamily: F, fontWeight: 500 }}>{step.desc}</p>
                  <div style={{ marginTop: 20, height: 2.5, borderRadius: 2, background: `linear-gradient(90deg, ${step.color}, transparent)` }} />
                </div>
              ))}
            </div>

            <div style={{ textAlign: 'center' }}>
              <Link
                href="/register"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '13px 32px', borderRadius: 10, background: '#0f766e', color: '#fff', fontSize: 16, fontWeight: 700, boxShadow: '0 3px 14px rgba(15,118,110,0.28)', textDecoration: 'none', fontFamily: F }}
              >
                Get Started Free <ArrowRight style={{ width: 14, height: 14 }} />
              </Link>
            </div>
          </div>
        </div>

        {/* ── Pricing Link ── */}
        <div style={{ ...W, paddingTop: 52, paddingBottom: 52 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <Pill label="Pricing" />
            <h2 style={{ fontSize: 'clamp(28px, 2.6vw, 40px)', fontWeight: 800, color: '#0f172a', margin: '0 0 10px', letterSpacing: '-0.02em', fontFamily: F }}>
              View full monthly and annual pricing
            </h2>
            <p style={{ fontSize: 17, color: '#334155', maxWidth: 560, margin: '0 auto', lineHeight: 1.65, fontFamily: F, fontWeight: 500 }}>
              We moved plan details off the homepage so you can compare all tiers and annual savings in one place.
            </p>

            <div style={{ marginTop: 22 }}>
              <Link
                href="/pricing"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '13px 30px', borderRadius: 10, background: '#0f766e', color: '#fff', fontSize: 16, fontWeight: 700, boxShadow: '0 3px 14px rgba(15,118,110,0.28)', textDecoration: 'none', fontFamily: F }}
              >
                View Full Pricing <ArrowRight style={{ width: 14, height: 14 }} />
              </Link>
            </div>
          </div>
        </div>

        {/* ── Final CTA ── */}
        <div style={{ ...W, paddingTop: 0, paddingBottom: 52 }}>
          <div style={{ borderRadius: 18, background: '#0f172a', border: '1px solid #1e293b', boxShadow: '0 24px 60px rgba(0,0,0,0.12)', display: 'grid', gridTemplateColumns: '1fr auto', gap: 32, alignItems: 'center', padding: '44px 52px', position: 'relative', overflow: 'hidden' }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#14b8a6', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10, fontFamily: F }}>
                Ready to modernize your workflow?
              </p>
              <h2 style={{ fontSize: 'clamp(28px, 2.6vw, 40px)', fontWeight: 800, color: '#fff', margin: '0 0 12px', letterSpacing: '-0.02em', fontFamily: F }}>
                Start with a 7-day free trial.
              </h2>
              <p style={{ fontSize: 17, color: '#cbd5e1', maxWidth: 540, margin: 0, lineHeight: 1.7, fontFamily: F }}>
                Immediate access to search, alerts, and insights. No credit card required. Upgrade only when the workflow proves its value.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>
              <Link
                href="/register"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '14px 34px', borderRadius: 10, background: '#0f766e', color: '#fff', fontSize: 16, fontWeight: 700, whiteSpace: 'nowrap', boxShadow: '0 3px 16px rgba(15,118,110,0.3)', textDecoration: 'none', fontFamily: F }}
              >
                Get Started Free <ArrowRight style={{ width: 14, height: 14 }} />
              </Link>
              <Link
                href="/pricing"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '13px 32px', borderRadius: 10, background: '#1e293b', border: '1.5px solid #334155', color: '#e2e8f0', fontSize: 16, fontWeight: 600, whiteSpace: 'nowrap', textDecoration: 'none', fontFamily: F }}
              >
                View Pricing
              </Link>
            </div>
          </div>
        </div>

      </div>
    </>
  )
}