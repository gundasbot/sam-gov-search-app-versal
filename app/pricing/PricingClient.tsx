// app/pricing/PricingClient.tsx
'use client'

export const dynamic = 'force-dynamic';

import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  Check,
  Shield,
  Zap,
  Crown,
  Loader2,
  AlertCircle,
  Gift,
  ArrowRight,
  CreditCard,
  XCircle,
} from 'lucide-react'

type BillingInterval = 'monthly' | 'annual'
type PlanTier = 'NONE' | 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE'

type SubscriptionInfo = {
  tier: PlanTier
  interval: 'month' | 'year' | null
  status?: string | null
  subscriptionId?: string | null
  cancelAtPeriodEnd?: boolean
  currentPeriodEnd?: string | null
  hasSubscription: boolean
  stripeCustomerId?: string | null
  stripeSubscriptionId?: string | null
}

type PricingTier = {
  id: Exclude<PlanTier, 'NONE'>
  name: string
  tagline: string
  description: string
  monthlyPrice: number
  annualPrice: number
  tierLevel: number
  highlight?: boolean
  icon: any
  gradient: string
  border: string
  glow: string
  bestFor: string
  features: string[]
}

// Prices fetched live from Stripe (keyed by tier id + interval)
type LivePriceKey = `${Exclude<PlanTier, 'NONE'>}_monthly` | `${Exclude<PlanTier, 'NONE'>}_annual`
type LivePrices = Partial<Record<LivePriceKey, number>>

const TIERS: PricingTier[] = [
  {
    id: 'BASIC',
    name: 'Basic',
    tagline: 'For getting started',
    description: 'Essential features to search and track opportunities.',
    monthlyPrice: 24.99,
    annualPrice: 240.00,
    tierLevel: 1,
    icon: Shield,
    gradient: 'from-slate-700 via-slate-800 to-slate-900',
    border: 'border-slate-700/40',
    glow: 'shadow-slate-900/30',
    bestFor: 'New contractors exploring opportunities',
    features: [
      'Search opportunities',
      'Basic filters (NAICS, keywords)',
      'Save up to 10 opportunities',
      'Email support',
    ],
  },
  {
    id: 'PROFESSIONAL',
    name: 'Professional',
    tagline: 'For serious bidding teams',
    description: 'Advanced tracking, alerts, and deeper analytics.',
    monthlyPrice: 49.00,
    annualPrice: 490.00,
    tierLevel: 2,
    highlight: true,
    icon: Zap,
    gradient: 'from-cyan-500 via-blue-500 to-indigo-600',
    border: 'border-cyan-500/30',
    glow: 'shadow-cyan-500/20',
    bestFor: 'Teams actively bidding every week',
    features: [
      'Everything in Basic',
      'Unlimited saved opportunities',
      'Saved searches & alerts',
      'Export results (CSV)',
      'Priority support',
    ],
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    tagline: 'For organizations at scale',
    description: 'Team features, admin controls, and maximum automation.',
    monthlyPrice: 199.00,
    annualPrice: 1990.00,
    tierLevel: 3,
    icon: Crown,
    gradient: 'from-amber-500 via-orange-500 to-rose-600',
    border: 'border-amber-500/30',
    glow: 'shadow-amber-500/20',
    bestFor: 'Organizations managing multiple bids',
    features: [
      'Everything in Professional',
      'Team accounts & roles',
      'Admin portal controls',
      'Advanced reporting',
      'Dedicated onboarding',
    ],
  },
]

function formatDate(timestampOrISO?: string | number | null) {
  if (!timestampOrISO) return null
  try {
    const d =
      typeof timestampOrISO === 'number'
        ? new Date(timestampOrISO * 1000)
        : new Date(timestampOrISO)
    if (Number.isNaN(d.getTime())) return null
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return null
  }
}

