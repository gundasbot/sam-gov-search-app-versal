'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import AccessControlModal from './AccessControlModal'

interface ProtectedDashboardProps {
  children: React.ReactNode
}

export default function ProtectedDashboard({ children }: ProtectedDashboardProps) {
  const { data: session, status } = useSession()
  const [showAccessModal, setShowAccessModal] = useState(false)

  // Derive authentication state from NextAuth session
  const isAuthenticated = status === 'authenticated'
  const isChecking = status === 'loading'

  useEffect(() => {
    // Show modal if not authenticated after checking
    if (!isChecking && !isAuthenticated) {
      setShowAccessModal(true)
    }
  }, [isChecking, isAuthenticated])

  if (isChecking) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Checking access...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <>
        {/* Blurred Dashboard Preview */}
        <div className="relative">
          <div className="blur-sm pointer-events-none select-none">
            {children}
          </div>
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center">
            <div className="text-center max-w-md mx-auto px-6">
              <div className="w-20 h-20 rounded-full bg-cyan-500/20 flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-slate-50 mb-4">Dashboard Access Required</h2>
              <p className="text-slate-300 mb-8">
                This dashboard contains powerful analytics and insights for federal contract opportunities. 
                Please request access or sign in to continue.
              </p>
              <button
                onClick={() => setShowAccessModal(true)}
                className="px-8 py-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-semibold transition"
              >
                Get Access
              </button>
            </div>
          </div>
        </div>

        {/* Access Control Modal */}
        <AccessControlModal
          isOpen={showAccessModal}
          onClose={() => setShowAccessModal(false)}
          featureName="Dashboard"
        />
      </>
    )
  }

  // User is authenticated, show the full dashboard
  return <>{children}</>
}
