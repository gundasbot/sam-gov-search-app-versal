// app/contacts/page.tsx
'use client'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import {
  Plus, Edit3, Trash2, Mail, X, Check, Phone, Building2,
  Search, Save, Upload, Download, MessageSquare, AlertCircle,
  UserPlus, BellRing, Users, BookUser, Copy, ExternalLink,
  ChevronUp, ChevronDown, Printer, MapPin, Tags,
} from 'lucide-react'
import { useEffect, useState, useCallback, Suspense } from 'react'
import { ContactImportModal } from '@/components/ContactImportModal'
import WorkspaceNavRow from '@/components/WorkspaceNavRow'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Contact {
  id: string
  email: string
  firstName?: string | null
  lastName?: string | null
  name?: string | null
  organization?: string | null
  notes?: string | null
  phone?: string | null
  useCount: number
  lastUsedAt?: string | null
  createdAt: string
}

interface ContractorGroupItem {
  value: string
  count: number
}

interface ContractorLead {
  id: string
  name: string
  email: string
  naicsCode: string
  state: string
  setAside: string
  cageCode: string
  priority: string
}

type SortKey = 'name' | 'email' | 'organization' | 'useCount' | 'createdAt'
type SortDir = 'asc' | 'desc'
type ContactSourceFilter = 'all' | 'internal' | 'leads'

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
const isValidPhone = (v: string) => !v || /^[\+\d][\d\s\-\(\)]{6,14}$/.test(v.trim())

function displayName(c: Contact) {
  return [c.firstName, c.lastName].filter(Boolean).join(' ') || c.name || ''
}

function initials(c: Contact) {
  const n = displayName(c)
  if (n) {
    const parts = n.trim().split(/\s+/)
    return (parts[0]?.[0] || '') + (parts[1]?.[0] || '')
  }
  return c.email[0]?.toUpperCase() || '?'
}

