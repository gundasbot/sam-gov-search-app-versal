// app/pricing/page.tsx
import { Suspense } from 'react'
import PricingClient from './PricingClient'

export default function PricingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <h1 className="sr-only">Pricing Plans</h1>
          <div className="text-center">
      <h1 className="sr-only">Pricing Plans</h1>
            <div className="h-14 w-14 rounded-full border-4 border-white/20 border-t-white animate-spin mx-auto mb-4" />
      <h1 className="sr-only">Pricing Plans</h1>
            <p className="text-slate-300 text-lg font-semibold">Loading pricing…</p>
          </div>
        </div>
      }
    >
      <PricingClient />
    </Suspense>
  )
}
