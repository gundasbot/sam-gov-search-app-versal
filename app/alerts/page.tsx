// app/alerts/page.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Bell,
  Filter,
  Plus,
  Search,
  Mail,
  Calendar,
  Zap,
  PlayCircle,
  PauseCircle,
  Trash2,
  Edit,
  Loader2,
  CheckCircle,
  AlertCircle,
  X,
  Copy,
  Eye,
  FileText,
} from 'lucide-react'
import SearchAlertModal, {
  type CurrentSearch,
  type SearchAlert,
  type AlertFrequency,
  type FileFormat,
} from '@/components/SearchAlertModal'

// Types
interface SavedSearch {
  id: string
  name: string
  description?: string | null
  keywords?: string | null
  naics?: string | null
  agency?: string | null
  setAside?: string | null
  stateOfPerformance?: string | null
  procurementType?: string | null
  postedAfter?: string | null
  postedBefore?: string | null
  useCount?: number
  lastUsedAt?: string | null
  createdAt?: string
  _count?: {
    alertSubscriptions?: number
  }
}

interface AlertSubscription {
  id: string
  name: string
  description?: string | null
  frequency: AlertFrequency
  active: boolean
  recipients: string
  fileFormat?: FileFormat | null
  exportFormat?: string | null
  includeLinks: boolean
  sendEmptyResults: boolean
  maxResults: number
  deliveryTime?: string | null
  savedSearch: {
    id: string
    name: string
    keywords?: string | null
    naics?: string | null
    agency?: string | null
    setAside?: string | null
    stateOfPerformance?: string | null
    procurementType?: string | null
    postedAfter?: string | null
    postedBefore?: string | null
  }
  lastRunAt?: string | null
  lastResultCount?: number | null
  createdAt?: string
  emailNotification?: boolean
}

