// components/RunSearchModal.tsx
'use client'

import { useState } from 'react'
import { X, PlayCircle, AlertCircle, Calendar, Filter, Mail, Loader2 } from 'lucide-react'

interface RunSearchModalProps {
  isOpen: boolean
  onClose: () => void
  search: {
    id: string
    name: string
    description?: string | null
    keywords?: string | null
    solicitationNumber?: string | null
    noticeId?: string | null
    naics?: string | null
    classificationCode?: string | null
    agency?: string | null
    organizationCode?: string | null
    setAside?: string | null
    stateOfPerformance?: string | null
    placeOfPerformanceZip?: string | null
    opportunityStatus?: string | null
    postedAfter?: string | null
    rdlfrom?: string | null
    rdlto?: string | null
    procurementType?: string | null
    recipients?: string | null
    emailNotification?: boolean
    subscriptionEnabled?: boolean
    maxResults?: number
  }
  onRun: () => Promise<void>
  onEdit?: () => void
  onDelete?: () => void
}

export default function RunSearchModal({
  isOpen,
  onClose,
  search,
  onRun,
  onEdit,
  onDelete,
}: RunSearchModalProps) {
  const [isRunning, setIsRunning] = useState(false)

  if (!isOpen) return null

  const formatDate = (date: string | null | undefined) => {
    if (!date) return 'Not set'
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  // Collect active parameters
  const activeParams = [
    search.keywords && { label: 'Keywords', value: search.keywords },
    search.solicitationNumber && { label: 'Solicitation #', value: search.solicitationNumber },
    search.noticeId && { label: 'Notice ID', value: search.noticeId },
    search.naics && { label: 'NAICS', value: search.naics },
    search.classificationCode && { label: 'Classification Code', value: search.classificationCode },
    search.agency && { label: 'Agency', value: search.agency },
    search.organizationCode && { label: 'Organization', value: search.organizationCode },
    search.setAside && { label: 'Set-Aside', value: search.setAside },
    search.stateOfPerformance && { label: 'State', value: search.stateOfPerformance },
    search.placeOfPerformanceZip && { label: 'ZIP', value: search.placeOfPerformanceZip },
    search.opportunityStatus && { label: 'Status', value: search.opportunityStatus },
    search.procurementType && { label: 'Procurement Type', value: search.procurementType },
    search.postedAfter && { label: 'Posted After', value: formatDate(search.postedAfter) },
    search.rdlfrom && { label: 'Response Deadline From', value: formatDate(search.rdlfrom) },
    search.rdlto && { label: 'Response Deadline To', value: formatDate(search.rdlto) },
  ].filter(Boolean) as { label: string; value: string }[]

  const handleRun = async () => {
    setIsRunning(true)
    try {
      await onRun()
      onClose()
    } catch (error) {
      console.error('Failed to run search:', error)
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700 bg-gradient-to-r from-blue-600 to-blue-500">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
              <PlayCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Run Search Now</h2>
              <p className="text-blue-100 text-sm mt-0.5">Review and execute your search</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            disabled={isRunning}
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          
          {/* Search Name & Description */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-white mb-2">{search.name}</h3>
            {search.description && (
              <p className="text-slate-400 text-sm">{search.description}</p>
            )}
          </div>

          {/* Alert Box */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="text-blue-300 font-medium mb-1">What's being searched:</p>
              <p className="text-slate-300">
                This search will query SAM.gov with the parameters below and return up to{' '}
                <strong className="text-white">{search.maxResults || 100} results</strong>.
              </p>
            </div>
          </div>

          {/* Email Notification Status */}
          {search.subscriptionEnabled && search.emailNotification && search.recipients && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6 flex items-start gap-3">
              <Mail className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 text-sm">
                <p className="text-green-300 font-medium mb-1">Email notification enabled</p>
                <p className="text-slate-300">
                  Results will be sent to:{' '}
                  <strong className="text-white">{search.recipients}</strong>
                </p>
              </div>
            </div>
          )}

          {/* Search Parameters */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-4 h-4 text-blue-400" />
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider">
                Active Search Parameters
              </h4>
            </div>
            
            {activeParams.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeParams.map((param, index) => (
                  <div 
                    key={index}
                    className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50"
                  >
                    <div className="text-xs text-slate-400 mb-1 font-medium">
                      {param.label}
                    </div>
                    <div className="text-sm text-white font-medium truncate" title={param.value}>
                      {param.value}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-sm italic">No specific filters applied - searching all opportunities</p>
            )}
          </div>

          {/* Date Settings */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-blue-400" />
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider">
                Date Filters
              </h4>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Posted After:</span>
                <span className="text-white font-medium">{formatDate(search.postedAfter)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Response Deadline From:</span>
                <span className="text-white font-medium">{formatDate(search.rdlfrom)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Response Deadline To:</span>
                <span className="text-white font-medium">{formatDate(search.rdlto)}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-700 bg-slate-900/50 flex items-center justify-between gap-3">
          <div className="flex gap-2">
            {onEdit && (
              <button
                onClick={onEdit}
                className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                disabled={isRunning}
              >
                Edit Search
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="px-4 py-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                disabled={isRunning}
              >
                Delete Search
              </button>
            )}
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              disabled={isRunning}
            >
              Cancel
            </button>
            <button
              onClick={handleRun}
              disabled={isRunning}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-medium rounded-lg transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <PlayCircle className="w-4 h-4" />
                  Run Now
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
