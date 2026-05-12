'use client'

import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  Search, Loader2, X, Check, ArrowRight
} from 'lucide-react'
import { NAICS_CODES } from '@/lib/naics-codes'
import { SET_ASIDE_CODES, US_STATES } from '@/lib/sam-gov-constants'

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

// Time-of-day greeting
function getGreeting(): { greeting: string; emoji: string } {
  const hour = new Date().getHours()
  if (hour < 12) return { greeting: 'Good morning', emoji: '🌅' }
  if (hour < 17) return { greeting: 'Good afternoon', emoji: '☀️' }
  return { greeting: 'Good evening', emoji: '🌙' }
}

function firstName(session: any): string {
  const name = session?.user?.name?.trim() || ''
  if (name) return name.split(' ')[0]
  const email = session?.user?.email || ''
  return email.includes('@') ? email.split('@')[0] : 'there'
}

type UserPreferences = {
  setAsides: string[]
  naicsCodes: string[]
  keywords: string[]
  states: string[]
  contractSizeMin?: number
  contractSizeMax?: number
  completedOnboarding: boolean
}

const CONTRACT_SIZES = [
  { label: 'Under $250K', min: 0, max: 250000 },
  { label: '$250K - $1M', min: 250000, max: 1000000 },
  { label: '$1M - $5M', min: 1000000, max: 5000000 },
  { label: '$5M - $25M', min: 5000000, max: 25000000 },
  { label: '$25M+', min: 25000000, max: undefined },
]

const DEFAULT_SET_ASIDES = SET_ASIDE_CODES.filter(code => code.value).map(code => code.value)
const DEFAULT_STATES = US_STATES.filter(state => state.value).map(state => state.value)
const KEYWORD_SUGGESTIONS = ['cybersecurity', 'cloud services', 'data analytics', 'AI/ML', 'logistics']

