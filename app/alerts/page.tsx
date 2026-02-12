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
  Eye, 
  X,
  Copy,
  Save,
  Sparkles,
  TrendingUp,
} from 'lucide-react'

// SAM.gov API Constants
import {
  PROCUREMENT_TYPES,
  SET_ASIDE_CODES,
  US_STATES,
  EXPORT_FORMATS,
  ALERT_FREQUENCIES,
  getDefault6MonthRange as getDefault6MonthRangeFromConstants,
} from '@/lib/sam-gov-constants'

import UnifiedSaveSearchModal from '@/components/UnifiedSaveSearchModal'

// Type definitions
type CurrentSearch = {
  keywords?: string
  naics?: string
  agency?: string
  setAside?: string
  stateOfPerformance?: string
  procurementType?: string
  postedAfter?: string
}

type SearchAlert = {
  id?: string
  name: string
  description?: string
  frequency: AlertFrequency
  recipients: string
  email_notification?: boolean
  file_format?: FileFormat
  include_links?: boolean
  send_empty_results?: boolean
  max_results?: number
  delivery_time?: string
}

type AlertFrequency = 'AS_CHANGES' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'MANUAL'
type FileFormat = 'json' | 'csv' | 'excel'

// Types
interface SavedSearch {
  id: string
  name: string
  description?: string | null
  keywords?: string | null
  solnum?: string | null
  noticeid?: string | null
  naics?: string | null
  ccode?: string | null
  agency?: string | null
  organizationCode?: string | null
  setAside?: string | null
  stateOfPerformance?: string | null
  zip?: string | null
  status?: string | null
  opportunityStatus?: string | null
  procurementType?: string | null
  postedAfter?: string | null
  postedBefore?: string | null
  rdlfrom?: string | null
  rdlto?: string | null
  use_count?: number
  last_used_at?: string | null
  created_at?: string
  subscription_enabled?: boolean
  frequency?: string | null
  recipients?: string | null
  email_notification?: boolean
  send_empty_results?: boolean
  max_results?: number
  delivery_time?: string | null
  export_format?: string | null
  include_links?: boolean
  _count?: {
    runs: number
    exports: number
  }
}

interface AlertSubscription {
  id: string
  name: string
  description?: string | null
  frequency: AlertFrequency
  active: boolean
  recipients: string
  file_format?: FileFormat | null
  export_format?: string | null
  include_links: boolean
  send_empty_results: boolean
  max_results: number
  delivery_time?: string | null
  email_notification?: boolean
  last_run_at?: string | null
  last_result_count?: number | null
  created_at?: string
  savedSearch: {
    id: string
    name: string
    keywords?: string | null
    solnum?: string | null
    noticeid?: string | null
    naics?: string | null
    ncode?: string | null
    ccode?: string | null
    agency?: string | null
    organizationName?: string | null
    organizationCode?: string | null
    setAside?: string | null
    typeOfSetAside?: string | null
    stateOfPerformance?: string | null
    state?: string | null
    zip?: string | null
    status?: string | null
    opportunityStatus?: string | null
    procurementType?: string | null
    ptype?: string | null
    postedAfter?: string | null
    postedBefore?: string | null
    postedFrom?: string | null
    postedTo?: string | null
    rdlfrom?: string | null
    rdlto?: string | null
    limit?: number | null
  }
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

function normalizeApiFrequency(
  f: AlertFrequency | string | undefined | null
): 'DAILY' | 'WEEKLY' | 'MONTHLY' | null {
  if (!f) return null
  const upper = String(f).toUpperCase()
  if (upper === 'DAILY') return 'DAILY'
  if (upper === 'WEEKLY') return 'WEEKLY'
  if (upper === 'MONTHLY') return 'MONTHLY'
  return 'DAILY'
}

function toYmd(value?: string | null): string | null {
  if (!value) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString().slice(0, 10)
}

function formatDateInput(d: Date) {
  return d.toISOString().split('T')[0]
}

const MAX_POSTED_LOOKBACK_DAYS = 364

function addDays(d: Date, days: number) {
  const x = new Date(d)
  x.setDate(x.getDate() + days)
  return x
}

function subDays(d: Date, days: number) {
  return addDays(d, -days)
}

function addMonths(d: Date, months: number) {
  const x = new Date(d)
  x.setMonth(x.getMonth() + months)
  return x
}

function subMonths(d: Date, months: number) {
  return addMonths(d, -months)
}

function clampPostedFrom(date: Date, now: Date) {
  const min = subDays(now, MAX_POSTED_LOOKBACK_DAYS)
  return date < min ? min : date
}

function sanitizePostedFromYmd(ymd?: string | null) {
  if (!ymd) return null
  const now = new Date()
  const d = new Date(ymd)
  if (Number.isNaN(d.getTime())) return null
  return formatDateInput(clampPostedFrom(d, now))
}

// Quick presets
const MONTH_RANGE_PRESETS: Array<{ months: number; label: string }> = [
  { months: 1, label: '1Mo' },
  { months: 3, label: '3Mo' },
  { months: 6, label: '6Mo' },
  { months: 9, label: '9Mo' },
  { months: 12, label: '1Yr' },
]

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'archived', label: 'Archived' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'deleted', label: 'Deleted' },
]

function buildTimeOptions(stepMinutes = 15) {
  const out: Array<{ value: string; label: string }> = []
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += stepMinutes) {
      const hh = String(h).padStart(2, '0')
      const mm = String(m).padStart(2, '0')
      const value = `${hh}:${mm}`

      const hour12 = ((h + 11) % 12) + 1
      const ampm = h < 12 ? 'AM' : 'PM'
      const label = `${String(hour12).padStart(2, '0')}:${mm} ${ampm}`
      out.push({ value, label })
    }
  }
  return out
}

const DELIVERY_TIME_OPTIONS = buildTimeOptions(15)

function buildSearchUrlFromSavedSearch(saved: SavedSearch, opts?: { run?: boolean }) {
  const params = new URLSearchParams()
  params.set('loadSavedSearch', saved.id)
  params.set('from', 'alerts')
  if (opts?.run) params.set('run', '1')
  return `/search?${params.toString()}`
}