export default function PricingClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { status } = useSession()

  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly')
  const [subscription, setSubscription] = useState<SubscriptionInfo>({
    tier: 'NONE',
    interval: null,
    status: null,
    subscriptionId: null,
    cancelAtPeriodEnd: false,
    currentPeriodEnd: null,
    hasSubscription: false,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
  })

  const [loading, setLoading] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Live Stripe prices
  const [livePrices, setLivePrices] = useState<LivePrices>({})
  const [pricesLoading, setPricesLoading] = useState(true)

  const [showChangeWarning, setShowChangeWarning] = useState<{
    tier: PricingTier
    type: 'upgrade' | 'downgrade' | 'new' | 'interval-change'
  } | null>(null)

  const [pendingAction, setPendingAction] = useState<{
    tier: PricingTier
    type: 'upgrade' | 'downgrade' | 'new' | 'interval-change'
  } | null>(null)

  // ── Fetch live prices from Stripe via our own API ──────────────────────────
  const fetchLivePrices = useCallback(async () => {
    try {
      setPricesLoading(true)
      const res = await fetch('/api/stripe/prices', { cache: 'no-store' })
      if (!res.ok) throw new Error(`prices API returned ${res.status}`)
      const data: Array<{
        tier: Exclude<PlanTier, 'NONE'>
        interval: 'monthly' | 'annual'
        unitAmount: number // cents
      }> = await res.json()

      const map: LivePrices = {}
      for (const item of data) {
        const key = `${item.tier}_${item.interval}` as LivePriceKey
        map[key] = item.unitAmount / 100
      }
      setLivePrices(map)
    } catch (err) {
      console.warn('⚠️ Could not fetch live prices, using fallback values:', err)
      // livePrices stays empty → component falls back to hardcoded TIERS prices
    } finally {
      setPricesLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLivePrices()
  }, [fetchLivePrices])

  /** Resolve the displayed price: live Stripe price, or hardcoded fallback */
  const resolvePrice = useCallback(
    (tier: PricingTier, interval: BillingInterval): number => {
      const key = `${tier.id}_${interval}` as LivePriceKey
      const live = livePrices[key]
      if (live !== undefined) return live
      return interval === 'annual' ? tier.annualPrice : tier.monthlyPrice
    },
    [livePrices]
  )

  /**
   * Annual savings as a whole-number percentage vs paying monthly × 12.
   * e.g. Basic: (299.88 - 240) / 299.88 ≈ 20%
   */
  const savingsPercent = useCallback(
    (tier: PricingTier): number => {
      const monthly = resolvePrice(tier, 'monthly')
      const annual  = resolvePrice(tier, 'annual')
      if (!monthly || !annual) return 0
      return Math.round((1 - annual / (monthly * 12)) * 100)
    },
    [resolvePrice]
  )

  /** Annual price divided by 12 — shown as the effective monthly cost */
  const monthlyEquivalent = useCallback(
    (tier: PricingTier): string => {
      const annual = resolvePrice(tier, 'annual')
      return (annual / 12).toFixed(2)
    },
    [resolvePrice]
  )

  const currentTier = useMemo(() => {
    if (!subscription?.tier || subscription.tier === 'NONE') return null
    return TIERS.find((t) => t.id === subscription.tier) || null
  }, [subscription?.tier])

  const selectedInterval = useMemo(() => (billingInterval === 'annual' ? 'year' : 'month'), [billingInterval])

  const formatPrice = (value: number) => (Number.isInteger(value) ? String(value) : value.toFixed(2))

  // Load user's current plan
  const loadPlan = useCallback(async () => {
    try {
      setError(null)

      const res = await fetch('/api/account/plan', { cache: 'no-store' })
      if (!res.ok) {
        console.error('❌ API returned error:', res.status)
        return null
      }

      const data = await res.json()
      console.log('📊 RAW API Response:', JSON.stringify(data, null, 2))

      let tier: PlanTier = 'NONE'
      let subscriptionId: string | null = null
      let subscriptionStatus: string | null = null
      let interval: 'month' | 'year' | null = null

      if (data.tier) {
        tier = data.tier
      } else if (data.plan_tier) {
        tier = data.plan_tier
      } else if (data.plan && data.plan !== 'trial' && data.plan !== 'none') {
        tier = String(data.plan).toUpperCase() as PlanTier
      } else if (data.plan === 'trial' && data.plan_tier) {
        tier = data.plan_tier
      }

      // Accept either snake_case or camelCase API keys
      subscriptionId =
        data.subscription_id ||
        data.stripe_subscription_id ||
        data.subscriptionId ||
        data.stripeSubscriptionId ||
        null

      subscriptionStatus = data.status || data.subscription_status || data.plan_status || null

      if (data.interval) {
        interval = data.interval
      } else if (data.billing_interval) {
        interval = data.billing_interval === 'MONTHLY' ? 'month' : 'year'
      } else if (data.billingInterval) {
        interval = data.billingInterval === 'MONTHLY' ? 'month' : 'year'
      }

      const stripeCustomerId: string | null =
        data.stripe_customer_id ||
        data.stripeCustomerId ||
        data.customerId ||
        data.customer_id ||
        null

      const stripeSubscriptionId: string | null =
        data.stripe_subscription_id ||
        data.stripeSubscriptionId ||
        subscriptionId ||
        null

      console.log('🔍 EXTRACTED VALUES:', {
        tier,
        subscriptionId,
        subscriptionStatus,
        interval,
      })

      const statusLower = String(subscriptionStatus || '').toLowerCase()

      const hasActiveSubscription =
        tier !== 'NONE' && (statusLower === 'active' || statusLower === 'trialing' || statusLower === 'trial')

      console.log('✅ HAS SUBSCRIPTION:', hasActiveSubscription, {
        hasId: Boolean(subscriptionId),
        status: subscriptionStatus,
        tier,
        stripeCustomerId,
        stripeSubscriptionId,
      })

      setSubscription({
        tier,
        interval,
        status: subscriptionStatus,
        subscriptionId,
        cancelAtPeriodEnd: data.cancel_at_period_end || data.cancelAtPeriodEnd || false,
        currentPeriodEnd: data.current_period_end || data.currentPeriodEnd || null,
        hasSubscription: hasActiveSubscription,
        stripeCustomerId,
        stripeSubscriptionId,
      })

      return {
        tier,
        subscriptionId,
        subscriptionStatus,
        interval,
        hasActiveSubscription,
        stripeCustomerId,
        stripeSubscriptionId,
      }
    } catch (err) {
      console.error('❌ Failed to load plan:', err)
      return null
    }
  }, [])

  // --- Stripe sync helper ---
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const syncAttemptsRef = useRef(0)

  const startPlanSyncPolling = useCallback(
    async (source: string) => {
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current)
        syncTimerRef.current = null
      }
      syncAttemptsRef.current = 0

      const tick = async () => {
        syncAttemptsRef.current += 1

        const result = await loadPlan()
        const statusLower = String(result?.subscriptionStatus || '').toLowerCase()

        const done =
          Boolean(result?.subscriptionId) &&
          (statusLower === 'active' || statusLower === 'trialing' || statusLower === 'trial')

        if (done) {
          setSuccess('✅ Subscription synced successfully.')
          if (syncTimerRef.current) {
            clearTimeout(syncTimerRef.current)
            syncTimerRef.current = null
          }
          return
        }

        if (syncAttemptsRef.current >= 12) {
          setError('⚠️ We could not confirm your subscription yet. Please refresh in a minute.')
          if (syncTimerRef.current) {
            clearTimeout(syncTimerRef.current)
            syncTimerRef.current = null
          }
          return
        }

        syncTimerRef.current = setTimeout(tick, 2500)
      }

      console.log('🔁 Starting plan sync polling:', { source })
      syncTimerRef.current = setTimeout(tick, 750)
    },
    [loadPlan]
  )

  useEffect(() => {
    if (status === 'authenticated') loadPlan()
  }, [status, loadPlan])

  useEffect(() => {
    const successParam = searchParams?.get('success')
    if (successParam === 'true') {
      setSuccess('✅ Payment received — syncing your subscription…')
      startPlanSyncPolling('return-from-checkout')
      const newUrl = window.location.pathname
      window.history.replaceState({}, '', newUrl)
    }
  }, [searchParams, startPlanSyncPolling])

  useEffect(() => {
    const statusLower = String(subscription.status || '').toLowerCase()
    const shouldSync =
      status === 'authenticated' &&
      !subscription.hasSubscription &&
      subscription.tier === 'NONE' &&
      statusLower === 'pending' &&
      Boolean(subscription.stripeCustomerId)

    if (shouldSync) {
      setSuccess('⏳ Syncing your subscription (waiting for Stripe)…')
      startPlanSyncPolling('pending-plan-detected')
    }
  }, [
    status,
    subscription.status,
    subscription.hasSubscription,
    subscription.tier,
    subscription.stripeCustomerId,
    startPlanSyncPolling,
  ])

  useEffect(() => {
    if (status === 'authenticated' && typeof window !== 'undefined') {
      const pendingPlan = sessionStorage.getItem('pendingPlanSelection')
      if (pendingPlan) {
        try {
          const { tierId, interval } = JSON.parse(pendingPlan)
          const tier = TIERS.find((t) => t.id === tierId)

          if (tier) {
            console.log('🎯 Resuming pending plan selection:', { tierId, interval })
            sessionStorage.removeItem('pendingPlanSelection')
            setBillingInterval(interval === 'annual' ? 'annual' : 'monthly')
            setTimeout(() => {
              executePlanChange(tier, 'new')
            }, 1000)
          }
        } catch (err) {
          console.error('Failed to parse pending plan:', err)
          sessionStorage.removeItem('pendingPlanSelection')
        }
      }
    }
  }, [status])

  function getChangeType(tier: PricingTier): 'current' | 'upgrade' | 'downgrade' | 'new' | 'interval-change' {
    if (!currentTier) return 'new'

    if (tier.id === currentTier.id) {
      const currentInterval = subscription.interval || 'month'
      const newInterval = billingInterval === 'annual' ? 'year' : 'month'
      if (currentInterval !== newInterval) return 'interval-change'
      return 'current'
    }

    return tier.tierLevel > currentTier.tierLevel ? 'upgrade' : 'downgrade'
  }

  function getButtonText(tier: PricingTier): string {
    const changeType = getChangeType(tier)

    if (changeType === 'current') {
      return subscription.cancelAtPeriodEnd ? 'Cancellation Scheduled' : 'Current Plan'
    }

    if (changeType === 'interval-change') {
      const currentInterval = subscription.interval || 'month'
      const newInterval = billingInterval === 'annual' ? 'year' : 'month'
      return currentInterval === 'month' && newInterval === 'year' ? 'Switch to Annual' : 'Switch to Monthly'
    }

    if (status === 'unauthenticated') return 'Start 7-Day Free Trial'
    if (!subscription.hasSubscription) return 'Start 7-Day Free Trial'

    switch (changeType) {
      case 'upgrade':
        return 'Upgrade'
      case 'downgrade':
        return 'Downgrade'
      case 'new':
        return 'Start 7-Day Free Trial'
      default:
        return 'Select'
    }
  }

  function getButtonStyle(tier: PricingTier): string {
    const changeType = getChangeType(tier)

    if (changeType === 'current') {
      return 'bg-slate-900 text-white border border-slate-700/50 cursor-default'
    }

    if (tier.highlight) {
      return 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:opacity-95'
    }

    return 'bg-white text-slate-900 border border-slate-200 hover:bg-slate-50'
  }

  async function executePlanChange(tier: PricingTier, type: 'upgrade' | 'downgrade' | 'new' | 'interval-change') {
    try {
      setLoading(tier.id)
      setSaving(true)
      setError(null)
      setSuccess(null)

      if (status !== 'authenticated') {
        // Store pending selection for after signup/login
        sessionStorage.setItem(
          'pendingPlanSelection',
          JSON.stringify({ tierId: tier.id, interval: billingInterval })
        )
        router.push('/auth/signup')
        return
      }

      const payload = {
        tier: tier.id,
        billingInterval,
      }

      // If you already have an active subscription and are changing plan/interval,
      // your backend should interpret this appropriately.
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        const msg = data?.error || data?.message || 'Failed to start checkout.'
        setError(String(msg))
        return
      }

      if (data?.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url
        return
      }

      // Fallback: if backend does inline update, poll
      setSuccess('✅ Request received — syncing your subscription…')
      startPlanSyncPolling('checkout-no-url')
    } catch (err: any) {
      console.error(err)
      setError(err?.message || 'Something went wrong.')
    } finally {
      setLoading(null)
      setSaving(false)
    }
  }

  function handleSelect(tier: PricingTier) {
    const type = getChangeType(tier)

    if (type === 'current') return

    // For downgrades and interval changes, show a warning confirmation modal
    if (type === 'downgrade' || type === 'interval-change') {
      setShowChangeWarning({ tier, type })
      setPendingAction({ tier, type })
      return
    }

    // For upgrades/new, go directly
    executePlanChange(tier, type)
  }

  function closeWarning() {
    setShowChangeWarning(null)
    setPendingAction(null)
  }

  function confirmWarning() {
    if (!pendingAction) return
    executePlanChange(pendingAction.tier, pendingAction.type)
    closeWarning()
  }

  const currentPeriodEndLabel = useMemo(() => {
    const formatted = formatDate(subscription.currentPeriodEnd)
    return formatted ? `Renews / ends on ${formatted}` : null
  }, [subscription.currentPeriodEnd])

  const planStatusLabel = useMemo(() => {
    const st = String(subscription.status || '').toLowerCase()
    if (!st) return null
    if (st === 'active') return 'Active'
    if (st === 'trialing' || st === 'trial') return 'Trial'
    if (st === 'canceled' || st === 'cancelled') return 'Canceled'
    if (st === 'past_due') return 'Past Due'
    if (st === 'unpaid') return 'Unpaid'
    if (st === 'incomplete') return 'Incomplete'
    if (st === 'incomplete_expired') return 'Expired'
    if (st === 'paused') return 'Paused'
    if (st === 'pending') return 'Pending'
    return st
  }, [subscription.status])

  // ----- UI -----
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-white">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Pricing
            </h1>
            <p className="mt-2 text-slate-300">
              Choose the plan that fits your workflow. Upgrade or downgrade anytime.
            </p>

            {planStatusLabel && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-slate-200 ring-1 ring-white/10">
                <CreditCard className="h-4 w-4 text-slate-200" />
                <span>
                  Current: <span className="font-semibold">{subscription.tier}</span>
                  {subscription.interval ? (
                    <span className="text-slate-300">
                      {' '}
                      ({subscription.interval === 'month' ? 'Monthly' : 'Annual'})
                    </span>
                  ) : null}
                  {subscription.cancelAtPeriodEnd ? (
                    <span className="ml-2 rounded-full bg-amber-500/10 px-2 py-0.5 text-amber-300 ring-1 ring-amber-500/20">
                      Canceling at period end
                    </span>
                  ) : null}
                </span>
                <span className="ml-2 rounded-full bg-emerald-500/10 px-2 py-0.5 text-emerald-300 ring-1 ring-emerald-500/20">
                  {planStatusLabel}
                </span>
                {currentPeriodEndLabel ? (
                  <span className="ml-2 text-slate-400">{currentPeriodEndLabel}</span>
                ) : null}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-full bg-white/5 p-1 ring-1 ring-white/10">
              <button
                type="button"
                onClick={() => setBillingInterval('monthly')}
                className={[
                  'rounded-full px-4 py-2 text-sm font-semibold transition',
                  billingInterval === 'monthly'
                    ? 'bg-white text-slate-900'
                    : 'text-slate-200 hover:bg-white/10',
                ].join(' ')}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingInterval('annual')}
                className={[
                  'rounded-full px-4 py-2 text-sm font-semibold transition',
                  billingInterval === 'annual'
                    ? 'bg-white text-slate-900'
                    : 'text-slate-200 hover:bg-white/10',
                ].join(' ')}
              >
                Annual
                {!pricesLoading && (
                  <span className="ml-1.5 rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300 ring-1 ring-emerald-500/30">
                    Save up to {Math.max(...TIERS.map(t => savingsPercent(t)))}%
                  </span>
                )}
              </button>
            </div>

            <div className="flex sm:hidden items-center gap-2 text-sm text-slate-300 mt-1">
              <Gift className="h-4 w-4" />
              <span>7-day free trial included</span>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-sm text-slate-300">
              <Gift className="h-4 w-4" />
              <span>7-day free trial included</span>
            </div>
          </div>
        </div>

        {(error || success) && (
          <div className="mt-6 space-y-3">
            {error && (
              <div className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-200">
                <AlertCircle className="mt-0.5 h-5 w-5" />
                <div className="text-sm leading-relaxed">{error}</div>
              </div>
            )}
            {success && (
              <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-200">
                <Check className="mt-0.5 h-5 w-5" />
                <div className="text-sm leading-relaxed">{success}</div>
              </div>
            )}
          </div>
        )}

        <div className="mt-10 grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {TIERS.map((tier) => {
            const Icon = tier.icon
            const changeType = getChangeType(tier)
            const isLoading = loading === tier.id

            const price = resolvePrice(tier, billingInterval)

            const suffix = billingInterval === 'annual' ? '/yr' : '/mo'

            return (
              <div
                key={tier.id}
                className={[
                  'relative overflow-hidden rounded-3xl border bg-white/5 p-6 ring-1 ring-white/10',
                  tier.border,
                  tier.glow,
                  tier.highlight ? 'sm:scale-[1.01] md:scale-[1.02]' : '',
                ].join(' ')}
              >
                <div
                  className={[
                    'absolute inset-0 opacity-30',
                    'bg-gradient-to-br',
                    tier.gradient,
                  ].join(' ')}
                />
                <div className="relative">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-100 ring-1 ring-white/10">
                        <Icon className="h-4 w-4" />
                        {tier.name}
                      </div>
                      <div className="mt-3 text-lg font-semibold text-white">
                        {tier.tagline}
                      </div>
                      <p className="mt-2 text-sm text-slate-200/80">
                        {tier.description}
                      </p>
                    </div>

                    {tier.highlight && (
                      <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/10">
                        Most Popular
                      </div>
                    )}
                  </div>

                  <div className="mt-6">
                    {pricesLoading ? (
                      <div className="flex items-end gap-2">
                        <div className="h-10 w-24 animate-pulse rounded-lg bg-white/10" />
                        <div className="mb-1 h-4 w-6 animate-pulse rounded bg-white/10" />
                      </div>
                    ) : (
                      <>
                        <div className="flex items-end gap-2">
                          <div className="text-3xl sm:text-4xl font-bold text-white">
                            ${formatPrice(price)}
                          </div>
                          <div className="pb-1 text-sm text-slate-200/80">{suffix}</div>
                          {billingInterval === 'annual' && savingsPercent(tier) > 0 && (
                            <div className="mb-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-bold text-emerald-300 ring-1 ring-emerald-500/25">
                              Save {savingsPercent(tier)}%
                            </div>
                          )}
                        </div>
                        {billingInterval === 'annual' && (
                          <div className="mt-1 text-xs text-slate-300/70">
                            ≈ ${monthlyEquivalent(tier)}/mo · billed annually
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <div className="mt-2 text-sm text-slate-200/80">
                    Best for: <span className="text-white">{tier.bestFor}</span>
                  </div>

                  <ul className="mt-6 space-y-3 text-sm text-slate-100/90">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-3">
                        <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/10">
                          <Check className="h-3.5 w-3.5" />
                        </span>
                        <span className="leading-relaxed">{f}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    disabled={changeType === 'current' || saving}
                    onClick={() => handleSelect(tier)}
                    className={[
                      'mt-8 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition',
                      getButtonStyle(tier),
                      saving ? 'opacity-80' : '',
                    ].join(' ')}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing…
                      </>
                    ) : (
                      <>
                        {getButtonText(tier)}
                        {changeType !== 'current' && <ArrowRight className="h-4 w-4" />}
                      </>
                    )}
                  </button>

                  {changeType === 'downgrade' && (
                    <div className="mt-3 text-xs text-slate-200/70">
                      Downgrades take effect at the end of your current billing period.
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-12 rounded-3xl border border-white/10 bg-white/5 p-6 ring-1 ring-white/10">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-lg font-semibold text-white">Need help choosing?</div>
              <div className="mt-1 text-sm text-slate-300">
                Contact support and we’ll help you pick the right tier.
              </div>
            </div>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>

      {/* Warning Modal */}
      {showChangeWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-950 p-6 shadow-2xl ring-1 ring-white/10">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-2xl bg-amber-500/10 p-2 ring-1 ring-amber-500/20">
                  <AlertCircle className="h-5 w-5 text-amber-300" />
                </div>
                <div>
                  <div className="text-lg font-semibold text-white">Confirm change</div>
                  <div className="mt-1 text-sm text-slate-300">
                    {showChangeWarning.type === 'downgrade' ? (
                      <>
                        Downgrades usually take effect at the end of your current billing period.
                      </>
                    ) : (
                      <>
                        Switching billing intervals may change your next renewal date.
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={closeWarning}
                className="rounded-2xl p-2 text-slate-300 hover:bg-white/5"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={closeWarning}
                className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmWarning}
                className="flex-1 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}