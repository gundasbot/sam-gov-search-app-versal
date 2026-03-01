'use client'

import { useState } from 'react'
import { PlayCircle, Loader2, X, StopCircle, Mail, FileSpreadsheet, Users, Check, UserPlus, TrendingUp, BookUser, ChevronDown, ChevronUp, Plus, Search } from 'lucide-react'

interface Recipient {
  id?: string
  firstName?: string
  lastName?: string
  email: string
  phone?: string
  role?: string
  channels?: ('email' | 'sms')[]
}

interface AddressBookEntry {
  id: string
  email: string
  firstName?: string | null
  lastName?: string | null
  organization?: string | null
}

const FORMAT_OPTIONS = [
  { value: 'CSV',           label: 'CSV',          ext: '.csv'  },
  { value: 'TXT',           label: 'TXT',          ext: '.txt'  },
  { value: 'EXCEL',         label: 'Excel',        ext: '.xlsx' },
  { value: 'EXCEL_COMPACT', label: 'Excel Compact',ext: '.xlsx' },
  { value: 'XLSB',          label: 'XLSB',         ext: '.xlsb' },
]

interface RunAlertModalProps {
  isOpen: boolean
  alertName: string
  resultCount: number
  alertDetails: {
    recipients: Recipient[]
    frequency: string
    defaultFormat: string
    keywords?: string
    naics?: string
    agency?: string
    setAside?: string
    lastRunDate?: string
    lastResultCount?: number
  }
  addressBookContacts?: AddressBookEntry[]
  isRunning: boolean
  onRun: (formats: string[], extraRecipients: string[]) => void
  onSkip: () => void
  onClose: () => void
}

