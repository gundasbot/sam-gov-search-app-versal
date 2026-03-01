// components/SuccessToast.tsx
'use client'
import React, { useEffect } from 'react'
import { Check, X, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface SuccessToastProps {
  isOpen: boolean
  onClose: () => void
  message: string
  description?: string
  showViewLink?: boolean
  duration?: number // milliseconds
}

export default function SuccessToast({
  isOpen,
  onClose,
  message,
  description,
  showViewLink = true,
  duration = 5000
}: SuccessToastProps) {
  const router = useRouter()

  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [isOpen, duration, onClose])

  if (!isOpen) return null

  const handleViewAlerts = () => {
    onClose()
    router.push('/alerts')
  }

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
      <div className="bg-slate-900 border-2 border-emerald-500 rounded-xl shadow-2xl p-4 min-w-[320px] max-w-md">
        <div className="flex items-start gap-3">
          {/* Success Icon */}
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
            <Check className="h-5 w-5 text-white" strokeWidth={3} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-sm">
              {message}
            </h3>
            {description && (
              <p className="text-slate-400 text-xs mt-1">
                {description}
              </p>
            )}
            {showViewLink && (
              <button
                onClick={handleViewAlerts}
                className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 text-xs font-medium mt-2 transition-colors"
              >
                View in Alert Manager
                <ExternalLink className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
