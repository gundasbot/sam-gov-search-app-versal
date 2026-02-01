// components/SavedSearchActions.tsx
'use client'
import React, { useState } from 'react'
import { Bell, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'
import CreateAlertModal from './CreateAlertModal'
import SavedSearchModal from './SavedSearchModal'

interface SavedSearchActionsProps {
  currentSearchParams?: {
    keywords?: string
    naics?: string
    agency?: string
    setAside?: string
    stateOfPerformance?: string
    postedAfter?: string
    postedBefore?: string
    procurementType?: string
  }
}

export default function SavedSearchActions({ currentSearchParams }: SavedSearchActionsProps) {
  const router = useRouter()
  const [showAlertModal, setShowAlertModal] = useState(false)
  const [showSaveModal, setShowSaveModal] = useState(false)

  const handleAlertSuccess = async (alertData: any) => {
    try {
      console.log('💾 Saving alert subscription...', alertData)
      
      const response = await fetch('/api/saved-searches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...alertData,
          // Include current search params
          keywords: currentSearchParams?.keywords,
          naics: currentSearchParams?.naics,
          agency: currentSearchParams?.agency,
          setAside: alertData.setAside || currentSearchParams?.setAside,
          stateOfPerformance: alertData.stateOfPerformance || currentSearchParams?.stateOfPerformance,
          postedAfter: currentSearchParams?.postedAfter,
          postedBefore: currentSearchParams?.postedBefore,
          procurementType: currentSearchParams?.procurementType,
          // Enable subscription
          subscriptionEnabled: true,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create alert')
      }

      const result = await response.json()
      console.log('✅ Alert subscription created:', result)
      setShowAlertModal(false)
      
      // Optional: Refresh the page or show success toast
      router.refresh()
    } catch (error) {
      console.error('❌ Error creating alert:', error)
      throw error // Re-throw so modal can show error
    }
  }

  const handleSaveSuccess = async (searchData: any) => {
    try {
      console.log('💾 Saving search...', searchData)
      
      const response = await fetch('/api/saved-searches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(searchData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save search')
      }

      const result = await response.json()
      console.log('✅ Search saved:', result)
      setShowSaveModal(false)
      
      // Optional: Refresh the page or show success toast
      router.refresh()
    } catch (error) {
      console.error('❌ Error saving search:', error)
      throw error // Re-throw so modal can show error
    }
  }

  return (
    <>
      <div className="flex gap-3">
        <button
          onClick={() => setShowAlertModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg hover:opacity-90 transition-opacity"
        >
          <Bell className="h-4 w-4" />
          Create Alert Subscription
        </button>

        <button
          onClick={() => setShowSaveModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
        >
          <Save className="h-4 w-4" />
          Save Search
        </button>
      </div>

      {showAlertModal && (
        <CreateAlertModal
          isOpen={showAlertModal}
          onClose={() => setShowAlertModal(false)}
          currentSearch={currentSearchParams || {}}
          onSave={handleAlertSuccess}
        />
      )}

      {showSaveModal && (
        <SavedSearchModal
          isOpen={showSaveModal}
          onClose={() => setShowSaveModal(false)}
          currentFilters={currentSearchParams || {}}
          onSave={handleSaveSuccess}
        />
      )}
    </>
  )
}