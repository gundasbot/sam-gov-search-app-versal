// components/SavedSearchModal.tsx - IMPROVED VERSION

'use client'

import React, { useState, useEffect } from 'react'
import {
  X,
  Save,
  Bell,
  Play,
  FileText,
  FileSpreadsheet,
  Code,
  Download,
  Mail,
  Calendar,
  AlertCircle,
  Check,
  Loader2,
  Info,
  Zap,
  Filter,
  Search,
  ChevronDown,
  Building2,
  MapPin,
  Hash,
  Tag,
  Clock,
  Edit2
} from 'lucide-react'

export type FileFormat = 'csv' | 'excel' | 'json' | 'text'
export type NotificationFrequency = 'daily' | 'weekly' | 'monthly' | 'as-changes' | 'manual'

export interface SavedSearch {
  name: string
  description?: string
  frequency: NotificationFrequency
  emailNotification: boolean
  fileFormat: FileFormat
  includeLinks: boolean
  maxResults: number
  sendEmptyResults: boolean
  filters: {
    keywords?: string
    naics?: string
    agency?: string
    setAside?: string
    stateOfPerformance?: string
    procurementType?: string
    postedAfter?: string
    postedBefore?: string
  }
}

interface SavedSearchModalProps {
  isOpen: boolean
  onClose: () => void
  currentFilters: Record<string, any>
  onSave: (searchData: SavedSearch) => Promise<void>
  onRunSearch?: (searchData: SavedSearch) => Promise<void>
}

// Comprehensive Set-Aside Types from SAM.gov
const SET_ASIDE_OPTIONS = [
  { value: '', label: 'All Set-Asides' },
  { value: 'SBA', label: 'Total Small Business Set-Aside (FAR 19.5)' },
  { value: '8A', label: '8(a) Set-Aside' },
  { value: 'HZC', label: 'HUBZone Set-Aside' },
  { value: 'SDVOSBC', label: 'Service-Disabled Veteran-Owned Small Business (SDVOSB) Set-Aside' },
  { value: 'WOSB', label: 'Women-Owned Small Business (WOSB) Program Set-Aside' },
  { value: 'EDWOSB', label: 'Economically Disadvantaged WOSB Set-Aside' },
  { value: 'SBP', label: 'Small Business Set-Aside - Partial' },
  { value: 'VSA', label: 'Veteran-Owned Small Business Set-Aside' },
  { value: 'VSB', label: 'Veteran Small Business' },
  { value: 'LAS', label: 'Local Area Set-Aside' },
  { value: 'IEE', label: 'Indian Economic Enterprise Set-Aside' },
  { value: 'ISBEE', label: 'Indian Small Business Economic Enterprise Set-Aside' },
  { value: 'BICiv', label: 'Buy Indian Set-Aside' },
]

// US States and Territories
const STATE_OPTIONS = [
  { value: '', label: 'All States' },
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'DC', label: 'District of Columbia' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
  { value: 'AS', label: 'American Samoa' },
  { value: 'GU', label: 'Guam' },
  { value: 'MP', label: 'Northern Mariana Islands' },
  { value: 'PR', label: 'Puerto Rico' },
  { value: 'VI', label: 'Virgin Islands' },
]

const PROCUREMENT_TYPE_OPTIONS = [
  { value: 'o', label: 'Opportunities (All)' },
  { value: 's', label: 'Sources Sought' },
  { value: 'p', label: 'Presolicitation' },
  { value: 'k', label: 'Combined Synopsis/Solicitation' },
  { value: 'r', label: 'Solicitation' },
  { value: 'g', label: 'Sale of Surplus Property' },
  { value: 'a', label: 'Award Notice' },
  { value: 'i', label: 'Intent to Bundle' },
]

const FILE_FORMAT_OPTIONS = [
  {
    value: 'csv' as FileFormat,
    label: 'CSV',
    icon: <FileText className="h-4 w-4" />,
    description: 'Lightweight, opens in Excel',
    recommended: true
  },
  {
    value: 'excel' as FileFormat,
    label: 'Excel',
    icon: <FileSpreadsheet className="h-4 w-4" />,
    description: 'Full formatting & features',
    recommended: false
  },
  {
    value: 'json' as FileFormat,
    label: 'JSON',
    icon: <Code className="h-4 w-4" />,
    description: 'For developers & APIs',
    recommended: false
  },
  {
    value: 'text' as FileFormat,
    label: 'Text',
    icon: <FileText className="h-4 w-4" />,
    description: 'Simple plain text',
    recommended: false
  }
]

