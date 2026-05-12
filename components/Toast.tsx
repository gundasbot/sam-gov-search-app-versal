// components/Toast.tsx
'use client'

import { CheckCircle, X, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { useEffect } from 'react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastProps {
  message: string
  type?: ToastType
  onClose: () => void
  duration?: number
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
}

export default function Toast({ 
  message, 
  type = 'success', 
  onClose, 
  duration = 0,
  position = 'top-right'
}: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, onClose])
  
  const styles = {
    success: {
      bg: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
      icon: <CheckCircle className="h-6 w-6 text-white" />,
      border: 'border-emerald-700'
    },
    error: {
      bg: 'bg-gradient-to-r from-red-500 to-red-600',
      icon: <AlertCircle className="h-6 w-6 text-white" />,
      border: 'border-red-700'
    },
    info: {
      bg: 'bg-gradient-to-r from-blue-500 to-blue-600',
      icon: <Info className="h-6 w-6 text-white" />,
      border: 'border-blue-700'
    },
    warning: {
      bg: 'bg-gradient-to-r from-amber-500 to-amber-600',
      icon: <AlertTriangle className="h-6 w-6 text-white" />,
      border: 'border-amber-700'
    }
  }
  
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  }
  
  const style = styles[type]
  
  return (
    <div 
      className={`fixed z-[9999] max-w-md ${style.bg} ${style.border} border-2 rounded-lg shadow-2xl transform transition-all duration-300 ${positionClasses[position]}`}
      style={{
        animation: 'slideInRight 0.3s ease-out'
      }}
    >
      <div className="p-4 flex items-start gap-3">
        <div className="flex-shrink-0">
          {style.icon}
        </div>
        <span className="flex-1 font-semibold text-base leading-relaxed" style={{ color: '#fff' }}>
          {message}
        </span>
        <button
          onClick={onClose}
          className="flex-shrink-0 text-white hover:text-gray-200 transition-colors"
          aria-label="Close notification"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      
      {duration > 0 && (
        <div className="h-1 bg-white bg-opacity-30 overflow-hidden">
          <div 
            className="h-full bg-white"
            style={{
              animation: `shrink ${duration}ms linear`
            }}
          />
        </div>
      )}
      
      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  )
}

// Hook for managing toasts
import { useState, useCallback } from 'react'

interface ToastOptions {
  duration?: number
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
}

export function useToast() {
  const [toast, setToast] = useState<{
    message: string, 
    type: ToastType
    options?: ToastOptions
  } | null>(null)
  
  const showToast = useCallback((
    message: string, 
    type: ToastType = 'success',
    options?: ToastOptions
  ) => {
    setToast({ message, type, options })
  }, [])
  
  const hideToast = useCallback(() => {
    setToast(null)
  }, [])
  
  const ToastContainer = useCallback(() => {
    if (!toast) return null
    
    return (
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={hideToast}
        duration={toast.options?.duration || 0}
        position={toast.options?.position || 'top-right'}
      />
    )
  }, [toast, hideToast])
  
  return {
    showToast,
    hideToast,
    ToastContainer
  }
}
