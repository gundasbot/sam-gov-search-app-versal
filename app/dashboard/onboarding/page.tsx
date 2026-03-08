'use client'

import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ArrowRight, Loader2, X, Check, Search } from 'lucide-react'
import { NAICS_CODES } from '@/lib/naics-codes'
import { PSC_CODES } from '@/lib/psc-codes'
import { SET_ASIDE_CODES, US_STATES } from '@/lib/sam-gov-constants'

export const dynamic = 'force-dynamic'

// Aptos font stack
const aptosFontStyle = `
  .aptos-page, .aptos-page * {
    font-family: 'Aptos', 'Aptos Display', 'Calibri', ui-sans-serif, system-ui, -apple-system, sans-serif !important;
    -webkit-font-smoothing: antialiased;
  }
  .aptos-page h1, .aptos-page h2, .aptos-page h3, .aptos-page h4,
  .aptos-page .font-black, .aptos-page .font-extrabold, .aptos-page .font-bold {
    font-weight: 800 !important;
    letter-spacing: -0.01em;
  }
  .aptos-page p, .aptos-page span, .aptos-page a, .aptos-page label {
    font-weight: 600;
  }
  .aptos-page input::placeholder { font-weight: 400; }
`

type UserPreferences = {
  setAsides: string[]
  naicsCodes: string[]
  pscCodes: string[]
  keywords: string[]
  states: string[]
  contractSizeMin?: number
  contractSizeMax?: number
  completedOnboarding: boolean
}

