// app/page.tsx
// PreciseGovCon — Landing Page

'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'

// ─── SVG Icon Components ───────────────────────────────────────────────────────
const IconSearch = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7" /><path d="m21 21-4.35-4.35" />
  </svg>
)
const IconChart = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
)
const IconDoc = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
  </svg>
)
const IconCheck = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)
const IconShield = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
)
const IconBell = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
)
const IconMonitor = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
  </svg>
)
const IconUser = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
)
const IconLogin = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" />
  </svg>
)
const IconArrow = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
)

// ─── Data ──────────────────────────────────────────────────────────────────────

const TICKER_ITEMS = [
  { cat: 'LIVE', text: '979 Active Federal Opportunities' },
  { cat: 'NEW',  text: 'Henry Bigelow FSV Midlife Extension — 2/20/2026' },
  { cat: 'NEW',  text: 'OEM Evoqua Water Technologies Power Systems — 2/20/2026' },
  { cat: 'NEW',  text: 'Display & Touch Screen Equipment — 2/18/2026' },
  { cat: 'AWARD',text: 'N00019-26-R0018 C-130 Depot Maintenance' },
  { cat: 'NEW',  text: 'Facilities Operations Support Services — DoD — 2/21/2026' },
  { cat: 'NEW',  text: 'IT Infrastructure Modernization — GSA — 2/20/2026' },
]

const SERVICES = [
  {
    href: '/search',
    title: 'Opportunity Search',
    desc: 'Access thousands of live federal, state, and local solicitations updated daily from SAM.gov — filtered to your business profile and NAICS codes.',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=500&fit=crop',
    badge: 'Live Data',
    badgeColor: 'green' as const,
    features: [
      'NAICS, agency, and keyword filtering',
      'Set-aside opportunity matching',
      'Save searches and export results',
      'Deadline tracking and notifications',
    ],
  },
  {
    href: '/services/sam-registration',
    title: 'SAM Registration',
    desc: 'Expert guidance through new registration and annual renewals on SAM.gov — ensuring your business stays compliant, active, and eligible to bid.',
    image: 'https://cdn.britannica.com/06/77406-050-37596D86/United-States-Capitol-place-Washington-DC-US.jpg',
    badge: 'Most Popular',
    badgeColor: 'orange' as const,
    features: [
      'New registration & annual renewal support',
      'Compliance review and verification',
      'Expiry reminders and renewal management',
      'UEI and CAGE code assistance',
    ],
  },
  {
    href: '/services/proposal-writing',
    title: 'Proposal Writing',
    desc: 'Win-focused proposals crafted by experienced contracting professionals who understand federal evaluation criteria, PWS structure, and compliance requirements.',
    image: 'https://images.crowdspring.com/blog/wp-content/uploads/2023/04/05034537/pexels-mikhail-nilov-6931353.jpg',
    badge: null,
    badgeColor: null,
    features: [
      'PWS, SOW, and RFP-compliant drafting',
      'Technical and price volume support',
      'Expert review before submission',
      'Past performance documentation',
    ],
  },
  {
    href: '/services/bid-no-bid-review',
    title: 'Bid / No-Bid Analysis',
    desc: 'AI-powered pursuit decisions that evaluate competitive landscape, fit, and win probability — so you invest resources in contracts you can actually win.',
    image: 'https://dashthis.com/media/5100/12-google-analytics-template.png',
    badge: 'AI-Powered',
    badgeColor: 'orange' as const,
    features: [
      'Win-probability scoring per opportunity',
      'Incumbent and competitive intelligence',
      'Agency spending history and patterns',
      'Strategic pursuit recommendations',
    ],
  },
  {
    href: '/services/set-aside-certifications',
    title: 'Set-Aside Certifications',
    desc: 'Guided assistance through 8(a), HUBZone, WOSB, and other federal certification programs to unlock exclusive bidding opportunities.',
    image: 'https://formspal.com/pdf-forms/other/business-certificate/business-certificate-preview.webp',
    badge: null,
    badgeColor: null,
    features: [
      'Eligibility assessment and preparation',
      'Application support and documentation',
      '8(a), HUBZone, WOSB, and more',
      'Ongoing certification maintenance',
    ],
  },
  {
    href: '/services/capability-statements',
    title: 'Capability Statements',
    desc: 'Professionally designed one-pagers that communicate your core competencies, differentiators, and past performance to federal buyers.',
    image: 'https://legiit-service.s3.amazonaws.com/2b82846a0ab182028f9b8e920966910c/b56c424e308b38e0088a71932167aa3c.jpg',
    badge: null,
    badgeColor: null,
    features: [
      'Professional layout and formatting',
      '48-hour turnaround',
      'Unlimited revisions',
      'Agency-specific versions available',
    ],
  },
]

