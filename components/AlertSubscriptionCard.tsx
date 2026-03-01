//app/components/AlertSubscriptionCard.tsx

'use client'

import React, { useState } from 'react'
import {
  Bell,
  Pencil,
  Trash2,
  Save,
  X,
} from 'lucide-react'
import { deleteAlertSubscription, updateAlertSubscription } from '@/lib/actions'

export type AlertSubscription = {
  id: string
  name: string
  keywords: string
  setAside?: string
  placeOfPerformance?: string
  procurementType?: string
  naics?: string
  createdAt: string
}

interface AlertSubscriptionCardProps {
  alert: AlertSubscription
  refresh: () => void
}

const setAsideOptions = [
  { value: '', label: 'Any' },
  { value: 'Total Small Business Set-Aside (FAR 19.5)', label: 'Total Small Business Set-Aside (FAR 19.5)' },
  { value: '8(a) Set-Aside (FAR 19.8)', label: '8(a) Set-Aside (FAR 19.8)' },
  { value: 'Veteran-Owned', label: 'Veteran-Owned' },
  { value: 'VETERAN-OWNED', label: 'VETERAN-OWNED' },
  { value: 'HUBZone', label: 'HUBZone' },
  { value: 'Women-Owned', label: 'Women-Owned' },
]

const procurementTypeOptions = [
  { value: '', label: 'Any' },
  { value: 'Presolicitation', label: 'Presolicitation' },
  { value: 'Sources Sought', label: 'Sources Sought' },
  { value: 'Combined Synopsis/Solicitation', label: 'Combined Synopsis/Solicitation' },
  { value: 'Special Notice', label: 'Special Notice' },
]

const stateOptions = [
  { value: '', label: 'Any' },
  { value: 'VA', label: 'VA' },
  { value: 'CA', label: 'CA' },
  { value: 'TX', label: 'TX' },
  { value: 'NY', label: 'NY' },
  { value: 'FL', label: 'FL' },
  { value: 'GA', label: 'GA' },
  { value: 'DC', label: 'DC' },
  { value: 'MD', label: 'MD' },
  { value: 'IL', label: 'IL' },
  { value: 'PA', label: 'PA' },
]

function formatDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch {
    return dateStr
  }
}

export default function AlertSubscriptionCard({ alert: alertData, refresh }: AlertSubscriptionCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(alertData.name)
  const [keywords, setKeywords] = useState(alertData.keywords)
  const [setAside, setSetAside] = useState(alertData.setAside || '')
  const [placeOfPerformance, setPlaceOfPerformance] = useState(alertData.placeOfPerformance || '')
  const [procurementType, setProcurementType] = useState(alertData.procurementType || '')
  const [naics, setNaics] = useState(alertData.naics || '')
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    try {
      setIsSaving(true)
      
      const result = await updateAlertSubscription({
        id: alertData.id,
        name,
        keywords,
        setAside,
        placeOfPerformance,
        procurementType,
        naics,
      })
      
      if (result.success) {
        window.alert('Alert updated successfully')
        setIsEditing(false)
        refresh()
      } else {
        throw new Error('Update failed')
      }
    } catch (err) {
      console.error('Error updating alert:', err)
      window.alert(`Failed to update alert: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${alertData.name}"?`)) {
      return
    }
    
    try {
      setIsDeleting(true)
      console.log('Deleting alert:', alertData.id)
      
      const result = await deleteAlertSubscription(alertData.id)
      
      if (result.success) {
        console.log('Delete successful, refreshing...')
        window.alert('Alert deleted successfully')
        refresh()
      } else {
        throw new Error('Delete failed')
      }
    } catch (err) {
      console.error('Error deleting alert:', err)
      window.alert(`Failed to delete alert: ${err instanceof Error ? err.message : 'Unknown error'}`)
      setIsDeleting(false)
    }
    // Note: Don't set isDeleting to false here if successful, 
    // as the component will be removed from the DOM
  }

  return (
    <div className="border-2 border-gray-300 p-4 rounded-lg shadow-sm space-y-4 bg-white">
      {isEditing ? (
        <>
          <div className="space-y-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Alert name"
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            />
            
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="Keywords"
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            />

            <select
              value={setAside}
              onChange={(e) => setSetAside(e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            >
              {setAsideOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={placeOfPerformance}
              onChange={(e) => setPlaceOfPerformance(e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            >
              {stateOptions.map((state) => (
                <option key={state.value} value={state.value}>
                  {state.label}
                </option>
              ))}
            </select>

            <select
              value={procurementType}
              onChange={(e) => setProcurementType(e.target.value)}
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            >
              {procurementTypeOptions.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>

            <input
              type="text"
              value={naics}
              onChange={(e) => setNaics(e.target.value)}
              placeholder="NAICS Code"
              className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => setIsEditing(false)}
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 disabled:opacity-50 font-semibold"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-lg text-gray-900">{name}</p>
              <p className="text-sm text-gray-600 mt-1">{keywords || 'No keywords'}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Edit alert"
              >
                <Pencil className="h-4 w-4 text-gray-600" />
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-2 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Delete alert"
              >
                <Trash2 className={`h-4 w-4 ${isDeleting ? 'text-red-300' : 'text-red-500'}`} />
              </button>
            </div>
          </div>
          <div className="text-sm text-gray-600 space-y-1 border-t border-gray-200 pt-3">
            <p><span className="font-semibold">Set Aside:</span> {setAside || 'Any'}</p>
            <p><span className="font-semibold">State:</span> {placeOfPerformance || 'Any'}</p>
            <p><span className="font-semibold">Type:</span> {procurementType || 'Any'}</p>
            <p><span className="font-semibold">NAICS:</span> {naics || '—'}</p>
            <p className="text-xs text-gray-500 mt-2">Created: {formatDate(alertData.createdAt)}</p>
          </div>
        </>
      )}
    </div>
  )
}
