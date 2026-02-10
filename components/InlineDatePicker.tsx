// components/InlineDatePicker.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { Calendar, AlertCircle } from 'lucide-react'

interface InlineDatePickerProps {
  startDate: string
  endDate: string
  onStartDateChange: (date: string) => void
  onEndDateChange: (date: string) => void
}

export default function InlineDatePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange
}: InlineDatePickerProps) {
  const [error, setError] = useState<string | null>(null)
  
  // Format date as YYYY-MM-DD
  const formatDate = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Get today's date
  const today = formatDate(new Date())

  // Validate date range (max 364 days)
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      
      if (diffDays > 364) {
        setError(`Date range cannot exceed 364 days (SAM.gov API limit). Current range: ${diffDays} days.`)
      } else if (diffDays < 0) {
        setError('Start date must be before end date.')
      } else {
        setError(null)
      }
    }
  }, [startDate, endDate])

  // Quick date range presets with validation
  const setQuickRange = (daysBack: number) => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - daysBack)
    
    onEndDateChange(formatDate(end))
    onStartDateChange(formatDate(start))
    setError(null)
  }

  const setToday = () => {
    onStartDateChange(today)
    onEndDateChange(today)
    setError(null)
  }

  const clearDates = () => {
    onStartDateChange('')
    onEndDateChange(today)
    setError(null)
  }

  const quickOptions = [
    { label: 'Today', days: 0, onClick: setToday },
    { label: '1 Month', days: 30, onClick: () => setQuickRange(30) },
    { label: '3 Months', days: 90, onClick: () => setQuickRange(90) },
    { label: '6 Months', days: 180, onClick: () => setQuickRange(180) },
    { label: '1 Year', days: 364, onClick: () => setQuickRange(364) }, // Max allowed by SAM.gov
    { label: 'Clear', days: 0, onClick: clearDates },
  ]

  // Calculate current range
  const calculateDays = () => {
    if (!startDate || !endDate) return null
    const start = new Date(startDate)
    const end = new Date(endDate)
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  }

  const dayCount = calculateDays()

  return (
    <div className="space-y-3">
      {/* Quick Selection Buttons */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-slate-400 font-medium flex items-center mr-1">
          Quick:
        </span>
        {quickOptions.map((option) => (
          <button
            key={option.label}
            type="button"
            onClick={option.onClick}
            className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:border-emerald-500 hover:text-emerald-400 transition-all"
            title={option.days > 0 ? `Last ${option.days} days` : option.label}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Date Inputs Row */}
      <div className="grid grid-cols-2 gap-3">
        {/* Start Date */}
        <div className="relative">
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              onStartDateChange(e.target.value)
            }}
            max={endDate || today}
            placeholder="Start date"
            className={`w-full px-4 py-3 pl-10 rounded-lg bg-slate-900 border text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 transition-colors ${
              error 
                ? 'border-red-500/50 focus:ring-red-500 focus:border-red-500' 
                : 'border-slate-800 focus:ring-emerald-500 focus:border-transparent'
            }`}
          />
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
        </div>

        {/* End Date */}
        <div className="relative">
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              onEndDateChange(e.target.value)
            }}
            min={startDate}
            max={today}
            placeholder="End date"
            className={`w-full px-4 py-3 pl-10 rounded-lg bg-slate-900 border text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 transition-colors ${
              error 
                ? 'border-red-500/50 focus:ring-red-500 focus:border-red-500' 
                : 'border-slate-800 focus:ring-emerald-500 focus:border-transparent'
            }`}
          />
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
          <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="text-sm text-red-400 font-medium mb-1">Date Range Error</div>
            <div className="text-xs text-red-300">{error}</div>
            <button
              onClick={() => setQuickRange(364)}
              className="mt-2 text-xs text-red-400 hover:text-red-300 underline"
            >
              Set to maximum allowed (364 days)
            </button>
          </div>
        </div>
      )}

      {/* Date Range Display - Only show if valid */}
      {!error && startDate && endDate && dayCount !== null && (
        <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-900/50 border border-slate-800">
          <div className="text-slate-400">
            <span className="text-slate-500">Range:</span>{' '}
            {new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            {' → '}
            {new Date(endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-300 font-medium">{dayCount} days</span>
            {dayCount > 300 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-medium">
                Near limit
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}