'use client'
// app/page.tsx — PreciseGovCon Landing Page
// Uses app-wide container width (max 1600px) · Aptos font · compact hero

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import {
  Search, Bell, BarChart3, Shield, ArrowRight, ChevronLeft, ChevronRight,
} from 'lucide-react'

// ─── Theme hook — reads data-theme from <html> and reacts to changes ──────────
function useIsDark() {
  const [isDark, setIsDark] = useState(false)
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.getAttribute('data-theme') === 'dark')
    check()
    window.addEventListener('pg-theme-change', check)
    return () => window.removeEventListener('pg-theme-change', check)
  }, [])
  return isDark
}

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
    cta: { label: 'Start Free Trial', href: '/signup' },
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
    cta: { label: 'Set Up My Profile', href: '/signup' },
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
    cta: { label: 'Set Up Alerts', href: '/signup' },
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
    ctaAlt: { label: 'View Demo', href: '/signup' },
    stats: [{ v: '34%', l: 'AI/ML growth' }, { v: '$2.3B', l: 'Contracts won' }, { v: '100', l: 'Curated opps' }],
    accent: '#0369a1', aLight: '#e0f2fe', aMid: '#0ea5e9',
    bg: '#f0f9ff', Icon: BarChart3, badge: '📊 Live analytics', tab: 'Insights',
  },
]

const ENTER: Record<string, string> = {
  ltr: 'translateX(-18px)', rtl: 'translateX(18px)',
  ttb: 'translateY(-14px)', btt: 'translateY(14px)',
}
const EXIT: Record<string, string> = {
  ltr: 'translateX(18px)',  rtl: 'translateX(-18px)',
  ttb: 'translateY(14px)',  btt: 'translateY(-14px)',
}

// ─── Static data ──────────────────────────────────────────────────────────────
const FEATURES = [
  { Icon: Search,    title: 'Smart Contract Search',   desc: 'Search all SAM.gov with NAICS, set-aside type, agency, deadline urgency, and contract value filters.',       color: '#0d9488', bg: '#f0fdfa', href: '/search'   },
  { Icon: Bell,      title: 'Instant Deadline Alerts', desc: 'Saved searches notify you the moment matching contracts post — track critical deadlines before competitors.', color: '#c2410c', bg: '#fff7ed', href: '/alerts'   },
  { Icon: BarChart3, title: 'Intelligence Dashboard',  desc: 'Agency trends, set-aside mix, urgency scoring, and AI priority briefs curated daily for your sectors.',       color: '#6d28d9', bg: '#f5f3ff', href: '/insights' },
  { Icon: Shield,    title: 'Certification Filtering', desc: 'Filter by SDVOSB, VOSB, 8(a), WOSB, HUBZone and more — your certifications as a built-in search lever.',    color: '#0369a1', bg: '#f0f9ff', href: '/signup' },
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
    <span
      className="pill-label"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px 32px',
        borderRadius: 10,
        background: '#0f766e',
        border: '1px solid #0b5f58',
        fontSize: 28,
        fontWeight: 800,
        color: '#ffffff',
        letterSpacing: '0.03em',
        textTransform: 'uppercase' as const,
        marginBottom: 14,
        lineHeight: 1.1,
        fontFamily: F,
      }}
    >
      {label}
    </span>
  )
}

