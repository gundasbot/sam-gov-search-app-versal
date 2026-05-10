'use client'

import Link from 'next/link'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { ArrowRight, Bell, Bookmark, CheckCircle2, Clock, Download, Loader2, Lock, Search, Share2, UserRound, X } from 'lucide-react'

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

type AlertSub = {
  id: string
  name?: string
  frequency?: AlertFrequency
  isActive: boolean
  lastSentAt?: string | null
  createdAt?: string
  lastResultCount?: number
}

type Contact = {
  id: string
  email?: string
  firstName?: string | null
  lastName?: string | null
  name?: string | null
  organization?: string | null
}

type SavedOpportunity = {
  id: string
  notice_id?: string
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

function contactDisplayName(c: Contact): string {
  const full = [c.firstName, c.lastName].filter(Boolean).join(' ').trim()
  return full || c.name || c.email || 'Unnamed contact'
}

function AlertsHub() {
  const [activeTab, setActiveTab]     = useState<'alerts' | 'searches' | 'opps' | 'contacts'>('alerts')
  const [alertFilter, setAlertFilter] = useState<'all' | 'active'>('all')
  const [searches, setSearches]       = useState<SavedSearch[]>([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [guestMode, setGuestMode]     = useState(false)
  const [alertSubs, setAlertSubs]     = useState<AlertSub[]>([])
  const [contacts, setContacts]       = useState<Contact[]>([])
  const [savedOpps, setSavedOpps]     = useState<SavedOpportunity[]>([])
  const [toast, setToast]             = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportSelection, setExportSelection] = useState({
    alerts: true,
    searches: true,
    opportunities: true,
    contacts: true,
  })

  // Derive subscriptions from actual alert_subscriptions rows
  const subscriptions: Subscription[] = useMemo(() =>
    alertSubs.map(a => ({
        id: a.id,
        name: a.name || 'Untitled Alert',
        active: Boolean(a.isActive),
        frequency: (a.frequency as AlertFrequency) || 'DAILY',
        matchesCount: a.lastResultCount ?? 0,
        lastRun: a.lastSentAt || a.createdAt || undefined,
      })),
    [alertSubs]
  )

  const visibleSubscriptions = useMemo(
    () => alertFilter === 'active' ? subscriptions.filter(s => s.active) : subscriptions,
    [alertFilter, subscriptions]
  )

  const marketingPoints = [
    'Save targeted searches for agencies, NAICS codes, keywords, states, and set-asides.',
    'Turn strong searches into automated alerts so matching bids reach you without re-running filters.',
    'Use alert schedules to monitor high-priority contract pipelines daily or weekly.',
  ]

  // Fetch all counts in parallel
  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        setError(null)
        setGuestMode(false)
        const [searchesRes, alertsRes, contactsRes, oppsRes] = await Promise.all([
          fetch('/api/saved-searches'),
          fetch('/api/alert-subscriptions'),
          fetch('/api/address-book'),
          fetch('/api/saved-opportunities'),
        ])
        if (!searchesRes.ok) {
          if (searchesRes.status === 401) {
            setGuestMode(true)
            setSearches(GUEST_SEARCHES)
            return
          }
          throw new Error(`Failed to load: ${searchesRes.status}`)
        }
        const [searchData, alertData, contactData, oppData] = await Promise.all([
          searchesRes.json(),
          alertsRes.ok ? alertsRes.json() : [],
          contactsRes.ok ? contactsRes.json() : [],
          oppsRes.ok ? oppsRes.json() : { savedOpportunities: [] },
        ])
        setSearches(searchData.searches || [])
        setAlertSubs(Array.isArray(alertData) ? alertData : [])
        setContacts(Array.isArray(contactData) ? contactData : [])
        setSavedOpps(Array.isArray(oppData.savedOpportunities) ? oppData.savedOpportunities : [])
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Failed to load saved searches'
        setError(message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type })
    window.setTimeout(() => setToast(null), 2800)
  }

  async function shareText(payload: { title: string; text: string; url?: string }) {
    try {
      if (navigator.share) {
        await navigator.share(payload)
        return
      }
      const copyText = [payload.title, payload.text, payload.url].filter(Boolean).join('\n')
      await navigator.clipboard.writeText(copyText)
      showToast('Share details copied to clipboard.')
    } catch (err) {
      const e = err as { name?: string }
      if (e?.name === 'AbortError') return
      showToast('Could not share this item yet.', 'error')
    }
  }

  function exportSelections(partial: Partial<typeof exportSelection>) {
    setExportSelection(prev => ({ ...prev, ...partial }))
  }

  function exportAll() {
    setExportSelection({
      alerts: true,
      searches: true,
      opportunities: true,
      contacts: true,
    })
  }

  function exportNone() {
    setExportSelection({
      alerts: false,
      searches: false,
      opportunities: false,
      contacts: false,
    })
  }

  function downloadExport() {
    const hasAny = Object.values(exportSelection).some(Boolean)
    if (!hasAny) {
      showToast('Choose at least one section to export.', 'error')
      return
    }

    const payload = {
      exportedAt: new Date().toISOString(),
      alerts: exportSelection.alerts ? alertSubs : [],
      savedSearches: exportSelection.searches ? searches : [],
      savedOpportunities: exportSelection.opportunities ? savedOpps : [],
      contacts: exportSelection.contacts ? contacts : [],
    }

    const fileDate = new Date().toISOString().slice(0, 10)
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `alerts-hub-export-${fileDate}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    setShowExportModal(false)
    showToast('Export downloaded successfully.')
  }

  function downloadAllTabs() {
    const payload = {
      exportedAt: new Date().toISOString(),
      alerts: alertSubs,
      savedSearches: searches,
      savedOpportunities: savedOpps,
      contacts,
    }

    const fileDate = new Date().toISOString().slice(0, 10)
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `alerts-hub-export-all-${fileDate}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    setShowExportModal(false)
    showToast('All tabs downloaded successfully.')
  }

  function shareWorkspaceSummary() {
    shareText({
      title: 'Alerts Hub Summary',
      text: `Saved alerts: ${alertSubs.length}\nSaved searches: ${searches.length}\nSaved opportunities: ${savedOpps.length}\nContacts: ${contacts.length}`,
      url: `${window.location.origin}/alerts`,
    })
  }

  const summaryCardClass = (isActive: boolean, theme: 'alerts' | 'searches' | 'opps' | 'contacts') =>
    clsx(
      'rounded-xl border p-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 shadow-sm hover:shadow-md',
      theme === 'alerts'
        ? 'focus-visible:outline-blue-500'
        : theme === 'searches'
          ? 'focus-visible:outline-orange-500'
          : theme === 'opps'
            ? 'focus-visible:outline-emerald-500'
            : 'focus-visible:outline-cyan-500',
      isActive
        ? theme === 'alerts'
          ? 'bg-blue-600 border-blue-700 text-white'
          : theme === 'searches'
            ? 'bg-orange-500 border-orange-600 text-white'
            : theme === 'opps'
              ? 'bg-emerald-600 border-emerald-700 text-white'
              : 'bg-cyan-600 border-cyan-700 text-white'
        : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400'
    )

  return (
    <div className="pg-alerts-modern min-h-screen" style={{ background: 'var(--color-surface)', color: 'var(--color-text-primary)' }}>
      <div className="pg-container py-8">
        {/* Header */}
        <div className="mb-8">
          <div>
            <h1 className="text-4xl sm:text-5xl font-black">Welcome back to your Alerts, Searches & Opportunities Hub</h1>
            <p className="mt-2 text-white text-lg sm:text-xl">
              You are in the right place to save searches, run and manage alerts, share opportunities, and keep recipient contacts organized in one workflow.
            </p>
          </div>
          <div className="mt-5 grid grid-cols-1 md:grid-cols-4 gap-3">
            <Link
              href="/alerts/manage-searches"
              className="rounded-2xl px-6 py-5 text-left text-white shadow-[0_16px_34px_rgba(255,122,24,0.28)] transition-transform hover:scale-[1.01]"
              style={{ background: 'linear-gradient(135deg, #f97316, #fb923c)' }}
            >
              <div className="flex items-center gap-2 text-xl font-black text-white"><Bookmark className="h-5 w-5" /> Manage Saved Searches</div>
              <p className="mt-2 text-base text-white">Build and tune your search filters by keywords, agencies, NAICS, set-asides, and geography.</p>
            </Link>
            <Link
              href="/alerts/manage-alerts"
              className="rounded-2xl px-6 py-5 text-left text-white shadow-[0_16px_34px_rgba(6,95,70,0.26)] transition-transform hover:scale-[1.01]"
              style={{ background: 'linear-gradient(135deg, #0f766e, #14b8a6)' }}
            >
              <div className="flex items-center gap-2 text-xl font-black text-white"><Bell className="h-5 w-5" /> Manage Saved Alerts</div>
              <p className="mt-2 text-base text-white">Control schedules, recipients, and formats for automated opportunity notifications.</p>
            </Link>
            <Link
              href="/dashboard/saved-opportunities"
              className="rounded-2xl px-6 py-5 text-left text-white shadow-[0_16px_34px_rgba(16,185,129,0.26)] transition-transform hover:scale-[1.01]"
              style={{ background: 'linear-gradient(135deg, #059669, #22c55e)' }}
            >
              <div className="flex items-center gap-2 text-xl font-black text-white"><Search className="h-5 w-5" /> Manage Saved Opportunities</div>
              <p className="mt-2 text-base text-white">Review your tracked opportunities, watch deadlines, and prioritize pursuits faster.</p>
            </Link>
            <Link
              href="/contacts"
              className="rounded-2xl px-6 py-5 text-left text-white shadow-[0_16px_34px_rgba(6,182,212,0.18)] transition-transform hover:scale-[1.01]"
              style={{ background: 'linear-gradient(135deg, #06b6d4, #0891b2)' }}
            >
              <div className="flex items-center gap-2 text-xl font-black text-white"><UserRound className="h-5 w-5" /> Manage Contacts</div>
              <p className="mt-2 text-base text-white">
                {contacts.length > 0 ? `${contacts.length} contact${contacts.length !== 1 ? 's' : ''} in address book.` : 'Centralize and manage alert recipients for your team.'}
              </p>
            </Link>
          </div>



          <div className="mt-4 rounded-2xl border border-cyan-400/20 bg-slate-900/70 p-5">
            <p className="inline-flex items-center rounded-full bg-blue-600 px-3 py-1.5 text-sm uppercase tracking-[0.18em] font-black !text-white">
              Guided Workflow
            </p>
            <p className="mt-3 text-white text-lg leading-relaxed">
              Use this workspace to surface high-relevance opportunities, prioritize changes, and keep your team focused on the bids that matter most. Connect saved searches, managed alerts, and saved opportunities into one operating workflow.
            </p>
            <div className="mt-4 rounded-xl border border-slate-700 bg-slate-800/80 p-4">
              <p className="text-base font-bold text-white">
                Use these quick-view tabs for fast triage, then jump to each dedicated page for full workflows.
              </p>
              <p className="mt-2 text-base text-slate-100">
                On this page, you can preview items, share summaries, download all tabs, and export selected data. For full create/edit/delete and run actions, use the page-level tools.
              </p>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border border-blue-700/60 bg-blue-900/45 p-3">
                <p className="text-sm font-black uppercase tracking-wide text-blue-200">Manage Saved Alerts</p>
                <p className="mt-2 text-base text-white">Create and schedule alerts, set recipients, run now, pause/resume, edit, share, and delete.</p>
              </div>
              <div className="rounded-xl border border-orange-700/60 bg-orange-900/35 p-3">
                <p className="text-sm font-black uppercase tracking-wide text-orange-200">Manage Saved Searches</p>
                <p className="mt-2 text-base text-white">Create and refine searches, run and save filters, convert to alerts, copy/share, and remove old searches.</p>
              </div>
              <div className="rounded-xl border border-emerald-700/60 bg-emerald-900/35 p-3">
                <p className="text-sm font-black uppercase tracking-wide text-emerald-200">Manage Saved Opportunities</p>
                <p className="mt-2 text-base text-white">Review tracked opportunities, watch deadlines, share/export opportunities, and clean up saved lists.</p>
              </div>
              <div className="rounded-xl border border-cyan-700/60 bg-cyan-900/35 p-3">
                <p className="text-sm font-black uppercase tracking-wide text-cyan-200">Manage Contacts</p>
                <p className="mt-2 text-base text-white">Add/edit recipients, organize contacts, separate lead sources, and reuse contacts across alerts/searches/opps.</p>
              </div>
            </div>

          </div>
        </div>

        {toast && (
          <div
            className={clsx(
              'fixed right-5 top-5 z-50 rounded-xl px-4 py-3 text-sm font-bold shadow-xl',
              toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
            )}
          >
            {toast.msg}
          </div>
        )}

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
            <span className="ml-2 text-slate-700">Loading your searches...</span>
          </div>
        )}
        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300 mb-6">{error}</div>
        )}

        {!loading && !error && (
          <>
            {/* Summary cards */}
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <button type="button" onClick={() => { setActiveTab('alerts'); setAlertFilter('all') }}
                className={summaryCardClass(activeTab === 'alerts' && alertFilter === 'all', 'alerts')}>
                <p className={clsx('text-xs uppercase tracking-wide font-bold', activeTab === 'alerts' && alertFilter === 'all' ? '!text-white' : 'text-slate-600')}>Saved Alerts</p>
                <p className={clsx('mt-2 text-2xl font-bold', activeTab === 'alerts' && alertFilter === 'all' ? '!text-white' : 'text-slate-800')}>{alertSubs.length}</p>
              </button>

              <button type="button" onClick={() => { setActiveTab('alerts'); setAlertFilter('active') }}
                className={summaryCardClass(activeTab === 'alerts' && alertFilter === 'active', 'alerts')}>
                <p className={clsx('text-xs uppercase tracking-wide font-bold', activeTab === 'alerts' && alertFilter === 'active' ? '!text-white' : 'text-slate-600')}>Active</p>
                <p className={clsx('mt-2 text-2xl font-bold', activeTab === 'alerts' && alertFilter === 'active' ? '!text-white' : 'text-blue-700')}>{alertSubs.filter(a => a.isActive).length}</p>
              </button>

              <button type="button" onClick={() => { setActiveTab('searches'); setAlertFilter('all') }}
                className={summaryCardClass(activeTab === 'searches', 'searches')}>
                <p className={clsx('text-xs uppercase tracking-wide font-bold', activeTab === 'searches' ? '!text-white' : 'text-slate-600')}>Saved Searches</p>
                <p className={clsx('mt-2 text-2xl font-bold', activeTab === 'searches' ? '!text-white' : 'text-slate-800')}>{searches.length}</p>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('opps')}
                className={summaryCardClass(activeTab === 'opps', 'opps')}
              >
                <p className={clsx('text-xs uppercase tracking-wide font-bold', activeTab === 'opps' ? '!text-white' : 'text-slate-600')}>Saved Opps</p>
                <p className={clsx('mt-2 text-2xl font-bold', activeTab === 'opps' ? '!text-white' : 'text-slate-800')}>{savedOpps.length}</p>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('contacts')}
                className={summaryCardClass(activeTab === 'contacts', 'contacts')}
              >
                <p className={clsx('text-xs uppercase tracking-wide font-bold', activeTab === 'contacts' ? '!text-white' : 'text-slate-600')}>Contacts</p>
                <p className={clsx('mt-2 text-2xl font-bold', activeTab === 'contacts' ? '!text-white' : 'text-slate-800')}>{contacts.length}</p>
              </button>
            </div>

            {guestMode && (
              <div className="alerts-dark-surface mb-6 rounded-2xl border border-slate-800 bg-slate-950 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h3 className="text-lg font-black text-white">What you can do on Alerts & Searches</h3>
                    <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-200">
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

            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex rounded-xl border border-slate-300 bg-white p-1 shadow-sm">
                <button onClick={() => { setActiveTab('alerts'); setAlertFilter('all') }}
                  className={clsx('rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
                    activeTab === 'alerts' ? 'bg-blue-600 !text-white' : 'text-slate-700 hover:bg-slate-100')}>
                  Alerts ({subscriptions.length})
                </button>
                <button onClick={() => { setActiveTab('searches'); setAlertFilter('all') }}
                  className={clsx('rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
                    activeTab === 'searches' ? 'bg-orange-500 !text-white' : 'text-slate-700 hover:bg-slate-100')}>
                  Saved Searches ({searches.length})
                </button>
                <button onClick={() => setActiveTab('opps')}
                  className={clsx('rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
                    activeTab === 'opps' ? 'bg-emerald-600 !text-white' : 'text-slate-700 hover:bg-slate-100')}>
                  Saved Opps ({savedOpps.length})
                </button>
                <button onClick={() => setActiveTab('contacts')}
                  className={clsx('rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
                    activeTab === 'contacts' ? 'bg-cyan-600 !text-white' : 'text-slate-700 hover:bg-slate-100')}>
                  Contacts ({contacts.length})
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={shareWorkspaceSummary}
                  className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-black text-white hover:bg-cyan-700"
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </button>
                <button
                  type="button"
                  onClick={downloadAllTabs}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-black text-white hover:bg-emerald-700"
                >
                  <Download className="h-4 w-4" />
                  Download All
                </button>
                <button
                  type="button"
                  onClick={() => setShowExportModal(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-black text-white hover:bg-blue-700"
                >
                  <Download className="h-4 w-4" />
                  Export
                </button>
              </div>
            </div>

            {/* Alerts quick view */}
            {activeTab === 'alerts' && (
              <div className="space-y-3">
                {visibleSubscriptions.length === 0 ? (
                  <div className="rounded-xl border border-slate-300 bg-white p-10 text-center text-slate-700">
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
                  visibleSubscriptions.map((alert, index) => (
                    <div key={alert.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-black uppercase tracking-wide text-blue-700">Alert #{index + 1}</p>
                          <p className="font-bold text-slate-900 text-lg">{alert.name}</p>
                          <div className="mt-1 flex items-center gap-3 text-sm text-slate-600">
                            <span className="inline-flex items-center gap-1"><Bell className="h-3.5 w-3.5" /> {alert.frequency}</span>
                            <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {formatRelative(alert.lastRun)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={clsx('rounded-lg px-3 py-1.5 text-xs font-bold', alert.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700')}>
                            {alert.active ? 'Active' : 'Paused'}
                          </span>
                          <button
                            type="button"
                            onClick={() => shareText({
                              title: `Alert: ${alert.name}`,
                              text: `Frequency: ${alert.frequency}. Last run ${formatRelative(alert.lastRun)}.`,
                              url: `${window.location.origin}/alerts/manage-alerts`,
                            })}
                            className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700"
                          >
                            <Share2 className="h-3.5 w-3.5" />
                            Share
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Saved searches quick view */}
            {activeTab === 'searches' && (
              <div className="space-y-3">
                {searches.length === 0 ? (
                  <div className="rounded-xl border border-slate-300 bg-white p-10 text-center text-slate-700">
                    <p className="mb-3">{guestMode ? 'Example saved searches preview.' : 'No saved searches yet.'}</p>
                    <Link href={guestMode ? '/signup' : '/search'} className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-500">
                      <Search className="h-4 w-4" /> {guestMode ? 'Start a free trial to save searches' : 'Run a search and save it'}
                    </Link>
                  </div>
                ) : (
                  searches.map((search, index) => (
                    <div key={search.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-black uppercase tracking-wide text-blue-700 mb-0.5">Search #{index + 1}</p>
                          <p className="font-bold inline-flex items-center gap-2 text-slate-900 text-lg">
                            <Bookmark className="h-4 w-4 shrink-0 text-cyan-400" />
                            {search.name}
                          </p>
                          {search.keywords && (
                            <p className="mt-1 text-sm text-slate-600 truncate">{search.keywords}</p>
                          )}
                          {search.subscription_enabled && (
                            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                              <Bell className="h-3 w-3" /> {search.frequency || 'DAILY'} alerts
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="text-sm text-slate-600">Updated {formatRelative(search.updated_at)}</div>
                          <button
                            type="button"
                            onClick={() => shareText({
                              title: `Saved Search: ${search.name}`,
                              text: search.keywords ? `Keywords: ${search.keywords}` : 'Saved search details',
                              url: `${window.location.origin}/alerts/manage-searches`,
                            })}
                            className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700"
                          >
                            <Share2 className="h-3.5 w-3.5" />
                            Share
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Saved opportunities quick view */}
            {activeTab === 'opps' && (
              <div className="space-y-3">
                {savedOpps.length === 0 ? (
                  <div className="rounded-xl border border-slate-300 bg-white p-10 text-center text-slate-700">
                    <p className="mb-3">No saved opportunities yet.</p>
                    <Link href="/dashboard/saved-opportunities" className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500">
                      <Search className="h-4 w-4" /> Open saved opportunities page
                    </Link>
                  </div>
                ) : (
                  savedOpps.map((opportunity, index) => (
                    <div key={opportunity.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-black uppercase tracking-wide text-blue-700 mb-0.5">Opportunity #{index + 1}</p>
                          <p className="font-bold text-slate-900 text-lg truncate">{opportunity.title || opportunity.notice_id || 'Untitled opportunity'}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                            {opportunity.department && <span>{opportunity.department}</span>}
                            {opportunity.solicitation_number && <span>Solicitation: {opportunity.solicitation_number}</span>}
                            {opportunity.naics_code && <span>NAICS: {opportunity.naics_code}</span>}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => shareText({
                            title: `Saved Opportunity: ${opportunity.title || opportunity.notice_id || 'Untitled opportunity'}`,
                            text: opportunity.solicitation_number ? `Solicitation: ${opportunity.solicitation_number}` : 'Saved opportunity details',
                            url: opportunity.ui_link || `${window.location.origin}/dashboard/saved-opportunities`,
                          })}
                          className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700"
                        >
                          <Share2 className="h-3.5 w-3.5" />
                          Share
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Contacts quick view */}
            {activeTab === 'contacts' && (
              <div className="space-y-3">
                {contacts.length === 0 ? (
                  <div className="rounded-xl border border-slate-300 bg-white p-10 text-center text-slate-700">
                    <p className="mb-3">No contacts yet.</p>
                    <Link href="/contacts" className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-500">
                      <UserRound className="h-4 w-4" /> Open contacts page
                    </Link>
                  </div>
                ) : (
                  contacts.map((contact, index) => (
                    <div key={contact.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-black uppercase tracking-wide text-blue-700 mb-0.5">Contact #{index + 1}</p>
                          <p className="font-bold text-slate-900 text-lg truncate">{contactDisplayName(contact)}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                            {contact.email && <span>{contact.email}</span>}
                            {contact.organization && <span>{contact.organization}</span>}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => shareText({
                            title: `Contact: ${contactDisplayName(contact)}`,
                            text: contact.email || 'Contact details',
                            url: `${window.location.origin}/contacts`,
                          })}
                          className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700"
                        >
                          <Share2 className="h-3.5 w-3.5" />
                          Share
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}

        {showExportModal && (
          <div className="fixed inset-0 z-50 bg-black/40 p-4">
            <div className="mx-auto mt-20 w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-black text-slate-900">Export Workspace Data</h3>
                  <p className="mt-1 text-sm text-slate-600">Choose which sections to include in your export file.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowExportModal(false)}
                  className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                  aria-label="Close export modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-4 flex flex-wrap gap-2">
                <button type="button" onClick={exportAll} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700">All</button>
                <button type="button" onClick={exportNone} className="rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-300">None</button>
              </div>

              <div className="space-y-2">
                <label className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800">
                  <span>Saved Alerts ({alertSubs.length})</span>
                  <input type="checkbox" checked={exportSelection.alerts} onChange={e => exportSelections({ alerts: e.target.checked })} />
                </label>
                <label className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800">
                  <span>Saved Searches ({searches.length})</span>
                  <input type="checkbox" checked={exportSelection.searches} onChange={e => exportSelections({ searches: e.target.checked })} />
                </label>
                <label className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800">
                  <span>Saved Opportunities ({savedOpps.length})</span>
                  <input type="checkbox" checked={exportSelection.opportunities} onChange={e => exportSelections({ opportunities: e.target.checked })} />
                </label>
                <label className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800">
                  <span>Contacts ({contacts.length})</span>
                  <input type="checkbox" checked={exportSelection.contacts} onChange={e => exportSelections({ contacts: e.target.checked })} />
                </label>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={shareWorkspaceSummary}
                    className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-black text-white hover:bg-cyan-700"
                  >
                    <Share2 className="h-4 w-4" />
                    Share Summary
                  </button>
                  <button
                    type="button"
                    onClick={downloadAllTabs}
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-black text-white hover:bg-emerald-700"
                  >
                    <Download className="h-4 w-4" />
                    Download All Tabs
                  </button>
                </div>
                <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowExportModal(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={downloadExport}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-black text-white hover:bg-blue-700"
                >
                  <Download className="h-4 w-4" />
                  Export Selected
                </button>
                </div>
              </div>
            </div>
          </div>
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
        .pg-alerts-modern {
          font-size: 17px;
        }

        .pg-alerts-modern .text-sm {
          font-size: 1.02rem;
          line-height: 1.5rem;
        }

        .pg-alerts-modern .text-xs {
          font-size: 0.9rem;
          line-height: 1.35rem;
        }

        .pg-alerts-modern .alerts-dark-surface h2,
        .pg-alerts-modern .alerts-dark-surface h3,
        .pg-alerts-modern .alerts-dark-surface .text-white,
        .pg-alerts-modern .alerts-dark-surface [class*="text-white/"] {
          color: #ffffff !important;
        }

        .pg-alerts-modern .alerts-dark-surface p,
        .pg-alerts-modern .alerts-dark-surface .text-slate-200,
        .pg-alerts-modern .alerts-dark-surface .text-slate-300 {
          color: rgba(248, 250, 252, 0.96) !important;
        }

        .pg-alerts-modern .alerts-dark-surface .text-slate-400,
        .pg-alerts-modern .alerts-dark-surface .text-slate-500 {
          color: rgba(241, 245, 249, 0.92) !important;
        }

        .pg-alerts-modern .alerts-dark-surface .border-slate-700,
        .pg-alerts-modern .alerts-dark-surface .border-slate-800 {
          border-color: rgba(148, 163, 184, 0.28) !important;
        }
      `}</style>
    </>
  )
}
