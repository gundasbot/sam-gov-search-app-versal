//app/pricing/checkout/page.tsx

'use client'

import React, { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-slate-100 text-slate-900 px-6">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
            <div className="mx-auto mb-3 h-10 w-10 rounded-full border-4 border-slate-200 border-t-slate-800 animate-spin" />
            <div className="text-lg font-semibold">Preparing checkout...</div>
            <div className="text-slate-500 text-sm mt-2">One moment</div>
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
    const okPlan = plan === 'basic' || plan === 'professional' || plan === 'enterprise'
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
          body: JSON.stringify({
            plan,
            billing,
            source: 'public_pricing_checkout',
          }),
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
    <main className="min-h-screen flex items-center justify-center bg-slate-100 text-slate-900 px-6">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">Stripe Checkout</h1>

        {loading && (
          <div className="mt-3">
            <div className="h-8 w-8 rounded-full border-4 border-slate-200 border-t-slate-800 animate-spin mb-3" />
            <p className="text-slate-700">
            Redirecting you to secure checkout for{' '}
            <span className="font-semibold capitalize">{plan || 'plan'}</span> (
            {billing || 'billing'})…
            </p>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="font-semibold text-red-800">Checkout error</div>
            <div className="text-sm text-red-700 mt-1">{error}</div>

            <button
              type="button"
              onClick={() => router.push('/pricing')}
              className="mt-4 inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Back to Pricing
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
