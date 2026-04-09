// app/dashboard/page.tsx
'use client'

import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import OpportunityModal from '../../components/OpportunityModal'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { calculateMatchScore } from '@/lib/calculateMatchScore'
import { useDashboardData } from '@/hooks/useDashboardData'
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
 type: 'deadline'|'match'|'alert'|'ai'|'search'|'save'
 title: string; time?: string
 iconType: 'deadline'|'match'|'alert'|'ai'|'search'|'save'
 noticeId?: string
}

type DeadlineItem = { title: string; agency: string; deadline: string; value?: number|string; noticeId?: string }

type DataSource = 'live' | 'loading'

type DashboardData = {
 activeSearchesCount: number; savedOppCount: number
 avgMatchScore: number | null; thisWeekCount: number
 highFitCount: number
 deadlineCount: number
 totalActiveOpportunities: number
 activeSearches: ActiveSearch[]; savedOpportunities: SavedOpportunity[]
 recentOpportunities: SavedOpportunity[]; weeklyOpportunities: SavedOpportunity[]; notifications: DashNotification[]
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
 { value: 'VOSB', label: 'VOSB', desc: 'Veteran-Owned Small Business' },
 { value: '8A', label: '8(a)', desc: 'SBA 8(a) Program' },
 { value: 'WOSB', label: 'WOSB', desc: 'Women-Owned Small Business' },
 { value: 'HUBZONE',label: 'HUBZone',desc: 'Historically Underutilized Business Zone' },
 { value: 'SBA', label: 'Small Business', desc: 'General SB Set-Aside' },
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
 { label: '$1M – $5M', min: 1000000, max: 5000000 },
 { label: '$5M – $25M', min: 5000000, max: 25000000 },
 { label: '$25M+', min: 25000000, max: undefined },
]

const STATE_OPTIONS = ['VA','MD','DC','TX','FL','CA','NY','GA','PA','NC','IL','OH','AZ','CO','WA','MA','Remote/Nationwide']

// ─── Strict baseline (no synthesized data) ─────────────────────────────────

const EMPTY_DASH: Omit<DashboardData, 'loading' | 'error' | 'dataSource'> = {
 activeSearchesCount: 0,
 savedOppCount: 0,
 avgMatchScore: null,
 thisWeekCount: 0,
 highFitCount: 0,
 deadlineCount: 0,
 totalActiveOpportunities: 0,
 activeSearches: [],
 savedOpportunities: [],
 recentOpportunities: [],
 weeklyOpportunities: [],
 notifications: [],
 upcomingDeadlines: [],
 userGoals: [],
}

// Keep dashboard and opportunities-page drilldowns aligned to the same live window.
const DASHBOARD_LIVE_WINDOW_DAYS = 30
const DASHBOARD_POSTED_7D_WINDOW_DAYS = 7
const DASHBOARD_SAM_REFRESH_COOLDOWN_MS = 10 * 60 * 1000
const DASHBOARD_GOALS_CACHE_TTL_MS = 30 * 60 * 1000

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

function normalizeFirstFilter(value: unknown): string {
 if (Array.isArray(value)) return String(value.find(Boolean) || '').trim()
 if (typeof value === 'string') {
 return value
 .split(',')
 .map(v => v.trim())
 .filter(Boolean)[0] || ''
 }
 return ''
}

function matchScore(opp: any, searches: ActiveSearch[], goals: string[], prefs?: UserPreferences): number|null {
 const _goals = goals // Reserved for future goal-aware tuning.
 void _goals

 return calculateMatchScore(
   {
     title: opp?.title,
     description: opp?.description,
     agency: opp?.agency || opp?.department,
     naicsCode: opp?.naics || opp?.naics_code || opp?.naicsCode,
     setAside: opp?.setAside || opp?.set_aside || opp?.typeOfSetAside,
     value: Number(opp?.value || opp?.awardValue || 0),
     postedDate: opp?.postedDate || opp?.posted_date,
     updatedPostedDate: opp?.updatedPostedDate || opp?.updated_posted_date,
     responseDeadline: opp?.responseDeadline || opp?.response_deadline || opp?.responseDeadLine,
   },
   searches.map((search) => ({
     query: search.query,
     filters: {
       naics: search.filters?.naics,
       setaside: search.filters?.setaside,
       agency: search.filters?.agency,
     },
   })),
   prefs
 )
}

// ─── Score pill ───────────────────────────────────────────────────────────────

