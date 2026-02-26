// app/alerts/manage-alerts/page.tsx
'use client'

import { useEffect, useMemo, useState, useRef, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Bell, BellRing, Plus, Search, Mail, Calendar, Zap, PlayCircle, PauseCircle,
  Trash2, Edit, Loader2, CheckCircle, AlertCircle, X, Sparkles, Clock,
  ArrowLeft, ArrowRight, Filter, BarChart3, Eye,
} from 'lucide-react'

import {
  ALERT_FREQUENCIES,
  getDefault6MonthRange as getDefault6MonthRangeFromConstants,
} from '@/lib/sam-gov-constants'

import UnifiedSaveSearchModal from '@/components/UnifiedSaveSearchModal'

// ─── Types ───────────────────────────────────────────────────────────────────
type AlertFrequency = 'AS_CHANGES' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'MANUAL'
type FileFormat = 'json' | 'csv' | 'excel'

type SearchAlert = {
  id?: string; name: string; description?: string; frequency: AlertFrequency
  recipients: string; email_notification?: boolean; file_format?: FileFormat
  include_links?: boolean; send_empty_results?: boolean; max_results?: number; delivery_time?: string
}

interface AlertSubscription {
  id: string; name: string; description?: string | null; frequency: AlertFrequency
  active: boolean; recipients: string; file_format?: FileFormat | null; export_format?: string | null
  include_links: boolean; send_empty_results: boolean; max_results: number; delivery_time?: string | null
  email_notification?: boolean; last_run_at?: string | null; last_result_count?: number | null; created_at?: string
  savedSearch: {
    id: string; name: string; keywords?: string | null; solnum?: string | null; noticeid?: string | null
    naics?: string | null; ncode?: string | null; ccode?: string | null; agency?: string | null
    organizationName?: string | null; organizationCode?: string | null; setAside?: string | null
    typeOfSetAside?: string | null; stateOfPerformance?: string | null; state?: string | null
    zip?: string | null; status?: string | null; opportunityStatus?: string | null
    procurementType?: string | null; ptype?: string | null; postedAfter?: string | null
    postedBefore?: string | null; postedFrom?: string | null; postedTo?: string | null
    rdlfrom?: string | null; rdlto?: string | null; limit?: number | null
  }
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

function freqLabel(f: AlertFrequency) {
  return { AS_CHANGES: 'Real-time', DAILY: 'Daily', WEEKLY: 'Weekly', MONTHLY: 'Monthly', MANUAL: 'Manual' }[f] ?? f
}
function freqChipClass(f: AlertFrequency) {
  return { AS_CHANGES: 'text-cyan-700 bg-cyan-100 border-cyan-300', DAILY: 'text-emerald-700 bg-emerald-100 border-emerald-300',
    WEEKLY: 'text-blue-700 bg-blue-100 border-blue-300', MONTHLY: 'text-purple-700 bg-purple-100 border-purple-300' }[f]
    ?? 'text-slate-600 bg-slate-100 border-slate-300'
}
function normalizeApiFrequency(f?: string | null): 'DAILY' | 'WEEKLY' | 'MONTHLY' | null {
  if (!f) return null
  const u = f.toUpperCase()
  if (u === 'DAILY' || u === 'WEEKLY' || u === 'MONTHLY') return u as any
  return 'DAILY'
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

// ─── Main Component ───────────────────────────────────────────────────────────
function ManageAlertsContent() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [subscriptions, setSubscriptions] = useState<AlertSubscription[]>([])
  const [busyId, setBusyId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editing, setEditing] = useState<AlertSubscription | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [runConfirmId, setRunConfirmId] = useState<string | null>(null)
  const [runningAlertName, setRunningAlertName] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [viewingAlert, setViewingAlert] = useState<AlertSubscription | null>(null)
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null)
  const [editingAlert, setEditingAlert] = useState<AlertSubscription | null>(null)
  const [abortController, setAbortController] = useState<AbortController | null>(null)
  const [runSuccess, setRunSuccess] = useState<{
    id: string; alertName: string; keywords: string; count: number
    recipients: string[]; timestamp: string; frequency: string; email_sent: boolean
  } | null>(null)

