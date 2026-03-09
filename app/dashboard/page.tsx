// app/dashboard/page.tsx
'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import OpportunityModal from '../../components/OpportunityModal'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  Search, Bell, TrendingUp, Zap, Plus, ArrowRight, Loader2, CheckCircle,
  AlertCircle, X, Share2, Settings, ChevronRight, Activity, Clock,
  Target, Award, Rocket, MapPin, Building2, AlertTriangle, Lightbulb,
  RefreshCw, Shield, CheckSquare, Square, Database, Brain,
  BarChart3, Calendar, FileText
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

type UserPreferences = {
  setAsides: string[]
  naicsCodes: string[]
  agencies: string[]
  contractSizeMin?: number
  contractSizeMax?: number
  keywords: string[]
  states: string[]
  businessType: string
  completedOnboarding: boolean
}

type SearchFilters = { naics?: string; state?: string; setaside?: string; agency?: string }

type ActiveSearch = {
  id: string; name: string; query: string
  filters?: SearchFilters; resultsCount?: number; newCount?: number
}

type SavedOpportunity = {
  noticeId: string; title: string; agency: string
  value?: number; posted?: string; deadline?: string
  naics?: string; match?: number | null; setAside?: string
}

type DashNotification = {
  type: 'deadline'|'match'|'alert'|'ai'
  title: string; time?: string
  iconType: 'deadline'|'match'|'alert'|'ai'
}

type DeadlineItem = { title: string; agency: string; deadline: string; value?: number|string }

type DataSource = 'live' | 'public' | 'loading'

type DashboardData = {
  activeSearchesCount: number; savedOppCount: number
  avgMatchScore: number | null; thisWeekCount: number
  totalActiveOpportunities: number
  activeSearches: ActiveSearch[]; savedOpportunities: SavedOpportunity[]
  recentOpportunities: SavedOpportunity[]; notifications: DashNotification[]
  upcomingDeadlines: DeadlineItem[]; userGoals: string[]
  userPreferences?: UserPreferences
  loading: boolean; error: string | null; dataSource: DataSource; lastRefreshed?: Date
}

type ActivityLog = { id: string; type: 'search'|'alert'|'save'|'share'|'ai'; title: string; timestamp: string }
type TrendData = { month: string; opportunities: number; matches: number }
type DrawerKey = 'activeSearches'|'savedOpps'|'matchInfo'|'notifications'|'settings'|'goalSetup'|'recentMatches'|'deadlines'|null

// ─── Survey Config ────────────────────────────────────────────────────────────

const SET_ASIDE_OPTIONS = [
  { value: 'SDVOSB', label: 'SDVOSB', desc: 'Service-Disabled Veteran-Owned' },
  { value: 'VOSB',   label: 'VOSB',   desc: 'Veteran-Owned Small Business' },
  { value: '8A',     label: '8(a)',    desc: 'SBA 8(a) Program' },
  { value: 'WOSB',   label: 'WOSB',   desc: 'Women-Owned Small Business' },
  { value: 'HUBZONE',label: 'HUBZone',desc: 'Historically Underutilized Business Zone' },
  { value: 'SBA',    label: 'Small Business', desc: 'General SB Set-Aside' },
]

const NAICS_OPTIONS = [
  { value: '541512', label: '541512 — Computer Systems Design' },
  { value: '541519', label: '541519 — IT Services' },
  { value: '541611', label: '541611 — Management Consulting' },
  { value: '541715', label: '541715 — R&D / AI / Data Science' },
  { value: '541513', label: '541513 — Computer Facilities Mgmt' },
  { value: '236220', label: '236220 — Commercial Construction' },
  { value: '621999', label: '621999 — Healthcare & Medical' },
  { value: '541330', label: '541330 — Engineering Services' },
]

const KEYWORD_SUGGESTIONS = [
  'zero trust',
  'cloud migration',
  'cybersecurity',
  'devsecops',
  'data analytics',
  'machine learning',
  'artificial intelligence',
  'help desk',
  'program management',
  'systems engineering',
  'proposal support',
  'compliance',
]

const AGENCY_OPTIONS = [
  'Department of Defense (DoD)', 'Department of Veterans Affairs (VA)',
  'Department of Homeland Security (DHS)', 'General Services Administration (GSA)',
  'Department of the Army', 'Department of the Navy',
  'Department of the Air Force', 'Dept of Health and Human Services',
  'Department of Transportation', 'Department of Energy',
]

const CONTRACT_SIZE_OPTIONS = [
  { label: 'Under $250K', min: 0, max: 250000 },
  { label: '$250K – $1M', min: 250000, max: 1000000 },
  { label: '$1M – $5M',   min: 1000000, max: 5000000 },
  { label: '$5M – $25M',  min: 5000000, max: 25000000 },
  { label: '$25M+',       min: 25000000, max: undefined },
]

const STATE_OPTIONS = ['VA','MD','DC','TX','FL','CA','NY','GA','PA','NC','IL','OH','AZ','CO','WA','MA','Remote/Nationwide']

// ─── Seed data ────────────────────────────────────────────────────────────────

const MOCK_REFRESH_MS = 25000

function clone<T>(v: T): T { return JSON.parse(JSON.stringify(v)) }

const BASE: Omit<DashboardData,'dataSource'> = {
  activeSearchesCount: 3, savedOppCount: 5, avgMatchScore: 82, thisWeekCount: 12,
  totalActiveOpportunities: 1328,
  activeSearches: [
    { id: 's1', name: 'Cybersecurity – VA', query: 'zero trust modernization', filters: { naics:'541512', state:'VA', setaside:'SDVOSB', agency:'Dept of Veterans Affairs' }, resultsCount: 186, newCount: 5 },
    { id: 's2', name: 'Cloud Migration – DHS', query: 'cloud migration devsecops', filters: { naics:'541519', setaside:'SBA', agency:'Dept of Homeland Security' }, resultsCount: 142, newCount: 3 },
    { id: 's3', name: 'AI & Data Science', query: 'machine learning analytics', filters: { naics:'541715', state:'MD' }, resultsCount: 97, newCount: 2 },
  ],
  savedOpportunities: [
    { noticeId:'W91-DEF-2412', title:'Zero Trust Engineering Support', agency:'Dept of the Army', value:3200000, posted:'2 days ago', deadline:'5 days', naics:'541512', match:90, setAside:'SDVOSB' },
    { noticeId:'70RD-CLD-2403', title:'DHS Cloud Migration Surge Team', agency:'Dept of Homeland Security', value:2100000, posted:'4 days ago', deadline:'8 days', naics:'541519', match:84 },
    { noticeId:'36C10B-ALR-007', title:'VA Analytics Modernization', agency:'Dept of Veterans Affairs', value:1500000, posted:'1 week ago', deadline:'12 days', naics:'541611', match:78, setAside:'VOSB' },
    { noticeId:'FA-8604-AI-2024', title:'AI-enabled ISR Tooling', agency:'Dept of the Air Force', value:5800000, posted:'3 days ago', deadline:'15 days', naics:'541715', match:86 },
    { noticeId:'GS-35F-NextGen', title:'GSA NextGen Support Desk', agency:'General Services Administration', value:950000, posted:'5 days ago', deadline:'21 days', naics:'541513', match:74 },
  ],
  recentOpportunities: [
    { noticeId:'FA-4801-CYBER', title:'Defensive Cyber Readiness', agency:'Dept of the Air Force', value:2600000, posted:'Today', deadline:'7 days', naics:'541519', match:88 },
    { noticeId:'HQ0034-CloudOps', title:'Pentagon Cloud Operations Cell', agency:'Dept of Defense', value:4100000, posted:'1 day ago', deadline:'10 days', naics:'541512', match:83 },
    { noticeId:'N00189-AI-Naval', title:'Naval AI Decision Support', agency:'Dept of the Navy', value:2800000, posted:'3 days ago', deadline:'6 days', naics:'541715', match:79 },
  ],
  notifications: [
    { type:'deadline', title:'Deadline in 3 days: Defensive Cyber Readiness', time:'Dept of the Air Force', iconType:'deadline' },
    { type:'match', title:'Saved: DHS Cloud Migration Surge Team', time:'Posted 4 days ago', iconType:'match' },
    { type:'ai', title:'AI flagged 2 expiring SDVOSB set-asides', time:'Review this week', iconType:'ai' },
  ],
  upcomingDeadlines: [
    { title:'Defensive Cyber Readiness', agency:'Dept of the Air Force', deadline:'3 days', value:'$2.6M' },
    { title:'Zero Trust Engineering Support', agency:'Dept of the Army', deadline:'5 days', value:'$3.2M' },
    { title:'VA Analytics Modernization', agency:'Dept of Veterans Affairs', deadline:'12 days', value:'$1.5M' },
  ],
  userGoals: [], loading: false, error: null,
}

function rand(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min }

