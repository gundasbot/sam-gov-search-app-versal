'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ArrowRight, CheckSquare, Square, X } from 'lucide-react'

export const dynamic = 'force-dynamic'

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

const SET_ASIDE_OPTIONS = [
  { value: 'SDVOSB', label: 'SDVOSB', desc: 'Service-Disabled Veteran-Owned' },
  { value: 'VOSB', label: 'VOSB', desc: 'Veteran-Owned Small Business' },
  { value: '8A', label: '8(a)', desc: 'SBA 8(a) Program' },
  { value: 'WOSB', label: 'WOSB', desc: 'Women-Owned Small Business' },
  { value: 'HUBZONE', label: 'HUBZone', desc: 'Historically Underutilized Business Zone' },
  { value: 'SBA', label: 'Small Business', desc: 'General SB Set-Aside' },
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
  { label: '$250K - $1M', min: 250000, max: 1000000 },
  { label: '$1M - $5M', min: 1000000, max: 5000000 },
  { label: '$5M - $25M', min: 5000000, max: 25000000 },
  { label: '$25M+', min: 25000000, max: undefined },
]

const STATE_OPTIONS = ['VA','MD','DC','TX','FL','CA','NY','GA','PA','NC','IL','OH','AZ','CO','WA','MA','Remote/Nationwide']
const DEFAULT_NAICS = [
  { value: '541512', label: '541512 - Computer Systems Design' },
  { value: '541519', label: '541519 - IT Services' },
  { value: '541611', label: '541611 - Management Consulting' },
  { value: '541715', label: '541715 - R&D / AI / Data Science' },
  { value: '541513', label: '541513 - Computer Facilities Mgmt' },
]
const DEFAULT_KWS = ['zero trust','cloud migration','cybersecurity','devsecops','data analytics','machine learning']

function firstName(session: any): string {
  const n = session?.user?.name?.trim?.() || ''
  if (n) return n.split(' ')[0]
  const e = session?.user?.email || ''
  return e.includes('@') ? e.split('@')[0] : 'there'
}