const STEPS = [
  {
    num: '01',
    title: 'Search & Discover',
    desc: 'Browse thousands of live solicitations filtered to your NAICS codes, certifications, and agency preferences.',
    icon: <IconSearch size={22} />,
    variant: 'orange' as const,
    bullets: [
      'Filter by agency, NAICS, set-aside type, and value',
      'Automated alerts delivered to your inbox',
      'Save unlimited searches and track deadlines',
      'Covers federal, state, and local opportunities',
    ],
  },
  {
    num: '02',
    title: 'Qualify & Decide',
    desc: 'Use AI-powered Bid/No-Bid analysis to evaluate fit, competition, and win probability before committing resources.',
    icon: <IconChart size={22} />,
    variant: 'green' as const,
    bullets: [
      'AI win-probability scoring per opportunity',
      'Incumbent and competitive intelligence data',
      'Agency spending history and buying patterns',
      'Risk assessment summary before every pursuit',
    ],
  },
  {
    num: '03',
    title: 'Propose & Submit',
    desc: 'Work with our proposal professionals to prepare compliant, competitive submissions aligned with federal evaluation criteria.',
    icon: <IconDoc size={22} />,
    variant: 'orange' as const,
    bullets: [
      'PWS, SOW, and RFP-compliant drafting support',
      'Technical and price volume writing assistance',
      'Compliance review before every submission',
      'Capability statement preparation included',
    ],
  },
  {
    num: '04',
    title: 'Win & Grow',
    desc: 'Track your pipeline, manage active bids, and build a repeatable pattern of contract wins using dashboard analytics.',
    icon: <IconCheck size={22} />,
    variant: 'green' as const,
    bullets: [
      'Full CRM pipeline from search to award',
      'Win-rate tracking and pursuit analytics',
      'Competitive market intelligence reporting',
      'SAM.gov compliance and renewal management',
    ],
  },
]

const PLATFORM_FEATURES = [
  {
    icon: <IconSearch size={18} />,
    variant: 'orange' as const,
    title: 'Real-Time SAM.gov Data Feed',
    desc: 'Live integration with SAM.gov ensures you see every relevant opportunity the moment it is posted — no delays, no stale listings.',
  },
  {
    icon: <IconBell size={18} />,
    variant: 'green' as const,
    title: 'Intelligent Contract Alerts',
    desc: 'Automated notifications deliver matching opportunities to your inbox the moment they are published. Never miss a submission deadline.',
  },
  {
    icon: <IconMonitor size={18} />,
    variant: 'slate' as const,
    title: 'Analytics Dashboard & Pipeline Tracking',
    desc: 'Monitor win rates, active pursuits, and agency spending patterns. Make informed decisions with competitive market intelligence.',
  },
  {
    icon: <IconShield size={18} />,
    variant: 'orange' as const,
    title: 'Compliance & Registration Management',
    desc: 'Automated SAM.gov renewal reminders, certification expiry tracking, and compliance checklists keep your business eligible at all times.',
  },
]

const PLANS = [
  { name: 'Basic',        tagline: 'For getting started',            price: '$24.99', href: '/pricing', featured: false },
  { name: 'Professional', tagline: 'For serious bidding teams',       price: '$49',    href: '/pricing', featured: true  },
  { name: 'Enterprise',   tagline: 'For organizations at scale',      price: '$199',   href: '/pricing', featured: false },
]

