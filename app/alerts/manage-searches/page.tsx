// app/alerts/manage-searches/page.tsx
'use client'

import { useEffect, useMemo, useState, useRef, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Bookmark, Plus, Search, PlayCircle, Trash2, Edit, Loader2, CheckCircle,
  AlertCircle, X, Clock, ArrowLeft, Copy, BellRing, Bell, Filter, Eye,
} from 'lucide-react'

import {
  getDefault6MonthRange as getDefault6MonthRangeFromConstants,
} from '@/lib/sam-gov-constants'

import UnifiedSaveSearchModal from '@/components/UnifiedSaveSearchModal'

// ─── Types ────────────────────────────────────────────────────────────────────
interface SavedSearch {
  id: string; name: string; description?: string | null; keywords?: string | null
  solnum?: string | null; noticeid?: string | null; naics?: string | null; ccode?: string | null
  agency?: string | null; organizationCode?: string | null; setAside?: string | null
  stateOfPerformance?: string | null; zip?: string | null; status?: string | null
  opportunityStatus?: string | null; procurementType?: string | null; postedAfter?: string | null
  postedBefore?: string | null; rdlfrom?: string | null; rdlto?: string | null
  use_count?: number; last_used_at?: string | null; created_at?: string
  subscription_enabled?: boolean; frequency?: string | null; recipients?: string | null
  email_notification?: boolean; send_empty_results?: boolean; max_results?: number
  delivery_time?: string | null; export_format?: string | null; include_links?: boolean
  _count?: { runs: number; exports: number }
}

// ─── Utilities ────────────────────────────────────────────────────────────────
function clsx(...c: Array<string | boolean | null | undefined>) { return c.filter(Boolean).join(' ') }

function formatRelative(d?: string | null) {
  if (!d) return 'Never'
  const diff = Date.now() - new Date(d).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return new Date(d).toLocaleDateString()
}

function formatDateInput(d: Date) { return d.toISOString().split('T')[0] }
function toYmd(v?: string | null) {
  if (!v) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v
  const d = new Date(v); return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10)
}
function sanitizePostedFromYmd(ymd?: string | null) {
  if (!ymd) return null
  const d = new Date(ymd); if (isNaN(d.getTime())) return null
  const min = new Date(); min.setDate(min.getDate() - 364)
  return formatDateInput(d < min ? min : d)
}

function buildSearchUrl(saved: SavedSearch, run?: boolean) {
  const p = new URLSearchParams()
  p.set('loadSavedSearch', saved.id)
  p.set('from', 'alerts')
  if (run) p.set('run', '1')
  return `/search?${p.toString()}`
}

