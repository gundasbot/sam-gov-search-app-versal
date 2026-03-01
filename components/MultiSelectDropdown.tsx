//app/components/MultiSelectDropdown.tsx

'use client'

import React, { useState, useRef, useEffect } from 'react'
import { X, ChevronDown, Check } from 'lucide-react'

export interface MultiSelectOption {
  code: string
  label: string
  farReference?: string
}

interface MultiSelectDropdownProps {
  options: MultiSelectOption[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  maxSelections?: number
  label?: string
  helpText?: string
  className?: string
}

/**
 * Reusable multi-select dropdown component
 * Allows users to select multiple items from a list
 * Used for Set-Asides, States, Agencies, NAICS codes, etc.
 */
export function MultiSelectDropdown({
  options,
  selected,
  onChange,
  placeholder = 'Select items...',
  maxSelections = 10,
  label,
  helpText,
  className = '',
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Filter options based on search
  const filteredOptions = options.filter(opt => {
    if (!opt.code) return false // Skip empty option
    return opt.label.toLowerCase().includes(search.toLowerCase())
  })

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleSelection = (code: string) => {
    if (selected.includes(code)) {
      onChange(selected.filter(s => s !== code))
    } else if (selected.length < maxSelections) {
      onChange([...selected, code])
    }
  }

  const removeSelection = (code: string) => {
    onChange(selected.filter(s => s !== code))
  }

  const getSelectedLabels = () => {
    return selected.map(code => 
      options.find(o => o.code === code)?.label || code
    )
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-lg font-bold text-orange-600">
          {label}
        </label>
      )}

      <div className="relative" ref={dropdownRef}>
        {/* Main trigger area — div not button, to avoid nested <button> hydration error */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsOpen(!isOpen) } }}
          className="w-full px-4 py-3 text-base rounded-lg border-2 border-gray-300 bg-white text-gray-900 hover:border-gray-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-200 transition-all text-left flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex flex-wrap gap-2 flex-1">
            {selected.length === 0 ? (
              <span className="text-gray-500">{placeholder}</span>
            ) : (
              selected.map(code => {
                const option = options.find(o => o.code === code)
                return (
                  <span
                    key={code}
                    className="inline-flex items-center gap-1 bg-emerald-600 text-white px-3 py-1 rounded-full text-sm font-semibold"
                  >
                    {option?.label || code}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeSelection(code)
                      }}
                      className="hover:opacity-70 transition-opacity"
                      aria-label={`Remove ${option?.label}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )
              })
            )}
          </div>
          <ChevronDown
            className={`h-5 w-5 text-gray-500 flex-shrink-0 ml-2 transition-transform ${
              isOpen ? 'transform rotate-180' : ''
            }`}
          />
        </div>

        {/* Dropdown menu */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 bg-white border-2 border-gray-300 rounded-lg mt-1 shadow-lg z-50 overflow-hidden">
            {/* Search input */}
            <div className="p-3 border-b border-gray-200">
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                autoFocus
              />
            </div>

            {/* Options list */}
            <div className="max-h-64 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className="p-3 text-center text-gray-500 text-sm">
                  No options match your search
                </div>
              ) : (
                filteredOptions.map(opt => {
                  const isSelected = selected.includes(opt.code)
                  const isDisabled =
                    !isSelected && selected.length >= maxSelections

                  return (
                    <button
                      key={opt.code}
                      type="button"
                      onClick={() => !isDisabled && toggleSelection(opt.code)}
                      disabled={isDisabled}
                      className={`w-full px-4 py-3 text-left text-sm font-medium transition-colors ${
                        isSelected
                          ? 'bg-emerald-50 border-l-4 border-emerald-600 text-emerald-900'
                          : isDisabled
                            ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                            : 'hover:bg-gray-100 text-gray-900'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {isSelected && (
                              <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                            )}
                            <span>{opt.label}</span>
                          </div>
                          {opt.farReference && (
                            <div className="text-xs text-gray-500 ml-6">
                              {opt.farReference}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })
              )}
            </div>

            {/* Footer info */}
            {selected.length > 0 && (
              <div className="p-3 border-t border-gray-200 text-xs text-gray-600">
                {selected.length} of {maxSelections} selected
              </div>
            )}
          </div>
        )}
      </div>

      {helpText && (
        <p className="text-sm text-gray-600">{helpText}</p>
      )}
    </div>
  )
}

export default MultiSelectDropdown