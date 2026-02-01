'use client'

import React, { useState } from 'react'
import { 
  X, Bell, Mail, Calendar, Clock, FileSpreadsheet, FileText, Code, Download, 
  AlertCircle, Check, Loader2, Filter, Search, Tag, MapPin, Building2, Hash, 
  Link as LinkIcon, PlayCircle, StopCircle, Zap, ChevronDown, Info, CheckCircle2 
} from 'lucide-react'

export type AlertFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'AS_CHANGES' | 'MANUAL'
export type FileFormat = 'csv' | 'excel' | 'json' | 'xlsb'

export interface CurrentSearch {
  keywords?: string
  naics?: string
  agency?: string
  setAside?: string
  stateOfPerformance?: string
  procurementType?: string
  postedAfter?: string
  postedBefore?: string
  responseDeadline?: string
}

export interface SearchAlert {
  name: string
  description?: string
  recipients: string
  frequency: AlertFrequency
  deliveryTime?: string
  startDate?: string
  endDate?: string
  emailNotification?: boolean
  fileFormat?: FileFormat
  includeLinks?: boolean
  sendEmptyResults?: boolean
  maxResults?: number
  groupByWeek?: boolean
  setAside?: string[]
  stateOfPerformance?: string[]
  responseDeadlineBefore?: string
}

interface CreateAlertModalProps {
  isOpen: boolean
  onClose: () => void
  currentSearch: CurrentSearch
  savedSearchId?: string
  onSave: (alert: SearchAlert) => Promise<void>
  initialAlert?: SearchAlert
  mode?: 'create' | 'edit'
}

const FREQUENCY_OPTIONS = [
  { value: 'DAILY', label: 'Daily', description: 'Every morning at 8 AM EST', icon: Calendar, color: 'from-orange-500 to-orange-400' },
  { value: 'WEEKLY', label: 'Weekly', description: 'Every Monday at 8 AM EST', icon: Calendar, color: 'from-blue-500 to-blue-400' },
  { value: 'MONTHLY', label: 'Monthly', description: 'First day of each month', icon: Calendar, color: 'from-emerald-500 to-emerald-400' },
  { value: 'AS_CHANGES', label: 'As Changes', description: 'Real-time notifications', icon: Zap, color: 'from-cyan-500 to-cyan-400' },
  { value: 'MANUAL', label: 'Manual', description: 'Run manually from dashboard', icon: PlayCircle, color: 'from-purple-500 to-purple-400' },
]

const FILE_FORMAT_OPTIONS = [
  { value: 'xlsb', label: 'Excel Binary', description: 'Smallest file size', icon: FileSpreadsheet, recommended: true, color: 'border-emerald-500 bg-emerald-500/10 text-emerald-400' },
  { value: 'excel', label: 'Excel', description: 'Full formatting', icon: FileSpreadsheet, recommended: true, color: 'border-blue-500 bg-blue-500/10 text-blue-400' },
  { value: 'csv', label: 'CSV', description: 'Universal format', icon: FileText, recommended: false, color: 'border-slate-500 bg-slate-500/10 text-slate-400' },
  { value: 'json', label: 'JSON', description: 'For developers', icon: Code, recommended: false, color: 'border-orange-500 bg-orange-500/10 text-orange-400' },
]

const SET_ASIDE_OPTIONS = [
  { value: 'SBA', label: 'Total Small Business', short: 'Small Business' },
  { value: '8A', label: '8(a) Set-Aside', short: '8(a)' },
  { value: 'HZC', label: 'HUBZone', short: 'HUBZone' },
  { value: 'SDVOSBC', label: 'SDVOSB', short: 'SDVOSB' },
  { value: 'WOSB', label: 'WOSB', short: 'WOSB' },
  { value: 'EDWOSB', label: 'EDWOSB', short: 'EDWOSB' },
  { value: 'VSA', label: 'Veteran-Owned', short: 'VOSB' },
]

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
]