export default function FeedPersonalizationPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { greeting, emoji } = getGreeting()

  const [prefs, setPrefs] = useState<Partial<UserPreferences>>({
    setAsides: DEFAULT_SET_ASIDES,
    naicsCodes: [],
    keywords: [],
    states: DEFAULT_STATES,
  })

  const [naicsSearch, setNaicsSearch] = useState('')
  const [keywordDraft, setKeywordDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login')
    }
  }, [status, router])

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    }
  }, [])

  // Load preferences
  useEffect(() => {
    const loadPrefs = async () => {
      try {
        const res = await fetch('/api/account/preferences', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          const useDefaultSetAsides = !data?.completedOnboarding && (!Array.isArray(data?.setAsides) || data.setAsides.length === 0)
          const useDefaultStates = !data?.completedOnboarding && (!Array.isArray(data?.states) || data.states.length === 0)
          setPrefs({
            setAsides: useDefaultSetAsides ? DEFAULT_SET_ASIDES : (data.setAsides || []),
            naicsCodes: data.naicsCodes || [],
            keywords: data.keywords || [],
            states: useDefaultStates ? DEFAULT_STATES : (data.states || []),
            contractSizeMin: data.contractSizeMin,
            contractSizeMax: data.contractSizeMax,
          })
        }
      } catch (err) {
        console.error('Failed to load preferences:', err)
      } finally {
        setLoading(false)
      }
    }

    if (status === 'authenticated') {
      loadPrefs()
    }
  }, [status])

  const persistPrefs = useCallback(async (updatedPrefs: Partial<UserPreferences>) => {
    const res = await fetch('/api/account/preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedPrefs),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data?.error || 'Failed to save preferences')
    }
  }, [])

  // Auto-save with debounce
  const autoSave = useCallback((updatedPrefs: Partial<UserPreferences>) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)

    setSaving(true)
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await persistPrefs(updatedPrefs)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      } catch (err) {
        console.error('Failed to save preferences:', err)
      } finally {
        setSaving(false)
      }
    }, 1000)
  }, [persistPrefs])

  // Handle preference changes
  const updatePrefs = useCallback((updates: Partial<UserPreferences>) => {
    setPrefs(prev => {
      const newPrefs = { ...prev, ...updates }
      autoSave(newPrefs)
      return newPrefs
    })
  }, [autoSave])

  const finalizeAndContinue = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
    }
    setSaving(true)
    try {
      await persistPrefs({ ...prefs, completedOnboarding: true })
      setSaved(true)
      router.push('/dashboard')
    } catch (err) {
      console.error('Failed to complete personalization:', err)
    } finally {
      setSaving(false)
    }
  }, [persistPrefs, prefs, router])

  const addKeyword = useCallback((rawKeyword: string) => {
    const keyword = rawKeyword.trim().toLowerCase()
    if (!keyword) return
    if ((prefs.keywords || []).includes(keyword)) return
    updatePrefs({ keywords: [...(prefs.keywords || []), keyword] })
  }, [prefs.keywords, updatePrefs])

  const removeKeyword = useCallback((keyword: string) => {
    updatePrefs({ keywords: (prefs.keywords || []).filter(item => item !== keyword) })
  }, [prefs.keywords, updatePrefs])

  const toggleSetAside = useCallback((value: string) => {
    const selected = prefs.setAsides || DEFAULT_SET_ASIDES
    const isSelected = selected.includes(value)
    updatePrefs({
      setAsides: isSelected
        ? selected.filter(item => item !== value)
        : [...selected, value],
    })
  }, [prefs.setAsides, updatePrefs])

  const toggleState = useCallback((value: string) => {
    const selected = prefs.states || DEFAULT_STATES
    const isSelected = selected.includes(value)
    updatePrefs({
      states: isSelected
        ? selected.filter(item => item !== value)
        : [...selected, value],
    })
  }, [prefs.states, updatePrefs])

  // Get trending/popular NAICS codes for quick selection
  const trendingNaics = useMemo(() => {
    // Popular codes that match common federal contractor types
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

  // Filter NAICS codes - ONLY from library
  const filteredNaics = useMemo(() => {
    if (!naicsSearch.trim()) return NAICS_CODES.slice(0, 60)
    const q = naicsSearch.toLowerCase()
    return NAICS_CODES.filter(
      code =>
        code.code.toLowerCase().includes(q) ||
        code.title.toLowerCase().includes(q) ||
        code.description?.toLowerCase().includes(q)
    ).slice(0, 60)
  }, [naicsSearch])

  const selectedSetAsides = prefs.setAsides || DEFAULT_SET_ASIDES
  const selectedStates = prefs.states || DEFAULT_STATES

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-slate-50 to-blue-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-orange-500" />
          <p className="mt-4 text-slate-600">Loading your preferences...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="aptos-page w-full min-h-screen" style={{ background: 'var(--color-surface)', color: 'var(--color-text-primary)' }}>
      <style dangerouslySetInnerHTML={{ __html: aptosFontStyle }} />

      {/* Compact page header */}
      <div className="border-b" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
        <div className="mx-auto w-full max-w-480 px-3 sm:px-4 lg:px-6 xl:px-8 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{greeting}, {firstName(session)}</p>
            <h1 className="text-2xl font-black text-slate-900 mt-0.5">{emoji} Preferences</h1>
            <p className="text-sm text-slate-500 mt-0.5">Customize your feed · changes auto-save</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-sm font-bold text-emerald-700">
              {selectedSetAsides.length} set-asides · {(prefs.naicsCodes || []).length} NAICS · {selectedStates.length} states
            </div>
            {saved && (
              <div className="inline-flex items-center gap-1.5 rounded-lg bg-green-100 border border-green-300 px-3 py-1.5 text-sm font-semibold text-green-800">
                <Check className="h-3.5 w-3.5" /> Saved
              </div>
            )}
            {saving && (
              <div className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 border border-blue-200 px-3 py-1.5 text-sm font-semibold text-blue-700">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-480 px-3 sm:px-4 lg:px-6 xl:px-8 py-6">
        <div className="space-y-8">

          {/* Guided setup */}
          <section className="rounded-xl border border-blue-200 bg-blue-50 px-5 py-4">
            <div className="flex items-center justify-between gap-4 flex-wrap mb-3">
              <div>
                <h2 className="text-base font-black text-slate-900">Quick setup guide</h2>
                <p className="text-sm text-slate-600 mt-0.5">We auto-save changes, and save one final time before continuing.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                '1) Select set-asides',
                '2) Add NAICS + service keywords',
                '3) Pick locations and continue',
              ].map(step => (
                <div key={step} className="rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm font-bold text-blue-900">
                  {step}
                </div>
              ))}
            </div>
          </section>

          {/* Set-Asides Section */}
          <section>
            <div className="mb-4">
              <h2 className="text-xl font-black text-orange-600">Business Classification</h2>
              <p className="text-sm text-slate-600 mt-1">What business classifications apply to your company?</p>
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => updatePrefs({ setAsides: DEFAULT_SET_ASIDES })}
                className="rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold px-3 py-1.5 text-sm"
              >
                Select all set-asides
              </button>
              <button
                type="button"
                onClick={() => updatePrefs({ setAsides: [] })}
                className="rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold px-3 py-1.5 text-sm"
              >
                Clear set-asides
              </button>
              <span className="text-sm font-semibold text-slate-600">Selected: {selectedSetAsides.length}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {SET_ASIDE_CODES.filter(code => code.value).map(code => {
                const isSelected = selectedSetAsides.includes(code.value)
                return (
                  <button
                    key={code.value}
                    onClick={() => toggleSetAside(code.value)}
                    className={`relative rounded-lg border-2 p-3 text-left transition-all ${
                      isSelected
                        ? 'border-orange-500 bg-orange-600 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-orange-300 hover:bg-orange-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className={`font-bold text-sm leading-snug ${isSelected ? 'text-white' : 'text-slate-900'}`}>{code.label}</p>
                        <p className={`text-xs mt-0.5 font-semibold ${isSelected ? 'text-orange-100' : 'text-slate-500'}`}>{code.value}</p>
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-white shrink-0 mt-0.5" />}
                    </div>
                  </button>
                )
              })}
            </div>
          </section>

          {/* NAICS Codes Section */}
          <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
            <div className="mb-4">
              <h2 className="text-xl font-black text-orange-600">NAICS + Services Focus</h2>
              <p className="text-sm text-slate-600 mt-1">
                Enter NAICS codes and service descriptions so matching opportunities are prioritized correctly.
              </p>
            </div>

            <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 mb-5">
              <p className="text-base font-black text-orange-900 mb-3">Services / keywords</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={keywordDraft}
                  onChange={e => setKeywordDraft(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addKeyword(keywordDraft)
                      setKeywordDraft('')
                    }
                  }}
                  placeholder="e.g. cybersecurity, analytics, logistics, cloud migration"
                  className="flex-1 px-4 py-3 rounded-lg border-2 border-orange-300 focus:border-orange-500 focus:outline-none text-base font-semibold bg-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    addKeyword(keywordDraft)
                    setKeywordDraft('')
                  }}
                  className="rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold px-5 py-3 text-sm"
                >
                  Add keyword
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {(prefs.keywords || []).map(keyword => (
                  <button
                    key={keyword}
                    type="button"
                    onClick={() => removeKeyword(keyword)}
                    className="inline-flex items-center gap-2 rounded-lg bg-orange-200 border border-orange-400 px-3 py-1.5 text-sm font-bold text-orange-900"
                  >
                    {keyword}
                    <X className="h-3.5 w-3.5" />
                  </button>
                ))}
                {(prefs.keywords || []).length === 0 && (
                  <span className="text-sm font-semibold text-orange-800">No service keywords added yet.</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {KEYWORD_SUGGESTIONS.map(suggestion => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => addKeyword(suggestion)}
                    className="rounded-lg border border-orange-300 bg-white hover:bg-orange-100 px-3 py-1.5 text-xs font-bold text-orange-800"
                  >
                    + {suggestion}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  const merged = Array.from(new Set([...(prefs.naicsCodes || []), ...filteredNaics.map(item => item.code)]))
                  updatePrefs({ naicsCodes: merged })
                }}
                className="rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold px-4 py-2 text-sm"
              >
                Select all shown NAICS
              </button>
              <button
                type="button"
                onClick={() => updatePrefs({ naicsCodes: [] })}
                className="rounded-lg border-2 border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold px-4 py-2 text-sm"
              >
                Clear NAICS
              </button>
              <span className="text-sm font-bold text-slate-700">Selected NAICS: {(prefs.naicsCodes || []).length}</span>
            </div>

            {/* Trending NAICS Codes */}
            {!naicsSearch && (
              <div className="mb-5">
                <p className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">🔥 Popular Industries</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {trendingNaics.map(code => {
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
                        className={`text-left p-3 rounded-lg border-2 transition-all text-sm ${
                          isSelected
                            ? 'border-orange-500 bg-orange-600 shadow-sm'
                            : 'border-slate-200 bg-white hover:border-orange-300 hover:bg-orange-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-slate-900'}`}>{code.code}</p>
                            <p className={`font-semibold text-xs mt-1 line-clamp-2 ${isSelected ? 'text-orange-100' : 'text-slate-700'}`}>{code.title}</p>
                          </div>
                          {isSelected && <Check className="h-4 w-4 text-white shrink-0 mt-0.5" />}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Search Input */}
            <div className="mb-5">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-orange-500" />
                <input
                  type="text"
                  placeholder="Search NAICS by code or description: 541512, software, engineering, IT services..."
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
              {naicsSearch && (
                <p className="mt-3 text-sm text-slate-600">
                  Found <span className="font-bold text-orange-600">{filteredNaics.length}</span> matching codes
                </p>
              )}
            </div>

            {/* Selected Codes */}
            {(prefs.naicsCodes || []).length > 0 && (
              <div className="mb-5 pb-5 border-b border-slate-200">
                <p className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">
                  ✓ Selected ({prefs.naicsCodes!.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {(prefs.naicsCodes || []).map(code => {
                    const codeObj = NAICS_CODES.find(c => c.code === code)
                    return (
                      <button
                        key={code}
                        onClick={() =>
                          updatePrefs({
                            naicsCodes: (prefs.naicsCodes || []).filter(c => c !== code),
                          })
                        }
                        className="inline-flex items-center gap-2 rounded-lg bg-orange-100 border-2 border-orange-400 px-3 py-2 text-sm font-bold text-orange-700 hover:bg-orange-200 transition-all group"
                        title={codeObj?.title}
                      >
                        <span>{code}</span>
                        <X className="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Filtered List - Grid Layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[750px] overflow-y-auto pr-4">
              {filteredNaics.length === 0 ? (
                <div className="col-span-full py-12 text-center">
                  <Search className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-semibold">No codes found for "{naicsSearch}"</p>
                  <p className="text-slate-400 text-sm mt-1">Try: Computer, Software, Engineering, or Services</p>
                </div>
              ) : (
                filteredNaics.map(code => {
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
                      className={`text-left p-4 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-orange-500 bg-orange-600 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-orange-300 hover:bg-orange-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`font-bold ${isSelected ? 'text-white' : 'text-slate-900'}`}>{code.code}</p>
                            {isSelected && <Check className="h-4 w-4 text-white shrink-0" />}
                          </div>
                          <p className={`font-semibold text-sm mt-1 ${isSelected ? 'text-orange-100' : 'text-slate-800'}`}>{code.title}</p>
                          {code.description && (
                            <p className={`text-xs mt-2 line-clamp-2 ${isSelected ? 'text-orange-200' : 'text-slate-600'}`}>{code.description}</p>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </section>

          {/* States and Contract Size */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* States */}
            <section>
              <h2 className="text-xl font-black text-blue-600 mb-4">Geographic Focus</h2>
              <div className="mb-5 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => updatePrefs({ states: DEFAULT_STATES })}
                  className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 text-sm"
                >
                  Select all states
                </button>
                <button
                  type="button"
                  onClick={() => updatePrefs({ states: [] })}
                  className="rounded-lg border-2 border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold px-4 py-2 text-sm"
                >
                  Clear states
                </button>
                <span className="text-sm font-bold text-slate-700">Selected: {selectedStates.length}</span>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {US_STATES.slice(1).map(state => {
                  const isSelected = selectedStates.includes(state.value)
                  return (
                    <button
                      key={state.value}
                      onClick={() => toggleState(state.value)}
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
              <h2 className="text-xl font-black text-green-600 mb-4">Contract Size Range</h2>
              <button
                type="button"
                onClick={() => updatePrefs({ contractSizeMin: undefined, contractSizeMax: undefined })}
                className="mb-4 rounded-lg border-2 border-green-300 bg-green-50 hover:bg-green-100 text-green-800 font-bold px-4 py-2 text-sm"
              >
                Any contract size
              </button>
              <div className="space-y-3">
                {CONTRACT_SIZES.map(size => {
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
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-8 border-t border-slate-200">
            <button
              type="button"
              onClick={async () => {
                if (saveTimeoutRef.current) {
                  clearTimeout(saveTimeoutRef.current)
                  saveTimeoutRef.current = null
                }
                setSaving(true)
                try {
                  await persistPrefs(prefs)
                  router.push('/dashboard')
                } catch (err) {
                  console.error('Failed to save before leaving personalization:', err)
                } finally {
                  setSaving(false)
                }
              }}
              className="px-8 py-3 rounded-lg border-2 border-slate-400 text-slate-700 font-black hover:bg-slate-100 transition-colors"
            >
              Save and go back
            </button>
            <button
              type="button"
              onClick={finalizeAndContinue}
              className="inline-flex items-center gap-3 px-8 py-3 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white font-black hover:shadow-lg transition-all hover:-translate-y-0.5"
            >
              Continue to dashboard <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