function makePublicData(): DashboardData {
  const b = clone(BASE)
  b.activeSearches = b.activeSearches.map((s: ActiveSearch) => ({ ...s, resultsCount: Math.max(40,(s.resultsCount??0)+rand(-18,24)), newCount: rand(0,7) }))
  b.savedOpportunities = b.savedOpportunities.map((o: SavedOpportunity) => ({
    ...o, match: Math.min(97,Math.max(65,(o.match??80)+rand(-5,5))),
    value: o.value ? Math.max(250000,o.value+rand(-200000,200000)) : undefined,
    deadline: `${rand(3,21)} days`, posted: fmtRel(new Date(Date.now()-rand(0,6)*86400000).toISOString()),
  }))
  b.recentOpportunities = b.recentOpportunities.map((o: SavedOpportunity) => ({
    ...o, match: Math.min(95,Math.max(60,(o.match??75)+rand(-7,7))),
    deadline: `${rand(4,14)} days`, posted: fmtRel(new Date(Date.now()-rand(0,3)*86400000).toISOString()),
  }))
  const all = [...b.savedOpportunities,...b.recentOpportunities].filter((o: SavedOpportunity) => o.match)
  b.avgMatchScore = all.length ? Math.round(all.reduce((s: number,o: SavedOpportunity) => s+(o.match??0),0)/all.length) : b.avgMatchScore
  b.thisWeekCount = Math.max(6, b.activeSearches.reduce((s: number,sr: ActiveSearch) => s+(sr.newCount??0),0)+rand(3,8))
  b.totalActiveOpportunities = rand(1290,1380)
  b.upcomingDeadlines = b.savedOpportunities.slice(0,3).map((o: SavedOpportunity) => ({
    title:o.title, agency:o.agency, deadline:o.deadline??'',
    value: o.value ? `$${(o.value/1_000_000).toFixed(1)}M` : 'TBD',
  }))
  return { ...b, dataSource:'public', loading:false, error:null, lastRefreshed: new Date() }
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function fmtRel(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = now.getTime() - date.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 2) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'Yesterday';
  if (d < 7) return `${d} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtCur(v?: number) {
  if (!v) return 'TBD'
  return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',notation:'compact',maximumFractionDigits:1}).format(v)
}

function firstName(session: any): string {
  const n = session?.user?.name?.trim?.() || ''
  if (n) return n.split(' ')[0]
  const e = session?.user?.email || ''
  return e.includes('@') ? e.split('@')[0] : 'there'
}

function qs(p: Record<string,string|number|undefined|null>): string {
  const sp = new URLSearchParams()
  Object.entries(p).forEach(([k,v]) => { if(v!=null && v!=='') sp.set(k,String(v)) })
  const q = sp.toString(); return q ? `?${q}` : ''
}

function matchScore(opp: any, searches: ActiveSearch[], goals: string[], prefs?: UserPreferences): number|null {
  let score = 40
  const text = `${opp?.title||''} ${opp?.description||''}`.toLowerCase()
  const kws = new Set(searches.flatMap(s => s.query.toLowerCase().split(/\s+/).filter(Boolean)))
  kws.forEach(kw => { if(text.includes(kw)) score += 4 })
  const naics = String(opp?.naics||opp?.naics_code||'').trim()
  if (naics && searches.some(s => s.filters?.naics===naics)) score += 20
  if (prefs?.naicsCodes?.includes(naics)) score += 10
  const sa = String(opp?.setAside||opp?.set_aside||'').toUpperCase()
  if (sa && prefs?.setAsides?.includes(sa)) score += 12
  if (sa && searches.some(s => s.filters?.setaside && sa.includes(s.filters.setaside))) score += 8
  const agency = String(opp?.agency||'').toLowerCase()
  if (prefs?.agencies?.some(a => agency.includes(a.toLowerCase().split(' ')[0]))) score += 6
  if (searches.some(s => s.filters?.agency && agency.includes(s.filters.agency.toLowerCase()))) score += 5
  const val = Number(opp?.value||0)
  if (prefs?.contractSizeMin && val>=prefs.contractSizeMin) score += 4
  if (prefs?.contractSizeMax && val<=prefs.contractSizeMax) score += 4
  return Math.min(100,Math.max(35,Math.round(score)))
}

// ─── Score pill ───────────────────────────────────────────────────────────────

function Score({ v }: { v: number }) {
  const cls = v >= 85
    ? 'bg-emerald-100 text-emerald-700 border border-emerald-400 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-600'
    : v >= 70
    ? 'bg-sky-100 text-sky-700 border border-sky-400 dark:bg-sky-900/40 dark:text-sky-300 dark:border-sky-600'
    : 'bg-slate-100 text-slate-500 border border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-600'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-base font-bold ${cls}`}>
      {v}%
    </span>
  )
}

// ─── Onboarding Survey ────────────────────────────────────────────────────────