const TESTIMONIALS = [
  {
    initials: 'JT', color: 'navy' as const,
    name: 'James T.', role: 'Chief Executive Officer — IT Services, Virginia',
    quote: 'PreciseGovCon guided us through SAM registration in days, not weeks. Within the same month we were actively bidding on our first federal contract. The process was straightforward and the support team was exceptional throughout.',
  },
  {
    initials: 'MR', color: 'orange' as const,
    name: 'Maria R.', role: 'Chief Operating Officer — Engineering Firm, Maryland',
    quote: 'The Bid/No-Bid analysis feature fundamentally changed our pursuit strategy. We stopped chasing contracts we could not win and doubled our award rate within two quarters. The return on investment was immediate and measurable.',
  },
  {
    initials: 'DK', color: 'green' as const,
    name: 'Derek K.', role: 'Founder & President — Logistics, Texas',
    quote: 'The proposal writing team helped us secure our first Department of Defense contract. Their knowledge of federal evaluation criteria and the PWS process gave us a competitive advantage we simply did not have before.',
  },
]

const CERTS = [
  { label: '8(a) Business Development', hi: true },
  { label: 'HUBZone',                   hi: true },
  { label: 'WOSB / EDWOSB',            hi: true },
  { label: 'SAM.gov Registration',      hi: false },
  { label: 'GSA Schedule',              hi: false },
  { label: 'SWaM Certification',        hi: false },
  { label: 'CMMC Compliance',           hi: false },
  { label: 'NIST 800-171',              hi: false },
  { label: 'MBE Certification',         hi: false },
  { label: 'State & Local Programs',    hi: false },
]


