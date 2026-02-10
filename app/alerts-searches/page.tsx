//app/alerts-searches/page.tsx

'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Search,
  Bell,
  BellOff,
  Play,
  Download,
  Pencil,
  Trash2,
  Clock,
  ExternalLink,
  AlertCircle,
  ChevronDown,
} from 'lucide-react'
import UnifiedSaveSearchModal from '@/components/UnifiedSaveSearchModal'

interface SavedSearch {
  id: string
  name: string
  description?: string
  isPinned: boolean
  keywords?: string
  naics?: string
  agency?: string
  setAside?: string
  stateOfPerformance?: string
  procurementType: string
  subscriptionEnabled: boolean
  frequency?: string
  emailNotification: boolean
  lastRunAt?: string
  lastResultCount?: number
  createdAt: string
  updatedAt: string
  _count: {
    runs: number
    exports: number
  }
  runs?: Array<{
    id: string
    createdAt: string
    status: string
    resultCount: number
  }>
}

type ViewFilter = 'all' | 'subscribed' | 'saved'

export default function AlertsSearchesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [searches, setSearches] = useState<SavedSearch[]>([])
  const [loading, setLoading] = useState(true)
  const [viewFilter, setViewFilter] = useState<ViewFilter>('all')
  
  // Modal states
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingSearch, setEditingSearch] = useState<SavedSearch | null>(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/api/auth/signin')
    }
  }, [status, router])

  // Load searches
  useEffect(() => {
    if (status === 'authenticated') {
      loadSearches()
    }
  }, [status, viewFilter])

  const loadSearches = async () => {
    try {
      setLoading(true)
      const url = new URL('/api/saved-searches', window.location.origin)
      if (viewFilter === 'subscribed') {
        url.searchParams.set('subscribed', 'true')
      }
      
      const response = await fetch(url.toString())
      if (!response.ok) throw new Error('Failed to load searches')
      
      const data = await response.json()
      setSearches(data.searches || [])
    } catch (error) {
      console.error('Error loading searches:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRunSearch = async (searchId: string) => {
    try {
      const response = await fetch(`/api/saved-searches/${searchId}/run`, {
        method: 'POST',
      })
      
      if (!response.ok) throw new Error('Failed to run search')
      
      const data = await response.json()
      alert(`Search completed: ${data.resultCount} results found`)
      loadSearches() // Refresh to show updated lastRunAt
    } catch (error) {
      console.error('Error running search:', error)
      alert('Failed to run search')
    }
  }

  const handleExportSearch = async (searchId: string, format: string) => {
    try {
      const response = await fetch(`/api/saved-searches/${searchId}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format }),
      })
      
      if (!response.ok) throw new Error('Failed to export')
      
      const data = await response.json()
      
      // Download the file
      const link = document.createElement('a')
      link.href = data.fileUrl
      link.download = data.fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      loadSearches() // Refresh to show new export count
    } catch (error) {
      console.error('Error exporting:', error)
      alert('Failed to export results')
    }
  }

  const handleToggleSubscription = async (searchId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/saved-searches/${searchId}/subscription`, {
        method: enabled ? 'DELETE' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: enabled ? undefined : JSON.stringify({ enabled: true, frequency: 'DAILY' }),
      })
      
      if (!response.ok) throw new Error('Failed to update subscription')
      
      loadSearches()
    } catch (error) {
      console.error('Error toggling subscription:', error)
      alert('Failed to update subscription')
    }
  }

  const handleDeleteSearch = async (searchId: string, searchName: string) => {
    if (!confirm(`Are you sure you want to delete "${searchName}"?`)) return
    
    try {
      const response = await fetch(`/api/saved-searches/${searchId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) throw new Error('Failed to delete search')
      
      loadSearches()
    } catch (error) {
      console.error('Error deleting search:', error)
      alert('Failed to delete search')
    }
  }

  const filteredSearches = searches.filter((search) => {
    if (viewFilter === 'subscribed') return search.subscriptionEnabled
    if (viewFilter === 'saved') return !search.subscriptionEnabled
    return true
  })

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="animate-spin h-16 w-16 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Use 85% of viewport width with larger max-width */}
      <div className="w-[85%] max-w-[1800px] mx-auto px-6 py-10">
        {/* Header - More prominent */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-white flex items-center gap-4 mb-3">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 flex items-center justify-center">
                  <Bell className="h-7 w-7 text-emerald-400" />
                </div>
                Alerts & Saved Searches
              </h1>
              <p className="text-lg text-slate-400 ml-[72px]">
                Manage your saved searches and alert subscriptions
              </p>
            </div>
          </div>

          {/* View Filters - Larger and more readable */}
          <div className="flex items-center gap-4">
            {(['all', 'subscribed', 'saved'] as ViewFilter[]).map((filter) => (
              <button
                key={filter}
                onClick={() => setViewFilter(filter)}
                className={`px-6 py-3 rounded-xl font-semibold text-base transition-all ${
                  viewFilter === filter
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/25'
                    : 'bg-slate-800/50 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700'
                }`}
              >
                {filter === 'all' && `All Searches (${searches.length})`}
                {filter === 'subscribed' && `Active Alerts (${searches.filter(s => s.subscriptionEnabled).length})`}
                {filter === 'saved' && `Saved Only (${searches.filter(s => !s.subscriptionEnabled).length})`}
              </button>
            ))}
          </div>
        </div>

        {/* Empty State */}
        {filteredSearches.length === 0 && (
          <div className="text-center py-20">
            <div className="inline-flex flex-col items-center gap-6 max-w-lg mx-auto">
              <div className="h-24 w-24 rounded-2xl border-2 border-slate-800 bg-gradient-to-br from-slate-900/50 to-slate-950/30 flex items-center justify-center">
                <Search className="h-12 w-12 text-slate-600" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-white mb-3">
                  No {viewFilter !== 'all' ? viewFilter : ''} searches yet
                </h3>
                <p className="text-base text-slate-400">
                  Save searches from the main search page to manage them here
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Searches List - Larger cards with better spacing */}
        <div className="space-y-5">
          {filteredSearches.map((search) => (
            <div
              key={search.id}
              className="bg-slate-900/50 border-2 border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 hover:shadow-xl transition-all"
            >
              {/* Main Row */}
              <div className="p-7">
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-4 mb-3">
                      <h3 className="text-xl font-bold text-white truncate">
                        {search.name}
                      </h3>
                      {search.subscriptionEnabled && (
                        <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-semibold">
                          <Bell className="h-4 w-4" />
                          {search.frequency}
                        </span>
                      )}
                    </div>
                    
                    {search.description && (
                      <p className="text-base text-slate-400 mb-4">{search.description}</p>
                    )}

                    {/* Search Criteria Pills - Larger and more readable */}
                    <div className="flex flex-wrap gap-2.5 mb-4">
                      {search.keywords && (
                        <span className="px-3 py-1.5 rounded-lg bg-slate-800/70 text-sm font-medium text-slate-200 border border-slate-700">
                          Keywords: {search.keywords}
                        </span>
                      )}
                      {search.naics && (
                        <span className="px-3 py-1.5 rounded-lg bg-slate-800/70 text-sm font-medium text-slate-200 border border-slate-700">
                          NAICS: {search.naics}
                        </span>
                      )}
                      {search.agency && (
                        <span className="px-3 py-1.5 rounded-lg bg-slate-800/70 text-sm font-medium text-slate-200 border border-slate-700">
                          Agency: {search.agency}
                        </span>
                      )}
                      {search.setAside && (
                        <span className="px-3 py-1.5 rounded-lg bg-slate-800/70 text-sm font-medium text-slate-200 border border-slate-700">
                          Set-Aside: {search.setAside}
                        </span>
                      )}
                    </div>

                    {/* Metadata - Larger text */}
                    <div className="flex items-center gap-6 text-sm text-slate-400 font-medium">
                      {search.lastRunAt && (
                        <span className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Last run: {new Date(search.lastRunAt).toLocaleDateString()}
                          {search.lastResultCount !== undefined && ` (${search.lastResultCount} results)`}
                        </span>
                      )}
                      <span className="flex items-center gap-2">
                        <Play className="h-4 w-4" />
                        {search._count.runs} runs
                      </span>
                      <span className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        {search._count.exports} exports
                      </span>
                    </div>
                  </div>

                  {/* Actions - Larger buttons with better touch targets */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleRunSearch(search.id)}
                      className="p-3.5 rounded-xl bg-slate-800/50 hover:bg-emerald-500/10 text-slate-300 hover:text-emerald-400 border-2 border-slate-700 hover:border-emerald-500/30 transition-all"
                      title="Run search now"
                    >
                      <Play className="h-5 w-5" />
                    </button>

                    <div className="relative group">
                      <button className="p-3.5 rounded-xl bg-slate-800/50 hover:bg-cyan-500/10 text-slate-300 hover:text-cyan-400 border-2 border-slate-700 hover:border-cyan-500/30 transition-all">
                        <Download className="h-5 w-5" />
                      </button>
                      
                      <div className="absolute right-0 mt-2 w-48 bg-slate-900 border-2 border-slate-800 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                        {['CSV', 'JSON', 'EXCEL', 'PDF'].map((format) => (
                          <button
                            key={format}
                            onClick={() => handleExportSearch(search.id, format)}
                            className="w-full px-5 py-3 text-left text-base font-medium text-slate-300 hover:bg-slate-800 hover:text-white first:rounded-t-xl last:rounded-b-xl transition-colors"
                          >
                            Export as {format}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setEditingSearch(search)
                        setShowEditModal(true)
                      }}
                      className="p-3.5 rounded-xl bg-slate-800/50 hover:bg-blue-500/10 text-slate-300 hover:text-blue-400 border-2 border-slate-700 hover:border-blue-500/30 transition-all"
                      title="Edit search"
                    >
                      <Pencil className="h-5 w-5" />
                    </button>

                    <button
                      onClick={() => handleToggleSubscription(search.id, search.subscriptionEnabled)}
                      className={`p-3.5 rounded-xl border-2 transition-all ${
                        search.subscriptionEnabled
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                          : 'bg-slate-800/50 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white'
                      }`}
                      title={search.subscriptionEnabled ? 'Disable alerts' : 'Enable alerts'}
                    >
                      {search.subscriptionEnabled ? (
                        <Bell className="h-5 w-5" />
                      ) : (
                        <BellOff className="h-5 w-5" />
                      )}
                    </button>

                    <button
                      onClick={() => handleDeleteSearch(search.id, search.name)}
                      className="p-3.5 rounded-xl bg-slate-800/50 hover:bg-red-500/10 text-slate-300 hover:text-red-400 border-2 border-slate-700 hover:border-red-500/30 transition-all"
                      title="Delete search"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && editingSearch && (
        <UnifiedSaveSearchModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setEditingSearch(null)
          }}
          mode="save"
          existingSearch={{
            id: editingSearch.id,
            name: editingSearch.name,
            description: editingSearch.description || '',
            keywords: editingSearch.keywords || '',
            naics: editingSearch.naics || '',
            agency: editingSearch.agency || '',
            setAside: editingSearch.setAside || '',
            stateOfPerformance: editingSearch.stateOfPerformance || '',
            procurementType: editingSearch.procurementType || '',
          }}
          onSave={() => {
            loadSearches()
            setShowEditModal(false)
            setEditingSearch(null)
          }}
        />
      )}
    </div>
  )
}