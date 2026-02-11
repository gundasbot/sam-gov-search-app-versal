//app/account/page.tsx

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
  AlertCircle,
  ExternalLink,
  Loader2,
  Download,
  FileText,
  Settings,
  Bell,
  Crown,
  ChevronRight,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  HeadphonesIcon,
  MessageSquare,
  Gavel,
  TrendingUp,
  Package,
  Key,
  Send,
  XCircle,
  AlertTriangle,
  Check,
  Eye,
  EyeOff,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

// Types
type PlanTier = 'NONE' | 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE'

type Plan = {
  tier: PlanTier
  status: string
  interval: 'month' | 'year' | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  subscription_id: string | null
  price?: number
}

type ProfileData = {
  email: string
  email_verified: boolean
  first_name: string
  last_name: string
  phone: string
  phone_verified: boolean
  company: string
  title: string
  address_line1: string
  address_line2: string
  city: string
  state: string
  postal_code: string
  country: string
}

type PaymentMethod = {
  id: string
  brand: string
  last4: string
  expMonth: number
  expYear: number
  isDefault: boolean
}

type BidData = {
  id: string
  opportunityId: string
  opportunityTitle: string
  dueDate: string
  status: 'draft' | 'submitted' | 'awarded' | 'not_awarded'
  value?: number
}

