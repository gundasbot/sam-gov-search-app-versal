'use client'

import { useState } from 'react'
import { X, Search, Building2, Loader2, Check, Download, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'

interface POC {
  firstName: string
  lastName: string
  email: string
  title?: string
}

interface EntityResult {
  uei: string
  cage: string
  legalBusinessName: string
  govPOC?: POC
  elecPOC?: POC
}

interface ContactImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImported: (count: number) => void
}

function hasEmail(entity: EntityResult): boolean {
  return !!(entity.govPOC?.email || entity.elecPOC?.email)
}

function countContacts(entities: EntityResult[], selected: Set<string>): number {
  return [...selected].reduce((sum, uei) => {
    const e = entities.find(x => x.uei === uei)
    if (!e) return sum
    let n = 0
    if (e.govPOC?.email) n++
    if (e.elecPOC?.email) n++
    return sum + n
  }, 0)
}

function POCCell({ poc, label }: { poc?: POC; label: string }) {
  if (!poc?.email) {
    return <span className="text-slate-600 italic text-xs">—</span>
  }
  return (
    <div className="text-xs leading-snug">
      <p className="text-slate-300 font-medium">{[poc.firstName, poc.lastName].filter(Boolean).join(' ') || poc.email}</p>
      <p className="text-slate-500 truncate max-w-[160px]">{poc.email}</p>
      {poc.title && <p className="text-slate-600">{poc.title}</p>}
    </div>
  )
}

