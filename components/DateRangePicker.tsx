// components/DateRangePicker.tsx
'use client'

import React, { useState } from 'react'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'

interface DateRangePickerProps {
  startDate: string
  endDate: string
  onStartDateChange: (date: string) => void
  onEndDateChange: (date: string) => void
  startLabel?: string
  endLabel?: string
  maxDate?: string // Max selectable date (defaults to today)
}

export default function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  startLabel = "Posted After",
  endLabel = "Posted Before",
  maxDate
}: DateRangePickerProps) {
  const [showStartCalendar, setShowStartCalendar] = useState(false)
  const [showEndCalendar, setShowEndCalendar] = useState(false)

  // Format date as YYYY-MM-DD
  const formatDate = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Get today's date
  const today = formatDate(new Date())
  const effectiveMaxDate = maxDate || today

  // Quick date range presets
  const setQuickRange = (monthsBack: number) => {
    const end = new Date()
    const start = new Date()
    start.setMonth(start.getMonth() - monthsBack)
    
    onEndDateChange(formatDate(end))
    onStartDateChange(formatDate(start))
  }

  const setToday = () => {
    onStartDateChange(today)
    onEndDateChange(today)
  }

  const quickOptions = [
    { label: 'Today', onClick: setToday },
    { label: 'Past Month', onClick: () => setQuickRange(1) },
    { label: 'Past 3 Months', onClick: () => setQuickRange(3) },
    { label: 'Past 6 Months', onClick: () => setQuickRange(6) },
    { label: 'Past 9 Months', onClick: () => setQuickRange(9) },
    { label: 'Past Year', onClick: () => setQuickRange(12) },
  ]

  return (
    <div className="space-y-4">
      {/* Quick Selection Buttons */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-slate-400 font-medium flex items-center mr-2">
          Quick Select:
        </span>
        {quickOptions.map((option) => (
          <button
            key={option.label}
            type="button"
            onClick={option.onClick}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:border-slate-600 hover:text-white transition-all"
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Date Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Start Date */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            {startLabel} <span className="text-slate-500 font-normal text-xs">(optional)</span>
          </label>
          <div className="relative">
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              max={endDate || effectiveMaxDate}
              className="w-full px-4 py-3 pl-11 rounded-lg bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
            />
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
          </div>
        </div>

        {/* End Date */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            {endLabel}
          </label>
          <div className="relative">
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              min={startDate}
              max={effectiveMaxDate}
              className="w-full px-4 py-3 pl-11 rounded-lg bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
            />
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Date Range Display */}
      {startDate && endDate && (
        <div className="text-xs text-slate-400 bg-slate-900/50 rounded-lg px-3 py-2 border border-slate-800">
          <span className="font-medium text-slate-300">Date Range:</span>{' '}
          {new Date(startDate).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          })}{' '}
          to{' '}
          {new Date(endDate).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          })}
          {' '}
          ({Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))} days)
        </div>
      )}
    </div>
  )
}