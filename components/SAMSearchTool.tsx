'use client'
import React, { useMemo, useState } from 'react'
import {
  Search,
  Filter,
  Calendar,
  Building2,
  DollarSign,
  Clock,
  ExternalLink,
  Download,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Loader,
  FileText,
  Hash,
  MapPin,
  SlidersHorizontal,
  ArrowUpDown,
  X,
  Save,
} from 'lucide-react'
import UnifiedSaveSearchModal from '@/components/UnifiedSaveSearchModal'

const US_STATES = [
  { code: '', name: 'All States' },
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'DC', name: 'District of Columbia' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
]

interface Opportunity {
  noticeId: string
  title: string
  solicitationNumber?: string
  department?: string
  fullParentPathName?: string
  postedDate?: string
  type?: string
  responseDeadLine?: string
  naicsCode?: string
  typeOfSetAsideDescription?: string
  typeOfSetAside?: string
  description?: string
  placeOfPerformance?: {
    city?: { name: string }
    state?: { code: string }
    zip?: string
  }
  pointOfContact?: Array<{
    fullName?: string
    email?: string
    phone?: string
  }>
  award?: {
    amount?: string | number
    awardee?: {
      name?: string
    }
  }
}

interface SearchFilters {
  keywords: string
  naicsCode: string
  state: string
  postedFrom: string
  postedTo: string
  procurementType: string
  setAside: string
  limit: number
}

type ResultSort =
  | 'relevance'
  | 'posted_desc'
  | 'posted_asc'
  | 'deadline_asc'
  | 'deadline_desc'
  | 'title_asc'
  | 'agency_asc'

type ResultFilters = {
  q: string
  agency: string
  noticeType: string
  setAsideText: string
  naics: string
  state: string
  hasDeadlineOnly: boolean
  dueInDays: number | '' // deadline within X days
  sort: ResultSort
}

function samLink(noticeId?: string) {
  if (!noticeId) return '#'
  return `https://sam.gov/opp/${encodeURIComponent(noticeId)}/view`
}

function safeDate(dateString?: string) {
  if (!dateString) return null
  const d = new Date(dateString)
  if (Number.isNaN(d.getTime())) return null
  return d
}

function daysUntil(d: Date) {
  const now = new Date()
  const ms = d.getTime() - now.getTime()
  return Math.ceil(ms / (1000 * 60 * 60 * 24))
}

function normalize(s?: string) {
  return (s ?? '').toString().trim().toLowerCase()
}

interface SAMSearchToolProps {
  demoMode?: boolean
}