// ─── Hero Slider ──────────────────────────────────────────────────────────────
function HeroSlider() {
  const isDark = useIsDark()
  const heroBg  = isDark ? '#1e293b' : '#ffffff'
  const headFg  = isDark ? '#f1f5f9' : '#0f172a'
  const bodyFg2 = isDark ? '#cbd5e1' : '#334155'
  const statFg  = isDark ? '#94a3b8' : '#64748b'
  const ctaAltBg= isDark ? '#334155' : '#fff'
  const ctaAltFg= isDark ? '#e2e8f0' : '#374151'
  const ctaAltBorder = isDark ? '#475569' : '#d1d5db'
  const tabBarBg= isDark ? '#1e293b' : '#ffffff'
  const tabInact= isDark ? '#64748b' : '#9ca3af'
  const ctrlBg  = isDark ? '#334155' : '#f1f5f9'
  const ctrlBorder = isDark ? '#475569' : '#e2e8f0'
  const ctrlFg  = isDark ? '#94a3b8' : '#6b7280'
  const oppRowAlt = isDark ? 'rgba(30,41,59,0.9)' : 'rgba(248,250,252,0.85)'
  const oppRowBorder = isDark ? '#334155' : '#e2e8f0'
  const oppTitleFg = isDark ? '#f1f5f9' : '#0f172a'
  const oppAgencyFg = isDark ? '#cbd5e1' : '#334155'
  const oppValFg = isDark ? '#e2e8f0' : '#1e293b'
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
      setTimeout(() => setPhase('idle'), 380)
    }, 210)
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
    opacity: phase === 'out' ? 0 : 1,
    transform: phase === 'out' ? EXIT[s.dir] : phase === 'in' ? ENTER[s.dir] : 'none',
    transition: phase === 'out'
      ? 'opacity 0.2s ease-out, transform 0.22s ease-out'
      : phase === 'in'
      ? 'opacity 0.46s cubic-bezier(.22,.61,.36,1), transform 0.46s cubic-bezier(.22,.61,.36,1)'
      : 'none',
  }

  return (
    <div style={{ width: '100%' }}>
      <div className="mx-auto w-full max-w-480 px-3 sm:px-5 lg:px-6">
        <div style={{ background: isDark ? '#0f172a' : s.bg, transition: 'background 0.5s ease', position: 'relative', overflow: 'hidden', borderRadius: 18 }}>

          {/* ── Animated slide content ── */}
          <div style={anim}>
            <div style={{ padding: '10px clamp(6px, 1vw, 16px) 18px 0' }}>
              <div
                className="hero-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(640px, 0.95fr) minmax(560px, 1.05fr)',
                  gap: 0,
                  alignItems: 'stretch',
                  maxWidth: 1840,
                  margin: '0 auto',
                  borderRadius: 22,
                  overflow: 'hidden',
                  background: isDark ? `linear-gradient(120deg, #1e293b 0%, #1e293b 52%, ${s.aLight}22 100%)` : `linear-gradient(120deg, #ffffff 0%, #ffffff 52%, ${s.aLight} 100%)`,
                  border: `1px solid ${s.aMid}2c`,
                  boxShadow: '0 16px 36px rgba(15,23,42,0.09)',
                }}
              >

              {/* Left: copy */}
              <div className="hero-copy" style={{ padding: '26px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 820 }}>
              {/* Eyebrow */}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, borderRadius: 12, padding: '8px 14px', background: s.aLight, border: `1px solid ${s.aMid}40`, marginBottom: 16, maxWidth: 'fit-content' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.aMid, display: 'inline-block', flexShrink: 0 }} />
                <span style={{ fontSize: 'clamp(13px, 1vw, 16px)', fontWeight: 700, color: s.accent, letterSpacing: '0.015em', lineHeight: 1.25, fontFamily: F }}>{s.eyebrow}</span>
              </div>

              {/* Heading */}
              <h1 style={{ fontSize: 'clamp(34px, 3.6vw, 56px)', fontWeight: 800, lineHeight: 1.04, margin: '0 0 14px', letterSpacing: '-0.02em', fontFamily: F }}>
                <span style={{ color: headFg, display: 'block', marginBottom: 2 }}>{s.heading}</span>
                <span style={{ color: s.accent, display: 'block' }}>{s.accent1}</span>
              </h1>

              {/* Body */}
              <p style={{ fontSize: 'clamp(18px, 1.35vw, 24px)', color: bodyFg2, lineHeight: 1.55, maxWidth: 760, margin: '0 0 20px', fontFamily: F }}>
                {s.body}
              </p>

              {/* CTA buttons */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
                <Link
                  href={s.cta.href}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '12px 24px', borderRadius: 11, background: s.accent, color: '#fff', fontSize: 16, fontWeight: 700, boxShadow: `0 3px 14px ${s.aMid}38`, fontFamily: F, textDecoration: 'none' }}
                >
                  {s.cta.label} <ArrowRight style={{ width: 14, height: 14 }} />
                </Link>
                <Link
                  href={s.ctaAlt.href}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '12px 22px', borderRadius: 11, background: ctaAltBg, color: ctaAltFg, border: `1.5px solid ${ctaAltBorder}`, fontSize: 16, fontWeight: 600, fontFamily: F, textDecoration: 'none' }}
                >
                  {s.ctaAlt.label}
                </Link>
              </div>

              {/* Stats */}
              <div className="hero-stats" style={{ display: 'flex', gap: 28 }}>
                {s.stats.map(st => (
                  <div key={st.l}>
                    <p style={{ fontSize: 'clamp(36px, 2.9vw, 48px)', fontWeight: 800, color: s.accent, margin: 0, lineHeight: 1, fontFamily: F }}>{st.v}</p>
                    <p style={{ fontSize: 'clamp(14px, 1.05vw, 17px)', color: statFg, margin: '4px 0 0', fontWeight: 700, fontFamily: F }}>{st.l}</p>
                  </div>
                ))}
              </div>
            </div>

              {/* Right: integrated live preview panel */}
              <div
                className="hero-right"
                style={{
                  background: 'transparent',
                  borderLeft: `1px solid ${s.aMid}24`,
                  padding: '24px 24px 22px',
                  overflow: 'hidden',
                }}
              >

                  {/* Card header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 18, paddingBottom: 13, borderBottom: `1px solid ${s.aMid}26` }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: s.aLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <SlideIcon style={{ width: 20, height: 20, color: s.accent }} />
                </div>
                <div>
                  <p
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '4px 9px',
                      borderRadius: 8,
                      background: '#0f172a',
                      border: '1px solid #1e293b',
                      fontSize: 'clamp(16px, 1.12vw, 20px)',
                      fontWeight: 800,
                      margin: 0,
                      lineHeight: 1.05,
                      letterSpacing: '0.01em',
                      fontFamily: F,
                    }}
                  >
                    <span style={{ color: '#ffffff' }}>PRECISE </span>
                    <span style={{ color: '#f97316' }}>GOVCON</span>
                  </p>
                </div>
                <span
                  style={{
                    marginLeft: 'auto',
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '6px 10px',
                    borderRadius: 8,
                    background: s.aLight,
                    border: `1px solid ${s.aMid}38`,
                    fontSize: 'clamp(12px, 0.95vw, 14px)',
                    fontWeight: 800,
                    color: isDark ? '#cbd5e1' : '#334155',
                    lineHeight: 1.15,
                    fontFamily: F,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {s.badge}
                </span>
              </div>

                  {/* Opportunity rows */}
                  {OPPS.map((opp, i) => (
                    <div key={i} style={{ padding: '12px 13px', borderRadius: 12, background: i === 0 ? (isDark ? s.aLight + '22' : s.aLight) : oppRowAlt, border: `1px solid ${i === 0 ? s.aMid + '30' : oppRowBorder}`, marginBottom: i < 2 ? 9 : 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                    <p style={{ fontSize: 'clamp(15px, 1.08vw, 18px)', fontWeight: 800, color: oppTitleFg, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: F }}>{opp.title}</p>
                    <span style={{ flexShrink: 0, fontSize: 'clamp(12px, 0.9vw, 14px)', fontWeight: 800, color: opp.match >= 85 ? '#0d9488' : '#0369a1', background: opp.match >= 85 ? '#f0fdfa' : '#f0f9ff', border: `1px solid ${opp.match >= 85 ? '#99f6e4' : '#bae6fd'}`, borderRadius: 7, padding: '2px 8px', fontFamily: F }}>
                      {opp.match}%
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ fontSize: 'clamp(13px, 1.02vw, 16px)', color: oppAgencyFg, fontWeight: 700, fontFamily: F, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 240 }}>{opp.agency}</span>
                    <span style={{ flexShrink: 0, fontSize: 'clamp(12px, 0.9vw, 14px)', fontWeight: 800, color: '#c2410c', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 5, padding: '1px 7px', fontFamily: F }}>{opp.deadline}</span>
                    <span style={{ flexShrink: 0, fontSize: 'clamp(12px, 0.9vw, 14px)', fontWeight: 800, color: s.accent, background: s.aLight, border: `1px solid ${s.aMid}1e`, borderRadius: 5, padding: '1px 7px', fontFamily: F }}>{opp.sa}</span>
                    <span style={{ fontSize: 'clamp(12px, 0.9vw, 14px)', color: oppValFg, fontWeight: 800, marginLeft: 'auto', fontFamily: F }}>{opp.val}</span>
                  </div>
                    </div>
                  ))}

                  <p style={{ fontSize: 'clamp(15px, 1.15vw, 19px)', color: '#15803d', fontWeight: 800, margin: '14px 0 0', textAlign: 'center', fontFamily: F }}>3 of 1,328 live opportunities</p>
                  <p style={{ fontSize: 'clamp(16px, 1.2vw, 20px)', color: '#39ff14', fontWeight: 700, lineHeight: 1.35, margin: '8px 0 0', textAlign: 'center', fontFamily: F }}>
                    View more by{' '}
                    <Link href="/signup" style={{ color: '#39ff14', fontWeight: 900, textDecoration: 'none' }}>
                      signing up
                    </Link>
                    {' '}or{' '}
                    <Link href="/login" style={{ color: '#39ff14', fontWeight: 900, textDecoration: 'none' }}>
                      logging in
                    </Link>
                    .
                  </p>
                </div>

              </div>
            </div>
          </div>

          {/* ── Controls bar — same width as hero panel ── */}
          <div style={{ borderTop: `1px solid ${s.aMid}26`, background: tabBarBg }}>
            <div style={{ padding: '0 clamp(14px, 2.2vw, 32px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {/* Named tabs */}
              <div style={{ display: 'flex' }}>
            {SLIDES.map((sl, i) => (
              <button
                key={i}
                onClick={() => { goTo(i) }}
                style={{ padding: '10px 16px', fontSize: 'clamp(13px, 0.95vw, 16px)', fontWeight: 700, color: i === cur ? sl.accent : tabInact, background: 'transparent', border: 'none', borderBottom: `2px solid ${i === cur ? sl.accent : 'transparent'}`, transition: 'all 0.18s', cursor: 'pointer', fontFamily: F }}
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
                style={{ width: 28, height: 28, borderRadius: 6, background: ctrlBg, border: `1px solid ${ctrlBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: ctrlFg }}
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
  const isDark = useIsDark()
  // Dynamic surfaces
  const pageBg    = isDark ? '#0f172a' : '#f8fafc'
  const pageFg    = isDark ? '#e2e8f0' : '#0f172a'
  const cardBg    = isDark ? '#1e293b' : '#ffffff'
  const cardBorder= isDark ? '#334155' : '#d8e3ef'
  const mutedBg   = isDark ? '#1e293b' : '#eef2f7'
  const bodyFg    = isDark ? '#cbd5e1' : '#1e293b'
  const subtleFg  = isDark ? '#94a3b8' : '#64748b'
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
        /* ── Mobile responsive overrides ── */
        @media (max-width: 860px) {
          .hero-grid { grid-template-columns: 1fr !important; }
          .hero-right { display: none !important; }
          .hero-copy { max-width: 100% !important; }
        }
        @media (max-width: 600px) {
          .hero-stats { gap: 16px !important; flex-wrap: wrap; }
          .cta-final-grid { grid-template-columns: 1fr !important; padding: 28px 20px !important; }
          .pill-label { font-size: 16px !important; padding: 10px 16px !important; margin-bottom: 10px !important; }
          .section-pad { padding-top: 36px !important; padding-bottom: 36px !important; }
        }
      `}</style>

      <div className="land" style={{ fontFamily: F, background: pageBg, color: pageFg }}>

        {/* ── Hero slider — zero gap from nav ── */}
        <HeroSlider />

        {/* ── Features ── */}
        <div className="section-pad" style={{ ...W, paddingTop: 56, paddingBottom: 56 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <Pill label="Platform Features" />
            <h2 style={{ fontSize: 'clamp(28px, 2.6vw, 40px)', fontWeight: 800, color: pageFg, margin: '0 0 12px', letterSpacing: '-0.02em', fontFamily: F }}>
              Everything you need to win more contracts
            </h2>
            <p style={{ fontSize: 18, color: bodyFg, maxWidth: 560, margin: '0 auto', lineHeight: 1.7, fontFamily: F, fontWeight: 500 }}>
              Purpose-built tools for government contractors serious about growing their pipeline.
            </p>
          </div>

          <div className="feature-grid">
            {FEATURES.map((f) => (
              <Link
                key={f.title}
                href={f.href}
                className="fcard"
                style={{ display: 'flex', flexDirection: 'column', borderRadius: 14, background: cardBg, border: `1.5px solid ${cardBorder}`, padding: '22px 20px', boxShadow: '0 2px 8px rgba(15,23,42,0.05)', textDecoration: 'none', minHeight: 252 }}
              >
                <div style={{ width: 38, height: 38, borderRadius: 9, background: f.bg, border: `1px solid ${f.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <f.Icon style={{ width: 17, height: 17, color: f.color }} />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: pageFg, margin: '0 0 10px', fontFamily: F }}>{f.title}</h3>
                <p style={{ fontSize: 16, color: bodyFg, lineHeight: 1.65, margin: '0 0 16px', fontFamily: F, fontWeight: 500 }}>
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
        <div className="section-pad" style={{ background: mutedBg, width: '100%', padding: '56px 0' }}>
          <div style={{ ...W }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <Pill label="How It Works" />
              <h2 style={{ fontSize: 'clamp(28px, 2.6vw, 40px)', fontWeight: 800, color: pageFg, margin: '0 0 12px', letterSpacing: '-0.02em', fontFamily: F }}>
                A repeatable bid pipeline in three steps
              </h2>
              <p style={{ fontSize: 18, color: bodyFg, maxWidth: 540, margin: '0 auto', lineHeight: 1.7, fontFamily: F, fontWeight: 500 }}>
                Reduce manual effort and improve win rate by turning one-off searching into a system.
              </p>
            </div>

            <div className="step-grid" style={{ marginBottom: 30 }}>
              {STEPS.map((step) => (
                <div
                  key={step.n}
                  className="scard"
                  style={{ borderRadius: 14, background: cardBg, border: `1.5px solid ${step.color}22`, padding: '22px 20px', boxShadow: '0 2px 9px rgba(15,23,42,0.05)', minHeight: 236 }}
                >
                  <div style={{ fontSize: 38, fontWeight: 900, lineHeight: 1, color: step.bg, WebkitTextStroke: `2px ${step.color}2e`, marginBottom: 12, fontFamily: F }}>
                    {step.n}
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: pageFg, margin: '0 0 10px', fontFamily: F }}>{step.title}</h3>
                  <p style={{ fontSize: 16, color: bodyFg, lineHeight: 1.68, margin: 0, fontFamily: F, fontWeight: 500 }}>{step.desc}</p>
                  <div style={{ marginTop: 20, height: 2.5, borderRadius: 2, background: `linear-gradient(90deg, ${step.color}, transparent)` }} />
                </div>
              ))}
            </div>

            <div style={{ textAlign: 'center' }}>
              <Link
                href="/signup"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '13px 32px', borderRadius: 10, background: '#0f766e', color: '#fff', fontSize: 16, fontWeight: 700, boxShadow: '0 3px 14px rgba(15,118,110,0.28)', textDecoration: 'none', fontFamily: F }}
              >
                Get Started Free <ArrowRight style={{ width: 14, height: 14 }} />
              </Link>
            </div>
          </div>
        </div>

        {/* ── Pricing Link ── */}
        <div className="section-pad" style={{ ...W, paddingTop: 52, paddingBottom: 52 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <Pill label="Pricing" />
            <h2 style={{ fontSize: 'clamp(28px, 2.6vw, 40px)', fontWeight: 800, color: pageFg, margin: '0 0 10px', letterSpacing: '-0.02em', fontFamily: F }}>
              View full monthly and annual pricing
            </h2>
            <p style={{ fontSize: 17, color: bodyFg, maxWidth: 560, margin: '0 auto', lineHeight: 1.65, fontFamily: F, fontWeight: 500 }}>
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
          <div className="cta-final-grid" style={{ borderRadius: 18, background: '#0f172a', border: '1px solid #1e293b', boxShadow: '0 24px 60px rgba(0,0,0,0.12)', display: 'grid', gridTemplateColumns: '1fr auto', gap: 32, alignItems: 'center', padding: '44px 52px', position: 'relative', overflow: 'hidden' }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#14b8a6', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10, fontFamily: F }}>
                Ready to modernize your workflow?
              </p>
              <h2 style={{ fontSize: 'clamp(28px, 2.6vw, 40px)', fontWeight: 800, color: '#fff', margin: '0 0 12px', letterSpacing: '-0.02em', fontFamily: F }}>
                Start with a 7-day free trial.
              </h2>
              <p style={{ fontSize: 17, color: '#cbd5e1', maxWidth: 540, margin: 0, lineHeight: 1.7, fontFamily: F }}>
                Immediate access to search, alerts, and insights. Upgrade only when the workflow proves its value.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>
              <Link
                href="/signup"
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
