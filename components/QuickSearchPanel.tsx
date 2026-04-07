'use client'
import { useState, useCallback, useRef } from 'react'
import {
  Zap, Search, X, ChevronDown, ChevronUp, Check,
  Calendar, Clock, Building2, ExternalLink, Save,
  BellRing, AlertCircle, Loader2
} from 'lucide-react'
import Link from 'next/link'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface QuickSearchParams {
  keyword?: string
  ncode?: string
  ccode?: string
  states?: string[]
  ptypes?: string[]
  setAside?: string
  organizationName?: string
}

interface QuickSearchPanelProps {
  onSaveSearch: (params: QuickSearchParams) => void
  onCreateAlert: (params: QuickSearchParams) => void
  theme?: 'dark' | 'light'
}

interface Opportunity {
  noticeId: string
  title: string
  deptname?: string
  organizationName?: string
  postedDate?: string
  responseDeadline?: string
  typeOfSetAside?: string
  typeOfSetAsideDescription?: string
  type?: string
  naicsCode?: string
  placeOfPerformanceState?: string
}

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ')
}

// ---------------------------------------------------------------------------
// Static option lists (self-contained)
// ---------------------------------------------------------------------------
const PTYPE_OPTIONS = [
  { value: 'o', label: 'Solicitation' },
  { value: 'p', label: 'Presolicitation' },
  { value: 'k', label: 'Combined Synopsis/Solicitation' },
  { value: 'r', label: 'Sources Sought' },
  { value: 's', label: 'Special Notice' },
  { value: 'a', label: 'Award Notice' },
]

const SET_ASIDE_OPTIONS = [
  { value: 'SBA',     label: 'Small Business' },
  { value: '8A',      label: '8(a) Sole Source' },
  { value: '8AN',     label: '8(a) Competitive' },
  { value: 'HZC',     label: 'HUBZone Set-Aside' },
  { value: 'SDVOSBC', label: 'SDVOSB' },
  { value: 'WOSB',    label: 'WOSB' },
  { value: 'EDWOSB',  label: 'EDWOSB' },
  { value: 'VSB',     label: 'Veteran-Owned SB' },
]

