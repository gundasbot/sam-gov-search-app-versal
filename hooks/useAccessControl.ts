// hooks/useAccessControl.ts
'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'

export interface AccessControlState {
  // Authentication
  isAuthenticated: boolean
  isLoading: boolean

  // Plan fetch lifecycle
  isPlanLoading: boolean
  hasCheckedPlan: boolean

  // Subscription
  hasActiveSubscription: boolean
  tier: 'NONE' | 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE'
  status: 'active' | 'trialing' | 'trial' | 'past_due' | 'canceled' | 'inactive' | 'pending'

  // Access permissions (subscription-gated features)
  canAccessSearch: boolean
  canAccessOpportunities: boolean
  canAccessInsights: boolean
  canAccessAlerts: boolean

  // Timer (for unauthenticated users only)
  showTimerWarning: boolean
  showTimerLockout: boolean
  remainingTime: number // in milliseconds

  // Actions
  clearTimer: () => void
}

const TIMER_WARNING_MS = 600000 // 10 minutes
const TIMER_LOCKOUT_MS = 900000 // 15 minutes

type PlanData = {
  tier: 'NONE' | 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE'
  interval: 'month' | 'year' | null
  status: string
  hasSubscription: boolean
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
}

function isActiveStatus(s: any): boolean {
  const v = String(s || '').toLowerCase()
  return v === 'active' || v === 'trialing' || v === 'trial' || v === 'past_due'
}

