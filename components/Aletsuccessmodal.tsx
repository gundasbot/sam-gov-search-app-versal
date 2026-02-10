// Enhanced Success Modal - Centered with detailed summary
// Add this component to show after successful alert execution

import { CheckCircle, X, Mail, FileSpreadsheet, TrendingUp, Users, Clock, Download } from 'lucide-react'

interface SuccessModalProps {
  isOpen: boolean
  alertName: string
  resultCount: number
  recipients: string
  format: string
  searchCriteria: {
    keywords?: string
    naics?: string
    agency?: string
    setAside?: string
  }
  onClose: () => void
  onViewResults?: () => void
}

export function AlertSuccessModal({
  isOpen,
  alertName,
  resultCount,
  recipients,
  format,
  searchCriteria,
  onClose,
  onViewResults
}: SuccessModalProps) {
  if (!isOpen) return null

  const recipientList = recipients.split(',').map(e => e.trim()).filter(Boolean)
  const recipientCount = recipientList.length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 shadow-2xl border border-emerald-500/30 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Success Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-green-600 px-6 py-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-white/20 shadow-lg">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">Alert Executed Successfully!</h3>
                <p className="text-sm text-emerald-100">Results have been prepared and sent to recipients</p>
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
        <div className="p-6 space-y-5">
          {/* Alert Name */}
          <div className="text-center pb-4 border-b border-slate-700">
            <p className="text-sm text-slate-400 mb-1">Alert Name</p>
            <p className="text-xl font-bold text-white">"{alertName}"</p>
          </div>

          {/* Results Summary - Prominent Display */}
          <div className="bg-gradient-to-br from-emerald-900/30 to-green-900/30 border-2 border-emerald-500/40 rounded-2xl p-6">
            <div className="grid grid-cols-2 gap-6">
              {/* Results Count */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center p-3 rounded-xl bg-emerald-500/20 mb-3">
                  <TrendingUp className="h-6 w-6 text-emerald-400" />
                </div>
                <p className="text-sm text-slate-400 mb-1">Opportunities Found</p>
                <p className="text-4xl font-bold text-emerald-400">{resultCount}</p>
              </div>

              {/* Recipients Count */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center p-3 rounded-xl bg-blue-500/20 mb-3">
                  <Users className="h-6 w-6 text-blue-400" />
                </div>
                <p className="text-sm text-slate-400 mb-1">Recipients</p>
                <p className="text-4xl font-bold text-blue-400">{recipientCount}</p>
              </div>
            </div>
          </div>

          {/* Delivery Details */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <Mail className="h-4 w-4 text-emerald-400" />
              Email Details
            </p>
            
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <div className="w-24 text-xs text-slate-500 pt-1">Sent to:</div>
                <div className="flex-1">
                  <div className="flex flex-wrap gap-1.5">
                    {recipientList.map((email, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-300"
                      >
                        {email}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-24 text-xs text-slate-500">Format:</div>
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-3.5 w-3.5 text-blue-400" />
                  <span className="text-sm font-semibold text-white">{format}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-24 text-xs text-slate-500">Sent at:</div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-purple-400" />
                  <span className="text-sm font-semibold text-white">
                    {new Date().toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Search Criteria Used */}
          {(searchCriteria.keywords || searchCriteria.naics || searchCriteria.agency || searchCriteria.setAside) && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
              <p className="text-sm font-semibold text-slate-300 mb-3">Search Criteria Used</p>
              <div className="grid grid-cols-2 gap-2">
                {searchCriteria.keywords && (
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <p className="text-xs text-slate-400">
                      Keywords: <span className="text-slate-300 font-medium">{searchCriteria.keywords}</span>
                    </p>
                  </div>
                )}
                {searchCriteria.naics && (
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    <p className="text-xs text-slate-400">
                      NAICS: <span className="text-slate-300 font-medium">{searchCriteria.naics}</span>
                    </p>
                  </div>
                )}
                {searchCriteria.agency && (
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    <p className="text-xs text-slate-400">
                      Agency: <span className="text-slate-300 font-medium">{searchCriteria.agency}</span>
                    </p>
                  </div>
                )}
                {searchCriteria.setAside && (
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                    <p className="text-xs text-slate-400">
                      Set-Aside: <span className="text-slate-300 font-medium">{searchCriteria.setAside}</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Success Message */}
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
            <p className="text-sm text-emerald-200 text-center">
              ✓ All {recipientCount} recipient{recipientCount !== 1 ? 's' : ''} will receive an email with {resultCount} opportunity{resultCount !== 1 ? 'ies' : ''} in {format} format
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-900/50 border-t border-slate-700 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium transition-colors"
          >
            Close
          </button>
          
          <div className="flex gap-3">
            {onViewResults && (
              <button
                onClick={onViewResults}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-2 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>View Results</span>
              </button>
            )}
            
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-semibold flex items-center gap-2 shadow-lg shadow-emerald-500/30 transition-all"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Done</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}