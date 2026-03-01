import { Suspense } from 'react'
import ResetPasswordClient from './reset-password-client'

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-8 text-center">
            <div className="text-white text-lg font-semibold">Loading…</div>
            <div className="text-slate-300 mt-2">Preparing reset page</div>
          </div>
        </div>
      }
    >
      <ResetPasswordClient />
    </Suspense>
  )
}
