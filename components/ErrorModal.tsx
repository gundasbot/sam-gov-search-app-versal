// components/ErrorModal.tsx
'use client'

import { X, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react'

interface ErrorModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  message: string
  details?: string
  showUpgradeButton?: boolean
  showRetryButton?: boolean
  onRetry?: () => void
  onUpgrade?: () => void
}

export default function ErrorModal({
  isOpen,
  onClose,
  title = "Something Went Wrong",
  message,
  details,
  showUpgradeButton = false,
  showRetryButton = false,
  onRetry,
  onUpgrade,
}: ErrorModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="max-w-md w-full mx-4">
        <div className="rounded-2xl border border-red-500/30 bg-gradient-to-br from-slate-900 to-slate-950 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-white">{title}</h2>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5 text-slate-400" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-4">
            <p className="text-slate-300 text-base leading-relaxed">
              {message}
            </p>

            {details && (
              <div className="rounded-lg bg-slate-800/50 border border-slate-700/50 p-4">
                <p className="text-xs font-mono text-slate-400 break-words">
                  {details}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-800 px-6 py-4">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-700 bg-slate-800/50 text-white font-medium hover:bg-slate-800 transition-colors"
            >
              Close
            </button>

            {showRetryButton && onRetry && (
              <button
                onClick={() => {
                  onClose()
                  onRetry()
                }}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </button>
            )}

            {showUpgradeButton && onUpgrade && (
              <button
                onClick={() => {
                  onClose()
                  onUpgrade()
                }}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold hover:from-emerald-600 hover:to-cyan-600 transition-all flex items-center gap-2"
              >
                Upgrade Plan
                <ExternalLink className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
