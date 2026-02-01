// components/SaveSearchModal.tsx
'use client'

import React, { useState, useEffect } from 'react'
import {
  X,
  Save,
  Bell,
  Calendar,
  Mail,
  FileText,
  Clock,
  AlertCircle,
  Play,
  Share2,
} from 'lucide-react'

interface SaveSearchModalProps {
  isOpen: boolean
  onClose: () => void
  currentSearch?: {
    keywords?: string
    naics?: string
    agency?: string
    setAside?: string
    stateOfPerformance?: string
    procurementType?: string
    postedAfter?: string
    postedBefore?: string
  }
  editMode?: boolean
  existingSearch?: any
  onSuccess?: () => void
}

// US States for dropdown
const US_STATES = [
  { code: '', name: 'All States' },
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'DC', name: 'District of Columbia' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
]

// Set-Aside types
const SET_ASIDE_TYPES = [
  { code: '', name: 'All Types' },
  { code: 'SBA', name: 'Small Business Set-Aside (SBA)' },
  { code: '8A', name: '8(a) Business Development' },
  { code: 'HZC', name: 'HUBZone Set-Aside' },
  { code: 'SDVOSBC', name: 'Service-Disabled Veteran-Owned' },
  { code: 'WOSB', name: 'Women-Owned Small Business' },
  { code: 'EDWOSB', name: 'Economically Disadvantaged WOSB' },
  { code: 'LAS', name: 'Local Area Set-Aside' },
  { code: 'IEE', name: 'Indian Economic Enterprise' },
  { code: 'ISBEE', name: 'Indian Small Business Economic Enterprise' },
  { code: 'BICiv', name: 'Buy Indian' },
]