function Score({ v }: { v: number }) {
 const cls = v >= 85
 ? 'bg-emerald-100 text-emerald-700 border border-emerald-400 '
 : v >= 70
 ? 'bg-sky-100 text-sky-700 border border-sky-400 '
 : 'bg-slate-100 text-slate-500 border border-slate-300 '
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
 <p className="text-slate-600 text-base leading-relaxed max-w-sm mx-auto">
 60-second setup to personalize your intelligence feed — certifications, NAICS codes, and target agencies.
 </p>
 <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto mt-5">
 {([['Set-Asides', Shield, 'text-emerald-600'], ['NAICS', Target, 'text-sky-600'], ['Agencies', Building2, 'text-violet-600']] as const).map(([l, Icon, c]) => (
 <div key={l} className="rounded-xl bg-linear-to-br from-white to-slate-50 border border-slate-200 p-3 text-center shadow">
 <Icon className={`w-4 h-4 ${c} mx-auto mb-1`} />
 <p className="text-xs font-bold text-slate-800 ">{l}</p>
 </div>
 ))}
 </div>
 </div>,

 // Step 1: Set-Asides
 <div key="sa" className="flex flex-col gap-3">
 <div>
 <h3 className="text-xl font-black text-slate-900 mb-1">Small Business Certifications</h3>
 <p className="text-slate-500 text-sm">Select all that apply — filters exclusive set-aside opportunities.</p>
 </div>
 <div className="grid grid-cols-2 gap-2">
 {SET_ASIDE_OPTIONS.map(o => {
 const sel = prefs.setAsides?.includes(o.value)
 return (
 <button key={o.value} type="button"
 onClick={() => setPrefs(p=>({...p,setAsides:tog(p.setAsides||[],o.value)}))}
 className={`flex items-center gap-2 w-full text-left rounded-xl border p-3 transition-all text-sm cursor-pointer ${sel ? 'border-sky-400 bg-sky-50 ' : 'border-slate-200 bg-white hover:border-slate-300 '}`}>
 {sel
 ? <CheckSquare className="w-4 h-4 text-sky-500 shrink-0" />
 : <Square className="w-4 h-4 text-slate-400 shrink-0" />}
 <div>
 <p className={`font-bold text-sm ${sel ? 'text-sky-600 ' : 'text-slate-900 '}`}>{o.label}</p>
 <p className="text-xs text-slate-500 ">{o.desc}</p>
 </div>
 </button>
 )
 })}
 </div>
 </div>,

 // Step 2: NAICS + Keywords
 <div key="n" className="flex flex-col gap-4">
 <div>
 <h3 className="text-xl font-black text-slate-900 mb-1">NAICS + Keywords</h3>
 <p className="text-slate-500 text-sm">Search NAICS, add capability keywords, and avoid duplicates automatically.</p>
 </div>

 <div>
 <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Search NAICS</p>
 <input
 type="text"
 value={naicsQuery}
 onChange={e => setNaicsQuery(e.target.value)}
 placeholder="Type code or description (e.g., 5415, cybersecurity)"
 className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-violet-400"
 />
 </div>

 {(prefs.naicsCodes || []).length > 0 && (
 <div className="flex flex-wrap gap-1.5">
 {(prefs.naicsCodes || []).map(code => (
 <button
 key={code}
 type="button"
 onClick={() => removeNaics(code)}
 className="inline-flex items-center gap-1 rounded-lg border border-violet-300 bg-violet-50 px-2.5 py-1 text-xs font-bold text-violet-700 cursor-pointer"
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
 className={`flex items-center gap-2 w-full text-left rounded-xl border p-3 transition-all text-sm cursor-pointer ${sel ? 'border-violet-400 bg-violet-50 ' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
 {sel
 ? <CheckSquare className="w-4 h-4 text-violet-500 shrink-0" />
 : <Square className="w-4 h-4 text-slate-400 shrink-0" />}
 <span className="font-mono text-sm text-slate-700 ">{o.label}</span>
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
 className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-sky-400"
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
 className="rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-700 cursor-pointer"
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
 className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 cursor-pointer"
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
 <h3 className="text-xl font-black text-slate-900 mb-1">Target Agencies</h3>
 <p className="text-slate-500 text-sm">Select up to 5 to prioritize in your pipeline.</p>
 </div>
 <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto">
 {AGENCY_OPTIONS.map(ag => {
 const sel = prefs.agencies?.includes(ag)
 const maxed = !sel && (prefs.agencies||[]).length >= 5
 return (
 <button key={ag} type="button"
 onClick={() => !maxed && setPrefs(p=>({...p,agencies:tog(p.agencies||[],ag)}))}
 className={`flex items-center gap-2 w-full text-left rounded-xl border p-3 transition-all text-sm ${maxed ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'} ${sel ? 'border-emerald-400 bg-emerald-50 ' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
 {sel
 ? <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0" />
 : <Square className="w-4 h-4 text-slate-400 shrink-0" />}
 <span className="text-sm text-slate-700 ">{ag}</span>
 </button>
 )
 })}
 </div>
 <p className="text-xs text-slate-400">{(prefs.agencies||[]).length}/5 selected</p>
 </div>,

 // Step 4: Size & State
 <div key="sz" className="flex flex-col gap-4">
 <div>
 <h3 className="text-xl font-black text-slate-900 mb-1">Contract Size & Location</h3>
 <p className="text-slate-500 text-sm">Match your capacity and place of performance.</p>
 </div>
 <div>
 <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Contract Size</p>
 <div className="grid grid-cols-2 gap-2">
 {CONTRACT_SIZE_OPTIONS.map(o => {
 const sel = prefs.contractSizeMin === o.min
 return (
 <button key={o.label} type="button"
 onClick={() => setPrefs(p=>({...p,contractSizeMin:o.min,contractSizeMax:o.max}))}
 className={`text-left rounded-xl border p-2.5 text-sm font-semibold transition-all cursor-pointer ${sel ? 'border-amber-400 bg-amber-50 text-amber-700 ' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'}`}>
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
 className={`rounded-lg border px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${sel ? 'border-sky-400 bg-sky-50 text-sky-600 ' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}>
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
 className="relative w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
 {/* Progress bar */}
 <div className="h-1 bg-slate-100 absolute top-0 left-0 right-0">
 <div className="h-full bg-sky-500 transition-all duration-300" style={{width:`${(step/(TOTAL-1))*100}%`}} />
 </div>
 <button onClick={() => onDismiss(hideFuture)}
 className="absolute right-3 top-3 z-10 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200 text-xs font-bold cursor-pointer">
 <X className="w-3 h-3" />Close
 </button>

 <div className="p-6 pt-8">
 {/* Step dots */}
 <div className="flex items-center gap-1.5 mb-5">
 {Array.from({length:TOTAL}).map((_,i) => (
 <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i <= step ? 'bg-sky-500 flex-2' : 'bg-slate-200 flex-1'}`} />
 ))}
 <span className="text-xs text-slate-400 font-bold ml-1 shrink-0">{step+1}/{TOTAL}</span>
 </div>

 <div className="min-h-70">{steps[step]}</div>

 <label className="inline-flex items-center gap-2 mt-4 cursor-pointer text-slate-500 text-xs font-medium">
 <input type="checkbox" checked={hideFuture} onChange={e => setHideFuture(e.target.checked)} className="w-3.5 h-3.5 cursor-pointer" />
 Don&apos;t show this setup modal again if I close it
 </label>

 <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-200 ">
 {step === 0
 ? <button onClick={() => onDismiss(hideFuture)} className="px-4 py-2 rounded-lg bg-transparent border border-slate-200 text-slate-500 text-sm font-bold cursor-pointer">Skip</button>
 : <button onClick={() => setStep(s => Math.max(0,s-1))} className="px-4 py-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 text-sm font-bold cursor-pointer">← Back</button>
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
 // Dashboard modal state
 const [showOpportunityModal, setShowOpportunityModal] = useState(false);
 const [selectedOpportunity, setSelectedOpportunity] = useState<SavedOpportunity | null>(null);
 const router = useRouter()
 // required:false prevents next-auth from throwing CLIENT_FETCH_ERROR when
 // the session endpoint returns HTML (e.g. during initial cold start or proxy issues)
 const { data: session, status: sessionStatus } = useSession({ required: false })
 const dashboardApi = useDashboardData({ enabled: sessionStatus === 'authenticated' })
 const name = useMemo(() => firstName(session), [session])
 const [mounted, setMounted] = useState(false)

 const [drawer, setDrawer] = useState<DrawerKey>(null)
 const [userPrefs, setUserPrefs] = useState<UserPreferences|null>(null)

 // Survey modal state
 const [showSurvey, setShowSurvey] = useState(false);

 const [dash, setDash] = useState<DashboardData>({
 activeSearchesCount:0, savedOppCount:0, avgMatchScore:null, thisWeekCount:0,
 highFitCount:0,
 deadlineCount:0,
 totalActiveOpportunities:0, activeSearches:[], savedOpportunities:[],
 recentOpportunities:[], weeklyOpportunities:[], notifications:[], upcomingDeadlines:[], userGoals:[],
 loading:true, error:null, dataSource:'loading',
 })

 const [analysis, setAnalysis] = useState<{summary:string;topOpps:Array<{title:string;reason:string;urgency:'high'|'medium'|'low'}>;recs:string[]}|null>(null)
 const [analysisLoading, setAnalysisLoading] = useState(false)
 const [goalInput, setGoalInput] = useState('')
 const [goalSaving, setGoalSaving] = useState(false)
 const [toast, setToast] = useState<{type:'success'|'error';msg:string}|null>(null)
 const [hoveredTrend, setHoveredTrend] = useState<TrendData | null>(null)
 const [quickSavingIds, setQuickSavingIds] = useState<Set<string>>(new Set())
 const [quickSavedIds, setQuickSavedIds] = useState<Set<string>>(new Set())
 const summaryLoadInFlightRef = useRef(false)
 const goalsCacheRef = useRef<{ goals: string[]; fetchedAt: number }>({ goals: [], fetchedAt: 0 })
 const samSummaryCacheRef = useRef<Map<string, { fetchedAt: number; opportunities: any[] }>>(new Map())

 const surveyDismissKey = useMemo(
 () => `pgc-survey-dismissed:${session?.user?.email?.toLowerCase() ?? 'anon'}`,
 [session?.user?.email]
 )

 const shouldSuppressSurvey = useCallback(() => {
 if (typeof window === 'undefined') return false
 return window.localStorage.getItem(surveyDismissKey) === '1'
 }, [surveyDismissKey])

 const samOppUrl = useCallback((noticeId: string) => `https://sam.gov/opp/${encodeURIComponent(noticeId)}/view`, [])

 const quickAlertHref = useCallback((o: SavedOpportunity) => {
 return `/alerts/manage-alerts${qs({
 new: 1,
 title: o.title,
 ncode: o.naics,
 typeOfSetAside: o.setAside,
 organizationName: o.agency,
 })}`
 }, [])

 const loadUserGoals = useCallback(async (force = false): Promise<string[]> => {
 if (!force) {
 const cacheAge = Date.now() - goalsCacheRef.current.fetchedAt
 if (goalsCacheRef.current.fetchedAt > 0 && cacheAge < DASHBOARD_GOALS_CACHE_TTL_MS) {
 return goalsCacheRef.current.goals
 }
 }
 try {
 const goalsResponse = await fetch('/api/account/profile')
 const goalsPayload = goalsResponse.ok ? await goalsResponse.json() : { goals: [] }
 const goals: string[] = Array.isArray(goalsPayload?.goals) ? goalsPayload.goals : []
 goalsCacheRef.current = { goals, fetchedAt: Date.now() }
 return goals
 } catch {
 return goalsCacheRef.current.goals || []
 }
 }, [])

 const fetchSamSummaryForQuery = useCallback(async (query: string): Promise<any[]> => {
 const cached = samSummaryCacheRef.current.get(query)
 const now = Date.now()
 if (cached && (now - cached.fetchedAt) < DASHBOARD_SAM_REFRESH_COOLDOWN_MS) {
 return cached.opportunities
 }

 try {
 const response = await fetch(`/api/sam/opportunities?${query}`)
 const payload = response.ok ? await response.json() : null
 const opportunities = Array.isArray(payload?.opportunitiesData)
 ? payload.opportunitiesData
 : (Array.isArray(payload?.opportunities) ? payload.opportunities : [])

 samSummaryCacheRef.current.set(query, { fetchedAt: now, opportunities })
 if (samSummaryCacheRef.current.size > 6) {
 const oldestKey = samSummaryCacheRef.current.keys().next().value
 if (oldestKey) samSummaryCacheRef.current.delete(oldestKey)
 }
 return opportunities
 } catch {
 return cached?.opportunities || []
 }
 }, [])

 const handleQuickAddSavedOpportunity = useCallback(async (o: SavedOpportunity) => {
 if (!o.noticeId) return
 setQuickSavingIds(prev => new Set(prev).add(o.noticeId))
 try {
 const res = await fetch('/api/saved-opportunities', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 noticeId: o.noticeId,
 title: o.title,
 department: o.agency,
 naicsCode: o.naics,
 setAside: o.setAside,
 uiLink: samOppUrl(o.noticeId),
 organizationName: o.agency,
 }),
 })
 if (!res.ok) throw new Error('save failed')

 setDash(prev => {
 if (prev.savedOpportunities.some(s => s.noticeId === o.noticeId)) return prev
 return {
 ...prev,
 savedOppCount: prev.savedOppCount + 1,
 savedOpportunities: [o, ...prev.savedOpportunities],
 }
 })

 setQuickSavedIds(prev => new Set(prev).add(o.noticeId))
 setToast({ type: 'success', msg: 'Added to saved opportunities.' })
 setTimeout(() => {
 setQuickSavedIds(prev => {
 const next = new Set(prev)
 next.delete(o.noticeId)
 return next
 })
 }, 2200)
 } catch {
 setToast({ type: 'error', msg: 'Could not save this opportunity.' })
 } finally {
 setQuickSavingIds(prev => {
 const next = new Set(prev)
 next.delete(o.noticeId)
 return next
 })
 }
 }, [samOppUrl])

 // Handler for survey dismiss/skip
 const handleSurveyDismiss = useCallback((dontShowAgain?: boolean) => {
 if (dontShowAgain || dontShowAgain === undefined) {
   // Always set localStorage if 'Don't show again' is checked or on skip
   if (typeof window !== 'undefined') {
     window.localStorage.setItem(surveyDismissKey, '1');
   }
 }
 setShowSurvey(false);
 }, [surveyDismissKey])

 useEffect(() => { setMounted(true) }, [])

 // Show survey modal if onboarding not completed and not suppressed
 useEffect(() => {
 if (!mounted || sessionStatus !== 'authenticated' || !session?.user?.email) return
 if (dashboardApi.loading) return
 if (dashboardApi.preferences?.completedOnboarding) return
 if (!shouldSuppressSurvey()) setShowSurvey(true)
 }, [mounted, sessionStatus, session?.user?.email, dashboardApi.loading, dashboardApi.preferences, shouldSuppressSurvey])

 // Real activity log built from live dashboard data
 const activityLog = useMemo<ActivityLog[]>(() => {
 const items: ActivityLog[] = []
 // Active searches → search events
 dash.activeSearches.slice(0, 2).forEach((s, i) => {
 items.push({ id: `s${s.id}`, type: 'search', title: `Saved search: "${s.name}"`, timestamp: new Date(Date.now() - (i + 1) * 3600000 * 2).toISOString() })
 })
 // Saved opportunities → save events
 dash.savedOpportunities.slice(0, 2).forEach((o, i) => {
 items.push({ id: `o${o.noticeId}`, type: 'save', title: `Saved: ${o.title}`, timestamp: new Date(Date.now() - (i + 1) * 3600000 * 5).toISOString() })
 })
 // Notifications → alert/deadline events
 dash.notifications.slice(0, 2).forEach((n, i) => {
 items.push({ id: `n${i}`, type: n.iconType === 'deadline' ? 'alert' : n.iconType === 'ai' ? 'ai' : 'alert', title: n.title, timestamp: new Date(Date.now() - (i + 1) * 3600000 * 8).toISOString() })
 })
 // Sort newest first, cap at 4
 return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 4)
 }, [dash.activeSearches, dash.savedOpportunities, dash.notifications])

 // Real 7-day posting trend from live weekly data
const trend = useMemo<TrendData[]>(() => {
const allOpps = dash.weeklyOpportunities
const result: TrendData[] = []
 for (let i = 6; i >= 0; i--) {
 const d = new Date()
 d.setDate(d.getDate() - i)
 const key = d.toISOString().split('T')[0]
 const label = d.toLocaleDateString('en-US', { weekday: 'short' })
 const dayOpps = allOpps.filter(o => o.posted && (o.posted.startsWith(key) || (i === 0 && (o.posted === 'Today' || o.posted === 'just now'))))
 const dayMatches = dayOpps.filter(o => (o.match ?? 0) >= 70)
 result.push({ month: label, opportunities: dayOpps.length, matches: dayMatches.length })
 }
return result
}, [dash.weeklyOpportunities, dash.savedOpportunities, dash.recentOpportunities])

 const railSignals = useMemo(() => {
 const agencyCounts = new Map<string, number>()
 ;[...dash.recentOpportunities, ...dash.savedOpportunities].forEach((opp) => {
 const key = (opp.agency || '').trim()
 if (!key) return
 agencyCounts.set(key, (agencyCounts.get(key) || 0) + 1)
 })
 const topAgencies = Array.from(agencyCounts.entries())
 .sort((a, b) => b[1] - a[1])
 .slice(0, 5)
 .map(([agency, count]) => ({ agency, count }))

 let critical = 0
 let soon = 0
 let later = 0
 let unknown = 0
 dash.upcomingDeadlines.forEach((dl) => {
 const days = Number.parseInt(dl.deadline || '', 10)
 if (!Number.isFinite(days)) {
 unknown += 1
 return
 }
 if (days <= 3) critical += 1
 else if (days <= 7) soon += 1
 else later += 1
 })

 return { topAgencies, critical, soon, later, unknown }
 }, [dash.recentOpportunities, dash.savedOpportunities, dash.upcomingDeadlines])

 useEffect(() => {
 // Don't run until next-auth and dashboard endpoints have resolved.
 if (sessionStatus === 'loading' || dashboardApi.loading) return
 if (!session?.user?.email) return

 let cancelled = false
 let surveyTimer: ReturnType<typeof setTimeout> | null = null

 if (dashboardApi.preferences?.completedOnboarding) {
 setUserPrefs(dashboardApi.preferences)
 return () => {
 cancelled = true
 if (surveyTimer) clearTimeout(surveyTimer)
 }
 }

 if (!shouldSuppressSurvey()) {
 // Give users a moment to settle on the dashboard after redirect/login.
 surveyTimer = setTimeout(() => {
 if (!cancelled) router.replace('/dashboard/onboarding?next=/dashboard')
 }, 1400)
 }

 return () => {
 cancelled = true
 if (surveyTimer) clearTimeout(surveyTimer)
 }
 }, [session?.user?.email, sessionStatus, dashboardApi.loading, dashboardApi.preferences, shouldSuppressSurvey, router])

 useEffect(() => {
 // Wait for next-auth and dashboard API sync before building the live SAM.gov summary.
 if (sessionStatus === 'loading') return
 if (!session?.user?.email) {
 setDash({
 ...EMPTY_DASH,
 loading: false,
 error: 'Sign in and complete preferences to view live, preference-based SAM.gov metrics.',
 dataSource: 'live',
 })
 return
 }
 if (dashboardApi.loading) {
 setDash(prev => ({ ...prev, loading: true, error: null, dataSource: 'loading' }))
 return
 }

 async function load() {
 if (summaryLoadInFlightRef.current) return
 summaryLoadInFlightRef.current = true
 try {
 const prefs: UserPreferences | null = dashboardApi.preferences
 if (prefs) setUserPrefs(prefs)
 if (!prefs?.completedOnboarding || !prefs?.naicsCodes?.length) {
 setDash({
 ...EMPTY_DASH,
 userPreferences: prefs || undefined,
 loading: false,
 error: 'Complete your opportunity preferences to power live, preference-based SAM.gov analytics.',
 dataSource: 'live',
 lastRefreshed: dashboardApi.lastRefreshed || new Date(),
 })
 return
 }

 const searchProfiles: ActiveSearch[] = dashboardApi.activeSearches
 .filter((s) => s.subscriptionEnabled !== false)
 .map((s) => {
 const filters = (s.filters && typeof s.filters === 'object') ? s.filters : {}
 return {
 id: String(s.id || ''),
 name: String(s.name || 'Untitled Search'),
 query: String(s.query || ''),
 filters: {
 naics: String(filters.naics || ''),
 state: normalizeFirstFilter(filters.state),
 setaside: normalizeFirstFilter(filters.setAside || filters.setaside),
 agency: String(filters.agency || ''),
 },
 resultsCount: typeof s.lastResultCount === 'number' ? s.lastResultCount : undefined,
 newCount: typeof s.lastResultCount === 'number' ? s.lastResultCount : 0,
 }
 })

 const goals = await loadUserGoals(false)

 const since = new Date(Date.now() - DASHBOARD_LIVE_WINDOW_DAYS * 86400000).toISOString().split('T')[0].replace(/-/g, '/')
 // Fan-out: one SAM.gov call per NAICS code (API only accepts one ncode at a time)
 // Quota guard: dashboard summary uses one representative NAICS to avoid
 // multiplying SAM.gov calls on each refresh cycle.
 const naicsList = prefs.naicsCodes.length ? prefs.naicsCodes.slice(0, 1) : [undefined]
 const setAside = prefs.setAsides?.[0] || ''
 const state = prefs.states?.[0] || ''
 const oppFetches = naicsList.map((naics: string | undefined) => {
 const query = new URLSearchParams({ limit: '200', postedFrom: since, status: 'active' })
 if (naics) query.set('naics', naics)
 if (setAside) query.set('setAside', setAside)
 if (state) query.set('state', state)
 return fetchSamSummaryForQuery(query.toString())
 })
 const wResults = await Promise.all(oppFetches)
 const seenIds = new Set<string>()
 const mergedOpps: any[] = []
 for (const opportunities of wResults) {
 for (const opp of opportunities) {
 const id = opp.noticeId || opp.id || opp.solicitationNumber
 if (id && seenIds.has(id)) continue
 if (id) seenIds.add(id)
 mergedOpps.push(opp)
 }
 }
 const weekly = { totalRecords: mergedOpps.length, opportunities: mergedOpps }

 const savedOpps: SavedOpportunity[] = dashboardApi.savedOpportunities.map((o) => {
 const rawDeadline = o.deadline ? new Date(o.deadline).getTime() : NaN
 const daysUntil = Number.isFinite(rawDeadline)
 ? Math.ceil((rawDeadline - Date.now()) / 86400000)
 : NaN
 return {
 noticeId: o.noticeId,
 title: o.title || 'Untitled',
 agency: o.agency || '',
 value: typeof o.value === 'number' ? o.value : undefined,
 posted: o.posted ? fmtRel(o.posted) : undefined,
 deadline: Number.isFinite(daysUntil) ? (daysUntil < 0 ? 'Expired' : `${daysUntil} days`) : undefined,
 naics: o.naics || undefined,
 setAside: o.setAside || undefined,
 match: matchScore(o, searchProfiles, [], prefs || undefined),
 }
 })

 const recentOpps: SavedOpportunity[] = [...(weekly.opportunities ?? [])]
 .sort((a: any, b: any) => {
 const aTime = new Date(a.updatedPostedDate || a.postedDate || a.posted_date || 0).getTime()
 const bTime = new Date(b.updatedPostedDate || b.postedDate || b.posted_date || 0).getTime()
 return bTime - aTime
 })
 .map((o: any) => ({
 noticeId: o.noticeId || o.id,
 title: o.title || 'Untitled',
 agency: o.department || o.agency || '',
 value: o.awardValue || o.value,
 posted: o.updatedPostedDate || o.postedDate || o.posted_date ? fmtRel(o.updatedPostedDate || o.postedDate || o.posted_date) : undefined,
 deadline: o.responseDeadline ? `${Math.ceil((new Date(o.responseDeadline).getTime() - Date.now()) / 86400000)} days` : undefined,
 naics: o.naics || o.naicsCode,
 setAside: o.setAside,
 match: matchScore(o, searchProfiles, goals, prefs || undefined),
 }))

 const nowTs = Date.now()
 const sevenDaysAgoTs = nowTs - 7 * 24 * 60 * 60 * 1000
 const postedThisWeekCount = (weekly.opportunities ?? []).filter((o: any) => {
 const rawPosted = o.updatedPostedDate || o.postedDate || o.posted_date || o.publishedDate || o.publishDate
 if (!rawPosted) return false
 const ts = new Date(rawPosted).getTime()
 return Number.isFinite(ts) && ts >= sevenDaysAgoTs && ts <= nowTs
 }).length

 const highFitCount = recentOpps.filter(o => (o.match ?? 0) >= 80).length
 const allScored = [...savedOpps, ...recentOpps].filter(o => typeof o.match === 'number')
 const avgMatch = allScored.length ? Math.round(allScored.reduce((s, o) => s + (o.match ?? 0), 0) / allScored.length) : null

 const mappedNotifications: DashNotification[] = dashboardApi.notifications.map((n) => ({
 type: n.type,
 title: n.title,
 time: n.createdAt ? fmtRel(n.createdAt) : undefined,
 iconType: n.iconType || n.type,
 noticeId: n.noticeId || undefined,
 }))

 const allDeadlines = savedOpps
 .filter(o => {
 const d = parseInt(o.deadline ?? '999', 10)
 return Number.isFinite(d) && d >= 0
 })
 .sort((a, b) => parseInt(a.deadline ?? '999', 10) - parseInt(b.deadline ?? '999', 10))
 const fallbackDeadlines: DeadlineItem[] = dashboardApi.deadlines.map((d) => ({
 title: d.title,
 agency: d.agency,
 deadline: `${d.daysUntil} day${d.daysUntil === 1 ? '' : 's'}`,
 value: d.value ?? '',
 noticeId: d.noticeId,
 }))
 const deadlines = allDeadlines.length
 ? allDeadlines.slice(0, 25).map(o => ({ title: o.title, agency: o.agency, deadline: o.deadline ?? '', value: o.value ?? '', noticeId: o.noticeId }))
 : fallbackDeadlines.slice(0, 25)

 if (goals.length) setGoalInput(goals.join('\n'))
 setDash({
 activeSearchesCount: searchProfiles.length,
 savedOppCount: savedOpps.length,
 avgMatchScore: avgMatch,
 thisWeekCount: postedThisWeekCount,
 highFitCount,
 deadlineCount: allDeadlines.length || fallbackDeadlines.length,
 totalActiveOpportunities: mergedOpps.length,
 activeSearches: searchProfiles,
 savedOpportunities: savedOpps,
 recentOpportunities: recentOpps,
 weeklyOpportunities: mergedOpps.map((o: any) => ({
 noticeId: o.noticeId || o.id,
 title: o.title || 'Untitled',
 agency: o.department || o.agency || '',
 posted: o.updatedPostedDate || o.postedDate || o.posted_date,
 match: matchScore(o, searchProfiles, goals, prefs || undefined),
 })),
 notifications: mappedNotifications,
 upcomingDeadlines: deadlines,
 userGoals: goals,
 userPreferences: prefs || undefined,
 loading: false,
 error: dashboardApi.error ?? null,
 dataSource: 'live',
 lastRefreshed: dashboardApi.lastRefreshed || new Date(),
 })
 } catch {
 setDash({
 ...EMPTY_DASH,
 userPreferences: dashboardApi.preferences || undefined,
 loading: false,
 error: 'Live SAM.gov data is temporarily unavailable. No synthesized values are shown.',
 dataSource: 'live',
 })
 } finally {
 summaryLoadInFlightRef.current = false
 }
 }

 void load()
 }, [
 session?.user?.email,
 sessionStatus,
 dashboardApi.activeSearches,
 dashboardApi.savedOpportunities,
 dashboardApi.notifications,
 dashboardApi.deadlines,
 dashboardApi.preferences,
 dashboardApi.loading,
 dashboardApi.error,
 dashboardApi.lastRefreshed,
 loadUserGoals,
 fetchSamSummaryForQuery,
 ])

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
 goalsCacheRef.current = { goals, fetchedAt: Date.now() }
 setDash(prev=>({...prev,userGoals:goals}))
 setDrawer(null)
 setToast({type:'success',msg:'Goals saved. Match scores updated.'})
 } catch { setToast({type:'error',msg:'Failed to save goals.'}) }
 finally { setGoalSaving(false) }
 }, [goalInput])

 useEffect(() => {
 if (!toast) return
 const t = setTimeout(()=>setToast(null),3500)
 return () => clearTimeout(t)
 }, [toast])

 const isAuth = sessionStatus === 'authenticated' && !!session?.user?.email
 const hour = mounted ? new Date().getHours() : 12
 const greeting = hour<12?'Good morning':hour<17?'Good afternoon':'Good evening'
 const liveWindowPostedFrom = useMemo(() => {
 const d = new Date()
 d.setDate(d.getDate() - DASHBOARD_LIVE_WINDOW_DAYS)
 return d.toISOString().split('T')[0].replace(/-/g, '/')
 }, [])
 const liveWindowPostedTo = useMemo(
 () => new Date().toISOString().split('T')[0].replace(/-/g, '/'),
 []
 )
 const liveOppsHref = useMemo(() => {
 const params = new URLSearchParams({
 source: 'dashboard',
 from: 'live-opps-pill',
 postedFrom: liveWindowPostedFrom,
 postedTo: liveWindowPostedTo,
 })
 const naics = dash.userPreferences?.naicsCodes?.[0]
 const setAside = dash.userPreferences?.setAsides?.[0]
 const state = dash.userPreferences?.states?.[0]
 if (naics) params.set('naics', naics)
 if (setAside) params.set('setAside', setAside)
 if (state) params.set('state', state)
 return `/opportunities?${params.toString()}`
 }, [dash.userPreferences, liveWindowPostedFrom, liveWindowPostedTo])
 const posted7dHref = useMemo(() => {
 const postedFromDate = new Date()
 postedFromDate.setDate(postedFromDate.getDate() - DASHBOARD_POSTED_7D_WINDOW_DAYS)
 const postedFrom = postedFromDate.toISOString().split('T')[0].replace(/-/g, '/')
 const postedTo = new Date().toISOString().split('T')[0].replace(/-/g, '/')
 const params = new URLSearchParams({
 source: 'dashboard',
 from: 'posted-7d-pill',
 postedFrom,
 postedTo,
 })
 const naics = dash.userPreferences?.naicsCodes?.[0]
 const setAside = dash.userPreferences?.setAsides?.[0]
 const state = dash.userPreferences?.states?.[0]
 if (naics) params.set('naics', naics)
 if (setAside) params.set('setAside', setAside)
 if (state) params.set('state', state)
 return `/opportunities?${params.toString()}`
 }, [dash.userPreferences])

 const stats = useMemo(() => {
 const latestAlert = dash.activeSearches.find(s => (s.name || '').trim() || (s.query || '').trim())
 const latestAlertLabel = latestAlert
 ? ((latestAlert.name || '').trim() || (latestAlert.query || '').trim())
 : ''

 return [
 {
 label: 'Deadlines',
 value: dash.deadlineCount,
 sub: dash.upcomingDeadlines[0] ? `Earliest: ${dash.upcomingDeadlines[0].deadline}` : 'Next 14 days',
 detail: dash.upcomingDeadlines[0]?.title ? `${dash.upcomingDeadlines[0].title} · ${dash.upcomingDeadlines[0].value || ''}` : 'No upcoming deadlines',
 src: 'From your saved opportunities with upcoming due dates',
 bg: '#b91c1c',
 onClick: () => setDrawer('deadlines'),
 },
 {
 /* Alert Subscriptions = saved searches that trigger email alerts */
 label: 'Alert Subscriptions',
 value: dash.activeSearchesCount,
 sub: `${dash.activeSearches.reduce((s, a) => s + (a.newCount ?? 0), 0)} new matches`,
 detail: latestAlertLabel ? `Latest alert: "${latestAlertLabel}"` : 'No email alerts configured',
 src: 'From your saved searches and alert subscriptions',
 bg: '#1d4ed8',
 onClick: () => setDrawer('activeSearches'),
 },
 {
 label: 'Saved Opportunities',
 value: dash.savedOppCount,
 sub: 'Watchlist',
 detail: dash.savedOpportunities[0] ? `Top: ${dash.savedOpportunities[0].title}` : 'No saved opportunities',
 src: 'Direct count from your saved-opportunities list',
 bg: '#b45309',
 onClick: () => setDrawer('savedOpps'),
 },
 {
 label: 'New This Week',
 value: dash.thisWeekCount,
 sub: 'SAM.gov postings',
 detail: dash.recentOpportunities[0] ? `Newest: ${dash.recentOpportunities[0].title}` : 'No postings in the last 7 days',
 src: 'From live SAM.gov opportunities loaded this week for your profile',
 bg: '#047857',
 onClick: () => setDrawer('recentMatches'),
 },
 {
 label: 'Avg Match Score',
 value: dash.avgMatchScore !== null ? `${dash.avgMatchScore}%` : '—',
 sub: 'Profile fit',
 detail: dash.avgMatchScore !== null
 ? dash.avgMatchScore >= 80 ? 'Strong pipeline alignment' : dash.avgMatchScore >= 65 ? 'Good alignment — refine preferences' : 'Update preferences to improve match'
 : 'Complete your profile to see scores',
 src: 'Computed from saved + recent opportunities versus profile fit',
 bg: '#6d28d9',
 onClick: () => setDrawer('matchInfo'),
 },
 {
 /* In-app signals: deadline warnings & high-match notices derived from live data */
 label: 'In-App Signals',
 value: dash.notifications.length,
 sub: dash.notifications.length === 1 ? '1 new signal' : `${dash.notifications.length} signals`,
 detail: dash.notifications[0]?.title ?? 'No new in-app signals',
 src: 'From deadline warnings and high-match activity',
 bg: '#334155',
 onClick: () => setDrawer('notifications'),
 },
 ]
 }, [dash, router])

 const primarySearch = dash.activeSearches[0]

 if (!mounted) {
 return (
 <div className="dashboard-page mx-auto w-full max-w-480 min-h-screen bg-linear-to-br from-white via-slate-50 to-blue-50 px-3 sm:px-4 lg:px-6 xl:px-8 pt-4 pb-8">
 <div className="rounded-2xl border border-slate-200 bg-white p-5">
 <p className="text-slate-500 font-semibold">Loading dashboard...</p>
 </div>
 </div>
 )
 }

 const drawerTitles: Record<NonNullable<DrawerKey>, string> = {
 activeSearches:'Active Searches', savedOpps:'Saved Opportunities', recentMatches:'Posted In Last 7 Days',
 deadlines:'Upcoming Deadlines', notifications:'Notifications', matchInfo:'Match Score',
 goalSetup:'Business Goals', settings:'Settings',
 }

 const notifIconMap: Record<string, LucideIcon> = {
 deadline: AlertTriangle,
 match: Target,
 alert: Bell,
 ai: Brain,
 search: Search,
 save: CheckCircle,
 }
 const notifColorMap: Record<string, string> = {
 deadline: 'text-amber-500',
 match: 'text-emerald-500',
 alert: 'text-rose-500',
 ai: 'text-violet-500',
 search: 'text-sky-500',
 save: 'text-emerald-500',
 }

 return (
 <div className="dashboard-page mx-auto w-full max-w-480 min-h-screen bg-(--color-surface) text-(--color-text-primary)">
 <style>{`
   /* ══════════════════════════════════════════════════════════════
      DASHBOARD DARK MODE — app uses [data-theme="dark"] + .dark
      All dark: Tailwind variants are INERT. Everything lives here.
   ══════════════════════════════════════════════════════════════ */

   /* Page shell & background */
   [data-theme="dark"] .dashboard-page,
   .dark .dashboard-page {
     background: linear-gradient(135deg, #111a20, #18232c, #1a1f2e) !important;
     color: #e9eef2 !important;
   }

   /* All text defaults on dark */
   [data-theme="dark"] .dashboard-page h1,
   [data-theme="dark"] .dashboard-page h2,
   [data-theme="dark"] .dashboard-page h3,
   [data-theme="dark"] .dashboard-page h4,
   .dark .dashboard-page h1,
   .dark .dashboard-page h2,
   .dark .dashboard-page h3,
   .dark .dashboard-page h4 { color: #e9eef2 !important; }

   [data-theme="dark"] .dashboard-page p,
   [data-theme="dark"] .dashboard-page span:not([style*="color:"]),
   [data-theme="dark"] .dashboard-page label,
   .dark .dashboard-page p,
   .dark .dashboard-page span:not([style*="color:"]),
   .dark .dashboard-page label { color: #b8cad4 !important; }

   /* White/light backgrounds → dark surfaces */
   [data-theme="dark"] .dashboard-page .bg-white,
   .dark .dashboard-page .bg-white { background-color: #1e2d3a !important; }

   [data-theme="dark"] .dashboard-page [class*="bg-slate-50"],
   [data-theme="dark"] .dashboard-page [class*="bg-gray-50"],
   .dark .dashboard-page [class*="bg-slate-50"],
   .dark .dashboard-page [class*="bg-gray-50"] { background-color: #1e2d3a !important; }

   [data-theme="dark"] .dashboard-page [class*="bg-slate-100"],
   [data-theme="dark"] .dashboard-page [class*="bg-gray-100"],
   .dark .dashboard-page [class*="bg-slate-100"],
   .dark .dashboard-page [class*="bg-gray-100"] { background-color: #263545 !important; }

   [data-theme="dark"] .dashboard-page [class*="bg-slate-800"],
   [data-theme="dark"] .dashboard-page [class*="bg-slate-900"],
   .dark .dashboard-page [class*="bg-slate-800"],
   .dark .dashboard-page [class*="bg-slate-900"] { background-color: #263545 !important; }

   /* Borders */
   [data-theme="dark"] .dashboard-page [class*="border-slate-200"],
   [data-theme="dark"] .dashboard-page [class*="border-slate-700"],
   [data-theme="dark"] .dashboard-page [class*="border-gray-200"],
   .dark .dashboard-page [class*="border-slate-200"],
   .dark .dashboard-page [class*="border-slate-700"],
   .dark .dashboard-page [class*="border-gray-200"] { border-color: #304558 !important; }

   /* Text colors */
   [data-theme="dark"] .dashboard-page [class*="text-slate-900"],
   [data-theme="dark"] .dashboard-page [class*="text-gray-900"],
   .dark .dashboard-page [class*="text-slate-900"],
   .dark .dashboard-page [class*="text-gray-900"] { color: #e9eef2 !important; }

   [data-theme="dark"] .dashboard-page [class*="text-slate-800"],
   [data-theme="dark"] .dashboard-page [class*="text-gray-800"],
   .dark .dashboard-page [class*="text-slate-800"],
   .dark .dashboard-page [class*="text-gray-800"] { color: #dce8f0 !important; }

   [data-theme="dark"] .dashboard-page [class*="text-slate-700"],
   [data-theme="dark"] .dashboard-page [class*="text-slate-600"],
   [data-theme="dark"] .dashboard-page [class*="text-gray-700"],
   [data-theme="dark"] .dashboard-page [class*="text-gray-600"],
   .dark .dashboard-page [class*="text-slate-700"],
   .dark .dashboard-page [class*="text-slate-600"],
   .dark .dashboard-page [class*="text-gray-700"],
   .dark .dashboard-page [class*="text-gray-600"] { color: #b8cad4 !important; }

   [data-theme="dark"] .dashboard-page [class*="text-slate-500"],
   [data-theme="dark"] .dashboard-page [class*="text-slate-400"],
   [data-theme="dark"] .dashboard-page [class*="text-gray-500"],
   [data-theme="dark"] .dashboard-page [class*="text-gray-400"],
   .dark .dashboard-page [class*="text-slate-500"],
   .dark .dashboard-page [class*="text-slate-400"],
   .dark .dashboard-page [class*="text-gray-500"],
   .dark .dashboard-page [class*="text-gray-400"] { color: #8aaabb !important; }

   [data-theme="dark"] .dashboard-page [class*="text-slate-300"],
   [data-theme="dark"] .dashboard-page [class*="text-slate-200"],
   [data-theme="dark"] .dashboard-page [class*="text-slate-100"],
   .dark .dashboard-page [class*="text-slate-300"],
   .dark .dashboard-page [class*="text-slate-200"],
   .dark .dashboard-page [class*="text-slate-100"] { color: #c8d8e4 !important; }

   /* Cards & panels */
   [data-theme="dark"] .dashboard-page [class*="rounded-2xl"][class*="border"],
   [data-theme="dark"] .dashboard-page [class*="rounded-xl"][class*="border"],
   .dark .dashboard-page [class*="rounded-2xl"][class*="border"],
   .dark .dashboard-page [class*="rounded-xl"][class*="border"] {
     background-color: #1e2d3a !important;
     border-color: #304558 !important;
   }

   /* Protect solid-color stat cards — they have inline style= backgrounds */
   [data-theme="dark"] .dashboard-page [style*="background: #"],
   [data-theme="dark"] .dashboard-page [style*="background:#"],
   .dark .dashboard-page [style*="background: #"],
   .dark .dashboard-page [style*="background:#"] {
     /* keep inline bg, just ensure text is white */
   }
   [data-theme="dark"] .dashboard-page [style*="background: #"] p,
   [data-theme="dark"] .dashboard-page [style*="background: #"] span,
   [data-theme="dark"] .dashboard-page [style*="background: #"] h1,
   [data-theme="dark"] .dashboard-page [style*="background: #"] h2,
   [data-theme="dark"] .dashboard-page [style*="background: #"] h3,
   .dark .dashboard-page [style*="background: #"] p,
   .dark .dashboard-page [style*="background: #"] span,
   .dark .dashboard-page [style*="background: #"] h1,
   .dark .dashboard-page [style*="background: #"] h2,
   .dark .dashboard-page [style*="background: #"] h3 { color: #ffffff !important; }

   /* Inputs & selects */
   [data-theme="dark"] .dashboard-page input,
   [data-theme="dark"] .dashboard-page select,
   [data-theme="dark"] .dashboard-page textarea,
   .dark .dashboard-page input,
   .dark .dashboard-page select,
   .dark .dashboard-page textarea {
     background-color: #263545 !important;
     color: #e9eef2 !important;
     border-color: #304558 !important;
   }
   [data-theme="dark"] .dashboard-page input::placeholder,
   .dark .dashboard-page input::placeholder { color: #5a7a8a !important; }

   /* Buttons with slate backgrounds */
   [data-theme="dark"] .dashboard-page button[class*="bg-slate-100"],
   [data-theme="dark"] .dashboard-page button[class*="bg-slate-200"],
   .dark .dashboard-page button[class*="bg-slate-100"],
   .dark .dashboard-page button[class*="bg-slate-200"] {
     background-color: #263545 !important;
     color: #b8cad4 !important;
     border-color: #304558 !important;
   }

   /* Drawer panel */
   [data-theme="dark"] .dashboard-page [class*="bg-white"][class*="border-l"],
   .dark .dashboard-page [class*="bg-white"][class*="border-l"] {
     background-color: #18232c !important;
     border-color: #304558 !important;
   }

   /* Onboarding modal */
   [data-theme="dark"] .dashboard-page [class*="bg-slate-950"],
   [data-theme="dark"] .dashboard-page [class*="bg-slate-900"][class*="rounded-2xl"],
   .dark .dashboard-page [class*="bg-slate-950"],
   .dark .dashboard-page [class*="bg-slate-900"][class*="rounded-2xl"] {
     background-color: #18232c !important;
     border-color: #304558 !important;
   }

   /* Hero section gradient cards */
   [data-theme="dark"] .dashboard-page [class*="from-white"][class*="to-slate"],
   [data-theme="dark"] .dashboard-page [class*="from-white"][class*="to-sky"],
   [data-theme="dark"] .dashboard-page [class*="from-white"][class*="via-slate"],
   .dark .dashboard-page [class*="from-white"][class*="to-slate"],
   .dark .dashboard-page [class*="from-white"][class*="to-sky"],
   .dark .dashboard-page [class*="from-white"][class*="via-slate"] {
     background: #1e2d3a !important;
   }

   /* Sign In to Your Dashboard button */
   [data-theme="dark"] .dashboard-page button[class*="border-slate"]:not([style]),
   .dark .dashboard-page button[class*="border-slate"]:not([style]) {
     background-color: #263545 !important;
     color: #e9eef2 !important;
     border-color: #304558 !important;
   }
 `}</style>
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
 <button onClick={() => setToast(null)} className="text-current opacity-70 hover:opacity-100 cursor-pointer bg-transparent border-none text-xs font-bold px-2 py-1 rounded hover:bg-white/10 transition-colors">
 Dismiss
 </button>
 </div>
 </div>
 )}

 {/* Drawer */}
 {drawer && (
 <div className="fixed inset-0 z-50">
 <div onClick={()=>setDrawer(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
 <div className="absolute right-0 top-0 h-full w-full max-w-md flex flex-col bg-white border-l border-slate-200 shadow-2xl">
 {/* Drawer header */}
 <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 ">
 <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">
 {drawerTitles[drawer]}
 </h2>
 <button onClick={() => setDrawer(null)} className="px-4 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 text-sm font-bold cursor-pointer hover:bg-slate-200 transition-colors">
 Close
 </button>
 </div>

 <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">

 {drawer==='activeSearches' && (
 <>
 {dash.activeSearches.map(s => (
 <button key={s.id}
 onClick={()=>{router.push(`/search${qs({keywords:s.query,naics:s.filters?.naics,state:s.filters?.state,setAside:s.filters?.setaside})}`);setDrawer(null)}}
 className="w-full text-left rounded-xl border border-slate-200 bg-white hover:bg-slate-50 p-3 transition-colors cursor-pointer">
 <div className="flex items-start justify-between gap-2">
 <div className="min-w-0">
 <p className="font-bold text-sm text-slate-900 truncate mb-1">{s.name}</p>
 <p className="text-xs text-slate-500 ">
 {s.query ? `"${s.query}"` : 'No keyword criteria saved'}
 {s.filters?.naics && <span className="text-sky-500 font-mono ml-2">NAICS {s.filters.naics}</span>}
 </p>
 </div>
 <div className="flex items-center gap-1.5 shrink-0">
 {(s.newCount??0)>0 && <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-600 text-xs font-bold">+{s.newCount}</span>}
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
 <a key={o.noticeId}
 href={`https://sam.gov/opp/${encodeURIComponent(o.noticeId)}/view`}
 target="_blank"
 rel="noopener noreferrer"
 onClick={()=>setDrawer(null)}
 className="block w-full text-left rounded-xl border border-slate-200 bg-white hover:bg-slate-50 p-3 transition-colors cursor-pointer">
 <div className="flex items-start justify-between gap-2">
 <div className="min-w-0">
 <p style={{fontWeight:700,fontSize:13,color:'#0f172a',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',marginBottom:4}}>{o.title}</p>
 <p style={{fontSize:11,color:'#475569',display:'flex',flexWrap:'wrap',gap:8}}>
 <span>{o.agency}</span>
 {o.setAside && <span className="text-emerald-600 ">{o.setAside}</span>}
 {o.deadline && <span className="text-amber-600 ">Closes {o.deadline}</span>}
 </p>
 </div>
 <div className="flex items-center gap-1.5 shrink-0">
 {typeof o.match==='number' && <Score v={o.match} />}
 {o.value && <span className="text-xs font-bold text-slate-600 ">{fmtCur(o.value)}</span>}
 </div>
 </div>
 </a>
 ))}
 <button onClick={()=>{router.push('/dashboard/saved-opportunities');setDrawer(null)}} className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold cursor-pointer mt-1 transition-colors shadow-md shadow-emerald-600/20">
 View All Saved →
 </button>
 </>
 )}

 {drawer==='recentMatches' && (
 <>
 {dash.recentOpportunities.length===0
 ? <p className="text-sm text-slate-400 text-center py-8">No matches yet. Run a search to populate.</p>
 : dash.recentOpportunities.map(o => (
 <div key={o.noticeId} className="rounded-xl border border-slate-200 bg-white p-3">
 <a
 href={samOppUrl(o.noticeId)}
 target="_blank"
 rel="noopener noreferrer"
 onClick={()=>setDrawer(null)}
 className="block w-full text-left rounded-lg p-1 hover:bg-slate-50 transition-colors cursor-pointer"
 >
 <div className="flex items-start justify-between gap-2">
 <div className="min-w-0">
 <div className="flex items-center gap-2 mb-1">
 <p className="font-semibold text-sm text-slate-900 truncate">{o.title}</p>
 <button
 type="button"
 onClick={(e)=>{e.preventDefault(); e.stopPropagation(); handleQuickAddSavedOpportunity(o)}}
 className="px-2 py-0.5 rounded-full bg-fuchsia-100 text-fuchsia-700 text-[10px] font-black uppercase tracking-wide hover:bg-fuchsia-200"
 title="Quick Add to Saved Opportunities"
 >
 Quick Add
 </button>
 </div>
 <p className="text-xs text-slate-500 ">{o.agency}</p>
 </div>
 <div className="flex flex-col items-end gap-1 shrink-0">
 {typeof o.match==='number' && <Score v={o.match} />}
 {o.deadline && <span className="text-xs font-bold text-amber-500">{o.deadline}</span>}
 {o.value && <span className="text-xs text-slate-400">{fmtCur(o.value)}</span>}
 </div>
 </div>
 </a>
 <div className="mt-2 flex items-center gap-2 flex-wrap">
 <a
 href={samOppUrl(o.noticeId)}
 target="_blank"
 rel="noopener noreferrer"
 onClick={()=>setDrawer(null)}
 className="px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
 >
 Open SAM.gov
 </a>
 <button
 type="button"
 onClick={()=>handleQuickAddSavedOpportunity(o)}
 disabled={quickSavingIds.has(o.noticeId)}
 className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-bold transition-colors"
 >
 {quickSavingIds.has(o.noticeId) ? 'Saving...' : quickSavedIds.has(o.noticeId) ? 'Saved ✓' : 'Save Opportunity'}
 </button>
 <Link
 href={quickAlertHref(o)}
 onClick={()=>setDrawer(null)}
 className="px-2.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-colors"
 >
 Create Alert
 </Link>
 </div>
 </div>
 ))
 }
 </>
 )}

 {drawer==='deadlines' && (
 <>
 {dash.upcomingDeadlines.map((dl,i) => (
 <div key={i} className="rounded-xl border border-slate-200 bg-white p-3">
 <div className="flex items-start justify-between gap-2">
 <div>
 <p className="font-semibold text-sm text-slate-900 mb-1">
 {dl.noticeId ? (
 <a
 href={samOppUrl(dl.noticeId)}
 target="_blank"
 rel="noopener noreferrer"
 className="hover:text-amber-700"
 >
 {dl.title}
 </a>
 ) : dl.title}
 </p>
 <p className="text-xs text-slate-500 flex items-center gap-1"><Building2 className="w-3 h-3" />{dl.agency}</p>
 </div>
 <div className="text-right shrink-0">
 <p className="text-sm font-black text-amber-500 flex items-center gap-1"><Clock className="w-3 h-3" />{dl.deadline}</p>
 {dl.value && <p className="text-xs text-slate-400 mt-0.5">{dl.value}</p>}
 </div>
 </div>
 {dl.noticeId && (
 <div className="mt-2">
 <a
 href={samOppUrl(dl.noticeId)}
 target="_blank"
 rel="noopener noreferrer"
 className="inline-flex items-center rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-2.5 py-1.5 transition-colors"
 >
 Open on SAM.gov
 </a>
 </div>
 )}
 </div>
 ))}
 <button onClick={()=>{router.push('/dashboard/saved-opportunities');setDrawer(null)}} className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-black cursor-pointer mt-1 border-none transition-colors">
 View Saved Deadlines →
 </button>
 </>
 )}

 {drawer==='notifications' && (
 <>
 {dash.notifications.map((n,i) => {
 const Icon = notifIconMap[n.iconType] || Bell
 return (
 <div key={i} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3">
 <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${notifColorMap[n.iconType]}`} />
 <div className="flex-1 min-w-0">
 <p className="text-sm font-semibold text-slate-900 mb-0.5 truncate">
 {n.noticeId ? (
 <a
 href={samOppUrl(n.noticeId)}
 target="_blank"
 rel="noopener noreferrer"
 className="hover:text-emerald-700"
 >
 {n.title}
 </a>
 ) : n.title}
 </p>
 <p className="text-xs text-slate-500 ">{n.time}</p>
 {n.noticeId && (
 <div className="mt-2">
 <a
 href={samOppUrl(n.noticeId)}
 target="_blank"
 rel="noopener noreferrer"
 className="inline-flex items-center rounded-lg bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold px-2.5 py-1.5 transition-colors"
 >
 Open on SAM.gov
 </a>
 </div>
 )}
 </div>
 </div>
 )
 })}
 </>
 )}

 {drawer==='matchInfo' && (
 <div className="flex flex-col gap-3">
 <p className="text-sm text-slate-600 leading-relaxed">Match score (0–100) estimates how well an opportunity fits your business profile and search intent.</p>
 {['NAICS code alignment','Set-aside certification match','Keyword relevance','Agency preference','Contract size fit','Search profile overlap'].map(item => (
 <div key={item} className="flex items-center gap-2 text-sm text-slate-600 ">
 <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />{item}
 </div>
 ))}
 </div>
 )}

 {drawer==='goalSetup' && (
 <div className="flex flex-col gap-3">
 <p className="text-sm text-slate-600 leading-relaxed">Describe your capture goals to refine match scoring and AI analysis.</p>
 <textarea value={goalInput} onChange={e=>setGoalInput(e.target.value)} rows={6}
 placeholder={'Capture 2 VA task orders per quarter\nSDVOSB IT modernization under $5M\nBuild DoD cloud portfolio'}
 className="w-full rounded-xl border border-slate-200 bg-white text-slate-900 text-sm p-3 resize-none outline-none focus:border-sky-400 transition-colors" />
 <div className="flex flex-wrap gap-1.5">
 {['IT & Cybersecurity','Cloud Migration','8(a) Set-Asides','SDVOSB Contracts','DoD Contracts'].map(t => (
 <button key={t} type="button" onClick={()=>setGoalInput(p=>p?`${p}\n${t}`:t)}
 className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors">
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
 <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
 <p className="text-slate-500 mb-2">Name: <strong className="text-slate-900 ">{name}</strong></p>
 <p className="text-slate-500 mb-2">Email: <strong className="text-slate-900 ">{session?.user?.email}</strong></p>
 {userPrefs?.setAsides?.length && <p className="text-slate-500 ">Certifications: <strong className="text-emerald-600 ">{userPrefs.setAsides.join(', ')}</strong></p>}
 </div>
 <button onClick={()=>{router.push('/dashboard/onboarding?next=/dashboard');setDrawer(null)}} style={{background:'#ea580c',color:'#fff',border:'none',borderRadius:10,padding:'10px 18px',fontSize:14,fontWeight:800,cursor:'pointer',boxShadow:'0 2px 8px rgba(234,88,12,0.35)',whiteSpace:'nowrap'}}>
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

 {sessionStatus === 'authenticated' && (
 <div className="mb-3 rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
 <div className="text-sm font-semibold text-cyan-900">
 <span className="font-black mr-2">Dashboard sync</span>
 {dashboardApi.loading
 ? 'Loading dashboard endpoints...'
 : dashboardApi.lastRefreshed
? `Last refreshed ${dashboardApi.lastRefreshed.toLocaleTimeString()} · dashboard sync every 5 minutes · SAM snapshot max every 10 minutes`
 : 'Waiting for first refresh...'}
 </div>
 <button
 type="button"
 onClick={() => void dashboardApi.refresh()}
 disabled={dashboardApi.loading || dashboardApi.isRefreshing}
 className="inline-flex items-center gap-2 rounded-lg bg-cyan-700 px-3 py-2 text-sm font-black text-white disabled:opacity-60"
 >
 {dashboardApi.isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
 {dashboardApi.isRefreshing ? 'Refreshing...' : 'Refresh dashboard data'}
 </button>
 </div>
 )}

 {sessionStatus === 'authenticated' && dashboardApi.error && (
 <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
 <div className="text-sm font-semibold text-red-800">
 Dashboard API sync warning: {dashboardApi.error}
 </div>
 <button
 type="button"
 onClick={() => void dashboardApi.refresh()}
 className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-black text-white"
 >
 <RefreshCw className="h-4 w-4" />
 Retry sync
 </button>
 </div>
 )}

 {/* ── Hero section ─────────────────────────────────────────────────── */}
 <section className="relative overflow-hidden rounded-2xl mb-4 shadow-md border border-(--color-border) bg-(--color-surface) ">
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
 <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4" style={{ background: '#047857', color: 'white' }}>
 <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'white', flexShrink: 0, animation: 'pulse 2s infinite' }} />
 <span style={{ color: 'white', fontWeight: 900, fontSize: '14px', letterSpacing: '0.02em' }}>
 Live · SAM.gov · {dash.totalActiveOpportunities.toLocaleString()} active opportunities (last {DASHBOARD_LIVE_WINDOW_DAYS} days)
 </span>
 </div>
 )}
 </div>
 <div className="flex flex-wrap items-baseline gap-x-4 gap-y-0">
 <h1 className="text-4xl lg:text-5xl font-black leading-tight" style={{ color: 'var(--color-text-primary)' }}>
 {dash.loading
 ? <span style={{ color: 'var(--color-text-primary)' }}>Loading…</span>
 : <>{greeting}, <span style={{color: hour < 12 ? '#fbbf24' : hour < 17 ? '#f97316' : '#7c3aed'}}>{name}</span>.</>}
 </h1>
 <p style={{ color: 'var(--color-text-primary)', fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
 {hour < 12
 ? 'Start your day by reviewing fresh postings and approaching deadlines.'
 : hour < 17
 ? 'Afternoon check-in — your pipeline has been updated with the latest SAM.gov postings.'
 : 'Evening summary — review what changed today before you sign off.'}
 </p>
 </div>
 </div>
 {/* Live stat pills */}
 <div className="flex items-center gap-2 shrink-0 flex-wrap">
 {[
 { label: 'Live Opportunities', value: (dash.totalActiveOpportunities || 0).toLocaleString(), bg: '#047857', onClick: () => router.push(liveOppsHref) },
 { label: 'Posted 7 Days', value: dash.thisWeekCount, bg: '#b45309', onClick: () => router.push(posted7dHref) },
 { label: 'High-Fit 80+', value: dash.highFitCount, bg: '#0f766e', onClick: () => setDrawer('matchInfo') },
 { label: 'Deadlines', value: dash.deadlineCount, bg: '#b91c1c', onClick: () => setDrawer('deadlines') },
 ].map(s => (
 <button
 key={s.label}
 type="button"
 onClick={s.onClick}
 style={{ background: s.bg, minWidth: 130 }}
 className="text-center px-5 py-3 rounded-xl shadow-lg cursor-pointer hover:brightness-110 transition"
 >
                 <p style={{ color: '#fff', fontSize: 26, fontWeight: 900, margin: 0, lineHeight: 1.1 }}>{dash.loading ? '—' : s.value}</p>
                 <p style={{ color: '#fff', fontSize: 13, fontWeight: 700, margin: '3px 0 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</p>
                 </button>
 ))}
 <button type="button" onClick={() => router.push('/dashboard/onboarding?next=/dashboard')} className="inline-flex items-center gap-2.5 px-7 py-3 rounded-xl text-white font-black text-base cursor-pointer transition-all hover:brightness-110 ml-2 group" style={{ background: '#ea580c', color: 'white' }}>
 {userPrefs ? 'Update Preferences' : 'Set Up Preferences'}
 <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
 </button>
 </div>
 </div>
 </div>
 ) : (
 <div>
 {/* Live badge */}
 {dash.dataSource !== 'loading' && (
 <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4" style={{ background: '#047857', color: 'white' }}>
 <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'white', flexShrink: 0, animation: 'pulse 2s infinite' }} />
 <span style={{ color: 'white', fontWeight: 900, fontSize: '14px', letterSpacing: '0.02em' }}>
 Live · SAM.gov · {dash.totalActiveOpportunities.toLocaleString()} active opportunities (last {DASHBOARD_LIVE_WINDOW_DAYS} days)
 </span>
 </div>
 )}

 {/* Headline — full width, all colours */}
 <h1 style={{ fontFamily: 'Aptos, Inter, Arial, sans-serif', fontWeight: 900, fontSize: 'clamp(1.75rem, 3vw, 2.5rem)', lineHeight: 1.15, marginBottom: '1.25rem', color: 'var(--color-text-primary)' }}>
   {dash.loading ? (
     <span style={{ color: 'var(--color-text-tertiary, #94a3b8)' }}>Loading…</span>
   ) : (
     <>
       <span style={{ color: 'var(--color-accent, #f97316)' }}>Welcome</span>
       <span style={{ color: 'var(--color-text-primary)' }}> to </span>
       <span style={{ color: 'var(--color-link, #0ea5e9)' }}>PreciseGovCon</span>
       <span style={{ color: 'var(--color-text-primary)' }}>'s </span>
       <span style={{ color: 'var(--color-success, #10b981)' }}>Contract Intelligence</span>
       <span style={{ color: 'var(--color-text-primary)' }}> Dashboard</span>
     </>
   )}
 </h1>

 {/* Three-column content row — value text spans 2, chips in last col */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">

 {/* Col 1–2: Value statement — takes up 2/3 of the width */}
 <div className="md:col-span-2">
 <p style={{ fontSize: '19px', fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1.7, marginBottom: '12px' }}>
 Your personalized procurement intelligence hub — live contract opportunities scored against your{' '}
 <span style={{ color: '#1d4ed8', fontWeight: 800 }}>certifications</span>,{' '}
 <span style={{ color: '#6d28d9', fontWeight: 800 }}>NAICS codes</span>, and{' '}
 <span style={{ color: '#047857', fontWeight: 800 }}>agency preferences</span>.
 </p>
 <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1.6 }}>
 <span style={{ color: '#ea580c', fontWeight: 900 }}>Sign in</span> to activate AI match scoring, deadline alerts, and a pipeline built for your business.
 </p>
 {/* Feature chips — 2-col grid, stretches full width */}
 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '20px' }}>
 {[
 { label: 'AI Match Scoring', color: '#6d28d9' },
 { label: 'Set-Aside & NAICS Filtering', color: '#1d4ed8' },
 { label: 'Deadline Alerts', color: '#b91c1c' },
 { label: 'Pipeline Tracking', color: '#047857' },
 { label: 'State & Local — coming soon', color: '#78350f' },
 ].map(f => (
 <span key={f.label} style={{ background: f.color, color: 'white', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 18px', borderRadius: '8px', fontSize: '16px', fontWeight: 800, width: '100%' }}>
 <CheckCircle style={{ width: 18, height: 18, flexShrink: 0, color: 'white' }} />{f.label}
 </span>
 ))}
 </div>
 </div>

 {/* Col 3: CTA box */}
 <div className="md:col-span-1 p-6 rounded-2xl shadow-2xl"
 style={{
 background: 'linear-gradient(135deg, #10b981, #0ea5e9, #6366f1)',
 color: 'white',
 border: 'none',
 transform: 'translateZ(0)'
 }}>
 <p style={{ fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.14em', color: 'rgba(255,255,255,0.9)', marginBottom: '6px' }}>Start for free</p>
 <p style={{ fontSize: '18px', fontWeight: 800, lineHeight: 1.5, marginBottom: '16px' }}>
 Join thousands of small businesses winning government contracts with AI-powered intelligence.
 </p>
 <Link href="/register"
 style={{
 display: 'block',
 textAlign: 'center',
 padding: '14px 22px',
 borderRadius: '12px',
 background: '#0f172a',
 color: 'white',
 fontWeight: 900,
 fontSize: '16px',
 textDecoration: 'none',
 marginBottom: '12px',
 boxShadow: '0 10px 30px rgba(15,23,42,0.35)'
 }}
 className="hover:brightness-110 transition-all">
 Create Free Account
 </Link>
 <Link href="/login"
 style={{
 display: 'block',
 textAlign: 'center',
 padding: '12px 22px',
 borderRadius: '12px',
 border: '2px solid rgba(255,255,255,0.65)',
 color: 'white',
 fontWeight: 800,
 fontSize: '15px',
 textDecoration: 'none',
 backdropFilter: 'blur(4px)'
 }}
 className="hover:bg-white/10 transition-all">
 Sign In to Your Dashboard
 </Link>
 </div>
 </div>
 </div>
 )}
 </div>
 </section>

 {/* ── Visitor info strip ──────────────────────────────────────────── */}
 {!isAuth && !dash.loading && (
 <div className="mb-4 rounded-2xl flex flex-wrap items-center gap-3 px-5 py-4 shadow-lg"
 style={{ background: 'linear-gradient(135deg, #10b981, #0ea5e9)', color: 'white' }}>
 <CheckCircle style={{ color: 'white', width: 22, height: 22, flexShrink: 0 }} />
 <p style={{ color: 'white', fontSize: '16px', fontWeight: 700, flex: 1, lineHeight: 1.5 }}>
 <strong style={{ color: 'white', fontWeight: 900 }}>Log in to see your personalized dashboard.</strong>
 {' '}Access your saved searches, AI match scores, deadline alerts, and tailored recommendations.
 </p>
 <div className="flex gap-2 flex-wrap">
 <Link href="/login"
 style={{ background: 'white', color: '#0f172a', fontWeight: 900, fontSize: '14px', padding: '9px 18px', borderRadius: '10px', textDecoration: 'none', whiteSpace: 'nowrap', boxShadow: '0 8px 20px rgba(0,0,0,0.15)' }}
 className="hover:bg-slate-100 transition-colors">
 Sign In
 </Link>
 <Link href="/register"
 style={{ border: '2px solid rgba(255,255,255,0.7)', color: 'white', fontWeight: 800, fontSize: '14px', padding: '9px 18px', borderRadius: '10px', textDecoration: 'none', whiteSpace: 'nowrap' }}
 className="hover:bg-white/10 transition-colors">
 Create Free Account
 </Link>
 </div>
 </div>
 )}

 {/* ── Stat Cards ─────────────────────────────────────────────────────── */}
 <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
 {stats.map(({ label, value, sub, detail, src, bg, onClick }) => (
 <button
 key={label}
 onClick={onClick}
 style={{ background: bg, color: 'white' }}
 className="text-left rounded-2xl shadow-md hover:shadow-xl p-5 transition-all cursor-pointer group hover:brightness-110 active:scale-[0.98]"
 >
 <div className="flex items-center justify-between mb-3">
 <p style={{ color: 'white', fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
 <ChevronRight style={{ color: 'rgba(255,255,255,0.6)', width: 18, height: 18 }} className="group-hover:translate-x-0.5 transition-all" />
 </div>
 <p style={{ color: 'white', fontSize: '3rem', fontWeight: 900, lineHeight: 1, marginBottom: '8px' }}>
 {dash.loading ? <Loader2 style={{ color: 'rgba(255,255,255,0.7)', width: 24, height: 24 }} className="animate-spin" /> : (value ?? '—' )}
 </p>
 <p style={{ color: 'white', fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>{sub}</p>
 <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px', fontWeight: 500, lineHeight: 1.4 }} className="line-clamp-2">{detail}</p>
 <p style={{ color: 'rgba(255,255,255,0.78)', fontSize: '12px', fontWeight: 700, lineHeight: 1.35, marginTop: '6px' }} className="line-clamp-2">{src}</p>
 </button>
 ))}
 </div>

 {/* Preferences confirmation strip — shows the filters driving these figures */}
 {isAuth && userPrefs && (
 <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
 <span className="text-xs font-black uppercase tracking-widest text-slate-400 mr-1 shrink-0">Figures filtered by:</span>
 {(userPrefs.setAsides ?? []).map(sa => (
 <span key={sa} style={{ background: '#ea580c', color: '#fff', fontSize: 12, fontWeight: 800, padding: '3px 10px', borderRadius: 6 }}>{sa}</span>
 ))}
 {(userPrefs.naicsCodes ?? []).slice(0, 4).map(c => (
 <span key={c} style={{ background: '#4f46e5', color: '#fff', fontSize: 12, fontWeight: 800, padding: '3px 10px', borderRadius: 6, fontFamily: 'monospace' }}>NAICS {c}</span>
 ))}
 {(userPrefs.agencies ?? []).slice(0, 2).map(a => (
 <span key={a} style={{ background: '#047857', color: '#fff', fontSize: 12, fontWeight: 800, padding: '3px 10px', borderRadius: 6 }}>{a.replace(/\s*\(.*\)/, '')}</span>
 ))}
 {(userPrefs.states ?? []).slice(0, 3).map(s => (
 <span key={s} style={{ background: '#0369a1', color: '#fff', fontSize: 12, fontWeight: 800, padding: '3px 10px', borderRadius: 6 }}>{s}</span>
 ))}
 {(userPrefs.setAsides?.length ?? 0) === 0 && (userPrefs.naicsCodes?.length ?? 0) === 0 && (
 <span className="text-xs text-slate-500 italic">No filters set — showing all opportunities</span>
 )}
 <button
 type="button"
 onClick={() => router.push('/dashboard/onboarding?next=/dashboard')}
 className="ml-auto text-xs font-bold text-orange-600 hover:text-orange-800 transition-colors cursor-pointer bg-transparent border-none"
 >
 Edit preferences →
 </button>
 </div>
 )}

 {/* Intelligence Banner removed as per patch guide */}

 {/* ── Main grid ──────────────────────────────────────────────────────── */}
 <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

 {/* Left column */}
 <div className="flex flex-col gap-5">

 {/* AI Analysis */}
 {analysis && (dash.savedOppCount > 0 || dash.recentOpportunities.length > 0) && (
 <div className="rounded-2xl border border-violet-300 bg-white overflow-hidden">
 <div className="flex items-center justify-between px-5 py-3 bg-violet-700">
 <div className="flex items-center gap-2">
 <Brain className="w-5 h-5 text-white" />
 <span className="text-base font-black text-white">PreciseGovCon Intelligence</span>
 <span className="px-2 py-0.5 rounded bg-white/20 text-xs font-bold text-white">AI</span>
 </div>
 <button
 onClick={runAi}
 disabled={analysisLoading}
 className="text-sm font-bold text-white/80 hover:text-white disabled:opacity-50 bg-transparent border-none cursor-pointer transition-colors flex items-center gap-1.5"
 >
 <RefreshCw className={`w-3.5 h-3.5 ${analysisLoading ? 'animate-spin' : ''}`} />
 {analysisLoading ? 'Analyzing…' : 'Re-Analyze'}
 </button>
 </div>

 <div className="p-5">
 {/* Summary */}
 <p className="text-base text-slate-700 leading-relaxed mb-4 font-medium">
 {analysis.summary}
 </p>

 {/* Top priorities */}
 {analysis.topOpps?.length > 0 && (
 <div className="mb-4">
 <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Top Priorities</p>
 <div className="flex flex-col gap-2">
 {analysis.topOpps.map((o, i) => (
 <div key={i} className={`flex items-start gap-3 p-3 rounded-xl ${
 o.urgency === 'high'
 ? 'bg-rose-50 border border-rose-200 '
 : o.urgency === 'medium'
 ? 'bg-amber-50 border border-amber-200 '
 : 'bg-emerald-50 border border-emerald-200 '
 }`}>
 <span className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${
 o.urgency === 'high' ? 'bg-rose-500' : o.urgency === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
 }`} />
 <div>
 <p className="text-sm font-bold text-slate-900 ">{o.title}</p>
 <p className="text-xs text-slate-500 mt-0.5">{o.reason}</p>
 </div>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* Recommended actions */}
 {analysis.recs?.length > 0 && (
 <div className="mb-5">
 <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Recommended Actions</p>
 <ul className="flex flex-col gap-2">
 {analysis.recs.map((r, i) => (
 <li key={i} className="flex items-start gap-2 text-sm text-slate-700 ">
 <ChevronRight className="w-4 h-4 shrink-0 mt-0.5 text-violet-500" />
 {r}
 </li>
 ))}
 </ul>
 </div>
 )}

 <Link
 href="/insights"
 className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-700 hover:bg-violet-800 text-white text-sm font-bold transition-colors"
 >
 <BarChart3 className="w-4 h-4" />
 View Full AI Analysis &amp; Insights
 </Link>
 </div>
 </div>
 )}

 {/* Latest Matches */}
 {dash.recentOpportunities.length > 0 && (
 <div className="rounded-2xl border border-emerald-300 bg-white overflow-hidden">
 {/* Header */}
 <div className="flex items-center justify-between px-5 py-3.5 bg-emerald-700">
 <h3 className="text-base font-black text-white flex items-center gap-2">
 <Target className="w-4 h-4" />
 Latest Matches
 </h3>
 <Link
 href="/opportunities?sort=match&view=list"
 style={{background:'#ea580c',color:'#fff',fontWeight:800,fontSize:13,padding:'6px 14px',borderRadius:8,textDecoration:'none',display:'inline-flex',alignItems:'center'}} className="hover:opacity-90 transition-opacity"
 >
 View All Matches
 </Link>
 </div>

 {/* Sort/filter bar */}
 <div className="flex items-center gap-2 px-5 py-2.5 border-b border-slate-100 bg-slate-50 flex-wrap">
 <span className="text-xs font-bold text-slate-500 uppercase tracking-wide mr-1">Sort:</span>
 {[
 { label: 'Match Score', href: '/opportunities?sort=match&view=list' },
 { label: 'Deadline', href: '/opportunities?sort=deadline_asc&view=list' },
 { label: 'Value', href: '/opportunities?sort=value&view=list' },
 { label: 'Posted', href: '/opportunities?sort=posted_desc&view=list' },
 ].map(s => (
 <Link key={s.label} href={s.href}
 className="px-3 py-1 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition-colors">
 {s.label}
 </Link>
 ))}
 <span className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-2 mr-1">Filter:</span>
 {[
 { label: 'SDVOSB', href: '/opportunities?setAside=SDVOSBC&view=list' },
 { label: 'SBA', href: '/opportunities?setAside=SBA&view=list' },
 { label: 'Expiring', href: '/opportunities?filter=expiring&view=list' },
 ].map(f => (
 <Link key={f.label} href={f.href}
 className="px-3 py-1 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700 transition-colors">
 {f.label}
 </Link>
 ))}
 </div>

 {/* Match rows */}
 <div className="divide-y divide-slate-100 ">
 {dash.recentOpportunities.slice(0, 6).map((o, i) => (
 <div
 key={o.noticeId}
 className="px-5 py-4 hover:bg-emerald-50 transition-colors"
 >
 <div className="flex items-start gap-4">
 {/* Match score pill */}
 <div className={`shrink-0 w-12 h-12 rounded-xl flex flex-col items-center justify-center font-black text-white text-sm ${
 (o.match ?? 0) >= 85 ? 'bg-emerald-600' :
 (o.match ?? 0) >= 70 ? 'bg-sky-600' : 'bg-orange-600'
 }`}>
 <span style={{fontSize:18,fontWeight:900,color:'#fff',lineHeight:1}} className="leading-none">{o.match ?? '—'}</span>
 <span className="text-[10px] font-bold opacity-80">%</span>
 </div>

 {/* Details */}
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 mb-0.5">
 <a
 href={samOppUrl(o.noticeId)}
 target="_blank"
 rel="noopener noreferrer"
 className="text-sm font-bold text-slate-900 leading-snug truncate hover:text-emerald-700"
 >
 {o.title}
 </a>
 <button
 type="button"
 onClick={() => handleQuickAddSavedOpportunity(o)}
 className="px-2 py-0.5 rounded-full bg-fuchsia-100 text-fuchsia-700 text-[10px] font-black uppercase tracking-wide hover:bg-fuchsia-200"
 title="Quick Add to Saved Opportunities"
 >
 Quick Add
 </button>
 </div>
 <p className="text-xs text-slate-500 truncate">{o.agency}</p>
 <div className="flex flex-wrap gap-1.5 mt-1.5">
 {o.setAside && (
 <span className="px-2 py-0.5 rounded bg-emerald-700 text-white text-[11px] font-bold">{o.setAside}</span>
 )}
 {o.naics && (
 <span style={{background:'#1e40af',color:'#bfdbfe',borderRadius:4,padding:'1px 6px',fontSize:11,fontWeight:700,fontFamily:'monospace'}}>{o.naics}</span>
 )}
 </div>
 <div className="flex flex-wrap gap-2 mt-2">
 <a
 href={samOppUrl(o.noticeId)}
 target="_blank"
 rel="noopener noreferrer"
 className="px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
 >
 Open SAM.gov
 </a>
 <button
 type="button"
 onClick={() => handleQuickAddSavedOpportunity(o)}
 disabled={quickSavingIds.has(o.noticeId)}
 className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-bold transition-colors"
 >
 {quickSavingIds.has(o.noticeId) ? 'Saving...' : quickSavedIds.has(o.noticeId) ? 'Saved ✓' : 'Save Opportunity'}
 </button>
 <Link
 href={quickAlertHref(o)}
 className="px-2.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-colors"
 >
 Create Alert
 </Link>
 </div>
 </div>

 {/* Right meta */}
 <div className="shrink-0 text-right flex flex-col items-end gap-1">
 {o.deadline && (
 <span className={`px-2 py-0.5 rounded text-xs font-black text-white ${
 parseInt(o.deadline) <= 5 ? 'bg-red-600' :
 parseInt(o.deadline) <= 10 ? 'bg-orange-500' : 'bg-slate-500'
 }`}>
 {o.deadline}
 </span>
 )}
 {o.value && (
 <span className="text-xs font-bold text-slate-600 ">{fmtCur(o.value)}</span>
 )}
 {o.posted && (
 <span className="text-xs text-slate-400">{o.posted}</span>
 )}
 </div>
 </div>
 </div>
 ))}
 </div>

 {/* Footer CTA */}
 <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
 <span className="text-sm text-slate-500 ">
 Showing {Math.min(6, dash.recentOpportunities.length)} of {dash.thisWeekCount || dash.recentOpportunities.length} postings from the last 7 days
 </span>
 <Link
 href="/opportunities?sort=match&view=list"
 className="px-4 py-2 rounded-lg bg-emerald-700 text-white text-sm font-bold hover:bg-emerald-800 transition-colors"
 >
 See All Matches →
 </Link>
 </div>
 </div>
 )}

 {/* Pipeline Trend */}
 <div className="rounded-2xl border border-slate-200 bg-white p-5 flex-1 flex flex-col">
 <div className="flex items-center justify-between mb-5">
 <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
 <TrendingUp className="w-4 h-4 text-emerald-500" />
 <span className="text-emerald-600 ">Posting</span>
 <span className="text-orange-500">Activity</span>
 <span className="text-xs font-normal text-slate-400 ml-1">Last 7 days · live data</span>
 </h3>
 <div className="flex gap-4">
 {[['bg-orange-400','Total Opportunities'],['bg-emerald-500','Your Matches']].map(([c,l]) => (
 <div key={l} className="flex items-center gap-1.5 text-xs text-slate-500 ">
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
 <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none w-48 rounded-2xl border border-slate-200 bg-white shadow-2xl p-4">
 <p className="text-xs font-black text-slate-800 mb-2 border-b border-slate-100 pb-2">{p.month} Details</p>
 <div className="flex flex-col gap-1.5">
 <div className="flex items-center justify-between">
 <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-2.5 h-2.5 rounded-sm bg-orange-400 inline-block" />Total</span>
 <strong className="text-xs text-orange-500">{p.opportunities.toLocaleString()}</strong>
 </div>
 <div className="flex items-center justify-between">
 <span className="flex items-center gap-1.5 text-xs text-slate-500"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />Matches</span>
 <strong className="text-xs text-emerald-500">{p.matches.toLocaleString()}</strong>
 </div>
 <div className="flex items-center justify-between border-t border-slate-100 pt-1.5 mt-0.5">
 <span className="text-xs text-slate-500">Hit Rate</span>
 <strong className="text-xs text-amber-500">{((p.matches/p.opportunities)*100).toFixed(1)}%</strong>
 </div>
 </div>
 </div>
 )}
 <div className="w-full flex items-end gap-1 h-full">
 <div className="flex-1 rounded-t-lg transition-all duration-200 shadow-sm group-hover:opacity-90"
 style={{height:`${Math.max(8, (p.opportunities / Math.max(1, ...trend.map(t=>t.opportunities)))*100)}%`, minHeight:8, background: hoveredTrend?.month===p.month ? 'linear-gradient(to top, #ea580c, #fb923c)' : 'linear-gradient(to top, #c2410c, #f97316)'}} />
 <div className="flex-1 rounded-t-lg transition-all duration-200 shadow-sm group-hover:opacity-90"
 style={{height:`${Math.max(8, (p.matches / Math.max(1, ...trend.map(t=>t.opportunities)))*100)}%`, minHeight:8, background: hoveredTrend?.month===p.month ? 'linear-gradient(to top, #16a34a, #4ade80)' : 'linear-gradient(to top, #15803d, #22c55e)'}} />
 </div>
 <p className="text-xs font-bold text-slate-500 group-hover:text-slate-800 transition-colors">{p.month}</p>
 </div>
 ))}
 </div>
 {/* Summary stats strip below chart */}
 <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100 ">
 {[
 {label:'Avg Opportunities/Month', value: Math.round(trend.reduce((s,p)=>s+p.opportunities,0)/trend.length).toLocaleString(), color:'text-orange-500'},
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
 <div className="flex flex-col gap-5 h-full">

{/* Deadlines */}
{dash.upcomingDeadlines.length > 0 && (
 <div className="rounded-2xl border border-amber-200 bg-white shadow-lg overflow-hidden">
 <div className="flex items-center justify-between px-4 py-3 bg-linear-to-r from-amber-500 to-orange-500">
 <h3 className="text-sm font-black text-white flex items-center gap-2">
 <AlertTriangle className="w-4 h-4" />Upcoming Deadlines
 </h3>
 <Link href="/opportunities?filter=expiring&view=list"
 className="text-xs font-bold bg-white text-orange-700 px-3 py-1 rounded-lg hover:bg-orange-50 transition-colors">
 View All Deadlines
 </Link>
 </div>
 <div className="divide-y divide-amber-100">
 {dash.upcomingDeadlines.map((dl, i) => {
 const days = parseInt(dl.deadline)
 const pill =
 days <= 3 ? 'bg-rose-100 text-rose-700' :
 days <= 7 ? 'bg-amber-100 text-amber-700' :
 'bg-emerald-100 text-emerald-700'
 return (
 <div key={i} className="px-4 py-3 bg-white hover:bg-amber-50 transition-colors">
 <p className="text-sm font-bold text-slate-900 mb-1 truncate">
 {dl.noticeId ? (
 <a
 href={samOppUrl(dl.noticeId)}
 target="_blank"
 rel="noopener noreferrer"
 className="hover:text-amber-700"
 >
 {dl.title}
 </a>
 ) : dl.title}
 </p>
 <div className="flex items-center justify-between gap-3">
 <p className="text-sm text-slate-600 font-semibold">{dl.value || ''}</p>
 <div className="flex items-center gap-2 shrink-0">
 <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black ${pill}`}>
 <Clock className="w-3.5 h-3.5" />
 {dl.deadline}
 </span>
 {dl.noticeId && (
 <a
 href={samOppUrl(dl.noticeId)}
 target="_blank"
 rel="noopener noreferrer"
 className="inline-flex items-center rounded-full bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-black px-2.5 py-1 transition-colors"
 >
 SAM
 </a>
 )}
 </div>
 </div>
 </div>
 )})}
 </div>
 </div>
)}

{/* Alerts */}
 <div className="rounded-2xl overflow-hidden border border-emerald-200 bg-white shadow-lg">
 <div className="flex items-center justify-between px-4 py-3 bg-linear-to-r from-emerald-600 to-teal-500">
 <h3 className="text-sm font-black text-white flex items-center gap-2">
 <Bell className="w-4 h-4" />
 Your Alerts
 </h3>
 <Link href="/alerts" className="text-xs font-bold text-emerald-900 bg-white px-3 py-1 rounded-lg transition-colors hover:bg-emerald-50">
 Manage Alerts
 </Link>
 </div>
 <div className="divide-y divide-slate-100 bg-white">
 {dash.activeSearches.length === 0 ? (
 <div className="px-4 py-6 text-center">
 <p className="text-sm text-slate-600 mb-3">No active alert subscriptions yet.</p>
 <Link href="/alerts" className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-500 transition-colors">
 Create Your First Alert
 </Link>
 </div>
 ) : (
 dash.activeSearches.slice(0, 4).map(s => (
 <Link key={s.id} href={`/alerts/${s.id}`}
 className="flex items-start justify-between gap-3 px-4 py-3 hover:bg-emerald-50 transition-colors">
 <div className="min-w-0">
 <p className="text-sm font-bold text-slate-900 truncate">{s.name}</p>
 <p className="text-xs text-slate-600 mt-0.5 truncate">
 "{s.query}"
 {s.filters?.naics && <span className="text-emerald-700 font-mono ml-1">· NAICS {s.filters.naics}</span>}
 </p>
 <div className="flex items-center gap-2 mt-1">
 <span className="text-[11px] font-bold text-emerald-600">● Live</span>
 <span className="text-[11px] text-slate-600">{s.resultsCount ?? 0} results</span>
 </div>
 </div>
 {(s.newCount ?? 0) > 0 && (
 <span className="shrink-0 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-xs font-black">+{s.newCount} new</span>
 )}
 </Link>
 ))
 )}
 </div>
 <div className="px-4 py-3 bg-emerald-50 border-t border-emerald-100">
 <Link href="/alerts" className="flex items-center justify-center gap-2 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-colors">
 <Plus className="w-4 h-4" />New Alert Subscription
 </Link>
 </div>
 </div>

 {/* AI Insights */}
 <div className="rounded-2xl overflow-hidden border border-violet-200 bg-white shadow-lg">
 <div className="px-4 py-3 bg-linear-to-r from-violet-600 to-indigo-500">
 <h3 className="text-sm font-black text-white flex items-center gap-2">
 <Brain className="w-4 h-4" />AI Insights
 </h3>
 </div>
 <div className="p-4 bg-white">
<ul className="flex flex-col gap-3 mb-4">
{(analysis?.recs || [
`Your ${userPrefs?.setAsides?.[0] || 'SDVOSB'} certification matches active DoD solicitations`,
'SDVOSB set-asides trending up this quarter',
'Cloud modernization demand peaks in Q3',
]).slice(0, 3).map((r, i) => (
 <li key={i} className="flex items-start gap-2 text-sm text-slate-800 leading-snug font-semibold">
 <ChevronRight className="w-4 h-4 shrink-0 mt-0.5 text-violet-500" />{r}
</li>
))}
</ul>
<Link href="/insights"
className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold transition-colors">
<Brain className="w-4 h-4" />View Full AI Analysis
</Link>

 <div className="mt-4 pt-4 border-t border-slate-200">
 <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 mb-3">
 <Activity className="w-4 h-4 text-violet-500" />Recent Activity
</h3>
<div className="flex flex-col gap-2">
{activityLog.slice(0, 4).map(log => (
 <div key={log.id} className="flex items-start gap-2.5">
 <div className="w-7 h-7 rounded-lg bg-violet-100 border border-violet-200 flex items-center justify-center shrink-0">
 {log.type === 'search' && <Search className="w-3 h-3 text-violet-600" />}
 {log.type === 'alert' && <Bell className="w-3 h-3 text-amber-500" />}
 {log.type === 'ai' && <Brain className="w-3 h-3 text-violet-600" />}
 {log.type === 'save' && <Target className="w-3 h-3 text-emerald-600" />}
 {log.type === 'share' && <Share2 className="w-3 h-3 text-blue-600" />}
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-xs font-semibold text-slate-900 truncate leading-snug">{log.title}</p>
 <p className="text-xs text-slate-500 mt-0.5">{fmtRel(log.timestamp)}</p>
 </div>
 </div>
))}
</div>
</div>
</div>
</div>

 {/* Action Center — fills unused right-rail space with useful controls */}
 <div className="rounded-2xl overflow-hidden border border-sky-200 bg-white shadow-lg min-h-[220px]">
 <div className="px-4 py-3 bg-linear-to-r from-sky-600 to-cyan-500">
 <h3 className="text-sm font-black text-white flex items-center gap-2">
 <Database className="w-4 h-4" />Action Center
 </h3>
 </div>
 <div className="p-4 flex flex-col">
 <div className="grid grid-cols-3 gap-2 mb-4">
 <Link href={liveOppsHref} className="rounded-lg border border-sky-500 bg-sky-700 px-2 py-2 text-center hover:bg-sky-600 transition-colors">
 <p className="text-lg font-black text-white">{dash.totalActiveOpportunities.toLocaleString()}</p>
 <p className="text-[11px] font-bold text-sky-100 uppercase tracking-wide">Live Opps</p>
 </Link>
 <Link href="/dashboard/saved-opportunities" className="rounded-lg border border-emerald-500 bg-emerald-700 px-2 py-2 text-center hover:bg-emerald-600 transition-colors">
 <p className="text-lg font-black text-white">{dash.savedOppCount.toLocaleString()}</p>
 <p className="text-[11px] font-bold text-emerald-100 uppercase tracking-wide">Saved</p>
 </Link>
 <Link href="/alerts" className="rounded-lg border border-orange-400 bg-orange-600 px-2 py-2 text-center hover:bg-orange-500 transition-colors">
 <p className="text-lg font-black text-white">{dash.activeSearchesCount.toLocaleString()}</p>
 <p className="text-[11px] font-bold text-orange-100 uppercase tracking-wide">Alerts</p>
 </Link>
 </div>

 <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 mb-4">
 <p className="text-xs font-black uppercase tracking-widest text-slate-700 mb-2">Counted Items</p>
 <div className="grid grid-cols-2 gap-2">
 <Link href={liveOppsHref} className="rounded-lg border border-sky-500 bg-sky-600 px-2.5 py-2 min-h-[62px] flex flex-col justify-center hover:bg-sky-500 transition-colors">
 <span className="text-[11px] font-bold text-sky-100 uppercase tracking-wide">Active Opps</span>
 <span className="text-lg font-black text-white leading-none mt-1">{dash.totalActiveOpportunities.toLocaleString()}</span>
 </Link>
 <Link href={posted7dHref} className="rounded-lg border border-orange-500 bg-orange-600 px-2.5 py-2 min-h-[62px] flex flex-col justify-center hover:bg-orange-500 transition-colors">
 <span className="text-[11px] font-bold text-orange-100 uppercase tracking-wide">New This Week</span>
 <span className="text-lg font-black text-white leading-none mt-1">{dash.thisWeekCount.toLocaleString()}</span>
 </Link>
 <Link href="/dashboard/saved-opportunities" className="rounded-lg border border-emerald-500 bg-emerald-600 px-2.5 py-2 min-h-[62px] flex flex-col justify-center hover:bg-emerald-500 transition-colors">
 <span className="text-[11px] font-bold text-emerald-100 uppercase tracking-wide">Saved Opps</span>
 <span className="text-lg font-black text-white leading-none mt-1">{dash.savedOppCount.toLocaleString()}</span>
 </Link>
 <Link href="/alerts" className="rounded-lg border border-violet-500 bg-violet-600 px-2.5 py-2 min-h-[62px] flex flex-col justify-center hover:bg-violet-500 transition-colors">
 <span className="text-[11px] font-bold text-violet-100 uppercase tracking-wide">Alerts</span>
 <span className="text-lg font-black text-white leading-none mt-1">{dash.activeSearchesCount.toLocaleString()}</span>
 </Link>
 </div>
 </div>

 <div className="rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2.5 mb-4">
 <p className="text-xs font-black uppercase tracking-widest text-slate-800 mb-1">Data Sync</p>
 <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
 <Calendar className="w-3.5 h-3.5 text-emerald-700" />
 {dashboardApi.lastRefreshed
 ? `Last refresh ${dashboardApi.lastRefreshed.toLocaleTimeString()}`
 : 'Waiting for first sync'}
 </p>
 <p className="text-xs text-orange-700 mt-1 font-semibold">
 Source: {dash.dataSource === 'live' ? 'Live SAM snapshot' : 'Loading'}
 </p>
 </div>

 <div className="grid grid-cols-3 gap-2">
 <button
 type="button"
 onClick={() => void dashboardApi.refresh()}
 disabled={dashboardApi.loading || dashboardApi.isRefreshing}
 className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-sky-600 px-2 py-2 text-xs font-black text-white disabled:opacity-60 hover:bg-sky-500 transition-colors"
 >
 {dashboardApi.isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
 {dashboardApi.isRefreshing ? 'Refreshing…' : 'Refresh Snapshot'}
 </button>
 <Link
 href="/dashboard/onboarding?next=/dashboard"
 className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-orange-600 px-2 py-2 text-xs font-black text-white hover:bg-orange-500 transition-colors"
 >
 <Target className="h-4 w-4" />Tune Feed Preferences
 </Link>
 <Link
 href="/opportunities?view=list&sort=posted_desc"
 className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs font-black text-slate-700 hover:bg-slate-100 transition-colors"
 >
 Browse Opportunities <ArrowRight className="h-4 w-4" />
 </Link>
 </div>
 </div>
 </div>

 <div className="rounded-2xl overflow-hidden border border-indigo-200 bg-white shadow-lg flex-1 min-h-[240px]">
 <div className="px-4 py-3 bg-linear-to-r from-indigo-600 to-violet-500">
 <h3 className="text-sm font-black text-white flex items-center gap-2">
 <Activity className="w-4 h-4" />Market Signals
 </h3>
 </div>
 <div className="p-4 flex flex-col h-full">
 <div className="mb-4">
 <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Top Agencies in Your Feed</p>
 {railSignals.topAgencies.length === 0 ? (
 <p className="text-xs text-slate-500">No agency signal yet. Save opportunities or refresh your feed.</p>
 ) : (
 <div className="flex flex-col gap-2">
 {railSignals.topAgencies.map((entry, idx) => (
 <div key={entry.agency} className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2">
 <p className="text-xs font-bold text-slate-700 truncate">
 {idx + 1}. {entry.agency}
 </p>
 <span className="shrink-0 px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 text-[11px] font-black">
 {entry.count}
 </span>
 </div>
 ))}
 </div>
 )}
 </div>

 <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
 <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Deadline Pressure</p>
 <div className="grid grid-cols-4 gap-2">
 <div className="rounded-lg bg-rose-50 border border-rose-200 px-2 py-1.5 text-center">
 <p className="text-sm font-black text-rose-700">{railSignals.critical}</p>
 <p className="text-[10px] font-bold text-rose-600 uppercase">≤3d</p>
 </div>
 <div className="rounded-lg bg-amber-50 border border-amber-200 px-2 py-1.5 text-center">
 <p className="text-sm font-black text-amber-700">{railSignals.soon}</p>
 <p className="text-[10px] font-bold text-amber-600 uppercase">4-7d</p>
 </div>
 <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-2 py-1.5 text-center">
 <p className="text-sm font-black text-emerald-700">{railSignals.later}</p>
 <p className="text-[10px] font-bold text-emerald-600 uppercase">8+d</p>
 </div>
 <div className="rounded-lg bg-slate-100 border border-slate-200 px-2 py-1.5 text-center">
 <p className="text-sm font-black text-slate-700">{railSignals.unknown}</p>
 <p className="text-[10px] font-bold text-slate-500 uppercase">N/A</p>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>

 </div>
 </div>
 {/* AI Analysis is now inline in the main column — no modal needed */}
 </div>
 )
}
