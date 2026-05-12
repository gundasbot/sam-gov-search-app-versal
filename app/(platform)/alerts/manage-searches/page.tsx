// app/alerts/manage-searches/page.tsx
'use client'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Bookmark, Plus, Edit3, Trash2, Share2, Play, X, Mail, ExternalLink, Copy, Check, Bell, BellRing, ChevronDown, ChevronUp, Search, Filter, Calendar, Loader2, BookUser, RefreshCw } from 'lucide-react'
import { useEffect, useState, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import QuickSearchPanel, { type QuickSearchParams } from '@/components/QuickSearchPanel'
import TokenInput from '@/components/TokenInput'
import WorkspaceNavRow from '@/components/WorkspaceNavRow'
import { getPersonalizedGreeting, getTimeOfDayEmoji } from '@/lib/greeting'
import {
  PROCUREMENT_TYPE_OPTIONS as SAM_PROCUREMENT_TYPE_OPTIONS,
  SET_ASIDE_CODES,
  US_STATES as SAM_US_STATES,
  OPPORTUNITY_STATUSES,
  COMMON_NAICS_CODES,
  PSC_CATEGORIES,
} from '@/lib/sam-gov-constants'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const PROCUREMENT_TYPE_OPTIONS = SAM_PROCUREMENT_TYPE_OPTIONS
  .filter(o => o.value)
  .map(o => ({ value: o.value, label: o.label }))

const SET_ASIDE_OPTIONS = SET_ASIDE_CODES
  .filter(o => o.value)
  .map(o => ({ value: o.value, label: o.label }))

const US_STATES = SAM_US_STATES
  .filter(o => o.value)
  .map(o => ({ value: o.value, label: o.label }))

const STATUS_OPTIONS = OPPORTUNITY_STATUSES
  .filter(o => o.value)
  .map(o => ({ value: o.value, label: o.label }))

const COMMON_NAICS_OPTIONS = COMMON_NAICS_CODES.map(o => ({ value: o.value, label: o.label }))
const PSC_CATEGORY_OPTIONS = PSC_CATEGORIES.map(o => ({ value: o.value, label: o.label }))

// ---------------------------------------------------------------------------
// Multi-Select Dropdown Component
// ---------------------------------------------------------------------------
interface MultiSelectOption { value: string; label: string }

interface MultiSelectProps {
  options: MultiSelectOption[]
  selected: string[]
  onChange: (values: string[]) => void
  placeholder?: string
}

function MultiSelect({ options, selected, onChange, placeholder = 'Any' }: MultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggle = (value: string) => {
    onChange(selected.includes(value) ? selected.filter(v => v !== value) : [...selected, value])
  }

  const filtered = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))

  const displayText = selected.length === 0
    ? placeholder
    : selected.length === 1
      ? options.find(o => o.value === selected[0])?.label ?? selected[0]
      : `${selected.length} selected`

  return (
    <div className="relative" ref={ref}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => { setOpen(o => !o); setSearch('') }}
        className="w-full px-3 py-2 bg-white border-2 border-blue-400 rounded-lg text-left text-base font-bold transition-colors focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/30 flex items-center justify-between gap-2 min-h-9.5"
      >
        <span className={selected.length === 0 ? 'text-blue-700' : 'text-blue-950 truncate'}>
          {displayText}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          {selected.length > 0 && (
            <span
              onClick={e => { e.stopPropagation(); onChange([]) }}
              className="text-blue-700 hover:text-red-600 cursor-pointer transition-colors"
              title="Clear all"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-blue-700 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Selected tags (shown when multiple selected) */}
      {selected.length > 1 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {selected.map(v => {
            const opt = options.find(o => o.value === v)
            return (
              <span key={v} className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-600 border border-orange-700 text-white rounded-md text-sm font-black">
                {opt?.label ?? v}
                <button type="button" onClick={() => toggle(v)} className="hover:text-red-200 transition-colors ml-0.5">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )
          })}
        </div>
      )}

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-55 bg-white border-2 border-blue-400 rounded-xl shadow-2xl overflow-hidden">
          {/* Search within dropdown */}
          {options.length > 5 && (
            <div className="p-2 border-b border-blue-200">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search…"
                className="w-full px-2.5 py-1.5 bg-white border border-blue-300 rounded-lg text-blue-900 text-sm font-semibold placeholder-blue-500 focus:outline-none focus:border-blue-500"
                autoFocus
              />
            </div>
          )}
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-3 py-3 text-sm text-blue-800 text-center font-semibold">No matches</div>
            ) : filtered.map(o => (
              <button
                key={o.value}
                type="button"
                onClick={() => toggle(o.value)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors flex items-center gap-2.5"
              >
                <span className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-colors ${selected.includes(o.value) ? 'bg-blue-600 border-blue-600' : 'border-blue-300 bg-white'}`}>
                  {selected.includes(o.value) && <Check className="w-2.5 h-2.5 text-white" />}
                </span>
                <span className={selected.includes(o.value) ? 'text-blue-950 font-bold' : 'text-blue-800 font-semibold'}>
                  {o.label}
                </span>
              </button>
            ))}
          </div>
          {selected.length > 0 && (
            <div className="border-t border-blue-200 p-2">
              <button
                type="button"
                onClick={() => { onChange([]); setOpen(false) }}
                className="w-full text-sm text-blue-700 hover:text-red-600 transition-colors py-1 text-center font-semibold"
              >
                Clear all ({selected.length} selected)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface SavedSearch {
  id: string
  name: string
  params: Record<string, any>
  createdAt: string
  runCount?: number
}

interface FilterForm {
  name: string
  keyword: string
  ptypes: string[]      // multi: procurement types
  states: string[]      // multi: US states
  ncode: string
  ccode: string
  setAsides: string[]   // multi: set-asides
  organizationName: string
  status: string
  postedFrom: string
  rdlto: string
  solnum: string
  zip: string
  limit: number
}

function getSixMonthsAgo(): string {
  const d = new Date()
  d.setMonth(d.getMonth() - 6)
  return d.toISOString().split('T')[0]
}

function daySuffix(day: number): string {
  if (day >= 11 && day <= 13) return 'th'
  const last = day % 10
  if (last === 1) return 'st'
  if (last === 2) return 'nd'
  if (last === 3) return 'rd'
  return 'th'
}

function formatLaymanDate(value?: string | Date | null): string {
  if (!value) return ''
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return typeof value === 'string' ? value : ''
  const month = d.toLocaleDateString('en-US', { month: 'long' })
  const day = d.getDate()
  const year = d.getFullYear()
  return `${month} ${day}${daySuffix(day)} ${year}`
}

function makeEmptyForm(): FilterForm {
  return {
    name: '', keyword: '', ptypes: [], states: [], ncode: '', ccode: '',
    setAsides: [], organizationName: '', status: '',
    postedFrom: getSixMonthsAgo(), rdlto: '', solnum: '', zip: '', limit: 1000,
  }
}

// Coerce a param value (string or array) to string[]
function toArray(val: any): string[] {
  if (!val) return []
  if (Array.isArray(val)) return val.filter(Boolean)
  return String(val).split(',').map((s: string) => s.trim()).filter(Boolean)
}

function appendCsvValue(current: string, nextValue: string): string {
  if (!nextValue) return current
  const values = toArray(current)
  if (values.includes(nextValue)) return current
  return [...values, nextValue].join(', ')
}

function buildFilterSummary(f: FilterForm): string {
  const parts: string[] = []
  if (f.keyword) parts.push(`"${f.keyword}"`)
  if (f.ptypes.length) parts.push(f.ptypes.map(v => PROCUREMENT_TYPE_OPTIONS.find(p => p.value === v)?.label ?? v).join(', '))
  if (f.states.length) parts.push(f.states.map(v => US_STATES.find(s => s.value === v)?.label ?? v).join(', '))
  if (f.ncode) parts.push(`NAICS ${f.ncode}`)
  if (f.ccode) parts.push(`PSC ${f.ccode}`)
  if (f.setAsides.length) parts.push(f.setAsides.map(v => SET_ASIDE_OPTIONS.find(s => s.value === v)?.label ?? v).join(', '))
  if (f.organizationName) parts.push(f.organizationName)
  if (f.postedFrom) parts.push(`from ${formatLaymanDate(f.postedFrom)}`)
  if (f.rdlto) parts.push(`due by ${formatLaymanDate(f.rdlto)}`)
  if (f.solnum) parts.push(`Sol# ${f.solnum}`)
  return parts.join(' · ')
}

// ---------------------------------------------------------------------------
// Run Confirmation Modal
// ---------------------------------------------------------------------------
function RunConfirmModal({ search, onConfirm, onClose }: {
  search: SavedSearch
  onConfirm: () => void
  onClose: () => void
}) {
  const sp = search.params ?? {}
  const postedFromValue = sp.postedFrom || sp.posted_after || sp.postedAfter || ''
  const dueByValue = sp.rdlto || sp.rdl_to || ''

  // Build a list of every active filter to display
  const filters: { label: string; value: string }[] = []
  const kw = sp.keyword || sp.title
  if (kw) filters.push({ label: 'Keywords', value: kw })

  const ptypeArr = toArray(sp.ptype ?? sp.ptypes)
  if (ptypeArr.length) {
    filters.push({
      label: 'Procurement Type',
      value: ptypeArr.map(v => PROCUREMENT_TYPE_OPTIONS.find(p => p.value === v)?.label ?? v).join(', '),
    })
  }

  const setAsideArr = toArray(sp.typeOfSetAside ?? sp.setAsides)
  if (setAsideArr.length) {
    filters.push({
      label: 'Set-Aside',
      value: setAsideArr.map(v => SET_ASIDE_OPTIONS.find(o => o.value === v)?.label ?? v).join(', '),
    })
  }

  const stateArr = toArray(sp.state ?? sp.states)
  if (stateArr.length) {
    filters.push({
      label: 'State',
      value: stateArr.map(v => US_STATES.find(o => o.value === v)?.label ?? v).join(', '),
    })
  }

  if (sp.ncode) filters.push({ label: 'NAICS Code', value: sp.ncode })
  if (sp.ccode) filters.push({ label: 'PSC Code', value: sp.ccode })
  if (sp.organizationName) filters.push({ label: 'Agency', value: sp.organizationName })
  if (sp.solnum) filters.push({ label: 'Solicitation #', value: sp.solnum })
  if (sp.status) filters.push({ label: 'Status', value: sp.status })
  if (postedFromValue) filters.push({ label: 'Posted After', value: formatLaymanDate(postedFromValue) })
  if (dueByValue) filters.push({ label: 'Response Deadline Before', value: formatLaymanDate(dueByValue) })

  const dateNote = postedFromValue
    ? `Searching from ${formatLaymanDate(postedFromValue)} to today`
    : 'No date filter — SAM.gov will default to the last 364 days'

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-600 rounded-2xl max-w-lg w-full p-6 shadow-2xl">

        {/* Header */}
        <div className="flex justify-between items-start mb-5">
          <div>
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <Search className="w-5 h-5 text-emerald-400" />
              Confirm Search
            </h3>
            <p className="text-slate-300 font-semibold mt-0.5">{search.name}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter preview */}
        <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-4 mb-5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5 mb-3">
            <Filter className="w-3.5 h-3.5" /> Active Filters
          </p>

          {filters.length === 0 ? (
            <p className="text-sm text-slate-400 italic">
              No filters set — will match all recent federal opportunities
            </p>
          ) : (
            <div className="space-y-2">
              {filters.map(f => (
                <div key={f.label} className="flex items-start gap-2 text-sm">
                  <span className="text-slate-500 min-w-35 shrink-0 text-xs pt-0.5">{f.label}</span>
                  <span className="text-white font-medium leading-snug">{f.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Date range note */}
          <div className="mt-3 pt-3 border-t border-slate-700 flex items-center gap-2 text-xs text-slate-500">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span>{dateNote}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-colors shadow-lg"
          >
            <Play className="w-4 h-4" /> Run Search
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Inner component (uses useSearchParams so needs Suspense wrapper)
// ---------------------------------------------------------------------------
function ManageSearchesContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { data: session } = useSession()

  const [searches, setSearches] = useState<SavedSearch[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<FilterForm>(makeEmptyForm)
  const [saving, setSaving] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [shareSearch, setShareSearch] = useState<SavedSearch | null>(null)
  const [shareRecipients, setShareRecipients] = useState<string[]>([])
  const [shareEmailInput, setShareEmailInput] = useState('')
  const [shareFormat, setShareFormat] = useState('CSV')
  const [shareSending, setShareSending] = useState(false)
  const [shareSent, setShareSent] = useState(false)
  const [shareLinkCopied, setShareLinkCopied] = useState(false)
  const [contacts, setContacts] = useState<Array<{ id: string; email: string; firstName?: string | null; lastName?: string | null; organization?: string | null }>>([])
  const [shareContactSearch, setShareContactSearch] = useState('')
  const [shareMessage, setShareMessage] = useState('')
  const [contactsLoading, setContactsLoading] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [confirmSearch, setConfirmSearch] = useState<SavedSearch | null>(null)
  const [sortField, setSortField] = useState<'name' | 'createdAt' | 'runCount'>('createdAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [naicsQuickPick, setNaicsQuickPick] = useState('')
  const [pscQuickPick, setPscQuickPick] = useState('')

  // ── Pre-fill from URL when arriving from Search page ──────────────────
  useEffect(() => {
    if (!searchParams) return
    if (searchParams.get('new') !== '1') return

    const kw = searchParams.get('title') || ''
    const prefilled: FilterForm = {
      name: kw ? `${kw} – Saved Search` : 'My Saved Search',
      keyword: kw,
      ptypes: toArray(searchParams.get('ptype')),
      states: toArray(searchParams.get('state')),
      ncode: searchParams.get('ncode') || '',
      ccode: searchParams.get('ccode') || '',
      setAsides: toArray(searchParams.get('typeOfSetAside')),
      organizationName: searchParams.get('organizationName') || '',
      status: searchParams.get('status') || '',
      postedFrom: searchParams.get('postedFrom') || '',
      rdlto: searchParams.get('rdlto') || '',
      solnum: searchParams.get('solnum') || '',
      zip: searchParams.get('zip') || '',
      limit: 1000,
    }
    setFormData(prefilled)
    setEditingId(null)
    setShowForm(true)
    window.history.replaceState({}, '', '/alerts/manage-searches')
  }, [searchParams])

  useEffect(() => { loadSearches(); loadContacts() }, [])

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const loadContacts = async (showLoading = false) => {
    if (showLoading) setContactsLoading(true)
    try {
      const res = await fetch('/api/address-book')
      const data = await res.json()
      setContacts(Array.isArray(data) ? data : [])
    } catch { setContacts([]) }
    finally { if (showLoading) setContactsLoading(false) }
  }

  const loadSearches = async () => {
    try {
      const res = await fetch('/api/saved-searches')
      const data = await res.json()
      const rawArr = Array.isArray(data) ? data : (Array.isArray(data?.searches) ? data.searches : [])

      // Map flat DB fields into the SavedSearch shape the component expects
      const fmtDate = (dt: string | Date | null | undefined): string => {
        if (!dt) return ''
        try { return new Date(dt).toISOString().split('T')[0] } catch { return '' }
      }

      interface ApiSearch {
        id: string; name: string; created_at?: string; createdAt?: string
        keywords?: string; procurement_type?: string; state_of_performance?: string
        naics?: string; classification_code?: string; set_aside?: string
        agency?: string; opportunity_status?: string; runCount?: number
        posted_after?: string | Date; posted_before?: string | Date
        rdl_from?: string | Date; rdl_to?: string | Date
        solicitation_number?: string; max_results?: number
        place_of_performance_zip?: string
        _count?: { search_runs?: number }
      }

      const arr: SavedSearch[] = (rawArr as ApiSearch[]).map((s) => ({
        id: s.id,
        name: s.name,
        createdAt: s.created_at || s.createdAt || new Date().toISOString(),
        runCount: s._count?.search_runs ?? s.runCount ?? 0,
        params: {
          keyword:          s.keywords || '',
          title:            s.keywords || '',
          ptype:            s.procurement_type || '',
          state:            s.state_of_performance || '',
          ncode:            s.naics || '',
          ccode:            s.classification_code || '',
          typeOfSetAside:   s.set_aside || '',
          organizationName: s.agency || '',
          status:           s.opportunity_status || '',
          postedFrom:       fmtDate(s.posted_after),
          rdlto:            fmtDate(s.rdl_to),
          zip:              s.place_of_performance_zip || '',
          solnum:           s.solicitation_number || '',
          limit:            s.max_results || 1000,
        },
      }))

      setSearches(arr)
    } catch { setSearches([]) }
    finally { setLoading(false) }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    try {
      const res = await fetch(`/api/saved-searches/${id}`, { method: 'DELETE' })
      if (res.ok) { setSearches(prev => prev.filter(s => s.id !== id)); showToast(`"${name}" deleted.`) }
      else { const e = await res.json(); showToast(e.error || 'Delete failed.', 'error') }
    } catch { showToast('Delete failed.', 'error') }
  }

  const handleRun = (s: SavedSearch) => {
    setConfirmSearch(s)
  }

  const handleConfirmRun = () => {
    if (!confirmSearch) return
    setConfirmSearch(null)
    router.push(`/search?loadSavedSearch=${confirmSearch.id}&run=1`)
  }

  const handleEdit = (s: SavedSearch) => {
    const sp = s.params || {}
    setEditingId(s.id)
    setFormData({
      name: s.name,
      keyword: sp.keyword || sp.title || '',
      ptypes: toArray(sp.ptype ?? sp.ptypes),
      states: toArray(sp.state ?? sp.states),
      ncode: sp.ncode || '',
      ccode: sp.ccode || '',
      setAsides: toArray(sp.typeOfSetAside ?? sp.setAsides),
      organizationName: sp.organizationName || '',
      status: sp.status || sp.opportunityStatus || '',
      postedFrom: sp.postedFrom || sp.posted_after || sp.postedAfter || '',
      rdlto: sp.rdlto || '',
      solnum: sp.solnum || sp.solicitationNumber || '',
      zip: sp.zip || sp.placeOfPerformanceZip || '',
      limit: sp.limit || 1000,
    })
    setShowForm(true)
    showToast(`Editing: "${s.name}"`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSave = async () => {
    if (!formData.name.trim()) { showToast('Search name is required.', 'error'); return }
    setSaving(true)
    const endpoint = editingId ? `/api/saved-searches/${editingId}` : '/api/saved-searches'
    const method = editingId ? 'PATCH' : 'POST'

    // Build a flat body that both the POST and PATCH API endpoints understand.
    // POST uses: keywords, naics, setAside, stateOfPerformance, procurementType,
    //            solnum, ccode, posted_after, rdlto, agency, max_results
    // PATCH uses the same names except: solicitationNumber, classificationCode,
    //            postedAfter, opportunityStatus (also accepts rdlto)
    // Sending both variants ensures either handler picks up what it needs.
    const saveBody: Record<string, string | number | undefined> = {
      name:               formData.name.trim(),
      keywords:           formData.keyword      || undefined,
      naics:              formData.ncode         || undefined,
      // classification / PSC code — POST key vs PATCH key
      ccode:              formData.ccode         || undefined,
      classificationCode: formData.ccode         || undefined,
      // set-aside (comma-separated)
      setAside:           formData.setAsides.length  ? formData.setAsides.join(',')  : undefined,
      // state of performance (comma-separated)
      stateOfPerformance: formData.states.length ? formData.states.join(',')  : undefined,
      // procurement type (comma-separated)
      procurementType:    formData.ptypes.length ? formData.ptypes.join(',')   : undefined,
      agency:             formData.organizationName || undefined,
      // status — POST key vs PATCH key
      status:             formData.status        || undefined,
      opportunityStatus:  formData.status        || undefined,
      // solicitation number — POST key vs PATCH key
      solnum:             formData.solnum        || undefined,
      solicitationNumber: formData.solnum        || undefined,
      // posted after — POST key vs PATCH key
      posted_after:       formData.postedFrom    || undefined,
      postedAfter:        formData.postedFrom    || undefined,
      // response deadline upper bound
      rdlto:              formData.rdlto         || undefined,
      // place of performance ZIP
      zip:                formData.zip           || undefined,
      placeOfPerformanceZip: formData.zip        || undefined,
      max_results:        formData.limit,
    }

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saveBody),
      })
      if (res.ok) {
        await loadSearches()
        setShowForm(false); setEditingId(null); setFormData(makeEmptyForm())
        showToast(editingId ? 'Search updated!' : 'Search saved successfully!')
      } else {
        const e = await res.json(); showToast(e.error || 'Failed to save.', 'error')
      }
    } catch { showToast('Failed to save.', 'error') }
    finally { setSaving(false) }
  }

  const handleCopyLink = (s: SavedSearch) => {
    const p = new URLSearchParams()
    const sp = s.params
    if (sp.keyword || sp.title) p.set('q', sp.keyword || sp.title)
    if (sp.ncode) p.set('ncode', sp.ncode)
    const setAsides = toArray(sp.typeOfSetAside ?? sp.setAsides)
    if (setAsides.length) p.set('typeOfSetAside', setAsides.join(','))
    const states = toArray(sp.state ?? sp.states)
    if (states.length) p.set('state', states.join(','))
    navigator.clipboard.writeText(`${window.location.origin}/search?${p.toString()}`)
    setCopiedId(s.id); setTimeout(() => setCopiedId(null), 2000)
    showToast('Link copied!')
  }

  const closeShareModal = () => {
    setShareSearch(null)
    setShareRecipients([])
    setShareEmailInput('')
    setShareFormat('CSV')
    setShareSending(false)
    setShareSent(false)
    setShareLinkCopied(false)
    setShareContactSearch('')
    setShareMessage('')
  }

  const addShareRecipient = () => {
    const email = shareEmailInput.trim()
    if (!email || !email.includes('@') || shareRecipients.includes(email)) return
    setShareRecipients(r => [...r, email])
    setShareEmailInput('')
  }

  const handleSendShare = async () => {
    if (!shareSearch || shareRecipients.length === 0) return
    setShareSending(true)
    try {
      const res = await fetch(`/api/saved-searches/${shareSearch.id}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ overrideRecipients: shareRecipients, overrideFormat: shareFormat, message: shareMessage || undefined }),
      })
      const data = await res.json()
      if (data.success === false) throw new Error(data.error_message || 'Failed to send')
      setShareSent(true)
      setTimeout(() => {
        closeShareModal()
        showToast(`Results sent to ${shareRecipients.length} recipient${shareRecipients.length !== 1 ? 's' : ''}!`)
      }, 2000)
    } catch (err: any) {
      showToast(err.message || 'Failed to send results', 'error')
    } finally {
      setShareSending(false)
    }
  }

  const handleConvertToAlert = (s: SavedSearch) => {
    const p = new URLSearchParams()
    const sp = s.params
    if (sp.keyword || sp.title) p.set('title', sp.keyword || sp.title)
    if (sp.ncode) p.set('ncode', sp.ncode)
    if (sp.ccode) p.set('ccode', sp.ccode)
    const setAsides = toArray(sp.typeOfSetAside ?? sp.setAsides)
    if (setAsides.length) p.set('typeOfSetAside', setAsides.join(','))
    const states = toArray(sp.state ?? sp.states)
    if (states.length) p.set('state', states.join(','))
    const ptypes = toArray(sp.ptype ?? sp.ptypes)
    if (ptypes.length) p.set('ptype', ptypes.join(','))
    if (sp.organizationName) p.set('organizationName', sp.organizationName)
    router.push(`/alerts/manage-alerts?new=1&${p.toString()}`)
  }

  // ── Sort helper ───────────────────────────────────────────────────────
  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  const sortedSearches = [...searches].sort((a, b) => {
    let cmp = 0
    if (sortField === 'name') cmp = a.name.localeCompare(b.name)
    else if (sortField === 'createdAt') cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    else if (sortField === 'runCount') cmp = (a.runCount ?? 0) - (b.runCount ?? 0)
    return sortDir === 'asc' ? cmp : -cmp
  })

  // ── Styles ────────────────────────────────────────────────────────────
  const inputCls = 'w-full px-3 py-2.5 bg-white border-2 border-blue-400 rounded-lg text-blue-950 placeholder-slate-500 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/30 text-base font-bold transition-colors'
  const labelCls = 'block text-base font-black text-blue-950 mb-1.5 uppercase tracking-wide'

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-surface)' }}>
      <div className="text-slate-900 text-center">
        <div className="animate-spin h-12 w-12 border-4 border-teal-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-lg font-semibold">Loading saved searches…</p>
      </div>
    </div>
  )

  return (

    <div style={{ background: 'var(--color-surface)', color: 'var(--color-text-primary)' }} className="min-h-screen manage-searches-page">

      {/* Toast notification */}
      {toast && (
        <div className={`fixed top-5 right-5 z-100 px-5 py-3 rounded-xl shadow-xl font-semibold text-sm flex items-center gap-2 animate-in slide-in-from-right ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-teal-600 text-white'}`}>
          {toast.type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}


      <div className="max-w-480 mx-auto px-3 sm:px-6 lg:px-8 py-8">
        <section className="mb-6">
          <WorkspaceNavRow active="saved-searches" count={searches.length} />
        </section>

        {/* Create New Saved Search action */}
        <div className="flex flex-wrap mb-6 items-center gap-3">
          <button
            onClick={() => { setShowForm(true); setEditingId(null); setFormData(makeEmptyForm()) }}
            className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl flex items-center gap-2 text-base transition-colors shadow-md"
          >
            <Plus className="w-5 h-5" /> Create a New Saved Search
          </button>
        </div>

        {/* ── Quick Search Panel ────────────────────────────────────── */}
        <div className="mb-6">
          <QuickSearchPanel
            theme="light"
            onSaveSearch={(params: QuickSearchParams) => {
              // NOTE: This currently only opens the form prefilled, does not save directly
              setFormData({
                ...makeEmptyForm(),
                name: params.keyword ? `${params.keyword} – Saved Search` : 'My Saved Search',
                keyword: params.keyword || '',
                ptypes: params.ptypes || [],
                states: params.states || [],
                ncode: params.ncode || '',
                ccode: params.ccode || '',
                setAsides: params.setAside ? [params.setAside] : [],
                organizationName: params.organizationName || '',
              })
              setEditingId(null)
              setShowForm(true)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            onCreateAlert={(params: QuickSearchParams) => {
              const qp = new URLSearchParams({ new: '1' })
              if (params.keyword) qp.set('title', params.keyword)
              if (params.ncode) qp.set('ncode', params.ncode)
              if (params.ccode) qp.set('ccode', params.ccode)
              if (params.states?.length) qp.set('state', params.states.join(','))
              if (params.ptypes?.length) qp.set('ptype', params.ptypes.join(','))
              if (params.setAside) qp.set('typeOfSetAside', params.setAside)
              if (params.organizationName) qp.set('organizationName', params.organizationName)
              router.push(`/alerts/manage-alerts?${qp.toString()}`)
            }}
          />
          <div className="mt-3 rounded-lg border-2 border-orange-700 bg-orange-600 px-4 py-2.5 text-base font-black text-white">
            Note: The Quick Search panel currently only pre-fills the form. Saving requires completing the form below.
          </div>
        </div>

        {/* ── Create / Edit Form ────────────────────────────────────── */}
        {showForm && (
          <div className="saved-search-form-surface w-full bg-white border-2 border-blue-300 rounded-2xl p-6 lg:p-7 mb-8 shadow-xl transition-colors">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-2xl font-black text-blue-950 flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-blue-700" />
                {editingId ? 'Edit Saved Search' : 'Save New Search'}
              </h2>
              <button onClick={() => { setShowForm(false); setEditingId(null); setFormData(makeEmptyForm()) }} className="text-blue-600 hover:text-blue-900 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Live filter preview */}
            {buildFilterSummary(formData) && (
              <div className="filter-preview mb-5 px-4 py-3 bg-blue-700 border-2 border-blue-600 rounded-xl text-white text-base font-bold">
                <span className="text-white font-black">Filter preview: </span>
                <span className="text-white font-bold">{buildFilterSummary(formData)}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Name — full width */}
              <div className="md:col-span-2 lg:col-span-3">
                <label className={labelCls}>Search Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g., SDVOSB IT Services Virginia"
                  className={inputCls}
                  autoFocus
                />
              </div>

              {/* Keywords */}
              <div className="md:col-span-2">
                <label className={labelCls}>Keywords / Title</label>
                <input
                  type="text"
                  value={formData.keyword}
                  onChange={e => setFormData(f => ({ ...f, keyword: e.target.value }))}
                  placeholder="e.g., cybersecurity, data analytics"
                  className={inputCls}
                />
              </div>

              {/* NAICS */}
              <div>
                <label className={labelCls}>NAICS Code</label>
                <TokenInput
                  theme="light"
                  className="border-2 border-blue-400 focus-within:border-blue-600"
                  value={formData.ncode}
                  onChange={v => setFormData(f => ({ ...f, ncode: v }))}
                  placeholder="e.g. 541512 — Enter to add more"
                />
                <div className="mt-1.5 flex items-center gap-2">
                  <select
                    value={naicsQuickPick}
                    onChange={e => setNaicsQuickPick(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 bg-white border-2 border-blue-400 rounded-lg text-sm font-bold text-blue-950"
                  >
                    <option value="">Add common NAICS…</option>
                    {COMMON_NAICS_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      if (!naicsQuickPick) return
                      setFormData(f => ({ ...f, ncode: appendCsvValue(f.ncode, naicsQuickPick) }))
                      setNaicsQuickPick('')
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 border border-blue-900 text-white text-sm font-black"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Procurement Type — MULTI-SELECT */}
              <div>
                <label className={labelCls}>Procurement Type</label>
                <MultiSelect
                  options={PROCUREMENT_TYPE_OPTIONS}
                  selected={formData.ptypes}
                  onChange={vals => setFormData(f => ({ ...f, ptypes: vals }))}
                  placeholder="Any Type"
                />
              </div>

              {/* State — MULTI-SELECT */}
              <div>
                <label className={labelCls}>State</label>
                <MultiSelect
                  options={US_STATES}
                  selected={formData.states}
                  onChange={vals => setFormData(f => ({ ...f, states: vals }))}
                  placeholder="Any State"
                />
              </div>

              {/* Status */}
              <div>
                <label className={labelCls}>Opportunity Status</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData(f => ({ ...f, status: e.target.value }))}
                  className={inputCls}
                >
                  <option value="">Any Status</option>
                  {STATUS_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Set-Aside — MULTI-SELECT */}
              <div>
                <label className={labelCls}>Set-Aside</label>
                <MultiSelect
                  options={SET_ASIDE_OPTIONS}
                  selected={formData.setAsides}
                  onChange={vals => setFormData(f => ({ ...f, setAsides: vals }))}
                  placeholder="Any Set-Aside"
                />
              </div>

              {/* PSC */}
              <div>
                <label className={labelCls}>PSC Code</label>
                <TokenInput
                  theme="light"
                  className="border-2 border-blue-400 focus-within:border-blue-600"
                  value={formData.ccode}
                  onChange={v => setFormData(f => ({ ...f, ccode: v }))}
                  placeholder="e.g. D307 — Enter to add more"
                />
                <div className="mt-1.5 flex items-center gap-2">
                  <select
                    value={pscQuickPick}
                    onChange={e => setPscQuickPick(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 bg-white border-2 border-blue-400 rounded-lg text-sm font-bold text-blue-950"
                  >
                    <option value="">Add PSC category…</option>
                    {PSC_CATEGORY_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      if (!pscQuickPick) return
                      setFormData(f => ({ ...f, ccode: appendCsvValue(f.ccode, pscQuickPick) }))
                      setPscQuickPick('')
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 border border-blue-900 text-white text-sm font-black"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Agency */}
              <div>
                <label className={labelCls}>Agency / Organization</label>
                <TokenInput
                  theme="light"
                  className="border-2 border-blue-400 focus-within:border-blue-600"
                  value={formData.organizationName}
                  onChange={v => setFormData(f => ({ ...f, organizationName: v }))}
                  placeholder="e.g. Department of Defense — Enter to add more"
                />
              </div>

              {/* Solicitation # */}
              <div>
                <label className={labelCls}>Solicitation Number</label>
                <input
                  type="text"
                  value={formData.solnum}
                  onChange={e => setFormData(f => ({ ...f, solnum: e.target.value }))}
                  placeholder="e.g., FA8501-24-Q-0001"
                  className={inputCls}
                />
              </div>

              {/* Place of Performance ZIP */}
              <div>
                <label className={labelCls}>Place of Performance ZIP</label>
                <input
                  type="text"
                  value={formData.zip}
                  onChange={e => setFormData(f => ({ ...f, zip: e.target.value }))}
                  placeholder="e.g., 22203"
                  className={inputCls}
                />
              </div>

              {/* Posted From */}
              <div>
                <label className={labelCls}>Posted From</label>
                <input
                  type="date"
                  value={formData.postedFrom}
                  onChange={e => setFormData(f => ({ ...f, postedFrom: e.target.value }))}
                  className={inputCls}
                />
              </div>

              {/* Deadline By */}
              <div>
                <label className={labelCls}>Deadline By</label>
                <input
                  type="date"
                  value={formData.rdlto}
                  onChange={e => setFormData(f => ({ ...f, rdlto: e.target.value }))}
                  className={inputCls}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-5 border-t border-blue-200">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 border border-orange-800 text-white font-black rounded-lg flex items-center gap-2 text-base transition-colors shadow-md"
              >
                {saving
                  ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving…</>
                  : <><Bookmark className="w-4 h-4" />{editingId ? 'Update Search' : 'Save Search'}</>
                }
              </button>
              <button
                onClick={() => { setShowForm(false); setEditingId(null); setFormData(makeEmptyForm()) }}
                className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white border border-blue-900 font-black rounded-lg text-base transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ── Saved searches list ───────────────────────────────────── */}
        {searches.length === 0 && !showForm ? (
          <div className="text-center text-blue-900 py-20 bg-white border-2 border-blue-300 rounded-2xl shadow-sm">
            <div className="w-20 h-20 rounded-2xl bg-blue-50 border border-blue-300 flex items-center justify-center mx-auto mb-5">
              <Bookmark className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-2xl font-black text-blue-900 mb-2">No Saved Searches Yet</h3>
            <p className="text-blue-700 mb-6 max-w-sm mx-auto font-semibold">
              Run a search and click <strong className="text-teal-700">Save Search</strong>, or create one manually here.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link href="/search" className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-lg text-base transition-colors flex items-center gap-2">
                <ExternalLink className="w-4 h-4" /> Go to Search
              </Link>
              <button
                onClick={() => setShowForm(true)}
                className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-black rounded-lg text-base transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Create Manually
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white border-2 border-blue-300 rounded-2xl overflow-hidden shadow-sm">
            {/* Sort column header */}
            <div className="grid grid-cols-[1fr_180px_90px_auto] gap-0 border-b-2 border-blue-700 bg-blue-700 px-4 py-3 text-sm font-black text-white uppercase tracking-wide">
              <button
                onClick={() => toggleSort('name')}
                className="flex items-center gap-1.5 hover:text-blue-100 transition-colors text-left"
              >
                Name
                {sortField === 'name' ? (
                  sortDir === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-blue-100" /> : <ChevronDown className="w-3.5 h-3.5 text-blue-100" />
                ) : <ChevronDown className="w-3.5 h-3.5 opacity-60" />}
              </button>
              <button
                onClick={() => toggleSort('createdAt')}
                className="flex items-center gap-1.5 hover:text-blue-100 transition-colors"
              >
                Date Created
                {sortField === 'createdAt' ? (
                  sortDir === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-blue-100" /> : <ChevronDown className="w-3.5 h-3.5 text-blue-100" />
                ) : <ChevronDown className="w-3.5 h-3.5 opacity-60" />}
              </button>
              <button
                onClick={() => toggleSort('runCount')}
                className="flex items-center gap-1.5 hover:text-blue-100 transition-colors"
              >
                Runs
                {sortField === 'runCount' ? (
                  sortDir === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-blue-100" /> : <ChevronDown className="w-3.5 h-3.5 text-blue-100" />
                ) : <ChevronDown className="w-3.5 h-3.5 opacity-60" />}
              </button>
              <span>Actions</span>
            </div>

            <div className="divide-y divide-blue-200">
              {sortedSearches.map((search, index) => {
                const sp = search.params ?? {}
                const summary = buildFilterSummary({
                  name: search.name,
                  keyword: sp.keyword || sp.title || '',
                  ptypes: toArray(sp.ptype ?? sp.ptypes),
                  states: toArray(sp.state ?? sp.states),
                  ncode: sp.ncode || '',
                  ccode: sp.ccode || '',
                  setAsides: toArray(sp.typeOfSetAside ?? sp.setAsides),
                  organizationName: sp.organizationName || '',
                  status: sp.status || '',
                  postedFrom: sp.postedFrom || sp.posted_after || sp.postedAfter || '',
                  rdlto: sp.rdlto || sp.rdl_to || '',
                  solnum: sp.solnum || '',
                  zip: sp.zip || '',
                  limit: sp.limit || 1000,
                })

                const createdDate = new Date(search.createdAt)
                const dateStr = formatLaymanDate(createdDate)
                const timeStr = createdDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

                return (
                  <div
                    key={search.id}
                    className="grid grid-cols-[1fr_180px_90px_auto] gap-0 items-start px-4 py-4 hover:bg-blue-50 transition-colors border-l-4 border-l-blue-600"
                  >
                    {/* Name + field values */}
                    <div className="min-w-0 pr-4">
                      <p className="text-xs font-black uppercase tracking-wider text-blue-700 mb-0.5">Search #{index + 1}</p>
                      <div className="flex items-center gap-2 mb-1.5">
                        <Bookmark className="w-4 h-4 text-blue-700 shrink-0" />
                        <span className="text-lg font-black text-blue-950 truncate">{search.name}</span>
                      </div>
                      {summary ? (
                        <p className="text-sm text-blue-800 ml-6 line-clamp-2 leading-relaxed font-semibold">{summary}</p>
                      ) : (
                        <p className="text-sm text-blue-700 ml-6 italic font-semibold">No filters — matches all opportunities</p>
                      )}
                    </div>

                    {/* Date Created */}
                    <div className="text-sm text-blue-800 pt-0.5">
                      <p className="text-blue-950 font-black">{dateStr}</p>
                      <p className="text-blue-700 font-semibold">{timeStr}</p>
                    </div>

                    {/* Run count */}
                    <div className="text-sm pt-0.5">
                      {search.runCount ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-100 border border-emerald-300 px-2 py-0.5 text-emerald-800 font-black">{search.runCount}×</span>
                      ) : (
                        <span className="text-blue-500">—</span>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      <button
                        onClick={() => handleRun(search)}
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-black flex items-center gap-1 transition-colors shadow-sm"
                        title="Run this search"
                      >
                        <Play className="w-3 h-3" /> Run
                      </button>

                      <button
                        onClick={() => handleConvertToAlert(search)}
                        className="px-2.5 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-black flex items-center gap-1 transition-colors shadow-sm"
                        title="Create an email alert from this search"
                      >
                        <Bell className="w-3 h-3" /> Alert
                      </button>

                      <button
                        onClick={() => handleEdit(search)}
                        className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-black flex items-center gap-1 transition-colors shadow-sm"
                        title="Edit"
                      >
                        <Edit3 className="w-3 h-3" /> Edit
                      </button>

                      <button
                        onClick={() => handleCopyLink(search)}
                        className={`px-2.5 py-1.5 rounded-lg text-sm font-black flex items-center gap-1 transition-colors shadow-sm ${copiedId === search.id ? 'bg-green-600 text-white' : 'bg-blue-700 hover:bg-blue-800 text-white'}`}
                        title="Copy link"
                      >
                        {copiedId === search.id ? <><Check className="w-3 h-3" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy</>}
                      </button>

                      <button
                        onClick={() => setShareSearch(search)}
                        className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-black flex items-center gap-1 transition-colors shadow-sm"
                        title="Share"
                      >
                        <Share2 className="w-3 h-3" /> Share
                      </button>

                      <button
                        onClick={() => handleDelete(search.id, search.name)}
                        className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-black flex items-center gap-1 transition-colors shadow-sm"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Run Confirmation Modal */}
      {confirmSearch && (
        <RunConfirmModal
          search={confirmSearch}
          onConfirm={handleConfirmRun}
          onClose={() => setConfirmSearch(null)}
        />
      )}

      {/* Share Modal */}
      {shareSearch && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-linear-to-br from-slate-900 to-slate-800 border border-slate-700 shadow-2xl flex flex-col max-h-[90vh]">

            {/* ── Header ── */}
            <div className="px-6 py-4 bg-linear-to-r from-purple-900/60 to-slate-800 border-b border-slate-700 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/20 border border-purple-500/30">
                  <Share2 className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Share Search Results</h3>
                  <p className="text-xs text-slate-400 mt-0.5 truncate max-w-70">{shareSearch.name}</p>
                </div>
              </div>
              <button onClick={closeShareModal} className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ── Scrollable body ── */}
            <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1">

              {/* Shareable Link */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Shareable Link</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${typeof window !== 'undefined' ? window.location.origin : ''}/search?loadSavedSearch=${shareSearch.id}`}
                    className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 cursor-default"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/search?loadSavedSearch=${shareSearch.id}`)
                      setShareLinkCopied(true)
                      setTimeout(() => setShareLinkCopied(false), 2000)
                    }}
                    className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium shrink-0"
                    title="Copy link"
                  >
                    {shareLinkCopied ? <><Check className="w-3.5 h-3.5 text-green-400" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 border-t border-slate-700" />
                <span className="text-xs text-slate-500 whitespace-nowrap">or email results</span>
                <div className="flex-1 border-t border-slate-700" />
              </div>

              {/* ── Recipients ── */}
              <div>
                {/* Label row with actions */}
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    Recipients
                    {shareRecipients.length > 0 && (
                      <span className="ml-2 text-purple-400 font-normal normal-case">({shareRecipients.length} selected)</span>
                    )}
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => loadContacts(true)}
                      disabled={contactsLoading}
                      className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 disabled:opacity-50 transition-colors"
                      title="Reload contacts from address book"
                    >
                      {contactsLoading
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : <RefreshCw className="w-3 h-3" />}
                      Refresh
                    </button>
                    <Link
                      href="/account"
                      target="_blank"
                      className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 font-semibold transition-colors"
                      title="Open address book to add contacts"
                    >
                      <BookUser className="w-3 h-3" /> Add Contacts
                    </Link>
                  </div>
                </div>

                {/* Selected recipient pills */}
                {shareRecipients.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3 p-2.5 bg-purple-950/30 border border-purple-700/30 rounded-xl">
                    {shareRecipients.map((email, i) => (
                      <span key={i} className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-900/40 border border-purple-700/40 rounded-full text-xs text-purple-200">
                        {email}
                        <button onClick={() => setShareRecipients(r => r.filter((_, j) => j !== i))} className="text-purple-500 hover:text-red-400 transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    <button
                      onClick={() => setShareRecipients([])}
                      className="ml-auto self-center text-xs text-slate-500 hover:text-red-400 transition-colors px-1"
                    >
                      Clear all
                    </button>
                  </div>
                )}

                {/* Contacts section — always visible */}
                <div className="border border-slate-700 rounded-xl overflow-hidden mb-2">
                  {contacts.length > 0 ? (
                    <>
                      {/* Search within contacts */}
                      <div className="p-2 border-b border-slate-700 bg-slate-800/60">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                          <input
                            type="text"
                            value={shareContactSearch}
                            onChange={e => setShareContactSearch(e.target.value)}
                            placeholder="Search contacts by name, email, or org…"
                            className="w-full pl-8 pr-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 transition-colors"
                          />
                        </div>
                      </div>

                      {/* Contact rows */}
                      {(() => {
                        const filteredContacts = contacts.filter(c => {
                          if (!shareContactSearch.trim()) return true
                          const q = shareContactSearch.toLowerCase()
                          return [c.email, c.firstName, c.lastName, c.organization].some(v => v?.toLowerCase().includes(q))
                        })
                        return (
                          <>
                            <div className="max-h-44 overflow-y-auto divide-y divide-slate-700/30">
                              {filteredContacts.length === 0 ? (
                                <p className="text-xs text-slate-500 italic px-3 py-4 text-center">
                                  {shareContactSearch ? 'No contacts match your search' : 'No contacts in address book'}
                                </p>
                              ) : filteredContacts.map(c => {
                                const alreadyAdded = shareRecipients.includes(c.email)
                                const displayName = [c.firstName, c.lastName].filter(Boolean).join(' ') || c.email
                                return (
                                  <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => {
                                      if (!alreadyAdded) setShareRecipients(r => [...r, c.email])
                                      else setShareRecipients(r => r.filter(x => x !== c.email))
                                    }}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                                      alreadyAdded ? 'bg-purple-900/20' : 'hover:bg-slate-700/50'
                                    }`}
                                  >
                                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                                      alreadyAdded ? 'bg-purple-500 border-purple-500' : 'border-slate-600'
                                    }`}>
                                      {alreadyAdded && <Check className="w-2.5 h-2.5 text-white" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm text-white font-medium truncate">{displayName}</p>
                                      {displayName !== c.email && <p className="text-xs text-slate-500 truncate">{c.email}</p>}
                                    </div>
                                    {c.organization && (
                                      <span className="text-xs text-slate-500 truncate max-w-27.5 shrink-0">{c.organization}</span>
                                    )}
                                  </button>
                                )
                              })}
                            </div>

                            {/* Select all / clear toolbar */}
                            {filteredContacts.length > 0 && (
                              <div className="flex items-center justify-between px-3 py-2 border-t border-slate-700/50 bg-slate-900/40">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const toAdd = filteredContacts.map(c => c.email).filter(e => !shareRecipients.includes(e))
                                    setShareRecipients(r => [...r, ...toAdd])
                                  }}
                                  className="text-xs text-purple-400 hover:text-purple-300 font-semibold transition-colors"
                                >
                                  Select All ({filteredContacts.length})
                                </button>
                                {shareRecipients.length > 0 && (
                                  <button type="button" onClick={() => setShareRecipients([])}
                                    className="text-xs text-slate-500 hover:text-red-400 transition-colors">
                                    Clear All
                                  </button>
                                )}
                              </div>
                            )}
                          </>
                        )
                      })()}
                    </>
                  ) : (
                    /* Empty contacts state */
                    <div className="flex flex-col items-center justify-center py-6 px-4 text-center bg-slate-800/30">
                      <BookUser className="w-8 h-8 text-slate-600 mb-2" />
                      <p className="text-sm text-slate-300 font-semibold mb-1">No contacts in your address book</p>
                      <p className="text-xs text-slate-500 mb-3 max-w-xs">Add contacts once and reuse them across all your shared searches and alerts.</p>
                      <Link
                        href="/account"
                        target="_blank"
                        className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-600/40 text-purple-300 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <BookUser className="w-3.5 h-3.5" /> Open Address Book
                      </Link>
                    </div>
                  )}
                </div>

                {/* Manual email input */}
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={shareEmailInput}
                    onChange={e => setShareEmailInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addShareRecipient() } }}
                    placeholder={contacts.length > 0 ? 'Or type an email address…' : 'recipient@company.com'}
                    className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 transition-colors"
                  />
                  <button
                    onClick={addShareRecipient}
                    disabled={!shareEmailInput.includes('@')}
                    className="px-4 py-2 bg-purple-700 hover:bg-purple-600 disabled:opacity-40 text-white rounded-lg text-sm font-semibold transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* ── Format + Personal note (two columns) ── */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Attachment Format</label>
                  <select
                    value={shareFormat}
                    onChange={e => setShareFormat(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-purple-400 transition-colors"
                  >
                    <option value="NONE">Links only (no file)</option>
                    <option value="CSV">CSV spreadsheet</option>
                    <option value="EXCEL">Excel (.xlsx)</option>
                    <option value="TXT">Plain text</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                    Personal Note <span className="normal-case font-normal text-slate-600">(optional)</span>
                  </label>
                  <textarea
                    value={shareMessage}
                    onChange={e => setShareMessage(e.target.value)}
                    placeholder="Add a message for the recipient…"
                    rows={2}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 transition-colors resize-none"
                  />
                </div>
              </div>
            </div>

            {/* ── Footer ── */}
            <div className="px-6 py-4 bg-slate-900/50 border-t border-slate-700 flex items-center justify-between shrink-0">
              {shareSent ? (
                <div className="w-full flex items-center justify-center gap-2 py-1">
                  <Check className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span className="text-emerald-300 font-bold text-sm">
                    Sent to {shareRecipients.length} recipient{shareRecipients.length !== 1 ? 's' : ''}! Closing…
                  </span>
                </div>
              ) : (
                <>
                  <button onClick={closeShareModal} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium text-sm rounded-xl transition-colors">
                    Cancel
                  </button>
                  <div className="flex items-center gap-3">
                    {shareRecipients.length > 0 && !shareSending && (
                      <p className="text-xs text-slate-400">
                        Sending to <span className="text-white font-semibold">{shareRecipients.length}</span> {shareRecipients.length === 1 ? 'recipient' : 'recipients'}
                      </p>
                    )}
                    <button
                      onClick={handleSendShare}
                      disabled={shareRecipients.length === 0 || shareSending}
                      className="px-5 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl flex items-center gap-2 transition-colors shadow-lg shadow-purple-900/30"
                    >
                      {shareSending
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                        : <><Mail className="w-4 h-4" /> Send Results</>
                      }
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .manage-searches-page {
          font-family: Aptos, "Segoe UI", "Trebuchet MS", Arial, sans-serif;
          color: #0b2a66;
          font-size: 18px;
        }
        .manage-searches-page .text-xs { font-size: 1rem; line-height: 1.4rem; }
        .manage-searches-page .text-sm { font-size: 1.08rem; line-height: 1.5rem; }
        .manage-searches-page .text-base { font-size: 1.16rem; line-height: 1.62rem; }

        .manage-searches-page .saved-search-form-surface h2,
        .manage-searches-page .saved-search-form-surface label,
        .manage-searches-page .saved-search-form-surface p,
        .manage-searches-page .saved-search-form-surface span {
          color: #0f172a;
          font-weight: 800;
        }

        .manage-searches-page .saved-search-form-surface input,
        .manage-searches-page .saved-search-form-surface select,
        .manage-searches-page .saved-search-form-surface textarea {
          color: #0f172a !important;
          font-weight: 700;
          background-color: #ffffff;
          border-color: #60a5fa !important;
        }

        .manage-searches-page .saved-search-form-surface input::placeholder,
        .manage-searches-page .saved-search-form-surface textarea::placeholder {
          color: #64748b !important;
        }

        .manage-searches-page .saved-search-form-surface .filter-preview,
        .manage-searches-page .saved-search-form-surface .filter-preview * {
          color: #ffffff !important;
        }

        .manage-searches-page [class*='bg-orange-'],
        .manage-searches-page [class*='bg-emerald-'],
        .manage-searches-page [class*='bg-indigo-'],
        .manage-searches-page [class*='bg-blue-'],
        .manage-searches-page [class*='bg-red-'],
        .manage-searches-page [class*='bg-purple-'],
        .manage-searches-page [class*='bg-teal-'] {
          color: #ffffff !important;
          font-weight: 700;
        }
        .manage-searches-page input,
        .manage-searches-page select,
        .manage-searches-page textarea,
        .manage-searches-page button {
          letter-spacing: 0.01em;
        }
      `}</style>
    </div>
  )
}

export default function ManageSearchesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-surface)' }}>
        <div className="animate-spin h-12 w-12 border-4 border-teal-500 border-t-transparent rounded-full" />
      </div>
    }>
      <ManageSearchesContent />
    </Suspense>
  )
}
