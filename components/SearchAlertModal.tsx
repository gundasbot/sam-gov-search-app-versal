// components/SearchAlertModal.tsx
'use client'

import React, { useState, useEffect } from 'react'
import {
  X,
  Bell,
  Mail,
  Calendar,
  Clock,
  Download,
  AlertCircle,
  Check,
  Loader2,
  Info,
  ChevronDown,
  Users,
} from 'lucide-react'

export type AlertFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'AS_CHANGES' | 'MANUAL'
export type FileFormat = 'csv' | 'excel' | 'json' | 'text'

export interface CurrentSearch {
  keywords?: string
  naics?: string
  agency?: string
  setAside?: string
  stateOfPerformance?: string
  procurementType?: string
  postedAfter?: string
  postedBefore?: string
}

export interface SearchAlert {
  name: string
  description?: string
  frequency: AlertFrequency
  emailNotification: boolean
  fileFormat: FileFormat
  includeLinks: boolean
  sendEmptyResults: boolean
  maxResults: number
  recipients: string
  deliveryTime?: string
  // Optional id for edit flows (some codepaths include it)
  id?: string
}

// Generate time options in 15-minute intervals
function generateTimeOptions() {
  const options: { value: string; label: string }[] = []
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const hourStr = hour.toString().padStart(2, '0')
      const minuteStr = minute.toString().padStart(2, '0')
      const value = `${hourStr}:${minuteStr}`

      const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
      const ampm = hour < 12 ? 'AM' : 'PM'
      const label = `${hour12}:${minuteStr} ${ampm}`

      options.push({ value, label })
    }
  }
  return options
}

const TIME_OPTIONS = generateTimeOptions()

const FREQUENCY_OPTIONS = [
  { value: 'DAILY' as AlertFrequency, label: 'Daily', description: 'Every morning at your chosen time' },
  { value: 'WEEKLY' as AlertFrequency, label: 'Weekly', description: 'Every Monday morning' },
  { value: 'MONTHLY' as AlertFrequency, label: 'Monthly', description: 'First day of each month' },
  { value: 'AS_CHANGES' as AlertFrequency, label: 'Real-time', description: 'Check frequently for changes' },
  { value: 'MANUAL' as AlertFrequency, label: 'Manual Only', description: 'Run from dashboard only' },
]

const FILE_FORMAT_OPTIONS = [
  { value: 'csv' as FileFormat, label: 'CSV', description: 'Lightweight, opens in Excel' },
  { value: 'excel' as FileFormat, label: 'Excel', description: 'Full formatting & features' },
  { value: 'json' as FileFormat, label: 'JSON', description: 'For developers & APIs' },
  { value: 'text' as FileFormat, label: 'Text', description: 'Simple plain text' },
]

interface SearchAlertModalProps {
  isOpen: boolean
  onClose: () => void
  currentSearch?: CurrentSearch
  savedSearchId?: string

  /**
   * OPTIONAL:
   * If a parent passes onSave, we use it.
   * If not provided, we fall back to the API (fixes "onSave is not a function").
   */
  onSave?: (alertData: SearchAlert & { currentSearch?: CurrentSearch; savedSearchId?: string }) => Promise<void>

  initialAlert?: SearchAlert
  mode?: 'create' | 'edit'
}

function escapeText(s?: string) {
  if (!s) return ''
  return String(s).trim()
}

function formatSearchSummary(search?: CurrentSearch) {
  if (!search) return []
  const rows: { label: string; value: string }[] = []

  if (search.keywords) rows.push({ label: 'Keywords', value: search.keywords })
  if (search.naics) rows.push({ label: 'NAICS', value: search.naics })
  if (search.agency) rows.push({ label: 'Agency', value: search.agency })
  if (search.setAside) rows.push({ label: 'Set-Aside', value: search.setAside })
  if (search.stateOfPerformance) rows.push({ label: 'Location', value: search.stateOfPerformance })
  if (search.postedAfter) rows.push({ label: 'Posted From', value: search.postedAfter })
  if (search.postedBefore) rows.push({ label: 'Posted To', value: search.postedBefore })
  if (search.procurementType) rows.push({ label: 'Type', value: search.procurementType })

  return rows
}

