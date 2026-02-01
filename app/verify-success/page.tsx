// app/verify-success/page.tsx
import { Suspense } from 'react'
import VerifySuccessClient from './VerifySuccessClient'

export default function VerifySuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
          <div className="text-center">
            <div className="h-16 w-16 rounded-full border-4 border-white/20 border-t-white animate-spin mx-auto mb-4" />
            <p className="text-slate-300 text-lg font-semibold">Verifying…</p>
          </div>
        </div>
      }
    >
      <VerifySuccessClient />
    </Suspense>
  )
}
