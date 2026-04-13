// app/opportunities/page.tsx
// Server wrapper to satisfy Next.js requirement: useSearchParams must be inside a Suspense boundary.

import { Suspense } from 'react'
import OpportunitiesClient from './OpportunitiesClient'

export default function OpportunitiesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-blue-50 flex items-center justify-center">
          <h1 className="sr-only">Federal Contract Opportunities</h1>
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
