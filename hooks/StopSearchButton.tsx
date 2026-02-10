// components/StopSearchButton.tsx
'use client'

import { StopCircle } from 'lucide-react'

interface StopSearchButtonProps {
  onClick: () => void
  duration?: number // search duration in seconds
  className?: string
  variant?: 'inline' | 'floating' | 'modal'
}

export function StopSearchButton({
  onClick,
  duration = 0,
  className = '',
  variant = 'inline',
}: StopSearchButtonProps) {
  if (variant === 'floating') {
    return (
      <button
        onClick={onClick}
        className={`
          fixed bottom-8 right-8 z-50 
          flex items-center gap-3 px-8 py-4 
          rounded-2xl 
          bg-gradient-to-r from-red-600 to-red-700 
          hover:from-red-700 hover:to-red-800 
          text-white 
          font-bold 
          shadow-2xl shadow-red-500/50 
          animate-pulse 
          border-2 border-red-400
          transition-all
          ${className}
        `}
        type="button"
        aria-label="Stop search"
      >
        <StopCircle className="w-6 h-6" />
        <div className="flex flex-col items-start">
          <span className="text-lg">STOP SEARCH</span>
          {duration > 0 && (
            <span className="text-xs font-normal opacity-90">
              Running for {duration}s
            </span>
          )}
        </div>
      </button>
    )
  }

  if (variant === 'modal') {
    return (
      <button
        onClick={onClick}
        className={`
          w-full 
          flex items-center justify-center gap-3 
          px-6 py-3 
          rounded-xl 
          bg-gradient-to-r from-red-600 to-red-700 
          hover:from-red-700 hover:to-red-800 
          text-white 
          font-bold 
          shadow-lg shadow-red-500/50
          transition-all
          ${className}
        `}
        type="button"
        aria-label="Stop search"
      >
        <StopCircle className="w-5 h-5" />
        <span>STOP SEARCH</span>
      </button>
    )
  }

  // Default: inline variant
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-3 
        px-6 py-3 
        rounded-xl 
        bg-gradient-to-r from-red-600 to-red-700 
        hover:from-red-700 hover:to-red-800 
        text-white 
        font-bold 
        shadow-lg shadow-red-500/50 
        animate-pulse
        transition-all
        ${className}
      `}
      type="button"
      aria-label="Stop search"
    >
      <StopCircle className="w-5 h-5" />
      <span>STOP SEARCH</span>
      {duration > 0 && (
        <span className="text-xs font-normal opacity-90">
          ({duration}s)
        </span>
      )}
    </button>
  )
}

// Modal overlay version for prominent display
export function StopSearchModal({
  onStop,
  duration = 0,
  title = 'Searching SAM.gov',
  message = 'Querying federal opportunities database...',
}: {
  onStop: () => void
  duration?: number
  title?: string
  message?: string
}) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-slate-800 rounded-2xl p-8 shadow-2xl border border-slate-700 max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">{title}</h3>
          <span className="text-sm text-slate-400">
            {duration > 0 && `${duration}s`}
          </span>
        </div>

        {/* Progress Messages */}
        <div className="space-y-2 mb-6">
          <p className="text-sm text-slate-300">🔍 {message}</p>
          <p className="text-xs text-slate-400">
            This may take 10-30 seconds depending on your search criteria
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 animate-pulse"
              style={{ width: '100%' }}
            />
          </div>
        </div>

        {/* Stop Button */}
        <StopSearchButton onClick={onStop} variant="modal" duration={duration} />

        {/* ESC hint */}
        <p className="text-xs text-slate-500 text-center mt-4">
          Press <kbd className="px-2 py-1 bg-slate-700 rounded">ESC</kbd> to cancel
        </p>
      </div>
    </div>
  )
}