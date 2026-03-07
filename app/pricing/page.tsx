import { Suspense } from 'react'
import PricingClient from './PricingClient'

export default function PricingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
          <div className="text-center">
            <div className="mx-auto mb-4 h-14 w-14 rounded-full border-4 border-[var(--color-border)] border-t-[var(--color-primary)] animate-spin" />
            <p className="text-lg font-semibold text-[var(--color-text-secondary)]">Loading pricing...</p>
          </div>
        </div>
      }
    >
      <PricingClient />
    </Suspense>
  )
}