// ─── Ticker ────────────────────────────────────────────────────────────────────
function Ticker() {
  const doubled = [...TICKER_ITEMS, ...TICKER_ITEMS]
  return (
    <div className="bg-[#0C1B2A] border-b border-white/[0.07] overflow-hidden py-[7px]">
      <div
        className="flex gap-16 whitespace-nowrap"
        style={{ animation: 'ticker 36s linear infinite' }}
      >
        {doubled.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-[9px] text-[12px]">
            <span
              className="w-[6px] h-[6px] rounded-full bg-[#2DB84B] flex-shrink-0"
              style={{
                boxShadow: '0 0 6px rgba(45,184,75,0.5)',
                animation: 'pip 2s ease-in-out infinite',
              }}
            />
            <span className="text-white/35 font-bold tracking-[0.1em] text-[10px] uppercase">{item.cat}</span>
            <span className="text-white/70">{item.text}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Check bullet ──────────────────────────────────────────────────────────────
function Bullet({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-[9px] text-[13px] text-[#3D526A] leading-snug">
      <span className="w-[5px] h-[5px] rounded-full bg-[#D9520A] flex-shrink-0 mt-[6px]" />
      {text}
    </li>
  )
}

// ─── Trust check ──────────────────────────────────────────────────────────────
function TrustItem({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center gap-[7px] text-[13px] text-[#5E7491] font-medium">
      <span className="w-[16px] h-[16px] rounded-full bg-[#EBF7EF] border border-[#1C7D36]/30 flex items-center justify-center flex-shrink-0">
        <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
          <polyline points="1 3 3 5 7 1" stroke="#1C7D36" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      {text}
    </span>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <>
      <style>{`
        @keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes pip    { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        .fade-up-1 { animation: fadeUp 0.55s 0.04s ease both; }
        .fade-up-2 { animation: fadeUp 0.55s 0.12s ease both; }
        .fade-up-3 { animation: fadeUp 0.55s 0.20s ease both; }
        .fade-up-4 { animation: fadeUp 0.55s 0.28s ease both; }
        .fade-up-5 { animation: fadeUp 0.55s 0.36s ease both; }
        .fade-panel { animation: fadeUp 0.65s 0.18s ease both; }
        .svc-card:hover { transform: translateY(-5px); }
        .svc-card:hover .svc-img { transform: scale(1.04); }
        .svc-card:hover .svc-link-arrow { transform: translateX(4px); }
        .plan-row:hover { transform: translateX(5px); }
        .testi-card:hover { transform: translateY(-4px); }
        .cta3-card:hover  { transform: translateY(-4px); }
        .step-card:hover  { background: #EEF2F7; }
      `}</style>

      {/* ── Fixed nav placeholder space ─────────────────────────────────────── */}
      {/* Nav + Ticker are rendered by the layout; this page starts at content */}

      {/* ── HERO ──────────────────────────────────────────────────────────────── */}
      <section className="relative flex items-center overflow-hidden bg-white">
        {/* Background image — right half bleeds through */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&h=1080&fit=crop"
            alt="Modern government building"
            fill
            className="object-cover object-center"
            priority
            sizes="100vw"
          />
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(100deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0.97) 30%, rgba(255,255,255,0.82) 52%, rgba(255,255,255,0.25) 72%, rgba(255,255,255,0.05) 100%)',
            }}
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.08) 0%, transparent 50%, rgba(255,255,255,0.35) 100%)' }}
          />
        </div>

        <div className="relative z-10 w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left copy */}
          <div>
            {/* Live badge */}
            <div className="fade-up-1 inline-flex items-center gap-2 bg-[#EBF7EF] border border-[#1C7D36]/22 rounded-full px-4 py-[5px] mb-6">
              <span
                className="w-5 h-5 rounded-full bg-[#1C7D36] flex items-center justify-center flex-shrink-0"
              >
                <span className="w-[7px] h-[7px] rounded-full bg-white" />
              </span>
              <span className="text-[12px] font-bold text-[#1C7D36] tracking-[0.05em]">
                979 Live Opportunities — Updated Daily
              </span>
            </div>

            <h1
              className="fade-up-2 text-[#0C1B2A] font-bold leading-[1.04] tracking-[-0.025em] mb-4"
              style={{ fontSize: 'clamp(44px, 5.2vw, 74px)' }}
            >
              Find. Qualify.<br />
              <span className="text-[#D9520A]">Win</span> Federal<br />
              Contracts.
            </h1>

            <p className="fade-up-3 text-[17px] text-[#3D526A] leading-[1.72] max-w-[480px] mb-6">
              PreciseGovCon is your complete platform for government contracting success — from discovering the right opportunity to submitting a winning proposal. Real-time data, expert support, and intelligent tools in one place.
            </p>

            <div className="fade-up-4 flex flex-wrap gap-3 mb-7">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 text-[15px] font-semibold text-white bg-[#1C7D36] px-8 py-[13px] rounded-[9px] transition-all duration-150 hover:bg-[#196B2E] hover:-translate-y-px"
                style={{ boxShadow: '0 2px 8px rgba(28,125,54,0.28)' }}
              >
                Start 7-Day Free Trial
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 text-[15px] font-semibold text-[#1E293B] bg-white border border-[#C8D3E0] px-8 py-[13px] rounded-[9px] transition-all duration-150 hover:border-[#D9520A] hover:text-[#D9520A] hover:-translate-y-px"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
              >
                View Pricing
              </Link>
              <Link
                href="/signin"
                className="inline-flex items-center gap-2 text-[14px] font-semibold text-[#5E7491] px-2 py-[13px] transition-colors duration-150 hover:text-[#1E293B]"
              >
                Sign In &rarr;
              </Link>
            </div>

            <div className="fade-up-5 flex flex-wrap gap-4 pt-4 border-t border-[#E2E8F0]">
              <TrustItem text="7-day free trial" />
              <TrustItem text="No credit card required" />
              <TrustItem text="Cancel anytime" />
              <TrustItem text="Federal, state & local contracts" />
            </div>
          </div>

          {/* Right panel card */}
          <div className="fade-panel">
            <div className="bg-white rounded-[20px] border border-[#E2E8F0] overflow-hidden" style={{ boxShadow: '0 24px 60px rgba(0,0,0,0.13)' }}>
              {/* Card header */}
              <div className="bg-[#0C1B2A] px-7 py-5 flex items-center justify-between">
                <span className="text-[13px] font-semibold text-white/60 uppercase tracking-[0.04em]">Platform Overview</span>
                <span className="inline-flex items-center gap-[6px] text-[11px] font-bold text-[#2DB84B] uppercase tracking-[0.09em]">
                  <span className="w-[6px] h-[6px] rounded-full bg-[#2DB84B]" style={{ boxShadow: '0 0 6px rgba(45,184,75,0.6)', animation: 'pip 2s infinite' }} />
                  Live
                </span>
              </div>

              {/* Image */}
              <div className="relative h-[200px] overflow-hidden">
                <Image src="/images/hero.jpg" alt="Federal contracting professionals reviewing a bid" fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
              </div>

              {/* Metrics row */}
              <div className="grid grid-cols-3 border-t border-[#E2E8F0]">
                {[
                  { val: '979',   label: 'Active Bids',    color: '#D9520A' },
                  { val: '$2.4B+',label: 'Contract Value', color: '#D9520A' },
                  { val: '98%',   label: 'SAM Success',    color: '#1C7D36' },
                ].map((m, i) => (
                  <div key={i} className={`px-5 py-5 text-center ${i < 2 ? 'border-r border-[#E2E8F0]' : ''}`}>
                    <div className="text-[24px] font-bold leading-none mb-[5px]" style={{ color: m.color }}>{m.val}</div>
                    <div className="text-[11px] text-[#5E7491] font-medium">{m.label}</div>
                  </div>
                ))}
              </div>

              {/* CTA row */}
              <div className="px-6 py-[18px] border-t border-[#E2E8F0] flex items-center justify-between gap-3">
                <div>
                  <p className="text-[14px] font-bold text-[#0C1B2A]">Ready to start bidding?</p>
                  <p className="text-[13px] text-[#5E7491] mt-[2px]">Create your account in under 2 minutes.</p>
                </div>
                <Link
                  href="/signup"
                  className="text-[13px] font-semibold text-white bg-[#D9520A] px-4 py-[8px] rounded-[7px] whitespace-nowrap flex-shrink-0 transition-all hover:bg-[#C14A08]"
                  style={{ boxShadow: '0 2px 6px rgba(217,82,10,0.28)' }}
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── METRICS BAND ─────────────────────────────────────────────────────── */}
      <div className="bg-[#132236]" style={{ borderTop: '3px solid #D9520A' }}>
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 lg:grid-cols-4">
          {[
            { val: '979+',   label: 'Live Opportunities Tracked',          color: '#FF8C35' },
            { val: '$2.4B+', label: 'Federal Contract Value Facilitated',  color: '#FF8C35' },
            { val: '98%',    label: 'SAM Registration Success Rate',       color: '#2DB84B' },
            { val: '500+',   label: 'Businesses Served Nationwide',        color: '#FF8C35' },
          ].map((m, i) => (
            <div
              key={i}
              className="py-7 text-center border-white/[0.08]"
              style={{ borderRight: i < 3 ? '1px solid rgba(255,255,255,0.08)' : 'none' }}
            >
              <div className="text-[32px] font-bold leading-none mb-2 tracking-tight" style={{ color: m.color }}>{m.val}</div>
              <div className="text-[13px] text-white/50 font-medium">{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SERVICES ─────────────────────────────────────────────────────────── */}
      <section className="py-12 bg-white">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
            <div>
              <span className="block text-[11px] font-bold uppercase tracking-[0.13em] text-[#D9520A] mb-2 pl-[14px] relative before:content-[''] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-[6px] before:h-[6px] before:rounded-full before:bg-[#D9520A]">
                Our Services
              </span>
              <h2 className="text-[#0C1B2A] font-bold tracking-tight leading-[1.12]" style={{ fontSize: 'clamp(28px, 3vw, 42px)' }}>
                Everything you need to win<br />government contracts
              </h2>
            </div>
            <Link href="/services" className="text-[14px] font-semibold text-[#5E7491] border border-[#C8D3E0] px-5 py-[9px] rounded-[9px] transition-all hover:border-[#D9520A] hover:text-[#D9520A]">
              View All Services &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {SERVICES.map((svc) => (
              <Link
                key={svc.href}
                href={svc.href}
                className="svc-card group flex flex-col bg-white border border-[#E2E8F0] rounded-[16px] overflow-hidden transition-all duration-200"
                style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.07), 0 2px 8px rgba(0,0,0,0.04)' }}
              >
                {/* Image */}
                <div className="relative h-[155px] overflow-hidden flex-shrink-0">
                  <Image src={svc.image} alt={svc.title} fill className="svc-img object-cover transition-transform duration-500" sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(12,27,42,0.55) 0%, transparent 55%)' }} />
                  {svc.badge && (
                    <span
                      className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-[0.07em] text-white px-[10px] py-[3px] rounded-full"
                      style={{ background: svc.badgeColor === 'green' ? '#1C7D36' : '#D9520A' }}
                    >
                      {svc.badge}
                    </span>
                  )}
                </div>

                {/* Body */}
                <div className="flex flex-col flex-1 p-5">
                  <h3 className="text-[17px] font-bold text-[#0C1B2A] mb-2">{svc.title}</h3>
                  <p className="text-[13px] text-[#3D526A] leading-[1.65] mb-4 flex-1">{svc.desc}</p>
                  <ul className="space-y-[6px] mb-5">
                    {svc.features.map((f) => (
                      <li key={f} className="flex items-start gap-[8px] text-[13px] text-[#5E7491]">
                        <span className="w-[14px] h-[14px] rounded-full bg-[#EBF7EF] border border-[#1C7D36]/30 flex items-center justify-center flex-shrink-0 mt-[1px]">
                          <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                            <polyline points="1 3 3 5 7 1" stroke="#1C7D36" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <span className="inline-flex items-center gap-[5px] text-[13px] font-bold text-[#D9520A]">
                    Learn More
                    <span className="svc-link-arrow transition-transform duration-200"><IconArrow size={14} /></span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────────── */}
      <section className="py-12 bg-[#F7F9FC]">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <span className="block text-[11px] font-bold uppercase tracking-[0.13em] text-[#D9520A] mb-3">How It Works</span>
            <h2 className="text-[#0C1B2A] font-bold tracking-tight leading-[1.12] mb-3" style={{ fontSize: 'clamp(26px, 3vw, 38px)' }}>
              Four steps to your next contract award
            </h2>
            <p className="text-[16px] text-[#3D526A] leading-[1.72] max-w-[540px] mx-auto">
              A streamlined process built around how federal contracting actually works — from discovery through award.
            </p>
          </div>

          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 bg-white border border-[#E2E8F0] rounded-[20px] overflow-hidden"
            style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.09), 0 1px 4px rgba(0,0,0,0.05)' }}
          >
            {STEPS.map((step, i) => (
              <div
                key={step.num}
                className="step-card p-[28px_22px] border-[#E2E8F0] transition-colors duration-200"
                style={{ borderRight: i < STEPS.length - 1 ? '1px solid #E2E8F0' : 'none' }}
              >
                <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#D9520A] mb-4">Step {step.num}</div>
                <div
                  className="w-[44px] h-[44px] rounded-[10px] flex items-center justify-center mb-4"
                  style={{
                    background: step.variant === 'orange' ? '#FEF3EC' : '#EBF7EF',
                    border: `1px solid ${step.variant === 'orange' ? 'rgba(217,82,10,0.18)' : 'rgba(28,125,54,0.18)'}`,
                    color:  step.variant === 'orange' ? '#D9520A' : '#1C7D36',
                  }}
                >
                  {step.icon}
                </div>
                <h3 className="text-[16px] font-bold text-[#0C1B2A] mb-[10px]">{step.title}</h3>
                <p className="text-[13px] text-[#3D526A] leading-[1.65] mb-[14px]">{step.desc}</p>
                <ul className="space-y-[8px]">
                  {step.bullets.map((b) => <Bullet key={b} text={b} />)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLATFORM SPLIT ───────────────────────────────────────────────────── */}
      <section className="py-12 bg-white">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          {/* Image */}
          <div className="relative h-[360px]">
            <Image
              src="https://contentfuel.co/wp-content/uploads/2020/01/taking-notes-and-working-on-laptop.jpg"
              alt="PreciseGovCon platform in use"
              fill
              className="rounded-[16px] object-cover"
              style={{ boxShadow: '0 12px 36px rgba(0,0,0,0.11)' }}
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <div
              className="absolute -bottom-5 -right-5 bg-white border border-[#E2E8F0] rounded-[10px] px-5 py-4 hidden sm:block"
              style={{ boxShadow: '0 8px 28px rgba(0,0,0,0.10)', minWidth: 168 }}
            >
              <div className="text-[27px] font-bold text-[#1C7D36] leading-none">98%</div>
              <div className="text-[11px] text-[#5E7491] mt-1 font-medium">SAM Registration Success Rate</div>
              <div className="mt-[10px] h-1 rounded-full bg-[#E2E8F0] overflow-hidden">
                <div className="h-full w-[98%] rounded-full bg-[#1C7D36]" />
              </div>
            </div>
          </div>

          {/* Copy */}
          <div>
            <span className="block text-[11px] font-bold uppercase tracking-[0.13em] text-[#D9520A] mb-2 pl-[14px] relative before:content-[''] before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-[6px] before:h-[6px] before:rounded-full before:bg-[#D9520A]">
              The Platform
            </span>
            <h2 className="text-[#0C1B2A] font-bold tracking-tight leading-[1.12] mb-4" style={{ fontSize: 'clamp(28px, 3vw, 42px)' }}>
              Your complete contracting command center
            </h2>
            <p className="text-[16px] text-[#3D526A] leading-[1.72] mb-6">
              From discovering your first opportunity to managing a multi-million dollar pipeline, PreciseGovCon delivers the data, tools, and professional support your business needs to compete at the highest level.
            </p>
            <div className="space-y-5">
              {PLATFORM_FEATURES.map((f) => (
                <div key={f.title} className="flex items-start gap-4">
                  <div
                    className="w-[42px] h-[42px] rounded-[10px] flex items-center justify-center flex-shrink-0"
                    style={{
                      background: f.variant === 'orange' ? '#FEF3EC' : f.variant === 'green' ? '#EBF7EF' : '#EEF2F7',
                      border: `1px solid ${f.variant === 'orange' ? 'rgba(217,82,10,0.15)' : f.variant === 'green' ? 'rgba(28,125,54,0.15)' : '#E2E8F0'}`,
                      color:  f.variant === 'orange' ? '#D9520A' : f.variant === 'green' ? '#1C7D36' : '#5E7491',
                    }}
                  >
                    {f.icon}
                  </div>
                  <div>
                    <div className="text-[15px] font-bold text-[#0C1B2A] mb-[3px]">{f.title}</div>
                    <div className="text-[13px] text-[#3D526A] leading-[1.65]">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING CTA ──────────────────────────────────────────────────────── */}
      <div className="relative bg-[#0C1B2A] py-12 overflow-hidden" style={{ borderTop: '3px solid #D9520A' }}>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 70% 80% at 75% 50%, rgba(217,82,10,0.10) 0%, transparent 65%), radial-gradient(ellipse 50% 60% at 20% 30%, rgba(28,125,54,0.07) 0%, transparent 55%)',
          }}
        />
        <div className="relative z-10 max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-[72px] items-center">
          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-3 bg-[#1C7D36]/15 border border-[#1C7D36]/30 rounded-[10px] px-[18px] py-3 mb-7">
              <div className="w-[36px] h-[36px] rounded-[8px] bg-[#1C7D36]/20 flex items-center justify-center">
                <IconCheck size={18} />
              </div>
              <div>
                <div className="text-[16px] font-bold text-[#2DB84B] leading-none">7-Day Free Trial</div>
                <div className="text-[12px] text-white/50 mt-[3px]">Full platform access — no credit card required</div>
              </div>
            </div>
            <h2 className="font-bold leading-[1.07] mb-4 tracking-tight" style={{ fontSize: 'clamp(34px, 3.8vw, 54px)', color: '#fff' }}>
              Start winning<br /><span className="text-[#FF8C35]">contracts today.</span>
            </h2>
            <p className="text-[15px] text-white/60 leading-[1.7] mb-8 max-w-[440px]">
              Every plan includes a 7-day free trial with complete access to opportunity search, alerts, and platform tools from day one. No commitment required.
            </p>
            <div className="flex flex-wrap gap-[14px]">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 text-[15px] font-semibold text-white bg-[#1C7D36] px-8 py-[13px] rounded-[9px] transition-all hover:bg-[#196B2E] hover:-translate-y-px"
                style={{ boxShadow: '0 2px 8px rgba(28,125,54,0.28)' }}
              >
                Create Free Account
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 text-[15px] font-semibold text-white/85 px-8 py-[13px] rounded-[9px] border border-white/28 transition-all hover:bg-white/10 hover:border-white/55"
              >
                Compare Plans
              </Link>
            </div>
          </div>

          {/* Right — plan stack */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/35 mb-3">Subscription Plans</div>
            <div className="space-y-3">
              {PLANS.map((plan) => (
                <Link
                  key={plan.href + plan.name}
                  href={plan.href}
                  className="plan-row flex items-center justify-between gap-3 px-5 py-4 rounded-[10px] border transition-all duration-150"
                  style={{
                    background: plan.featured ? 'rgba(217,82,10,0.10)' : 'rgba(255,255,255,0.05)',
                    borderColor: plan.featured ? '#D9520A' : 'rgba(255,255,255,0.09)',
                  }}
                >
                  <div>
                    <div className="text-[15px] font-bold text-white">
                      {plan.name}{plan.featured ? <span className="ml-2 text-[11px] font-bold text-[#FF8C35] uppercase tracking-wide">Most Popular</span> : null}
                    </div>
                    <div className="text-[12px] text-white/45 mt-[2px]">{plan.tagline}</div>
                  </div>
                  <div className="text-[24px] font-bold text-[#FF8C35] whitespace-nowrap">
                    {plan.price}<span className="text-[13px] font-normal text-white/35">/mo</span>
                  </div>
                  <span className="text-[#D9520A]/70 text-[16px]">&rarr;</span>
                </Link>
              ))}
              <p className="text-[12px] text-white/30 text-center pt-1">
                All plans include a 7-day free trial &nbsp;&bull;&nbsp; Cancel anytime &nbsp;&bull;&nbsp; Save 20% annually
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── TESTIMONIALS ─────────────────────────────────────────────────────── */}
      <section className="py-12 bg-white">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <span className="block text-[11px] font-bold uppercase tracking-[0.13em] text-[#D9520A] mb-3">Client Results</span>
            <h2 className="text-[#0C1B2A] font-bold tracking-tight leading-[1.12]" style={{ fontSize: 'clamp(28px, 3vw, 42px)' }}>
              Businesses growing through<br />government contracting
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="testi-card bg-[#F7F9FC] border border-[#E2E8F0] rounded-[16px] p-5 transition-all duration-200"
                style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}
              >
                {/* Stars */}
                <div className="flex gap-[2px] mb-4">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="w-[14px] h-[14px] bg-[#D9520A]"
                      style={{ clipPath: 'polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)' }}
                    />
                  ))}
                </div>
                <div className="text-[38px] leading-none text-[#C8D3E0] font-serif mb-[6px]">&ldquo;</div>
                <p className="text-[14px] text-[#3D526A] leading-[1.72] mb-[22px]">{t.quote}</p>
                <div className="flex items-center gap-3 border-t border-[#E2E8F0] pt-[18px]">
                  <div
                    className="w-[38px] h-[38px] rounded-full flex items-center justify-center text-[14px] font-bold text-white flex-shrink-0"
                    style={{ background: t.color === 'navy' ? '#0C1B2A' : t.color === 'orange' ? '#D9520A' : '#1C7D36' }}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <div className="text-[14px] font-bold text-[#0C1B2A]">{t.name}</div>
                    <div className="text-[12px] text-[#5E7491]">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CERTIFICATION PROGRAMS ────────────────────────────────────────────── */}
      <div className="bg-[#EEF2F7] border-t border-b border-[#E2E8F0] py-8">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-[11px] font-bold uppercase tracking-[0.14em] text-[#5E7491] mb-5">
            Federal Certification Programs We Support
          </p>
          <div className="flex flex-wrap gap-[10px] justify-center">
            {CERTS.map((c) => (
              <span
                key={c.label}
                className="text-[13px] font-semibold px-[18px] py-[7px] rounded-[8px] border"
                style={{
                  background: c.hi ? '#EBF7EF' : '#FFFFFF',
                  borderColor: c.hi ? 'rgba(28,125,54,0.35)' : '#E2E8F0',
                  color: c.hi ? '#1C7D36' : '#3D526A',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                }}
              >
                {c.label}
              </span>
            ))}
          </div>
        </div>
      </div>

    </>
  )
}