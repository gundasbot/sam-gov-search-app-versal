// Enhanced Run Alert Now Modal Component
//app

import { PlayCircle, Loader2, X, StopCircle, Mail, FileSpreadsheet, Calendar, Users } from 'lucide-react'

interface RunAlertModalProps {
  isOpen: boolean
  alertName: string
  alertDetails: {
    recipients: string
    frequency: string
    format: string
    keywords?: string
    naics?: string
    agency?: string
    setAside?: string
    lastRunDate?: string
    lastResultCount?: number
  }
  isRunning: boolean
  onRun: () => void
  onCancel: () => void
  onClose: () => void
}

export function RunAlertModal({
  isOpen,
  alertName,
  alertDetails,
  isRunning,
  onRun,
  onCancel,
  onClose
}: RunAlertModalProps) {
  if (!isOpen) return null

  const recipientCount = alertDetails.recipients.split(',').filter(e => e.trim()).length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 shadow-2xl border border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-600 to-blue-600 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/20">
                <PlayCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Run Alert Now</h3>
                <p className="text-sm text-cyan-100 mt-0.5">Execute and send results immediately</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Alert Name */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/10">
                <FileSpreadsheet className="h-5 w-5 text-cyan-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-400 mb-1">Alert Name</p>
                <p className="text-lg font-bold text-white">{alertName}</p>
              </div>
            </div>
          </div>

          {/* Search Criteria Preview */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
            <p className="text-sm font-semibold text-slate-400 mb-3">Search Criteria</p>
            <div className="grid grid-cols-2 gap-3">
              {alertDetails.keywords && (
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <p className="text-sm text-slate-300">
                    <span className="text-slate-500">Keywords:</span> {alertDetails.keywords}
                  </p>
                </div>
              )}
              {alertDetails.naics && (
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  <p className="text-sm text-slate-300">
                    <span className="text-slate-500">NAICS:</span> {alertDetails.naics}
                  </p>
                </div>
              )}
              {alertDetails.agency && (
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  <p className="text-sm text-slate-300">
                    <span className="text-slate-500">Agency:</span> {alertDetails.agency}
                  </p>
                </div>
              )}
              {alertDetails.setAside && (
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                  <p className="text-sm text-slate-300">
                    <span className="text-slate-500">Set-Aside:</span> {alertDetails.setAside}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Delivery Details */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold text-slate-400 mb-3">Delivery Details</p>
            
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Mail className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-500">Recipients</p>
                <p className="text-sm font-semibold text-white">{recipientCount} email{recipientCount !== 1 ? 's' : ''}</p>
                <p className="text-xs text-slate-400 mt-0.5 truncate">{alertDetails.recipients}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <FileSpreadsheet className="h-4 w-4 text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-500">Format</p>
                <p className="text-sm font-semibold text-white">{alertDetails.format}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Calendar className="h-4 w-4 text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-slate-500">Frequency</p>
                <p className="text-sm font-semibold text-white">{alertDetails.frequency}</p>
              </div>
            </div>
          </div>

          {/* Last Run Info */}
          {alertDetails.lastRunDate && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3">
              <p className="text-xs font-semibold text-blue-300 mb-1">Last Run</p>
              <p className="text-sm text-blue-200">
                {alertDetails.lastRunDate} • {alertDetails.lastResultCount || 0} results
              </p>
            </div>
          )}

          {/* Running Status */}
          {isRunning && (
            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-cyan-300">Executing Alert...</p>
                  <p className="text-xs text-cyan-200 mt-0.5">Searching SAM.gov and preparing results</p>
                </div>
              </div>
            </div>
          )}

          {/* Warning */}
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-3">
            <p className="text-xs text-orange-200">
              <strong className="text-orange-300">Note:</strong> This will execute the alert immediately and send results to all configured recipients.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-900/50 border-t border-slate-700 flex items-center justify-end gap-3">
          {isRunning ? (
            <button
              onClick={onCancel}
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold flex items-center gap-2 transition-all"
            >
              <StopCircle className="w-4 h-4" />
              <span>Stop Run</span>
            </button>
          ) : (
            <>
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onRun}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold flex items-center gap-2 shadow-lg shadow-cyan-500/30 transition-all"
              >
                <PlayCircle className="w-4 h-4" />
                <span>Run Now</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