export function useAccessControl(): AccessControlState {
  const { data: session, status: sessionStatus } = useSession()
  const email = session?.user?.email || null

  const [planData, setPlanData] = useState<PlanData | null>(null)
  const [planLoading, setPlanLoading] = useState(false)
  const [hasCheckedPlan, setHasCheckedPlan] = useState(false)

  // Timer state (only for unauthenticated users)
  const [browsingStartTime, setBrowsingStartTime] = useState<number | null>(null)
  const [showTimerWarning, setShowTimerWarning] = useState(false)
  const [showTimerLockout, setShowTimerLockout] = useState(false)
  const [remainingTime, setRemainingTime] = useState<number>(0)

  // Prevent duplicate plan fetch in dev StrictMode/HMR
  const didFetchPlanRef = useRef(false)

  // Fetch plan data for authenticated users
  useEffect(() => {
    // Reset fetch guards when user changes
    didFetchPlanRef.current = false

    // While NextAuth is hydrating, treat as loading and do nothing
    if (sessionStatus === 'loading') {
      setPlanLoading(false)
      setHasCheckedPlan(false)
      setPlanData(null)
      return
    }

    // If unauthenticated, clear plan
    if (sessionStatus === 'unauthenticated') {
      setPlanLoading(false)
      setHasCheckedPlan(true)
      setPlanData(null)
      return
    }

    // Authenticated but missing email (shouldn't happen, but be safe)
    if (sessionStatus === 'authenticated' && !email) {
      setPlanLoading(false)
      setHasCheckedPlan(true)
      setPlanData(null)
      return
    }
  }, [sessionStatus, email])

  useEffect(() => {
    if (sessionStatus !== 'authenticated') return
    if (!email) return

    // If we already fetched for this user this mount-cycle, skip
    if (didFetchPlanRef.current) return
    didFetchPlanRef.current = true

    const controller = new AbortController()

    const run = async () => {
      try {
        setPlanLoading(true)
        setHasCheckedPlan(false)

        console.log('📊 Fetching plan data for authenticated user:', email)

        const res = await fetch('/api/account/plan', {
          method: 'GET',
          credentials: 'include',
          signal: controller.signal,
          headers: { 'Accept': 'application/json' },
        })

        if (!res.ok) throw new Error(`Failed to fetch plan (HTTP ${res.status})`)

        const data = await res.json()

        console.log('✅ Plan data received:', {
          tier: data.tier,
          status: data.status,
          hasSubscription: data.hasSubscription,
        })

        setPlanData({
          tier: (data.tier || 'NONE') as any,
          interval: data.interval || null,
          status: data.status || 'inactive',
          hasSubscription: Boolean(data.hasSubscription),
          currentPeriodEnd: data.currentPeriodEnd || null,
          cancelAtPeriodEnd: Boolean(data.cancelAtPeriodEnd),
        })
      } catch (err: any) {
        // Ignore aborts
        if (err?.name === 'AbortError') return
        console.error('❌ Error fetching plan:', err?.message || err)
        setPlanData(null)
      } finally {
        setPlanLoading(false)
        setHasCheckedPlan(true)
      }
    }

    run()

    return () => controller.abort()
  }, [sessionStatus, email])

  // Timer logic for UNAUTHENTICATED users only
  useEffect(() => {
    // Skip timer for authenticated users
    if (sessionStatus === 'authenticated') {
      localStorage.removeItem('browsingStartTime')
      setBrowsingStartTime(null)
      setShowTimerWarning(false)
      setShowTimerLockout(false)
      setRemainingTime(0)
      return
    }

    // Only run timer for unauthenticated users
    if (sessionStatus === 'unauthenticated') {
      const storedStartTime = localStorage.getItem('browsingStartTime')
      const now = Date.now()

      if (storedStartTime) {
        const startTime = parseInt(storedStartTime, 10)
        const elapsed = now - startTime
        const remaining = TIMER_LOCKOUT_MS - elapsed

        setBrowsingStartTime(startTime)
        setRemainingTime(Math.max(0, remaining))

        if (elapsed >= TIMER_WARNING_MS && elapsed < TIMER_LOCKOUT_MS) {
          setShowTimerWarning(true)
          setShowTimerLockout(false)
        } else if (elapsed >= TIMER_LOCKOUT_MS) {
          setShowTimerWarning(false)
          setShowTimerLockout(true)
        }
      } else {
        localStorage.setItem('browsingStartTime', now.toString())
        setBrowsingStartTime(now)
        setRemainingTime(TIMER_LOCKOUT_MS)
      }

      const interval = setInterval(() => {
        const stored = localStorage.getItem('browsingStartTime')
        if (!stored) return

        const startTime = parseInt(stored, 10)
        const elapsed = Date.now() - startTime
        const remaining = TIMER_LOCKOUT_MS - elapsed
        setRemainingTime(Math.max(0, remaining))

        if (elapsed >= TIMER_LOCKOUT_MS) {
          setShowTimerLockout(true)
          clearInterval(interval)
        } else if (elapsed >= TIMER_WARNING_MS) {
          setShowTimerWarning(true)
        }
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [sessionStatus])

  const hasActiveSubscription = useMemo(() => {
    if (!planData) return false
    return Boolean(planData.hasSubscription) && isActiveStatus(planData.status)
  }, [planData])

  // ✅ KEY CHANGE:
  // While plan is still loading and we haven't checked it yet,
  // we DO NOT want the app to treat the user as "denied" and trigger redirects.
  const isAuthenticated = sessionStatus === 'authenticated'
  const isPlanLoading = isAuthenticated && (planLoading || !hasCheckedPlan)

  const canAccessPaidFeatures = isAuthenticated && hasCheckedPlan && hasActiveSubscription

  const canAccessSearch = canAccessPaidFeatures
  const canAccessOpportunities = canAccessPaidFeatures
  const canAccessInsights = canAccessPaidFeatures
  const canAccessAlerts = canAccessPaidFeatures

  const clearTimer = useCallback(() => {
    localStorage.removeItem('browsingStartTime')
    setBrowsingStartTime(null)
    setShowTimerWarning(false)
    setShowTimerLockout(false)
    setRemainingTime(0)
  }, [])

  // Debug log
  useEffect(() => {
    console.log('🔐 ACCESS CONTROL STATE:', {
      sessionStatus,
      email,
      isAuthenticated,
      isPlanLoading,
      hasCheckedPlan,
      tier: planData?.tier || 'NONE',
      status: planData?.status || 'N/A',
      hasSubscription: planData?.hasSubscription || false,
      hasActiveSubscription,
      canAccessPaidFeatures,
      showTimerWarning: sessionStatus === 'unauthenticated' && showTimerWarning,
      showTimerLockout: sessionStatus === 'unauthenticated' && showTimerLockout,
      remainingMinutes: Math.ceil(remainingTime / 60000),
    })
  }, [
    sessionStatus,
    email,
    isAuthenticated,
    isPlanLoading,
    hasCheckedPlan,
    planData,
    hasActiveSubscription,
    canAccessPaidFeatures,
    showTimerWarning,
    showTimerLockout,
    remainingTime,
  ])

  return {
    // Authentication
    isAuthenticated,
    isLoading: sessionStatus === 'loading' || (isAuthenticated && isPlanLoading),

    // Plan lifecycle
    isPlanLoading,
    hasCheckedPlan,

    // Subscription
    hasActiveSubscription,
    tier: (planData?.tier || 'NONE') as any,
    status: (planData?.status || 'inactive') as any,

    // Access permissions
    canAccessSearch,
    canAccessOpportunities,
    canAccessInsights,
    canAccessAlerts,

    // Timer
    showTimerWarning: sessionStatus === 'unauthenticated' && showTimerWarning,
    showTimerLockout: sessionStatus === 'unauthenticated' && showTimerLockout,
    remainingTime,

    // Actions
    clearTimer,
  }
}
