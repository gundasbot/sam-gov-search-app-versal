'use client'

import React, { useState, useEffect } from 'react'
import {
  X,
  Save,
  Bell,
  Mail,
  Calendar,
  Clock,
  FileText,
  Download,
  Check,
  Loader2,
  Sparkles,
  ChevronRight,
  Info,
  Search,
  Building,
  MapPin,
  Hash,
  Filter,
  Shield,
} from 'lucide-react'
import { MultiSelectDropdown } from '@/components/MultiSelectDropdown'

// Import constants
import {
  PROCUREMENT_TYPES,
  SET_ASIDE_CODES,
  US_STATES,
} from '@/lib/sam-gov-constants'
import {
  stringToSetAsideCodes,
  stringToLocationCodes,
  getSetAsideLabel as getSetAsideLabelFromConstants,
  getLocationLabel,
} from '@/lib/samGovConstants'

/* =========================================================
   DEFAULT DATE LOGIC
   ========================================================= */

// Format date to MM/DD/YYYY for SAM.gov API
const formatDate = (date: Date): string => {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const year = date.getFullYear()
  return `${month}/${day}/${year}`
}

// Get default date values in YYYY-MM-DD format for <input type="date">
const getDefaultDates = () => {
  return {
    postedFrom: getMonthsAgo(6),
    postedTo: toInputDate(new Date()),
    responseDeadlineFrom: getDaysOffset(-14),
    responseDeadlineTo: getDaysOffset(14),
  }
}

// Get quick-fill date in YYYY-MM-DD format (required by <input type="date">)
const toInputDate = (date: Date): string => {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

// X months ago
const getMonthsAgo = (monthsAgo: number): string => {
  const date = new Date()
  date.setMonth(date.getMonth() - monthsAgo)
  return toInputDate(date)
}

// X days from today (positive = future, negative = past)
const getDaysOffset = (days: number): string => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return toInputDate(date)
}

const TODAY = toInputDate(new Date())

// Get default labels for UI display
const getDefaultDateLabel = (field: 'postedFrom' | 'postedTo' | 'responseDeadlineFrom' | 'responseDeadlineTo'): string => {
  const labels = {
    postedFrom: '6 months ago',
    postedTo: 'Today',
    responseDeadlineFrom: 'Today - 14 days',
    responseDeadlineTo: 'Today + 14 days',
  }
  return labels[field]
}

// Normalize SET_ASIDE_CODES so the UI never renders blank options
type SetAsideOption = { code: string; description: string }
function normalizeSetAsideOptions(items: any): SetAsideOption[] {
  const arr = Array.isArray(items) ? items : []
  const out: SetAsideOption[] = []

  for (let i = 0; i < arr.length; i++) {
    const v = arr[i]
    if (!v) continue

    if (typeof v === 'string') {
      const code = v.trim()
      if (!code) continue
      out.push({ code, description: code })
      continue
    }

    const code = String(v.code ?? v.value ?? v.key ?? '').trim()
    const description = String(v.description ?? v.label ?? v.name ?? code).trim()
    if (!code) continue
    out.push({ code, description: description || code })
  }

  // De-duplicate by code
  const seen = new Set<string>()
  return out.filter((x) => {
    if (seen.has(x.code)) return false
    seen.add(x.code)
    return true
  })
}

const SET_ASIDE_OPTIONS: SetAsideOption[] = normalizeSetAsideOptions(SET_ASIDE_CODES)

// Define missing constants that were expected
const OPPORTUNITY_STATUS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'archived', label: 'Archived' },
]

const ALERT_FREQUENCIES = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'AS_CHANGES', label: 'As Changes Occur' },
]

const EXPORT_FORMATS = [
  { value: 'XLSB', label: 'Excel (XLSB)' },
  { value: 'XLSX', label: 'Excel (XLSX)' },
  { value: 'CSV', label: 'CSV' },
  { value: 'JSON', label: 'JSON' },
  { value: 'PDF', label: 'PDF' },
  { value: 'XML', label: 'XML' },
]