export function ContactImportModal({ isOpen, onClose, onImported }: ContactImportModalProps) {
  const [query, setQuery] = useState('')
  const [naics, setNaics] = useState('')
  const [state, setState] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<EntityResult[] | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  if (!isOpen) return null

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setError(null)
    setResults(null)
    setSelected(new Set())
    setHasSearched(true)
    try {
      const params = new URLSearchParams({ q: query.trim() })
      if (naics.trim()) params.set('naics', naics.trim())
      if (state.trim()) params.set('state', state.trim().toUpperCase())
      const res = await fetch(`/api/sam/entities?${params.toString()}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Search failed')
      setResults(Array.isArray(data) ? data : [])
    } catch (err: any) {
      setError(err.message || 'Failed to search SAM.gov')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const toggleEntity = (uei: string, entity: EntityResult) => {
    if (!hasEmail(entity)) return
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(uei)) next.delete(uei); else next.add(uei)
      return next
    })
  }

  const selectAll = () => {
    if (!results) return
    setSelected(new Set(results.filter(hasEmail).map(e => e.uei)))
  }

  const deselectAll = () => setSelected(new Set())

  const handleImport = async () => {
    if (!results || selected.size === 0) return
    setImporting(true)
    setError(null)
    try {
      const contacts: Array<{ email: string; firstName?: string; lastName?: string; organization: string; notes: string }> = []
      for (const uei of selected) {
        const entity = results.find(e => e.uei === uei)
        if (!entity) continue
        const notes = `UEI: ${entity.uei}${entity.cage ? ` | CAGE: ${entity.cage}` : ''}`
        if (entity.govPOC?.email) {
          contacts.push({
            firstName: entity.govPOC.firstName,
            lastName: entity.govPOC.lastName,
            email: entity.govPOC.email,
            organization: entity.legalBusinessName,
            notes,
          })
        }
        if (entity.elecPOC?.email && entity.elecPOC.email !== entity.govPOC?.email) {
          contacts.push({
            firstName: entity.elecPOC.firstName,
            lastName: entity.elecPOC.lastName,
            email: entity.elecPOC.email,
            organization: entity.legalBusinessName,
            notes,
          })
        }
      }
      const res = await fetch('/api/address-book/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contacts }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Import failed')
      onImported(data.imported as number)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  const selectableCount = results ? results.filter(hasEmail).length : 0
  const selectedContactCount = results ? countContacts(results, selected) : 0
  const allSelected = selectableCount > 0 && selected.size === selectableCount

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="w-full max-w-4xl rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 shadow-2xl border border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-5 flex items-center justify-between flex-shrink-0 border-b border-slate-600">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/20 border border-orange-500/30">
              <Building2 className="h-5 w-5 text-orange-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Import Contacts from SAM.gov</h3>
              <p className="text-xs text-slate-400 mt-0.5">Search registered businesses and import their POC contacts</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search form */}
        <form onSubmit={handleSearch} className="px-6 py-4 border-b border-slate-700 flex-shrink-0">
          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Business Name <span className="text-orange-400">*</span></label>
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="e.g. Lockheed Martin, Booz Allen..."
                required
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-orange-400 transition-colors"
              />
            </div>
            <div className="w-36">
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">NAICS Code</label>
              <input
                type="text"
                value={naics}
                onChange={e => setNaics(e.target.value)}
                placeholder="e.g. 541512"
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-orange-400 transition-colors"
              />
            </div>
            <div className="w-28">
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">State</label>
              <input
                type="text"
                value={state}
                onChange={e => setState(e.target.value.toUpperCase().slice(0, 2))}
                placeholder="VA"
                maxLength={2}
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-orange-400 transition-colors"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg text-sm flex items-center gap-2 transition-colors"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                {loading ? 'Searching…' : 'Search'}
              </button>
            </div>
          </div>
        </form>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {error && (
            <div className="m-4 flex items-start gap-3 bg-red-950/50 border border-red-500/40 rounded-xl p-4">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 className="w-10 h-10 text-orange-400 animate-spin" />
              <p className="text-sm text-slate-400">Searching SAM.gov registered businesses…</p>
            </div>
          )}

          {!loading && results !== null && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Building2 className="w-12 h-12 text-slate-700" />
              <p className="text-sm font-semibold text-slate-400">No results found</p>
              <p className="text-xs text-slate-600">Try a different business name or remove the NAICS/State filter</p>
            </div>
          )}

          {!loading && results !== null && results.length > 0 && (
            <div>
              {/* Select all / deselect row */}
              <div className="flex items-center justify-between px-5 py-2.5 bg-slate-800/60 border-b border-slate-700 sticky top-0">
                <span className="text-xs text-slate-400">
                  {results.length} business{results.length !== 1 ? 'es' : ''} found
                  {selectableCount < results.length && (
                    <span className="text-slate-600"> · {results.length - selectableCount} with no email</span>
                  )}
                </span>
                <div className="flex gap-3">
                  {!allSelected
                    ? <button type="button" onClick={selectAll} className="text-xs font-semibold text-orange-400 hover:text-orange-300 transition-colors">Select All</button>
                    : <button type="button" onClick={deselectAll} className="text-xs font-semibold text-slate-400 hover:text-white transition-colors">Deselect All</button>
                  }
                </div>
              </div>

              {/* Table */}
              <table className="w-full text-left table-fixed">
                <thead>
                  <tr className="text-xs text-slate-500 border-b border-slate-700/50">
                    <th className="w-8 pl-5 py-2.5"></th>
                    <th className="w-[30%] py-2.5 pr-3">Business Name</th>
                    <th className="w-[18%] py-2.5 pr-3">UEI / CAGE</th>
                    <th className="w-[22%] py-2.5 pr-3">Gov POC</th>
                    <th className="w-[22%] py-2.5 pr-4">Elec POC</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map(entity => {
                    const isSelectable = hasEmail(entity)
                    const isSel = selected.has(entity.uei)
                    return (
                      <tr
                        key={entity.uei}
                        onClick={() => toggleEntity(entity.uei, entity)}
                        className={`border-b border-slate-700/40 transition-colors ${
                          isSelectable
                            ? `cursor-pointer ${isSel ? 'bg-orange-500/8' : 'hover:bg-slate-700/30'}`
                            : 'opacity-40 cursor-not-allowed'
                        }`}
                      >
                        <td className="pl-5 py-3">
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                            isSel ? 'bg-orange-500 border-orange-500' : 'border-slate-600 bg-slate-800'
                          } ${!isSelectable ? 'opacity-30' : ''}`}>
                            {isSel && <Check className="w-2.5 h-2.5 text-white" />}
                          </div>
                        </td>
                        <td className="py-3 pr-3">
                          <p className="text-sm text-white font-semibold leading-snug line-clamp-2">{entity.legalBusinessName}</p>
                          {!isSelectable && <p className="text-xs text-slate-600 italic mt-0.5">No email on file</p>}
                        </td>
                        <td className="py-3 pr-3">
                          <div className="text-xs leading-snug">
                            {entity.uei && <p className="text-slate-400 font-mono">{entity.uei}</p>}
                            {entity.cage && <p className="text-slate-500 font-mono">{entity.cage}</p>}
                          </div>
                        </td>
                        <td className="py-3 pr-3">
                          <POCCell poc={entity.govPOC} label="Gov" />
                        </td>
                        <td className="py-3 pr-4">
                          <POCCell poc={entity.elecPOC} label="Elec" />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!hasSearched && !loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-8">
              <Search className="w-12 h-12 text-slate-700" />
              <p className="text-sm font-semibold text-slate-400">Search SAM.gov Registered Businesses</p>
              <p className="text-xs text-slate-600 max-w-sm">
                Enter a business name above to find actively registered SAM.gov entities and import their points of contact.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-900/60 border-t border-slate-700 flex items-center justify-between flex-shrink-0">
          <div className="text-sm text-slate-400">
            {selected.size > 0
              ? <span className="text-orange-300 font-semibold">{selectedContactCount} contact{selectedContactCount !== 1 ? 's' : ''} selected</span>
              : <span>Select businesses to import their contacts</span>
            }
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={selected.size === 0 || importing}
              className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm flex items-center gap-2 transition-colors shadow-lg shadow-orange-900/30"
            >
              {importing
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Importing…</>
                : <><Download className="w-4 h-4" /> Import Selected</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
