'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  User,
  CreditCard,
  Shield,
  MapPin,
  Building2,
  Phone,
  Mail,
  Calendar,
  Check,
  AlertCircle,
  ExternalLink,
  TrendingUp,
  Zap,
  Key,
  Loader2,
  Download,
  FileText,
  ArrowUpRight,
  BarChart3,
  Clock,
  DollarSign,
  Package,
  Settings,
  Bell,
  Crown,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  Sparkles,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

// Types
type PlanTier = 'NONE' | 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE'
type BillingInterval = 'monthly' | 'annual'

type Plan = {
  tier: PlanTier
  status: string
  interval: 'month' | 'year' | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  subscriptionId: string | null
}

type ProfileData = {
  email: string
  firstName: string
  lastName: string
  phone: string
  company: string
  title: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  postalCode: string
  country: string
}

type Usage = {
  searches: number
  exports: number
  savedOpportunities: number
  alerts: number
  available: boolean
  limits?: {
    searches: number
    exports: number
    savedOpportunities: number
  }
}

type Invoice = {
  id: string
  date: string
  amount: number
  status: string
  invoicePdf: string
}

// Match EXACTLY with PricingClient - FIXED PRICES TO MATCH PRICING PAGE
const PLAN_FEATURES = {
  BASIC: {
    id: 'BASIC' as PlanTier,
    name: 'Basic',
    tagline: 'Get Started',
    highlight: false,
    description: 'Essential tools for solo contractors',
    monthlyPrice: 24.99, // FIXED: Match pricing page ($24.99)
    annualPrice: 240, // FIXED: Match pricing page ($240)
    stripeMonthlyPriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_BASIC_MONTHLY || 'price_1SrX4iPBeHrQUcEBcCNR77ti',
    stripeAnnualPriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_BASIC_ANNUAL || 'price_1SrX5JPBeHrQUcEBp36HLtHq',
    icon: Shield,
    iconColor: 'blue',
    gradient: 'from-blue-500 to-cyan-500',
    color: 'from-blue-500 to-cyan-500',
    bestFor: 'Solo contractors & consultants starting their GovCon journey',
    features: [
      '500 searches per month',
      '10 exports per month',
      '5 saved opportunities',
      'Email alerts',
      'Basic support',
    ],
    limits: {
      searches: 500,
      exports: 10,
      savedOpportunities: 5,
    },
  },
  PROFESSIONAL: {
    id: 'PROFESSIONAL' as PlanTier,
    name: 'Professional',
    tagline: 'Most Popular',
    description: 'Advanced features for growing teams',
    highlight: true,
    monthlyPrice: 49, // FIXED: Match pricing page ($49)
    annualPrice: 490, // FIXED: Match pricing page ($490)
    stripeMonthlyPriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PROFESSIONAL_MONTHLY || 'price_1SpKkkPBeHrQUcEBikiRqBhP',
    stripeAnnualPriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PROFESSIONAL_ANNUAL || 'price_1SpKu0PBeHrQUcEBLqvi496k',
    icon: TrendingUp,
    iconColor: 'emerald',
    gradient: 'from-emerald-500 to-teal-500',
    color: 'from-emerald-500 to-teal-500', // FIXED: Made consistent
    bestFor: 'Growing businesses & small teams winning multiple contracts',
    features: [
      '5,000 searches per month',
      '100 exports per month',
      '50 saved opportunities',
      'Real-time alerts',
      'Priority support',
      'API access',
    ],
    limits: {
      searches: 5000,
      exports: 100,
      savedOpportunities: 50,
    },
  },
  ENTERPRISE: {
    id: 'ENTERPRISE' as PlanTier,
    name: 'Enterprise',
    tagline: 'Full Power',
    description: 'Complete solution for prime contractors',
    highlight: false,
    monthlyPrice: 199, // FIXED: Match pricing page ($199)
    annualPrice: 1990, // FIXED: Match pricing page ($1,990)
    stripeMonthlyPriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_MONTHLY || 'price_1SpKx6PBeHrQUcEB8KezJ9dx',
    stripeAnnualPriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE_ANNUAL || 'price_1SpKxuPBeHrQUcEB9Ytzoo2N',
    icon: Crown,
    iconColor: 'amber',
    gradient: 'from-amber-500 to-orange-500',
    color: 'from-amber-500 to-orange-500',
    bestFor: 'Large contractors & primes managing complex pursuit strategies',
    features: [
      'Unlimited searches',
      'Unlimited exports',
      'Unlimited saved opportunities',
      'Dedicated account manager',
      'Custom integrations',
      'Phone support',
    ],
    limits: {
      searches: -1,
      exports: -1,
      savedOpportunities: -1,
    },
  },
} as const

type TabType = 'overview' | 'subscription' | 'billing' | 'profile' | 'usage'

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      }
    >
      <AccountPageContent />
    </Suspense>
  )
}

function AccountPageContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly')
  const [profileLoading, setProfileLoading] = useState(true)
  const [planLoading, setPlanLoading] = useState(true)
  const [usageLoading, setUsageLoading] = useState(true)
  const [invoicesLoading, setInvoicesLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loadingPlanChange, setLoadingPlanChange] = useState<PlanTier | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [plan, setPlan] = useState<Plan | null>(null)
  const [profile, setProfile] = useState<ProfileData>({
    email: session?.user?.email || '',
    firstName: '',
    lastName: '',
    phone: '',
    company: '',
    title: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'USA',
  })
  const [usage, setUsage] = useState<Usage | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [editMode, setEditMode] = useState<string | null>(null)

  // Load data
  useEffect(() => {
    if (status === 'authenticated') {
      loadProfile()
      loadPlan()
      loadUsage()
    } else if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/account')
    }
  }, [status, router])

  // Handle success message from checkout
  useEffect(() => {
    const successParam = searchParams?.get('success')
    if (successParam === 'true') {
      setMessage({
        type: 'success',
        text: 'Subscription updated successfully! Your changes are now active.',
      })
      loadPlan()
      // Clear the URL parameter
      const newUrl = window.location.pathname
      window.history.replaceState({}, '', newUrl)
      setTimeout(() => setMessage(null), 5000)
    }
  }, [searchParams])

  useEffect(() => {
    if (activeTab === 'billing' && status === 'authenticated' && invoices.length === 0) {
      loadInvoices()
    }
  }, [activeTab, status])

  const loadProfile = async () => {
    try {
      setProfileLoading(true)
      const res = await fetch('/api/account/profile')
      if (res.ok) {
        const data = await res.json()
        // ✅ FIXED: Convert null values to empty strings for React inputs
        setProfile((prev) => ({
          ...prev,
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          phone: data.phone || '',
          company: data.company || '',
          title: data.title || '',
          addressLine1: data.addressLine1 || '',
          addressLine2: data.addressLine2 || '',
          city: data.city || '',
          state: data.state || '',
          postalCode: data.postalCode || '',
          country: data.country || 'USA',
        }))
      }
    } catch (error) {
      console.error('Failed to load profile', error)
    } finally {
      setProfileLoading(false)
    }
  }

  const loadPlan = async () => {
    try {
      setPlanLoading(true)
      const res = await fetch('/api/account/plan')
      console.log('Plan API Response status:', res.status)

      if (res.ok) {
        const data = await res.json()
        console.log('Account page plan data loaded (RAW):', data)

        // Extract data with better error handling
        const tier =
          data.tier ||
          data.planTier ||
          (data.plan && data.plan !== 'trial' && data.plan !== 'none' ? data.plan.toUpperCase() : 'NONE')
        const interval =
          data.interval ||
          (data.billingInterval === 'MONTHLY'
            ? 'month'
            : data.billingInterval === 'ANNUAL'
            ? 'year'
            : null)
        const status = data.status || data.subscriptionStatus || data.planStatus || 'inactive'

        console.log('Extracted values:', { tier, interval, status })

        // Set billing interval based on plan
        if (interval) {
          setBillingInterval(interval === 'year' ? 'annual' : 'monthly')
        }

        // Set the plan state
        setPlan({
          tier: tier as PlanTier,
          status: status,
          interval: interval,
          currentPeriodEnd: data.currentPeriodEnd,
          cancelAtPeriodEnd: data.cancelAtPeriodEnd || false,
          subscriptionId: data.subscriptionId || data.stripeSubscriptionId,
        })
      } else {
        const errorText = await res.text()
        console.error('Failed to load plan', 'status:', res.status, 'Error:', errorText)
      }
    } catch (error) {
      console.error('Failed to load plan', error)
    } finally {
      setPlanLoading(false)
    }
  }

  const loadUsage = async () => {
    try {
      setUsageLoading(true)
      const res = await fetch('/api/account/usage')
      if (res.ok) {
        const data = await res.json()
        if (plan && plan.tier !== 'NONE' && data.limits) {
          data.limits = PLAN_FEATURES[plan.tier]?.limits
        }
        setUsage(data)
      }
    } catch (error) {
      console.error('Failed to load usage', error)
    } finally {
      setUsageLoading(false)
    }
  }

  const loadInvoices = async () => {
    try {
      setInvoicesLoading(true)
      const res = await fetch('/api/stripe/invoices')
      if (res.ok) {
        const data = await res.json()
        setInvoices(data.invoices)
      }
    } catch (error) {
      console.error('Failed to load invoices', error)
    } finally {
      setInvoicesLoading(false)
    }
  }

  // FIXED: handlePlanChange - NOW REQUIRES STRIPE CHECKOUT FOR PLAN CHANGES
  const handlePlanChange = async (newTier: PlanTier) => {
    if (!plan || !session) return

    const isCurrentPlan = plan.tier === newTier && plan.interval === (billingInterval === 'annual' ? 'year' : 'month')

    if (isCurrentPlan) {
      setMessage({ type: 'error', text: 'This is already your current plan' })
      setTimeout(() => setMessage(null), 3000)
      return
    }

    try {
      setLoadingPlanChange(newTier)
      setMessage(null)

      // ONLY allow interval changes without checkout (same tier, different billing)
      if (plan.tier === newTier && plan.tier !== 'NONE') {
        console.log('Interval change detected for tier:', newTier, billingInterval)
        const res = await fetch('/api/stripe/change-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tier: newTier,
            interval: billingInterval,
          }),
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to change billing interval')
        }

        const updateData = await res.json()
        setMessage({
          type: 'success',
          text: updateData.message || `Billing interval changed to ${billingInterval}!`,
        })

        // Force refresh plan data from Stripe
        await loadPlan()
        await loadUsage()
        setTimeout(() => setMessage(null), 5000)
      } else {
        // ALL OTHER CASES: Upgrades, downgrades, new subscriptions - MUST use Stripe Checkout
        console.log('Creating checkout for plan change:', newTier, billingInterval)
        const res = await fetch('/api/stripe/create-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tier: newTier,
            interval: billingInterval,
            successUrl: `${window.location.origin}/account?success=true`,
            cancelUrl: `${window.location.origin}/account`,
          }),
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to create checkout session')
        }

        const { url } = await res.json()
        if (url) {
          window.location.href = url
        } else {
          throw new Error('No checkout URL received')
        }
      }
    } catch (error: any) {
      console.error('Plan change error:', error)
      setMessage({
        type: 'error',
        text: error.message || 'Failed to change plan. Please try again.',
      })
      setTimeout(() => setMessage(null), 5000)
    } finally {
      setLoadingPlanChange(null)
    }
  }

  const handleCancelSubscription = async () => {
    if (!plan?.subscriptionId) return

    if (
      !confirm(
        'Are you sure you want to cancel your subscription? You will have access until the end of your billing period.'
      )
    )
      return

    try {
      setSaving(true)
      setMessage(null)

      const res = await fetch('/api/stripe/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId: plan.subscriptionId }),
      })

      if (res.ok) {
        setMessage({
          type: 'success',
          text: 'Subscription cancelled. You will have access until the end of your billing period.',
        })
        // Reload plan data
        await loadPlan()
        setTimeout(() => setMessage(null), 5000)
      } else {
        const data = await res.json()
        throw new Error(data.error || 'Failed to cancel subscription')
      }
    } catch (error: any) {
      console.error('Cancel subscription error:', error)
      setMessage({
        type: 'error',
        text: error.message || 'Failed to cancel subscription. Please try again.',
      })
    } finally {
      setSaving(false)
    }
  }

  const openStripePortal = async () => {
    try {
      setSaving(true)
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (res.ok) {
        const { url } = await res.json()
        window.open(url, '_blank', 'noopener,noreferrer')
      } else {
        const data = await res.json()
        throw new Error(data.error || 'Failed to open billing portal')
      }
    } catch (error: any) {
      console.error('Stripe portal error:', error)
      setMessage({
        type: 'error',
        text: error.message || 'Failed to open billing portal. Please try again.',
      })
    } finally {
      setSaving(false)
    }
  }

  const saveProfile = async () => {
    try {
      setSaving(true)
      setMessage(null)

      const res = await fetch('/api/account/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstname: profile.firstName,
          lastname: profile.lastName,
          phone: profile.phone,
          company: profile.company,
          title: profile.title,
          addressline1: profile.addressLine1,
          addressline2: profile.addressLine2,
          city: profile.city,
          state: profile.state,
          zip: profile.postalCode,
          country: profile.country,
        }),
      })

      if (res.ok) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' })
        setEditMode(null)
        setTimeout(() => setMessage(null), 3000)
      } else {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to update profile')
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to update profile.',
      })
    } finally {
      setSaving(false)
    }
  }

  const getUsagePercentage = (current: number, limit: number) => {
    if (limit === -1) return 0
    return Math.min((current / limit) * 100, 100)
  }

  const getButtonText = (tier: PlanTier) => {
    if (!plan) return 'Get Started'

    const selectedInterval = billingInterval === 'annual' ? 'year' : 'month'

    // Same plan, same interval
    if (plan.tier === tier && plan.interval === selectedInterval) {
      return 'Current Plan'
    }

    // Explicitly narrow BOTH sides to paid tiers
    if (plan.tier && plan.tier !== 'NONE' && tier !== 'NONE') {
      const currentPrice =
        plan.interval === 'year'
          ? PLAN_FEATURES[plan.tier].annualPrice
          : PLAN_FEATURES[plan.tier].monthlyPrice
      const newPrice =
        selectedInterval === 'year' ? PLAN_FEATURES[tier].annualPrice : PLAN_FEATURES[tier].monthlyPrice

      if (newPrice > currentPrice) return 'Upgrade'
      if (newPrice < currentPrice) return 'Downgrade'
      return 'Switch Billing'
    }

    return 'Subscribe'
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-slate-400">Loading your account...</p>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'subscription', label: 'Subscription', icon: Package },
    { id: 'billing', label: 'Billing', icon: FileText },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'usage', label: 'Usage', icon: TrendingUp },
  ] as const

  const currentPlanDetails = plan?.tier !== 'NONE' ? PLAN_FEATURES[plan?.tier as keyof typeof PLAN_FEATURES] : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-50">
      {/* Background effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-cyan-500/5 pointer-events-none" />
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">Account Management</h1>
          <p className="text-slate-400">Complete control over your subscription, billing, and profile</p>
        </div>

        {/* Message Banner */}
        {message && (
          <div
            className={`mb-6 rounded-xl border p-4 ${
              message.type === 'success'
                ? 'border-green-500/30 bg-green-500/10 text-green-300'
                : 'border-red-500/30 bg-red-500/10 text-red-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {message.type === 'success' ? <Check className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
              <span className="font-medium">{message.text}</span>
            </div>
          </div>
        )}

        {/* Tabs Navigation */}
        <div className="mb-6 border-b border-slate-700">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 font-medium transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'text-white border-b-2 border-blue-500'
                      : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <OverviewTab
              plan={plan}
              planLoading={planLoading}
              usage={usage}
              usageLoading={usageLoading}
              profile={profile}
              planDetails={currentPlanDetails}
              router={router}
              openStripePortal={openStripePortal}
              loadPlan={loadPlan}
            />
          )}
          {activeTab === 'subscription' && (
            <SubscriptionTab
              plan={plan}
              planLoading={planLoading}
              billingInterval={billingInterval}
              setBillingInterval={setBillingInterval}
              currentPlanDetails={currentPlanDetails}
              handlePlanChange={handlePlanChange}
              handleCancelSubscription={handleCancelSubscription}
              openStripePortal={openStripePortal}
              loadingPlanChange={loadingPlanChange}
              saving={saving}
              getButtonText={getButtonText}
              router={router}
              loadPlan={loadPlan}
            />
          )}
          {activeTab === 'billing' && (
            <BillingTab
              invoices={invoices}
              invoicesLoading={invoicesLoading}
              plan={plan}
              openStripePortal={openStripePortal}
              saving={saving}
              formatCurrency={formatCurrency}
            />
          )}
          {activeTab === 'profile' && (
            <ProfileTab
              profile={profile}
              setProfile={setProfile}
              profileLoading={profileLoading}
              editMode={editMode}
              setEditMode={setEditMode}
              saveProfile={saveProfile}
              saving={saving}
              router={router}
            />
          )}
          {activeTab === 'usage' && (
            <UsageTab
              usage={usage}
              usageLoading={usageLoading}
              plan={plan}
              currentPlanDetails={currentPlanDetails}
              getUsagePercentage={getUsagePercentage}
              formatCurrency={formatCurrency}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// Overview Tab Component
function OverviewTab({
  plan,
  planLoading,
  usage,
  usageLoading,
  profile,
  planDetails,
  router,
  openStripePortal,
  loadPlan,
}: any) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Current Plan Card - Matching Pricing Page Style */}
      <div className="rounded-2xl border border-slate-700/60 bg-slate-950/40 backdrop-blur p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Current Plan</h2>
          {!planLoading && plan && plan.tier !== 'NONE' && (
            <div className="flex gap-2">
              <button
                onClick={loadPlan}
                className="flex items-center gap-1 text-sm font-medium text-slate-300 hover:text-white transition"
              >
                <RefreshCw className="h-3 w-3" />
                Refresh
              </button>
              <button
                onClick={() => router.push('/pricing')}
                className="text-sm font-medium text-blue-400 hover:text-blue-300 transition flex items-center gap-1"
              >
                Compare Plans
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {planLoading ? (
          <div className="space-y-4">
            <div className="h-24 bg-slate-800/50 rounded-xl animate-pulse" />
            <div className="h-10 bg-slate-800/50 rounded-lg animate-pulse" />
          </div>
        ) : planDetails ? (
          <div className="space-y-4">
            <div className={`rounded-xl bg-gradient-to-br ${planDetails.gradient} p-6`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <planDetails.icon className="h-8 w-8 text-white" />
                  <span className="text-2xl font-bold text-white">{planDetails.name}</span>
                </div>
                <span className="text-sm text-white/80 capitalize bg-white/20 px-3 py-1 rounded-full">
                  {plan.interval === 'year' ? 'Annual' : 'Monthly'}
                </span>
              </div>
              <div className="text-4xl font-extrabold text-white">
                ${plan.interval === 'year' ? planDetails.annualPrice : planDetails.monthlyPrice}
                <span className="text-lg font-normal text-white/80">/{plan.interval === 'year' ? 'year' : 'month'}</span>
              </div>
              {plan.interval === 'year' && planDetails.monthlyPrice > 0 && (
                <p className="text-sm text-white/80 mt-2">
                  Save ${(planDetails.monthlyPrice * 12 - planDetails.annualPrice).toFixed(0)}/year
                </p>
              )}
            </div>

            {plan.currentPeriodEnd && (
              <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50">
                <div>
                  <span className="text-slate-400">Next Billing Date</span>
                  <p className="font-semibold text-white">
                    {new Date(plan.currentPeriodEnd).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-slate-400">Next Charge</span>
                  <p className="font-semibold text-white">
                    ${plan.interval === 'year' ? planDetails.annualPrice : planDetails.monthlyPrice}
                  </p>
                </div>
              </div>
            )}

            {plan.cancelAtPeriodEnd && (
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                <p className="text-sm text-red-300 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Subscription will cancel on {new Date(plan.currentPeriodEnd).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <Package className="h-16 w-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 mb-4">No active subscription</p>
            <button
              onClick={() => router.push('/pricing')}
              className="px-6 py-3 rounded-lg bg-blue-500 hover:bg-blue-600 transition text-white font-medium"
            >
              View Plans
            </button>
          </div>
        )}
      </div>

      {/* Quick Usage Summary */}
      <div className="rounded-2xl border border-slate-700/60 bg-slate-950/40 backdrop-blur p-6 shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-6">Usage Summary</h2>

        {usageLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-slate-800/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : usage && usage.available ? (
          <div className="space-y-4">
            {[
              { label: 'Searches', value: usage.searches, limit: planDetails?.limits.searches || 0, icon: TrendingUp },
              { label: 'Exports', value: usage.exports, limit: planDetails?.limits.exports || 0, icon: Download },
              {
                label: 'Saved Opportunities',
                value: usage.savedOpportunities,
                limit: planDetails?.limits.savedOpportunities || 0,
                icon: FileText,
              },
            ].map((item) => (
              <div key={item.label} className="p-4 rounded-lg bg-slate-800/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <item.icon className="h-4 w-4 text-slate-400" />
                    <span className="text-slate-400">{item.label}</span>
                  </div>
                  <span className="font-bold text-white">
                    {item.value.toLocaleString()}
                    {item.limit !== -1 && <span className="text-slate-500"> / {item.limit.toLocaleString()}</span>}
                  </span>
                </div>
                {item.limit !== -1 && (
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        (item.value / item.limit) * 100 > 90 ? 'bg-red-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${Math.min((item.value / item.limit) * 100, 100)}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400">
            <BarChart3 className="h-16 w-16 mx-auto mb-4 text-slate-600" />
            <p>Usage data unavailable</p>
          </div>
        )}
      </div>

      {/* Account Info Card */}
      <div className="rounded-2xl border border-slate-700/60 bg-slate-950/40 backdrop-blur p-6 shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-6">Account Information</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <User className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="font-semibold text-white">
                {profile.firstName} {profile.lastName}
              </p>
              <p className="text-sm text-slate-400">{profile.email}</p>
            </div>
          </div>

          {profile.company && (
            <div className="pt-4 border-t border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-4 w-4 text-slate-400" />
                <span className="text-slate-400">Company</span>
              </div>
              <p className="text-white font-medium">{profile.company}</p>
              {profile.title && <p className="text-sm text-slate-400">{profile.title}</p>}
            </div>
          )}

          {profile.phone && (
            <div className="pt-4 border-t border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <Phone className="h-4 w-4 text-slate-400" />
                <span className="text-slate-400">Phone</span>
              </div>
              <p className="text-white">{profile.phone}</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-2xl border border-slate-700/60 bg-slate-950/40 backdrop-blur p-6 shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-6">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => router.push('/pricing')}
            className="flex flex-col items-center gap-2 p-4 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition"
          >
            <ArrowUpRight className="h-6 w-6 text-blue-400" />
            <span className="text-sm font-medium text-white">Upgrade Plan</span>
          </button>
          <button
            onClick={() => router.push('/account?password')}
            className="flex flex-col items-center gap-2 p-4 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition"
          >
            <Key className="h-6 w-6 text-purple-400" />
            <span className="text-sm font-medium text-white">Change Password</span>
          </button>
          <button
            onClick={openStripePortal}
            className="flex flex-col items-center gap-2 p-4 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition"
          >
            <CreditCard className="h-6 w-6 text-green-400" />
            <span className="text-sm font-medium text-white">Payment Methods</span>
          </button>
          <button
            onClick={() => window.open('https://support.precisegovcon.com', '_blank')}
            className="flex flex-col items-center gap-2 p-4 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition"
          >
            <AlertCircle className="h-6 w-6 text-amber-400" />
            <span className="text-sm font-medium text-white">Get Support</span>
          </button>
        </div>
      </div>
    </div>
  )
}

// Subscription Tab Component - Updated with Stripe Integration
function SubscriptionTab({
  plan,
  planLoading,
  billingInterval,
  setBillingInterval,
  currentPlanDetails,
  handlePlanChange,
  handleCancelSubscription,
  openStripePortal,
  loadingPlanChange,
  saving,
  getButtonText,
  router,
  loadPlan,
}: any) {
  const isAnnual = billingInterval === 'annual'

  return (
    <div className="space-y-8">
      {/* Current Subscription Details */}
      <div className="rounded-2xl border border-slate-700/60 bg-slate-950/40 backdrop-blur p-8 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
          <h2 className="text-2xl font-bold text-white">Your Subscription</h2>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Billing Toggle */}
            <div className="inline-flex items-center gap-2 p-1 bg-slate-800/60 rounded-xl border border-slate-700">
              <button
                onClick={() => setBillingInterval('monthly')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  billingInterval === 'monthly'
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingInterval('annual')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  billingInterval === 'annual'
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Annual
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-emerald-500 text-white rounded-full">Save 17%</span>
              </button>
            </div>
          </div>
        </div>

        {planLoading ? (
          <div className="space-y-4">
            <div className="h-32 bg-slate-800/50 rounded-xl animate-pulse" />
          </div>
        ) : currentPlanDetails ? (
          <div className="space-y-8">
            {/* Current Plan Card */}
            <div className={`rounded-xl bg-gradient-to-br ${currentPlanDetails.gradient} p-8`}>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-white/20 flex items-center justify-center">
                      <currentPlanDetails.icon className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-3xl font-bold text-white">{currentPlanDetails.name} Plan</h3>
                        <span className="px-3 py-1 bg-white/20 rounded-full text-white text-sm font-medium capitalize">
                          {String(plan.status || 'active')}
                        </span>

                      </div>
                      <p className="text-white/80">
                        ${plan.interval === 'year' ? currentPlanDetails.annualPrice : currentPlanDetails.monthlyPrice}/
                        {plan.interval === 'year' ? 'year' : 'month'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-white/80 mb-2">Current Billing Cycle</p>
                  <p className="text-2xl font-bold text-white capitalize">
                    {plan.interval === 'year' ? 'Annual' : 'Monthly'}
                  </p>
                </div>
              </div>
            </div>

            {/* Billing Information */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="p-4 rounded-lg bg-slate-800/30">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-400">Next Billing Date</span>
                </div>
                <p className="text-xl font-semibold text-white">
                  {plan.currentPeriodEnd
                    ? new Date(plan.currentPeriodEnd).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'N/A'}
                </p>
              </div>

              <div className="p-4 rounded-lg bg-slate-800/30">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-400">Next Charge</span>
                </div>
                <p className="text-xl font-semibold text-white">
                  ${plan.interval === 'year' ? currentPlanDetails.annualPrice : currentPlanDetails.monthlyPrice}
                </p>
                <p className="text-sm text-slate-400 mt-1">{plan.interval === 'year' ? 'Annual billing' : 'Monthly billing'}</p>
              </div>

              <div className="p-4 rounded-lg bg-slate-800/30">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-400">Status</span>
                </div>
                <p className="text-xl font-semibold text-white flex items-center gap-2">
                  {plan.cancelAtPeriodEnd ? (
                    <>
                      <span className="text-amber-400">Cancelling</span>
                      <span className="text-sm text-slate-400">
                        (ends {plan.currentPeriodEnd ? new Date(plan.currentPeriodEnd).toLocaleDateString() : 'soon'})
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-green-400">Active</span>
                      <Check className="h-5 w-5 text-green-400" />
                    </>
                  )}
                </p>
              </div>

              <div className="p-4 rounded-lg bg-slate-800/30">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <span className="text-slate-400">Subscription ID</span>
                </div>
                <p className="text-sm font-mono text-slate-300 truncate">{plan.subscriptionId || 'No active subscription'}</p>
              </div>
            </div>

            {/* Features */}
            <div className="pt-6 border-t border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4">Your Plan Includes</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {currentPlanDetails.features.map((feature: string, index: number) => (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/30">
                    <Check className="h-5 w-5 text-green-400 flex-shrink-0" />
                    <span className="text-slate-300">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-6 border-t border-slate-700 space-y-4">
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={loadPlan}
                  className="flex items-center gap-2 px-4 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 transition text-white text-sm font-medium"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh from Stripe
                </button>

                <button
                  onClick={openStripePortal}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-slate-600 bg-slate-800/50 hover:bg-slate-800 transition text-white font-medium"
                >
                  <CreditCard className="h-5 w-5" />
                  Manage Payment Methods
                  <ExternalLink className="h-4 w-4" />
                </button>

                {!plan.cancelAtPeriodEnd && plan.subscriptionId && (
                  <button
                    onClick={handleCancelSubscription}
                    disabled={saving}
                    className="flex-1 px-6 py-3 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 transition text-red-300 font-medium"
                  >
                    Cancel Subscription
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <Package className="h-20 w-20 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Active Subscription</h3>
            <p className="text-slate-400 mb-6">Subscribe to unlock all features and start finding government contracts</p>
            <button
              onClick={() => router.push('/pricing')}
              className="px-8 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 transition text-white font-medium"
            >
              View Plans & Pricing
            </button>
          </div>
        )}
      </div>

      {/* Plan Comparison - Matching Pricing Page */}
      <div className="rounded-2xl border border-slate-700/60 bg-slate-950/40 backdrop-blur p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white">Compare Plans</h2>
            <p className="text-slate-400 mt-1">Choose the plan that fits your needs</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-400">
              Billing: <span className="text-white font-medium capitalize">{billingInterval}</span>
            </p>
            {isAnnual && <p className="text-sm text-emerald-400">Save 17% with annual billing</p>}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {Object.entries(PLAN_FEATURES).map(([key, planData]) => {
            const Icon = planData.icon
            const isCurrentPlan = plan?.tier === key
            const price = isAnnual ? planData.annualPrice : planData.monthlyPrice

            return (
              <div
                key={key}
                className={`relative rounded-xl border p-6 transition-all ${
                  isCurrentPlan
                    ? 'border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/20'
                    : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
                }`}
              >
                {isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className={`px-4 py-1 bg-gradient-to-r ${planData.gradient} text-white text-xs font-bold rounded-full`}>
                      CURRENT PLAN
                    </span>
                  </div>
                )}

                {planData.highlight && !isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className={`px-4 py-1 bg-gradient-to-r ${planData.gradient} text-white text-xs font-bold rounded-full`}>
                      MOST POPULAR
                    </span>
                  </div>
                )}

                <div className="mb-4">
                  <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${planData.gradient} flex items-center justify-center mb-3`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">{planData.name}</h3>
                  <p className="text-sm text-slate-400 mt-1">{planData.description}</p>
                </div>

                <div className="mb-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-white">${price}</span>
                    <span className="text-slate-400">/{isAnnual ? 'year' : 'month'}</span>
                  </div>
                  {isAnnual && planData.monthlyPrice > 0 && (
                    <p className="text-sm text-emerald-400 mt-1">
                      Save ${(planData.monthlyPrice * 12 - planData.annualPrice).toFixed(0)}/year
                    </p>
                  )}
                </div>

                <button
                  onClick={() => handlePlanChange(key as PlanTier)}
                  disabled={loadingPlanChange !== null || isCurrentPlan}
                  className={`w-full py-3 rounded-lg font-medium transition-all mb-4 ${
                    isCurrentPlan
                      ? 'bg-slate-700 cursor-not-allowed opacity-60'
                      : planData.highlight
                      ? `bg-gradient-to-r ${planData.gradient} hover:shadow-lg`
                      : 'bg-slate-700 hover:bg-slate-600'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loadingPlanChange === key ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {plan?.subscriptionId ? 'Updating...' : 'Processing...'}
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      {getButtonText(key as PlanTier)}
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </button>

                <div className="space-y-3">
                  {planData.features.slice(0, 4).map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <Check className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-400" />
                      <span className="text-sm text-slate-300">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-700/50">
                  <p className="text-xs text-slate-500">{planData.bestFor}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// Billing Tab Component
function BillingTab({ invoices, invoicesLoading, plan, openStripePortal, saving, formatCurrency }: any) {
  return (
    <div className="space-y-6">
      {/* Payment Method */}
      <div className="rounded-2xl border border-slate-700/60 bg-slate-950/40 backdrop-blur p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Payment Method</h2>
          <button
            onClick={openStripePortal}
            disabled={saving}
            className="text-sm font-medium text-blue-400 hover:text-blue-300 transition flex items-center gap-1"
          >
            Manage
            <ExternalLink className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-4 p-6 rounded-lg bg-slate-800/30">
          <div className="h-12 w-16 rounded bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
            <CreditCard className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-white font-medium">•••• •••• •••• ••••</p>
            <p className="text-sm text-slate-400">Manage your payment methods in the billing portal</p>
          </div>
        </div>

        <div className="mt-4 flex gap-3">
          <button
            onClick={openStripePortal}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 transition text-white text-sm font-medium"
          >
            <CreditCard className="h-4 w-4" />
            Add Payment Method
          </button>
          <button
            onClick={openStripePortal}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-600 bg-slate-800/50 hover:bg-slate-800 transition text-white text-sm font-medium"
          >
            Update Billing Info
          </button>
        </div>
      </div>

      {/* Invoice History */}
      <div className="rounded-2xl border border-slate-700/60 bg-slate-950/40 backdrop-blur p-8 shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-6">Billing History</h2>

        {invoicesLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-slate-800/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : invoices.length > 0 ? (
          <div className="space-y-3">
            {invoices.map((invoice: Invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between p-4 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-slate-700 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-slate-300" />
                  </div>
                  <div>
                    <p className="font-medium text-white">
                      {new Date(invoice.date).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="text-sm text-slate-400">
                      {formatCurrency(invoice.amount)} • {invoice.status}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => window.open(invoice.invoicePdf, '_blank')}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition text-white text-sm font-medium"
                >
                  <Download className="h-4 w-4" />
                  Download
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No invoices available</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Profile Tab Component
function ProfileTab({ profile, setProfile, profileLoading, editMode, setEditMode, saveProfile, saving, router }: any) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Personal Information */}
      <div className="rounded-2xl border border-slate-700/60 bg-slate-950/40 backdrop-blur p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold">Personal Information</h2>
          </div>
          {!profileLoading &&
            (editMode !== 'personal' ? (
              <button
                onClick={() => setEditMode('personal')}
                className="text-sm font-medium text-blue-400 hover:text-blue-300 transition"
              >
                Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setEditMode(null)}
                  className="px-3 py-1.5 text-sm font-medium text-slate-300 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  onClick={saveProfile}
                  disabled={saving}
                  className="px-3 py-1.5 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            ))}
        </div>

        {profileLoading ? (
          <div className="space-y-4">
            <div className="h-12 bg-slate-800/50 rounded-lg animate-pulse" />
            <div className="h-12 bg-slate-800/50 rounded-lg animate-pulse" />
            <div className="h-12 bg-slate-800/50 rounded-lg animate-pulse" />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">First Name</label>
              <input
                type="text"
                value={profile.firstName || ''}
                onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                disabled={editMode !== 'personal'}
                className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-2.5 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60 disabled:cursor-not-allowed transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Last Name</label>
              <input
                type="text"
                value={profile.lastName || ''}
                onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                disabled={editMode !== 'personal'}
                className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-2.5 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60 disabled:cursor-not-allowed transition"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
              <div className="flex items-center gap-2 w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-2.5">
                <Mail className="h-4 w-4 text-slate-400" />
                <span className="text-white">{profile.email}</span>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-1">Phone</label>
              <input
                type="tel"
                value={profile.phone || ''}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                disabled={editMode !== 'personal'}
                placeholder="+1 (555) 123-4567"
                className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-2.5 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60 disabled:cursor-not-allowed transition"
              />
            </div>
          </div>
        )}
      </div>

      {/* Company Information */}
      <div className="rounded-2xl border border-slate-700/60 bg-slate-950/40 backdrop-blur p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold">Company Information</h2>
          </div>
          {!profileLoading &&
            (editMode !== 'company' ? (
              <button
                onClick={() => setEditMode('company')}
                className="text-sm font-medium text-blue-400 hover:text-blue-300 transition"
              >
                Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setEditMode(null)}
                  className="px-3 py-1.5 text-sm font-medium text-slate-300 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  onClick={saveProfile}
                  disabled={saving}
                  className="px-3 py-1.5 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            ))}
        </div>

        {profileLoading ? (
          <div className="space-y-4">
            <div className="h-12 bg-slate-800/50 rounded-lg animate-pulse" />
            <div className="h-12 bg-slate-800/50 rounded-lg animate-pulse" />
          </div>
        ) : (
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Company Name</label>
              <input
                type="text"
                value={profile.company || ''}
                onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                disabled={editMode !== 'company'}
                className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-2.5 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60 disabled:cursor-not-allowed transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Job Title</label>
              <input
                type="text"
                value={profile.title || ''}
                onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                disabled={editMode !== 'company'}
                className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-2.5 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60 disabled:cursor-not-allowed transition"
              />
            </div>
          </div>
        )}
      </div>

      {/* Address Information */}
      <div className="rounded-2xl border border-slate-700/60 bg-slate-950/40 backdrop-blur p-6 shadow-2xl lg:col-span-2">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold">Address</h2>
          </div>
          {!profileLoading &&
            (editMode !== 'address' ? (
              <button
                onClick={() => setEditMode('address')}
                className="text-sm font-medium text-blue-400 hover:text-blue-300 transition"
              >
                Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setEditMode(null)}
                  className="px-3 py-1.5 text-sm font-medium text-slate-300 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  onClick={saveProfile}
                  disabled={saving}
                  className="px-3 py-1.5 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            ))}
        </div>

        {profileLoading ? (
          <div className="space-y-4">
            <div className="h-12 bg-slate-800/50 rounded-lg animate-pulse" />
            <div className="h-12 bg-slate-800/50 rounded-lg animate-pulse" />
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="h-12 bg-slate-800/50 rounded-lg animate-pulse" />
              <div className="h-12 bg-slate-800/50 rounded-lg animate-pulse" />
              <div className="h-12 bg-slate-800/50 rounded-lg animate-pulse" />
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Address Line 1</label>
              <input
                type="text"
                value={profile.addressLine1 || ''}
                onChange={(e) => setProfile({ ...profile, addressLine1: e.target.value })}
                disabled={editMode !== 'address'}
                className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-2.5 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60 disabled:cursor-not-allowed transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Address Line 2</label>
              <input
                type="text"
                value={profile.addressLine2 || ''}
                onChange={(e) => setProfile({ ...profile, addressLine2: e.target.value })}
                disabled={editMode !== 'address'}
                placeholder="Apartment, suite, etc. (optional)"
                className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-2.5 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60 disabled:cursor-not-allowed transition"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">City</label>
                <input
                  type="text"
                  value={profile.city || ''}
                  onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                  disabled={editMode !== 'address'}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-2.5 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60 disabled:cursor-not-allowed transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">State</label>
                <input
                  type="text"
                  value={profile.state || ''}
                  onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                  disabled={editMode !== 'address'}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-2.5 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60 disabled:cursor-not-allowed transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Postal Code</label>
                <input
                  type="text"
                  value={profile.postalCode || ''}
                  onChange={(e) => setProfile({ ...profile, postalCode: e.target.value })}
                  disabled={editMode !== 'address'}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-2.5 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60 disabled:cursor-not-allowed transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Country</label>
              <input
                type="text"
                value={profile.country || ''}
                onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                disabled={editMode !== 'address'}
                className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-2.5 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60 disabled:cursor-not-allowed transition"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Usage Tab Component
function UsageTab({ usage, usageLoading, plan, currentPlanDetails, getUsagePercentage, formatCurrency }: any) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-700/60 bg-slate-950/40 backdrop-blur p-8 shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-6">Usage Statistics</h2>

        {usageLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-slate-800/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : usage && usage.available ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                label: 'Searches',
                current: usage.searches,
                limit: currentPlanDetails?.limits.searches || 0,
                icon: TrendingUp,
                color: 'blue',
              },
              {
                label: 'Exports',
                current: usage.exports,
                limit: currentPlanDetails?.limits.exports || 0,
                icon: Download,
                color: 'emerald',
              },
              {
                label: 'Saved Opportunities',
                current: usage.savedOpportunities,
                limit: currentPlanDetails?.limits.savedOpportunities || 0,
                icon: FileText,
                color: 'purple',
              },
            ].map((item) => {
              const percentage = getUsagePercentage(item.current, item.limit)
              const isUnlimited = item.limit === -1

              return (
                <div key={item.label} className="p-6 rounded-xl bg-slate-800/30 border border-slate-700">
                  <div className="flex items-center justify-between mb-4">
                    <item.icon className={`h-8 w-8 text-${item.color}-400`} />
                    <span className="text-sm text-slate-400">{item.label}</span>
                  </div>

                  <div className="mb-4">
                    <p className="text-3xl font-bold text-white">{item.current.toLocaleString()}</p>
                    <p className="text-sm text-slate-400">
                      {isUnlimited ? 'Unlimited' : `of ${item.limit.toLocaleString()}`}
                    </p>
                  </div>

                  {!isUnlimited && (
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          percentage > 90 ? 'bg-red-500' : percentage > 70 ? 'bg-amber-500' : `bg-${item.color}-500`
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400">
            <BarChart3 className="h-16 w-16 mx-auto mb-4 text-slate-600" />
            <p>Usage data unavailable</p>
          </div>
        )}
      </div>
    </div>
  )
}