const FREQUENCY_OPTIONS = [
  {
    value: 'daily' as NotificationFrequency,
    label: 'Daily',
    description: 'Every morning at 8 AM EST',
    icon: <Calendar className="h-4 w-4" />,
    recommended: true
  },
  {
    value: 'weekly' as NotificationFrequency,
    label: 'Weekly',
    description: 'Every Monday at 8 AM EST',
    icon: <Calendar className="h-4 w-4" />,
    recommended: false
  },
  {
    value: 'monthly' as NotificationFrequency,
    label: 'Monthly',
    description: 'First day of each month',
    icon: <Calendar className="h-4 w-4" />,
    recommended: false
  },
  {
    value: 'as-changes' as NotificationFrequency,
    label: 'Real-time',
    description: 'Immediate alerts (Enterprise only)',
    icon: <Zap className="h-4 w-4" />,
    recommended: false
  },
  {
    value: 'manual' as NotificationFrequency,
    label: 'Manual Only',
    description: 'Run from dashboard',
    icon: <Play className="h-4 w-4" />,
    recommended: false
  }
]

export default function SavedSearchModal({
  isOpen,
  onClose,
  currentFilters,
  onSave,
  onRunSearch
}: SavedSearchModalProps) {
  const [activeTab, setActiveTab] = useState<'basic' | 'filters' | 'delivery'>('basic')
  const [searchData, setSearchData] = useState<SavedSearch>({
    name: '',
    description: '',
    frequency: 'daily',
    emailNotification: true,
    fileFormat: 'csv',
    includeLinks: true,
    maxResults: 100,
    sendEmptyResults: false,
    filters: {
      keywords: currentFilters?.keywords || '',
      naics: currentFilters?.naics || '',
      agency: currentFilters?.agency || '',
      setAside: currentFilters?.setAside || '',
      stateOfPerformance: currentFilters?.stateOfPerformance || '',
      procurementType: currentFilters?.procurementType || 'o',
      postedAfter: currentFilters?.postedAfter || '',
      postedBefore: currentFilters?.postedBefore || '',
    }
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Generate smart default name based on filters
  // ✅ FIX: Added currentFilters check to prevent undefined error
  useEffect(() => {
    if (isOpen && !searchData.name && currentFilters) {
      const name = generateSmartName()
      setSearchData(prev => ({ ...prev, name }))
    }
  }, [isOpen])

  // ✅ FIX: Added safe access to currentFilters
  const generateSmartName = () => {
    const parts: string[] = []
    
    // Safe access with fallback to empty object
    const filters = currentFilters || {}

    if (filters.keywords) {
      parts.push(filters.keywords.substring(0, 30))
    }
    if (filters.setAside) {
      const setAsideLabel = SET_ASIDE_OPTIONS.find(opt => opt.value === filters.setAside)?.label
      parts.push(setAsideLabel?.split(' ')[0] || filters.setAside)
    }
    if (filters.stateOfPerformance) {
      const stateLabel = STATE_OPTIONS.find(opt => opt.value === filters.stateOfPerformance)?.label
      parts.push(stateLabel || filters.stateOfPerformance)
    }
    if (filters.naics) {
      parts.push(`NAICS ${filters.naics}`)
    }

    const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return parts.length > 0
      ? `${parts.join(' - ')} (${date})`
      : `SAM.gov Search - ${date}`
  }

  const getActiveFiltersCount = () => {
    return Object.values(searchData.filters).filter(v => v && v !== '' && v !== 'o').length
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!searchData.name.trim()) {
      errors.name = 'Search name is required'
    } else if (searchData.name.length > 100) {
      errors.name = 'Name must be less than 100 characters'
    }

    if (searchData.description && searchData.description.length > 500) {
      errors.description = 'Description must be less than 500 characters'
    }

    if (searchData.maxResults < 1 || searchData.maxResults > 1000) {
      errors.maxResults = 'Max results must be between 1 and 1000'
    }

    if (getActiveFiltersCount() === 0) {
      errors.filters = 'Please add at least one search filter'
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
      await onSave(searchData)
      setSuccess('Search saved successfully!')
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'Failed to save search')
    } finally {
      setIsSaving(false)
    }
  }

  const handleRunNow = async () => {
    if (!validateForm()) {
      setError('Please fix the errors above')
      return
    }

    if (onRunSearch) {
      try {
        setIsRunning(true)
        await onRunSearch(searchData)
        setSuccess('Search executed successfully!')
      } catch (err: any) {
        setError(err.message || 'Failed to run search')
      } finally {
        setIsRunning(false)
      }
    }
  }

  const handleClose = () => {
    if (!isSaving && !isRunning) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="relative w-full max-w-4xl">
          <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 shadow-2xl">
            {/* Header */}
            <div className="border-b border-slate-800 px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 p-2.5">
                    <Save className="h-6 w-6 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Save Search & Create Alert</h2>
                    <p className="text-sm text-slate-400 mt-1">
                      {getActiveFiltersCount()} active {getActiveFiltersCount() === 1 ? 'filter' : 'filters'}
                    </p>
                  </div>
                </div>
                <div>
                  <button
                    onClick={handleClose}
                    disabled={isSaving || isRunning}
                    className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-6 flex gap-1 rounded-xl bg-slate-800/50 p-1">
              <button
                onClick={() => setActiveTab('basic')}
                className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
                  activeTab === 'basic'
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Info className="h-4 w-4" />
                  Basic Info
                </div>
              </button>

              <button
                onClick={() => setActiveTab('filters')}
                className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
                  activeTab === 'filters'
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Filter className="h-4 w-4" />
                  Search Filters
                  <span className="ml-1 rounded-full bg-white/20 px-2 py-0.5 text-xs">
                    {getActiveFiltersCount()}
                  </span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('delivery')}
                className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
                  activeTab === 'delivery'
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Bell className="h-4 w-4" />
                  Delivery
                </div>
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="px-6 py-6">
              <div className="space-y-6">
                {/* BASIC INFO TAB */}
                {activeTab === 'basic' && (
                  <div className="space-y-6">
                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Search Name <span className="text-rose-400">*</span>
                      </label>
                      <div className="relative">
                        <Edit2 className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                        <input
                          type="text"
                          value={searchData.name}
                          onChange={(e) => setSearchData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g., IT Services - SDVOSB - Virginia"
                          className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 pl-11 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                          maxLength={100}
                        />
                      </div>
                      {validationErrors.name && (
                        <p className="mt-1.5 text-sm text-rose-400">{validationErrors.name}</p>
                      )}
                      <p className="mt-1.5 text-xs text-slate-500">
                        {searchData.name.length}/100 characters
                      </p>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Description (Optional)
                      </label>
                      <textarea
                        value={searchData.description}
                        onChange={(e) => setSearchData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Add notes about this search..."
                        rows={3}
                        className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
                        maxLength={500}
                      />
                      {validationErrors.description && (
                        <p className="mt-1.5 text-sm text-rose-400">{validationErrors.description}</p>
                      )}
                      <p className="mt-1.5 text-xs text-slate-500">
                        {searchData.description?.length || 0}/500 characters
                      </p>
                    </div>

                    {/* Info Box */}
                    <div className="rounded-xl border border-blue-900/50 bg-blue-950/20 p-4">
                      <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-slate-300">
                          <p className="font-medium text-blue-300 mb-2">Quick Tips:</p>
                          <ul className="space-y-1.5 text-slate-400">
                            <li>• Use descriptive names to easily identify this search later</li>
                            <li>• Include key details like location, set-aside type, or industry</li>
                            <li>• You can edit or delete this search anytime from your dashboard</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* FILTERS TAB */}
                {activeTab === 'filters' && (
                  <div className="space-y-6">
                    <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-emerald-400 mb-3">
                        <Check className="h-4 w-4" />
                        Active Filters ({getActiveFiltersCount()})
                      </div>
                      {getActiveFiltersCount() === 0 && (
                        <p className="text-sm text-slate-500">No filters selected. Add filters below to narrow your search.</p>
                      )}
                    </div>

                    {/* Keywords */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        <div className="flex items-center gap-2">
                          <Search className="h-4 w-4" />
                          Keywords
                        </div>
                      </label>
                      <input
                        type="text"
                        value={searchData.filters.keywords}
                        onChange={(e) => setSearchData(prev => ({
                          ...prev,
                          filters: { ...prev.filters, keywords: e.target.value }
                        }))}
                        placeholder="e.g., IT support, software development, cloud services"
                        className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                      <p className="mt-1.5 text-xs text-slate-500">
                        Search opportunity titles and descriptions
                      </p>
                    </div>

                    {/* NAICS Code */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        <div className="flex items-center gap-2">
                          <Hash className="h-4 w-4" />
                          NAICS Code
                        </div>
                      </label>
                      <input
                        type="text"
                        value={searchData.filters.naics}
                        onChange={(e) => setSearchData(prev => ({
                          ...prev,
                          filters: { ...prev.filters, naics: e.target.value }
                        }))}
                        placeholder="e.g., 541512"
                        className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                      <p className="mt-1.5 text-xs text-slate-500">
                        North American Industry Classification System code
                      </p>
                    </div>

                    {/* Agency */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          Agency
                        </div>
                      </label>
                      <input
                        type="text"
                        value={searchData.filters.agency}
                        onChange={(e) => setSearchData(prev => ({
                          ...prev,
                          filters: { ...prev.filters, agency: e.target.value }
                        }))}
                        placeholder="e.g., Department of Defense, GSA"
                        className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                      <p className="mt-1.5 text-xs text-slate-500">
                        Federal agency or department name
                      </p>
                    </div>

                    {/* Set-Aside Type */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4" />
                          Set-Aside Type
                        </div>
                      </label>
                      <div className="relative">
                        <select
                          value={searchData.filters.setAside}
                          onChange={(e) => setSearchData(prev => ({
                            ...prev,
                            filters: { ...prev.filters, setAside: e.target.value }
                          }))}
                          className="w-full appearance-none rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 pr-10 text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        >
                          {SET_ASIDE_OPTIONS.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500 pointer-events-none" />
                      </div>
                      <p className="mt-1.5 text-xs text-slate-500">
                        Small business set-aside category
                      </p>
                    </div>

                    {/* State of Performance */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          State of Performance
                        </div>
                      </label>
                      <div className="relative">
                        <select
                          value={searchData.filters.stateOfPerformance}
                          onChange={(e) => setSearchData(prev => ({
                            ...prev,
                            filters: { ...prev.filters, stateOfPerformance: e.target.value }
                          }))}
                          className="w-full appearance-none rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 pr-10 text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        >
                          {STATE_OPTIONS.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500 pointer-events-none" />
                      </div>
                      <p className="mt-1.5 text-xs text-slate-500">
                        Where the work will be performed
                      </p>
                    </div>

                    {/* Procurement Type */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Procurement Type
                        </div>
                      </label>
                      <div className="relative">
                        <select
                          value={searchData.filters.procurementType}
                          onChange={(e) => setSearchData(prev => ({
                            ...prev,
                            filters: { ...prev.filters, procurementType: e.target.value }
                          }))}
                          className="w-full appearance-none rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 pr-10 text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        >
                          {PROCUREMENT_TYPE_OPTIONS.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500 pointer-events-none" />
                      </div>
                      <p className="mt-1.5 text-xs text-slate-500">
                        Type of contract opportunity
                      </p>
                    </div>

                    {/* Date Range */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Posted After
                          </div>
                        </label>
                        <input
                          type="date"
                          value={searchData.filters.postedAfter}
                          onChange={(e) => setSearchData(prev => ({
                            ...prev,
                            filters: { ...prev.filters, postedAfter: e.target.value }
                          }))}
                          className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Posted Before
                          </div>
                        </label>
                        <input
                          type="date"
                          value={searchData.filters.postedBefore}
                          onChange={(e) => setSearchData(prev => ({
                            ...prev,
                            filters: { ...prev.filters, postedBefore: e.target.value }
                          }))}
                          className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>
                    </div>

                    {validationErrors.filters && (
                      <div className="rounded-xl border border-rose-900/50 bg-rose-950/30 p-4">
                        <div className="flex items-center gap-2 text-rose-400">
                          <AlertCircle className="h-5 w-5 flex-shrink-0" />
                          <span className="text-sm font-medium">{validationErrors.filters}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* DELIVERY TAB */}
                {activeTab === 'delivery' && (
                  <div className="space-y-6">
                    {/* Notification Frequency */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-3">
                        Notification Frequency
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {FREQUENCY_OPTIONS.map((freq) => (
                          <button
                            key={freq.value}
                            type="button"
                            onClick={() => setSearchData(prev => ({ ...prev, frequency: freq.value }))}
                            className={`relative rounded-xl border-2 p-4 text-left transition-all ${
                              searchData.frequency === freq.value
                                ? 'border-emerald-500 bg-emerald-500/10'
                                : 'border-slate-700 bg-slate-900/30 hover:border-slate-600'
                            }`}
                          >
                            {freq.recommended && (
                              <span className="absolute -top-2 right-3 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 px-2 py-0.5 text-xs font-semibold text-white">
                                Recommended
                              </span>
                            )}
                            <div className="flex items-start gap-3">
                              <div className={`mt-0.5 ${
                                searchData.frequency === freq.value ? 'text-emerald-400' : 'text-slate-500'
                              }`}>
                                {freq.icon}
                              </div>
                              <div>
                                <div className={`font-semibold ${
                                  searchData.frequency === freq.value ? 'text-emerald-300' : 'text-slate-200'
                                }`}>
                                  {freq.label}
                                </div>
                                <div className="text-xs text-slate-400 mt-0.5">
                                  {freq.description}
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Export Format */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-3">
                        Export File Format
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {FILE_FORMAT_OPTIONS.map((format) => (
                          <button
                            key={format.value}
                            type="button"
                            onClick={() => setSearchData(prev => ({ ...prev, fileFormat: format.value }))}
                            className={`relative rounded-xl border-2 p-3 text-center transition-all ${
                              searchData.fileFormat === format.value
                                ? 'border-cyan-500 bg-cyan-500/10'
                                : 'border-slate-700 bg-slate-900/30 hover:border-slate-600'
                            }`}
                          >
                            {format.recommended && (
                              <span className="absolute -top-2 right-0 rounded-full bg-cyan-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                                ★
                              </span>
                            )}
                            <div className={`mx-auto mb-1.5 ${
                              searchData.fileFormat === format.value ? 'text-cyan-400' : 'text-slate-500'
                            }`}>
                              {format.icon}
                            </div>
                            <div className={`text-sm font-semibold ${
                              searchData.fileFormat === format.value ? 'text-cyan-300' : 'text-slate-200'
                            }`}>
                              {format.label}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {format.description}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Email Options */}
                    <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/30 p-4">
                      <div className="font-medium text-slate-200 flex items-center gap-2">
                        <Mail className="h-4 w-4 text-blue-400" />
                        Email Options
                      </div>

                      {/* Email Notification Toggle */}
                      <label className="flex items-start gap-3 cursor-pointer group">
                        <div className="relative pt-0.5">
                          <input
                            type="checkbox"
                            checked={searchData.emailNotification}
                            onChange={(e) => setSearchData(prev => ({
                              ...prev,
                              emailNotification: e.target.checked
                            }))}
                            className="sr-only"
                          />
                          <div className={`h-6 w-11 rounded-full transition-colors ${
                            searchData.emailNotification ? 'bg-emerald-500' : 'bg-slate-700 group-hover:bg-slate-600'
                          }`} />
                          <div className={`h-5 w-5 rounded-full bg-white transform transition-transform mt-0.5 ${
                            searchData.emailNotification ? 'translate-x-5' : 'translate-x-0.5'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <span className="text-slate-200 font-medium">Send email notifications</span>
                          <p className="text-sm text-slate-400 mt-0.5">
                            Receive results via email automatically
                          </p>
                        </div>
                      </label>

                      {/* Include Links */}
                      <label className="flex items-start gap-3 cursor-pointer group">
                        <div className="relative pt-0.5">
                          <input
                            type="checkbox"
                            checked={searchData.includeLinks}
                            onChange={(e) => setSearchData(prev => ({
                              ...prev,
                              includeLinks: e.target.checked
                            }))}
                            className="sr-only"
                          />
                          <div className={`h-6 w-11 rounded-full transition-colors ${
                            searchData.includeLinks ? 'bg-cyan-500' : 'bg-slate-700 group-hover:bg-slate-600'
                          }`} />
                          <div className={`h-5 w-5 rounded-full bg-white transform transition-transform mt-0.5 ${
                            searchData.includeLinks ? 'translate-x-5' : 'translate-x-0.5'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <span className="text-slate-200 font-medium">Include direct links</span>
                          <p className="text-sm text-slate-400 mt-0.5">
                            Add clickable SAM.gov links in emails
                          </p>
                        </div>
                      </label>

                      {/* Send Empty Results */}
                      <label className="flex items-start gap-3 cursor-pointer group">
                        <div className="relative pt-0.5">
                          <input
                            type="checkbox"
                            checked={searchData.sendEmptyResults}
                            onChange={(e) => setSearchData(prev => ({
                              ...prev,
                              sendEmptyResults: e.target.checked
                            }))}
                            className="sr-only"
                          />
                          <div className={`h-6 w-11 rounded-full transition-colors ${
                            searchData.sendEmptyResults ? 'bg-amber-500' : 'bg-slate-700 group-hover:bg-slate-600'
                          }`} />
                          <div className={`h-5 w-5 rounded-full bg-white transform transition-transform mt-0.5 ${
                            searchData.sendEmptyResults ? 'translate-x-5' : 'translate-x-0.5'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <span className="text-slate-200 font-medium">Notify when no results</span>
                          <p className="text-sm text-slate-400 mt-0.5">
                            Send confirmation even with 0 results
                          </p>
                        </div>
                      </label>
                    </div>

                    {/* Max Results Slider */}
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-3">
                        Maximum Results per Alert
                      </label>
                      <div className="flex items-center gap-4">
                        <input
                          type="range"
                          min={10}
                          max={1000}
                          step={10}
                          value={searchData.maxResults}
                          onChange={(e) => setSearchData(prev => ({
                            ...prev,
                            maxResults: parseInt(e.target.value)
                          }))}
                          className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer
                            [&::-webkit-slider-thumb]:appearance-none
                            [&::-webkit-slider-thumb]:h-5
                            [&::-webkit-slider-thumb]:w-5
                            [&::-webkit-slider-thumb]:rounded-full
                            [&::-webkit-slider-thumb]:bg-gradient-to-br
                            [&::-webkit-slider-thumb]:from-emerald-400
                            [&::-webkit-slider-thumb]:to-cyan-500
                            [&::-webkit-slider-thumb]:shadow-lg
                            [&::-webkit-slider-thumb]:cursor-pointer"
                        />
                        <div className="flex items-center gap-2 min-w-[120px]">
                          <Download className="h-4 w-4 text-emerald-400" />
                          <span className="text-sm font-semibold text-emerald-400">
                            {searchData.maxResults} results
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 mt-2">
                        Limits file size. Higher = more data but larger files.
                      </p>
                    </div>
                  </div>
                )}

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
                <div className="flex flex-col sm:flex-row justify-between gap-3 pt-6 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isSaving || isRunning}
                    className="px-5 py-3 text-sm font-semibold rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 hover:bg-slate-800/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>

                  <div className="flex flex-col sm:flex-row gap-3">
                    {onRunSearch && (
                      <button
                        type="button"
                        onClick={handleRunNow}
                        disabled={isSaving || isRunning}
                        className="px-5 py-3 text-sm font-semibold rounded-xl border border-cyan-700/50 bg-cyan-950/30 text-cyan-300 hover:bg-cyan-900/40 hover:border-cyan-600/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isRunning ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Running...
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4" />
                            Run Now
                          </>
                        )}
                      </button>
                    )}

                    <button
                      type="submit"
                      disabled={isSaving || isRunning}
                      className="px-6 py-3 text-sm font-semibold rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Save Search
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
