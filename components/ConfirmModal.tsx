// components/ConfirmModal.tsx
'use client'

import { X, AlertTriangle, Trash2, CheckCircle, Info } from 'lucide-react'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'danger' | 'warning' | 'info' | 'success'
  isLoading?: boolean
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'info',
  isLoading = false,
}: ConfirmModalProps) {
  if (!isOpen) return null

  const typeConfig = {
    danger: {
      icon: Trash2,
      iconColor: 'text-red-400',
      iconBg: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
      buttonBg: 'bg-red-600 hover:bg-red-700',
    },
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-yellow-400',
      iconBg: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/30',
      buttonBg: 'bg-yellow-600 hover:bg-yellow-700',
    },
    info: {
      icon: Info,
      iconColor: 'text-blue-400',
      iconBg: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
      buttonBg: 'bg-blue-600 hover:bg-blue-700',
    },
    success: {
      icon: CheckCircle,
      iconColor: 'text-green-400',
      iconBg: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
      buttonBg: 'bg-green-600 hover:bg-green-700',
    },
  }

  const config = typeConfig[type]
  const Icon = config.icon

  return (
    // CENTERED with backdrop
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 hover:bg-slate-700 rounded-lg transition-colors z-10"
          disabled={isLoading}
        >
          <X className="w-4 h-4 text-slate-400" />
        </button>

        {/* Icon */}
        <div className="px-6 pt-6 pb-4">
          <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${config.iconBg} ${config.borderColor} border`}>
            <Icon className={`w-6 h-6 ${config.iconColor}`} />
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6 space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">{message}</p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-1 px-4 py-2.5 ${config.buttonBg} text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isLoading ? 'Processing...' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
