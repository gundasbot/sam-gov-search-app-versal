'use client'

export const dynamic = 'force-dynamic';


import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useSession, signIn } from 'next-auth/react'

type Plan = 'professional' | 'enterprise'
type Billing = 'monthly' | 'annual'

function isPlan(v: string | null): v is Plan {
  return v === 'professional' || v === 'enterprise'
}
function isBilling(v: string | null): v is Billing {
  return v === 'monthly' || v === 'annual'
}

export default function ClientCheckout() {
  const sp = useSearchParams()
  const { status } = useSession()

  const [error, setError] = useState<string>('')

  const plan = sp?.get('plan') ?? null
  const billing = sp?.get('billing') ?? null

  const safe = useMemo(() => {
    return {
      plan: isPlan(plan) ? plan : null,
      billing: isBilling(billing) ? billing : null,
    }
  }, [plan, billing])

  useEffect(() => {
    let cancelled = false

    async function go() {
      setError('')

      if (!safe.plan || !safe.billing) {
        setError('Invalid checkout link. Please go back to Pricing and try again.')
        return
      }

      // If not logged in, redirect to sign-in then come back here
      if (status !== 'authenticated') {
        const callbackUrl = `/pricing/checkout?plan=${safe.plan}&billing=${safe.billing}`
        await signIn(undefined, { callbackUrl })
        return
      }

      try {
        const res = await fetch('/api/stripe/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan: safe.plan, billing: safe.billing }),
        })

        const data = await res.json().catch(() => ({}))

        if (!res.ok || !data?.url) {
          throw new Error(data?.error || 'Failed to create checkout session')
        }

        if (!cancelled) {
          window.location.href = data.url
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to start checkout.')
      }
    }

    go()
    return () => {
      cancelled = true
    }
  }, [safe.plan, safe.billing, status])

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center px-6">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900/30 p-6 text-center">
        <h1 className="text-xl font-black">Redirecting to Stripe Checkout…</h1>
        <p className="mt-2 text-sm text-slate-300">
          Plan: <span className="font-semibold text-white">{safe.plan ?? '—'}</span> · Billing:{' '}
          <span className="font-semibold text-white">{safe.billing ?? '—'}</span>
        </p>

        {error ? (
          <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
            {error}
          </div>
        ) : (
          <div className="mt-4 text-sm text-slate-400">If nothing happens, you’ll be redirected shortly.</div>
        )}
      </div>
    </main>
  )
}
