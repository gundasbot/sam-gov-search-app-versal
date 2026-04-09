// components/CalendlyButton.tsx
'use client'

import { Calendar } from 'lucide-react'

interface CalendlyButtonProps {
  children?: React.ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export default function CalendlyButton({ 
  children = 'Schedule Free Assessment', 
  className = '',
  size = 'xl'
}: CalendlyButtonProps) {
  const calendlyUrl = process.env.NEXT_PUBLIC_CALENDLY_URL || '/support#book'
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
    xl: 'px-10 py-5 text-xl'
  }

  const baseClasses = "inline-flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-black shadow-2xl hover:shadow-emerald-500/50 hover:scale-105 transition-all"

  return (
    <a
      href={calendlyUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`${baseClasses} ${sizeClasses[size]} ${className}`}
    >
      <Calendar className={size === 'xl' ? 'w-7 h-7' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'} />
      {children}
    </a>
  )
}
