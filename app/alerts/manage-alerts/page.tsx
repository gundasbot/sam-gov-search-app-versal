// app/alerts/manage-alerts/page.tsx
'use client'
import { AlertSuccessModal } from '@/components/Aletsuccessmodal'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import {
  BellRing, Plus, Edit3, Trash2, Play, Download, Mail, X, Pause, PlayCircle,
  Calendar, Clock, Check, Filter, ChevronDown, ChevronUp, ArrowLeft,
  User, Users, UserPlus, Phone, MessageSquare, AlertCircle,
  BookUser, Search, Save, Building2, Upload, Bookmark,
} from 'lucide-react'
import { useEffect, useState, useRef, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import QuickSearchPanel, { type QuickSearchParams } from '@/components/QuickSearchPanel'
import TokenInput from '@/components/TokenInput'
import { RunAlertModal } from '@/components/Runalertmodal'
import { ContactImportModal } from '@/components/ContactImportModal'
import { getPersonalizedGreeting, getTimeOfDayEmoji } from '@/lib/greeting'

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

const RECIPIENT_ROLES = [
  'Primary Contact', 'Decision Maker', 'Capture Manager', 'Business Development',
  'Contracts Manager', 'Program Manager', 'Executive', 'Other',
]

// ---------------------------------------------------------------------------
// Inline error display helper
// ---------------------------------------------------------------------------
function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return (
    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-400 font-medium">
      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
      {msg}
    </p>
  )
}

// ---------------------------------------------------------------------------
// Multi-Select Dropdown
// ---------------------------------------------------------------------------
interface MultiSelectOption { value: string; label: string }