// Define missing helper functions
const getSetAsideLabel = (code: string, short: boolean = false): string => {
  const setAside = SET_ASIDE_OPTIONS.find((s) => s.code === code)
  return setAside ? (short ? setAside.code : setAside.description) : code
}

const getStatusLabel = (status: string): string => {
  const statusObj = OPPORTUNITY_STATUS.find((s) => s.value === status)
  return statusObj ? statusObj.label : status
}

const getStateLabel = (stateCode: string): string => {
  const state = US_STATES.find((s: any) => s.value === stateCode || s.code === stateCode) as any
  return state ? ((state.label || state.name || stateCode) as string) : stateCode
}

const getProcurementTypeLabel = (type: string): string => {
  const procType = PROCUREMENT_TYPES.find((p: any) => p.value === type || p.code === type) as any
  return procType ? ((procType.label || procType.name || type) as string) : type
}

export type AlertFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'AS_CHANGES'
export type FileFormat = 'XLSB' | 'XLSX' | 'CSV' | 'JSON' | 'PDF' | 'XML'

interface SAMGovSearchParams {
  // Text Search
  title?: string
  solnum?: string
  noticeid?: string

  // Procurement Type
  ptype?: string

  // Dates (MM/dd/yyyy format)
  postedFrom?: string
  postedTo?: string
  rdlfrom?: string
  rdlto?: string

  // Organization
  organizationName?: string
  organizationCode?: string

  // Location
  state?: string
  zip?: string

  // Opportunity Details
  status?: string
  typeOfSetAside?: string
  ncode?: string
  ccode?: string

  // Pagination
  limit?: number
  offset?: number
}

interface UnifiedSaveSearchModalProps {
  isOpen: boolean
  onClose: () => void
  mode: 'save' | 'alert'
  searchParams?: SAMGovSearchParams
  existingSearch?: any
  onSave?: (data: any) => void
}