function formatDate(iso?: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function isLeadContact(c: Contact): boolean {
  const notes = (c.notes || '').toLowerCase()
  if (notes.includes('source: contractor lead') || notes.includes('source: lead')) return true
  // Backward-compatible fallback for older lead imports.
  if (notes.includes('naics ') && notes.includes('·')) return true
  return false
}

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------
function Toast({ msg, type }: { msg: string; type: 'success' | 'error' }) {
  return (
    <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-xl font-semibold text-sm flex items-center gap-2 text-white ${type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}>
      {type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
      {msg}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Add / Edit Form
// ---------------------------------------------------------------------------
function ContactForm({
  initial,
  existingEmails,
  onSave,
  onCancel,
  title,
}: {
  initial: Partial<Contact>
  existingEmails: string[]
  onSave: (data: Partial<Contact>) => Promise<void>
  onCancel: () => void
  title: string
}) {
  const [data, setData] = useState({ email: initial.email || '', firstName: initial.firstName || '', lastName: initial.lastName || '', organization: initial.organization || '', phone: initial.phone || '', notes: initial.notes || '' })
  const [saving, setSaving] = useState(false)
  const [emailTouched, setEmailTouched] = useState(false)
  const [phoneTouched, setPhoneTouched] = useState(false)

  const isDupe = emailTouched && !!data.email && existingEmails.includes(data.email.trim().toLowerCase()) && data.email.trim().toLowerCase() !== (initial.email || '').toLowerCase()
  const emailInvalid = emailTouched && !!data.email && !isValidEmail(data.email)
  const emailValid = emailTouched && !!data.email && !isDupe && !emailInvalid
  const phoneInvalid = phoneTouched && !!data.phone && !isValidPhone(data.phone)
  const phoneValid = phoneTouched && !!data.phone && !phoneInvalid
  const canSave = !!data.email && isValidEmail(data.email) && !isDupe && (!data.phone || isValidPhone(data.phone))

  const ini = initials({ ...initial, ...data, id: '', useCount: 0, createdAt: '' } as Contact)

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden mb-6">
      <div className="h-2 bg-gradient-to-r from-teal-500 to-cyan-400" />
      <div className="p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="shrink-0 w-16 h-16 rounded-full bg-teal-50 border-2 border-teal-300 flex items-center justify-center">
            <span className="text-2xl font-black text-teal-600">{ini.toUpperCase()}</span>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-teal-600" /> {title}
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">Email is required. All other fields are optional.</p>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-700 mt-0.5"><X className="w-5 h-5" /></button>
        </div>

        {isDupe && (
          <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-400 rounded-xl flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <p className="text-sm text-amber-800 font-semibold">This email is already in your contacts.</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          {/* Email */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Email Address <span className="text-red-500">*</span></label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email" value={data.email} autoFocus
                onChange={e => setData(p => ({ ...p, email: e.target.value }))}
                onBlur={() => setEmailTouched(true)}
                placeholder="jane@company.com"
                className={`w-full pl-9 pr-10 py-3 border rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none transition-colors ${isDupe ? 'bg-amber-50 border-amber-400' : emailInvalid ? 'bg-red-50 border-red-400' : emailValid ? 'bg-emerald-50 border-emerald-400' : 'bg-white border-slate-300 focus:border-teal-400'}`}
              />
              {emailValid && <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />}
              {(emailInvalid || isDupe) && <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />}
            </div>
            {emailInvalid && <p className="mt-1 text-xs text-red-600 font-medium">Enter a valid email address.</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">First Name</label>
            <input type="text" value={data.firstName} onChange={e => setData(p => ({ ...p, firstName: e.target.value }))} placeholder="Jane"
              className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:border-teal-400 focus:outline-none transition-colors" />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Last Name</label>
            <input type="text" value={data.lastName} onChange={e => setData(p => ({ ...p, lastName: e.target.value }))} placeholder="Smith"
              className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:border-teal-400 focus:outline-none transition-colors" />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Organization</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" value={data.organization} onChange={e => setData(p => ({ ...p, organization: e.target.value }))} placeholder="Company or Agency"
                className="w-full pl-9 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:border-teal-400 focus:outline-none transition-colors" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Phone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="tel" value={data.phone}
                onChange={e => setData(p => ({ ...p, phone: e.target.value }))}
                onBlur={() => setPhoneTouched(true)}
                placeholder="+1 (555) 000-0000"
                className={`w-full pl-9 pr-4 py-3 border rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none transition-colors ${phoneInvalid ? 'bg-red-50 border-red-400' : phoneValid ? 'bg-emerald-50 border-emerald-400' : 'bg-white border-slate-300 focus:border-teal-400'}`}
              />
            </div>
            {phoneInvalid && <p className="mt-1 text-xs text-red-600 font-medium">Enter a valid phone number.</p>}
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">Notes</label>
            <input type="text" value={data.notes} onChange={e => setData(p => ({ ...p, notes: e.target.value }))} placeholder="Role, context, or tags"
              className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:border-teal-400 focus:outline-none transition-colors" />
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t border-slate-100">
          <button
            disabled={!canSave || saving}
            onClick={async () => { setSaving(true); try { await onSave(data) } finally { setSaving(false) } }}
            className="px-6 py-3 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 disabled:opacity-50 text-white font-black rounded-xl flex items-center gap-2 transition-all shadow-lg">
            {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving…</> : <><Save className="w-4 h-4" />Save Contact</>}
          </button>
          <button onClick={onCancel} className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors">Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Share Modal
// ---------------------------------------------------------------------------
function ShareModal({ contact, onClose }: { contact: Contact; onClose: () => void }) {
  const [copied, setCopied] = useState(false)
  const name = displayName(contact) || contact.email

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-slate-500" /> Share Contact</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
        </div>
        <div className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-0.5">
          <p className="font-black text-slate-800 text-base">{name}</p>
          <p className="text-sm text-slate-600 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-blue-400" />{contact.email}</p>
          {contact.phone && <p className="text-sm text-slate-500 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-green-400" />{contact.phone}</p>}
          {contact.organization && <p className="text-xs text-slate-500 flex items-center gap-1.5"><Building2 className="w-3 h-3" />{contact.organization}</p>}
        </div>
        <div className="space-y-2">
          <button
            onClick={() => { navigator.clipboard.writeText(contact.email); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
            className="w-full px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl flex items-center gap-2 transition-colors text-sm">
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Email Copied!' : 'Copy Email Address'}
          </button>
          <a href={`mailto:${contact.email}?subject=${encodeURIComponent(`Re: ${name}`)}`}
            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl flex items-center gap-2 transition-colors text-sm block text-center">
            <Mail className="w-4 h-4 inline mr-1" /> Open in Email Client
          </a>
          {contact.phone && (
            <a href={`tel:${contact.phone}`}
              className="w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl flex items-center gap-2 transition-colors text-sm block text-center">
              <Phone className="w-4 h-4 inline mr-1" /> Call {contact.phone}
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
function ContactsContent() {
  const { data: session } = useSession()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [shareContact, setShareContact] = useState<Contact | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [sourceFilter, setSourceFilter] = useState<ContactSourceFilter>('all')
  const [contractorLeads, setContractorLeads] = useState<ContractorLead[]>([])
  const [contractorGroups, setContractorGroups] = useState<{
    naics: ContractorGroupItem[]
    states: ContractorGroupItem[]
    setAsides: ContractorGroupItem[]
  }>({ naics: [], states: [], setAsides: [] })
  const [contractorFilter, setContractorFilter] = useState<{ naics: string; state: string; setAside: string }>({
    naics: '',
    state: '',
    setAside: '',
  })
  const [contractorLoading, setContractorLoading] = useState(false)

  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/address-book')
      const data = await res.json()
      setContacts(Array.isArray(data) ? data : [])
    } catch { setContacts([]) }
    finally { setLoading(false) }
  }, [])

  const loadContractorGroups = useCallback(async (filters?: { naics?: string; state?: string; setAside?: string }) => {
    setContractorLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters?.naics) params.set('naics', filters.naics)
      if (filters?.state) params.set('state', filters.state)
      if (filters?.setAside) params.set('setAside', filters.setAside)
      params.set('limit', '40')
      const res = await fetch(`/api/contractors/groups?${params.toString()}`, { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to load contractor groups')
      setContractorLeads(Array.isArray(data?.contractors) ? data.contractors : [])
      setContractorGroups({
        naics: Array.isArray(data?.groups?.naics) ? data.groups.naics : [],
        states: Array.isArray(data?.groups?.states) ? data.groups.states : [],
        setAsides: Array.isArray(data?.groups?.setAsides) ? data.groups.setAsides : [],
      })
    } catch (error) {
      setContractorLeads([])
      setContractorGroups({ naics: [], states: [], setAsides: [] })
      showToast(error instanceof Error ? error.message : 'Failed to load contractor groups.', 'error')
    } finally {
      setContractorLoading(false)
    }
  }, [showToast])

  useEffect(() => { load() }, [load])
  useEffect(() => { loadContractorGroups(contractorFilter) }, [loadContractorGroups, contractorFilter])

  const existingEmails = contacts.map(c => c.email.toLowerCase())

  // Sort
  const sorted = [...contacts].sort((a, b) => {
    let av = '', bv = ''
    if (sortKey === 'name') { av = displayName(a).toLowerCase(); bv = displayName(b).toLowerCase() }
    else if (sortKey === 'email') { av = a.email.toLowerCase(); bv = b.email.toLowerCase() }
    else if (sortKey === 'organization') { av = (a.organization || '').toLowerCase(); bv = (b.organization || '').toLowerCase() }
    else if (sortKey === 'useCount') { return sortDir === 'asc' ? a.useCount - b.useCount : b.useCount - a.useCount }
    else if (sortKey === 'createdAt') { av = a.createdAt; bv = b.createdAt }
    return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
  })

  const filtered = sorted.filter(c => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return [c.email, c.firstName, c.lastName, c.name, c.organization, c.notes].some(v => v?.toLowerCase().includes(q))
  })
  const leadCount = contacts.filter(isLeadContact).length
  const internalCount = contacts.length - leadCount
  const sourceFiltered = filtered.filter(c => {
    if (sourceFilter === 'all') return true
    if (sourceFilter === 'leads') return isLeadContact(c)
    return !isLeadContact(c)
  })

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const SortIcon = ({ k }: { k: SortKey }) => sortKey === k
    ? (sortDir === 'asc' ? <ChevronUp className="w-3.5 h-3.5 inline ml-1" /> : <ChevronDown className="w-3.5 h-3.5 inline ml-1" />)
    : <span className="w-3.5 h-3.5 inline-block ml-1" />

  const handleAdd = async (data: Partial<Contact>) => {
    const res = await fetch('/api/address-book', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      const created = await res.json()
      setContacts(prev => [created, ...prev])
      setShowAddForm(false)
      showToast('Contact added!')
    } else showToast('Failed to add contact.', 'error')
  }

  const handleEdit = async (id: string, data: Partial<Contact>) => {
    const res = await fetch(`/api/address-book/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      const updated = await res.json()
      setContacts(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c))
      setEditId(null)
      showToast('Contact updated!')
    } else showToast('Failed to update contact.', 'error')
  }

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/address-book/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setContacts(prev => prev.filter(c => c.id !== id))
      setDeleteId(null)
      showToast('Contact deleted.')
    } else showToast('Failed to delete.', 'error')
  }

  const handleAddContractorContact = async (lead: ContractorLead) => {
    if (!lead.email) return
    const [firstName, ...lastParts] = (lead.name || '').trim().split(/\s+/).filter(Boolean)
    const lastName = lastParts.join(' ')
    const res = await fetch('/api/address-book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: lead.email,
        firstName: firstName || '',
        lastName: lastName || '',
        organization: lead.name || '',
        notes: ['Source: Contractor lead', lead.naicsCode ? `NAICS ${lead.naicsCode}` : '', lead.setAside || '', lead.state || '']
          .filter(Boolean)
          .join(' · '),
      }),
    })

    if (res.ok) {
      const created = await res.json()
      setContacts(prev => [created, ...prev])
      showToast(`Added ${lead.email} to contacts.`)
      return
    }
    if (res.status === 409) {
      showToast(`${lead.email} is already in contacts.`, 'error')
      return
    }
    showToast('Failed to add contractor contact.', 'error')
  }

  const handlePrint = (c: Contact) => {
    const name = displayName(c) || c.email
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`<!DOCTYPE html><html><head><title>Contact: ${name}</title>
      <style>body{font-family:sans-serif;padding:48px;max-width:480px;color:#0f172a}
        h1{font-size:28px;font-weight:900;margin-bottom:4px}
        p{margin:6px 0;font-size:15px;color:#334155}
        .label{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8;font-weight:700;margin-top:16px}
        hr{border:none;border-top:1px solid #e2e8f0;margin:24px 0}
      </style></head><body>
      <h1>${name}</h1>
      ${c.organization ? `<p style="color:#64748b">${c.organization}</p>` : ''}
      <hr/>
      <p class="label">Email</p><p>${c.email}</p>
      ${c.phone ? `<p class="label">Phone</p><p>${c.phone}</p>` : ''}
      ${c.notes ? `<p class="label">Notes</p><p>${c.notes}</p>` : ''}
      <p class="label">Added</p><p>${formatDate(c.createdAt)}</p>
      ${c.useCount > 0 ? `<p class="label">Used In</p><p>${c.useCount} alert${c.useCount !== 1 ? 's' : ''}</p>` : ''}
    </body></html>`)
    win.document.close()
    win.print()
  }

  const editContact = contacts.find(c => c.id === editId)

  return (
    <div
      className="contacts-page min-h-screen bg-blue-50 text-slate-800 font-semibold"
      style={{ fontFamily: 'Aptos, Calibri, "Segoe UI", "Trebuchet MS", Arial, sans-serif' }}
    >
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      {shareContact && <ShareModal contact={shareContact} onClose={() => setShareContact(null)} />}

      {/* Contact Import Modal */}
      <ContactImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImported={(count) => { load(); showToast(`${count} contact${count !== 1 ? 's' : ''} imported!`) }}
      />

      <div className="mx-auto w-full max-w-480 px-3 sm:px-4 lg:px-6 xl:px-8 py-8 bg-blue-200 rounded-2xl border border-blue-300">
        {/* Cross-page navigation */}
        <section className="mb-6">
          <WorkspaceNavRow active="recipients" />
        </section>

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6 rounded-2xl border border-blue-300 bg-white p-5 shadow-sm">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl sm:text-4xl font-black text-blue-900">Contacts</h1>
              {contacts.length > 0 && (
                <span className="px-3 py-1 bg-blue-700 text-white border border-blue-800 rounded-full text-sm font-black">{contacts.length}</span>
              )}
            </div>
            <p className="text-blue-900 text-base font-bold">Universal address book — share, email, call, and send from any page.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setShowImportModal(true)}
              className="px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-black rounded-xl flex items-center gap-2 text-sm transition-colors shadow">
              <Upload className="w-4 h-4" /> Import
            </button>
            <button onClick={() => { setShowAddForm(f => !f); setEditId(null) }}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl flex items-center gap-2 text-sm transition-colors shadow-lg">
              {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showAddForm ? 'Cancel' : 'Add Contact'}
            </button>
          </div>
        </div>

        {/* Contractor groups from scraped contractor table */}
        <div className="mb-6 rounded-2xl border border-blue-300 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-2xl font-black text-blue-900">Contractor Groups</h2>
              <p className="text-base font-bold text-blue-900">
                Group contractors by NAICS, location, and set-aside/business type, then add recipients to Contacts.
              </p>
            </div>
            <button
              type="button"
              onClick={() => loadContractorGroups(contractorFilter)}
              className="px-3 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-sm font-bold"
            >
              Refresh Groups
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">
            <div className="rounded-xl border border-blue-300 bg-blue-50 p-3">
              <p className="text-xs font-black uppercase tracking-wider text-blue-900 mb-2">NAICS</p>
              <div className="flex flex-wrap gap-1.5">
                {contractorGroups.naics.slice(0, 10).map(group => (
                  <button
                    key={`naics-${group.value}`}
                    type="button"
                    onClick={() => setContractorFilter(prev => ({ ...prev, naics: prev.naics === group.value ? '' : group.value }))}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                      contractorFilter.naics === group.value
                        ? 'bg-blue-700 text-white border-blue-800'
                        : 'bg-white text-blue-900 border-blue-300 hover:bg-blue-100'
                    }`}
                  >
                    {group.value} ({group.count})
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-blue-300 bg-blue-50 p-3">
              <p className="text-xs font-black uppercase tracking-wider text-blue-900 mb-2 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> Location
              </p>
              <div className="flex flex-wrap gap-1.5">
                {contractorGroups.states.slice(0, 10).map(group => (
                  <button
                    key={`state-${group.value}`}
                    type="button"
                    onClick={() => setContractorFilter(prev => ({ ...prev, state: prev.state === group.value ? '' : group.value }))}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                      contractorFilter.state === group.value
                        ? 'bg-blue-700 text-white border-blue-800'
                        : 'bg-white text-blue-900 border-blue-300 hover:bg-blue-100'
                    }`}
                  >
                    {group.value} ({group.count})
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-blue-300 bg-blue-50 p-3">
              <p className="text-xs font-black uppercase tracking-wider text-blue-900 mb-2 flex items-center gap-1.5">
                <Tags className="w-3.5 h-3.5" /> Set-Aside / Business Type
              </p>
              <div className="flex flex-wrap gap-1.5">
                {contractorGroups.setAsides.slice(0, 10).map(group => (
                  <button
                    key={`set-aside-${group.value}`}
                    type="button"
                    onClick={() => setContractorFilter(prev => ({ ...prev, setAside: prev.setAside === group.value ? '' : group.value }))}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                      contractorFilter.setAside === group.value
                        ? 'bg-blue-700 text-white border-blue-800'
                        : 'bg-white text-blue-900 border-blue-300 hover:bg-blue-100'
                    }`}
                  >
                    {group.value} ({group.count})
                  </button>
                ))}
              </div>
            </div>
          </div>

          {(contractorFilter.naics || contractorFilter.state || contractorFilter.setAside) && (
            <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
              <span className="text-sm font-bold text-blue-900">Active contractor filters:</span>
              {contractorFilter.naics && <span className="text-xs font-bold rounded bg-blue-700 text-white px-2 py-1">NAICS {contractorFilter.naics}</span>}
              {contractorFilter.state && <span className="text-xs font-bold rounded bg-blue-700 text-white px-2 py-1">State {contractorFilter.state}</span>}
              {contractorFilter.setAside && <span className="text-xs font-bold rounded bg-blue-700 text-white px-2 py-1">{contractorFilter.setAside}</span>}
              <button
                type="button"
                onClick={() => setContractorFilter({ naics: '', state: '', setAside: '' })}
                className="ml-auto text-xs font-bold text-blue-700 hover:text-red-600"
              >
                Clear Filters
              </button>
            </div>
          )}

          <div className="rounded-xl border border-blue-300 bg-white overflow-hidden">
            <div className="px-3 py-2 border-b border-blue-300 bg-blue-950 text-white text-sm font-black">
              Contractor Leads ({contractorLeads.length})
            </div>
            <div className="max-h-64 overflow-y-auto divide-y divide-blue-100">
              {contractorLoading ? (
                <div className="p-4 text-sm font-bold text-blue-900">Loading contractor groups…</div>
              ) : contractorLeads.length === 0 ? (
                <div className="p-4 text-sm font-bold text-blue-900">
                  No contractor leads found for this filter. Adjust filters or import contractor scrape data.
                </div>
              ) : contractorLeads.map((lead, index) => {
                const exists = existingEmails.includes(lead.email.toLowerCase())
                return (
                  <div key={lead.id} className="px-3 py-2.5 flex flex-wrap items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-black uppercase tracking-wide text-blue-700">Lead #{index + 1}</p>
                      <p className="text-sm font-bold text-blue-900 truncate">{lead.name || lead.email}</p>
                      <p className="text-xs font-bold text-blue-700 truncate">{lead.email}</p>
                      <p className="text-xs font-semibold text-blue-800 truncate">
                        {[lead.naicsCode ? `NAICS ${lead.naicsCode}` : '', lead.state || '', lead.setAside || ''].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={exists}
                      onClick={() => handleAddContractorContact(lead)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                        exists
                          ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      {exists ? 'In Contacts' : 'Add Contact'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Add form */}
        {showAddForm && !editId && (
          <ContactForm
            initial={{}}
            existingEmails={existingEmails}
            onSave={handleAdd}
            onCancel={() => setShowAddForm(false)}
            title="Add New Contact"
          />
        )}

        {/* Edit form (inline above list) */}
        {editId && editContact && (
          <ContactForm
            initial={editContact}
            existingEmails={existingEmails}
            onSave={(data) => handleEdit(editId, data)}
            onCancel={() => setEditId(null)}
            title="Edit Contact"
          />
        )}

        {/* Search bar */}
        <div className="mb-5 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email, organization, or notes…"
            className="w-full pl-11 pr-10 py-3 bg-white border border-slate-300 rounded-xl text-slate-800 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors shadow-sm font-bold text-base" />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-red-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Source segmentation */}
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <span className="text-base font-black text-slate-700">Contact Source:</span>
          <button
            type="button"
            onClick={() => setSourceFilter('all')}
            className={`px-3 py-1.5 rounded-lg border text-sm font-black transition-colors ${
              sourceFilter === 'all'
                ? 'bg-blue-700 border-blue-800 text-white'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
          >
            All ({contacts.length})
          </button>
          <button
            type="button"
            onClick={() => setSourceFilter('internal')}
            className={`px-3 py-1.5 rounded-lg border text-sm font-black transition-colors ${
              sourceFilter === 'internal'
                ? 'bg-blue-700 border-blue-800 text-white'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
          >
            Internal / Manual ({internalCount})
          </button>
          <button
            type="button"
            onClick={() => setSourceFilter('leads')}
            className={`px-3 py-1.5 rounded-lg border text-sm font-black transition-colors ${
              sourceFilter === 'leads'
                ? 'bg-blue-700 border-blue-800 text-white'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
          >
            Contractor Leads ({leadCount})
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!loading && contacts.length === 0 && (
          <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <div className="w-20 h-20 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto mb-5">
              <BookUser className="w-10 h-10 text-blue-600" />
            </div>
            <p className="text-2xl font-black text-slate-800 mb-2">No contacts yet</p>
            <p className="text-slate-700 mb-6 max-w-sm mx-auto font-bold text-base">Add contacts to use them as recipients across alerts, searches, and opportunity sharing.</p>
            <button onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-sm transition-colors shadow-md">
              <Plus className="w-4 h-4" /> Add your first contact
            </button>
          </div>
        )}

        {/* No search results */}
        {!loading && contacts.length > 0 && sourceFiltered.length === 0 && (
          <div className="text-center py-14 bg-white border border-slate-200 rounded-2xl">
            <p className="text-xl font-black text-slate-700 mb-1">
              {search
                ? `No matches for "${search}"`
                : sourceFilter === 'leads'
                  ? 'No contractor lead contacts yet'
                  : sourceFilter === 'internal'
                    ? 'No internal/manual contacts yet'
                    : 'No contacts found'}
            </p>
            <button onClick={() => setSearch('')} className="text-sm text-teal-600 hover:text-teal-700 font-semibold">Clear search</button>
          </div>
        )}

        {/* Table */}
        {!loading && sourceFiltered.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-[auto_1fr_1fr_1fr_auto_auto] gap-0 border-b border-slate-200 bg-slate-800 px-4 py-3 text-xs font-black uppercase tracking-widest text-white">
              <div className="w-10" />
              <button onClick={() => toggleSort('name')} className="text-left hover:text-orange-200 transition-colors">Name <SortIcon k="name" /></button>
              <button onClick={() => toggleSort('email')} className="text-left hover:text-orange-200 transition-colors">Email <SortIcon k="email" /></button>
              <button onClick={() => toggleSort('organization')} className="text-left hover:text-orange-200 transition-colors hidden sm:block">Organization <SortIcon k="organization" /></button>
              <button onClick={() => toggleSort('useCount')} className="text-center hover:text-orange-200 transition-colors">Used <SortIcon k="useCount" /></button>
              <div className="text-right">Actions</div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-slate-100">
              {sourceFiltered.map((c, index) => {
                const name = displayName(c)
                const ini = initials(c).toUpperCase()
                const isDeleting = deleteId === c.id
                const leadSource = isLeadContact(c)

                return (
                  <div key={c.id} className="grid grid-cols-[auto_1fr_1fr_1fr_auto_auto] gap-0 items-center px-4 py-3.5 hover:bg-slate-50 transition-colors group">
                    {/* Avatar */}
                    <div className="w-10 mr-3">
                      <div className="w-9 h-9 rounded-full bg-teal-100 border border-teal-200 flex items-center justify-center shrink-0">
                        <span className="text-sm font-black text-teal-700">{ini}</span>
                      </div>
                    </div>

                    {/* Name + phone */}
                    <div className="min-w-0 pr-4">
                      <p className="text-xs font-black uppercase tracking-wide text-blue-700 mb-0.5">Contact #{index + 1}</p>
                      {name
                        ? <p className="font-bold text-slate-800 truncate">{name}</p>
                          : <p className="text-blue-600 italic text-sm">No name</p>}
                      {c.phone && <p className="text-xs text-slate-700 font-semibold flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3 text-emerald-600" />{c.phone}</p>}
                      {c.notes && <p className="text-xs text-slate-600 italic truncate max-w-48">{c.notes}</p>}
                    </div>

                    {/* Email */}
                    <div className="min-w-0 pr-4">
                      <a href={`mailto:${c.email}`} className="text-sm text-blue-600 hover:underline flex items-center gap-1 truncate">
                        <Mail className="w-3.5 h-3.5 shrink-0 text-blue-400" />
                        <span className="truncate">{c.email}</span>
                      </a>
                    </div>

                    {/* Organization */}
                    <div className="min-w-0 pr-4 hidden sm:block">
                      {c.organization
                        ? <p className="text-sm text-slate-700 font-semibold flex items-center gap-1 truncate"><Building2 className="w-3.5 h-3.5 shrink-0 text-blue-600" />{c.organization}</p>
                        : <span className="text-blue-400 text-sm">—</span>}
                      <p className="mt-1">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-black ${
                          leadSource ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        }`}>
                          {leadSource ? 'Contractor Lead' : 'Internal / Manual'}
                        </span>
                      </p>
                    </div>

                    {/* Use count */}
                    <div className="text-center px-3">
                      {c.useCount > 0
                        ? <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-50 border border-orange-200 rounded-full text-xs font-bold text-orange-600">
                            <BellRing className="w-3 h-3" />{c.useCount}
                          </span>
                        : <span className="text-blue-400 text-sm">—</span>}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 justify-end">
                      <Link
                        href={`/alerts/manage-alerts?new=1&addRecipient=${encodeURIComponent(c.email)}&recipientName=${encodeURIComponent(displayName(c) || c.email)}`}
                        title="Use as alert recipient"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-colors"
                      >
                        <BellRing className="w-3.5 h-3.5" /> Use for Alert
                      </Link>
                      <button
                        onClick={() => { setEditId(c.id); setShowAddForm(false); setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50) }}
                        title="Edit"
                        className="p-2 rounded-lg text-blue-500 hover:text-blue-700 hover:bg-blue-100 transition-colors">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button onClick={() => setShareContact(c)} title="Share / Send"
                        className="p-2 rounded-lg text-blue-500 hover:text-teal-700 hover:bg-teal-100 transition-colors">
                        <MessageSquare className="w-4 h-4" />
                      </button>
                      <button onClick={() => handlePrint(c)} title="Print"
                        className="p-2 rounded-lg text-blue-500 hover:text-blue-700 hover:bg-blue-100 transition-colors">
                        <Printer className="w-4 h-4" />
                      </button>
                      {isDeleting ? (
                        <div className="flex items-center gap-1 ml-1">
                          <button onClick={() => handleDelete(c.id)}
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg transition-colors">Confirm</button>
                          <button onClick={() => setDeleteId(null)}
                            className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg transition-colors">Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteId(c.id)} title="Delete"
                          className="p-2 rounded-lg text-blue-500 hover:text-red-700 hover:bg-red-100 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-700 font-semibold">
              <span>{sourceFiltered.length} of {contacts.length} contact{contacts.length !== 1 ? 's' : ''}</span>
              {search && <button onClick={() => setSearch('')} className="text-blue-700 hover:text-red-700 font-bold">Clear filter</button>}
            </div>
          </div>
        )}

        {/* Usage info */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
            <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1">For Alerts</p>
            <p className="text-base text-slate-700 font-bold">Select contacts as recipients when creating or running alert subscriptions.</p>
            <Link href="/alerts/manage-alerts" className="mt-2 inline-flex items-center gap-1 text-xs font-black text-blue-700 hover:text-blue-800">
              Manage Alerts <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
            <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1">For Searches</p>
            <p className="text-base text-slate-700 font-bold">Share saved search results with contacts directly from the searches page.</p>
            <Link href="/alerts/manage-searches" className="mt-2 inline-flex items-center gap-1 text-xs font-black text-blue-700 hover:text-blue-800">
              Manage Searches <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
            <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-1">For Opportunities</p>
            <p className="text-base text-slate-700 font-bold">Forward saved opportunities to contacts for review, bid decisions, or team routing.</p>
            <Link href="/dashboard/saved-opportunities" className="mt-2 inline-flex items-center gap-1 text-xs font-black text-blue-700 hover:text-blue-800">
              Saved Opportunities <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>

        <style jsx global>{`
          .contacts-page .text-xs { font-size: 0.9rem; line-height: 1.35rem; }
          .contacts-page .text-sm { font-size: 1rem; line-height: 1.5rem; }
          .contacts-page .text-base { font-size: 1.05rem; line-height: 1.6rem; }
        `}</style>
      </div>
    </div>
  )
}

export default function ContactsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ContactsContent />
    </Suspense>
  )
}
