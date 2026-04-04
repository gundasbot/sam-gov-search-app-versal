'use client'

import Link from 'next/link'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { ArrowRight, Bell, Bookmark, CheckCircle2, Clock, Loader2, Lock, Plus, Search, Trash2 } from 'lucide-react'

type AlertFrequency = 'REAL_TIME' | 'DAILY' | 'WEEKLY' | 'MONTHLY'

type Subscription = {
  id: string
  name: string
  active: boolean
  frequency: AlertFrequency
  matchesCount: number
  lastRun?: string
  subscription_enabled?: boolean
}

type SavedSearch = {
  id: string
  name: string
  keywords: string
  updated_at: string
  subscription_enabled?: boolean
  frequency?: AlertFrequency
}

const GUEST_SEARCHES: SavedSearch[] = [
  {
    id: 'guest-1',
    name: 'SDVOSB IT Services - Mid Atlantic',
    keywords: 'SDVOSB, IT services, cybersecurity, Virginia, Maryland, D.C.',
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    subscription_enabled: true,
    frequency: 'DAILY',
  },
  {
    id: 'guest-2',
    name: 'Base Operations and Facilities Support',
    keywords: 'facilities support, maintenance, grounds, federal',
    updated_at: new Date(Date.now() - 27 * 60 * 60 * 1000).toISOString(),
    subscription_enabled: false,
  },
  {
    id: 'guest-3',
    name: 'Professional Services - Set Aside',
    keywords: 'professional services, WOSB, HUBZone, consulting',
    updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    subscription_enabled: true,
    frequency: 'WEEKLY',
  },
]

function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ')
}

