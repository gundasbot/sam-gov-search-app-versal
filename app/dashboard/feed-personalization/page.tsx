'use client'

import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  Search, Loader2, X, Check, ArrowRight
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
    if (!naicsSearch.trim()) return NAICS_CODES.slice(0, 25)
    const q = naicsSearch.toLowerCase()
    return NAICS_CODES.filter(
      code =>
        code.code.includes(q) ||
        code.title.toLowerCase().includes(q) ||
        code.description?.toLowerCase().includes(q)
    ).slice(0, 25)
  }, [naicsSearch])

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-orange-500" />
          <p className="mt-4 text-slate-600">Loading your preferences...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white py-8 sm:py-10 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-orange-400 text-sm font-bold uppercase tracking-wide">{greeting}, {firstName(session)}</p>
          <h1 className="text-4xl sm:text-5xl font-black mt-2 flex items-center gap-3">
            <span>{emoji}</span>
            Personalize Your Opportunities Feed
          </h1>
          <p className="text-xl text-slate-300 mt-3 max-w-2xl leading-relaxed">
            Tell us about your business. We'll create a tailored pipeline of federal contracts that match your expertise.
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="space-y-10">

          {/* Set-Asides Section */}
          <section>
            <div className="mb-8">
              <h2 className="text-3xl font-black text-slate-900">Business Classification</h2>
              <p className="text-lg text-slate-600 mt-2">What types of set-asides does your business qualify for?</p>
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
                    className={`relative rounded-xl border-2 p-5 text-left transition-all font-semibold text-lg ${
                      isSelected
                        ? 'border-orange-400 bg-gradient-to-br from-orange-50 to-amber-50 text-orange-900 shadow-lg'
                        : 'border-slate-300 bg-white text-slate-900 hover:border-orange-300 hover:bg-orange-50/30 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold">{code.label}</p>
                        <p className="text-sm text-slate-600 mt-1">{code.value}</p>
                      </div>
                      {isSelected && <Check className="h-6 w-6 text-orange-600 flex-shrink-0 mt-0.5" />}
                    </div>
                  </button>
                )
              })}
            </div>
          </section>

          {/* NAICS Codes Section */}
          <section>
            <div className="mb-8">
              <h2 className="text-3xl font-black text-slate-900">Industry Classification (NAICS)</h2>
              <p className="text-lg text-slate-600 mt-2">Search for industries that match your business. Type a code, name, or skill.</p>
            </div>

            <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-lg">
              {/* Search Input */}
              <div className="p-6 border-b-2 border-slate-100 bg-gradient-to-br from-slate-50 to-white">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-orange-500 font-bold" />
                  <input
                    type="text"
                    placeholder="Try: 'Computer', '541512', 'Software', 'Engineering'..."
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
                    Found <span className="font-bold text-orange-600">{filteredNaics.length}</span> matching industries
                  </p>
                )}
              </div>

              {/* Selected Codes */}
              {(prefs.naicsCodes || []).length > 0 && (
                <div className="p-6 bg-gradient-to-r from-orange-50 to-amber-50 border-b-2 border-slate-100">
                  <p className="text-sm font-bold text-orange-900 uppercase tracking-wider mb-4">
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
                          className="inline-flex items-center gap-2 rounded-lg bg-white border-2 border-orange-400 px-3 py-2 text-sm font-bold text-orange-700 hover:bg-orange-100 transition-all group"
                          title={codeObj?.title}
                        >
                          <span>{code}</span>
                          <X className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Filtered List */}
              <div className="p-6 space-y-2 max-h-[600px] overflow-y-auto">
                {filteredNaics.length === 0 ? (
                  <div className="py-12 text-center">
                    <Search className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-semibold">No industries found matching "{naicsSearch}"</p>
                    <p className="text-slate-400 text-sm mt-1">Try searching for: Computer, Engineering, Consulting, Software...</p>
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
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                          isSelected
                            ? 'border-orange-400 bg-gradient-to-r from-orange-50 to-amber-50 shadow-md'
                            : 'border-slate-200 hover:border-orange-300 hover:bg-orange-50/40 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-slate-900 text-base">{code.code}</p>
                              {isSelected && <Check className="h-5 w-5 text-orange-600 flex-shrink-0" />}
                            </div>
                            <p className="text-slate-800 font-semibold mt-1">{code.title}</p>
                            {code.description && (
                              <p className="text-sm text-slate-600 mt-1.5 line-clamp-2">{code.description}</p>
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          </section>

          {/* States and Contract Size */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* States */}
            <section>
              <h2 className="text-3xl font-black text-slate-900 mb-8">Geographic Focus</h2>
              <div className="grid grid-cols-4 gap-2">
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
                      className={`rounded-lg border-2 px-3 py-2 text-base font-bold transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-500 text-white shadow-lg'
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
              <h2 className="text-3xl font-black text-slate-900 mb-8">Contract Size</h2>
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
                      className={`w-full rounded-lg border-2 px-6 py-4 text-left font-bold text-lg transition-all ${
                        isSelected
                          ? 'border-green-500 bg-green-500 text-white shadow-lg'
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
          <div className="flex justify-between items-center pt-8 border-t-2 border-slate-300">
            <Link
              href="/dashboard"
              className="px-8 py-4 rounded-lg border-2 border-slate-400 text-slate-700 font-black text-lg hover:bg-slate-100 transition-colors"
            >
              Skip for now
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white font-black text-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
            >
              Continue to dashboard <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