// ─── Main Component ───────────────────────────────────────────────────────────
function ManageSearchesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [searches, setSearches] = useState<SavedSearch[]>([])
  const [busyId, setBusyId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [viewingSearch, setViewingSearch] = useState<SavedSearch | null>(null)
  const [expandedSearchId, setExpandedSearchId] = useState<string | null>(null)
  const [editingSearch, setEditingSearch] = useState<SavedSearch | null>(null)
  const [createAlertFromSearch, setCreateAlertFromSearch] = useState<SavedSearch | null>(null)
  const [showCreateAlertModal, setShowCreateAlertModal] = useState(false)
  const [justSavedSearch, setJustSavedSearch] = useState<SavedSearch | null>(null)
  const [incomingSearchParams, setIncomingSearchParams] = useState<Record<string, string> | null>(null)
  const hasProcessedUrlParams = useRef(false)

  const withAlerts = useMemo(() => searches.filter(s => s.subscription_enabled).length, [searches])
  const recentlyUsed = useMemo(() => searches.filter(s => s._count?.runs).length, [searches])
  const busy = busyId !== null

  useEffect(() => { void fetchSearches() }, [])
  useEffect(() => {
    if (hasProcessedUrlParams.current) return
    const criteriaKeys = ['setAside', 'typeOfSetAside', 'status', 'postedFrom', 'rdlfrom', 'rdlto',
      'keywords', 'naics', 'ncode', 'ptype', 'state', 'zip', 'agency', 'ccode', 'solnum', 'noticeid']
    const incoming: Record<string, string> = {}
    for (const key of criteriaKeys) { const v = searchParams.get(key); if (v) incoming[key] = v }
    if (Object.keys(incoming).length > 0) {
      hasProcessedUrlParams.current = true
      if (!incoming.rdlfrom) incoming.rdlfrom = formatDateInput(new Date())
      setIncomingSearchParams(incoming)
      setShowCreateModal(true)
    }
  }, [searchParams])
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

  async function fetchSearches() {
    try {
      setLoading(true)
      const res = await fetch('/api/saved-searches')
      if (!res.ok) { setSearches([]); return }
      const j = await res.json()
      setSearches(j.searches || [])
    } catch { setSearches([]) } finally { setLoading(false) }
  }

  function pushToSearch(id: string) {
    localStorage.removeItem('browsingStartTime')
    const s = searches.find(x => x.id === id)
    if (s) { router.push(buildSearchUrl(s, true)); return }
    router.push(`/search?loadSavedSearch=${encodeURIComponent(id)}&run=1&from=alerts`)
  }

  async function createSavedSearch(data: any) {
    try {
      setBusyId('new-search')
      const res = await fetch('/api/saved-searches', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, subscription_enabled: false }) })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) { setToast({ type: 'error', message: j?.error || 'Failed to create search.' }); return }
      setSearches(prev => [j.search, ...prev])
      setToast({ type: 'success', message: `Saved search "${j.search.name}" created!` })
      setShowCreateModal(false)
      if (incomingSearchParams) { setJustSavedSearch(j.search); setIncomingSearchParams(null) }
    } catch { setToast({ type: 'error', message: 'Failed to create search.' }) } finally { setBusyId(null) }
  }

  async function deleteSavedSearch(id: string) {
    try {
      setBusyId(id)
      const res = await fetch(`/api/saved-searches/${id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' } })
      if (!res.ok) { const j = await res.json().catch(() => ({})); setToast({ type: 'error', message: j?.error || 'Failed to delete.' }); return }
      setSearches(prev => prev.filter(s => s.id !== id))
      setToast({ type: 'success', message: 'Saved search deleted' })
    } catch { setToast({ type: 'error', message: 'Failed to delete.' }) } finally { setBusyId(null); setDeleteConfirmId(null) }
  }

  async function duplicateSavedSearch(id: string) {
    const search = searches.find(s => s.id === id)
    if (!search) return
    try {
      setBusyId(id)
      const res = await fetch('/api/saved-searches', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: `${search.name} (Copy)`, description: search.description, keywords: search.keywords, naics: search.naics, agency: search.agency, setAside: search.setAside, stateOfPerformance: search.stateOfPerformance, procurementType: search.procurementType, postedAfter: search.postedAfter, postedBefore: search.postedBefore, rdlfrom: search.rdlfrom, subscription_enabled: false }) })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) { setToast({ type: 'error', message: j?.error || 'Failed to duplicate.' }); return }
      setSearches(prev => [j.search, ...prev])
      setToast({ type: 'success', message: 'Search duplicated' })
    } catch { setToast({ type: 'error', message: 'Failed to duplicate.' }) } finally { setBusyId(null) }
  }

  function startEditingSearch(search: SavedSearch) {
    const defaults = getDefault6MonthRangeFromConstants()
    setExpandedSearchId(search.id)
    setEditingSearch({ ...search, postedAfter: toYmd(search.postedAfter) || defaults.from, rdlfrom: toYmd(search.rdlfrom) || formatDateInput(new Date()) })
  }

  async function saveEditedSearch() {
    if (!editingSearch) return
    if (!editingSearch.name?.trim()) { setToast({ type: 'error', message: 'Search name is required.' }); return }
    try {
      setBusyId(editingSearch.id)
      const payload: any = { name: editingSearch.name, description: editingSearch.description, keywords: editingSearch.keywords, solicitationNumber: editingSearch.solnum, noticeId: editingSearch.noticeid, naics: editingSearch.naics, classificationCode: editingSearch.ccode, agency: editingSearch.agency, organizationCode: editingSearch.organizationCode, setAside: editingSearch.setAside, stateOfPerformance: editingSearch.stateOfPerformance, placeOfPerformanceZip: editingSearch.zip, opportunityStatus: editingSearch.status, postedAfter: sanitizePostedFromYmd(editingSearch.postedAfter), postedBefore: sanitizePostedFromYmd(editingSearch.postedBefore), rdlfrom: editingSearch.rdlfrom, rdlto: editingSearch.rdlto }
      if (editingSearch.procurementType?.trim()) payload.procurementType = editingSearch.procurementType
      const res = await fetch(`/api/saved-searches/${editingSearch.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) { const j = await res.json().catch(() => ({})); setToast({ type: 'error', message: j?.error || 'Failed to update search' }); return }
      setToast({ type: 'success', message: `"${editingSearch.name}" updated!` })
      setExpandedSearchId(null); setEditingSearch(null)
      await fetchSearches()
    } catch (err: any) { setToast({ type: 'error', message: err.message || 'Failed to update.' }) } finally { setBusyId(null) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-teal-50" style={{ fontFamily: "'Outfit', 'Segoe UI', system-ui, sans-serif" }}>

      {/* Toast */}
      {toast && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 pointer-events-none">
          <div className={clsx('relative w-full max-w-xl mx-4 rounded-2xl shadow-2xl border-2 p-5',
            toast.type === 'success' && 'border-emerald-400 bg-emerald-50',
            toast.type === 'error' && 'border-rose-400 bg-rose-50',
            toast.type === 'info' && 'border-blue-400 bg-blue-50')}>
            <div className="flex items-center gap-3 pointer-events-auto">
              {toast.type === 'success' && <CheckCircle className="h-6 w-6 text-emerald-600 flex-shrink-0" />}
              {toast.type === 'error' && <AlertCircle className="h-6 w-6 text-rose-600 flex-shrink-0" />}
              {toast.type === 'info' && <Bell className="h-6 w-6 text-blue-600 flex-shrink-0" />}
              <p className={clsx('flex-1 text-sm font-medium', toast.type === 'success' && 'text-emerald-800', toast.type === 'error' && 'text-rose-800', toast.type === 'info' && 'text-blue-800')}>{toast.message}</p>
              <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-6xl px-4 sm:px-8 py-8">

        {/* Back Nav */}
        <div className="mb-6">
          <Link href="/alerts" className="inline-flex items-center gap-2 text-sm text-teal-700 hover:text-teal-900 font-medium transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Alert Manager
          </Link>
        </div>

        {/* Page Header Banner */}
        <div className="rounded-3xl overflow-hidden shadow-xl mb-8" style={{ background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 50%, #14b8a6 100%)', boxShadow: '0 16px 48px rgba(20,184,166,0.25)' }}>
          <div className="px-8 py-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 rounded-2xl p-3">
                <Bookmark className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Saved Searches</h1>
                <p className="text-teal-100 mt-0.5">Reusable search criteria — run with one click</p>
              </div>
            </div>
            <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 bg-white text-teal-700 hover:bg-teal-50 font-bold px-5 py-3 rounded-xl transition-all shadow-lg text-sm flex-shrink-0">
              <Plus className="w-4 h-4" /> Save New Search
            </button>
          </div>

          {/* Stats Bar */}
          <div className="bg-black/15 px-8 py-4 grid grid-cols-3 gap-4 sm:gap-8">
            <div className="text-center">
              <p className="text-2xl font-extrabold text-white">{searches.length}</p>
              <p className="text-teal-200 text-xs font-medium mt-0.5">Total Saved</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-extrabold text-white">{recentlyUsed}</p>
              <p className="text-teal-200 text-xs font-medium mt-0.5">Recently Used</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-extrabold text-white">{withAlerts}</p>
              <p className="text-teal-200 text-xs font-medium mt-0.5 flex items-center justify-center gap-1"><BellRing className="w-3 h-3" />Has Alert</p>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-16"><Loader2 className="h-10 w-10 text-teal-500 animate-spin mx-auto mb-3" /><p className="text-slate-500">Loading saved searches...</p></div>
        ) : searches.length === 0 ? (
          <div className="text-center py-16 rounded-3xl border-2 border-dashed border-teal-300 bg-white/50">
            <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-teal-100 flex items-center justify-center">
              <Bookmark className="w-10 h-10 text-teal-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-2">No saved searches yet</h3>
            <p className="text-slate-500 mb-6 max-w-sm mx-auto text-sm">Save complex filter combinations to re-run them in one click without re-entering criteria each time.</p>
            <button onClick={() => setShowCreateModal(true)} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold shadow-lg hover:opacity-90 transition-all">
              <Plus className="w-5 h-5" /> Save First Search
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {searches.map(search => (
              <div key={search.id} className="rounded-2xl border bg-white shadow-sm hover:shadow-md transition-all duration-200"
                style={{ borderLeft: '4px solid #14b8a6' }}>

                {/* Card Row */}
                <div className="p-5 flex items-start gap-4 cursor-pointer" onClick={() => setViewingSearch(search)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-base font-bold text-slate-800 truncate">{search.name}</h3>
                      {search.subscription_enabled && (
                        <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-bold border border-orange-200 flex items-center gap-1">
                          <Bell className="w-3 h-3" /> Alert Active
                        </span>
                      )}
                    </div>
                    {search.description && <p className="text-xs text-slate-500 mb-2 line-clamp-1">{search.description}</p>}
                    <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                      {search.keywords && <span className="flex items-center gap-1 truncate max-w-[180px]"><Search className="w-3.5 h-3.5 flex-shrink-0" />{search.keywords}</span>}
                      {search.naics && <span className="flex items-center gap-1"><Filter className="w-3.5 h-3.5" />NAICS: {search.naics}</span>}
                      {search.agency && <span className="flex items-center gap-1 truncate max-w-[160px]">{search.agency}</span>}
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />Used {search._count?.runs || 0}×</span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                    <button onClick={() => pushToSearch(search.id)} className="p-2 rounded-lg bg-teal-100 hover:bg-teal-200 text-teal-700 transition-colors" title="Run search"><PlayCircle className="w-4 h-4" /></button>
                    <button onClick={() => startEditingSearch(search)} className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors" title="Edit"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => duplicateSavedSearch(search.id)} disabled={busy} className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors" title="Duplicate"><Copy className="w-4 h-4" /></button>
                    {!search.subscription_enabled && (
                      <button onClick={() => { setCreateAlertFromSearch(search); setShowCreateAlertModal(true) }} className="p-2 rounded-lg bg-orange-100 hover:bg-orange-200 text-orange-700 transition-colors" title="Create alert from this search"><BellRing className="w-4 h-4" /></button>
                    )}
                    <button onClick={() => setDeleteConfirmId(search.id)} className="p-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>

                {/* Inline Edit Panel */}
                {expandedSearchId === search.id && editingSearch && (
                  <div className="border-t border-teal-100 bg-teal-50/60 px-5 pb-5 pt-4">
                    <h4 className="text-sm font-bold text-teal-700 mb-4">Edit Search</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Search Name</label>
                        <input className="w-full px-3 py-2 rounded-lg border border-teal-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
                          value={editingSearch.name} onChange={e => setEditingSearch({ ...editingSearch, name: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Keywords</label>
                        <input className="w-full px-3 py-2 rounded-lg border border-teal-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
                          value={editingSearch.keywords || ''} onChange={e => setEditingSearch({ ...editingSearch, keywords: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">NAICS Code</label>
                        <input className="w-full px-3 py-2 rounded-lg border border-teal-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
                          value={editingSearch.naics || ''} onChange={e => setEditingSearch({ ...editingSearch, naics: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Agency</label>
                        <input className="w-full px-3 py-2 rounded-lg border border-teal-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
                          value={editingSearch.agency || ''} onChange={e => setEditingSearch({ ...editingSearch, agency: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Set-Aside</label>
                        <input className="w-full px-3 py-2 rounded-lg border border-teal-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
                          value={editingSearch.setAside || ''} onChange={e => setEditingSearch({ ...editingSearch, setAside: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">State</label>
                        <input className="w-full px-3 py-2 rounded-lg border border-teal-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
                          value={editingSearch.stateOfPerformance || ''} onChange={e => setEditingSearch({ ...editingSearch, stateOfPerformance: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Posted After</label>
                        <input type="date" className="w-full px-3 py-2 rounded-lg border border-teal-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
                          value={editingSearch.postedAfter || ''} onChange={e => setEditingSearch({ ...editingSearch, postedAfter: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Response Deadline From</label>
                        <input type="date" className="w-full px-3 py-2 rounded-lg border border-teal-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-400"
                          value={editingSearch.rdlfrom || ''} onChange={e => setEditingSearch({ ...editingSearch, rdlfrom: e.target.value })} />
                      </div>
                    </div>
                    <div className="flex gap-3 mt-4">
                      <button onClick={saveEditedSearch} disabled={busyId === editingSearch.id} className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-semibold text-sm transition-colors disabled:opacity-50 flex items-center gap-2">
                        {busyId === editingSearch.id ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</> : 'Save Changes'}
                      </button>
                      <button onClick={() => pushToSearch(search.id)} className="px-5 py-2 rounded-xl bg-teal-100 hover:bg-teal-200 text-teal-700 font-semibold text-sm transition-colors flex items-center gap-2"><PlayCircle className="w-3.5 h-3.5" />Run Search</button>
                      <button onClick={() => { setExpandedSearchId(null); setEditingSearch(null) }} className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-colors">Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Search Modal */}
      {showCreateModal && (
        <UnifiedSaveSearchModal isOpen={showCreateModal}
          onClose={() => { setShowCreateModal(false); setIncomingSearchParams(null) }}
          mode="save"
          searchParams={incomingSearchParams ? { title: incomingSearchParams.keywords, solnum: incomingSearchParams.solnum, noticeid: incomingSearchParams.noticeid, ptype: incomingSearchParams.ptype, typeOfSetAside: incomingSearchParams.setAside || incomingSearchParams.typeOfSetAside, status: incomingSearchParams.status, state: incomingSearchParams.state, ncode: incomingSearchParams.naics || incomingSearchParams.ncode, ccode: incomingSearchParams.ccode, zip: incomingSearchParams.zip, organizationName: incomingSearchParams.agency, organizationCode: incomingSearchParams.organizationCode, postedFrom: incomingSearchParams.postedFrom, postedTo: incomingSearchParams.postedTo, rdlfrom: incomingSearchParams.rdlfrom, rdlto: incomingSearchParams.rdlto } : undefined}
          onSave={createSavedSearch}
        />
      )}

      {/* Create Alert from Search Modal */}
      {showCreateAlertModal && createAlertFromSearch && (
        <UnifiedSaveSearchModal isOpen={showCreateAlertModal}
          onClose={() => { setShowCreateAlertModal(false); setCreateAlertFromSearch(null) }}
          mode="alert"
          searchParams={{ title: createAlertFromSearch.keywords || undefined, solnum: createAlertFromSearch.solnum || undefined, noticeid: createAlertFromSearch.noticeid || undefined, ptype: createAlertFromSearch.procurementType || undefined, typeOfSetAside: createAlertFromSearch.setAside || undefined, status: createAlertFromSearch.status || undefined, state: createAlertFromSearch.stateOfPerformance || undefined, ncode: createAlertFromSearch.naics || undefined, ccode: createAlertFromSearch.ccode || undefined, zip: createAlertFromSearch.zip || undefined, organizationName: createAlertFromSearch.agency || undefined, organizationCode: createAlertFromSearch.organizationCode || undefined, postedFrom: createAlertFromSearch.postedAfter || undefined, rdlfrom: createAlertFromSearch.rdlfrom || undefined }}
          existingSearch={{ id: createAlertFromSearch.id }}
          onSave={async (alertData) => {
            const res = await fetch('/api/saved-searches', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...alertData, subscription_enabled: true, frequency: alertData.frequency || 'DAILY', keywords: createAlertFromSearch.keywords, naics: createAlertFromSearch.naics, agency: createAlertFromSearch.agency, setAside: createAlertFromSearch.setAside, stateOfPerformance: createAlertFromSearch.stateOfPerformance, procurementType: createAlertFromSearch.procurementType || 'o', postedAfter: createAlertFromSearch.postedAfter, rdlfrom: createAlertFromSearch.rdlfrom }) })
            const d = await res.json()
            if (!res.ok) throw new Error(d.error || 'Failed to create alert')
            await fetchSearches()
            setToast({ type: 'success', message: `Alert "${alertData.name}" created!` })
            setShowCreateAlertModal(false); setCreateAlertFromSearch(null)
          }}
        />
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-6 border border-slate-200">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 rounded-xl bg-red-100"><Trash2 className="h-5 w-5 text-red-600" /></div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Delete Saved Search</h3>
                <p className="text-sm text-slate-500 mt-0.5">This will permanently delete the search. Any connected alerts will be disabled.</p>
              </div>
              <button onClick={() => setDeleteConfirmId(null)} className="ml-auto text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteConfirmId(null)} className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm">Cancel</button>
              <button onClick={() => deleteSavedSearch(deleteConfirmId)} disabled={busyId === deleteConfirmId} className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm disabled:opacity-50 flex items-center gap-2">
                {busyId === deleteConfirmId ? <><Loader2 className="w-4 h-4 animate-spin" />Deleting...</> : <><Trash2 className="w-4 h-4" />Delete</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Search Modal */}
      {viewingSearch && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">Search Details</h2>
              <button onClick={() => setViewingSearch(null)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div><p className="text-xs text-slate-500 mb-1">Name</p><p className="font-bold text-slate-800 text-lg">{viewingSearch.name}</p></div>
              {viewingSearch.description && <div><p className="text-xs text-slate-500 mb-1">Description</p><p className="text-sm text-slate-700">{viewingSearch.description}</p></div>}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Search Criteria</p>
                {viewingSearch.keywords && <div><p className="text-xs text-slate-500">Keywords</p><p className="text-sm font-medium text-slate-800">{viewingSearch.keywords}</p></div>}
                {viewingSearch.naics && <div><p className="text-xs text-slate-500">NAICS</p><p className="text-sm font-medium text-slate-800">{viewingSearch.naics}</p></div>}
                {viewingSearch.agency && <div><p className="text-xs text-slate-500">Agency</p><p className="text-sm font-medium text-slate-800">{viewingSearch.agency}</p></div>}
                {viewingSearch.setAside && <div><p className="text-xs text-slate-500">Set-Aside</p><p className="text-sm font-medium text-slate-800">{viewingSearch.setAside}</p></div>}
                {viewingSearch.stateOfPerformance && <div><p className="text-xs text-slate-500">State</p><p className="text-sm font-medium text-slate-800">{viewingSearch.stateOfPerformance}</p></div>}
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200"><p className="text-xs text-slate-500 mb-0.5">Times Used</p><p className="font-bold text-slate-800">{viewingSearch._count?.runs || 0}</p></div>
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200"><p className="text-xs text-slate-500 mb-0.5">Alert Status</p><p className={`font-bold ${viewingSearch.subscription_enabled ? 'text-orange-600' : 'text-slate-500'}`}>{viewingSearch.subscription_enabled ? '● Alert On' : 'No Alert'}</p></div>
              </div>
              <div className="pt-2 flex gap-3">
                <button onClick={() => { pushToSearch(viewingSearch.id); setViewingSearch(null) }} className="flex-1 px-4 py-2 rounded-xl bg-teal-100 hover:bg-teal-200 text-teal-700 font-semibold text-sm flex items-center justify-center gap-2"><PlayCircle className="w-4 h-4" />Run Search</button>
                <button onClick={() => { startEditingSearch(viewingSearch); setViewingSearch(null) }} className="flex-1 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm flex items-center justify-center gap-2"><Edit className="w-4 h-4" />Edit</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Run After Save Modal */}
      {justSavedSearch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden border border-slate-200">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6 text-center">
              <CheckCircle className="h-10 w-10 text-white mx-auto mb-2" />
              <h3 className="text-xl font-bold text-white">Search Saved!</h3>
              <p className="text-emerald-100 text-sm mt-1">&quot;{justSavedSearch.name}&quot;</p>
            </div>
            <div className="p-6">
              <p className="text-slate-600 text-sm text-center mb-5">Would you like to run this search now?</p>
              <div className="flex gap-3">
                <button onClick={() => setJustSavedSearch(null)} className="flex-1 px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm">Stay Here</button>
                <button onClick={() => { const s = justSavedSearch; setJustSavedSearch(null); pushToSearch(s.id) }} className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg hover:opacity-90">
                  <PlayCircle className="w-4 h-4" /> Run Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ManageSearchesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-teal-50 flex items-center justify-center"><Loader2 className="h-8 w-8 text-teal-500 animate-spin" /></div>}>
      <ManageSearchesContent />
    </Suspense>
  )
}