export default function DashboardOnboardingPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [nextPath, setNextPath] = useState('/dashboard')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const requested = new URLSearchParams(window.location.search).get('next')
    if (requested && requested.startsWith('/')) setNextPath(requested)
  }, [])

  const [naicsQuery, setNaicsQuery] = useState('')
  const [keywordInput, setKeywordInput] = useState('')
  const [naicsOptions, setNaicsOptions] = useState<Array<{ value: string; label: string }>>(DEFAULT_NAICS)
  const [keywordSuggestions, setKeywordSuggestions] = useState<string[]>(DEFAULT_KWS)
  const [saving, setSaving] = useState(false)

  const [prefs, setPrefs] = useState<Partial<UserPreferences>>({
    setAsides: [], naicsCodes: [], agencies: [], keywords: [], states: [], businessType: 'SDVOSB'
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login?callbackUrl=/dashboard/onboarding')
    }
  }, [status, router])

  useEffect(() => {
    let cancelled = false

    fetch('/api/account/preferences', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (cancelled || !d) return
        if (d.completedOnboarding) {
          router.replace(nextPath)
          return
        }
        setPrefs({
          setAsides: d.setAsides || [],
          naicsCodes: d.naicsCodes || [],
          agencies: d.agencies || [],
          keywords: d.keywords || [],
          states: d.states || [],
          businessType: d.businessType || 'SDVOSB',
          contractSizeMin: d.contractSizeMin,
          contractSizeMax: d.contractSizeMax,
        })
      })
      .catch(() => {})

    fetch('/api/sam/taxonomy?limit=250', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        if (cancelled || !d?.ok) return
        if (Array.isArray(d.naics) && d.naics.length) setNaicsOptions(d.naics)
        if (Array.isArray(d.keywords) && d.keywords.length) setKeywordSuggestions(d.keywords)
      })
      .catch(() => {})

    return () => { cancelled = true }
  }, [nextPath, router])

  function tog<T>(arr: T[], v: T): T[] { return arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v] }

  const normalizeKeyword = (raw: string) => raw.trim().replace(/\s+/g, ' ').toLowerCase()

  const filteredNaics = useMemo(() => {
    const q = naicsQuery.trim().toLowerCase()
    if (!q) return naicsOptions
    return naicsOptions.filter(o => o.value.includes(q) || o.label.toLowerCase().includes(q))
  }, [naicsOptions, naicsQuery])

  const predictedKeywords = useMemo(() => {
    const q = keywordInput.trim().toLowerCase()
    const existing = new Set((prefs.keywords || []).map(normalizeKeyword))
    return keywordSuggestions
      .filter(k => !q || k.includes(q))
      .filter(k => !existing.has(normalizeKeyword(k)))
      .slice(0, 10)
  }, [keywordSuggestions, keywordInput, prefs.keywords])

  function addKeyword(raw: string) {
    const nextKeyword = normalizeKeyword(raw)
    if (!nextKeyword) return
    const existing = new Set((prefs.keywords || []).map(normalizeKeyword))
    if (existing.has(nextKeyword)) {
      setKeywordInput('')
      return
    }
    setPrefs(p => ({ ...p, keywords: [...(p.keywords || []), nextKeyword] }))
    setKeywordInput('')
  }

  function removeKeyword(value: string) {
    const normalized = normalizeKeyword(value)
    setPrefs(p => ({ ...p, keywords: (p.keywords || []).filter(k => normalizeKeyword(k) !== normalized) }))
  }

  function skipForNow() {
    if (typeof window !== 'undefined' && session?.user?.email) {
      window.localStorage.setItem(`pgc-survey-dismissed:${session.user.email.toLowerCase()}`, '1')
    }
    router.replace(nextPath)
  }

  async function saveAndContinue() {
    setSaving(true)
    try {
      const payload: UserPreferences = {
        setAsides: prefs.setAsides || [],
        naicsCodes: prefs.naicsCodes || [],
        agencies: (prefs.agencies || []).slice(0, 8),
        keywords: prefs.keywords || [],
        states: prefs.states || [],
        businessType: prefs.businessType || 'SDVOSB',
        contractSizeMin: prefs.contractSizeMin,
        contractSizeMax: prefs.contractSizeMax,
        completedOnboarding: true,
      }

      const res = await fetch('/api/account/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error('Failed to save preferences')
      if (typeof window !== 'undefined' && session?.user?.email) {
        window.localStorage.removeItem(`pgc-survey-dismissed:${session.user.email.toLowerCase()}`)
      }
      router.replace(nextPath)
      router.refresh()
    } catch {
      setSaving(false)
    }
  }

  if (status === 'loading') {
    return <div className="mx-auto max-w-5xl px-4 py-12 text-slate-500">Loading onboarding...</div>
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 sm:p-7">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Welcome, {firstName(session)}</h1>
        <p className="text-slate-600 mt-1">Set your profile once so dashboard analytics and matches stay relevant.</p>

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <section className="rounded-xl border border-slate-200 p-4">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-600 mb-3">Set-Asides</h2>
            <div className="grid grid-cols-1 gap-2">
              {SET_ASIDE_OPTIONS.map(o => {
                const sel = (prefs.setAsides || []).includes(o.value)
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => setPrefs(p => ({ ...p, setAsides: tog(p.setAsides || [], o.value) }))}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm cursor-pointer ${sel ? 'border-sky-400 bg-sky-50 text-sky-700' : 'border-slate-200 bg-white text-slate-700'}`}
                  >
                    {sel ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-slate-400" />}
                    <span className="font-bold">{o.label}</span>
                    <span className="text-xs text-slate-500">{o.desc}</span>
                  </button>
                )
              })}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 p-4">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-600 mb-3">NAICS Search</h2>
            <input
              value={naicsQuery}
              onChange={e => setNaicsQuery(e.target.value)}
              placeholder="Search NAICS code or description"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm mb-2"
            />
            <div className="flex flex-wrap gap-1.5 mb-2">
              {(prefs.naicsCodes || []).map(code => (
                <button key={code} type="button" onClick={() => setPrefs(p => ({ ...p, naicsCodes: (p.naicsCodes || []).filter(c => c !== code) }))}
                  className="inline-flex items-center gap-1 rounded-md border border-violet-300 bg-violet-50 px-2 py-1 text-xs font-bold text-violet-700">
                  {code} <X className="w-3 h-3" />
                </button>
              ))}
            </div>
            <div className="max-h-52 overflow-y-auto space-y-1">
              {filteredNaics.map(o => {
                const sel = (prefs.naicsCodes || []).includes(o.value)
                return (
                  <button key={o.value} type="button" onClick={() => setPrefs(p => ({ ...p, naicsCodes: sel ? (p.naicsCodes || []).filter(c => c !== o.value) : Array.from(new Set([...(p.naicsCodes || []), o.value])) }))}
                    className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${sel ? 'border-violet-400 bg-violet-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                    {o.label}
                  </button>
                )
              })}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 p-4 lg:col-span-2">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-600 mb-3">Keywords (Predictive + Duplicate-safe)</h2>
            <div className="flex gap-2 mb-2">
              <input
                value={keywordInput}
                onChange={e => setKeywordInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addKeyword(keywordInput) } }}
                placeholder="Add keyword"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <button type="button" onClick={() => addKeyword(keywordInput)} className="rounded-lg bg-sky-500 px-3 py-2 text-xs font-black text-white">Add</button>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {predictedKeywords.map(k => (
                <button key={k} type="button" onClick={() => addKeyword(k)} className="rounded-md border border-sky-200 bg-sky-50 px-2 py-1 text-xs font-bold text-sky-700">+ {k}</button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(prefs.keywords || []).map(k => (
                <button key={k} type="button" onClick={() => removeKeyword(k)} className="inline-flex items-center gap-1 rounded-md border border-emerald-300 bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">
                  {k} <X className="w-3 h-3" />
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 p-4">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-600 mb-3">Target Agencies</h2>
            <div className="space-y-1.5 max-h-44 overflow-y-auto">
              {AGENCY_OPTIONS.map(agency => {
                const sel = (prefs.agencies || []).includes(agency)
                return (
                  <button key={agency} type="button" onClick={() => setPrefs(p => ({ ...p, agencies: tog(p.agencies || [], agency).slice(0, 8) }))}
                    className={`w-full rounded-lg border px-3 py-2 text-left text-sm ${sel ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white'}`}>
                    {agency}
                  </button>
                )
              })}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 p-4">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-600 mb-3">Contract Size + States</h2>
            <div className="grid grid-cols-2 gap-1.5 mb-2">
              {CONTRACT_SIZE_OPTIONS.map(o => {
                const sel = prefs.contractSizeMin === o.min
                return (
                  <button key={o.label} type="button" onClick={() => setPrefs(p => ({ ...p, contractSizeMin: o.min, contractSizeMax: o.max }))}
                    className={`rounded-lg border px-2 py-2 text-xs font-bold ${sel ? 'border-amber-400 bg-amber-50 text-amber-700' : 'border-slate-200 bg-white'}`}>
                    {o.label}
                  </button>
                )
              })}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {STATE_OPTIONS.map(s => {
                const sel = (prefs.states || []).includes(s)
                return (
                  <button key={s} type="button" onClick={() => setPrefs(p => ({ ...p, states: tog(p.states || [], s) }))}
                    className={`rounded-md border px-2 py-1 text-xs font-bold ${sel ? 'border-sky-400 bg-sky-50 text-sky-700' : 'border-slate-200 bg-white text-slate-600'}`}>
                    {s}
                  </button>
                )
              })}
            </div>
          </section>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <button type="button" onClick={skipForNow} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-600">Skip for now</button>
          <button type="button" disabled={saving} onClick={saveAndContinue} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-sm font-black text-white disabled:opacity-60">
            {saving ? 'Saving...' : 'Save and Continue'} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