const LABEL_CLASS = 'block text-base font-extrabold text-orange-400 mb-1'

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

  // Inline editing for alert subscriptions
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null)
  const [editingAlert, setEditingAlert] = useState<AlertSubscription | null>(null)

  // Inline editing for saved searches
  const [expandedSearchId, setExpandedSearchId] = useState<string | null>(null)
  const [editingSearch, setEditingSearch] = useState<SavedSearch | null>(null)

  // New: Modal states for creating from alerts page
  const [showCreateSavedSearchModal, setShowCreateSavedSearchModal] = useState(false)
  const [showCreateSubscriptionModal, setShowCreateSubscriptionModal] = useState(false)
  const [runSuccess, setRunSuccess] = useState<{
    id: string
    alertName: string
    keywords: string
    count: number
    recipients: string[]
    timestamp: string
    frequency: string
    email_sent: boolean
  } | null>(null)
  const [runningAlertName, setRunningAlertName] = useState<string>('')
  const [abortController, setAbortController] = useState<AbortController | null>(null)
  
  // View modals for alerts and searches
  const [viewingAlert, setViewingAlert] = useState<AlertSubscription | null>(null)
  const [viewingSearch, setViewingSearch] = useState<SavedSearch | null>(null)

  const activeCount = useMemo(() => subscriptions.filter((s) => s.active).length, [subscriptions])
  const pausedCount = useMemo(() => subscriptions.filter((s) => !s.active).length, [subscriptions])
  const deliveredCount = useMemo(
    () => subscriptions.reduce((acc, s) => acc + (s.last_result_count || 0), 0),
    [subscriptions]
  )

  function isDuplicateAlertName(name: string, excludeId?: string) {
    const norm = (name || '').trim().toLowerCase()
    if (!norm) return false
    return subscriptions.some((s) => s.id !== excludeId && (s.name || '').trim().toLowerCase() === norm)
  }

  useEffect(() => {
    void fetchAll()
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

  // FIXED fetchAll function for page.tsx (around line 379)

async function fetchAll() {
  try {
    setLoading(true)
    
    // Fetch both searches and subscriptions with proper error handling
    const [searchesRes, subsRes] = await Promise.all([
      fetch('/api/saved-searches').catch(err => {
        console.error('Failed to fetch saved searches:', err)
        return null
      }),
      fetch('/api/saved-searches?subscribed=true').catch(err => {
        console.error('Failed to fetch subscriptions:', err)
        return null
      }),
    ])

    // Handle saved searches response
    if (searchesRes && searchesRes.ok) {
      try {
        const j = await searchesRes.json()
        setSearches(j.searches || [])
      } catch (err) {
        console.error('Error parsing saved searches JSON:', err)
        setSearches([])
      }
    } else {
      console.warn('Saved searches request failed')
      setSearches([])
    }

    // Handle subscriptions response
    if (subsRes && subsRes.ok) {
      try {
        const j = await subsRes.json()
        const formatted = (j.searches || []).map((sub: any) => ({
          id: sub.id,
          name: sub.name,
          description: sub.description,
          frequency: sub.frequency || 'DAILY',
          active: sub.subscription_enabled || false,
          recipients: sub.recipients || '',
          file_format: sub.export_format?.toLowerCase() || 'csv',
          export_format: sub.export_format || 'CSV',
          include_links: sub.include_links ?? true,
          send_empty_results: sub.send_empty_results ?? false,
          max_results: sub.max_results || 100,
          delivery_time: sub.delivery_time || '09:00',
          email_notification: sub.email_notification ?? true,
          last_run_at: sub.last_run_at,
          last_result_count: sub.last_result_count,
          created_at: sub.created_at,
          savedSearch: {
            id: sub.id,
            name: sub.name,
            keywords: sub.keywords,
            solnum: sub.solicitationNumber,
            noticeid: sub.noticeid,
            naics: sub.naics,
            ncode: sub.naics,
            ccode: sub.classificationCode,
            agency: sub.agency,
            organizationName: sub.agency,
            organizationCode: sub.organizationCode,
            setAside: sub.setAside,
            typeOfSetAside: sub.setAside,
            stateOfPerformance: sub.stateOfPerformance,
            state: sub.stateOfPerformance,
            zip: sub.placeOfPerformanceZip,
            status: sub.opportunityStatus,
            procurementType: sub.procurementType,
            ptype: sub.procurementType,
            postedAfter: sub.postedAfter,
            postedBefore: sub.postedBefore,
            postedFrom: sub.postedAfter,
            postedTo: sub.postedBefore,
            rdlfrom: sub.rdlfrom,
            rdlto: sub.rdlto,
            limit: sub.max_results,
          },
        }))
        setSubscriptions(formatted)
      } catch (err) {
        console.error('Error parsing subscriptions JSON:', err)
        setSubscriptions([])
      }
    } else {
      console.warn('Subscriptions request failed')
      setSubscriptions([])
    }
  } catch (e) {
    console.error('Error in fetchAll:', e)
    setToast({ type: 'error', message: 'Failed to load alerts. Please refresh.' })
  } finally {
    setLoading(false)
  }
}

  // Clear browsing timer before navigation
  function pushToSearchWithSavedSearch(savedSearchId: string) {
    localStorage.removeItem('browsingStartTime')

    const s = searches.find((x) => x.id === savedSearchId)
    if (s) {
      router.push(buildSearchUrlFromSavedSearch(s, { run: true }))
      return
    }

    router.push(`/search?loadSavedSearch=${encodeURIComponent(savedSearchId)}&run=1&from=alerts`)
  }

  function editSavedSearch(savedSearchId: string) {
    const search = searches.find((s) => s.id === savedSearchId)
    if (search) {
      startEditingSearch(search)
    }
  }

  // ========== INLINE EDITING FOR ALERT SUBSCRIPTIONS ==========
  function startEditingAlert(alert: AlertSubscription) {
    const defaults = getDefault6MonthRangeFromConstants()
    const defaultPostedFrom = defaults.from
    const defaultPostedTo = defaults.to

    const defaultRdlFrom = defaults.from
    const defaultRdlTo = defaults.to

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
        keywords: s.keywords ?? null,
        solnum: s.solnum ?? null,
        noticeid: s.noticeid ?? null,
        naics: (s.naics || s.ncode) ?? null,
        ncode: (s.ncode || s.naics) ?? null,
        ccode: s.ccode ?? null,
        agency: (s.agency || s.organizationName) ?? null,
        organizationName: (s.organizationName || s.agency) ?? null,
        organizationCode: s.organizationCode ?? null,
        setAside: (s.setAside || s.typeOfSetAside) ?? null,
        typeOfSetAside: (s.typeOfSetAside || s.setAside) ?? null,
        stateOfPerformance: (s.stateOfPerformance || s.state) ?? null,
        state: (s.state || s.stateOfPerformance) ?? null,
        zip: s.zip ?? null,
        status: s.status ?? null,
        procurementType: (s.procurementType || s.ptype) ?? null,
        ptype: (s.ptype || s.procurementType) ?? null,
        postedAfter: toYmd(s.postedAfter || s.postedFrom) || defaultPostedFrom,
        postedFrom: toYmd(s.postedFrom || s.postedAfter) || defaultPostedFrom,

        rdlfrom: toYmd(s.rdlfrom) || defaultRdlFrom,

        postedBefore: toYmd(s.postedBefore || s.postedTo) || defaultPostedTo,
        postedTo: toYmd(s.postedTo || s.postedBefore) || defaultPostedTo,

        rdlto: toYmd(s.rdlto) || defaultRdlTo,

        limit: s.limit ?? null,
      },
    })
  }

  function cancelEditingAlert() {
    setExpandedAlertId(null)
    setEditingAlert(null)
  }

  function updateEditingAlertSavedField(field: keyof AlertSubscription['savedSearch'], value: any) {
    if (!editingAlert) return
    setEditingAlert({
      ...editingAlert,
      savedSearch: {
        ...(editingAlert.savedSearch as any),
        [field]: value,
      },
    })
  }

  // ========== SAVE EDITED ALERT (INLINE) - COMPLETE FIXED VERSION ==========
  async function saveEditedAlertInline() {
    if (!editingAlert) return

    if (!editingAlert.name?.trim()) {
      setToast({ type: 'error', message: 'Alert name is required.' })
      return
    }

    if (isDuplicateAlertName(editingAlert.name, editingAlert.id)) {
      setToast({ type: 'error', message: 'Alert name must be unique. Please choose a different name.' })
      return
    }

    try {
      setBusyId(editingAlert.id)
      
      console.log('Saving alert with data:', {
        name: editingAlert.name,
        status: editingAlert.savedSearch?.status,
        procurementType: editingAlert.savedSearch?.procurementType,
      })
      
      // Build payload, omitting procurement_type if empty
      const payload: any = {
        // Alert metadata + subscription settings
        name: editingAlert.name,
        description: editingAlert.description,
        subscription_enabled: editingAlert.active,
        frequency: normalizeApiFrequency(editingAlert.frequency) || 'DAILY',
        recipients: editingAlert.recipients,
        email_notification: editingAlert.email_notification ?? true,
        export_format: (editingAlert.export_format || editingAlert.file_format || 'csv').toUpperCase(),
        include_links: editingAlert.include_links ?? true,
        send_empty_results: editingAlert.send_empty_results ?? false,
        max_results: editingAlert.max_results || 100,
        delivery_time: editingAlert.delivery_time || null,

        // Saved-search criteria - ALL FIELDS INCLUDING FIXES
        keywords: editingAlert.savedSearch?.keywords ?? null,
        solicitationNumber: editingAlert.savedSearch?.solnum ?? null,
        noticeId: editingAlert.savedSearch?.noticeid ?? null,
        naics: (editingAlert.savedSearch?.naics || editingAlert.savedSearch?.ncode) ?? null,
        classificationCode: editingAlert.savedSearch?.ccode ?? null,
        agency: (editingAlert.savedSearch?.agency || editingAlert.savedSearch?.organizationName) ?? null,
        organizationCode: editingAlert.savedSearch?.organizationCode ?? null,
        setAside: (editingAlert.savedSearch?.setAside || editingAlert.savedSearch?.typeOfSetAside) ?? null,
        stateOfPerformance: (editingAlert.savedSearch?.stateOfPerformance || editingAlert.savedSearch?.state) ?? null,
        placeOfPerformanceZip: editingAlert.savedSearch?.zip ?? null,
        
        // CRITICAL FIXES: These fields were missing!
        opportunityStatus: editingAlert.savedSearch?.status ?? null,
        
        // Date fields - BOTH postedAfter AND postedBefore
        postedAfter: sanitizePostedFromYmd(editingAlert.savedSearch?.postedAfter || editingAlert.savedSearch?.postedFrom),
        postedBefore: sanitizePostedFromYmd(editingAlert.savedSearch?.postedBefore || editingAlert.savedSearch?.postedTo),
        rdlfrom: editingAlert.savedSearch?.rdlfrom ?? null,
        rdlto: editingAlert.savedSearch?.rdlto ?? null,
      }
      
      // Only include procurementType if it has a non-empty value
      const procType = editingAlert.savedSearch?.procurementType || editingAlert.savedSearch?.ptype
      if (procType && procType.trim() !== '') {
        payload.procurementType = procType
      }
      
      const res = await fetch(`/api/saved-searches/${editingAlert.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const j = await res.json().catch(() => ({}))

      if (!res.ok) {
        console.error('Save failed:', j)
        setToast({ type: 'error', message: j?.error || 'Failed to update alert' })
        return
      }

      console.log('Save response:', j)
      
      const updated = j?.search
      setSubscriptions((prev) =>
        prev.map((s) =>
          s.id === editingAlert.id
            ? {
                ...s,
                name: updated?.name ?? s.name,
                description: updated?.description ?? s.description,
                recipients: updated?.recipients ?? s.recipients,
                frequency: updated?.frequency ?? s.frequency,
                active: updated?.subscription_enabled ?? s.active,
                include_links: updated?.include_links ?? s.include_links,
                send_empty_results: updated?.send_empty_results ?? s.send_empty_results,
                max_results: updated?.max_results ?? s.max_results,
                delivery_time: updated?.delivery_time ?? s.delivery_time,
                export_format: updated?.export_format ?? s.export_format,
                email_notification: updated?.email_notification ?? s.email_notification,
                savedSearch: {
                  ...s.savedSearch,
                  keywords: updated?.keywords ?? s.savedSearch?.keywords ?? null,
                  solnum: updated?.solicitationNumber ?? s.savedSearch?.solnum ?? null,
                  noticeid: updated?.noticeid ?? s.savedSearch?.noticeid ?? null,
                  naics: updated?.naics ?? s.savedSearch?.naics ?? null,
                  ncode: updated?.naics ?? s.savedSearch?.ncode ?? null,
                  ccode: updated?.classificationCode ?? s.savedSearch?.ccode ?? null,
                  agency: updated?.agency ?? s.savedSearch?.agency ?? null,
                  organizationName: updated?.agency ?? s.savedSearch?.organizationName ?? null,
                  organizationCode: updated?.organizationCode ?? s.savedSearch?.organizationCode ?? null,
                  setAside: updated?.setAside ?? s.savedSearch?.setAside ?? null,
                  typeOfSetAside: updated?.setAside ?? s.savedSearch?.typeOfSetAside ?? null,
                  stateOfPerformance: updated?.stateOfPerformance ?? s.savedSearch?.stateOfPerformance ?? null,
                  state: updated?.stateOfPerformance ?? s.savedSearch?.state ?? null,
                  zip: updated?.placeOfPerformanceZip ?? s.savedSearch?.zip ?? null,
                  
                  // CRITICAL FIXES: Update these fields in local state too!
                  status: updated?.opportunityStatus ?? s.savedSearch?.status ?? null,
                  procurementType: updated?.procurementType ?? s.savedSearch?.procurementType ?? null,
                  ptype: updated?.procurementType ?? s.savedSearch?.ptype ?? null,
                  
                  postedAfter: updated?.postedAfter ?? s.savedSearch?.postedAfter ?? null,
                  postedBefore: updated?.postedBefore ?? s.savedSearch?.postedBefore ?? null,
                  postedFrom: updated?.postedAfter ?? s.savedSearch?.postedFrom ?? null,
                  postedTo: updated?.postedBefore ?? s.savedSearch?.postedTo ?? null,
                  rdlfrom: updated?.rdlfrom ?? s.savedSearch?.rdlfrom ?? null,
                  rdlto: updated?.rdlto ?? s.savedSearch?.rdlto ?? null,
                },
              }
            : s
        )
      )
      
      setToast({ type: 'success', message: 'Alert updated successfully!' })
      setExpandedAlertId(null)
      setEditingAlert(null)
      
      // Refresh from server to confirm persistence
      await fetchAll()
    } catch (err: any) {
      console.error('Save error:', err)
      setToast({ type: 'error', message: err.message || 'Failed to update alert' })
    } finally {
      setBusyId(null)
    }
  }

  // ========== INLINE EDITING FOR SAVED SEARCHES ==========
  function startEditingSearch(search: SavedSearch) {
    setExpandedSearchId(search.id)
    const defaults = getDefault6MonthRangeFromConstants()
    const defaultPostedFrom = defaults.from
    const defaultPostedTo = defaults.to

    // Calculate default response deadline (Today + 1 month)
    const defaultRdlFrom = new Date()
    defaultRdlFrom.setMonth(defaultRdlFrom.getMonth() + 1)
    
    setEditingSearch({
      ...search,
      postedAfter: toYmd(search.postedAfter) || defaultPostedFrom, // or defaults.from
      rdlfrom: toYmd(search.rdlfrom) || formatDateInput(defaultRdlFrom),
    })

  }

  function cancelEditingSearch() {
    setExpandedSearchId(null)
    setEditingSearch(null)
  }

  async function saveEditedSearch() {
    if (!editingSearch) return

    try {
      setBusyId(editingSearch.id)
      
      console.log('Saving search with data:', {
        name: editingSearch.name,
        status: editingSearch.status,
        procurementType: editingSearch.procurementType,
        postedAfter: editingSearch.postedAfter,
        postedBefore: editingSearch.postedBefore,
      })
      
      // Build the payload, omitting empty/null fields that shouldn't be updated
      const payload: any = {
        name: editingSearch.name,
        description: editingSearch.description,
        keywords: editingSearch.keywords,
        solicitationNumber: editingSearch.solnum,
        noticeId: editingSearch.noticeid,
        naics: editingSearch.naics,
        classificationCode: editingSearch.ccode,
        agency: editingSearch.agency,
        organizationCode: editingSearch.organizationCode,
        setAside: editingSearch.setAside,
        stateOfPerformance: editingSearch.stateOfPerformance,
        placeOfPerformanceZip: editingSearch.zip,
        opportunityStatus: editingSearch.status,
        postedAfter: sanitizePostedFromYmd(editingSearch.postedAfter),
        postedBefore: sanitizePostedFromYmd(editingSearch.postedBefore),
        rdlfrom: editingSearch.rdlfrom,
        rdlto: editingSearch.rdlto,
      }
      
      // Only include procurementType if it has a non-empty value
      if (editingSearch.procurementType && editingSearch.procurementType.trim() !== '') {
        payload.procurementType = editingSearch.procurementType
      }
      
      const res = await fetch(`/api/saved-searches/${editingSearch.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const j = await res.json().catch(() => ({ error: 'Failed to update search' }))
        console.error('Save failed:', j)
        setToast({ type: 'error', message: j?.error || 'Failed to update search' })
        return
      }

      const j = await res.json().catch(() => ({}))
      const updated = j?.search
      
      console.log('Save response:', updated)

      if (updated) {
        setSearches((prev) => 
          prev.map((s) => (s.id === editingSearch.id ? { ...s, ...updated } : s))
        )
      }

      setToast({ 
        type: 'success', 
        message: `Saved search "${editingSearch.name}" updated successfully!` 
      })
      setExpandedSearchId(null)
      setEditingSearch(null)
      
      // Refresh from server to confirm persistence
      await fetchAll()
    } catch (err: any) {
      console.error('Save error:', err)
      setToast({ type: 'error', message: err.message || 'Failed to update search' })
    } finally {
      setBusyId(null)
    }
  }

  function updateEditingSearchField(field: keyof SavedSearch | 'postedAfter' | 'postedBefore' | 'rdlfrom' | 'rdlto', value: any) {
    if (editingSearch) {
      setEditingSearch({ ...editingSearch, [field]: value } as any)
      return
    }

    if (editingAlert && (field === 'postedAfter' || field === 'postedBefore' || field === 'rdlfrom' || field === 'rdlto')) {
      const nextSaved = { ...(editingAlert.savedSearch as any) }

      if (field === 'postedAfter') {
        nextSaved.postedAfter = value || null
        nextSaved.postedFrom = value || null
      } else if (field === 'postedBefore') {
        nextSaved.postedBefore = value || null
        nextSaved.postedTo = value || null
      } else if (field === 'rdlfrom') {
        nextSaved.rdlfrom = value || null
      } else if (field === 'rdlto') {
        nextSaved.rdlto = value || null
      }

      setEditingAlert({ ...editingAlert, savedSearch: nextSaved })
    }
  }

  // Delete saved search
  async function deleteSavedSearch(id: string) {
    console.log('deleteSavedSearch called:', id)
    
    try {
      setBusyId(id)
      const res = await fetch(`/api/saved-searches/${id}`, { 
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Failed to delete' }))
        setToast({ 
          type: 'error', 
          message: errorData?.error || 'Failed to delete saved search.' 
        })
        return
      }

      const responseData = await res.json()
      
      // Remove from searches state
      setSearches((prev) => prev.filter((s) => s.id !== id))
      
      // Also remove any subscriptions that use this search
      setSubscriptions((prev) => prev.filter((s) => s.savedSearch.id !== id))
      
      setToast({ 
        type: 'success', 
        message: responseData?.message || 'Saved search deleted successfully' 
      })
    } catch (e: any) {
      console.error('Delete error:', e)
      setToast({ 
        type: 'error', 
        message: e.message || 'Failed to delete saved search.' 
      })
    } finally {
      setBusyId(null)
      setDeleteSearchConfirmId(null)
    }
  }

  // Create new saved search from alerts page
  async function createSavedSearch(data: any) {
    try {
      setBusyId('new-search')
      
      const res = await fetch('/api/saved-searches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          subscription_enabled: false,
        }),
      })

      const j = await res.json().catch(() => ({}))

      if (!res.ok) {
        setToast({ type: 'error', message: j?.error || 'Failed to create saved search.' })
        return
      }

      setSearches((prev) => [j.search, ...prev])
      setToast({ 
        type: 'success', 
        message: `Saved search "${j.search.name}" created! You can now find it in the Saved Searches tab and run it with one click.` 
      })
      setShowCreateSavedSearchModal(false)
    } catch (e) {
      console.error(e)
      setToast({ type: 'error', message: 'Failed to create saved search.' })
    } finally {
      setBusyId(null)
    }
  }

  // Create new subscription alert from alerts page
  async function createSubscriptionAlert(data: any) {
    try {
      setBusyId('new-alert')
      
      const res = await fetch('/api/saved-searches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          subscription_enabled: true,
          frequency: data.frequency || 'DAILY',
        }),
      })

      const j = await res.json().catch(() => ({}))

      if (!res.ok) {
        setToast({ type: 'error', message: j?.error || 'Failed to create subscription alert.' })
        return
      }

      await fetchAll() // Refresh both lists
      setToast({ 
        type: 'success', 
        message: `Subscription alert "${j.search.name}" created! It will run on schedule and email results. You can manage it in the Alert Subscriptions tab.` 
      })
      setShowCreateSubscriptionModal(false)
    } catch (e) {
      console.error(e)
      setToast({ type: 'error', message: 'Failed to create subscription alert.' })
    } finally {
      setBusyId(null)
    }
  }

  // Duplicate saved search
  async function duplicateSavedSearch(id: string) {
    try {
      setBusyId(id)
      const search = searches.find((s) => s.id === id)
      if (!search) return

      const res = await fetch('/api/saved-searches', {
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
          rdlfrom: search.rdlfrom,
          subscription_enabled: false,
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
      const res = await fetch(`/api/saved-searches/${id}/toggle`, { method: 'POST' })
      const j = await res.json().catch(() => ({}))

      if (!res.ok) {
        setToast({ type: 'error', message: j?.error || 'Failed to update alert.' })
        return
      }

      setSubscriptions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, active: j?.search?.subscription_enabled ?? !s.active } : s))
      )

      const enabled = (j?.search?.subscription_enabled ?? true) as boolean
      setToast({ type: 'success', message: enabled ? 'Alert activated' : 'Alert paused' })
    } catch (e) {
      console.error(e)
      setToast({ type: 'error', message: 'Failed to update alert.' })
    } finally {
      setBusyId(null)
    }
  }

  // Run alert now
    async function runNow(id: string) {
    const controller = new AbortController()
    setAbortController(controller)
    
    try {
      setBusyId(id)
      const subscription = subscriptions.find((s) => s.id === id)
      const subscriptionName = subscription?.name || 'Alert'

      // FIXED: Changed endpoint from /run to base endpoint
      const res = await fetch(`/api/saved-searches/${id}`, { 
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
      })
      
      if (!res.ok) {
        const j = await res.json().catch(() => ({ error: 'Failed to run alert' }))
        setToast({ type: 'error', message: j?.error || 'Failed to run alert.' })
        setRunConfirmId(null)
        setRunningAlertName('')
        return
      }

      const j = await res.json().catch(() => ({}))

      setSubscriptions((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                last_run_at: j?.timestamp || new Date().toISOString(),
                last_result_count: j?.result_count ?? s.last_result_count ?? 0,
              }
            : s
        )
      )

      // Close the modal and show persistent success notification with full details
      setRunConfirmId(null)
      setRunningAlertName('')
      setRunSuccess({
        id,
        alertName: j?.searchName || subscriptionName,
        keywords: j?.keywords || 'All',
        count: j?.result_count ?? 0,
        recipients: j?.recipients || [],
        timestamp: j?.timestamp || new Date().toISOString(),
        frequency: j?.frequency || subscription?.frequency || 'Manual',
        email_sent: j?.email_sent || false,
      })
    } catch (e: any) {
      if (e.name === 'AbortError') {
        setToast({ type: 'error', message: 'Alert run was cancelled.' })
      } else {
        console.error(e)
        setToast({ type: 'error', message: 'Failed to run alert. Please try again.' })
      }
      setRunConfirmId(null)
      setRunningAlertName('')
    } finally {
      setBusyId(null)
      setAbortController(null)
    }
  }

  // Cancel running alert
  function cancelRun() {
    if (abortController) {
      abortController.abort()
      setAbortController(null)
      setBusyId(null)
      setRunConfirmId(null)
      setRunningAlertName('')
      setToast({ type: 'error', message: 'Alert run cancelled.' })
    }
  }

  // Delete subscription
  // Replace your deleteSubscription function (around line 1056) with this version:

