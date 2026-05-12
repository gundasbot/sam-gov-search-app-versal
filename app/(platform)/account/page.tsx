'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from '@stripe/react-stripe-js'

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null
import {
  User, CreditCard, Mail, AlertCircle, Loader2, Crown, CheckCircle2,
  HeadphonesIcon, Gavel, TrendingUp, Send, XCircle, Check,
  DollarSign, Trophy, ArrowUpRight, Clock, RefreshCw,
  Camera, ShieldCheck, Phone, MapPin, Building2, FileText,
  Star, Activity, Target, ChevronRight, MessageSquare, Linkedin, Twitter, Facebook, Instagram,
  AlertTriangle, Plus, Pencil, LayoutList, Settings, X,
  Bell, Lock, Eye, EyeOff, LogOut,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

// ─── Gradient / color config (inline styles to avoid Tailwind purging) ────────

const G = {
  overview: {
    bg: 'linear-gradient(135deg, #3b82f6 0%, #4338ca 100%)',
    hex: '#3b82f6',
    soft: '#eff6ff',
    softText: '#1e40af',
    softBorder: '#bfdbfe',
  },
  profile: {
    bg: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    hex: '#8b5cf6',
    soft: '#f5f3ff',
    softText: '#5b21b6',
    softBorder: '#ddd6fe',
  },
  billing: {
    bg: 'linear-gradient(135deg, #10b981 0%, #0d9488 100%)',
    hex: '#10b981',
    soft: '#ecfdf5',
    softText: '#065f46',
    softBorder: '#a7f3d0',
  },
  bids: {
    bg: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
    hex: '#f59e0b',
    soft: '#fffbeb',
    softText: '#92400e',
    softBorder: '#fde68a',
  },
  support: {
    bg: 'linear-gradient(135deg, #f43f5e 0%, #ec4899 100%)',
    hex: '#f43f5e',
    soft: '#fff1f2',
    softText: '#9f1239',
    softBorder: '#fecdd3',
  },
  settings: {
    bg: 'linear-gradient(135deg, #475569 0%, #0f172a 100%)',
    hex: '#334155',
    soft: '#f8fafc',
    softText: '#334155',
    softBorder: '#cbd5e1',
  },
  slate: {
    bg: 'linear-gradient(135deg, #475569 0%, #1e293b 100%)',
    hex: '#475569',
    soft: '#f8fafc',
    softText: '#334155',
    softBorder: '#e2e8f0',
  },
}

// ─── Plan palette ─────────────────────────────────────────────────────────────

const PLAN_DETAILS = {
  BASIC: {
    name: 'Basic',
    monthlyPrice: 24.99,
    annualPrice: 240,
    bg: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
    hex: '#3b82f6',
    icon: ShieldCheck,
    features: [
      '500 searches / month',
      '10 CSV exports / month',
      '5 saved opportunities',
      'Email alerts',
      'Basic filtering & keyword search',
    ],
  },
  PROFESSIONAL: {
    name: 'Professional',
    monthlyPrice: 49,
    annualPrice: 490,
    bg: 'linear-gradient(135deg, #10b981 0%, #0d9488 100%)',
    hex: '#10b981',
    icon: TrendingUp,
    features: [
      '5,000 searches / month',
      '100 CSV exports / month',
      '50 saved opportunities',
      'Real-time alerts',
      'Advanced filters (NAICS, PSC, set-aside)',
      'API access',
      'Priority email support',
    ],
  },
  ENTERPRISE: {
    name: 'Enterprise',
    monthlyPrice: 199,
    annualPrice: 1990,
    bg: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
    hex: '#f97316',
    icon: Crown,
    features: [
      'Unlimited searches',
      'Unlimited CSV exports',
      'Unlimited saved opportunities',
      'Custom alerts & webhooks',
      'Full API access',
      'Dedicated account manager',
      'Custom integrations',
      'SLA guarantee',
    ],
  },
} as const

// ─── Types ────────────────────────────────────────────────────────────────────

type PlanTier = 'NONE' | 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE'
type TabType = 'overview' | 'profile' | 'billing' | 'support' | 'bids' | 'settings'
type BidFilterType = 'all' | 'active' | 'draft' | 'submitted' | 'awarded' | 'not_awarded'

type Plan = {
  tier: PlanTier
  status: string
  interval: 'month' | 'year' | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  subscription_id: string | null
  is_manual_assigned?: boolean
  subscription_source?: 'admin_assigned' | 'stripe' | 'trial' | 'none' | string
  price?: number
}

type ProfileData = {
  email: string; email_verified: boolean; first_name: string; last_name: string
  phone: string; phone_verified: boolean; company: string; title: string
  office_phone: string; personal_phone: string; work_email: string; personal_email: string
  linkedin: string; twitter: string; facebook: string; instagram: string
  address_line1: string; address_line2: string; city: string; state: string
  postal_code: string; country: string; recovery_email: string
  alternate_phone: string; profile_photo: string
}

type PaymentMethod = { id: string; brand: string; last4: string; expMonth: number; expYear: number; isDefault: boolean; nickname?: string; funding?: string }
type BidData = {
  id: string
  opportunityId: string
  opportunityTitle: string
  dueDate: string
  status: 'draft' | 'submitted' | 'awarded' | 'not_awarded'
  value?: number
  created_at?: string
  updated_at?: string
  activity?: Array<{ at: string; action: string }>
}
type Invoice = { id: string; date: string; amount: number; status: string; invoicePdf: string }
type Usage = { searches: number; exports: number; savedOpportunities: number; alerts: number; available: boolean; limits?: { searches: number; exports: number; savedOpportunities: number } }

// ─── Tab definitions ──────────────────────────────────────────────────────────

const TABS: { id: TabType; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview',  icon: TrendingUp },
  { id: 'profile',  label: 'Profile',   icon: User },
  { id: 'billing',  label: 'Billing',   icon: CreditCard },
  { id: 'bids',     label: 'Bids',      icon: Gavel },
  { id: 'support',  label: 'Support',   icon: HeadphonesIcon },
  { id: 'settings', label: 'Settings & Security',  icon: Settings },
]

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function AccountPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <AccountPageContent />
    </Suspense>
  )
}

function LoadingScreen() {
  return (
    <div className="pg-account-modern flex items-center justify-center min-h-screen" style={{ background: 'var(--color-bg)', color: 'var(--color-text-primary)', fontFamily: "'Aptos', 'Inter', 'Segoe UI', system-ui, sans-serif" }}>
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-slate-500 text-sm font-medium">Loading your account…</p>
      </div>
    </div>
  )
}

// ─── Shared: gradient icon bubble ─────────────────────────────────────────────

function IconBubble({ icon: Icon, gradient, size = 'md' }: { icon: React.ElementType; gradient: string; size?: 'sm' | 'md' | 'lg' }) {
  const dim = size === 'lg' ? 56 : size === 'sm' ? 28 : 40
  const iconDim = size === 'lg' ? 28 : size === 'sm' ? 14 : 20
  return (
    <div
      className="flex items-center justify-center rounded-xl shadow-sm shrink-0"
      style={{ background: gradient, width: dim, height: dim }}
    >
      <Icon size={iconDim} color="white" strokeWidth={2} />
    </div>
  )
}

// ─── Shared: section card header ──────────────────────────────────────────────

function CardHeader({ icon, title, gradient, children }: { icon: React.ElementType; title: string; gradient: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <IconBubble icon={icon} gradient={gradient} />
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
      </div>
      {children}
    </div>
  )
}

// ─── Main content ─────────────────────────────────────────────────────────────

function AccountPageContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [bidsFilter, setBidsFilter] = useState<BidFilterType>('all')
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('monthly')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [profile, setProfile] = useState<ProfileData>({
    email: session?.user?.email || '', email_verified: false,
    first_name: '', last_name: '', phone: '', phone_verified: false,
    office_phone: '', personal_phone: '', work_email: '', personal_email: '',
    linkedin: '', twitter: '', facebook: '', instagram: '',
    company: '', title: '', address_line1: '', address_line2: '',
    city: '', state: '', postal_code: '', country: 'United States',
    recovery_email: '', alternate_phone: '', profile_photo: '',
  })

  const [plan, setPlan] = useState<Plan | null>(null)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [usage, setUsage] = useState<Usage | null>(null)
  const [bids, setBids] = useState<BidData[]>([])
  const [editMode, setEditMode] = useState<string | null>(null)
  const [verificationSent, setVerificationSent] = useState(false)
  const [loadingPlanChange, setLoadingPlanChange] = useState<string | null>(null)
  const [planLastSyncedAt, setPlanLastSyncedAt] = useState<Date | null>(null)
  const [refreshingPlan, setRefreshingPlan] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login?callbackUrl=/account')
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated') loadAccountData()
  }, [status])

  useEffect(() => {
    const success = searchParams.get('success')
    if (success) setMessage({ type: 'success', text: 'Payment successful! Billing updated.' })
    const tabParam = (searchParams.get('tab') || '').toLowerCase()
    if (['overview', 'profile', 'billing', 'support', 'bids', 'settings'].includes(tabParam)) {
      setActiveTab(tabParam as TabType)
    }
  }, [searchParams])

  useEffect(() => {
    if (!message) return
    const timeoutMs = message.type === 'success' ? 4200 : 5600
    const timer = window.setTimeout(() => setMessage(null), timeoutMs)
    return () => window.clearTimeout(timer)
  }, [message])

  const refreshPlanData = async (showToast = false) => {
    try {
      setRefreshingPlan(true)
      const res = await fetch('/api/account/plan', { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to refresh plan')
      const d = await res.json()
      setPlan(d)
      if (d.interval) setBillingInterval(d.interval === 'year' ? 'annual' : 'monthly')
      setPlanLastSyncedAt(new Date())
      if (showToast) setMessage({ type: 'success', text: 'Plan refreshed' })
    } catch (err: any) {
      if (showToast) setMessage({ type: 'error', text: err?.message || 'Failed to refresh plan' })
    } finally {
      setRefreshingPlan(false)
    }
  }

  const loadAccountData = async () => {
    setLoading(true)
    try {
      const [profileRes, planRes, paymentsRes, invoicesRes, usageRes, bidsRes] = await Promise.all([
        fetch('/api/account/profile'),
        fetch('/api/account/plan', { cache: 'no-store' }),
        fetch('/api/account/payment-methods'),
        fetch('/api/stripe/invoices'),
        fetch('/api/account/usage'),
        fetch('/api/account/bids'),
      ])
      if (profileRes.ok) { const d = await profileRes.json(); setProfile(p => ({ ...p, ...d })) }
      if (planRes.ok) {
        const d = await planRes.json(); setPlan(d)
        if (d.interval) setBillingInterval(d.interval === 'year' ? 'annual' : 'monthly')
        setPlanLastSyncedAt(new Date())
      }
      if (paymentsRes.ok) {
        const paymentsData = await paymentsRes.json()
        const normalizeMethod = (m: any, defaultId?: string | null): PaymentMethod => ({
          id: m?.id || '',
          brand: m?.brand || m?.card?.brand || 'card',
          last4: m?.last4 || m?.card?.last4 || '----',
          expMonth: Number(m?.expMonth || m?.exp_month || m?.card?.exp_month || 0),
          expYear: Number(m?.expYear || m?.exp_year || m?.card?.exp_year || 0),
          isDefault: Boolean(m?.isDefault || (defaultId && m?.id === defaultId)),
          nickname: m?.nickname || m?.metadata?.nickname || m?.billing_details?.name || '',
          funding: m?.funding || m?.card?.funding || '',
        })

        if (Array.isArray(paymentsData)) {
          setPaymentMethods(paymentsData.map((m: any) => normalizeMethod(m)))
        } else {
          const list = Array.isArray(paymentsData?.paymentMethods) ? paymentsData.paymentMethods : []
          const defaultId = typeof paymentsData?.defaultPaymentMethod === 'string'
            ? paymentsData.defaultPaymentMethod
            : paymentsData?.defaultPaymentMethod?.id || null
          setPaymentMethods(list.map((m: any) => normalizeMethod(m, defaultId)))
        }
      }
      if (invoicesRes.ok) { const d = await invoicesRes.json(); setInvoices(d.invoices || []) }
      if (usageRes.ok) setUsage(await usageRes.json())
      if (bidsRes.ok) setBids(await bidsRes.json())
    } catch (err) {
      console.error('Error loading account data:', err)
      setMessage({ type: 'error', text: 'Failed to load account data' })
    } finally {
      setLoading(false)
    }
  }

  const saveProfile = async (sectionLabel?: string) => {
    const validEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    const validPhone = (value: string) => /^[0-9+()\-\s]{7,20}$/.test(value)

    if (profile.work_email && !validEmail(profile.work_email)) {
      setMessage({ type: 'error', text: 'Work email format is invalid' })
      return
    }
    if (profile.personal_email && !validEmail(profile.personal_email)) {
      setMessage({ type: 'error', text: 'Personal email format is invalid' })
      return
    }
    if (profile.office_phone && !validPhone(profile.office_phone)) {
      setMessage({ type: 'error', text: 'Office phone format is invalid' })
      return
    }
    if (profile.personal_phone && !validPhone(profile.personal_phone)) {
      setMessage({ type: 'error', text: 'Personal phone format is invalid' })
      return
    }
    if (profile.postal_code && !/^\d{5}(?:-\d{4})?$/.test(profile.postal_code.trim())) {
      setMessage({ type: 'error', text: 'ZIP code must be 5 digits (or ZIP+4)' })
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/account/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })
      if (res.ok) {
        const payload = await res.json().catch(() => null)
        if (payload?.profile) setProfile((prev: any) => ({ ...prev, ...payload.profile }))
        setMessage({ type: 'success', text: `${sectionLabel || 'Profile'} saved successfully` })
        setEditMode(null)
      } else {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error || 'Failed')
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err?.message || 'Failed to save profile' })
    }
    finally { setSaving(false) }
  }

  const sendEmailVerification = async () => {
    try {
      const res = await fetch('/api/account/verify-email', { method: 'POST' })
      if (res.ok) { setVerificationSent(true); setMessage({ type: 'success', text: 'Verification email sent' }) }
    } catch { setMessage({ type: 'error', text: 'Failed to send verification email' }) }
  }

  const managePaymentMethod = async () => {
    try {
      setSaving(true)
      const res = await fetch('/api/stripe/portal', { method: 'POST', headers: { 'Content-Type': 'application/json' } })
      if (res.ok) { const { url } = await res.json(); window.open(url, '_blank', 'noopener,noreferrer') }
      else { const d = await res.json(); throw new Error(d.error || 'Failed') }
    } catch (err: any) { setMessage({ type: 'error', text: err.message || 'Failed to open billing portal' }) }
    finally { setSaving(false) }
  }

  const handleCancelSubscription = async () => {
    if (!plan?.subscription_id) return
    if (!confirm('Cancel subscription? Access continues until end of billing period.')) return
    try {
      setSaving(true)
      const res = await fetch('/api/stripe/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription_id: plan.subscription_id }),
      })
      if (res.ok) { setMessage({ type: 'success', text: 'Subscription cancelled' }); await loadAccountData() }
      else throw new Error('Failed')
    } catch (err: any) { setMessage({ type: 'error', text: err.message || 'Failed to cancel' }) }
    finally { setSaving(false) }
  }

  const handlePlanChange = async (newTier: PlanTier, interval: 'month' | 'year', selectedPaymentMethodId?: string | null) => {
    if (!plan || !session) return
    const requestedInterval = interval === 'year' ? 'annual' : 'monthly'
    if (plan.tier === newTier && plan.interval === interval) {
      setMessage({ type: 'error', text: 'Already on this plan' }); return
    }
    try {
      setLoadingPlanChange(newTier)
      if (plan.subscription_id) {
        const res = await fetch('/api/stripe/change-subscription', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tier: newTier, interval: requestedInterval }),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({} as any))
          throw new Error(err?.error || 'Failed to change subscription')
        }
        const data = await res.json()
        setMessage({ type: 'success', text: data.message || 'Plan updated' })
        await loadAccountData()
      } else {
        const res = await fetch('/api/stripe/checkout', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tier: newTier, interval: requestedInterval,
            successUrl: `${window.location.origin}/account?success=true`,
            cancelUrl: `${window.location.origin}/account`,
            selectedPaymentMethodId: selectedPaymentMethodId || undefined,
          }),
        })
        if (!res.ok) {
          const err = await res.json().catch(() => ({} as any))
          throw new Error(err?.error || 'Failed to start checkout')
        }
        const { url } = await res.json()
        if (url) window.location.href = url
        else throw new Error('Checkout URL missing')
      }
    } catch (err: any) { setMessage({ type: 'error', text: err.message || 'Failed' }) }
    finally { setLoadingPlanChange(null) }
  }

  if (status === 'loading' || loading) return <LoadingScreen />

  const currentPlanDetails = plan?.tier && plan.tier !== 'NONE' ? PLAN_DETAILS[plan.tier as keyof typeof PLAN_DETAILS] : null
  const activeBids = bids.filter(b => b.status === 'draft' || b.status === 'submitted').length
  const awardedBids = bids.filter(b => b.status === 'awarded').length

  return (
    <div
      className="pg-account-modern min-h-screen"
      style={{
        background: 'linear-gradient(180deg, var(--color-surface-muted) 0%, var(--color-bg) 100%)',
        color: 'var(--color-text-primary)',
        fontFamily: "'Aptos', 'Inter', 'Segoe UI', system-ui, sans-serif",
      }}
    >

      {/* ── Page header ── */}
      <div className="border-b" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', boxShadow: '0 8px 24px rgba(15, 23, 42, 0.06)' }}>
        <div className="pg-account-shell pt-8 pb-0">

          {/* Profile strip */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-5 mb-7">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center overflow-hidden"
                style={{ background: G.overview.bg, boxShadow: '0 4px 14px rgba(59,130,246,0.35)' }}
              >
                {profile.profile_photo
                  ? <img src={profile.profile_photo} alt="Avatar" className="w-full h-full object-cover" />
                  : <span className="text-3xl sm:text-4xl font-black text-white">
                      {(profile.first_name?.[0] || profile.email?.[0] || 'U').toUpperCase()}
                    </span>}
              </div>
              <div
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center cursor-pointer"
                style={{ background: '#fff', border: '2px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}
              >
                <Camera size={13} color="#64748b" />
              </div>
            </div>

            {/* Name / company / badge */}
            <div className="flex-1 min-w-0">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className="text-left text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight hover:text-emerald-700 transition-colors"
                title="Open account overview"
              >
                {profile.first_name && profile.last_name
                  ? `${profile.first_name} ${profile.last_name}`
                  : session?.user?.email || 'My Account'}
              </button>
              {profile.company && (
                <p className="text-slate-500 text-sm font-medium mt-1 flex items-center gap-1.5">
                  <Building2 size={14} />
                  {profile.company}
                  {profile.title && <span className="text-slate-400">· {profile.title}</span>}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {currentPlanDetails && (
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-bold text-white"
                    style={{ background: currentPlanDetails.bg, boxShadow: `0 2px 8px ${currentPlanDetails.hex}44` }}
                  >
                    <currentPlanDetails.icon size={13} />
                    {currentPlanDetails.name}
                  </span>
                )}
                {plan?.status === 'active' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Active
                  </span>
                )}
                {plan?.status === 'trialing' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    Trialing {currentPlanDetails?.name || 'Plan'}
                  </span>
                )}
                {(!plan || (plan.tier === 'NONE' && plan.status !== 'trialing')) && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                    No Subscription
                  </span>
                )}
              </div>
            </div>

            {/* Mini stats */}
            <div className="flex items-end gap-3">
              <button
                type="button"
                onClick={() => { setActiveTab('bids'); setBidsFilter('active') }}
                className="text-center px-5 py-3 rounded-xl border border-blue-700 bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
              >
                <p className="text-2xl font-black text-white">{activeBids}</p>
                <p className="text-xs text-blue-100 font-bold mt-0.5">Active Bids</p>
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('bids'); setBidsFilter('awarded') }}
                className="text-center px-5 py-3 rounded-xl border border-emerald-700 bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm"
              >
                <p className="text-2xl font-black text-white">{awardedBids}</p>
                <p className="text-xs text-emerald-100 font-bold mt-0.5">Awarded</p>
              </button>
            </div>
          </div>

          {/* ── Tab bar ── */}
          <div className="flex gap-1 overflow-x-auto pb-0">
            {TABS.map(tab => {
              const isActive = activeTab === tab.id
              const color = G[tab.id]
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-2 px-5 py-3 rounded-t-xl font-semibold text-sm whitespace-nowrap transition-all border-b-2"
                  style={
                    isActive
                      ? {
                          background: color.bg,
                          color: '#fff',
                          borderBottomColor: 'transparent',
                          boxShadow: `0 4px 14px ${color.hex}40`,
                          marginBottom: -2,
                          position: 'relative',
                          zIndex: 1,
                        }
                      : {
                          background: 'transparent',
                          color: '#64748b',
                          borderBottomColor: 'transparent',
                        }
                  }
                  onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = '#f1f5f9' }}
                  onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                >
                  <tab.icon size={15} />
                  {tab.label}
                  {tab.id === 'bids' && bids.length > 0 && (
                    <span
                      className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                      style={isActive ? { background: 'rgba(255,255,255,0.25)', color: '#fff' } : { background: '#fef3c7', color: '#92400e' }}
                    >
                      {bids.length}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Flash message ── */}
      {message && (
        <div className="pg-account-shell mt-4">
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium"
            style={message.type === 'success'
              ? { background: '#ecfdf5', borderColor: '#a7f3d0', color: '#065f46' }
              : { background: '#fff1f2', borderColor: '#fecdd3', color: '#9f1239' }}
          >
            {message.type === 'success'
              ? <CheckCircle2 size={18} color="#10b981" className="shrink-0" />
              : <AlertCircle size={18} color="#f43f5e" className="shrink-0" />}
            <span className="flex-1">{message.text}</span>
            <button onClick={() => setMessage(null)} className="opacity-50 hover:opacity-100 transition-opacity">
              <XCircle size={15} />
            </button>
          </div>
        </div>
      )}

      {/* ── Tab content ── */}
      <div className="pg-account-shell py-5">
        {activeTab === 'overview' && (
          <OverviewTab
            profile={profile} plan={plan}
            currentPlanDetails={currentPlanDetails} usage={usage}
            bids={bids} setActiveTab={setActiveTab}
            activeBids={activeBids} awardedBids={awardedBids}
          />
        )}
        {activeTab === 'profile' && (
          <ProfileTab
            profile={profile} setProfile={setProfile}
            editMode={editMode} setEditMode={setEditMode}
            saving={saving} saveProfile={saveProfile}
            sendEmailVerification={sendEmailVerification}
            verificationSent={verificationSent}
            setActiveTab={setActiveTab}
          />
        )}
        {activeTab === 'billing' && (
          <BillingTab
            plan={plan} currentPlanDetails={currentPlanDetails}
            paymentMethods={paymentMethods} invoices={invoices}
            billingInterval={billingInterval} setBillingInterval={setBillingInterval}
            handlePlanChange={handlePlanChange} managePaymentMethod={managePaymentMethod}
            handleCancelSubscription={handleCancelSubscription} loadingPlanChange={loadingPlanChange}
            planLastSyncedAt={planLastSyncedAt} refreshingPlan={refreshingPlan} refreshPlanData={refreshPlanData}
            profile={profile} onCardAdded={loadAccountData}
          />
        )}
        {activeTab === 'bids' && <BidsTab bids={bids} setBids={setBids} initialFilter={bidsFilter} />}
        {activeTab === 'support' && <SupportTab profile={profile} plan={plan} />}
        {activeTab === 'settings' && <SettingsTab />}
      </div>
    </div>
  )
}

function SettingsTab() {
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    smsAlerts: false,
    dailyDigest: true,
    weeklyReport: true,
    opportunityReminders: true,
    systemNotifications: true,
  })
  const [loadingPrefs, setLoadingPrefs] = useState(false)
  const [savingPrefKey, setSavingPrefKey] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordBusy, setPasswordBusy] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '', confirm: '' })
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [twoFactorHasPendingSetup, setTwoFactorHasPendingSetup] = useState(false)
  const [twoFactorSetupBusy, setTwoFactorSetupBusy] = useState(false)
  const [twoFactorVerifyBusy, setTwoFactorVerifyBusy] = useState(false)
  const [twoFactorDisableBusy, setTwoFactorDisableBusy] = useState(false)
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [twoFactorDisablePassword, setTwoFactorDisablePassword] = useState('')
  const [twoFactorSetupData, setTwoFactorSetupData] = useState<{ qrCode: string; secret: string } | null>(null)
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [bulkPrefBusy, setBulkPrefBusy] = useState(false)
  const [testEmailBusy, setTestEmailBusy] = useState(false)
  const [digestEmailBusy, setDigestEmailBusy] = useState(false)
  const [marketingOptIn, setMarketingOptIn] = useState(false)
  const [marketingBusy, setMarketingBusy] = useState(false)
  const allNotificationsEnabled = Object.values(notifications).every(Boolean)

  useEffect(() => {
    let mounted = true
    const loadPrefs = async () => {
      try {
        setLoadingPrefs(true)
        const [prefsRes, twoFactorRes, marketingRes] = await Promise.all([
          fetch('/api/account/subscriptions'),
          fetch('/api/account/two-factor'),
          fetch('/api/account/marketing-preferences'),
        ])

        if (twoFactorRes.ok) {
          const twoFactorData = await twoFactorRes.json().catch(() => ({}))
          if (mounted) {
            if (typeof twoFactorData?.enabled === 'boolean') setTwoFactorEnabled(twoFactorData.enabled)
            if (typeof twoFactorData?.hasPendingSetup === 'boolean') {
              setTwoFactorHasPendingSetup(twoFactorData.hasPendingSetup)
            }
          }
        }

        if (!prefsRes.ok) return
        const data = await prefsRes.json()
        const saved = data?.subscriptions?.settingsNotifications
        if (mounted && saved && typeof saved === 'object') {
          setNotifications((prev: any) => ({ ...prev, ...saved }))
        }

        if (marketingRes.ok) {
          const marketingData = await marketingRes.json().catch(() => ({}))
          if (mounted && typeof marketingData?.marketingPreferences?.optIn === 'boolean') {
            setMarketingOptIn(marketingData.marketingPreferences.optIn)
          }
        }
      } catch {
        // Non-blocking: keep defaults
      } finally {
        if (mounted) setLoadingPrefs(false)
      }
    }
    void loadPrefs()
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  const saveNotificationPatch = async (updated: any) => {
    const res = await fetch('/api/account/subscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settingsNotifications: updated }),
    })
    if (!res.ok) throw new Error('Failed to save notification preference')
  }

  const toggleNotification = async (key: keyof typeof notifications) => {
    const updated = { ...notifications, [key]: !notifications[key] }
    try {
      setSavingPrefKey(key)
      setNotifications(updated)
      await saveNotificationPatch(updated)
      setToast({ type: 'success', text: 'Preference saved' })
    } catch {
      setNotifications(notifications)
      setToast({ type: 'error', text: 'Could not save preference' })
    } finally {
      setSavingPrefKey(null)
    }
  }

  const setAllNotifications = async (value: boolean) => {
    const updated = Object.fromEntries(
      Object.keys(notifications).map((key) => [key, value])
    ) as typeof notifications

    try {
      setBulkPrefBusy(true)
      setNotifications(updated)
      await saveNotificationPatch(updated)
      setToast({ type: 'success', text: value ? 'All notifications enabled' : 'All notifications disabled' })
    } catch {
      setToast({ type: 'error', text: 'Could not update all notification preferences' })
    } finally {
      setBulkPrefBusy(false)
    }
  }

  const sendTestEmail = async () => {
    try {
      setTestEmailBusy(true)
      const res = await fetch('/api/account/notifications/send-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationType: 'account_settings_test' }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Failed to send test email')
      setToast({ type: 'success', text: 'Test email sent' })
    } catch (err: unknown) {
      setToast({ type: 'error', text: err instanceof Error ? err.message : 'Failed to send test email' })
    } finally {
      setTestEmailBusy(false)
    }
  }

  const sendDigestEmail = async () => {
    try {
      setDigestEmailBusy(true)
      const res = await fetch('/api/account/notifications/send-digest', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Failed to send digest email')
      setToast({ type: 'success', text: 'Digest email sent' })
    } catch (err: unknown) {
      setToast({ type: 'error', text: err instanceof Error ? err.message : 'Failed to send digest email' })
    } finally {
      setDigestEmailBusy(false)
    }
  }

  const toggleMarketingOptIn = async () => {
    const next = !marketingOptIn
    try {
      setMarketingBusy(true)
      const res = await fetch('/api/account/marketing-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ optIn: next }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Failed to update marketing preference')

      setMarketingOptIn(Boolean(data?.marketingPreferences?.optIn))
      setToast({
        type: 'success',
        text: next ? 'Marketing emails enabled' : 'Marketing emails disabled',
      })
    } catch (err: unknown) {
      setToast({ type: 'error', text: err instanceof Error ? err.message : 'Failed to update marketing preference' })
    } finally {
      setMarketingBusy(false)
    }
  }

  const handleUpdatePassword = async () => {
    setPasswordMsg(null)
    if (!passwordForm.current || !passwordForm.next || !passwordForm.confirm) {
      setPasswordMsg({ type: 'error', text: 'Please complete all fields' })
      return
    }
    if (passwordForm.next !== passwordForm.confirm) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match' })
      return
    }
    if (passwordForm.next.length < 8) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 8 characters' })
      return
    }
    try {
      setPasswordBusy(true)
      const res = await fetch('/api/account/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: passwordForm.current, newPassword: passwordForm.next }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Could not update password')
      setPasswordForm({ current: '', next: '', confirm: '' })
      setPasswordMsg({ type: 'success', text: 'Password updated successfully' })
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err?.message || 'Could not update password' })
    } finally {
      setPasswordBusy(false)
    }
  }

  const startTwoFactorSetup = async () => {
    try {
      setTwoFactorSetupBusy(true)
      const res = await fetch('/api/account/two-factor/setup', {
        method: 'POST',
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Unable to start 2FA setup')
      setTwoFactorSetupData({ qrCode: String(data?.qrCode || ''), secret: String(data?.secret || '') })
      setTwoFactorHasPendingSetup(true)
      setToast({ type: 'success', text: '2FA setup started. Scan the QR code and verify.' })
    } catch (err: unknown) {
      setToast({ type: 'error', text: err instanceof Error ? err.message : 'Unable to start 2FA setup' })
    } finally {
      setTwoFactorSetupBusy(false)
    }
  }

  const verifyTwoFactorSetup = async () => {
    if (!twoFactorCode.trim()) {
      setToast({ type: 'error', text: 'Enter the 6-digit authenticator code' })
      return
    }
    try {
      setTwoFactorVerifyBusy(true)
      const res = await fetch('/api/account/two-factor/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: twoFactorCode.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Unable to verify 2FA setup')

      setTwoFactorEnabled(true)
      setTwoFactorHasPendingSetup(false)
      setTwoFactorSetupData(null)
      setTwoFactorCode('')
      setBackupCodes(Array.isArray(data?.backupCodes) ? data.backupCodes : [])
      setToast({ type: 'success', text: '2FA enabled with authenticator app.' })
    } catch (err: unknown) {
      setToast({ type: 'error', text: err instanceof Error ? err.message : 'Unable to verify 2FA setup' })
    } finally {
      setTwoFactorVerifyBusy(false)
    }
  }

  const disableTwoFactor = async () => {
    if (!twoFactorDisablePassword) {
      setToast({ type: 'error', text: 'Enter your current password to disable 2FA' })
      return
    }

    try {
      setTwoFactorDisableBusy(true)
      const res = await fetch('/api/account/two-factor/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: twoFactorDisablePassword }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Unable to disable 2FA')

      setTwoFactorEnabled(false)
      setTwoFactorHasPendingSetup(false)
      setTwoFactorDisablePassword('')
      setTwoFactorSetupData(null)
      setBackupCodes([])
      setToast({ type: 'success', text: '2FA disabled' })
    } catch (err: unknown) {
      setToast({ type: 'error', text: err instanceof Error ? err.message : 'Unable to disable 2FA' })
    } finally {
      setTwoFactorDisableBusy(false)
    }
  }

  return (
    <div className="space-y-5">
      {toast && (
        <div className={`rounded-xl border px-4 py-3 text-sm font-bold ${
          toast.type === 'success'
            ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
            : 'border-rose-300 bg-rose-50 text-rose-800'
        }`}>
          {toast.text}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4" style={{ background: G.slate.bg }}>
          <div className="flex items-center gap-2.5">
            <Settings size={18} color="white" strokeWidth={2} />
            <span className="font-bold text-white text-base">Settings & Security</span>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 inline-flex items-center gap-2"><Lock size={16} /> Password</h3>
              <button type="button" onClick={() => setShowPasswordForm(v => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold transition-all"
                style={showPasswordForm
                  ? { background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0' }
                  : { background: G.settings.bg, color: '#ffffff' }}>
                {showPasswordForm ? <><X size={12} /> Cancel</> : <><Lock size={12} /> Change Password</>}
              </button>
            </div>
            {!showPasswordForm && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-sm font-semibold text-slate-600">Keep your account secure with a strong, unique password.</p>
                <p className="text-xs text-slate-400 mt-1">Click <span className="font-bold text-slate-500">Change Password</span> to update your credentials.</p>
              </div>
            )}
            {showPasswordForm && (
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-5 space-y-4">
              <div className="space-y-4">
              {/* Current password */}
              <div className="space-y-1">
                <label className="block text-sm font-bold text-slate-800">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordForm.current}
                    onChange={e => setPasswordForm({ ...passwordForm, current: e.target.value })}
                    placeholder="Enter your current password"
                    className="w-full px-4 py-3 pr-12 rounded-xl border-2 border-slate-300 bg-white text-slate-900 text-sm font-semibold placeholder-slate-400 focus:outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  />
                  <button type="button" onClick={() => setShowCurrentPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700">
                    {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* New password */}
              <div className="space-y-1">
                <label className="block text-sm font-bold text-slate-800">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordForm.next}
                    onChange={e => setPasswordForm({ ...passwordForm, next: e.target.value })}
                    placeholder="Minimum 8 characters"
                    className="w-full px-4 py-3 pr-12 rounded-xl border-2 border-slate-300 bg-white text-slate-900 text-sm font-semibold placeholder-slate-400 focus:outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  />
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {passwordForm.next.length > 0 && (
                  <div className="flex gap-3 mt-1.5 flex-wrap">
                    {[
                      { label: '8+ chars', ok: passwordForm.next.length >= 8 },
                      { label: 'Uppercase', ok: /[A-Z]/.test(passwordForm.next) },
                      { label: 'Number', ok: /[0-9]/.test(passwordForm.next) },
                      { label: 'Special char', ok: /[^A-Za-z0-9]/.test(passwordForm.next) },
                    ].map(r => (
                      <span key={r.label} className={`text-xs font-semibold inline-flex items-center gap-1 ${r.ok ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {r.ok ? '✓' : '○'} {r.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div className="space-y-1">
                <label className="block text-sm font-bold text-slate-800">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordForm.confirm}
                    onChange={e => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                    placeholder="Re-enter new password"
                    className="w-full px-4 py-3 pr-12 rounded-xl border-2 border-slate-300 bg-white text-slate-900 text-sm font-semibold placeholder-slate-400 focus:outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700">
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {passwordForm.confirm.length > 0 && (
                  <p className={`text-xs font-semibold mt-1 ${passwordForm.next === passwordForm.confirm ? 'text-emerald-600' : 'text-red-500'}`}>
                    {passwordForm.next === passwordForm.confirm ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </p>
                )}
              </div>

              {/* Inline feedback */}
              {passwordMsg && (
                <div className={`rounded-lg px-3 py-2.5 text-sm font-semibold ${passwordMsg.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                  {passwordMsg.text}
                </div>
              )}
              </div>

              <div className="max-w-md flex gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleUpdatePassword}
                  disabled={passwordBusy}
                  className="flex-1 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-sm font-black disabled:opacity-60 inline-flex items-center justify-center gap-2 shadow-sm"
                >
                  {passwordBusy
                    ? <><Loader2 size={15} className="animate-spin" /> Saving…</>
                    : <><Lock size={15} /> Save New Password</>}
                </button>
                <button
                  type="button"
                  onClick={() => { setPasswordForm({ current: '', next: '', confirm: '' }); setPasswordMsg(null) }}
                  disabled={passwordBusy}
                  className="px-5 py-3 rounded-xl border-2 border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-bold disabled:opacity-60"
                >
                  Clear
                </button>
              </div>
            </div>
            )}
          </section>

          <section className="space-y-3 rounded-2xl border border-slate-200 p-4 sm:p-5 bg-slate-50">
            <h3 className="text-base font-black text-slate-900 inline-flex items-center gap-2"><ShieldCheck size={16} /> Two-Factor Authentication</h3>
            <p className="text-sm font-semibold text-slate-700">
              Secure your account with an authenticator app (Google Authenticator, Microsoft Authenticator, Authy, 1Password, etc.).
            </p>
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-black text-slate-900">Authenticator App 2FA</p>
                  <p className="text-xs font-semibold text-slate-600">Status: {twoFactorEnabled ? 'Enabled' : (twoFactorHasPendingSetup ? 'Pending verification' : 'Disabled')}</p>
                </div>
                {!twoFactorEnabled && (
                  <button
                    type="button"
                    onClick={startTwoFactorSetup}
                    disabled={twoFactorSetupBusy}
                    className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-black disabled:opacity-60"
                  >
                    {twoFactorSetupBusy ? 'Preparing...' : (twoFactorSetupData || twoFactorHasPendingSetup ? 'Regenerate QR' : 'Set Up 2FA')}
                  </button>
                )}
              </div>

              {twoFactorEnabled && (
                <div className="space-y-3">
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800">
                    2FA is active on your account.
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    <input
                      type="password"
                      value={twoFactorDisablePassword}
                      onChange={(e) => setTwoFactorDisablePassword(e.target.value)}
                      placeholder="Current password to disable"
                      className="px-3 py-2 rounded-lg border border-slate-300 text-sm font-semibold"
                    />
                    <button
                      type="button"
                      onClick={disableTwoFactor}
                      disabled={twoFactorDisableBusy}
                      className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-black disabled:opacity-60"
                    >
                      {twoFactorDisableBusy ? 'Disabling...' : 'Disable 2FA'}
                    </button>
                  </div>
                </div>
              )}

              {!twoFactorEnabled && twoFactorSetupData && (
                <div className="space-y-3">
                  <div className="rounded-lg border border-slate-200 p-3 bg-slate-50 max-w-xs">
                    <img src={twoFactorSetupData.qrCode} alt="2FA QR Code" className="w-full h-auto rounded" />
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="text-xs font-bold text-slate-700 mb-1">Manual setup code</p>
                    <p className="text-sm font-mono font-black text-slate-900 break-all">{twoFactorSetupData.secret}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="Enter 6-digit code"
                      className="px-3 py-2 rounded-lg border border-slate-300 text-sm font-semibold"
                    />
                    <button
                      type="button"
                      onClick={verifyTwoFactorSetup}
                      disabled={twoFactorVerifyBusy || twoFactorCode.length < 6}
                      className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black disabled:opacity-60"
                    >
                      {twoFactorVerifyBusy ? 'Verifying...' : 'Verify & Enable'}
                    </button>
                  </div>
                </div>
              )}

              {backupCodes.length > 0 && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-3">
                  <p className="text-xs font-black text-amber-800 mb-2">Backup codes (store these now)</p>
                  <div className="grid grid-cols-2 gap-2">
                    {backupCodes.map((code) => (
                      <div key={code} className="font-mono text-sm font-bold text-amber-900">{code}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
          </div>{/* end 2-col grid */}

          <section className="space-y-4">
            <h3 className="text-base font-black text-slate-900 inline-flex items-center gap-2"><Bell size={16} /> Notification Preferences</h3>

            {/* Master mute toggle */}
            <div className={`flex items-center justify-between p-4 rounded-xl border ${allNotificationsEnabled ? 'border-slate-200 bg-white' : 'border-slate-200 bg-white'}`}>
              <div>
                <p className="text-sm font-black text-slate-900">All Notifications</p>
                <p className={`text-xs font-semibold ${allNotificationsEnabled ? 'text-slate-600' : 'text-slate-500'}`}>
                  {allNotificationsEnabled ? 'All notifications are enabled.' : 'All notifications are turned off.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAllNotifications(!allNotificationsEnabled)}
                disabled={bulkPrefBusy}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${allNotificationsEnabled ? 'bg-emerald-600' : 'bg-slate-300'} ${bulkPrefBusy ? 'opacity-60' : ''}`}
              >
                <span className={`inline-block h-6 w-6 rounded-full bg-white transition-transform ${allNotificationsEnabled ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={sendTestEmail}
                disabled={testEmailBusy}
                className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-black disabled:opacity-60"
              >
                {testEmailBusy ? 'Sending...' : 'Send Test Email'}
              </button>
              <button
                type="button"
                onClick={sendDigestEmail}
                disabled={digestEmailBusy}
                className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black disabled:opacity-60"
              >
                {digestEmailBusy ? 'Sending...' : 'Send Digest'}
              </button>
            </div>
            {loadingPrefs && <p className="text-sm font-semibold text-slate-500">Loading preferences...</p>}
            <div className={`flex items-center justify-between p-4 rounded-xl border ${marketingOptIn ? 'border-slate-200 bg-white' : 'border-slate-200 bg-slate-50'}`}>
              <div>
                <p className={`text-sm font-bold ${marketingOptIn ? 'text-slate-900' : 'text-orange-900'}`}>Marketing Emails</p>
                <p className={`text-xs font-semibold ${marketingOptIn ? 'text-slate-600' : 'text-orange-800'}`}>
                  Product updates, feature launches, and campaign announcements.
                </p>
              </div>
              <button
                type="button"
                onClick={toggleMarketingOptIn}
                disabled={marketingBusy}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${marketingOptIn ? 'bg-emerald-600' : 'bg-slate-300'} ${marketingBusy ? 'opacity-60' : ''}`}
              >
                <span className={`inline-block h-6 w-6 rounded-full bg-white transition-transform ${marketingOptIn ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              ['emailAlerts', 'Email Alerts'],
              ['smsAlerts', 'SMS Alerts'],
              ['dailyDigest', 'Daily Digest'],
              ['weeklyReport', 'Weekly Report'],
              ['opportunityReminders', 'Opportunity Reminders'],
              ['systemNotifications', 'System Notifications'],
            ].map(([key, label]) => {
              const enabled = notifications[key as keyof typeof notifications]
              return (
                <div key={key} className={`flex items-center justify-between p-3.5 rounded-xl border ${
                  enabled ? 'border-slate-200 bg-white' : 'border-slate-200 bg-slate-50'
                }`}>
                  <p className={`text-sm font-bold ${enabled ? 'text-slate-900' : 'text-slate-500'}`}>{label}</p>
                  <button
                    type="button"
                    onClick={() => toggleNotification(key as keyof typeof notifications)}
                    disabled={savingPrefKey === key}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors shrink-0 ${
                      enabled ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}
                  >
                    <span className={`inline-block h-5 w-5 rounded-full bg-white transition-transform ${
                      enabled ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              )
            })}
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-base font-black text-slate-900 inline-flex items-center gap-2"><LogOut size={16} /> Session Management</h3>
            <p className="text-sm font-semibold text-slate-600">Sign out of this browser or all sessions.</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => { window.location.href = '/api/force-signout' }}
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-black inline-flex items-center gap-2"
              >
                <LogOut size={14} /> Sign Out This Session
              </button>
              <button
                type="button"
                onClick={() => setToast({ type: 'success', text: 'Sign-out all sessions request noted. Endpoint can be wired next.' })}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-black"
              >
                Sign Out All Sessions
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

// ─── OVERVIEW TAB ─────────────────────────────────────────────────────────────

function OverviewTab({ profile, plan, currentPlanDetails, usage, bids, setActiveTab, activeBids, awardedBids }: any) {
  const socialMediaValue =
    profile.social_media ||
    profile.linkedin ||
    profile.linkedin_url ||
    profile.twitter ||
    profile.x_handle ||
    profile.website ||
    ''
  const socialPlatforms = [
    {
      label: 'LinkedIn',
      icon: Linkedin,
      value: profile.linkedin || profile.linkedin_url || '',
      loginUrl: 'https://www.linkedin.com/login',
    },
    {
      label: 'X (Twitter)',
      icon: Twitter,
      value: profile.twitter || profile.x_handle || '',
      loginUrl: 'https://x.com/i/flow/login',
    },
    {
      label: 'Facebook',
      icon: Facebook,
      value: profile.facebook || '',
      loginUrl: 'https://www.facebook.com/login',
    },
    {
      label: 'Instagram',
      icon: Instagram,
      value: profile.instagram || '',
      loginUrl: 'https://www.instagram.com/accounts/login/',
    },
  ]

  const statCards = [
    { label: 'Active Bids',  value: activeBids,                              icon: Gavel,     color: G.bids },
    { label: 'Awarded',      value: awardedBids,                             icon: Trophy,    color: G.billing },
    { label: 'Saved Opps',   value: usage?.savedOpportunities ?? '—',        icon: Star,      color: G.profile },
    { label: 'Searches',     value: usage?.searches ?? '—',                  icon: Activity,  color: G.overview },
  ]
  const profileCompleteness = [
    profile.first_name,
    profile.last_name,
    profile.email,
    profile.phone,
    profile.company,
    profile.title,
  ].filter(Boolean).length
  const profileCompletenessPct = Math.round((profileCompleteness / 6) * 100)

  const sectionFolders = [
    { tab: 'profile' as TabType,   icon: User,           color: G.profile,   title: 'Profile',             desc: 'Edit name, contact info, company details, and social links' },
    { tab: 'billing' as TabType,   icon: CreditCard,     color: G.billing,   title: 'Billing & Payments',  desc: 'Manage subscription, payment methods, invoices, and renewals' },
    { tab: 'bids' as TabType,      icon: Gavel,          color: G.bids,      title: 'Bids & Pursuits',     desc: 'Track active bids, submitted proposals, and award history' },
    { tab: 'support' as TabType,   icon: HeadphonesIcon, color: G.support,   title: 'Customer Support',    desc: 'Submit tickets, get technical help, and contact our team' },
    { tab: 'settings' as TabType,  icon: Settings,       color: G.settings,  title: 'Login & Security',    desc: 'Change password, two-factor authentication, and notifications' },
    { tab: 'overview' as TabType,  icon: Activity,       color: G.overview,  title: 'Usage & Plan',        desc: 'View team seats, current plan, and activity summary' },
  ]

  return (
    <div className="pg-account-content space-y-7">

      {/* Amazon-style section grid */}
      <div>
        <h2 className="text-xl font-black text-slate-800 mb-4">Your Account</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sectionFolders.map(s => (
            <button
              key={s.tab}
              type="button"
              onClick={() => setActiveTab(s.tab)}
              className="group flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all hover:shadow-md cursor-pointer"
              style={{ '--hover-border': s.color.hex } as React.CSSProperties}
              onMouseEnter={e => (e.currentTarget.style.borderColor = s.color.hex)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '')}
            >
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-all group-hover:scale-110"
                style={{ background: s.color.soft, border: `1.5px solid ${s.color.softBorder}` }}
              >
                <s.icon size={20} style={{ color: s.color.hex }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900" style={{ color: 'inherit' }}>{s.title}</p>
                <p className="mt-0.5 text-xs leading-snug text-slate-500">{s.desc}</p>
              </div>
              <ChevronRight size={16} className="shrink-0 text-slate-300 transition-all group-hover:text-slate-600 group-hover:translate-x-0.5" />
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Plan card */}
        <div className="lg:col-span-1">
          {currentPlanDetails ? (
            <div className="rounded-xl p-5 text-white shadow-md h-full flex flex-col" style={{ background: currentPlanDetails.bg }}>
              <div className="flex items-center gap-2 mb-3">
                <currentPlanDetails.icon size={18} color="white" />
                <span className="font-black">{currentPlanDetails.name}</span>
                <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }}>
                  {plan?.status === 'trialing' ? 'Trialing' : 'Active'}
                </span>
              </div>
              <ul className="space-y-1.5 mb-5 flex-1">
                {currentPlanDetails.features.slice(0, 5).map((f: string, i: number) => (
                  <li key={i} className="text-sm flex items-center gap-2" style={{ color: 'rgba(255,255,255,0.9)' }}>
                    <Check size={12} color="white" strokeWidth={3} /> {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => setActiveTab('billing')}
                className="w-full py-2 rounded-lg text-white text-sm font-bold transition-opacity hover:opacity-80"
                style={{ background: 'rgba(255,255,255,0.2)' }}
              >
                Manage Plan →
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white p-5 text-center shadow-sm h-full flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                <CreditCard size={22} color="#94a3b8" />
              </div>
              <div>
                <p className="font-bold text-slate-900">No Active Plan</p>
                <p className="text-sm text-slate-500 mt-0.5">Upgrade to unlock full access</p>
              </div>
              <button
                onClick={() => setActiveTab('billing')}
                className="px-4 py-2 text-white text-sm font-bold rounded-lg hover:opacity-90 transition-opacity"
                style={{ background: G.billing.bg }}
              >
                View Plans
              </button>
            </div>
          )}
        </div>

        {/* Usage bars */}
        {usage?.available && (
          <div className="lg:col-span-1 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-sm">
              <Activity size={14} color={G.overview.hex} /> Plan Seats
            </h3>
            <div className="space-y-4">
              {/* Seat usage */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-semibold text-slate-500">Team seats used</span>
                  <span className="text-xs font-bold text-slate-900">
                    {usage.seatsUsed ?? 1} / {usage.maxSeats ?? 1}
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(((usage.seatsUsed ?? 1) / (usage.maxSeats ?? 1)) * 100, 100)}%`,
                      background: G.overview.hex,
                    }}
                  />
                </div>
              </div>
              {/* Unlimited badges */}
              <div className="space-y-2 pt-1">
                {[
                  { label: 'Searches', icon: '🔍' },
                  { label: 'Exports', icon: '📥' },
                  { label: 'Opportunities saved', icon: '🔖' },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">{item.icon} {item.label}</span>
                    <span className="text-xs font-bold text-emerald-600">Unlimited</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Activity stats */}
        <div className="lg:col-span-1 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-sm">
            <Target size={14} color={G.profile.hex} /> Activity Summary
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {statCards.map(s => (
              <div key={s.label} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ background: s.color.bg }}>
                  <s.icon size={16} color="white" strokeWidth={2} />
                </div>
                <p className="text-2xl font-black text-slate-900">{s.value}</p>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent bids */}
      {bids.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <CardHeader icon={Gavel} title="Recent Bids" gradient={G.bids.bg}>
            <button onClick={() => setActiveTab('bids')} className="text-sm font-semibold flex items-center gap-1 hover:opacity-70 transition-opacity" style={{ color: G.bids.hex }}>
              View all <ChevronRight size={14} />
            </button>
          </CardHeader>
          <div className="space-y-2">
            {bids.slice(0, 4).map((bid: BidData) => (
              <BidRow
                key={bid.id}
                bid={bid}
                onStatusChange={async () => {}}
                onDelete={async () => {}}
                pending={false}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── PROFILE TAB ──────────────────────────────────────────────────────────────

function PasswordUpdateSection() {
  const [form, setForm] = useState({ current: '', next: '', confirm: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const resetForm = () => {
    setForm({ current: '', next: '', confirm: '' })
    setShowPassword(false)
  }

  const updatePassword = async () => {
    setMessage(null)

    if (!form.current || !form.next || !form.confirm) {
      setMessage({ type: 'error', text: 'Complete all password fields.' })
      return
    }

    if (form.next.length < 8) {
      setMessage({ type: 'error', text: 'New password must be at least 8 characters.' })
      return
    }

    if (form.next !== form.confirm) {
      setMessage({ type: 'error', text: 'New passwords do not match.' })
      return
    }

    try {
      setBusy(true)
      const res = await fetch('/api/account/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: form.current, newPassword: form.next }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Could not update password')
      resetForm()
      setMessage({ type: 'success', text: 'Password updated successfully.' })
    } catch (err: unknown) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Could not update password' })
    } finally {
      setBusy(false)
    }
  }

  const inputClass = 'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition-all focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10'

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between" style={{ background: G.settings.bg }}>
        <div className="flex items-center gap-2.5">
          <Lock size={18} color="white" strokeWidth={2} />
          <div>
            <p className="font-bold text-white text-base">Password & Security</p>
            <p className="text-xs font-semibold text-white/80">Update the password used for email sign-in.</p>
          </div>
        </div>
        <Link
          href="/forgot-password"
          className="inline-flex items-center justify-center rounded-xl bg-white/15 px-3.5 py-2 text-xs font-black text-white ring-1 ring-white/30 transition hover:bg-white/20"
        >
          Forgot password?
        </Link>
      </div>

      <div className="p-5 sm:p-6">
        {message && (
          <div className={`mb-4 rounded-xl border px-4 py-3 text-sm font-bold ${
            message.type === 'success'
              ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
              : 'border-rose-300 bg-rose-50 text-rose-800'
          }`}>
            {message.text}
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-3">
          <Field label="Current Password">
            <input
              type={showPassword ? 'text' : 'password'}
              value={form.current}
              onChange={(e) => setForm({ ...form, current: e.target.value })}
              className={inputClass}
              placeholder="Current password"
              autoComplete="current-password"
            />
          </Field>

          <Field label="New Password">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.next}
                onChange={(e) => setForm({ ...form, next: e.target.value })}
                className={`${inputClass} pr-12`}
                placeholder="At least 8 characters"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </Field>

          <Field label="Confirm New Password">
            <input
              type={showPassword ? 'text' : 'password'}
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              className={inputClass}
              placeholder="Confirm new password"
              autoComplete="new-password"
            />
          </Field>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={updatePassword}
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? <><Loader2 size={14} className="animate-spin" /> Updating...</> : 'Update Password'}
          </button>
          <button
            type="button"
            onClick={() => { resetForm(); setMessage(null) }}
            disabled={busy}
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            Clear
          </button>
          <p className="text-xs font-semibold text-slate-500 sm:ml-2">
            Use reset password if you do not know your current password.
          </p>
        </div>
      </div>
    </div>
  )
}

function ProfileTab({ profile, setProfile, editMode, setEditMode, saving, saveProfile, sendEmailVerification, verificationSent, setActiveTab }: any) {
  const inputCls = "w-full px-4 py-3 border rounded-xl text-slate-900 text-sm transition-all outline-none focus:ring-2"
  const [zipStatus, setZipStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [zipFeedback, setZipFeedback] = useState('')
  const [addrSuggestions, setAddrSuggestions] = useState<Array<{ street: string; city: string; state: string; postalCode: string; label: string }>>([]
  )
  const [addrOpen, setAddrOpen] = useState(false)
  const [addrLoading, setAddrLoading] = useState(false)
  const addrDebounceRef = useState<ReturnType<typeof setTimeout> | null>(null)

  const fetchAddressSuggestions = (value: string) => {
    if (addrDebounceRef[0]) clearTimeout(addrDebounceRef[0])
    if (value.length < 3) { setAddrSuggestions([]); setAddrOpen(false); return }
    addrDebounceRef[1](
      setTimeout(async () => {
        try {
          setAddrLoading(true)
          const res = await fetch(`/api/lookup/address?q=${encodeURIComponent(value)}`)
          const data = await res.json()
          setAddrSuggestions(data?.results || [])
          setAddrOpen((data?.results || []).length > 0)
        } catch { setAddrSuggestions([]); setAddrOpen(false) }
        finally { setAddrLoading(false) }
      }, 380)
    )
  }

  const applyAddressSuggestion = (s: { street: string; city: string; state: string; postalCode: string }) => {
    setProfile((prev: any) => ({
      ...prev,
      address_line1: s.street || prev.address_line1,
      city: s.city || prev.city,
      state: s.state || prev.state,
      postal_code: s.postalCode || prev.postal_code,
    }))
    setAddrOpen(false)
    setZipStatus('idle')
    setZipFeedback('')
  }
  const phoneRegex = /^\(\d{3}\)\s\d{3}-\d{4}$/
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i
  const hasInvalidPhone = (value: string) => Boolean(value && !phoneRegex.test(value.trim()))
  const hasInvalidEmail = (value: string) => Boolean(value && !emailRegex.test(value.trim()))

  const formatPhoneInput = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 10)
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }

  const handlePhoneChange = (field: 'phone' | 'office_phone' | 'personal_phone', raw: string) => {
    setProfile({ ...profile, [field]: formatPhoneInput(raw) })
  }

  const lookupZip = async (zipOverride?: string) => {
    const zip = (zipOverride ?? profile.postal_code ?? '').trim()
    const zip5 = zip.match(/^\d{5}/)?.[0]
    if (!zip5) {
      setZipStatus('error')
      setZipFeedback('Enter a 5-digit ZIP code first')
      return
    }
    try {
      setZipStatus('loading')
      setZipFeedback('Looking up city and state…')
      const res = await fetch(`/api/lookup/zip?code=${zip5}`)
      const data = await res.json()
      if (!res.ok || data?.error) throw new Error(data?.error || 'ZIP not found')
      const { city, state } = data
      setProfile((prev: any) => ({ ...prev, city, state }))
      setZipStatus('success')
      setZipFeedback(`Filled: ${city}, ${state}`)
    } catch (err: any) {
      setZipStatus('error')
      setZipFeedback(err?.message || 'Could not find a city/state for this ZIP code')
    }
  }

  const handleZipChange = (value: string) => {
    setProfile((prev: any) => ({ ...prev, postal_code: value }))
    setZipStatus('idle')
    setZipFeedback('')
    const zip5 = value.replace(/\D/g, '').slice(0, 5)
    if (zip5.length === 5) lookupZip(zip5)
  }

  const sections = [
    {
      id: 'personal',
      label: 'Personal Information',
      icon: User,
      color: G.profile,
      fields: (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          <Field label="First Name">
            <input type="text" value={profile.first_name || ''} disabled={editMode !== 'personal'} className={inputCls}
              style={editMode === 'personal' ? { borderColor: G.profile.hex, '--tw-ring-color': `${G.profile.hex}33` } as any : { borderColor: '#e2e8f0', background: '#f8fafc' }}
              onChange={e => setProfile({ ...profile, first_name: e.target.value })} placeholder="First name" />
          </Field>
          <Field label="Last Name">
            <input type="text" value={profile.last_name || ''} disabled={editMode !== 'personal'} className={inputCls}
              style={editMode === 'personal' ? { borderColor: G.profile.hex, '--tw-ring-color': `${G.profile.hex}33` } as any : { borderColor: '#e2e8f0', background: '#f8fafc' }}
              onChange={e => setProfile({ ...profile, last_name: e.target.value })} placeholder="Last name" />
          </Field>
          <Field label="Email Address">
            <div className="relative">
              <input type="email" value={profile.email || ''} disabled={editMode !== 'personal'} className={`${inputCls} pr-10`}
                style={editMode === 'personal'
                  ? (hasInvalidEmail(profile.email || '') ? { borderColor: '#dc2626', '--tw-ring-color': 'rgba(220, 38, 38, 0.25)' } : { borderColor: G.profile.hex } as any)
                  : { borderColor: '#e2e8f0', background: '#f8fafc' }}
                onChange={e => setProfile({ ...profile, email: e.target.value.trimStart() })}
                onBlur={e => setProfile({ ...profile, email: e.target.value.trim().toLowerCase() })} />
              {profile.email_verified && <CheckCircle2 size={16} color="#10b981" className="absolute right-3 top-3.5" />}
            </div>
            {editMode === 'personal' && hasInvalidEmail(profile.email || '') && (
              <p className="mt-1.5 text-xs font-semibold text-rose-700">Enter a valid email address</p>
            )}
            {!profile.email_verified && editMode !== 'personal' && (
              <button onClick={sendEmailVerification} disabled={verificationSent}
                className="text-xs font-semibold mt-1.5 hover:opacity-70 transition-opacity"
                style={{ color: G.profile.hex }}>
                {verificationSent ? '✓ Verification sent' : 'Send verification email'}
              </button>
            )}
          </Field>
          <Field label="Phone">
            <input type="tel" value={profile.phone || ''} disabled={editMode !== 'personal'} className={inputCls}
              style={editMode === 'personal'
                ? (hasInvalidPhone(profile.phone || '') ? { borderColor: '#dc2626', '--tw-ring-color': 'rgba(220, 38, 38, 0.25)' } : { borderColor: G.profile.hex } as any)
                : { borderColor: '#e2e8f0', background: '#f8fafc' }}
              onChange={e => handlePhoneChange('phone', e.target.value)} placeholder="(555) 000-0000" />
            {editMode === 'personal' && hasInvalidPhone(profile.phone || '') && (
              <p className="mt-1.5 text-xs font-semibold text-rose-700">Use format (555) 000-0000</p>
            )}
          </Field>
          <Field label="Office Phone">
            <input type="tel" value={profile.office_phone || ''} disabled={editMode !== 'personal'} className={inputCls}
              style={editMode === 'personal'
                ? (hasInvalidPhone(profile.office_phone || '') ? { borderColor: '#dc2626', '--tw-ring-color': 'rgba(220, 38, 38, 0.25)' } : { borderColor: G.profile.hex } as any)
                : { borderColor: '#e2e8f0', background: '#f8fafc' }}
              onChange={e => handlePhoneChange('office_phone', e.target.value)} placeholder="(555) 000-0000" />
            {editMode === 'personal' && hasInvalidPhone(profile.office_phone || '') && (
              <p className="mt-1.5 text-xs font-semibold text-rose-700">Use format (555) 000-0000</p>
            )}
          </Field>
          <Field label="Personal Phone">
            <input type="tel" value={profile.personal_phone || ''} disabled={editMode !== 'personal'} className={inputCls}
              style={editMode === 'personal'
                ? (hasInvalidPhone(profile.personal_phone || '') ? { borderColor: '#dc2626', '--tw-ring-color': 'rgba(220, 38, 38, 0.25)' } : { borderColor: G.profile.hex } as any)
                : { borderColor: '#e2e8f0', background: '#f8fafc' }}
              onChange={e => handlePhoneChange('personal_phone', e.target.value)} placeholder="(555) 000-0000" />
            {editMode === 'personal' && hasInvalidPhone(profile.personal_phone || '') && (
              <p className="mt-1.5 text-xs font-semibold text-rose-700">Use format (555) 000-0000</p>
            )}
          </Field>
          <Field label="Work Email">
            <input type="email" value={profile.work_email || ''} disabled={editMode !== 'personal'} className={inputCls}
              style={editMode === 'personal'
                ? (hasInvalidEmail(profile.work_email || '') ? { borderColor: '#dc2626', '--tw-ring-color': 'rgba(220, 38, 38, 0.25)' } : { borderColor: G.profile.hex } as any)
                : { borderColor: '#e2e8f0', background: '#f8fafc' }}
              onChange={e => setProfile({ ...profile, work_email: e.target.value.trimStart() })}
              onBlur={e => setProfile({ ...profile, work_email: e.target.value.trim().toLowerCase() })}
              placeholder="name@company.com" />
            {editMode === 'personal' && hasInvalidEmail(profile.work_email || '') && (
              <p className="mt-1.5 text-xs font-semibold text-rose-700">Enter a valid work email address</p>
            )}
          </Field>
          <Field label="Personal Email">
            <input type="email" value={profile.personal_email || ''} disabled={editMode !== 'personal'} className={inputCls}
              style={editMode === 'personal'
                ? (hasInvalidEmail(profile.personal_email || '') ? { borderColor: '#dc2626', '--tw-ring-color': 'rgba(220, 38, 38, 0.25)' } : { borderColor: G.profile.hex } as any)
                : { borderColor: '#e2e8f0', background: '#f8fafc' }}
              onChange={e => setProfile({ ...profile, personal_email: e.target.value.trimStart() })}
              onBlur={e => setProfile({ ...profile, personal_email: e.target.value.trim().toLowerCase() })}
              placeholder="name@gmail.com" />
            {editMode === 'personal' && hasInvalidEmail(profile.personal_email || '') && (
              <p className="mt-1.5 text-xs font-semibold text-rose-700">Enter a valid personal email address</p>
            )}
          </Field>
        </div>
      ),
    },
    {
      id: 'company',
      label: 'Company Information',
      icon: Building2,
      color: G.overview,
      fields: (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          <Field label="Company Name">
            <input type="text" value={profile.company || ''} disabled={editMode !== 'company'} className={inputCls}
              style={editMode === 'company' ? { borderColor: G.overview.hex } as any : { borderColor: '#e2e8f0', background: '#f8fafc' }}
              onChange={e => setProfile({ ...profile, company: e.target.value })} placeholder="Your company" />
          </Field>
          <Field label="Job Title">
            <input type="text" value={profile.title || ''} disabled={editMode !== 'company'} className={inputCls}
              style={editMode === 'company' ? { borderColor: G.overview.hex } as any : { borderColor: '#e2e8f0', background: '#f8fafc' }}
              onChange={e => setProfile({ ...profile, title: e.target.value })} placeholder="Your role" />
          </Field>
        </div>
      ),
    },
    {
      id: 'social',
      label: 'Social Media',
      icon: MessageSquare,
      color: G.support,
      fields: (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          <Field label="LinkedIn URL">
            <input type="url" value={profile.linkedin || ''} disabled={editMode !== 'social'} className={inputCls}
              style={editMode === 'social' ? { borderColor: G.support.hex } as any : { borderColor: '#e2e8f0', background: '#f8fafc' }}
              onChange={e => setProfile({ ...profile, linkedin: e.target.value })} placeholder="https://linkedin.com/in/yourname" />
          </Field>
          <Field label="X (Twitter) URL">
            <input type="url" value={profile.twitter || ''} disabled={editMode !== 'social'} className={inputCls}
              style={editMode === 'social' ? { borderColor: G.support.hex } as any : { borderColor: '#e2e8f0', background: '#f8fafc' }}
              onChange={e => setProfile({ ...profile, twitter: e.target.value })} placeholder="https://x.com/yourhandle" />
          </Field>
          <Field label="Facebook URL">
            <input type="url" value={profile.facebook || ''} disabled={editMode !== 'social'} className={inputCls}
              style={editMode === 'social' ? { borderColor: G.support.hex } as any : { borderColor: '#e2e8f0', background: '#f8fafc' }}
              onChange={e => setProfile({ ...profile, facebook: e.target.value })} placeholder="https://facebook.com/yourprofile" />
          </Field>
          <Field label="Instagram URL">
            <input type="url" value={profile.instagram || ''} disabled={editMode !== 'social'} className={inputCls}
              style={editMode === 'social' ? { borderColor: G.support.hex } as any : { borderColor: '#e2e8f0', background: '#f8fafc' }}
              onChange={e => setProfile({ ...profile, instagram: e.target.value })} placeholder="https://instagram.com/yourhandle" />
          </Field>
        </div>
      ),
    },
    {
      id: 'address',
      label: 'Address',
      icon: MapPin,
      color: G.billing,
      fields: (
        <div className="space-y-4">
          <Field label="Street Address">
            <div className="relative">
              <input
                type="text"
                value={profile.address_line1 || ''}
                disabled={editMode !== 'address'}
                className={inputCls}
                style={editMode === 'address' ? { borderColor: G.billing.hex } as any : { borderColor: '#e2e8f0', background: '#f8fafc' }}
                autoComplete="off"
                placeholder="123 Main St — start typing for suggestions"
                onChange={e => {
                  setProfile({ ...profile, address_line1: e.target.value })
                  if (editMode === 'address') fetchAddressSuggestions(e.target.value)
                }}
                onFocus={() => addrSuggestions.length > 0 && setAddrOpen(true)}
                onBlur={() => setTimeout(() => setAddrOpen(false), 180)}
              />
              {editMode === 'address' && addrLoading && (
                <Loader2 size={14} className="animate-spin absolute right-3 top-3.5 text-slate-400" />
              )}
              {addrOpen && addrSuggestions.length > 0 && (
                <ul
                  className="absolute z-50 left-0 right-0 mt-1 rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden"
                  style={{ maxHeight: 220, overflowY: 'auto' }}
                >
                  {addrSuggestions.map((s, i) => (
                    <li
                      key={i}
                      onMouseDown={() => applyAddressSuggestion(s)}
                      className="px-4 py-2.5 text-sm cursor-pointer hover:bg-slate-50 border-b border-slate-100 last:border-0"
                    >
                      <p className="font-semibold text-slate-800 truncate">{s.street || s.label.split(',')[0]}</p>
                      <p className="text-xs text-slate-500 truncate">{[s.city, s.state, s.postalCode].filter(Boolean).join(', ')}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="ZIP Code">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={profile.postal_code || ''}
                  disabled={editMode !== 'address'}
                  maxLength={10}
                  className={inputCls}
                  style={editMode === 'address' ? { borderColor: G.billing.hex } as any : { borderColor: '#e2e8f0', background: '#f8fafc' }}
                  onChange={e => handleZipChange(e.target.value)}
                  placeholder="22314"
                />
              </div>
              {zipStatus !== 'idle' && (
                <p className="mt-1.5 text-xs font-semibold" style={{ color: zipStatus === 'error' ? '#be123c' : zipStatus === 'success' ? '#0f766e' : '#64748b' }}>
                  {zipFeedback}
                </p>
              )}
            </Field>
            <Field label="City">
              <input type="text" value={profile.city || ''} disabled={editMode !== 'address'} className={inputCls}
                style={editMode === 'address'
                  ? { borderColor: zipStatus === 'success' ? '#0f766e' : G.billing.hex } as any
                  : { borderColor: '#e2e8f0', background: '#f8fafc' }}
                onChange={e => setProfile({ ...profile, city: e.target.value })} placeholder="City" />
            </Field>
            <Field label="State">
              <StateCombobox
                value={profile.state || ''}
                onChange={code => setProfile({ ...profile, state: code })}
                disabled={editMode !== 'address'}
              />
            </Field>
          </div>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      {/* Security shortcut — password management lives in Settings & Security */}
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center rounded-xl shrink-0" style={{ width: 36, height: 36, background: G.settings.bg }}>
            <Lock size={15} color="white" />
          </div>
          <div>
            <p className="text-sm font-black text-slate-900">Password & Security</p>
            <p className="text-xs font-semibold text-slate-500">Change password · Two-factor authentication</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold text-white shrink-0"
          style={{ background: G.settings.bg }}
        >
          <Settings size={13} /> Manage Security
        </button>
      </div>

      {sections.map(sec => {
        const isEditing = editMode === sec.id
        const hasActiveEditor = editMode !== null
        const isAnotherSectionActive = hasActiveEditor && !isEditing
        return (
          <div
            key={sec.id}
            className="bg-white rounded-2xl border shadow-sm overflow-hidden transition-all duration-300"
            style={isEditing
              ? { borderColor: sec.color.softBorder, boxShadow: `0 10px 30px ${sec.color.hex}26`, transform: 'translateY(-1px)' }
              : isAnotherSectionActive
                ? { borderColor: '#e2e8f0', opacity: 0.82 }
                : { borderColor: '#e2e8f0' }}
          >
            {/* Section header stripe */}
            <div className="flex items-center justify-between px-6 py-4" style={{ background: sec.color.bg }}>
              <div className="flex items-center gap-2.5">
                <sec.icon size={18} color="white" strokeWidth={2} />
                <span className="font-bold text-white text-base">{sec.label}</span>
              </div>
              <div className="flex items-center gap-2">
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => {
                      const emptyFields: Record<string, Record<string, string>> = {
                        personal: { first_name: '', last_name: '', email: '', phone: '', office_phone: '', personal_phone: '', work_email: '', personal_email: '' },
                        company:  { company: '', title: '' },
                        social:   { linkedin: '', twitter: '', facebook: '', instagram: '' },
                        address:  { address_line1: '', city: '', state: '', postal_code: '' },
                      }
                      setProfile((prev: any) => ({ ...prev, ...(emptyFields[sec.id] || {}) }))
                    }}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-50"
                    style={{ background: 'rgba(255,255,255,0.15)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.45)' }}
                  >
                    <X size={13} />
                    Clear
                  </button>
                )}
                <button
                  onClick={isEditing ? () => saveProfile(sec.label) : () => setEditMode(sec.id)}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-50"
                  style={isEditing
                    ? { background: '#ffffff', color: sec.color.softText }
                    : { background: 'rgba(255,255,255,0.22)', color: '#ffffff' }}
                >
                  {saving ? <Loader2 size={13} className="animate-spin" /> : (isEditing ? <CheckCircle2 size={13} /> : <Pencil size={13} />)}
                  {isEditing ? 'Save Changes' : 'Edit Your Profile'}
                </button>
              </div>
            </div>

            <div
              className="overflow-hidden transition-all duration-300"
              style={isEditing ? { maxHeight: 44, opacity: 1 } : { maxHeight: 0, opacity: 0 }}
            >
              <div className="px-6 py-2.5 text-xs font-bold tracking-wide uppercase" style={{ background: sec.color.soft, color: sec.color.softText }}>
                Edit mode is active. Update fields and click Save Changes.
              </div>
            </div>

            {/* Fields */}
            <div className="p-6 transition-all duration-300" style={isEditing ? { background: '#ffffff' } : { background: '#fcfdff' }}>
              {sec.fields}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Tiny helper
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{label}</label>
      {children}
    </div>
  )
}

// ─── BILLING TAB ──────────────────────────────────────────────────────────────

// ─── STATE COMBOBOX ────────────────────────────────────────────────────────────

const US_STATES = [
  { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' }, { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' }, { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' }, { code: 'DC', name: 'District of Columbia' }, { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' }, { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' }, { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' }, { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' }, { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' }, { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' }, { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' }, { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' }, { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' }, { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' }, { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' }, { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' }, { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' }, { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' }, { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' },
]

/** Convert a full state name or 2-letter code to an uppercase state code, or '' if not found. */
function toStateCode(raw: string): string {
  if (!raw) return ''
  const upper = raw.trim().toUpperCase()
  if (/^[A-Z]{2}$/.test(upper) && US_STATES.some(s => s.code === upper)) return upper
  const match = US_STATES.find(s => s.name.toUpperCase() === upper)
  return match ? match.code : ''
}

function StateCombobox({ value, onChange, hasError, disabled }: { value: string; onChange: (code: string) => void; hasError?: boolean; disabled?: boolean }) {
  const [input, setInput] = useState(value)
  const [open, setOpen] = useState(false)

  useEffect(() => { setInput(value) }, [value])

  const q = input.trim().toUpperCase()
  const filtered = q.length === 0
    ? US_STATES
    : US_STATES.filter(s =>
        s.code.startsWith(q) ||
        s.name.toUpperCase().startsWith(q) ||
        s.name.toUpperCase().includes(q)
      )

  const select = (code: string) => { onChange(code); setInput(code); setOpen(false) }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.slice(0, 20)
    setInput(raw)
    setOpen(true)
    const upper = raw.trim().toUpperCase()
    if (/^[A-Z]{2}$/.test(upper) && US_STATES.find(s => s.code === upper)) {
      onChange(upper)
    } else if (raw === '') {
      onChange('')
    }
  }

  const handleBlur = () => {
    setTimeout(() => {
      setOpen(false)
      const upper = input.trim().toUpperCase()
      const match = US_STATES.find(s => s.code === upper)
      if (match) { onChange(match.code); setInput(match.code) }
      else if (value) { setInput(value) }
    }, 180)
  }

  if (disabled) {
    return (
      <div className="w-full px-4 py-3 border rounded-xl text-slate-900 text-sm" style={{ borderColor: '#e2e8f0', background: '#f8fafc' }}>
        {value || <span className="text-slate-400">VA</span>}
      </div>
    )
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={input}
        onChange={handleChange}
        onFocus={() => setOpen(true)}
        onBlur={handleBlur}
        placeholder="VA or Virginia"
        autoComplete="off"
        className={`w-full px-3.5 py-2.5 rounded-md border text-sm text-slate-900 ${hasError ? 'border-red-300' : 'border-slate-200'}`}
      />
      {open && filtered.length > 0 && (
        <ul
          className="absolute z-50 left-0 right-0 mt-1 rounded-md border border-slate-200 bg-white shadow-xl overflow-y-auto"
          style={{ maxHeight: 200 }}
        >
          {filtered.slice(0, 12).map(s => (
            <li
              key={s.code}
              onMouseDown={() => select(s.code)}
              className="px-3 py-2 flex items-center gap-3 cursor-pointer hover:bg-slate-50 border-b border-slate-100 last:border-0"
            >
              <span className="w-8 text-xs font-black text-slate-900 shrink-0">{s.code}</span>
              <span className="text-sm text-slate-600">{s.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ─── ADD CARD INLINE ──────────────────────────────────────────────────────────

function AddCardForm({ clientSecret, onSuccess, onCancel, cardNickname, profile }: { clientSecret: string; onSuccess: () => void; onCancel: () => void; cardNickname: string; profile?: any }) {
  const stripe = useStripe()
  const elements = useElements()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cardholderName, setCardholderName] = useState(() => [profile?.first_name, profile?.last_name].filter(Boolean).join(' '))
  const [addressLine1, setAddressLine1] = useState(profile?.address_line1 || '')
  const [addressLine2, setAddressLine2] = useState('')
  const [city, setCity] = useState(profile?.city || '')
  const [state, setState] = useState(toStateCode(profile?.state || ''))
  const [postalCode, setPostalCode] = useState(profile?.postal_code || '')
  const [country, setCountry] = useState('US')
  const [cardNumberComplete, setCardNumberComplete] = useState(false)
  const [cardExpiryComplete, setCardExpiryComplete] = useState(false)
  const [cardCvcComplete, setCardCvcComplete] = useState(false)
  const [cardFieldError, setCardFieldError] = useState('')
  const [cardBrand, setCardBrand] = useState('')
  const [addrSuggestions, setAddrSuggestions] = useState<Array<{ street: string; city: string; state: string; postalCode: string; label: string }>>([])
  const [addrOpen, setAddrOpen] = useState(false)
  const [addrLoading, setAddrLoading] = useState(false)
  const addrDebounceRef = useState<ReturnType<typeof setTimeout> | null>(null)
  const [zipPrefillStatus, setZipPrefillStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [zipPrefillFeedback, setZipPrefillFeedback] = useState('')

  const formattedState = state.trim()
  const formattedPostalCode = postalCode.trim()
  const formattedCountry = country.trim().toUpperCase()
  const isStateValid = /^[A-Z]{2}$/.test(formattedState)
  const isPostalCodeValid = /^\d{5}(-\d{4})?$/.test(formattedPostalCode)
  const isCountryValid = /^[A-Z]{2}$/.test(formattedCountry)

  const formatPostalCodeInput = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 9)
    if (digits.length <= 5) return digits
    return `${digits.slice(0, 5)}-${digits.slice(5)}`
  }

  const fetchAddressSuggestions = (value: string) => {
    if (addrDebounceRef[0]) clearTimeout(addrDebounceRef[0])
    if (value.length < 3) {
      setAddrSuggestions([])
      setAddrOpen(false)
      return
    }
    addrDebounceRef[1](
      setTimeout(async () => {
        try {
          setAddrLoading(true)
          const res = await fetch(`/api/lookup/address?q=${encodeURIComponent(value)}`)
          const data = await res.json()
          setAddrSuggestions(data?.results || [])
          setAddrOpen((data?.results || []).length > 0)
        } catch {
          setAddrSuggestions([])
          setAddrOpen(false)
        } finally {
          setAddrLoading(false)
        }
      }, 380)
    )
  }

  const applyAddressSuggestion = (s: { street: string; city: string; state: string; postalCode: string }) => {
    setAddressLine1(s.street || addressLine1)
    setCity(s.city || city)
    setState((s.state || state).toUpperCase())
    if (s.postalCode) {
      setPostalCode(formatPostalCodeInput(s.postalCode))
      setZipPrefillStatus('success')
      setZipPrefillFeedback('Address applied from suggestion.')
    }
    setAddrOpen(false)
  }

  const lookupZip = async (zipOverride?: string) => {
    const zip = (zipOverride ?? postalCode ?? '').trim()
    const zip5 = zip.match(/^\d{5}/)?.[0]
    if (!zip5) {
      setZipPrefillStatus('error')
      setZipPrefillFeedback('Enter a 5-digit ZIP code first.')
      return
    }
    try {
      setZipPrefillStatus('loading')
      setZipPrefillFeedback('Looking up city and state...')
      const res = await fetch(`/api/lookup/zip?code=${zip5}`)
      const data = await res.json()
      if (!res.ok || data?.error) throw new Error(data?.error || 'ZIP not found')
      setCity(data.city || city)
      setState((data.state || state).toUpperCase())
      setZipPrefillStatus('success')
      setZipPrefillFeedback(`Filled: ${data.city}, ${data.state}`)
    } catch (err: any) {
      setZipPrefillStatus('error')
      setZipPrefillFeedback(err?.message || 'Could not find a city/state for this ZIP code')
    }
  }

  const handlePostalCodeChange = (value: string) => {
    const formatted = formatPostalCodeInput(value)
    setPostalCode(formatted)
    setZipPrefillStatus('idle')
    setZipPrefillFeedback('')
    const zip5 = formatted.replace(/\D/g, '').slice(0, 5)
    if (zip5.length === 5) lookupZip(zip5)
  }

  const elementBaseStyle = {
    base: {
      color: '#0f172a',
      fontFamily: "'Segoe UI', 'Arial', sans-serif",
      fontSize: '20px',
      fontWeight: '700',
      lineHeight: '30px',
      letterSpacing: '0.2px',
      '::placeholder': { color: '#475569' },
    },
    invalid: {
      color: '#dc2626',
    },
  }

  const isBillingValid = Boolean(
    cardholderName.trim() &&
    addressLine1.trim() &&
    city.trim() &&
    isStateValid &&
    isPostalCodeValid &&
    isCountryValid
  )
  const isCardValid = cardNumberComplete && cardExpiryComplete && cardCvcComplete && !cardFieldError
  const stripeReady = Boolean(stripe && elements)
  const canSubmit = Boolean(!submitting && isBillingValid && isCardValid)

  const missingFields: string[] = []
  if (!cardholderName.trim()) missingFields.push('Cardholder Name')
  if (!addressLine1.trim()) missingFields.push('Address Line 1')
  if (!city.trim()) missingFields.push('City')
  if (!isStateValid) missingFields.push('State (2 letters)')
  if (!isPostalCodeValid) missingFields.push('ZIP Code')
  if (!isCountryValid) missingFields.push('Country (2 letters)')
  if (!cardNumberComplete) missingFields.push('Card Number')
  if (!cardExpiryComplete) missingFields.push('Expiry')
  if (!cardCvcComplete) missingFields.push('CVC')

  const cardBrandLabel = (() => {
    switch (cardBrand) {
      case 'visa': return 'Visa'
      case 'mastercard': return 'Mastercard'
      case 'amex': return 'American Express'
      case 'discover': return 'Discover'
      case 'diners': return 'Diners Club'
      case 'jcb': return 'JCB'
      case 'unionpay': return 'UnionPay'
      case 'cartes_bancaires': return 'Cartes Bancaires'
      default: return ''
    }
  })()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) {
      setError('Secure card fields are still loading. Please wait a moment and try again.')
      return
    }

    const cardNumberElement = elements.getElement(CardNumberElement)
    if (!cardNumberElement) {
      setError('Card fields are still loading. Please wait a moment and try again.')
      return
    }
    if (!isBillingValid || !isCardValid) {
      setError('Please complete required fields and use valid State (2 letters) and ZIP (12345 or 12345-6789).')
      return
    }

    setSubmitting(true)
    setError(null)
    const { error: confirmError, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
      payment_method: {
        card: cardNumberElement,
        billing_details: {
          name: cardholderName.trim(),
          address: {
            line1: addressLine1.trim(),
            line2: addressLine2.trim() || undefined,
            city: city.trim(),
            state: formattedState,
            postal_code: formattedPostalCode,
            country: formattedCountry,
          },
        },
      },
    })
    if (confirmError) {
      setError(confirmError.message || 'Card setup failed')
      setSubmitting(false)
    } else {
      const paymentMethodId = typeof setupIntent?.payment_method === 'string'
        ? setupIntent.payment_method
        : setupIntent?.payment_method?.id

      if (paymentMethodId && cardNickname.trim()) {
        try {
          await fetch('/api/account/payment-methods/nickname', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentMethodId, nickname: cardNickname.trim() }),
          })
        } catch {
          // Non-blocking: card is already saved, nickname update can be retried later.
        }
      }

      onSuccess()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-4xl">
      {profile?.address_line1 && (
        <div className="flex items-center justify-between rounded-md border border-blue-200 bg-blue-50 px-3.5 py-2.5">
          <p className="text-xs font-semibold text-blue-700">Your profile address is pre-filled. You can edit any field below.</p>
          <button
            type="button"
            onClick={() => {
              setCardholderName([profile?.first_name, profile?.last_name].filter(Boolean).join(' '))
              setAddressLine1(profile.address_line1 || '')
              setAddressLine2(profile.address_line2 || '')
              setCity(profile.city || '')
              setState(toStateCode(profile.state || ''))
              setPostalCode(profile.postal_code || '')
            }}
            className="text-xs font-bold text-blue-700 hover:text-blue-900 underline whitespace-nowrap ml-4"
          >
            Reset from profile
          </button>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Cardholder Name</label>
          <input
            type="text"
            value={cardholderName}
            onChange={e => setCardholderName(e.target.value)}
            placeholder="Name on card"
            className="w-full px-3.5 py-2.5 rounded-md border border-slate-200 text-sm text-slate-900"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Billing Address Line 1</label>
          <div className="relative">
            <input
              type="text"
              value={addressLine1}
              onChange={e => {
                setAddressLine1(e.target.value)
                fetchAddressSuggestions(e.target.value)
              }}
              onFocus={() => addrSuggestions.length > 0 && setAddrOpen(true)}
              onBlur={() => setTimeout(() => setAddrOpen(false), 180)}
              autoComplete="off"
              placeholder="123 Main St - start typing for suggestions"
              className="w-full px-3.5 py-2.5 rounded-md border border-slate-200 text-sm text-slate-900"
            />
            {addrLoading && (
              <Loader2 size={14} className="animate-spin absolute right-3 top-3.5 text-slate-400" />
            )}
            {addrOpen && addrSuggestions.length > 0 && (
              <ul
                className="absolute z-50 left-0 right-0 mt-1 rounded-md border border-slate-200 bg-white shadow-xl overflow-hidden"
                style={{ maxHeight: 220, overflowY: 'auto' }}
              >
                {addrSuggestions.map((s, i) => (
                  <li
                    key={i}
                    onMouseDown={() => applyAddressSuggestion(s)}
                    className="px-4 py-2.5 text-sm cursor-pointer hover:bg-slate-50 border-b border-slate-100 last:border-0"
                  >
                    <p className="font-semibold text-slate-800 truncate">{s.street || s.label.split(',')[0]}</p>
                    <p className="text-xs text-slate-500 truncate">{[s.city, s.state, s.postalCode].filter(Boolean).join(', ')}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Billing Address Line 2 (Optional)</label>
          <input
            type="text"
            value={addressLine2}
            onChange={e => setAddressLine2(e.target.value)}
            placeholder="Apt, suite, etc."
            className="w-full px-3.5 py-2.5 rounded-md border border-slate-200 text-sm text-slate-900"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">City</label>
          <input
            type="text"
            value={city}
            onChange={e => setCity(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-md border border-slate-200 text-sm text-slate-900"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">State</label>
          <StateCombobox
            value={state}
            onChange={code => setState(code)}
            hasError={Boolean(state && !isStateValid)}
          />
          {state && !isStateValid && <p className="mt-1 text-xs font-semibold text-red-600">Pick from list or type 2-letter code, e.g. VA.</p>}
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Postal Code</label>
          <input
            type="text"
            value={postalCode}
            onChange={e => handlePostalCodeChange(e.target.value)}
            placeholder="22314 or 22314-1234"
            className={`w-full px-3.5 py-2.5 rounded-md border text-sm text-slate-900 ${postalCode && !isPostalCodeValid ? 'border-red-300' : 'border-slate-200'}`}
          />
          {postalCode && !isPostalCodeValid && <p className="mt-1 text-xs font-semibold text-red-600">Use ZIP format 12345 or 12345-6789.</p>}
          {zipPrefillStatus !== 'idle' && (
            <p className={`mt-1 text-xs font-semibold ${zipPrefillStatus === 'error' ? 'text-red-600' : zipPrefillStatus === 'success' ? 'text-emerald-600' : 'text-slate-500'}`}>
              {zipPrefillFeedback}
            </p>
          )}
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Country</label>
          <input
            type="text"
            value={country}
            onChange={e => setCountry(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2))}
            maxLength={2}
            placeholder="US"
            className={`w-full px-3.5 py-2.5 rounded-md border text-sm text-slate-900 ${country && !isCountryValid ? 'border-red-300' : 'border-slate-200'}`}
          />
          {country && !isCountryValid && <p className="mt-1 text-xs font-semibold text-red-600">Use 2-letter country code, e.g. US.</p>}
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Card Number</label>
          <div className="px-4 py-3.5 min-h-14 rounded-md border-2 border-slate-400 bg-white">
            <CardNumberElement
              options={{ style: elementBaseStyle }}
              onChange={e => {
                setCardNumberComplete(e.complete)
                setCardFieldError(e.error?.message || '')
                setCardBrand(e.brand || '')
              }}
            />
          </div>
          {cardBrandLabel && (
            <p className="mt-1 text-sm font-bold text-slate-700">Detected card type: {cardBrandLabel}</p>
          )}
        </div>
        <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Expiry</label>
            <div className="px-4 py-3.5 min-h-14 rounded-md border-2 border-slate-400 bg-white">
              <CardExpiryElement
                options={{ style: elementBaseStyle }}
                onChange={e => {
                  setCardExpiryComplete(e.complete)
                  setCardFieldError(e.error?.message || '')
                }}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">CVC</label>
            <div className="px-4 py-3.5 min-h-14 rounded-md border-2 border-slate-400 bg-white">
              <CardCvcElement
                options={{ style: elementBaseStyle }}
                onChange={e => {
                  setCardCvcComplete(e.complete)
                  setCardFieldError(e.error?.message || '')
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {!stripeReady && <p className="text-xs font-semibold text-slate-500">Loading secure card fields...</p>}
      {!canSubmit && missingFields.length > 0 && (
        <p className="text-xs font-semibold text-amber-700">Required before save: {missingFields.join(', ')}</p>
      )}
      {!cardFieldError && isCardValid && isBillingValid && (
        <p className="text-xs font-semibold text-emerald-600">Card details look valid and ready to save.</p>
      )}
      {cardFieldError && <p className="text-sm font-semibold text-red-600">{cardFieldError}</p>}
      {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={!canSubmit}
          className="flex-1 py-2.5 rounded-md text-sm font-black text-white transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ background: G.billing.bg }}
        >
          {submitting
            ? <><Loader2 size={14} className="animate-spin" /> Saving your payment details…</>
            : <><CreditCard size={14} /> Save Card</>}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="px-5 py-2.5 rounded-md text-sm font-bold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

function AddCardInline({ onCardAdded, onClose, profile }: { onCardAdded: () => void; onClose: () => void; profile?: any }) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [stripeInitError, setStripeInitError] = useState<string | null>(null)
  const [cardNickname, setCardNickname] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    if (!stripePromise) return
    stripePromise
      .then((stripeClient) => {
        if (!stripeClient) {
          setStripeInitError('Stripe key is invalid or expired. Please update NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.')
        }
      })
      .catch(() => {
        setStripeInitError('Stripe key is invalid or expired. Please update NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.')
      })
  }, [])

  useEffect(() => {
    fetch('/api/stripe/setup-intent', { method: 'POST' })
      .then(r => r.json())
      .then(d => {
        if (d.clientSecret) setClientSecret(d.clientSecret)
        else setFetchError(d.error || 'Could not initialize card form')
      })
      .catch(() => setFetchError('Network error — please try again'))
  }, [])

  return (
    <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-black text-slate-800">Add Payment Method</p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => document.getElementById('saved-cards-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800"
          >
            Manage Saved Cards
          </button>
          <button onClick={onClose} className="text-xs font-bold text-slate-500 hover:text-slate-700">Hide</button>
        </div>
      </div>

      {saveSuccess && (
        <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <p className="text-sm font-bold text-emerald-700">Payment details saved!</p>
        </div>
      )}

      {fetchError || stripeInitError ? (
        <p className="text-sm text-red-600 font-semibold py-2">{fetchError || stripeInitError}</p>
      ) : !stripePromise ? (
        <p className="text-sm text-red-600 font-semibold py-2">Stripe is not configured. Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.</p>
      ) : !clientSecret ? (
        <div className="flex items-center py-3 gap-2 text-slate-400">
          <Loader2 size={16} className="animate-spin" />
          <span className="text-sm">Preparing secure form…</span>
        </div>
      ) : (
        <Elements stripe={stripePromise} options={{ appearance: { theme: 'stripe', variables: { borderRadius: '12px', colorPrimary: G.billing.hex } } }}>
          <div className="mb-4">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Card Nickname (Optional)</label>
            <input
              type="text"
              value={cardNickname}
              onChange={e => setCardNickname(e.target.value)}
              placeholder="e.g., Delta Amex or Citi Credit Card"
              className="w-full px-4 py-3 border rounded-xl text-slate-900 text-sm transition-all outline-none focus:ring-2 border-slate-200"
            />
          </div>
          <AddCardForm
            clientSecret={clientSecret}
            cardNickname={cardNickname}
            profile={profile}
            onSuccess={() => {
              setSaveSuccess(true)
              setTimeout(() => {
                onClose()
                onCardAdded()
              }, 900)
            }}
            onCancel={onClose}
          />
        </Elements>
      )}
    </div>
  )
}

// ─── CARD BRAND BADGE ─────────────────────────────────────────────────────────

function CardBrandBadge({ brand }: { brand: string }) {
  const b = (brand || '').toLowerCase()
  const configs: Record<string, { label: string; bg: string; color: string; italic?: boolean }> = {
    visa:       { label: 'VISA',       bg: '#1A1F71', color: '#ffffff', italic: true },
    mastercard: { label: 'MC',         bg: '#EB001B', color: '#ffffff' },
    amex:       { label: 'AMEX',       bg: '#007BC1', color: '#ffffff' },
    discover:   { label: 'DISC',       bg: '#FF6600', color: '#ffffff' },
    diners:     { label: 'DINERS',     bg: '#004A97', color: '#ffffff' },
    jcb:        { label: 'JCB',        bg: '#003087', color: '#ffffff' },
    unionpay:   { label: 'UP',         bg: '#C0392B', color: '#ffffff' },
  }
  const cfg = configs[b]
  if (!cfg) {
    return (
      <div className="w-10 h-7 rounded-md flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #334155, #0f172a)' }}>
        <CreditCard size={14} color="white" />
      </div>
    )
  }
  return (
    <div
      className="w-10 h-7 rounded-md flex items-center justify-center"
      style={{ background: cfg.bg }}
    >
      <span style={{ color: cfg.color, fontSize: '9px', fontWeight: 900, fontStyle: cfg.italic ? 'italic' : 'normal', letterSpacing: '0.05em' }}>
        {cfg.label}
      </span>
    </div>
  )
}

// ─── BILLING TAB ──────────────────────────────────────────────────────────────

function BillingTab({ plan, currentPlanDetails, paymentMethods, invoices, billingInterval, setBillingInterval, handlePlanChange, managePaymentMethod, handleCancelSubscription, loadingPlanChange, planLastSyncedAt, refreshingPlan, refreshPlanData, onCardAdded, profile }: any) {
  const [showAddCard, setShowAddCard] = useState(false)
  const [editingCardId, setEditingCardId] = useState<string | null>(null)
  const [nicknameDraft, setNicknameDraft] = useState('')
  const [savingNickname, setSavingNickname] = useState(false)
  const [selectedCheckoutCardId, setSelectedCheckoutCardId] = useState<string | null>(null)
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [cardActionError, setCardActionError] = useState<string | null>(null)
  const hasActivePlan = Boolean(plan && plan.tier && plan.tier !== 'NONE' && currentPlanDetails)
  const tierRank: Record<string, number> = { BASIC: 1, PROFESSIONAL: 2, ENTERPRISE: 3 }
  const visibleInvoices = hasActivePlan ? invoices : invoices.filter((inv: Invoice) => Number(inv.amount || 0) > 0)
  const lastPaidInvoice = [...invoices]
    .filter((inv: Invoice) => String(inv.status || '').toLowerCase() === 'paid' && Number(inv.amount || 0) > 0)
    .sort((a: Invoice, b: Invoice) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]

  const saveCardNickname = async (paymentMethodId: string) => {
    try {
      setSavingNickname(true)
      const res = await fetch('/api/account/payment-methods/nickname', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethodId, nickname: nicknameDraft.trim() }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d?.error || 'Failed to save card nickname')
      }
      setEditingCardId(null)
      setNicknameDraft('')
      await onCardAdded()
    } catch (err) {
      console.error('Nickname save failed:', err)
    } finally {
      setSavingNickname(false)
    }
  }

  const selectedCheckoutCard = paymentMethods.find((m: PaymentMethod) => m.id === selectedCheckoutCardId) || null

  const handleSetDefault = async (paymentMethodId: string) => {
    try {
      setSettingDefaultId(paymentMethodId)
      setCardActionError(null)
      const res = await fetch('/api/account/payment-methods/set-default', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethodId }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d?.error || 'Failed to set default card')
      }
      await onCardAdded()
    } catch (err: any) {
      setCardActionError(err?.message || 'Failed to set default card')
    } finally {
      setSettingDefaultId(null)
    }
  }

  const handleDeleteCard = async (paymentMethodId: string) => {
    if (!confirm('Remove this card? This cannot be undone.')) return
    try {
      setDeletingId(paymentMethodId)
      setCardActionError(null)
      const res = await fetch('/api/account/payment-methods/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethodId }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d?.error || 'Failed to remove card')
      }
      await onCardAdded()
    } catch (err: any) {
      setCardActionError(err?.message || 'Failed to remove card')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">

      {/* Payment security assurance */}
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-emerald-800">
            <ShieldCheck size={18} className="shrink-0 text-emerald-600" />
            <span className="text-sm font-black">Bank-grade security · SOC 2 compliant · Encrypted end-to-end</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-emerald-700">
            <span className="inline-flex items-center gap-1"><CheckCircle2 size={13} /> PCI DSS compliant payment processing</span>
            <span className="inline-flex items-center gap-1"><CheckCircle2 size={13} /> All card data encrypted via TLS 1.2+</span>
            <span className="inline-flex items-center gap-1"><CheckCircle2 size={13} /> Payments powered by Stripe</span>
            <span className="inline-flex items-center gap-1"><CheckCircle2 size={13} /> We never store raw card numbers</span>
          </div>
        </div>
      </div>

      {/* Current plan banner */}
      {currentPlanDetails ? (
        <div className="rounded-2xl p-6 text-white shadow-lg" style={{ background: currentPlanDetails.bg }}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.92)' }}>
                Subscription Summary
              </p>
              <div className="flex items-center gap-2 mt-1 mb-1">
                <currentPlanDetails.icon size={22} color="white" />
                <span className="text-2xl font-black">Current Plan: {currentPlanDetails.name}</span>
              </div>
              <p className="text-base font-black" style={{ color: '#fff' }}>
                ${plan.interval === 'year' ? currentPlanDetails.annualPrice : currentPlanDetails.monthlyPrice}
                <span className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.95)' }}>
                  /{plan.interval === 'year' ? 'year' : 'month'}
                </span>
                {plan.current_period_end && <> · Renews {new Date(plan.current_period_end).toLocaleDateString()}</>}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="px-2.5 py-1 rounded-full text-xs font-black" style={{ background: 'rgba(255,255,255,0.22)', color: '#ffffff' }}>
                  Active
                </span>
                {(plan?.is_manual_assigned || plan?.subscription_source === 'admin_assigned') && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-black" style={{ background: 'rgba(30, 41, 59, 0.52)', color: '#ffffff' }}>
                    Admin Assigned Plan
                  </span>
                )}
                <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: 'rgba(15,23,42,0.35)', color: '#ffffff' }}>
                  {plan.interval === 'year' ? 'Annual Billing' : 'Monthly Billing'}
                </span>
                {plan.current_period_end && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: 'rgba(15,23,42,0.35)', color: '#ffffff' }}>
                    {plan.cancel_at_period_end ? 'Ends' : 'Renews'} {new Date(plan.current_period_end).toLocaleDateString()}
                  </span>
                )}
              </div>
              {plan.cancel_at_period_end && <p className="text-sm font-semibold mt-1" style={{ color: '#fde68a' }}>⚠ Cancels at period end</p>}
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={managePaymentMethod}
                className="px-4 py-2.5 rounded-xl text-sm font-black transition-opacity hover:opacity-90"
                style={{ background: '#ffffff', color: '#0f172a' }}
              >
                Manage in Stripe ↗
              </button>
              {!plan.cancel_at_period_end && (
                <button
                  onClick={handleCancelSubscription}
                  className="px-4 py-2.5 rounded-xl text-sm font-black text-white transition-opacity hover:opacity-95"
                  style={{ background: '#7f1d1d', color: '#ffffff', WebkitTextFillColor: '#ffffff', border: '1px solid rgba(255,255,255,0.28)' }}
                >
                  Cancel Plan
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <CreditCard size={28} color="#94a3b8" />
          </div>
          <p className="font-bold text-slate-900 text-lg">No Active Subscription</p>
          <p className="text-slate-500 text-sm mt-1">Choose a plan below to get started</p>
          {lastPaidInvoice && (
            <p className="text-slate-500 text-xs mt-2 font-medium">
              Last paid invoice: ${Number(lastPaidInvoice.amount || 0).toFixed(2)} on {new Date(lastPaidInvoice.date).toLocaleDateString()}
            </p>
          )}
          {invoices.length > 0 && (
            <p className="text-slate-400 text-xs mt-2">Past paid invoices can appear here even after a plan ends.</p>
          )}
        </div>
      )}

      {/* Plan picker */}
      <div id="billing-plan-picker" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: G.billing.bg }}>
              <CreditCard size={20} color="white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{hasActivePlan ? `Change Plan (Currently ${currentPlanDetails.name})` : 'Choose a Plan'}</h2>
              <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 font-semibold">
                <Clock size={12} />
                <span>
                  Last synced: {planLastSyncedAt ? planLastSyncedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                </span>
                <button
                  onClick={() => refreshPlanData(true)}
                  disabled={refreshingPlan}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors"
                >
                  <RefreshCw size={11} className={refreshingPlan ? 'animate-spin' : ''} /> Refresh
                </button>
              </div>
              {selectedCheckoutCard && (
                <p className="mt-2 text-xs font-semibold text-emerald-700">
                  Checkout card selected: {selectedCheckoutCard.brand} •••• {selectedCheckoutCard.last4}
                </p>
              )}
            </div>
          </div>
          {/* Interval toggle */}
          <div className="flex bg-slate-100 rounded-xl p-1">
            {(['monthly', 'annual'] as const).map(i => (
              <button
                key={i}
                onClick={() => setBillingInterval(i)}
                className="px-4 py-1.5 rounded-lg text-sm font-bold transition-all"
                style={billingInterval === i
                  ? (i === 'monthly'
                    ? { background: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)', color: '#ffffff', boxShadow: '0 2px 8px rgba(37,99,235,0.25)' }
                    : { background: 'linear-gradient(135deg, #16a34a 0%, #059669 100%)', color: '#ffffff', boxShadow: '0 2px 8px rgba(5,150,105,0.25)' })
                  : { background: 'transparent', color: '#64748b' }}
              >
                {i === 'annual' ? 'Annual (−20%)' : 'Monthly'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
          {(Object.entries(PLAN_DETAILS) as [keyof typeof PLAN_DETAILS, typeof PLAN_DETAILS[keyof typeof PLAN_DETAILS]][]).map(([tier, details]) => {
            const isCurrentMonthly = plan?.tier === tier && plan?.interval === 'month'
            const isCurrentAnnual  = plan?.tier === tier && plan?.interval === 'year'
            const isCurrent = billingInterval === 'monthly' ? isCurrentMonthly : isCurrentAnnual
            const price     = billingInterval === 'monthly' ? details.monthlyPrice : details.annualPrice
            const apiInterval = billingInterval === 'monthly' ? 'month' : 'year'
            const isLoading = loadingPlanChange === tier
            const currentRank = hasActivePlan && plan?.tier ? tierRank[plan.tier] || 0 : 0
            const targetRank = tierRank[tier] || 0
            const isSameTier = Boolean(hasActivePlan && plan?.tier === tier)
            const featureList = isSameTier ? details.features : details.features.slice(0, 3)

            let actionLabel = 'Select Plan'
            if (isCurrent) {
              actionLabel = 'This Is Your Current Plan'
            } else if (hasActivePlan) {
              if (isSameTier) {
                actionLabel = billingInterval === 'annual' ? 'Switch to Annual' : 'Switch to Monthly'
              } else if (targetRank > currentRank) {
                actionLabel = `Upgrade to ${details.name}`
              } else {
                actionLabel = `Downgrade to ${details.name}`
              }
            }

            return (
              <div
                key={tier}
                className="rounded-2xl border-2 p-5 transition-all"
                style={isCurrent
                  ? { borderColor: details.hex, background: `${details.hex}0d` }
                  : { borderColor: '#e2e8f0', background: '#fff' }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: details.bg }}>
                    <details.icon size={15} color="white" />
                  </div>
                  <span className="font-bold text-slate-900">{details.name}</span>
                  {isCurrent && (
                    <span
                      className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: `${details.hex}20`, color: details.hex }}
                    >
                      Current
                    </span>
                  )}
                </div>
                <p className="text-2xl font-black text-slate-900 mt-3">
                  ${price}<span className="text-sm font-normal text-slate-400">/{apiInterval}</span>
                </p>
                <ul className="mt-3 space-y-1.5 mb-4">
                  {featureList.map((f, i) => (
                    <li key={i} className="text-xs text-slate-500 flex items-start gap-1.5">
                      <Check size={12} color="#10b981" strokeWidth={3} className="mt-0.5 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                {selectedCheckoutCard && !isCurrent && (
                  <p className="mb-2 text-[11px] font-black tracking-wide uppercase px-2.5 py-1 rounded-full inline-flex items-center"
                    style={{ background: '#ecfdf5', color: '#065f46' }}>
                    Using {selectedCheckoutCard.brand} •••• {selectedCheckoutCard.last4}
                  </p>
                )}
                <button
                  onClick={() => handlePlanChange(tier as PlanTier, apiInterval as 'month' | 'year', selectedCheckoutCardId)}
                  disabled={isLoading || isCurrent}
                  className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-90 flex items-center justify-center gap-2"
                  style={{
                    background: isCurrent ? '#16a34a' : details.bg,
                    color: '#fff',
                    opacity: isLoading ? 0.7 : 1,
                    cursor: isCurrent ? 'default' : 'pointer',
                  }}
                >
                  {isLoading ? <Loader2 size={15} className="animate-spin" /> : actionLabel}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Wallet */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: G.billing.bg }}>
              <CreditCard size={18} color="white" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Wallet</h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddCard(prev => !prev)}
              className="px-3 py-1.5 text-white text-sm font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-1.5"
              style={{ background: G.billing.bg }}
            >
              <Plus size={13} /> {showAddCard ? 'Cancel' : 'Add Card'}
            </button>
            <button
              onClick={managePaymentMethod}
              className="px-3 py-1.5 text-sm font-bold rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Manage in Stripe ↗
            </button>
          </div>
        </div>

        {showAddCard && (
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <AddCardInline onCardAdded={onCardAdded} onClose={() => setShowAddCard(false)} profile={profile} />
          </div>
        )}

        {paymentMethods.length > 0 ? (
          <>
          <div id="saved-cards-list" className="flex flex-col lg:flex-row min-h-[320px]">
            {/* Left: card list */}
            <div className="lg:w-72 shrink-0 border-b lg:border-b-0 lg:border-r border-slate-200 overflow-y-auto">
              {paymentMethods.map((m: PaymentMethod) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedCheckoutCardId(selectedCheckoutCardId === m.id ? null : m.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors"
                  style={selectedCheckoutCardId === m.id ? { background: '#eff6ff', borderLeft: '3px solid #3b82f6' } : {}}
                >
                  <CardBrandBadge brand={m.brand} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 capitalize">{m.brand} •••• {m.last4}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{m.nickname || `Expires ${m.expMonth}/${m.expYear}`}</p>
                  </div>
                  {m.isDefault && (
                    <span className="text-[11px] font-black px-1.5 py-0.5 rounded" style={{ background: '#1d4ed8', color: '#fff' }}>
                      Default
                    </span>
                  )}
                </button>
              ))}
              {/* Add payment method row */}
              <button
                type="button"
                onClick={() => setShowAddCard(true)}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-500 hover:bg-slate-50 transition-colors border-t border-dashed border-slate-200"
              >
                <div className="w-10 h-7 rounded border-2 border-dashed border-slate-300 flex items-center justify-center">
                  <Plus size={14} color="#94a3b8" />
                </div>
                Add a payment method
              </button>
            </div>

            {/* Right: selected card detail */}
            <div className="flex-1 p-6">
              {(() => {
                const m = paymentMethods.find((pm: PaymentMethod) => pm.id === selectedCheckoutCardId)
                if (!m) return (
                  <div className="h-full flex flex-col items-center justify-center text-center gap-3 py-10">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                      <CreditCard size={28} color="#94a3b8" />
                    </div>
                    <p className="font-semibold text-slate-500 text-sm">Select a card to manage it</p>
                  </div>
                )
                return (
                  <div className="max-w-sm">
                    {/* Visual card */}
                    <div
                      className="rounded-xl p-5 mb-5 text-white"
                      style={{ background: 'linear-gradient(135deg, #1e40af 0%, #1d4ed8 60%, #2563eb 100%)', boxShadow: '0 8px 24px rgba(37,99,235,0.35)', minHeight: 140 }}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <CardBrandBadge brand={m.brand} />
                        {m.isDefault && (
                          <span className="text-[11px] font-black px-2 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.2)' }}>Default</span>
                        )}
                      </div>
                      <p className="text-xl font-black tracking-widest mt-2">•••• •••• •••• {m.last4}</p>
                      <div className="flex items-center justify-between mt-3">
                        <div>
                          <p className="text-[10px] uppercase tracking-wide opacity-70">Expires</p>
                          <p className="text-sm font-bold">{m.expMonth}/{m.expYear}</p>
                        </div>
                        <p className="text-sm font-bold capitalize opacity-80">{m.funding || 'credit'}</p>
                      </div>
                    </div>

                    {/* Card name / nickname */}
                    <p className="text-base font-bold text-slate-900 mb-1 capitalize">{m.brand} Card ending in {m.last4}</p>
                    {editingCardId === m.id ? (
                      <div className="mb-4 flex items-center gap-2">
                        <input
                          type="text"
                          value={nicknameDraft}
                          onChange={e => setNicknameDraft(e.target.value)}
                          placeholder="Card nickname"
                          className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700"
                        />
                        <button type="button" onClick={() => saveCardNickname(m.id)} disabled={savingNickname}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-white disabled:opacity-50" style={{ background: G.billing.bg }}>
                          {savingNickname ? 'Saving…' : 'Save'}
                        </button>
                        <button type="button" onClick={() => { setEditingCardId(null); setNicknameDraft('') }}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold border border-slate-200 text-slate-600">
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="mb-4 flex items-center gap-2">
                        <p className="text-xs text-slate-500 flex-1">{m.nickname || 'No nickname'}</p>
                        <button type="button" onClick={() => { setEditingCardId(m.id); setNicknameDraft(m.nickname || '') }}
                          className="text-xs font-bold text-blue-600 hover:text-blue-800">
                          {m.nickname ? 'Edit' : 'Add name'}
                        </button>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      <button type="button"
                        onClick={() => { document.getElementById('billing-plan-picker')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-white hover:opacity-90 transition-opacity"
                        style={{ background: '#059669' }}>
                        Use for Checkout
                      </button>
                      {!m.isDefault && (
                        <button type="button" onClick={() => handleSetDefault(m.id)} disabled={settingDefaultId === m.id}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1"
                          style={{ background: '#1d4ed8' }}>
                          {settingDefaultId === m.id ? <><Loader2 size={11} className="animate-spin" /> Setting…</> : 'Set Default'}
                        </button>
                      )}
                      <button type="button" onClick={() => handleDeleteCard(m.id)} disabled={deletingId === m.id}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1"
                        style={{ background: '#dc2626' }}>
                        {deletingId === m.id ? <><Loader2 size={11} className="animate-spin" /> Removing…</> : 'Remove'}
                      </button>
                    </div>
                    {cardActionError && (
                      <p className="mt-2 text-xs font-semibold text-red-600 flex items-center gap-1">
                        <AlertCircle size={12} /> {cardActionError}
                      </p>
                    )}
                  </div>
                )
              })()}
            </div>
          </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-slate-400 text-sm mb-3">No payment methods on file</p>
            <button
              onClick={() => setShowAddCard(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-opacity"
              style={{ background: G.billing.bg }}
            >
              <Plus size={14} /> Add Your First Card
            </button>
          </div>
        )}
      </div>


      {/* Invoice history */}
      {visibleInvoices.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <CardHeader icon={FileText} title="Invoice History" gradient={G.slate.bg} />
          <div className="space-y-2">
            {visibleInvoices.slice(0, 8).map((inv: Invoice) => (
              <div key={inv.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                <div>
                  <p className="font-semibold text-slate-900 text-sm">${Number(inv.amount || 0).toFixed(2)}</p>
                  <p className="text-xs text-slate-400">{new Date(inv.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-full"
                    style={inv.status === 'paid'
                      ? { background: G.billing.soft, color: G.billing.softText }
                      : { background: G.bids.soft, color: G.bids.softText }}
                  >
                    {inv.status}
                  </span>
                  {inv.invoicePdf && (
                    <a href={inv.invoicePdf} target="_blank" rel="noopener noreferrer"
                      className="text-xs font-semibold hover:opacity-70 transition-opacity"
                      style={{ color: G.overview.hex }}>
                      PDF ↗
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

// ─── BID ROW ──────────────────────────────────────────────────────────────────

const BID_STATUS = {
  draft:       { label: 'Draft',       bg: '#f1f5f9', text: '#475569' },
  submitted:   { label: 'Submitted',   bg: G.overview.soft, text: G.overview.softText },
  awarded:     { label: 'Awarded',     bg: G.billing.soft,  text: G.billing.softText },
  not_awarded: { label: 'Not Awarded', bg: G.support.soft,  text: G.support.softText },
}

function BidRow({
  bid,
  onStatusChange,
  onDelete,
  pending,
}: {
  bid: BidData
  onStatusChange: (id: string, status: BidData['status']) => Promise<void>
  onDelete: (id: string) => Promise<void>
  pending: boolean
}) {
  const s = BID_STATUS[bid.status] ?? BID_STATUS.draft
  const lastActivity = bid.updated_at || bid.created_at

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900 text-sm truncate">{bid.opportunityTitle}</p>
        <p className="text-xs text-slate-400 mt-0.5">{bid.opportunityId}</p>
        {lastActivity && (
          <p className="text-xs text-slate-400 mt-1">Updated {new Date(lastActivity).toLocaleString()}</p>
        )}
      </div>
      {bid.dueDate && (
        <div className="hidden sm:flex items-center gap-1 text-xs text-slate-400">
          <Clock size={12} /> {new Date(bid.dueDate).toLocaleDateString()}
        </div>
      )}
      {bid.value && (
        <div className="hidden sm:flex items-center gap-0.5 text-xs font-semibold text-slate-500">
          <DollarSign size={12} />{(bid.value / 1000).toFixed(0)}K
        </div>
      )}
      <span className="text-xs font-bold px-2.5 py-1 rounded-full shrink-0" style={{ background: s.bg, color: s.text }}>
        {s.label}
      </span>
      <div className="flex items-center gap-2 shrink-0">
        <select
          value={bid.status}
          disabled={pending}
          onChange={(e) => onStatusChange(bid.id, e.target.value as BidData['status'])}
          className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold bg-white text-slate-700"
        >
          <option value="draft">Draft</option>
          <option value="submitted">Submitted</option>
          <option value="awarded">Awarded</option>
          <option value="not_awarded">Not Awarded</option>
        </select>
        <button
          type="button"
          disabled={pending}
          onClick={() => onDelete(bid.id)}
          className="rounded-lg border border-rose-200 px-2 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
        >
          Remove
        </button>
      </div>
    </div>
  )
}

// ─── BIDS TAB ─────────────────────────────────────────────────────────────────

function BidsTab({ bids, setBids, initialFilter = 'all' }: any) {
  const [filter, setFilter] = useState<BidFilterType>(initialFilter as BidFilterType)
  const [showCreate, setShowCreate] = useState(false)
  const [saving, setSaving] = useState(false)
  const [pendingBidId, setPendingBidId] = useState<string | null>(null)
  const [newBid, setNewBid] = useState({
    opportunityId: '',
    opportunityTitle: '',
    dueDate: '',
    status: 'draft' as BidData['status'],
    value: '',
  })

  const filteredBids =
    filter === 'all'
      ? bids
      : filter === 'active'
        ? bids.filter((b: BidData) => b.status === 'draft' || b.status === 'submitted')
        : bids.filter((b: BidData) => b.status === filter)

  const counts = {
    all:         bids.length,
    active:      bids.filter((b: BidData) => b.status === 'draft' || b.status === 'submitted').length,
    draft:       bids.filter((b: BidData) => b.status === 'draft').length,
    submitted:   bids.filter((b: BidData) => b.status === 'submitted').length,
    awarded:     bids.filter((b: BidData) => b.status === 'awarded').length,
    not_awarded: bids.filter((b: BidData) => b.status === 'not_awarded').length,
  }

  const filterTabs = [
    { id: 'all',         label: 'All',          color: G.slate },
    { id: 'active',      label: 'Active',       color: G.overview },
    { id: 'submitted',   label: 'Submitted',    color: G.overview },
    { id: 'draft',       label: 'Draft',        color: G.slate },
    { id: 'awarded',     label: 'Awarded',      color: G.billing },
    { id: 'not_awarded', label: 'Not Awarded',  color: G.support },
  ]

  useEffect(() => {
    setFilter(initialFilter as BidFilterType)
  }, [initialFilter])

  const topStats = [
    { label: 'Total Bids',  value: bids.length,                           icon: LayoutList, color: G.bids },
    { label: 'Active',      value: counts.submitted + counts.draft,        icon: Activity,   color: G.overview },
    { label: 'Awarded',     value: counts.awarded,                         icon: Trophy,     color: G.billing },
    { label: 'Win Rate',    value: bids.length ? `${Math.round((counts.awarded / bids.length) * 100)}%` : '—', icon: Target, color: G.profile },
  ]

  const handleCreateBid = async () => {
    if (!newBid.opportunityId.trim() || !newBid.opportunityTitle.trim() || !newBid.dueDate) return
    setSaving(true)
    try {
      const res = await fetch('/api/account/bids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opportunityId: newBid.opportunityId.trim(),
          opportunityTitle: newBid.opportunityTitle.trim(),
          dueDate: newBid.dueDate,
          status: newBid.status,
          value: newBid.value ? Number(newBid.value) : undefined,
        }),
      })
      if (!res.ok) throw new Error('Failed to create bid')
      const created = await res.json()
      setBids((prev: BidData[]) => [created, ...prev])
      setShowCreate(false)
      setNewBid({ opportunityId: '', opportunityTitle: '', dueDate: '', status: 'draft', value: '' })
    } catch (err) {
      console.error(err)
      alert('Unable to create bid right now.')
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (id: string, status: BidData['status']) => {
    setPendingBidId(id)
    try {
      const res = await fetch('/api/account/bids', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      if (!res.ok) throw new Error('Failed to update bid')
      const updated = await res.json()
      setBids((prev: BidData[]) => prev.map((b) => (b.id === id ? updated : b)))
    } catch (err) {
      console.error(err)
      alert('Unable to update bid status.')
    } finally {
      setPendingBidId(null)
    }
  }

  const handleDeleteBid = async (id: string) => {
    if (!confirm('Remove this bid from tracker?')) return
    setPendingBidId(id)
    try {
      const res = await fetch(`/api/account/bids?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete bid')
      setBids((prev: BidData[]) => prev.filter((b) => b.id !== id))
    } catch (err) {
      console.error(err)
      alert('Unable to remove bid right now.')
    } finally {
      setPendingBidId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {topStats.map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: s.color.bg }}>
              <s.icon size={20} color="white" strokeWidth={2} />
            </div>
            <p className="text-2xl font-black text-slate-900">{s.value}</p>
            <p className="text-xs text-slate-400 font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header stripe */}
        <div className="flex items-center justify-between px-6 py-5" style={{ background: G.bids.bg }}>
          <div className="flex items-center gap-2.5">
            <Gavel size={20} color="white" strokeWidth={2} />
            <span className="font-bold text-white text-lg">Bid Tracker</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/opportunities"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-80"
              style={{ background: 'rgba(0,0,0,0.18)' }}
            >
              Browse Opportunities
            </a>
            <button
              type="button"
              onClick={() => setShowCreate((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold text-white transition-opacity hover:opacity-80"
              style={{ background: 'rgba(255,255,255,0.2)' }}
            >
              <Plus size={14} /> {showCreate ? 'Close' : 'Add Bid'}
            </button>
          </div>
        </div>

        <div className="p-6">
          {showCreate && (
            <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-bold text-slate-800 mb-3">Create Bid Activity</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  value={newBid.opportunityId}
                  onChange={(e) => setNewBid((p) => ({ ...p, opportunityId: e.target.value }))}
                  placeholder="Opportunity ID (ex: N00123-26-R-0001)"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
                <input
                  value={newBid.opportunityTitle}
                  onChange={(e) => setNewBid((p) => ({ ...p, opportunityTitle: e.target.value }))}
                  placeholder="Opportunity title"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
                <input
                  type="date"
                  value={newBid.dueDate}
                  onChange={(e) => setNewBid((p) => ({ ...p, dueDate: e.target.value }))}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
                <select
                  value={newBid.status}
                  onChange={(e) => setNewBid((p) => ({ ...p, status: e.target.value as BidData['status'] }))}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                >
                  <option value="draft">Draft</option>
                  <option value="submitted">Submitted</option>
                  <option value="awarded">Awarded</option>
                  <option value="not_awarded">Not Awarded</option>
                </select>
                <input
                  type="number"
                  value={newBid.value}
                  onChange={(e) => setNewBid((p) => ({ ...p, value: e.target.value }))}
                  placeholder="Bid value (optional)"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={handleCreateBid}
                  disabled={saving}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Bid'}
                </button>
              </div>
            </div>
          )}

          {/* Filter bar */}
          <div className="flex flex-wrap gap-2 mb-5">
            {filterTabs.map(f => {
              const isActive = filter === f.id
              const count = counts[f.id as keyof typeof counts]
              return (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id as any)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all"
                  style={isActive
                    ? { background: f.color.bg, color: '#fff', boxShadow: `0 2px 8px ${f.color.hex}40` }
                    : { background: f.color.soft, color: f.color.softText, border: `1px solid ${f.color.softBorder}` }}
                >
                  {f.label}
                  <span
                    className="text-xs px-1.5 py-0.5 rounded-full font-bold"
                    style={isActive ? { background: 'rgba(255,255,255,0.25)', color: '#fff' } : { background: 'rgba(255,255,255,0.6)', color: 'inherit' }}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {filteredBids.length > 0 ? (
            <div className="space-y-2">
              {filteredBids.map((bid: BidData) => (
                <BidRow
                  key={bid.id}
                  bid={bid}
                  onStatusChange={handleStatusChange}
                  onDelete={handleDeleteBid}
                  pending={pendingBidId === bid.id}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-14">
              <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4" style={{ background: G.bids.soft }}>
                <Gavel size={28} color={G.bids.hex} strokeWidth={1.5} />
              </div>
              <p className="font-bold text-slate-600">No bids found</p>
              <p className="text-slate-400 text-sm mt-1">
                {filter === 'all' ? 'Start tracking bids by clicking "Add Bid"' : `No ${filter.replace('_', ' ')} bids yet`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── SUPPORT TAB ──────────────────────────────────────────────────────────────

const BRAND = '#4a7862'
const BRAND_DARK = '#3f6754'
const BRAND_SOFT = '#eef3f0'
const BRAND_BORDER = 'rgba(74,120,98,0.25)'

function SupportTab({ profile, plan }: any) {
  const [subject, setSubject] = useState('')
  const [msgBody, setMsgBody] = useState('')
  const [category, setCategory] = useState('General Inquiry')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const CATEGORIES = ['General Inquiry', 'Technical Support', 'Billing & Subscription', 'Account & Access', 'Alerts & Notifications', 'Other']
  const inputCls = "w-full px-4 py-3 border-2 rounded-xl text-slate-900 text-sm outline-none transition-all bg-white"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    try {
      const res = await fetch('/api/support/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message: msgBody, category, userInfo: { email: profile.email, name: `${profile.first_name} ${profile.last_name}`.trim(), plan: plan?.tier || 'NONE' } }),
      })
      if (res.ok) { setSent(true); setSubject(''); setMsgBody('') }
    } catch (err) { console.error(err) }
    finally { setSending(false) }
  }

  const focusStyle = { borderColor: BRAND, boxShadow: `0 0 0 3px ${BRAND}22` }
  const blurStyle  = { borderColor: '#e2e8f0', boxShadow: 'none' }

  return (
    <div className="space-y-6">

      {/* ── Full support center banner ── */}
      <a
        href="/support"
        className="block rounded-2xl overflow-hidden group transition-all hover:shadow-xl"
        style={{ background: `linear-gradient(135deg, ${BRAND} 0%, ${BRAND_DARK} 100%)`, textDecoration: 'none' }}
      >
        <div className="px-8 py-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <HeadphonesIcon size={22} color="white" strokeWidth={2} />
              <span className="font-black text-white text-xl">Full Support Center</span>
            </div>
            <p className="text-white/75 text-sm leading-relaxed max-w-lg">
              Book a 30-min meeting with our team, browse FAQs, or choose a support category — all in one place.
            </p>
          </div>
          <div
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm shrink-0 transition-all group-hover:shadow-lg"
            style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.35)' }}
          >
            Open Support Center <ChevronRight size={16} />
          </div>
        </div>
      </a>

      {/* ── Contact cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            icon: Mail, title: 'Email Us',
            desc: 'Typical response within 1 business day',
            cta: 'support@preciseanalytics.io',
            href: 'mailto:support@preciseanalytics.io',
            iconBg: BRAND_SOFT, iconColor: BRAND,
          },
          {
            icon: Phone, title: 'Call Us',
            desc: 'Mon–Fri · 9am–5pm Eastern',
            cta: '(804) 404-6005',
            href: 'tel:+18044046005',
            iconBg: '#eff6ff', iconColor: '#3b82f6',
          },
          {
            icon: MessageSquare, title: 'Book a Meeting',
            desc: '30-minute consultation with our team',
            cta: 'Schedule on Calendly →',
            href: 'https://calendly.com/precisegovcon/30min',
            iconBg: '#f5f3ff', iconColor: '#7c3aed',
          },
        ].map(c => (
          <a
            key={c.title}
            href={c.href}
            target={c.href.startsWith('http') ? '_blank' : undefined}
            rel={c.href.startsWith('http') ? 'noopener noreferrer' : undefined}
            className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all block"
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
              style={{ background: c.iconBg }}
            >
              <c.icon size={20} color={c.iconColor} strokeWidth={2} />
            </div>
            <p className="font-bold text-slate-900">{c.title}</p>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">{c.desc}</p>
            <p className="text-sm font-semibold mt-2.5" style={{ color: c.iconColor }}>{c.cta}</p>
          </a>
        ))}
      </div>

      {/* ── Quick ticket form ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100" style={{ background: BRAND_SOFT }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: BRAND }}>
              <Send size={14} color="white" />
            </div>
            <div>
              <p className="font-bold text-slate-900">Send a Message</p>
              <p className="text-xs text-slate-500">We'll reply to {profile.email || 'your email'} within 24 hours</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {sent ? (
            <div className="text-center py-10">
              <div
                className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4"
                style={{ background: BRAND_SOFT }}
              >
                <CheckCircle2 size={30} color={BRAND} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Message sent!</h3>
              <p className="text-slate-400 text-sm mt-2 max-w-xs mx-auto">We'll get back to you within 24 hours. Check your inbox at {profile.email}.</p>
              <button
                onClick={() => setSent(false)}
                className="mt-5 px-5 py-2.5 text-white text-sm font-bold rounded-xl hover:opacity-90 transition-opacity"
                style={{ background: BRAND }}
              >
                Send another
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Field label="Category">
                <select value={category} onChange={e => setCategory(e.target.value)} className={inputCls}
                  style={blurStyle}
                  onFocus={e => Object.assign(e.currentTarget.style, focusStyle)}
                  onBlur={e => Object.assign(e.currentTarget.style, blurStyle)}
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Subject *">
                <input type="text" value={subject} onChange={e => setSubject(e.target.value)} required
                  placeholder="Brief description of your issue" className={inputCls}
                  style={blurStyle}
                  onFocus={e => Object.assign(e.currentTarget.style, focusStyle)}
                  onBlur={e => Object.assign(e.currentTarget.style, blurStyle)}
                />
              </Field>
              <Field label="Message">
                <textarea value={msgBody} onChange={e => setMsgBody(e.target.value)} rows={4}
                  placeholder="Describe your issue in detail — include steps to reproduce, page URL, and expected outcome…"
                  className={`${inputCls} resize-none`}
                  style={blurStyle}
                  onFocus={e => Object.assign(e.currentTarget.style, focusStyle)}
                  onBlur={e => Object.assign(e.currentTarget.style, blurStyle)}
                />
              </Field>
              <button
                type="submit"
                disabled={sending}
                className="w-full py-3.5 text-white font-bold rounded-xl transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: `linear-gradient(135deg, ${BRAND} 0%, ${BRAND_DARK} 100%)`, boxShadow: `0 4px 14px ${BRAND}40` }}
              >
                {sending ? <><Loader2 size={15} className="animate-spin" /> Sending…</> : <><Send size={15} /> Send Message</>}
              </button>
              <p className="text-xs text-center text-slate-400">
                Need to book a meeting?{' '}
                <a href="/support" className="font-semibold hover:underline" style={{ color: BRAND }}>
                  Visit the full Support Center →
                </a>
              </p>
            </form>
          )}
        </div>
      </div>

      {/* ── Response times + resources ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-sm">
            <Clock size={15} color={BRAND} /> Response Times by Plan
          </h3>
          <div className="space-y-2">
            {[
              { tier: 'Enterprise',   time: '< 4 hours',  active: plan?.tier === 'ENTERPRISE' },
              { tier: 'Professional', time: '< 12 hours', active: plan?.tier === 'PROFESSIONAL' },
              { tier: 'Basic / Free', time: '< 24 hours', active: !plan?.tier || plan.tier === 'BASIC' || plan.tier === 'NONE' },
            ].map(r => (
              <div
                key={r.tier}
                className="flex justify-between items-center px-3 py-2.5 rounded-xl text-sm"
                style={r.active
                  ? { background: BRAND_SOFT, border: `1px solid ${BRAND_BORDER}` }
                  : { background: '#fafafa', border: '1px solid transparent' }}
              >
                <span className="font-medium" style={{ color: r.active ? BRAND : '#64748b' }}>{r.tier}</span>
                <span className="font-bold" style={{ color: r.active ? BRAND : '#94a3b8' }}>{r.time}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2 text-sm">
            <ChevronRight size={15} color={BRAND} /> Quick Resources
          </h3>
          <div className="space-y-1">
            {[
              { label: 'SAM.gov Registration Guide',  href: '/services/sam-registration' },
              { label: 'Bid Search Workflow',         href: '/services/bid-search' },
              { label: 'Set-Aside Certifications',    href: '/services/set-aside-certifications' },
              { label: 'Proposal Writing Help',       href: '/services/proposal-writing' },
              { label: 'Bid/No-Bid Review',           href: '/services/bid-no-bid-review' },
            ].map(r => (
              <a
                key={r.label}
                href={r.href}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors group"
              >
                <span className="font-medium">{r.label}</span>
                <ChevronRight size={13} color="#cbd5e1" className="group-hover:translate-x-0.5 transition-transform" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}