export function RunAlertModal({
  isOpen,
  alertName,
  resultCount,
  alertDetails,
  addressBookContacts,
  isRunning,
  onRun,
  onSkip,
  onClose,
}: RunAlertModalProps) {
  const defaultFmt = (alertDetails.defaultFormat || 'CSV').toUpperCase()
  const [selectedFormats, setSelectedFormats] = useState<string[]>(
    defaultFmt === 'NONE' ? [] : [defaultFmt]
  )
  const [extraEmail, setExtraEmail] = useState('')
  const [extraEmails, setExtraEmails] = useState<string[]>([])
  const [contactSearch, setContactSearch] = useState('')
  const [contactPickerOpen, setContactPickerOpen] = useState(false)

  if (!isOpen) return null

  const toggleFormat = (fmt: string) =>
    setSelectedFormats(prev =>
      prev.includes(fmt) ? prev.filter(f => f !== fmt) : [...prev, fmt]
    )

  const addExtra = () => {
    const e = extraEmail.trim()
    if (e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && !extraEmails.includes(e)) {
      setExtraEmails(prev => [...prev, e])
      setExtraEmail('')
    }
  }

  const emailRecipients = alertDetails.recipients.filter(
    r => r.email && (!r.channels || r.channels.includes('email'))
  )
  const totalRecipients = emailRecipients.length + extraEmails.length

  const hasAddressBook = (addressBookContacts?.length ?? 0) > 0
  const filteredContacts = (addressBookContacts ?? []).filter(c => {
    if (!contactSearch.trim()) return true
    const q = contactSearch.toLowerCase()
    return [c.email, c.firstName, c.lastName, c.organization]
      .some(v => v?.toLowerCase().includes(q))
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-slate-900 shadow-2xl border border-slate-700 flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 to-teal-700 px-5 py-4 flex items-center justify-between flex-shrink-0 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/20">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Send Results</h3>
              <p className="text-xs text-emerald-100 mt-0.5 truncate max-w-[260px]">{alertName}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Result count banner */}
        <div className="flex-shrink-0 px-5 pt-4">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${resultCount > 0 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-700/50 border-slate-600'}`}>
            <div className={`text-3xl font-black ${resultCount > 0 ? 'text-emerald-300' : 'text-slate-400'}`}>{resultCount}</div>
            <div>
              <p className={`text-sm font-bold ${resultCount > 0 ? 'text-emerald-200' : 'text-slate-300'}`}>
                {resultCount === 1 ? 'opportunity found' : 'opportunities found'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Choose formats and recipients below, then send</p>
            </div>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-5">

          {/* ── Format chips ───────────────────────────────────────────── */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" />
              Attachment Format(s) — select any combination
            </p>
            <div className="flex flex-wrap gap-2">
              {FORMAT_OPTIONS.map(fmt => {
                const active = selectedFormats.includes(fmt.value)
                return (
                  <button
                    key={fmt.value}
                    type="button"
                    onClick={() => toggleFormat(fmt.value)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border transition-all select-none ${
                      active
                        ? 'bg-cyan-600/25 border-cyan-500 text-cyan-200'
                        : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                    }`}
                  >
                    {active && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                    {fmt.label}
                    <span className="text-xs opacity-50">{fmt.ext}</span>
                  </button>
                )
              })}
              <button
                type="button"
                onClick={() => setSelectedFormats([])}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border transition-all select-none ${
                  selectedFormats.length === 0
                    ? 'bg-slate-600/40 border-slate-500 text-slate-200'
                    : 'bg-slate-800 border-slate-600 text-slate-500 hover:border-slate-500 hover:text-slate-300'
                }`}
              >
                {selectedFormats.length === 0 && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                No attachment
              </button>
            </div>
            {selectedFormats.length > 1 && (
              <p className="text-xs text-cyan-400 mt-2">
                {selectedFormats.length} attachments will be included in the email.
              </p>
            )}
          </div>

          {/* ── Recipients ─────────────────────────────────────────────── */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              Recipients
              <span className="text-slate-500 font-normal normal-case tracking-normal">
                ({totalRecipients} email{totalRecipients !== 1 ? 's' : ''})
              </span>
            </p>

            {/* Alert's configured recipients */}
            <div className="space-y-1.5 mb-3 max-h-36 overflow-y-auto">
              {emailRecipients.map((r, i) => (
                <div key={i} className="flex items-center gap-2.5 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg">
                  <Mail className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                  <span className="text-sm text-white flex-1 truncate">
                    {[r.firstName, r.lastName].filter(Boolean).join(' ') || r.email}
                  </span>
                  {(r.firstName || r.lastName) && (
                    <span className="text-xs text-slate-500 truncate max-w-[160px]">{r.email}</span>
                  )}
                  {r.role && <span className="text-xs text-slate-500 flex-shrink-0">· {r.role}</span>}
                </div>
              ))}
              {extraEmails.map((e, i) => (
                <div key={i} className="flex items-center gap-2.5 px-3 py-2 bg-emerald-900/20 border border-emerald-700/40 rounded-lg">
                  <UserPlus className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span className="text-sm text-emerald-200 flex-1 truncate">{e}</span>
                  <button type="button" onClick={() => setExtraEmails(prev => prev.filter(x => x !== e))}
                    className="text-slate-500 hover:text-red-400 transition-colors flex-shrink-0">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {emailRecipients.length === 0 && extraEmails.length === 0 && (
                <p className="text-sm text-slate-500 italic px-1">No recipients configured — add contacts below.</p>
              )}
            </div>

            {/* Address book picker */}
            {hasAddressBook && (
              <div className="border border-slate-700 rounded-xl overflow-hidden mb-3">
                <button
                  type="button"
                  onClick={() => setContactPickerOpen(p => !p)}
                  className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-800 hover:bg-slate-700/80 text-sm font-semibold text-slate-300 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <BookUser className="w-4 h-4 text-orange-400" />
                    From Address Book
                    {extraEmails.length > 0 && (
                      <span className="text-xs bg-orange-600/30 text-orange-300 border border-orange-600/40 px-1.5 py-0.5 rounded-full font-normal">
                        {extraEmails.length} added
                      </span>
                    )}
                  </span>
                  {contactPickerOpen
                    ? <ChevronUp className="w-4 h-4 text-slate-500" />
                    : <ChevronDown className="w-4 h-4 text-slate-500" />
                  }
                </button>

                {contactPickerOpen && (
                  <div className="border-t border-slate-700 bg-slate-900/60 p-3 space-y-2">
                    {/* Search input */}
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                      <input
                        type="text"
                        value={contactSearch}
                        onChange={e => setContactSearch(e.target.value)}
                        placeholder="Search by name, email, or org…"
                        className="w-full pl-8 pr-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-400 transition-colors"
                      />
                    </div>

                    {/* Contact list */}
                    <div className="max-h-48 overflow-y-auto space-y-0.5">
                      {filteredContacts.length === 0 ? (
                        <p className="text-xs text-slate-500 italic px-2 py-3 text-center">
                          {contactSearch ? 'No contacts match your search' : 'No contacts in address book'}
                        </p>
                      ) : (
                        filteredContacts.map(c => {
                          const alreadyAdded = extraEmails.includes(c.email)
                          const displayName = [c.firstName, c.lastName].filter(Boolean).join(' ') || c.email
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                if (!alreadyAdded) setExtraEmails(prev => [...prev, c.email])
                                else setExtraEmails(prev => prev.filter(x => x !== c.email))
                              }}
                              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors ${
                                alreadyAdded
                                  ? 'bg-emerald-900/20 border border-emerald-700/30'
                                  : 'hover:bg-slate-700/60'
                              }`}
                            >
                              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                alreadyAdded ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600'
                              }`}>
                                {alreadyAdded && <Check className="w-2.5 h-2.5 text-white" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-white font-medium truncate">{displayName}</p>
                                {displayName !== c.email && (
                                  <p className="text-xs text-slate-500 truncate">{c.email}</p>
                                )}
                                {c.organization && (
                                  <p className="text-xs text-slate-600 truncate">{c.organization}</p>
                                )}
                              </div>
                            </button>
                          )
                        })
                      )}
                    </div>

                    {filteredContacts.length > 0 && (
                      <div className="flex justify-between pt-1 border-t border-slate-700/50">
                        <button type="button"
                          onClick={() => {
                            const toAdd = filteredContacts
                              .map(c => c.email)
                              .filter(e => !extraEmails.includes(e))
                            setExtraEmails(prev => [...prev, ...toAdd])
                          }}
                          className="text-xs text-orange-400 hover:text-orange-300 font-semibold transition-colors">
                          Select All ({filteredContacts.length})
                        </button>
                        {extraEmails.length > 0 && (
                          <button type="button"
                            onClick={() => setExtraEmails([])}
                            className="text-xs text-slate-500 hover:text-white transition-colors">
                            Clear Added
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Manual email input */}
            <div className="flex gap-2">
              <input
                type="email"
                value={extraEmail}
                onChange={e => setExtraEmail(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addExtra() } }}
                placeholder={hasAddressBook ? 'Or type an email address…' : 'Add extra email for this run…'}
                className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
              />
              <button type="button" onClick={addExtra}
                className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm font-semibold transition-colors">
                Add
              </button>
            </div>
          </div>

          {/* ── Search criteria summary ─────────────────────────────────── */}
          {(alertDetails.keywords || alertDetails.naics || alertDetails.agency || alertDetails.setAside) && (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Search Criteria</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {alertDetails.keywords && (
                  <span className="text-xs text-slate-300"><span className="text-slate-500">Keywords:</span> {alertDetails.keywords}</span>
                )}
                {alertDetails.naics && (
                  <span className="text-xs text-slate-300"><span className="text-slate-500">NAICS:</span> {alertDetails.naics}</span>
                )}
                {alertDetails.agency && (
                  <span className="text-xs text-slate-300"><span className="text-slate-500">Agency:</span> {alertDetails.agency}</span>
                )}
                {alertDetails.setAside && (
                  <span className="text-xs text-slate-300"><span className="text-slate-500">Set-Aside:</span> {alertDetails.setAside}</span>
                )}
              </div>
            </div>
          )}

          {/* Running status */}
          {isRunning && (
            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4 flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-cyan-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-cyan-300">Searching SAM.gov…</p>
                <p className="text-xs text-cyan-400 mt-0.5">Generating attachments and sending email</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 bg-slate-900/80 border-t border-slate-700 flex items-center justify-between flex-shrink-0 rounded-b-2xl">
          <span className="text-xs text-slate-500">
            {selectedFormats.length > 0
              ? `${selectedFormats.length} file${selectedFormats.length > 1 ? 's' : ''} • ${totalRecipients} recipient${totalRecipients !== 1 ? 's' : ''}`
              : `No attachment • ${totalRecipients} recipient${totalRecipients !== 1 ? 's' : ''}`}
          </span>
          <div className="flex items-center gap-3">
            {isRunning ? (
              <button onClick={onSkip}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold flex items-center gap-2 transition-all">
                <StopCircle className="w-4 h-4" /> Stop
              </button>
            ) : (
              <>
                <button onClick={onSkip}
                  className="px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium transition-colors text-sm">
                  Skip, don&apos;t send
                </button>
                <button
                  onClick={() => onRun(selectedFormats, extraEmails)}
                  disabled={totalRecipients === 0 || resultCount === 0}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-sm">
                  <Mail className="w-4 h-4" />
                  Send Email
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
