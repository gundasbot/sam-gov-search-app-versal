// app/checkout/success/SuccessClient.tsx
'use client'

export const dynamic = 'force-dynamic';


import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function SuccessClient() {
  const router = useRouter()
  const sp = useSearchParams()

  // Null-safe (your project typing may treat sp as possibly null)
  const sessionId = sp?.get('session_id') ?? null

  useEffect(() => {
    // OPTIONAL: verify session here if you want
    // if (sessionId) fetch(`/api/stripe/verify-session?session_id=${encodeURIComponent(sessionId)}`)
  }, [sessionId])

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-3">Payment successful</h1>
        <p className="text-slate-300">
          Thanks — your checkout is complete{sessionId ? ` (session: ${sessionId})` : ''}.
        </p>

        <div className="mt-6 flex gap-3">
          <button
            className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500"
            onClick={() => router.push('/account')}
          >
            Go to Account
          </button>
          <button
            className="px-4 py-2 rounded-md bg-slate-800 hover:bg-slate-700"
            onClick={() => router.push('/search')}
          >
            Back to Search
          </button>
        </div>
      </div>
    </div>
  )
}
