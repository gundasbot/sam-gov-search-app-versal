'use client'

import Link from 'next/link'
import { Suspense, useMemo, useState } from 'react'
import { Bell, Bookmark, Clock, Plus, Search } from 'lucide-react'

type AlertFrequency = 'REAL_TIME' | 'DAILY' | 'WEEKLY'

type Subscription = {
  id: string
  name: string
  active: boolean
  frequency: AlertFrequency
  matchesCount: number
  lastRun?: string
}

type SavedSearch = {
  id: string
  name: string
  keywords: string
  updatedAt: string
}

const INITIAL_SUBSCRIPTIONS: Subscription[] = [
  {
    id: 'a1',
    name: 'Cybersecurity - VA - SDVOSB',
    active: true,
    frequency: 'DAILY',
    matchesCount: 4,
    lastRun: '2026-02-26T10:00:00.000Z',
  },
  {
    id: 'a2',
    name: 'Cloud Services - DHS',
    active: false,
    frequency: 'WEEKLY',
    matchesCount: 0,
    lastRun: '2026-02-24T12:00:00.000Z',
  },
]

const INITIAL_SEARCHES: SavedSearch[] = [
  {
    id: 's1',
    name: 'IT Modernization',
    keywords: 'cloud migration devsecops',
    updatedAt: '2026-02-26T09:00:00.000Z',
  },
  {
    id: 's2',
    name: 'Data Analytics',
    keywords: 'data engineering BI',
    updatedAt: '2026-02-25T08:00:00.000Z',
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
  const [activeTab, setActiveTab] = useState<'alerts' | 'searches'>('alerts')
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(INITIAL_SUBSCRIPTIONS)
  const [searches] = useState<SavedSearch[]>(INITIAL_SEARCHES)

  const activeCount = useMemo(() => subscriptions.filter(s => s.active).length, [subscriptions])

  function toggleSubscription(id: string) {
    setSubscriptions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s))
    )
  }

  return (
    <div className="pg-alerts-modern min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Alert Manager</h1>
            <p className="mt-1 text-slate-400">Manage alert subscriptions and saved searches.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/search" className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold hover:bg-slate-800">
              <Search className="h-4 w-4" /> New Search
            </Link>
            <button className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold hover:bg-emerald-500">
              <Plus className="h-4 w-4" /> Create Alert
            </button>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Subscriptions</p>
            <p className="mt-2 text-2xl font-bold">{subscriptions.length}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Active</p>
            <p className="mt-2 text-2xl font-bold text-emerald-400">{activeCount}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Saved Searches</p>
            <p className="mt-2 text-2xl font-bold">{searches.length}</p>
          </div>
        </div>

        <div className="mb-4 inline-flex rounded-xl border border-slate-800 bg-slate-900 p-1">
          <button
            onClick={() => setActiveTab('alerts')}
            className={clsx(
              'rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
              activeTab === 'alerts' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            )}
          >
            Alerts ({subscriptions.length})
          </button>
          <button
            onClick={() => setActiveTab('searches')}
            className={clsx(
              'rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
              activeTab === 'searches' ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            )}
          >
            Saved Searches ({searches.length})
          </button>
        </div>

        {activeTab === 'alerts' ? (
          <div className="space-y-3">
            {subscriptions.length === 0 ? (
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-10 text-center text-slate-400">
                No alert subscriptions yet.
              </div>
            ) : (
              subscriptions.map((alert) => (
                <div key={alert.id} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{alert.name}</p>
                      <div className="mt-1 flex items-center gap-3 text-sm text-slate-400">
                        <span className="inline-flex items-center gap-1"><Bell className="h-3.5 w-3.5" /> {alert.frequency}</span>
                        <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {formatRelative(alert.lastRun)}</span>
                        <span>{alert.matchesCount} matches</span>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleSubscription(alert.id)}
                      className={clsx(
                        'rounded-lg px-3 py-1.5 text-xs font-bold',
                        alert.active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-300'
                      )}
                    >
                      {alert.active ? 'Active' : 'Paused'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {searches.length === 0 ? (
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-10 text-center text-slate-400">
                No saved searches yet.
              </div>
            ) : (
              searches.map((search) => (
                <div key={search.id} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold inline-flex items-center gap-2"><Bookmark className="h-4 w-4 text-cyan-400" /> {search.name}</p>
                      <p className="mt-1 text-sm text-slate-400">{search.keywords}</p>
                    </div>
                    <div className="text-sm text-slate-400">Updated {formatRelative(search.updatedAt)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function AlertsPage() {
  return (
    <Suspense
      fallback={
        <div className="pg-alerts-modern min-h-screen bg-slate-950 flex items-center justify-center">
          <div className="h-7 w-7 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
        </div>
      }
    >
      <AlertsHub />
    </Suspense>
  )
}