export default function SAMSearchTool({ demoMode = false }: SAMSearchToolProps = {}) {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedCard, setExpandedCard] = useState<number | null>(null)
  const [showResultFilters, setShowResultFilters] = useState(true)

  // Less gloomy UI option (still "pro")
  const uiMode = 'midnight'

  const [filters, setFilters] = useState<SearchFilters>({
    keywords: '',
    naicsCode: '',
    state: '',
    postedFrom: '',
    postedTo: '',
    procurementType: 'o',
    setAside: '',
    limit: 25,
  })

  const [resultFilters, setResultFilters] = useState<ResultFilters>({
    q: '',
    agency: '',
    noticeType: '',
    setAsideText: '',
    naics: '',
    state: '',
    hasDeadlineOnly: false,
    dueInDays: '',
    sort: 'relevance',
  })

  // Save search modal state
  const [showSaveModal, setShowSaveModal] = useState(false)

  // Build current search params for pre-filling the save modal
  const currentSearchParamsForModal = useMemo(() => {
    const today = new Date()
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(today.getMonth() - 6)
    return {
      title: filters.keywords || undefined,
      ncode: filters.naicsCode || undefined,
      state: filters.state || undefined,
      typeOfSetAside: filters.setAside || undefined,
      ptype: filters.procurementType || undefined,
      postedFrom: filters.postedFrom || undefined,
      postedTo: filters.postedTo || undefined,
    }
  }, [filters])

  const setAsideTypes = [
    { value: '', label: 'All opportunities' },
    { value: 'SBA', label: 'Small Business Set-Aside' },
    { value: 'VSA', label: 'Veteran-Owned Small Business' },
    { value: 'SDVOSB', label: 'Service-Disabled VOSB' },
    { value: '8A', label: '8(a) Set-Aside' },
    { value: 'HZC', label: 'HUBZone Set-Aside' },
    { value: 'WOSB', label: 'Women-Owned Small Business' },
    { value: 'EDWOSB', label: 'Economically Disadvantaged WOSB' },
  ]

  const suggestedNAICS = [
    { code: '518210', desc: 'Data Processing, Hosting, and Related Services' },
    { code: '541511', desc: 'Custom Computer Programming Services' },
    { code: '541512', desc: 'Computer Systems Design Services' },
    { code: '541513', desc: 'Computer Facilities Management Services' },
    { code: '541519', desc: 'Other Computer Related Services' },
    { code: '541611', desc: 'Administrative Management Consulting' },
    { code: '541612', desc: 'Human Resources Consulting Services' },
    { code: '541614', desc: 'Process & Logistics Consulting' },
    { code: '541618', desc: 'Other Management Consulting Services' },
    { code: '541690', desc: 'Other Scientific and Technical Consulting' },
    { code: '541990', desc: 'All Other Professional, Scientific Services' },
  ]

  const formatDate = (dateString: string): string => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(
      2,
      '0'
    )}/${date.getFullYear()}`
  }

  const formatCurrency = (amount: string | number | undefined): string => {
    if (amount === undefined || amount === null || amount === '') return 'Not specified'
    const numAmount = typeof amount === 'string' ? Number(amount) : amount
    if (!Number.isFinite(numAmount)) return 'Not specified'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numAmount)
  }

  const handleFilterChange = (key: keyof SearchFilters, value: string | number) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const exportToCSV = (rows: Opportunity[]) => {
    const headers = [
      'Title',
      'Solicitation Number',
      'Agency',
      'Posted Date',
      'Deadline',
      'NAICS',
      'Set-Aside',
      'Type',
      'SAM.gov Link',
    ]
    const csvRows = rows.map((opp) => [
      opp.title || '',
      opp.solicitationNumber || '',
      opp.fullParentPathName || opp.department || '',
      opp.postedDate || '',
      opp.responseDeadLine || '',
      opp.naicsCode || '',
      opp.typeOfSetAsideDescription || '',
      opp.type || '',
      samLink(opp.noticeId),
    ])

    const csvContent = [headers, ...csvRows]
      .map((row) => row.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sam-opportunities-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const searchOpportunities = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()

      if (filters.keywords) params.append('title', filters.keywords)
      if (filters.naicsCode) params.append('ncode', filters.naicsCode)
      if (filters.state) params.append('state', filters.state)

      // Default dates: last 6 months to today (SAM.gov limit)
      const today = new Date()
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(today.getMonth() - 6)

      const fromDate =
        filters.postedFrom || formatDate(sixMonthsAgo.toISOString().split('T')[0] as string)
      const toDate = filters.postedTo || formatDate(today.toISOString().split('T')[0] as string)

      params.append('postedFrom', fromDate)
      params.append('postedTo', toDate)
      if (filters.procurementType) params.append('ptype', filters.procurementType)
      // Make "All Set-Asides" (empty string) actually work for open competition
      if (filters.setAside && filters.setAside !== '') {
        params.append('typeOfSetAside', filters.setAside)
      }

      params.append('limit', String(filters.limit))
      params.append('offset', '0')

      const response = await fetch(`/api/sam-search?${params.toString()}`, {
        headers: { Accept: 'application/json' },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Response:', response.status, errorText)
        throw new Error(`API Error ${response.status}: ${errorText || response.statusText}`)
      }

      const data = await response.json()

      // Filter for active opportunities (deadline is in the future or not set)
      const activeOpportunities = (data.opportunitiesData || []).filter((opp: Opportunity) => {
        if (!opp.responseDeadLine) return true
        const deadline = safeDate(opp.responseDeadLine)
        if (!deadline) return true
        return deadline >= today
      })

      setOpportunities(activeOpportunities)

      // Reset result filters when a new search runs (keeps UX clean)
      setResultFilters((prev) => ({
        ...prev,
        q: '',
        agency: '',
        noticeType: '',
        setAsideText: '',
        naics: '',
        state: '',
        hasDeadlineOnly: false,
        dueInDays: '',
        sort: 'relevance',
      }))
      setExpandedCard(null)

      if (activeOpportunities.length === 0) {
        setError('No active opportunities found matching your criteria')
      }
    } catch (err) {
      let errorMessage = 'Unable to fetch opportunities from SAM.gov'

      if (err instanceof Error) {
        const msg = err.message.toLowerCase()

        if (msg.includes('400')) {
          errorMessage = 'Invalid search parameters. Please check your filters and try again.'
        } else if (msg.includes('401') || msg.includes('unauthorized')) {
          errorMessage = 'Authentication required. Please sign in again.'
        } else if (msg.includes('403') || msg.includes('forbidden')) {
          errorMessage = 'Access denied. Please contact your administrator.'
        } else if (msg.includes('404')) {
          errorMessage = 'SAM.gov API endpoint not found. The service may be temporarily unavailable.'
        } else if (msg.includes('500') || msg.includes('502') || msg.includes('503')) {
          errorMessage =
            'SAM.gov servers are temporarily unavailable. Please try again in a few minutes.'
        } else if (msg.includes('network') || msg.includes('fetch')) {
          errorMessage = 'Network error. Please check your internet connection and try again.'
        } else {
          errorMessage = `Search failed: ${err.message.substring(0, 140)}`
        }
      }

      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Build facet lists from returned results (for dropdowns)
  const facets = useMemo(() => {
    const agencies = new Set<string>()
    const types = new Set<string>()
    const setAsides = new Set<string>()
    const naics = new Set<string>()
    const states = new Set<string>()

    for (const o of opportunities) {
      const agency = (o.fullParentPathName || o.department || '').trim()
      if (agency) agencies.add(agency)

      const t = (o.type || '').trim()
      if (t) types.add(t)

      const sa = (o.typeOfSetAsideDescription || o.typeOfSetAside || '').trim()
      if (sa) setAsides.add(sa)

      const n = (o.naicsCode || '').trim()
      if (n) naics.add(n)

      const st = (o.placeOfPerformance?.state?.code || '').trim()
      if (st) states.add(st)
    }

    const toSorted = (s: Set<string>) => Array.from(s).sort((a, b) => a.localeCompare(b))

    return {
      agencies: toSorted(agencies),
      types: toSorted(types),
      setAsides: toSorted(setAsides),
      naics: toSorted(naics),
      states: toSorted(states),
    }
  }, [opportunities])

  // Apply client-side filters + sorting
  const filteredResults = useMemo(() => {
    const q = normalize(resultFilters.q)
    const agency = resultFilters.agency
    const noticeType = resultFilters.noticeType
    const setAsideText = resultFilters.setAsideText
    const naics = resultFilters.naics
    const state = resultFilters.state
    const hasDeadlineOnly = resultFilters.hasDeadlineOnly
    const dueInDays = resultFilters.dueInDays === '' ? null : Number(resultFilters.dueInDays)

    let rows = opportunities.filter((o) => {
      const title = normalize(o.title)
      const desc = normalize(o.description)
      const sol = normalize(o.solicitationNumber)
      const agencyText = (o.fullParentPathName || o.department || '').trim()
      const type = (o.type || '').trim()
      const sa = (o.typeOfSetAsideDescription || o.typeOfSetAside || '').trim()
      const n = (o.naicsCode || '').trim()
      const st = (o.placeOfPerformance?.state?.code || '').trim()

      if (q) {
        const hit =
          title.includes(q) ||
          desc.includes(q) ||
          sol.includes(q) ||
          normalize(agencyText).includes(q)
        if (!hit) return false
      }

      if (agency && agencyText !== agency) return false
      if (noticeType && type !== noticeType) return false
      if (setAsideText && sa !== setAsideText) return false
      if (naics && n !== naics) return false
      if (state && st !== state) return false

      const deadline = safeDate(o.responseDeadLine)
      if (hasDeadlineOnly && !deadline) return false

      if (deadline && dueInDays !== null) {
        const d = daysUntil(deadline)
        // include anything due today or within X days
        if (d < 0) return false
        if (d > dueInDays) return false
      } else if (!deadline && dueInDays !== null) {
        // if user wants dueInDays filter, exclude those without a deadline
        return false
      }

      return true
    })

    const sort = resultFilters.sort
    const byDate = (v?: string) => {
      const d = safeDate(v)
      return d ? d.getTime() : null
    }
    rows = rows.slice()

    if (sort === 'posted_desc') {
      rows.sort((a, b) => (byDate(b.postedDate) ?? -Infinity) - (byDate(a.postedDate) ?? -Infinity))
    } else if (sort === 'posted_asc') {
      rows.sort((a, b) => (byDate(a.postedDate) ?? Infinity) - (byDate(b.postedDate) ?? Infinity))
    } else if (sort === 'deadline_asc') {
      rows.sort(
        (a, b) => (byDate(a.responseDeadLine) ?? Infinity) - (byDate(b.responseDeadLine) ?? Infinity)
      )
    } else if (sort === 'deadline_desc') {
      rows.sort(
        (a, b) =>
          (byDate(b.responseDeadLine) ?? -Infinity) - (byDate(a.responseDeadLine) ?? -Infinity)
      )
    } else if (sort === 'title_asc') {
      rows.sort((a, b) => (a.title || '').localeCompare(b.title || ''))
    } else if (sort === 'agency_asc') {
      const agencyOf = (o: Opportunity) => (o.fullParentPathName || o.department || '').toString()
      rows.sort((a, b) => agencyOf(a).localeCompare(agencyOf(b)))
    }
    // relevance = keep API order

    return rows
  }, [opportunities, resultFilters])

  const activeSummary = useMemo(() => {
    if (!filteredResults.length) return null
    const withDeadlines = filteredResults.filter((o) => safeDate(o.responseDeadLine))
    const soonest = withDeadlines
      .map((o) => safeDate(o.responseDeadLine)!)
      .sort((a, b) => a.getTime() - b.getTime())[0]
    return {
      count: filteredResults.length,
      soonestDeadline: soonest ? soonest.toLocaleDateString() : null,
    }
  }, [filteredResults])

  const wrapperBg = 'min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950'

  const shellText = 'text-white'
  const mutedText = 'text-slate-300'
  const cardBg =
    'bg-slate-900/60 backdrop-blur-xl border border-slate-800'
  const inputBg =
    'bg-slate-950 border-slate-700 text-white'
  const inputPlaceholder = 'placeholder-slate-500'

  return (
    <div className={wrapperBg + ' relative overflow-hidden w-full'}>
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: '1000ms' }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: '2000ms' }}
        ></div>
      </div>

      {/* Grid pattern overlay */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

      <div className="relative z-10 w-full px-8 py-2 pb-12">
        {/* Hero */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center mb-4">
            <div
              className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm ${
                'bg-emerald-500/10 border border-emerald-400/30'
              }`}
            >
              <Building2
                className={
                  'w-4 h-4 text-emerald-400'
                }
              />
              <span
                className={
                  'text-emerald-300 font-medium tracking-wide'
                }
              >
                Precise GovCon • Federal Contracting Intelligence
              </span>
            </div>
          </div>

          <h1 className={`text-4xl md:text-5xl font-black mb-2 tracking-tight ${shellText}`}>
            Contract Search
            <span className="block bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
              SAM.gov
            </span>
          </h1>

          <p className={`text-base md:text-lg max-w-2xl mx-auto ${mutedText}`}>
            Search federal contracting opportunities — then filter and shortlist results instantly.
          </p>

          <div className="mt-6 flex flex-wrap gap-3 justify-center items-center">
            {activeSummary && (
              <>
                <div
                  className={`px-4 py-2 rounded-full text-sm ${
                    'bg-slate-900/60 border border-slate-800 text-slate-200'
                  }`}
                >
                  <span className="font-semibold">{activeSummary.count}</span> results (after
                  filters)
                </div>
                {activeSummary.soonestDeadline && (
                  <div
                    className={`px-4 py-2 rounded-full text-sm ${
                      'bg-slate-900/60 border border-slate-800 text-slate-200'
                    }`}
                  >
                    Soonest deadline:{' '}
                    <span className="font-semibold">{activeSummary.soonestDeadline}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Search Filters (API filters) */}
        <div className={`${cardBg} rounded-2xl p-4 md:p-6 mb-6 shadow-2xl`}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <label
                className={`block text-sm font-semibold mb-2 ${
                  'text-slate-300'
                }`}
              >
                Keywords
              </label>
              <div className="relative">
                <Search
                  className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                    'text-slate-500'
                  }`}
                />
                <input
                  type="text"
                  value={filters.keywords}
                  onChange={(e) => handleFilterChange('keywords', e.target.value)}
                  placeholder="e.g., Data Analytics"
                  className={`w-full pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400/40 ${inputBg} ${inputPlaceholder}`}
                />
              </div>
            </div>

            <div>
              <label
                className={`block text-sm font-semibold mb-2 ${
                  'text-slate-300'
                }`}
              >
                NAICS Code
              </label>
              <select
                value={filters.naicsCode}
                onChange={(e) => handleFilterChange('naicsCode', e.target.value)}
                className={`w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400/40 ${inputBg}`}
              >
                <option value="">All NAICS Codes</option>
                {suggestedNAICS.map((naics) => (
                  <option key={naics.code} value={naics.code}>
                    {naics.code} - {naics.desc}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                className={`block text-sm font-semibold mb-2 ${
                  'text-slate-300'
                }`}
              >
                Set-Aside Type
              </label>
              <select
                value={filters.setAside}
                onChange={(e) => handleFilterChange('setAside', e.target.value)}
                className={`w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400/40 ${inputBg}`}
              >
                {setAsideTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                className={`block text-sm font-semibold mb-2 ${
                  'text-slate-300'
                }`}
              >
                State
              </label>
              <select
                value={filters.state}
                onChange={(e) => handleFilterChange('state', e.target.value)}
                className={`w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400/40 ${inputBg}`}
              >
                {US_STATES.map((state) => (
                  <option key={state.code} value={state.code}>
                    {state.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                className={`block text-sm font-semibold mb-2 ${
                  'text-slate-300'
                }`}
              >
                Posted From
              </label>
              <input
                type="date"
                value={filters.postedFrom}
                onChange={(e) => handleFilterChange('postedFrom', e.target.value)}
                className={`w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400/40 ${inputBg}`}
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {[
                  { label: '1 Yr Ago', days: 364 },
                  { label: '9 Mo Ago', months: 9 },
                  { label: '6 Mo Ago', months: 6 },
                  { label: '3 Mo Ago', months: 3 },
                  { label: '1 Mo Ago', months: 1 },
                ].map((btn) => {
                  const d = new Date()
                  if (btn.days) d.setDate(d.getDate() - btn.days)
                  else if (btn.months) d.setMonth(d.getMonth() - btn.months)
                  const val = d.toISOString().split('T')[0]
                  return (
                    <button
                      key={btn.label}
                      type="button"
                      onClick={() => handleFilterChange('postedFrom', val)}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold border transition-all ${
                        filters.postedFrom === val
                          ? 'bg-emerald-600 border-emerald-500 text-white'
                          : 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      {btn.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label
                className={`block text-sm font-semibold mb-2 ${
                  'text-slate-300'
                }`}
              >
                Posted To
              </label>
              <input
                type="date"
                value={filters.postedTo}
                onChange={(e) => handleFilterChange('postedTo', e.target.value)}
                className={`w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400/40 ${inputBg}`}
              />
              <p className="text-slate-500 text-xs mt-1">Optional — defaults to today</p>
            </div>
          </div>

          <div
            className={`flex flex-wrap gap-4 items-center justify-between pt-6 ${
              'border-t border-slate-800'
            }`}
          >
            <div className="flex gap-3">
              <button
                onClick={searchOpportunities}
                disabled={loading}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-cyan-700 hover:to-blue-700 disabled:from-slate-400 disabled:to-slate-400 text-white font-bold rounded-lg transition-all disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    Search
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowSaveModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-lg transition-all shadow-lg shadow-blue-500/20"
              >
                <Save className="w-5 h-5" />
                Save Search
              </button>

              {filteredResults.length > 0 && (
                <button
                  onClick={() => exportToCSV(filteredResults)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg border text-sm font-semibold ${
                    'bg-slate-800 hover:bg-slate-700 border-slate-700 text-white'
                  }`}
                >
                  <Download className="w-5 h-5" />
                  Export CSV (filtered)
                </button>
              )}
            </div>

            <div
              className={`text-sm flex items-center gap-2 ${
                'text-slate-400'
              }`}
            >
              <ExternalLink className="w-4 h-4" />
              Titles link directly to SAM.gov
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/15 border border-red-500/40 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-red-700 font-semibold mb-2">Search Error</h3>
                <p className="text-red-700/90 text-sm leading-relaxed">{error}</p>
              </div>
            </div>
          </div>
        )}

        {opportunities.length > 0 && (
          <div className={`${cardBg} rounded-2xl p-5 md:p-6 mb-6`}>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <SlidersHorizontal
                  className={'w-5 h-5 text-cyan-300'}
                />
                <h3 className={`font-bold ${'text-white'}`}>
                  Filter returned results
                </h3>
                <span
                  className={`text-xs px-2 py-1 rounded-full border ${
                    'bg-slate-950/60 border-slate-700 text-slate-300'
                  }`}
                >
                  {filteredResults.length} / {opportunities.length}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowResultFilters((v) => !v)}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold border ${
                    'bg-slate-900 hover:bg-slate-800 border-slate-700 text-white'
                  }`}
                >
                  {showResultFilters ? 'Hide' : 'Show'} filters
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setResultFilters({
                      q: '',
                      agency: '',
                      noticeType: '',
                      setAsideText: '',
                      naics: '',
                      state: '',
                      hasDeadlineOnly: false,
                      dueInDays: '',
                      sort: 'relevance',
                    })
                  }
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold border ${
                    'bg-slate-900 hover:bg-slate-800 border-slate-700 text-white'
                  }`}
                >
                  <X className="w-4 h-4" />
                  Reset
                </button>
              </div>
            </div>

            {showResultFilters && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label
                    className={`block text-sm font-semibold mb-1 ${
                      'text-slate-300'
                    }`}
                  >
                    Search within results
                  </label>
                  <div className="relative">
                    <Search
                      className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                        'text-slate-500'
                      }`}
                    />
                    <input
                      value={resultFilters.q}
                      onChange={(e) => setResultFilters((p) => ({ ...p, q: e.target.value }))}
                      placeholder="title, agency, solicitation, description…"
                      className={`w-full pl-9 pr-3 py-2.5 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400/40 ${inputBg} ${inputPlaceholder}`}
                    />
                  </div>
                </div>

                <div>
                  <label
                    className={`block text-sm font-semibold mb-1 ${
                      'text-slate-300'
                    }`}
                  >
                    Agency
                  </label>
                  <select
                    value={resultFilters.agency}
                    onChange={(e) => setResultFilters((p) => ({ ...p, agency: e.target.value }))}
                    className={`w-full px-3 py-2.5 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400/40 ${inputBg}`}
                  >
                    <option value="">All agencies</option>
                    {facets.agencies.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    className={`block text-sm font-semibold mb-1 ${
                      'text-slate-300'
                    }`}
                  >
                    Notice type
                  </label>
                  <select
                    value={resultFilters.noticeType}
                    onChange={(e) => setResultFilters((p) => ({ ...p, noticeType: e.target.value }))}
                    className={`w-full px-3 py-2.5 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400/40 ${inputBg}`}
                  >
                    <option value="">All types</option>
                    {facets.types.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    className={`block text-sm font-semibold mb-1 ${
                      'text-slate-300'
                    }`}
                  >
                    Set-aside
                  </label>
                  <select
                    value={resultFilters.setAsideText}
                    onChange={(e) => setResultFilters((p) => ({ ...p, setAsideText: e.target.value }))}
                    className={`w-full px-3 py-2.5 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400/40 ${inputBg}`}
                  >
                    <option value="">All set-asides</option>
                    {facets.setAsides.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    className={`block text-sm font-semibold mb-1 ${
                      'text-slate-300'
                    }`}
                  >
                    NAICS
                  </label>
                  <select
                    value={resultFilters.naics}
                    onChange={(e) => setResultFilters((p) => ({ ...p, naics: e.target.value }))}
                    className={`w-full px-3 py-2.5 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400/40 ${inputBg}`}
                  >
                    <option value="">All NAICS</option>
                    {facets.naics.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    className={`block text-sm font-semibold mb-1 ${
                      'text-slate-300'
                    }`}
                  >
                    Place of Performance (State)
                  </label>
                  <select
                    value={resultFilters.state}
                    onChange={(e) => setResultFilters((p) => ({ ...p, state: e.target.value }))}
                    className={`w-full px-3 py-2.5 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400/40 ${inputBg}`}
                  >
                    <option value="">All</option>
                    {facets.states.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-3">
                  <label
                    className={`inline-flex items-center gap-2 text-sm font-semibold ${
                      'text-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={resultFilters.hasDeadlineOnly}
                      onChange={(e) => setResultFilters((p) => ({ ...p, hasDeadlineOnly: e.target.checked }))}
                      className="h-4 w-4"
                    />
                    Only results with a deadline
                  </label>
                </div>

                <div>
                  <label
                    className={`block text-sm font-semibold mb-1 ${
                      'text-slate-300'
                    }`}
                  >
                    Due within
                  </label>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {[
                      { label: '2 Wks', days: 14 },
                      { label: '1 Mo', days: 30 },
                      { label: '45 Days', days: 45 },
                      { label: '60 Days', days: 60 },
                      { label: '75 Days', days: 75 },
                    ].map((btn) => (
                      <button
                        key={btn.label}
                        type="button"
                        onClick={() =>
                          setResultFilters((p) => ({
                            ...p,
                            dueInDays: p.dueInDays === btn.days ? '' : btn.days,
                          }))
                        }
                        className={`px-3 py-1.5 rounded-md text-sm font-semibold border transition-all ${
                          resultFilters.dueInDays === btn.days
                            ? 'bg-amber-600 border-amber-500 text-white'
                            : 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white'
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={resultFilters.dueInDays}
                    onChange={(e) =>
                      setResultFilters((p) => ({
                        ...p,
                        dueInDays:
                          e.target.value === ''
                            ? ''
                            : Math.max(1, Math.min(365, Number(e.target.value))),
                      }))
                    }
                    placeholder="or enter custom days…"
                    className={`w-full mt-2 px-3 py-2 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400/40 ${inputBg} ${inputPlaceholder}`}
                  />
                </div>

                <div>
                  <label
                    className={`block text-sm font-semibold mb-1 ${
                      'text-slate-300'
                    }`}
                  >
                    Sort
                  </label>
                  <div className="relative">
                    <ArrowUpDown
                      className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                        'text-slate-500'
                      }`}
                    />
                    <select
                      value={resultFilters.sort}
                      onChange={(e) => setResultFilters((p) => ({ ...p, sort: e.target.value as ResultSort }))}
                      className={`w-full pl-9 pr-3 py-2.5 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400/40 ${inputBg}`}
                    >
                      <option value="relevance">Relevance (API order)</option>
                      <option value="deadline_asc">Deadline: Soonest first</option>
                      <option value="deadline_desc">Deadline: Latest first</option>
                      <option value="posted_desc">Posted: Newest first</option>
                      <option value="posted_asc">Posted: Oldest first</option>
                      <option value="title_asc">Title: A → Z</option>
                      <option value="agency_asc">Agency: A → Z</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {filteredResults.length > 0 && (
          <div>
            <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
              <h2 className={`text-2xl font-bold ${shellText}`}>Active Opportunities</h2>
              <div
                className={`text-sm rounded-full px-4 py-2 border ${
                  'bg-slate-900/60 border-slate-800 text-slate-300'
                }`}
              >
                Showing <span className="font-semibold">{filteredResults.length}</span> results
              </div>
            </div>

            <div className="space-y-4">
              {filteredResults.map((opp, index) => {
                const posted = safeDate(opp.postedDate)
                const deadline = safeDate(opp.responseDeadLine)

                const location =
                  opp.placeOfPerformance?.city?.name || opp.placeOfPerformance?.state?.code
                    ? `${opp.placeOfPerformance?.city?.name ?? ''}${
                        opp.placeOfPerformance?.city?.name && opp.placeOfPerformance?.state?.code ? ', ' : ''
                      }${opp.placeOfPerformance?.state?.code ?? ''}${
                        opp.placeOfPerformance?.zip ? ` ${opp.placeOfPerformance.zip}` : ''
                      }`.trim()
                    : null

                const urgency = deadline ? daysUntil(deadline) : null

                const rowCard =
                  'bg-slate-900/55 border border-slate-800'

                return (
                  <div
                    key={opp.noticeId || index}
                    className={`relative overflow-hidden rounded-2xl p-6 transition-all shadow-sm hover:shadow-md ${rowCard}`}
                  >
                    <div className="pointer-events-none absolute inset-0 opacity-70">
                      <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-cyan-400/20 blur-3xl" />
                      <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-emerald-400/15 blur-3xl" />
                    </div>

                    <div className="relative">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                'bg-cyan-500/15 text-cyan-200 border-cyan-500/25'
                              }`}
                            >
                              {opp.type || 'Notice'}
                            </span>

                            {(opp.typeOfSetAsideDescription || opp.typeOfSetAside) && (
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                  'bg-amber-500/15 text-amber-200 border-amber-500/25'
                                }`}
                              >
                                {opp.typeOfSetAsideDescription || opp.typeOfSetAside}
                              </span>
                            )}

                            {opp.naicsCode && (
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                  'bg-emerald-500/15 text-emerald-200 border-emerald-500/25'
                                }`}
                              >
                                NAICS {opp.naicsCode}
                              </span>
                            )}

                            {urgency !== null && urgency <= 14 && urgency >= 0 && (
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                  'bg-red-500/15 text-red-200 border-red-500/25'
                                }`}
                              >
                                Due in {urgency} day{urgency === 1 ? '' : 's'}
                              </span>
                            )}
                          </div>

                          <a
                            href={samLink(opp.noticeId)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`group inline-flex items-start gap-2 text-xl font-extrabold leading-snug transition-colors ${
                              'text-white hover:text-cyan-200'
                            }`}
                            title="Open on SAM.gov"
                          >
                            <span className="line-clamp-2">{opp.title || 'Untitled opportunity'}</span>
                            <ExternalLink
                              className={`w-4 h-4 mt-1 transition-colors flex-shrink-0 ${
                                'text-slate-500 group-hover:text-cyan-300'
                              }`}
                            />
                          </a>

                          <div
                            className={`mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm ${
                              'text-slate-300'
                            }`}
                          >
                            <span className={'text-slate-400'}>
                              {opp.fullParentPathName || opp.department || 'Agency not specified'}
                            </span>

                            {opp.solicitationNumber && (
                              <span className="inline-flex items-center gap-2">
                                <Hash className={'w-4 h-4 text-slate-500'} />
                                <span className={'font-semibold text-slate-200'}>
                                  {opp.solicitationNumber}
                                </span>
                              </span>
                            )}

                            {location && (
                              <span className="inline-flex items-center gap-2">
                                <MapPin className={'w-4 h-4 text-slate-500'} />
                                <span>{location}</span>
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => setExpandedCard(expandedCard === index ? null : index)}
                          className={`relative z-10 p-2 rounded-lg border transition-colors ${
                            'hover:bg-slate-800 border-slate-700'
                          }`}
                          aria-label={expandedCard === index ? 'Collapse details' : 'Expand details'}
                        >
                          {expandedCard === index ? (
                            <ChevronUp className={'w-5 h-5 text-slate-300'} />
                          ) : (
                            <ChevronDown className={'w-5 h-5 text-slate-300'} />
                          )}
                        </button>
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <Calendar className={'w-4 h-4 text-emerald-300'} />
                          <div>
                            <div className="text-xs text-slate-500">Posted</div>
                            <div className={'text-sm font-semibold text-slate-200'}>
                              {posted ? posted.toLocaleDateString() : 'N/A'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Clock className={'w-4 h-4 text-amber-300'} />
                          <div>
                            <div className="text-xs text-slate-500">Deadline</div>
                            <div className={'text-sm font-semibold text-slate-200'}>
                              {deadline ? deadline.toLocaleDateString() : 'Not specified'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Filter className={'w-4 h-4 text-cyan-300'} />
                          <div>
                            <div className="text-xs text-slate-500">Notice ID</div>
                            <div className={'text-sm font-semibold text-slate-200'}>
                              {opp.noticeId || 'N/A'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <DollarSign className={'w-4 h-4 text-green-300'} />
                          <div>
                            <div className="text-xs text-slate-500">Award</div>
                            <div className={'text-sm font-semibold text-slate-200'}>
                              {opp.award?.amount ? formatCurrency(opp.award.amount) : '—'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {expandedCard === index && (
                        <div className={`mt-6 pt-6 ${'border-t border-slate-800'}`}>
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2">
                              <div className="flex items-center gap-2 mb-2">
                                <FileText className={'w-4 h-4 text-slate-400'} />
                                <h4 className={'text-sm font-semibold text-slate-200'}>
                                  Description
                                </h4>
                              </div>
                              <p className={'text-slate-300 text-sm leading-relaxed whitespace-pre-wrap'}>
                                {opp.description || 'No description available.'}
                              </p>
                            </div>

                            <div className={`rounded-xl p-4 border ${'bg-slate-950/60 border-slate-800'}`}>
                              <h4 className={'text-sm font-semibold text-slate-200 mb-3'}>
                                Quick actions
                              </h4>
                              <div className="space-y-3">
                                <a
                                  href={samLink(opp.noticeId)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-cyan-700 hover:to-blue-700 text-white text-sm font-semibold rounded-lg"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                  Open on SAM.gov
                                </a>

                                {opp.pointOfContact?.[0]?.email && (
                                  <a
                                    href={`mailto:${opp.pointOfContact[0].email}`}
                                    className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border text-sm font-semibold ${
                                      'bg-slate-800 hover:bg-slate-700 border-slate-700 text-white'
                                    }`}
                                  >
                                    Email POC
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="mt-4 flex flex-wrap gap-3">
                        <a
                          href={samLink(opp.noticeId)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-cyan-700 hover:to-blue-700 text-white text-sm font-semibold rounded-lg"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View on SAM.gov
                        </a>

                        <button
                          type="button"
                          onClick={() => setExpandedCard(expandedCard === index ? null : index)}
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-semibold ${
                            'bg-slate-800 hover:bg-slate-700 border-slate-700 text-white'
                          }`}
                        >
                          {expandedCard === index ? (
                            <>
                              <ChevronUp className="w-4 h-4" />
                              Hide details
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4" />
                              View details
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {!loading && !error && opportunities.length === 0 && (
          <div className="text-center py-16">
            <Search className={'w-20 h-20 text-slate-700 mx-auto mb-4'} />
            <h3 className={`text-2xl font-bold mb-2 ${shellText}`}>Ready to Search</h3>
            <p className={mutedText}>Configure your filters and click Search</p>
          </div>
        )}

        <div className="mt-8 pt-6 pb-6 text-center border-t border-slate-700/50">
          <p className="text-slate-400 text-sm font-medium">Powered by SAM.gov API • Built for Precise GovCon</p>
        </div>
      </div>

      {/* Save Search Modal — pre-fills with current filters */}
      <UnifiedSaveSearchModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        mode="save"
        searchParams={currentSearchParamsForModal}
        onSave={(result) => {
          setShowSaveModal(false)
        }}
      />
    </div>
  )
}