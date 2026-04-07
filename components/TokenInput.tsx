'use client'
import { useState, useRef, KeyboardEvent } from 'react'
import { X } from 'lucide-react'

interface TokenInputProps {
  value: string            // comma-separated string, e.g. "541512,541519"
  onChange: (v: string) => void
  placeholder?: string
  className?: string
  theme?: 'dark' | 'light'
}

export default function TokenInput({ value, onChange, placeholder, className, theme = 'dark' }: TokenInputProps) {
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const tokens = value.split(',').map(s => s.trim()).filter(Boolean)

  const addToken = (raw: string) => {
    const t = raw.trim()
    if (!t || tokens.includes(t)) { setDraft(''); return }
    const next = [...tokens, t].join(',')
    onChange(next)
    setDraft('')
  }

  const removeToken = (idx: number) => {
    const next = tokens.filter((_, i) => i !== idx).join(',')
    onChange(next)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && draft.trim()) {
      e.preventDefault()
      addToken(draft)
    } else if (e.key === 'Backspace' && !draft && tokens.length > 0) {
      removeToken(tokens.length - 1)
    }
  }

  const handleChange = (raw: string) => {
    if (raw.endsWith(',')) {
      addToken(raw.slice(0, -1))
    } else {
      setDraft(raw)
    }
  }

  const containerClass = theme === 'light'
    ? 'bg-white border border-blue-300 rounded-lg focus-within:border-blue-500'
    : 'bg-blue-800 border border-blue-500 rounded-lg focus-within:border-blue-300'
  const chipClass = theme === 'light'
    ? 'bg-orange-100 border border-orange-300 text-orange-900'
    : 'bg-orange-600 border border-orange-700 text-white'
  const removeClass = theme === 'light'
    ? 'hover:text-red-600'
    : 'hover:text-red-200'
  const inputClass = theme === 'light'
    ? 'bg-transparent text-blue-900 placeholder-blue-500 text-sm'
    : 'bg-transparent text-white placeholder-blue-200 text-sm font-semibold'

  return (
    <div
      className={`flex flex-wrap gap-1.5 items-center px-3 py-2 transition-colors min-h-[42px] cursor-text ${containerClass} ${className ?? ''}`}
      onClick={() => inputRef.current?.focus()}
    >
      {tokens.map((t, i) => (
        <span
          key={i}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${chipClass}`}
        >
          {t}
          <button
            type="button"
            onClick={e => { e.stopPropagation(); removeToken(i) }}
            className={`transition-colors ml-0.5 flex-shrink-0 ${removeClass}`}
            tabIndex={-1}
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        type="text"
        value={draft}
        onChange={e => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => { if (draft.trim()) addToken(draft) }}
        placeholder={tokens.length === 0 ? placeholder : ''}
        className={`flex-1 min-w-[120px] focus:outline-none ${inputClass}`}
      />
    </div>
  )
}
