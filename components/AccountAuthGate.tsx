// components/AccountAuthGate.tsx
'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Shield, ArrowRight, Sparkles } from 'lucide-react'
import { useState } from 'react'
import AccessControlModal from './AccessControlModal'

interface AccountAuthGateProps {
  children: React.ReactNode
  pageName: string
}

export default function AccountAuthGate({ children, pageName }: AccountAuthGateProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-emerald-500 border-r-transparent"></div>
          <p className="mt-4 text-slate-400">Loading...</p>
        </div>
      </div>
    )
  }

  // If authenticated, show the protected content
  if (status === 'authenticated') {
    return <>{children}</>
  }

  // If not authenticated, show sign-in prompt
  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50">
        <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

        <div className="relative z-10 flex items-center justify-center min-h-screen px-6 py-20">
          <div className="max-w-2xl w-full">
            {/* Icon */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full blur-2xl opacity-30"></div>
                <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-3xl border border-slate-700">
                  <Shield className="h-16 w-16 text-emerald-400" />
                </div>
              </div>
            </div>

            {/* Main heading */}
            <h1 className="text-5xl font-black text-center mb-4 bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Authentication Required
            </h1>
            
            <p className="text-2xl text-center text-slate-300 mb-12">
              Please sign in to view your {pageName.toLowerCase()}
            </p>

            {/* Action cards */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Sign In Card */}
              <div className="group rounded-2xl border-2 border-cyan-500/50 bg-gradient-to-br from-cyan-50 via-white to-blue-50 p-8 shadow-2xl shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all transform hover:scale-105 cursor-pointer"
                   onClick={() => {
                     setAuthMode('signin')
                     setShowAuthModal(true)
                   }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-1.5 bg-gradient-to-b from-cyan-500 to-blue-500 rounded-full"></div>
                  <h2 className="text-2xl font-bold text-cyan-900">Already Have an Account?</h2>
                </div>
                <p className="text-cyan-800 mb-6 text-lg">
                  Sign in to access your account settings and manage your {pageName.toLowerCase()}.
                </p>
                <button className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold py-4 px-6 rounded-xl hover:opacity-90 shadow-lg shadow-cyan-500/30 transition-all group-hover:shadow-xl">
                  Sign In Now
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              {/* Sign Up Card */}
              <div className="group rounded-2xl border-2 border-emerald-500/50 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 p-8 shadow-2xl shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all transform hover:scale-105 cursor-pointer"
                   onClick={() => {
                     setAuthMode('signup')
                     setShowAuthModal(true)
                   }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-1.5 bg-gradient-to-b from-emerald-500 to-cyan-500 rounded-full"></div>
                  <h2 className="text-2xl font-bold text-emerald-900">New to Precise GovCon?</h2>
                </div>
                <p className="text-emerald-800 mb-6 text-lg">
                  Create your free account and start your 7-day trial with full access to all features.
                </p>
                <button className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold py-4 px-6 rounded-xl hover:opacity-90 shadow-lg shadow-emerald-500/30 transition-all group-hover:shadow-xl">
                  Sign Up Free
                  <Sparkles className="h-5 w-5 group-hover:rotate-12 transition-transform" />
                </button>
              </div>
            </div>

            {/* What you'll get */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8">
              <h3 className="text-xl font-bold text-white mb-6 text-center">
                What you'll get with an account:
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="h-2 w-2 rounded-full bg-emerald-400"></div>
                  </div>
                  <div>
                    <p className="font-semibold text-white">Profile Management</p>
                    <p className="text-sm text-slate-400">Update your personal information</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="h-2 w-2 rounded-full bg-cyan-400"></div>
                  </div>
                  <div>
                    <p className="font-semibold text-white">Subscription Control</p>
                    <p className="text-sm text-slate-400">Manage your plans and billing</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="h-2 w-2 rounded-full bg-purple-400"></div>
                  </div>
                  <div>
                    <p className="font-semibold text-white">Security Settings</p>
                    <p className="text-sm text-slate-400">Protect your account data</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="h-2 w-2 rounded-full bg-amber-400"></div>
                  </div>
                  <div>
                    <p className="font-semibold text-white">Save Preferences</p>
                    <p className="text-sm text-slate-400">Customize your experience</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Back link */}
            <div className="text-center mt-8">
              <button
                onClick={() => router.push('/')}
                className="text-slate-400 hover:text-white transition-colors text-lg font-medium"
              >
                ← Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <AccessControlModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          featureName={pageName}
          initialMode={authMode}
        />
      )}
    </>
  )
}
