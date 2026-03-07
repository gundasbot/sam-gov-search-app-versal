// hooks/useSubscription.ts - Centralized subscription logic
'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useMemo, useRef, useState } from 'react'

type PlanTier = 'NONE' | 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE'

interface SubscriptionData {
  tier: PlanTier
  interval: 'month' | 'year' | null
  status: string
  hasSubscription: boolean
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  loading: boolean
  error: string | null
}

function isActiveStatus(s: any): boolean {
  const v = String(s || '').toLowerCase()
  return v === 'active' || v === 'trialing' || v === 'trial' || v === 'past_due'
}

export function useSubscription() {
  const { data: session, status: sessionStatus } = useSession()
  const email = session?.user?.email || null

  const [planData, setPlanData] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // prevent duplicate fetches in dev StrictMode/HMR
  const didFetchRef = useRef(false)

  useEffect(() => {
    didFetchRef.current = false

    if (sessionStatus === 'loading') {
      setLoading(true)
      setError(null)
      return
    }

    if (sessionStatus === 'unauthenticated') {
      setLoading(false)
      setError(null)
      setPlanData(null)
      return
    }

    if (sessionStatus === 'authenticated' && !email) {
      setLoading(false)
      setError(null)
      setPlanData(null)
      return
    }
  }, [sessionStatus, email])

  useEffect(() => {
    if (sessionStatus !== 'authenticated') return
    if (!email) return
    if (didFetchRef.current) return
    didFetchRef.current = true

    const controller = new AbortController()

    const run = async () => {
      try {
        setLoading(true)
        setError(null)

        const res = await fetch('/api/account/plan', {
          method: 'GET',
          credentials: 'include',
          signal: controller.signal,
          headers: { 'Accept': 'application/json' },
        })

        if (!res.ok) throw new Error(`Failed to fetch plan (HTTP ${res.status})`)

        const data = await res.json()

        setPlanData({
          tier: (data.tier || 'NONE') as PlanTier,
          interval: data.interval || null,
          status: data.status || 'inactive',
          hasSubscription: Boolean(data.hasSubscription),
          currentPeriodEnd: data.current_period_end || null,
          cancelAtPeriodEnd: Boolean(data.cancel_at_period_end),
          loading: false,
          error: null,
        })
      } catch (err: any) {
        if (err?.name === 'AbortError') return
        console.error('Error fetching plan:', err?.message || err)
        setError(err?.message || 'Failed to fetch plan')
        setPlanData(null)
      } finally {
        setLoading(false)
      }
    }

    run()
    return () => controller.abort()
  }, [sessionStatus, email])

  const hasActiveSubscription = useMemo(() => {
    if (!planData) return false
    return Boolean(planData.hasSubscription) && isActiveStatus(planData.status)
  }, [planData])

  const hasTier = (requiredTier: PlanTier) => {
    if (!planData) return false
    const tierRank: Record<PlanTier, number> = {
      NONE: 0,
      BASIC: 1,
      PROFESSIONAL: 2,
      ENTERPRISE: 3,
    }
    return tierRank[planData.tier] >= tierRank[requiredTier]
  }

  const isEnterprise = () => hasTier('ENTERPRISE')
  const isProfessional = () => hasTier('PROFESSIONAL')
  const isBasic = () => hasTier('BASIC')

  return {
    // Raw data (prefer API; session fallback)
    tier: planData?.tier || ((session?.user as any)?.tier as PlanTier) || 'NONE',
    interval: planData?.interval || (session?.user as any)?.interval || null,
    status: planData?.status || (session?.user as any)?.status || 'inactive',
    hasSubscription: planData?.hasSubscription || (session?.user as any)?.hasSubscription || false,
    currentPeriodEnd: planData?.currentPeriodEnd || (session?.user as any)?.current_period_end || null,
    cancelAtPeriodEnd: planData?.cancelAtPeriodEnd || false,

    // Loading states
    loading: loading || sessionStatus === 'loading',
    error,

    // Helpers
    hasActiveSubscription: () => hasActiveSubscription,
    hasTier,
    isEnterprise,
    isProfessional,
    isBasic,

    // Full plan data
    planData,
  }
}
