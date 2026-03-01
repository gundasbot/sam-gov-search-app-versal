// components/TimePickerField.tsx
'use client'

import { Clock } from 'lucide-react'

interface TimePickerFieldProps {
  value: string // Format: "HH:MM" (24-hour)
  onChange: (time: string) => void
  label?: string
  intervals?: number // Minutes between options (default: 15)
  required?: boolean
  error?: string
}

export default function TimePickerField({ 
  value, 
  onChange, 
  label = "Delivery Time",
  intervals = 15,
  required = false,
  error
}: TimePickerFieldProps) {
  // Generate time options
  const timeOptions: string[] = []
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += intervals) {
      const hourStr = hour.toString().padStart(2, '0')
      const minuteStr = minute.toString().padStart(2, '0')
      timeOptions.push(`${hourStr}:${minuteStr}`)
    }
  }
  
  // Format time for display (12-hour format)
  const formatDisplayTime = (time24: string) => {
    if (!time24) return 'Select delivery time'
    const [hour, minute] = time24.split(':').map(Number)
    const period = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    return `${hour12}:${minute.toString().padStart(2, '0')} ${period}`
  }
  
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-base font-medium text-orange-400 flex items-center gap-1">
          {label}
          {required && <span className="text-white">*</span>}
        </label>
      )}
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none z-10">
          <Clock className="h-5 w-5 text-gray-400" />
        </div>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className={`w-full pl-11 pr-10 py-3 text-base font-semibold rounded-lg bg-white border-2 ${
            error ? 'border-red-500' : 'border-gray-300'
          } text-gray-900 hover:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-600 transition-colors appearance-none cursor-pointer`}
        >
          <option value="">Select delivery time</option>
          {timeOptions.map(time => (
            <option key={time} value={time}>
              {formatDisplayTime(time)}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {error ? (
        <p className="text-sm font-semibold text-red-500">{error}</p>
      ) : (
        <p className="text-xs text-gray-400 italic">
          Notifications will be sent at this time in your local timezone
        </p>
      )}
    </div>
  )
}
