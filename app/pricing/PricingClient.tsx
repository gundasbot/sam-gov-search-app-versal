'use client'

import { useState, useEffect, Suspense, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  User, CreditCard, Shield, MapPin, Building2, Phone, Mail, AlertCircle, ExternalLink,
  Loader2, Download, FileText, Settings, Bell, Crown, ChevronRight, CheckCircle2, RefreshCw,
  HeadphonesIcon, MessageSquare, Gavel, TrendingUp, Package, Key, Send, XCircle, AlertTriangle,
  Check, Eye, EyeOff, Plus, Pencil, Trash2, CalendarDays, DollarSign, ClipboardList, Trophy,
  BarChart2, ArrowUpRight, Clock, Building, Camera, AtSign, PhoneCall, Link2, Lock, ShieldCheck, Upload,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

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
    <Suspense fallback={<LoadingPage />}>
      <AccountPageContent />
    </Suspense>
  )
}

function LoadingPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50" style={{ fontFamily: "'Aptos', 'Segoe UI', system-ui, sans-serif" }}>
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  )
}

function AccountPageContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('monthly')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

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

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login?callbackUrl=/account')
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') loadAccountData()
  }, [status])

  useEffect(() => {
    const success = searchParams.get('success')
    if (success) setMessage({ type: 'success', text: 'Payment successful! Billing updated.' })
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
      if (profileRes.ok) { const d = await profileRes.json(); setProfile(p => ({ ...p, ...d })) }
      if (planRes.ok) {
        const d = await planRes.json(); setPlan(d)
        if (d.interval) setBillingInterval(d.interval === 'year' ? 'annual' : 'monthly')
      }
      if (paymentsRes.ok) setPaymentMethods(await paymentsRes.json())
      if (invoicesRes.ok) { const d = await invoicesRes.json(); setInvoices(d.invoices || []) }
      if (usageRes.ok) setUsage(await usageRes.json())
      if (bidsRes.ok) setBids(await bidsRes.json())
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
      if (response.ok) { setMessage({ type: 'success', text: 'Profile updated' }); setEditMode(null) }
      else throw new Error('Failed')
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save' })
    } finally {
      setSaving(false)
    }
  }

  const sendEmailVerification = async () => {
    try {
      const response = await fetch('/api/account/verify-email', { method: 'POST' })
      if (response.ok) {
        setVerificationSent(true)
        setMessage({ type: 'success', text: 'Verification email sent' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to send verification email' })
    }
  }

  const managePaymentMethod = async () => {
    try {
      setSaving(true)
      const res = await fetch('/api/stripe/portal', { method: 'POST', headers: { 'Content-Type': 'application/json' } })
      if (res.ok) {
        const { url } = await res.json()
        window.open(url, '_blank', 'noopener,noreferrer')
      } else {
        const data = await res.json()
        throw new Error(data.error || 'Failed')
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to open billing portal' })
    } finally {
      setSaving(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!plan?.subscription_id) return
    if (!confirm('Cancel subscription?')) return
    try {
      setSaving(true)
      const res = await fetch('/api/stripe/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription_id: plan.subscription_id }),
      })
      if (res.ok) {
        setMessage({ type: 'success', text: 'Subscription cancelled' })
        await loadAccountData()
      } else throw new Error('Failed')
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to cancel' })
    } finally {
      setSaving(false)
    }
  }

  const handlePlanChange = async (newTier: PlanTier, interval: 'month' | 'year') => {
    if (!plan || !session) return
    const requestedInterval = interval === 'year' ? 'annual' : 'monthly'
    if (plan.tier === newTier && plan.interval === interval) {
      setMessage({ type: 'error', text: 'Already on this plan' })
      return
    }
    try {
      setLoadingPlanChange(newTier)
      if (plan.tier === newTier && plan.tier !== 'NONE') {
        // Changing billing interval only
        const res = await fetch('/api/stripe/change-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tier: newTier, interval: requestedInterval }),
        })
        if (!res.ok) throw new Error('Failed to change interval')
        const data = await res.json()
        setMessage({ type: 'success', text: data.message || 'Billing interval updated' })
        await loadAccountData()
      } else {
        // Creating checkout for new plan - let backend resolve price IDs
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
          const errData = await res.json()
          throw new Error(errData.error || 'Failed to create checkout')
        }
        const { url } = await res.json()
        if (url) window.location.href = url
        else throw new Error('No checkout URL returned')
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update plan' })
    } finally {
      setLoadingPlanChange(null)
    }
  }

  if (status === 'loading' || loading) {
    return <LoadingPage />
  }

  const currentPlanDetails = plan?.tier && plan.tier !== 'NONE' ? PLAN_DETAILS[plan.tier] : null

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: "'Aptos', 'Segoe UI', system-ui, sans-serif" }}>
      {/* Header */}
      <div className="border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-end gap-6">
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-lg overflow-hidden bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-sm">
                {profile.profile_photo ? (
                  <img src={profile.profile_photo} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-bold text-white">
                    {(profile.first_name?.[0] || 'U').toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">
                {profile.first_name && profile.last_name ? `${profile.first_name} ${profile.last_name}` : 'Account'}
              </h1>
              {currentPlanDetails && (
                <div className="flex flex-wrap items-center gap-3 mt-3">
                  <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold bg-gradient-to-r ${currentPlanDetails.color} text-white`}>
                    <currentPlanDetails.icon className="h-4 w-4" />
                    {currentPlanDetails.name}
                  </span>
                  {plan?.status === 'active' && (
                    <span className="px-3 py-1.5 rounded-full text-sm font-semibold bg-emerald-100 text-emerald-700">
                      Active
                    </span>
                  )}
                </div>
              )}
              {profile.company && <p className="text-slate-600 text-sm mt-2">{profile.company}</p>}
            </div>

            {/* Stats - responsive */}
            <div className="hidden lg:flex items-end gap-2">
              {[
                { label: 'Active Bids', value: bids.filter((b: BidData) => b.status === 'draft' || b.status === 'submitted').length, bg: 'bg-blue-50' },
                { label: 'Awarded', value: bids.filter((b: BidData) => b.status === 'awarded').length, bg: 'bg-emerald-50' },
              ].map((stat) => (
                <div key={stat.label} className={`text-center px-4 py-3 rounded-lg ${stat.bg} border border-slate-200`}>
                  <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                  <p className="text-xs text-slate-600 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <nav className="flex flex-wrap gap-1 mt-8 border-b border-slate-200">
            {[
              { id: 'overview', label: 'Overview', icon: TrendingUp },
              { id: 'profile', label: 'Profile', icon: User },
              { id: 'billing', label: 'Billing', icon: CreditCard },
              { id: 'support', label: 'Support', icon: HeadphonesIcon },
              { id: 'bids', label: 'Bids', icon: Gavel },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className={`px-4 py-3 rounded-lg flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {message.type === 'success' ? <CheckCircle2 className="h-5 w-5 flex-shrink-0" /> : <AlertCircle className="h-5 w-5 flex-shrink-0" />}
            <span className="text-sm font-medium flex-1">{message.text}</span>
            <button onClick={() => setMessage(null)} className="text-slate-500 hover:text-slate-700">
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <OverviewTab profile={profile} setProfile={setProfile} plan={plan} currentPlanDetails={currentPlanDetails}
            paymentMethods={paymentMethods} usage={usage} bids={bids} setActiveTab={setActiveTab} />
        )}
        {activeTab === 'profile' && (
          <ProfileTab profile={profile} setProfile={setProfile} editMode={editMode} setEditMode={setEditMode}
            saving={saving} saveProfile={saveProfile} sendEmailVerification={sendEmailVerification} verificationSent={verificationSent} />
        )}
        {activeTab === 'billing' && (
          <BillingTab plan={plan} currentPlanDetails={currentPlanDetails} paymentMethods={paymentMethods} invoices={invoices}
            billingInterval={billingInterval} setBillingInterval={setBillingInterval} handlePlanChange={handlePlanChange}
            managePaymentMethod={managePaymentMethod} handleCancelSubscription={handleCancelSubscription} loadingPlanChange={loadingPlanChange} />
        )}
        {activeTab === 'support' && <SupportTab profile={profile} plan={plan} />}
        {activeTab === 'bids' && <BidsTab bids={bids} setBids={setBids} />}
      </div>
    </div>
  )
}

// Tabs remain the same as ORIGINAL - only styling improved
function OverviewTab({ profile, setProfile, plan, currentPlanDetails, paymentMethods, usage, bids, setActiveTab }: any) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null)
  const activePhoto = pendingPhoto || profile.profile_photo

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoUploading(true)
    const reader = new FileReader()
    reader.onload = (ev) => {
      setPendingPhoto(ev.target?.result as string)
      setPhotoUploading(false)
    }
    reader.readAsDataURL(file)
  }

  const savePendingPhoto = () => {
    if (!pendingPhoto) return
    setProfile((prev: any) => ({ ...prev, profile_photo: pendingPhoto }))
    setPendingPhoto(null)
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid - Responsive */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Active Bids', value: bids.filter((b: BidData) => b.status === 'draft' || b.status === 'submitted').length },
          { label: 'Awarded', value: bids.filter((b: BidData) => b.status === 'awarded').length },
          { label: 'Plan', value: currentPlanDetails?.name || 'None' },
          { label: 'Email', value: profile.email_verified ? 'Verified' : 'Pending' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg border border-slate-200 p-5">
            <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
            <p className="text-sm text-slate-600 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center gap-6 mb-6">
          <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
            {activePhoto ? (
              <img src={activePhoto} alt="Profile" className="w-full h-full object-cover rounded-lg" />
            ) : (
              <span className="text-3xl font-bold text-white">{(profile.first_name?.[0] || 'U').toUpperCase()}</span>
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-900">Profile Photo</h3>
            <p className="text-sm text-slate-600 mt-1">Upload a professional photo</p>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {photoUploading ? 'Uploading...' : 'Upload Photo'}
            </button>
            {pendingPhoto && (
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={savePendingPhoto}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded"
                >
                  Save
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Usage */}
      {usage?.available && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Usage This Month</h3>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
            {[
              { label: 'Searches', current: usage.searches, limit: currentPlanDetails?.limits?.searches ?? -1 },
              { label: 'Exports', current: usage.exports, limit: currentPlanDetails?.limits?.exports ?? -1 },
              { label: 'Saved', current: usage.savedOpportunities, limit: currentPlanDetails?.limits?.savedOpportunities ?? -1 },
            ].map((item) => {
              const pct = item.limit === -1 ? 100 : Math.min((item.current / item.limit) * 100, 100)
              return (
                <div key={item.label}>
                  <p className="text-2xl font-bold text-slate-900">{item.current}</p>
                  <p className="text-xs text-slate-600 mt-1">{item.label}</p>
                  {item.limit !== -1 && (
                    <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600" style={{ width: `${pct}%` }} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function ProfileTab({ profile, setProfile, editMode, setEditMode, saving, saveProfile, sendEmailVerification, verificationSent }: any) {
  const inputClass = "w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 disabled:bg-slate-100 text-sm"

  return (
    <div className="space-y-4">
      {['Personal', 'Company', 'Address'].map((section) => (
        <div key={section} className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900">{section} Information</h3>
            {editMode !== section.toLowerCase() ? (
              <button onClick={() => setEditMode(section.toLowerCase())} className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => setEditMode(null)} className="text-sm text-slate-600 hover:text-slate-900">Cancel</button>
                <button onClick={saveProfile} disabled={saving} className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}
          </div>

          {section === 'Personal' && (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase">First Name</label>
                <input type="text" value={profile.first_name || ''} onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                  disabled={editMode !== 'personal'} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase">Last Name</label>
                <input type="text" value={profile.last_name || ''} onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                  disabled={editMode !== 'personal'} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase">Email</label>
                <div className="relative">
                  <input type="email" value={profile.email || ''} onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    disabled={editMode !== 'personal'} className={inputClass} />
                  {profile.email_verified && <CheckCircle2 className="absolute right-3 top-2.5 h-5 w-5 text-emerald-600" />}
                </div>
                {!profile.email_verified && (
                  <button onClick={sendEmailVerification} disabled={verificationSent} className="text-xs text-blue-600 hover:text-blue-700 mt-2 font-medium">
                    {verificationSent ? 'Sent' : 'Send verification'}
                  </button>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase">Phone</label>
                <input type="tel" value={profile.phone || ''} onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  disabled={editMode !== 'personal'} className={inputClass} />
              </div>
            </div>
          )}

          {section === 'Company' && (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase">Company</label>
                <input type="text" value={profile.company || ''} onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                  disabled={editMode !== 'company'} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase">Job Title</label>
                <input type="text" value={profile.title || ''} onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                  disabled={editMode !== 'company'} className={inputClass} />
              </div>
            </div>
          )}

          {section === 'Address' && (
            <div className="space-y-4">
              <input type="text" value={profile.address_line1 || ''} onChange={(e) => setProfile({ ...profile, address_line1: e.target.value })}
                disabled={editMode !== 'address'} placeholder="Street" className={inputClass} />
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                <input type="text" value={profile.city || ''} onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                  disabled={editMode !== 'address'} placeholder="City" className={inputClass} />
                <input type="text" value={profile.state || ''} onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                  disabled={editMode !== 'address'} placeholder="State" className={inputClass} />
                <input type="text" value={profile.postal_code || ''} onChange={(e) => setProfile({ ...profile, postal_code: e.target.value })}
                  disabled={editMode !== 'address'} placeholder="ZIP" className={inputClass} />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function BillingTab({ plan, currentPlanDetails, paymentMethods, invoices, billingInterval, setBillingInterval, handlePlanChange, managePaymentMethod, handleCancelSubscription, loadingPlanChange }: any) {
  const currentTier: keyof typeof PLAN_DETAILS | null = plan?.tier && plan.tier !== 'NONE' ? plan.tier : null

  return (
    <div className="space-y-6">
      {currentPlanDetails && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Current Plan</h3>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div>
              <p className="text-lg font-bold text-slate-900">{currentPlanDetails.name}</p>
              <p className="text-sm text-slate-600">${plan.interval === 'year' ? currentPlanDetails.annualPrice : currentPlanDetails.monthlyPrice}/{plan.interval === 'year' ? 'year' : 'month'}</p>
            </div>
            <button onClick={managePaymentMethod} className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-900 text-sm font-medium rounded-lg transition-colors">
              Manage in Stripe →
            </button>
          </div>
          {!plan.cancel_at_period_end && (
            <button onClick={handleCancelSubscription} className="mt-4 text-sm text-slate-600 hover:text-red-600 font-medium">
              Cancel subscription
            </button>
          )}
        </div>
      )}

      {/* Plan Selection - RESPONSIVE PILLS */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Change Plan</h3>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(PLAN_DETAILS).map(([tier, details]) => {
            const isCurrentMonthly = plan?.tier === tier && plan?.interval === 'month'
            const isCurrentAnnual = plan?.tier === tier && plan?.interval === 'year'
            return (
              <div key={tier} className="border border-slate-200 rounded-lg p-4">
                <h4 className="font-bold text-slate-900 mb-3">{details.name}</h4>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className={`p-2 rounded text-center ${isCurrentMonthly ? 'bg-blue-100 border border-blue-300' : 'bg-slate-50 border border-slate-200'}`}>
                    <p className="text-xs text-slate-600">Monthly</p>
                    <p className="font-bold text-slate-900">${details.monthlyPrice}</p>
                  </div>
                  <div className={`p-2 rounded text-center ${isCurrentAnnual ? 'bg-blue-100 border border-blue-300' : 'bg-slate-50 border border-slate-200'}`}>
                    <p className="text-xs text-slate-600">Annual</p>
                    <p className="font-bold text-slate-900">${details.annualPrice}</p>
                  </div>
                </div>
                <ul className="text-xs space-y-1 mb-4 text-slate-700">
                  {details.features.slice(0, 3).map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />{f}
                    </li>
                  ))}
                </ul>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handlePlanChange(tier as PlanTier, 'month')}
                    disabled={loadingPlanChange === tier || isCurrentMonthly}
                    className={`py-2 px-3 rounded text-xs font-medium transition-colors ${
                      isCurrentMonthly ? 'bg-slate-100 text-slate-600 cursor-default' : 'bg-blue-600 text-white hover:bg-blue-700'
                    } disabled:opacity-50`}
                  >
                    {isCurrentMonthly ? 'Current' : 'Monthly'}
                  </button>
                  <button
                    onClick={() => handlePlanChange(tier as PlanTier, 'year')}
                    disabled={loadingPlanChange === tier || isCurrentAnnual}
                    className={`py-2 px-3 rounded text-xs font-medium transition-colors ${
                      isCurrentAnnual ? 'bg-slate-100 text-slate-600 cursor-default' : 'bg-blue-600 text-white hover:bg-blue-700'
                    } disabled:opacity-50`}
                  >
                    {isCurrentAnnual ? 'Current' : 'Annual'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900">Payment Methods</h3>
          <button onClick={managePaymentMethod} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded font-medium">
            Manage
          </button>
        </div>
        {paymentMethods.length > 0 ? (
          <div className="space-y-2">
            {paymentMethods.map((m: PaymentMethod) => (
              <div key={m.id} className="p-3 border border-slate-200 rounded flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{m.brand} •••• {m.last4}</p>
                  <p className="text-xs text-slate-600">Exp {m.expMonth}/{m.expYear}</p>
                </div>
                {m.isDefault && <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-1 rounded">Default</span>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-600">No payment methods saved</p>
        )}
      </div>

      {/* Invoices */}
      {invoices.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Invoices</h3>
          <div className="space-y-2">
            {invoices.slice(0, 5).map((inv: Invoice) => (
              <div key={inv.id} className="p-3 border border-slate-200 rounded flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900 text-sm">${(inv.amount / 100).toFixed(2)}</p>
                  <p className="text-xs text-slate-600">{new Date(inv.date).toLocaleDateString()}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded ${inv.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {inv.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function SupportTab({ profile, plan }: any) {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [priority, setPriority] = useState<'normal'>('normal')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    try {
      const response = await fetch('/api/support/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message, priority, userInfo: { email: profile.email, name: `${profile.first_name} ${profile.last_name}`.trim(), plan: plan?.tier || 'NONE' } }),
      })
      if (response.ok) {
        setSent(true)
        setSubject('')
        setMessage('')
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 max-w-2xl">
      <h3 className="text-lg font-bold text-slate-900 mb-4">Submit Support Ticket</h3>
      {sent ? (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
          <p className="text-sm font-medium text-emerald-900">Ticket submitted! We'll respond within 24 hours.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Subject</label>
            <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} required
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Message</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} required rows={5}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-sm resize-none" />
          </div>
          <button type="submit" disabled={sending} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50">
            {sending ? 'Submitting...' : 'Submit Ticket'}
          </button>
        </form>
      )}
      <div className="mt-6 p-4 bg-slate-50 rounded-lg">
        <p className="text-sm text-slate-700"><strong>Email:</strong> <a href="mailto:support@preciseanalytics.io" className="text-blue-600 hover:underline">support@preciseanalytics.io</a></p>
        <p className="text-sm text-slate-700 mt-2"><strong>Phone:</strong> <a href="tel:+18044046005" className="text-blue-600 hover:underline">(804) 404-6005</a></p>
      </div>
    </div>
  )
}

function BidsTab({ bids, setBids }: any) {
  const [filter, setFilter] = useState<'all' | 'draft' | 'submitted' | 'awarded' | 'not_awarded'>('all')
  const filteredBids = filter === 'all' ? bids : bids.filter((b: BidData) => b.status === filter)

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-slate-900">Bid Tracker</h3>
        <a href="#" className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded font-medium">Add Bid</a>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {['all', 'draft', 'submitted', 'awarded', 'not_awarded'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              filter === f ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {f.replace('_', ' ').charAt(0).toUpperCase() + f.replace('_', ' ').slice(1)}
          </button>
        ))}
      </div>

      {filteredBids.length > 0 ? (
        <div className="space-y-2">
          {filteredBids.map((bid: BidData) => (
            <div key={bid.id} className="p-4 border border-slate-200 rounded-lg">
              <p className="font-semibold text-slate-900 text-sm">{bid.opportunityTitle}</p>
              <p className="text-xs text-slate-600 mt-1">{bid.opportunityId}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-slate-600 py-8">No bids</p>
      )}
    </div>
  )
}