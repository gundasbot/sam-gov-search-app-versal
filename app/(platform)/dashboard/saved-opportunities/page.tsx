'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { Heart, Calendar, ExternalLink, Loader2, Search } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import WorkspaceNavRow from '@/components/WorkspaceNavRow'

type SavedOpportunityItem = {
  id: string
  notice_id: string
  title?: string
  department?: string
  solicitation_number?: string
  naics_code?: string
  response_deadline?: string
  posted_date?: string
  ui_link?: string
  set_aside?: string
  created_at?: string
}

function formatDate(v?: string) {
  if (!v) return 'N/A'
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return 'N/A'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function businessDaysLeft(v?: string) {
  if (!v) return null
  const deadline = new Date(v)
  if (Number.isNaN(deadline.getTime())) return null

  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const end = new Date(deadline.getFullYear(), deadline.getMonth(), deadline.getDate())
  if (end < start) return -1

  let count = 0
  const cursor = new Date(start)
  while (cursor < end) {
    cursor.setDate(cursor.getDate() + 1)
    const day = cursor.getDay()
    if (day !== 0 && day !== 6) count += 1
  }
  return count
}

function SavedOpportunitiesContent() {
    // Pill filter state: '', 'all', 'deadlines', 'dueSoon'
    const [pillFilter, setPillFilter] = useState<'all' | 'deadlines' | 'dueSoon'>('all');
  const searchParams = useSearchParams()
  const selectedNoticeId = searchParams?.get('noticeId') || ''
  const [activeNaics, setActiveNaics] = useState('')
  const [activeSetAside, setActiveSetAside] = useState('')
  const [activeSolicitation, setActiveSolicitation] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<SavedOpportunityItem[]>([])

  useEffect(() => {
    let active = true
    setLoading(true)
    fetch('/api/saved-opportunities', { cache: 'no-store' })
      .then(async r => {
        if (!r.ok) {
          const data = await r.json().catch(() => ({}))
          throw new Error(data?.error || `Server error ${r.status}`)
        }
        return r.json()
      })
      .then(data => {
        if (!active) return
        setItems((data.savedOpportunities ?? []) as SavedOpportunityItem[])
      })
      .catch((err) => {
        if (!active) return
        setError(`Unable to load saved opportunities: ${err?.message || 'Unknown error'}`)
      })
      .finally(() => {
        if (!active) return
        setLoading(false)
      })
    return () => { active = false }
  }, [])


  // Filtering logic for pills
  const visibleItems = useMemo(() => {
    if (pillFilter === 'all') {
      return items;
    } else if (pillFilter === 'deadlines') {
      return items.filter(item => {
        const left = businessDaysLeft(item.response_deadline);
        return typeof left === 'number' && left >= 0;
      });
    } else if (pillFilter === 'dueSoon') {
      return items.filter(item => {
        const left = businessDaysLeft(item.response_deadline);
        return typeof left === 'number' && left >= 0 && left <= 7;
      });
    }
    return items;
  }, [items, pillFilter]);

  const filteredItems = useMemo(() => {
    return visibleItems.filter(item => {
      if (activeNaics && item.naics_code !== activeNaics) return false;
      if (activeSetAside && item.set_aside !== activeSetAside) return false;
      if (activeSolicitation && item.solicitation_number !== activeSolicitation) return false;
      return true;
    });
  }, [visibleItems, activeNaics, activeSetAside, activeSolicitation]);

  const sortedItems = useMemo(() => {
    if (!selectedNoticeId) return filteredItems
    return [...filteredItems].sort((a, b) => {
      const am = a.notice_id === selectedNoticeId ? 1 : 0
      const bm = b.notice_id === selectedNoticeId ? 1 : 0
      return bm - am
    })
  }, [filteredItems, selectedNoticeId])

  // Multicolored pills and filtered counts (always from all items)
  const summary = useMemo(() => {
    const withDeadlines = items.filter(item => {
      const left = businessDaysLeft(item.response_deadline)
      return typeof left === 'number' && left >= 0
    })
    const dueSoon = withDeadlines.filter(item => {
      const left = businessDaysLeft(item.response_deadline)
      return typeof left === 'number' && left <= 7
    })
    return {
      total: items.length,
      deadlines: withDeadlines.length,
      dueSoon: dueSoon.length,
    }
  }, [items])

  return (
    <main className="min-h-screen" style={{ background: 'var(--color-surface)', color: 'var(--color-text-primary)' }}>
      <div className="max-w-480 mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
        <section className="pt-6 mb-6">
          <WorkspaceNavRow active="saved-opportunities" count={items.length} />
        </section>

        {(activeNaics || activeSetAside || activeSolicitation) && (
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2">
            <span className="text-sm font-bold text-emerald-900">Active Filters:</span>
            {activeNaics && (
              <button
                type="button"
                onClick={() => setActiveNaics('')}
                className="px-2.5 py-1 rounded bg-blue-100 text-blue-800 text-sm font-bold hover:bg-blue-200"
              >
                NAICS {activeNaics} ×
              </button>
            )}
            {activeSetAside && (
              <button
                type="button"
                onClick={() => setActiveSetAside('')}
                className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-800 text-sm font-bold hover:bg-emerald-200"
              >
                {activeSetAside} ×
              </button>
            )}
            {activeSolicitation && (
              <button
                type="button"
                onClick={() => setActiveSolicitation('')}
                className="px-2.5 py-1 rounded bg-slate-200 text-slate-800 text-sm font-bold hover:bg-slate-300"
              >
                {activeSolicitation} ×
              </button>
            )}
            <button
              type="button"
              onClick={() => { setActiveNaics(''); setActiveSetAside(''); setActiveSolicitation('') }}
              className="ml-auto px-2.5 py-1 rounded bg-rose-100 text-rose-800 text-sm font-bold hover:bg-rose-200"
            >
              Clear All
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <button
            type="button"
            className={`rounded-xl bg-blue-600 p-4 shadow-sm focus:outline-none transition-all text-white! cursor-pointer ${pillFilter === 'all' ? 'ring-2 ring-blue-400' : ''}`}
            onClick={() => setPillFilter('all')}
            aria-pressed={pillFilter === 'all'}
            style={{ cursor: 'pointer' }}
          >
            <p className="text-sm font-bold uppercase text-white!">Saved Total</p>
            <p className="text-4xl font-black mt-1 text-white!">{summary.total}</p>
          </button>
          <button
            type="button"
            className={`rounded-xl bg-emerald-600 p-4 shadow-sm focus:outline-none transition-all text-white! cursor-pointer ${pillFilter === 'deadlines' ? 'ring-2 ring-emerald-400' : ''}`}
            onClick={() => setPillFilter('deadlines')}
            aria-pressed={pillFilter === 'deadlines'}
            style={{ cursor: 'pointer' }}
          >
            <p className="text-sm font-bold uppercase text-white!">Active Deadlines</p>
            <p className="text-4xl font-black mt-1 text-white!">{summary.deadlines}</p>
          </button>
          <button
            type="button"
            className={`rounded-xl bg-orange-600 p-4 shadow-sm focus:outline-none transition-all text-white! cursor-pointer ${pillFilter === 'dueSoon' ? 'ring-2 ring-orange-400' : ''}`}
            onClick={() => setPillFilter('dueSoon')}
            aria-pressed={pillFilter === 'dueSoon'}
            style={{ cursor: 'pointer' }}
          >
            <p className="text-sm font-bold uppercase text-white!">Due in 7 Days</p>
            <p className="text-4xl font-black mt-1 text-white!">{summary.dueSoon}</p>
          </button>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200">
            <h2 className="text-base font-black text-slate-800 uppercase tracking-wide">Opportunity Details</h2>
          </div>

          {loading && (
            <div className="p-8 flex items-center justify-center gap-2 text-slate-600 font-semibold">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading saved opportunities...
            </div>
          )}

          {!loading && error && (
            <div className="p-6 text-sm font-semibold text-rose-700">{error}</div>
          )}

          {!loading && !error && sortedItems.length === 0 && (
            <div className="p-8 flex flex-col items-center text-center gap-3">
              {activeNaics || activeSetAside || activeSolicitation ? (
                <p className="text-sm text-slate-600">No opportunities match your active filters. Clear them to view all favorites.</p>
              ) : (
                <>
                  <Heart className="w-10 h-10 text-rose-300" />
                  <p className="text-base font-bold text-slate-700">No favorites yet</p>
                  <p className="text-sm text-slate-500 max-w-sm">Click the <Heart className="inline w-3.5 h-3.5 text-rose-400" /> Favorite button on any search result to save solicitations here.</p>
                  <a href="/search" className="mt-2 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all hover:opacity-90" style={{ background: '#166534' }}>
                    <Search className="w-4 h-4" /> Browse opportunities
                  </a>
                </>
              )}
            </div>
          )}

          {!loading && !error && sortedItems.length > 0 && (
            <div className="divide-y divide-slate-200">
              {sortedItems.map((item, index) => {
                const left = businessDaysLeft(item.response_deadline)
                const dueLabel = left === null ? 'No deadline' : left < 0 ? 'Expired' : `${left} business days left`
                const dueColor = left === null ? 'text-slate-700' : left < 0 ? 'text-rose-600' : left <= 7 ? 'text-orange-600' : 'text-emerald-700'
                const isSelected = selectedNoticeId && item.notice_id === selectedNoticeId

                return (
                  <div key={item.id || item.notice_id} className={`p-4 ${isSelected ? 'bg-amber-50/50' : ''}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-black uppercase tracking-wider text-blue-700 mb-0.5">Opportunity #{index + 1}</p>
                        <p className="text-lg font-extrabold text-slate-900 leading-snug">{item.title || 'Untitled opportunity'}</p>
                        <p className="text-base text-slate-700 mt-0.5">{item.department || 'Agency unavailable'}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                          {item.naics_code && (
                            <button
                              type="button"
                              onClick={() => setActiveNaics(prev => prev === item.naics_code ? '' : (item.naics_code || ''))}
                              className={`px-2 py-0.5 rounded font-bold transition-colors ${activeNaics === item.naics_code ? 'bg-blue-700 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
                            >
                              NAICS {item.naics_code}
                            </button>
                          )}
                          {item.set_aside && (
                            <button
                              type="button"
                              onClick={() => setActiveSetAside(prev => prev === item.set_aside ? '' : (item.set_aside || ''))}
                              className={`px-2 py-0.5 rounded font-bold transition-colors ${activeSetAside === item.set_aside ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                            >
                              {item.set_aside}
                            </button>
                          )}
                          {item.solicitation_number && (
                            <button
                              type="button"
                              onClick={() => setActiveSolicitation(prev => prev === item.solicitation_number ? '' : (item.solicitation_number || ''))}
                              className={`px-2 py-0.5 rounded font-semibold transition-colors ${activeSolicitation === item.solicitation_number ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                            >
                              {item.solicitation_number}
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-base font-black ${dueColor}`}>{dueLabel}</p>
                        <p className="text-sm text-slate-700 mt-0.5">Due: {formatDate(item.response_deadline)}</p>
                        <p className="text-sm text-slate-700">Posted: {formatDate(item.posted_date)}</p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <a
                        href={item.ui_link || `https://sam.gov/opp/${item.notice_id}/view`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600 text-white text-sm font-bold hover:bg-orange-700"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> View on SAM.gov
                      </a>
                      <span className="inline-flex items-center gap-1 text-sm text-slate-700">
                        <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" /> Favorited {formatDate(item.created_at)}
                      </span>
                      <span className="inline-flex items-center gap-1 text-sm text-slate-700">
                        <Calendar className="w-3.5 h-3.5" /> Notice ID: {item.notice_id}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}

export default function SavedOpportunitiesPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-green-100 flex items-center justify-center">
          <div className="inline-flex items-center gap-2 text-slate-700 font-semibold">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading saved opportunities...
          </div>
        </main>
      }
    >
      <SavedOpportunitiesContent />
    </Suspense>
  )
}