  const activeCount = useMemo(() => subscriptions.filter(s => s.active).length, [subscriptions])
  const pausedCount = useMemo(() => subscriptions.filter(s => !s.active).length, [subscriptions])
  const busy = busyId !== null

  function isDuplicateAlertName(name: string, excludeId?: string) {
    const n = (name || '').trim().toLowerCase()
    return n ? subscriptions.some(s => s.id !== excludeId && s.name.trim().toLowerCase() === n) : false
  }

  useEffect(() => { void fetchSubscriptions() }, [])
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

  async function fetchSubscriptions() {
    try {
      setLoading(true)
      const res = await fetch('/api/saved-searches?subscribed=true')
      if (!res.ok) { setSubscriptions([]); return }
      const j = await res.json()
      setSubscriptions((j.searches || []).map((sub: any) => ({
        id: sub.id, name: sub.name, description: sub.description,
        frequency: sub.frequency || 'DAILY', active: sub.subscription_enabled || false,
        recipients: sub.recipients || '', file_format: sub.export_format?.toLowerCase() || 'csv',
        export_format: sub.export_format || 'CSV', include_links: sub.include_links ?? true,
        send_empty_results: sub.send_empty_results ?? false, max_results: sub.max_results || 100,
        delivery_time: sub.delivery_time || '09:00', email_notification: sub.email_notification ?? true,
        last_run_at: sub.last_run_at, last_result_count: sub.last_result_count, created_at: sub.created_at,
        savedSearch: {
          id: sub.id, name: sub.name, keywords: sub.keywords, solnum: sub.solicitationNumber,
          noticeid: sub.noticeid, naics: sub.naics, ncode: sub.naics, ccode: sub.classificationCode,
          agency: sub.agency, organizationName: sub.agency, organizationCode: sub.organizationCode,
          setAside: sub.setAside, typeOfSetAside: sub.setAside, stateOfPerformance: sub.stateOfPerformance,
          state: sub.stateOfPerformance, zip: sub.placeOfPerformanceZip, status: sub.opportunityStatus,
          procurementType: sub.procurementType, ptype: sub.procurementType,
          postedAfter: sub.postedAfter, postedBefore: sub.postedBefore,
          postedFrom: sub.postedAfter, postedTo: sub.postedBefore,
          rdlfrom: sub.rdlfrom, rdlto: sub.rdlto, limit: sub.max_results,
        },
      })))
    } catch { setSubscriptions([]) } finally { setLoading(false) }
  }

