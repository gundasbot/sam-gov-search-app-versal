// app/opportunities/page.tsx
// Server wrapper to satisfy Next.js requirement: useSearchParams must be inside a Suspense boundary.

import { Suspense } from 'react'
import OpportunitiesClient from './OpportunitiesClient'

export default function OpportunitiesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center">
          <div className="text-center">
            <div className="h-16 w-16 rounded-full border-4 border-white/20 border-t-white animate-spin mx-auto mb-4" />
            <p className="text-slate-300 text-lg font-semibold">Loading opportunities…</p>
          </div>
        </div>
      }
    >
      <OpportunitiesClient />
    </Suspense>
  )
}