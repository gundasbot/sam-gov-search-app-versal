// components/AlertSubscriptionCard.tsx
'use client'
import React, { useState } from 'react'
import {
  Bell,
  ChevronDown,
  ChevronUp,
  Play,
  Pause,
  Edit,
  Trash2,
  Download,
  Mail,
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'

interface SearchRun {
  id: string
  createdAt: string
  status: 'SUCCESS' | 'ERROR'
  resultCount: number
  emailSent: boolean
  errorMessage?: string | null
}

interface AlertSubscription {
  id: string
  name: string
  description?: string | null
  frequency: string | null
  recipients?: string | null
  subscriptionEnabled: boolean
  lastRunAt?: string | null
  lastResultCount?: number | null
  exportFormat: string
  runs: SearchRun[]
  _count: {
    runs: number
    exports: number
  }
}

interface AlertSubscriptionCardProps {
  alert: AlertSubscription
  onRun: (id: string) => void
  onPause: (id: string) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onExport: (runId: string, format: string) => void
}

export default function AlertSubscriptionCard({
  alert,
  onRun,
  onPause,
  onEdit,
  onDelete,
  onExport,
}: AlertSubscriptionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isLoadingRuns, setIsLoadingRuns] = useState(false)
  const [detailedRuns, setDetailedRuns] = useState<SearchRun[]>(alert.runs || [])
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null)

  const loadDetailedRuns = async () => {
    if (detailedRuns.length > 0 && isExpanded) {
      // Already loaded, just toggle
      setIsExpanded(false)
      return
    }

    setIsLoadingRuns(true)
    try {
      const response = await fetch(`/api/saved-searches/${alert.id}/runs?limit=10`)
      if (response.ok) {
        const data = await response.json()
        setDetailedRuns(data.runs || [])
        setIsExpanded(true)
      }
    } catch (error) {
      console.error('Failed to load runs:', error)
    } finally {
      setIsLoadingRuns(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const getFrequencyBadge = (frequency: string | null) => {
    if (!frequency) return null
    
    const colors: Record<string, string> = {
      DAILY: 'bg-emerald-500/20 text-emerald-400',
      WEEKLY: 'bg-blue-500/20 text-blue-400',
      MONTHLY: 'bg-purple-500/20 text-purple-400',
      AS_CHANGES: 'bg-amber-500/20 text-amber-400',
      MANUAL: 'bg-slate-500/20 text-slate-400',
    }

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[frequency] || colors.MANUAL}`}>
        {frequency.replace('_', ' ')}
      </span>
    )
  }

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
      {/* Main Card Header */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className={`p-2 rounded-lg ${alert.subscriptionEnabled ? 'bg-emerald-500/20' : 'bg-slate-700/50'}`}>
              <Bell className={`h-5 w-5 ${alert.subscriptionEnabled ? 'text-emerald-400' : 'text-slate-400'}`} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold text-white truncate">
                  {alert.name}
                </h3>
                {getFrequencyBadge(alert.frequency)}
              </div>
              
              {alert.description && (
                <p className="text-sm text-slate-400 mb-2 line-clamp-1">
                  {alert.description}
                </p>
              )}

              <div className="flex items-center gap-4 text-xs text-slate-400">
                <div className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  <span>{alert.recipients?.split(',').length || 0} recipient(s)</span>
                </div>
                <div className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  <span>{alert._count.runs} runs</span>
                </div>
                {alert.lastRunAt && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>Last: {formatDate(alert.lastRunAt)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onRun(alert.id)}
              className="p-2 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors"
              title="Run now"
            >
              <Play className="h-4 w-4" />
            </button>
            
            <button
              onClick={() => onPause(alert.id)}
              className={`p-2 rounded-lg transition-colors ${
                alert.subscriptionEnabled
                  ? 'hover:bg-amber-500/20 text-amber-400'
                  : 'hover:bg-emerald-500/20 text-emerald-400'
              }`}
              title={alert.subscriptionEnabled ? 'Pause' : 'Resume'}
            >
              <Pause className="h-4 w-4" />
            </button>

            <button
              onClick={() => onEdit(alert.id)}
              className="p-2 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors"
              title="Edit"
            >
              <Edit className="h-4 w-4" />
            </button>

            <button
              onClick={() => onDelete(alert.id)}
              className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>

            <button
              onClick={loadDetailedRuns}
              disabled={isLoadingRuns}
              className="p-2 hover:bg-slate-700 text-slate-400 rounded-lg transition-colors"
              title={isExpanded ? 'Hide history' : 'Show history'}
            >
              {isLoadingRuns ? (
                <Clock className="h-4 w-4 animate-spin" />
              ) : isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Run History */}
      {isExpanded && (
        <div className="border-t border-slate-700 bg-slate-900/50">
          <div className="p-4">
            <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Last 10 Runs
            </h4>

            {detailedRuns.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">
                No runs yet. Click "Run now" to execute this search.
              </p>
            ) : (
              <div className="space-y-2">
                {detailedRuns.map((run) => (
                  <div
                    key={run.id}
                    className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {run.status === 'SUCCESS' ? (
                        <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm text-white">
                            {formatDate(run.createdAt)}
                          </span>
                          {run.emailSent && (
                            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded">
                              Emailed
                            </span>
                          )}
                        </div>
                        
                        {run.status === 'SUCCESS' ? (
                          <p className="text-xs text-slate-400">
                            {run.resultCount} result{run.resultCount !== 1 ? 's' : ''} found
                          </p>
                        ) : (
                          <p className="text-xs text-red-400 truncate">
                            {run.errorMessage || 'Unknown error'}
                          </p>
                        )}
                      </div>
                    </div>

                    {run.status === 'SUCCESS' && run.resultCount > 0 && (
                      <div className="relative">
                        <button
                          onClick={() => setExpandedRunId(expandedRunId === run.id ? null : run.id)}
                          className="p-1.5 hover:bg-emerald-500/20 text-emerald-400 rounded transition-colors flex items-center gap-1"
                          title="Export"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <ChevronDown className={`h-3 w-3 transition-transform ${expandedRunId === run.id ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {expandedRunId === run.id && (
                          <div className="absolute right-0 mt-1 w-44 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-10">
                            <div className="py-1">
                              <button
                                onClick={() => {
                                  onExport(run.id, 'XLSB')
                                  setExpandedRunId(null)
                                }}
                                className="w-full px-3 py-2 text-left text-sm text-white hover:bg-slate-700 flex items-center justify-between"
                              >
                                <span>Excel Binary</span>
                                <span className="text-xs text-emerald-400">Default</span>
                              </button>
                              <button
                                onClick={() => {
                                  onExport(run.id, 'EXCEL')
                                  setExpandedRunId(null)
                                }}
                                className="w-full px-3 py-2 text-left text-sm text-white hover:bg-slate-700"
                              >
                                Excel Workbook
                              </button>
                              <button
                                onClick={() => {
                                  onExport(run.id, 'CSV')
                                  setExpandedRunId(null)
                                }}
                                className="w-full px-3 py-2 text-left text-sm text-white hover:bg-slate-700"
                              >
                                CSV
                              </button>
                              <button
                                onClick={() => {
                                  onExport(run.id, 'JSON')
                                  setExpandedRunId(null)
                                }}
                                className="w-full px-3 py-2 text-left text-sm text-white hover:bg-slate-700"
                              >
                                JSON
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer Stats */}
      <div className="border-t border-slate-700 px-4 py-2 bg-slate-900/30">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">
            Format: <span className="text-white">{alert.exportFormat}</span>
          </span>
          {alert.lastResultCount !== null && (
            <span className="text-slate-400">
              Last results: <span className="text-white">{alert.lastResultCount}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
