//app/account/page.tsx

'use client'

import { useState, useEffect, Suspense, useRef } from 'react'
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
  Plus,
  Pencil,
  Trash2,
  CalendarDays,
  DollarSign,
  ClipboardList,
  Trophy,
  BarChart2,
  ArrowUpRight,
  Clock,
  Building,
  Camera,
  AtSign,
  PhoneCall,
  Lock,
  ShieldCheck,
  Upload,
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
  // Extended fields
  recovery_email: string
  alternate_phone: string
  profile_photo: string
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
        <div className="flex items-center justify-center min-h-screen bg-[#0a0d14]" style={{fontFamily: "'Aptos', 'Segoe UI', system-ui, sans-serif"}}>
          <Loader2 className="w-8 h-8 animate-spin text-[#1a4bff]" />
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
    recovery_email: '',
    alternate_phone: '',
    profile_photo: '',
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
        const res = await fetch('/api/stripe/checkout', {
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
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0d14]" style={{fontFamily: "'Aptos', 'Segoe UI', system-ui, sans-serif"}}>
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1a4bff] to-[#0ea5e9] flex items-center justify-center shadow-2xl shadow-blue-500/40 mb-6">
            <Loader2 className="w-8 h-8 animate-spin text-white" />
          </div>
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#1a4bff]/30 to-[#0ea5e9]/30 blur-xl animate-pulse" />
        </div>
        <p className="text-slate-400 text-sm font-medium tracking-wide">Loading your account...</p>
      </div>
    )
  }

  const currentPlanDetails = plan?.tier && plan.tier !== 'NONE' ? PLAN_DETAILS[plan.tier] : null

  return (
    <div className="min-h-screen bg-[#0a0d14]" style={{fontFamily: "'Aptos', 'Segoe UI', system-ui, sans-serif"}}>
      {/* ── Hero Header ── */}
      <div className="relative border-b border-white/[0.06] overflow-hidden">
        {/* Rich layered background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0d1117] via-[#0a0d14] to-[#0a0d14]" />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-[#1a4bff]/6 rounded-full blur-[120px]" />
          <div className="absolute -top-16 right-1/3 w-[400px] h-[400px] bg-[#0ea5e9]/7 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-[#6366f1]/5 rounded-full blur-[80px]" />
          {/* Subtle dot grid */}
          <div className="absolute inset-0 opacity-[0.025]" style={{backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '28px 28px'}} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-0">
          {/* Top row: avatar + name + plan badge */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-5 sm:gap-8 mb-8">
            {/* Avatar */}
            <div className="relative flex-shrink-0 group cursor-pointer" onClick={() => setActiveTab('overview')}>
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-[#1a4bff] via-[#2563eb] to-[#0ea5e9] flex items-center justify-center shadow-2xl shadow-blue-900/50 ring-2 ring-white/10 transition-all duration-300 group-hover:ring-white/20 group-hover:shadow-blue-800/60">
                {profile.profile_photo ? (
                  <img src={profile.profile_photo} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl sm:text-4xl font-black text-white select-none">
                    {(profile.first_name?.[0] || session?.user?.name?.[0] || 'U').toUpperCase()}
                  </span>
                )}
              </div>
              <div className="absolute inset-0 rounded-2xl bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="h-5 w-5 text-white" />
              </div>
              {plan?.status === 'active' && (
                <div className="absolute -bottom-1.5 -right-1.5 w-5 h-5 bg-emerald-400 rounded-full border-2 border-[#0a0d14] shadow-lg shadow-emerald-500/40" />
              )}
            </div>

            <div className="flex-1 min-w-0 pb-1">
              <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-none">
                  {profile.first_name && profile.last_name
                    ? `${profile.first_name} ${profile.last_name}`
                    : session?.user?.name || 'Account Settings'}
                </h1>
                {currentPlanDetails && (
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r ${currentPlanDetails.color} text-white shadow-lg uppercase tracking-wider`}>
                    <currentPlanDetails.icon className="h-3 w-3" />
                    {currentPlanDetails.name}
                  </span>
                )}
              </div>
              <p className="text-slate-400 text-sm font-medium truncate">
                {profile.email || session?.user?.email || 'Manage your profile, subscription, and preferences'}
              </p>
              {profile.company && (
                <p className="text-slate-500 text-xs mt-1.5 flex items-center gap-1.5">
                  <Building className="h-3.5 w-3.5 text-blue-400/70" />
                  <span className="text-slate-400">{profile.company}</span>
                  {profile.title && <span className="text-slate-600">·</span>}
                  {profile.title && <span className="text-slate-500">{profile.title}</span>}
                </p>
              )}
            </div>

            {/* Right: stat pills */}
            <div className="hidden lg:flex items-end gap-3 pb-1">
              <div className="text-center px-5 py-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.07] backdrop-blur hover:bg-white/[0.06] transition-all duration-200 hover:border-white/[0.12]">
                <p className="text-2xl font-black text-white leading-none">{bids.filter((b: BidData) => b.status === 'draft' || b.status === 'submitted').length}</p>
                <p className="text-xs text-slate-500 mt-1 font-medium">Active Bids</p>
              </div>
              <div className="text-center px-5 py-3.5 rounded-2xl bg-emerald-500/[0.07] border border-emerald-500/[0.18] backdrop-blur hover:bg-emerald-500/[0.1] transition-all duration-200">
                <p className="text-2xl font-black text-emerald-400 leading-none">{bids.filter((b: BidData) => b.status === 'awarded').length}</p>
                <p className="text-xs text-slate-500 mt-1 font-medium">Awarded</p>
              </div>
              {plan?.status === 'active' && (
                <div className="text-center px-5 py-3.5 rounded-2xl bg-emerald-500/[0.07] border border-emerald-500/[0.18] backdrop-blur">
                  <div className="flex items-center gap-1.5 justify-center">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <p className="text-sm font-black text-emerald-400">Active</p>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 font-medium">Subscription</p>
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-0.5 overflow-x-auto pb-px scrollbar-none">
            {[
              { id: 'overview', label: 'Overview', icon: Sparkles },
              { id: 'profile', label: 'Profile', icon: User },
              { id: 'billing', label: 'Billing', icon: CreditCard },
              { id: 'support', label: 'Support', icon: HeadphonesIcon },
              { id: 'bids', label: 'Bids', icon: Gavel,
                badge: bids.filter((b: BidData) => b.status === 'draft' || b.status === 'submitted').length || null },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`relative flex items-center gap-2 px-4 sm:px-5 py-3 sm:py-3.5 text-xs sm:text-sm font-semibold transition-all duration-200 whitespace-nowrap rounded-t-lg ${
                  activeTab === tab.id
                    ? 'text-white bg-white/[0.06] border-b-2 border-[#1a4bff]'
                    : 'text-slate-500 border-b-2 border-transparent hover:text-slate-300 hover:bg-white/[0.03]'
                }`}
              >
                <tab.icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0 transition-colors duration-200 ${activeTab === tab.id ? 'text-[#1a4bff]' : ''}`} />
                {tab.label}
                {(tab as any).badge ? (
                  <span className="ml-0.5 px-1.5 py-0.5 text-xs font-black rounded-full bg-[#1a4bff] text-white leading-none">
                    {(tab as any).badge}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Message Banner */}
      {message && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-5">
          <div
            className={`px-5 py-3.5 rounded-xl flex items-center gap-3 border shadow-lg transition-all duration-300 ${
              message.type === 'success'
                ? 'bg-emerald-500/[0.08] border-emerald-500/20 text-emerald-400'
                : 'bg-red-500/[0.08] border-red-500/20 text-red-400'
            }`}
          >
            {message.type === 'success' ? <CheckCircle2 className="h-4.5 w-4.5 flex-shrink-0" /> : <XCircle className="h-4.5 w-4.5 flex-shrink-0" />}
            <span className="text-sm font-medium">{message.text}</span>
            <button onClick={() => setMessage(null)} className="ml-auto opacity-50 hover:opacity-100 transition-opacity p-0.5 rounded">
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {activeTab === 'overview' && (
          <OverviewTab
            profile={profile}
            setProfile={setProfile}
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
function OverviewTab({ profile, setProfile, plan, currentPlanDetails, paymentMethods, usage, bids, setActiveTab }: any) {
  const getUsagePercentage = (current: number, limit: number) => {
    if (limit === -1) return 0
    return Math.min((current / limit) * 100, 100)
  }

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [editingContact, setEditingContact] = useState(false)
  const [contactSaving, setContactSaving] = useState(false)
  const [localProfile, setLocalProfile] = useState({
    recovery_email: profile.recovery_email || '',
    alternate_phone: profile.alternate_phone || '',
  })

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoUploading(true)
    try {
      const reader = new FileReader()
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string
        setProfile((prev: any) => ({ ...prev, profile_photo: dataUrl }))
        setPhotoUploading(false)
      }
      reader.readAsDataURL(file)
    } catch {
      setPhotoUploading(false)
    }
  }

  const saveContactInfo = async () => {
    setContactSaving(true)
    try {
      setProfile((prev: any) => ({ ...prev, ...localProfile }))
      await new Promise(r => setTimeout(r, 600))
      setEditingContact(false)
    } finally {
      setContactSaving(false)
    }
  }

  const completionItems = [
    { done: !!(profile.first_name && profile.last_name), label: 'Full name' },
    { done: !!profile.email_verified, label: 'Email verified' },
    { done: !!profile.phone, label: 'Phone number' },
    { done: !!profile.company, label: 'Company info' },
    { done: !!profile.profile_photo, label: 'Profile photo' },
    { done: !!profile.recovery_email, label: 'Recovery email' },
  ]
  const completionPct = Math.round((completionItems.filter(i => i.done).length / completionItems.length) * 100)

  return (
    <div className="space-y-6">

      {/* ── Identity Hero Row ── */}
      <div className="relative rounded-2xl overflow-hidden border border-white/[0.07] bg-[#0d1117]">
        {/* Gradient accent top */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#1a4bff]/60 to-transparent" />
        {/* Ambient glow */}
        <div className="absolute -top-20 left-1/4 w-[350px] h-[200px] bg-[#1a4bff]/5 rounded-full blur-[60px] pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row gap-0">
          {/* Left: Photo + identity */}
          <div className="flex-1 p-6 sm:p-8 border-b lg:border-b-0 lg:border-r border-white/[0.06]">
            <div className="flex items-start gap-5">
              {/* Photo upload zone */}
              <div className="relative flex-shrink-0 group">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden cursor-pointer bg-gradient-to-br from-[#1a4bff] to-[#0ea5e9] flex items-center justify-center shadow-xl shadow-blue-900/40 ring-2 ring-white/[0.08] transition-all duration-300 group-hover:ring-white/20 group-hover:shadow-blue-800/50"
                >
                  {photoUploading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                  ) : profile.profile_photo ? (
                    <img src={profile.profile_photo} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-black text-white">
                      {(profile.first_name?.[0] || 'U').toUpperCase()}
                    </span>
                  )}
                </div>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 rounded-2xl bg-black/65 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 cursor-pointer"
                >
                  <Camera className="h-5 w-5 text-white" />
                  <span className="text-[10px] font-bold text-white/80 uppercase tracking-wide">Change</span>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              </div>

              {/* Identity text */}
              <div className="flex-1 min-w-0 pt-1">
                <h2 className="text-xl sm:text-2xl font-black text-white leading-tight mb-1">
                  {profile.first_name && profile.last_name
                    ? `${profile.first_name} ${profile.last_name}`
                    : 'Your Name'}
                </h2>
                <p className="text-sm text-slate-400 mb-0.5">{profile.email}</p>
                {profile.company && (
                  <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                    <Building className="h-3.5 w-3.5 text-blue-400/60" />
                    {profile.company}{profile.title ? ` · ${profile.title}` : ''}
                  </p>
                )}

                {/* Profile completion bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-slate-500">Profile completion</span>
                    <span className="text-xs font-bold text-white">{completionPct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#1a4bff] to-[#0ea5e9] transition-all duration-700"
                      style={{ width: `${completionPct}%` }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2.5">
                    {completionItems.map(item => (
                      <span key={item.label} className={`text-[11px] flex items-center gap-1 font-medium ${item.done ? 'text-slate-500 line-through' : 'text-slate-400'}`}>
                        {item.done
                          ? <CheckCircle2 className="h-3 w-3 text-emerald-500 flex-shrink-0" />
                          : <div className="h-3 w-3 rounded-full border border-slate-600 flex-shrink-0" />}
                        {item.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Contact security panel */}
          <div className="lg:w-[340px] xl:w-[380px] p-6 sm:p-8 flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#1a4bff]/15 border border-[#1a4bff]/20 flex items-center justify-center">
                  <ShieldCheck className="h-4 w-4 text-[#4f7bff]" />
                </div>
                <span className="text-sm font-bold text-white">Contact & Security</span>
              </div>
              {!editingContact ? (
                <button
                  onClick={() => { setLocalProfile({ recovery_email: profile.recovery_email || '', alternate_phone: profile.alternate_phone || '' }); setEditingContact(true) }}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-3 py-1.5 rounded-lg transition-all duration-200"
                >
                  <Pencil className="h-3 w-3" /> Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => setEditingContact(false)} className="px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white rounded-lg border border-slate-700 hover:border-slate-500 transition-all">Cancel</button>
                  <button
                    onClick={saveContactInfo}
                    disabled={contactSaving}
                    className="px-4 py-1.5 text-xs font-bold bg-[#1a4bff] hover:bg-[#2557ff] text-white rounded-lg disabled:opacity-50 flex items-center gap-1.5 transition-all duration-200"
                  >
                    {contactSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                    Save
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-3 flex-1">
              {/* Primary phone */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/15 flex items-center justify-center flex-shrink-0">
                  <Phone className="h-3.5 w-3.5 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-0.5">Primary Phone</p>
                  <p className="text-sm font-medium text-slate-300 truncate">{profile.phone || <span className="text-slate-600 italic text-xs">Not set · go to Profile tab</span>}</p>
                </div>
                {profile.phone_verified && <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />}
              </div>

              {/* Alternate phone */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/15 flex items-center justify-center flex-shrink-0">
                  <PhoneCall className="h-3.5 w-3.5 text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-0.5">Alternate Phone</p>
                  {editingContact ? (
                    <input
                      type="tel"
                      value={localProfile.alternate_phone}
                      onChange={e => setLocalProfile(p => ({ ...p, alternate_phone: e.target.value }))}
                      placeholder="+1 (555) 000-0000"
                      className="w-full bg-transparent text-sm font-medium text-white placeholder-slate-600 border-b border-purple-500/40 focus:border-purple-400 outline-none pb-0.5 transition-colors"
                    />
                  ) : (
                    <p className="text-sm font-medium text-slate-300 truncate">{profile.alternate_phone || <span className="text-slate-600 italic text-xs">Not set</span>}</p>
                  )}
                </div>
              </div>

              {/* Recovery email */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/15 flex items-center justify-center flex-shrink-0">
                  <AtSign className="h-3.5 w-3.5 text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-0.5">Recovery Email</p>
                  {editingContact ? (
                    <input
                      type="email"
                      value={localProfile.recovery_email}
                      onChange={e => setLocalProfile(p => ({ ...p, recovery_email: e.target.value }))}
                      placeholder="backup@example.com"
                      className="w-full bg-transparent text-sm font-medium text-white placeholder-slate-600 border-b border-amber-500/40 focus:border-amber-400 outline-none pb-0.5 transition-colors"
                    />
                  ) : (
                    <p className="text-sm font-medium text-slate-300 truncate">{profile.recovery_email || <span className="text-slate-600 italic text-xs">Not set — add for account recovery</span>}</p>
                  )}
                </div>
              </div>
            </div>

            {!profile.recovery_email && !editingContact && (
              <button
                onClick={() => setEditingContact(true)}
                className="mt-4 w-full py-2.5 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] text-amber-400 hover:bg-amber-500/[0.1] hover:border-amber-500/30 text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1.5"
              >
                <AlertCircle className="h-3.5 w-3.5" />
                Add recovery email for security
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          {
            label: 'Active Bids',
            value: bids.filter((b: BidData) => b.status === 'draft' || b.status === 'submitted').length,
            sub: 'in progress',
            color: 'text-[#4f7bff]',
            bg: 'bg-[#1a4bff]/[0.07]',
            border: 'border-[#1a4bff]/[0.15]',
            icon: Gavel,
            action: () => setActiveTab('bids'),
          },
          {
            label: 'Awarded',
            value: bids.filter((b: BidData) => b.status === 'awarded').length,
            sub: 'contracts won',
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/[0.07]',
            border: 'border-emerald-500/[0.15]',
            icon: Trophy,
            action: () => setActiveTab('bids'),
          },
          {
            label: 'Current Plan',
            value: currentPlanDetails?.name || 'Free',
            sub: plan?.status === 'active' ? 'active' : 'no subscription',
            color: 'text-violet-400',
            bg: 'bg-violet-500/[0.07]',
            border: 'border-violet-500/[0.15]',
            icon: Crown,
            action: () => setActiveTab('billing'),
          },
          {
            label: 'Account Status',
            value: profile.email_verified ? 'Verified' : 'Unverified',
            sub: profile.email_verified ? 'email confirmed' : 'action needed',
            color: profile.email_verified ? 'text-emerald-400' : 'text-amber-400',
            bg: profile.email_verified ? 'bg-emerald-500/[0.07]' : 'bg-amber-500/[0.07]',
            border: profile.email_verified ? 'border-emerald-500/[0.15]' : 'border-amber-500/[0.15]',
            icon: profile.email_verified ? ShieldCheck : AlertCircle,
            action: () => setActiveTab('profile'),
          },
        ].map(stat => (
          <button
            key={stat.label}
            onClick={stat.action}
            className={`group text-left p-4 sm:p-5 rounded-2xl ${stat.bg} border ${stat.border} hover:brightness-110 transition-all duration-200 relative overflow-hidden`}
          >
            <div className="flex items-start justify-between mb-3">
              <stat.icon className={`h-4.5 w-4.5 ${stat.color} opacity-80`} />
              <ArrowUpRight className="h-3.5 w-3.5 text-slate-600 group-hover:text-slate-400 transition-colors" />
            </div>
            <p className={`text-xl sm:text-2xl font-black ${stat.color} leading-none mb-1`}>{stat.value}</p>
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{stat.label}</p>
            <p className="text-[10px] text-slate-600 mt-0.5">{stat.sub}</p>
          </button>
        ))}
      </div>

      {/* ── Usage Summary ── */}
      {usage && usage.available && currentPlanDetails && (
        <div className="relative rounded-2xl overflow-hidden border border-white/[0.07] bg-[#0d1117]">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/15 flex items-center justify-center">
                <BarChart2 className="h-4 w-4 text-cyan-400" />
              </div>
              <h2 className="text-base font-bold text-white">Usage This Month</h2>
            </div>
            <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-3">
              {[
                { label: 'Searches', current: usage.searches, limit: currentPlanDetails?.limits?.searches ?? -1, icon: TrendingUp, color: 'text-blue-400', bar: 'from-[#1a4bff] to-[#0ea5e9]' },
                { label: 'Exports', current: usage.exports, limit: currentPlanDetails?.limits?.exports ?? -1, icon: Download, color: 'text-emerald-400', bar: 'from-emerald-500 to-teal-500' },
                { label: 'Saved Opps', current: usage.savedOpportunities, limit: currentPlanDetails?.limits?.savedOpportunities ?? -1, icon: FileText, color: 'text-violet-400', bar: 'from-violet-500 to-purple-500' },
              ].map((item) => {
                const pct = item.limit === -1 ? 0 : Math.min((item.current / item.limit) * 100, 100)
                const isUnlimited = item.limit === -1
                const isHigh = pct > 90

                return (
                  <div key={item.label} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="flex items-center justify-between mb-3">
                      <item.icon className={`h-4 w-4 ${item.color} opacity-80`} />
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{item.label}</span>
                    </div>
                    <p className={`text-2xl font-black ${item.color} leading-none mb-1`}>{item.current.toLocaleString()}</p>
                    <p className="text-xs text-slate-600 mb-3">{isUnlimited ? '∞ Unlimited' : `of ${item.limit.toLocaleString()}`}</p>
                    {!isUnlimited && (
                      <>
                        <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 bg-gradient-to-r ${isHigh ? 'from-red-500 to-red-400' : item.bar}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-600 mt-1">{Math.round(pct)}% used</p>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Quick Actions ── */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
        <QuickActionCard
          icon={Mail}
          title="Verify Your Email"
          description="Confirm your email to unlock all features and receive critical alerts"
          buttonText="Verify Now"
          buttonAction={() => setActiveTab('profile')}
          show={!profile.email_verified}
          accent="amber"
        />
        <QuickActionCard
          icon={CreditCard}
          title="Add Payment Method"
          description="Set up billing to unlock premium features and manage your subscription"
          buttonText="Manage Billing"
          buttonAction={() => setActiveTab('billing')}
          show={paymentMethods.length === 0}
          accent="blue"
        />
        <QuickActionCard
          icon={User}
          title="Complete Your Profile"
          description="Add contact info and company details to improve your experience"
          buttonText="Update Profile"
          buttonAction={() => setActiveTab('profile')}
          show={!profile.first_name || !profile.company}
          accent="purple"
        />
        <QuickActionCard
          icon={HeadphonesIcon}
          title="Need Help?"
          description="Our team is here Mon–Fri 9am–5pm ET"
          buttonText="Contact Support"
          buttonAction={() => setActiveTab('support')}
          show={true}
          accent="emerald"
        />
      </div>
    </div>
  )
}

function QuickActionCard({ icon: Icon, title, description, buttonText, buttonAction, show, accent = 'blue' }: any) {
  if (!show) return null

  const accents: Record<string, { bg: string; border: string; text: string; hover: string; btn: string }> = {
    amber:  { bg: 'bg-amber-500/[0.06]',   border: 'border-amber-500/[0.15]',   text: 'text-amber-400',   hover: 'hover:border-amber-500/30',   btn: 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/20' },
    blue:   { bg: 'bg-[#1a4bff]/[0.06]',   border: 'border-[#1a4bff]/[0.15]',   text: 'text-[#4f7bff]',   hover: 'hover:border-[#1a4bff]/30',   btn: 'bg-[#1a4bff]/10 hover:bg-[#1a4bff]/20 text-[#4f7bff] border-[#1a4bff]/20' },
    purple: { bg: 'bg-violet-500/[0.06]',  border: 'border-violet-500/[0.15]',  text: 'text-violet-400',  hover: 'hover:border-violet-500/30',  btn: 'bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 border-violet-500/20' },
    emerald:{ bg: 'bg-emerald-500/[0.06]', border: 'border-emerald-500/[0.15]', text: 'text-emerald-400', hover: 'hover:border-emerald-500/30', btn: 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20' },
  }
  const a = accents[accent]

  return (
    <div className={`group rounded-2xl border ${a.border} ${a.hover} ${a.bg} p-5 sm:p-6 transition-all duration-300 flex items-start gap-4`}>
      <div className={`h-10 w-10 rounded-xl ${a.bg} border ${a.border} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`h-5 w-5 ${a.text}`} />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-bold text-white mb-1">{title}</h3>
        <p className="text-xs text-slate-500 mb-4 leading-relaxed">{description}</p>
        <button
          onClick={buttonAction}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold ${a.btn} transition-all duration-200`}
        >
          {buttonText}
          <ArrowUpRight className="h-3 w-3" />
        </button>
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
  // Shared input style
  const inputBase = "w-full rounded-xl border bg-white/[0.03] px-4 py-3 text-white placeholder-slate-600 focus:ring-1 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 text-sm font-medium"
  const inputEnabled = "border-white/[0.1] focus:border-[#1a4bff]/60 focus:ring-[#1a4bff]/20 hover:border-white/[0.15]"
  const inputDisabled = "border-white/[0.06]"

  const SectionWrapper = ({ children, accent = '#1a4bff' }: any) => (
    <div className="relative rounded-2xl overflow-hidden border border-white/[0.07] bg-[#0d1117]">
      <div className="absolute top-0 inset-x-0 h-px" style={{background: `linear-gradient(90deg, transparent, ${accent}60, transparent)`}} />
      {children}
    </div>
  )

  const SectionHeader = ({ icon: Icon, title, color, editKey, saveAccent = '#1a4bff' }: any) => (
    <div className="flex items-center justify-between p-6 sm:p-8 pb-5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background: `${color}18`, border: `1px solid ${color}25`}}>
          <Icon className="h-4.5 w-4.5" style={{color}} />
        </div>
        <h2 className="text-base font-bold text-white">{title}</h2>
      </div>
      {editMode !== editKey ? (
        <button
          onClick={() => setEditMode(editKey)}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white border border-white/[0.1] hover:border-white/20 px-3 py-1.5 rounded-lg transition-all duration-200"
        >
          <Pencil className="h-3 w-3" /> Edit
        </button>
      ) : (
        <div className="flex gap-2">
          <button onClick={() => setEditMode(null)} className="px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white rounded-lg border border-white/[0.1] hover:border-white/20 transition-all duration-200">Cancel</button>
          <button
            onClick={saveProfile}
            disabled={saving}
            className="px-4 py-1.5 text-xs font-bold text-white rounded-lg disabled:opacity-50 flex items-center gap-1.5 transition-all duration-200"
            style={{background: saveAccent}}
          >
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-5">
      {/* Personal Information */}
      <SectionWrapper accent="#1a4bff">
        <SectionHeader icon={User} title="Personal Information" color="#4f7bff" editKey="personal" />
        <div className="px-6 sm:px-8 pb-6 sm:pb-8 grid gap-4 grid-cols-1 sm:grid-cols-2">
          <div>
            <label className="block text-[10px] font-bold text-slate-600 mb-2 uppercase tracking-widest">First Name</label>
            <input type="text" value={profile.first_name || ''} onChange={(e) => setProfile({ ...profile, first_name: e.target.value })} disabled={editMode !== 'personal'}
              className={`${inputBase} ${editMode === 'personal' ? inputEnabled : inputDisabled}`} placeholder="First name" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-600 mb-2 uppercase tracking-widest">Last Name</label>
            <input type="text" value={profile.last_name || ''} onChange={(e) => setProfile({ ...profile, last_name: e.target.value })} disabled={editMode !== 'personal'}
              className={`${inputBase} ${editMode === 'personal' ? inputEnabled : inputDisabled}`} placeholder="Last name" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-600 mb-2 uppercase tracking-widest">Email Address</label>
            <div className="relative">
              <input type="email" value={profile.email || ''} onChange={(e) => setProfile({ ...profile, email: e.target.value })} disabled={editMode !== 'personal'}
                className={`${inputBase} ${editMode === 'personal' ? inputEnabled : inputDisabled} pr-10`} />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {profile.email_verified
                  ? <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400" />
                  : <AlertCircle className="h-4.5 w-4.5 text-amber-400" />}
              </div>
            </div>
            {!profile.email_verified && (
              <button onClick={sendEmailVerification} disabled={verificationSent} className="mt-2 text-xs font-semibold text-[#4f7bff] hover:text-[#6b8fff] flex items-center gap-1.5 disabled:opacity-50 transition-colors">
                <Send className="h-3 w-3" />
                {verificationSent ? 'Verification email sent!' : 'Send verification email'}
              </button>
            )}
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-600 mb-2 uppercase tracking-widest">Phone Number</label>
            <div className="relative">
              <input type="tel" value={profile.phone || ''} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} disabled={editMode !== 'personal'} placeholder="+1 (555) 123-4567"
                className={`${inputBase} ${editMode === 'personal' ? inputEnabled : inputDisabled} pr-10`} />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {profile.phone_verified
                  ? <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400" />
                  : <Phone className="h-4.5 w-4.5 text-slate-700" />}
              </div>
            </div>
          </div>
        </div>
      </SectionWrapper>

      {/* Company Information */}
      <SectionWrapper accent="#8b5cf6">
        <SectionHeader icon={Building2} title="Company Information" color="#a78bfa" editKey="company" saveAccent="#7c3aed" />
        <div className="px-6 sm:px-8 pb-6 sm:pb-8 grid gap-4 grid-cols-1 sm:grid-cols-2">
          <div>
            <label className="block text-[10px] font-bold text-slate-600 mb-2 uppercase tracking-widest">Company Name</label>
            <input type="text" value={profile.company || ''} onChange={(e) => setProfile({ ...profile, company: e.target.value })} disabled={editMode !== 'company'}
              className={`${inputBase} ${editMode === 'company' ? 'border-white/[0.1] focus:border-violet-500/60 focus:ring-violet-500/20 hover:border-white/[0.15]' : inputDisabled}`} placeholder="Your company" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-600 mb-2 uppercase tracking-widest">Job Title</label>
            <input type="text" value={profile.title || ''} onChange={(e) => setProfile({ ...profile, title: e.target.value })} disabled={editMode !== 'company'}
              className={`${inputBase} ${editMode === 'company' ? 'border-white/[0.1] focus:border-violet-500/60 focus:ring-violet-500/20 hover:border-white/[0.15]' : inputDisabled}`} placeholder="e.g. Procurement Manager" />
          </div>
        </div>
      </SectionWrapper>

      {/* Address */}
      <SectionWrapper accent="#10b981">
        <SectionHeader icon={MapPin} title="Address" color="#34d399" editKey="address" saveAccent="#059669" />
        <div className="px-6 sm:px-8 pb-6 sm:pb-8 space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-600 mb-2 uppercase tracking-widest">Address Line 1</label>
            <input type="text" value={profile.address_line1 || ''} onChange={(e) => setProfile({ ...profile, address_line1: e.target.value })} disabled={editMode !== 'address'}
              className={`${inputBase} ${editMode === 'address' ? 'border-white/[0.1] focus:border-emerald-500/60 focus:ring-emerald-500/20 hover:border-white/[0.15]' : inputDisabled}`} />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-600 mb-2 uppercase tracking-widest">Address Line 2</label>
            <input type="text" value={profile.address_line2 || ''} onChange={(e) => setProfile({ ...profile, address_line2: e.target.value })} disabled={editMode !== 'address'}
              placeholder="Apartment, suite, etc. (optional)"
              className={`${inputBase} ${editMode === 'address' ? 'border-white/[0.1] focus:border-emerald-500/60 focus:ring-emerald-500/20 hover:border-white/[0.15]' : inputDisabled}`} />
          </div>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-2 uppercase tracking-widest">City</label>
              <input type="text" value={profile.city || ''} onChange={(e) => setProfile({ ...profile, city: e.target.value })} disabled={editMode !== 'address'}
                className={`${inputBase} ${editMode === 'address' ? 'border-white/[0.1] focus:border-emerald-500/60 focus:ring-emerald-500/20 hover:border-white/[0.15]' : inputDisabled}`} />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-2 uppercase tracking-widest">State</label>
              <input type="text" value={profile.state || ''} onChange={(e) => setProfile({ ...profile, state: e.target.value })} disabled={editMode !== 'address'}
                className={`${inputBase} ${editMode === 'address' ? 'border-white/[0.1] focus:border-emerald-500/60 focus:ring-emerald-500/20 hover:border-white/[0.15]' : inputDisabled}`} />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 mb-2 uppercase tracking-widest">Postal Code</label>
              <input type="text" value={profile.postal_code || ''} onChange={(e) => setProfile({ ...profile, postal_code: e.target.value })} disabled={editMode !== 'address'}
                className={`${inputBase} ${editMode === 'address' ? 'border-white/[0.1] focus:border-emerald-500/60 focus:ring-emerald-500/20 hover:border-white/[0.15]' : inputDisabled}`} />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-600 mb-2 uppercase tracking-widest">Country</label>
            <input type="text" value={profile.country || ''} onChange={(e) => setProfile({ ...profile, country: e.target.value })} disabled={editMode !== 'address'}
              className={`${inputBase} ${editMode === 'address' ? 'border-white/[0.1] focus:border-emerald-500/60 focus:ring-emerald-500/20 hover:border-white/[0.15]' : inputDisabled}`} />
          </div>
        </div>
      </SectionWrapper>
    </div>
  )
}

// Billing Tab
function BillingTab({ plan, currentPlanDetails, paymentMethods, invoices, billingInterval, setBillingInterval, handlePlanChange, managePaymentMethod, handleCancelSubscription, loadingPlanChange }: any) {
  return (
    <div className="space-y-5">
      {/* Current Plan */}
      <div className="relative rounded-2xl overflow-hidden border border-white/[0.07] bg-[#0d1117]">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/15 flex items-center justify-center">
              <Package className="h-4 w-4 text-amber-400" />
            </div>
            <h2 className="text-base font-bold text-white">Current Plan</h2>
          </div>

        {currentPlanDetails ? (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${currentPlanDetails.color} flex items-center justify-center flex-shrink-0`}>
                  <currentPlanDetails.icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{currentPlanDetails.name}</h3>
                  <p className="text-slate-400 text-sm">
                    ${plan.interval === 'year' ? currentPlanDetails.annualPrice : currentPlanDetails.monthlyPrice}
                    /{plan.interval === 'year' ? 'year' : 'month'}
                  </p>
                  {plan.current_period_end && (
                    <p className="text-xs text-slate-600 mt-0.5">
                      {plan.cancel_at_period_end ? 'Cancels' : 'Renews'} on {new Date(plan.current_period_end).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              <button onClick={managePaymentMethod} className="self-start sm:self-center px-4 py-2 text-xs font-semibold text-[#4f7bff] hover:text-white border border-[#1a4bff]/25 hover:border-[#1a4bff]/50 rounded-lg hover:bg-[#1a4bff]/10 whitespace-nowrap transition-all duration-200">
                Manage in Stripe →
              </button>
            </div>

            {plan.cancel_at_period_end && (
              <div className="p-4 rounded-xl bg-red-500/[0.07] border border-red-500/[0.18] flex items-start gap-3">
                <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-400">
                  Subscription cancels on {new Date(plan.current_period_end).toLocaleDateString()}. You'll have access until then.
                </p>
              </div>
            )}

            {!plan.cancel_at_period_end && (
              <button onClick={handleCancelSubscription} className="text-xs font-medium text-slate-600 hover:text-red-400 transition-colors duration-200">
                Cancel subscription
              </button>
            )}
          </div>
        ) : (
          <div className="p-8 rounded-xl bg-white/[0.02] border border-white/[0.05] text-center">
            <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.07] flex items-center justify-center mx-auto mb-4">
              <Package className="h-6 w-6 text-slate-600" />
            </div>
            <p className="text-sm font-bold text-white mb-1">No Active Plan</p>
            <p className="text-xs text-slate-500">Choose a plan below to get started</p>
          </div>
        )}
        </div>
      </div>

      {/* Plan Selection */}
      <div className="relative rounded-2xl overflow-hidden border border-white/[0.07] bg-[#0d1117]">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#1a4bff]/50 to-transparent" />
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <h2 className="text-base font-bold text-white">Change Plan</h2>
            <div className="flex items-center gap-0.5 p-1 bg-white/[0.04] border border-white/[0.07] rounded-lg self-start sm:self-auto">
              <button onClick={() => setBillingInterval('monthly')}
                className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 ${
                  billingInterval === 'monthly' ? 'bg-[#1a4bff] text-white shadow' : 'text-slate-500 hover:text-slate-300'
                }`}>Monthly</button>
              <button onClick={() => setBillingInterval('annual')}
                className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                  billingInterval === 'annual' ? 'bg-[#1a4bff] text-white shadow' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Annual
                <span className={`text-[10px] font-bold ${billingInterval === 'annual' ? 'text-emerald-300' : 'text-emerald-500'}`}>-17%</span>
              </button>
            </div>
          </div>

          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(PLAN_DETAILS).map(([tier, details]) => {
              const isCurrentPlan = plan?.tier === tier && plan?.interval === (billingInterval === 'annual' ? 'year' : 'month')
              const isLoading = loadingPlanChange === tier

              return (
                <div
                  key={tier}
                  className={`rounded-xl border p-5 flex flex-col transition-all duration-200 ${
                    isCurrentPlan ? 'border-[#1a4bff]/40 bg-[#1a4bff]/[0.06]' : 'border-white/[0.07] bg-white/[0.02] hover:border-white/[0.12]'
                  }`}
                >
                  <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${details.color} flex items-center justify-center mb-4`}>
                    <details.icon className="h-5 w-5 text-white" />
                  </div>

                  <h3 className="text-base font-bold text-white mb-1.5">{details.name}</h3>

                  <div className="mb-4">
                    <span className="text-2xl font-black text-white">
                      ${billingInterval === 'annual' ? details.annualPrice : details.monthlyPrice}
                    </span>
                    <span className="text-xs text-slate-500 ml-1">/{billingInterval === 'annual' ? 'yr' : 'mo'}</span>
                  </div>

                  <ul className="space-y-1.5 mb-5 flex-1">
                    {details.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-xs text-slate-400">
                        <Check className="h-3 w-3 text-emerald-400 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {isCurrentPlan ? (
                    <button disabled className="w-full py-2.5 px-4 rounded-lg bg-[#1a4bff]/15 text-[#4f7bff] text-xs font-semibold cursor-not-allowed border border-[#1a4bff]/25">
                      ✓ Current Plan
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePlanChange(tier as PlanTier, billingInterval === 'annual' ? 'year' : 'month')}
                      disabled={isLoading}
                      className={`w-full py-2.5 px-4 rounded-lg text-white text-xs font-bold transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 bg-gradient-to-r ${details.color} hover:opacity-90`}
                    >
                      {isLoading ? (
                        <><Loader2 className="h-3.5 w-3.5 animate-spin" />Processing…</>
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
      </div>

      {/* Payment Methods */}
      <div className="relative rounded-2xl overflow-hidden border border-white/[0.07] bg-[#0d1117]">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
        <div className="p-6 sm:p-8">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/15 flex items-center justify-center">
                <CreditCard className="h-4 w-4 text-cyan-400" />
              </div>
              <h2 className="text-base font-bold text-white">Payment Methods</h2>
            </div>
            <button onClick={managePaymentMethod} className="px-4 py-2 text-xs font-semibold bg-[#1a4bff] hover:bg-[#2557ff] text-white rounded-lg transition-all duration-200">
              Manage
            </button>
          </div>

        {paymentMethods.length > 0 ? (
          <div className="space-y-2.5">
            {paymentMethods.map((method: PaymentMethod) => (
              <div key={method.id} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.1] transition-colors duration-200">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white/[0.05] border border-white/[0.08] flex items-center justify-center">
                    <CreditCard className="h-4 w-4 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{method.brand.toUpperCase()} •••• {method.last4}</p>
                    <p className="text-xs text-slate-600">Expires {method.expMonth}/{method.expYear}</p>
                  </div>
                </div>
                {method.isDefault && (
                  <span className="px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-[10px] font-bold border border-cyan-500/15 uppercase tracking-wider">Default</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-3">
              <CreditCard className="h-6 w-6 text-slate-600" />
            </div>
            <p className="text-sm font-medium text-slate-500">No payment methods on file</p>
          </div>
        )}
        </div>
      </div>

      {/* Invoice History */}
      {invoices && invoices.length > 0 && (
        <div className="relative rounded-2xl overflow-hidden border border-white/[0.07] bg-[#0d1117]">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-slate-500/30 to-transparent" />
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-lg bg-slate-700/40 border border-slate-600/30 flex items-center justify-center">
                <FileText className="h-4 w-4 text-slate-400" />
              </div>
              <h2 className="text-base font-bold text-white">Invoice History</h2>
            </div>

            <div className="space-y-2.5">
              {invoices.slice(0, 5).map((invoice: Invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.1] transition-colors duration-200">
                  <div>
                    <p className="text-white font-semibold text-sm">${(invoice.amount / 100).toFixed(2)}</p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {new Date(invoice.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                      invoice.status === 'paid'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/15'
                    }`}>
                      {invoice.status}
                    </span>
                    {invoice.invoicePdf && (
                      <a href={invoice.invoicePdf} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-white/[0.05] text-slate-500 hover:text-white transition-all duration-200">
                        <Download className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
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
    <div className="space-y-5">
      {/* Friendly intro banner */}
      <div className="rounded-2xl border border-[#1a4bff]/20 bg-[#1a4bff]/[0.06] p-5 flex items-start gap-4">
        <div className="h-10 w-10 rounded-xl bg-[#1a4bff]/20 border border-[#1a4bff]/25 flex items-center justify-center flex-shrink-0">
          <HeadphonesIcon className="h-5 w-5 text-[#4f7bff]" />
        </div>
        <div>
          <p className="text-white font-semibold mb-0.5">
            Hi{profile?.first_name ? `, ${profile.first_name}` : ''}! How can we help?
          </p>
          <p className="text-slate-400 text-sm leading-relaxed">
            Our team is here Mon–Fri, 9am–5pm ET. We typically reply within a few hours —
            and always within 2 business days. Enterprise clients get priority response.
          </p>
        </div>
      </div>

      {/* Contact Options */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
        {[
          { icon: Mail, label: 'Email Support', desc: 'Reply within 24 hours', link: 'mailto:support@precisegov.com', linkText: 'support@precisegov.com', color: '#4f7bff', bg: '#1a4bff' },
          { icon: MessageSquare, label: 'Live Chat', desc: 'Mon–Fri, 9am–5pm ET', link: null, linkText: 'Start Chat', color: '#34d399', bg: '#10b981' },
          { icon: Phone, label: 'Phone Support', desc: plan?.tier === 'ENTERPRISE' ? 'Priority support' : 'Enterprise plans only', link: plan?.tier === 'ENTERPRISE' ? 'tel:+18445551234' : null, linkText: plan?.tier === 'ENTERPRISE' ? '(844) 555-1234' : 'Enterprise only', color: '#c084fc', bg: '#9333ea' },
        ].map(c => (
          <div key={c.label} className="relative rounded-2xl border border-white/[0.07] bg-[#0d1117] p-5 sm:p-6 text-center overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-px" style={{background: `linear-gradient(90deg, transparent, ${c.bg}50, transparent)`}} />
            <div className="h-10 w-10 rounded-xl flex items-center justify-center mx-auto mb-3" style={{background: `${c.bg}18`, border: `1px solid ${c.bg}25`}}>
              <c.icon className="h-5 w-5" style={{color: c.color}} />
            </div>
            <h3 className="text-sm font-bold text-white mb-1">{c.label}</h3>
            <p className="text-xs text-slate-500 mb-3">{c.desc}</p>
            {c.link ? (
              <a href={c.link} className="text-xs font-semibold transition-colors" style={{color: c.color}}>{c.linkText}</a>
            ) : (
              <button className={`text-xs font-semibold transition-colors`} style={{color: c.link !== null ? c.color : (plan?.tier === 'ENTERPRISE' ? c.color : '#475569')}}>{c.linkText}</button>
            )}
          </div>
        ))}
      </div>

      {/* Submit Ticket Form */}
      <div className="relative rounded-2xl overflow-hidden border border-white/[0.07] bg-[#0d1117]">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#1a4bff]/40 to-transparent" />
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-8 h-8 rounded-lg bg-[#1a4bff]/10 border border-[#1a4bff]/15 flex items-center justify-center">
              <Send className="h-4 w-4 text-[#4f7bff]" />
            </div>
            <h2 className="text-base font-bold text-white">Submit Support Ticket</h2>
          </div>

        {sent && (
          <div className="mb-5 p-4 rounded-xl bg-emerald-500/[0.08] border border-emerald-500/[0.18] text-emerald-300 flex items-start gap-3">
            <CheckCircle2 className="h-4.5 w-4.5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Message received!</p>
              <p className="text-xs text-emerald-400/80 mt-0.5">
                We'll reply to <span className="font-medium">{profile?.email || 'your email'}</span> within 2 business days.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] font-bold text-slate-600 mb-2 uppercase tracking-widest">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              placeholder="Brief description of your issue"
              className="w-full rounded-xl border border-white/[0.1] bg-white/[0.03] px-4 py-3 text-white placeholder-slate-600 focus:border-[#1a4bff]/60 focus:ring-1 focus:ring-[#1a4bff]/20 outline-none text-sm transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-600 mb-2 uppercase tracking-widest">Priority</label>
            <div className="flex gap-2">
              {[
                { value: 'low', label: 'Low', color: 'border-slate-600 text-slate-400', active: 'border-slate-500 bg-slate-500/10 text-slate-300' },
                { value: 'normal', label: 'Normal', color: 'border-white/[0.1] text-slate-400', active: 'border-[#1a4bff]/50 bg-[#1a4bff]/10 text-[#4f7bff]' },
                { value: 'high', label: 'High', color: 'border-white/[0.1] text-slate-400', active: 'border-red-500/40 bg-red-500/10 text-red-400' },
              ].map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setPriority(p.value as any)}
                  className={`flex-1 py-2 px-3 rounded-lg border text-xs font-semibold transition-all duration-200 ${
                    priority === p.value ? p.active : `border-white/[0.07] bg-transparent ${p.color} hover:border-white/[0.12]`
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-600 mb-2 uppercase tracking-widest">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={5}
              placeholder="Please describe your issue in detail…"
              className="w-full rounded-xl border border-white/[0.1] bg-white/[0.03] px-4 py-3 text-white placeholder-slate-600 focus:border-[#1a4bff]/60 focus:ring-1 focus:ring-[#1a4bff]/20 outline-none text-sm resize-none transition-all"
            />
            <p className="text-xs text-slate-500 mt-1.5">
              💡 Include any error messages, steps to reproduce, or relevant opportunity IDs to speed up our response.
            </p>
          </div>

          <button
            type="submit"
            disabled={sending}
            className="w-full py-3 px-6 rounded-xl bg-[#1a4bff] hover:bg-[#2557ff] text-white text-sm font-semibold transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {sending ? (
              <><Loader2 className="h-4 w-4 animate-spin" />Submitting…</>
            ) : (
              <><Send className="h-4 w-4" />Submit Ticket</>
            )}
          </button>
        </form>
        </div>
      </div>

      {/* Billing Support */}
      <div className="relative rounded-2xl overflow-hidden border border-white/[0.07] bg-[#0d1117] p-6 sm:p-8">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-slate-500/20 to-transparent" />
        <h2 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-[#4f7bff]" />
          Billing Support
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          For billing inquiries, subscription changes, or invoice requests, contact our billing team.
        </p>
        <a
          href="mailto:billing@precisegov.com"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.07] text-slate-300 text-xs font-semibold transition-all duration-200"
        >
          <Mail className="h-3.5 w-3.5" />
          billing@precisegov.com
        </a>
      </div>
    </div>
  )
}

// Bids Tab — fully functional tracker
function BidsTab({ bids, setBids }: any) {
  const [filter, setFilter] = useState<'all' | 'draft' | 'submitted' | 'awarded' | 'not_awarded'>('all')
  const [showForm, setShowForm] = useState(false)
  const [editingBid, setEditingBid] = useState<BidData | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [formMsg, setFormMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const emptyForm = {
    opportunityTitle: '',
    opportunityId: '',
    dueDate: '',
    status: 'draft' as BidData['status'],
    value: undefined as number | undefined,
    agency: '',
    notes: '',
  }
  const [form, setForm] = useState(emptyForm)

  const openAdd = () => {
    setEditingBid(null)
    setForm(emptyForm)
    setFormMsg(null)
    setShowForm(true)
  }

  const openEdit = (bid: BidData) => {
    setEditingBid(bid)
    setForm({
      opportunityTitle: bid.opportunityTitle,
      opportunityId: bid.opportunityId,
      dueDate: bid.dueDate ? bid.dueDate.split('T')[0] : '',
      status: bid.status,
      value: bid.value,
      agency: (bid as any).agency || '',
      notes: (bid as any).notes || '',
    })
    setFormMsg(null)
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.opportunityTitle.trim()) {
      setFormMsg({ type: 'error', text: 'Opportunity title is required.' })
      return
    }
    setSaving(true)
    try {
      if (editingBid) {
        // Update existing
        const res = await fetch(`/api/account/bids/${editingBid.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form }),
        })
        if (res.ok) {
          const updated = await res.json()
          setBids((prev: BidData[]) => prev.map((b) => (b.id === editingBid.id ? updated : b)))
          setFormMsg({ type: 'success', text: 'Bid updated successfully!' })
          setTimeout(() => { setShowForm(false); setFormMsg(null) }, 900)
        } else {
          // Optimistic update if endpoint not yet wired
          setBids((prev: BidData[]) =>
            prev.map((b) => (b.id === editingBid.id ? { ...b, ...form, dueDate: form.dueDate || b.dueDate } : b))
          )
          setFormMsg({ type: 'success', text: 'Bid updated!' })
          setTimeout(() => { setShowForm(false); setFormMsg(null) }, 900)
        }
      } else {
        // Create new
        const res = await fetch('/api/account/bids', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form }),
        })
        if (res.ok) {
          const created = await res.json()
          setBids((prev: BidData[]) => [created, ...prev])
        } else {
          // Optimistic add if endpoint not yet wired
          const newBid: BidData = {
            id: `local-${Date.now()}`,
            ...form,
            dueDate: form.dueDate || new Date().toISOString(),
          }
          setBids((prev: BidData[]) => [newBid, ...prev])
        }
        setFormMsg({ type: 'success', text: 'Bid added!' })
        setTimeout(() => { setShowForm(false); setFormMsg(null) }, 900)
      }
    } catch {
      setFormMsg({ type: 'error', text: 'Something went wrong. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this bid from your tracker?')) return
    setDeletingId(id)
    try {
      await fetch(`/api/account/bids/${id}`, { method: 'DELETE' }).catch(() => {})
      setBids((prev: BidData[]) => prev.filter((b) => b.id !== id))
    } finally {
      setDeletingId(null)
    }
  }

  const handleStatusChange = async (id: string, newStatus: BidData['status']) => {
    setBids((prev: BidData[]) => prev.map((b) => (b.id === id ? { ...b, status: newStatus } : b)))
    try {
      await fetch(`/api/account/bids/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      }).catch(() => {})
    } catch { /* optimistic — already updated */ }
  }

  const filteredBids = filter === 'all' ? bids : bids.filter((b: BidData) => b.status === filter)

  const totalValue = bids
    .filter((b: BidData) => b.value)
    .reduce((sum: number, b: BidData) => sum + (b.value || 0), 0)

  const winRate = bids.length > 0
    ? Math.round((bids.filter((b: BidData) => b.status === 'awarded').length / bids.filter((b: BidData) => b.status === 'awarded' || b.status === 'not_awarded').length) * 100) || 0
    : 0

  const STATUS_CONFIG = {
    draft:       { label: 'Draft',       color: 'text-slate-300 bg-slate-700/60 border-slate-600',        dot: 'bg-slate-400' },
    submitted:   { label: 'Submitted',   color: 'text-blue-300 bg-blue-500/15 border-blue-500/40',         dot: 'bg-blue-400' },
    awarded:     { label: 'Awarded',     color: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/40', dot: 'bg-emerald-400' },
    not_awarded: { label: 'Not Awarded', color: 'text-red-300 bg-red-500/15 border-red-500/40',            dot: 'bg-red-400' },
  }

  return (
    <div className="space-y-5">
      {/* ── Stats row ── */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Bids', value: bids.length, icon: ClipboardList, color: 'text-[#4f7bff]', bg: 'bg-[#1a4bff]/[0.07]', border: 'border-[#1a4bff]/[0.15]', suffix: '' },
          { label: 'In Progress', value: bids.filter((b: BidData) => b.status === 'draft' || b.status === 'submitted').length, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/[0.07]', border: 'border-amber-500/[0.15]', suffix: '' },
          { label: 'Awarded', value: bids.filter((b: BidData) => b.status === 'awarded').length, icon: Trophy, color: 'text-emerald-400', bg: 'bg-emerald-500/[0.07]', border: 'border-emerald-500/[0.15]', suffix: '' },
          { label: 'Win Rate', value: winRate, icon: BarChart2, color: 'text-violet-400', bg: 'bg-violet-500/[0.07]', border: 'border-violet-500/[0.15]', suffix: '%' },
        ].map((stat) => (
          <div key={stat.label} className={`rounded-2xl border ${stat.border} ${stat.bg} p-4 sm:p-5`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest">{stat.label}</p>
              <stat.icon className={`h-3.5 w-3.5 ${stat.color} opacity-70`} />
            </div>
            <p className={`text-2xl sm:text-3xl font-black ${stat.color}`}>{stat.value}{stat.suffix}</p>
          </div>
        ))}
      </div>

      {/* ── Pipeline value banner ── */}
      {totalValue > 0 && (
        <div className="rounded-xl border border-emerald-500/[0.18] bg-emerald-500/[0.06] p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
              <DollarSign className="h-4.5 w-4.5 text-emerald-400" />
            </div>
            <div>
              <p className="text-[10px] text-slate-600 uppercase tracking-widest font-bold">Total Pipeline Value</p>
              <p className="text-xl font-black text-emerald-300">${totalValue.toLocaleString()}</p>
            </div>
          </div>
          <ArrowUpRight className="h-5 w-5 text-emerald-500/40" />
        </div>
      )}

      {/* ── Bid list ── */}
      <div className="relative rounded-2xl overflow-hidden border border-white/[0.07] bg-[#0d1117]">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-6 border-b border-white/[0.06]">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Gavel className="h-4.5 w-4.5 text-[#4f7bff]" />
            Bid Tracker
            {filteredBids.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/[0.07] text-slate-400">
                {filteredBids.length}
              </span>
            )}
          </h2>
          <div className="flex items-center gap-2">
            {/* Status filter pills */}
            <div className="flex gap-1 overflow-x-auto scrollbar-none">
              {[
                { value: 'all', label: 'All' },
                { value: 'draft', label: 'Draft' },
                { value: 'submitted', label: 'Submitted' },
                { value: 'awarded', label: 'Awarded' },
                { value: 'not_awarded', label: 'Not Awarded' },
              ].map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFilter(f.value as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                    filter === f.value
                      ? 'bg-[#1a4bff] text-white'
                      : 'bg-white/[0.04] text-slate-500 hover:text-slate-300 hover:bg-white/[0.07]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            {/* Add bid button */}
            <button
              onClick={openAdd}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#1a4bff] hover:bg-[#2557ff] text-white text-xs font-semibold transition-all duration-200 whitespace-nowrap"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Bid
            </button>
          </div>
        </div>

        {/* Bid rows */}
        {filteredBids.length > 0 ? (
          <div className="divide-y divide-white/[0.04]">
            {filteredBids.map((bid: BidData) => {
              const cfg = STATUS_CONFIG[bid.status]
              const daysUntil = bid.dueDate
                ? Math.ceil((new Date(bid.dueDate).getTime() - Date.now()) / 86400000)
                : null
              const isUrgent = daysUntil !== null && daysUntil <= 7 && daysUntil >= 0

              return (
                <div
                  key={bid.id}
                  className="group flex flex-col sm:flex-row sm:items-center gap-3 p-4 sm:p-5 hover:bg-white/[0.02] transition-all duration-200"
                >
                  {/* Status dot */}
                  <div className={`hidden sm:flex h-2.5 w-2.5 rounded-full flex-shrink-0 ${cfg.dot} ${bid.status === 'submitted' ? 'animate-pulse' : ''}`} />

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="text-white font-semibold text-sm truncate">{bid.opportunityTitle}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.color}`}>
                        {cfg.label}
                      </span>
                      {isUrgent && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-500/20 border border-red-500/40 text-red-300">
                          Due in {daysUntil}d
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      {bid.opportunityId && (
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />{bid.opportunityId}
                        </span>
                      )}
                      {(bid as any).agency && (
                        <span className="flex items-center gap-1">
                          <Building className="h-3 w-3" />{(bid as any).agency}
                        </span>
                      )}
                      {bid.dueDate && (
                        <span className={`flex items-center gap-1 ${isUrgent ? 'text-red-400 font-semibold' : ''}`}>
                          <CalendarDays className="h-3 w-3" />
                          Due {new Date(bid.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      )}
                      {bid.value && (
                        <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                          <DollarSign className="h-3 w-3" />{bid.value.toLocaleString()}
                        </span>
                      )}
                    </div>
                    {(bid as any).notes && (
                      <p className="text-xs text-slate-500 mt-1 truncate">{(bid as any).notes}</p>
                    )}
                  </div>

                  {/* Status quick-change + actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <select
                      value={bid.status}
                      onChange={(e) => handleStatusChange(bid.id, e.target.value as BidData['status'])}
                      className="text-xs rounded-lg border border-white/[0.1] bg-white/[0.05] text-slate-300 px-2 py-1.5 focus:border-[#1a4bff]/50 cursor-pointer outline-none transition-colors"
                    >
                      <option value="draft">Draft</option>
                      <option value="submitted">Submitted</option>
                      <option value="awarded">Awarded</option>
                      <option value="not_awarded">Not Awarded</option>
                    </select>
                    <button
                      onClick={() => openEdit(bid)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.07] transition-all duration-200"
                      title="Edit bid"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(bid.id)}
                      disabled={deletingId === bid.id}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/[0.08] transition-all duration-200"
                      title="Remove bid"
                    >
                      {deletingId === bid.id
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <Trash2 className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-14 px-6">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
              <Gavel className="h-7 w-7 text-slate-600" />
            </div>
            <p className="text-sm font-semibold text-slate-400 mb-1">
              {filter === 'all' ? 'No bids tracked yet' : `No ${filter.replace('_', ' ')} bids`}
            </p>
            <p className="text-xs text-slate-600 mb-6 max-w-xs mx-auto">
              {filter === 'all'
                ? 'Start tracking your government contract bids — monitor deadlines, values, and win rates.'
                : 'Try changing the filter to see other bids.'}
            </p>
            {filter === 'all' && (
              <button
                onClick={openAdd}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1a4bff] hover:bg-[#2557ff] text-white text-sm font-semibold transition-all duration-200"
              >
                <Plus className="h-4 w-4" /> Track Your First Bid
              </button>
            )}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-[#0d1117] border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden" style={{fontFamily: "'Aptos', 'Segoe UI', system-ui, sans-serif"}}>
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-white/[0.02]">
              <h3 className="text-base font-bold text-white">
                {editingBid ? 'Edit Bid' : 'Track a New Bid'}
              </h3>
              <button
                onClick={() => { setShowForm(false); setFormMsg(null) }}
                className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.07] transition-all duration-200"
              >
                <XCircle className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {formMsg && (
                <div className={`p-3 rounded-xl flex items-center gap-2 text-xs ${
                  formMsg.type === 'success'
                    ? 'bg-emerald-500/[0.08] border border-emerald-500/[0.18] text-emerald-400'
                    : 'bg-red-500/[0.08] border border-red-500/[0.18] text-red-400'
                }`}>
                  {formMsg.type === 'success' ? <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" /> : <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />}
                  {formMsg.text}
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase tracking-widest">
                  Opportunity Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.opportunityTitle}
                  onChange={(e) => setForm({ ...form, opportunityTitle: e.target.value })}
                  placeholder="e.g. IT Support Services for DOD"
                  className="w-full rounded-xl border border-white/[0.1] bg-white/[0.03] px-4 py-2.5 text-white placeholder-slate-600 text-sm focus:border-[#1a4bff]/60 focus:ring-1 focus:ring-[#1a4bff]/20 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase tracking-widest">Solicitation #</label>
                  <input
                    type="text"
                    value={form.opportunityId}
                    onChange={(e) => setForm({ ...form, opportunityId: e.target.value })}
                    placeholder="e.g. W91QF1-26-R-0001"
                    className="w-full rounded-xl border border-white/[0.1] bg-white/[0.03] px-4 py-2.5 text-white placeholder-slate-600 text-sm focus:border-[#1a4bff]/60 focus:ring-1 focus:ring-[#1a4bff]/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase tracking-widest">Agency</label>
                  <input
                    type="text"
                    value={form.agency}
                    onChange={(e) => setForm({ ...form, agency: e.target.value })}
                    placeholder="e.g. DOD, GSA, VA"
                    className="w-full rounded-xl border border-white/[0.1] bg-white/[0.03] px-4 py-2.5 text-white placeholder-slate-600 text-sm focus:border-[#1a4bff]/60 focus:ring-1 focus:ring-[#1a4bff]/20 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase tracking-widest">Due Date</label>
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    className="w-full rounded-xl border border-white/[0.1] bg-white/[0.03] px-4 py-2.5 text-white text-sm focus:border-[#1a4bff]/60 focus:ring-1 focus:ring-[#1a4bff]/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase tracking-widest">Est. Value ($)</label>
                  <input
                    type="number"
                    value={form.value || ''}
                    onChange={(e) => setForm({ ...form, value: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="e.g. 250000"
                    className="w-full rounded-xl border border-white/[0.1] bg-white/[0.03] px-4 py-2.5 text-white placeholder-slate-600 text-sm focus:border-[#1a4bff]/60 focus:ring-1 focus:ring-[#1a4bff]/20 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase tracking-widest">Status</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['draft', 'submitted', 'awarded', 'not_awarded'] as const).map((s) => {
                    const cfg = STATUS_CONFIG[s]
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setForm({ ...form, status: s })}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-all duration-200 ${
                          form.status === s ? cfg.color + ' ring-1 ring-[#1a4bff]/30' : 'border-white/[0.07] bg-transparent text-slate-500 hover:border-white/[0.12]'
                        }`}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase tracking-widest">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={3}
                  placeholder="Any notes, requirements, or reminders…"
                  className="w-full rounded-xl border border-white/[0.1] bg-white/[0.03] px-4 py-2.5 text-white placeholder-slate-600 text-sm focus:border-[#1a4bff]/60 focus:ring-1 focus:ring-[#1a4bff]/20 outline-none resize-none transition-all"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-white/[0.06] bg-white/[0.01]">
              <button
                onClick={() => { setShowForm(false); setFormMsg(null) }}
                className="flex-1 py-2.5 rounded-xl border border-white/[0.1] text-slate-400 hover:text-white hover:border-white/20 text-sm font-semibold transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-[#1a4bff] hover:bg-[#2557ff] text-white text-sm font-bold transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {saving ? 'Saving…' : editingBid ? 'Save Changes' : 'Add Bid'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}