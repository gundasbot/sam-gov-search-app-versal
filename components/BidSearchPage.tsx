'use client'

import { useState } from 'react'
import { Search, Filter, Calendar, DollarSign, Building2, Hash, Code } from 'lucide-react'
import AccessControlModal from './AccessControlModal'
import { useSession } from 'next-auth/react'

// Mock NAICS codes - replace with your actual data
const COMMON_NAICS = [
  { code: '541511', description: 'Custom Computer Programming Services' },
  { code: '541512', description: 'Computer Systems Design Services' },
  { code: '541513', description: 'Computer Facilities Management Services' },
  { code: '541519', description: 'Other Computer Related Services' },
  { code: '541690', description: 'Other Scientific and Technical Consulting Services' },
  { code: '518210', description: 'Data Processing, Hosting, and Related Services' },
  { code: '541330', description: 'Engineering Services' },
  { code: '541715', description: 'Research and Development in the Physical, Engineering, and Life Sciences' },
]

export default function BidSearchPage() {
  const { data: session, status } = useSession()
  const isAuthenticated = status === 'authenticated'
  const [showAccessModal, setShowAccessModal] = useState(false)
  
  const [searchParams, setSearchParams] = useState({
    bidNumber: '',
    naicsCode: '',
    keyword: '',
    agency: '',
    setAside: '',
    minValue: '',
    maxValue: '',
    postedAfter: '',
    dueBefore: ''
  })

  const [naicsSuggestions, setNaicsSuggestions] = useState<typeof COMMON_NAICS>([])
  const [showNaicsSuggestions, setShowNaicsSuggestions] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isAuthenticated) {
      setShowAccessModal(true)
      return
    }

    // Perform search with searchParams
    console.log('Searching with params:', searchParams)
    // Add your search logic here
  }

  const handleNaicsInput = (value: string) => {
    setSearchParams({ ...searchParams, naicsCode: value })
    
    if (value.length >= 2) {
      const filtered = COMMON_NAICS.filter(
        naics => 
          naics.code.includes(value) || 
          naics.description.toLowerCase().includes(value.toLowerCase())
      )
      setNaicsSuggestions(filtered)
      setShowNaicsSuggestions(true)
    } else {
      setShowNaicsSuggestions(false)
    }
  }

  const selectNaics = (code: string) => {
    setSearchParams({ ...searchParams, naicsCode: code })
    setShowNaicsSuggestions(false)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-50 mb-2">Bid Search</h1>
          <p className="text-slate-300">
            Search federal contract opportunities by bid number, NAICS code, and more
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="space-y-6">
          {/* Primary Search Fields */}
          <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6">
            <h2 className="text-lg font-semibold text-slate-50 mb-4 flex items-center gap-2">
              <Search className="w-5 h-5 text-cyan-400" />
              Primary Search
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Bid Number */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                  <Hash className="w-4 h-4" />
                  Bid Number / Solicitation Number
                </label>
                <input
                  type="text"
                  value={searchParams.bidNumber}
                  onChange={(e) => setSearchParams({ ...searchParams, bidNumber: e.target.value })}
                  placeholder="e.g., 12345678, W912D4-24-R-0001"
                  className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-50 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Enter solicitation, award, or contract number
                </p>
              </div>

              {/* NAICS Code - Free Text with Suggestions */}
              <div className="relative">
                <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                  <Code className="w-4 h-4" />
                  NAICS Code
                </label>
                <input
                  type="text"
                  value={searchParams.naicsCode}
                  onChange={(e) => handleNaicsInput(e.target.value)}
                  onFocus={() => searchParams.naicsCode.length >= 2 && setShowNaicsSuggestions(true)}
                  placeholder="Type code or description (e.g., 541511)"
                  className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-50 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Type to search by code or description
                </p>

                {/* NAICS Suggestions Dropdown */}
                {showNaicsSuggestions && naicsSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 rounded-lg bg-slate-800 border border-slate-700 shadow-xl max-h-64 overflow-y-auto">
                    {naicsSuggestions.map((naics) => (
                      <button
                        key={naics.code}
                        type="button"
                        onClick={() => selectNaics(naics.code)}
                        className="w-full px-4 py-3 text-left hover:bg-slate-700 transition border-b border-slate-700 last:border-0"
                      >
                        <div className="font-semibold text-cyan-400">{naics.code}</div>
                        <div className="text-sm text-slate-300">{naics.description}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Keyword Search */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Keywords
                </label>
                <input
                  type="text"
                  value={searchParams.keyword}
                  onChange={(e) => setSearchParams({ ...searchParams, keyword: e.target.value })}
                  placeholder="e.g., cloud computing, data analytics, cybersecurity"
                  className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-50 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Advanced Filters */}
          <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6">
            <h2 className="text-lg font-semibold text-slate-50 mb-4 flex items-center gap-2">
              <Filter className="w-5 h-5 text-emerald-400" />
              Advanced Filters
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Agency */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Agency
                </label>
                <input
                  type="text"
                  value={searchParams.agency}
                  onChange={(e) => setSearchParams({ ...searchParams, agency: e.target.value })}
                  placeholder="e.g., DoD, VA, DHS"
                  className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-50 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Set-Aside */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Set-Aside Type
                </label>
                <select
                  value={searchParams.setAside}
                  onChange={(e) => setSearchParams({ ...searchParams, setAside: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-50 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="">All Types</option>
                  <option value="SDVOSB">SDVOSB</option>
                  <option value="VOSB">VOSB</option>
                  <option value="8(a)">8(a)</option>
                  <option value="Small Business">Small Business</option>
                  <option value="HUBZone">HUBZone</option>
                  <option value="WOSB">WOSB</option>
                  <option value="Full & Open">Full & Open</option>
                </select>
              </div>

              {/* Min Value */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Min Value ($)
                </label>
                <input
                  type="number"
                  value={searchParams.minValue}
                  onChange={(e) => setSearchParams({ ...searchParams, minValue: e.target.value })}
                  placeholder="0"
                  className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-50 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Max Value */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Max Value ($)
                </label>
                <input
                  type="number"
                  value={searchParams.maxValue}
                  onChange={(e) => setSearchParams({ ...searchParams, maxValue: e.target.value })}
                  placeholder="No limit"
                  className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-50 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Posted After */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Posted After
                </label>
                <input
                  type="date"
                  value={searchParams.postedAfter}
                  onChange={(e) => setSearchParams({ ...searchParams, postedAfter: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-50 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Due Before */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Due Before
                </label>
                <input
                  type="date"
                  value={searchParams.dueBefore}
                  onChange={(e) => setSearchParams({ ...searchParams, dueBefore: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-50 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Search Button */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setSearchParams({
                bidNumber: '',
                naicsCode: '',
                keyword: '',
                agency: '',
                setAside: '',
                minValue: '',
                maxValue: '',
                postedAfter: '',
                dueBefore: ''
              })}
              className="px-6 py-3 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 font-semibold transition"
            >
              Clear All
            </button>

            <button
              type="submit"
              className="px-8 py-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-semibold flex items-center gap-2 transition"
            >
              <Search className="w-5 h-5" />
              Search Opportunities
            </button>
          </div>
        </form>

        {/* Info Box for Non-Authenticated Users */}
        {!isAuthenticated && (
          <div className="mt-8 rounded-2xl border border-cyan-500/50 bg-cyan-500/10 p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-cyan-500/20">
                <Search className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-50 mb-2">
                  Access Required for Search Results
                </h3>
                <p className="text-slate-300 mb-4">
                  To view search results and access our complete database of federal contract opportunities, 
                  you'll need to request access or sign in to your account.
                </p>
                <button
                  onClick={() => setShowAccessModal(true)}
                  className="px-6 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-semibold transition"
                >
                  Get Access
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Access Control Modal */}
      <AccessControlModal
        isOpen={showAccessModal}
        onClose={() => setShowAccessModal(false)}
        featureName="Bid Search"
      />
    </div>
  )
}
