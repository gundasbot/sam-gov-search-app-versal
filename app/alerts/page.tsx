'use client'

import Link from 'next/link'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { Bell, Bookmark, Clock, Loader2, Plus, Search, Trash2 } from 'lucide-react'

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

  // Fetch saved searches from API
  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch('/api/saved-searches')
        if (!res.ok) {
          if (res.status === 401) { setError('Please log in to view your saved searches.'); return }
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
            <p className="mt-1 text-slate-400">Manage alert subscriptions and saved searches.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/search" className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold hover:bg-slate-800">
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
                        <p className="mb-3">No alert subscriptions yet.</p>
                        <Link href="/search" className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500">
                          <Search className="h-4 w-4" /> Save a search with alerts enabled
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
                    <p className="mb-3">No saved searches yet.</p>
                    <Link href="/search" className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-500">
                      <Search className="h-4 w-4" /> Run a search and save it
                    </Link>
                  </div>
                ) : (
                  searches.map((search) => (
                    <div key={search.id} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold inline-flex items-center gap-2">
                            <Bookmark className="h-4 w-4 flex-shrink-0 text-cyan-400" />
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
                        <div className="flex items-center gap-3 flex-shrink-0">
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
    <Suspense fallback={
      <div className="pg-alerts-modern min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="h-7 w-7 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    }>
      <AlertsHub />
    </Suspense>
  )
}