function formatRelative(dateIso?: string): string {
  if (!dateIso) return 'Never'
  const dt = new Date(dateIso)
  if (Number.isNaN(dt.getTime())) return 'Never'
  const mins = Math.floor((Date.now() - dt.getTime()) / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function AlertsHub() {
  const [activeTab, setActiveTab]     = useState<'alerts' | 'searches'>('alerts')
  const [alertFilter, setAlertFilter] = useState<'all' | 'active'>('all')
  const [searches, setSearches]       = useState<SavedSearch[]>([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [deleting, setDeleting]       = useState<string | null>(null)
  const [guestMode, setGuestMode]     = useState(false)

  // Derive subscriptions from searches that have subscription_enabled
  const subscriptions: Subscription[] = useMemo(() =>
    searches
      .filter(s => s.subscription_enabled)
      .map(s => ({
        id:         s.id,
        name:       s.name,
        active:     true,
        frequency:  (s.frequency as AlertFrequency) || 'DAILY',
        matchesCount: 0,
        lastRun:    s.updated_at,
      })),
    [searches]
  )

  const activeCount = useMemo(() => subscriptions.filter(s => s.active).length, [subscriptions])

  const visibleSubscriptions = useMemo(
    () => alertFilter === 'active' ? subscriptions.filter(s => s.active) : subscriptions,
    [alertFilter, subscriptions]
  )

  const marketingPoints = [
    'Save targeted searches for agencies, NAICS codes, keywords, states, and set-asides.',
    'Turn strong searches into automated alerts so matching bids reach you without re-running filters.',
    'Use alert schedules to monitor high-priority contract pipelines daily or weekly.',
  ]

  // Fetch saved searches from API
  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        setError(null)
        setGuestMode(false)
        const res = await fetch('/api/saved-searches')
        if (!res.ok) {
          if (res.status === 401) {
            setGuestMode(true)
            setSearches(GUEST_SEARCHES)
            return
          }
          throw new Error(`Failed to load: ${res.status}`)
        }
        const data = await res.json()
        setSearches(data.searches || [])
      } catch (e: any) {
        setError(e.message || 'Failed to load saved searches')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function deleteSearch(id: string) {
    if (!confirm('Delete this saved search?')) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/saved-searches/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      setSearches(prev => prev.filter(s => s.id !== id))
    } catch (e: any) {
      alert(e.message || 'Failed to delete')
    } finally {
      setDeleting(null)
    }
  }

  const summaryCardClass = (isActive: boolean, accent: 'emerald' | 'cyan' = 'emerald') =>
    clsx(
      'rounded-xl border p-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
      accent === 'emerald' ? 'focus-visible:outline-emerald-400' : 'focus-visible:outline-cyan-400',
      isActive
        ? accent === 'emerald'
          ? 'bg-gradient-to-br from-emerald-600/25 to-emerald-500/10 border-emerald-400 text-white shadow-lg shadow-emerald-500/20'
          : 'bg-gradient-to-br from-cyan-600/25 to-cyan-500/10 border-cyan-400 text-white shadow-lg shadow-cyan-500/20'
        : 'bg-slate-900 border-slate-800 text-slate-100 hover:border-emerald-400/60'
    )

  return (
    <div className="pg-alerts-modern min-h-screen" style={{ background: 'var(--color-surface)', color: 'var(--color-text-primary)' }}>
      <div className="pg-container py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Alert Manager</h1>
            <p className="mt-1 text-slate-400">Build saved searches, automate alerts, and stay ahead of new government opportunities.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/search"
              className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors"
              style={{
                borderColor: '#334155',
                background: 'rgba(15, 23, 42, 0.72)',
                color: '#e2e8f0',
              }}
            >
              <Search className="h-4 w-4" /> New Search
            </Link>
            <Link
              href="/alerts/manage-searches"
              className="inline-flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(255,122,24,0.25)] transition-transform hover:scale-[1.02]"
              style={{ background: 'linear-gradient(135deg, #ff7a18, #ffb347)' }}
            >
              <Bookmark className="h-4 w-4" /> Manage Saved Searches
            </Link>
            <Link
              href="/alerts/manage-alerts"
              className="inline-flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(0,178,169,0.25)] transition-transform hover:scale-[1.02]"
              style={{ background: 'linear-gradient(135deg, #00bfa6, #4ef7d8)' }}
            >
              <Bell className="h-4 w-4" /> Manage Alert Subscriptions
            </Link>
            <Link
              href="/search"
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold hover:bg-emerald-500"
            >
              <Plus className="h-4 w-4" /> Create Alert
            </Link>
          </div>
        </div>

        {guestMode && !loading && !error && (
          <div className="alerts-dark-surface mb-8 overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 shadow-[0_24px_80px_rgba(15,23,42,0.28)]">
            <div className="grid gap-0 lg:grid-cols-[1.25fr_0.95fr]">
              <div className="p-6 sm:p-8 lg:p-10" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #10243a 42%, #0f172a 100%)' }}>
                <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-orange-400/30 bg-orange-500/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-orange-300">
                  <Lock className="h-3.5 w-3.5" />
                  Alerts and Searches Workspace
                </p>
                <h2 className="max-w-4xl text-3xl font-black leading-tight text-white sm:text-4xl lg:text-5xl">
                  Save the right searches. Automate the right alerts. Move faster on contract opportunities.
                </h2>
                <p className="mt-4 max-w-3xl text-base font-medium leading-7 text-slate-300 sm:text-lg">
                  This page is where contractors turn repetitive search work into a repeatable pipeline. Save your most valuable filters, monitor matched opportunities, and keep your team aligned on the bids worth pursuing.
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  {marketingPoints.map((point) => (
                    <div key={point} className="rounded-2xl border border-slate-700 bg-white/4 p-4">
                      <CheckCircle2 className="mb-3 h-5 w-5 text-emerald-400" />
                      <p className="text-sm font-semibold leading-6 text-slate-200">{point}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-6 sm:p-8 lg:p-10" style={{ background: 'linear-gradient(160deg, rgba(249,115,22,0.14) 0%, rgba(6,182,212,0.08) 48%, rgba(15,23,42,1) 100%)' }}>
                <div className="rounded-3xl border border-slate-700 bg-slate-950/80 p-6">
                  <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-300">Why Sign In or Start a Trial</p>
                  <h3 className="mt-3 text-2xl font-black text-white">Unlock your personal alert pipeline</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    Sign in to manage your existing searches and alert subscriptions. New users can start a free trial to save searches, enable alert delivery, and build a bid pipeline around the work they actually pursue.
                  </p>
                  <div className="mt-5 space-y-3 text-sm text-slate-200">
                    <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4">
                      <p className="font-black text-emerald-300">Start a free trial</p>
                      <p className="mt-1 text-slate-300">Activate saved searches, automated alerts, and a faster daily contract review workflow.</p>
                    </div>
                    <div className="rounded-2xl border border-cyan-500/25 bg-cyan-500/10 p-4">
                      <p className="font-black text-cyan-300">Sign in</p>
                      <p className="mt-1 text-slate-300">Pick up where you left off, review matched opportunities, and refine your subscriptions.</p>
                    </div>
                  </div>
                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <Link
                      href="/signup"
                      className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-black text-white shadow-[0_16px_40px_rgba(249,115,22,0.28)] transition-transform hover:scale-[1.02]"
                      style={{ background: 'linear-gradient(135deg, #f97316, #fb923c)' }}
                    >
                      Start Free Trial
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                    <Link
                      href="/login"
                      className="inline-flex items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-black transition-colors"
                      style={{ borderColor: 'rgba(148,163,184,0.45)', background: 'rgba(241,245,249,0.96)', color: '#0f172a' }}
                    >
                      Sign In
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading / error */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
            <span className="ml-2 text-slate-400">Loading your searches...</span>
          </div>
        )}
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300 mb-6">{error}</div>
        )}

        {!loading && !error && (
          <>
            {/* Summary cards */}
            <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <button type="button" onClick={() => { setActiveTab('alerts'); setAlertFilter('all') }}
                className={summaryCardClass(activeTab === 'alerts' && alertFilter === 'all', 'emerald')}>
                <p className={clsx('text-xs uppercase tracking-wide', activeTab === 'alerts' && alertFilter === 'all' ? 'text-white/80' : 'text-slate-400')}>Subscriptions</p>
                <p className={clsx('mt-2 text-2xl font-bold', activeTab === 'alerts' && alertFilter === 'all' ? 'text-white' : 'text-slate-100')}>{subscriptions.length}</p>
              </button>

              <button type="button" onClick={() => { setActiveTab('alerts'); setAlertFilter('active') }}
                className={summaryCardClass(activeTab === 'alerts' && alertFilter === 'active', 'emerald')}>
                <p className={clsx('text-xs uppercase tracking-wide', activeTab === 'alerts' && alertFilter === 'active' ? 'text-white/80' : 'text-slate-400')}>Active</p>
                <p className={clsx('mt-2 text-2xl font-bold', activeTab === 'alerts' && alertFilter === 'active' ? 'text-white' : 'text-emerald-400')}>{activeCount}</p>
              </button>

              <button type="button" onClick={() => { setActiveTab('searches'); setAlertFilter('all') }}
                className={summaryCardClass(activeTab === 'searches', 'cyan')}>
                <p className={clsx('text-xs uppercase tracking-wide', activeTab === 'searches' ? 'text-white/80' : 'text-slate-400')}>Saved Searches</p>
                <p className={clsx('mt-2 text-2xl font-bold', activeTab === 'searches' ? 'text-white' : 'text-slate-100')}>{searches.length}</p>
              </button>
            </div>

            {guestMode && (
              <div className="alerts-dark-surface mb-6 rounded-2xl border border-slate-800 bg-slate-950 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h3 className="text-lg font-black text-white">What you can do on Alerts & Searches</h3>
                    <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-400">
                      Save recurring searches, activate delivery schedules, and keep your team focused on contract notices that match your capabilities, geography, and set-aside strategy.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link href="/search" className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors" style={{ borderColor: 'rgba(148,163,184,0.4)', background: 'rgba(241,245,249,0.96)', color: '#0f172a' }}>
                      <Search className="h-4 w-4" /> Explore Search
                    </Link>
                    <Link href="/signup" className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-4 py-2 text-sm font-black text-white hover:bg-orange-400">
                      Start Free Trial
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Tab switcher */}
            <div className="mb-4 inline-flex rounded-xl border border-slate-800 bg-slate-900 p-1">
              <button onClick={() => { setActiveTab('alerts'); setAlertFilter('all') }}
                className={clsx('rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
                  activeTab === 'alerts' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800')}>
                Alerts ({subscriptions.length})
              </button>
              <button onClick={() => { setActiveTab('searches'); setAlertFilter('all') }}
                className={clsx('rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
                  activeTab === 'searches' ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:bg-slate-800')}>
                Saved Searches ({searches.length})
              </button>
            </div>

            {/* Alerts tab */}
            {activeTab === 'alerts' ? (
              <div className="space-y-3">
                {visibleSubscriptions.length === 0 ? (
                  <div className="rounded-xl border border-slate-800 bg-slate-900 p-10 text-center text-slate-400">
                    {alertFilter === 'active' ? 'No active alert subscriptions.' : (
                      <div>
                        <p className="mb-3">{guestMode ? 'Example alert workflow preview.' : 'No alert subscriptions yet.'}</p>
                        <Link href={guestMode ? '/signup' : '/search'} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500">
                          <Search className="h-4 w-4" /> {guestMode ? 'Start a free trial to create alerts' : 'Save a search with alerts enabled'}
                        </Link>
                      </div>
                    )}
                  </div>
                ) : (
                  visibleSubscriptions.map((alert) => (
                    <div key={alert.id} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold">{alert.name}</p>
                          <div className="mt-1 flex items-center gap-3 text-sm text-slate-400">
                            <span className="inline-flex items-center gap-1"><Bell className="h-3.5 w-3.5" /> {alert.frequency}</span>
                            <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {formatRelative(alert.lastRun)}</span>
                          </div>
                        </div>
                        <span className="rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-bold text-emerald-300">Active</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              /* Saved searches tab */
              <div className="space-y-3">
                {searches.length === 0 ? (
                  <div className="rounded-xl border border-slate-800 bg-slate-900 p-10 text-center text-slate-400">
                    <p className="mb-3">{guestMode ? 'Example saved searches preview.' : 'No saved searches yet.'}</p>
                    <Link href={guestMode ? '/signup' : '/search'} className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-500">
                      <Search className="h-4 w-4" /> {guestMode ? 'Start a free trial to save searches' : 'Run a search and save it'}
                    </Link>
                  </div>
                ) : (
                  searches.map((search) => (
                    <div key={search.id} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold inline-flex items-center gap-2">
                            <Bookmark className="h-4 w-4 shrink-0 text-cyan-400" />
                            {search.name}
                          </p>
                          {search.keywords && (
                            <p className="mt-1 text-sm text-slate-400 truncate">{search.keywords}</p>
                          )}
                          {search.subscription_enabled && (
                            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-300">
                              <Bell className="h-3 w-3" /> {search.frequency || 'DAILY'} alerts
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-sm text-slate-400">Updated {formatRelative(search.updated_at)}</div>
                          <button
                            onClick={() => deleteSearch(search.id)}
                            disabled={deleting === search.id}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-red-500/20 hover:text-red-400 transition disabled:opacity-50"
                            title="Delete saved search"
                          >
                            {deleting === search.id
                              ? <Loader2 className="h-4 w-4 animate-spin" />
                              : <Trash2 className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function AlertsPage() {
  return (
    <>
      <Suspense fallback={
        <div className="pg-alerts-modern min-h-screen bg-slate-950 flex items-center justify-center">
          <div className="h-7 w-7 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
        </div>
      }>
        <AlertsHub />
      </Suspense>
      <style jsx global>{`
        .pg-alerts-modern .alerts-dark-surface h2,
        .pg-alerts-modern .alerts-dark-surface h3,
        .pg-alerts-modern .alerts-dark-surface .text-white,
        .pg-alerts-modern .alerts-dark-surface [class*="text-white/"] {
          color: #ffffff !important;
        }

        .pg-alerts-modern .alerts-dark-surface p,
        .pg-alerts-modern .alerts-dark-surface .text-slate-200,
        .pg-alerts-modern .alerts-dark-surface .text-slate-300 {
          color: rgba(226, 232, 240, 0.88) !important;
        }

        .pg-alerts-modern .alerts-dark-surface .text-slate-400,
        .pg-alerts-modern .alerts-dark-surface .text-slate-500 {
          color: rgba(203, 213, 225, 0.78) !important;
        }

        .pg-alerts-modern .alerts-dark-surface .border-slate-700,
        .pg-alerts-modern .alerts-dark-surface .border-slate-800 {
          border-color: rgba(148, 163, 184, 0.28) !important;
        }
      `}</style>
    </>
  )
}