function MultiSelect({
  options, selected, onChange, placeholder = 'Any',
}: { options: MultiSelectOption[]; selected: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
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
  const label = selected.length === 0 ? placeholder
    : selected.length === 1 ? (options.find(o => o.value === selected[0])?.label ?? selected[0])
    : `${selected.length} selected`

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => { setOpen(o => !o); setSearch('') }}
        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-left text-sm focus:outline-none focus:border-orange-400 flex items-center justify-between gap-2 min-h-[38px]">
        <span className={selected.length === 0 ? 'text-slate-400' : 'text-white truncate'}>{label}</span>
        <div className="flex items-center gap-1 flex-shrink-0">
          {selected.length > 0 && (
            <span onClick={e => { e.stopPropagation(); onChange([]) }} className="text-slate-400 hover:text-red-400 cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>
      {selected.length > 1 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {selected.map(v => (
            <span key={v} className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-900/40 border border-orange-700/50 rounded-md text-xs font-medium text-orange-300">
              {options.find(o => o.value === v)?.label ?? v}
              <button type="button" onClick={() => toggle(v)} className="hover:text-red-400 ml-0.5"><X className="w-3 h-3" /></button>
            </span>
          ))}
        </div>
      )}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-slate-800 border border-slate-600 rounded-xl shadow-2xl overflow-hidden">
          {options.length > 5 && (
            <div className="p-2 border-b border-slate-700">
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search…" autoFocus
                className="w-full px-2.5 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-xs placeholder-slate-500 focus:outline-none focus:border-orange-400" />
            </div>
          )}
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0
              ? <div className="px-3 py-3 text-xs text-slate-500 text-center">No matches</div>
              : filtered.map(o => (
                <button key={o.value} type="button" onClick={() => toggle(o.value)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-slate-700/80 flex items-center gap-2.5">
                  <span className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${selected.includes(o.value) ? 'bg-orange-500 border-orange-500' : 'border-slate-500 bg-slate-800'}`}>
                    {selected.includes(o.value) && <Check className="w-2.5 h-2.5 text-white" />}
                  </span>
                  <span className={selected.includes(o.value) ? 'text-orange-300 font-medium' : 'text-slate-200'}>{o.label}</span>
                </button>
              ))}
          </div>
          {selected.length > 0 && (
            <div className="border-t border-slate-700 p-2">
              <button type="button" onClick={() => { onChange([]); setOpen(false) }}
                className="w-full text-xs text-slate-400 hover:text-red-400 py-1 text-center">
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

  const realRecipients = recipients.filter(r => r.email || r.phone)
  const emailsInUse = new Set(realRecipients.map(r => r.email).filter(Boolean))

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
    if (!e || !e.includes('@') || emailsInUse.has(e)) return
    onChange([...realRecipients, { ...makeRecipient(), email: e }])
    setOneOffEmail('')
  }

  return (
    <div className="space-y-3">
      {errors.recipients && (
        <div className="px-3 py-2.5 bg-red-950/40 border border-red-500/50 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-300 font-medium">{errors.recipients}</p>
        </div>
      )}

      {/* Read-only selected recipients */}
      <div className="space-y-1.5">
        {realRecipients.map(r => (
          <div key={r.id} className="flex items-center gap-2.5 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg">
            <Mail className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
            <span className="text-sm text-white flex-1 truncate">
              {[r.firstName, r.lastName].filter(Boolean).join(' ') || r.email}
            </span>
            {(r.firstName || r.lastName) && (
              <span className="text-xs text-slate-500 truncate max-w-[180px]">{r.email}</span>
            )}
            <button type="button" onClick={() => removeRecipient(r.email)}
              className="text-slate-500 hover:text-red-400 transition-colors flex-shrink-0">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        {realRecipients.length === 0 && (
          <p className="text-sm text-slate-500 italic px-1">
            {contacts.length === 0
              ? 'Add contacts in the Contacts tab, then select them here.'
              : 'No recipients yet — select from address book or type an email below.'}
          </p>
        )}
      </div>

      {/* Address book picker (collapsible) */}
      {contacts.length > 0 && (
        <div className="border border-slate-700 rounded-xl overflow-hidden">
          <button type="button" onClick={() => setPickerOpen(p => !p)}
            className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-800 hover:bg-slate-700/80 text-sm font-semibold text-slate-300 transition-colors">
            <span className="flex items-center gap-2">
              <BookUser className="w-4 h-4 text-orange-400" />
              From Address Book
              {realRecipients.length > 0 && (
                <span className="text-xs bg-orange-600/30 text-orange-300 border border-orange-600/40 px-1.5 py-0.5 rounded-full font-normal">
                  {realRecipients.length} added
                </span>
              )}
            </span>
            {pickerOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </button>

          {pickerOpen && (
            <div className="border-t border-slate-700 bg-slate-900/60 p-3 space-y-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search by name, email, or org…"
                  className="w-full pl-8 pr-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-400 transition-colors" />
              </div>
              <div className="max-h-52 overflow-y-auto space-y-0.5">
                {filtered.length === 0 ? (
                  <p className="text-xs text-slate-500 italic text-center py-3">
                    {search ? 'No contacts match' : 'No contacts in address book'}
                  </p>
                ) : filtered.map(c => {
                  const added = emailsInUse.has(c.email)
                  const name = [c.firstName, c.lastName].filter(Boolean).join(' ') || c.email
                  return (
                    <button key={c.id} type="button" onClick={() => toggleContact(c)}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors ${added ? 'bg-emerald-900/20 border border-emerald-700/30' : 'hover:bg-slate-700/60'}`}>
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${added ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600'}`}>
                        {added && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium truncate">{name}</p>
                        {name !== c.email && <p className="text-xs text-slate-500 truncate">{c.email}</p>}
                        {c.organization && <p className="text-xs text-slate-600 truncate">{c.organization}</p>}
                      </div>
                    </button>
                  )
                })}
              </div>
              {filtered.length > 0 && (
                <div className="flex justify-between pt-1 border-t border-slate-700/50">
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
                  }} className="text-xs text-orange-400 hover:text-orange-300 font-semibold transition-colors">
                    Select All ({filtered.length})
                  </button>
                  {realRecipients.length > 0 && (
                    <button type="button" onClick={() => onChange([makeRecipient()])}
                      className="text-xs text-slate-500 hover:text-white transition-colors">
                      Clear All
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* One-off email input */}
      <div className="flex gap-2">
        <input type="email" value={oneOffEmail} onChange={e => setOneOffEmail(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addOneOff() } }}
          placeholder={contacts.length > 0 ? 'Or type an email address…' : 'Add email address…'}
          className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-orange-400 transition-colors" />
        <button type="button" onClick={addOneOff}
          className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm font-semibold transition-colors">
          Add
        </button>
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

interface SavedSearch { id: string; name: string; params?: Record<string, any> }

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

function toArray(val: any): string[] {
  if (!val) return []
  if (Array.isArray(val)) return val.filter(Boolean)
  return String(val).split(',').map((s: string) => s.trim()).filter(Boolean)
}

// Convert stored 24h "HH:MM" → 12h parts for dropdowns
function parse24h(time: string): { hour: string; minute: string; period: 'AM' | 'PM' } {
  const [hStr = '9', mStr = '00'] = time.split(':')
  let h = parseInt(hStr, 10)
  const period: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM'
  if (h === 0) h = 12
  else if (h > 12) h = h - 12
  return { hour: String(h), minute: mStr.padStart(2, '0'), period }
}

// Convert 12h parts → stored 24h "HH:MM"
function build24h(hour: string, minute: string, period: 'AM' | 'PM'): string {
  let h = parseInt(hour, 10)
  if (period === 'AM' && h === 12) h = 0
  else if (period === 'PM' && h !== 12) h += 12
  return `${String(h).padStart(2, '0')}:${minute}`
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
function ManageAlertsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { data: session } = useSession()
  const formRef = useRef<HTMLDivElement>(null)

  const [alerts, setAlerts] = useState<AlertSubscription[]>([])
  const [searches, setSearches] = useState<SavedSearch[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<AlertForm>(() => ({ ...makeEmptyForm(), recipients: [makeRecipient()] }))
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [showDownloadModal, setShowDownloadModal] = useState(false)
  const [downloadAlertId, setDownloadAlertId] = useState<string | null>(null)
  const [expandedAlerts, setExpandedAlerts] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [runningAlertId, setRunningAlertId] = useState<string | null>(null)
  const [runResult, setRunResult] = useState<RunResultData | null>(null)
  const [pendingSend, setPendingSend] = useState<{
    alertId: string; alertName: string; runId: string; resultCount: number
    recipientsList: Recipient[]; defaultFormat: string
    keywords?: string; naics?: string; agency?: string; setAside?: string
  } | null>(null)
  const [activeTab, setActiveTab] = useState<'alerts' | 'contacts'>('alerts')
  const [contactSearch, setContactSearch] = useState('')
  const [showAddContactForm, setShowAddContactForm] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)

  // Address book state
  const [contacts, setContacts] = useState<AddressBookContact[]>([])
  const [abSearch, setAbSearch] = useState('')
  const [abLoading, setAbLoading] = useState(false)
  const [abAddOpen, setAbAddOpen] = useState(false)
  const [abNewContact, setAbNewContact] = useState({ email: '', firstName: '', lastName: '', organization: '', phone: '', notes: '' })
  const [abSaving, setAbSaving] = useState(false)
  const [abSaveSuccess, setAbSaveSuccess] = useState(false)
  const [abEditId, setAbEditId] = useState<string | null>(null)
  const [abEditData, setAbEditData] = useState<Partial<AddressBookContact>>({})
  const [abEditSaving, setAbEditSaving] = useState(false)
  const [abDeleteId, setAbDeleteId] = useState<string | null>(null)

  // Pre-fill from URL params
  useEffect(() => {
    if (!searchParams) return
    const isNew = searchParams.get('new') === '1' || searchParams.get('_new') === '1'
    if (!isNew) return
    const kw = searchParams.get('title') || searchParams.get('keyword') || ''
    setFormData({
      name: kw ? `${kw} Alert` : 'New Alert',
      frequency: 'DAILY', deliveryTime: '09:00', deliveryHour: '9', deliveryMinute: '00', deliveryPeriod: 'AM',
      recipients: [makeRecipient()],
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
    window.history.replaceState({}, '', '/alerts/manage-alerts')
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100)
  }, [searchParams])

  useEffect(() => { loadData(); loadContacts() }, [])

  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }, [])

  const loadData = async () => {
    try {
      const [aRes, sRes] = await Promise.all([
        fetch('/api/alert-subscriptions'),
        fetch('/api/saved-searches'),
      ])
      const aData = await aRes.json()
      const sData = await sRes.json()
      setAlerts(Array.isArray(aData) ? aData : [])
      // saved-searches API returns { success, searches } or array
      const searchArr = Array.isArray(sData) ? sData : (Array.isArray(sData?.searches) ? sData.searches : [])
      setSearches(searchArr)
    } catch {
      setAlerts([]); setSearches([])
    } finally {
      setLoading(false)
    }
  }

  const loadContacts = async () => {
    setAbLoading(true)
    try {
      const res = await fetch('/api/address-book')
      const data = await res.json()
      setContacts(Array.isArray(data) ? data : [])
    } catch { setContacts([]) }
    finally { setAbLoading(false) }
  }

  const handleAddContact = async (contact: Omit<AddressBookContact, 'id' | 'useCount' | 'createdAt'>): Promise<boolean> => {
    const res = await fetch('/api/address-book', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contact),
    })
    if (res.ok) { const created = await res.json(); setContacts(prev => [created, ...prev]); showToast('Contact added!'); return true }
    else { showToast('Failed to add contact.', 'error'); return false }
  }

  const handleUpdateContact = async (id: string, data: Partial<AddressBookContact>) => {
    const res = await fetch(`/api/address-book/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) { const updated = await res.json(); setContacts(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c)); showToast('Contact updated!') }
    else showToast('Failed to update contact.', 'error')
  }

  const handleDeleteContact = async (id: string) => {
    const res = await fetch(`/api/address-book/${id}`, { method: 'DELETE' })
    if (res.ok) { setContacts(prev => prev.filter(c => c.id !== id)); showToast('Contact deleted.') }
    else showToast('Failed to delete contact.', 'error')
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete alert "${name}"?`)) return
    const res = await fetch(`/api/alert-subscriptions/${id}`, { method: 'DELETE' })
    if (res.ok) { setAlerts(prev => prev.filter(a => a.id !== id)); showToast(`"${name}" deleted.`) }
    else showToast('Failed to delete.', 'error')
  }

  // Phase 1: run search only, get result count, then show send modal
  const handleRunSearch = async (id: string) => {
    setRunningAlertId(id)
    try {
      const res = await fetch(`/api/alert-subscriptions/${id}/run-now`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sendEmailNow: false }),
      })
      const r = await res.json()
      const alert = alerts.find(a => a.id === id)
      const recipList: Recipient[] = alert?.recipientsList?.length
        ? alert.recipientsList
        : stringToRecipients(alert?.recipients || '')

      if (!res.ok) {
        showToast(r.error || 'Failed to run alert.', 'error')
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
      loadData()
    } catch {
      showToast('Network error — could not reach the server.', 'error')
    } finally {
      setRunningAlertId(null)
    }
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
      const r = await res.json()
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
    } finally {
      setRunningAlertId(null)
    }
  }

  const toggleActive = async (id: string, isActive: boolean) => {
    // UPDATED: Use /toggle endpoint
    const endpoint = `/api/alert-subscriptions/${id}/toggle`
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !isActive }),
    })
    if (res.ok) { setAlerts(prev => prev.map(a => a.id === id ? { ...a, isActive: !isActive } : a)); showToast(isActive ? 'Alert paused.' : 'Alert activated.') }
    else showToast('Failed to update.', 'error')
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
      if (r.channels.includes('email') && !r.email) {
        errors[`recipient_${r.id}_email`] = 'Email address is required when the Email channel is enabled.'
      } else if (r.email && !isValidEmail(r.email)) {
        errors[`recipient_${r.id}_email`] = 'Please enter a valid email address.'
      }

      if (r.channels.includes('sms') && !r.phone) {
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
        const e = await res.json(); showToast(e.error || 'Failed to save.', 'error')
      }
    } catch { showToast('Failed to save.', 'error') }
    finally { setSaving(false) }
  }

  const resetForm = () => {
    setFormData({ ...makeEmptyForm(), recipients: [makeRecipient()] })
    setFormErrors({})
  }

  const toggleExpanded = (id: string) =>
    setExpandedAlerts(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  const buildPreview = () => {
    const parts: string[] = []
    if (formData.keyword) parts.push(`"${formData.keyword}"`)
    if (formData.ncode) parts.push(`NAICS ${formData.ncode}`)
    if (formData.ccode) parts.push(`PSC ${formData.ccode}`)
    if (formData.solnum) parts.push(`Solicit. ${formData.solnum}`)
    if (formData.states.length) parts.push(formData.states.map(v => US_STATES.find(s => s.value === v)?.label ?? v).join(', '))
    if (formData.setAsides.length) parts.push(formData.setAsides.map(v => SET_ASIDE_CODES.find(s => s.value === v)?.label ?? v).join(', '))
    if (formData.organizationName) parts.push(formData.organizationName)
    if (formData.zip) parts.push(`ZIP ${formData.zip}`)
    return parts.join(' · ')
  }

  const bg = 'linear-gradient(135deg, #0a0f1e 0%, #0f172a 20%, #131c2e 40%, #1a2332 60%, #111827 80%, #0a0f1e 100%)'

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: bg }}>
      <div className="text-white text-center">
        <div className="animate-spin h-12 w-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-lg">Loading…</p>
      </div>
    </div>
  )

  const activeCount = alerts.filter(a => a.isActive).length
  const pausedCount = alerts.filter(a => !a.isActive).length
  const preview = buildPreview()
  const hasErrors = Object.keys(formErrors).length > 0

  return (
    <div style={{ background: bg }} className="min-h-screen">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[100] px-5 py-3 rounded-xl shadow-xl font-semibold text-sm flex items-center gap-2 ${toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'} text-white`}>
          {toast.type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      <div className="max-w-[1920px] mx-auto px-3 sm:px-6 lg:px-8 py-8">

        {/* ── Back navigation with Action Button ─────────────────────────── */}
        <div className="flex justify-between items-center gap-4 mb-6">
          <Link
            href="/alerts"
            className="inline-flex items-center gap-2 px-5 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-base font-black transition-all group shadow-md"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> Alerts Hub
          </Link>

          {/* Right: Manage Searches Button */}
          <Link
            href="/alerts/manage-searches"
            className="px-6 py-3 bg-gradient-to-r from-teal-600 to-teal-500 text-white font-black rounded-xl hover:from-teal-700 hover:to-teal-600 flex items-center gap-3 shadow-lg hover:shadow-xl transition-all transform hover:scale-105 text-sm"
          >
            <Bookmark className="w-4 h-4" />
            <div className="text-left">
              <div>Manage Searches</div>
            </div>
          </Link>
        </div>

        {/* ── Hero ─────────────────────────────────────────────────── */}
        <div className="text-center mb-10 relative">
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-48 bg-gradient-to-r from-orange-900/0 via-orange-700/10 to-orange-900/0 blur-3xl pointer-events-none rounded-full" />

          <h1 className="text-5xl sm:text-6xl font-black mb-4 leading-tight">
            <span className="text-3xl sm:text-4xl mr-2">{getTimeOfDayEmoji()}</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-300 via-amber-400 to-orange-400">
              {getPersonalizedGreeting(session?.user?.name)}
            </span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-300 to-yellow-400">

            </span>
          </h1>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Create automated email alerts, manage your recipient contacts, and receive scheduled delivery of the latest government contract opportunities.
          </p>
        </div>

        {/* ── Page Navigation ───────────────────────────────────── */}
        <div className="flex justify-between items-start gap-4 mb-8">
          {/* Left: Alert & Saved Searches tabs */}
          <div className="flex items-center gap-1 bg-slate-800/70 border border-slate-700 rounded-2xl p-1.5 w-fit shadow-lg">
            <Link
              href="/alerts/manage-searches"
              className="px-5 py-2.5 text-slate-400 hover:text-white hover:bg-slate-700 font-bold rounded-xl text-sm flex items-center gap-2 transition-colors"
            >
              <Search className="w-4 h-4" /> Saved Searches
            </Link>
            <button
              onClick={() => setActiveTab('alerts')}
              className={`px-5 py-2.5 font-bold rounded-xl text-sm flex items-center gap-2 transition-colors ${activeTab === 'alerts' ? 'bg-orange-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
            >
              <BellRing className="w-4 h-4" /> Alert Subscriptions
              {alerts.length > 0 && (
                <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-black ${activeTab === 'alerts' ? 'bg-orange-500/50' : 'bg-slate-700'}`}>{alerts.length}</span>
              )}
            </button>
          </div>

          {/* Right: Contacts tab (detached) */}
          <div className="flex items-center gap-4 flex-wrap">
            <Link
              href="/alerts/manage-searches"
              className="px-6 py-3 bg-gradient-to-r from-teal-600 to-teal-500 text-white font-black rounded-xl hover:from-teal-700 hover:to-teal-600 flex items-center gap-3 shadow-lg hover:shadow-xl transition-all transform hover:scale-105 text-sm"
            >
              <Bookmark className="w-4 h-4" />
              <div className="text-left">
                <div>Manage Searches</div>
              </div>
            </Link>
            <button
              onClick={() => { setActiveTab('contacts'); if (!contacts.length) loadContacts() }}
              className={`px-6 py-3 font-black rounded-xl text-sm flex items-center gap-3 transition-all transform hover:scale-105 shadow-lg ${activeTab === 'contacts' ? 'bg-gradient-to-r from-teal-600 to-teal-500 text-white hover:from-teal-700 hover:to-teal-600' : 'bg-gradient-to-r from-slate-700 to-slate-600 text-slate-200 hover:from-slate-600 hover:to-slate-500'}`}
            >
              <BookUser className="w-4 h-4" />
              <div className="text-left">
                <div>Manage Contacts</div>
                {contacts.length > 0 && (
                  <div className="text-xs font-normal opacity-90">{contacts.length} contacts</div>
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Header */}
        <div className="flex justify-between items-start mb-8 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              {activeTab === 'alerts' ? (
                <>
                  <h1 className="text-4xl font-black tracking-tight">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400">Alert Subscriptions</span>
                  </h1>
                  {alerts.length > 0 && (
                    <span className="px-3 py-1 bg-orange-600/20 text-orange-300 rounded-full text-sm font-bold border border-orange-500/30">{alerts.length}</span>
                  )}
                </>
              ) : (
                <>
                  <h1 className="text-4xl font-black tracking-tight">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">Manage Contacts</span>
                  </h1>
                  {contacts.length > 0 && (
                    <span className="px-3 py-1 bg-teal-600/20 text-teal-300 rounded-full text-sm font-bold border border-teal-500/30">{contacts.length}</span>
                  )}
                </>
              )}
            </div>
            {activeTab === 'alerts' ? (
              <>
                <p className="text-slate-300 ml-8 text-base mb-2">Automated email &amp; SMS delivery of search results on your schedule</p>
                {alerts.length > 0 && (
                  <div className="ml-8 flex gap-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/15 border border-emerald-500/25 rounded-full text-sm text-emerald-300 font-bold">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />{activeCount} active
                    </span>
                    {pausedCount > 0 && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-700/50 border border-slate-600 rounded-full text-sm text-slate-400 font-bold">
                        <span className="w-1.5 h-1.5 bg-slate-500 rounded-full" />{pausedCount} paused
                      </span>
                    )}
                  </div>
                )}
              </>
            ) : (
              <p className="text-slate-300 ml-8 text-base">Reusable contacts for your alert recipients — linked across all alerts</p>
            )}
          </div>
          {activeTab === 'alerts' ? (
            <button
              onClick={() => { setShowForm(f => !f); setEditingId(null); resetForm() }}
              className="px-5 py-2.5 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-bold rounded-xl flex items-center gap-2 text-sm transition-all shadow-lg hover:shadow-xl shadow-orange-900/30"
            >
              {showForm && !editingId ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showForm && !editingId ? 'Cancel' : 'New Alert'}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowImportModal(true)}
                className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl flex items-center gap-2 text-sm transition-colors"
              >
                <Upload className="w-4 h-4" /> Import from SAM.gov
              </button>
              <button
                onClick={() => { setShowAddContactForm(f => !f); setAbNewContact({ email: '', firstName: '', lastName: '', organization: '', phone: '', notes: '' }) }}
                className="px-5 py-2.5 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 text-white font-bold rounded-xl flex items-center gap-2 text-sm transition-all shadow-lg hover:shadow-xl shadow-orange-900/30"
              >
                {showAddContactForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {showAddContactForm ? 'Cancel' : 'Add Contact'}
              </button>
            </div>
          )}
        </div>

        {/* ── FORM ─────────────────────────────────────────────────────── */}
        {activeTab === 'alerts' && (<>
        {/* ── Quick Search Panel ── */}
        <QuickSearchPanel
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
            setShowForm(true)
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
        />

        {showForm && (
          <div ref={formRef} className={`bg-slate-800/60 border rounded-2xl p-7 mb-8 shadow-2xl shadow-black/30 transition-colors max-w-4xl mx-auto ${hasErrors ? 'border-red-500/40' : 'border-orange-600/30'}`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <BellRing className="w-5 h-5 text-orange-400" />
                {editingId ? 'Edit Alert' : 'Create New Alert'}
              </h2>
              <button onClick={() => { setShowForm(false); setEditingId(null); resetForm() }} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Summary error banner */}
            {hasErrors && (
              <div className="mb-6 px-4 py-3 bg-red-950/50 border border-red-500/60 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-300 font-bold text-sm">Please fix the following before saving:</p>
                  <ul className="mt-1 space-y-0.5">
                    {Object.values(formErrors).map((msg, i) => (
                      <li key={i} className="text-red-400 text-xs">• {msg}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="space-y-6">

              {/* ── Section 1: Alert basics ── */}
              <div className="pb-6 border-b border-slate-700">
                <p className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-4">Alert Settings</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-white mb-2">
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
                      className={`w-full px-4 py-3 border rounded-lg text-white placeholder-slate-400 focus:outline-none transition-colors ${formErrors.name ? 'bg-red-950/20 border-red-500 focus:border-red-400' : 'bg-slate-700 border-slate-600 focus:border-orange-400'}`}
                    />
                    <FieldError msg={formErrors.name} />
                  </div>

                  <div className="flex flex-wrap gap-4 items-end">
                    <div className="w-44">
                      <label className="block text-sm font-bold text-white mb-2">Frequency *</label>
                      <select value={formData.frequency}
                        onChange={e => setFormData(f => ({ ...f, frequency: e.target.value as any }))}
                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-orange-400 focus:outline-none">
                        <option value="DAILY">Daily</option>
                        <option value="WEEKLY">Weekly (Mondays)</option>
                        <option value="MONTHLY">Monthly (1st)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-white mb-2">
                        <Clock className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
                        Delivery Time *
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={formData.deliveryHour}
                          onChange={e => {
                            const t = build24h(e.target.value, formData.deliveryMinute, formData.deliveryPeriod)
                            setFormData(f => ({ ...f, deliveryHour: e.target.value, deliveryTime: t }))
                          }}
                          className="flex-1 px-3 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-orange-400 focus:outline-none text-sm"
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
                          className="w-20 px-3 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-orange-400 focus:outline-none text-sm"
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
                          className="w-20 px-3 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-orange-400 focus:outline-none text-sm"
                        >
                          <option value="AM">AM</option>
                          <option value="PM">PM</option>
                        </select>
                      </div>
                    </div>
                    <div className="w-36">
                      <label className="block text-sm font-bold text-white mb-2">Max Results</label>
                      <select value={formData.maxResults}
                        onChange={e => setFormData(f => ({ ...f, maxResults: Number(e.target.value) }))}
                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-orange-400 focus:outline-none">
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                        <option value={250}>250</option>
                        <option value={500}>500</option>
                      </select>
                    </div>
                    <div className="w-44">
                      <label className="block text-sm font-bold text-white mb-2">Attachment</label>
                      <select value={formData.format}
                        onChange={e => setFormData(f => ({ ...f, format: e.target.value }))}
                        className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-orange-400 focus:outline-none">
                        <option value="CSV">CSV (.csv)</option>
                        <option value="TXT">TXT tab-delimited (.txt)</option>
                        <option value="EXCEL">Excel (.xlsx)</option>
                        <option value="EXCEL_COMPACT">Excel Compact (.xlsx)</option>
                        <option value="XLSB">XLSB Binary (.xlsb)</option>
                        <option value="NONE">None</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Section 2: Recipients ── */}
              <div className="pb-6 border-b border-slate-700">
                <p className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-4">Who Gets Notified</p>
                <RecipientSelector
                  recipients={formData.recipients}
                  contacts={contacts}
                  onChange={recipients => setFormData(f => ({ ...f, recipients }))}
                  errors={formErrors}
                />
              </div>

              {/* ── Section 3: Base on saved search ── */}
              {!editingId && searches.length > 0 && (
                <div className="pb-6 border-b border-slate-700">
                  <p className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-4">Base on Saved Search (Optional)</p>
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
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-orange-400 focus:outline-none">
                    <option value="">-- Set criteria manually below --</option>
                    {searches.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              )}

              {/* ── Section 4: Search criteria ── */}
              <div>
                <p className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-orange-400" /> Search Criteria
                </p>
                {preview && (
                  <div className="mb-4 px-4 py-2.5 bg-orange-900/20 border border-orange-700/40 rounded-lg text-orange-300 text-xs font-medium">
                    <span className="text-orange-400 font-bold">Alert will match: </span>{preview}
                  </div>
                )}
                <div className="mb-4">
                  <label className="block text-sm font-bold text-white mb-2">Keywords</label>
                  <input type="text" value={formData.keyword || ''}
                    onChange={e => setFormData(f => ({ ...f, keyword: e.target.value }))}
                    placeholder="e.g., data analytics, cybersecurity"
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-orange-400 focus:outline-none" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-sm font-bold text-white mb-2">Procurement Type</label>
                    <MultiSelect options={PROCUREMENT_TYPE_OPTIONS} selected={formData.ptypes}
                      onChange={vals => setFormData(f => ({ ...f, ptypes: vals }))} placeholder="Any Type" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-white mb-2">State</label>
                    <MultiSelect options={US_STATES} selected={formData.states}
                      onChange={vals => setFormData(f => ({ ...f, states: vals }))} placeholder="Any State" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-white mb-2">Set-Aside Type</label>
                    <MultiSelect options={SET_ASIDE_CODES} selected={formData.setAsides}
                      onChange={vals => setFormData(f => ({ ...f, setAsides: vals }))} placeholder="Any Set-Aside" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-white mb-2">NAICS Code</label>
                    <TokenInput value={formData.ncode || ''}
                      onChange={v => setFormData(f => ({ ...f, ncode: v }))}
                      placeholder="e.g. 541512 — Enter to add more" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-white mb-2">PSC Code</label>
                    <TokenInput value={formData.ccode || ''}
                      onChange={v => setFormData(f => ({ ...f, ccode: v }))}
                      placeholder="e.g. D399 — Enter to add more" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-bold text-white mb-2">Organization / Agency</label>
                    <TokenInput value={formData.organizationName || ''}
                      onChange={v => setFormData(f => ({ ...f, organizationName: v }))}
                      placeholder="e.g. Dept. of Defense — Enter to add more" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-white mb-2">Solicitation Number</label>
                    <input type="text" value={formData.solnum || ''} placeholder="e.g., W912BU-24-R-0001"
                      onChange={e => setFormData(f => ({ ...f, solnum: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-orange-400 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-white mb-2">Place of Performance ZIP</label>
                    <input type="text" value={formData.zip || ''} placeholder="e.g., 22203"
                      onChange={e => setFormData(f => ({ ...f, zip: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-orange-400 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-white mb-2">Posted From</label>
                    <input type="date" value={formData.postedFrom || ''}
                      onChange={e => setFormData(f => ({ ...f, postedFrom: e.target.value }))}
                      className="w-full px-3 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-orange-400 focus:outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-white mb-2">Deadline By</label>
                    <input type="date" value={formData.rdlto || ''}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={e => setFormData(f => ({ ...f, rdlto: e.target.value }))}
                      className="w-full px-3 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-orange-400 focus:outline-none text-sm" />
                  </div>
                </div>
              </div>

              {/* Info box */}
              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-sm text-blue-300">
                <span className="font-bold">💡 How it works: </span>
                This alert runs {formData.frequency.toLowerCase()} at {formData.deliveryHour}:{formData.deliveryMinute} {formData.deliveryPeriod}{' '}
                and notifies{' '}
                <span className="font-bold text-blue-200">
                  {formData.recipients.length} recipient{formData.recipients.length !== 1 ? 's' : ''}
                </span>{' '}
                via {[
                  formData.recipients.some(r => r.channels.includes('email')) && 'email',
                  formData.recipients.some(r => r.channels.includes('sms')) && 'SMS',
                ].filter(Boolean).join(' and ') || 'email'}.
              </div>
            </div>

            {/* Save / Cancel */}
            <div className="flex gap-2 mt-6">
              <button onClick={handleSave} disabled={saving}
                className="flex-1 px-5 py-3 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 disabled:opacity-60 text-white font-black rounded-xl transition-all shadow-lg hover:shadow-xl shadow-orange-900/30 flex items-center justify-center gap-2 text-base">
                {saving
                  ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving…</>
                  : (editingId ? 'Update Alert' : 'Create Alert')}
              </button>
              <button onClick={() => { setShowForm(false); setEditingId(null); resetForm() }}
                className="px-5 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ── ALERTS LIST ── */}
        {alerts.length === 0 ? (
          <div className="text-center text-slate-400 py-20 bg-slate-800/30 border border-slate-700 rounded-2xl">
            <div className="w-20 h-20 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto mb-5">
              <BellRing className="w-10 h-10 text-slate-600" />
            </div>
            <p className="text-xl font-black text-white mb-2">No alert subscriptions yet</p>
            <p className="text-base text-slate-400 mb-6 max-w-sm mx-auto">Create automated alerts to get search results delivered to your inbox on a schedule</p>
            <button onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition-colors shadow-lg text-sm">
              <Plus className="w-4 h-4" /> Create your first alert
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map(alert => {
              const recipList: Recipient[] = alert.recipientsList?.length
                ? alert.recipientsList
                : stringToRecipients(alert.recipients)
              return (
                <div key={alert.id} data-alert-name={alert.name} className={`bg-gradient-to-br from-slate-800/80 to-slate-800/40 border rounded-2xl p-6 transition-all hover:shadow-xl hover:shadow-black/30 backdrop-blur-sm ${alert.isActive ? 'border-slate-700 border-l-4 border-l-orange-500 hover:border-orange-500/50' : 'border-slate-700/60 opacity-80 border-l-4 border-l-slate-600'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${alert.isActive ? 'bg-orange-500/20 text-orange-400' : 'bg-slate-700 text-slate-500'}`}>
                        <BellRing className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                          <p className="text-white font-black text-xl leading-tight">{alert.name}</p>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-bold tracking-wide ${alert.isActive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-700 text-slate-400 border border-slate-600'}`}>
                            {alert.isActive ? '● Active' : '○ Paused'}
                          </span>
                          <span className="text-xs px-2.5 py-1 bg-orange-500/15 text-orange-300 rounded-full font-bold border border-orange-500/25">{alert.frequency}</span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-slate-400 mb-3">
                          <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-slate-500" /> Delivers at {alert.deliveryTime || '09:00'}</span>
                          {alert.lastSentAt && <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-500" /> Last sent {new Date(alert.lastSentAt).toLocaleDateString()}</span>}
                          {alert.lastResultCount !== undefined && <span className="flex items-center gap-1.5"><span className="text-slate-500">📊</span> {alert.lastResultCount} results last run</span>}
                        </div>
                        {recipList.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {recipList.map((r, i) => (
                              <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-700/70 border border-slate-600 rounded-full text-sm text-slate-200 font-medium">
                                <User className="w-3.5 h-3.5 text-slate-400" />
                                {[r.firstName, r.lastName].filter(Boolean).join(' ') || r.email || r.phone || 'Recipient'}
                                {r.role && <span className="text-slate-500 text-xs">· {r.role}</span>}
                                {r.channels?.includes('email') && <Mail className="w-3.5 h-3.5 text-blue-400" />}
                                {r.channels?.includes('sms') && <MessageSquare className="w-3.5 h-3.5 text-green-400" />}
                              </span>
                            ))}
                          </div>
                        )}
                        {alert.params && Object.keys(alert.params).some(k => {
                          const v = (alert.params as any)[k]
                          return Array.isArray(v) ? v.length > 0 : !!v
                        }) && (
                          <div className="mt-1">
                            <button onClick={() => toggleExpanded(alert.id)}
                              className="text-sm text-teal-400 hover:text-teal-300 flex items-center gap-1.5 font-medium">
                              <ChevronDown className={`w-4 h-4 transition-transform ${expandedAlerts.has(alert.id) ? '' : '-rotate-90'}`} />
                              {expandedAlerts.has(alert.id) ? 'Hide criteria' : 'Show criteria'}
                            </button>
                            {expandedAlerts.has(alert.id) && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {Object.entries(alert.params)
                                  .filter(([k, v]) => {
                                    if (k === 'ptype' && alert.params?.ptypes?.length) return false
                                    if (k === 'state' && alert.params?.states?.length) return false
                                    if (k === 'typeOfSetAside' && alert.params?.setAsides?.length) return false
                                    return Array.isArray(v) ? v.length > 0 : !!v
                                  })
                                  .map(([k, v], i) => (
                                    <span key={i} className="text-sm px-3 py-1 bg-slate-700/80 text-slate-200 rounded-lg border border-slate-600 font-medium">
                                      <span className="text-slate-500 text-xs">{k}: </span>{Array.isArray(v) ? v.join(', ') : String(v)}
                                    </span>
                                  ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2.5 flex-wrap pt-4 mt-1 border-t border-slate-700/70">
                    <button onClick={() => handleRunSearch(alert.id)} disabled={runningAlertId === alert.id}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-colors shadow-md">
                      {runningAlertId === alert.id ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" /> Running…</> : <><Play className="w-4 h-4" /> Run Now</>}
                    </button>
                    <button onClick={() => toggleActive(alert.id, alert.isActive)}
                      className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors shadow-md ${alert.isActive ? 'bg-amber-600/80 hover:bg-amber-600 text-white' : 'bg-blue-600/80 hover:bg-blue-600 text-white'}`}>
                      {alert.isActive ? <><Pause className="w-4 h-4" /> Pause</> : <><PlayCircle className="w-4 h-4" /> Resume</>}
                    </button>
                    <button onClick={() => { setDownloadAlertId(alert.id); setShowDownloadModal(true) }}
                      className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-colors shadow-md">
                      <Download className="w-4 h-4" /> Download
                    </button>
                    <button
                      onClick={() => {
                        const t24 = alert.deliveryTime || '09:00'
                        const { hour, minute, period } = parse24h(t24)
                        setEditingId(alert.id)
                        setFormData({
                          name: alert.name, frequency: alert.frequency,
                          deliveryTime: t24,
                          deliveryHour: hour,
                          deliveryMinute: minute,
                          deliveryPeriod: period,
                          recipients: recipList.length > 0 ? recipList : [makeRecipient()],
                          keyword: alert.params?.keyword,
                          ptypes: toArray(alert.params?.ptype ?? alert.params?.ptypes),
                          states: toArray(alert.params?.state ?? alert.params?.states),
                          ncode: alert.params?.ncode,
                          ccode: alert.params?.ccode,
                          setAsides: toArray(alert.params?.setAsides ?? alert.params?.typeOfSetAside ?? alert.params?.setAside),
                          organizationName: alert.params?.organizationName || alert.params?.deptname,
                          solnum: alert.params?.solnum,
                          zip: alert.params?.zip,
                          rdlto: alert.params?.rdlto,
                          postedFrom: alert.params?.postedFrom,
                          maxResults: (alert as any).maxResults ?? 100,
                          format: alert.params?.format || 'CSV',
                        })
                        setFormErrors({})
                        setShowForm(true)
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-colors shadow-md">
                      <Edit3 className="w-4 h-4" /> Edit
                    </button>
                    <div className="flex-1" />
                    <button onClick={() => handleDelete(alert.id, alert.name)}
                      className="px-4 py-2 hover:bg-red-500/10 rounded-xl text-slate-500 hover:text-red-400 transition-colors border border-slate-700 hover:border-red-500/30 text-sm font-bold flex items-center gap-2">
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        </>)}

        {/* ── CONTACTS SECTION ─────────────────────────────────────────── */}
        {activeTab === 'contacts' && (
          <div>
            {/* Add Contact Form */}
            {showAddContactForm && (
              <div className="bg-gradient-to-br from-orange-900/20 to-slate-800/40 border border-orange-700/50 rounded-2xl p-7 mb-8 shadow-2xl shadow-black/30">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-black text-white flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-orange-400" /> Add New Contact
                  </h2>
                  <button onClick={() => { setShowAddContactForm(false); setAbNewContact({ email: '', firstName: '', lastName: '', organization: '', phone: '', notes: '' }) }}
                    className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
                  <div className="sm:col-span-2 lg:col-span-1">
                    <label className="block text-sm font-bold text-white mb-2">Email Address <span className="text-red-400">*</span></label>
                    <input type="email" value={abNewContact.email} onChange={e => setAbNewContact(p => ({ ...p, email: e.target.value }))} autoFocus
                      placeholder="jane@company.com"
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-orange-400 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-white mb-2">First Name</label>
                    <input type="text" value={abNewContact.firstName} onChange={e => setAbNewContact(p => ({ ...p, firstName: e.target.value }))}
                      placeholder="Jane"
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-orange-400 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-white mb-2">Last Name</label>
                    <input type="text" value={abNewContact.lastName} onChange={e => setAbNewContact(p => ({ ...p, lastName: e.target.value }))}
                      placeholder="Smith"
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-orange-400 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-white mb-2">Organization</label>
                    <input type="text" value={abNewContact.organization} onChange={e => setAbNewContact(p => ({ ...p, organization: e.target.value }))}
                      placeholder="Acme Corp"
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-orange-400 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-white mb-2">Phone</label>
                    <input type="tel" value={abNewContact.phone} onChange={e => setAbNewContact(p => ({ ...p, phone: e.target.value }))}
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-orange-400 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-white mb-2">Notes</label>
                    <input type="text" value={abNewContact.notes} onChange={e => setAbNewContact(p => ({ ...p, notes: e.target.value }))}
                      placeholder="Optional notes"
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:border-orange-400 focus:outline-none" />
                  </div>
                </div>
                {abSaveSuccess && (
                  <div className="flex items-center gap-2 px-4 py-3 bg-emerald-600/20 border border-emerald-500/40 rounded-xl mb-4 text-emerald-300 font-semibold text-sm">
                    <Check className="w-4 h-4 flex-shrink-0" /> Contact saved successfully!
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    disabled={!abNewContact.email || abSaving || abSaveSuccess}
                    onClick={async () => {
                      if (!abNewContact.email) return
                      setAbSaving(true)
                      try {
                        const ok = await handleAddContact({ email: abNewContact.email, firstName: abNewContact.firstName || undefined, lastName: abNewContact.lastName || undefined, organization: abNewContact.organization || undefined, phone: abNewContact.phone || undefined, notes: abNewContact.notes || undefined, lastUsedAt: undefined })
                        if (ok) {
                          setAbSaveSuccess(true)
                          setTimeout(() => {
                            setAbNewContact({ email: '', firstName: '', lastName: '', organization: '', phone: '', notes: '' })
                            setShowAddContactForm(false)
                            setAbSaveSuccess(false)
                          }, 1200)
                        }
                      } finally { setAbSaving(false) }
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 disabled:opacity-60 text-white font-black rounded-xl flex items-center gap-2 transition-all shadow-lg hover:shadow-xl shadow-orange-900/30">
                    {abSaving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving…</> : abSaveSuccess ? <><Check className="w-4 h-4" />Saved!</> : <><Save className="w-4 h-4" />Save Contact</>}
                  </button>
                  <button onClick={() => { setShowAddContactForm(false); setAbNewContact({ email: '', firstName: '', lastName: '', organization: '', phone: '', notes: '' }) }}
                    className="px-5 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-colors">Cancel</button>
                </div>
              </div>
            )}

            {/* Search bar */}
            <div className="mb-5 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input type="text" value={contactSearch} onChange={e => setContactSearch(e.target.value)}
                placeholder="Search by name, email, or organization…"
                className="w-full pl-11 pr-4 py-3 bg-slate-800/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-orange-400 transition-colors" />
              {contactSearch && (
                <button onClick={() => setContactSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Contacts list */}
            {abLoading ? (
              <div className="flex justify-center py-20">
                <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (() => {
              const filtered = contacts.filter(c =>
                !contactSearch || [c.email, c.firstName, c.lastName, c.name, c.organization].some(v => v?.toLowerCase().includes(contactSearch.toLowerCase()))
              )
              if (contacts.length === 0) return (
                <div className="text-center py-20 bg-slate-800/30 border border-slate-700 rounded-2xl">
                  <div className="w-20 h-20 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto mb-5">
                    <BookUser className="w-10 h-10 text-slate-600" />
                  </div>
                  <p className="text-xl font-black text-white mb-2">No contacts yet</p>
                  <p className="text-base text-slate-400 mb-6 max-w-sm mx-auto">Add contacts to reuse them as recipients across all your alert subscriptions</p>
                  <button onClick={() => setShowAddContactForm(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition-colors shadow-lg text-sm">
                    <Plus className="w-4 h-4" /> Add your first contact
                  </button>
                </div>
              )
              if (filtered.length === 0) return (
                <div className="text-center py-16 bg-slate-800/30 border border-slate-700 rounded-2xl">
                  <p className="text-lg font-bold text-white mb-1">No matches for "{contactSearch}"</p>
                  <button onClick={() => setContactSearch('')} className="text-sm text-orange-400 hover:text-orange-300 transition-colors">Clear search</button>
                </div>
              )
              return (
                <div className="space-y-3">
                  {filtered.map(contact => {
                    const isEd = abEditId === contact.id
                    return (
                      <div key={contact.id} className={`bg-slate-800/60 border rounded-2xl transition-all ${isEd ? 'border-orange-500/40' : 'border-slate-600 hover:border-slate-500'}`}>
                        {isEd ? (
                          /* ── Inline Edit Form ── */
                          <div className="p-6">
                            <p className="text-sm font-bold text-orange-400 mb-4 flex items-center gap-2">
                              <Edit3 className="w-3.5 h-3.5" /> Editing contact
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
                              <div className="sm:col-span-2 lg:col-span-1">
                                <label className="block text-xs font-bold text-slate-400 mb-1.5">Email Address <span className="text-red-400">*</span></label>
                                <input type="email" value={abEditData.email || ''} onChange={e => setAbEditData(p => ({ ...p, email: e.target.value }))} autoFocus
                                  className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:border-orange-400 focus:outline-none" placeholder="Email *" />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-400 mb-1.5">First Name</label>
                                <input type="text" value={(abEditData.firstName as string) || ''} onChange={e => setAbEditData(p => ({ ...p, firstName: e.target.value }))}
                                  className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:border-orange-400 focus:outline-none" placeholder="First Name" />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-400 mb-1.5">Last Name</label>
                                <input type="text" value={(abEditData.lastName as string) || ''} onChange={e => setAbEditData(p => ({ ...p, lastName: e.target.value }))}
                                  className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:border-orange-400 focus:outline-none" placeholder="Last Name" />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-400 mb-1.5">Organization</label>
                                <input type="text" value={(abEditData.organization as string) || ''} onChange={e => setAbEditData(p => ({ ...p, organization: e.target.value }))}
                                  className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:border-orange-400 focus:outline-none" placeholder="Organization" />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-400 mb-1.5">Phone</label>
                                <input type="tel" value={(abEditData.phone as string) || ''} onChange={e => setAbEditData(p => ({ ...p, phone: e.target.value }))}
                                  className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:border-orange-400 focus:outline-none" placeholder="Phone" />
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-slate-400 mb-1.5">Notes</label>
                                <input type="text" value={(abEditData.notes as string) || ''} onChange={e => setAbEditData(p => ({ ...p, notes: e.target.value }))}
                                  className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:border-orange-400 focus:outline-none" placeholder="Notes" />
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                disabled={!abEditData.email || abEditSaving}
                                onClick={async () => { setAbEditSaving(true); try { await handleUpdateContact(contact.id, abEditData); setAbEditId(null); setAbEditData({}) } finally { setAbEditSaving(false) } }}
                                className="px-5 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl flex items-center gap-2 transition-colors">
                                {abEditSaving ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving…</> : <><Save className="w-4 h-4" />Save Changes</>}
                              </button>
                              <button onClick={() => { setAbEditId(null); setAbEditData({}) }}
                                className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold rounded-xl transition-colors">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          /* ── Contact Card ── */
                          <div className="flex items-center gap-4 p-5">
                            {/* Avatar */}
                            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-orange-500/15 border border-orange-500/25 flex items-center justify-center">
                              <span className="text-lg font-black text-orange-300">
                                {(contact.firstName || contact.name || contact.email).charAt(0).toUpperCase()}
                              </span>
                            </div>
                            {/* Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2.5 flex-wrap mb-1">
                              {(() => {
                                const displayName = [contact.firstName, contact.lastName].filter(Boolean).join(' ') || contact.name
                                return displayName ? <p className="text-white font-black text-lg leading-tight">{displayName}</p> : null
                              })()}
                                {contact.organization && (
                                  <span className="text-xs px-2 py-0.5 bg-slate-700/80 border border-slate-600 rounded-full text-slate-300 font-medium flex items-center gap-1">
                                    <Building2 className="w-3 h-3" />{contact.organization}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-4 flex-wrap">
                                <span className="text-sm text-slate-300 flex items-center gap-1.5">
                                  <Mail className="w-3.5 h-3.5 text-blue-400" />{contact.email}
                                </span>
                                {contact.phone && (
                                  <span className="text-sm text-slate-400 flex items-center gap-1.5">
                                    <Phone className="w-3.5 h-3.5 text-green-400" />{contact.phone}
                                  </span>
                                )}
                                {contact.useCount > 0 && (
                                  <span className="text-xs text-slate-500 flex items-center gap-1">
                                    <BellRing className="w-3 h-3" /> Used in {contact.useCount} alert{contact.useCount !== 1 ? 's' : ''}
                                  </span>
                                )}
                                {contact.notes && (
                                  <span className="text-xs text-slate-500 italic truncate max-w-[200px]">{contact.notes}</span>
                                )}
                              </div>
                            </div>
                            {/* Actions */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <button
                                onClick={() => { setAbEditId(contact.id); setAbEditData({ email: contact.email, firstName: contact.firstName || '', lastName: contact.lastName || '', organization: contact.organization || '', phone: contact.phone || '', notes: contact.notes || '' }) }}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl flex items-center gap-1.5 transition-colors">
                                <Edit3 className="w-3.5 h-3.5" /> Edit
                              </button>
                              {abDeleteId === contact.id ? (
                                <div className="flex items-center gap-1.5">
                                  <button onClick={() => handleDeleteContact(contact.id)}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-colors">Confirm</button>
                                  <button onClick={() => setAbDeleteId(null)}
                                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold rounded-xl transition-colors">Cancel</button>
                                </div>
                              ) : (
                                <button onClick={() => setAbDeleteId(contact.id)}
                                  className="px-4 py-2 bg-slate-700 hover:bg-red-600/80 text-slate-300 hover:text-white text-sm font-bold rounded-xl flex items-center gap-1.5 transition-colors">
                                  <Trash2 className="w-3.5 h-3.5" /> Delete
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </div>
        )}

      </div>

      {/* Download Modal */}
      {showDownloadModal && downloadAlertId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-black text-white">Download Alert Results</h3>
              <button onClick={() => setShowDownloadModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-white mb-2">Export Format</label>
                <select className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white">
                  <option value="csv">CSV (Spreadsheet)</option>
                  <option value="xlsx">Excel (.xlsx)</option>
                  <option value="json">JSON (Data)</option>
                  <option value="pdf">PDF Document</option>
                  <option value="txt">Plain Text</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-white mb-2">Results From</label>
                <select className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white">
                  <option value="last">Last Run Only</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                  <option value="all">All Time</option>
                </select>
              </div>
              <button className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg flex items-center justify-center gap-2">
                <Download className="w-4 h-4" /> Download Now
              </button>
            </div>
          </div>
        </div>
      )}

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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl">
              <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-5" />
              <p className="text-white font-black text-xl mb-2">Running Alert</p>
              {runningAlert && (
                <p className="text-orange-300 font-bold mb-3 truncate">"{runningAlert.name}"</p>
              )}
              <p className="text-slate-400 text-sm">Searching SAM.gov and preparing delivery…</p>
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

      {/* Contact Import Modal */}
      <ContactImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImported={(count) => { loadContacts(); showToast(`${count} contact${count !== 1 ? 's' : ''} imported!`) }}
      />

    </div>
  )
}

export default function ManageAlertsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1a2332 50%, #0f172a 100%)' }}>
        <div className="animate-spin h-12 w-12 border-4 border-orange-500 border-t-transparent rounded-full" />
      </div>
    }>
      <ManageAlertsContent />
    </Suspense>
  )
}