const SET_ASIDE_LABELS: Record<string, string> = {
  'SBA': 'Total Small Business',
  '8A': '8(a) Set-Aside',
  'HZC': 'HUBZone',
  'SDVOSBC': 'SDVOSB',
  'WOSB': 'WOSB',
  'EDWOSB': 'EDWOSB',
  'VSA': 'Veteran-Owned',
}

const PROCUREMENT_TYPE_LABELS: Record<string, string> = {
  'o': 'All Opportunities',
  's': 'Sources Sought',
  'p': 'Presolicitation',
  'k': 'Combined Synopsis/Solicitation',
  'r': 'Solicitation',
  'a': 'Award Notice',
}

// Helper function to get date 3 months ago
const getThreeMonthsAgo = () => {
  const date = new Date()
  date.setMonth(date.getMonth() - 3)
  return date.toISOString().split('T')[0]
}

export default function CreateAlertModal({
  isOpen,
  onClose,
  currentSearch,
  savedSearchId,
  onSave,
  initialAlert,
  mode = 'create',
}: CreateAlertModalProps) {
  const [alertData, setAlertData] = useState<SearchAlert>({
    name: initialAlert?.name || '',
    description: initialAlert?.description || '',
    recipients: initialAlert?.recipients || '',
    frequency: initialAlert?.frequency || 'DAILY',
    deliveryTime: initialAlert?.deliveryTime || '09:00',
    startDate: initialAlert?.startDate || getThreeMonthsAgo(), // DEFAULT: 3 months back
    endDate: initialAlert?.endDate || '',
    emailNotification: initialAlert?.emailNotification ?? true,
    fileFormat: initialAlert?.fileFormat || 'xlsb', // DEFAULT: Excel Binary
    includeLinks: initialAlert?.includeLinks ?? true,
    sendEmptyResults: initialAlert?.sendEmptyResults ?? false,
    maxResults: initialAlert?.maxResults || 1000,
    groupByWeek: initialAlert?.groupByWeek ?? false,
    setAside: initialAlert?.setAside || (currentSearch.setAside ? [currentSearch.setAside] : []),
    stateOfPerformance: initialAlert?.stateOfPerformance || (currentSearch.stateOfPerformance ? [currentSearch.stateOfPerformance] : []),
    responseDeadlineBefore: initialAlert?.responseDeadlineBefore || currentSearch.responseDeadline || '',
  })

  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const generateAlertName = () => {
    const parts: string[] = []
    if (currentSearch.keywords) parts.push(currentSearch.keywords.substring(0, 30))
    if (alertData.setAside && alertData.setAside.length > 0) {
      parts.push(alertData.setAside.map(s => SET_ASIDE_LABELS[s] || s).join(', '))
    }
    if (alertData.stateOfPerformance && alertData.stateOfPerformance.length > 0) {
      parts.push(alertData.stateOfPerformance.slice(0, 3).join(', '))
    }
    return parts.length > 0 ? `${parts.join(' - ')} Alert` : 'New Alert'
  }

  React.useEffect(() => {
    if (isOpen && !alertData.name && mode === 'create') {
      const name = generateAlertName()
      setAlertData(prev => ({ ...prev, name }))
    }
  }, [isOpen, mode])

  const getActiveFiltersCount = () => {
    return Object.entries(currentSearch).filter(([key, value]) => value && value !== '' && value !== 'o').length +
      (alertData.setAside?.length || 0) + (alertData.stateOfPerformance?.length || 0)
  }

  const toggleSetAside = (value: string) => {
    setAlertData(prev => ({
      ...prev,
      setAside: prev.setAside?.includes(value)
        ? prev.setAside.filter(s => s !== value)
        : [...(prev.setAside || []), value]
    }))
  }

  const toggleState = (value: string) => {
    setAlertData(prev => ({
      ...prev,
      stateOfPerformance: prev.stateOfPerformance?.includes(value)
        ? prev.stateOfPerformance.filter(s => s !== value)
        : [...(prev.stateOfPerformance || []), value]
    }))
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}
    if (!alertData.name.trim()) errors.name = 'Alert name is required'
    if (!alertData.recipients.trim()) {
      errors.recipients = 'At least one email recipient is required'
    } else {
      const emails = alertData.recipients.split(',').map(e => e.trim())
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      const invalidEmails = emails.filter(e => e && !emailRegex.test(e))
      if (invalidEmails.length > 0) {
        errors.recipients = `Invalid email: ${invalidEmails[0]}...`
      }
    }
    if (alertData.startDate && alertData.endDate) {
      if (new Date(alertData.endDate) < new Date(alertData.startDate)) {
        errors.endDate = 'End date must be after start date'
      }
    }
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!validateForm()) {
      setError('Please fix the errors above')
      return
    }

    try {
      setIsSaving(true)
      await onSave(alertData)
      setSuccess('Alert subscription created successfully!')
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'Failed to create alert subscription')
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    if (!isSaving) onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
          onClick={handleClose}
        />

        {/* Modal - 70% WIDTH */}
        <div className="relative w-full max-w-[70vw]">
          <div className="rounded-3xl border-2 border-orange-500/30 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-2xl shadow-orange-500/20">
            {/* Header */}
            <div className="border-b-2 border-orange-500/30 bg-gradient-to-r from-orange-500/10 via-blue-500/10 to-emerald-500/10 px-8 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 p-3 shadow-lg shadow-orange-500/50">
                    <Bell className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-4xl font-bold text-white">{mode === 'edit' ? 'Edit Alert Subscription' : 'Create Alert Subscription'}</h2>
                    <p className="text-lg text-slate-300 mt-1 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                      {getActiveFiltersCount()} active filter{getActiveFiltersCount() !== 1 ? 's' : ''} configured
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  disabled={isSaving}
                  className="rounded-xl p-2 text-slate-400 transition-all hover:bg-orange-500/20 hover:text-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Search Criteria Display */}
            <div className="mx-8 my-6 rounded-2xl border-2 border-blue-500/40 bg-gradient-to-br from-blue-950/40 to-blue-900/20 p-6 shadow-lg">
              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-blue-500/20 p-3">
                  <Filter className="h-6 w-6 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                    Search Criteria
                    <span className="text-base font-normal text-blue-300">(What solicitations to track)</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {currentSearch.keywords && (
                      <div className="rounded-xl bg-slate-800/50 border border-emerald-500/30 p-4">
                        <div className="flex items-center gap-2 text-emerald-400 mb-2">
                          <Search className="h-5 w-5" />
                          <span className="text-sm font-semibold uppercase tracking-wide">Keywords</span>
                        </div>
                        <p className="text-white font-medium text-lg">{currentSearch.keywords}</p>
                      </div>
                    )}

                    {currentSearch.naics && (
                      <div className="rounded-xl bg-slate-800/50 border border-blue-500/30 p-4">
                        <div className="flex items-center gap-2 text-blue-400 mb-2">
                          <Hash className="h-5 w-5" />
                          <span className="text-sm font-semibold uppercase tracking-wide">NAICS Code</span>
                        </div>
                        <p className="text-white font-medium text-lg">{currentSearch.naics}</p>
                      </div>
                    )}

                    {currentSearch.agency && (
                      <div className="rounded-xl bg-slate-800/50 border border-orange-500/30 p-4">
                        <div className="flex items-center gap-2 text-orange-400 mb-2">
                          <Building2 className="h-5 w-5" />
                          <span className="text-sm font-semibold uppercase tracking-wide">Agency</span>
                        </div>
                        <p className="text-white font-medium text-lg truncate">{currentSearch.agency}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="px-8 pb-8">
              <div className="space-y-6">
                {/* Alert Name & Description */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-lg font-bold text-orange-400 mb-3">
                      Alert Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={alertData.name}
                      onChange={(e) => setAlertData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Data Analytics - VOSB Alert"
                      className="w-full rounded-xl border-2 border-slate-700 bg-slate-900/60 px-5 py-4 text-white text-lg placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/20"
                      maxLength={100}
                    />
                    {validationErrors.name && (
                      <p className="mt-2 text-base text-red-400 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5" />
                        {validationErrors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-lg font-bold text-orange-400 mb-3">Description (Optional)</label>
                    <textarea
                      value={alertData.description}
                      onChange={(e) => setAlertData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Add notes about this alert..."
                      rows={2}
                      className="w-full rounded-xl border-2 border-slate-700 bg-slate-900/60 px-5 py-4 text-white text-lg placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 resize-none"
                      maxLength={300}
                    />
                  </div>
                </div>

                {/* Set-Aside Selection */}
                <div>
                  <label className="block text-lg font-bold text-orange-400 mb-3">
                    <div className="flex items-center gap-2">
                      <Tag className="h-6 w-6 text-emerald-400" />
                      Set-Aside Types (Optional)
                    </div>
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                    {SET_ASIDE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => toggleSetAside(option.value)}
                        className={`px-4 py-3 rounded-xl border-2 font-bold text-base transition-all ${
                          alertData.setAside?.includes(option.value)
                            ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 shadow-lg shadow-emerald-500/30'
                            : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        {option.short}
                      </button>
                    ))}
                  </div>
                  <p className="text-base text-slate-400 mt-2">Select one or more set-aside types to filter opportunities</p>
                </div>

                {/* States Selection */}
                <div>
                  <label className="block text-lg font-bold text-orange-400 mb-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-6 w-6 text-emerald-400" />
                      Place of Performance (Optional)
                    </div>
                  </label>
                  <div className="grid grid-cols-8 md:grid-cols-13 lg:grid-cols-17 gap-2">
                    {US_STATES.map((state) => (
                      <button
                        key={state}
                        type="button"
                        onClick={() => toggleState(state)}
                        className={`px-3 py-2 rounded-lg border-2 font-bold text-base transition-all ${
                          alertData.stateOfPerformance?.includes(state)
                            ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 shadow-lg shadow-emerald-500/30'
                            : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        {state}
                      </button>
                    ))}
                  </div>
                  <p className="text-base text-slate-400 mt-2">
                    Selected: {alertData.stateOfPerformance?.length || 0} state{(alertData.stateOfPerformance?.length || 0) !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Response Deadline */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-lg font-bold text-orange-400 mb-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-6 w-6 text-emerald-400" />
                        Response Deadline Before (Optional)
                      </div>
                    </label>
                    <input
                      type="date"
                      value={alertData.responseDeadlineBefore}
                      onChange={(e) => setAlertData(prev => ({ ...prev, responseDeadlineBefore: e.target.value }))}
                      className="w-full rounded-xl border-2 border-slate-700 bg-slate-900/60 px-5 py-4 text-white text-lg focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/20"
                    />
                    <p className="text-base text-slate-400 mt-2">Only opportunities due before this date</p>
                  </div>
                </div>

                {/* Email Recipients */}
                <div>
                  <label className="block text-lg font-bold text-orange-400 mb-3">
                    <div className="flex items-center gap-2">
                      <Mail className="h-6 w-6 text-emerald-400" />
                      Email Recipients <span className="text-red-400">*</span>
                    </div>
                  </label>
                  <input
                    type="text"
                    value={alertData.recipients}
                    onChange={(e) => setAlertData(prev => ({ ...prev, recipients: e.target.value }))}
                    placeholder="email@company.com, another@company.com"
                    className="w-full rounded-xl border-2 border-slate-700 bg-slate-900/60 px-5 py-4 text-white text-lg placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/20"
                  />
                  <p className="mt-2 text-base text-slate-400">Separate multiple email addresses with commas</p>
                  {validationErrors.recipients && (
                    <p className="mt-2 text-base text-red-400 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      {validationErrors.recipients}
                    </p>
                  )}
                </div>

                {/* Frequency Selection */}
                <div>
                  <label className="block text-lg font-bold text-orange-400 mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-6 w-6 text-emerald-400" />
                      Notification Frequency
                    </div>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {FREQUENCY_OPTIONS.map((freq) => (
                      <button
                        key={freq.value}
                        type="button"
                        onClick={() => setAlertData(prev => ({ ...prev, frequency: freq.value as AlertFrequency }))}
                        className={`relative rounded-2xl border-3 p-6 text-left transition-all ${
                          alertData.frequency === freq.value
                            ? 'border-emerald-500 bg-gradient-to-br from-emerald-500/30 to-emerald-600/20 shadow-lg shadow-emerald-500/30'
                            : 'border-slate-700 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`${alertData.frequency === freq.value ? 'text-emerald-300' : 'text-slate-400'}`}>
                            <freq.icon className="h-6 w-6" />
                          </div>
                          <div className={`text-xl font-bold ${alertData.frequency === freq.value ? 'text-white' : 'text-slate-300'}`}>
                            {freq.label}
                          </div>
                        </div>
                        <p className={`text-base ${alertData.frequency === freq.value ? 'text-white/90' : 'text-slate-400'}`}>
                          {freq.description}
                        </p>
                        {alertData.frequency === freq.value && (
                          <div className="absolute top-3 right-3">
                            <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Schedule: Delivery Time, Start/End Dates */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-lg font-bold text-orange-400 mb-3">
                      <div className="flex items-center gap-2">
                        <Clock className="h-6 w-6 text-emerald-400" />
                        Delivery Time
                      </div>
                    </label>
                    <input
                      type="time"
                      value={alertData.deliveryTime}
                      onChange={(e) => setAlertData(prev => ({ ...prev, deliveryTime: e.target.value }))}
                      className="w-full rounded-xl border-2 border-slate-700 bg-slate-900/60 px-5 py-4 text-white text-lg focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/20"
                    />
                    <p className="mt-2 text-base text-slate-400">Eastern Time (ET)</p>
                  </div>

                  <div>
                    <label className="block text-lg font-bold text-orange-400 mb-3">
                      <div className="flex items-center gap-2">
                        <PlayCircle className="h-6 w-6 text-emerald-400" />
                        Start Date (3 months back)
                      </div>
                    </label>
                    <input
                      type="date"
                      value={alertData.startDate}
                      onChange={(e) => setAlertData(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full rounded-xl border-2 border-slate-700 bg-slate-900/60 px-5 py-4 text-white text-lg focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/20"
                    />
                    <p className="mt-2 text-base text-slate-400">Begin alerts from this date</p>
                  </div>

                  <div>
                    <label className="block text-lg font-bold text-orange-400 mb-3">
                      <div className="flex items-center gap-2">
                        <StopCircle className="h-6 w-6 text-emerald-400" />
                        End Date (Optional)
                      </div>
                    </label>
                    <input
                      type="date"
                      value={alertData.endDate}
                      onChange={(e) => setAlertData(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full rounded-xl border-2 border-slate-700 bg-slate-900/60 px-5 py-4 text-white text-lg focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/20"
                    />
                    <p className="mt-2 text-base text-slate-400">Leave empty for indefinite</p>
                    {validationErrors.endDate && (
                      <p className="mt-2 text-base text-red-400 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5" />
                        {validationErrors.endDate}
                      </p>
                    )}
                  </div>
                </div>

                {/* Export Format */}
                <div>
                  <label className="block text-lg font-bold text-orange-400 mb-3">
                    <div className="flex items-center gap-2">
                      <Download className="h-6 w-6 text-emerald-400" />
                      Export Format
                    </div>
                  </label>
                  <div className="grid grid-cols-4 gap-4">
                    {FILE_FORMAT_OPTIONS.map((format) => (
                      <button
                        key={format.value}
                        type="button"
                        onClick={() => setAlertData(prev => ({ ...prev, fileFormat: format.value as FileFormat }))}
                        className={`relative rounded-2xl border-2 p-6 text-center transition-all ${
                          alertData.fileFormat === format.value
                            ? `${format.color} border-2 shadow-lg`
                            : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                        }`}
                      >
                        {format.recommended && (
                          <span className="absolute -top-3 -right-3 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 px-3 py-1 text-sm font-bold text-white shadow-lg">
                            BEST
                          </span>
                        )}
                        <div className={`mx-auto mb-3 ${alertData.fileFormat === format.value ? '' : 'text-slate-500'}`}>
                          <format.icon className="h-8 w-8" />
                        </div>
                        <div className={`text-xl font-bold mb-1 ${alertData.fileFormat === format.value ? '' : 'text-slate-300'}`}>
                          {format.label}
                        </div>
                        <div className="text-base text-slate-400">{format.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Delivery Options */}
                <div className="rounded-2xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 to-slate-900/50 p-6">
                  <div className="font-bold text-2xl text-orange-400 flex items-center gap-3 mb-6">
                    <div className="rounded-xl bg-emerald-500/20 p-2">
                      <Download className="h-6 w-6 text-emerald-400" />
                    </div>
                    Delivery Options
                  </div>

                  <div className="space-y-5">
                    {/* Include Links */}
                    <label className="flex items-start gap-4 cursor-pointer group">
                      <div className="relative pt-1">
                        <input
                          type="checkbox"
                          checked={alertData.includeLinks}
                          onChange={(e) => setAlertData(prev => ({ ...prev, includeLinks: e.target.checked }))}
                          className="sr-only"
                        />
                        <div className={`h-7 w-14 rounded-full transition-all ${alertData.includeLinks ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/50' : 'bg-slate-700 group-hover:bg-slate-600'}`} />
                        <div className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-lg transform transition-transform ${alertData.includeLinks ? 'translate-x-7' : 'translate-x-0.5'}`} />
                      </div>
                      <div className="flex-1">
                        <span className="text-white font-bold text-lg flex items-center gap-2">
                          <LinkIcon className="h-6 w-6 text-emerald-400" />
                          Include direct SAM.gov links
                        </span>
                        <p className="text-base text-slate-300 mt-1">Add clickable links to each solicitation in the spreadsheet</p>
                      </div>
                    </label>

                    {/* Group by Week */}
                    <label className="flex items-start gap-4 cursor-pointer group">
                      <div className="relative pt-1">
                        <input
                          type="checkbox"
                          checked={alertData.groupByWeek}
                          onChange={(e) => setAlertData(prev => ({ ...prev, groupByWeek: e.target.checked }))}
                          className="sr-only"
                        />
                        <div className={`h-7 w-14 rounded-full transition-all ${alertData.groupByWeek ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/50' : 'bg-slate-700 group-hover:bg-slate-600'}`} />
                        <div className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-lg transform transition-transform ${alertData.groupByWeek ? 'translate-x-7' : 'translate-x-0.5'}`} />
                      </div>
                      <div className="flex-1">
                        <span className="text-white font-bold text-lg flex items-center gap-2">
                          <Calendar className="h-6 w-6 text-emerald-400" />
                          Group results by week
                        </span>
                        <p className="text-base text-slate-300 mt-1">Organize solicitations by the week they were posted</p>
                      </div>
                    </label>

                    {/* Send Empty Results */}
                    <label className="flex items-start gap-4 cursor-pointer group">
                      <div className="relative pt-1">
                        <input
                          type="checkbox"
                          checked={alertData.sendEmptyResults}
                          onChange={(e) => setAlertData(prev => ({ ...prev, sendEmptyResults: e.target.checked }))}
                          className="sr-only"
                        />
                        <div className={`h-7 w-14 rounded-full transition-all ${alertData.sendEmptyResults ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/50' : 'bg-slate-700 group-hover:bg-slate-600'}`} />
                        <div className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-lg transform transition-transform ${alertData.sendEmptyResults ? 'translate-x-7' : 'translate-x-0.5'}`} />
                      </div>
                      <div className="flex-1">
                        <span className="text-white font-bold text-lg">Notify when no results</span>
                        <p className="text-base text-slate-300 mt-1">Send confirmation even with 0 matching solicitations</p>
                      </div>
                    </label>

                    {/* Max Results Slider */}
                    <div className="pt-4">
                      <label className="block text-lg font-bold text-orange-400 mb-4">Maximum Results per Alert</label>
                      <div className="flex items-center gap-4">
                        <input
                          type="range"
                          min="10"
                          max="1000"
                          step="10"
                          value={alertData.maxResults}
                          onChange={(e) => setAlertData(prev => ({ ...prev, maxResults: parseInt(e.target.value) }))}
                          className="flex-1 h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-br [&::-webkit-slider-thumb]:from-emerald-400 [&::-webkit-slider-thumb]:to-emerald-600 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-emerald-500/50 [&::-webkit-slider-thumb]:cursor-pointer"
                        />
                        <div className="flex items-center gap-2 min-w-[140px] rounded-xl bg-emerald-500/20 border-2 border-emerald-500/40 px-4 py-2">
                          <FileSpreadsheet className="h-6 w-6 text-emerald-400" />
                          <span className="text-xl font-bold text-emerald-400">{alertData.maxResults}</span>
                        </div>
                      </div>
                      <p className="text-base text-slate-400 mt-3">Higher values = more comprehensive but larger file sizes</p>
                    </div>
                  </div>
                </div>

                {/* Info Box */}
                <div className="rounded-2xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 to-slate-900/50 p-6">
                  <div className="flex items-start gap-4">
                    <div className="rounded-xl bg-emerald-500/20 p-3">
                      <Info className="h-7 w-7 text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-2xl text-emerald-400 mb-4">Your spreadsheet will include:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="flex items-center gap-2 text-white text-base">
                          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                          <span>Solicitation Title & Notice ID</span>
                        </div>
                        <div className="flex items-center gap-2 text-white text-base">
                          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                          <span>Agency & Set-Aside Type</span>
                        </div>
                        <div className="flex items-center gap-2 text-white text-base">
                          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                          <span>Posted Date & Response Deadline</span>
                        </div>
                        <div className="flex items-center gap-2 text-white text-base">
                          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                          <span>NAICS Code & Place of Performance</span>
                        </div>
                        <div className="flex items-center gap-2 text-white text-base">
                          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                          <span>Direct link to SAM.gov (if enabled)</span>
                        </div>
                        <div className="flex items-center gap-2 text-white text-base">
                          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                          <span>Brief description/synopsis</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Error/Success Messages */}
                {error && (
                  <div className="rounded-2xl border-2 border-red-500/50 bg-red-950/30 p-5">
                    <div className="flex items-center gap-3 text-red-400">
                      <AlertCircle className="h-7 w-7 flex-shrink-0" />
                      <span className="text-lg font-bold">{error}</span>
                    </div>
                  </div>
                )}

                {success && (
                  <div className="rounded-2xl border-2 border-emerald-500/50 bg-emerald-950/30 p-5">
                    <div className="flex items-center gap-3 text-emerald-400">
                      <CheckCircle2 className="h-7 w-7 flex-shrink-0" />
                      <span className="text-lg font-bold">{success}</span>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between gap-4 pt-6 border-t-2 border-slate-700">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isSaving}
                    className="px-8 py-4 text-lg font-bold rounded-xl border-2 border-slate-600 text-slate-300 hover:text-white hover:border-slate-500 hover:bg-slate-800/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-10 py-4 text-lg font-bold rounded-xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-500 text-white hover:from-emerald-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-2xl shadow-emerald-500/50"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-6 w-6 animate-spin" />
                        {mode === 'edit' ? 'Updating Alert...' : 'Creating Alert...'}
                      </>
                    ) : (
                      <>
                        <Bell className="h-6 w-6" />
                        {mode === 'edit' ? 'Update Alert Subscription' : 'Create Alert Subscription'}
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