const CONTRACT_SIZE_OPTIONS = [
  { label: 'Under $250K', min: 0, max: 250000 },
  { label: '$250K - $1M', min: 250000, max: 1000000 },
  { label: '$1M - $5M', min: 1000000, max: 5000000 },
  { label: '$5M - $25M', min: 5000000, max: 25000000 },
  { label: '$25M+', min: 25000000, max: undefined },
]

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

  const [naicsSearch, setNaicsSearch] = useState('')
  const [pscSearch, setPscSearch] = useState('')
  const [keywordInput, setKeywordInput] = useState('')
  const [activeTab, setActiveTab] = useState<'naics' | 'psc' | 'keywords'>('naics')
  const [prefs, setPrefs] = useState<Partial<UserPreferences>>({
    setAsides: [],
    naicsCodes: [],
    pscCodes: [],
    keywords: [],
    states: [],
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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
          keywords: d.keywords || [],
          states: d.states || [],
          contractSizeMin: d.contractSizeMin,
          contractSizeMax: d.contractSizeMax,
        })
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [nextPath])

  // Auto-save with debounce
  const autoSave = useCallback((updatedPrefs: Partial<UserPreferences>) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)

    setSaving(true)
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await fetch('/api/account/preferences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...updatedPrefs,
            completedOnboarding: true,
          }),
        })
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      } catch (err) {
        console.error('Failed to save preferences:', err)
      } finally {
        setSaving(false)
      }
    }, 1000)
  }, [])

  // Handle preference changes
  const updatePrefs = useCallback((updates: Partial<UserPreferences>) => {
    setPrefs(prev => {
      const newPrefs = { ...prev, ...updates }
      autoSave(newPrefs)
      return newPrefs
    })
  }, [autoSave])

  // Get trending/popular NAICS codes
  const trendingNaics = useMemo(() => {
    const popularCodes = [
      '541512', // Computer Systems Design Services
      '541511', // Custom Computer Programming Services
      '541330', // Engineering Services
      '541611', // Administrative Management Consulting
      '541715', // R&D in Physical, Engineering, Life Sciences
      '518210', // Data Processing, Hosting Services
      '336411', // Aircraft Manufacturing
      '541519', // Other Computer Related Services
    ]
    return NAICS_CODES.filter(c => popularCodes.includes(c.code))
  }, [])

  // Filter NAICS codes
  const filteredNaics = useMemo(() => {
    if (!naicsSearch.trim()) return NAICS_CODES.slice(0, 50)
    const q = naicsSearch.toLowerCase()
    return NAICS_CODES.filter(
      code =>
        code.code.toLowerCase().includes(q) ||
        code.title.toLowerCase().includes(q) ||
        code.description?.toLowerCase().includes(q)
    ).slice(0, 50)
  }, [naicsSearch])

  // Filter PSC codes
  const filteredPsc = useMemo(() => {
    if (!pscSearch.trim()) return PSC_CODES.slice(0, 50)
    const q = pscSearch.toLowerCase()
    return PSC_CODES.filter(
      code =>
        code.code.toLowerCase().includes(q) ||
        code.title.toLowerCase().includes(q) ||
        code.description?.toLowerCase().includes(q) ||
        code.category?.toLowerCase().includes(q)
    ).slice(0, 50)
  }, [pscSearch])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-slate-50 to-blue-50">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    )
  }

  return (
    <div className="aptos-page w-full min-h-screen bg-gradient-to-br from-white via-slate-50 to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
      <style dangerouslySetInnerHTML={{ __html: aptosFontStyle }} />

      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-white border-b border-slate-700 dark:border-slate-800">
        <div className="mx-auto w-full max-w-[1920px] px-3 sm:px-4 lg:px-6 xl:px-8 py-8">
          <h1 className="text-4xl sm:text-5xl font-black flex items-center gap-3">
            <span>🚀</span>
            <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-red-500 bg-clip-text text-transparent">Setup Your Profile</span>
          </h1>
          <p className="text-xl text-slate-300 mt-3 max-w-3xl leading-relaxed">
            Let's customize your opportunity feed to match your business, location, and expertise
          </p>

          {/* Save Status */}
          <div className="mt-5 flex items-center gap-2">
            {saved && (
              <div className="inline-flex items-center gap-2 rounded-lg bg-green-500/20 border border-green-500/50 px-4 py-2 text-sm font-semibold text-green-400">
                <Check className="h-4 w-4" />
                Saved
              </div>
            )}
            {saving && (
              <div className="inline-flex items-center gap-2 rounded-lg bg-blue-500/20 border border-blue-500/50 px-4 py-2 text-sm font-semibold text-blue-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto w-full max-w-[1920px] px-3 sm:px-4 lg:px-6 xl:px-8 py-8">
        <div className="space-y-12">

          {/* Business Classification */}
          <section>
            <div className="mb-8">
              <h2 className="text-3xl font-black bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">Business Classification</h2>
              <p className="text-lg text-slate-600 mt-2">What business classifications apply to your company?</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {SET_ASIDE_CODES.filter(code => code.value).map(code => {
                const isSelected = (prefs.setAsides || []).includes(code.value)
                return (
                  <button
                    key={code.value}
                    onClick={() =>
                      updatePrefs({
                        setAsides: isSelected
                          ? (prefs.setAsides || []).filter(v => v !== code.value)
                          : [...(prefs.setAsides || []), code.value],
                      })
                    }
                    className={`relative rounded-lg border-2 p-4 text-left transition-all ${
                      isSelected
                        ? 'border-orange-400 bg-orange-50 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-orange-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900">{code.label}</p>
                        <p className="text-sm text-slate-600 mt-1">{code.value}</p>
                      </div>
                      {isSelected && <Check className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />}
                    </div>
                  </button>
                )
              })}
            </div>
          </section>

          {/* Industry Expertise & Services */}
          <section>
            <div className="mb-8">
              <h2 className="text-3xl font-black bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">Expertise & Services</h2>
              <p className="text-lg text-slate-600 mt-2">Search and select NAICS codes, PSC codes, and keywords that describe your business.</p>
            </div>

            {/* Tabs */}
            <div className="mb-8 flex gap-2 border-b border-slate-200">
              {(['naics', 'psc', 'keywords'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 font-bold uppercase text-sm transition-all border-b-2 ${
                    activeTab === tab
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab === 'naics' ? 'NAICS Codes' : tab === 'psc' ? 'PSC Codes' : 'Keywords'}
                </button>
              ))}
            </div>

            {/* NAICS Tab */}
            {activeTab === 'naics' && (
              <div className="space-y-6">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-orange-500" />
                  <input
                    type="text"
                    placeholder="Search: 541512, Software, Engineering..."
                    value={naicsSearch}
                    onChange={e => setNaicsSearch(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 text-base rounded-xl border-2 border-slate-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 focus:outline-none font-semibold transition-all"
                  />
                  {naicsSearch && (
                    <button
                      onClick={() => setNaicsSearch('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>

                {/* NAICS Results */}
                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-4">
                  {filteredNaics.map(code => {
                    const isSelected = (prefs.naicsCodes || []).includes(code.code)
                    return (
                      <button
                        key={code.code}
                        onClick={() =>
                          updatePrefs({
                            naicsCodes: isSelected
                              ? (prefs.naicsCodes || []).filter(c => c !== code.code)
                              : [...(prefs.naicsCodes || []), code.code],
                          })
                        }
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                          isSelected
                            ? 'border-orange-400 bg-orange-50 shadow-sm'
                            : 'border-slate-200 hover:border-orange-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-black text-lg text-slate-900">{code.code}</p>
                              <span className="text-slate-400">—</span>
                              <p className="text-slate-800 font-semibold">{code.title}</p>
                            </div>
                            {code.description && (
                              <p className="text-sm text-slate-600 mt-2">{code.description}</p>
                            )}
                          </div>
                          {isSelected && <Check className="h-5 w-5 text-orange-600 flex-shrink-0" />}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* PSC Tab */}
            {activeTab === 'psc' && (
              <div className="space-y-6">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-orange-500" />
                  <input
                    type="text"
                    placeholder="Search: R401, Engineering, Systems..."
                    value={pscSearch}
                    onChange={e => setPscSearch(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 text-base rounded-xl border-2 border-slate-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 focus:outline-none font-semibold transition-all"
                  />
                  {pscSearch && (
                    <button
                      onClick={() => setPscSearch('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>

                {/* PSC Results */}
                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-4">
                  {filteredPsc.map(code => {
                    const isSelected = (prefs.pscCodes || []).includes(code.code)
                    return (
                      <button
                        key={code.code}
                        onClick={() =>
                          updatePrefs({
                            pscCodes: isSelected
                              ? (prefs.pscCodes || []).filter(c => c !== code.code)
                              : [...(prefs.pscCodes || []), code.code],
                          })
                        }
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                          isSelected
                            ? 'border-orange-400 bg-orange-50 shadow-sm'
                            : 'border-slate-200 hover:border-orange-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-black text-lg text-slate-900">{code.code}</p>
                              <span className="text-slate-400">—</span>
                              <p className="text-slate-800 font-semibold">{code.title}</p>
                            </div>
                            {code.description && (
                              <p className="text-sm text-slate-600 mt-2">{code.description}</p>
                            )}
                            {code.category && (
                              <p className="text-xs text-slate-500 mt-1">Category: {code.category}</p>
                            )}
                          </div>
                          {isSelected && <Check className="h-5 w-5 text-orange-600 flex-shrink-0" />}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Keywords Tab */}
            {activeTab === 'keywords' && (
              <div className="space-y-6">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add keyword: Cloud, Security, AI, DevOps..."
                    value={keywordInput}
                    onChange={e => setKeywordInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && keywordInput.trim()) {
                        updatePrefs({
                          keywords: [...(prefs.keywords || []), keywordInput.trim()],
                        })
                        setKeywordInput('')
                      }
                    }}
                    className="flex-1 px-4 py-4 text-base rounded-xl border-2 border-slate-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 focus:outline-none font-semibold transition-all"
                  />
                  <button
                    onClick={() => {
                      if (keywordInput.trim()) {
                        updatePrefs({
                          keywords: [...(prefs.keywords || []), keywordInput.trim()],
                        })
                        setKeywordInput('')
                      }
                    }}
                    className="px-6 py-4 rounded-xl bg-orange-500 text-white font-bold hover:bg-orange-600 transition-all"
                  >
                    Add
                  </button>
                </div>

                {/* Keywords List */}
                <div className="flex flex-wrap gap-2">
                  {(prefs.keywords || []).map(kw => (
                    <button
                      key={kw}
                      onClick={() =>
                        updatePrefs({
                          keywords: (prefs.keywords || []).filter(k => k !== kw),
                        })
                      }
                      className="inline-flex items-center gap-2 rounded-lg bg-orange-100 border-2 border-orange-400 px-4 py-2 text-sm font-bold text-orange-700 hover:bg-orange-200 transition-all group"
                    >
                      <span>{kw}</span>
                      <X className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Summary */}
            {((prefs.naicsCodes?.length || 0) + (prefs.pscCodes?.length || 0) + (prefs.keywords?.length || 0) > 0) && (
              <div className="mt-8 pt-8 border-t border-slate-200">
                <p className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">
                  ✓ Selected ({(prefs.naicsCodes?.length || 0) + (prefs.pscCodes?.length || 0) + (prefs.keywords?.length || 0)})
                </p>
                <div className="flex flex-wrap gap-2">
                  {(prefs.naicsCodes || []).map(code => (
                    <button
                      key={`naics-${code}`}
                      onClick={() =>
                        updatePrefs({
                          naicsCodes: (prefs.naicsCodes || []).filter(c => c !== code),
                        })
                      }
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-100 border-2 border-blue-400 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-200 transition-all group"
                    >
                      <span>N:{code}</span>
                      <X className="h-3 w-3 opacity-50 group-hover:opacity-100" />
                    </button>
                  ))}
                  {(prefs.pscCodes || []).map(code => (
                    <button
                      key={`psc-${code}`}
                      onClick={() =>
                        updatePrefs({
                          pscCodes: (prefs.pscCodes || []).filter(c => c !== code),
                        })
                      }
                      className="inline-flex items-center gap-2 rounded-lg bg-green-100 border-2 border-green-400 px-3 py-1.5 text-xs font-bold text-green-700 hover:bg-green-200 transition-all group"
                    >
                      <span>P:{code}</span>
                      <X className="h-3 w-3 opacity-50 group-hover:opacity-100" />
                    </button>
                  ))}
                  {(prefs.keywords || []).map(kw => (
                    <button
                      key={`kw-${kw}`}
                      onClick={() =>
                        updatePrefs({
                          keywords: (prefs.keywords || []).filter(k => k !== kw),
                        })
                      }
                      className="inline-flex items-center gap-2 rounded-lg bg-purple-100 border-2 border-purple-400 px-3 py-1.5 text-xs font-bold text-purple-700 hover:bg-purple-200 transition-all group"
                    >
                      <span>K:{kw}</span>
                      <X className="h-3 w-3 opacity-50 group-hover:opacity-100" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Geographic & Contract Size */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* States */}
            <section>
              <h2 className="text-3xl font-black bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent mb-8">Geographic Focus</h2>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {US_STATES.slice(1).map(state => {
                  const isSelected = (prefs.states || []).includes(state.value)
                  return (
                    <button
                      key={state.value}
                      onClick={() =>
                        updatePrefs({
                          states: isSelected
                            ? (prefs.states || []).filter(v => v !== state.value)
                            : [...(prefs.states || []), state.value],
                        })
                      }
                      className={`rounded-lg border-2 px-2.5 py-2 text-sm font-bold transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-500 text-white shadow-sm'
                          : 'border-slate-300 bg-white text-slate-900 hover:border-blue-400 hover:bg-blue-50'
                      }`}
                    >
                      {state.value}
                    </button>
                  )
                })}
              </div>
            </section>

            {/* Contract Size */}
            <section>
              <h2 className="text-3xl font-black bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent mb-8">Contract Size Range</h2>
              <div className="space-y-3">
                {CONTRACT_SIZE_OPTIONS.map(size => {
                  const isSelected = prefs.contractSizeMin === size.min
                  return (
                    <button
                      key={size.label}
                      onClick={() =>
                        updatePrefs({
                          contractSizeMin: size.min,
                          contractSizeMax: size.max,
                        })
                      }
                      className={`w-full rounded-lg border-2 px-6 py-3 text-left font-bold transition-all ${
                        isSelected
                          ? 'border-green-500 bg-green-500 text-white shadow-sm'
                          : 'border-slate-300 bg-white text-slate-900 hover:border-green-400 hover:bg-green-50'
                      }`}
                    >
                      {size.label}
                    </button>
                  )
                })}
              </div>
            </section>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end items-center gap-4 pt-8 border-t border-slate-200">
            <button
              onClick={() => {
                updatePrefs({ completedOnboarding: true })
                setTimeout(() => router.push(nextPath), 500)
              }}
              className="inline-flex items-center gap-3 px-8 py-3 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white font-black hover:shadow-lg transition-all hover:-translate-y-0.5"
            >
              Start Exploring <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