// Utility functions
function clsx(...classes: Array<string | boolean | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function formatRelative(dateString?: string | null) {
  if (!dateString) return 'Never'
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return date.toLocaleDateString()
}

function freqLabel(f: AlertFrequency) {
  if (f === 'AS_CHANGES') return 'Real-time'
  if (f === 'DAILY') return 'Daily'
  if (f === 'WEEKLY') return 'Weekly'
  if (f === 'MONTHLY') return 'Monthly'
  if (f === 'MANUAL') return 'Manual'
  return f
}

function freqIcon(f: AlertFrequency) {
  if (f === 'AS_CHANGES') return <Zap className="h-4 w-4" />
  return <Calendar className="h-4 w-4" />
}

function freqChipClass(f: AlertFrequency) {
  switch (f) {
    case 'AS_CHANGES':
      return 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20'
    case 'DAILY':
      return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
    case 'WEEKLY':
      return 'text-blue-400 bg-blue-400/10 border-blue-400/20'
    case 'MONTHLY':
      return 'text-purple-400 bg-purple-400/10 border-purple-400/20'
    default:
      return 'text-slate-400 bg-slate-400/10 border-slate-400/20'
  }
}

export default function AlertsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'alerts' | 'searches'>('alerts')
  const [searches, setSearches] = useState<SavedSearch[]>([])
  const [subscriptions, setSubscriptions] = useState<AlertSubscription[]>([])
  const [busyId, setBusyId] = useState<string | null>(null)
  const [toast, setToast] = useState<{
    type: 'success' | 'error' | 'info'
    message: string
  } | null>(null)

  // Edit modal state
  const [editing, setEditing] = useState<AlertSubscription | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  // Confirm run modal
  const [runConfirmId, setRunConfirmId] = useState<string | null>(null)

  // Confirm delete modal
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // Delete saved search modal
  const [deleteSearchConfirmId, setDeleteSearchConfirmId] = useState<string | null>(null)

  // Create alert from saved search modal
  const [createAlertFromSearch, setCreateAlertFromSearch] = useState<SavedSearch | null>(null)
  const [showCreateAlertModal, setShowCreateAlertModal] = useState(false)

  // View alerts using this search modal
  const [viewAlertsForSearch, setViewAlertsForSearch] = useState<SavedSearch | null>(null)
  const [showAlertsModal, setShowAlertsModal] = useState(false)

  const activeCount = useMemo(() => subscriptions.filter((s) => s.active).length, [subscriptions])
  const pausedCount = useMemo(() => subscriptions.filter((s) => !s.active).length, [subscriptions])
  const deliveredCount = useMemo(() => subscriptions.reduce((acc, s) => acc + (s.lastResultCount || 0), 0), [subscriptions])

  useEffect(() => {
    void fetchAll()
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

  async function fetchAll() {
    try {
      setLoading(true)
      const [searchesRes, subsRes] = await Promise.all([
        fetch('/api/saved-searches'), // ✅ Changed from /api/saved-searches-v2
        fetch('/api/saved-searches?subscribed=true'), // ✅ Changed from /api/alert-subscriptions
      ])

      if (searchesRes.ok) {
        const j = await searchesRes.json()
        setSearches(j.searches || [])
      }

      if (subsRes.ok) {
        const j = await subsRes.json()
        // Transform the response to match AlertSubscription interface
        const formatted = (j.searches || []).map((sub: any) => ({
          id: sub.id,
          name: sub.name,
          description: sub.description,
          frequency: sub.frequency,
          active: sub.subscriptionEnabled,
          recipients: sub.recipients,
          fileFormat: sub.exportFormat,
          exportFormat: sub.exportFormat,
          includeLinks: sub.includeLinks,
          sendEmptyResults: sub.sendEmptyResults,
          maxResults: sub.maxResults,
          deliveryTime: sub.deliveryTime,
          emailNotification: sub.emailNotification,
          lastRunAt: sub.lastRunAt,
          lastResultCount: sub.lastResultCount,
          createdAt: sub.createdAt,
          savedSearch: {
            id: sub.id,
            name: sub.name,
            keywords: sub.keywords,
            naics: sub.naics,
            agency: sub.agency,
            setAside: sub.setAside,
            stateOfPerformance: sub.stateOfPerformance,
            procurementType: sub.procurementType,
            postedAfter: sub.postedAfter,
            postedBefore: sub.postedBefore,
          },
        }))
        setSubscriptions(formatted)
      }
    } catch (e) {
      console.error(e)
      setToast({ type: 'error', message: 'Failed to load alerts. Please refresh.' })
    } finally {
      setLoading(false)
    }
  }

  // Clear browsing timer before navigation
  function pushToSearchWithSavedSearch(savedSearchId: string) {
    localStorage.removeItem('browsingStartTime')
    router.push(`/search?loadSavedSearch=${encodeURIComponent(savedSearchId)}&run=1&from=alerts`)
  }

  // Navigate to search page for editing without running
  function editSavedSearch(savedSearchId: string) {
    localStorage.removeItem('browsingStartTime')
    router.push(`/search?loadSavedSearch=${encodeURIComponent(savedSearchId)}&edit=1&from=alerts`)
  }

  // Delete saved search
  async function deleteSavedSearch(id: string) {
    try {
      setBusyId(id)
      const res = await fetch(`/api/saved-searches/${id}`, { method: 'DELETE' }) // ✅ Already correct
      const j = await res.json().catch(() => ({}))

      if (!res.ok) {
        setToast({ type: 'error', message: j?.error || 'Failed to delete saved search.' })
        return
      }

      setSearches((prev) => prev.filter((s) => s.id !== id))
      setToast({ type: 'success', message: 'Saved search deleted' })
    } catch (e) {
      console.error(e)
      setToast({ type: 'error', message: 'Failed to delete saved search.' })
    } finally {
      setBusyId(null)
      setDeleteSearchConfirmId(null)
    }
  }

  // Duplicate saved search
  async function duplicateSavedSearch(id: string) {
    try {
      setBusyId(id)
      const search = searches.find((s) => s.id === id)
      if (!search) return

      const res = await fetch('/api/saved-searches', { // ✅ Already correct
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${search.name} (Copy)`,
          description: search.description,
          keywords: search.keywords,
          naics: search.naics,
          agency: search.agency,
          setAside: search.setAside,
          stateOfPerformance: search.stateOfPerformance,
          procurementType: search.procurementType,
          postedAfter: search.postedAfter,
          postedBefore: search.postedBefore,
        }),
      })
      const j = await res.json().catch(() => ({}))

      if (!res.ok) {
        setToast({ type: 'error', message: j?.error || 'Failed to duplicate search.' })
        return
      }

      setSearches((prev) => [j.search, ...prev])
      setToast({ type: 'success', message: 'Search duplicated successfully' })
    } catch (e) {
      console.error(e)
      setToast({ type: 'error', message: 'Failed to duplicate search.' })
    } finally {
      setBusyId(null)
    }
  }

  // Get alerts using this saved search
  const getAlertsForSearch = useMemo(() => {
    return (searchId: string) => {
      return subscriptions.filter((s) => s.savedSearch.id === searchId)
    }
  }, [subscriptions])

  // Toggle alert subscription (pause/activate)
  async function toggleSubscription(id: string) {
    try {
      setBusyId(id)
      const res = await fetch(`/api/saved-searches/${id}/toggle`, { method: 'POST' }) // ✅ Changed from /api/alert-subscriptions/${id}/toggle
      const j = await res.json().catch(() => ({}))

      if (!res.ok) {
        setToast({ type: 'error', message: j?.error || 'Failed to update alert.' })
        return
      }

      setSubscriptions((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, active: j?.search?.subscriptionEnabled ?? !s.active } : s
        )
      )
      setToast({ type: 'success', message: j?.search?.subscriptionEnabled ?? true ? 'Alert activated' : 'Alert paused' })
    } catch (e) {
      console.error(e)
      setToast({ type: 'error', message: 'Failed to update alert.' })
    } finally {
      setBusyId(null)
    }
  }

  // Run alert now
  async function runNow(id: string) {
    try {
      setBusyId(id)
      const subscription = subscriptions.find((s) => s.id === id)
      const subscriptionName = subscription?.name || 'Alert'

      const res = await fetch(`/api/saved-searches/${id}/run`, { method: 'POST' }) // ✅ Changed from /api/alert-subscriptions/${id}/run-now
      const j = await res.json().catch(() => ({}))

      if (!res.ok) {
        setToast({ type: 'error', message: j?.error || 'Failed to run alert.' })
        return
      }

      // Update the subscription state
      setSubscriptions((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                lastRunAt: j?.search?.lastRunAt || new Date().toISOString(),
                lastResultCount: j?.search?.lastResultCount ?? s.lastResultCount ?? 0,
              }
            : s
        )
      )

      const resultCount = j?.resultCount ?? 0
      const recipients = subscription?.recipients?.split(',').length || 1

      setToast({
        type: 'success',
        message: `${subscriptionName} executed! Found ${resultCount} result${resultCount !== 1 ? 's' : ''}. Sending to ${recipients} recipient${recipients !== 1 ? 's' : ''}.`,
      })
    } catch (e) {
      console.error(e)
      setToast({ type: 'error', message: 'Failed to run alert. Please try again.' })
    } finally {
      setBusyId(null)
      setRunConfirmId(null)
    }
  }

  // Delete subscription
  async function deleteSubscription(id: string) {
    try {
      setBusyId(id)
      const res = await fetch(`/api/saved-searches/${id}`, { method: 'DELETE' }) // ✅ Changed from /api/alert-subscriptions/${id}
      const j = await res.json().catch(() => ({}))

      if (!res.ok) {
        setToast({ type: 'error', message: j?.error || 'Failed to delete alert.' })
        return
      }

      setSubscriptions((prev) => prev.filter((s) => s.id !== id))
      setToast({ type: 'success', message: 'Alert deleted' })
    } catch (e) {
      console.error(e)
      setToast({ type: 'error', message: 'Failed to delete alert.' })
    } finally {
      setBusyId(null)
      setDeleteConfirmId(null)
    }
  }

  // Save edited alert
  async function saveEditedAlert(alertData: SearchAlert) {
    if (!editing) return

    const id = editing.id

    try {
      setBusyId(id)
      const res = await fetch(`/api/saved-searches/${id}`, { // ✅ Changed from /api/alert-subscriptions/${id}
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: alertData.name,
          description: alertData.description,
          recipients: alertData.recipients,
          frequency: alertData.frequency,
          emailNotification: alertData.emailNotification ?? true,
          fileFormat: alertData.fileFormat || 'csv',
          includeLinks: alertData.includeLinks ?? true,
          sendEmptyResults: alertData.sendEmptyResults ?? false,
          maxResults: alertData.maxResults || 100,
          deliveryTime: alertData.deliveryTime,
        }),
      })
      const j = await res.json().catch(() => ({}))

      if (!res.ok) {
        setToast({ type: 'error', message: j?.error || 'Failed to update alert.' })
        return
      }

      setSubscriptions((prev) =>
        prev.map((s) =>
          s.id === id ? { ...s, ...j.search, active: j.search.subscriptionEnabled } : s
        )
      )
      setToast({ type: 'success', message: `Alert "${alertData.name}" updated successfully!` })
      setShowEditModal(false)
      setEditing(null)
    } catch (e) {
      console.error(e)
      setToast({ type: 'error', message: 'Failed to update alert.' })
    } finally {
      setBusyId(null)
    }
  }

  const editingCurrentSearch: CurrentSearch | undefined = useMemo(() => {
    if (!editing?.savedSearch) return undefined
    const s = editing.savedSearch
    return {
      keywords: s.keywords || undefined,
      naics: s.naics || undefined,
      agency: s.agency || undefined,
      setAside: s.setAside || undefined,
      stateOfPerformance: s.stateOfPerformance || undefined,
      procurementType: s.procurementType || undefined,
      postedAfter: s.postedAfter || undefined,
      postedBefore: s.postedBefore || undefined,
    }
  }, [editing])

  const editInitialAlert: SearchAlert | undefined = useMemo(() => {
    if (!editing) return undefined
    return {
      name: editing.name,
      description: editing.description || undefined,
      frequency: editing.frequency,
      emailNotification: editing.emailNotification ?? true,
      fileFormat: (editing.exportFormat || editing.fileFormat) as FileFormat || 'csv',
      includeLinks: editing.includeLinks,
      sendEmptyResults: editing.sendEmptyResults,
      maxResults: editing.maxResults,
      deliveryTime: editing.deliveryTime || undefined,
      recipients: editing.recipients,
    }
  }, [editing])

  const busy = busyId !== null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Enhanced Toast Notifications */}
      {toast && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 pointer-events-none">
          <div
            className={clsx(
              'relative w-full max-w-2xl mx-4 rounded-2xl shadow-2xl backdrop-blur-xl border-2 pointer-events-auto',
              'animate-in fade-in slide-in-from-top-5 duration-500',
              toast.type === 'success' && 'border-emerald-500/50 bg-gradient-to-br from-emerald-950/95 to-emerald-900/95',
              toast.type === 'error' && 'border-rose-500/50 bg-gradient-to-br from-rose-950/95 to-rose-900/95',
              toast.type === 'info' && 'border-blue-500/50 bg-gradient-to-br from-blue-950/95 to-blue-900/95'
            )}
          >
            <div className="relative p-6">
              <div className="flex items-start gap-4">
                <div
                  className={clsx(
                    'flex-shrink-0 p-3 rounded-2xl',
                    toast.type === 'success' && 'bg-emerald-500/20',
                    toast.type === 'error' && 'bg-rose-500/20',
                    toast.type === 'info' && 'bg-blue-500/20'
                  )}
                >
                  {toast.type === 'success' && <CheckCircle className="h-8 w-8 text-emerald-400" />}
                  {toast.type === 'error' && <AlertCircle className="h-8 w-8 text-rose-400" />}
                  {toast.type === 'info' && <Bell className="h-8 w-8 text-blue-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3
                    className={clsx(
                      'text-lg font-bold mb-1',
                      toast.type === 'success' && 'text-emerald-300',
                      toast.type === 'error' && 'text-rose-300',
                      toast.type === 'info' && 'text-blue-300'
                    )}
                  >
                    {toast.type === 'success' && 'Success!'}
                    {toast.type === 'error' && 'Error'}
                    {toast.type === 'info' && 'Information'}
                  </h3>
                  <p
                    className={clsx(
                      'text-base leading-relaxed',
                      toast.type === 'success' && 'text-emerald-100',
                      toast.type === 'error' && 'text-rose-100',
                      toast.type === 'info' && 'text-blue-100'
                    )}
                  >
                    {toast.message}
                  </p>
                </div>
                <button
                  onClick={() => setToast(null)}
                  className={clsx(
                    'flex-shrink-0 p-2 rounded-lg transition-colors',
                    toast.type === 'success' && 'hover:bg-emerald-500/20 text-emerald-300',
                    toast.type === 'error' && 'hover:bg-rose-500/20 text-rose-300',
                    toast.type === 'info' && 'hover:bg-blue-500/20 text-blue-300'
                  )}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="mx-auto max-w-[1800px] px-6 lg:px-10 xl:px-12 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Alert Manager</h1>
              <p className="text-slate-300 mt-2">Automate notifications and jump back into search instantly.</p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/search"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white transition-all border border-slate-600 font-semibold"
              >
                <Search className="w-5 h-5" />
                New Search
              </Link>
              <Link
                href="/search"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:opacity-90 transition-all font-semibold shadow-lg shadow-emerald-500/20"
              >
                <Plus className="w-5 h-5" />
                Create Alert
              </Link>
            </div>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
          <div className="rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-800 to-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-300">Alert Subscriptions</p>
                <p className="mt-2 text-3xl font-bold text-white">{subscriptions.length}</p>
                <p className="mt-1 text-sm text-slate-400">
                  {activeCount} running, {pausedCount} paused
                </p>
              </div>
              <div className="rounded-full bg-emerald-500/10 p-3">
                <Bell className="h-8 w-8 text-emerald-400" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-800 to-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-300">Saved Searches</p>
                <p className="mt-2 text-3xl font-bold text-white">{searches.length}</p>
                <p className="mt-1 text-sm text-slate-400">Run instantly from Alerts</p>
              </div>
              <div className="rounded-full bg-cyan-500/10 p-3">
                <Filter className="h-8 w-8 text-cyan-400" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-800 to-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-300">Results Delivered</p>
                <p className="mt-2 text-3xl font-bold text-white">{deliveredCount}</p>
                <p className="mt-1 text-sm text-slate-400">Based on last runs</p>
              </div>
              <div className="rounded-full bg-purple-500/10 p-3">
                <Mail className="h-8 w-8 text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 rounded-xl bg-slate-900/50 border border-slate-700 p-1">
          <button
            onClick={() => setActiveTab('alerts')}
            className={clsx(
              'flex-1 rounded-lg px-6 py-3 text-sm font-semibold transition-all',
              activeTab === 'alerts'
                ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg'
                : 'text-slate-300 hover:text-white'
            )}
          >
            <div className="flex items-center justify-center gap-2">
              <Bell className="h-4 w-4" />
              Alert Subscriptions
              <span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-xs">{subscriptions.length}</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('searches')}
            className={clsx(
              'flex-1 rounded-lg px-6 py-3 text-sm font-semibold transition-all',
              activeTab === 'searches'
                ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg'
                : 'text-slate-300 hover:text-white'
            )}
          >
            <div className="flex items-center justify-center gap-2">
              <Filter className="h-4 w-4" />
              Saved Searches
              <span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-xs">{searches.length}</span>
            </div>
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-emerald-400" />
          </div>
        ) : activeTab === 'alerts' ? (
          // Alert Subscriptions tab
          <div className="space-y-4">
            {subscriptions.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-slate-700 rounded-2xl bg-slate-900/50">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-800 flex items-center justify-center">
                  <Bell className="w-10 h-10 text-slate-600" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No alert subscriptions yet</h3>
                <p className="text-slate-300 mb-6 max-w-md mx-auto">
                  Create your first alert to get automated email notifications.
                </p>
                <Link
                  href="/search"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:opacity-90 transition-all font-semibold"
                >
                  <Plus className="w-5 h-5" />
                  Create Alert
                </Link>
              </div>
            ) : (
              subscriptions.map((alert) => {
                const running = alert.active
                return (
                  <div
                    key={alert.id}
                    className="bg-gradient-to-br from-slate-800 to-slate-700 border border-slate-700 rounded-2xl p-6 hover:border-slate-600 transition-all"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                      {/* Info */}
                      <div className="flex-1">
                        <div className="flex items-start gap-3 mb-4">
                          <div className={clsx('p-2 rounded-lg', running ? 'bg-emerald-500/10' : 'bg-slate-800')}>
                            {running ? (
                              <Bell className="h-5 w-5 text-emerald-400" />
                            ) : (
                              <Bell className="h-5 w-5 text-slate-500" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-lg font-semibold text-white">{alert.name}</h3>
                              <span className={clsx('px-2 py-0.5 rounded-full border text-xs font-semibold', freqChipClass(alert.frequency))}>
                                <span className="flex items-center gap-1">
                                  {freqIcon(alert.frequency)}
                                  {freqLabel(alert.frequency)}
                                </span>
                              </span>
                              {!running && (
                                <span className="px-2 py-0.5 rounded-full border border-slate-600 bg-slate-700/50 text-slate-300 text-xs font-semibold">
                                  Paused
                                </span>
                              )}
                            </div>
                            {alert.description && <p className="text-sm text-slate-300 mb-3">{alert.description}</p>}

                            {/* Saved Search Info */}
                            <div className="rounded-xl bg-slate-900/50 border border-slate-700 p-4 mb-3">
                              <div className="flex items-center gap-2 mb-2">
                                <Filter className="h-4 w-4 text-slate-400" />
                                <p className="text-sm text-slate-400">Saved Search</p>
                              </div>
                              <p className="text-slate-200 font-medium">{alert.savedSearch?.name}</p>
                              {alert.savedSearch?.keywords && (
                                <p className="text-sm text-slate-300">Keywords: {alert.savedSearch.keywords}</p>
                              )}
                            </div>

                            {/* Delivery details */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-slate-400 mb-1">Recipients</p>
                                <p className="text-slate-200 font-medium">
                                  {alert.recipients.split(',').length} email{alert.recipients.split(',').length > 1 ? 's' : ''}
                                </p>
                              </div>
                              <div>
                                <p className="text-slate-400 mb-1">Last Run</p>
                                <p className="text-slate-200 font-medium">{formatRelative(alert.lastRunAt)}</p>
                              </div>
                              <div>
                                <p className="text-slate-400 mb-1">Format</p>
                                <p className="text-slate-200 font-medium">{(alert.exportFormat || alert.fileFormat || 'CSV').toUpperCase()}</p>
                              </div>
                              <div>
                                <p className="text-slate-400 mb-1">Last Results</p>
                                <span className="text-slate-200 font-medium">
                                  {alert.lastResultCount !== null && alert.lastResultCount !== undefined
                                    ? `${alert.lastResultCount} ${alert.lastResultCount === 1 ? 'result' : 'results'}`
                                    : '-'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => pushToSearchWithSavedSearch(alert.savedSearch.id)}
                          disabled={busy}
                          className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-2"
                          title="Open Search and run this Saved Search immediately"
                        >
                          <Search className="w-4 h-4" />
                          <span className="hidden sm:inline">Search</span>
                        </button>

                        <button
                          onClick={() => setRunConfirmId(alert.id)}
                          disabled={busy}
                          className="px-3 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/20 transition-colors flex items-center gap-2"
                          title="Run this alert right now (sends email)"
                        >
                          <PlayCircle className="w-4 h-4" />
                          <span className="hidden sm:inline">Run now</span>
                        </button>

                        <button
                          onClick={() => toggleSubscription(alert.id)}
                          disabled={busy}
                          className={clsx(
                            'px-3 py-2 rounded-xl border transition-colors flex items-center gap-2',
                            running
                              ? 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-300 border-orange-500/20'
                              : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/20'
                          )}
                          title={running ? 'Pause this alert' : 'Activate this alert'}
                        >
                          {busy && busyId === alert.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : running ? (
                            <PauseCircle className="w-4 h-4" />
                          ) : (
                            <PlayCircle className="w-4 h-4" />
                          )}
                          <span className="hidden sm:inline">{running ? 'Pause' : 'Activate'}</span>
                        </button>

                        <button
                          onClick={() => {
                            setEditing(alert)
                            setShowEditModal(true)
                          }}
                          disabled={busy}
                          className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-2"
                          title="Edit alert settings"
                        >
                          <Edit className="w-4 h-4" />
                          <span className="hidden sm:inline">Edit</span>
                        </button>

                        <button
                          onClick={() => setDeleteConfirmId(alert.id)}
                          disabled={busy}
                          className="px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-200 border border-red-500/20 transition-colors flex items-center gap-2"
                          title="Delete alert"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        ) : (
          // Saved Searches tab
          <div className="space-y-4">
            {searches.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-slate-700 rounded-2xl bg-slate-900/50">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-800 flex items-center justify-center">
                  <Filter className="w-10 h-10 text-slate-600" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No saved searches yet</h3>
                <p className="text-slate-300 mb-6 max-w-md mx-auto">Save a search from the Search page to reuse it later.</p>
                <Link
                  href="/search"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:opacity-90 transition-all font-semibold"
                >
                  <Plus className="w-5 h-5" />
                  Go to Search
                </Link>
              </div>
            ) : (
              searches.map((search) => {
                const alertsUsingThisSearch = getAlertsForSearch(search.id)
                const hasActiveAlerts = alertsUsingThisSearch.some((a) => a.active)

                return (
                  <div
                    key={search.id}
                    className="bg-gradient-to-br from-slate-800 to-slate-700 border border-slate-700 rounded-2xl p-6 hover:border-slate-600 transition-all"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                      {/* Search Info */}
                      <div className="flex-1">
                        <div className="flex items-start gap-3 mb-4">
                          <div className="p-2 rounded-lg bg-slate-800">
                            <Filter className="h-5 w-5 text-cyan-400" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-lg font-semibold text-white">{search.name}</h3>
                              {search._count?.alertSubscriptions && search._count.alertSubscriptions > 0 && (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 text-xs font-semibold">
                                  {search._count.alertSubscriptions} alert{search._count.alertSubscriptions !== 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                            {search.description && <p className="text-sm text-slate-300 mb-3">{search.description}</p>}

                            {/* Search Criteria Summary */}
                            <div className="rounded-xl bg-slate-900/50 border border-slate-700 p-4 mb-3">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {search.keywords && (
                                  <div>
                                    <p className="text-sm text-slate-400 mb-1">Keywords</p>
                                    <p className="text-slate-200 font-medium">{search.keywords}</p>
                                  </div>
                                )}
                                {search.naics && (
                                  <div>
                                    <p className="text-sm text-slate-400 mb-1">NAICS</p>
                                    <p className="text-slate-200 font-medium">{search.naics}</p>
                                  </div>
                                )}
                                {search.agency && (
                                  <div>
                                    <p className="text-sm text-slate-400 mb-1">Agency</p>
                                    <p className="text-slate-200 font-medium">{search.agency}</p>
                                  </div>
                                )}
                                {search.stateOfPerformance && (
                                  <div>
                                    <p className="text-sm text-slate-400 mb-1">State</p>
                                    <p className="text-slate-200 font-medium">{search.stateOfPerformance}</p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-slate-400 mb-1">Used</p>
                                <p className="text-slate-200 font-medium">{search.useCount || 0} times</p>
                              </div>
                              <div>
                                <p className="text-slate-400 mb-1">Last Used</p>
                                <p className="text-slate-200 font-medium">{formatRelative(search.lastUsedAt)}</p>
                              </div>
                              <div>
                                <p className="text-slate-400 mb-1">Created</p>
                                <p className="text-slate-200 font-medium">{formatRelative(search.createdAt)}</p>
                              </div>
                              <div>
                                <p className="text-slate-400 mb-1">Alerts Status</p>
                                <p className="text-slate-200 font-medium">
                                  {hasActiveAlerts ? (
                                    <span className="text-emerald-400 flex items-center gap-1">
                                      <Bell className="h-3 w-3" />
                                      Active
                                    </span>
                                  ) : alertsUsingThisSearch.length > 0 ? (
                                    <span className="text-orange-400 flex items-center gap-1">
                                      <PauseCircle className="h-3 w-3" />
                                      Paused
                                    </span>
                                  ) : (
                                    <span className="text-slate-400">No alerts</span>
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2">
                        {/* Primary Action */}
                        <button
                          onClick={() => pushToSearchWithSavedSearch(search.id)}
                          disabled={busy}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:opacity-90 transition-all font-semibold flex items-center justify-center gap-2"
                          title="Run this search now"
                        >
                          {busyId === search.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <PlayCircle className="w-4 h-4" />
                          )}
                          <span>Run Search</span>
                        </button>

                        {/* Secondary Actions */}
                        <button
                          onClick={() => editSavedSearch(search.id)}
                          disabled={busy}
                          className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-2"
                          title="Edit this saved search"
                        >
                          <Edit className="w-4 h-4" />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => duplicateSavedSearch(search.id)}
                          disabled={busy}
                          className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-2"
                          title="Duplicate this search"
                        >
                          <Copy className="w-4 h-4" />
                          <span>Duplicate</span>
                        </button>

                        <button
                          onClick={() => {
                            setCreateAlertFromSearch(search)
                            setShowCreateAlertModal(true)
                          }}
                          disabled={busy}
                          className="px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 transition-colors flex items-center gap-2"
                          title="Create alert from this search"
                        >
                          <Bell className="w-4 h-4" />
                          <span>Alert</span>
                        </button>

                        {/* Alert Management */}
                        {alertsUsingThisSearch.length > 0 && (
                          <button
                            onClick={() => {
                              setViewAlertsForSearch(search)
                              setShowAlertsModal(true)
                            }}
                            className="px-3 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/20 transition-colors flex items-center gap-2"
                            title="View and manage alerts using this search"
                          >
                            <Eye className="w-4 h-4" />
                            <span>View Alerts ({alertsUsingThisSearch.length})</span>
                          </button>
                        )}

                        {/* Danger Zone */}
                        <button
                          onClick={() => setDeleteSearchConfirmId(search.id)}
                          disabled={busy}
                          className="px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20 transition-colors flex items-center gap-2"
                          title="Delete this saved search"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>

      {/* Run confirm modal */}
      {runConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/90 backdrop-blur-xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Run Alert Now</h3>
                <p className="text-sm text-slate-300 mt-1">
                  This will execute the alert immediately and send results to the configured recipients.
                </p>
              </div>
              <button onClick={() => setRunConfirmId(null)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setRunConfirmId(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={() => runNow(runConfirmId)}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:opacity-90 text-white font-semibold flex items-center gap-2"
              >
                {busyId === runConfirmId ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
                Run now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete alert confirm modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/90 backdrop-blur-xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Delete Alert</h3>
                <p className="text-sm text-slate-300 mt-1">This will permanently delete the alert subscription.</p>
              </div>
              <button onClick={() => setDeleteConfirmId(null)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteSubscription(deleteConfirmId)}
                className="px-4 py-2 rounded-xl bg-red-500 hover:opacity-90 text-white font-semibold flex items-center gap-2"
              >
                {busyId === deleteConfirmId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Saved Search Confirmation Modal */}
      {deleteSearchConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/90 backdrop-blur-xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Delete Saved Search</h3>
                <p className="text-sm text-slate-300 mt-1">
                  This will permanently delete the saved search. Any alerts using this search will be disabled.
                </p>
              </div>
              <button onClick={() => setDeleteSearchConfirmId(null)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteSearchConfirmId(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteSavedSearch(deleteSearchConfirmId)}
                className="px-4 py-2 rounded-xl bg-red-500 hover:opacity-90 text-white font-semibold flex items-center gap-2"
              >
                {busyId === deleteSearchConfirmId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Alert from Search Modal */}
      {showCreateAlertModal && createAlertFromSearch && (
        <SearchAlertModal
          isOpen={showCreateAlertModal}
          onClose={() => {
            setShowCreateAlertModal(false)
            setCreateAlertFromSearch(null)
          }}
          currentSearch={{
            keywords: createAlertFromSearch.keywords || undefined,
            naics: createAlertFromSearch.naics || undefined,
            agency: createAlertFromSearch.agency || undefined,
            setAside: createAlertFromSearch.setAside || undefined,
            stateOfPerformance: createAlertFromSearch.stateOfPerformance || undefined,
            procurementType: createAlertFromSearch.procurementType || undefined,
            postedAfter: createAlertFromSearch.postedAfter || undefined,
            postedBefore: createAlertFromSearch.postedBefore || undefined,
          }}
          savedSearchId={createAlertFromSearch.id}
          onSave={async (alertData: SearchAlert) => {
            // Create alert subscription
            const res = await fetch('/api/saved-searches', { // ✅ Changed from /api/alert-subscriptions
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                // Use existing saved search filters
                ...createAlertFromSearch,
                // Override with alert settings
                name: alertData.name,
                description: alertData.description,
                recipients: alertData.recipients,
                frequency: alertData.frequency.toUpperCase(),
                emailNotification: alertData.emailNotification ?? true,
                fileFormat: alertData.fileFormat || 'csv',
                includeLinks: alertData.includeLinks ?? true,
                sendEmptyResults: alertData.sendEmptyResults ?? false,
                maxResults: alertData.maxResults || 100,
                deliveryTime: alertData.deliveryTime,
                subscriptionEnabled: true, // Enable subscription
              }),
            })

            if (!res.ok) {
              const errorData = await res.json()
              throw new Error(errorData.error || 'Failed to create alert')
            }

            await fetchAll()
            setShowCreateAlertModal(false)
            setCreateAlertFromSearch(null)
          }}
        />
      )}

      {/* View Alerts for Search Modal */}
      {showAlertsModal && viewAlertsForSearch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-slate-900/90 backdrop-blur-xl p-6">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white">Alerts Using "{viewAlertsForSearch.name}"</h3>
                <p className="text-sm text-slate-300 mt-1">Manage alerts that are based on this saved search</p>
              </div>
              <button
                onClick={() => {
                  setShowAlertsModal(false)
                  setViewAlertsForSearch(null)
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {getAlertsForSearch(viewAlertsForSearch.id).map((alert) => (
                <div key={alert.id} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-medium">{alert.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={clsx('px-2 py-0.5 rounded-full text-xs', alert.active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-400')}
                        >
                          {alert.active ? 'Active' : 'Paused'}
                        </span>
                        <span className={clsx('px-2 py-0.5 rounded-full border text-xs', freqChipClass(alert.frequency))}>
                          {freqLabel(alert.frequency)}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditing(alert)
                          setShowEditModal(true)
                          setShowAlertsModal(false)
                        }}
                        className="px-3 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => toggleSubscription(alert.id)}
                        className={clsx(
                          'px-3 py-1 rounded-lg text-sm',
                          alert.active ? 'bg-orange-500/20 hover:bg-orange-500/30 text-orange-300' : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300'
                        )}
                      >
                        {alert.active ? 'Pause' : 'Activate'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setCreateAlertFromSearch(viewAlertsForSearch)
                  setShowAlertsModal(false)
                  setShowCreateAlertModal(true)
                }}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:opacity-90 text-white font-semibold flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create New Alert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Alert Modal */}
      {editing && showEditModal && editingCurrentSearch && (
        <SearchAlertModal
          isOpen={showEditModal}
          onClose={() => {
            setEditing(null)
            setShowEditModal(false)
          }}
          currentSearch={editingCurrentSearch}
          savedSearchId={editing.savedSearch?.id}
          onSave={saveEditedAlert}
          initialAlert={editInitialAlert}
          mode="edit"
        />
      )}
    </div>
  )
}
