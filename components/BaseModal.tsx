// components/BaseModal.tsx
'use client'

import { X } from 'lucide-react'
import { ReactNode } from 'react'

interface BaseModalProps {
  isOpen: boolean
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
  footerActions: ReactNode
  headerColor?: 'cyan' | 'blue' | 'emerald' | 'purple'
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  disableClose?: boolean
}

export function BaseModal({ 
  isOpen, 
  title, 
  subtitle, 
  onClose, 
  children, 
  footerActions,
  headerColor = 'blue',
  maxWidth = '2xl',
  disableClose = false
}: BaseModalProps) {
  if (!isOpen) return null
  
  const gradientClasses = {
    cyan: 'from-cyan-600 to-blue-600',
    blue: 'from-blue-600 to-blue-500',
    emerald: 'from-emerald-600 to-emerald-500',
    purple: 'from-purple-600 to-purple-500'
  }
  
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl'
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className={`w-full ${maxWidthClasses[maxWidth]} rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 shadow-2xl border border-slate-700 overflow-hidden max-h-[90vh] flex flex-col`}>
        {/* Header */}
        <div className={`bg-gradient-to-r ${gradientClasses[headerColor]} px-6 py-5 flex-shrink-0`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                <div className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-white">{title}</h2>
                {subtitle && (
                  <p className="text-sm text-white/80 mt-0.5">{subtitle}</p>
                )}
              </div>
            </div>
            {!disableClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/80 hover:text-white"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {children}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-900/50 border-t border-slate-700 flex-shrink-0">
          {footerActions}
        </div>
      </div>
    </div>
  )
}