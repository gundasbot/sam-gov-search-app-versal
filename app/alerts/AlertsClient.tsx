'use client'
import Link from 'next/link'
import { BellRing, Bookmark, Plus, Clock, Mail, CheckCircle2, ArrowRight, LogIn, Lock } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { getPersonalizedGreeting, getTimeOfDayEmoji } from '@/lib/greeting'

interface SavedSearch {
  id: string
  name: string
  createdAt: string
  params?: Record<string, any>
}

interface AlertSubscription {
  id: string
  name: string
  frequency: string
  isActive: boolean
  lastSentAt?: string
}

// Mock data shown ONLY to unauthenticated visitors as a preview
const MOCK_SEARCHES: SavedSearch[] = [
  {
    id: 'mock-1',
    name: 'SDVOSB IT Services - Virginia',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    params: { typeOfSetAside: 'SDVOSBC', state: 'VA', keyword: 'IT services' }
  },
  {
    id: 'mock-2',
    name: 'Cybersecurity Contracts - All Federal',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    params: { keyword: 'cybersecurity', ncode: '541512' }
  },
  {
    id: 'mock-3',
    name: 'Data Analytics - DoD Only',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    params: { keyword: 'data analytics', deptname: 'Defense' }
  }
]

const MOCK_ALERTS: AlertSubscription[] = [
  { id: 'mock-1', name: 'Daily SDVOSB Opportunities',    frequency: 'DAILY',      isActive: true,  lastSentAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'mock-2', name: 'Weekly Cybersecurity Digest',   frequency: 'WEEKLY',     isActive: true,  lastSentAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'mock-3', name: 'Real-time High-Value Contracts', frequency: 'AS_CHANGES', isActive: false, lastSentAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
]

const SET_ASIDE_LABELS: Record<string, string> = {
  SDVOSBC: 'SDVOSB', WOSB: 'WOSB', EDWOSB: 'EDWOSB', 'SBA': 'SBA Set-Aside',
  '8A': '8(a)', HZC: 'HUBZone', SBP: 'Small Business', VSB: 'VOSB',
  ISBEE: 'IEE', BPA: 'BPA Call', RES: 'Reservation', HS3: 'HUBZone + SDVOSB',
}
const PARAM_KEY_LABELS: Record<string, string> = {
  keyword: 'Keyword', typeOfSetAside: 'Set-Aside', state: 'State',
  ncode: 'NAICS code', deptname: 'Agency', psc: 'PSC code', noticeType: 'Type',
}
function getPillLabel(key: string, value: string): string {
  if (key === 'typeOfSetAside') return SET_ASIDE_LABELS[value] ?? value
  if (key === 'ncode') return `NAICS ${value}`
  if (key === 'psc') return `PSC ${value}`
  return value
}

export default function AlertsClient() {
  const { data: session, status: sessionStatus } = useSession()
  const isAuthenticated = sessionStatus === 'authenticated'
  const isLoading       = sessionStatus === 'loading'

  // Debug session info
  useEffect(() => {
    console.log('Session status:', {
      status: sessionStatus,
      isAuthenticated,
      isLoading,
      hasUserData: !!session?.user,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      userName: session?.user?.name,
    })
  }, [sessionStatus, session, isAuthenticated, isLoading])

  const [stats, setStats]               = useState({ searches: 0, active: 0, paused: 0 })
  const [recentSearches, setRecentSearches] = useState<SavedSearch[]>([])
  const [recentSubs, setRecentSubs]     = useState<AlertSubscription[]>([])
  const [dataLoading, setDataLoading]   = useState(false)
  const [dataLoaded, setDataLoaded]     = useState(false)

  // Only fetch real data when authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      console.log('Not authenticated, skipping data load')
      return
    }

    setDataLoading(true)

    // Fetch both APIs and handle errors properly
    Promise.all([
      fetch('/api/saved-searches')
        .then(r => {
          if (!r.ok) {
            console.error('Saved searches API error:', r.status, r.statusText)
            return []
          }
          return r.json()
        })
        .catch(err => {
          console.error('Saved searches fetch error:', err)
          return []
        }),
      fetch('/api/alert-subscriptions')
        .then(r => {
          if (!r.ok) {
            console.error('Alert subscriptions API error:', r.status, r.statusText)
            return []
          }
          return r.json()
        })
        .catch(err => {
          console.error('Alert subscriptions fetch error:', err)
          return []
        })
    ]).then(([searches, subs]) => {
      console.log('Raw API responses:', { searches, subs })

      // Handle saved-searches response: { success: true, searches: [...] }
      const searchesArray = Array.isArray(searches)
        ? searches
        : (Array.isArray((searches as any)?.searches) ? (searches as any).searches : [])

      // Handle alert-subscriptions response: [...]
      const subsArray = Array.isArray(subs) ? subs : []

      console.log('Parsed arrays:', {
        searchesCount: searchesArray.length,
        subsCount: subsArray.length,
        searchesArray,
        subsArray
      })

      setStats({
        searches: searchesArray.length,
        active: subsArray.filter((s: any) => s.isActive).length,
        paused: subsArray.filter((s: any) => !s.isActive).length,
      })
      setRecentSearches(searchesArray.slice(0, 3))
      setRecentSubs(subsArray.slice(0, 3))
      setDataLoaded(true)
      setDataLoading(false)
    }).catch(err => {
      console.error('Error loading data:', err)
      setDataLoaded(true)
      setDataLoading(false)
    })
  }, [isAuthenticated])

  // Stats to display — mock for guests, real for auth'd users
  const displayStats = isAuthenticated
    ? stats
    : { searches: MOCK_SEARCHES.length, active: MOCK_ALERTS.filter(a => a.isActive).length, paused: MOCK_ALERTS.filter(a => !a.isActive).length }

  const displaySearches = isAuthenticated ? recentSearches : MOCK_SEARCHES
  const displaySubs     = isAuthenticated ? recentSubs     : MOCK_ALERTS

  const bg = 'linear-gradient(135deg, #0f172a 0%, #1a2332 25%, #1f2937 50%, #1a1f2e 75%, #0f172a 100%)'

  return (
    <div style={{ background: bg }} className="min-h-screen">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-12 py-6 sm:py-8">

        {/* Hero with Action Buttons */}
        <div className="mb-4 flex items-center justify-between gap-8 flex-wrap">
          {/* Left Button */}
          {isAuthenticated && !dataLoading && (
            <Link
              href="/alerts/manage-searches"
              className="px-6 py-3 bg-gradient-to-r from-teal-600 to-teal-500 text-white font-black rounded-xl hover:from-teal-700 hover:to-teal-600 flex items-center gap-3 shadow-lg hover:shadow-xl transition-all transform hover:scale-105 text-sm"
            >
              <Bookmark className="w-4 h-4" />
              <div className="text-left">
                <div>Manage Searches</div>
                <div className="text-xs font-normal opacity-90">{displayStats.searches} saved</div>
              </div>
            </Link>
          )}

          {/* Center Hero Text */}
          <div className="text-center flex-1 min-w-xs">
            <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">
              {isAuthenticated && session?.user?.name ? (
                <>
                  <span className="text-2xl sm:text-3xl mr-2">{getTimeOfDayEmoji()}</span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-orange-400">
                    {getPersonalizedGreeting(session?.user?.name)}
                  </span>
                </>
              ) : (
                <>
                  Never Miss a Federal{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-orange-400">
                    Opportunity
                  </span>
                </>
              )}
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Save searches and create alerts to stay ahead of the competition. Get notified instantly when contracts matching your criteria are posted.
            </p>
          </div>

          {/* Right Button */}
          {isAuthenticated && !dataLoading && (
            <Link
              href="/alerts/manage-alerts"
              className="px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-500 text-white font-black rounded-xl hover:from-orange-700 hover:to-orange-600 flex items-center gap-3 shadow-lg hover:shadow-xl transition-all transform hover:scale-105 text-sm"
            >
              <BellRing className="w-4 h-4" />
              <div className="text-left">
                <div>Manage Alerts</div>
                <div className="text-xs font-normal opacity-90">{displayStats.active} active</div>
              </div>
            </Link>
          )}
        </div>

        {/* ── UNAUTHENTICATED: Sign-in callout banner ─────────────────── */}
        {!isAuthenticated && !isLoading && (
          <div className="mb-4 p-4 bg-gradient-to-r from-teal-900/40 to-orange-900/30 border border-teal-600/50 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-600/30 rounded-lg shrink-0">
                <Lock className="w-4 h-4 text-teal-400" />
              </div>
              <div>
                <p className="text-white font-bold">You're viewing sample data</p>
                <p className="text-slate-300 text-xs mt-0.5">
                  Sign in to see your own saved searches and alerts.
                </p>
              </div>
            </div>
            <Link
              href="/login"
              className="shrink-0 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-lg flex items-center gap-2 transition-all shadow-lg hover:shadow-teal-500/25 whitespace-nowrap text-sm"
            >
              <LogIn className="w-3 h-3" />
              Sign In
            </Link>
          </div>
        )}

        {/* ── AUTHENTICATED, loading ───────────────────────────────────── */}
        {isAuthenticated && dataLoading && (
          <div className="mb-4 flex items-center justify-center gap-3 text-slate-400">
            <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-medium">Loading your data…</span>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-3 mb-4">
          <Link href="/alerts/manage-searches" className="bg-gradient-to-br from-slate-800/80 to-slate-800/40 border border-slate-700 rounded-xl p-6 text-center backdrop-blur-sm hover:border-teal-500/60 hover:shadow-lg hover:shadow-teal-500/10 transition-all relative overflow-hidden block group">
            {!isAuthenticated && <div className="absolute inset-0 backdrop-blur-[2px] bg-slate-900/30 rounded-xl z-10 flex items-center justify-center"><Lock className="w-5 h-5 text-slate-500" /></div>}
            <Bookmark className="w-8 h-8 mx-auto mb-3 text-teal-400 group-hover:scale-110 transition-transform" />
            <p className="text-4xl font-black text-white mb-2">{displayStats.searches}</p>
            <p className="text-slate-400 font-bold">Saved Searches</p>
            <p className="text-teal-500/70 text-xs mt-2 font-medium group-hover:text-teal-400 transition-colors">Run anytime on-demand →</p>
          </Link>
          <Link href="/alerts/manage-alerts" className="bg-gradient-to-br from-slate-800/80 to-slate-800/40 border border-slate-700 rounded-xl p-6 text-center backdrop-blur-sm hover:border-orange-500/60 hover:shadow-lg hover:shadow-orange-500/10 transition-all relative overflow-hidden block group">
            {!isAuthenticated && <div className="absolute inset-0 backdrop-blur-[2px] bg-slate-900/30 rounded-xl z-10 flex items-center justify-center"><Lock className="w-5 h-5 text-slate-500" /></div>}
            <BellRing className="w-8 h-8 mx-auto mb-3 text-orange-400 group-hover:scale-110 transition-transform" />
            <p className="text-4xl font-black text-orange-400 mb-2">{displayStats.active}</p>
            <p className="text-slate-400 font-bold">Active Alerts</p>
            <p className="text-orange-500/70 text-xs mt-2 font-medium group-hover:text-orange-400 transition-colors">Automated email delivery →</p>
          </Link>
          <Link href="/alerts/manage-alerts" className="bg-gradient-to-br from-slate-800/80 to-slate-800/40 border border-slate-700 rounded-xl p-6 text-center backdrop-blur-sm hover:border-slate-500/60 hover:shadow-lg transition-all relative overflow-hidden block group">
            {!isAuthenticated && <div className="absolute inset-0 backdrop-blur-[2px] bg-slate-900/30 rounded-xl z-10 flex items-center justify-center"><Lock className="w-5 h-5 text-slate-500" /></div>}
            <Clock className="w-8 h-8 mx-auto mb-3 text-slate-400 group-hover:scale-110 transition-transform" />
            <p className="text-4xl font-black text-slate-400 mb-2">{displayStats.paused}</p>
            <p className="text-slate-400 font-bold">Paused Alerts</p>
            <p className="text-slate-500/70 text-xs mt-2 font-medium group-hover:text-slate-400 transition-colors">Temporarily disabled →</p>
          </Link>
        </div>

        {/* ── AUTHENTICATED + EMPTY: Prompt to create first items ─────── */}
        {isAuthenticated && dataLoaded && recentSearches.length === 0 && recentSubs.length === 0 && (
          <div className="text-center py-12 bg-slate-800/30 border border-slate-700 rounded-2xl mb-8">
            <BellRing className="w-16 h-16 mx-auto mb-5 opacity-30 text-orange-400" />
            <h2 className="text-2xl font-black text-white mb-3">You're all set up — time to create your first alert</h2>
            <p className="text-slate-400 mb-8 max-w-lg mx-auto">
              Search for federal contracts, save your criteria, and get automatic email notifications when new matches are posted.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/search" className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-2 transition-colors shadow-lg">
                <Plus className="w-4 h-4" /> Start with a Search
              </Link>
              <Link href="/alerts/manage-searches" className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl flex items-center gap-2 transition-colors">
                <Bookmark className="w-4 h-4" /> Create Saved Search
              </Link>
              <Link href="/alerts/manage-alerts?new=1" className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl flex items-center gap-2 transition-colors">
                <BellRing className="w-4 h-4" /> Create Alert
              </Link>
            </div>
          </div>
        )}

        {/* ── Saved Searches + Alert Subscriptions side by side ───────── */}
        {(displaySearches.length > 0 || displaySubs.length > 0) && (
          <div className="grid lg:grid-cols-2 gap-1 mb-8">

            {/* Left column — Recent Saved Searches */}
            {displaySearches.length > 0 && (
              <div className="flex flex-col bg-gradient-to-br from-teal-900/10 to-transparent border-l-4 border-teal-600/50 rounded-l-xl pl-4 pr-4 py-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-black text-white flex items-center gap-3">
                    <Bookmark className="w-6 h-6 text-teal-400" />
                    {isAuthenticated ? 'Recent Saved Searches' : 'Example Saved Searches'}
                  </h2>
                  {isAuthenticated && (
                    <Link href="/alerts/manage-searches" className="px-3 py-1.5 bg-teal-600/15 border border-teal-600/40 text-teal-300 hover:bg-teal-600/30 hover:border-teal-500/60 rounded-lg text-sm font-bold flex items-center gap-1.5 transition-all">
                      View All <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
                <div className="flex flex-col gap-3 flex-1">
                  {displaySearches.map(s => (
                    <div key={s.id} className={`bg-slate-800/50 border border-slate-700 rounded-xl p-4 transition-all hover:shadow-lg relative ${isAuthenticated ? 'hover:border-teal-500/50' : 'opacity-75'}`}>
                      {!isAuthenticated && (
                        <div className="absolute inset-0 rounded-xl z-10 flex items-end p-4">
                          <div className="w-full px-3 py-2 bg-slate-900/80 backdrop-blur-sm border border-teal-600/40 rounded-lg flex items-center justify-between">
                            <span className="text-teal-400 text-xs font-bold">Sign in to see your searches</span>
                            <Link href="/login" className="text-xs text-white bg-teal-600 hover:bg-teal-500 px-2.5 py-1 rounded-lg font-bold transition-colors">Sign In</Link>
                          </div>
                        </div>
                      )}
                      <div className="flex items-start gap-3 mb-2">
                        <Bookmark className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-bold text-sm truncate">{s.name}</p>
                          <p className="text-slate-500 text-xs">Created {new Date(s.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      {s.params && Object.keys(s.params).length > 0 && (
                        <div className="mb-2 flex flex-wrap gap-1">
                          {Object.entries(s.params).filter(([, v]) => v).slice(0, 4).map(([k, v], idx) => {
                            const label = getPillLabel(k, String(v))
                            const keyLabel = PARAM_KEY_LABELS[k] ?? k
                            if (isAuthenticated) {
                              return (
                                <Link
                                  key={idx}
                                  href={`/search?${k}=${encodeURIComponent(String(v))}`}
                                  title={`Filter by ${keyLabel}: ${label}`}
                                  className="text-xs px-2 py-0.5 bg-teal-900/30 text-teal-300 border border-teal-700/40 rounded hover:bg-teal-800/50 hover:border-teal-500/60 hover:text-teal-200 transition-all"
                                >
                                  {label}
                                </Link>
                              )
                            }
                            return (
                              <span key={idx} className="text-xs px-2 py-0.5 bg-slate-700/50 text-slate-400 rounded">{label}</span>
                            )
                          })}
                        </div>
                      )}
                      {isAuthenticated && (
                        <Link href="/alerts/manage-searches" className="mt-1 inline-flex items-center gap-1 px-2.5 py-1 bg-teal-600/15 border border-teal-600/40 text-teal-300 hover:bg-teal-600/30 hover:border-teal-500/60 rounded-md text-xs font-bold transition-all">
                          View Details <ArrowRight className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Right column — Active Alert Subscriptions */}
            {displaySubs.length > 0 && (
              <div className="flex flex-col bg-gradient-to-br from-orange-900/10 to-transparent border-r-4 border-orange-600/50 rounded-r-xl pr-4 pl-4 py-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-black text-white flex items-center gap-3">
                    <BellRing className="w-6 h-6 text-orange-400" />
                    {isAuthenticated ? 'Active Alert Subscriptions' : 'Example Alerts'}
                  </h2>
                  {isAuthenticated && (
                    <Link href="/alerts/manage-alerts" className="px-3 py-1.5 bg-orange-600/15 border border-orange-600/40 text-orange-300 hover:bg-orange-600/30 hover:border-orange-500/60 rounded-lg text-sm font-bold flex items-center gap-1.5 transition-all">
                      View All <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
                <div className="flex flex-col gap-3 flex-1">
                  {displaySubs.map(s => (
                    <div key={s.id} className={`bg-slate-800/50 border border-slate-700 rounded-xl p-4 transition-all hover:shadow-lg relative ${isAuthenticated ? 'hover:border-orange-500/50' : 'opacity-75'}`}>
                      {!isAuthenticated && (
                        <div className="absolute inset-0 rounded-xl z-10 flex items-end p-4">
                          <div className="w-full px-3 py-2 bg-slate-900/80 backdrop-blur-sm border border-orange-600/40 rounded-lg flex items-center justify-between">
                            <span className="text-orange-400 text-xs font-bold">Sign in to manage alerts</span>
                            <Link href="/login" className="text-xs text-white bg-orange-600 hover:bg-orange-500 px-2.5 py-1 rounded-lg font-bold transition-colors">Sign In</Link>
                          </div>
                        </div>
                      )}
                      <div className="flex items-start gap-3 mb-2">
                        <BellRing className={`w-4 h-4 shrink-0 mt-0.5 ${s.isActive ? 'text-orange-400' : 'text-slate-500'}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-white font-bold text-sm truncate">{s.name}</p>
                            {s.isActive && <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />}
                          </div>
                          <p className="text-slate-500 text-xs">{s.frequency} · {s.isActive ? 'Active' : 'Paused'}</p>
                        </div>
                      </div>
                      {s.lastSentAt && (
                        <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
                          <Mail className="w-3 h-3" />
                          Last sent {new Date(s.lastSentAt).toLocaleDateString()}
                        </div>
                      )}
                      {isAuthenticated && (
                        <Link href="/alerts/manage-alerts" className="mt-1 inline-flex items-center gap-1 px-2.5 py-1 bg-orange-600/15 border border-orange-600/40 text-orange-300 hover:bg-orange-600/30 hover:border-orange-500/60 rounded-md text-xs font-bold transition-all">
                          Manage Alert <ArrowRight className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

        {/* ── How It Works Workflow ──────────────────────────────────── */}
        <div className="mt-4 mb-4 bg-gradient-to-br from-slate-800/60 to-slate-800/20 border border-slate-700 rounded-xl p-5">
          <h2 className="text-2xl font-black text-white mb-1 text-center">How It All Works Together</h2>
          <p className="text-slate-300 text-center mb-4 max-w-2xl mx-auto text-sm">Three pages that work together</p>

          <div className="grid md:grid-cols-3 gap-4">
            {/* Step 1: Saved Searches */}
            <div className="relative">
              <div className="bg-gradient-to-br from-teal-900/30 to-slate-800/40 border border-teal-700/40 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-teal-600 text-white font-black flex items-center justify-center text-sm">1</div>
                  <h3 className="text-sm font-black text-teal-300">Saved Searches</h3>
                </div>
                <Bookmark className="w-6 h-6 text-teal-400 mb-2" />
                <p className="text-slate-300 font-medium mb-2 text-xs">Build & save your filters</p>
                <ul className="space-y-1 text-slate-400 text-xs">
                  <li className="flex items-start gap-1"><span className="text-teal-400 font-bold">•</span><span>Define criteria & run on-demand</span></li>
                  <li className="flex items-start gap-1"><span className="text-teal-400 font-bold">•</span><span>Export results anytime</span></li>
                </ul>
              </div>
            </div>

            {/* Step 2: Manage Alerts */}
            <div className="relative">
              <div className="bg-gradient-to-br from-emerald-900/30 to-slate-800/40 border border-emerald-700/40 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center text-sm">2</div>
                  <h3 className="text-sm font-black text-emerald-300">Manage Alerts</h3>
                </div>
                <BellRing className="w-6 h-6 text-emerald-400 mb-2" />
                <p className="text-slate-300 font-medium mb-2 text-xs">Automate delivery</p>
                <ul className="space-y-1 text-slate-400 text-xs">
                  <li className="flex items-start gap-1"><span className="text-emerald-400 font-bold">•</span><span>Convert to automated alerts</span></li>
                  <li className="flex items-start gap-1"><span className="text-emerald-400 font-bold">•</span><span>Choose frequency & time</span></li>
                </ul>
              </div>
            </div>

            {/* Step 3: Manage Contacts */}
            <div>
              <div className="bg-gradient-to-br from-orange-900/30 to-slate-800/40 border border-orange-700/40 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-orange-600 text-white font-black flex items-center justify-center text-sm">3</div>
                  <h3 className="text-sm font-black text-orange-300">Manage Contacts</h3>
                </div>
                <Mail className="w-6 h-6 text-orange-400 mb-2" />
                <p className="text-slate-300 font-medium mb-2 text-xs">Add recipients</p>
                <ul className="space-y-1 text-slate-400 text-xs">
                  <li className="flex items-start gap-1"><span className="text-orange-400 font-bold">•</span><span>Manage email list</span></li>
                  <li className="flex items-start gap-1"><span className="text-orange-400 font-bold">•</span><span>Reuse across alerts</span></li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Highlights — always visible */}
        <div className="mt-4 grid md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-teal-900/20 to-slate-800/40 border border-teal-700/50 rounded-xl p-4">
            <Bookmark className="w-6 h-6 text-teal-400 mb-2" />
            <h3 className="text-lg font-black text-white mb-2">Perfect For</h3>
            <ul className="space-y-1 text-slate-300 text-xs">
              <li className="flex items-start gap-2"><CheckCircle2 className="w-3 h-3 text-teal-400 mt-0.5 shrink-0" /><span>Regular bid searches with complex criteria</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-3 h-3 text-teal-400 mt-0.5 shrink-0" /><span>Testing filters before automation</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-3 h-3 text-teal-400 mt-0.5 shrink-0" /><span>Ad-hoc reporting & exports</span></li>
            </ul>
          </div>
          <div className="bg-gradient-to-br from-orange-900/20 to-slate-800/40 border border-orange-700/50 rounded-xl p-4">
            <BellRing className="w-6 h-6 text-orange-400 mb-2" />
            <h3 className="text-lg font-black text-white mb-2">Key Benefits</h3>
            <ul className="space-y-1 text-slate-300 text-xs">
              <li className="flex items-start gap-2"><CheckCircle2 className="w-3 h-3 text-orange-400 mt-0.5 shrink-0" /><span>Never miss opportunities — automated delivery</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-3 h-3 text-orange-400 mt-0.5 shrink-0" /><span>Save time on repetitive searches</span></li>
              <li className="flex items-start gap-2"><CheckCircle2 className="w-3 h-3 text-orange-400 mt-0.5 shrink-0" /><span>Customize by frequency & recipient</span></li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  )
}
