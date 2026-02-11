// components/SavedSearchActions.tsx
'use client'
import React, { useEffect, useState } from 'react'
import { Bell, Save, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import UnifiedSaveSearchModal from './UnifiedSaveSearchModal'
import SaveSearchSuccessModal from './SaveSearchSuccessModal'

interface SavedSearchActionsProps {
  currentSearchParams?: {
    // Basic fields
    keywords?: string
    naics?: string
    agency?: string
    setAside?: string
    stateOfPerformance?: string
    postedAfter?: string
    postedBefore?: string
    procurementType?: string
    isActive?: string
    // Advanced fields (Phase 1-3)
    solicitationNumber?: string
    classificationCode?: string
    responseDeadline?: string
    noticeId?: string
    opportunityStatus?: string
    placeOfPerformanceZip?: string
    organizationCode?: string
  }

  /** If set, the Save Search button becomes an "Update" flow for this existing saved search. */
  editingSavedSearch?: {
    id: string
    name?: string
    description?: string | null
    alertSettings?: any
  } | null

  /** When arriving from the Alerts page with ?edit=1, auto-open the Update modal. */
  autoOpenSaveModal?: boolean
}

export default function SavedSearchActions({
  currentSearchParams,
  editingSavedSearch,
  autoOpenSaveModal = false,
}: SavedSearchActionsProps) {
  const router = useRouter()
  const { data: session, status } = useSession()
  
  // Single modal state
  const [showModal, setShowModal] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [savedSearchName, setSavedSearchName] = useState('')
  const [isSubscription, setIsSubscription] = useState(false)
  const [savedSearchId, setSavedSearchId] = useState<string | undefined>(undefined)

  // Auto-open modal if requested (from ?edit=1)
  useEffect(() => {
    if (!autoOpenSaveModal) return
    if (!session) return
    setShowModal(true)
  }, [autoOpenSaveModal, session])

  const handleSave = (result: any) => {
    console.log('✅ Save successful:', result)
    
    // Determine if this was a subscription or just a save
    const hasAlert = result?.search?.alertSettings?.enabled || result?.alertSettings?.enabled
    
    setShowModal(false)
    setSavedSearchName(result?.search?.name || 'Your Search')
    setIsSubscription(hasAlert)
    setSavedSearchId(result?.search?.id || editingSavedSearch?.id)
    setShowSuccessModal(true)
    
    router.refresh()
  }

  return (
    <>
      <div className="flex gap-3 items-center">
        {status === 'loading' ? (
          <div className="flex gap-3">
            <div className="h-10 w-48 bg-slate-800 animate-pulse rounded-lg" />
          </div>
        ) : !session ? (
          <div className="flex items-center gap-3 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg">
            <AlertCircle className="h-4 w-4 text-amber-400" />
            <span className="text-sm text-slate-300">
              Please{' '}
              <button
                onClick={() => router.push('/login')}
                className="text-cyan-400 hover:text-cyan-300 font-medium underline"
              >
                sign in
              </button>{' '}
              to save searches
            </span>
          </div>
        ) : (
          <>
            {/* Single unified button */}
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              <Save className="h-4 w-4" />
              {editingSavedSearch?.id ? 'Update Search' : 'Save Search'}
            </button>

            {editingSavedSearch?.id && (
              <span className="hidden md:inline-flex text-xs px-2 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-200">
                Editing: {editingSavedSearch?.name || 'Saved Search'}
              </span>
            )}
          </>
        )}
      </div>

      {/* Single unified modal */}
      {session && showModal && (
        <UnifiedSaveSearchModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          mode={editingSavedSearch?.alertSettings?.enabled ? 'alert' : 'save'}
          searchParams={currentSearchParams}
          existingSearch={editingSavedSearch}
          onSave={handleSave}
        />
      )}

      {/* Success modal */}
      <SaveSearchSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        searchName={savedSearchName}
        isSubscription={isSubscription}
        // Remove savedSearchId if the modal doesn't need it
      />
    </>
  )
}
