//app/pricing/checkout/page.tsx

'use client'

import React, { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
          <div className="text-center">
            <div className="text-lg font-semibold">Preparing checkout…</div>
            <div className="text-slate-400 text-sm mt-2">One moment</div>
          </div>
        </main>
      }
    >
      <CheckoutPageInner />
    </Suspense>
  )
}

function CheckoutPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // ✅ TS-safe: searchParams can be null in types
  const plan = (searchParams?.get('plan') ?? '').toLowerCase()
  const billing = (searchParams?.get('billing') ?? '').toLowerCase()

  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const isValid = useMemo(() => {
    const okPlan = plan === 'professional' || plan === 'enterprise'
    const okBilling = billing === 'monthly' || billing === 'annual'
    return okPlan && okBilling
  }, [plan, billing])

  useEffect(() => {
    let cancelled = false

    async function go() {
      setLoading(true)
      setError(null)

      if (!isValid) {
        setLoading(false)
        setError('Invalid checkout link. Please select a plan again.')
        return
      }

      try {
        const res = await fetch('/api/stripe/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan, billing }),
        })

        const data = await res.json().catch(() => ({}))

        if (!res.ok) {
          const msg =
            typeof (data as any)?.error === 'string'
              ? (data as any).error
              : 'Unable to start checkout. Please try again.'
          throw new Error(msg)
        }

        const url = (data as any)?.url
        if (!url || typeof url !== 'string') {
          throw new Error('Stripe checkout URL not returned.')
        }

        if (!cancelled) window.location.href = url
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Checkout failed.')
          setLoading(false)
        }
      }
    }

    go()
    return () => {
      cancelled = true
    }
  }, [plan, billing, isValid])

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white px-6">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
        <h1 className="text-xl font-bold">Stripe Checkout</h1>

        {loading && (
          <p className="mt-3 text-slate-300">
            Redirecting you to secure checkout for{' '}
            <span className="font-semibold capitalize">{plan || 'plan'}</span> (
            {billing || 'billing'})…
          </p>
        )}

        {error && (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
            <div className="font-semibold text-red-200">Checkout error</div>
            <div className="text-sm text-red-200/90 mt-1">{error}</div>

            <button
              type="button"
              onClick={() => router.push('/pricing')}
              className="mt-4 inline-flex items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100"
            >
              Back to Pricing
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
