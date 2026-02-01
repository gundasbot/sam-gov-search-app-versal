// components/NewSearchButton.tsx
'use client'

import React, { useState } from 'react'
import { Plus } from 'lucide-react'
import SaveSearchModal from './SaveSearchModal'

interface NewSearchButtonProps {
  onSearchCreated?: () => void
  className?: string
  variant?: 'primary' | 'secondary'
}

export default function NewSearchButton({ 
  onSearchCreated,
  className = '',
  variant = 'primary'
}: NewSearchButtonProps) {
  const [showModal, setShowModal] = useState(false)

  const handleSuccess = () => {
    setShowModal(false)
    onSearchCreated?.()
  }

  const buttonClasses = variant === 'primary'
    ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:from-emerald-600 hover:to-cyan-600'
    : 'bg-slate-800/50 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700'

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${buttonClasses} ${className}`}
      >
        <Plus className="h-5 w-5" />
        New Search
      </button>

      <SaveSearchModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        currentSearch={{}}
        onSuccess={handleSuccess}
      />
    </>
  )
}