const US_STATES = [
  { value: 'AL', label: 'Alabama' }, { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' }, { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' }, { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' }, { value: 'DE', label: 'Delaware' },
  { value: 'DC', label: 'DC' }, { value: 'FL', label: 'Florida' },
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
  { value: 'WY', label: 'Wyoming' },
]

// ---------------------------------------------------------------------------
// Tiny multi-select used only in this component
// ---------------------------------------------------------------------------
function MiniMultiSelect({
  options, selected, onChange, placeholder,
}: {
  options: { value: string; label: string }[]
  selected: string[]
  onChange: (v: string[]) => void
  placeholder: string
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  const toggle = (v: string) =>
    onChange(selected.includes(v) ? selected.filter(x => x !== v) : [...selected, v])

  const filtered = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
  const label = selected.length === 0 ? placeholder
    : selected.length === 1 ? (options.find(o => o.value === selected[0])?.label ?? selected[0])
    : `${selected.length} selected`

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => { setOpen(o => !o); setSearch('') }}
        onBlur={e => { if (!ref.current?.contains(e.relatedTarget as Node)) setOpen(false) }}
        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-left text-sm focus:outline-none focus:border-orange-400 flex items-center justify-between gap-1.5 min-h-[38px]"
      >
        <span className={selected.length === 0 ? 'text-slate-400 truncate' : 'text-white truncate'}>{label}</span>
        <div className="flex items-center gap-1 flex-shrink-0">
          {selected.length > 0 && (
            <span
              onMouseDown={e => { e.preventDefault(); e.stopPropagation(); onChange([]) }}
              className="text-slate-400 hover:text-red-400 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </span>
          )}
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-[180px] bg-slate-800 border border-slate-600 rounded-xl shadow-2xl overflow-hidden">
          {options.length > 6 && (
            <div className="p-2 border-b border-slate-700">
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search…" autoFocus
                className="w-full px-2.5 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-white text-xs placeholder-slate-500 focus:outline-none focus:border-orange-400"
              />
            </div>
          )}
          <div className="max-h-48 overflow-y-auto">
            {filtered.map(o => (
              <button key={o.value} type="button" onMouseDown={e => { e.preventDefault(); toggle(o.value) }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-slate-700/80 flex items-center gap-2">
                <span className={`w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center ${selected.includes(o.value) ? 'bg-orange-500 border-orange-500' : 'border-slate-500 bg-slate-800'}`}>
                  {selected.includes(o.value) && <Check className="w-2 h-2 text-white" />}
                </span>
                <span className={selected.includes(o.value) ? 'text-orange-300 font-medium' : 'text-slate-200'}>{o.label}</span>
              </button>
            ))}
            {filtered.length === 0 && <div className="px-3 py-3 text-xs text-slate-500 text-center">No matches</div>}
          </div>
          {selected.length > 0 && (
            <div className="border-t border-slate-700 p-1.5">
              <button type="button" onMouseDown={e => { e.preventDefault(); onChange([]); setOpen(false) }}
                className="w-full text-xs text-slate-400 hover:text-red-400 py-1 text-center">
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDate(raw?: string): string {
  if (!raw) return '—'
  try { return new Date(raw).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }
  catch { return raw }
}

function deadlineColor(raw?: string): string {
  if (!raw) return 'text-slate-400'
  const diff = (new Date(raw).getTime() - Date.now()) / 86400000
  if (diff < 0) return 'text-slate-500 line-through'
  if (diff < 7) return 'text-red-400'
  if (diff < 21) return 'text-amber-400'
  return 'text-slate-400'
}

function buildSAMUrl(noticeId: string): string {
  return `https://sam.gov/opp/${noticeId}/view`
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function QuickSearchPanel({ onSaveSearch, onCreateAlert, theme = 'dark' }: QuickSearchPanelProps) {
  const [expanded, setExpanded] = useState(false)
  const [form, setForm] = useState<QuickSearchParams>({
    keyword: '', ncode: '', ccode: '', states: [], ptypes: [], setAside: '', organizationName: '',
  })
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Opportunity[] | null>(null)
  const [totalRecords, setTotalRecords] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [hasRun, setHasRun] = useState(false)
  const resultsRef = useRef<HTMLDivElement>(null)

  const hasFilters = !!(
    form.keyword?.trim() || form.ncode?.trim() || form.ccode?.trim() ||
    (form.states?.length ?? 0) > 0 || (form.ptypes?.length ?? 0) > 0 ||
    form.setAside?.trim() || form.organizationName?.trim()
  )

  const runSearch = useCallback(async () => {
    if (!hasFilters) return
    setLoading(true)
    setError(null)
    try {
      const p = new URLSearchParams()
      if (form.keyword?.trim())         p.set('title', form.keyword.trim())
      if (form.ncode?.trim())           p.set('ncode', form.ncode.trim())
      if (form.ccode?.trim())           p.set('ccode', form.ccode.trim())
      if (form.states?.length)          p.set('state', form.states.join(','))
      if (form.ptypes?.length)          p.set('ptype', form.ptypes.join(','))
      if (form.setAside?.trim())        p.set('typeOfSetAside', form.setAside.trim())
      if (form.organizationName?.trim()) p.set('organizationName', form.organizationName.trim())
      p.set('limit', '25')

      const res = await fetch(`/api/sam?${p.toString()}`)
      if (!res.ok) throw new Error(`Search failed (${res.status})`)
      const data = await res.json()

      const opps: Opportunity[] = (data.opportunitiesData ?? data.data ?? data ?? [])
      setResults(opps)
      setTotalRecords(data.totalRecords ?? opps.length)
      setHasRun(true)
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed.')
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [form, hasFilters])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') runSearch()
  }

  const reset = () => {
    setForm({ keyword: '', ncode: '', ccode: '', states: [], ptypes: [], setAside: '', organizationName: '' })
    setResults(null)
    setHasRun(false)
    setError(null)
  }

  const isLight = theme === 'light'
  const inp = isLight
    ? 'w-full px-3 py-2 bg-white border border-blue-300 rounded-lg text-blue-900 placeholder-blue-700 text-base font-semibold focus:outline-none focus:border-blue-600 transition-colors'
    : 'w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 text-sm focus:outline-none focus:border-orange-400 transition-colors'

  return (
    <div className={`mb-7 rounded-2xl overflow-hidden shadow-lg quick-search-panel ${theme === 'light' ? 'quick-search-light' : ''} ${theme === 'light' ? 'bg-white border-2 border-blue-300' : 'bg-slate-800/50 border border-slate-700'}`}>

      {/* ── Header / toggle ── */}
      <button
        type="button"
        onClick={() => setExpanded(e => !e)}
        className={cx(
          'w-full flex items-center justify-between px-5 py-3.5 transition-colors',
          isLight ? 'hover:bg-blue-50' : 'hover:bg-slate-700/40'
        )}
      >
        <div className="flex items-center gap-3">
          <div className={cx(
            'w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0',
            isLight ? 'bg-orange-100 border-orange-300' : 'bg-orange-500/20 border-orange-500/30'
          )}>
            <Zap className={cx('w-4 h-4', isLight ? 'text-orange-600' : 'text-orange-400')} />
          </div>
          <div className="text-left">
            <p className={cx('font-black', isLight ? 'text-base text-blue-900' : 'text-sm text-white')}>Quick Search</p>
            <p className={cx(isLight ? 'text-sm text-blue-800 font-semibold' : 'text-xs text-slate-500')}>Enter criteria, run instantly, then save or create an alert</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasRun && results !== null && (
            <span className={cx(
              'px-2 py-0.5 rounded-full font-bold',
              isLight ? 'text-sm bg-emerald-100 border border-emerald-300 text-emerald-700' : 'text-xs bg-teal-500/20 border border-teal-500/30 text-teal-300'
            )}>
              {totalRecords.toLocaleString()} results
            </span>
          )}
          {expanded
            ? <ChevronUp className={cx('w-4 h-4', isLight ? 'text-blue-700' : 'text-slate-400')} />
            : <ChevronDown className={cx('w-4 h-4', isLight ? 'text-blue-700' : 'text-slate-400')} />
          }
        </div>
      </button>

      {/* ── Expanded body ── */}
      {expanded && (
        <div className={cx('border-t px-5 py-5', isLight ? 'border-blue-200 bg-white' : 'border-slate-700/60')}>

          {/* Keyword row */}
          <div className="mb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              <input
                type="text"
                value={form.keyword || ''}
                onChange={e => setForm(f => ({ ...f, keyword: e.target.value }))}
                onKeyDown={handleKeyDown}
                placeholder="Keywords — e.g., data analytics, cybersecurity, facilities…"
                autoFocus
                className={cx(
                  'w-full pl-10 pr-4 py-2.5 rounded-xl transition-colors focus:outline-none',
                  isLight
                    ? 'bg-white border border-blue-300 text-blue-900 placeholder-blue-700 text-base font-semibold focus:border-blue-600'
                    : 'bg-slate-700 border border-slate-600 text-white placeholder-slate-400 text-sm focus:border-orange-400'
                )}
              />
              {form.keyword && (
                <button onClick={() => setForm(f => ({ ...f, keyword: '' }))}
                  className={cx('absolute right-3 top-1/2 -translate-y-1/2', isLight ? 'text-blue-600 hover:text-blue-900' : 'text-slate-500 hover:text-white')}>
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Filter grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 mb-4">
            <div>
              <label className={cx('block mb-1 font-semibold', isLight ? 'text-sm text-blue-900' : 'text-xs text-slate-500')}>NAICS</label>
              <input type="text" value={form.ncode || ''} onChange={e => setForm(f => ({ ...f, ncode: e.target.value }))}
                onKeyDown={handleKeyDown} placeholder="e.g. 541512" className={inp} />
            </div>
            <div>
              <label className={cx('block mb-1 font-semibold', isLight ? 'text-sm text-blue-900' : 'text-xs text-slate-500')}>PSC Code</label>
              <input type="text" value={form.ccode || ''} onChange={e => setForm(f => ({ ...f, ccode: e.target.value }))}
                onKeyDown={handleKeyDown} placeholder="e.g. D399" className={inp} />
            </div>
            <div>
              <label className={cx('block mb-1 font-semibold', isLight ? 'text-sm text-blue-900' : 'text-xs text-slate-500')}>State</label>
              <MiniMultiSelect options={US_STATES} selected={form.states ?? []}
                onChange={v => setForm(f => ({ ...f, states: v }))} placeholder="Any state" />
            </div>
            <div>
              <label className={cx('block mb-1 font-semibold', isLight ? 'text-sm text-blue-900' : 'text-xs text-slate-500')}>Set-Aside</label>
              <select value={form.setAside || ''}
                onChange={e => setForm(f => ({ ...f, setAside: e.target.value }))}
                className={inp}>
                <option value="">Any</option>
                {SET_ASIDE_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className={cx('block mb-1 font-semibold', isLight ? 'text-sm text-blue-900' : 'text-xs text-slate-500')}>Type</label>
              <MiniMultiSelect options={PTYPE_OPTIONS} selected={form.ptypes ?? []}
                onChange={v => setForm(f => ({ ...f, ptypes: v }))} placeholder="Any type" />
            </div>
            <div>
              <label className={cx('block mb-1 font-semibold', isLight ? 'text-sm text-blue-900' : 'text-xs text-slate-500')}>Agency</label>
              <input type="text" value={form.organizationName || ''} onChange={e => setForm(f => ({ ...f, organizationName: e.target.value }))}
                onKeyDown={handleKeyDown} placeholder="e.g. DoD" className={inp} />
            </div>
          </div>

          {/* Run / Clear row */}
          <div className="flex items-center gap-3 mb-5">
            <button
              type="button"
              onClick={runSearch}
              disabled={loading || !hasFilters}
              className={cx(
                'flex items-center gap-2 px-5 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black rounded-xl transition-colors',
                isLight ? 'text-base bg-orange-600 hover:bg-orange-700 shadow-md' : 'text-sm bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-900/30'
              )}
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Searching…</>
                : <><Search className="w-4 h-4" /> Run Search</>
              }
            </button>
            {(hasFilters || hasRun) && (
              <button type="button" onClick={reset}
                className={cx(
                  'transition-colors flex items-center gap-1.5 font-semibold',
                  isLight ? 'text-base text-blue-700 hover:text-blue-900' : 'text-sm text-slate-500 hover:text-slate-300'
                )}>
                <X className="w-3.5 h-3.5" /> Clear
              </button>
            )}
            {!hasFilters && !loading && (
              <p className={cx(isLight ? 'text-sm text-blue-700 font-semibold' : 'text-xs text-slate-600')}>Enter at least one filter to run a search</p>
            )}
          </div>

          {/* ── Error ── */}
          {error && (
            <div className={cx(
              'flex items-center gap-2.5 px-4 py-3 rounded-xl mb-4 text-sm font-semibold',
              isLight ? 'bg-red-100 border border-red-300 text-red-700' : 'bg-red-950/40 border border-red-500/40 text-red-300'
            )}>
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}

          {/* ── Results ── */}
          {hasRun && results !== null && (
            <div ref={resultsRef}>
              {/* Result count + actions header */}
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className={cx('font-black', isLight ? 'text-base text-blue-900' : 'text-sm text-white')}>
                    {results.length === 0 ? 'No results' : `${results.length} of ${totalRecords.toLocaleString()} results`}
                  </span>
                  {totalRecords > 25 && (
                    <span className={cx(isLight ? 'text-sm text-blue-700' : 'text-xs text-slate-500')}>(showing first 25)</span>
                  )}
                </div>
                {results.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSaveSearch(form)}
                      className={cx(
                        'qs-action-save flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-colors',
                        isLight
                          ? 'bg-teal-600 hover:bg-teal-700 border border-teal-700 text-white text-sm font-black shadow-sm'
                          : 'bg-teal-600/20 hover:bg-teal-600/30 border border-teal-600/40 text-teal-300 hover:text-teal-200 text-xs font-bold'
                      )}
                    >
                      <Save className="w-3.5 h-3.5" /> Save as Search
                    </button>
                    <button
                      onClick={() => onCreateAlert(form)}
                      className={cx(
                        'qs-action-alert flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-colors',
                        isLight
                          ? 'bg-orange-600 hover:bg-orange-700 border border-orange-700 text-white text-sm font-black shadow-sm'
                          : 'bg-orange-600/20 hover:bg-orange-600/30 border border-orange-600/40 text-orange-300 hover:text-orange-200 text-xs font-bold'
                      )}
                    >
                      <BellRing className="w-3.5 h-3.5" /> Create Alert
                    </button>
                    <Link
                      href={`/search?${new URLSearchParams({
                        ...(form.keyword ? { title: form.keyword } : {}),
                        ...(form.ncode ? { ncode: form.ncode } : {}),
                        ...(form.ccode ? { ccode: form.ccode } : {}),
                        ...(form.states?.length ? { state: form.states.join(',') } : {}),
                        ...(form.ptypes?.length ? { ptype: form.ptypes.join(',') } : {}),
                        ...(form.setAside ? { typeOfSetAside: form.setAside } : {}),
                        ...(form.organizationName ? { organizationName: form.organizationName } : {}),
                      }).toString()}`}
                      className={cx(
                        'qs-action-full-search flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-colors',
                        isLight
                          ? 'bg-blue-700 hover:bg-blue-800 border border-blue-800 text-white text-sm font-black shadow-sm'
                          : 'bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-300 hover:text-white text-xs font-bold'
                      )}
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Full Search
                    </Link>
                  </div>
                )}
              </div>

              {results.length === 0 ? (
                <div className={cx(
                  'text-center py-10 rounded-xl',
                  isLight ? 'bg-blue-50 border border-blue-200' : 'bg-slate-900/40 border border-slate-700'
                )}>
                  <Search className={cx('w-8 h-8 mx-auto mb-2', isLight ? 'text-blue-400' : 'text-slate-700')} />
                  <p className={cx('font-medium', isLight ? 'text-blue-900 text-base' : 'text-slate-400 text-sm')}>No opportunities found for these criteria</p>
                  <p className={cx('mt-1', isLight ? 'text-blue-700 text-sm font-semibold' : 'text-slate-600 text-xs')}>Try broadening your search</p>
                </div>
              ) : (
                <div className={cx(
                  'max-h-[420px] overflow-y-auto rounded-xl divide-y',
                  isLight ? 'border border-blue-300 divide-blue-200' : 'border border-slate-700 divide-slate-700/60'
                )}>
                  {results.map((opp, i) => (
                    <div key={opp.noticeId || i} className={cx(
                      'px-4 py-3.5 transition-colors group',
                      isLight ? 'hover:bg-blue-50' : 'hover:bg-slate-700/30'
                    )}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <a
                            href={buildSAMUrl(opp.noticeId)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cx(
                              'font-bold transition-colors line-clamp-2 leading-snug',
                              isLight ? 'text-base text-blue-900 group-hover:text-blue-700' : 'text-sm text-white group-hover:text-orange-300'
                            )}
                          >
                            {opp.title || 'Untitled'}
                          </a>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                            {(opp.deptname || opp.organizationName) && (
                              <span className={cx(
                                'flex items-center gap-1',
                                isLight ? 'text-sm text-blue-800 font-semibold' : 'text-xs text-slate-400'
                              )}>
                                <Building2 className={cx('w-3 h-3', isLight ? 'text-blue-600' : 'text-slate-600')} />
                                {opp.deptname || opp.organizationName}
                              </span>
                            )}
                            {opp.postedDate && (
                              <span className={cx(
                                'flex items-center gap-1',
                                isLight ? 'text-sm text-blue-700 font-semibold' : 'text-xs text-slate-500'
                              )}>
                                <Calendar className="w-3 h-3" /> {formatDate(opp.postedDate)}
                              </span>
                            )}
                            {opp.responseDeadline && (
                              <span className={`text-xs flex items-center gap-1 ${deadlineColor(opp.responseDeadline)}`}>
                                <Clock className="w-3 h-3" /> Due {formatDate(opp.responseDeadline)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {opp.typeOfSetAsideDescription && (
                            <span className={cx(
                              'hidden sm:inline px-2 py-0.5 rounded-full whitespace-nowrap',
                              isLight
                                ? 'text-sm bg-orange-100 border border-orange-300 text-orange-800 font-bold'
                                : 'text-xs bg-slate-700/80 border border-slate-600 text-slate-300 font-medium'
                            )}>
                              {opp.typeOfSetAsideDescription}
                            </span>
                          )}
                          <a
                            href={buildSAMUrl(opp.noticeId)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cx(
                              'p-1 transition-colors',
                              isLight ? 'text-blue-600 hover:text-blue-900' : 'text-slate-600 hover:text-slate-300'
                            )}
                            title="View on SAM.gov"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Bottom actions (repeated for convenience when list is long) */}
              {results.length > 5 && (
                <div className="flex items-center gap-2 mt-3 justify-end">
                  <button onClick={() => onSaveSearch(form)}
                    className={cx(
                      'flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-colors',
                      isLight
                        ? 'bg-teal-600 hover:bg-teal-700 border border-teal-700 text-white text-sm font-black shadow-sm'
                        : 'bg-teal-600/20 hover:bg-teal-600/30 border border-teal-600/40 text-teal-300 hover:text-teal-200 text-xs font-bold'
                    )}>
                    <Save className="w-3.5 h-3.5" /> Save as Search
                  </button>
                  <button onClick={() => onCreateAlert(form)}
                    className={cx(
                      'flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-colors',
                      isLight
                        ? 'bg-orange-600 hover:bg-orange-700 border border-orange-700 text-white text-sm font-black shadow-sm'
                        : 'bg-orange-600/20 hover:bg-orange-600/30 border border-orange-600/40 text-orange-300 hover:text-orange-200 text-xs font-bold'
                    )}>
                    <BellRing className="w-3.5 h-3.5" /> Create Alert
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
