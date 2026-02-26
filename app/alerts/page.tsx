// app/alerts/page.tsx
'use client'

import Link from 'next/link'
import { Suspense, useEffect, useState } from 'react'
import {
  BellRing, Bookmark, ArrowRight, Search, Plus, Zap, Mail, BarChart3,
  Clock, Edit3, Play, Pause, RefreshCw,
} from 'lucide-react'

function CountUp({ to, duration = 1200 }: { to: number; duration?: number }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    let start = 0
    const step = to / (duration / 16)
    const t = setInterval(() => {
      start += step
      if (start >= to) { setVal(to); clearInterval(t) } else setVal(Math.floor(start))
    }, 16)
    return () => clearInterval(t)
  }, [to, duration])
  return <>{val.toLocaleString()}</>
}

function Step({ num, icon: Icon, title, desc, color }: { num: number; icon: any; title: string; desc: string; color: string }) {
  return (
    <div className="flex gap-4 items-start">
      <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white shadow-sm" style={{ background: color }}>{num}</div>
      <div>
        <div className="flex items-center gap-1.5 mb-1"><Icon className="w-3.5 h-3.5" style={{ color }} /><p className="font-bold text-slate-800 text-sm">{title}</p></div>
        <p className="text-slate-500 text-xs leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

function AlertsHub() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700;9..40,800&display=swap');
        .hub { font-family: 'DM Sans', system-ui, sans-serif; background: #f8f7f4; min-height: 100vh; }
        .serif { font-family: 'DM Serif Display', Georgia, serif; }
        .grid-bg {
          background-image: linear-gradient(rgba(0,0,0,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.045) 1px, transparent 1px);
          background-size: 40px 40px;
        }
        .card-a { background: linear-gradient(145deg, #fff7ed, #ffedd5); border: 1.5px solid rgba(249,115,22,0.28); transition: transform .25s, box-shadow .25s, border-color .25s; }
        .card-a:hover { transform: translateY(-5px); box-shadow: 0 28px 64px rgba(249,115,22,0.16); border-color: rgba(249,115,22,0.55); }
        .card-s { background: linear-gradient(145deg, #f0fdfa, #ccfbf1); border: 1.5px solid rgba(20,184,166,0.28); transition: transform .25s, box-shadow .25s, border-color .25s; }
        .card-s:hover { transform: translateY(-5px); box-shadow: 0 28px 64px rgba(20,184,166,0.16); border-color: rgba(20,184,166,0.55); }
        .badge-a { background: linear-gradient(135deg,#c2410c,#f97316); box-shadow: 0 6px 18px rgba(234,88,12,.35); }
        .badge-s { background: linear-gradient(135deg,#0f766e,#14b8a6); box-shadow: 0 6px 18px rgba(20,184,166,.35); }
        .pill-a { background: rgba(249,115,22,.1); color:#c2410c; border:1px solid rgba(249,115,22,.25); }
        .pill-s { background: rgba(20,184,166,.1); color:#0f766e; border:1px solid rgba(20,184,166,.25); }
        .cta-a { background: linear-gradient(135deg,#c2410c,#ea580c,#f97316); box-shadow:0 8px 24px rgba(234,88,12,.35); transition:opacity .2s,transform .2s; }
        .cta-a:hover { opacity:.9; transform:translateY(-1px); }
        .cta-s { background: linear-gradient(135deg,#0f766e,#0d9488,#14b8a6); box-shadow:0 8px 24px rgba(13,148,136,.35); transition:opacity .2s,transform .2s; }
        .cta-s:hover { opacity:.9; transform:translateY(-1px); }
        .mock { background:white; border-radius:12px; border:1px solid rgba(0,0,0,.07); box-shadow:0 2px 12px rgba(0,0,0,.05); }
        .slab { background:white; border:1px solid rgba(0,0,0,.06); border-radius:16px; box-shadow:0 2px 12px rgba(0,0,0,.04); }
        @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        .fu { animation: fadeUp .55s ease both; }
        .d1{animation-delay:.08s}.d2{animation-delay:.16s}.d3{animation-delay:.24s}.d4{animation-delay:.32s}.d5{animation-delay:.4s}
      `}</style>

      <div className="hub">

        {/* ── HERO ──────────────────────────────────────────────────────── */}
        <div className="grid-bg">
          <div className="max-w-5xl mx-auto px-6 pt-14 pb-12 text-center">

            <div className="fu inline-flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 py-1.5 text-xs font-semibold text-slate-500 mb-7 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              PreciseGovCon · Alert &amp; Search Suite
            </div>

            <h1 className="fu d1 serif text-5xl sm:text-6xl text-slate-900 leading-tight mb-4">
              Never miss a<br />
              <span style={{ background: 'linear-gradient(120deg,#ea580c 30%,#14b8a6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                federal opportunity
              </span>
            </h1>

            <p className="fu d2 text-slate-500 text-base sm:text-lg max-w-lg mx-auto mb-10 leading-relaxed">
              Two tools. One pipeline. Save searches to run on demand, or set alerts
              that email results to your team automatically on your schedule.
            </p>

            <div className="fu d3 flex flex-wrap justify-center gap-10">
              {[
                { n: 1259, label: 'Live opportunities tracked today' },
                { n: 5,    label: 'Alert frequency options' },
                { n: 30,   label: 'Seconds to create your first alert' },
              ].map(({ n, label }) => (
                <div key={label} className="text-center">
                  <p className="text-3xl font-black text-slate-800"><CountUp to={n} /></p>
                  <p className="text-xs text-slate-400 mt-1 max-w-[110px] leading-snug">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── TWO TOOL CARDS ────────────────────────────────────────────── */}
        <div className="max-w-5xl mx-auto px-6 pb-14">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

            {/* ─ ALERT SUBSCRIPTIONS ─ */}
            <div className="card-a rounded-3xl overflow-hidden fu d2">
              <div className="px-7 pt-7 pb-5">
                <div className="flex items-start justify-between mb-5">
                  <div className="badge-a rounded-2xl p-3 text-white"><BellRing className="h-6 w-6" /></div>
                  <span className="pill-a text-xs font-bold px-3 py-1 rounded-full">Automated email delivery</span>
                </div>
                <h2 className="serif text-3xl text-slate-900 mb-2">Alert Subscriptions</h2>
                <p className="text-slate-500 text-sm leading-relaxed mb-5">
                  Configure once, receive forever. Alerts run on your schedule and deliver
                  formatted SAM.gov results directly to any email address — yours, your team's, or a client's.
                </p>

                {/* Live-ish mock card */}
                <div className="mock p-4 mb-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-sm font-bold text-slate-800">IT Professional Services — GSA</span>
                    </div>
                    <span className="text-xs bg-emerald-100 text-emerald-700 font-semibold px-2 py-0.5 rounded-full border border-emerald-200">Daily</span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-slate-400 mb-3">
                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" />3 recipients</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Ran today · 47 results</span>
                  </div>
                  <div className="flex gap-2">
                    {[
                      { Icon: Play,   label: 'Run Now',  cls: 'bg-orange-100 text-orange-700 border-orange-200' },
                      { Icon: Edit3,  label: 'Edit',     cls: 'bg-slate-100 text-slate-600 border-slate-200' },
                      { Icon: Pause,  label: 'Pause',    cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
                    ].map(({ Icon, label, cls }) => (
                      <button key={label} className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border pointer-events-none ${cls}`}>
                        <Icon className="w-3 h-3" />{label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white/55 border-t border-orange-100 px-7 py-5 space-y-3.5">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">How it works</p>
                <Step num={1} icon={Plus}       color="#ea580c" title="Create an alert"        desc="Pick your search filters, add email recipients, and choose a delivery frequency (daily, weekly, real-time, or more)." />
                <Step num={2} icon={RefreshCw}  color="#f97316" title="Runs automatically"     desc="Each scheduled run searches SAM.gov and emails matching results as a clean, formatted report." />
                <Step num={3} icon={Edit3}      color="#c2410c" title="Edit or pause anytime"  desc="Change criteria, swap recipients, update the schedule, or pause without losing your subscription." />
              </div>

              <div className="px-7 py-5 flex flex-col sm:flex-row gap-3">
                <Link href="/alerts/manage-alerts" className="cta-a flex-1 flex items-center justify-center gap-2 text-white font-bold py-3 px-5 rounded-xl text-sm">
                  Manage Alerts <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/alerts/manage-alerts" className="flex items-center justify-center gap-2 bg-white hover:bg-orange-50 text-orange-700 font-bold py-3 px-4 rounded-xl text-sm border border-orange-200 transition-colors">
                  <Plus className="w-4 h-4" /> New Alert
                </Link>
              </div>
            </div>

            {/* ─ SAVED SEARCHES ─ */}
            <div className="card-s rounded-3xl overflow-hidden fu d3">
              <div className="px-7 pt-7 pb-5">
                <div className="flex items-start justify-between mb-5">
                  <div className="badge-s rounded-2xl p-3 text-white"><Bookmark className="h-6 w-6" /></div>
                  <span className="pill-s text-xs font-bold px-3 py-1 rounded-full">One-click on-demand</span>
                </div>
                <h2 className="serif text-3xl text-slate-900 mb-2">Saved Searches</h2>
                <p className="text-slate-500 text-sm leading-relaxed mb-5">
                  Build a complex search once — keywords, NAICS codes, agencies, set-asides, date ranges —
                  and re-run it in a single click. No re-entering filters every session.
                </p>

                {/* Mock saved search card */}
                <div className="mock p-4 mb-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Bookmark className="w-3.5 h-3.5 text-teal-500" />
                      <span className="text-sm font-bold text-slate-800">Cybersecurity — SDVOSB Virginia</span>
                    </div>
                    <span className="text-xs bg-orange-100 text-orange-700 font-semibold px-2 py-0.5 rounded-full border border-orange-200 flex items-center gap-1">
                      <BellRing className="w-3 h-3" /> Alert On
                    </span>
                  </div>
                  <div className="flex gap-1 flex-wrap mb-3">
                    {['NAICS 541512', 'SDVOSB', 'VA', 'Active'].map(t => (
                      <span key={t} className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded border border-teal-100">{t}</span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    {[
                      { Icon: Play,    label: 'Run Search', cls: 'bg-teal-100 text-teal-700 border-teal-200' },
                      { Icon: Edit3,   label: 'Edit',       cls: 'bg-slate-100 text-slate-600 border-slate-200' },
                      { Icon: BellRing,label: 'Alert',      cls: 'bg-orange-100 text-orange-700 border-orange-200' },
                    ].map(({ Icon, label, cls }) => (
                      <button key={label} className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border pointer-events-none ${cls}`}>
                        <Icon className="w-3 h-3" />{label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white/55 border-t border-teal-100 px-7 py-5 space-y-3.5">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">How it works</p>
                <Step num={1} icon={Search}   color="#0d9488" title="Save your filters"       desc="Set any combination of keywords, NAICS, agency, set-aside, state, and date range — name it and save." />
                <Step num={2} icon={Play}     color="#14b8a6" title="Run it instantly"         desc="One click loads the search page with all filters pre-filled and results loading automatically." />
                <Step num={3} icon={BellRing} color="#0f766e" title="Convert to an alert"     desc="Turn any saved search into a scheduled alert with one click — no need to re-enter your criteria." />
              </div>

              <div className="px-7 py-5 flex flex-col sm:flex-row gap-3">
                <Link href="/alerts/manage-searches" className="cta-s flex-1 flex items-center justify-center gap-2 text-white font-bold py-3 px-5 rounded-xl text-sm">
                  Manage Searches <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/alerts/manage-searches" className="flex items-center justify-center gap-2 bg-white hover:bg-teal-50 text-teal-700 font-bold py-3 px-4 rounded-xl text-sm border border-teal-200 transition-colors">
                  <Plus className="w-4 h-4" /> Save Search
                </Link>
              </div>
            </div>
          </div>

          {/* ── CAPABILITY COMPARISON ─────────────────────────────────── */}
          <div className="slab p-6 mb-6 fu d4">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-5 text-center">What you can do with each tool</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: Plus,      label: 'Create',   a: 'New alert with recipients & frequency',    b: 'Save named filter set from any search' },
                { icon: Edit3,     label: 'Edit',     a: 'Update criteria, schedule & recipients',    b: 'Modify keywords, dates & any filter' },
                { icon: Play,      label: 'Run',      a: 'Manual trigger → instant email delivery',   b: 'One-click → pre-filled search results' },
                { icon: RefreshCw, label: 'Automate', a: 'Scheduled delivery on your timetable',      b: 'Convert a saved search into a live alert' },
              ].map(({ icon: Icon, label, a, b }) => (
                <div key={label} className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                  <div className="flex items-center gap-1.5 mb-3">
                    <Icon className="w-3.5 h-3.5 text-slate-500" />
                    <p className="text-xs font-black text-slate-600 uppercase tracking-wide">{label}</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex gap-2 items-start">
                      <span className="w-2 h-2 rounded-full mt-1 flex-shrink-0" style={{ background: '#f97316' }} />
                      <p className="text-xs text-slate-500 leading-snug">{a}</p>
                    </div>
                    <div className="flex gap-2 items-start">
                      <span className="w-2 h-2 rounded-full mt-1 flex-shrink-0" style={{ background: '#14b8a6' }} />
                      <p className="text-xs text-slate-500 leading-snug">{b}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── BOTTOM CTA ────────────────────────────────────────────── */}
          <div className="rounded-2xl bg-slate-800 px-7 py-5 flex flex-col sm:flex-row items-center justify-between gap-4 fu d5">
            <div>
              <p className="text-white font-bold text-sm">Rather start from a live search?</p>
              <p className="text-slate-400 text-xs mt-0.5">Run a search first, then save filters or create an alert directly from the results page.</p>
            </div>
            <Link href="/search" className="flex items-center gap-2 bg-white hover:bg-slate-100 text-slate-800 font-bold py-2.5 px-5 rounded-xl text-sm transition-colors flex-shrink-0">
              <Search className="h-4 w-4" /> Go to Search
            </Link>
          </div>
        </div>

      </div>
    </>
  )
}

export default function AlertsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <AlertsHub />
    </Suspense>
  )
}