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

const TIERS: PricingTier[] = [
  {
    id: 'BASIC',
    name: 'Basic',
    tagline: 'Get Started',
    description: 'Essential tools for solo contractors',
    monthlyPrice: 24.99,
    annualPrice: 240,
    tierLevel: 1,
    icon: Shield,
    gradient: 'from-blue-500 to-cyan-500',
    border: 'border-blue-500/30',
    glow: 'shadow-[0_0_40px_rgba(59,130,246,0.25)]',
    bestFor: 'Solo contractors & consultants starting their GovCon journey',
    features: [
      '500 searches per month',
      '10 exports per month',
      '5 saved opportunities',
      'Email alerts',
      'Basic support',
    ],
  },
  {
    id: 'PROFESSIONAL',
    name: 'Professional',
    tagline: 'Most Popular',
    description: 'Advanced features for growing teams',
    monthlyPrice: 49,
    annualPrice: 490,
    tierLevel: 2,
    highlight: true,
    icon: Zap,
    gradient: 'from-emerald-500 to-teal-500',
    border: 'border-emerald-500/30',
    glow: 'shadow-[0_0_50px_rgba(16,185,129,0.25)]',
    bestFor: 'Growing businesses & small teams winning multiple contracts',
    features: [
      '5,000 searches per month',
      '100 exports per month',
      '50 saved opportunities',
      'Real-time alerts',
      'Priority support',
      'API access',
    ],
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    tagline: 'Full Power',
    description: 'Complete solution for prime contractors',
    monthlyPrice: 199,
    annualPrice: 1990,
    tierLevel: 3,
    icon: Crown,
    gradient: 'from-amber-500 to-orange-500',
    border: 'border-amber-500/30',
    glow: 'shadow-[0_0_50px_rgba(245,158,11,0.22)]',
    bestFor: 'Large contractors & primes managing complex pursuit strategies',
    features: [
      'Unlimited searches',
      'Unlimited exports',
      'Unlimited saved opportunities',
      'Dedicated account manager',
      'Custom integrations',
      'Phone support',
    ],
  },
]

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

  const [showChangeWarning, setShowChangeWarning] = useState<{
    tier: PricingTier
    type: 'upgrade' | 'downgrade' | 'new' | 'interval-change'
    message?: string
  } | null>(null)

  const [showCancelWarning, setShowCancelWarning] = useState(false)

  const currentTier = useMemo(() => {
    if (!subscription || subscription.tier === 'NONE') return null
    return TIERS.find((t) => t.id === subscription.tier) || null
  }, [subscription])

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
      } else if (data.planTier) {
        tier = data.planTier
      } else if (data.plan && data.plan !== 'trial' && data.plan !== 'none') {
        tier = String(data.plan).toUpperCase() as PlanTier
      } else if (data.plan === 'trial' && data.planTier) {
        tier = data.planTier
      }

      subscriptionId = data.subscriptionId || data.stripeSubscriptionId || null
      subscriptionStatus = data.status || data.subscriptionStatus || data.planStatus || null

      if (data.interval) {
        interval = data.interval
      } else if (data.billingInterval) {
        interval = data.billingInterval === 'MONTHLY' ? 'month' : 'year'
      }

      const stripeCustomerId: string | null =
        data.stripeCustomerId || data.stripe_customer_id || data.customerId || data.customer_id || null

      const stripeSubscriptionId: string | null =
        data.stripeSubscriptionId || data.stripe_subscription_id || subscriptionId || null

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
        cancelAtPeriodEnd: data.cancelAtPeriodEnd || false,
        currentPeriodEnd: data.currentPeriodEnd || null,
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

        const isDone =
          Boolean(result) &&
          result!.tier !== 'NONE' &&
          (statusLower === 'active' || statusLower === 'trialing' || statusLower === 'trial')

        if (isDone) return

        if (statusLower === 'canceled' || statusLower === 'incomplete_expired') {
          setError('Your Stripe subscription did not activate (canceled/expired). Please try again.')
          return
        }

        if (syncAttemptsRef.current >= 15) {
          setError(
            'Payment succeeded, but your subscription is still syncing. Please refresh in a minute—if it still doesn’t update, your Stripe webhook is likely not updating the database.'
          )
          return
        }

        syncTimerRef.current = setTimeout(tick, 2000)
      }

      console.log('🔄 Starting plan sync polling:', source)
      await tick()
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
        return 'Upgrade Now'
      case 'downgrade':
        return 'Downgrade'
      default:
        return 'Select Plan'
    }
  }

  async function handlePlanAction(tier: PricingTier) {
    const changeType = getChangeType(tier)

    if (status === 'unauthenticated') {
      sessionStorage.setItem(
        'pendingPlanSelection',
        JSON.stringify({
          tierId: tier.id,
          interval: billingInterval,
        })
      )
      router.push('/login?callbackUrl=/pricing')
      return
    }

    if (changeType === 'current') return

    if (changeType === 'interval-change') {
      setShowChangeWarning({
        tier,
        type: 'interval-change',
        message: `Switch from ${subscription.interval || 'month'}ly to ${billingInterval} billing?`,
      })
      return
    }

    if (changeType === 'new' || changeType === 'downgrade') {
      setShowChangeWarning({ tier, type: changeType })
    } else if (changeType === 'upgrade') {
      await executePlanChange(tier, 'upgrade')
    }
  }

  async function executePlanChange(
    tier: PricingTier,
    changeType: 'upgrade' | 'downgrade' | 'new' | 'interval-change'
  ) {
    setShowChangeWarning(null)
    setLoading(tier.id)
    setError(null)
    setSuccess(null)

    try {
      if (changeType === 'downgrade') {
        const res = await fetch('/api/billing/schedule-downgrade', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newTier: tier.id }),
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to schedule downgrade')
        }

        setSuccess(`Your plan will downgrade to ${tier.name} at the end of your current billing period.`)
        await loadPlan()
      } else {
        const res = await fetch('/api/stripe/create-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tier: tier.id,
            interval: billingInterval,
            successUrl: `${window.location.origin}/pricing?success=true`,
            cancelUrl: `${window.location.origin}/pricing`,
          }),
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to create checkout session')
        }

        const { url } = await res.json()
        if (url) window.location.href = url
        else throw new Error('No checkout URL received')
      }
    } catch (err: any) {
      console.error('Plan change error:', err)
      setError(err?.message || 'Failed to change plan. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  async function openStripePortal() {
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to open billing portal')
      }

      const { url } = await res.json()
      if (url) window.open(url, '_blank', 'noopener,noreferrer')
      else throw new Error('No portal URL received')
    } catch (err: any) {
      console.error('Stripe portal error:', err)
      setError(err?.message || 'Failed to open billing portal. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function cancelSubscriptionAtPeriodEnd() {
    const subId = subscription.subscriptionId || subscription.stripeSubscriptionId
    if (!subId) return

    setShowCancelWarning(false)
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch('/api/stripe/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ atPeriodEnd: true }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to cancel subscription')
      }

      setSuccess('Subscription cancelled. You will keep access until the end of your billing period.')
      await loadPlan()
    } catch (err: any) {
      console.error('Cancel subscription error:', err)
      setError(err?.message || 'Failed to cancel subscription. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const tierCardStyles = (tier: PricingTier) => {
    const isCurrent = subscription.tier === tier.id
    const isHighlighted = tier.highlight
    const base =
      'relative rounded-3xl border bg-white/70 backdrop-blur-xl p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl'

    if (isCurrent) return `${base} border-orange-500 shadow-[0_0_60px_rgba(249,115,22,0.25)]`
    if (isHighlighted) return `${base} ${tier.border} ${tier.glow}`
    return `${base} border-gray-200/70 hover:border-gray-300/80`
  }

  const priceLabel = (tier: PricingTier) => {
    const price = billingInterval === 'annual' ? tier.annualPrice : tier.monthlyPrice
    const period = billingInterval === 'annual' ? 'year' : 'month'
    return { price, period }
  }

  const showInCardBillingActions = status === 'authenticated' && subscription.hasSubscription

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
              Pricing
              <span className="ml-3 inline-flex items-center rounded-full bg-orange-100 px-3 py-1 text-sm font-semibold text-orange-700">
                7-Day Free Trial
              </span>
            </h1>
            <p className="mt-3 max-w-2xl text-slate-600">
              Choose a plan that fits your contracting workflow. Upgrade, downgrade, or cancel anytime.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center rounded-2xl border border-slate-200 bg-white px-2 py-2 shadow-sm">
              <button
                onClick={() => setBillingInterval('monthly')}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  billingInterval === 'monthly'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingInterval('annual')}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  billingInterval === 'annual' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Annual
              </button>
            </div>

            <Link
              href="/account"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Manage Account <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-800">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5" />
              <div>
                <p className="font-semibold">Something went wrong</p>
                <p className="mt-1 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-900">
            <div className="flex items-start gap-3">
              <Gift className="mt-0.5 h-5 w-5" />
              <div>
                <p className="font-semibold">Status</p>
                <p className="mt-1 text-sm">{success}</p>
              </div>
            </div>
          </div>
        )}

        {/* Pricing cards */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {TIERS.map((tier) => {
            const { price, period } = priceLabel(tier)
            const isCurrent = subscription.tier === tier.id

            return (
              <div key={tier.id} className={tierCardStyles(tier)}>
                {tier.highlight && (
                  <div className="absolute -top-3 right-6 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-1 text-xs font-bold text-white shadow">
                    Most Popular
                  </div>
                )}

                {isCurrent && (
                  <div className="absolute -top-3 right-6 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-1 text-xs font-bold text-white shadow">
                    Current Plan
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <div className={`rounded-2xl bg-gradient-to-r ${tier.gradient} p-3 text-white shadow`}>
                    <tier.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{tier.name}</h3>
                    <p className="text-sm font-semibold text-slate-600">{tier.tagline}</p>
                  </div>
                </div>

                <p className="mt-4 text-sm text-slate-600">{tier.description}</p>

                <div className="mt-6 flex items-end gap-2">
                  <div className="text-4xl font-extrabold text-slate-900">${formatPrice(price)}</div>
                  <div className="pb-1 text-sm font-semibold text-slate-500">/ {period}</div>
                </div>

                {billingInterval === 'annual' && (
                  <p className="mt-2 text-xs font-semibold text-emerald-700">Save ~2 months vs monthly</p>
                )}

                {/* Main plan button */}
                <div className="mt-6">
                  <button
                    onClick={() => handlePlanAction(tier)}
                    disabled={loading === tier.id || isCurrent}
                    className={`w-full rounded-2xl px-4 py-3 text-sm font-bold shadow-sm transition ${
                      isCurrent
                        ? 'cursor-default bg-slate-200 text-slate-600'
                        : `bg-gradient-to-r ${tier.gradient} text-white hover:opacity-95`
                    }`}
                  >
                    {loading === tier.id ? (
                      <span className="inline-flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing…
                      </span>
                    ) : (
                      getButtonText(tier)
                    )}
                  </button>
                </div>

                {/* ✅ In-card actions for CURRENT PLAN */}
                {isCurrent && showInCardBillingActions && (
                  <div className="mt-3 grid grid-cols-1 gap-2">
                    <button
                      onClick={openStripePortal}
                      disabled={saving}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
                    >
                      <CreditCard className="h-4 w-4" />
                      Manage Billing
                    </button>

                    {!subscription.cancelAtPeriodEnd ? (
                      <button
                        onClick={() => setShowCancelWarning(true)}
                        disabled={saving}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 hover:bg-red-100 disabled:opacity-60"
                      >
                        <XCircle className="h-4 w-4" />
                        Cancel Subscription
                      </button>
                    ) : (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                        Cancellation scheduled (ends at period close).
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-6">
                  <p className="text-sm font-semibold text-slate-800">Best for</p>
                  <p className="mt-1 text-sm text-slate-600">{tier.bestFor}</p>
                </div>

                <div className="mt-6">
                  <p className="text-sm font-semibold text-slate-800">Includes</p>
                  <ul className="mt-3 space-y-2 text-sm text-slate-700">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 text-emerald-600" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )
          })}
        </div>

        {/* Confirmation modal */}
        {showChangeWarning && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
              <h3 className="text-lg font-extrabold text-slate-900">Confirm change</h3>
              <p className="mt-2 text-sm text-slate-600">
                {showChangeWarning.message ||
                  `Are you sure you want to ${showChangeWarning.type} to ${showChangeWarning.tier.name}?`}
              </p>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowChangeWarning(null)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  onClick={() => executePlanChange(showChangeWarning.tier, showChangeWarning.type)}
                  className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cancel modal */}
        {showCancelWarning && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
              <h3 className="text-lg font-extrabold text-slate-900">Cancel subscription</h3>
              <p className="mt-2 text-sm text-slate-600">
                Are you sure? You’ll keep access until the end of your current billing period.
              </p>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowCancelWarning(false)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Keep Subscription
                </button>

                <button
                  onClick={cancelSubscriptionAtPeriodEnd}
                  disabled={saving}
                  className="rounded-2xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {saving ? 'Cancelling…' : 'Confirm Cancel'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-slate-500">
          Need help?{' '}
          <Link href="/account" className="font-semibold text-slate-800 hover:underline">
            Visit your account page
          </Link>{' '}
          to manage billing or contact support.
        </div>
      </div>
    </div>
  )
}