  async function toggleSubscription(id: string) {
    try {
      setBusyId(id)
      const res = await fetch(`/api/saved-searches/${id}/toggle`, { method: 'POST' })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) { setToast({ type: 'error', message: j?.error || 'Failed to update alert.' }); return }
      setSubscriptions(prev => prev.map(s => s.id === id ? { ...s, active: j?.search?.subscription_enabled ?? !s.active } : s))
      setToast({ type: 'success', message: j?.search?.subscription_enabled ? 'Alert activated' : 'Alert paused' })
    } catch { setToast({ type: 'error', message: 'Failed to update alert.' }) } finally { setBusyId(null) }
  }

  async function runNow(id: string) {
    const controller = new AbortController()
    setAbortController(controller)
    try {
      setBusyId(id)
      const sub = subscriptions.find(s => s.id === id)
      const res = await fetch(`/api/saved-searches/${id}`, { method: 'POST', signal: controller.signal, headers: { 'Content-Type': 'application/json' } })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        setToast({ type: 'error', message: j?.error || 'Failed to run alert.' }); setRunConfirmId(null); return
      }
      const j = await res.json().catch(() => ({}))
      setSubscriptions(prev => prev.map(s => s.id === id ? { ...s, last_run_at: j?.timestamp || new Date().toISOString(), last_result_count: j?.result_count ?? s.last_result_count ?? 0 } : s))
      setRunConfirmId(null); setRunningAlertName('')
      setRunSuccess({ id, alertName: j?.searchName || sub?.name || 'Alert', keywords: j?.keywords || 'All', count: j?.result_count ?? 0, recipients: j?.recipients || [], timestamp: j?.timestamp || new Date().toISOString(), frequency: j?.frequency || sub?.frequency || 'Manual', email_sent: j?.email_sent || false })
    } catch (e: any) {
      if (e.name !== 'AbortError') setToast({ type: 'error', message: 'Failed to run alert.' })
      setRunConfirmId(null); setRunningAlertName('')
    } finally { setBusyId(null); setAbortController(null) }
  }

  async function deleteSubscription(id: string) {
    try {
      setBusyId(id)
      const res = await fetch(`/api/alert-subscriptions/${id}`, { method: 'DELETE' })
      if (!res.ok) { const j = await res.json().catch(() => ({})); setToast({ type: 'error', message: j?.error || 'Failed to delete.' }); return }
      setSubscriptions(prev => prev.filter(s => s.id !== id))
      setToast({ type: 'success', message: 'Alert deleted successfully' })
    } catch { setToast({ type: 'error', message: 'Failed to delete alert.' }) } finally { setBusyId(null); setDeleteConfirmId(null) }
  }

  async function createSubscriptionAlert(data: any) {
    try {
      setBusyId('new-alert')
      const res = await fetch('/api/saved-searches', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, subscription_enabled: true, frequency: data.frequency || 'DAILY' }) })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) { setToast({ type: 'error', message: j?.error || 'Failed to create alert.' }); return }
      await fetchSubscriptions()
      setToast({ type: 'success', message: `Alert "${j.search.name}" created!` })
      setShowCreateModal(false)
    } catch { setToast({ type: 'error', message: 'Failed to create alert.' }) } finally { setBusyId(null) }
  }

  function startEditingAlert(alert: AlertSubscription) {
    const defaults = getDefault6MonthRangeFromConstants()
    const s = alert.savedSearch || ({} as any)
    setExpandedAlertId(alert.id)
    setEditingAlert({
      ...alert,
      file_format: (alert.file_format || alert.export_format || 'csv') as FileFormat,
      export_format: alert.export_format || alert.file_format || 'csv',
      email_notification: alert.email_notification ?? true,
      include_links: alert.include_links ?? true,
      send_empty_results: alert.send_empty_results ?? false,
      max_results: alert.max_results || 100,
      delivery_time: alert.delivery_time || '09:00',
      savedSearch: {
        ...s,
        keywords: s.keywords ?? null, naics: (s.naics || s.ncode) ?? null,
        agency: (s.agency || s.organizationName) ?? null,
        setAside: (s.setAside || s.typeOfSetAside) ?? null,
        stateOfPerformance: (s.stateOfPerformance || s.state) ?? null,
        status: s.status ?? null, procurementType: (s.procurementType || s.ptype) ?? null,
        postedAfter: toYmd(s.postedAfter || s.postedFrom) || defaults.from,
        postedBefore: toYmd(s.postedBefore || s.postedTo) || defaults.to,
        rdlfrom: toYmd(s.rdlfrom) || formatDateInput(new Date()),
        rdlto: toYmd(s.rdlto) || defaults.to,
      },
    })
  }

  async function saveEditedAlertInline() {
    if (!editingAlert) return
    if (!editingAlert.name?.trim()) { setToast({ type: 'error', message: 'Alert name is required.' }); return }
    if (isDuplicateAlertName(editingAlert.name, editingAlert.id)) { setToast({ type: 'error', message: 'Alert name must be unique.' }); return }
    try {
      setBusyId(editingAlert.id)
      const payload: any = {
        name: editingAlert.name, description: editingAlert.description, subscription_enabled: editingAlert.active,
        frequency: normalizeApiFrequency(editingAlert.frequency) || 'DAILY', recipients: editingAlert.recipients,
        email_notification: editingAlert.email_notification ?? true,
        export_format: (editingAlert.export_format || editingAlert.file_format || 'csv').toUpperCase(),
        include_links: editingAlert.include_links ?? true, send_empty_results: editingAlert.send_empty_results ?? false,
        max_results: editingAlert.max_results || 100, delivery_time: editingAlert.delivery_time || null,
        keywords: editingAlert.savedSearch?.keywords ?? null, naics: (editingAlert.savedSearch?.naics || editingAlert.savedSearch?.ncode) ?? null,
        agency: (editingAlert.savedSearch?.agency || editingAlert.savedSearch?.organizationName) ?? null,
        setAside: (editingAlert.savedSearch?.setAside || editingAlert.savedSearch?.typeOfSetAside) ?? null,
        stateOfPerformance: (editingAlert.savedSearch?.stateOfPerformance || editingAlert.savedSearch?.state) ?? null,
        opportunityStatus: editingAlert.savedSearch?.status ?? null,
        postedAfter: sanitizePostedFromYmd(editingAlert.savedSearch?.postedAfter || editingAlert.savedSearch?.postedFrom),
        postedBefore: sanitizePostedFromYmd(editingAlert.savedSearch?.postedBefore || editingAlert.savedSearch?.postedTo),
        rdlfrom: editingAlert.savedSearch?.rdlfrom ?? null, rdlto: editingAlert.savedSearch?.rdlto ?? null,
      }
      const pt = editingAlert.savedSearch?.procurementType || editingAlert.savedSearch?.ptype
      if (pt?.trim()) payload.procurementType = pt
      const res = await fetch(`/api/saved-searches/${editingAlert.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) { setToast({ type: 'error', message: j?.error || 'Failed to update alert' }); return }
      setToast({ type: 'success', message: 'Alert updated successfully!' })
      setExpandedAlertId(null); setEditingAlert(null)
      await fetchSubscriptions()
    } catch (err: any) { setToast({ type: 'error', message: err.message || 'Failed to update alert' }) } finally { setBusyId(null) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-50" style={{ fontFamily: "'Outfit', 'Segoe UI', system-ui, sans-serif" }}>

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
          <Link href="/alerts" className="inline-flex items-center gap-2 text-sm text-orange-700 hover:text-orange-900 font-medium transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Alert Manager
          </Link>
        </div>

        {/* Page Header Banner */}
        <div className="rounded-3xl overflow-hidden shadow-xl mb-8" style={{ background: 'linear-gradient(135deg, #c2410c 0%, #ea580c 50%, #f97316 100%)', boxShadow: '0 16px 48px rgba(249,115,22,0.25)' }}>
          <div className="px-8 py-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 rounded-2xl p-3">
                <BellRing className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Alert Subscriptions</h1>
                <p className="text-orange-100 mt-0.5">Automated email notifications for new federal opportunities</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-white text-orange-700 hover:bg-orange-50 font-bold px-5 py-3 rounded-xl transition-all shadow-lg text-sm flex-shrink-0"
            >
              <Plus className="w-4 h-4" /> New Alert
            </button>
          </div>

          {/* Stats Bar */}
          <div className="bg-black/15 px-8 py-4 grid grid-cols-3 gap-4 sm:gap-8">
            <div className="text-center">
              <p className="text-2xl font-extrabold text-white">{subscriptions.length}</p>
              <p className="text-orange-200 text-xs font-medium mt-0.5">Total Alerts</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-extrabold text-white">{activeCount}</p>
              <p className="text-orange-200 text-xs font-medium mt-0.5 flex items-center justify-center gap-1"><span className="w-2 h-2 rounded-full bg-green-300 inline-block" />Active</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-extrabold text-white">{pausedCount}</p>
              <p className="text-orange-200 text-xs font-medium mt-0.5 flex items-center justify-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-300 inline-block" />Paused</p>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-16"><Loader2 className="h-10 w-10 text-orange-500 animate-spin mx-auto mb-3" /><p className="text-slate-500">Loading alerts...</p></div>
        ) : subscriptions.length === 0 ? (
          <div className="text-center py-16 rounded-3xl border-2 border-dashed border-orange-300 bg-white/50">
            <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-orange-100 flex items-center justify-center">
              <BellRing className="w-10 h-10 text-orange-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-700 mb-2">No alert subscriptions yet</h3>
            <p className="text-slate-500 mb-6 max-w-sm mx-auto text-sm">Create your first alert to receive automated emails when matching opportunities appear on SAM.gov.</p>
            <button onClick={() => setShowCreateModal(true)} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold shadow-lg hover:opacity-90 transition-all">
              <Plus className="w-5 h-5" /> Create First Alert
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {subscriptions.map(alert => (
              <div key={alert.id} className="rounded-2xl border bg-white shadow-sm hover:shadow-md transition-all duration-200"
                style={{ borderLeft: '4px solid #f97316', borderColor: expandedAlertId === alert.id ? '#f97316' : undefined }}>
                
                {/* Card Row */}
                <div className="p-5 flex items-start gap-4 cursor-pointer" onClick={() => setViewingAlert(alert)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-base font-bold text-slate-800 truncate">{alert.name}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${freqChipClass(alert.frequency)}`}>
                        {freqLabel(alert.frequency)}
                      </span>
                      {alert.active
                        ? <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-bold border border-green-200">● Active</span>
                        : <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold border border-yellow-200">⏸ Paused</span>
                      }
                    </div>
                    {alert.description && <p className="text-xs text-slate-500 mb-2 line-clamp-1">{alert.description}</p>}
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{alert.recipients.split(',').length} recipient{alert.recipients.split(',').length !== 1 ? 's' : ''}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />Last run: {formatRelative(alert.last_run_at)}</span>
                      {alert.last_result_count != null && <span className="flex items-center gap-1"><BarChart3 className="w-3.5 h-3.5" />{alert.last_result_count} results</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                    <button onClick={() => { setRunConfirmId(alert.id); setRunningAlertName(alert.name) }} disabled={busy} className="p-2 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-700 transition-colors" title="Run now"><PlayCircle className="w-4 h-4" /></button>
                    <button onClick={() => startEditingAlert(alert)} className="p-2 rounded-lg bg-orange-100 hover:bg-orange-200 text-orange-700 transition-colors" title="Edit"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => toggleSubscription(alert.id)} disabled={busy} className={`p-2 rounded-lg transition-colors ${alert.active ? 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700' : 'bg-green-100 hover:bg-green-200 text-green-700'}`} title={alert.active ? 'Pause' : 'Activate'}>
                      {alert.active ? <PauseCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
                    </button>
                    <button onClick={() => setDeleteConfirmId(alert.id)} className="p-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>

                {/* Inline Edit Panel */}
                {expandedAlertId === alert.id && editingAlert && (
                  <div className="border-t border-orange-100 bg-orange-50/60 px-5 pb-5 pt-4">
                    <h4 className="text-sm font-bold text-orange-700 mb-4">Edit Alert</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Alert Name</label>
                        <input className="w-full px-3 py-2 rounded-lg border border-orange-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-400"
                          value={editingAlert.name} onChange={e => setEditingAlert({ ...editingAlert, name: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Frequency</label>
                        <select className="w-full px-3 py-2 rounded-lg border border-orange-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-400"
                          value={editingAlert.frequency} onChange={e => setEditingAlert({ ...editingAlert, frequency: e.target.value as AlertFrequency })}>
                          <option value="DAILY">Daily</option>
                          <option value="WEEKLY">Weekly</option>
                          <option value="MONTHLY">Monthly</option>
                          <option value="AS_CHANGES">Real-time</option>
                          <option value="MANUAL">Manual</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Recipients (comma-separated)</label>
                        <input className="w-full px-3 py-2 rounded-lg border border-orange-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-400"
                          value={editingAlert.recipients} onChange={e => setEditingAlert({ ...editingAlert, recipients: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Keywords</label>
                        <input className="w-full px-3 py-2 rounded-lg border border-orange-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-400"
                          value={editingAlert.savedSearch?.keywords || ''} onChange={e => setEditingAlert({ ...editingAlert, savedSearch: { ...editingAlert.savedSearch, keywords: e.target.value } })} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Max Results</label>
                        <input type="number" className="w-full px-3 py-2 rounded-lg border border-orange-200 bg-white text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-400"
                          value={editingAlert.max_results || 100} onChange={e => setEditingAlert({ ...editingAlert, max_results: parseInt(e.target.value) || 100 })} />
                      </div>
                    </div>
                    <div className="flex gap-3 mt-4">
                      <button onClick={saveEditedAlertInline} disabled={busyId === editingAlert.id} className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm transition-colors disabled:opacity-50 flex items-center gap-2">
                        {busyId === editingAlert.id ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</> : 'Save Changes'}
                      </button>
                      <button onClick={() => { setExpandedAlertId(null); setEditingAlert(null) }} className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-colors">Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Alert Modal */}
      {showCreateModal && (
        <UnifiedSaveSearchModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} mode="alert" onSave={createSubscriptionAlert} />
      )}

      {/* Edit Alert Modal */}
      {editing && showEditModal && (
        <UnifiedSaveSearchModal isOpen={showEditModal} onClose={() => { setEditing(null); setShowEditModal(false) }} mode="alert"
          existingSearch={{ id: editing.savedSearch?.id, name: editing.name, description: editing.description || '', frequency: editing.frequency, recipients: editing.recipients, email_notification: editing.email_notification ?? true, file_format: editing.file_format || 'csv', include_links: editing.include_links, send_empty_results: editing.send_empty_results, max_results: editing.max_results, delivery_time: editing.delivery_time }}
          onSave={async (alertData) => {
            if (!alertData.name?.trim()) throw new Error('Alert name is required.')
            if (isDuplicateAlertName(alertData.name, editing.id)) throw new Error('Alert name must be unique.')
            const res = await fetch(`/api/saved-searches/${editing.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: alertData.name, description: alertData.description, subscription_enabled: true, frequency: alertData.frequency, recipients: alertData.recipients, email_notification: alertData.email_notification ?? true, send_empty_results: alertData.send_empty_results ?? false, max_results: alertData.max_results || 100, delivery_time: alertData.delivery_time || null, export_format: (alertData.file_format || 'csv').toUpperCase(), include_links: alertData.include_links ?? true }) })
            if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed to update alert.') }
            await fetchSubscriptions(); setShowEditModal(false); setEditing(null)
          }}
        />
      )}

      {/* Run Confirm Modal */}
      {runConfirmId && (() => {
        const alert = subscriptions.find(s => s.id === runConfirmId)
        const recipientList = alert?.recipients?.split(',').map(r => r.trim()) || []
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden border border-slate-200">
              <div className="bg-gradient-to-r from-cyan-600 to-blue-600 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 rounded-xl p-2"><PlayCircle className="h-6 w-6 text-white" /></div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Run Alert Now</h3>
                      <p className="text-blue-100 text-sm">&quot;{runningAlertName || alert?.name}&quot;</p>
                    </div>
                  </div>
                  <button onClick={() => { setRunConfirmId(null); setRunningAlertName('') }} className="text-white/80 hover:text-white p-2 hover:bg-white/10 rounded-xl"><X className="h-5 w-5" /></button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-slate-600 text-sm">This will search SAM.gov and email results to {recipientList.length} recipient{recipientList.length !== 1 ? 's' : ''} immediately.</p>
                {recipientList.length > 0 && (
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
                    {recipientList.map((email, i) => <div key={i} className="flex items-center gap-2 text-sm"><Mail className="h-4 w-4 text-slate-400" /><span className="text-slate-700">{email}</span></div>)}
                  </div>
                )}
              </div>
              <div className="px-6 pb-6 flex gap-3">
                <button onClick={() => { setRunConfirmId(null); setRunningAlertName('') }} className="flex-1 px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors">Cancel</button>
                <button onClick={() => runNow(runConfirmId)} disabled={busyId === runConfirmId} className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg hover:opacity-90 transition-all">
                  {busyId === runConfirmId ? <><Loader2 className="h-4 w-4 animate-spin" /> Running...</> : <><PlayCircle className="h-4 w-4" /> Run Now</>}
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Delete Confirm Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-6 border border-slate-200">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 rounded-xl bg-red-100"><Trash2 className="h-5 w-5 text-red-600" /></div>
              <div><h3 className="text-lg font-bold text-slate-800">Delete Alert</h3><p className="text-sm text-slate-500 mt-0.5">This will permanently delete the alert. This cannot be undone.</p></div>
              <button onClick={() => setDeleteConfirmId(null)} className="ml-auto text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteConfirmId(null)} className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm">Cancel</button>
              <button onClick={() => deleteSubscription(deleteConfirmId)} disabled={busyId === deleteConfirmId} className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm disabled:opacity-50 flex items-center gap-2">
                {busyId === deleteConfirmId ? <><Loader2 className="w-4 h-4 animate-spin" />Deleting...</> : <><Trash2 className="w-4 h-4" />Delete</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Alert Modal */}
      {viewingAlert && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">Alert Details</h2>
              <button onClick={() => setViewingAlert(null)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div><p className="text-xs text-slate-500 mb-1">Name</p><p className="font-bold text-slate-800 text-lg">{viewingAlert.name}</p></div>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-slate-500 mb-1">Status</p><p className={`font-semibold ${viewingAlert.active ? 'text-emerald-600' : 'text-yellow-600'}`}>{viewingAlert.active ? '● Active' : '⏸ Paused'}</p></div>
                <div><p className="text-xs text-slate-500 mb-1">Frequency</p><p className="font-semibold text-slate-700">{freqLabel(viewingAlert.frequency)}</p></div>
                <div><p className="text-xs text-slate-500 mb-1">Last Run</p><p className="font-semibold text-slate-700">{formatRelative(viewingAlert.last_run_at)}</p></div>
                <div><p className="text-xs text-slate-500 mb-1">Last Results</p><p className="font-semibold text-slate-700">{viewingAlert.last_result_count ?? '—'}</p></div>
              </div>
              {viewingAlert.recipients && (
                <div><p className="text-xs text-slate-500 mb-1">Recipients</p><p className="text-sm text-slate-700">{viewingAlert.recipients}</p></div>
              )}
              {viewingAlert.savedSearch?.keywords && (
                <div><p className="text-xs text-slate-500 mb-1">Keywords</p><p className="text-sm text-slate-700">{viewingAlert.savedSearch.keywords}</p></div>
              )}
              <div className="pt-2 flex gap-3">
                <button onClick={() => { startEditingAlert(viewingAlert); setViewingAlert(null) }} className="flex-1 px-4 py-2 rounded-xl bg-orange-100 hover:bg-orange-200 text-orange-700 font-semibold text-sm flex items-center justify-center gap-2"><Edit className="w-4 h-4" />Edit</button>
                <button onClick={() => { setRunConfirmId(viewingAlert.id); setRunningAlertName(viewingAlert.name); setViewingAlert(null) }} className="flex-1 px-4 py-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-semibold text-sm flex items-center justify-center gap-2"><PlayCircle className="w-4 h-4" />Run Now</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Run Success Notification */}
      {runSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-500 to-green-500 p-6 text-center">
              <CheckCircle className="h-12 w-12 text-white mx-auto mb-2" />
              <h3 className="text-xl font-bold text-white">Alert Executed!</h3>
              <p className="text-emerald-100 text-sm mt-1">{runSuccess.count} results found</p>
            </div>
            <div className="p-6 space-y-3">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-sm">
                <p className="text-slate-500 mb-0.5">Alert</p>
                <p className="font-bold text-slate-800">{runSuccess.alertName}</p>
              </div>
              {runSuccess.email_sent && <p className="text-sm text-emerald-600 font-medium text-center">✓ Results emailed to {runSuccess.recipients.length} recipient{runSuccess.recipients.length !== 1 ? 's' : ''}</p>}
              <button onClick={() => setRunSuccess(null)} className="w-full px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ManageAlertsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-orange-50 flex items-center justify-center"><Loader2 className="h-8 w-8 text-orange-500 animate-spin" /></div>}>
      <ManageAlertsContent />
    </Suspense>
  )
}