export default function UnifiedSaveSearchModal({
  isOpen,
  onClose,
  mode,
  searchParams: initialSearchParams,
  existingSearch,
  onSave,
}: UnifiedSaveSearchModalProps) {
  // Tab state
  const [activeTab, setActiveTab] = useState<'search' | 'alert'>(
    mode === 'alert' ? 'alert' : 'search'
  )

  // Basic Info
  const [searchName, setSearchName] = useState('')
  const [searchDescription, setSearchDescription] = useState('')

  // Search Criteria - Text Fields
  const [keywords, setKeywords] = useState('')
  const [solicitationNumber, setSolicitationNumber] = useState('')
  const [noticeId, setNoticeId] = useState('')

  // Search Criteria - Dropdowns
  const [procurementType, setProcurementType] = useState('')
  const [setAsideType, setSetAsideType] = useState<string[]>([])
  const [opportunityStatus, setOpportunityStatus] = useState('')
  const [state, setState] = useState<string[]>([])

  // Search Criteria - Codes
  const [naicsCode, setNaicsCode] = useState('')
  const [classificationCode, setClassificationCode] = useState('')
  const [zip, setZip] = useState('')

  // Organization
  const [organizationName, setOrganizationName] = useState('')
  const [organizationCode, setOrganizationCode] = useState('')

  // Dates - Initialize with defaults
  const defaults = getDefaultDates()
  const [postedFrom, setPostedFrom] = useState(defaults.postedFrom)
  const [postedTo, setPostedTo] = useState(defaults.postedTo)
  const [responseDeadlineFrom, setResponseDeadlineFrom] = useState(defaults.responseDeadlineFrom)
  const [responseDeadlineTo, setResponseDeadlineTo] = useState(defaults.responseDeadlineTo)

  // Alert Settings
  const [enableAlert, setEnableAlert] = useState(mode === 'alert')
  const [emailRecipients, setEmailRecipients] = useState('')
  const [frequency, setFrequency] = useState<AlertFrequency>('DAILY')
  const [deliveryTime, setDeliveryTime] = useState('09:00')
  const [fileFormat, setFileFormat] = useState<FileFormat>('XLSB')
  const [includeLinks, setIncludeLinks] = useState(true)
  const [sendEmptyResults, setSendEmptyResults] = useState(false)
  const [maxResults, setMaxResults] = useState(100)

  // UI State
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Initialize from existing search or initial params
  useEffect(() => {
    if (!isOpen) return

    // Get fresh defaults each time modal opens
    const freshDefaults = getDefaultDates()

    // Safety: if opened in "save" mode, never stick on alert tab
    if (mode !== 'alert') setActiveTab('search')

    if (existingSearch) {
      // Editing existing search - use saved values OR defaults if empty
      setSearchName(existingSearch.name || '')
      setSearchDescription(existingSearch.description || '')
      setKeywords(existingSearch.title || '')
      setSolicitationNumber(existingSearch.solnum || '')
      setNoticeId(existingSearch.noticeId || '')
      setProcurementType(existingSearch.ptype || '')
      setSetAsideType(stringToSetAsideCodes(existingSearch.typeOfSetAside || ''))
      setOpportunityStatus(existingSearch.status || '')
      setState(stringToLocationCodes(existingSearch.state || ''))
      setNaicsCode(existingSearch.ncode || '')
      setClassificationCode(existingSearch.ccode || '')
      setZip(existingSearch.zip || '')
      setOrganizationName(existingSearch.organizationName || '')
      setOrganizationCode(existingSearch.organization_code || '')
      
      // Use saved dates OR defaults
      setPostedFrom(existingSearch.postedFrom || freshDefaults.postedFrom)
      setPostedTo(existingSearch.postedTo || freshDefaults.postedTo)
      setResponseDeadlineFrom(existingSearch.rdlfrom || freshDefaults.responseDeadlineFrom)
      setResponseDeadlineTo(existingSearch.rdlto || freshDefaults.responseDeadlineTo)

      // Alert settings
      if (existingSearch.alertSettings) {
        setEnableAlert(existingSearch.alertSettings.enabled || false)
        setEmailRecipients(existingSearch.alertSettings.recipients || '')
        setFrequency(existingSearch.alertSettings.frequency || 'DAILY')
        setDeliveryTime(existingSearch.alertSettings.deliveryTime || '09:00')
        setFileFormat(existingSearch.alertSettings.fileFormat || 'XLSB')
        setIncludeLinks(existingSearch.alertSettings.includeLinks ?? true)
        setSendEmptyResults(existingSearch.alertSettings.sendEmptyResults || false)
        setMaxResults(existingSearch.alertSettings.maxResults || 100)
      }
    } else if (initialSearchParams) {
      // Pre-fill from URL params OR use defaults
      setKeywords(initialSearchParams.title || '')
      setSolicitationNumber(initialSearchParams.solnum || '')
      setNoticeId(initialSearchParams.noticeid || '')
      setProcurementType(initialSearchParams.ptype || '')
      setSetAsideType(stringToSetAsideCodes(initialSearchParams.typeOfSetAside || ''))
      setOpportunityStatus(initialSearchParams.status || '')
      setState(stringToLocationCodes(initialSearchParams.state || ''))
      setNaicsCode(initialSearchParams.ncode || '')
      setClassificationCode(initialSearchParams.ccode || '')
      setZip(initialSearchParams.zip || '')
      setOrganizationName(initialSearchParams.organizationName || '')
      setOrganizationCode(initialSearchParams.organizationCode || '')
      
      // Use params OR defaults
      setPostedFrom(initialSearchParams.postedFrom || freshDefaults.postedFrom)
      setPostedTo(initialSearchParams.postedTo || freshDefaults.postedTo)
      setResponseDeadlineFrom(initialSearchParams.rdlfrom || freshDefaults.responseDeadlineFrom)
      setResponseDeadlineTo(initialSearchParams.rdlto || freshDefaults.responseDeadlineTo)
    } else {
      // Creating brand new search - use defaults
      setPostedFrom(freshDefaults.postedFrom)
      setPostedTo(freshDefaults.postedTo)
      setResponseDeadlineFrom(freshDefaults.responseDeadlineFrom)
      setResponseDeadlineTo(freshDefaults.responseDeadlineTo)
    }
  }, [isOpen, existingSearch, initialSearchParams, mode])

  const handleSubmit = async () => {
    // Basic validation
    if (!searchName.trim()) {
      setError('Please enter a name for this search')
      return
    }

    // If modal opened in alert mode, ensure alert is enabled
    if (mode === 'alert' && !enableAlert) {
      setError('Please enable the subscription to create an alert')
      return
    }

    if (enableAlert && !emailRecipients.trim()) {
      setError('Please specify at least one email recipient for alerts')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const payload = {
        name: searchName,
        description: searchDescription,
        // Flag to indicate this is a subscription alert
        subscription_enabled: enableAlert,
        isSubscription: enableAlert,
        // Search criteria
        title: keywords,
        solnum: solicitationNumber,
        noticeid: noticeId,
        ptype: procurementType,
        typeOfSetAside: setAsideType.join(','),
        status: opportunityStatus,
        state: state.join(','),
        ncode: naicsCode,
        ccode: classificationCode,
        zip,
        organizationName,
        organizationCode,
        postedFrom,
        postedTo,
        rdlfrom: responseDeadlineFrom,
        rdlto: responseDeadlineTo,
        // Alert settings (flattened for API compatibility)
        ...(enableAlert ? {
          recipients: emailRecipients,
          frequency,
          deliveryTime,
          fileFormat,
          includeLinks,
          sendEmptyResults,
          maxResults,
        } : {}),
        // Also nested for modals that expect alertSettings
        alertSettings: enableAlert
          ? {
              enabled: true,
              recipients: emailRecipients,
              frequency,
              deliveryTime,
              fileFormat,
              includeLinks,
              sendEmptyResults,
              maxResults,
            }
          : undefined,
      }

      // Delegate to parent — parent owns the API call
      if (onSave) {
        await onSave(payload)
      }

      // Close modal on success (parent throws on error)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to save search')
    } finally {
      setIsSaving(false)
    }
  }

  // Summary sections
  const getSearchCriteriaSummary = () => {
    const parts: string[] = []
    if (keywords) parts.push(`Keywords: "${keywords}"`)
    if (solicitationNumber) parts.push(`Sol #: ${solicitationNumber}`)
    if (noticeId) parts.push(`Notice ID: ${noticeId}`)
    if (procurementType) parts.push(`Type: ${getProcurementTypeLabel(procurementType)}`)
    if (setAsideType.length > 0) {
      if (setAsideType.length === 1) parts.push(`Set-Aside: ${getSetAsideLabel(setAsideType[0], true)}`)
      else parts.push(`Set-Asides: ${setAsideType.length} selected`)
    }
    if (opportunityStatus) parts.push(`Status: ${getStatusLabel(opportunityStatus)}`)
    if (state.length > 0) {
      if (state.length === 1) parts.push(`State: ${getLocationLabel(state[0])}`)
      else parts.push(`States: ${state.length} selected`)
    }
    if (naicsCode) parts.push(`NAICS: ${naicsCode}`)
    if (classificationCode) parts.push(`Class Code: ${classificationCode}`)
    if (zip) parts.push(`ZIP: ${zip}`)
    if (organizationName) parts.push(`Org: ${organizationName}`)
    if (organizationCode) parts.push(`Org Code: ${organizationCode}`)
    if (postedFrom || postedTo)
      parts.push(
        `Posted: ${postedFrom || '...'} to ${postedTo || '...'}`
      )
    if (responseDeadlineFrom || responseDeadlineTo)
      parts.push(
        `Deadline: ${responseDeadlineFrom || '...'} to ${responseDeadlineTo || '...'}`
      )
    return parts.length > 0 ? parts.join(' • ') : 'No filters set'
  }

  const getAlertSettingsSummary = () => {
    if (!enableAlert) return 'Alerts disabled'
    const parts: string[] = []
    if (emailRecipients) parts.push(`Recipients: ${emailRecipients}`)
    parts.push(`Frequency: ${frequency}`)
    parts.push(`Format: ${fileFormat}`)
    return parts.join(' • ')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-2xl w-full min-w-[800px] max-w-5xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="p-8 border-b border-slate-200 flex-shrink-0">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg">
                  {mode === 'alert' ? (
                    <Bell className="h-6 w-6 text-white" />
                  ) : (
                    <Save className="h-6 w-6 text-white" />
                  )}
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-slate-900">
                    {existingSearch
                      ? `Edit ${mode === 'alert' ? 'Subscription' : 'Saved Search'}`
                      : `Create ${mode === 'alert' ? 'Custom subscription' : 'Custom Saved Search'}`}
                  </h2>
                  <p className="text-slate-600 mt-1">
                    {mode === 'alert'
                      ? 'Set up search criteria and alert settings'
                      : 'Save your search filters for quick access'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setActiveTab('search')}
                className={`flex-1 px-5 py-4 rounded-xl font-semibold transition-all text-base ${
                  activeTab === 'search'
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Search className="h-5 w-5" />
                  Search Criteria
                </div>
              </button>
              <button
                onClick={() => setActiveTab('alert')}
                className={`flex-1 px-5 py-4 rounded-xl font-semibold transition-all text-base ${
                  activeTab === 'alert'
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Bell className="h-5 w-5" />
                  Alert Settings
                </div>
              </button>
            </div>
          </div>

          {/* Content - scrollable */}
          <div className="flex-1 overflow-y-auto p-8">
            {activeTab === 'search' ? (
              // SEARCH CRITERIA TAB
              <div className="space-y-8">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-base font-medium text-slate-700 mb-2">
                      Search Name *
                    </label>
                    <input
                      type="text"
                      value={searchName}
                      onChange={(e) => setSearchName(e.target.value)}
                      placeholder="e.g., IT Services in California"
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-base font-medium text-slate-700 mb-2">
                      Description (Optional)
                    </label>
                    <textarea
                      value={searchDescription}
                      onChange={(e) => setSearchDescription(e.target.value)}
                      placeholder="Add notes about this search..."
                      rows={2}
                      className="w-full px-4 py-3 rounded-lg border border-slate-300 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Text Search Fields */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <Search className="h-6 w-6 text-emerald-500" />
                    Text Search
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-base font-medium text-slate-700 mb-2">
                        Keywords
                      </label>
                      <input
                        type="text"
                        value={keywords}
                        onChange={(e) => setKeywords(e.target.value)}
                        placeholder="e.g., cybersecurity"
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-base font-medium text-slate-700 mb-2">
                        Solicitation Number
                      </label>
                      <input
                        type="text"
                        value={solicitationNumber}
                        onChange={(e) => setSolicitationNumber(e.target.value)}
                        placeholder="e.g., 140D0424R0012"
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-base font-medium text-slate-700 mb-2">
                        Notice ID
                      </label>
                      <input
                        type="text"
                        value={noticeId}
                        onChange={(e) => setNoticeId(e.target.value)}
                        placeholder="e.g., 0987654321abc"
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Opportunity Type */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <FileText className="h-6 w-6 text-emerald-500" />
                    Opportunity Type
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-base font-medium text-slate-700 mb-2">
                        Procurement Type
                      </label>
                      <select
                        value={procurementType}
                        onChange={(e) => setProcurementType(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      >
                        <option value="">All Types</option>
                        {PROCUREMENT_TYPES.map((type: any, index: number) => (
                          <option key={type.value || type.code || `ptype-${index}`} value={type.value || type.code}>
                            {type.label || type.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <MultiSelectDropdown
                        label="Set-Aside Type"
                        options={SET_ASIDE_OPTIONS.filter(sa => sa.code !== '').map(sa => ({
                          value: sa.code,
                          label: sa.description,
                          code: sa.code
                        }))}
                        selected={setAsideType}
                        onChange={setSetAsideType}
                        placeholder="All Set-Asides"
                      />
                    </div>
                    <div>
                      <label className="block text-base font-medium text-slate-700 mb-2">
                        Status
                      </label>
                      <select
                        value={opportunityStatus}
                        onChange={(e) => setOpportunityStatus(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      >
                        <option value="">All Statuses</option>
                        {OPPORTUNITY_STATUS.map((status, index: number) => (
                          <option key={status.value || `status-${index}`} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <MapPin className="h-6 w-6 text-emerald-500" />
                    Location
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <MultiSelectDropdown
                        label="State"
                        options={US_STATES.filter((s: any) => s.value || s.code).map((s: any) => ({ code: s.value || s.code, label: s.label || s.name }))}
                        selected={state}
                        onChange={setState}
                        placeholder="All States"
                      />
                    </div>
                    <div>
                      <label className="block text-base font-medium text-slate-700 mb-2">
                        ZIP Code
                      </label>
                      <input
                        type="text"
                        value={zip}
                        onChange={(e) => setZip(e.target.value)}
                        placeholder="e.g., 20001"
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Advanced Options Toggle */}
                <div>
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    <ChevronRight
                      className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-90' : ''}`}
                    />
                    {showAdvanced ? 'Hide' : 'Show'} Advanced Options
                  </button>

                  {showAdvanced && (
                    <div className="mt-4 space-y-4">
                      {/* Organization */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                          <Building className="h-6 w-6 text-emerald-500" />
                          Organization
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-base font-medium text-slate-700 mb-2">
                              Organization Name
                            </label>
                            <input
                              type="text"
                              value={organizationName}
                              onChange={(e) => setOrganizationName(e.target.value)}
                              placeholder="e.g., Department of Defense"
                              className="w-full px-4 py-3 rounded-lg border border-slate-300 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                          </div>
                          <div>
                            <label className="block text-base font-medium text-slate-700 mb-2">
                              Organization Code
                            </label>
                            <input
                              type="text"
                              value={organizationCode}
                              onChange={(e) => setOrganizationCode(e.target.value)}
                              placeholder="e.g., DOD"
                              className="w-full px-4 py-3 rounded-lg border border-slate-300 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Classification Codes */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                          <Hash className="h-6 w-6 text-emerald-500" />
                          Classification Codes
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-base font-medium text-slate-700 mb-2">
                              NAICS Code
                            </label>
                            <input
                              type="text"
                              value={naicsCode}
                              onChange={(e) => setNaicsCode(e.target.value)}
                              placeholder="e.g., 541512"
                              className="w-full px-4 py-3 rounded-lg border border-slate-300 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                          </div>
                          <div>
                            <label className="block text-base font-medium text-slate-700 mb-2">
                              Classification Code
                            </label>
                            <input
                              type="text"
                              value={classificationCode}
                              onChange={(e) => setClassificationCode(e.target.value)}
                              placeholder="e.g., R425"
                              className="w-full px-4 py-3 rounded-lg border border-slate-300 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Dates */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                          <Calendar className="h-6 w-6 text-emerald-500" />
                          Dates
                        </h3>

                        {/* Posted Date Range */}
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-3">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Posted Date Range</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">From</label>
                              <input
                                type="date"
                                value={postedFrom}
                                onChange={(e) => setPostedFrom(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                              />
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                <span className="text-xs text-gray-500 self-center">Quick:</span>
                                {([
                                  { label: '1M', months: 1, cls: 'bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-200' },
                                  { label: '3M', months: 3, cls: 'bg-purple-100 hover:bg-purple-200 text-purple-700 border-purple-200' },
                                  { label: '6M', months: 6, cls: 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700 border-emerald-200' },
                                  { label: '9M', months: 9, cls: 'bg-orange-100 hover:bg-orange-200 text-orange-700 border-orange-200' },
                                  { label: '1Y', months: 12, cls: 'bg-red-100 hover:bg-red-200 text-red-700 border-red-200' },
                                ] as const).map(({ label, months, cls }) => (
                                  <button
                                    key={label}
                                    type="button"
                                    onClick={() => setPostedFrom(getMonthsAgo(months))}
                                    className={`px-2 py-0.5 text-xs font-semibold rounded border transition-colors ${cls}`}
                                  >
                                    {label}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">To</label>
                              <input
                                type="date"
                                value={postedTo}
                                onChange={(e) => setPostedTo(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                              />
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                <span className="text-xs text-gray-500 self-center">Quick:</span>
                                <button type="button" onClick={() => setPostedTo(TODAY)}
                                  className="px-2 py-0.5 text-xs font-semibold rounded border bg-emerald-100 hover:bg-emerald-200 text-emerald-700 border-emerald-200 transition-colors">
                                  Today
                                </button>
                                <button type="button" onClick={() => setPostedTo(getDaysOffset(7))}
                                  className="px-2 py-0.5 text-xs font-semibold rounded border bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-200 transition-colors">
                                  +7d
                                </button>
                                <button type="button" onClick={() => setPostedTo(getDaysOffset(30))}
                                  className="px-2 py-0.5 text-xs font-semibold rounded border bg-purple-100 hover:bg-purple-200 text-purple-700 border-purple-200 transition-colors">
                                  +30d
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Response Deadline Range */}
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-3">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Response Deadline Range</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">From</label>
                              <input
                                type="date"
                                value={responseDeadlineFrom}
                                onChange={(e) => setResponseDeadlineFrom(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                              />
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                <span className="text-xs text-gray-500 self-center">Quick:</span>
                                <button type="button" onClick={() => setResponseDeadlineFrom(TODAY)}
                                  className="px-2 py-0.5 text-xs font-semibold rounded border bg-emerald-100 hover:bg-emerald-200 text-emerald-700 border-emerald-200 transition-colors">
                                  Today
                                </button>
                                <button type="button" onClick={() => setResponseDeadlineFrom(getDaysOffset(-7))}
                                  className="px-2 py-0.5 text-xs font-semibold rounded border bg-orange-100 hover:bg-orange-200 text-orange-700 border-orange-200 transition-colors">
                                  -7d
                                </button>
                                <button type="button" onClick={() => setResponseDeadlineFrom(getDaysOffset(-30))}
                                  className="px-2 py-0.5 text-xs font-semibold rounded border bg-red-100 hover:bg-red-200 text-red-700 border-red-200 transition-colors">
                                  -30d
                                </button>
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">To</label>
                              <input
                                type="date"
                                value={responseDeadlineTo}
                                onChange={(e) => setResponseDeadlineTo(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                              />
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                <span className="text-xs text-gray-500 self-center">Quick:</span>
                                <button type="button" onClick={() => setResponseDeadlineTo(getDaysOffset(7))}
                                  className="px-2 py-0.5 text-xs font-semibold rounded border bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-200 transition-colors">
                                  +7d
                                </button>
                                <button type="button" onClick={() => setResponseDeadlineTo(getDaysOffset(14))}
                                  className="px-2 py-0.5 text-xs font-semibold rounded border bg-purple-100 hover:bg-purple-200 text-purple-700 border-purple-200 transition-colors">
                                  +14d
                                </button>
                                <button type="button" onClick={() => setResponseDeadlineTo(getDaysOffset(30))}
                                  className="px-2 py-0.5 text-xs font-semibold rounded border bg-emerald-100 hover:bg-emerald-200 text-emerald-700 border-emerald-200 transition-colors">
                                  +30d
                                </button>
                                <button type="button" onClick={() => setResponseDeadlineTo(getDaysOffset(90))}
                                  className="px-2 py-0.5 text-xs font-semibold rounded border bg-orange-100 hover:bg-orange-200 text-orange-700 border-orange-200 transition-colors">
                                  +90d
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Purpose note */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-slate-500 mt-0.5" />
                    <div className="text-sm text-slate-700">
                      {mode === 'alert' ? (
                        <>
                          <div className="font-semibold text-slate-900 mb-1">
                            Custom subscription = scheduled email alerts
                          </div>
                          <div>
                            Use Search Criteria + Alert Settings to email pre-selected query results on a schedule.
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="font-semibold text-slate-900 mb-1">
                            Custom Saved Search = one-click search
                          </div>
                          <div>
                            Save filters for fast "Run Search" later (no scheduled emailing).
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
            // ALERT SETTINGS TAB
            <div className="space-y-8">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-slate-500 mt-0.5" />
                  <div className="text-sm text-slate-700">
                    Configure how and when this subscription emails results.
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200">
                  <div>
                    <h4 className="font-semibold text-slate-900">Enable Subscription</h4>
                    <p className="text-sm text-slate-600">Send scheduled email alerts</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEnableAlert(!enableAlert)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      enableAlert ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        enableAlert ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {enableAlert && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-base font-medium text-slate-700 mb-2">
                        Email Recipients
                      </label>
                      <input
                        type="text"
                        value={emailRecipients}
                        onChange={(e) => setEmailRecipients(e.target.value)}
                        placeholder="comma-separated emails"
                        className="w-full px-4 py-3 rounded-lg border border-slate-300 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-base font-medium text-slate-700 mb-2">
                          Frequency
                        </label>
                        <select
                          value={frequency}
                          onChange={(e) => setFrequency(e.target.value as AlertFrequency)}
                          className="w-full px-4 py-3 rounded-lg border border-slate-300 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        >
                          {ALERT_FREQUENCIES.map((f, index: number) => (
                            <option key={f.value || `freq-${index}`} value={f.value}>
                              {f.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-base font-medium text-slate-700 mb-2">
                          Delivery Time
                        </label>
                        <input
                          type="time"
                          value={deliveryTime}
                          onChange={(e) => setDeliveryTime(e.target.value)}
                          className="w-full px-4 py-3 rounded-lg border border-slate-300 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-base font-medium text-slate-700 mb-2">
                          File Format
                        </label>
                        <select
                          value={fileFormat}
                          onChange={(e) => setFileFormat(e.target.value as FileFormat)}
                          className="w-full px-4 py-3 rounded-lg border border-slate-300 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        >
                          {EXPORT_FORMATS.map((f, index: number) => (
                            <option key={f.value || `format-${index}`} value={f.value}>
                              {f.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-base font-medium text-slate-700 mb-2">
                          Max Results
                        </label>
                        <input
                          type="number"
                          value={maxResults}
                          onChange={(e) => setMaxResults(parseInt(e.target.value || '0', 10) || 0)}
                          min={1}
                          max={1000}
                          className="w-full px-4 py-3 rounded-lg border border-slate-300 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="flex items-center gap-3 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={includeLinks}
                          onChange={(e) => setIncludeLinks(e.target.checked)}
                          className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        Include links in email
                      </label>

                      <label className="flex items-center gap-3 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={sendEmptyResults}
                          onChange={(e) => setSendEmptyResults(e.target.checked)}
                          className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        Send even when results are empty
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-slate-200 flex items-center justify-between">
          <div className="text-base text-slate-600">
            {error ? <span className="text-red-600 font-medium">{error}</span> : null}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors text-base"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSaving}
              className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold flex items-center gap-2 shadow-lg shadow-emerald-500/30 transition-all disabled:opacity-50 text-base"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-5 w-5" />
                  {existingSearch
                    ? 'Save Changes'
                    : mode === 'alert'
                      ? 'Create Custom subscription'
                      : 'Create A Custom Saved Search'}
                </>
              )}
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}
