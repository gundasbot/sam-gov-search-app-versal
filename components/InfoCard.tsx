// components/InfoCard.tsx
'use client'

import { ReactNode } from 'react'

interface InfoCardProps {
  icon: ReactNode
  label: string
  value: string | number
  secondaryValue?: string
  color?: 'emerald' | 'blue' | 'purple' | 'cyan' | 'orange'
  compact?: boolean
  truncate?: boolean
}

export function InfoCard({ 
  icon, 
  label, 
  value, 
  secondaryValue, 
  color = 'blue',
  compact = false,
  truncate = false
}: InfoCardProps) {
  const colorClasses = {
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20'
  }
  
  const containerClasses = compact 
    ? 'flex items-center gap-2' 
    : 'flex items-center gap-3'
  
  const iconContainerClasses = compact 
    ? `p-1.5 rounded-md ${colorClasses[color]} border`
    : `p-2 rounded-lg ${colorClasses[color]} border`
  
  return (
    <div className={containerClasses}>
      <div className={iconContainerClasses}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p className={`text-sm font-semibold text-white ${truncate ? 'truncate' : ''}`} title={String(value)}>
          {value}
        </p>
        {secondaryValue && (
          <p className={`text-xs text-slate-400 mt-0.5 ${truncate ? 'truncate' : ''}`} title={secondaryValue}>
            {secondaryValue}
          </p>
        )}
      </div>
    </div>
  )
}