async function deleteSubscription(id: string) {
  console.log('DELETE FUNCTION CALLED - ID:', id)
  try {
    setBusyId(id)
    const url = `/api/alert-subscriptions/${id}`
    console.log('Making DELETE request to:', url)
    
    const res = await fetch(url, { method: 'DELETE' })
    
    console.log('Response status:', res.status, 'ok:', res.ok)
    
    if (!res.ok) {
      const j = await res.json().catch(() => ({ error: 'Failed to delete alert' }))
      console.error('Delete failed with response:', j)
      setToast({ type: 'error', message: j?.error || 'Failed to delete alert.' })
      return
    }

    const j = await res.json().catch(() => ({ success: true }))
    console.log('Delete successful, response:', j)

    setSubscriptions((prev) => prev.filter((s) => s.id !== id))
    setToast({ 
      type: 'success', 
      message: j?.message || 'Alert deleted successfully' 
    })
  } catch (e) {
    console.error('Delete exception:', e)
    setToast({ type: 'error', message: 'Failed to delete alert.' })
  } finally {
    console.log('Cleaning up - resetting busyId and deleteConfirmId')
    setBusyId(null)
    setDeleteConfirmId(null)
  }
}

  const busy = busyId !== null

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
        
        /* Aptos-like font fallback with system fonts */
        :root {
          --font-aptos: 'Aptos', 'Outfit', 'Segoe UI', system-ui, -apple-system, sans-serif;
        }
        
        /* Shimmer animation for active tabs */
        @keyframes shimmer {
          0% {
            transform: translateX(-100%) skewX(-12deg);
          }
          100% {
            transform: translateX(200%) skewX(-12deg);
          }
        }
        
        .animate-shimmer {
          animation: shimmer 3s infinite;
        }
      `}</style>
      
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" style={{ fontFamily: "var(--font-aptos)" }}>
      {/* Enhanced Toast Notifications */}
      {toast && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 pointer-events-none">
          <div
            className={clsx(
              'relative w-full max-w-2xl mx-4 rounded-2xl shadow-2xl backdrop-blur-xl border-2',
              'animate-in fade-in slide-in-from-top-5 duration-500',
              toast.type === 'success' &&
                'border-emerald-500/50 bg-gradient-to-br from-emerald-950/95 to-emerald-900/95',
              toast.type === 'error' &&
                'border-rose-500/50 bg-gradient-to-br from-rose-950/95 to-rose-900/95',
              toast.type === 'info' &&
                'border-blue-500/50 bg-gradient-to-br from-blue-950/95 to-blue-900/95'
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
                    'flex-shrink-0 p-2 rounded-lg transition-colors pointer-events-auto',
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
      <div className="mx-auto max-w-[1800px] px-3 sm:px-6 lg:px-10 xl:px-12 py-4 sm:py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl sm:text-3xl font-bold text-white">Precise GovCon Alert Manager</h1>
              <p className="text-slate-300 mt-2">Automate notifications and jump back into search instantly.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {/* New Search */}
              <Link
                href="/search"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white transition-all border border-slate-600 font-semibold"
              >
                <Search className="w-5 h-5" />
                New Search
              </Link>

              {/* Create Saved Search - Opens Modal */}
              <button
                onClick={() => setShowCreateSavedSearchModal(true)}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r text-white hover:opacity-90 transition-all font-semibold shadow-lg"
                style={{ 
                  background: 'linear-gradient(to right, #ff6b35, #ff8c42)',
                  boxShadow: '0 10px 40px rgba(255, 107, 53, 0.3)' 
                }}
              >
                <Save className="w-5 h-5" />
                Create Saved Search
              </button>

              {/* Create Subscription Alert - Opens Modal */}
              <button
                onClick={() => setShowCreateSubscriptionModal(true)}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r text-gray-900 hover:opacity-90 transition-all font-semibold shadow-lg"
                style={{ 
                  background: 'linear-gradient(to right, #00ff87, #60efff)',
                  boxShadow: '0 10px 40px rgba(0, 255, 135, 0.3)' 
                }}
              >
                <Bell className="w-5 h-5" />
                Create Subscription Alert
              </button>
            </div>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
          <button
            onClick={() => setActiveTab('alerts')}
            className="rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-800 to-slate-700 p-6 hover:border-emerald-500/50 transition-all cursor-pointer text-left"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-300">Alert Subscriptions</p>
                <p className="mt-2 text-2xl sm:text-3xl font-bold text-white">{subscriptions.length}</p>
                <p className="mt-1 text-sm text-slate-400">
                  {activeCount} active • {pausedCount} paused
                </p>
              </div>
              <div className="rounded-full bg-emerald-500/10 p-3">
                <Bell className="h-8 w-8 text-emerald-400" />
              </div>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('searches')}
            className="rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-800 to-slate-700 p-6 hover:border-cyan-500/50 transition-all cursor-pointer text-left"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-300">Saved Searches</p>
                <p className="mt-2 text-2xl sm:text-3xl font-bold text-white">{searches.length}</p>
                <p className="mt-1 text-sm text-slate-400">Run instantly from Alerts</p>
              </div>
              <div className="rounded-full bg-cyan-500/10 p-3">
                <Filter className="h-8 w-8 text-cyan-400" />
              </div>
            </div>
          </button>

          <div className="rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-800 to-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-300">Results Delivered</p>
                <p className="mt-2 text-2xl sm:text-3xl font-bold text-white">{deliveredCount}</p>
                <p className="mt-1 text-sm text-slate-400">Total from all alert runs</p>
              </div>
              <div className="rounded-full bg-purple-500/10 p-3">
                <Mail className="h-8 w-8 text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Tabs with Aptos Font */}
        <div className="mb-8">
          <div className="relative">
            {/* Tab Buttons */}
            <div className="flex gap-3 relative z-10">
              <button
                onClick={() => setActiveTab('alerts')}
                className={clsx(
                  'relative flex-1 px-4 sm:px-8 py-3 sm:py-4 rounded-2xl font-semibold transition-all duration-300 overflow-hidden group',
                  'font-[\'Aptos\',_system-ui,_-apple-system,_sans-serif]',
                  activeTab === 'alerts'
                    ? 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-cyan-600 text-white shadow-2xl shadow-emerald-500/40 scale-105'
                    : 'bg-gradient-to-br from-slate-800/80 to-slate-700/80 text-slate-300 hover:text-white hover:from-slate-700/90 hover:to-slate-600/90 border border-slate-600/50'
                )}
              >
                {/* Shine effect on active tab */}
                {activeTab === 'alerts' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-shimmer" />
                )}
                
                <div className="relative flex items-center justify-center gap-3">
                  <div className={clsx(
                    "p-2 rounded-xl transition-all",
                    activeTab === 'alerts' 
                      ? 'bg-white/20 shadow-lg' 
                      : 'bg-slate-700/50 group-hover:bg-slate-600/50'
                  )}>
                    <Bell className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <div className="text-base font-bold tracking-tight">Alert Subscriptions</div>
                    <div className={clsx(
                      "text-xs font-medium",
                      activeTab === 'alerts' ? 'text-emerald-100' : 'text-slate-400'
                    )}>
                      {activeCount} active • {pausedCount} paused
                    </div>
                  </div>
                  <span className={clsx(
                    "ml-2 px-3 py-1 rounded-full text-xs font-bold",
                    activeTab === 'alerts'
                      ? 'bg-white/30 text-white'
                      : 'bg-slate-700 text-slate-300'
                  )}>
                    {subscriptions.length}
                  </span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('searches')}
                className={clsx(
                  'relative flex-1 px-4 sm:px-8 py-3 sm:py-4 rounded-2xl font-semibold transition-all duration-300 overflow-hidden group',
                  'font-[\'Aptos\',_system-ui,_-apple-system,_sans-serif]',
                  activeTab === 'searches'
                    ? 'bg-gradient-to-br from-cyan-500 via-blue-600 to-purple-600 text-white shadow-2xl shadow-cyan-500/40 scale-105'
                    : 'bg-gradient-to-br from-slate-800/80 to-slate-700/80 text-slate-300 hover:text-white hover:from-slate-700/90 hover:to-slate-600/90 border border-slate-600/50'
                )}
              >
                {/* Shine effect on active tab */}
                {activeTab === 'searches' && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-shimmer" />
                )}
                
                <div className="relative flex items-center justify-center gap-3">
                  <div className={clsx(
                    "p-2 rounded-xl transition-all",
                    activeTab === 'searches' 
                      ? 'bg-white/20 shadow-lg' 
                      : 'bg-slate-700/50 group-hover:bg-slate-600/50'
                  )}>
                    <Filter className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <div className="text-base font-bold tracking-tight">Saved Searches</div>
                    <div className={clsx(
                      "text-xs font-medium",
                      activeTab === 'searches' ? 'text-cyan-100' : 'text-slate-400'
                    )}>
                      Run instantly from alerts
                    </div>
                  </div>
                  <span className={clsx(
                    "ml-2 px-3 py-1 rounded-full text-xs font-bold",
                    activeTab === 'searches'
                      ? 'bg-white/30 text-white'
                      : 'bg-slate-700 text-slate-300'
                  )}>
                    {searches.length}
                  </span>
                </div>
              </button>
            </div>

            {/* Decorative bottom line */}
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 via-cyan-500 to-purple-500 opacity-20" />
          </div>
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
                <button
                  onClick={() => setShowCreateSubscriptionModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:opacity-90 transition-all font-semibold"
                >
                  <Plus className="w-5 h-5" />
                  Create Alert
                </button>
              </div>
            ) : (
              subscriptions.map((alert) => {
                const running = alert.active
                const isEditing = expandedAlertId === alert.id

                return (
                  <div
                    key={alert.id}
                    className={clsx(
                      "relative rounded-2xl p-6 transition-all duration-300 border-2 overflow-hidden",
                      "font-['Aptos',_system-ui,_-apple-system,_sans-serif]",
                      running
                        ? "bg-gradient-to-br from-slate-800 via-slate-800 to-emerald-900/20 border-emerald-500/40 shadow-lg shadow-emerald-500/10"
                        : "bg-gradient-to-br from-slate-800/90 to-slate-700/90 border-slate-600/50 hover:border-slate-500/70"
                    )}
                  >
                    {/* Shine effect for active alerts */}
                    {running && (
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-400/10 to-transparent rounded-full blur-3xl pointer-events-none" />
                    )}
                    {isEditing && editingAlert?.id === alert.id ? (
                      <div className="space-y-6">
                        {/* Header Section */}
                        <div className="flex items-center justify-between">
                          <div className="space-y-1 w-full">
                            <input
                              type="text"
                              value={editingAlert.name}
                              onChange={(e) => setEditingAlert({ ...editingAlert, name: e.target.value })}
                              className="text-2xl font-bold bg-transparent border-b border-slate-600 focus:border-blue-400 outline-none text-white w-full"
                              placeholder="Alert Name"
                            />
                            <textarea
                              value={editingAlert.description || ''}
                              onChange={(e) => setEditingAlert({ ...editingAlert, description: e.target.value })}
                              className="text-sm bg-transparent border-b border-slate-600 focus:border-blue-400 outline-none text-slate-300 w-full resize-none"
                              placeholder="Description (optional)"
                              rows={2}
                            />
                          </div>
                        </div>

                        {/* Search Criteria */}
                        <div className="space-y-4 pt-2">
                          <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Search Criteria</h4>

                          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                            {/* Set-Aside */}
                            <div>
                              <label className={LABEL_CLASS}>Set-Aside Type</label>
                              <select
                                value={editingAlert.savedSearch?.typeOfSetAside || editingAlert.savedSearch?.setAside || ''}
                                onChange={(e) => {
                                  const v = e.target.value
                                  setEditingAlert({
                                    ...editingAlert,
                                    savedSearch: {
                                      ...(editingAlert.savedSearch as any),
                                      typeOfSetAside: v || null,
                                      setAside: v || null,
                                    },
                                  })
                                }}
                                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-base"
                              >
                                <option value="">No Set-Aside</option>
                                {SET_ASIDE_CODES.map((s: any) => (
                                  <option key={s.value} value={s.value}>
                                    {s.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Place of Performance - State */}
                            <div>
                              <label className={LABEL_CLASS}>Place of Performance - State</label>
                              <select
                                value={editingAlert.savedSearch?.stateOfPerformance || editingAlert.savedSearch?.state || ''}
                                onChange={(e) => {
                                  const v = e.target.value
                                  setEditingAlert({
                                    ...editingAlert,
                                    savedSearch: {
                                      ...(editingAlert.savedSearch as any),
                                      stateOfPerformance: v || null,
                                      state: v || null,
                                    },
                                  })
                                }}
                                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-base"
                              >
                                <option value="">Any</option>
                                {US_STATES.map((st: any) => (
                                  <option key={st.value} value={st.value}>
                                    {st.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Place of Performance - Zip */}
                            <div>
                              <label className={LABEL_CLASS}>Place of Performance - Zip</label>
                              <input
                                type="text"
                                value={editingAlert.savedSearch?.zip || ''}
                                onChange={(e) =>
                                  setEditingAlert({
                                    ...editingAlert,
                                    savedSearch: { ...(editingAlert.savedSearch as any), zip: e.target.value || null },
                                  })
                                }
                                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-base"
                                placeholder="Zip code..."
                              />
                            </div>

                            {/* Opportunity Status */}
                            <div>
                              <label className={LABEL_CLASS}>Opportunity Status</label>
                              <select
                                value={(editingAlert.savedSearch?.status as any) || ''}
                                onChange={(e) =>
                                  setEditingAlert({
                                    ...editingAlert,
                                    savedSearch: { ...(editingAlert.savedSearch as any), status: e.target.value || null },
                                  })
                                }
                                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-base"
                              >
                                {STATUS_OPTIONS.map((s) => (
                                  <option key={s.value || 'all'} value={s.value}>
                                    {s.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Procurement Type */}
                            <div>
                              <label className={LABEL_CLASS}>Procurement Type</label>
                              <select
                                value={editingAlert.savedSearch?.ptype || editingAlert.savedSearch?.procurementType || 'o'}
                                onChange={(e) => {
                                  const v = e.target.value
                                  setEditingAlert({
                                    ...editingAlert,
                                    savedSearch: {
                                      ...(editingAlert.savedSearch as any),
                                      ptype: v,
                                      procurementType: v,
                                    },
                                  })
                                }}
                                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-base"
                              >
                                {PROCUREMENT_TYPES.map((t: any) => (
                                  <option key={t.value} value={t.value}>
                                    {t.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* NAICS */}
                            <div>
                              <label className={LABEL_CLASS}>NAICS Code</label>
                              <input
                                type="text"
                                value={editingAlert.savedSearch?.naics || editingAlert.savedSearch?.ncode || ''}
                                onChange={(e) =>
                                  setEditingAlert({
                                    ...editingAlert,
                                    savedSearch: {
                                      ...(editingAlert.savedSearch as any),
                                      naics: e.target.value || null,
                                      ncode: e.target.value || null,
                                    },
                                  })
                                }
                                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-base"
                                placeholder="6-digit code..."
                              />
                            </div>

                            {/* Posted Date Range */}
                            <div>
                              <label className={LABEL_CLASS}>Posted Date</label>
                              <input
                                type="date"
                                value={editingAlert.savedSearch?.postedAfter || editingAlert.savedSearch?.postedFrom || ''}
                                onChange={(e) => {
                                  const v = e.target.value || null
                                  setEditingAlert({
                                    ...editingAlert,
                                    savedSearch: {
                                      ...(editingAlert.savedSearch as any),
                                      postedAfter: v,
                                      postedFrom: v,
                                    },
                                  })
                                }}
                                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-base"
                              />
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <span className="text-xs text-emerald-300 font-bold mr-1">Search posted from:</span>
                                {MONTH_RANGE_PRESETS.map((p) => (
                                  <button
                                    key={`alert-posted-from-${p.months}`}
                                    type="button"
                                    onClick={() => {
                                      const now = new Date()
                                      const from = formatDateInput(clampPostedFrom(subMonths(now, p.months), now))
                                      
                                      setEditingAlert({
                                        ...editingAlert,
                                        savedSearch: {
                                          ...(editingAlert.savedSearch as any),
                                          postedAfter: from,
                                          postedFrom: from,
                                        },
                                      })
                                    }}
                                    className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 text-xs font-bold border border-emerald-400/30 transition-colors"
                                  >
                                    {p.label} ago
                                  </button>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingAlert({
                                      ...editingAlert,
                                      savedSearch: {
                                        ...(editingAlert.savedSearch as any),
                                        postedAfter: null,
                                        postedFrom: null,
                                      },
                                    })
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors border border-slate-700"
                                >
                                  Clear
                                </button>
                              </div>
                            </div>

                            <div>
                              <label className={LABEL_CLASS}>Response Deadline From</label>
                              <input
                                type="date"
                                value={editingAlert.savedSearch?.rdlfrom || ''}
                                onChange={(e) => {
                                  const v = e.target.value || null
                                  setEditingAlert({
                                    ...editingAlert,
                                    savedSearch: {
                                      ...(editingAlert.savedSearch as any),
                                      rdlfrom: v,
                                    },
                                  })
                                }}
                                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-base"
                              />
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <span className="text-xs text-emerald-300 font-bold mr-1">Search for deadlines from:</span>
                                {MONTH_RANGE_PRESETS.map((p) => (
                                  <button
                                    key={`alert-rdl-${p.months}`}
                                    type="button"
                                    onClick={() => {
                                      const now = new Date()
                                      const from = subMonths(now, p.months)
                                      
                                      setEditingAlert({
                                        ...editingAlert,
                                        savedSearch: {
                                          ...(editingAlert.savedSearch as any),
                                          rdlfrom: formatDateInput(from),
                                        },
                                      })
                                    }}
                                    className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 text-xs font-bold border border-emerald-400/30 transition-colors"
                                  >
                                    {p.label} ago
                                  </button>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingAlert({
                                      ...editingAlert,
                                      savedSearch: {
                                        ...(editingAlert.savedSearch as any),
                                        rdlfrom: null,
                                      },
                                    })
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors border border-slate-700"
                                >
                                  Clear
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Schedule */}
                        <div className="space-y-4">
                          <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Schedule</h4>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className={LABEL_CLASS}>Frequency</label>
                              <select
                                value={editingAlert.frequency}
                                onChange={(e) =>
                                  setEditingAlert({ ...editingAlert, frequency: e.target.value as AlertFrequency })
                                }
                                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-base"
                              >
                                {ALERT_FREQUENCIES.map((freq) => (
                                  <option key={freq.value} value={freq.value}>
                                    {freq.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {editingAlert.frequency !== 'AS_CHANGES' && editingAlert.frequency !== 'MANUAL' && (
                              <div>
                                <label className={LABEL_CLASS}>Delivery Time (UTC)</label>
                                <select
                                  value={editingAlert.delivery_time || '09:00'}
                                  onChange={(e) => setEditingAlert({ ...editingAlert, delivery_time: e.target.value })}
                                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-base"
                                >
                                  {DELIVERY_TIME_OPTIONS.map((t) => (
                                    <option key={t.value} value={t.value}>
                                      {t.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Delivery / Options */}
                        <div className="space-y-4">
                          <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Delivery & Options</h4>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className={LABEL_CLASS}>File Format</label>
                              <select
                                value={editingAlert.file_format || editingAlert.export_format || 'csv'}
                                onChange={(e) =>
                                  setEditingAlert({
                                    ...editingAlert,
                                    file_format: e.target.value as FileFormat,
                                    export_format: e.target.value,
                                  })
                                }
                                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-base"
                              >
                                {EXPORT_FORMATS.map((format) => (
                                  <option key={format.value} value={format.value}>
                                    {format.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className={LABEL_CLASS}>Max Results</label>
                              <input
                                type="number"
                                value={editingAlert.max_results || 100}
                                onChange={(e) =>
                                  setEditingAlert({
                                    ...editingAlert,
                                    max_results: parseInt(e.target.value) || 100,
                                  })
                                }
                                min="1"
                                max="1000"
                                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-base"
                              />
                            </div>

                            <div className="md:col-span-2">
                              <label className={LABEL_CLASS}>Email Recipients</label>
                              <textarea
                                value={editingAlert.recipients}
                                onChange={(e) => setEditingAlert({ ...editingAlert, recipients: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-base"
                                placeholder="Enter email addresses separated by commas"
                                rows={2}
                              />
                              <p className="text-xs text-slate-400 mt-1">
                                {editingAlert.recipients.split(',').filter((email) => email.trim()).length} recipient
                                {editingAlert.recipients.split(',').filter((email) => email.trim()).length !== 1 ? 's' : ''}
                              </p>
                            </div>

                            <div className="md:col-span-2 space-y-3">
                              <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                                <div>
                                  <p className="text-slate-200 font-medium">Include Links</p>
                                  <p className="text-sm text-slate-400">Include direct links to opportunities in results</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setEditingAlert({ ...editingAlert, include_links: !editingAlert.include_links })}
                                  className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                                    editingAlert.include_links ? 'bg-emerald-500' : 'bg-slate-700'
                                  }`}
                                >
                                  <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                                      editingAlert.include_links ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                  />
                                </button>
                              </div>

                              <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                                <div>
                                  <p className="text-slate-200 font-medium">Send Empty Results</p>
                                  <p className="text-sm text-slate-400">Send email even when no results are found</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setEditingAlert({ ...editingAlert, send_empty_results: !editingAlert.send_empty_results })
                                  }
                                  className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                                    editingAlert.send_empty_results ? 'bg-emerald-500' : 'bg-slate-700'
                                  }`}
                                >
                                  <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                                      editingAlert.send_empty_results ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                  />
                                </button>
                              </div>

                              <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                                <div>
                                  <p className="text-slate-200 font-medium">Email Notification</p>
                                  <p className="text-sm text-slate-400">Send email notifications for this alert</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setEditingAlert({ ...editingAlert, email_notification: !editingAlert.email_notification })
                                  }
                                  className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                                    editingAlert.email_notification !== false ? 'bg-emerald-500' : 'bg-slate-700'
                                  }`}
                                >
                                  <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                                      editingAlert.email_notification !== false ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                  />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-3 pt-4 border-t border-slate-600">
                          <button
                            onClick={saveEditedAlertInline}
                            disabled={busy}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg transition-all disabled:opacity-50 font-semibold"
                          >
                            {busyId === alert.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Save Changes
                          </button>
                          <button
                            onClick={cancelEditingAlert}
                            disabled={busy}
                            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Display Mode
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                        {/* Info */}
                        <div className="flex-1">
                          <div className="flex items-start gap-3 mb-4">
                            <div className={clsx('p-2 rounded-lg', running ? 'bg-emerald-500/10' : 'bg-slate-800')}>
                              <Bell className={clsx('h-5 w-5', running ? 'text-emerald-400' : 'text-slate-500')} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-lg font-semibold text-white">{alert.name}</h3>
                                <span
                                  className={clsx(
                                    'px-2 py-0.5 rounded-full border text-xs font-semibold',
                                    freqChipClass(alert.frequency)
                                  )}
                                >
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
                                    {alert.recipients.split(',').length} email
                                    {alert.recipients.split(',').length > 1 ? 's' : ''}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-slate-400 mb-1">Last Run</p>
                                  <p className="text-slate-200 font-medium">{formatRelative(alert.last_run_at)}</p>
                                </div>
                                <div>
                                  <p className="text-slate-400 mb-1">Format</p>
                                  <p className="text-slate-200 font-medium">
                                    {(alert.export_format || alert.file_format || 'CSV').toUpperCase()}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-slate-400 mb-1">Last Results</p>
                                  <span className="text-slate-200 font-medium">
                                    {alert.last_result_count !== null && alert.last_result_count !== undefined
                                      ? `${alert.last_result_count} ${alert.last_result_count === 1 ? 'result' : 'results'}`
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
                            onClick={() => {
                              setRunConfirmId(alert.id)
                              setRunningAlertName(alert.name)
                              setRunSuccess(null)
                            }}
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
                            onClick={() => startEditingAlert(alert)}
                            disabled={busy}
                            className="px-3 py-2 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-300 border border-orange-500/20 transition-colors flex items-center gap-2"
                            title="Edit alert settings inline"
                          >
                            <Edit className="w-4 h-4" />
                            <span className="hidden sm:inline">Edit</span>
                          </button>

                          {/* View Button */}
                          <button
                            onClick={() => setViewingAlert(alert)}
                            className="px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 transition-colors flex items-center gap-2"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                            <span className="hidden sm:inline">View</span>
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
                    )}
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
                <p className="text-slate-300 mb-6 max-w-md mx-auto">
                  Save a search from the Search page to reuse it later.
                </p>
                <button
                  onClick={() => setShowCreateSavedSearchModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:opacity-90 transition-all font-semibold"
                >
                  <Plus className="w-5 h-5" />
                  Create Saved Search
                </button>
              </div>
            ) : (
              searches.map((search) => {
                const alertsUsingThisSearch = getAlertsForSearch(search.id)
                const hasActiveAlerts = alertsUsingThisSearch.some((a) => a.active)
                const isEditing = expandedSearchId === search.id
                const defaults = getDefault6MonthRangeFromConstants()
                const defaultPostedFrom = defaults.from
                const defaultPostedTo = defaults.to

                return (
                  <div
                    key={search.id}
                    className={clsx(
                      "relative rounded-2xl p-6 transition-all duration-300 border-2 overflow-hidden",
                      "font-['Aptos',_system-ui,_-apple-system,_sans-serif]",
                      "bg-gradient-to-br from-slate-800/90 via-slate-800/90 to-cyan-900/10 border-cyan-500/20",
                      "hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-500/5"
                    )}
                  >
                    {/* Decorative gradient */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-400/10 to-transparent rounded-full blur-3xl pointer-events-none" />
                    {isEditing && editingSearch?.id === search.id ? (
                      // Inline Edit Mode for Saved Search
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <span className="px-2 py-1 bg-orange-500/20 text-orange-300 text-xs font-semibold rounded-full">
                              Editing
                            </span>
                            Edit Saved Search
                          </h3>
                          <div className="flex gap-2">
                            <button
                              onClick={cancelEditingSearch}
                              disabled={busy}
                              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-2"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={saveEditedSearch}
                              disabled={busy}
                              className="px-3 py-2 rounded-xl bg-orange-500 hover:opacity-90 text-white font-semibold flex items-center gap-2"
                            >
                              {busyId === search.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                            </button>
                          </div>
                        </div>

                        {/* Basic Information Section */}
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className={LABEL_CLASS}>Search Name</label>
                              <input
                                type="text"
                                value={editingSearch.name || ''}
                                onChange={(e) => updateEditingSearchField('name', e.target.value)}
                                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-base placeholder-slate-500"
                                placeholder="Enter search name"
                              />
                            </div>

                            <div>
                              <label className={LABEL_CLASS}>Description</label>
                              <input
                                type="text"
                                value={editingSearch.description || ''}
                                onChange={(e) => updateEditingSearchField('description', e.target.value)}
                                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-base placeholder-slate-500"
                                placeholder="Optional description"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Search Criteria Section */}
                        <div className="space-y-4">
                          <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Search Criteria</h4>

                          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                            <div>
                              <label className={LABEL_CLASS}>Keywords (title)</label>
                              <input
                                type="text"
                                value={editingSearch.keywords || ''}
                                onChange={(e) => updateEditingSearchField('keywords', e.target.value)}
                                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-base placeholder-slate-500"
                                placeholder="Enter keywords..."
                              />
                            </div>

                            <div>
                              <label className={LABEL_CLASS}>Solicitation Number (solnum)</label>
                              <input
                                type="text"
                                value={editingSearch.solnum || ''}
                                onChange={(e) => updateEditingSearchField('solnum', e.target.value)}
                                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-base placeholder-slate-500"
                                placeholder="Solicitation number..."
                              />
                            </div>

                            <div>
                              <label className={LABEL_CLASS}>Notice ID (noticeid)</label>
                              <input
                                type="text"
                                value={editingSearch.noticeid || ''}
                                onChange={(e) => updateEditingSearchField('noticeid', e.target.value)}
                                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-base placeholder-slate-500"
                                placeholder="Notice ID..."
                              />
                            </div>

                            <div>
                              <label className={LABEL_CLASS}>Procurement Type (ptype)</label>
                              <select
                                value={editingSearch.procurementType || ''}
                                onChange={(e) => updateEditingSearchField('procurementType', e.target.value)}
                                className="relative z-20 w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-base"
                              >
                                <option value="">All Types</option>
                                {PROCUREMENT_TYPES.map((type) => (
                                  <option key={type.value} value={type.value}>
                                    {type.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className={LABEL_CLASS}>NAICS Code (ncode)</label>
                              <input
                                type="text"
                                value={editingSearch.naics || ''}
                                onChange={(e) => updateEditingSearchField('naics', e.target.value)}
                                maxLength={6}
                                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-base placeholder-slate-500"
                                placeholder="6-digit code..."
                              />
                            </div>

                            <div>
                              <label className={LABEL_CLASS}>Classification Code (ccode)</label>
                              <input
                                type="text"
                                value={editingSearch.ccode || ''}
                                onChange={(e) => updateEditingSearchField('ccode', e.target.value)}
                                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-base placeholder-slate-500"
                                placeholder="Classification code..."
                              />
                            </div>

                            <div>
                              <label className={LABEL_CLASS}>Set-Aside Type (typeOfSetAside)</label>
                              <select
                                value={editingSearch.setAside || ''}
                                onChange={(e) => updateEditingSearchField('setAside', e.target.value)}
                                className="relative z-20 w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-base"
                              >
                                <option value="">No Set-Aside</option>
                                {SET_ASIDE_CODES.map((setAside) => (
                                  <option key={setAside.value} value={setAside.value}>
                                    {setAside.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className={LABEL_CLASS}>Organization Name (organizationName)</label>
                              <input
                                type="text"
                                value={editingSearch.agency || ''}
                                onChange={(e) => updateEditingSearchField('agency', e.target.value)}
                                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-base placeholder-slate-500"
                                placeholder="Department or agency name..."
                              />
                            </div>

                            <div>
                              <label className={LABEL_CLASS}>Organization Code (organizationCode)</label>
                              <input
                                type="text"
                                value={editingSearch.organizationCode || ''}
                                onChange={(e) => updateEditingSearchField('organizationCode', e.target.value)}
                                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-base placeholder-slate-500"
                                placeholder="Organization code..."
                              />
                            </div>

                            <div>
                              <label className={LABEL_CLASS}>Place of Performance - State (state)</label>
                              <select
                                value={editingSearch.stateOfPerformance || ''}
                                onChange={(e) => updateEditingSearchField('stateOfPerformance', e.target.value)}
                                className="relative z-20 w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-base"
                              >
                                <option value="">Any</option>
                                {US_STATES.map((state) => (
                                  <option key={state.value} value={state.value}>
                                    {state.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className={LABEL_CLASS}>Place of Performance - Zip (zip)</label>
                              <input
                                type="text"
                                value={editingSearch.zip || ''}
                                onChange={(e) => updateEditingSearchField('zip', e.target.value)}
                                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-base placeholder-slate-500"
                                placeholder="Zip code..."
                              />
                            </div>

                            <div>
                              <label className={LABEL_CLASS}>Opportunity Status (status)</label>
                              <select
                                value={editingSearch.status || ''}
                                onChange={(e) => updateEditingSearchField('status', e.target.value)}
                                className="relative z-20 w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-base"
                              >
                                <option value="">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="archived">Archived</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="deleted">Deleted</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Date Filters Section */}
                        <div className="space-y-4">
                          <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Date Filters</h4>

                          <div className="grid grid-cols-1 gap-4">
                            <div>
                              <label className={LABEL_CLASS}>Posted Date (postedFrom)</label>
                              <input
                                type="date"
                                value={editingSearch.postedAfter || defaults.from || ''}
                                onChange={(e) => updateEditingSearchField('postedAfter', e.target.value)}
                                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                              />
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <span className="text-xs text-emerald-300 font-bold mr-1">Search posted from:</span>
                                {MONTH_RANGE_PRESETS.map((p) => (
                                  <button
                                    key={`search-posted-${p.months}`}
                                    type="button"
                                    onClick={() => {
                                      const now = new Date()
                                      setEditingSearch({
                                        ...editingSearch,
                                        postedAfter: formatDateInput(clampPostedFrom(subMonths(now, p.months), now)),
                                      })
                                    }}
                                    className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 text-xs font-bold border border-emerald-400/30 transition-colors"
                                  >
                                    {p.label} ago
                                  </button>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingSearch({
                                      ...editingSearch,
                                      postedAfter: '',
                                    })
                                  }}
                                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                                >
                                  Clear
                                </button>
                              </div>
                            </div>

                            <div>
                              <label className={LABEL_CLASS}>Response Deadline (rdlfrom)</label>
                              <input
                                type="date"
                                value={editingSearch.rdlfrom || ''}
                                onChange={(e) => updateEditingSearchField('rdlfrom', e.target.value)}
                                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                              />
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <span className="text-xs text-emerald-300 font-bold mr-1">Search for deadlines from:</span>
                                {MONTH_RANGE_PRESETS.map((p) => (
                                  <button
                                    key={`search-rdl-${p.months}`}
                                    type="button"
                                    onClick={() => {
                                      const now = new Date()
                                      const from = subMonths(now, p.months)
                                      
                                      setEditingSearch({
                                        ...editingSearch,
                                        rdlfrom: formatDateInput(from),
                                      })
                                    }}
                                    className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 text-xs font-bold border border-emerald-400/30 transition-colors"
                                  >
                                    {p.label} ago
                                  </button>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingSearch({
                                      ...editingSearch,
                                      rdlfrom: '',
                                    })
                                  }}
                                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                                >
                                  Clear
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-slate-700">
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-slate-400">
                              <span className="text-orange-300 font-semibold">Note:</span> Default search looks back 6 months for Posted Date
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const today = new Date()
                                const sixMonthsAgo = new Date()
                                sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
                                setEditingSearch({
                                  ...editingSearch!,
                                  postedAfter: sixMonthsAgo.toISOString().split('T')[0],
                                })
                              }}
                              className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white text-sm font-semibold shadow-lg transition-all"
                            >
                              Reset Posted Date to 6 months ago
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Display Mode for Saved Search
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
                                {search.subscription_enabled && (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 text-xs font-semibold">
                                    Alert Enabled
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
                                  {(search.postedAfter || search.postedBefore) && (
                                    <div className="md:col-span-2">
                                      <p className="text-sm text-slate-400 mb-1">Date Range</p>
                                      <p className="text-slate-200 font-medium">
                                        {search.postedAfter ? new Date(search.postedAfter).toLocaleDateString() : 'Any'} to{' '}
                                        {search.postedBefore ? new Date(search.postedBefore).toLocaleDateString() : 'Any'}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Stats */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <p className="text-slate-400 mb-1">Used</p>
                                  <p className="text-slate-200 font-medium">{search._count?.runs || 0} times</p>
                                </div>
                                <div>
                                  <p className="text-slate-400 mb-1">Last Used</p>
                                  <p className="text-slate-200 font-medium">{formatRelative(search.last_used_at)}</p>
                                </div>
                                <div>
                                  <p className="text-slate-400 mb-1">Created</p>
                                  <p className="text-slate-200 font-medium">{formatRelative(search.created_at)}</p>
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
                          <button
                            onClick={() => pushToSearchWithSavedSearch(search.id)}
                            disabled={busy}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:opacity-90 transition-all font-semibold flex items-center justify-center gap-2"
                            title="Run this search now"
                          >
                            {busyId === search.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
                            <span>Run Search</span>
                          </button>

                          <button
                            onClick={() => startEditingSearch(search)}
                            disabled={busy}
                            className="px-3 py-2 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-300 border border-orange-500/20 transition-colors flex items-center gap-2"
                            title="Edit this saved search inline"
                          >
                            <Edit className="w-4 h-4" />
                            <span>Edit</span>
                          </button>

                         {/* View Button */}
                          <button
                          onClick={() => setViewingSearch(search)}
                            className="px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 transition-colors flex items-center gap-2"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                            <span className="hidden sm:inline">View</span>
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
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateSavedSearchModal && (
        <UnifiedSaveSearchModal
          isOpen={showCreateSavedSearchModal}
          onClose={() => setShowCreateSavedSearchModal(false)}
          mode="save"
          onSave={createSavedSearch}
        />
      )}

      {showCreateSubscriptionModal && (
        <UnifiedSaveSearchModal
          isOpen={showCreateSubscriptionModal}
          onClose={() => setShowCreateSubscriptionModal(false)}
          mode="alert"
          onSave={createSubscriptionAlert}
        />
      )}

      {/* ENHANCED Pre-Run Confirmation Modal - COMPLETE REPLACEMENT */}
      {runConfirmId && (() => {
        const alert = subscriptions.find(s => s.id === runConfirmId)
        const search = alert?.savedSearch
        const recipientList = alert?.recipients ? alert.recipients.split(',').map(r => r.trim()) : []
        const now = new Date()
        const scheduledTime = now.toLocaleString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        })
        
        // Build search summary
        const searchCriteria = []
        if (search?.keywords) searchCriteria.push({ label: 'Keywords', value: search.keywords })
        if (search?.naics) searchCriteria.push({ label: 'NAICS Code', value: search.naics })
        if (search?.agency) searchCriteria.push({ label: 'Agency', value: search.agency })
        if (search?.setAside) searchCriteria.push({ label: 'Set-Aside', value: search.setAside })
        if (search?.stateOfPerformance) searchCriteria.push({ label: 'State', value: search.stateOfPerformance })
        if (search?.procurementType) searchCriteria.push({ label: 'Type', value: search.procurementType })
        if (search?.opportunityStatus) searchCriteria.push({ label: 'Status', value: search.opportunityStatus })
        
        const hasFilters = searchCriteria.length > 0
        
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-4xl rounded-3xl border-2 border-white/10 bg-slate-900/98 backdrop-blur-xl overflow-hidden shadow-2xl">
              {/* Header */}
              <div className="bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 p-8">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="bg-white/20 rounded-2xl p-3">
                        <PlayCircle className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-3xl font-bold text-white mb-1">Execute Alert</h3>
                        <p className="text-blue-100 text-base">
                          Review details before running
                        </p>
                      </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20">
                      <p className="text-white text-lg font-bold">
                        "{runningAlertName || alert?.name}"
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setRunConfirmId(null)
                      setRunningAlertName('')
                    }}
                    className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-xl"
                  >
                    <X className="h-7 w-7" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-8 max-h-[calc(100vh-300px)] overflow-y-auto space-y-6">
                
                {/* Execution Summary Card */}
                <div className="bg-gradient-to-br from-emerald-500/15 to-green-500/15 rounded-2xl p-6 border-2 border-emerald-500/40">
                  <div className="flex items-start gap-4 mb-5">
                    <div className="bg-emerald-500/30 rounded-xl p-3">
                      <Sparkles className="h-7 w-7 text-emerald-300" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-white mb-2">What Will Happen</h4>
                      <p className="text-base text-emerald-100">
                        Search SAM.gov for federal opportunities, then email results to your configured recipients
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5 bg-slate-800/60 rounded-xl p-4 sm:p-5">
                    <div className="text-center">
                      <div className="flex justify-center mb-3">
                        <div className="bg-blue-500/25 rounded-xl p-3">
                          <Search className="h-7 w-7 text-blue-300" />
                        </div>
                      </div>
                      <p className="text-sm text-slate-300 mb-2 font-medium">Search SAM.gov</p>
                      <p className="text-lg font-bold text-white">
                        Up to {alert?.max_results || search?.limit || 100}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">max results</p>
                    </div>
                    <div className="text-center">
                      <div className="flex justify-center mb-3">
                        <div className="bg-purple-500/25 rounded-xl p-3">
                          <Mail className="h-7 w-7 text-purple-300" />
                        </div>
                      </div>
                      <p className="text-sm text-slate-300 mb-2 font-medium">Email Results</p>
                      <p className="text-lg font-bold text-white">
                        {recipientList.length}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        recipient{recipientList.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="flex justify-center mb-3">
                        <div className="bg-orange-500/25 rounded-xl p-3">
                          <Zap className="h-7 w-7 text-orange-300" />
                        </div>
                      </div>
                      <p className="text-sm text-slate-300 mb-2 font-medium">Execution</p>
                      <p className="text-lg font-bold text-white">Now</p>
                      <p className="text-xs text-slate-400 mt-1">immediately</p>
                    </div>
                  </div>
                </div>

                {/* Email Recipients Card - PROMINENT */}
                <div className="bg-slate-800/60 rounded-2xl p-6 border-2 border-purple-500/30">
                  <div className="flex items-center gap-3 mb-5">
                    <Mail className="h-7 w-7 text-purple-400" />
                    <h4 className="text-xl font-bold text-white">Email Recipients</h4>
                  </div>
                  
                  {recipientList.length > 0 ? (
                    <div className="space-y-3">
                      {recipientList.map((email, idx) => (
                        <div key={idx} className="flex items-center gap-3 bg-slate-900/70 rounded-xl px-5 py-4 border border-slate-700">
                          <div className="bg-purple-500/20 rounded-lg p-2">
                            <Mail className="h-5 w-5 text-purple-400" />
                          </div>
                          <span className="text-base text-white font-semibold flex-1">{email}</span>
                          <span className="text-sm text-emerald-400 font-medium">✓ Active</span>
                        </div>
                      ))}
                      
                      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mt-4">
                        <div className="flex items-start gap-3">
                          <Calendar className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-blue-300 mb-1">Scheduled Time</p>
                            <p className="text-base text-white font-medium">{scheduledTime}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-red-500/15 border-2 border-red-500/40 rounded-xl p-5 flex items-center gap-4">
                      <AlertCircle className="h-8 w-8 text-red-400 flex-shrink-0" />
                      <div>
                        <p className="text-base font-bold text-red-300 mb-1">No Recipients Configured</p>
                        <p className="text-sm text-red-200">Emails will not be sent. Configure recipients in alert settings.</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Search Criteria Card */}
                <div className="bg-slate-800/60 rounded-2xl p-6 border-2 border-blue-500/30">
                  <div className="flex items-center gap-3 mb-5">
                    <Filter className="h-7 w-7 text-blue-400" />
                    <h4 className="text-xl font-bold text-white">Search Criteria</h4>
                  </div>
                  
                  {hasFilters ? (
                    <div className="grid grid-cols-2 gap-4">
                      {searchCriteria.map((criterion, idx) => (
                        <div key={idx} className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
                          <p className="text-sm text-slate-400 mb-2 font-medium">{criterion.label}</p>
                          <p className="text-base font-bold text-white">{criterion.value}</p>
                        </div>
                      ))}
                      
                      {(search?.postedFrom || search?.postedAfter) && (
                        <div className="col-span-2 bg-slate-900/50 rounded-xl p-4 border border-slate-700">
                          <p className="text-sm text-slate-400 mb-2 font-medium">Posted Date Range</p>
                          <p className="text-base font-bold text-white">
                            {search.postedFrom || search.postedAfter || 'Start'} → {search.postedTo || search.postedBefore || 'Today'}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-amber-500/15 border-2 border-amber-500/40 rounded-xl p-5 flex items-start gap-4">
                      <AlertCircle className="h-7 w-7 text-amber-400 flex-shrink-0 mt-1" />
                      <div>
                        <p className="text-base font-bold text-amber-200 mb-1">No Specific Filters Set</p>
                        <p className="text-sm text-amber-300/90">This will search ALL federal opportunities. Results may be very broad.</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Last Run Info */}
                {alert?.last_run_at && (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <Calendar className="h-6 w-6 text-blue-400" />
                      <h4 className="text-lg font-bold text-white">Last Execution</h4>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-base text-slate-300">{formatRelative(alert.last_run_at)}</span>
                      {alert.last_result_count !== null && alert.last_result_count !== undefined && (
                        <span className="text-lg font-bold text-emerald-400">
                          {alert.last_result_count} result{alert.last_result_count !== 1 ? 's' : ''} found
                        </span>
                      )}
                    </div>
                  </div>
                )}

              </div>

              {/* Footer Actions */}
              <div className="p-4 sm:p-8 bg-slate-800/40 border-t-2 border-slate-700 flex gap-3 sm:gap-4">
                <button
                  onClick={() => {
                    setRunConfirmId(null)
                    setRunningAlertName('')
                  }}
                  disabled={busyId === runConfirmId}
                  className="flex-1 px-6 py-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed border-2 border-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => runNow(runConfirmId)}
                  disabled={busyId === runConfirmId}
                  className="flex-1 px-6 py-4 rounded-xl bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:from-emerald-600 hover:via-green-600 hover:to-emerald-700 text-white font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-all shadow-lg shadow-emerald-500/30 border-2 border-emerald-400/30"
                >
                  {busyId === runConfirmId ? (
                    <>
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span>Executing Alert...</span>
                    </>
                  ) : (
                    <>
                      <PlayCircle className="h-6 w-6" />
                      <span>Execute Alert Now</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Delete alert confirm modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-6 transform transition-all">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-red-500 to-rose-500">
                    <Trash2 className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Delete Alert</h3>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  This will permanently delete the alert subscription. This action cannot be undone.
                </p>
              </div>
              <button 
                onClick={() => setDeleteConfirmId(null)} 
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteSubscription(deleteConfirmId)}
                disabled={busyId === deleteConfirmId}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white font-semibold flex items-center gap-2 shadow-lg shadow-red-500/30 transition-all disabled:opacity-50"
              >
                {busyId === deleteConfirmId ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Alert</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Saved Search Confirmation Modal */}
      {deleteSearchConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-6 transform transition-all">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-red-500 to-rose-500">
                    <Trash2 className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Delete Saved Search</h3>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  This will permanently delete the saved search. Any alerts using this search will be disabled. This action cannot be undone.
                </p>
              </div>
              <button 
                onClick={() => setDeleteSearchConfirmId(null)} 
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteSearchConfirmId(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteSavedSearch(deleteSearchConfirmId)}
                disabled={busyId === deleteSearchConfirmId}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white font-semibold flex items-center gap-2 shadow-lg shadow-red-500/30 transition-all disabled:opacity-50"
              >
                {busyId === deleteSearchConfirmId ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Search</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Alert from Search Modal */}
      {showCreateAlertModal && createAlertFromSearch && (
        <UnifiedSaveSearchModal
          isOpen={showCreateAlertModal}
          onClose={() => {
            setShowCreateAlertModal(false)
            setCreateAlertFromSearch(null)
          }}
          mode="alert"
          // In the showCreateAlertModal section, replace the searchParams object:

          searchParams={{
            title: createAlertFromSearch.keywords || undefined,
            solnum: createAlertFromSearch.solnum || undefined,
            noticeid: createAlertFromSearch.noticeid || undefined,
            ptype: createAlertFromSearch.procurementType || undefined,
            typeOfSetAside: createAlertFromSearch.setAside || undefined,
            status: createAlertFromSearch.status || undefined,
            state: createAlertFromSearch.stateOfPerformance || undefined,
            ncode: createAlertFromSearch.naics || undefined,
            ccode: createAlertFromSearch.ccode || undefined,
            zip: createAlertFromSearch.zip || undefined,
            organizationName: createAlertFromSearch.agency || undefined,
            organizationCode: createAlertFromSearch.organizationCode || undefined,
            postedFrom: sanitizePostedFromYmd(createAlertFromSearch.postedAfter) || undefined,
            postedTo: sanitizePostedFromYmd(createAlertFromSearch.postedBefore) || undefined,
            rdlfrom: createAlertFromSearch.rdlfrom || undefined,
            rdlto: createAlertFromSearch.rdlto || undefined,
          }}
          existingSearch={{
            id: createAlertFromSearch.id,
          }}
          onSave={async (alertData: SearchAlert) => {
            if (!alertData.name?.trim()) {
              throw new Error('Alert name is required.')
            }
            if (isDuplicateAlertName(alertData.name)) {
              throw new Error('Alert name must be unique. Please choose a different name.')
            }

            // Build the request data with proper field mapping
            const requestData = {
              name: alertData.name,
              description: alertData.description || createAlertFromSearch.description || '',
              subscription_enabled: true,
              frequency: alertData.frequency || 'DAILY',
              recipients: alertData.recipients,
              email_notification: alertData.email_notification ?? true,
              send_empty_results: alertData.send_empty_results ?? false,
              max_results: alertData.max_results || 100,
              delivery_time: alertData.delivery_time || '09:00',
              export_format: (alertData.file_format || 'csv').toUpperCase(),
              include_links: alertData.include_links ?? true,
              
              // Search criteria from the saved search
              keywords: createAlertFromSearch.keywords,
              solnum: createAlertFromSearch.solnum,
              noticeid: createAlertFromSearch.noticeid,
              naics: createAlertFromSearch.naics,
              ccode: createAlertFromSearch.ccode,
              agency: createAlertFromSearch.agency,
              organizationCode: createAlertFromSearch.organizationCode,
              setAside: createAlertFromSearch.setAside,
              stateOfPerformance: createAlertFromSearch.stateOfPerformance,
              zip: createAlertFromSearch.zip,
              status: createAlertFromSearch.status,
              procurementType: createAlertFromSearch.procurementType || 'o',
              postedAfter: createAlertFromSearch.postedAfter,
              postedBefore: createAlertFromSearch.postedBefore,
              rdlfrom: createAlertFromSearch.rdlfrom,
              rdlto: createAlertFromSearch.rdlto,
            }

            console.log('Creating alert with data:', requestData)

            const res = await fetch('/api/saved-searches', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(requestData),
            })

            const responseData = await res.json()
            
            if (!res.ok) {
              console.error('API error response:', responseData)
              throw new Error(responseData?.error || 'Failed to create alert')
            }

            console.log('Alert created successfully:', responseData)
            
            // Refresh both lists
            await fetchAll()
            
            // Show success message
            setToast({ 
              type: 'success', 
              message: `Alert "${alertData.name}" created successfully!` 
            })
            
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
                          className={clsx(
                            'px-2 py-0.5 rounded-full text-xs',
                            alert.active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-400'
                          )}
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
                          alert.active
                            ? 'bg-orange-500/20 hover:bg-orange-500/30 text-orange-300'
                            : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300'
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

      {/* Success Notification (Centered Modal) */}
      {runSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl shadow-2xl bg-slate-900 border-2 border-emerald-500/30 animate-in zoom-in-95">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="bg-emerald-500 rounded-full p-3">
                    <CheckCircle className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-4">
                    <div>
                      <h4 className="font-bold text-2xl text-white mb-1">Alert Executed Successfully!</h4>
                      <p className="text-base text-slate-300">
                        <strong className="text-emerald-400">"{runSuccess.alertName}"</strong>
                      </p>
                    </div>
                    <button
                      onClick={() => setRunSuccess(null)}
                      className="hover:bg-slate-800 rounded-lg p-2 transition-colors text-slate-400 hover:text-white"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-5">
                    <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                      <Search className="h-5 w-5 text-cyan-400" />
                      <div>
                        <div className="text-xs text-slate-400">Keywords</div>
                        <div className="font-semibold text-white">{runSuccess.keywords}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-emerald-400" />
                      <div>
                        <div className="text-xs text-slate-400">Results</div>
                        <div className="font-semibold text-white">
                          {runSuccess.count} opportunity{runSuccess.count !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                      <Mail className="h-5 w-5 text-orange-400" />
                      <div>
                        <div className="text-xs text-slate-400">Recipients</div>
                        <div className="font-semibold text-white flex items-center gap-2">
                          {runSuccess.recipients.length} recipient{runSuccess.recipients.length !== 1 ? 's' : ''}
                          {runSuccess.email_sent && (
                            <span className="bg-emerald-500/20 px-2 py-0.5 rounded text-xs text-emerald-400">
                              ✓ Sent
                            </span>
                          )}
                          {!runSuccess.email_sent && runSuccess.recipients.length > 0 && (
                            <span className="bg-orange-500/20 px-2 py-0.5 rounded text-xs text-orange-400">
                              ✗ Failed
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                      <Calendar className="h-5 w-5 text-purple-400" />
                      <div>
                        <div className="text-xs text-slate-400">Executed At</div>
                        <div className="font-semibold text-white text-sm">
                          {new Date(runSuccess.timestamp).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Link
                      href={`/alerts?alert=${runSuccess.id}`}
                      onClick={() => setRunSuccess(null)}
                      className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 transition-colors px-5 py-3 rounded-xl font-semibold text-white"
                    >
                      <Eye className="h-5 w-5" />
                      View Alert Details
                    </Link>
                    <button
                      onClick={() => setRunSuccess(null)}
                      className="px-5 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-semibold text-white transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Alert Modal */}
      {editing && showEditModal && (
        <UnifiedSaveSearchModal
          isOpen={showEditModal}
          onClose={() => {
            setEditing(null)
            setShowEditModal(false)
          }}
          mode="alert"
          existingSearch={{
            id: editing.savedSearch?.id,
            name: editing.name,
            description: editing.description || '',
            frequency: editing.frequency,
            recipients: editing.recipients,
            email_notification: editing.email_notification ?? true,
            file_format: editing.file_format || 'csv',
            include_links: editing.include_links,
            send_empty_results: editing.send_empty_results,
            max_results: editing.max_results,
            delivery_time: editing.delivery_time,
          }}
          onSave={async (alertData) => {
            if (!alertData.name?.trim()) {
              throw new Error('Alert name is required.')
            }

            if (isDuplicateAlertName(alertData.name, editing.id)) {
              throw new Error('Alert name must be unique. Please choose a different name.')
            }

            try {
              const res = await fetch(`/api/saved-searches/${editing.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  name: alertData.name,
                  description: alertData.description,
                  subscription_enabled: true,
                  frequency: alertData.frequency,
                  recipients: alertData.recipients,
                  email_notification: alertData.email_notification ?? true,
                  send_empty_results: alertData.send_empty_results ?? false,
                  max_results: alertData.max_results || 100,
                  delivery_time: alertData.delivery_time || null,
                  export_format: (alertData.file_format || 'csv').toUpperCase(),
                  include_links: alertData.include_links ?? true,
                }),
              })

              if (!res.ok) {
                const errorData = await res.json()
                throw new Error(errorData.error || 'Failed to update alert.')
              }

              await fetchAll()
              setShowEditModal(false)
              setEditing(null)
            } catch (err: any) {
              throw new Error(err.message || 'Failed to update alert.')
            }
          }}
        />
      )}

      {/* View Alert Modal */}
      {viewingAlert && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-700 shadow-2xl">
            <div className="sticky top-0 bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Alert Details</h2>
              <button
                onClick={() => setViewingAlert(null)}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Alert Name & Status */}
              <div>
                <h3 className="text-sm font-medium text-slate-400 mb-2">Alert Name</h3>
                <p className="text-lg font-semibold text-white">{viewingAlert.name}</p>
              </div>

              {viewingAlert.description && (
                <div>
                  <h3 className="text-sm font-medium text-slate-400 mb-2">Description</h3>
                  <p className="text-slate-200">{viewingAlert.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-slate-400 mb-2">Status</h3>
                  <p className={`font-medium ${viewingAlert.active ? 'text-emerald-400' : 'text-orange-400'}`}>
                    {viewingAlert.active ? 'Active' : 'Paused'}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-400 mb-2">Frequency</h3>
                  <p className="text-white">{viewingAlert.frequency}</p>
                </div>
              </div>

              {/* Saved Search Info */}
              {viewingAlert.savedSearch && (
                <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                  <h3 className="text-sm font-medium text-slate-400 mb-3">Saved Search</h3>
                  <p className="text-white font-medium mb-2">{viewingAlert.savedSearch.name}</p>
                  {viewingAlert.savedSearch.keywords && (
                    <p className="text-sm text-slate-300">Keywords: {viewingAlert.savedSearch.keywords}</p>
                  )}
                </div>
              )}

              {/* Recipients */}
              <div>
                <h3 className="text-sm font-medium text-slate-400 mb-2">Recipients</h3>
                <p className="text-slate-200">{viewingAlert.recipients}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-slate-400 mb-2">Export Format</h3>
                  <p className="text-white">{(viewingAlert.export_format || viewingAlert.file_format || 'CSV').toUpperCase()}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-400 mb-2">Max Results</h3>
                  <p className="text-white">{viewingAlert.max_results || 100}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-slate-400 mb-2">Last Run</h3>
                  <p className="text-white">{formatRelative(viewingAlert.last_run_at)}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-400 mb-2">Last Results</h3>
                  <p className="text-white">
                    {viewingAlert.last_result_count !== null && viewingAlert.last_result_count !== undefined
                      ? `${viewingAlert.last_result_count} ${viewingAlert.last_result_count === 1 ? 'result' : 'results'}`
                      : '-'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Search Modal */}
      {viewingSearch && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-700 shadow-2xl">
            <div className="sticky top-0 bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Search Details</h2>
              <button
                onClick={() => setViewingSearch(null)}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Search Name */}
              <div>
                <h3 className="text-sm font-medium text-slate-400 mb-2">Search Name</h3>
                <p className="text-lg font-semibold text-white">{viewingSearch.name}</p>
              </div>

              {viewingSearch.description && (
                <div>
                  <h3 className="text-sm font-medium text-slate-400 mb-2">Description</h3>
                  <p className="text-slate-200">{viewingSearch.description}</p>
                </div>
              )}

              {/* Search Criteria */}
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700 space-y-3">
                <h3 className="text-sm font-medium text-slate-400 mb-3">Search Criteria</h3>
                
                {viewingSearch.keywords && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Keywords</p>
                    <p className="text-white">{viewingSearch.keywords}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {viewingSearch.setAside && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Set-Aside</p>
                      <p className="text-white">{viewingSearch.setAside}</p>
                    </div>
                  )}
                  {viewingSearch.procurementType && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Procurement Type</p>
                      <p className="text-white">{viewingSearch.procurementType}</p>
                    </div>
                  )}
                </div>

                {viewingSearch.postedAfter && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Posted Date Range</p>
                    <p className="text-white">
                      {new Date(viewingSearch.postedAfter).toLocaleDateString()}
                      {viewingSearch.postedBefore && ` - ${new Date(viewingSearch.postedBefore).toLocaleDateString()}`}
                    </p>
                  </div>
                )}
              </div>

              {/* Subscription Info if enabled */}
              {viewingSearch.subscription_enabled && (
                <div className="bg-emerald-500/10 rounded-lg p-4 border border-emerald-500/20">
                  <h3 className="text-sm font-medium text-emerald-400 mb-3">Alert Subscription</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400">Frequency</p>
                      <p className="text-white font-medium">{viewingSearch.frequency || 'DAILY'}</p>
                    </div>
                    {viewingSearch.recipients && (
                      <div>
                        <p className="text-slate-400">Recipients</p>
                        <p className="text-white font-medium">{viewingSearch.recipients.split(',').length}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  )
}