export default function SaveSearchModal({
  isOpen,
  onClose,
  currentSearch = {},
  editMode = false,
  existingSearch,
  onSuccess,
}: SaveSearchModalProps) {
  const [loading, setLoading] = useState(false)
  const [runningSearch, setRunningSearch] = useState(false)
  const [error, setError] = useState('')
  const [runResults, setRunResults] = useState<number | null>(null)
  
  // Basic info
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPinned, setIsPinned] = useState(false)
  
  // Search criteria - NOW EDITABLE IN MODAL
  const [keywords, setKeywords] = useState('')
  const [naics, setNaics] = useState('')
  const [agency, setAgency] = useState('')
  const [setAside, setSetAside] = useState('')
  const [stateOfPerformance, setStateOfPerformance] = useState('')
  const [postedAfter, setPostedAfter] = useState('')
  const [postedBefore, setPostedBefore] = useState('')
  const [procurementType, setProcurementType] = useState('o')
  
  // Subscription settings
  const [enableSubscription, setEnableSubscription] = useState(false)
  const [frequency, setFrequency] = useState('DAILY')
  const [recipients, setRecipients] = useState('')
  const [emailNotification, setEmailNotification] = useState(true)
  const [sendEmptyResults, setSendEmptyResults] = useState(false)
  const [maxResults, setMaxResults] = useState(100)
  const [deliveryTime, setDeliveryTime] = useState('09:00')
  const [exportFormat, setExportFormat] = useState('CSV')
  const [includeLinks, setIncludeLinks] = useState(true)

  // Initialize form with existing data
  useEffect(() => {
    if (editMode && existingSearch) {
      setName(existingSearch.name || '')
      setDescription(existingSearch.description || '')
      setIsPinned(existingSearch.isPinned || false)
      
      setKeywords(existingSearch.keywords || '')
      setNaics(existingSearch.naics || '')
      setAgency(existingSearch.agency || '')
      setSetAside(existingSearch.setAside || '')
      setStateOfPerformance(existingSearch.stateOfPerformance || '')
      setPostedAfter(existingSearch.postedAfter ? existingSearch.postedAfter.split('T')[0] : '')
      setPostedBefore(existingSearch.postedBefore ? existingSearch.postedBefore.split('T')[0] : '')
      setProcurementType(existingSearch.procurementType || 'o')
      
      setEnableSubscription(existingSearch.subscriptionEnabled || false)
      setFrequency(existingSearch.frequency || 'DAILY')
      setRecipients(existingSearch.recipients || '')
      setEmailNotification(existingSearch.emailNotification ?? true)
      setSendEmptyResults(existingSearch.sendEmptyResults ?? false)
      setMaxResults(existingSearch.maxResults || 100)
      setDeliveryTime(existingSearch.deliveryTime || '09:00')
      setExportFormat(existingSearch.exportFormat || 'CSV')
      setIncludeLinks(existingSearch.includeLinks ?? true)
    } else {
      // New search - use current search criteria
      setKeywords(currentSearch.keywords || '')
      setNaics(currentSearch.naics || '')
      setAgency(currentSearch.agency || '')
      setSetAside(currentSearch.setAside || '')
      setStateOfPerformance(currentSearch.stateOfPerformance || '')
      setPostedAfter(currentSearch.postedAfter || '')
      setPostedBefore(currentSearch.postedBefore || '')
      setProcurementType(currentSearch.procurementType || 'o')
    }
  }, [editMode, existingSearch, currentSearch, isOpen])

  const handleManualRun = async () => {
    if (!editMode && !existingSearch?.id) {
      setError('Please save the search first before running it')
      return
    }

    setRunningSearch(true)
    setError('')
    setRunResults(null)

    try {
      const searchId = editMode ? existingSearch.id : existingSearch?.id
      const response = await fetch(`/api/saved-searches/${searchId}/run`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to run search')
      }

      const data = await response.json()
      setRunResults(data.resultCount)
      
      // Show success for 3 seconds
      setTimeout(() => setRunResults(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run search')
    } finally {
      setRunningSearch(false)
    }
  }

  const handleShare = async () => {
    if (!editMode && !existingSearch?.id) {
      setError('Please save the search first before sharing')
      return
    }

    const searchUrl = `${window.location.origin}/alerts?search=${existingSearch?.id || ''}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: name || 'Saved Search',
          text: description || 'Check out this saved search',
          url: searchUrl,
        })
      } catch (err) {
        // User cancelled share
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(searchUrl)
        alert('Link copied to clipboard!')
      } catch (err) {
        setError('Failed to share search')
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Name is required')
      return
    }

    if (enableSubscription && !recipients.trim()) {
      setError('Email recipients are required when subscription is enabled')
      return
    }

    setLoading(true)

    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        isPinned,
        
        // Search criteria
        keywords: keywords.trim() || null,
        naics: naics.trim() || null,
        agency: agency.trim() || null,
        setAside: setAside || null,
        stateOfPerformance: stateOfPerformance || null,
        postedAfter: postedAfter || null,
        postedBefore: postedBefore || null,
        procurementType,
        
        // Subscription settings
        subscriptionEnabled: enableSubscription,
        frequency: enableSubscription ? frequency : null,
        recipients: recipients.trim() || null,
        emailNotification,
        sendEmptyResults,
        maxResults,
        deliveryTime,
        exportFormat,
        includeLinks,
      }

      const url = editMode 
        ? `/api/saved-searches/${existingSearch.id}`
        : '/api/saved-searches'
      
      const method = editMode ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save search')
      }

      onSuccess?.()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save search')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-slate-800 p-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 flex items-center justify-center">
              <Save className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {editMode ? 'Edit Saved Search' : 'Save Search'}
              </h2>
              <p className="text-sm text-slate-400">
                {editMode ? 'Update search criteria and subscription settings' : 'Save this search for quick access and email alerts'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Run Results */}
          {runResults !== null && (
            <div className="flex items-center gap-2 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <Play className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm">Search completed: {runResults} results found</p>
            </div>
          )}

          {/* Action Buttons for Existing Searches */}
          {editMode && existingSearch?.id && (
            <div className="flex items-center gap-3 p-4 bg-slate-800/30 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={handleManualRun}
                disabled={runningSearch}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-all disabled:opacity-50"
              >
                <Play className="h-4 w-4" />
                {runningSearch ? 'Running...' : 'Run Search Now'}
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-300 border border-slate-600 transition-all"
              >
                <Share2 className="h-4 w-4" />
                Share
              </button>
            </div>
          )}

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-400" />
              Basic Information
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Search Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., IT Services - California"
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add notes about this search..."
                rows={2}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 resize-none"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500/50"
              />
              <span className="text-sm text-slate-300">Pin to top of list</span>
            </label>
          </div>

          {/* Search Criteria - NOW FULLY EDITABLE */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <h3 className="text-lg font-semibold text-white">Search Criteria</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Keywords */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Keywords
                </label>
                <input
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="e.g., software development, cloud computing"
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              {/* NAICS Code */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  NAICS Code
                </label>
                <input
                  type="text"
                  value={naics}
                  onChange={(e) => setNaics(e.target.value)}
                  placeholder="e.g., 541512"
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
                <p className="text-xs text-slate-500 mt-1">
                  6-digit NAICS classification code
                </p>
              </div>

              {/* Agency */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Agency
                </label>
                <input
                  type="text"
                  value={agency}
                  onChange={(e) => setAgency(e.target.value)}
                  placeholder="e.g., Department of Defense"
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              {/* Set-Aside Dropdown */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Set-Aside Type
                </label>
                <select
                  value={setAside}
                  onChange={(e) => setSetAside(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                >
                  {SET_ASIDE_TYPES.map((type) => (
                    <option key={type.code} value={type.code}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* State Dropdown */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  State/Territory
                </label>
                <select
                  value={stateOfPerformance}
                  onChange={(e) => setStateOfPerformance(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                >
                  {US_STATES.map((state) => (
                    <option key={state.code} value={state.code}>
                      {state.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Procurement Type */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Procurement Type
                </label>
                <select
                  value={procurementType}
                  onChange={(e) => setProcurementType(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                >
                  <option value="o">All Types</option>
                  <option value="p">Solicitation</option>
                  <option value="g">Award Notice</option>
                  <option value="r">Sources Sought</option>
                  <option value="s">Special Notice</option>
                  <option value="i">Intent to Bundle</option>
                  <option value="a">Presolicitation</option>
                </select>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Posted After
                </label>
                <input
                  type="date"
                  value={postedAfter}
                  onChange={(e) => setPostedAfter(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Posted Before
                </label>
                <input
                  type="date"
                  value={postedBefore}
                  onChange={(e) => setPostedBefore(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
            </div>
          </div>

          {/* Email Subscription Settings */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-emerald-400" />
                <h3 className="text-lg font-semibold text-white">Email Alerts (Optional)</h3>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableSubscription}
                  onChange={(e) => setEnableSubscription(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-500/50 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            {enableSubscription && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-7">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    <Mail className="inline h-4 w-4 mr-1" />
                    Email Recipients *
                  </label>
                  <input
                    type="email"
                    value={recipients}
                    onChange={(e) => setRecipients(e.target.value)}
                    placeholder="your@email.com, colleague@email.com"
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    required={enableSubscription}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Separate multiple emails with commas
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    <Clock className="inline h-4 w-4 mr-1" />
                    Frequency
                  </label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  >
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly (Monday)</option>
                    <option value="BIWEEKLY">Bi-Weekly (Every 2 weeks)</option>
                    <option value="MONTHLY">Monthly (1st of month)</option>
                    <option value="AS_CHANGES">As Changes Occur (Real-time)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Delivery Time
                  </label>
                  <select
                    value={deliveryTime}
                    onChange={(e) => setDeliveryTime(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  >
                    <option value="06:00">6:00 AM</option>
                    <option value="07:00">7:00 AM</option>
                    <option value="08:00">8:00 AM</option>
                    <option value="09:00">9:00 AM</option>
                    <option value="10:00">10:00 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="12:00">12:00 PM</option>
                    <option value="13:00">1:00 PM</option>
                    <option value="14:00">2:00 PM</option>
                    <option value="15:00">3:00 PM</option>
                    <option value="16:00">4:00 PM</option>
                    <option value="17:00">5:00 PM</option>
                    <option value="18:00">6:00 PM</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Export Format
                  </label>
                  <select
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  >
                    <option value="CSV">CSV (Spreadsheet)</option>
                    <option value="EXCEL">Excel (.xlsx)</option>
                    <option value="PDF">PDF Document</option>
                    <option value="JSON">JSON (Data)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Max Results
                  </label>
                  <input
                    type="number"
                    value={maxResults}
                    onChange={(e) => setMaxResults(Number(e.target.value))}
                    min="1"
                    max="1000"
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={emailNotification}
                      onChange={(e) => setEmailNotification(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500/50"
                    />
                    <span className="text-sm text-slate-300">Send email notifications</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendEmptyResults}
                      onChange={(e) => setSendEmptyResults(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500/50"
                    />
                    <span className="text-sm text-slate-300">Send alerts even when no results found</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeLinks}
                      onChange={(e) => setIncludeLinks(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500/50"
                    />
                    <span className="text-sm text-slate-300">Include direct links in email</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl font-medium text-slate-300 hover:bg-slate-800 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:from-emerald-600 hover:to-cyan-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {editMode ? 'Update Search' : 'Save Search'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}