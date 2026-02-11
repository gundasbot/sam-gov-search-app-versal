// components/buttons/ModalButton.tsx
'use client'

import { Loader2 } from 'lucide-react'
import { ReactNode } from 'react'

interface ModalButtonProps {
  onClick: () => void
  disabled?: boolean
  loading?: boolean
  variant?: 'primary' | 'secondary' | 'danger' | 'success'
  children: ReactNode
  icon?: ReactNode
  className?: string
}

export function ModalButton({ 
  onClick, 
  disabled = false, 
  loading = false, 
  variant = 'primary', 
  children, 
  icon,
  className = ''
}: ModalButtonProps) {
  const baseClasses = 'px-5 py-2.5 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
  
  const variantClasses = {
    primary: 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30',
    secondary: 'bg-slate-700 hover:bg-slate-600 text-slate-200',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    success: 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-lg shadow-emerald-500/20'
  }
  
  const combinedClasses = `${baseClasses} ${variantClasses[variant]} ${className}`
  
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={combinedClasses}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : icon}
      <span>{children}</span>
    </button>
  )
}