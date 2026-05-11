// app/alerts/manage-alerts/page.tsx
'use client'
import { AlertSuccessModal } from '@/components/Aletsuccessmodal'
import Link from 'next/link'
import {
  BellRing, Plus, Mail, X, Clock, Check, Filter, ChevronDown, ChevronUp,
  Play, Edit3, Trash2, Share2, Download,
  AlertCircle, BookUser, Search,
} from 'lucide-react'
import { useEffect, useState, useRef, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import QuickSearchPanel, { type QuickSearchParams } from '@/components/QuickSearchPanel'
import TokenInput from '@/components/TokenInput'
import { RunAlertModal } from '@/components/Runalertmodal'
import WorkspaceNavRow from '@/components/WorkspaceNavRow'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const PROCUREMENT_TYPE_OPTIONS = [
  { value: 'o', label: 'Solicitation' },
  { value: 'p', label: 'Presolicitation' },
  { value: 'k', label: 'Combined Synopsis/Solicitation' },
  { value: 'r', label: 'Sources Sought' },
  { value: 's', label: 'Special Notice' },
  { value: 'g', label: 'Sale of Surplus Property' },
  { value: 'i', label: 'Intent to Bundle' },
  { value: 'a', label: 'Award Notice' },
  { value: 'u', label: 'Justification' },
]

const SET_ASIDE_CODES = [
  { value: 'SBA',     label: 'Small Business' },
  { value: 'SBP',     label: 'Small Business (Partial)' },
  { value: '8A',      label: '8(a) Sole Source' },
  { value: '8AN',     label: '8(a) Competitive' },
  { value: 'HZC',     label: 'HUBZone Set-Aside' },
  { value: 'HZS',     label: 'HUBZone Sole Source' },
  { value: 'SDVOSBC', label: 'SDVOSB Set-Aside' },
  { value: 'SDVOSBS', label: 'SDVOSB Sole Source' },
  { value: 'WOSB',    label: 'Women-Owned Small Business' },
  { value: 'WOSBSS',  label: 'WOSB Sole Source' },
  { value: 'EDWOSB',  label: 'Economically Disadvantaged WOSB' },
  { value: 'VSB',     label: 'Veteran-Owned Small Business' },
]

const US_STATES = [
  { value: 'AL', label: 'Alabama' }, { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' }, { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' }, { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' }, { value: 'DE', label: 'Delaware' },
  { value: 'DC', label: 'District of Columbia' }, { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' }, { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' }, { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' }, { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' }, { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' }, { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' }, { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' }, { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' }, { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' }, { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' }, { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' }, { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' }, { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' }, { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' }, { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' }, { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' }, { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' }, { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' }, { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' }, { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' }, { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' }, { value: 'GU', label: 'Guam' },
  { value: 'PR', label: 'Puerto Rico' }, { value: 'VI', label: 'U.S. Virgin Islands' },
]

// ---------------------------------------------------------------------------
// Inline error display helper
// ---------------------------------------------------------------------------
function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return (
    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-400 font-medium">
      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
      {msg}
    </p>
  )
}

// ---------------------------------------------------------------------------
// Multi-Select Dropdown
// ---------------------------------------------------------------------------
interface MultiSelectOption { value: string; label: string }

function MultiSelect({
  options, selected, onChange, placeholder = 'Any', summaryMode = 'chips',
}: {
  options: MultiSelectOption[]
  selected: string[]
  onChange: (v: string[]) => void
  placeholder?: string
  summaryMode?: 'chips' | 'line' | 'none'
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setSearch('') }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const toggle = (v: string) =>
    onChange(selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v])

  const filtered = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
  const selectedLabels = selected.map(v => options.find(o => o.value === v)?.label ?? v)
  const label = selected.length === 0 ? placeholder
    : selected.length === 1 ? (options.find(o => o.value === selected[0])?.label ?? selected[0])
    : `${selected.length} selected`
  const compactSummary = selected.length <= 2
    ? selectedLabels.join(', ')
    : `${selectedLabels.slice(0, 2).join(', ')} +${selected.length - 2} more`

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => { setOpen(o => !o); setSearch('') }}
        className="w-full px-3 py-2 bg-white border border-blue-400 rounded-md text-left text-base focus:outline-none focus:border-blue-600 flex items-center justify-between gap-2 min-h-9.5">
        <span className={selected.length === 0 ? 'text-blue-900' : 'text-blue-900 truncate'}>{label}</span>
        <div className="flex items-center gap-1 shrink-0">
          {selected.length > 0 && (
            <span onClick={e => { e.stopPropagation(); onChange([]) }} className="text-blue-900 hover:text-red-600 cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-blue-900 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>
      {selected.length > 1 && summaryMode === 'chips' && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {selected.map(v => (
            <span key={v} className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-200 border border-orange-500 rounded-md text-sm font-bold text-orange-950">
              {options.find(o => o.value === v)?.label ?? v}
              <button type="button" onClick={() => toggle(v)} className="hover:text-red-700 ml-0.5"><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
      )}
      {selected.length > 1 && summaryMode === 'line' && (
        <div className="mt-1.5 flex items-center justify-between gap-2 rounded-md border border-blue-300 bg-blue-50 px-2.5 py-1.5">
          <span className="truncate text-xs font-semibold text-blue-900">{compactSummary}</span>
          <button type="button" onClick={() => onChange([])} className="shrink-0 text-xs font-bold text-blue-700 hover:text-red-600">
            Clear
          </button>
        </div>
      )}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-blue-400 rounded-md shadow-2xl overflow-hidden">
          {options.length > 5 && (
            <div className="p-2 border-b border-blue-200">
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search…" autoFocus
                className="w-full px-2.5 py-1.5 bg-white border border-blue-400 rounded-md text-blue-900 text-base placeholder-blue-400 focus:outline-none focus:border-blue-600" />
            </div>
          )}
          <div className="max-h-52 overflow-y-auto">
            <button type="button" onClick={() => onChange([])}
              className={`w-full text-left px-3 py-2.5 text-base flex items-center gap-2.5 border-b border-blue-200 ${selected.length === 0 ? 'bg-blue-700 text-white font-bold' : 'text-blue-900 hover:bg-blue-100 font-semibold'}`}>
              <span className={`w-5 h-5 rounded border-2 shrink-0 flex items-center justify-center ${selected.length === 0 ? 'bg-white border-white' : 'border-blue-600 bg-white'}`}>
                {selected.length === 0 && <Check className="w-3.5 h-3.5 text-blue-700" />}
              </span>
              <span>All</span>
            </button>
            {filtered.length === 0
              ? <div className="px-3 py-3 text-xs text-blue-900 text-center">No matches</div>
              : filtered.map(o => (
                <button key={o.value} type="button" onClick={() => toggle(o.value)}
                  className={`w-full text-left px-3 py-2.5 text-base flex items-center gap-2.5 ${selected.includes(o.value) ? 'bg-blue-100' : 'hover:bg-blue-50'}`}>
                  <span className={`w-5 h-5 rounded border-2 shrink-0 flex items-center justify-center ${selected.includes(o.value) ? 'bg-blue-700 border-blue-700' : 'border-blue-500 bg-white'}`}>
                    {selected.includes(o.value) && <Check className="w-3.5 h-3.5 text-white" />}
                  </span>
                  <span className={selected.includes(o.value) ? 'text-blue-950 font-bold' : 'text-blue-800 font-semibold'}>{o.label}</span>
                </button>
              ))}
          </div>
          {selected.length > 0 && (
            <div className="border-t border-blue-200 p-2">
              <button type="button" onClick={() => { onChange([]); setOpen(false) }}
                className="w-full text-xs text-blue-900 hover:text-red-600 py-1 text-center font-semibold">
                Clear all ({selected.length})
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Address Book types
// ---------------------------------------------------------------------------
interface AddressBookContact {
  id: string; email: string
  firstName?: string | null; lastName?: string | null
  name?: string | null  // legacy fallback
  organization?: string | null
  notes?: string | null; phone?: string | null; useCount: number
  lastUsedAt?: string | null; createdAt: string
}

// ---------------------------------------------------------------------------
// Recipient types & helpers
// ---------------------------------------------------------------------------
export interface Recipient {
  id: string; firstName: string; lastName: string; email: string; phone: string
  role: string; channels: ('email' | 'sms')[]
}

function makeRecipient(): Recipient {
  return { id: Math.random().toString(36).slice(2), firstName: '', lastName: '', email: '', phone: '', role: 'Primary Contact', channels: ['email'] }
}

const isValidEmail = (v: string) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
const isValidPhone = (v: string) => !v || /^[\+\d][\d\s\-\(\)]{6,14}$/.test(v.trim())

function recipientsToString(list: Recipient[]): string {
  return list.map(r => r.email || r.phone).filter(Boolean).join(', ')
}

function stringToRecipients(str?: string): Recipient[] {
  if (!str?.trim()) return [makeRecipient()]
  return str.split(',').map(raw => {
    const v = raw.trim()
    const isEmail = v.includes('@')
    return { ...makeRecipient(), email: isEmail ? v : '', phone: isEmail ? '' : v, channels: isEmail ? ['email'] : ['sms'] }
  })
}

function recipientChannels(r?: Partial<Recipient>): ('email' | 'sms')[] {
  if (Array.isArray(r?.channels)) {
    return r.channels.filter((c): c is 'email' | 'sms' => c === 'email' || c === 'sms')
  }
  const inferred: ('email' | 'sms')[] = []
  if (typeof r?.email === 'string' && r.email.trim()) inferred.push('email')
  if (typeof r?.phone === 'string' && r.phone.trim()) inferred.push('sms')
  return inferred.length ? inferred : ['email']
}

function normalizeRecipient(r?: Partial<Recipient>): Recipient {
  return {
    ...makeRecipient(),
    ...r,
    email: typeof r?.email === 'string' ? r.email : '',
    phone: typeof r?.phone === 'string' ? r.phone : '',
    role: typeof r?.role === 'string' && r.role.trim() ? r.role : 'Primary Contact',
    channels: recipientChannels(r),
  }
}

function normalizeRecipients(list?: Array<Partial<Recipient> | null | undefined>): Recipient[] {
  const normalized = (Array.isArray(list) ? list : [])
    .filter(Boolean)
    .map(r => normalizeRecipient(r ?? undefined))
  return normalized.length ? normalized : [makeRecipient()]
}

// ---------------------------------------------------------------------------
// RecipientSelector component
// ---------------------------------------------------------------------------
function RecipientSelector({
  recipients, contacts, onChange, errors,
}: {
  recipients: Recipient[]
  contacts: AddressBookContact[]
  onChange: (r: Recipient[]) => void
  errors: Record<string, string>
}) {
  const [search, setSearch] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [oneOffEmail, setOneOffEmail] = useState('')
  const [selectedContactEmail, setSelectedContactEmail] = useState('')

  const realRecipients = recipients.filter(r => r.email || r.phone)
  const emailsInUse = new Set(realRecipients.map(r => r.email).filter(Boolean))
  const normalizedEmailsInUse = new Set(
    realRecipients
      .map(r => r.email?.trim().toLowerCase())
      .filter((v): v is string => Boolean(v))
  )

  const filtered = contacts.filter(c => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return [c.email, c.firstName, c.lastName, c.organization].some(v => v?.toLowerCase().includes(q))
  })

  const toggleContact = (c: AddressBookContact) => {
    if (emailsInUse.has(c.email)) {
      const next = recipients.filter(r => r.email !== c.email)
      onChange(next.length ? next : [makeRecipient()])
    } else {
      onChange([...realRecipients, {
        ...makeRecipient(),
        firstName: c.firstName || '',
        lastName: c.lastName || '',
        email: c.email,
        phone: c.phone || '',
        channels: ['email'],
      }])
    }
  }

  const removeRecipient = (email: string) => {
    const next = recipients.filter(r => r.email !== email)
    onChange(next.length ? next : [makeRecipient()])
  }

  const addOneOff = () => {
    const e = oneOffEmail.trim()
    const normalized = e.toLowerCase()
    if (!e || !isValidEmail(e) || normalizedEmailsInUse.has(normalized)) return
    onChange([...realRecipients, { ...makeRecipient(), email: e, channels: ['email'] }])
    setOneOffEmail('')
  }

  const addFromSelectedContact = () => {
    const email = selectedContactEmail.trim()
    const normalized = email.toLowerCase()
    if (!email || normalizedEmailsInUse.has(normalized)) return
    const c = contacts.find(x => x.email.toLowerCase() === normalized)
    if (!c) return
    onChange([...realRecipients, {
      ...makeRecipient(),
      firstName: c.firstName || '',
      lastName: c.lastName || '',
      email: c.email,
      phone: c.phone || '',
      channels: ['email'],
    }])
    setSelectedContactEmail('')
  }

  return (
    <div className="space-y-3">
      {errors.recipients && (
        <div className="px-3 py-2.5 bg-red-100 border border-red-400 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-sm text-red-800 font-semibold">{errors.recipients}</p>
        </div>
      )}

      {/* Read-only selected recipients */}
      <div className="space-y-1.5">
        {realRecipients.map(r => (
          <div key={r.id} className="flex items-center gap-2.5 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
            <Mail className="w-3.5 h-3.5 text-blue-900 shrink-0" />
            <span className="text-sm text-blue-900 font-semibold flex-1 truncate">
              {[r.firstName, r.lastName].filter(Boolean).join(' ') || r.email}
            </span>
            {(r.firstName || r.lastName) && (
              <span className="text-xs text-blue-900 truncate max-w-45">{r.email}</span>
            )}
            <button type="button" onClick={() => removeRecipient(r.email)}
              className="text-blue-900 hover:text-red-600 transition-colors shrink-0">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        {realRecipients.length === 0 && (
          <p className="text-sm text-blue-900 italic px-1 font-semibold">
            {contacts.length === 0
              ? 'No contacts yet. Open Contacts to add recipients, then select them here.'
              : 'No recipients yet — select from address book or type an email below.'}
          </p>
        )}
      </div>

      {/* Address book picker (collapsible) */}
      {contacts.length > 0 && (
        <div className="border border-blue-200 rounded-xl overflow-hidden">
          <button type="button" onClick={() => setPickerOpen(p => !p)}
            className="w-full flex items-center justify-between px-3 py-2.5 bg-blue-100 hover:bg-blue-200 text-sm font-semibold text-blue-900 transition-colors">
            <span className="flex items-center gap-2">
              <BookUser className="w-4 h-4 text-orange-400" />
              From Address Book
              {realRecipients.length > 0 && (
                <span className="text-xs bg-orange-100 text-orange-900 border border-orange-300 px-1.5 py-0.5 rounded-full font-semibold">
                  {realRecipients.length} added
                </span>
              )}
            </span>
            {pickerOpen ? <ChevronUp className="w-4 h-4 text-blue-900" /> : <ChevronDown className="w-4 h-4 text-blue-900" />}
          </button>

          {pickerOpen && (
            <div className="border-t border-blue-300 bg-blue-50 p-3 space-y-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-blue-900" />
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search by name, email, or org…"
                  className="w-full pl-8 pr-3 py-2 bg-blue-50 border border-blue-600 rounded-md text-base text-blue-900 placeholder-blue-700 focus:outline-none focus:border-blue-900 transition-colors font-semibold" />
              </div>
              <div className="max-h-52 overflow-y-auto space-y-0.5">
                {filtered.length === 0 ? (
                  <p className="text-xs text-blue-900 italic text-center py-3 font-semibold">
                    {search ? 'No contacts match' : 'No contacts in address book'}
                  </p>
                ) : filtered.map(c => {
                  const added = emailsInUse.has(c.email)
                  const name = [c.firstName, c.lastName].filter(Boolean).join(' ') || c.email
                  return (
                    <button key={c.id} type="button" onClick={() => toggleContact(c)}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors ${added ? 'bg-emerald-100 border border-emerald-300' : 'hover:bg-blue-100 border border-transparent'}`}>
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${added ? 'bg-emerald-500 border-emerald-500' : 'border-blue-300'}`}>
                        {added && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-blue-900 font-semibold truncate">{name}</p>
                        {name !== c.email && <p className="text-xs text-blue-900 truncate font-semibold">{c.email}</p>}
                        {c.organization && <p className="text-xs text-blue-900 truncate font-semibold">{c.organization}</p>}
                      </div>
                    </button>
                  )
                })}
              </div>
              {filtered.length > 0 && (
                <div className="flex justify-between pt-1 border-t border-blue-200">
                  <button type="button" onClick={() => {
                    const toAdd = filtered.filter(c => !emailsInUse.has(c.email))
                    const newRs = toAdd.map(c => ({
                      ...makeRecipient(),
                      firstName: c.firstName || '',
                      lastName: c.lastName || '',
                      email: c.email,
                      phone: c.phone || '',
                      channels: ['email'] as ('email' | 'sms')[],
                    }))
                    onChange([...realRecipients, ...newRs])
                  }} className="text-xs text-orange-600 hover:text-orange-700 font-semibold transition-colors">
                    Select All ({filtered.length})
                  </button>
                  {realRecipients.length > 0 && (
                    <button type="button" onClick={() => onChange([makeRecipient()])}
                      className="text-xs text-blue-900 hover:text-blue-700 transition-colors font-semibold">
                      Clear All
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Add from contacts dropdown */}
      {contacts.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-md border border-blue-300 bg-blue-100 px-3 py-2">
            <p className="text-sm font-bold text-blue-900">Need to update recipient details?</p>
            <Link href="/contacts" className="text-sm font-black text-blue-700 hover:text-blue-900 underline underline-offset-2">
              Open Address Book
            </Link>
          </div>
          <div className="flex gap-2">
          <select
            value={selectedContactEmail}
            onChange={e => setSelectedContactEmail(e.target.value)}
            className="flex-1 px-3 py-2 bg-white border border-blue-600 rounded-md text-base text-blue-900 focus:outline-none focus:border-blue-900 transition-colors font-semibold"
          >
            <option value="">Add email from contacts...</option>
            {contacts
              .filter(c => !normalizedEmailsInUse.has(c.email.toLowerCase()))
              .map(c => {
                const name = [c.firstName, c.lastName].filter(Boolean).join(' ')
                return (
                  <option key={c.id} value={c.email}>
                    {name ? `${name} (${c.email})` : c.email}
                  </option>
                )
              })}
          </select>
          <button
            type="button"
            onClick={addFromSelectedContact}
            disabled={!selectedContactEmail}
            className="px-3 py-2 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-300 disabled:cursor-not-allowed text-white rounded-md text-base font-bold transition-colors"
          >
            Add from Contacts
          </button>
          </div>
        </div>
      )}
      {contacts.length === 0 && (
        <div className="px-3 py-2 rounded-md border border-blue-300 bg-blue-100 text-blue-900 font-semibold flex items-center justify-between gap-3">
          <span>No saved contacts found yet. Add contacts, then use "Add from Contacts" here.</span>
          <Link href="/contacts" className="shrink-0 text-sm font-black text-blue-700 hover:text-blue-900 underline underline-offset-2">
            Open Contacts
          </Link>
        </div>
      )}

      {/* One-off email input */}
      <div className="flex gap-2">
        <input type="email" value={oneOffEmail} onChange={e => setOneOffEmail(e.target.value)}
          onBlur={addOneOff}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addOneOff() } }}
          placeholder={contacts.length > 0 ? 'Or type an email address…' : 'Add email address…'}
          className="flex-1 px-3 py-2 bg-blue-50 border border-blue-600 rounded-md text-base text-blue-900 placeholder-blue-700 focus:outline-none focus:border-blue-900 transition-colors font-semibold" />
        <button type="button" onClick={addOneOff}
          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-base font-bold transition-colors">
          Add
        </button>
        <Link href="/contacts" className="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-900 border border-blue-300 rounded-md text-base font-bold transition-colors">
          Address Book
        </Link>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface AlertSubscription {
  id: string; name: string; frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY'
  deliveryTime: string; savedSearchId?: string; savedSearchName?: string
  isActive: boolean; lastSentAt?: string; createdAt: string
  recipients?: string; recipientsList?: Recipient[]
  lastResultCount?: number; totalRuns?: number
  params?: {
    keyword?: string; ptypes?: string[]; ptype?: string
    states?: string[]; state?: string; ncode?: string; ccode?: string
    setAsides?: string[]; typeOfSetAside?: string; setAside?: string
    deptname?: string; organizationName?: string
    solnum?: string; zip?: string
    rdlfrom?: string; rdlto?: string
    postedFrom?: string; format?: string
  }
  maxResults?: number
}

interface SavedSearchParams {
  keyword?: string
  title?: string
  ptype?: string | string[]
  ptypes?: string | string[]
  state?: string | string[]
  states?: string | string[]
  ncode?: string
  ccode?: string
  setAsides?: string | string[]
  typeOfSetAside?: string | string[]
  setAside?: string | string[]
  organizationName?: string
  deptname?: string
}

interface SavedSearch { id: string; name: string; params?: SavedSearchParams }

interface RunResultData {
  alertId: string
  alertName: string
  status: 'SUCCESS' | 'ERROR' | 'NO_RESULTS'
  resultCount: number
  emailSent: boolean
  errorMessage?: string
  recipients: Recipient[]
  searchCriteria: {
    keywords?: string
    naics?: string
    agency?: string
    setAside?: string
    states?: string[]
    ptypes?: string[]
    ccode?: string
  }
  format: string
}

interface AlertForm {
  name: string; frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY'
  deliveryTime: string; deliveryHour: string; deliveryMinute: string; deliveryPeriod: 'AM' | 'PM'
  savedSearchId?: string; recipients: Recipient[]
  keyword?: string; ptypes: string[]; states: string[]; setAsides: string[]
  ncode?: string; ccode?: string; organizationName?: string
  solnum?: string; zip?: string; rdlto?: string
  postedFrom?: string
  maxResults: number
  format: string
}

function getSixMonthsAgo(): string {
  const d = new Date()
  d.setMonth(d.getMonth() - 6)
  return d.toISOString().split('T')[0]
}

function makeEmptyForm(): AlertForm {
  return {
    name: '', frequency: 'DAILY', deliveryTime: '09:00',
    deliveryHour: '9', deliveryMinute: '00', deliveryPeriod: 'AM',
    recipients: [], ptypes: [], states: [], setAsides: [],
    postedFrom: getSixMonthsAgo(),
    maxResults: 100, format: 'CSV',
  }
}

function toArray(val: unknown): string[] {
  if (!val) return []
  if (Array.isArray(val)) return val.map(v => String(v).trim()).filter(Boolean)
  return String(val).split(',').map((s: string) => s.trim()).filter(Boolean)
}

// Convert 24h "HH:MM" to selector parts
function parse24h(time?: string): { hour: string; minute: string; period: 'AM' | 'PM' } {
  const [hRaw = '9', mRaw = '00'] = (time || '09:00').split(':')
  const hNum = Number.parseInt(hRaw, 10)
  const safeHour = Number.isFinite(hNum) ? hNum : 9
  const period: 'AM' | 'PM' = safeHour >= 12 ? 'PM' : 'AM'
  const hour12 = safeHour % 12 === 0 ? 12 : safeHour % 12
  return { hour: String(hour12), minute: mRaw.padStart(2, '0'), period }
}

// Convert 12h parts → stored 24h "HH:MM"
function build24h(hour: string, minute: string, period: 'AM' | 'PM'): string {
  let h = parseInt(hour, 10)
  if (period === 'AM' && h === 12) h = 0
  else if (period === 'PM' && h !== 12) h += 12
  return `${String(h).padStart(2, '0')}:${minute}`
}

function formatDeliveryTime(time?: string): string {
  const { hour, minute, period } = parse24h(time)
  return `${hour}:${minute} ${period}`
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
function ManageAlertsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const formRef = useRef<HTMLDivElement>(null)

  const [alerts, setAlerts] = useState<AlertSubscription[]>([])
  const [searches, setSearches] = useState<SavedSearch[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<AlertForm>(() => ({ ...makeEmptyForm(), recipients: [makeRecipient()] }))
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [runningAlertId, setRunningAlertId] = useState<string | null>(null)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [runResult, setRunResult] = useState<RunResultData | null>(null)
  const [pendingSend, setPendingSend] = useState<{
    alertId: string; alertName: string; runId: string; resultCount: number
    recipientsList: Recipient[]; defaultFormat: string
    keywords?: string; naics?: string; agency?: string; setAside?: string
  } | null>(null)
  // Address book state
  const [contacts, setContacts] = useState<AddressBookContact[]>([])

  // Pre-fill from URL params
  useEffect(() => {
    if (!searchParams) return
    const isNew = searchParams.get('new') === '1' || searchParams.get('_new') === '1'
    const addRecipientEmail = (searchParams.get('addRecipient') || '').trim()
    const addRecipientName = (searchParams.get('recipientName') || '').trim()
    if (!isNew && !addRecipientEmail) return
    const recipientFromContacts = addRecipientEmail
      ? (() => {
          const parts = addRecipientName.split(/\s+/).filter(Boolean)
          const firstName = parts.shift() || ''
          const lastName = parts.join(' ')
          return {
            ...makeRecipient(),
            firstName,
            lastName,
            email: addRecipientEmail,
            channels: ['email'] as ('email' | 'sms')[],
          }
        })()
      : null
    const kw = searchParams.get('title') || searchParams.get('keyword') || ''
    setFormData({
      name: kw ? `${kw} Alert` : 'New Alert',
      frequency: 'DAILY', deliveryTime: '09:00', deliveryHour: '9', deliveryMinute: '00', deliveryPeriod: 'AM',
      recipients: recipientFromContacts ? [recipientFromContacts] : [makeRecipient()],
      keyword: kw,
      ptypes: toArray(searchParams.get('ptype')),
      states: toArray(searchParams.get('state')),
      ncode: searchParams.get('ncode') || '',
      ccode: searchParams.get('ccode') || '',
      setAsides: toArray(searchParams.get('typeOfSetAside')),
      organizationName: searchParams.get('organizationName') || '',
      solnum: searchParams.get('solnum') || '',
      zip: searchParams.get('zip') || '',
      rdlto: searchParams.get('rdlto') || '',
      postedFrom: searchParams.get('postedFrom') || '',
      maxResults: 100, format: 'CSV',
    })
    setFormErrors({})
    setEditingId(null)
    setShowForm(true)
    setShowAdvancedFilters(false)
    window.history.replaceState({}, '', '/alerts/manage-alerts')
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100)
  }, [searchParams])

  useEffect(() => { loadData(); loadContacts() }, [])

  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }, [])

  const readApiError = useCallback(async (res: Response, fallback: string) => {
    try {
      const data = await res.json()
      if (typeof data?.error === 'string' && data.error.trim()) return data.error
      if (typeof data?.message === 'string' && data.message.trim()) return data.message
    } catch {
      // no-op
    }
    return `${fallback} (HTTP ${res.status})`
  }, [])

  const loadData = async () => {
    try {
      // Alerts come from dedicated alert subscriptions API.
      const [alertsRes, searchesRes] = await Promise.all([
        fetch('/api/alert-subscriptions'),
        fetch('/api/saved-searches'),
      ])
      const alertsData = await alertsRes.json()
      const searchesData = await searchesRes.json()
      // Alerts list
      const alertsArr = Array.isArray(alertsData)
        ? alertsData
        : Array.isArray(alertsData?.alerts)
          ? alertsData.alerts
          : []
      setAlerts(alertsArr)
      // All saved searches
      const searchArr = Array.isArray(searchesData)
        ? searchesData
        : Array.isArray(searchesData?.searches)
          ? searchesData.searches
          : []
      setSearches(searchArr)
    } catch {
      setAlerts([]); setSearches([])
    } finally {
      setLoading(false)
    }
  }

  const loadContacts = async () => {
    try {
      const res = await fetch('/api/address-book')
      const data = await res.json()
      setContacts(Array.isArray(data) ? data : [])
    } catch { setContacts([]) }
  }

  const handleEditAlert = (alert: AlertSubscription) => {
    const recipients = alert.recipientsList?.length
      ? normalizeRecipients(alert.recipientsList)
      : normalizeRecipients(stringToRecipients(alert.recipients || ''))
    const { hour, minute, period } = parse24h(alert.deliveryTime)
    const alertParams = alert.params || {}

    setFormData({
      name: alert.name || '',
      frequency: alert.frequency || 'DAILY',
      deliveryTime: alert.deliveryTime || '09:00',
      deliveryHour: hour,
      deliveryMinute: minute,
      deliveryPeriod: period,
      savedSearchId: alert.savedSearchId,
      recipients,
      keyword: alertParams.keyword || '',
      ptypes: toArray(alertParams.ptypes ?? alertParams.ptype),
      states: toArray(alertParams.states ?? alertParams.state),
      setAsides: toArray(alertParams.setAsides ?? alertParams.typeOfSetAside ?? alertParams.setAside),
      ncode: alertParams.ncode || '',
      ccode: alertParams.ccode || '',
      organizationName: alertParams.organizationName || alertParams.deptname || '',
      solnum: alertParams.solnum || '',
      zip: alertParams.zip || '',
      rdlto: alertParams.rdlto || '',
      postedFrom: alertParams.postedFrom || '',
      maxResults: alert.maxResults ?? 100,
      format: alertParams.format || 'CSV',
    })

    setFormErrors({})
    setEditingId(alert.id)
    setShowForm(true)
    setShowAdvancedFilters(false)
    showToast(`Editing "${alert.name}". Update fields and save when ready.`)
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
  }

  const handleDeleteAlert = async (id: string, name: string) => {
    if (!confirm(`Delete alert "${name}"?`)) return
    try {
      const res = await fetch(`/api/alert-subscriptions/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        throw new Error(await readApiError(res, 'Failed to delete alert.'))
      }
      setAlerts(prev => prev.filter(a => a.id !== id))
      showToast(`"${name}" deleted.`)
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to delete alert.', 'error')
    }
  }

  // Run now: execute and send using saved alert recipients/settings.
  const handleRunNow = async (id: string) => {
    setRunningAlertId(id)
    try {
      const res = await fetch(`/api/alert-subscriptions/${id}/run-now`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sendEmailNow: true }),
      })
      const r = await res.json().catch(() => ({}))
      const alert = alerts.find(a => a.id === id)
      const recipList: Recipient[] = alert?.recipientsList?.length
        ? alert.recipientsList
        : stringToRecipients(alert?.recipients || '')

      if (!res.ok) {
        showToast(typeof r?.error === 'string' ? r.error : `Failed to run alert. (HTTP ${res.status})`, 'error')
        return
      }

      if (r.status === 'ERROR' || r.error) {
        setRunResult({
          alertId: id,
          alertName: r.alertName || alert?.name || '',
          status: 'ERROR',
          resultCount: r.resultCount ?? 0,
          emailSent: false,
          errorMessage: r.error || 'Alert run failed.',
          recipients: recipList,
          searchCriteria: {
            keywords: alert?.params?.keyword,
            naics: alert?.params?.ncode,
            agency: alert?.params?.organizationName || alert?.params?.deptname,
            setAside: Array.isArray(alert?.params?.setAsides)
              ? alert?.params?.setAsides.join(', ')
              : alert?.params?.typeOfSetAside,
            states: alert?.params?.states || [],
            ptypes: alert?.params?.ptypes || [],
            ccode: alert?.params?.ccode,
          },
          format: 'Email',
        })
        showToast(typeof r.error === 'string' ? r.error : 'Alert run failed.', 'error')
        return
      }

      setRunResult({
        alertId: id,
        alertName: r.alertName || alert?.name || '',
        status: r.resultCount === 0 ? 'NO_RESULTS' : 'SUCCESS',
        resultCount: r.resultCount ?? 0,
        emailSent: r.emailSent ?? false,
        recipients: recipList,
        searchCriteria: {
          keywords: alert?.params?.keyword,
          naics: alert?.params?.ncode,
          agency: alert?.params?.organizationName || alert?.params?.deptname,
          setAside: Array.isArray(alert?.params?.setAsides)
            ? alert?.params?.setAsides.join(', ')
            : alert?.params?.typeOfSetAside,
          states: alert?.params?.states || [],
          ptypes: alert?.params?.ptypes || [],
          ccode: alert?.params?.ccode,
        },
        format: 'Email',
      })
      const resultCount = Number(r?.resultCount ?? 0)
      showToast(
        resultCount > 0
          ? `Run completed: ${resultCount} opportunit${resultCount === 1 ? 'y' : 'ies'} found.`
          : 'Run completed: no matching opportunities found.',
        'success'
      )
      loadData()
    } catch {
      showToast('Network error — could not reach the server.', 'error')
    } finally {
      setRunningAlertId(null)
    }
  }

  // Share: run first, then let user choose recipients/attachments in modal.
  const handleShareNow = async (id: string) => {
    setRunningAlertId(id)
    try {
      const res = await fetch(`/api/alert-subscriptions/${id}/run-now`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sendEmailNow: false }),
      })
      const r = await res.json().catch(() => ({}))
      const alert = alerts.find(a => a.id === id)
      const recipList: Recipient[] = alert?.recipientsList?.length
        ? alert.recipientsList
        : stringToRecipients(alert?.recipients || '')

      if (!res.ok) {
        showToast(typeof r?.error === 'string' ? r.error : `Failed to run alert. (HTTP ${res.status})`, 'error')
        return
      }

      if (r.status === 'ERROR' || r.error) {
        showToast(r.error || 'Run failed. Please check your SAM.gov API settings.', 'error')
        return
      }

      setPendingSend({
        alertId: id,
        alertName: r.alertName || alert?.name || '',
        runId: r.runId,
        resultCount: r.resultCount ?? 0,
        recipientsList: recipList,
        defaultFormat: alert?.params?.format || 'CSV',
        keywords: alert?.params?.keyword,
        naics: alert?.params?.ncode,
        agency: alert?.params?.organizationName || alert?.params?.deptname,
        setAside: Array.isArray(alert?.params?.setAsides)
          ? alert?.params?.setAsides.join(', ')
          : alert?.params?.typeOfSetAside,
      })
      showToast('Results prepared. Choose recipients/attachments and click Send Email.')
      loadData()
    } catch {
      showToast('Network error — could not reach the server.', 'error')
    } finally {
      setRunningAlertId(null)
    }
  }

  const handleDownloadAlert = (alert: AlertSubscription) => {
    const payload = {
      id: alert.id,
      name: alert.name,
      frequency: alert.frequency,
      deliveryTime: alert.deliveryTime,
      isActive: alert.isActive,
      recipients: alert.recipientsList?.length ? alert.recipientsList : alert.recipients,
      params: alert.params || {},
      maxResults: alert.maxResults ?? 100,
      createdAt: alert.createdAt,
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${alert.name || 'alert'}-config.json`
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
    showToast(`Downloaded "${alert.name}" configuration.`)
  }

  // Phase 2: send email using stored run results
  const handleSendEmail = async (formats: string[], extraRecipients: string[]) => {
    if (!pendingSend) return
    const { alertId, runId } = pendingSend
    setPendingSend(null)
    setRunningAlertId(alertId)
    try {
      const res = await fetch(`/api/alert-subscriptions/${alertId}/run-now`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runId, formats, overrideRecipients: extraRecipients, sendEmailNow: true }),
      })
      const r = await res.json().catch(() => ({}))
      const alert = alerts.find(a => a.id === alertId)
      const recipList: Recipient[] = alert?.recipientsList?.length
        ? alert.recipientsList
        : stringToRecipients(alert?.recipients || '')

      const status: RunResultData['status'] = res.ok
        ? (r.resultCount === 0 ? 'NO_RESULTS' : 'SUCCESS')
        : 'ERROR'

      setRunResult({
        alertId,
        alertName: r.alertName || alert?.name || '',
        status,
        resultCount: r.resultCount ?? 0,
        emailSent: r.emailSent ?? false,
        errorMessage: r.error || (!res.ok ? 'Failed to send.' : undefined),
        recipients: recipList,
        searchCriteria: {
          keywords: alert?.params?.keyword,
          naics: alert?.params?.ncode,
          agency: alert?.params?.organizationName || alert?.params?.deptname,
          setAside: Array.isArray(alert?.params?.setAsides)
            ? alert?.params?.setAsides.join(', ')
            : alert?.params?.typeOfSetAside,
          states: alert?.params?.states || [],
          ptypes: alert?.params?.ptypes || [],
          ccode: alert?.params?.ccode,
        },
        format: 'Email',
      })
      if (!res.ok || r?.status === 'ERROR') {
        showToast(typeof r?.error === 'string' ? r.error : 'Failed to send alert email.', 'error')
      } else if ((r?.resultCount ?? 0) === 0) {
        showToast('No matching opportunities found. Email not sent.', 'error')
      } else if (r?.emailSent) {
        showToast('Alert email sent successfully.')
      } else {
        showToast('Run completed, but email was not sent. Check recipients/settings.', 'error')
      }
    } catch {
      const alert = alerts.find(a => a.id === alertId)
      setRunResult({
        alertId,
        alertName: alert?.name || '',
        status: 'ERROR',
        resultCount: 0,
        emailSent: false,
        errorMessage: 'Network error — could not reach the server.',
        recipients: [],
        searchCriteria: {},
        format: 'Email',
      })
      showToast('Network error — could not reach the server.', 'error')
    } finally {
      setRunningAlertId(null)
    }
  }

  // ---------------------------------------------------------------------------
  // Inline validation — returns errors object; empty = valid
  // ---------------------------------------------------------------------------
  const validateForm = (): Record<string, string> => {
    const errors: Record<string, string> = {}

    if (!formData.name.trim()) {
      errors.name = 'Alert name is required.'
    }

    const hasAnyContact = formData.recipients.some(r => r.email || r.phone)
    if (!hasAnyContact) {
      errors.recipients = 'At least one recipient needs an email or phone number.'
    }

    formData.recipients.forEach(r => {
      const channels = recipientChannels(r)
      if (channels.includes('email') && !r.email) {
        errors[`recipient_${r.id}_email`] = 'Email address is required when the Email channel is enabled.'
      } else if (r.email && !isValidEmail(r.email)) {
        errors[`recipient_${r.id}_email`] = 'Please enter a valid email address.'
      }

      if (channels.includes('sms') && !r.phone) {
        errors[`recipient_${r.id}_phone`] = 'Phone number is required when the SMS channel is enabled.'
      } else if (r.phone && !isValidPhone(r.phone)) {
        errors[`recipient_${r.id}_phone`] = 'Please enter a valid phone number.'
      }
    })

    return errors
  }

  const clearError = (key: string) => {
    setFormErrors(prev => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const handleSave = async () => {
    const errors = validateForm()

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      // Scroll to the form so errors are visible
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }

    setFormErrors({})
    setSaving(true)

    const deliveryTime = build24h(formData.deliveryHour, formData.deliveryMinute, formData.deliveryPeriod)
    const params = {
      keyword: formData.keyword || undefined,
      ptypes: formData.ptypes.length ? formData.ptypes : undefined,
      ptype: formData.ptypes.length ? formData.ptypes.join(',') : undefined,
      states: formData.states.length ? formData.states : undefined,
      state: formData.states.length ? formData.states.join(',') : undefined,
      setAsides: formData.setAsides.length ? formData.setAsides : undefined,
      typeOfSetAside: formData.setAsides.length ? formData.setAsides.join(',') : undefined,
      ncode: formData.ncode || undefined,
      ccode: formData.ccode || undefined,
      organizationName: formData.organizationName || undefined,
      solnum: formData.solnum || undefined,
      zip: formData.zip || undefined,
      rdlto: formData.rdlto || undefined,
      postedFrom: formData.postedFrom || undefined,
      format: formData.format,
    }

    const payload = {
      name: formData.name, frequency: formData.frequency, deliveryTime,
      recipients: recipientsToString(formData.recipients),
      recipientsList: formData.recipients,
      params, savedSearchId: formData.savedSearchId || null, isActive: true,
      maxResults: formData.maxResults,
    }

    const endpoint = editingId ? `/api/alert-subscriptions/${editingId}` : '/api/alert-subscriptions'
    const method = editingId ? 'PATCH' : 'POST'

    try {
      const res = await fetch(endpoint, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (res.ok) {
        await loadData();
        setShowForm(false);
        setEditingId(null);
        resetForm();
        // Scroll to the newly created or updated alert
        setTimeout(() => {
          const alertName = formData.name || 'Alert';
          const el = document.querySelector(`[data-alert-name="${alertName}"]`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
        showToast(
          editingId
            ? `Alert "${formData.name}" updated!`
            : `Alert "${formData.name}" created and scheduled. Recipients will be notified!`,
          'success'
        );
      } else {
        showToast(await readApiError(res, 'Failed to save alert.'), 'error')
      }
    } catch { showToast('Failed to save.', 'error') }
    finally { setSaving(false) }
  }

  const resetForm = () => {
    setFormData({ ...makeEmptyForm(), recipients: [makeRecipient()] })
    setFormErrors({})
    setShowAdvancedFilters(false)
  }

  const buildPreview = () => {
    const parts: string[] = []
    const compactList = (labels: string[], max = 3) =>
      labels.length <= max ? labels.join(', ') : `${labels.slice(0, max).join(', ')} +${labels.length - max} more`
    if (formData.keyword) parts.push(`"${formData.keyword}"`)
    if (formData.ncode) parts.push(`NAICS ${formData.ncode}`)
    if (formData.ccode) parts.push(`PSC ${formData.ccode}`)
    if (formData.solnum) parts.push(`Solicit. ${formData.solnum}`)
    if (formData.states.length) {
      const stateLabels = formData.states.map(v => US_STATES.find(s => s.value === v)?.label ?? v)
      parts.push(compactList(stateLabels))
    }
    if (formData.setAsides.length) {
      const setAsideLabels = formData.setAsides.map(v => SET_ASIDE_CODES.find(s => s.value === v)?.label ?? v)
      parts.push(compactList(setAsideLabels))
    }
    if (formData.organizationName) parts.push(formData.organizationName)
    if (formData.zip) parts.push(`ZIP ${formData.zip}`)
    return parts.join(' · ')
  }

  const bg = undefined

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: bg }}>
      <div className="text-slate-900 text-center">
        <div className="animate-spin h-12 w-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-lg">Loading…</p>
      </div>
    </div>
  )

  const visibleAlerts = alerts.filter(
    (a): a is AlertSubscription => Boolean(a && (a.id || a.name))
  )
  const activeCount = visibleAlerts.filter(a => a.isActive).length
  const pausedCount = visibleAlerts.filter(a => !a.isActive).length
  const preview = buildPreview()
  const hasErrors = Object.keys(formErrors).length > 0
  const configuredRecipients = formData.recipients.filter(r => (r.email || r.phone))
  const recipientChannelSummary = [
    configuredRecipients.some(r => recipientChannels(r).includes('email')) && 'email',
    configuredRecipients.some(r => recipientChannels(r).includes('sms')) && 'SMS',
  ].filter(Boolean).join(' and ') || 'email'
  const advancedActiveCount = [
    formData.organizationName,
    formData.solnum,
    formData.zip,
    formData.postedFrom,
    formData.rdlto,
  ].filter(v => String(v || '').trim().length > 0).length


  return (
    <div className="min-h-screen manage-alerts-page bg-[#dfeaff]">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-100 px-5 py-3 rounded-xl shadow-xl font-semibold text-sm flex items-center gap-2 ${toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'} text-white`}>
          {toast.type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      <div className="mx-auto w-full max-w-480 px-3 sm:px-4 lg:px-6 xl:px-8 py-8 bg-[#f5f9ff] rounded-2xl border-2 border-blue-300 shadow-lg">

        {/* ── Top Action Row ───────────────────── */}
        <section className="mb-6">
          <WorkspaceNavRow active="saved-alerts" count={visibleAlerts.length} />
        </section>
        <section className="mb-5">
          <button
            onClick={() => { setShowForm(f => !f); setEditingId(null); resetForm() }}
            className="inline-flex items-center gap-2 px-5 py-3 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-xl text-base transition-colors shadow-md"
          >
            {showForm && !editingId ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm && !editingId ? 'Cancel' : 'Create a New Alert'}
          </button>
        </section>

        {/* Header */}
        <div className="flex justify-between items-start mb-8 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              {visibleAlerts.length > 0 && (
                <div className="flex gap-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-base text-white font-black border border-blue-800 rounded-lg bg-blue-700">
                    <Check className="w-4 h-4 text-emerald-300" />{activeCount} active
                  </span>
                  {pausedCount > 0 && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-base text-white font-black border border-blue-800 rounded-lg bg-blue-600">
                      <Clock className="w-4 h-4 text-blue-100" />{pausedCount} paused
                    </span>
                  )}
                </div>
              )}
          </div>
          </div>
        </div>

        {/* ── FORM ─────────────────────────────────────────────────────── */}
        <>
        {/* ── Quick Search Panel ── */}
        <div className="w-full">
          <QuickSearchPanel
            theme="light"
            onSaveSearch={(params: QuickSearchParams) => {
              const qp = new URLSearchParams({ new: '1' })
              if (params.keyword) qp.set('title', params.keyword)
              if (params.ncode) qp.set('ncode', params.ncode)
              if (params.ccode) qp.set('ccode', params.ccode)
              if (params.states?.length) qp.set('state', params.states.join(','))
              if (params.ptypes?.length) qp.set('ptype', params.ptypes.join(','))
              if (params.setAside) qp.set('typeOfSetAside', params.setAside)
              if (params.organizationName) qp.set('organizationName', params.organizationName)
              router.push(`/alerts/manage-searches?new=1&${qp.toString()}`)
            }}
            onCreateAlert={(params: QuickSearchParams) => {
              setFormData({
                ...makeEmptyForm(),
                name: params.keyword ? `${params.keyword} Alert` : 'New Alert',
                keyword: params.keyword || '',
                ptypes: params.ptypes || [],
                states: params.states || [],
                ncode: params.ncode || '',
                ccode: params.ccode || '',
                setAsides: toArray(params.setAside),
                organizationName: params.organizationName || '',
                recipients: [makeRecipient()],
              })
              setFormErrors({})
              setEditingId(null)
              setShowAdvancedFilters(false)
              setShowForm(true)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          />
        </div>

        {showForm && (
          <div ref={formRef} className={`alert-form-surface bg-white border border-blue-200 rounded-2xl p-6 lg:p-7 mb-8 shadow-xl transition-colors w-full ${hasErrors ? 'border-red-400' : 'border-blue-300'}`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-blue-900 flex items-center gap-2">
                <BellRing className="w-5 h-5 text-orange-400" />
                {editingId ? 'Edit Alert' : 'Create New Alert'}
              </h2>
              <button onClick={() => { setShowForm(false); setEditingId(null); resetForm() }} className="text-blue-600 hover:text-blue-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Summary error banner */}
                    {hasErrors && (
              <div className="mb-6 px-4 py-3 bg-red-100 border border-red-400 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-800 font-bold text-sm">Please fix the following before saving:</p>
                  <ul className="mt-1 space-y-0.5">
                    {Object.entries(formErrors).map(([, msg], i) => (
                      <li key={i} className="text-red-700 text-xs">• {msg}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

              <div className="space-y-6">

              {/* ── Section 1: Alert basics ── */}
              <div className="pb-6 border-b border-blue-200">
                <p className="inline-flex items-center rounded-md bg-blue-700 px-3 py-1.5 text-base font-black uppercase tracking-wide text-white mb-4">Alert Settings</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
                  <div className="md:col-span-2 lg:col-span-4">
                    <label className="block text-sm font-bold text-blue-900 mb-2">
                      Alert Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      autoFocus
                      onChange={e => {
                        setFormData(f => ({ ...f, name: e.target.value }))
                        clearError('name')
                      }}
                      placeholder="e.g., Daily Analytics Opportunities"
                      className={`w-full px-4 py-3 border rounded-lg text-blue-900 placeholder-blue-400 focus:outline-none transition-colors ${formErrors.name ? 'bg-red-50 border-red-500 focus:border-red-400' : 'bg-white border-blue-300 focus:border-blue-500'}`}
                    />
                    <FieldError msg={formErrors.name} />
                  </div>
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-bold text-blue-900 mb-2">Frequency *</label>
                    <select value={formData.frequency}
                      onChange={e => setFormData(f => ({ ...f, frequency: e.target.value as AlertForm['frequency'] }))}
                      className="w-full px-4 py-3 bg-white border border-blue-300 rounded-lg text-blue-900 focus:border-blue-500 focus:outline-none">
                      <option value="DAILY">Daily</option>
                      <option value="WEEKLY">Weekly (Mondays)</option>
                      <option value="MONTHLY">Monthly (1st)</option>
                    </select>
                  </div>
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-bold text-blue-900 mb-2">
                      <Clock className="w-3.5 h-3.5 inline mr-1 text-blue-400" />
                      Delivery Time *
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <select
                        value={formData.deliveryHour}
                        onChange={e => {
                          const t = build24h(e.target.value, formData.deliveryMinute, formData.deliveryPeriod)
                          setFormData(f => ({ ...f, deliveryHour: e.target.value, deliveryTime: t }))
                        }}
                        className="w-full px-3 py-3 bg-white border border-blue-300 rounded-lg text-blue-900 focus:border-blue-500 focus:outline-none text-sm"
                      >
                        {['12','1','2','3','4','5','6','7','8','9','10','11'].map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                      <select
                        value={formData.deliveryMinute}
                        onChange={e => {
                          const t = build24h(formData.deliveryHour, e.target.value, formData.deliveryPeriod)
                          setFormData(f => ({ ...f, deliveryMinute: e.target.value, deliveryTime: t }))
                        }}
                        className="w-full px-3 py-3 bg-white border border-blue-300 rounded-lg text-blue-900 focus:border-blue-500 focus:outline-none text-sm"
                      >
                        {['00','15','30','45'].map(m => (
                          <option key={m} value={m}>:{m}</option>
                        ))}
                      </select>
                      <select
                        value={formData.deliveryPeriod}
                        onChange={e => {
                          const t = build24h(formData.deliveryHour, formData.deliveryMinute, e.target.value as 'AM' | 'PM')
                          setFormData(f => ({ ...f, deliveryPeriod: e.target.value as 'AM' | 'PM', deliveryTime: t }))
                        }}
                        className="w-full px-3 py-3 bg-white border border-blue-300 rounded-lg text-blue-900 focus:border-blue-500 focus:outline-none text-sm"
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                  </div>
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-bold text-blue-900 mb-2">Max Results</label>
                    <select value={formData.maxResults}
                      onChange={e => setFormData(f => ({ ...f, maxResults: Number(e.target.value) }))}
                      className="w-full px-4 py-3 bg-white border border-blue-300 rounded-lg text-blue-900 focus:border-blue-500 focus:outline-none">
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                      <option value={250}>250</option>
                      <option value={500}>500</option>
                      <option value={1000}>All available (up to 1000)</option>
                    </select>
                  </div>
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-bold text-blue-900 mb-2">Attachment</label>
                    <select value={formData.format}
                      onChange={e => setFormData(f => ({ ...f, format: e.target.value }))}
                      className="w-full px-4 py-3 bg-white border border-blue-300 rounded-lg text-blue-900 focus:border-blue-500 focus:outline-none">
                      <option value="CSV">CSV (.csv)</option>
                      <option value="TXT">TXT tab-delimited (.txt)</option>
                      <option value="EXCEL">Excel (.xlsx)</option>
                      <option value="EXCEL_COMPACT">Excel Compact (.xlsx)</option>
                      <option value="XLSB">XLSB Binary (.xlsb)</option>
                      <option value="NONE">None</option>
                    </select>
                  </div>
                </div>
                {formData.maxResults >= 1000 && (
                  <div className="mt-3 p-3 rounded-lg border border-amber-300 bg-amber-100 text-amber-900 text-sm font-semibold">
                    Selecting <strong>All available</strong> can produce large export files. Some emails may fail due to attachment size limits.
                    For reliable delivery, narrow your search filters (keywords, NAICS, agency, state, set-aside).
                  </div>
                )}
              </div>

              {/* ── Section 2: Recipients ── */}
              <div className="pb-6 border-b border-blue-200">
                <p className="inline-flex items-center rounded-md bg-blue-700 px-3 py-1.5 text-base font-black uppercase tracking-wide text-white mb-4">Who Gets Notified</p>
                <RecipientSelector
                  recipients={formData.recipients}
                  contacts={contacts}
                  onChange={recipients => {
                    setFormData(f => ({ ...f, recipients }))
                    clearError('recipients')
                    setFormErrors(prev => {
                      const next = { ...prev }
                      Object.keys(next).forEach(k => {
                        if (k.startsWith('recipient_')) delete next[k]
                      })
                      return next
                    })
                  }}
                  errors={formErrors}
                />
              </div>

              {/* ── Section 3: Base on saved search ── */}
              {!editingId && searches.length > 0 && (
                <div className="pb-6 border-b border-blue-200">
                  <p className="inline-flex items-center rounded-md bg-blue-700 px-3 py-1.5 text-base font-black uppercase tracking-wide text-white mb-4">Base on Saved Search (Optional)</p>
                  <select value={formData.savedSearchId || ''}
                    onChange={e => {
                      const id = e.target.value
                      if (id) {
                        const s = searches.find(s => s.id === id)
                        setFormData(f => ({
                          ...f, savedSearchId: id,
                          keyword: s?.params?.keyword || s?.params?.title || f.keyword,
                          ptypes: toArray(s?.params?.ptype ?? s?.params?.ptypes),
                          states: toArray(s?.params?.state ?? s?.params?.states),
                          ncode: s?.params?.ncode || f.ncode,
                          ccode: s?.params?.ccode || f.ccode,
                          setAsides: toArray(s?.params?.setAsides ?? s?.params?.typeOfSetAside ?? s?.params?.setAside) || f.setAsides,
                          organizationName: s?.params?.organizationName || s?.params?.deptname || f.organizationName,
                        }))
                      } else {
                        setFormData(f => ({ ...f, savedSearchId: undefined }))
                      }
                    }}
                    className="w-full px-4 py-3 bg-white border border-blue-300 rounded-lg text-blue-900 focus:border-blue-500 focus:outline-none">
                    <option value="">-- Set criteria manually below --</option>
                    {searches.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              )}

              {/* ── Section 4: Search criteria ── */}
              <div>
                <p className="inline-flex items-center rounded-md bg-blue-700 px-3 py-1.5 text-base font-black uppercase tracking-wide text-white mb-4 gap-2">
                  <Filter className="w-3.5 h-3.5 text-white" /> Search Criteria
                </p>
                {preview && (
                  <div className="mb-4 px-4 py-2.5 bg-orange-100 border border-orange-300 rounded-lg text-orange-900 text-xs font-semibold">
                    <span className="text-orange-800 font-bold">Alert will match: </span>{preview}
                  </div>
                )}
                <div className="mb-4">
                  <label className="block text-sm font-bold text-blue-900 mb-2">Keywords</label>
                  <input type="text" value={formData.keyword || ''}
                    onChange={e => setFormData(f => ({ ...f, keyword: e.target.value }))}
                    placeholder="e.g., data analytics, cybersecurity"
                    className="w-full px-4 py-3 bg-white border border-blue-300 rounded-lg text-blue-900 placeholder-blue-400 focus:border-blue-500 focus:outline-none" />
                </div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="inline-flex items-center rounded-md bg-blue-700 px-3 py-1 text-sm font-black uppercase tracking-wide text-white">Core Filters</p>
                  <button
                    type="button"
                    onClick={() => setShowAdvancedFilters(v => !v)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-700 border border-blue-800 text-white font-semibold hover:bg-blue-800 transition-colors"
                  >
                    {showAdvancedFilters ? 'Hide advanced filters' : 'Show advanced filters'}
                    {showAdvancedFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-sm font-bold text-blue-900 mb-2">Procurement Type</label>
                    <MultiSelect options={PROCUREMENT_TYPE_OPTIONS} selected={formData.ptypes}
                      onChange={vals => setFormData(f => ({ ...f, ptypes: vals }))} placeholder="All Types" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-blue-900 mb-2">State</label>
                    <MultiSelect options={US_STATES} selected={formData.states}
                      onChange={vals => setFormData(f => ({ ...f, states: vals }))} placeholder="All States" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-blue-900 mb-2">Set-Aside Type</label>
                    <MultiSelect options={SET_ASIDE_CODES} selected={formData.setAsides}
                      onChange={vals => setFormData(f => ({ ...f, setAsides: vals }))} placeholder="All Set-Asides" summaryMode="line" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-blue-900 mb-2">NAICS Code</label>
                    <TokenInput value={formData.ncode || ''}
                      onChange={v => setFormData(f => ({ ...f, ncode: v }))}
                      theme="light"
                      placeholder="e.g. 541512 — Enter to add more" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-blue-900 mb-2">PSC Code</label>
                    <TokenInput value={formData.ccode || ''}
                      onChange={v => setFormData(f => ({ ...f, ccode: v }))}
                      theme="light"
                      placeholder="e.g. D399 — Enter to add more" />
                  </div>
                </div>

                {showAdvancedFilters && (
                  <div className="mt-4 p-4 rounded-xl border border-blue-300 bg-white">
                    <p className="text-base font-black text-blue-950 mb-3">Advanced Filters</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-bold text-blue-900 mb-2">Organization / Agency</label>
                        <TokenInput value={formData.organizationName || ''}
                          onChange={v => setFormData(f => ({ ...f, organizationName: v }))}
                          theme="light"
                          placeholder="e.g. Dept. of Defense — Enter to add more" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-blue-900 mb-2">Solicitation Number</label>
                        <input type="text" value={formData.solnum || ''} placeholder="e.g., W912BU-24-R-0001"
                          onChange={e => setFormData(f => ({ ...f, solnum: e.target.value }))}
                          className="w-full px-4 py-3 bg-white border border-blue-300 rounded-lg text-blue-900 placeholder-blue-400 focus:border-blue-500 focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-blue-900 mb-2">Place of Performance ZIP</label>
                        <input type="text" value={formData.zip || ''} placeholder="e.g., 22203"
                          onChange={e => setFormData(f => ({ ...f, zip: e.target.value }))}
                          className="w-full px-4 py-3 bg-white border border-blue-300 rounded-lg text-blue-900 placeholder-blue-400 focus:border-blue-500 focus:outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-blue-900 mb-2">Posted From</label>
                        <input type="date" value={formData.postedFrom || ''}
                          onChange={e => setFormData(f => ({ ...f, postedFrom: e.target.value }))}
                          className="w-full px-3 py-3 bg-white border border-blue-300 rounded-lg text-blue-900 focus:border-blue-500 focus:outline-none text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-blue-900 mb-2">Deadline By</label>
                        <input type="date" value={formData.rdlto || ''}
                          min={new Date().toISOString().split('T')[0]}
                          onChange={e => setFormData(f => ({ ...f, rdlto: e.target.value }))}
                          className="w-full px-3 py-3 bg-white border border-blue-300 rounded-lg text-blue-900 focus:border-blue-500 focus:outline-none text-sm" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Info box */}
              <div className="p-3 bg-blue-700 border border-blue-800 rounded-lg text-sm text-white">
                <span className="font-bold text-orange-200">How it works: </span>
                This alert runs {formData.frequency.toLowerCase()} at {formData.deliveryHour}:{formData.deliveryMinute} {formData.deliveryPeriod}{' '}
                and notifies{' '}
                <span className="font-bold text-white">
                  {configuredRecipients.length} recipient{configuredRecipients.length !== 1 ? 's' : ''}
                </span>{' '}
                via {recipientChannelSummary}.
              </div>
            </div>

            {/* Save / Cancel */}
            <div className="flex flex-row justify-end gap-3 mt-6">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-3 min-w-[140px] bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 disabled:opacity-60 text-white font-black rounded-xl transition-all shadow-lg hover:shadow-xl shadow-orange-900/30 flex items-center justify-center gap-2 text-base"
              >
                {saving
                  ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving…</>
                  : (editingId ? 'Update Alert' : 'Create Alert')}
              </button>
              <button
                onClick={() => { setShowForm(false); setEditingId(null); resetForm() }}
                className="px-6 py-3 min-w-[120px] bg-blue-100 hover:bg-blue-200 text-blue-900 border border-blue-300 font-semibold rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ── ALERTS LIST ── */}
        <div className="mt-7 mb-3 flex items-center justify-between gap-3">
          <h3 className="text-xl font-black text-blue-950">Saved Alerts</h3>
          <span className="inline-flex items-center rounded-full bg-blue-700 px-3 py-1 text-sm font-black text-white border border-blue-800">
            {visibleAlerts.length} total
          </span>
        </div>

        {visibleAlerts.length === 0 ? (
          <div className="text-center text-blue-900 py-20 bg-white border-2 border-blue-300 rounded-2xl">
            <div className="w-20 h-20 rounded-2xl bg-blue-50 border border-blue-300 flex items-center justify-center mx-auto mb-5">
              <BellRing className="w-10 h-10 text-blue-500" />
            </div>
            <p className="text-2xl font-black text-blue-900 mb-2">No alert subscriptions yet</p>
            <p className="text-lg text-blue-700 mb-6 max-w-sm mx-auto font-semibold">Create automated alerts to get search results delivered to your inbox on a schedule</p>
            <button onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition-colors shadow-lg text-base">
              <Plus className="w-4 h-4" /> Create your first alert
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleAlerts.map((alert, index) => {
              const recipients = Array.isArray(alert.recipientsList) && alert.recipientsList.length
                ? alert.recipientsList
                : stringToRecipients(typeof alert.recipients === 'string' ? alert.recipients : '')

              return (
                <div
                  key={alert.id}
                  data-alert-name={alert.name}
                  className="rounded-xl border-2 border-blue-300 bg-white p-5 shadow-md"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <p className="text-blue-700 text-sm font-black uppercase tracking-wider">Alert #{index + 1}</p>
                      <h3 className="text-blue-950 text-2xl font-black truncate mt-0.5">{alert.name}</h3>
                      <div className="mt-1 text-base text-blue-900 font-bold flex flex-wrap gap-x-4 gap-y-1">
                        <span>{alert.frequency}</span>
                        <span>{formatDeliveryTime(alert.deliveryTime)}</span>
                        <span>{recipients.length} recipient{recipients.length === 1 ? '' : 's'}</span>
                        <span className={alert.isActive ? 'text-emerald-700' : 'text-blue-700'}>
                          {alert.isActive ? 'Active' : 'Paused'}
                        </span>
                      </div>
                      {alert.params?.keyword && (
                        <p className="mt-1.5 text-base text-blue-800 truncate font-semibold">
                          <span className="font-black">Keyword:</span> {alert.params.keyword}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      <button
                        type="button"
                        onClick={() => handleRunNow(alert.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-base font-bold transition-colors"
                      >
                        <Play className="w-4 h-4" /> Run
                      </button>
                      <button
                        type="button"
                        onClick={() => handleShareNow(alert.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-base font-bold transition-colors"
                      >
                        <Share2 className="w-4 h-4" /> Share
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEditAlert(alert)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-base font-bold transition-colors"
                      >
                        <Edit3 className="w-4 h-4" /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadAlert(alert)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-900 border border-blue-300 text-base font-bold transition-colors"
                      >
                        <Download className="w-4 h-4" /> Download
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAlert(alert.id, alert.name)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-base font-bold transition-colors"
                      >
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        </>

      {/* Pre-Run Confirmation Modal */}
      {pendingSend && (
        <RunAlertModal
          isOpen={true}
          alertName={pendingSend.alertName}
          resultCount={pendingSend.resultCount}
          alertDetails={{
            recipients: pendingSend.recipientsList,
            frequency: '',
            defaultFormat: pendingSend.defaultFormat,
            keywords: pendingSend.keywords,
            naics: pendingSend.naics,
            agency: pendingSend.agency,
            setAside: pendingSend.setAside,
          }}
          addressBookContacts={contacts}
          isRunning={false}
          onRun={(formats, extraRecipients) => handleSendEmail(formats, extraRecipients)}
          onSkip={() => setPendingSend(null)}
          onClose={() => setPendingSend(null)}
        />
      )}

      {/* Running Alert Modal */}
      {runningAlertId && !runResult && (() => {
        const runningAlert = alerts.find(a => a.id === runningAlertId)
        return (
          <div className="fixed inset-0 bg-black/45 flex items-center justify-center z-50">
            <div className="bg-white border border-blue-300 rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl">
              <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-5" />
              <p className="text-blue-900 font-black text-xl mb-2">Running Alert</p>
              {runningAlert && (
                <p className="text-orange-700 font-bold mb-3 truncate">&quot;{runningAlert.name}&quot;</p>
              )}
              <p className="text-blue-700 text-sm">Searching SAM.gov and preparing delivery…</p>
            </div>
          </div>
        )
      })()}

      {/* Run Result Modal */}
      {runResult && (
        <AlertSuccessModal
          isOpen={true}
          alertName={runResult.alertName}
          status={runResult.status}
          resultCount={runResult.resultCount}
          emailSent={runResult.emailSent}
          errorMessage={runResult.errorMessage}
          recipients={runResult.recipients}
          format={runResult.format}
          searchCriteria={runResult.searchCriteria}
          onClose={() => setRunResult(null)}
        />
      )}

      <style jsx global>{`
        .manage-alerts-page {
          font-family: Aptos, "Segoe UI", "Trebuchet MS", Arial, sans-serif;
          color: #0b2a66;
          font-size: 19px;
        }

        .manage-alerts-page .alert-form-surface {
          color: #0f172a;
          background: #ffffff;
        }
        .manage-alerts-page .alert-form-surface h2,
        .manage-alerts-page .alert-form-surface h3,
        .manage-alerts-page .alert-form-surface label,
        .manage-alerts-page .alert-form-surface p,
        .manage-alerts-page .alert-form-surface span {
          font-weight: 700;
        }
        .manage-alerts-page .alert-form-surface input,
        .manage-alerts-page .alert-form-surface select,
        .manage-alerts-page .alert-form-surface textarea {
          color: #0f172a !important;
          font-weight: 700;
          background-color: #ffffff;
        }
        .manage-alerts-page .alert-form-surface input::placeholder,
        .manage-alerts-page .alert-form-surface textarea::placeholder {
          color: rgb(71 85 105) !important;
        }

        .manage-alerts-page .quick-search-light [class*='bg-slate-9'],
        .manage-alerts-page .quick-search-light [class*='bg-slate-8'],
        .manage-alerts-page .quick-search-light [class*='bg-slate-7'],
        .manage-alerts-page .quick-search-light [class*='bg-slate-6'] {
          background-color: #ffffff !important;
        }
        .manage-alerts-page .quick-search-light [class*='text-slate-'] {
          color: #1e3a8a !important;
          opacity: 1 !important;
        }
        .manage-alerts-page .quick-search-light .text-white {
          color: #ffffff !important;
        }
        .manage-alerts-page .quick-search-light [class*='border-slate-'] {
          border-color: #93c5fd !important;
        }
        .manage-alerts-page .quick-search-light input::placeholder {
          color: rgb(71 85 105) !important;
        }
        .manage-alerts-page .quick-search-light [class*='bg-slate-7/'],
        .manage-alerts-page .quick-search-light [class*='bg-slate-8/'],
        .manage-alerts-page .quick-search-light [class*='bg-slate-9/'] {
          background-color: #dbeafe !important;
        }
        .manage-alerts-page .quick-search-light .text-orange-300,
        .manage-alerts-page .quick-search-light .text-orange-200 {
          color: #9a3412 !important;
        }

        .manage-alerts-page label {
          font-size: 1.12rem;
          letter-spacing: 0.01em;
          color: #0b2a66;
        }

        .manage-alerts-page input,
        .manage-alerts-page select,
        .manage-alerts-page textarea,
        .manage-alerts-page button {
          letter-spacing: 0.005em;
          font-size: 1.1rem;
        }
        .manage-alerts-page .text-base { font-size: 1.24rem; line-height: 1.78rem; }
        .manage-alerts-page .text-sm { font-size: 1.15rem; line-height: 1.68rem; }
        .manage-alerts-page .text-xs { font-size: 1.05rem; line-height: 1.55rem; }
      `}</style>

      </div>
    </div>
  )
}

export default function ManageAlertsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#d1d5db' }}>
        <div className="animate-spin h-12 w-12 border-4 border-orange-500 border-t-transparent rounded-full" />
      </div>
    }>
      <ManageAlertsContent />
    </Suspense>
  )
}