function Survey({ name, onComplete, onDismiss }: {
  name: string; onComplete: (p: UserPreferences) => void; onDismiss: (dontShowAgain?: boolean) => void
}) {
  const [step, setStep] = useState(0)
  const [hideFuture, setHideFuture] = useState(false)
  const [naicsQuery, setNaicsQuery] = useState('')
  const [keywordInput, setKeywordInput] = useState('')
  const [liveNaicsOptions, setLiveNaicsOptions] = useState<Array<{ value: string; label: string }>>([])
  const [liveKeywordSuggestions, setLiveKeywordSuggestions] = useState<string[]>([])
  const [prefs, setPrefs] = useState<Partial<UserPreferences>>({
    setAsides:[], naicsCodes:[], agencies:[], keywords:[], states:[], businessType:'SDVOSB'
  })
    useEffect(() => {
      let cancelled = false
      fetch('/api/sam/taxonomy?limit=250', { cache: 'no-store' })
        .then(r => (r.ok ? r.json() : null))
        .then(d => {
          if (cancelled || !d?.ok) return
          if (Array.isArray(d.naics) && d.naics.length) {
            setLiveNaicsOptions(d.naics)
          }
          if (Array.isArray(d.keywords) && d.keywords.length) {
            setLiveKeywordSuggestions(d.keywords)
          }
        })
        .catch(() => {
          // Keep local fallback constants if SAM taxonomy fetch fails.
        })
      return () => { cancelled = true }
    }, [])

    const naicsCatalog = liveNaicsOptions.length ? liveNaicsOptions : NAICS_OPTIONS
    const keywordCatalog = liveKeywordSuggestions.length ? liveKeywordSuggestions : KEYWORD_SUGGESTIONS

  const TOTAL = 5
  function tog<T>(arr: T[], v: T): T[] { return arr.includes(v) ? arr.filter(x=>x!==v) : [...arr,v] }
  function addNaics(value: string) {
    setPrefs(p => {
      const existing = new Set(p.naicsCodes || [])
      existing.add(value)
      return { ...p, naicsCodes: Array.from(existing) }
    })
  }
  function removeNaics(value: string) {
    setPrefs(p => ({ ...p, naicsCodes: (p.naicsCodes || []).filter(c => c !== value) }))
  }
  function normalizeKeyword(raw: string) {
    return raw.trim().replace(/\s+/g, ' ').toLowerCase()
  }
  function addKeyword(raw: string) {
    const next = normalizeKeyword(raw)
    if (!next) return
    setPrefs(p => {
      const existing = new Set((p.keywords || []).map(normalizeKeyword))
      if (existing.has(next)) return p
      return { ...p, keywords: [...(p.keywords || []), next] }
    })
    setKeywordInput('')
  }
  function removeKeyword(value: string) {
    const normalized = normalizeKeyword(value)
    setPrefs(p => ({
      ...p,
      keywords: (p.keywords || []).filter(k => normalizeKeyword(k) !== normalized),
    }))
  }

  const filteredNaics = naicsCatalog.filter(o => {
    const q = naicsQuery.trim().toLowerCase()
    if (!q) return true
    return o.value.includes(q) || o.label.toLowerCase().includes(q)
  })

  const predictedKeywords = keywordCatalog.filter(k => {
    const q = keywordInput.trim().toLowerCase()
    if (!q) return true
    return k.includes(q)
  })
    .filter(k => !(prefs.keywords || []).some(x => normalizeKeyword(x) === normalizeKeyword(k)))
    .slice(0, 8)

  function done() {
    const p: UserPreferences = {
      setAsides:prefs.setAsides||[], naicsCodes:prefs.naicsCodes||[],
      agencies:prefs.agencies||[], keywords:prefs.keywords||[], states:prefs.states||[],
      contractSizeMin:prefs.contractSizeMin, contractSizeMax:prefs.contractSizeMax,
      businessType:prefs.businessType||'SDVOSB', completedOnboarding:true,
    }
    fetch('/api/account/preferences',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(p)}).catch(()=>{})
    onComplete(p)
  }

  const steps = [
    // Step 0: Welcome
    <div key="w" className="text-center py-4">
      <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-sky-100 to-emerald-100 border border-sky-200 flex items-center justify-center mx-auto mb-5 shadow-lg">
        <Building2 className="w-7 h-7 text-sky-500" />
      </div>
      <h2 className="text-3xl font-black mb-3 bg-linear-to-r from-orange-500 via-sky-500 to-emerald-500 bg-clip-text text-transparent">
        Welcome, {name}
      </h2>
      <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed max-w-sm mx-auto">
        60-second setup to personalize your intelligence feed — certifications, NAICS codes, and target agencies.
      </p>
      <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto mt-5">
        {([['Set-Asides', Shield, 'text-emerald-600'], ['NAICS', Target, 'text-sky-600'], ['Agencies', Building2, 'text-violet-600']] as const).map(([l, Icon, c]) => (
          <div key={l} className="rounded-xl bg-linear-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 p-3 text-center shadow">
            <Icon className={`w-4 h-4 ${c} mx-auto mb-1`} />
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{l}</p>
          </div>
        ))}
      </div>
    </div>,

    // Step 1: Set-Asides
    <div key="sa" className="flex flex-col gap-3">
      <div>
        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1">Small Business Certifications</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Select all that apply — filters exclusive set-aside opportunities.</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {SET_ASIDE_OPTIONS.map(o => {
          const sel = prefs.setAsides?.includes(o.value)
          return (
            <button key={o.value} type="button"
              onClick={() => setPrefs(p=>({...p,setAsides:tog(p.setAsides||[],o.value)}))}
              className={`flex items-center gap-2 w-full text-left rounded-xl border p-3 transition-all text-sm cursor-pointer ${sel ? 'border-sky-400 bg-sky-50 dark:bg-sky-900/30 dark:border-sky-500' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'}`}>
              {sel
                ? <CheckSquare className="w-4 h-4 text-sky-500 shrink-0" />
                : <Square className="w-4 h-4 text-slate-400 shrink-0" />}
              <div>
                <p className={`font-bold text-sm ${sel ? 'text-sky-600 dark:text-sky-400' : 'text-slate-900 dark:text-white'}`}>{o.label}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{o.desc}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>,

    // Step 2: NAICS + Keywords
    <div key="n" className="flex flex-col gap-4">
      <div>
        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1">NAICS + Keywords</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Search NAICS, add capability keywords, and avoid duplicates automatically.</p>
      </div>

      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Search NAICS</p>
        <input
          type="text"
          value={naicsQuery}
          onChange={e => setNaicsQuery(e.target.value)}
          placeholder="Type code or description (e.g., 5415, cybersecurity)"
          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 outline-none focus:border-violet-400"
        />
      </div>

      {(prefs.naicsCodes || []).length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {(prefs.naicsCodes || []).map(code => (
            <button
              key={code}
              type="button"
              onClick={() => removeNaics(code)}
              className="inline-flex items-center gap-1 rounded-lg border border-violet-300 bg-violet-50 px-2.5 py-1 text-xs font-bold text-violet-700 dark:border-violet-700 dark:bg-violet-900/30 dark:text-violet-300 cursor-pointer"
              title="Remove NAICS code"
            >
              {code} <X className="w-3 h-3" />
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
        {filteredNaics.map(o => {
          const sel = prefs.naicsCodes?.includes(o.value)
          return (
            <button key={o.value} type="button"
              onClick={() => sel ? removeNaics(o.value) : addNaics(o.value)}
              className={`flex items-center gap-2 w-full text-left rounded-xl border p-3 transition-all text-sm cursor-pointer ${sel ? 'border-violet-400 bg-violet-50 dark:bg-violet-900/30 dark:border-violet-500' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300'}`}>
              {sel
                ? <CheckSquare className="w-4 h-4 text-violet-500 shrink-0" />
                : <Square className="w-4 h-4 text-slate-400 shrink-0" />}
              <span className="font-mono text-sm text-slate-700 dark:text-slate-300">{o.label}</span>
            </button>
          )
        })}
      </div>

      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Keywords</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={keywordInput}
            onChange={e => setKeywordInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addKeyword(keywordInput)
              }
            }}
            placeholder="Add keyword (e.g., zero trust, devsecops)"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 outline-none focus:border-sky-400"
          />
          <button
            type="button"
            onClick={() => addKeyword(keywordInput)}
            className="rounded-xl bg-sky-500 hover:bg-sky-600 text-white px-3 py-2 text-xs font-black border-none cursor-pointer"
          >
            Add
          </button>
        </div>

        {predictedKeywords.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {predictedKeywords.map(s => (
              <button
                key={s}
                type="button"
                onClick={() => addKeyword(s)}
                className="rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-700 dark:border-sky-700 dark:bg-sky-900/30 dark:text-sky-300 cursor-pointer"
              >
                + {s}
              </button>
            ))}
          </div>
        )}

        {(prefs.keywords || []).length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(prefs.keywords || []).map(k => (
              <button
                key={k}
                type="button"
                onClick={() => removeKeyword(k)}
                className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 cursor-pointer"
                title="Remove keyword"
              >
                {k} <X className="w-3 h-3" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>,

    // Step 3: Agencies
    <div key="ag" className="flex flex-col gap-3">
      <div>
        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1">Target Agencies</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Select up to 5 to prioritize in your pipeline.</p>
      </div>
      <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto">
        {AGENCY_OPTIONS.map(ag => {
          const sel = prefs.agencies?.includes(ag)
          const maxed = !sel && (prefs.agencies||[]).length >= 5
          return (
            <button key={ag} type="button"
              onClick={() => !maxed && setPrefs(p=>({...p,agencies:tog(p.agencies||[],ag)}))}
              className={`flex items-center gap-2 w-full text-left rounded-xl border p-3 transition-all text-sm ${maxed ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'} ${sel ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 dark:border-emerald-500' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300'}`}>
              {sel
                ? <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0" />
                : <Square className="w-4 h-4 text-slate-400 shrink-0" />}
              <span className="text-sm text-slate-700 dark:text-slate-300">{ag}</span>
            </button>
          )
        })}
      </div>
      <p className="text-xs text-slate-400">{(prefs.agencies||[]).length}/5 selected</p>
    </div>,

    // Step 4: Size & State
    <div key="sz" className="flex flex-col gap-4">
      <div>
        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1">Contract Size & Location</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm">Match your capacity and place of performance.</p>
      </div>
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Contract Size</p>
        <div className="grid grid-cols-2 gap-2">
          {CONTRACT_SIZE_OPTIONS.map(o => {
            const sel = prefs.contractSizeMin === o.min
            return (
              <button key={o.label} type="button"
                onClick={() => setPrefs(p=>({...p,contractSizeMin:o.min,contractSizeMax:o.max}))}
                className={`text-left rounded-xl border p-2.5 text-sm font-semibold transition-all cursor-pointer ${sel ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300'}`}>
                {o.label}
              </button>
            )
          })}
        </div>
      </div>
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Place of Performance</p>
        <div className="flex flex-wrap gap-1.5">
          {STATE_OPTIONS.map(s => {
            const sel = prefs.states?.includes(s)
            return (
              <button key={s} type="button"
                onClick={() => setPrefs(p=>({...p,states:tog(p.states||[],s)}))}
                className={`rounded-lg border px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${sel ? 'border-sky-400 bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'}`}>
                {s}
              </button>
            )
          })}
        </div>
      </div>
    </div>,
  ]

  return (
    <div onClick={() => onDismiss(hideFuture)}
      className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div onClick={e => e.stopPropagation()}
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-slate-100 dark:bg-slate-800 absolute top-0 left-0 right-0">
          <div className="h-full bg-sky-500 transition-all duration-300" style={{width:`${(step/(TOTAL-1))*100}%`}} />
        </div>
        <button onClick={() => onDismiss(hideFuture)}
          className="absolute right-3 top-3 z-10 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold cursor-pointer">
          <X className="w-3 h-3" />Close
        </button>

        <div className="p-6 pt-8">
          {/* Step dots */}
          <div className="flex items-center gap-1.5 mb-5">
            {Array.from({length:TOTAL}).map((_,i) => (
              <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i <= step ? 'bg-sky-500 flex-2' : 'bg-slate-200 dark:bg-slate-700 flex-1'}`} />
            ))}
            <span className="text-xs text-slate-400 font-bold ml-1 shrink-0">{step+1}/{TOTAL}</span>
          </div>

          <div className="min-h-70">{steps[step]}</div>

          <label className="inline-flex items-center gap-2 mt-4 cursor-pointer text-slate-500 dark:text-slate-400 text-xs font-medium">
            <input type="checkbox" checked={hideFuture} onChange={e => setHideFuture(e.target.checked)} className="w-3.5 h-3.5 cursor-pointer" />
            Don&apos;t show this setup modal again if I close it
          </label>

          <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-200 dark:border-slate-700">
            {step === 0
              ? <button onClick={() => onDismiss(hideFuture)} className="px-4 py-2 rounded-lg bg-transparent border border-slate-200 dark:border-slate-700 text-slate-500 text-sm font-bold cursor-pointer">Skip</button>
              : <button onClick={() => setStep(s => Math.max(0,s-1))} className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-bold cursor-pointer">← Back</button>
            }
            {step < TOTAL - 1
              ? <button onClick={() => setStep(s => s+1)} className="px-5 py-2 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-sm font-black cursor-pointer border-none transition-colors">
                  {step === 0 ? 'Get Started' : 'Continue'} →
                </button>
              : <button onClick={done} className="flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-black cursor-pointer border-none transition-colors">
                  Launch My Dashboard
                </button>
            }
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  // Dashboard refresh state and modal
  const [refreshing, setRefreshing] = useState(false);
  const [showOpportunityModal, setShowOpportunityModal] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<SavedOpportunity | null>(null);
  const router = useRouter()
  const { data: session } = useSession()
  const name = useMemo(() => firstName(session), [session])
  const [mounted, setMounted] = useState(false)

  const [drawer, setDrawer] = useState<DrawerKey>(null)
  const [userPrefs, setUserPrefs] = useState<UserPreferences|null>(null)

  const [dash, setDash] = useState<DashboardData>({
    activeSearchesCount:0, savedOppCount:0, avgMatchScore:null, thisWeekCount:0,
    totalActiveOpportunities:0, activeSearches:[], savedOpportunities:[],
    recentOpportunities:[], notifications:[], upcomingDeadlines:[], userGoals:[],
    loading:true, error:null, dataSource:'loading',
  })

  const [analysis, setAnalysis] = useState<{summary:string;topOpps:Array<{title:string;reason:string;urgency:'high'|'medium'|'low'}>;recs:string[]}|null>(null)
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [goalInput, setGoalInput] = useState('')
  const [goalSaving, setGoalSaving] = useState(false)
  const [toast, setToast] = useState<{type:'success'|'error';msg:string}|null>(null)
  const [showAiModal, setShowAiModal] = useState(false)
  const [hoveredTrend, setHoveredTrend] = useState<TrendData | null>(null)

  const surveyDismissKey = useMemo(
    () => `pgc-survey-dismissed:${session?.user?.email?.toLowerCase() ?? 'anon'}`,
    [session?.user?.email]
  )

  const shouldSuppressSurvey = useCallback(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem(surveyDismissKey) === '1'
  }, [surveyDismissKey])

  useEffect(() => { setMounted(true) }, [])

  const [activityLog] = useState<ActivityLog[]>([
    {id:'1',type:'search',title:'Searched: "Zero Trust Modernization"',timestamp:new Date(Date.now()-3600000).toISOString()},
    {id:'2',type:'alert',title:'Alert: 5 new SDVOSB matches',timestamp:new Date(Date.now()-7200000).toISOString()},
    {id:'3',type:'ai',title:'AI summary generated for 3 opportunities',timestamp:new Date(Date.now()-14400000).toISOString()},
    {id:'4',type:'save',title:'Saved: VA Analytics Modernization',timestamp:new Date(Date.now()-86400000).toISOString()},
  ])

  const [trend] = useState<TrendData[]>([
    {month:'Oct',opportunities:240,matches:45},{month:'Nov',opportunities:310,matches:68},
    {month:'Dec',opportunities:280,matches:52},{month:'Jan',opportunities:390,matches:87},
    {month:'Feb',opportunities:450,matches:123},{month:'Mar',opportunities:520,matches:156},
  ])

  useEffect(() => {
    if (!session?.user?.email) return

    let cancelled = false
    let surveyTimer: ReturnType<typeof setTimeout> | null = null

    const queueOnboardingRedirect = () => {
      if (shouldSuppressSurvey()) return
      // Give users a moment to settle on the dashboard after redirect/login.
      surveyTimer = setTimeout(() => {
        if (!cancelled) router.replace('/dashboard/onboarding?next=/dashboard')
      }, 1400)
    }

    fetch('/api/account/preferences').then(r=>r.ok?r.json():null)
      .then(d => {
        if (cancelled) return
        if (d?.completedOnboarding) { setUserPrefs(d); return }
        queueOnboardingRedirect()
      })
      .catch(() => {
        if (cancelled) return
        queueOnboardingRedirect()
      })

    return () => {
      cancelled = true
      if (surveyTimer) clearTimeout(surveyTimer)
    }
  }, [session?.user?.email, shouldSuppressSurvey, router])

  useEffect(() => {
    if (!session?.user?.email) {
      const tick = () => setDash(makePublicData())
      tick()
      const id = setInterval(tick, MOCK_REFRESH_MS)
      return () => clearInterval(id)
    }
    async function load() {
      try {
        const since = new Date(Date.now()-7*86400000).toISOString().split('T')[0].replace(/-/g,'/')
        const pq = [userPrefs?.naicsCodes?.[0]?`&naics=${userPrefs.naicsCodes[0]}`:'',userPrefs?.setAsides?.[0]?`&setAside=${userPrefs.setAsides[0]}`:'',userPrefs?.states?.[0]?`&state=${userPrefs.states[0]}`:''].join('')
        const [sR,oR,wR,pR,prR] = await Promise.allSettled([
          fetch('/api/saved-searches').then(r=>r.ok?r.json():{searches:[]}),
          fetch('/api/saved-opportunities').then(r=>r.ok?r.json():{savedOpportunities:[]}),
          fetch(`/api/sam/opportunities?limit=10&postedFrom=${since}${pq}`).then(r=>r.ok?r.json():{totalRecords:0,opportunities:[]}),
          fetch('/api/account/profile').then(r=>r.ok?r.json():{goals:[]}),
          fetch('/api/account/preferences').then(r=>r.ok?r.json():null),
        ])
        const searches: ActiveSearch[] = sR.status==='fulfilled' ? (sR.value?.searches??[]).map((s:any) => ({id:s.id,name:s.name,query:s.keywords||s.query||'',filters:{naics:s.naics||'',state:s.state||'',setaside:s.setAside||'',agency:s.agency||''},resultsCount:s._count?.search_runs,newCount:s.newResults??0})) : []
        const prefs: UserPreferences|null = prR.status==='fulfilled' ? prR.value : userPrefs
        const goals: string[] = pR.status==='fulfilled' ? (pR.value?.goals??[]) : []
        const weekly = wR.status==='fulfilled' ? wR.value : {totalRecords:0,opportunities:[]}
        const savedOpps: SavedOpportunity[] = oR.status==='fulfilled' ? (oR.value?.savedOpportunities??[]).map((o:any) => ({noticeId:o.notice_id||o.noticeId||o.id,title:o.title||'Untitled',agency:o.organization_name||o.agency||'',value:o.awardValue||o.value,posted:(o.posted_date||o.postedDate)?fmtRel(o.posted_date||o.postedDate):undefined,deadline:o.response_deadline?`${Math.ceil((new Date(o.response_deadline).getTime()-Date.now())/86400000)} days`:undefined,naics:o.naics_code||o.naics,setAside:o.setAside||o.set_aside,match:matchScore(o,searches,[],prefs||undefined)})) : []
        const recentOpps: SavedOpportunity[] = (weekly.opportunities??[]).slice(0,5).map((o:any) => ({noticeId:o.noticeId||o.id,title:o.title||'Untitled',agency:o.department||o.agency||'',value:o.awardValue||o.value,posted:o.postedDate?fmtRel(o.postedDate):undefined,deadline:o.responseDeadline?`${Math.ceil((new Date(o.responseDeadline).getTime()-Date.now())/86400000)} days`:undefined,naics:o.naics||o.naicsCode,setAside:o.setAside,match:matchScore(o,searches,goals,prefs||undefined)}))
        const notifs: DashNotification[] = [...savedOpps.filter(o=>o.deadline&&parseInt(o.deadline)<=7&&!o.deadline.includes('Expired')).slice(0,2).map(o=>({type:'deadline' as const,title:`Deadline in ${o.deadline}: ${o.title}`,time:o.agency,iconType:'deadline' as const})),...recentOpps.filter(o=>(o.match??0)>=80).slice(0,2).map(o=>({type:'match' as const,title:`${o.match}% match: ${o.title}`,time:`Posted ${o.posted}`,iconType:'match' as const}))].slice(0,5)
        const allScored = [...savedOpps,...recentOpps].filter(o=>o.match)
        const avgMatch = allScored.length ? Math.round(allScored.reduce((s,o)=>s+(o.match??0),0)/allScored.length) : null
        const deadlines = savedOpps.filter(o=>o.deadline&&!o.deadline.includes('Expired')).sort((a,b)=>parseInt(a.deadline??'999')-parseInt(b.deadline??'999')).slice(0,3).map(o=>({title:o.title,agency:o.agency,deadline:o.deadline??'',value:o.value??''}))
        if(goals.length) setGoalInput(goals.join('\n'))
        setDash({activeSearchesCount:searches.length,savedOppCount:savedOpps.length,avgMatchScore:avgMatch,thisWeekCount:weekly.totalRecords??weekly.opportunities?.length??0,totalActiveOpportunities:weekly.totalRecords??0,activeSearches:searches,savedOpportunities:savedOpps,recentOpportunities:recentOpps,notifications:notifs,upcomingDeadlines:deadlines,userGoals:goals,userPreferences:prefs||undefined,loading:false,error:null,dataSource:'live',lastRefreshed:new Date()})
      } catch { setDash({...makePublicData(),error:'Using general feed — personalized data temporarily unavailable'}) }
    }
    load()
    const id = setInterval(load,5*60*1000)
    return () => clearInterval(id)
  }, [session?.user?.email, userPrefs])

  const buildAnalysis = useCallback((d: DashboardData) => {
    const top = [...d.savedOpportunities,...d.recentOpportunities].filter(o=>typeof o.match==='number').sort((a,b)=>(b.match??0)-(a.match??0)).slice(0,3)
    return {
      summary:`${d.userPreferences?.setAsides?.length?`Your ${d.userPreferences.setAsides.join('/')} certification is active. `:''}Pipeline shows ${d.thisWeekCount} curated matches with ${d.avgMatchScore??'—'}% avg fit. Prioritize pursuits closing within 10 days.`,
      topOpps:top.map(o=>({title:o.title,reason:`${o.match??'--'}% match · ${o.agency}`,urgency:(parseInt(o.deadline??'30')<=7?'high':parseInt(o.deadline??'30')<=14?'medium':'low') as 'high'|'medium'|'low'})),
      recs:[d.upcomingDeadlines[0]?`${d.upcomingDeadlines.length} deadline${d.upcomingDeadlines.length>1?'s':''} approaching — earliest closes in ${d.upcomingDeadlines[0].deadline}`:null,d.userPreferences?.setAsides?.length?`Filter by ${d.userPreferences.setAsides[0]} to surface exclusive set-aside wins`:'Complete your profile to unlock set-aside filtering',d.userPreferences?.naicsCodes?.[0]?`NAICS ${d.userPreferences.naicsCodes[0]} is trending — run a fresh search`:'Add NAICS codes to improve match scoring'].filter(Boolean) as string[],
    }
  }, [])

  useEffect(() => {
    if (!dash.loading && (dash.savedOppCount>0||dash.recentOpportunities.length>0)) setAnalysis(buildAnalysis(dash))
  }, [dash, buildAnalysis])

  const runAi = useCallback(async () => {
    if (analysisLoading) return
    setAnalysisLoading(true)
    try {
      const opportunities = [...dash.savedOpportunities, ...dash.recentOpportunities]
      const res = await fetch('/api/analytics/claude', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          opportunities,
          userProfile: {
            naicsCodes: userPrefs?.naicsCodes || [],
            preferredAgencies: userPrefs?.agencies || [],
          },
        }),
      })
      if (!res.ok) throw new Error('Analytics request failed')
      const data = await res.json()
      const p = data?.analysis
      if (!p?.summary) throw new Error('Invalid analytics response')

      const fallbackTop = [...dash.savedOpportunities, ...dash.recentOpportunities]
        .filter(o=>typeof o.match==='number')
        .sort((a,b)=>(b.match??0)-(a.match??0))
        .slice(0,3)
        .map(o=>({
          title:o.title,
          reason:`${o.match??'--'}% match · ${o.agency}`,
          urgency:(parseInt(o.deadline??'30')<=7?'high':parseInt(o.deadline??'30')<=14?'medium':'low') as 'high'|'medium'|'low'
        }))

      setAnalysis({
        summary:p.summary,
        topOpps:fallbackTop,
        recs:Array.isArray(p.recommendations) ? p.recommendations : buildAnalysis(dash).recs,
      })
    } catch { setAnalysis(buildAnalysis(dash)) }
    finally { setAnalysisLoading(false) }
  }, [dash, analysisLoading, userPrefs, buildAnalysis])

  const saveGoals = useCallback(async () => {
    const goals = goalInput.split('\n').map(g=>g.trim()).filter(Boolean)
    setGoalSaving(true)
    try {
      await fetch('/api/account/profile',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({goals})})
      setDash(prev=>({...prev,userGoals:goals}))
      setDrawer(null)
      setToast({type:'success',msg:'Goals saved. Match scores updated.'})
    } catch { setToast({type:'error',msg:'Failed to save goals.'}) }
    finally { setGoalSaving(false) }
  }, [goalInput])

  // Refresh handler for dashboard
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Simulate refresh delay
      await new Promise(res => setTimeout(res, 1200));
      window.location.reload();
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(()=>setToast(null),3500)
    return () => clearTimeout(t)
  }, [toast])

  const isAuth = !!session?.user?.email
  const hour = mounted ? new Date().getHours() : 12
  const greeting = hour<12?'Good morning':hour<17?'Good afternoon':'Good evening'

  const stats = useMemo(() => [
    {label:'Deadlines',       value:dash.upcomingDeadlines.length, sub:'Next 14 days',    bg:'linear-gradient(135deg,#f97316,#dc2626)', onClick:()=>router.push('/opportunities?filter=deadlines')},
    {label:'Active Searches', value:dash.activeSearchesCount,      sub:'Saved alerts',    bg:'linear-gradient(135deg,#38bdf8,#4f46e5)', onClick:()=>router.push('/alerts')},
    {label:'Saved Opps',      value:dash.savedOppCount,            sub:'Watchlist',       bg:'linear-gradient(135deg,#fbbf24,#ea580c)', onClick:()=>router.push('/opportunities?saved=1')},
    {label:'New This Week',   value:dash.thisWeekCount,            sub:'SAM.gov matches', bg:'linear-gradient(135deg,#34d399,#0f766e)', onClick:()=>router.push('/search')},
    {label:'Avg Match Score', value:dash.avgMatchScore!==null?`${dash.avgMatchScore}%`:'—', sub:'Profile fit', bg:'linear-gradient(135deg,#a78bfa,#7c3aed,#c026d3)', onClick:()=>router.push('/opportunities?sort=match')},
    {label:'Notifications',   value:dash.notifications.length,     sub:'Signals',         bg:'linear-gradient(135deg,#64748b,#1e293b)', onClick:()=>router.push('/alerts?tab=notifications')},
  ], [dash, router])

  const primarySearch = dash.activeSearches[0]

  if (!mounted) {
    return (
      <div className="mx-auto w-full max-w-480 min-h-screen bg-linear-to-br from-white via-slate-50 to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 px-3 sm:px-4 lg:px-6 xl:px-8 pt-4 pb-8">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
          <p className="text-slate-500 dark:text-slate-400 font-semibold">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const drawerTitles: Record<NonNullable<DrawerKey>, string> = {
    activeSearches:'Active Searches', savedOpps:'Saved Opportunities', recentMatches:'Latest Matches',
    deadlines:'Upcoming Deadlines', notifications:'Notifications', matchInfo:'Match Score',
    goalSetup:'Business Goals', settings:'Settings',
  }

  const notifIconMap: Record<string, LucideIcon> = { deadline:AlertTriangle, match:Target, alert:Bell, ai:Bell }
  const notifColorMap: Record<string, string> = { deadline:'text-amber-500', match:'text-emerald-500', alert:'text-rose-500', ai:'text-violet-500' }

  return (
    <div className="mx-auto w-full max-w-480 min-h-screen bg-linear-to-br from-white via-slate-50 to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900 text-slate-900 dark:text-slate-100">
      {/* Opportunity Modal Integration */}
      {showOpportunityModal && selectedOpportunity && (
        <OpportunityModal
          isOpen={showOpportunityModal}
          onClose={() => setShowOpportunityModal(false)}
          opportunity={selectedOpportunity}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-60 w-full max-w-md px-4 pointer-events-none">
          <div className={`flex items-center gap-3 rounded-xl border backdrop-blur-md px-4 py-3 shadow-2xl pointer-events-auto ${toast.type==='success' ? 'border-emerald-500/40 bg-emerald-950/95 text-emerald-400' : 'border-rose-500/40 bg-rose-950/95 text-rose-400'}`}>
            {toast.type==='success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <p className="flex-1 text-sm font-semibold">{toast.msg}</p>
            <button onClick={()=>setToast(null)} className="text-current opacity-60 hover:opacity-100 cursor-pointer bg-transparent border-none p-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50">
          <div onClick={()=>setDrawer(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="absolute right-0 top-0 h-full w-full max-w-md flex flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 shadow-2xl">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                {drawerTitles[drawer]}
              </h2>
              <button onClick={()=>setDrawer(null)} className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">

              {drawer==='activeSearches' && (
                <>
                  {dash.activeSearches.map(s => (
                    <button key={s.id}
                      onClick={()=>{router.push(`/search${qs({keywords:s.query,naics:s.filters?.naics,state:s.filters?.state,setAside:s.filters?.setaside})}`);setDrawer(null)}}
                      className="w-full text-left rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 p-3 transition-colors cursor-pointer">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-slate-900 dark:text-white truncate mb-1">{s.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            "{s.query}"
                            {s.filters?.naics && <span className="text-sky-500 font-mono ml-2">NAICS {s.filters.naics}</span>}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {(s.newCount??0)>0 && <span className="px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 text-xs font-bold">+{s.newCount}</span>}
                          <span className="text-sm font-bold text-sky-500">{s.resultsCount??'—'}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                      </div>
                    </button>
                  ))}
                  <Link href="/search" onClick={()=>setDrawer(null)} className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-black mt-1 transition-colors shadow-md shadow-orange-500/20">
                    <Search className="w-3.5 h-3.5" />Go to Search
                  </Link>
                </>
              )}

              {drawer==='savedOpps' && (
                <>
                  {dash.savedOpportunities.map(o => (
                    <button key={o.noticeId}
                      onClick={()=>{router.push(`/opportunities${qs({noticeId:o.noticeId})}`);setDrawer(null)}}
                      className="w-full text-left rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 p-3 transition-colors cursor-pointer">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-slate-900 dark:text-white truncate mb-1">{o.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap gap-2">
                            <span>{o.agency}</span>
                            {o.setAside && <span className="text-emerald-600 dark:text-emerald-400">{o.setAside}</span>}
                            {o.deadline && <span className="text-amber-600 dark:text-amber-400">Closes {o.deadline}</span>}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {typeof o.match==='number' && <Score v={o.match} />}
                          {o.value && <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{fmtCur(o.value)}</span>}
                        </div>
                      </div>
                    </button>
                  ))}
                  <button onClick={()=>{router.push('/opportunities?saved=1');setDrawer(null)}} className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold cursor-pointer mt-1 transition-colors shadow-md shadow-emerald-600/20">
                    View All Saved →
                  </button>
                </>
              )}

              {drawer==='recentMatches' && (
                <>
                  {dash.recentOpportunities.length===0
                    ? <p className="text-sm text-slate-400 text-center py-8">No matches yet. Run a search to populate.</p>
                    : dash.recentOpportunities.map(o => (
                      <button key={o.noticeId}
                        onClick={()=>{router.push(`/opportunities${qs({noticeId:o.noticeId})}`);setDrawer(null)}}
                        className="w-full text-left rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 p-3 transition-colors cursor-pointer">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-slate-900 dark:text-white truncate mb-1">{o.title}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{o.agency}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            {typeof o.match==='number' && <Score v={o.match} />}
                            {o.deadline && <span className="text-xs font-bold text-amber-500">{o.deadline}</span>}
                            {o.value && <span className="text-xs text-slate-400">{fmtCur(o.value)}</span>}
                          </div>
                        </div>
                      </button>
                    ))
                  }
                </>
              )}

              {drawer==='deadlines' && (
                <>
                  {dash.upcomingDeadlines.map((dl,i) => (
                    <div key={i} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-sm text-slate-900 dark:text-white mb-1">{dl.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1"><Building2 className="w-3 h-3" />{dl.agency}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-black text-amber-500 flex items-center gap-1"><Clock className="w-3 h-3" />{dl.deadline}</p>
                          {dl.value && <p className="text-xs text-slate-400 mt-0.5">{dl.value}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                  <button onClick={()=>{router.push('/opportunities');setDrawer(null)}} className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-black cursor-pointer mt-1 border-none transition-colors">
                    Review Pipeline →
                  </button>
                </>
              )}

              {drawer==='notifications' && (
                <>
                  {dash.notifications.map((n,i) => {
                    const Icon = notifIconMap[n.iconType] || Bell
                    return (
                      <div key={i} className="flex items-start gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3">
                        <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${notifColorMap[n.iconType]}`} />
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white mb-0.5">{n.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{n.time}</p>
                        </div>
                      </div>
                    )
                  })}
                </>
              )}

              {drawer==='matchInfo' && (
                <div className="flex flex-col gap-3">
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">Match score (0–100) estimates how well an opportunity fits your business profile and search intent.</p>
                  {['NAICS code alignment','Set-aside certification match','Keyword relevance','Agency preference','Contract size fit','Search profile overlap'].map(item => (
                    <div key={item} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />{item}
                    </div>
                  ))}
                </div>
              )}

              {drawer==='goalSetup' && (
                <div className="flex flex-col gap-3">
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">Describe your capture goals to refine match scoring and AI analysis.</p>
                  <textarea value={goalInput} onChange={e=>setGoalInput(e.target.value)} rows={6}
                    placeholder={'Capture 2 VA task orders per quarter\nSDVOSB IT modernization under $5M\nBuild DoD cloud portfolio'}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm p-3 resize-none outline-none focus:border-sky-400 dark:focus:border-sky-500 transition-colors" />
                  <div className="flex flex-wrap gap-1.5">
                    {['IT & Cybersecurity','Cloud Migration','8(a) Set-Asides','SDVOSB Contracts','DoD Contracts'].map(t => (
                      <button key={t} type="button" onClick={()=>setGoalInput(p=>p?`${p}\n${t}`:t)}
                        className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors">
                        + {t}
                      </button>
                    ))}
                  </div>
                  <button onClick={saveGoals} disabled={goalSaving||!goalInput.trim()}
                    className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-black cursor-pointer border-none transition-colors">
                    {goalSaving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Saving…</> : <><CheckCircle className="w-3.5 h-3.5" />Save & Update Scores</>}
                  </button>
                </div>
              )}

              {drawer==='settings' && (
                <div className="flex flex-col gap-3">
                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 text-sm">
                    <p className="text-slate-500 dark:text-slate-400 mb-2">Name: <strong className="text-slate-900 dark:text-white">{name}</strong></p>
                    <p className="text-slate-500 dark:text-slate-400 mb-2">Email: <strong className="text-slate-900 dark:text-white">{session?.user?.email}</strong></p>
                    {userPrefs?.setAsides?.length && <p className="text-slate-500 dark:text-slate-400">Certifications: <strong className="text-emerald-600 dark:text-emerald-400">{userPrefs.setAsides.join(', ')}</strong></p>}
                  </div>
                  <button onClick={()=>{router.push('/dashboard/onboarding?next=/dashboard');setDrawer(null)}} className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-bold cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                    Update Preferences →
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ── Page content ─────────────────────────────────────────────────────── */}
      <div className="px-3 sm:px-4 lg:px-6 xl:px-8 pb-10">

        {/* ── Hero section ─────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden rounded-2xl mb-4 shadow-md border border-slate-200 dark:border-slate-700 bg-linear-to-br from-white via-slate-50 to-sky-50 dark:from-slate-800 dark:via-slate-800 dark:to-slate-900">
          <div className="relative w-full px-4 sm:px-6 lg:px-8 py-6">
            {isAuth ? (
              <div className="flex flex-col gap-5">

                {/* ── Row 1: Greeting + live stats ── */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-black uppercase tracking-wider px-3 py-2 rounded-full border-2"
                        style={{
                          background: hour < 12 ? '#fbbf24' : hour < 17 ? '#f97316' : '#7c3aed',
                          borderColor: hour < 12 ? '#fbbf24' : hour < 17 ? '#f97316' : '#7c3aed',
                          color: 'white'
                        }}>
                        {hour < 12 ? 'Morning Briefing' : hour < 17 ? 'Afternoon Update' : 'Evening Review'}
                      </span>
                      {dash.dataSource!=='loading' && (
                        <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-emerald-500 border-2 border-emerald-500">
                          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                          <span className="text-sm font-black text-white">Live · SAM.gov</span>
                          {dash.lastRefreshed && <span className="text-sm font-semibold text-white">· {fmtRel(dash.lastRefreshed.toISOString())}</span>}
                        </div>
                      )}
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white leading-tight">
                      {dash.loading
                        ? <span className="text-slate-400">Loading…</span>
                        : <>{greeting}, <span style={{color: hour < 12 ? '#fbbf24' : hour < 17 ? '#f97316' : '#7c3aed'}}>{name}</span>.</>}
                    </h1>
                    <p className="text-lg font-semibold text-slate-700 dark:text-slate-300 mt-2">
                      {hour < 12
                        ? 'Start your day by reviewing new matches and approaching deadlines.'
                        : hour < 17
                        ? 'Afternoon check-in — your pipeline has been updated with the latest SAM.gov postings.'
                        : 'Evening summary — review what changed today before you sign off.'}
                    </p>
                  </div>

                  {/* Live stat pills */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {[
                      {label:'Live Opps',   value:dash.totalActiveOpportunities.toLocaleString(), cls:'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-600 text-emerald-700 dark:text-emerald-300'},
                      {label:'New Matches', value:dash.thisWeekCount,                              cls:'bg-orange-50 dark:bg-orange-900/30 border-orange-300 dark:border-orange-600 text-orange-700 dark:text-orange-300'},
                      {label:'Deadlines',   value:dash.upcomingDeadlines.length,                   cls:'bg-amber-50 dark:bg-amber-900/30 border-amber-300 dark:border-amber-600 text-amber-700 dark:text-amber-300'},
                      {label:'Avg Match',   value:dash.avgMatchScore ? `${dash.avgMatchScore}%` : '—', cls:'bg-violet-50 dark:bg-violet-900/30 border-violet-300 dark:border-violet-600 text-violet-700 dark:text-violet-300'},
                    ].map(s => (
                      <div key={s.label} className={`text-center px-4 py-2 rounded-xl border ${s.cls}`}>
                        <p className="text-xl font-black">{dash.loading ? '—' : s.value}</p>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{s.label}</p>
                      </div>
                    ))}
                    <button type="button" onClick={()=>router.push('/dashboard/onboarding?next=/dashboard')} className="inline-flex items-center gap-2.5 px-7 py-3 rounded-xl text-white font-black text-base cursor-pointer transition-all shadow-lg hover:shadow-xl hover:scale-105 ml-2 group" style={{background:'linear-gradient(135deg,#f97316 0%,#ea580c 50%,#dc2626 100%)'}}>
                      {userPrefs ? 'Update Preferences' : 'Set Up Preferences'}
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>

                {/* ── Row 2: AI-Powered Insights ── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">

                  {/* Deadline Alert */}
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700">
                    <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-orange-100 dark:bg-orange-800/50 border border-orange-200 dark:border-orange-700">
                      <AlertTriangle className="w-4 h-4 text-orange-500 dark:text-orange-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-orange-600 dark:text-orange-400 uppercase tracking-wide mb-0.5">Deadline Alert</p>
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-snug">
                        {dash.upcomingDeadlines[0]
                          ? <><span className="font-bold text-slate-900 dark:text-white">{dash.upcomingDeadlines[0].title}</span> closes in <span className="text-orange-600 dark:text-orange-400 font-bold">{dash.upcomingDeadlines[0].deadline}</span> — {dash.upcomingDeadlines[0].value || 'value TBD'}.</>
                          : 'No urgent deadlines in the next 14 days. Good time to build your pipeline.'}
                      </p>
                      {dash.upcomingDeadlines.length > 0 && (
                        <button onClick={()=>router.push('/opportunities?filter=deadlines')} className="mt-2 text-xs font-black text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 bg-transparent border-none cursor-pointer p-0 transition-colors">
                          Review all {dash.upcomingDeadlines.length} deadlines →
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Top Match */}
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700">
                    <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-100 dark:bg-emerald-800/50 border border-emerald-200 dark:border-emerald-700">
                      <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wide mb-0.5">Top Match This Week</p>
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-snug">
                        {dash.recentOpportunities[0]
                          ? <><span className="font-bold text-slate-900 dark:text-white">{dash.recentOpportunities[0].title}</span> — <span className="text-emerald-700 dark:text-emerald-400 font-bold">{dash.recentOpportunities[0].match}% fit</span> · {dash.recentOpportunities[0].agency}.</>
                          : `${dash.thisWeekCount} new opportunities posted this week matching your profile.`}
                      </p>
                      <button onClick={()=>router.push('/search')} className="mt-2 text-xs font-black text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 bg-transparent border-none cursor-pointer p-0 transition-colors">
                        View all matches →
                      </button>
                    </div>
                  </div>

                  {/* AI Recommendation */}
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-700">
                    <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-violet-100 dark:bg-violet-800/50 border border-violet-200 dark:border-violet-700">
                      <Brain className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-violet-700 dark:text-violet-400 uppercase tracking-wide mb-0.5">AI Recommendation</p>
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-snug">
                        {userPrefs?.setAsides?.length
                          ? <><span className="text-violet-700 dark:text-violet-400 font-bold">{userPrefs.setAsides[0]}</span> set-asides are trending this quarter. <span className="font-bold text-slate-900 dark:text-white">{dash.activeSearchesCount} active search{dash.activeSearchesCount===1?'':'es'}</span> running across {userPrefs.naicsCodes?.length||0} NAICS codes.</>
                          : 'Complete your business profile to receive AI-powered opportunity matching and set-aside filtering.'}
                      </p>
                      <button onClick={()=>setShowAiModal(true)} className="mt-2 text-xs font-black text-violet-700 dark:text-violet-400 hover:text-violet-800 dark:hover:text-violet-300 bg-transparent border-none cursor-pointer p-0 transition-colors">
                        Full AI analysis →
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            ) : (
              /* ── Unauthenticated: bright, readable, full-width ── */
              <div className="flex flex-wrap items-center justify-between gap-6">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-3">
                    {dash.dataSource!=='loading' && (
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-600">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">Live · SAM.gov · {dash.totalActiveOpportunities.toLocaleString()} active opportunities</span>
                      </div>
                    )}
                  </div>
                  <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white leading-tight mb-2">
                    {dash.loading ? 'Loading…' : 'Federal Contract Intelligence Dashboard'}
                  </h1>
                  <p className="text-base text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed mb-4">
                    Track live SAM.gov opportunities scored against your certifications and NAICS codes. Sign in to unlock AI match scoring, deadline alerts, and your personalized pipeline.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {['AI-powered match scoring','Set-aside & NAICS filtering','Deadline alerts','Pipeline tracking'].map(f => (
                      <span key={f} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 shadow-sm">
                        <CheckCircle className="w-3 h-3 text-emerald-500" />{f}
                      </span>
                    ))}
                  </div>
                </div>
                {/* CTA box */}
                <div className="flex flex-col gap-3 shrink-0 min-w-52 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md">
                  <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide">Get started free</p>
                  <Link href="/register" className="w-full text-center px-5 py-3 rounded-xl text-white text-sm font-black transition-all hover:scale-105 shadow-lg" style={{background:'linear-gradient(135deg,#f97316,#dc2626)'}}>
                    Create Free Account
                  </Link>
                  <Link href="/login" className="w-full text-center px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                    Sign In
                  </Link>
                  <p className="text-xs text-slate-400 dark:text-slate-500 text-center">No credit card required</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── Logged-out info strip (no duplicate buttons) ──────────────────── */}
        {!isAuth && !dash.loading && (
          <div className="mb-4 px-5 py-3 rounded-2xl flex flex-wrap items-center gap-3" style={{background:'linear-gradient(135deg,#ea580c,#d97706)'}}>
            <CheckCircle className="w-4 h-4 text-orange-100 shrink-0" />
            <p className="text-sm text-white flex-1">
              <strong>You're viewing public data.</strong> Sign in to filter by your certifications, get AI match scores, and track deadlines.
            </p>
          </div>
        )}

        {/* ── Stat Cards ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          {stats.map(({label,value,sub,bg,onClick}) => (
            <button
              key={label}
              onClick={label === 'Saved Opps' && dash.savedOpportunities.length > 0
                ? () => {
                    setSelectedOpportunity(dash.savedOpportunities[0]);
                    setShowOpportunityModal(true);
                  }
                : label === 'Deadlines' && dash.upcomingDeadlines.length > 0
                ? () => {
                    setSelectedOpportunity({
                      ...dash.savedOpportunities.find(o => o.deadline && o.deadline.includes('day'))!,
                      // fallback to first if not found
                    });
                    setShowOpportunityModal(true);
                  }
                : label === 'Refresh'
                ? handleRefresh
                : onClick}
              style={{background: bg}}
              className="text-left rounded-2xl border border-white/10 shadow-md hover:shadow-xl p-4 transition-all cursor-pointer group hover:scale-[1.02] active:scale-[0.98] hover:brightness-110"
              disabled={label === 'Refresh' && refreshing}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-white/40 shadow-sm" />
                <ChevronRight className="w-3.5 h-3.5 text-white/70 group-hover:text-white transition-colors" />
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-white/80 mb-1.5">{label}</p>
              <p className="text-4xl font-black leading-none mb-1.5 text-white">
                {dash.loading ? <Loader2 className="w-5 h-5 text-white/60 animate-spin" /> : (value??'—')}
              </p>
              <p className="text-xs text-white/70">{sub}</p>
            </button>
          ))}
        </div>

        {/* Intelligence Banner removed as per patch guide */}

        {/* ── Main grid ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

          {/* Left column */}
          <div className="flex flex-col gap-5">

            {/* AI Analysis */}
            {analysis && (dash.savedOppCount>0||dash.recentOpportunities.length>0) && (
              <div className="rounded-2xl border border-violet-200 dark:border-violet-800 bg-white dark:bg-slate-800 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-900/40 border border-violet-200 dark:border-violet-700 flex items-center justify-center shrink-0">
                      <Brain className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">Precise GovCon Intelligence</span>
                        <span className="px-1.5 py-0.5 rounded bg-violet-100 dark:bg-violet-900/40 border border-violet-200 dark:border-violet-700 text-xs font-bold text-violet-600 dark:text-violet-400">AI</span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-3">{analysis.summary}</p>
                      {analysis.topOpps?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {analysis.topOpps.map((o,i) => (
                            <span key={i} className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold ${o.urgency==='high' ? 'bg-rose-100 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-700 text-rose-600 dark:text-rose-400' : o.urgency==='medium' ? 'bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 text-amber-600 dark:text-amber-400' : 'bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400'}`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-current" />{o.title}
                            </span>
                          ))}
                        </div>
                      )}
                      {analysis.recs?.length > 0 && (
                        <ul className="flex flex-col gap-1">
                          {analysis.recs.map((r,i) => (
                            <li key={i} className="flex items-start gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                              <ChevronRight className="w-3 h-3 shrink-0 mt-0.5 text-violet-500" />{r}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                  <button onClick={runAi} disabled={analysisLoading}
                    className="flex items-center gap-1.5 text-xs font-bold text-violet-500 hover:text-violet-700 dark:hover:text-violet-300 bg-transparent border-none cursor-pointer shrink-0 disabled:opacity-50 transition-colors">
                    <RefreshCw className={`w-3 h-3 ${analysisLoading?'animate-spin':''}`} />
                    {analysisLoading?'Analyzing…':'Refresh'}
                  </button>
                </div>
              </div>
            )}

            {/* Latest Matches */}
            {dash.recentOpportunities.length > 0 && (
              <div className="rounded-2xl border border-emerald-300 dark:border-emerald-800 bg-white dark:bg-slate-800 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-emerald-100 dark:border-emerald-900 bg-emerald-600">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    Latest Matches
                  </h3>
                  <button onClick={()=>setDrawer('recentMatches')} className="text-xs font-bold text-white/80 hover:text-white bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded-lg border-none cursor-pointer transition-colors">View all →</button>
                </div>
                {dash.recentOpportunities.slice(0,5).map((o,i) => (
                  <button key={o.noticeId} onClick={()=>router.push(`/opportunities${qs({noticeId:o.noticeId})}`)}
                    className={`w-full text-left px-5 py-3.5 ${i < Math.min(4,dash.recentOpportunities.length-1) ? 'border-b border-slate-100 dark:border-slate-700/60' : ''} bg-transparent hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-colors cursor-pointer`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate mb-1">{o.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap gap-2">
                          <span>{o.agency}</span>
                          {o.setAside && <span className="text-emerald-600 dark:text-emerald-400 font-bold">{o.setAside}</span>}
                          {o.naics && <span className="font-mono">{o.naics}</span>}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {typeof o.match==='number' && <Score v={o.match} />}
                        {o.value && <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{fmtCur(o.value)}</span>}
                        {o.deadline && <span className="text-xs font-black text-orange-500 bg-orange-50 dark:bg-orange-950/30 px-1.5 py-0.5 rounded">{o.deadline}</span>}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Pipeline Trend */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">Pipeline</span>
                  <span className="text-orange-500">Trend</span>
                  <span className="text-xs font-normal text-slate-400 ml-1">Last 6 months</span>
                </h3>
                <div className="flex gap-4">
                  {[['bg-orange-400','Total Opps'],['bg-emerald-500','Your Matches']].map(([c,l]) => (
                    <div key={l} className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <div className={`w-3 h-3 rounded-sm ${c}`} />{l}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-end gap-3 h-56 mb-4 flex-1">
                {trend.map(p => (
                  <div key={p.month}
                    onMouseEnter={() => setHoveredTrend(p)}
                    onMouseLeave={() => setHoveredTrend(prev => prev?.month===p.month ? null : prev)}
                    className="flex-1 flex flex-col justify-end items-center gap-1 h-full relative cursor-pointer group">
                    {hoveredTrend?.month === p.month && (
                      <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none w-48 rounded-2xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 shadow-2xl p-4">
                        <p className="text-xs font-black text-slate-800 dark:text-slate-100 mb-2 border-b border-slate-100 dark:border-slate-700 pb-2">{p.month} Details</p>
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-2.5 h-2.5 rounded-sm bg-orange-400 inline-block" />Total</span>
                            <strong className="text-xs text-orange-500">{p.opportunities.toLocaleString()}</strong>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />Matches</span>
                            <strong className="text-xs text-emerald-500">{p.matches.toLocaleString()}</strong>
                          </div>
                          <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-700 pt-1.5 mt-0.5">
                            <span className="text-xs text-slate-500">Hit Rate</span>
                            <strong className="text-xs text-amber-500">{((p.matches/p.opportunities)*100).toFixed(1)}%</strong>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="w-full flex items-end gap-1 h-full">
                      <div className="flex-1 rounded-t-lg transition-all duration-200 shadow-sm group-hover:opacity-90"
                        style={{height:`${(p.opportunities/520)*100}%`, minHeight:8, background: hoveredTrend?.month===p.month ? 'linear-gradient(to top, #ea580c, #fb923c)' : 'linear-gradient(to top, #c2410c, #f97316)'}} />
                      <div className="flex-1 rounded-t-lg transition-all duration-200 shadow-sm group-hover:opacity-90"
                        style={{height:`${(p.matches/156)*100}%`, minHeight:8, background: hoveredTrend?.month===p.month ? 'linear-gradient(to top, #16a34a, #4ade80)' : 'linear-gradient(to top, #15803d, #22c55e)'}} />
                    </div>
                    <p className="text-xs font-bold text-slate-500 group-hover:text-slate-800 dark:group-hover:text-white transition-colors">{p.month}</p>
                  </div>
                ))}
              </div>
              {/* Summary stats strip below chart */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                {[
                  {label:'Avg Opps/Mo', value: Math.round(trend.reduce((s,p)=>s+p.opportunities,0)/trend.length).toLocaleString(), color:'text-orange-500'},
                  {label:'Avg Matches', value: Math.round(trend.reduce((s,p)=>s+p.matches,0)/trend.length).toLocaleString(), color:'text-emerald-500'},
                  {label:'Avg Hit Rate', value: `${((trend.reduce((s,p)=>s+(p.matches/p.opportunities),0)/trend.length)*100).toFixed(1)}%`, color:'text-amber-500'},
                ].map(({label,value,color}) => (
                  <div key={label} className="text-center">
                    <p className={`text-lg font-black ${color}`}>{value}</p>
                    <p className="text-xs text-slate-400 font-medium">{label}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right sidebar */}
          <div className="flex flex-col gap-5">

            {/* Deadlines */}
            {dash.upcomingDeadlines.length > 0 && (
              <div className="rounded-2xl border border-orange-300 dark:border-orange-800 bg-white dark:bg-slate-800 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-orange-200 dark:border-orange-900 bg-orange-500">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-white" />Deadlines
                  </h3>
                  <button onClick={()=>setDrawer('deadlines')} className="text-xs font-bold text-white/80 hover:text-white bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded-lg border-none cursor-pointer transition-colors">View all →</button>
                </div>
                <div className="p-3 flex flex-col gap-2">
                  {dash.upcomingDeadlines.map((dl,i) => (
                    <div key={i} className="rounded-xl border border-orange-100 dark:border-orange-900/40 bg-orange-50 dark:bg-orange-950/20 p-3">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate mb-1.5">{dl.title}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-500 dark:text-slate-400">{dl.value||''}</p>
                        <p className="text-sm font-black text-orange-600 dark:text-orange-400 flex items-center gap-1"><Clock className="w-3 h-3" />{dl.deadline}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Alerts */}
            <div className="rounded-2xl border border-teal-300 dark:border-teal-800 bg-white dark:bg-slate-800 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-teal-200 dark:border-teal-900 bg-linear-to-r from-teal-600 to-cyan-600">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Bell className="w-4 h-4 text-cyan-200" />
                  <span>Your Alerts</span>
                  <span className="text-xs font-normal text-teal-200 ml-1">· Search subscriptions</span>
                </h3>
              </div>
              <div className="p-3 flex flex-col gap-2">
                {dash.activeSearches.length === 0
                  ? <p className="text-sm text-slate-400 text-center py-4">No active alerts yet.</p>
                  : dash.activeSearches.slice(0,4).map(s => (
                    <Link key={s.id} href={`/alerts/${s.id}`}
                      className="block rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 p-3 transition-colors">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate flex-1">{s.name}</p>
                        <span className="text-xs font-bold text-emerald-500 shrink-0">● Live</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>Real-time</span>
                        {(s.newCount??0)>0 && <span className="font-bold text-emerald-500">+{s.newCount} new</span>}
                      </div>
                    </Link>
                  ))
                }
                <Link href="/alerts" className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold mt-1 transition-colors shadow-md shadow-emerald-600/20">
                  <Plus className="w-3.5 h-3.5" />New Alert
                </Link>
              </div>
            </div>

            {/* AI Insights */}
            <div className="rounded-2xl border border-violet-300 dark:border-violet-800 bg-white dark:bg-slate-800 overflow-hidden">
              <div className="px-4 py-3 border-b border-violet-200 dark:border-violet-900 bg-violet-600">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  AI Insights
                </h3>
              </div>
              <div className="p-4">
              <ul className="flex flex-col gap-2 mb-4">
                {(analysis?.recs || [
                  `Your ${userPrefs?.setAsides?.[0]||'SDVOSB'} certification matches active DoD solicitations`,
                  'SDVOSB set-asides trending up this quarter',
                  'Cloud modernization demand peaks in Q3',
                ]).slice(0,3).map((r,i) => (
                  <li key={i} className="flex items-start gap-1.5 text-sm text-slate-600 dark:text-slate-300 leading-snug">
                    <ChevronRight className="w-3.5 h-3.5 shrink-0 mt-0.5 text-violet-500" />{r}
                  </li>
                ))}
              </ul>
              <button onClick={()=>setShowAiModal(true)}
                className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold cursor-pointer transition-colors shadow-md shadow-violet-600/20">
                <Brain className="w-4 h-4" />Full AI Analysis
              </button>

              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                  <Activity className="w-4 h-4 text-sky-500" />Recent Activity
                </h3>
                <div className="flex flex-col gap-2">
                  {activityLog.slice(0,4).map(log => (
                    <div key={log.id} className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center shrink-0">
                        {log.type==='search' && <Search className="w-3 h-3 text-sky-500" />}
                        {log.type==='alert' && <Bell className="w-3 h-3 text-amber-500" />}
                        {log.type==='ai' && <Brain className="w-3 h-3 text-violet-500" />}
                        {log.type==='save' && <Target className="w-3 h-3 text-emerald-500" />}
                        {log.type==='share' && <Share2 className="w-3 h-3 text-blue-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate leading-snug">{log.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{fmtRel(log.timestamp)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* AI Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-violet-200 dark:border-violet-800 bg-white dark:bg-slate-900 shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between px-5 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 z-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-900/40 border border-violet-200 dark:border-violet-700 flex items-center justify-center">
                  <Brain className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900 dark:text-white">Precise GovCon Intelligence</p>
                  <p className="text-xs text-slate-400">AI-powered pipeline analysis</p>
                </div>
              </div>
              <button onClick={()=>setShowAiModal(false)} className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              {analysis && (
                <>
                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Summary</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{analysis.summary}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Top Priorities</p>
                    <div className="flex flex-col gap-2">
                      {analysis.topOpps?.map((o,i) => (
                        <div key={i} className={`flex items-start gap-2.5 p-3 rounded-xl border ${o.urgency==='high' ? 'border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30' : o.urgency==='medium' ? 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30' : 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30'}`}>
                          <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${o.urgency==='high'?'bg-rose-500':o.urgency==='medium'?'bg-amber-500':'bg-emerald-500'}`} />
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">{o.title}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{o.reason}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Recommended Actions</p>
                    <ul className="flex flex-col gap-2">
                      {analysis.recs?.map((r,i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                          <ChevronRight className="w-3.5 h-3.5 shrink-0 mt-0.5 text-violet-500" />{r}
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
              <div className="flex gap-3">
                <button onClick={runAi} disabled={analysisLoading}
                  className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold cursor-pointer border-none transition-colors disabled:opacity-50 shadow-md shadow-orange-500/20">
                  <RefreshCw className={`w-3.5 h-3.5 ${analysisLoading?'animate-spin':''}`} />
                  {analysisLoading?'Analyzing…':'Re-Analyze'}
                </button>
                <button onClick={()=>setShowAiModal(false)}
                  className="flex-1 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-bold cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}