'use client'

import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  Search, Loader2, ChevronDown, Plus, X, Check,
  Target, Zap, Building2, MapPin, DollarSign, Tag,
  Clock, Lightbulb, ArrowRight, AlertCircle
} from 'lucide-react'
import { NAICS_CODES } from '@/lib/naics-codes'
import { SET_ASIDE_CODES, US_STATES } from '@/lib/sam-gov-constants'

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
  completedPersonalization: boolean
}

const CONTRACT_SIZES = [
  { label: 'Under $250K', min: 0, max: 250000 },
  { label: '$250K - $1M', min: 250000, max: 1000000 },
  { label: '$1M - $5M', min: 1000000, max: 5000000 },
  { label: '$5M - $25M', min: 5000000, max: 25000000 },
  { label: '$25M+', min: 25000000, max: undefined },
]

export default function FeedPersonalizationPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { greeting, emoji } = getGreeting()

  const [prefs, setPrefs] = useState<Partial<UserPreferences>>({
    setAsides: [],
    naicsCodes: [],
    keywords: [],
    states: [],
  })

  const [naicsSearch, setNaicsSearch] = useState('')
  const [keywordInput, setKeywordInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login?callbackUrl=/dashboard/feed-personalization')
    }
  }, [status, router])

  // Load preferences
  useEffect(() => {
    const loadPrefs = async () => {
      try {
        const res = await fetch('/api/account/preferences', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          setPrefs({
            setAsides: data.setAsides || [],
            naicsCodes: data.naicsCodes || [],
            keywords: data.keywords || [],
            states: data.states || [],
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

  // Auto-save with debounce
  const autoSave = useCallback((updatedPrefs: Partial<UserPreferences>) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)

    setSaving(true)
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await fetch('/api/account/preferences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedPrefs),
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

  // Filter NAICS codes
  const filteredNaics = useMemo(() => {
    if (!naicsSearch.trim()) return NAICS_CODES.slice(0, 20)
    const q = naicsSearch.toLowerCase()
    return NAICS_CODES.filter(
      code =>
        code.code.includes(q) ||
        code.title.toLowerCase().includes(q) ||
        code.description?.toLowerCase().includes(q)
    ).slice(0, 20)
  }, [naicsSearch])

  // Add keyword
  const addKeyword = (kw: string) => {
    const normalized = kw.trim().toLowerCase()
    if (normalized && !(prefs.keywords || []).includes(normalized)) {
      updatePrefs({
        keywords: [...(prefs.keywords || []), normalized],
      })
      setKeywordInput('')
    }
  }

  // Handle Enter key for keyword input
  const handleKeywordKeydown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addKeyword(keywordInput)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-orange-500" />
          <p className="mt-4 text-slate-600">Loading your preferences...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm font-semibold text-orange-400 uppercase tracking-wider">{greeting}, {firstName(session)}</p>
              <h1 className="text-4xl sm:text-5xl font-black text-white mt-2 flex items-center gap-3">
                <span>{emoji}</span>
                Personalize Your Feed
              </h1>
              <p className="text-lg text-slate-300 mt-4 max-w-2xl leading-relaxed">
                Tell us what types of opportunities match your business. We'll create an accurate pipeline of contracts tailored to your expertise and preferences.
              </p>
            </div>
            <div className="text-4xl">🎯</div>
          </div>

          {/* Status indicator */}
          <div className="mt-6 flex items-center gap-2">
            {saved ? (
              <div className="inline-flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm font-semibold text-green-700">
                <Check className="h-4 w-4" />
                Saved
              </div>
            ) : saving ? (
              <div className="inline-flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-700">
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          {/* Set-Asides Section */}
          <section className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-b border-slate-200 px-6 py-4">
              <div className="flex items-center gap-3">
                <Zap className="h-5 w-5 text-orange-600" />
                <h2 className="text-lg font-bold text-slate-900">Business Classification</h2>
              </div>
              <p className="text-sm text-slate-600 mt-1">Select the types of contracts your business specializes in</p>
            </div>

            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {SET_ASIDE_CODES.map(code => {
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
                    className={`group relative rounded-xl border-2 p-4 text-left transition-all ${
                      isSelected
                        ? 'border-orange-400 bg-orange-50 shadow-md'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 text-sm">{code.label}</p>
                        <p className="text-xs text-slate-600 mt-1 line-clamp-1">{code.value}</p>
                      </div>
                      {isSelected && <Check className="h-5 w-5 text-orange-600 flex-shrink-0" />}
                    </div>
                  </button>
                )
              })}
            </div>
          </section>

          {/* NAICS Codes Section */}
          <section className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="bg-gradient-to-r from-violet-50 to-purple-50 border-b border-slate-200 px-6 py-4">
              <div className="flex items-center gap-3">
                <Target className="h-5 w-5 text-violet-600" />
                <h2 className="text-lg font-bold text-slate-900">Industry Classification (NAICS)</h2>
              </div>
              <p className="text-sm text-slate-600 mt-1">Search and select industries relevant to your business</p>
            </div>

            <div className="p-6">
              {/* Search Input */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by code (e.g., 541512) or description (e.g., Computer Systems Design)..."
                  value={naicsSearch}
                  onChange={e => setNaicsSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-slate-200 focus:border-violet-400 focus:outline-none transition-colors bg-white"
                />
              </div>

              {/* Selected Codes */}
              {(prefs.naicsCodes || []).length > 0 && (
                <div className="mb-4 p-4 bg-violet-50 rounded-lg border border-violet-200">
                  <p className="text-xs font-semibold text-violet-900 uppercase tracking-wider mb-3">
                    Selected ({prefs.naicsCodes!.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(prefs.naicsCodes || []).map(code => {
                      const naics = NAICS_CODES.find(n => n.code === code)
                      return (
                        <button
                          key={code}
                          onClick={() =>
                            updatePrefs({
                              naicsCodes: (prefs.naicsCodes || []).filter(c => c !== code),
                            })
                          }
                          className="inline-flex items-center gap-2 rounded-lg bg-white border-2 border-violet-300 px-3 py-2 text-sm font-semibold text-violet-700 hover:bg-violet-100 transition-colors"
                        >
                          <span>{code}</span>
                          <X className="h-4 w-4" />
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Filtered List */}
              <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
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
                      className={`text-left p-3 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-violet-400 bg-violet-50'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-900 text-sm">{code.code}</p>
                          <p className="text-sm text-slate-700 mt-0.5">{code.title}</p>
                          {code.description && (
                            <p className="text-xs text-slate-500 mt-1">{code.description}</p>
                          )}
                        </div>
                        {isSelected && <Check className="h-5 w-5 text-violet-600 flex-shrink-0 mt-1" />}
                      </div>
                    </button>
                  )
                })}
              </div>

              {filteredNaics.length === 0 && naicsSearch.trim() && (
                <div className="text-center py-8 text-slate-500">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No NAICS codes found matching "{naicsSearch}"</p>
                </div>
              )}
            </div>
          </section>

          {/* Geographic & Contract Size */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* States */}
            <section className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-slate-200 px-6 py-4">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  <h2 className="text-lg font-bold text-slate-900">Geographic Focus</h2>
                </div>
                <p className="text-sm text-slate-600 mt-1">Select states where you have capacity or are building presence</p>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-3 gap-2">
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
                        className={`rounded-lg border-2 px-3 py-2 text-sm font-semibold transition-all ${
                          isSelected
                            ? 'border-blue-400 bg-blue-50 text-blue-700'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {state.value}
                      </button>
                    )
                  })}
                </div>
              </div>
            </section>

            {/* Contract Size */}
            <section className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-slate-200 px-6 py-4">
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <h2 className="text-lg font-bold text-slate-900">Contract Size Preference</h2>
                </div>
                <p className="text-sm text-slate-600 mt-1">Focus on opportunities matching your capacity</p>
              </div>

              <div className="p-6 space-y-2">
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
                      className={`w-full rounded-lg border-2 px-4 py-3 text-left font-semibold transition-all ${
                        isSelected
                          ? 'border-green-400 bg-green-50 text-green-700'
                          : 'border-slate-200 bg-white text-slate-900 hover:border-slate-300'
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
          <div className="flex justify-between items-center pt-4">
            <Link
              href="/dashboard"
              className="px-6 py-3 rounded-lg border-2 border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition-colors"
            >
              Skip for now
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold hover:shadow-lg transition-all"
            >
              Continue to dashboard <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