export default function SearchAlertModal({
  isOpen,
  onClose,
  currentSearch,
  savedSearchId,
  onSave,
  initialAlert,
  mode = 'create',
}: SearchAlertModalProps) {
  const [alertData, setAlertData] = useState<SearchAlert>({
    name: initialAlert?.name || '',
    description: initialAlert?.description || '',
    frequency: initialAlert?.frequency || 'DAILY',
    emailNotification: initialAlert?.emailNotification ?? true,
    fileFormat: initialAlert?.fileFormat || 'csv',
    includeLinks: initialAlert?.includeLinks ?? true,
    sendEmptyResults: initialAlert?.sendEmptyResults ?? false,
    maxResults: initialAlert?.maxResults || 100,
    recipients: initialAlert?.recipients || '',
    deliveryTime: initialAlert?.deliveryTime || '09:00',
    id: (initialAlert as any)?.id,
  })

  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Auto-generate name based on search criteria
  useEffect(() => {
    if (isOpen && !alertData.name && mode === 'create') {
      const parts: string[] = []
      if (currentSearch?.keywords) parts.push(currentSearch.keywords.substring(0, 30))
      if (currentSearch?.setAside) parts.push(currentSearch.setAside)
      if (currentSearch?.stateOfPerformance) parts.push(currentSearch.stateOfPerformance)

      const name = parts.length > 0 ? parts.join(' - ') : 'New Alert'
      setAlertData((prev) => ({ ...prev, name }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, mode, currentSearch])

  const getActiveFiltersCount = () => {
    if (!currentSearch) return 0
    return Object.values(currentSearch).filter((v) => v && v !== '' && v !== 'o').length
  }

  const validateForm = () => {
    if (!alertData.name.trim()) {
      setError('Alert name is required')
      return false
    }

    if (!alertData.recipients.trim()) {
      setError('At least one email recipient is required')
      return false
    }

    // Validate email format
    const emails = alertData.recipients.split(',').map((e) => e.trim()).filter(Boolean)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const invalidEmails = emails.filter((e) => e && !emailRegex.test(e))
    if (invalidEmails.length > 0) {
      setError(`Invalid email address: ${invalidEmails[0]}`)
      return false
    }

    return true
  }

  async function saveViaApi(payload: any) {
    // Edit mode: if we have an id, PUT to /api/search-alerts/:id
    const id = payload?.id
    const url = mode === 'edit' && id ? `/api/search-alerts/${id}` : `/api/search-alerts`
    const method = mode === 'edit' && id ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(text || `Failed to save alert (${res.status})`)
    }

    return res.json().catch(() => ({}))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!validateForm()) return

    try {
      setIsSaving(true)

      // Include currentSearch + savedSearchId so backend can re-run later
      const payload = {
        ...alertData,
        currentSearch,
        savedSearchId,
      }

      // ✅ If onSave exists and is a function, use it.
      // ✅ Otherwise, fall back to API (fixes your runtime error).
      if (typeof onSave === 'function') {
        await onSave(payload)
      } else {
        await saveViaApi(payload)
      }

      setSuccess(mode === 'edit' ? 'Alert updated successfully!' : 'Alert saved successfully!')
      setTimeout(() => {
        onClose()
      }, 1200)
    } catch (err: any) {
      setError(err?.message || 'Failed to save alert')
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  const summaryRows = formatSearchSummary(currentSearch)

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative w-full max-w-2xl">
          <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 shadow-2xl">
            {/* Header */}
            <div className="border-b border-slate-800 px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 p-2.5">
                    <Bell className="h-6 w-6 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      {mode === 'edit' ? 'Edit Alert' : 'Create Alert Subscription'}
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">
                      {getActiveFiltersCount()} active filter{getActiveFiltersCount() !== 1 ? 's' : ''}
                      {savedSearchId ? (
                        <span className="ml-2 text-xs text-slate-500">• Saved Search linked</span>
                      ) : null}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  disabled={isSaving}
                  className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 py-6">
              <div className="space-y-6">
                {/* Search Summary (key section) */}
                {summaryRows.length > 0 && (
                  <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-slate-200">
                        Search Criteria
                      </div>
                      <div className="text-xs text-slate-500">
                        Used when this alert runs automatically
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                      {summaryRows.map((r) => (
                        <div key={r.label} className="rounded-lg border border-slate-800 bg-slate-950/30 px-3 py-2">
                          <div className="text-[11px] uppercase tracking-wide text-slate-500">
                            {r.label}
                          </div>
                          <div className="text-sm text-slate-200 break-words">
                            {escapeText(r.value)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Alert Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Alert Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={alertData.name}
                    onChange={(e) => setAlertData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Daily IT Opportunities - SDVOSB"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    maxLength={100}
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={alertData.description || ''}
                    onChange={(e) => setAlertData((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Add notes about this alert..."
                    rows={2}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
                    maxLength={500}
                  />
                </div>

                {/* Email Recipients */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Email Recipients <span className="text-rose-400">*</span>
                    </div>
                  </label>
                  <input
                    type="text"
                    value={alertData.recipients}
                    onChange={(e) => setAlertData((prev) => ({ ...prev, recipients: e.target.value }))}
                    placeholder="email@company.com, another@company.com"
                    className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <p className="mt-1.5 text-xs text-slate-500 flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Separate multiple email addresses with commas
                  </p>
                </div>

                {/* Frequency & Delivery Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Frequency */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Frequency
                      </div>
                    </label>
                    <div className="relative">
                      <select
                        value={alertData.frequency}
                        onChange={(e) =>
                          setAlertData((prev) => ({ ...prev, frequency: e.target.value as AlertFrequency }))
                        }
                        className="w-full appearance-none rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 pr-10 text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      >
                        {FREQUENCY_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    </div>
                    <p className="mt-1.5 text-xs text-slate-500">
                      {FREQUENCY_OPTIONS.find((f) => f.value === alertData.frequency)?.description}
                    </p>
                  </div>

                  {/* Delivery Time */}
                  <div className={`${alertData.frequency === 'MANUAL' ? 'opacity-50' : ''}`}>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Delivery Time
                      </div>
                    </label>
                    <div className="relative">
                      <select
                        value={alertData.deliveryTime}
                        onChange={(e) => setAlertData((prev) => ({ ...prev, deliveryTime: e.target.value }))}
                        disabled={alertData.frequency === 'MANUAL'}
                        className="w-full appearance-none rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 pr-10 text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed"
                      >
                        {TIME_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    </div>
                    <p className="mt-1.5 text-xs text-slate-500">Eastern Time (ET)</p>
                  </div>
                </div>

                {/* File Format */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">
                    <div className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Export Format
                    </div>
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {FILE_FORMAT_OPTIONS.map((format) => (
                      <button
                        key={format.value}
                        type="button"
                        onClick={() => setAlertData((prev) => ({ ...prev, fileFormat: format.value }))}
                        className={`rounded-xl border-2 p-3 text-center transition-all ${
                          alertData.fileFormat === format.value
                            ? 'border-cyan-500 bg-cyan-500/10'
                            : 'border-slate-700 bg-slate-900/30 hover:border-slate-600'
                        }`}
                      >
                        <div className="text-sm font-semibold text-white">{format.label}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{format.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Options */}
                <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/30 p-4">
                  <div className="font-medium text-slate-200 flex items-center gap-2 mb-2">
                    <Mail className="h-4 w-4 text-blue-400" />
                    Delivery Options
                  </div>

                  {/* Email Notifications (THIS was missing in your UI) */}
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={alertData.emailNotification}
                      onChange={(e) => setAlertData((prev) => ({ ...prev, emailNotification: e.target.checked }))}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <span className="text-slate-200 font-medium">Send email notifications</span>
                      <p className="text-sm text-slate-400 mt-0.5">
                        Receive results via email automatically
                      </p>
                    </div>
                  </label>

                  {/* Include Links */}
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={alertData.includeLinks}
                      onChange={(e) => setAlertData((prev) => ({ ...prev, includeLinks: e.target.checked }))}
                      className="mt-1"
                      disabled={!alertData.emailNotification}
                    />
                    <div className="flex-1">
                      <span className="text-slate-200 font-medium">Include direct links</span>
                      <p className="text-sm text-slate-400 mt-0.5">
                        Add clickable SAM.gov links in emails
                      </p>
                    </div>
                  </label>

                  {/* Send Empty Results */}
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={alertData.sendEmptyResults}
                      onChange={(e) => setAlertData((prev) => ({ ...prev, sendEmptyResults: e.target.checked }))}
                      className="mt-1"
                      disabled={!alertData.emailNotification}
                    />
                    <div className="flex-1">
                      <span className="text-slate-200 font-medium">Notify when no results</span>
                      <p className="text-sm text-slate-400 mt-0.5">
                        Send confirmation even with 0 results
                      </p>
                    </div>
                  </label>

                  {/* Max Results */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Maximum Results: {alertData.maxResults}
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="1000"
                      step="10"
                      value={alertData.maxResults}
                      onChange={(e) =>
                        setAlertData((prev) => ({ ...prev, maxResults: parseInt(e.target.value) }))
                      }
                      className="w-full"
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      Limits file size. Higher = more data but larger files.
                    </p>
                  </div>
                </div>

                {/* Error/Success Messages */}
                {error && (
                  <div className="rounded-xl border border-rose-900/50 bg-rose-950/30 p-4">
                    <div className="flex items-center gap-2 text-rose-400">
                      <AlertCircle className="h-5 w-5 flex-shrink-0" />
                      <span className="text-sm font-medium">{error}</span>
                    </div>
                  </div>
                )}

                {success && (
                  <div className="rounded-xl border border-emerald-900/50 bg-emerald-950/30 p-4">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <Check className="h-5 w-5 flex-shrink-0" />
                      <span className="text-sm font-medium">{success}</span>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-between gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSaving}
                    className="px-5 py-3 text-sm font-semibold rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 hover:bg-slate-800/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-3 text-sm font-semibold rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Bell className="h-4 w-4" />
                        {mode === 'edit' ? 'Update Alert' : 'Create Alert'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