type Invoice = {
  id: string
  date: string
  amount: number
  status: string
  invoicePdf: string
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

type TabType = 'overview' | 'profile' | 'billing' | 'support' | 'bids'

// Plan configuration
const PLAN_DETAILS = {
  BASIC: {
    name: 'Basic',
    monthlyPrice: 24.99,
    annualPrice: 240,
    color: 'from-blue-500 to-cyan-500',
    icon: Shield,
    features: ['500 searches/month', '10 exports/month', '5 saved opportunities', 'Email alerts'],
  },
  PROFESSIONAL: {
    name: 'Professional',
    monthlyPrice: 49,
    annualPrice: 490,
    color: 'from-emerald-500 to-teal-500',
    icon: TrendingUp,
    features: ['5,000 searches/month', '100 exports/month', '50 saved opportunities', 'Real-time alerts', 'API access'],
  },
  ENTERPRISE: {
    name: 'Enterprise',
    monthlyPrice: 199,
    annualPrice: 1990,
    color: 'from-amber-500 to-orange-500',
    icon: Crown,
    features: ['Unlimited searches', 'Unlimited exports', 'Unlimited opportunities', 'Dedicated support', 'Custom integrations'],
  },
} as const

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-slate-900">
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

  // State
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('monthly')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  // Data state
  const [profile, setProfile] = useState<ProfileData>({
    email: session?.user?.email || '',
    email_verified: false,
    first_name: '',
    last_name: '',
    phone: '',
    phone_verified: false,
    company: '',
    title: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'United States',
  })
  
  const [plan, setPlan] = useState<Plan | null>(null)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [usage, setUsage] = useState<Usage | null>(null)
  const [bids, setBids] = useState<BidData[]>([])
  const [editMode, setEditMode] = useState<string | null>(null)
  const [verificationSent, setVerificationSent] = useState(false)
  const [loadingPlanChange, setLoadingPlanChange] = useState<string | null>(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
    }
  }, [status, router])

  // Load data
  useEffect(() => {
    if (status === 'authenticated') {
      loadAccountData()
    }
  }, [status])

  // Handle success/cancel callbacks from Stripe
  useEffect(() => {
    const success = searchParams.get('success')
    const canceled = searchParams.get('canceled')
    
    if (success) {
      setMessage({ type: 'success', text: 'Payment method updated successfully!' })
      setActiveTab('billing')
    } else if (canceled) {
      setMessage({ type: 'error', text: 'Payment update was canceled.' })
    }
  }, [searchParams])

  const loadAccountData = async () => {
    setLoading(true)
    try {
      const [profileRes, planRes, paymentsRes, invoicesRes, usageRes, bidsRes] = await Promise.all([
        fetch('/api/account/profile'),
        fetch('/api/account/plan'),
        fetch('/api/account/payment-methods'),
        fetch('/api/stripe/invoices'),
        fetch('/api/account/usage'),
        fetch('/api/account/bids'),
      ])

      if (profileRes.ok) {
        const profileData = await profileRes.json()
        setProfile({ ...profile, ...profileData })
      }

      if (planRes.ok) {
        const planData = await planRes.json()
        setPlan(planData)
        // Set billing interval from plan
        if (planData.interval) {
          setBillingInterval(planData.interval === 'year' ? 'annual' : 'monthly')
        }
      }

      if (paymentsRes.ok) {
        const paymentsData = await paymentsRes.json()
        setPaymentMethods(paymentsData)
      }

      if (invoicesRes.ok) {
        const invoicesData = await invoicesRes.json()
        setInvoices(invoicesData.invoices || [])
      }

      if (usageRes.ok) {
        const usageData = await usageRes.json()
        setUsage(usageData)
      }

      if (bidsRes.ok) {
        const bidsData = await bidsRes.json()
        setBids(bidsData)
      }
    } catch (error) {
      console.error('Error loading account data:', error)
      setMessage({ type: 'error', text: 'Failed to load account data' })
    } finally {
      setLoading(false)
    }
  }

  const saveProfile = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/account/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' })
        setEditMode(null)
      } else {
        throw new Error('Failed to update profile')
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save profile changes' })
    } finally {
      setSaving(false)
    }
  }

  const sendEmailVerification = async () => {
    try {
      const response = await fetch('/api/account/verify-email', {
        method: 'POST',
      })

      if (response.ok) {
        setVerificationSent(true)
        setMessage({ type: 'success', text: 'Verification email sent! Please check your inbox.' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to send verification email' })
    }
  }

  const managePaymentMethod = async () => {
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

  const handleCancelSubscription = async () => {
    if (!plan?.subscription_id) return

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
        body: JSON.stringify({ subscription_id: plan.subscription_id }),
      })

      if (res.ok) {
        setMessage({
          type: 'success',
          text: 'Subscription cancelled. You will have access until the end of your billing period.',
        })
        // Reload plan data
        await loadAccountData()
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

  const handlePlanChange = async (newTier: PlanTier, interval: 'month' | 'year') => {
    if (!plan || !session) return

    const requestedInterval = interval === 'year' ? 'annual' : 'monthly'
    const isCurrentPlan = plan.tier === newTier && plan.interval === interval

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
        console.log('Interval change detected for tier:', newTier, requestedInterval)
        const res = await fetch('/api/stripe/change-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tier: newTier,
            interval: requestedInterval,
          }),
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to change billing interval')
        }

        const updateData = await res.json()
        setMessage({
          type: 'success',
          text: updateData.message || `Billing interval changed to ${requestedInterval}!`,
        })

        // Force refresh plan data from Stripe
        await loadAccountData()
        setTimeout(() => setMessage(null), 5000)
      } else {
        // ALL OTHER CASES: Upgrades, downgrades, new subscriptions - MUST use Stripe Checkout
        console.log('Creating checkout for plan change:', newTier, requestedInterval)
        const res = await fetch('/api/stripe/create-checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tier: newTier,
            interval: requestedInterval,
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

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  const currentPlanDetails = plan?.tier && plan.tier !== 'NONE' ? PLAN_DETAILS[plan.tier] : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <User className="h-8 w-8" />
              Account Settings
            </h1>
            <p className="text-slate-400 mt-2">Manage your profile, subscription, and preferences</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto pb-px">
            {[
              { id: 'overview', label: 'Overview', icon: Sparkles },
              { id: 'profile', label: 'Profile', icon: User },
              { id: 'billing', label: 'Billing', icon: CreditCard },
              { id: 'support', label: 'Support', icon: HeadphonesIcon },
              { id: 'bids', label: 'Bid Management', icon: Gavel },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors whitespace-nowrap border-b-2 ${
                  activeTab === tab.id
                    ? 'text-blue-400 border-blue-400'
                    : 'text-slate-400 border-transparent hover:text-slate-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Message Banner */}
      {message && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div
            className={`p-4 rounded-xl flex items-center gap-3 ${
              message.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                : 'bg-red-500/10 border border-red-500/20 text-red-400'
            }`}
          >
            {message.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="ml-auto">
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <OverviewTab
            profile={profile}
            plan={plan}
            currentPlanDetails={currentPlanDetails}
            paymentMethods={paymentMethods}
            usage={usage}
            bids={bids}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileTab
            profile={profile}
            setProfile={setProfile}
            editMode={editMode}
            setEditMode={setEditMode}
            saving={saving}
            saveProfile={saveProfile}
            sendEmailVerification={sendEmailVerification}
            verificationSent={verificationSent}
          />
        )}

        {activeTab === 'billing' && (
          <BillingTab
            plan={plan}
            currentPlanDetails={currentPlanDetails}
            paymentMethods={paymentMethods}
            invoices={invoices}
            billingInterval={billingInterval}
            setBillingInterval={setBillingInterval}
            handlePlanChange={handlePlanChange}
            managePaymentMethod={managePaymentMethod}
            handleCancelSubscription={handleCancelSubscription}
            loadingPlanChange={loadingPlanChange}
          />
        )}

        {activeTab === 'support' && <SupportTab profile={profile} plan={plan} />}

        {activeTab === 'bids' && <BidsTab bids={bids} setBids={setBids} />}
      </div>
    </div>
  )
}

// Overview Tab
function OverviewTab({ profile, plan, currentPlanDetails, paymentMethods, usage, bids, setActiveTab }: any) {
  const getUsagePercentage = (current: number, limit: number) => {
    if (limit === -1) return 0
    return Math.min((current / limit) * 100, 100)
  }

  return (
    <div className="space-y-6">
      {/* Account Status */}
      <div className="rounded-2xl border border-slate-700/60 bg-slate-950/40 backdrop-blur p-6 shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-blue-400" />
          Account Overview
        </h2>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Profile Status */}
          <div className="p-6 rounded-xl bg-slate-800/30 border border-slate-700">
            <div className="flex items-center gap-3 mb-3">
              <User className="h-8 w-8 text-blue-400" />
              <div>
                <p className="text-sm text-slate-400">Profile</p>
                <p className="text-xl font-bold text-white">
                  {profile.first_name || profile.last_name
                    ? `${profile.first_name} ${profile.last_name}`.trim()
                    : 'Incomplete'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              {profile.email_verified ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span className="text-emerald-400">Email Verified</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-amber-400" />
                  <span className="text-amber-400">Email Not Verified</span>
                </>
              )}
            </div>
          </div>

          {/* Plan Status */}
          <div className="p-6 rounded-xl bg-slate-800/30 border border-slate-700">
            <div className="flex items-center gap-3 mb-3">
              {currentPlanDetails ? (
                <>
                  <currentPlanDetails.icon className="h-8 w-8 text-emerald-400" />
                  <div>
                    <p className="text-sm text-slate-400">Current Plan</p>
                    <p className="text-xl font-bold text-white">{currentPlanDetails.name}</p>
                  </div>
                </>
              ) : (
                <>
                  <Package className="h-8 w-8 text-slate-400" />
                  <div>
                    <p className="text-sm text-slate-400">Current Plan</p>
                    <p className="text-xl font-bold text-white">Free</p>
                  </div>
                </>
              )}
            </div>
            <button
              onClick={() => setActiveTab('billing')}
              className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              Manage Plan
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Bid Status */}
          <div className="p-6 rounded-xl bg-slate-800/30 border border-slate-700">
            <div className="flex items-center gap-3 mb-3">
              <Gavel className="h-8 w-8 text-purple-400" />
              <div>
                <p className="text-sm text-slate-400">Active Bids</p>
                <p className="text-xl font-bold text-white">{bids.filter((b: BidData) => b.status === 'draft' || b.status === 'submitted').length}</p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('bids')}
              className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              View All Bids
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Usage Summary */}
      {usage && usage.available && currentPlanDetails && (
        <div className="rounded-2xl border border-slate-700/60 bg-slate-950/40 backdrop-blur p-6 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-6">Usage This Month</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                label: 'Searches',
                current: usage.searches,
                limit: currentPlanDetails.limits.searches,
                icon: TrendingUp,
                color: 'blue',
              },
              {
                label: 'Exports',
                current: usage.exports,
                limit: currentPlanDetails.limits.exports,
                icon: Download,
                color: 'emerald',
              },
              {
                label: 'Saved Opportunities',
                current: usage.savedOpportunities,
                limit: currentPlanDetails.limits.savedOpportunities,
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
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        <QuickActionCard
          icon={Mail}
          title="Verify Email"
          description="Verify your email address to enable all features"
          buttonText="Verify Now"
          buttonAction={() => setActiveTab('profile')}
          show={!profile.email_verified}
        />

        <QuickActionCard
          icon={CreditCard}
          title="Update Payment"
          description="Add or update your payment method"
          buttonText="Manage Payment"
          buttonAction={() => setActiveTab('billing')}
          show={paymentMethods.length === 0}
        />

        <QuickActionCard
          icon={User}
          title="Complete Profile"
          description="Add your contact information and company details"
          buttonText="Update Profile"
          buttonAction={() => setActiveTab('profile')}
          show={!profile.first_name || !profile.company}
        />

        <QuickActionCard
          icon={HeadphonesIcon}
          title="Need Help?"
          description="Contact our support team for assistance"
          buttonText="Get Support"
          buttonAction={() => setActiveTab('support')}
          show={true}
        />
      </div>
    </div>
  )
}

function QuickActionCard({ icon: Icon, title, description, buttonText, buttonAction, show }: any) {
  if (!show) return null

  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-950/40 backdrop-blur p-6 shadow-2xl">
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
          <p className="text-sm text-slate-400 mb-4">{description}</p>
          <button
            onClick={buttonAction}
            className="text-sm font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            {buttonText}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Profile Tab
function ProfileTab({
  profile,
  setProfile,
  editMode,
  setEditMode,
  saving,
  saveProfile,
  sendEmailVerification,
  verificationSent,
}: any) {
  return (
    <div className="space-y-6">
      {/* Personal Information */}
      <div className="rounded-2xl border border-slate-700/60 bg-slate-950/40 backdrop-blur p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Personal Information</h2>
          </div>
          {editMode !== 'personal' ? (
            <button
              onClick={() => setEditMode('personal')}
              className="text-sm font-medium text-blue-400 hover:text-blue-300"
            >
              Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setEditMode(null)}
                className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white rounded-lg hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={saveProfile}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">First Name</label>
            <input
              type="text"
              value={profile.first_name || ''}
              onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
              disabled={editMode !== 'personal'}
              className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Last Name</label>
            <input
              type="text"
              value={profile.last_name || ''}
              onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
              disabled={editMode !== 'personal'}
              className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
            <div className="relative">
              <input
                type="email"
                value={profile.email || ''}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                disabled={editMode !== 'personal'}
                className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60 disabled:cursor-not-allowed pr-12"
              />
              {profile.email_verified ? (
                <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-400" />
              ) : (
                <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-amber-400" />
              )}
            </div>
            {!profile.email_verified && (
              <button
                onClick={sendEmailVerification}
                disabled={verificationSent}
                className="mt-2 text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 disabled:opacity-50"
              >
                <Send className="h-3 w-3" />
                {verificationSent ? 'Verification email sent!' : 'Send verification email'}
              </button>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Phone</label>
            <div className="relative">
              <input
                type="tel"
                value={profile.phone || ''}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                disabled={editMode !== 'personal'}
                placeholder="+1 (555) 123-4567"
                className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60 disabled:cursor-not-allowed pr-12"
              />
              {profile.phone_verified ? (
                <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-400" />
              ) : (
                <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Company Information */}
      <div className="rounded-2xl border border-slate-700/60 bg-slate-950/40 backdrop-blur p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Company Information</h2>
          </div>
          {editMode !== 'company' ? (
            <button
              onClick={() => setEditMode('company')}
              className="text-sm font-medium text-blue-400 hover:text-blue-300"
            >
              Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setEditMode(null)}
                className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white rounded-lg hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={saveProfile}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Company Name</label>
            <input
              type="text"
              value={profile.company || ''}
              onChange={(e) => setProfile({ ...profile, company: e.target.value })}
              disabled={editMode !== 'company'}
              className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Job Title</label>
            <input
              type="text"
              value={profile.title || ''}
              onChange={(e) => setProfile({ ...profile, title: e.target.value })}
              disabled={editMode !== 'company'}
              className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="rounded-2xl border border-slate-700/60 bg-slate-950/40 backdrop-blur p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <MapPin className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Address</h2>
          </div>
          {editMode !== 'address' ? (
            <button
              onClick={() => setEditMode('address')}
              className="text-sm font-medium text-blue-400 hover:text-blue-300"
            >
              Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setEditMode(null)}
                className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white rounded-lg hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={saveProfile}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Address Line 1</label>
            <input
              type="text"
              value={profile.address_line1 || ''}
              onChange={(e) => setProfile({ ...profile, address_line1: e.target.value })}
              disabled={editMode !== 'address'}
              className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Address Line 2</label>
            <input
              type="text"
              value={profile.address_line2 || ''}
              onChange={(e) => setProfile({ ...profile, address_line2: e.target.value })}
              disabled={editMode !== 'address'}
              placeholder="Apartment, suite, etc. (optional)"
              className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">City</label>
              <input
                type="text"
                value={profile.city || ''}
                onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                disabled={editMode !== 'address'}
                className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">State</label>
              <input
                type="text"
                value={profile.state || ''}
                onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                disabled={editMode !== 'address'}
                className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Postal Code</label>
              <input
                type="text"
                value={profile.postal_code || ''}
                onChange={(e) => setProfile({ ...profile, postal_code: e.target.value })}
                disabled={editMode !== 'address'}
                className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Country</label>
            <input
              type="text"
              value={profile.country || ''}
              onChange={(e) => setProfile({ ...profile, country: e.target.value })}
              disabled={editMode !== 'address'}
              className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// Billing Tab
function BillingTab({ plan, currentPlanDetails, paymentMethods, invoices, billingInterval, setBillingInterval, handlePlanChange, managePaymentMethod, handleCancelSubscription, loadingPlanChange }: any) {
  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <div className="rounded-2xl border border-slate-700/60 bg-slate-950/40 backdrop-blur p-6 shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <Package className="h-6 w-6 text-blue-400" />
          Current Plan
        </h2>

        {currentPlanDetails ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-6 rounded-xl bg-slate-800/30 border border-slate-700">
              <div className="flex items-center gap-4">
                <div className={`h-16 w-16 rounded-xl bg-gradient-to-br ${currentPlanDetails.color} flex items-center justify-center`}>
                  <currentPlanDetails.icon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">{currentPlanDetails.name}</h3>
                  <p className="text-slate-400">
                    ${plan.interval === 'year' ? currentPlanDetails.annualPrice : currentPlanDetails.monthlyPrice}
                    /{plan.interval === 'year' ? 'year' : 'month'}
                  </p>
                  {plan.current_period_end && (
                    <p className="text-sm text-slate-500 mt-1">
                      {plan.cancel_at_period_end ? 'Cancels' : 'Renews'} on {new Date(plan.current_period_end).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={managePaymentMethod}
                className="px-4 py-2 text-sm font-medium text-blue-400 hover:text-blue-300 border border-blue-400/30 rounded-lg hover:bg-blue-400/10"
              >
                Manage in Stripe
              </button>
            </div>

            {plan.cancel_at_period_end && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                <div className="flex items-center gap-2 text-red-400">
                  <AlertCircle className="h-5 w-5" />
                  <p className="text-sm">
                    Your subscription will cancel on {new Date(plan.current_period_end).toLocaleDateString()}. 
                    You'll have access until then.
                  </p>
                </div>
              </div>
            )}

            {!plan.cancel_at_period_end && (
              <button
                onClick={handleCancelSubscription}
                className="text-sm text-red-400 hover:text-red-300"
              >
                Cancel Subscription
              </button>
            )}
          </div>
        ) : (
          <div className="p-6 rounded-xl bg-slate-800/30 border border-slate-700 text-center">
            <Package className="h-12 w-12 mx-auto mb-3 text-slate-500" />
            <p className="text-lg text-white mb-2">No Active Plan</p>
            <p className="text-sm text-slate-400 mb-4">Choose a plan below to get started</p>
          </div>
        )}
      </div>

      {/* Plan Selection */}
      <div className="rounded-2xl border border-slate-700/60 bg-slate-950/40 backdrop-blur p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Change Plan</h2>

          {/* Interval Toggle */}
          <div className="flex items-center gap-2 p-1 bg-slate-800 rounded-lg">
            <button
              onClick={() => setBillingInterval('monthly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                billingInterval === 'monthly' ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval('annual')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${
                billingInterval === 'annual' ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Annual
              <span className="ml-1 text-xs text-emerald-400">Save 17%</span>
            </button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {Object.entries(PLAN_DETAILS).map(([tier, details]) => {
            const isCurrentPlan = plan?.tier === tier && plan?.interval === (billingInterval === 'annual' ? 'year' : 'month')
            const isLoading = loadingPlanChange === tier

            return (
              <div
                key={tier}
                className="rounded-xl border border-slate-700 bg-slate-800/30 p-6 flex flex-col"
              >
                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${details.color} flex items-center justify-center mb-4`}>
                  <details.icon className="h-6 w-6 text-white" />
                </div>

                <h3 className="text-xl font-bold text-white mb-2">{details.name}</h3>

                <div className="mb-4">
                  <span className="text-3xl font-bold text-white">
                    ${billingInterval === 'annual' ? details.annualPrice : details.monthlyPrice}
                  </span>
                  <span className="text-slate-400">/{billingInterval === 'annual' ? 'year' : 'month'}</span>
                </div>

                <ul className="space-y-2 mb-6 flex-1">
                  {details.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-slate-300">
                      <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {isCurrentPlan ? (
                  <button
                    disabled
                    className="w-full py-3 px-4 rounded-lg bg-slate-700 text-slate-400 font-medium cursor-not-allowed"
                  >
                    Current Plan
                  </button>
                ) : (
                  <button
                    onClick={() => handlePlanChange(tier as PlanTier, billingInterval === 'annual' ? 'year' : 'month')}
                    disabled={isLoading}
                    className="w-full py-3 px-4 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      plan?.tier === 'NONE' ? 'Get Started' : 'Switch to ' + details.name
                    )}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Payment Methods */}
      <div className="rounded-2xl border border-slate-700/60 bg-slate-950/40 backdrop-blur p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-blue-400" />
            Payment Methods
          </h2>
          <button
            onClick={managePaymentMethod}
            className="px-4 py-2 text-sm font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Manage Payment Methods
          </button>
        </div>

        {paymentMethods.length > 0 ? (
          <div className="space-y-3">
            {paymentMethods.map((method: PaymentMethod) => (
              <div
                key={method.id}
                className="flex items-center justify-between p-4 rounded-lg bg-slate-800/30 border border-slate-700"
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="h-6 w-6 text-slate-400" />
                  <div>
                    <p className="text-white font-medium">
                      {method.brand.toUpperCase()} •••• {method.last4}
                    </p>
                    <p className="text-sm text-slate-400">
                      Expires {method.expMonth}/{method.expYear}
                    </p>
                  </div>
                </div>
                {method.isDefault && (
                  <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs font-medium">
                    Default
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400">
            <CreditCard className="h-12 w-12 mx-auto mb-3 text-slate-600" />
            <p>No payment methods on file</p>
          </div>
        )}
      </div>

      {/* Invoice History */}
      {invoices && invoices.length > 0 && (
        <div className="rounded-2xl border border-slate-700/60 bg-slate-950/40 backdrop-blur p-6 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-400" />
            Invoice History
          </h2>

          <div className="space-y-3">
            {invoices.slice(0, 5).map((invoice: Invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between p-4 rounded-lg bg-slate-800/30 border border-slate-700"
              >
                <div>
                  <p className="text-white font-medium">
                    ${(invoice.amount / 100).toFixed(2)}
                  </p>
                  <p className="text-sm text-slate-400">
                    {new Date(invoice.date).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    invoice.status === 'paid'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-amber-500/10 text-amber-400'
                  }`}>
                    {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                  </span>
                  {invoice.invoicePdf && (
                    <a
                      href={invoice.invoicePdf}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg hover:bg-slate-700 text-blue-400 hover:text-blue-300"
                    >
                      <Download className="h-5 w-5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Support Tab
function SupportTab({ profile, plan }: any) {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [priority, setPriority] = useState<'low' | 'normal' | 'high'>('normal')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)

    try {
      const response = await fetch('/api/support/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          message,
          priority,
          userInfo: {
            email: profile.email,
            name: `${profile.first_name} ${profile.last_name}`.trim(),
            plan: plan?.tier || 'NONE',
          },
        }),
      })

      if (response.ok) {
        setSent(true)
        setSubject('')
        setMessage('')
        setPriority('normal')
        setTimeout(() => setSent(false), 5000)
      }
    } catch (error) {
      console.error('Error submitting support ticket:', error)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Contact Options */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-700/60 bg-slate-950/40 backdrop-blur p-6 shadow-2xl text-center">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mx-auto mb-4">
            <Mail className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Email Support</h3>
          <p className="text-sm text-slate-400 mb-4">We'll respond within 24 hours</p>
          <a
            href="mailto:support@precisegov.com"
            className="text-blue-400 hover:text-blue-300 text-sm font-medium"
          >
            support@precisegov.com
          </a>
        </div>

        <div className="rounded-2xl border border-slate-700/60 bg-slate-950/40 backdrop-blur p-6 shadow-2xl text-center">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Live Chat</h3>
          <p className="text-sm text-slate-400 mb-4">Available Mon-Fri, 9am-5pm ET</p>
          <button className="text-blue-400 hover:text-blue-300 text-sm font-medium">
            Start Chat
          </button>
        </div>

        <div className="rounded-2xl border border-slate-700/60 bg-slate-950/40 backdrop-blur p-6 shadow-2xl text-center">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4">
            <Phone className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Phone Support</h3>
          <p className="text-sm text-slate-400 mb-4">
            {plan?.tier === 'ENTERPRISE' ? 'Priority phone support' : 'Enterprise plans only'}
          </p>
          {plan?.tier === 'ENTERPRISE' ? (
            <a href="tel:+18445551234" className="text-blue-400 hover:text-blue-300 text-sm font-medium">
              (844) 555-1234
            </a>
          ) : (
            <button className="text-slate-500 text-sm font-medium cursor-not-allowed">
              Upgrade for phone support
            </button>
          )}
        </div>
      </div>

      {/* Submit Ticket Form */}
      <div className="rounded-2xl border border-slate-700/60 bg-slate-950/40 backdrop-blur p-6 shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <HeadphonesIcon className="h-6 w-6 text-blue-400" />
          Submit Support Ticket
        </h2>

        {sent && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5" />
            <span>Your support ticket has been submitted. We'll be in touch soon!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              placeholder="Brief description of your issue"
              className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Priority</label>
            <div className="flex gap-3">
              {[
                { value: 'low', label: 'Low', color: 'slate' },
                { value: 'normal', label: 'Normal', color: 'blue' },
                { value: 'high', label: 'High', color: 'red' },
              ].map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPriority(p.value as any)}
                  className={`flex-1 py-2 px-4 rounded-lg border transition ${
                    priority === p.value
                      ? `border-${p.color}-500 bg-${p.color}-500/10 text-${p.color}-400`
                      : 'border-slate-600 bg-slate-900/50 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={6}
              placeholder="Please describe your issue in detail..."
              className="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={sending}
            className="w-full py-3 px-6 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {sending ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-5 w-5" />
                Submit Ticket
              </>
            )}
          </button>
        </form>
      </div>

      {/* Billing Support */}
      <div className="rounded-2xl border border-slate-700/60 bg-slate-950/40 backdrop-blur p-6 shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-blue-400" />
          Billing Support
        </h2>
        <p className="text-slate-400 mb-6">
          For billing inquiries, subscription changes, or invoice requests, please contact our billing team.
        </p>
        <a
          href="mailto:billing@precisegov.com"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition"
        >
          <Mail className="h-5 w-5" />
          Contact Billing Support
        </a>
      </div>
    </div>
  )
}

// Bids Tab
function BidsTab({ bids, setBids }: any) {
  const [filter, setFilter] = useState<'all' | 'draft' | 'submitted' | 'awarded' | 'not_awarded'>('all')

  const filteredBids = filter === 'all' ? bids : bids.filter((b: BidData) => b.status === filter)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'text-slate-400 bg-slate-400/10 border-slate-400/20'
      case 'submitted':
        return 'text-blue-400 bg-blue-400/10 border-blue-400/20'
      case 'awarded':
        return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
      case 'not_awarded':
        return 'text-red-400 bg-red-400/10 border-red-400/20'
      default:
        return 'text-slate-400 bg-slate-400/10 border-slate-400/20'
    }
  }

  const getStatusLabel = (status: string) => {
    return status
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        {[
          { label: 'Total Bids', value: bids.length, color: 'blue' },
          { label: 'In Progress', value: bids.filter((b: BidData) => b.status === 'draft').length, color: 'slate' },
          { label: 'Submitted', value: bids.filter((b: BidData) => b.status === 'submitted').length, color: 'purple' },
          { label: 'Awarded', value: bids.filter((b: BidData) => b.status === 'awarded').length, color: 'emerald' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-slate-700/60 bg-slate-950/40 backdrop-blur p-6 shadow-2xl">
            <p className="text-sm text-slate-400 mb-1">{stat.label}</p>
            <p className={`text-3xl font-bold text-${stat.color}-400`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Bids List */}
      <div className="rounded-2xl border border-slate-700/60 bg-slate-950/40 backdrop-blur p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Gavel className="h-6 w-6 text-blue-400" />
            Bid Management
          </h2>

          {/* Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="rounded-lg border border-slate-600 bg-slate-900/50 px-4 py-2 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">All Bids</option>
            <option value="draft">Drafts</option>
            <option value="submitted">Submitted</option>
            <option value="awarded">Awarded</option>
            <option value="not_awarded">Not Awarded</option>
          </select>
        </div>

        {filteredBids.length > 0 ? (
          <div className="space-y-3">
            {filteredBids.map((bid: BidData) => (
              <div
                key={bid.id}
                className="p-4 rounded-xl bg-slate-800/30 border border-slate-700 hover:border-slate-600 transition cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-white font-medium mb-1">{bid.opportunityTitle}</h3>
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      <span className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        {bid.opportunityId}
                      </span>
                      <span>Due: {new Date(bid.dueDate).toLocaleDateString()}</span>
                      {bid.value && (
                        <span className="text-emerald-400 font-medium">
                          ${bid.value.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(bid.status)}`}>
                    {getStatusLabel(bid.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400">
            <Gavel className="h-16 w-16 mx-auto mb-4 text-slate-600" />
            <p className="text-lg mb-2">No bids found</p>
            <p className="text-sm">Start tracking your government contract bids here</p>
          </div>
        )}
      </div>
    </div>
  )
}
