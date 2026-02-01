//app/search/page.tsx

'use client'

import React, { useMemo, useState, useEffect, useRef, useCallback, Suspense } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import WelcomeBanner from '@/components/WelcomeBanner'
import { useSession, signIn } from 'next-auth/react'
import SavedSearchModal from '@/components/SavedSearchModal'
import SearchAlertModal from '@/components/SearchAlertModal'
import SavedSearchActions from '@/components/SavedSearchActions'
import ProfileCompletionReminder from '@/components/ProfileCompletionReminder'
import {
  Search,
  SlidersHorizontal,
  X,
  ArrowUpRight,
  ExternalLink,
  Building2,
  MapPin,
  Calendar,
  Tag,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Bookmark,
  BookmarkCheck,
  Shield,
  Lock,
  Hash,
  AlertCircle,
  BarChart3,
  Play,
  Plus,
  Filter,
  Globe,
  Building,
  Target,
  PieChart,
  TrendingUp,
  Download,
  Sparkles,
  Zap,
  Star,
  Clock,
  Layers,
  FileText,
  Users,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
  Save,
  Upload,
  RefreshCw,
  Bell,
  MessageSquare,
  Share2,
  Printer,
  Grid,
  List,
  ChevronLeft,
  ChevronRight,
  SortAsc,
  SortDesc,
  Sparkle,
  TrendingDown,
  DollarSign,
  Percent,
  Award,
  CheckCircle,
  AlertTriangle,
  Info,
  HelpCircle,
  History,
  BookOpen,
  Database,
  Cpu,
  Activity,
  Compass,
  Navigation,
  Target as TargetIcon,
  Globe as GlobeIcon,
  Award as AwardIcon,
  Crown,
  Rocket,
  Leaf,
  Cloud,
  Wifi,
  Server,
  Cpu as CpuIcon,
  Loader2,
  Phone,
} from 'lucide-react'
import AccessControlModal from '@/components/AccessControlModal'
export const dynamic = 'force-dynamic'

// --- PERFORMANCE FIX: Debounce Hook ---
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// --- SUBSCRIPTION HOOK (Centralized) ---
function useSubscription() {
  const { data: session, status: sessionStatus } = useSession()
  const [planData, setPlanData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (sessionStatus === 'loading') {
      setLoading(true)
      return
    }

    if (!session?.user?.email) {
      setLoading(false)
      return
    }

    // Fetch plan data from API to ensure it's in sync with Stripe
    fetch('/api/account/plan')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch plan')
        return res.json()
      })
      .then(data => {
        console.log('📊 Plan API Response:', data)
        setPlanData({
          tier: data.tier || 'NONE',
          interval: data.interval || null,
          status: data.status || 'inactive',
          hasSubscription: data.hasSubscription || false,
          currentPeriodEnd: data.currentPeriodEnd || null,
          cancelAtPeriodEnd: data.cancelAtPeriodEnd || false,
        })
        setLoading(false)
      })
      .catch(err => {
        console.error('Error fetching plan:', err)
        setError(err.message)
        setLoading(false)
      })
  }, [session, sessionStatus])

  // Helper function to check if user has active subscription
  const hasActiveSubscription = useCallback(() => {
    if (!planData) return false
    return planData.hasSubscription && 
           (planData.status === 'active' || 
            planData.status === 'trialing' || 
            planData.status === 'trial' ||
            planData.status === 'past_due')
  }, [planData])

  // Helper function to check tier level
  const hasTier = useCallback((requiredTier: 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE') => {
    if (!planData) return false
    const tierRank = {
      'NONE': 0,
      'BASIC': 1,
      'PROFESSIONAL': 2,
      'ENTERPRISE': 3,
    }
    return tierRank[planData.tier as keyof typeof tierRank] >= tierRank[requiredTier]
  }, [planData])

  return {
    tier: planData?.tier || (session?.user as any)?.tier || 'NONE',
    interval: planData?.interval || (session?.user as any)?.interval || null,
    status: planData?.status || (session?.user as any)?.status || 'inactive',
    hasSubscription: planData?.hasSubscription || (session?.user as any)?.hasSubscription || false,
    currentPeriodEnd: planData?.currentPeriodEnd || (session?.user as any)?.currentPeriodEnd || null,
    loading: loading || sessionStatus === 'loading',
    error,
    hasActiveSubscription,
    hasTier,
    isEnterprise: () => hasTier('ENTERPRISE'),
    isProfessional: () => hasTier('PROFESSIONAL'),
    isBasic: () => hasTier('BASIC'),
    planData,
  }
}

// --- ACCESS CONTROL HOOK (Fixed) ---
function useBrowsingSession() {
  const { data: session, status } = useSession()
  const { hasActiveSubscription, tier, status: planStatus, loading: planLoading } = useSubscription()
  const [browsingStartTime, setBrowsingStartTime] = useState<number | null>(null)
  const [showReminderModal, setShowReminderModal] = useState(false)
  const [showLockoutModal, setShowLockoutModal] = useState(false)
  const [remainingTime, setRemainingTime] = useState<number>(0)
  
  // Initialize browsing session for unauthenticated users
  useEffect(() => {
    if (status === 'unauthenticated') {
      const storedStartTime = localStorage.getItem('browsingStartTime')
      const now = Date.now()
      
      if (storedStartTime) {
        const startTime = parseInt(storedStartTime, 10)
        const elapsed = now - startTime
        
        if (elapsed >= 900000) { // 15 minutes = 900000ms
          setShowLockoutModal(true)
        } else {
          setBrowsingStartTime(startTime)
        }
      } else {
        localStorage.setItem('browsingStartTime', now.toString())
        setBrowsingStartTime(now)
      }
    } else if (status === 'authenticated') {
      // Clear browsing session for authenticated users
      localStorage.removeItem('browsingStartTime')
      setBrowsingStartTime(null)
      setShowLockoutModal(false)
      setShowReminderModal(false)
    }
  }, [status])

  // Timer to check elapsed time and show reminders
  useEffect(() => {
    if (status !== 'unauthenticated' || !browsingStartTime) return

    const interval = setInterval(() => {
      const now = Date.now()
      const elapsed = now - browsingStartTime
      const remaining = 900000 - elapsed // 15 minutes

      setRemainingTime(remaining)

      // Show reminder at 10 minutes (5 minutes left)
      if (elapsed >= 600000 && elapsed < 601000) {
        setShowReminderModal(true)
      }

      // Show lockout at 15 minutes
      if (elapsed >= 900000) {
        setShowLockoutModal(true)
        clearInterval(interval)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [browsingStartTime, status])

  // ✅ FIXED: Use the centralized subscription hook
  const hasValidAccess = useMemo(() => {
    // ✅ CRITICAL: Don't deny access while still loading
    if (planLoading || status === 'loading') {
      console.log('⏳ Still loading subscription data...')
      return false // Will be updated once loading completes
    }
    
    if (status === 'authenticated') {
      const user = session?.user as any
      
      console.log('🔍 Access Check - Complete user data:', {
        role: user?.role,
        tier,
        planStatus,
        hasActiveSubscription: hasActiveSubscription(),
        session_tier: user?.tier,
        session_status: user?.status,
        planLoading,
      })
      
      // Check if user is admin - admins always have access
      if (user?.role === 'admin') {
        console.log('✅ Access granted: Admin user')
        return true
      }
      
      // ✅ FIXED: Use the centralized subscription check
      if (hasActiveSubscription()) {
        console.log('✅ Access granted: Active subscription', { tier, status: planStatus })
        return true
      }
      
      console.log('❌ Access denied: No valid subscription')
      return false
    }
    
    console.log('❌ Access denied: Not authenticated')
    return false
  }, [status, session, hasActiveSubscription, tier, planStatus, planLoading])

  const canBrowse = useMemo(() => {
    if (hasValidAccess) return true
    if (showLockoutModal) return false
    return status === 'unauthenticated' && browsingStartTime !== null
  }, [hasValidAccess, showLockoutModal, status, browsingStartTime])

  return {
    hasValidAccess,
    canBrowse,
    showReminderModal,
    setShowReminderModal,
    showLockoutModal,
    setShowLockoutModal,
    remainingTime,
    isAuthenticated: status === 'authenticated',
    tier,
    planStatus,
    planLoading,
  }
}

// --- Types ---
type Opp = {
  noticeId?: string
  title?: string
  solicitationNumber?: string
  fullParentPathName?: string
  department?: string
  subTier?: string
  office?: string
  postedDate?: string
  responseDeadLine?: string
  type?: string
  setAside?: string
  setAsideCode?: string
  naicsCode?: string
  placeOfPerformance?: {
    city?: { name?: string }
    state?: { code?: string }
    county?: { name?: string }
    zip?: string
    country?: { code?: string }
  }
  description?: string
  uiLink?: string
  resourceLinks?: string[]
  active?: string
  modifiedDate?: string
  baseType?: string
  archiveType?: string
  award?: any
  pointOfContact?: any
  classificationCode?: string
  productServiceCode?: string
  contractOpportunityType?: string
}

type ApiResponse = {
  totalRecords?: number
  opportunitiesData?: Opp[]
  [k: string]: any
}

type FacetItem = {
  name: string
  count: number
  value?: string
}

type Facets = {
  agencies: FacetItem[]
  setAsides: Array<FacetItem & { label: string }>
  naics: FacetItem[]
  states: FacetItem[]
  cities: Array<FacetItem & { state: string }>
  productServices: FacetItem[]
  departments: FacetItem[]
  types: FacetItem[]
}

// --- Constants ---
const US_STATES = [
  { value: '', label: 'Any State/Territory' },
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
  { value: 'DC', label: 'District of Columbia' },
  { value: 'PR', label: 'Puerto Rico' },
  { value: 'GU', label: 'Guam' },
  { value: 'VI', label: 'Virgin Islands' },
  { value: 'AS', label: 'American Samoa' },
  { value: 'MP', label: 'Northern Mariana Islands' }
]

// Set-Aside options
const SET_ASIDE_OPTIONS = [
  { value: '', label: 'Any Set-Aside' },
  { value: 'SBA', label: 'Total Small Business Set-Aside' },
  { value: 'SBP', label: 'Partial Small Business Set-Aside' },
  { value: '8A', label: '8(a) Set-Aside' },
  { value: '8AN', label: '8(a) Sole Source' },
  { value: 'HZC', label: 'HUBZone Set-Aside' },
  { value: 'SDV', label: 'Service-Disabled Veteran-Owned' },
  { value: 'WOSB', label: 'Woman-Owned Small Business' },
  { value: 'EDWOSB', label: 'Economically Disadvantaged WOSB' },
  { value: 'SDB', label: 'Small Disadvantaged Business' },
  { value: 'NONE', label: 'No Set-Aside' }
]

const SET_ASIDE_LABEL_BY_CODE: Record<string, string> = {
  'SBA': 'Total Small Business Set-Aside',
  'SBP': 'Partial Small Business Set-Aside',
  '8A': '8(a) Set-Aside',
  '8AN': '8(a) Sole Source',
  'HZC': 'HUBZone Set-Aside',
  'SDV': 'Service-Disabled Veteran-Owned',
  'WOSB': 'Woman-Owned Small Business',
  'EDWOSB': 'Economically Disadvantaged WOSB',
  'SDB': 'Small Disadvantaged Business',
  'NONE': 'No Set-Aside',
  // Common variations
  'HUBZone': 'HUBZone Set-Aside',
  'SDVOSB': 'Service-Disabled Veteran-Owned'
}

// Reverse mapping: label -> code
const SET_ASIDE_CODE_BY_LABEL: Record<string, string> = Object.entries(SET_ASIDE_LABEL_BY_CODE).reduce((acc, [code, label]) => {
  acc[label] = code
  return acc
}, {} as Record<string, string>)

// --- Utility Components ---
const StatCard = ({ 
  label, 
  value, 
  icon, 
  onClick, 
  trend,
  loading = false 
}: { 
  label: string, 
  value: React.ReactNode, 
  icon: React.ReactNode, 
  onClick?: () => void, 
  trend?: number,
  loading?: boolean
}) => (
  <div
    onClick={onClick}
    className={`group relative p-4 rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/50 to-slate-950/30 backdrop-blur-sm hover:border-slate-700 hover:from-slate-800/30 hover:to-slate-900/30 transition-all duration-300 cursor-pointer ${
      onClick ? 'hover:scale-[1.02] active:scale-[0.98]' : ''
    }`}
  >
    {trend && (
      <div className={`absolute -top-2 -right-2 px-2 py-1 rounded-full text-xs font-semibold ${
        trend > 0 
          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
      }`}>
        {trend > 0 ? '+' : ''}{trend}%
      </div>
    )}
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 group-hover:border-blue-500/30 transition-colors">
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-xs text-slate-500 font-medium">{label}</div>
        {loading ? (
          <div className="h-8 w-20 bg-slate-800 rounded-lg animate-pulse mt-1" />
        ) : (
          <div className="text-2xl font-bold text-white mt-1">{value}</div>
        )}
      </div>
    </div>
  </div>
)

const Badge = ({ 
  children, 
  variant = 'default',
  size = 'sm'
}: { 
  children: React.ReactNode, 
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger',
  size?: 'sm' | 'md'
}) => {
  const variants = {
    default: 'bg-slate-800 text-slate-300 border-slate-700',
    primary: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    success: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    warning: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    danger: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  }
  
  const sizes = {
    sm: 'px-2 py-0.5 text-xs rounded-full',
    md: 'px-3 py-1 text-sm rounded-full',
  }
  
  return (
    <span className={`inline-flex items-center border ${variants[variant]} ${sizes[size]}`}>
      {children}
    </span>
  )
}

const Button = ({ 
  children, 
  onClick, 
  disabled = false, 
  loading = false,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon
}: { 
  children: React.ReactNode, 
  onClick?: () => void, 
  disabled?: boolean,
  loading?: boolean,
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success',
  size?: 'sm' | 'md' | 'lg',
  fullWidth?: boolean,
  icon?: React.ReactNode
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95'
  
  const variants = {
    primary: 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:opacity-90 shadow-lg shadow-emerald-500/20',
    secondary: 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:border-slate-600',
    ghost: 'text-slate-400 hover:text-white hover:bg-slate-800/50',
    danger: 'bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30',
    success: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30',
  }
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5',
  }
  
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''}`}
    >
      {loading && (
        <Loader2 className="h-4 w-4 animate-spin" />
      )}
      {icon && !loading && icon}
      {children}
    </button>
  )
}

const Input = ({ 
  value, 
  onChange, 
  placeholder, 
  icon,
  type = 'text',
  error
}: { 
  value: string, 
  onChange: (value: string) => void, 
  placeholder: string, 
  icon?: React.ReactNode,
  type?: string,
  error?: string
}) => (
  <div className="relative">
    {icon && (
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500">
        {icon}
      </div>
    )}
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full px-4 py-3 rounded-xl bg-slate-900 border ${
        error ? 'border-rose-500/50' : 'border-slate-800'
      } text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors ${
        icon ? 'pl-10' : ''
      }`}
    />
    {error && (
      <p className="mt-1 text-xs text-rose-400">{error}</p>
    )}
  </div>
)

const Field = ({ 
  label, 
  children, 
  tooltip,
  required = false 
}: { 
  label: string, 
  children: React.ReactNode, 
  tooltip?: string,
  required?: boolean 
}) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <label className="text-sm font-medium text-slate-300 flex items-center gap-1">
        {label}
        {required && <span className="text-rose-400">*</span>}
      </label>
      {tooltip && (
        <button type="button" className="text-slate-500 hover:text-slate-300">
          <HelpCircle className="h-4 w-4" />
        </button>
      )}
    </div>
    {children}
  </div>
)

const Pill = ({ 
  children, 
  tone = 'neutral',
  onRemove
}: { 
  children: React.ReactNode, 
  tone?: 'neutral' | 'info' | 'success' | 'warning' | 'danger',
  onRemove?: () => void
}) => {
  const tones = {
    neutral: 'bg-slate-800 text-slate-300 border-slate-700',
    info: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    success: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    warning: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    danger: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  }
  
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm ${tones[tone]}`}>
      {children}
      {onRemove && (
        <button
          onClick={onRemove}
          className="hover:text-white transition-colors ml-1"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}

const ResultCard = ({ 
  opportunity, 
  index, 
  isExpanded, 
  toggleExpanded, 
  isSaved, 
  toggleSaved,
  copyText,
  copiedId
}: {
  opportunity: Opp,
  index: number,
  isExpanded: boolean,
  toggleExpanded: (id: string) => void,
  isSaved: boolean,
  toggleSaved: (id: string) => void,
  copyText: (text: string) => void,
  copiedId: string | null
}) => {
  const id = opportunity.noticeId || String(index)
  const daysUntilDeadline = opportunity.responseDeadLine 
    ? Math.ceil((new Date(opportunity.responseDeadLine).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null
  
  // Format dates
  const postedDate = opportunity.postedDate ? formatDate(opportunity.postedDate) : 'Not specified'
  const deadlineDate = opportunity.responseDeadLine ? formatDate(opportunity.responseDeadLine) : 'Not specified'
  
  // Set-Aside display
  const setAsideLabel = opportunity.setAside 
    ? SET_ASIDE_LABEL_BY_CODE[opportunity.setAside] || opportunity.setAside
    : 'Not specified'
  
  // Place of performance
  const city = opportunity.placeOfPerformance?.city?.name || ''
  const state = opportunity.placeOfPerformance?.state?.code || ''
  const placeOfPerformance = city && state ? `${city}, ${state}` : (city || state || 'Not specified')
  
  // Department/Agency
  const department = opportunity.department || opportunity.fullParentPathName || 'Not specified'
  
  return (
    <div 
      key={id}
      className="group relative rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/50 to-slate-950/30 p-6 transition-all duration-300 hover:border-slate-700 hover:from-slate-800/30 hover:to-slate-900/30"
    >
      {/* Quick Actions */}
      <div className="absolute right-4 top-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => copyText(id)}
          className="p-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors"
          title="Copy Notice ID"
        >
          {copiedId === id ? (
            <Check className="h-4 w-4 text-emerald-400" />
          ) : (
            <Copy className="h-4 w-4 text-slate-400" />
          )}
        </button>
        <button
          onClick={() => toggleSaved(id)}
          className="p-1.5 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors"
          title={isSaved ? 'Remove from saved' : 'Save opportunity'}
        >
          {isSaved ? (
            <BookmarkCheck className="h-4 w-4 text-emerald-400" />
          ) : (
            <Bookmark className="h-4 w-4 text-slate-400" />
          )}
        </button>
      </div>
      
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 pr-8">
          <div className="flex items-center gap-3 mb-2">
            {/* Clickable title that links to SAM.gov */}
            {opportunity.uiLink ? (
              <a
                href={opportunity.uiLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg font-bold text-white hover:text-emerald-300 transition-colors cursor-pointer flex items-center gap-2 group/title"
              >
                {opportunity.title || 'Untitled Opportunity'}
                <ExternalLink className="h-4 w-4 opacity-0 group-hover/title:opacity-100 transition-opacity" />
              </a>
            ) : (
              <h3 className="text-lg font-bold text-white">
                {opportunity.title || 'Untitled Opportunity'}
              </h3>
            )}
            {daysUntilDeadline !== null && daysUntilDeadline <= 7 && (
              <Badge variant={daysUntilDeadline <= 3 ? 'danger' : 'warning'}>
                <Clock className="h-3 w-3 mr-1" />
                {daysUntilDeadline} day{daysUntilDeadline !== 1 ? 's' : ''} left
              </Badge>
            )}
          </div>
          
          {/* Key Information Grid - UPDATED with important criteria */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            {/* Solicitation Number */}
            {opportunity.solicitationNumber && (
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-slate-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs text-slate-500">Solicitation #</div>
                  <div className="text-sm text-slate-300 font-medium">{opportunity.solicitationNumber}</div>
                </div>
              </div>
            )}
            
            {/* Department/Agency */}
            <div className="flex items-start gap-2">
              <Building2 className="h-4 w-4 text-slate-500 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs text-slate-500">Department/Agency</div>
                <div className="text-sm text-slate-300 font-medium break-words line-clamp-2" title={department}>
                  {department}
                </div>
              </div>
            </div>
            
            {/* Set-Aside */}
            <div className="flex items-start gap-2">
              <Target className="h-4 w-4 text-slate-500 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs text-slate-500">Set-Aside</div>
                <div className="text-sm text-slate-300 font-medium break-words line-clamp-2" title={setAsideLabel}>
                  {setAsideLabel}
                </div>
              </div>
            </div>
            
            {/* Place of Performance (City/State) - NEW */}
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-slate-500 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs text-slate-500">Place of Performance</div>
                <div className="text-sm text-slate-300 font-medium break-words">{placeOfPerformance}</div>
              </div>
            </div>
            
            {/* Published Date */}
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-slate-500 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs text-slate-500">Published</div>
                <div className="text-sm text-slate-300 font-medium">{postedDate}</div>
              </div>
            </div>
            
            {/* Response Deadline */}
            {opportunity.responseDeadLine && (
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-slate-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs text-slate-500">Response Deadline</div>
                  <div className="text-sm text-slate-300 font-medium">{deadlineDate}</div>
                </div>
              </div>
            )}
            
            {/* NAICS Code */}
            {opportunity.naicsCode && (
              <div className="flex items-start gap-2">
                <Tag className="h-4 w-4 text-slate-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs text-slate-500">NAICS Code</div>
                  <div className="text-sm text-slate-300 font-medium">{opportunity.naicsCode}</div>
                </div>
              </div>
            )}
            
            {/* Type */}
            {opportunity.type && (
              <div className="flex items-start gap-2">
                <Layers className="h-4 w-4 text-slate-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs text-slate-500">Type</div>
                  <div className="text-sm text-slate-300 font-medium">{opportunity.type}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* REMOVED Active/Archived tags */}
      
      {/* Collapsible Details */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-slate-800 space-y-4">
          {/* Description */}
          {opportunity.description && (
            <div>
              <h4 className="text-sm font-semibold text-slate-300 mb-2">Description</h4>
              <p className="text-sm text-slate-400 line-clamp-6">
                {opportunity.description}
              </p>
            </div>
          )}
          
          {/* Contact & Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Point of Contact */}
            {opportunity.pointOfContact && (
              <div>
                <h4 className="text-sm font-semibold text-slate-300 mb-2">Point of Contact</h4>
                <div className="text-sm text-slate-400 space-y-2">
                  {opportunity.pointOfContact.fullname && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-slate-500" />
                      <span className="font-medium">{opportunity.pointOfContact.fullname}</span>
                    </div>
                  )}
                  {opportunity.pointOfContact.title && (
                    <div className="text-slate-500">{opportunity.pointOfContact.title}</div>
                  )}
                  {opportunity.pointOfContact.email && (
                    <a 
                      href={`mailto:${opportunity.pointOfContact.email}`}
                      className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                      <MessageSquare className="h-4 w-4" />
                      {opportunity.pointOfContact.email}
                    </a>
                  )}
                  {opportunity.pointOfContact.phone && (
                    <a 
                      href={`tel:${opportunity.pointOfContact.phone.replace(/\D/g, '')}`}
                      className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
                    >
                      <Phone className="h-4 w-4 text-slate-500" />
                      {opportunity.pointOfContact.phone}
                    </a>
                  )}
                </div>
              </div>
            )}
            
            {/* Links */}
            <div>
              <h4 className="text-sm font-semibold text-slate-300 mb-2">Links & Resources</h4>
              <div className="space-y-2">
                {/* SAM.gov UI Link */}
                {opportunity.uiLink && (
                  <a
                    href={opportunity.uiLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 hover:border-slate-600 text-sm text-emerald-400 hover:text-emerald-300 transition-colors w-full"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <div className="flex-1">
                      <div className="font-medium">View on SAM.gov</div>
                      <div className="text-xs text-slate-500 truncate">{opportunity.uiLink}</div>
                    </div>
                  </a>
                )}
                
                {/* Resource Links */}
                {opportunity.resourceLinks?.map((link, idx) => (
                  <a
                    key={idx}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 hover:border-slate-600 text-sm text-slate-400 hover:text-slate-300 transition-colors"
                  >
                    <ArrowUpRight className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">
                      {new URL(link).pathname.split('/').pop() || 'Resource'}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </div>
          
          {/* Additional Information */}
          {(opportunity.award || opportunity.archiveType || opportunity.baseType) && (
            <div className="pt-4 border-t border-slate-800">
              <h4 className="text-sm font-semibold text-slate-300 mb-2">Additional Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {opportunity.baseType && (
                  <div>
                    <div className="text-xs text-slate-500">Original Type</div>
                    <div className="text-sm text-slate-300">{opportunity.baseType}</div>
                  </div>
                )}
                {opportunity.archiveType && (
                  <div>
                    <div className="text-xs text-slate-500">Archive Type</div>
                    <div className="text-sm text-slate-300">{opportunity.archiveType}</div>
                  </div>
                )}
                {opportunity.award?.date && (
                  <div>
                    <div className="text-xs text-slate-500">Award Date</div>
                    <div className="text-sm text-slate-300">{formatDate(opportunity.award.date)}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Footer - UPDATED */}
      <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => toggleExpanded(id)}
            className="text-sm text-slate-500 hover:text-white transition-colors flex items-center gap-1"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Show more
              </>
            )}
          </button>
          
          {opportunity.noticeId && (
            <div className="text-sm text-slate-500 flex items-center gap-1">
              <Hash className="h-3 w-3" />
              <span className="font-mono">{opportunity.noticeId}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            icon={<Share2 className="h-4 w-4" />}
            onClick={() => {
              if (navigator.share && opportunity.title && opportunity.uiLink) {
                navigator.share({
                  title: opportunity.title,
                  url: opportunity.uiLink
                })
              } else if (opportunity.uiLink) {
                copyText(opportunity.uiLink)
              }
            }}
          >
            Share
          </Button>
          {opportunity.uiLink && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => window.open(opportunity.uiLink, '_blank')}
              icon={<ExternalLink className="h-4 w-4" />}
            >
              View on SAM.gov
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// --- Utility Functions ---
function getDefaultDates() {
  const to = new Date()
  const from = new Date()
  from.setMonth(from.getMonth() - 6)
  return {
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0]
  }
}

function clamp(str: string, max: number) {
  return str.length > max ? str.substring(0, max) : str
}

function safeJsonParse(str: string) {
  try {
    return JSON.parse(str)
  } catch {
    return null
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

function normalizeText(str?: string) {
  return (str || '').trim()
}

function normalizeAgency(o: Opp) {
  return normalizeText(o.department || o.fullParentPathName || o.office)
}

function normalizeNaics(o: Opp) {
  return normalizeText(o.naicsCode)
}

function normalizeState(o: Opp) {
  return normalizeText(o.placeOfPerformance?.state?.code)
}

function normalizeCity(o: Opp) {
  return normalizeText(o.placeOfPerformance?.city?.name)
}

function normalizeSol(o: Opp) {
  return normalizeText(o.solicitationNumber)
}

function normalizeProductService(o: Opp) {
  return normalizeText(o.productServiceCode)
}

function normalizeNoticeId(o: Opp) {
  return normalizeText(o.noticeId)
}

function normalizeTitle(o: Opp) {
  return normalizeText(o.title)
}

function normalizeType(o: Opp) {
  return normalizeText(o.type)
}

function normalizeSetAsideCode(o: Opp) {
  return normalizeText(o.setAsideCode || o.setAside)
}

function groupLabelFromSetAside(o: Opp) {
  const code = normalizeSetAsideCode(o)
  return SET_ASIDE_LABEL_BY_CODE[code] || code
}

function formatNaicsDisplay(o: Opp) {
  const code = normalizeNaics(o)
  return code ? `NAICS ${code}` : ''
}

function formatSetAsideDisplay(o: Opp) {
  const label = groupLabelFromSetAside(o)
  return label || ''
}

function summarizePlace(o: Opp) {
  const city = normalizeCity(o)
  const state = normalizeState(o)
  return [city, state].filter(Boolean).join(', ')
}

function withinText(hay: string, needle: string) {
  return hay.toLowerCase().includes(needle.toLowerCase())
}

function formatSearchQuery(query: string): string {
  try {
    const params = new URLSearchParams(query)
    const parts: string[] = []
    
    // Get readable labels for parameters
    const title = params.get('title')
    if (title && title !== '*') parts.push(`"${title}"`)
    
    const ptype = params.get('ptype')
    if (ptype) {
      const typeMap: Record<string, string> = {
        'a': 'Award Notice',
        'p': 'Pre-solicitation',
        'o': 'Solicitation',
        'r': 'Sources Sought',
        's': 'Special Notice',
        'u': 'Justification (J&A)',
        'k': 'Combined Synopsis/Solicitation',
        'g': 'Sale of Surplus Property',
        'i': 'Intent to Bundle (DoD)'
      }
      parts.push(typeMap[ptype] || `Type: ${ptype}`)
    }
    
    const typeOfSetAside = params.get('typeOfSetAside')
    if (typeOfSetAside) {
      parts.push(SET_ASIDE_LABEL_BY_CODE[typeOfSetAside] || `Set-Aside: ${typeOfSetAside}`)
    }
    
    const state = params.get('state')
    if (state) {
      const stateLabel = US_STATES.find(s => s.value === state)?.label || state
      parts.push(`State: ${stateLabel}`)
    }
    
    const postedFrom = params.get('postedFrom')
    const postedTo = params.get('postedTo')
    if (postedFrom || postedTo) {
      if (postedFrom && postedTo) {
        parts.push(`${postedFrom} to ${postedTo}`)
      } else if (postedFrom) {
        parts.push(`After ${postedFrom}`)
      } else if (postedTo) {
        parts.push(`Before ${postedTo}`)
      }
    }
    
    const naics = params.get('naics')
    if (naics) parts.push(`NAICS: ${naics}`)
    
    const organizationCode = params.get('organizationCode')
    if (organizationCode) parts.push(`Agency: ${organizationCode}`)
    
    const solnum = params.get('solnum')
    if (solnum) parts.push(`Solicitation: ${solnum}`)
    
    return parts.length > 0 ? parts.join('   ') : 'Empty search'
  } catch {
    return query.length > 30 ? query.substring(0, 30) + '...' : query
  }
}

// Add this function BEFORE updateFacets
function getSolicitationDates(opportunity: Opp): { start?: string, end?: string } {
  // Check for contract start/end dates in the award data
  if (opportunity.award?.contractDates) {
    return {
      start: opportunity.award.contractDates.start,
      end: opportunity.award.contractDates.end
    }
  }
  
  // Check for performance period in description
  if (opportunity.description) {
    const startMatch = opportunity.description.match(/start(?:ing)?\s*(?:date)?\s*[:]?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i)
    const endMatch = opportunity.description.match(/(?:end|completion|closing)\s*(?:date)?\s*[:]?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i)
    
    return {
      start: startMatch ? startMatch[1] : undefined,
      end: endMatch ? endMatch[1] : undefined
    }
  }
  
  return {}
}

function updateFacets(opps: Opp[]) {
  // Implementation would go here
  return {
    agencies: [],
    setAsides: [],
    naics: [],
    states: [],
    cities: [],
    productServices: [],
    departments: [],
    types: []
  }
}

// --- Main Component ---
function SearchPageContent() {
  const router = useRouter()
  const { data: session, status } = useSession()

  // Access Control
  const {
    hasValidAccess,
    canBrowse,
    showReminderModal,
    setShowReminderModal,
    showLockoutModal,
    setShowLockoutModal,
    remainingTime,
    isAuthenticated,
    planLoading, // ✅ Add loading state
  } = useBrowsingSession()

  const MAX_LOOKBACK_DAYS = 364
  const DEFAULT_LIMIT = 1000
  const LOAD_MORE_INCREMENT = 1000

  // Search form states - REMOVED unnecessary fields
  const [keywords, setKeywords] = useState('')
  const [naics, setNaics] = useState('')
  const [agency, setAgency] = useState('')
  const [setAside, setSetAside] = useState('')
  const [stateOfPerformance, setStateOfPerformance] = useState('')
  const [postedAfter, setPostedAfter] = useState(getDefaultDates().from)
  const [postedBefore, setPostedBefore] = useState(getDefaultDates().to)
  const [procurementType, setProcurementType] = useState('o') // Default to Solicitation  // ← ADD THIS LINE

  // PERFORMANCE FIX: Debounce keywords to reduce API calls
  const debouncedKeywords = useDebounce(keywords, 500)
  
  // PERFORMANCE FIX: AbortController for canceling requests
  const abortControllerRef = useRef<AbortController | null>(null)

  // UI states
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<ApiResponse | null>(null)
  const [showFilters, setShowFilters] = useState(true)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [sortBy, setSortBy] = useState<'posted' | 'deadline' | 'relevance'>('posted')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Access control - with feature-specific gating
  const [showAccessModal, setShowAccessModal] = useState(false)
  const [blockedFeature, setBlockedFeature] = useState('Advanced Federal Bid Search')
  const pendingActionRef = useRef<(() => void) | null>(null)

  const [isSignUp, setIsSignUp] = useState(true)

  // Alert modal state
  const [showAlertBuilder, setShowAlertBuilder] = useState(false)

  const [showSavedSearchModal, setShowSavedSearchModal] = useState(false)
  // Saved opportunities
  const [saved, setSaved] = useState<Record<string, boolean>>({})

  // Results limit and pagination
  const [resultsLimit, setResultsLimit] = useState(DEFAULT_LIMIT)
  const [hasMoreResults, setHasMoreResults] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  // Drill-down states
  const [showSetAsideDrilldown, setShowSetAsideDrilldown] = useState(false)
  const [showStateDrilldown, setShowStateDrilldown] = useState(false)
  const [showNaicsDrilldown, setShowNaicsDrilldown] = useState(false)
  const [showAgencyDrilldown, setShowAgencyDrilldown] = useState(false)

  // Interactive breakdown states
  const [expandedBreakdown, setExpandedBreakdown] = useState<'setAsides' | 'naics' | 'agencies' | 'states' | null>(null)

  // Recent searches
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  // Refs
  const resultsRef = useRef<HTMLDivElement>(null)
  const filtersRef = useRef<HTMLDivElement>(null)
  const lastSearchParamsRef = useRef<string>('') // CRITICAL FIX: Track last search to prevent duplicates

  const scrollToResults = useCallback(() => {
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const savedSearches = localStorage.getItem('govcon_recent_searches')
      if (savedSearches) setRecentSearches(JSON.parse(savedSearches).slice(0, 5))
      
      const savedData = localStorage.getItem('govcon_saved_opportunities')
      if (savedData) setSaved(JSON.parse(savedData))
    } catch (error) {
      console.error('Failed to load data:', error)
    }
  }, [])

  const searchParams = useSearchParams()
  // Auto-load saved search if loadSavedSearch param is present
  // Auto-load and optionally run a saved search from Alerts
  useEffect(() => {
    const savedSearchId = searchParams?.get('loadSavedSearch')
    const runImmediately = searchParams?.get('run') === '1'
    
    if (!savedSearchId) return
    
    // ✅ Wait for subscription to load before running
    if (planLoading) {
      console.log('⏳ Waiting for subscription data before loading saved search...')
      return
    }
    
    ;(async () => {
      try {
        console.log('🔄 Loading saved search:', savedSearchId)
        
        const res = await fetch(`/api/saved-searches/${savedSearchId}`)
        if (!res.ok) {
          console.error('Failed to load saved search:', res.status)
          return
        }
        
        const { search } = await res.json()
        console.log('✅ Loaded saved search:', search)
        
        // Apply the filters
        setKeywords(search.keywords || '')
        setNaics(search.naics || '')
        setAgency(search.agency || '')
        setSetAside(search.setAside || '')
        setStateOfPerformance(search.stateOfPerformance || '')
        setProcurementType(search.procurementType || 'o')
        setPostedAfter(search.postedAfter || getDefaultDates().from)
        setPostedBefore(search.postedBefore || getDefaultDates().to)
        
        // If run=1, automatically execute the search
        if (runImmediately) {
          console.log('🔍 Auto-running search with subscription loaded...')
          setTimeout(() => {
            console.log('🚀 Executing search now')
            runSearch(false)
          }, 500)
        }
      } catch (e) {
        console.error('Failed to auto-load saved search:', e)
      }
    })()
  }, [searchParams, planLoading]) // ✅ Add planLoading as dependency
  // ← ADD THIS LINE HERE

  useEffect(() => {
    try {
      const from = searchParams?.get('from')
      if (from !== 'cta') return
      if (hasValidAccess) return // ✅ FIXED: Use hasValidAccess

      const shown = sessionStorage.getItem('govcon_gate_shown')
      if (shown) return
      sessionStorage.setItem('govcon_gate_shown', 'true')

      setBlockedFeature('Advanced Federal Bid Search')
      pendingActionRef.current = () => { void runSearch(false) }
      setTimeout(() => setShowAccessModal(true), 350)
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])


  // Save recent searches
  const saveSearchToHistory = useCallback((searchParams: string) => {
    try {
      const updated = [searchParams, ...recentSearches.filter(s => s !== searchParams)].slice(0, 10)
      setRecentSearches(updated)
      localStorage.setItem('govcon_recent_searches', JSON.stringify(updated))
    } catch (error) {
      console.error('Failed to save search history:', error)
    }
  }, [recentSearches])

  // Check if user has access - Robust version
  // ✅ REMOVED: Old checkAccess function - now using hasValidAccess from useBrowsingSession
  // This function was using wrong field names (subscription_tier, plan_status)
  // The correct approach is to use the centralized hasValidAccess which works properly

  /**
   * Gate a premium action - if user doesn't have access, show modal
   * @param featureName - The name of the feature being accessed (shown in modal)
   * @returns true if user has access, false if gated (modal shown)
   * ✅ FIXED: Now uses hasValidAccess from useBrowsingSession
   */
  const requireAccess = useCallback((featureName: string): boolean => {
    // ✅ CRITICAL: Don't show modal while still loading
    if (planLoading || status === 'loading') {
      console.log('⏳ Still loading, deferring access check...')
      return false // Block action but don't show modal
    }
    
    // ✅ Use the centralized hasValidAccess instead of broken checkAccess
    if (!hasValidAccess) {
      // User doesn't have access - show modal
      setBlockedFeature(featureName)
      setShowAccessModal(true)
      
      // Don't set pending action for search - it should be blocked
      if (featureName.includes('Search')) {
        pendingActionRef.current = null // Clear any pending search action
      }
      
      return false
    }
    
    return true
  }, [hasValidAccess, planLoading, status])



    const handleCreateAlert = () => {
    if (status === 'loading') return
    if (!requireAccess('Email Alerts for New Opportunities')) return
    setShowAlertBuilder(true)
  }
  
  // Dashboard should be accessible to everyone
  const handleViewDashboard = () => {
    router.push('/dashboard')
  }

  // Date validation helper
  const validateDateRange = (postedAfter: string, postedBefore: string) => {
    if (!postedAfter || !postedBefore) return { valid: true }
    
    const start = new Date(postedAfter)
    const end = new Date(postedBefore)
    const daysDiff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysDiff > 364) {
      return {
        valid: false,
        message: 'Date range cannot exceed 364 days. SAM.gov limits searches to one year maximum. Please adjust your date range.'
      }
    }
    
    return { valid: true }
  }

  // Auto-fix date range to 364 days
  const autoFixDateRange = () => {
    const end = new Date(postedBefore)
    const start = new Date(end)
    start.setDate(start.getDate() - 364)
    setPostedAfter(start.toISOString().split('T')[0])
    setError(null)
  }

  // Search function - with gating
  // Search function - with gating
  const runSearch = async (isLoadMore = false) => {
    console.log('🔍 runSearch called:', { 
      isLoadMore, 
      status, 
      hasValidAccess, 
      planLoading,
      canBrowse,
      procurementType, 
      setAside,
      stateOfPerformance,
      keywords,
      currentPage 
    })
    
    // CRITICAL: Check if user can browse for unauthenticated/expired users
    if (!canBrowse) {
      console.log('❌ Search blocked: canBrowse is false')
      setShowLockoutModal(true)
      return
    }
    
    // CRITICAL FIX: Prevent duplicate simultaneous searches
    if (!isLoadMore && loading) {
      console.log('❌ Search blocked: already in progress')
      return
    }
    
    if (isLoadMore && loadingMore) {
      console.log('❌ Load more blocked: already in progress')
      return
    }
    
    // Gate the search action
    if (!requireAccess('Search Federal Opportunities')) {
      console.log('❌ Search blocked: requireAccess failed')
      pendingActionRef.current = () => runSearch(isLoadMore)
      return
    }
    
    console.log('✅ All checks passed, executing search...')
    
    // Validate date range before searching
    const dateValidation = validateDateRange(postedAfter, postedBefore)
    if (!dateValidation.valid) {
      setError(dateValidation.message || 'Invalid date range')
      setLoading(false)
      setLoadingMore(false)
      return
    }
    
    // PERFORMANCE FIX: Cancel any pending requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // PERFORMANCE FIX: Create new AbortController for this request
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    if (isLoadMore) {
      setLoadingMore(true)
    } else {
      setLoading(true)
      setResultsLimit(DEFAULT_LIMIT)
      setCurrentPage(1)
    }
    
    setError(null)

    try {
      const qs = new URLSearchParams()
      
      // ? CORRECT PARAMETER MAPPING:
      
      // 1. KEYWORD SEARCH - Use 'title' parameter, NOT 'q'
      // PERFORMANCE FIX: Use debounced keywords
      if (debouncedKeywords.trim()) {
        qs.set('title', debouncedKeywords.trim())
      }
      
      // 2. REQUIRED: Procurement Type (ptype)
      qs.set('ptype', procurementType.trim() || 'o') // Default to 'o' (Solicitation) if empty
      
      // 3. NAICS Code - CORRECT: 'naics' NOT 'ncode'
      if (naics.trim()) {
        qs.set('naics', clamp(naics.trim(), 6))
      }
      
      // 4. Agency/Organization - CORRECT: 'organizationCode' NOT 'organizationName'
      if (agency.trim()) {
        qs.set('organizationCode', clamp(agency.trim(), 120))
      }
      
      // 5. Set-Aside - CORRECT ?
      if (setAside.trim() && setAside !== '') {
        qs.set('typeOfSetAside', setAside.trim())
      }
      
      // 6. State - CORRECT ?
      if (stateOfPerformance.trim() && stateOfPerformance !== '') {
        qs.set('state', stateOfPerformance.trim())
      }
      
      // 7. Dates - CORRECT ?
      if (postedAfter.trim()) {
        qs.set('postedFrom', postedAfter.trim())
      }
      if (postedBefore.trim()) {
        qs.set('postedTo', postedBefore.trim())
      }
      
      // 8. Pagination
      qs.set('limit', String(DEFAULT_LIMIT))
      qs.set('offset', String((currentPage - 1) * DEFAULT_LIMIT))

      // CRITICAL FIX: Prevent duplicate identical searches
      const searchParamsString = qs.toString()
      if (!isLoadMore && searchParamsString === lastSearchParamsRef.current) {
        console.log('⚠️ Duplicate search prevented - params unchanged')
        setLoading(false)
        return
      }
      lastSearchParamsRef.current = searchParamsString

      console.log('Calling API with corrected SAM.gov parameters:', Object.fromEntries(qs.entries()))

      // PERFORMANCE FIX: Pass signal to fetch for cancellation
      const res = await fetch(`/api/sam?${qs.toString()}`, { 
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: abortController.signal
      })
      
      if (!res.ok) {
        const errorText = await res.text()
        console.error('API request failed:', { status: res.status, errorText })
        
        // Handle payment required (trial ended)
        if (res.status === 402) {
          setBlockedFeature('Search Federal Opportunities')
          setShowAccessModal(true)
          throw new Error('Your trial has ended. Please upgrade to continue searching.')
        }
        
        throw new Error(`API request failed with status ${res.status}: ${errorText}`)
      }
      
      const json = await res.json()
      const payload: ApiResponse = json

      const opps = payload.opportunitiesData || []
      
      // Check if there are more results available
      const total = payload.totalRecords || 0
      const loaded = opps.length
      const currentTotalLoaded = isLoadMore 
        ? (data?.opportunitiesData?.length || 0) + loaded
        : loaded
      setHasMoreResults(currentTotalLoaded < total)
      
      if (isLoadMore) {
        setData(prev => ({
          ...prev,
          totalRecords: total,
          opportunitiesData: [...(prev?.opportunitiesData || []), ...opps]
        }))
        setCurrentPage(prev => prev + 1)
      } else {
        setData(payload)
        // Save search to history
        saveSearchToHistory(qs.toString())
      }

      console.log('API Search successful', { 
        results: opps.length, 
        totalRecords: total,
        hasMoreResults: currentTotalLoaded < total,
        procurementType: procurementType,
        setAsideFilter: setAside,
        isLoadMore 
      })
      
    } catch (e: any) {
      // PERFORMANCE FIX: Don't show errors for aborted requests
      if (e.name === 'AbortError' || abortController.signal.aborted) {
        console.log('Request aborted')
        return
      }
      
      console.error('Search error:', e)
      setError(e?.message || 'Search failed. Please try again.')
      if (!isLoadMore) {
        setData(null)
      }
    } finally {
      // PERFORMANCE FIX: Only update loading state if request wasn't aborted
      if (!abortController.signal.aborted) {
        if (isLoadMore) {
          setLoadingMore(false)
        } else {
          setLoading(false)
        }
      }
    }
  }

  // Load more results
  const loadMoreResults = () => {
    runSearch(true)
  }

  // Reset all filters
  const resetAll = () => {
    const dd = getDefaultDates()
    setKeywords('')
    setNaics('')
    setAgency('')
    setSetAside('')
    setStateOfPerformance('')
    setPostedAfter(dd.from)
    setPostedBefore(dd.to)
    setProcurementType('o')
    setError(null)
    setData(null)
    setResultsLimit(DEFAULT_LIMIT)
    setCurrentPage(1)
    setSortBy('posted')
    setSortOrder('desc')
    
    // Close all drilldowns
    setShowSetAsideDrilldown(false)
    setShowStateDrilldown(false)
    setShowNaicsDrilldown(false)
    setShowAgencyDrilldown(false)
  }

  // Filter functions
  const filterBySetAside = (setAsideCode: string) => {
    setSetAside(setAsideCode)
    setShowSetAsideDrilldown(false)
  }

  const filterByState = (state: string) => {
    setStateOfPerformance(state)
    setShowStateDrilldown(false)
  }

  const filterByNaics = (naicsCode: string) => {
    setNaics(naicsCode)
    setShowNaicsDrilldown(false)
  }

  const filterByAgency = (agencyName: string) => {
    setAgency(agencyName)
    setShowAgencyDrilldown(false)
  }

  // Click-to-filter handlers for breakdown cards
  const handleBreakdownFilter = useCallback((type: 'setAside' | 'naics' | 'agency' | 'state', value: string) => {
    // Convert set-aside label to code if needed
    let filterValue = value
    if (type === 'setAside') {
      filterValue = SET_ASIDE_CODE_BY_LABEL[value] || value
    }

    // Set the filter
    switch (type) {
      case 'setAside':
        setSetAside(filterValue)
        break
      case 'naics':
        setNaics(filterValue)
        break
      case 'agency':
        setAgency(filterValue)
        break
      case 'state':
        setStateOfPerformance(filterValue)
        break
    }

    // Collapse the breakdown
    setExpandedBreakdown(null)
  }, [])

  // Clear specific filters - NO AUTO-REFRESH
  const clearAllClientFilters = () => {
    setAgency('')
    setSetAside('')
    setNaics('')
    setStateOfPerformance('')
  }

  // Update search when filter is removed (user must click search button)
  const handleFilterRemoveAndSearch = (filterType: string) => {
    switch (filterType) {
      case 'agency':
        setAgency('')
        break
      case 'setAside':
        setSetAside('')
        break
      case 'naics':
        setNaics('')
        break
      case 'state':
        setStateOfPerformance('')
        break
    }
    
    // User needs to click search button to see updated results
    // This gives them control over when the search happens
  }

  // Export functions
  const exportCsv = () => {
    if (!filteredResults.length) return
    
    // Gate the export action
    if (!requireAccess('Export to CSV')) return
    
    const headers = ['Title', 'Solicitation Number', 'Agency', 'Posted Date', 'Deadline', 'Set-Aside', 'NAICS', 'Location']
    const rows = filteredResults.map(opp => [
      opp.title || '',
      opp.solicitationNumber || '',
      opp.department || '',
      opp.postedDate || '',
      opp.responseDeadLine || '',
      opp.setAside || '',
      opp.naicsCode || '',
      `${opp.placeOfPerformance?.city?.name || ''}, ${opp.placeOfPerformance?.state?.code || ''}`.replace(/^, |, $/g, '')
    ])
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `opportunities-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const exportJson = () => {
    if (!filteredResults.length) return
    
    // Gate the export action
    if (!requireAccess('Export to JSON')) return
    
    const dataStr = JSON.stringify(filteredResults, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `opportunities-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Quick actions
  const handleQuickSearch = (searchTerm: string) => {
    setKeywords(searchTerm)
  }

  const toggleExpanded = (k: string) => setExpanded((p) => ({ ...p, [k]: !p[k] }))

  const copyText = async (txt: string) => {
    try {
      await navigator.clipboard.writeText(txt)
      setCopiedId(txt)
      setTimeout(() => setCopiedId(null), 1200)
    } catch {}
  }

  const toggleSaved = (id: string) => {
    // Gate the save action
    if (!requireAccess('Save Opportunities')) return
    
    setSaved((p) => {
      const newSaved = { ...p, [id]: !p[id] }
      // Save to localStorage
      try {
        localStorage.setItem('govcon_saved_opportunities', JSON.stringify(newSaved))
      } catch (error) {
        console.error('Failed to save opportunities:', error)
      }
      return newSaved
    })
  }

  // Results data
  const totalRecords = data?.totalRecords ?? 0
  const results = data?.opportunitiesData ?? []

  // Filtered results with memoization - PERFORMANCE OPTIMIZED
  const filteredResults = useMemo(() => {
    let arr = results.slice()

    // DO NOT FILTER BY: agency, setAside, naics, or stateOfPerformance
    // These are already filtered by the SAM.gov API
    
    // PERFORMANCE FIX: Use debounced keywords for client-side filtering
    // The keyword search is client-side only because SAM.gov's 'title' 
    // parameter searches title field only, but we want to search across
    // multiple fields including description
    if (debouncedKeywords.trim() && debouncedKeywords.trim() !== '*') {
      const needle = debouncedKeywords.trim()
      arr = arr.filter((o) => {
        const hay = [
          normalizeTitle(o),
          normalizeSol(o),
          normalizeAgency(o),
          formatNaicsDisplay(o),
          formatSetAsideDisplay(o),
          normalizeType(o),
          summarizePlace(o),
          normalizeNoticeId(o),
          o.description || ''
        ]
          .filter(Boolean)
          .join(' | ')
        return withinText(hay, needle)
      })
    }

    // Apply sorting (this doesn't filter, just reorders)
    arr.sort((a, b) => {
      let aVal, bVal
      
      switch (sortBy) {
        case 'deadline':
          aVal = new Date(a.responseDeadLine || 0).getTime()
          bVal = new Date(b.responseDeadLine || 0).getTime()
          break
        case 'posted':
          aVal = new Date(a.postedDate || 0).getTime()
          bVal = new Date(b.postedDate || 0).getTime()
          break
        case 'relevance':
        default:
          // For relevance, maintain API order (no sorting)
          return 0
      }
      
      // Apply sort order
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
    })

    return arr
  }, [results, debouncedKeywords, sortBy, sortOrder])

  // Summary statistics - ENHANCED with detailed breakdowns
  const summaryStats = useMemo(() => {
    const arr = filteredResults
    const total = arr.length
    
    // Calculate quick stats
    const urgentCount = arr.filter(o => {
      if (!o.responseDeadLine) return false
      const daysUntil = Math.ceil((new Date(o.responseDeadLine).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      return daysUntil <= 7
    }).length
    
    const smallBusinessCount = arr.filter(o => 
      o.setAside && ['SBA', '8A', 'SDB', 'HUBZone', 'SDVOSB', 'WOSB'].includes(o.setAside)
    ).length
    
    const recentCount = arr.filter(o => {
      if (!o.postedDate) return false
      const daysSince = Math.ceil((Date.now() - new Date(o.postedDate).getTime()) / (1000 * 60 * 60 * 24))
      return daysSince <= 7
    }).length

    // NEW: Detailed breakdowns by category
    const setAsideBreakdown: Record<string, number> = {}
    const naicsBreakdown: Record<string, number> = {}
    const agencyBreakdown: Record<string, number> = {}
    const stateBreakdown: Record<string, number> = {}

    arr.forEach(o => {
      // Set-aside breakdown
      const setAsideCode = normalizeSetAsideCode(o)
      if (setAsideCode) {
        const label = groupLabelFromSetAside(o)
        setAsideBreakdown[label] = (setAsideBreakdown[label] || 0) + 1
      } else {
        setAsideBreakdown['No Set-Aside'] = (setAsideBreakdown['No Set-Aside'] || 0) + 1
      }

      // NAICS breakdown
      const naicsCode = normalizeNaics(o)
      if (naicsCode) {
        naicsBreakdown[naicsCode] = (naicsBreakdown[naicsCode] || 0) + 1
      }

      // Agency breakdown
      const agencyName = normalizeAgency(o)
      if (agencyName) {
        agencyBreakdown[agencyName] = (agencyBreakdown[agencyName] || 0) + 1
      }

      // State breakdown
      const stateCode = normalizeState(o)
      if (stateCode) {
        stateBreakdown[stateCode] = (stateBreakdown[stateCode] || 0) + 1
      }
    })

    // Sort breakdowns by count (descending) and get top items
    const sortByCount = (obj: Record<string, number>) => 
      Object.entries(obj)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10) // Top 10

    return {
      total,
      urgentCount,
      smallBusinessCount,
      recentCount,
      savedCount: Object.keys(saved).length,
      // Detailed breakdowns
      uniqueSetAsides: Object.keys(setAsideBreakdown).length,
      uniqueNaics: Object.keys(naicsBreakdown).length,
      uniqueAgencies: Object.keys(agencyBreakdown).length,
      uniqueStates: Object.keys(stateBreakdown).length,
      topSetAsides: sortByCount(setAsideBreakdown),
      topNaics: sortByCount(naicsBreakdown),
      topAgencies: sortByCount(agencyBreakdown),
      topStates: sortByCount(stateBreakdown)
    }
  }, [filteredResults, saved])

  // Format remaining time for display
  const formatRemainingTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const currentSearchParams = {
    keywords, naics, agency, setAside, 
    stateOfPerformance, postedAfter, postedBefore, procurementType,
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate- to-slate-950 text-slate-50">
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      <div className="relative z-10 max-w-[1800px] mx-auto px-6 lg:px-10 xl:px-12 py-6 lg:py-10">

        {/* Show browsing timer for unauthenticated users */}
        {!isAuthenticated && canBrowse && remainingTime > 0 && (
          <div className="sticky top-0 z-50 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-b border-amber-500/20 backdrop-blur-sm mb-6 rounded-2xl">
            <div className="max-w-[1800px] mx-auto px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-amber-400" />
                <span className="text-slate-300">
                  Browsing time remaining: <span className="font-semibold text-amber-400">{formatRemainingTime(remainingTime)}</span>
                </span>
              </div>
              <button
                onClick={() => setShowReminderModal(true)}
                className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors"
              >
                Sign Up for Full Access
              </button>
            </div>
          </div>
        )}

        {/* Welcome Banner for Authenticated Users */}
        
        <ProfileCompletionReminder />
        {/* Enhanced Welcome Banner */}
        <div className="mb-8 rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900/50 to-slate-950/30 p-6 lg:p-8 shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center">
                  <Rocket className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold text-white">
                   Welcome to Federal Bid Search
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 ml-2">
                      Pro
                    </span>
                  </h1>
                  <p className="text-slate-400 mt-1">
                    Find, analyze, and track federal contracting opportunities
                  </p>
                </div>
              </div>
              
              {/* Quick Stats */}
              <div className="flex flex-wrap items-center gap-4 mt-4">
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-slate-300">Real-time SAM.gov data</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-slate-300">Advanced filtering</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-2 w-2 rounded-full bg-purple-400 animate-pulse" />
                  <span className="text-slate-300">Export ready</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-3">
              <SavedSearchActions currentSearchParams={currentSearchParams} />
              
              <Button variant="secondary" size="lg" icon={<BarChart3 className="h-5 w-5" />} onClick={handleViewDashboard}>
                View Dashboard
              </Button>
            </div>
          </div>
          
          {/* Results Analytics - Interactive with Expandable Lists */}
          {filteredResults.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-800">
              <div className="flex items-center gap-2 mb-4">
                <PieChart className="h-5 w-5 text-emerald-400" />
                <span className="text-lg font-semibold text-white">Results Breakdown</span>
                <span className="ml-auto text-sm text-slate-400">
                  {summaryStats.total.toLocaleString()} total records
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Set-Asides Breakdown - INTERACTIVE */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4 hover:border-slate-700 transition-colors">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="h-4 w-4 text-amber-400" />
                    <h4 className="font-semibold text-slate-200">Set-Asides</h4>
                  </div>
                  <div className="space-y-2">
                    <button
                      onClick={() => setExpandedBreakdown(expandedBreakdown === 'setAsides' ? null : 'setAsides')}
                      className="w-full text-left hover:bg-slate-800/50 rounded-lg p-2 -m-2 transition-colors group"
                    >
                      <div className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                        {summaryStats.uniqueSetAsides}
                        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${expandedBreakdown === 'setAsides' ? 'rotate-180' : ''}`} />
                      </div>
                      <div className="text-xs text-slate-400">
                        {expandedBreakdown === 'setAsides' ? 'Click to collapse' : 'Click to expand all'}
                      </div>
                    </button>
                    <div className={`space-y-1.5 overflow-y-auto transition-all ${expandedBreakdown === 'setAsides' ? 'max-h-96' : 'max-h-32'}`}>
                      {(expandedBreakdown === 'setAsides' ? summaryStats.topSetAsides : summaryStats.topSetAsides.slice(0, 5)).map(([name, count]) => (
                        <button
                          key={name}
                          onClick={() => handleBreakdownFilter('setAside', name)}
                          className="w-full flex items-center justify-between text-xs hover:bg-slate-800/50 rounded px-2 py-1.5 transition-colors cursor-pointer group"
                          title={`Click to filter by: ${name}`}
                        >
                          <span className="text-slate-300 truncate mr-2 group-hover:text-white transition-colors">
                            {name.length > 20 ? name.substring(0, 20) + '...' : name}
                          </span>
                          <span className="text-emerald-400 font-medium whitespace-nowrap flex items-center gap-1">
                            {count}
                            <Filter className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* NAICS Codes Breakdown - INTERACTIVE */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4 hover:border-slate-700 transition-colors">
                  <div className="flex items-center gap-2 mb-3">
                    <Tag className="h-4 w-4 text-cyan-400" />
                    <h4 className="font-semibold text-slate-200">NAICS Codes</h4>
                  </div>
                  <div className="space-y-2">
                    <button
                      onClick={() => setExpandedBreakdown(expandedBreakdown === 'naics' ? null : 'naics')}
                      className="w-full text-left hover:bg-slate-800/50 rounded-lg p-2 -m-2 transition-colors group"
                    >
                      <div className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                        {summaryStats.uniqueNaics}
                        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${expandedBreakdown === 'naics' ? 'rotate-180' : ''}`} />
                      </div>
                      <div className="text-xs text-slate-400">
                        {expandedBreakdown === 'naics' ? 'Click to collapse' : 'Click to expand all'}
                      </div>
                    </button>
                    <div className={`space-y-1.5 overflow-y-auto transition-all ${expandedBreakdown === 'naics' ? 'max-h-96' : 'max-h-32'}`}>
                      {(expandedBreakdown === 'naics' ? summaryStats.topNaics : summaryStats.topNaics.slice(0, 5)).map(([code, count]) => (
                        <button
                          key={code}
                          onClick={() => handleBreakdownFilter('naics', code)}
                          className="w-full flex items-center justify-between text-xs hover:bg-slate-800/50 rounded px-2 py-1.5 transition-colors cursor-pointer group"
                          title={`Click to filter by NAICS: ${code}`}
                        >
                          <span className="text-slate-300 font-mono group-hover:text-white transition-colors">{code}</span>
                          <span className="text-cyan-400 font-medium flex items-center gap-1">
                            {count}
                            <Filter className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Agencies Breakdown - INTERACTIVE */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4 hover:border-slate-700 transition-colors">
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="h-4 w-4 text-purple-400" />
                    <h4 className="font-semibold text-slate-200">Agencies</h4>
                  </div>
                  <div className="space-y-2">
                    <button
                      onClick={() => setExpandedBreakdown(expandedBreakdown === 'agencies' ? null : 'agencies')}
                      className="w-full text-left hover:bg-slate-800/50 rounded-lg p-2 -m-2 transition-colors group"
                    >
                      <div className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                        {summaryStats.uniqueAgencies}
                        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${expandedBreakdown === 'agencies' ? 'rotate-180' : ''}`} />
                      </div>
                      <div className="text-xs text-slate-400">
                        {expandedBreakdown === 'agencies' ? 'Click to collapse' : 'Click to expand all'}
                      </div>
                    </button>
                    <div className={`space-y-1.5 overflow-y-auto transition-all ${expandedBreakdown === 'agencies' ? 'max-h-96' : 'max-h-32'}`}>
                      {(expandedBreakdown === 'agencies' ? summaryStats.topAgencies : summaryStats.topAgencies.slice(0, 5)).map(([name, count]) => (
                        <button
                          key={name}
                          onClick={() => handleBreakdownFilter('agency', name)}
                          className="w-full flex items-center justify-between text-xs hover:bg-slate-800/50 rounded px-2 py-1.5 transition-colors cursor-pointer group"
                          title={`Click to filter by agency: ${name}`}
                        >
                          <span className="text-slate-300 truncate mr-2 group-hover:text-white transition-colors">
                            {name.length > 20 ? name.substring(0, 20) + '...' : name}
                          </span>
                          <span className="text-purple-400 font-medium whitespace-nowrap flex items-center gap-1">
                            {count}
                            <Filter className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* States Breakdown - INTERACTIVE */}
                <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4 hover:border-slate-700 transition-colors">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="h-4 w-4 text-rose-400" />
                    <h4 className="font-semibold text-slate-200">States</h4>
                  </div>
                  <div className="space-y-2">
                    <button
                      onClick={() => setExpandedBreakdown(expandedBreakdown === 'states' ? null : 'states')}
                      className="w-full text-left hover:bg-slate-800/50 rounded-lg p-2 -m-2 transition-colors group"
                    >
                      <div className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                        {summaryStats.uniqueStates}
                        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${expandedBreakdown === 'states' ? 'rotate-180' : ''}`} />
                      </div>
                      <div className="text-xs text-slate-400">
                        {expandedBreakdown === 'states' ? 'Click to collapse' : 'Click to expand all'}
                      </div>
                    </button>
                    <div className={`space-y-1.5 overflow-y-auto transition-all ${expandedBreakdown === 'states' ? 'max-h-96' : 'max-h-32'}`}>
                      {(expandedBreakdown === 'states' ? summaryStats.topStates : summaryStats.topStates.slice(0, 5)).map(([code, count]) => (
                        <button
                          key={code}
                          onClick={() => handleBreakdownFilter('state', code)}
                          className="w-full flex items-center justify-between text-xs hover:bg-slate-800/50 rounded px-2 py-1.5 transition-colors cursor-pointer group"
                          title={`Click to filter by state: ${code}`}
                        >
                          <span className="text-slate-300 font-medium group-hover:text-white transition-colors">{code}</span>
                          <span className="text-rose-400 font-medium flex items-center gap-1">
                            {count}
                            <Filter className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard 
            label="Total Results" 
            value={summaryStats.total.toLocaleString()}
            icon={<TrendingUp className="h-5 w-5 text-emerald-400" />}
            onClick={scrollToResults}
            loading={loading}
          />
          
          <StatCard 
            label="Urgent (=7 days)" 
            value={summaryStats.urgentCount.toLocaleString()}
            icon={<AlertTriangle className="h-5 w-5 text-rose-400" />}
            onClick={() => {
              const today = new Date()
              const nextWeek = new Date(today)
              nextWeek.setDate(today.getDate() + 7)
              setPostedAfter(today.toISOString().split('T')[0])
              setPostedBefore(nextWeek.toISOString().split('T')[0])
              // User needs to click search button
            }}
            loading={loading}
          />
          
          <StatCard 
            label="Small Business Set-Asides" 
            value={summaryStats.smallBusinessCount.toLocaleString()}
            icon={<Target className="h-5 w-5 text-amber-400" />}
            onClick={() => {
              setSetAside('SBA')
              // User needs to click search button
            }}
            loading={loading}
          />
          
          <StatCard 
            label="Saved Opportunities" 
            value={summaryStats.savedCount.toLocaleString()}
            icon={<BookmarkCheck className="h-5 w-5 text-purple-400" />}
            onClick={() => router.push('/saved')}
            loading={loading}
          />
        </div>

        {/* Enhanced Search Filters */}
        <div ref={filtersRef} className="mb-6 rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900/50 to-slate-950/30 p-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20">
                <SlidersHorizontal className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Advanced Search Filters</h2>
                <p className="text-sm text-slate-400">Set your filters, then click "Search Opportunities"</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Pill tone="warning">
                <AlertCircle className="h-4 w-4" />
                Max range: 364 days
              </Pill>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                icon={showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              >
                {showFilters ? 'Hide' : 'Show'} Filters
              </Button>
            </div>
          </div>

          {showFilters && (
            <div className="space-y-6">
              {/* Main Search Row - UPDATED with Set-Aside and State dropdowns */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Field label="Keywords" required>
                  <div onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      runSearch(false)
                    }
                  }} className="relative">
                    <Input
                      value={keywords}
                      onChange={setKeywords}
                      placeholder="Search titles, descriptions, or any text"
                      icon={<Search className="h-4 w-4" />}
                    />
                    {/* PERFORMANCE FIX: Show debounce indicator */}
                    {keywords !== debouncedKeywords && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                      </div>
                    )}
                  </div>
                </Field>
                
                {/* Set-Aside Dropdown - NEW */}
                <Field label="Set-Aside">
                  <select
                    value={setAside}
                    onChange={(e) => setSetAside(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
                  >
                    {SET_ASIDE_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </Field>
                
                {/* State/Territory Dropdown - NEW */}
                <Field label="State/Territory">
                  <select
                    value={stateOfPerformance}
                    onChange={(e) => setStateOfPerformance(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
                  >
                    {US_STATES.map(state => (
                      <option key={state.value} value={state.value}>{state.label}</option>
                    ))}
                  </select>
                </Field>
              </div>

              {/* Category Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Field label="NAICS Code">
                  <Input
                    value={naics}
                    onChange={setNaics}
                    placeholder="e.g., 541511"
                    icon={<Tag className="h-4 w-4" />}
                  />
                </Field>
                
                <Field label="Agency/Department">
                  <Input
                    value={agency}
                    onChange={setAgency}
                    placeholder="e.g., Department of Defense"
                    icon={<Building2 className="h-4 w-4" />}
                  />
                </Field>
                
                {/* Procurement Type Dropdown */}
                <Field label="Procurement Type" required>
                  <select
                    value={procurementType}
                    onChange={(e) => setProcurementType(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors"
                  >
                    <option value="a">Award Notice</option>
                    <option value="p">Pre-solicitation</option>
                    <option value="o">Solicitation</option>
                    <option value="r">Sources Sought</option>
                    <option value="s">Special Notice</option>
                    <option value="u">Justification (J&amp;A)</option>
                    <option value="k">Combined Synopsis/Solicitation</option>
                    <option value="g">Sale of Surplus Property</option>
                    <option value="i">Intent to Bundle (DoD)</option>
                  </select>
                </Field>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Posted After">
                  <Input
                    type="date"
                    value={postedAfter}
                    onChange={setPostedAfter}
                    placeholder="Select start date"
                    icon={<Calendar className="h-4 w-4" />}
                  />
                </Field>
                
                <Field label="Posted Before">
                  <Input
                    type="date"
                    value={postedBefore}
                    onChange={setPostedBefore}
                    placeholder="Select end date"
                    icon={<Calendar className="h-4 w-4" />}
                  />
                </Field>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-center pt-4 border-t border-slate-800">
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="primary"
                    onClick={() => runSearch(false)}
                    loading={loading}
                    icon={<Search className="h-5 w-5" />}
                  >
                    {loading ? 'Searching...' : 'Search Opportunities'}
                  </Button>
                  
                  <Button
                    variant="secondary"
                    onClick={resetAll}
                    disabled={loading}
                    icon={<RefreshCw className="h-5 w-5" />}
                  >
                    Reset All
                  </Button>
                  
                  <Button
                    variant="ghost"
                    onClick={() => {
                      if (!requireAccess("Save Searches")) return;
                      setShowSavedSearchModal(true);
                    }}
                    icon={<Save className="h-5 w-5" />}
                  >
                    Save Search
                  </Button>
                </div>
                
                <div className="flex gap-3">
                  <Button
                    variant="success"
                    onClick={exportCsv}
                    disabled={!filteredResults.length || loading}
                    icon={<Download className="h-5 w-5" />}
                  >
                    Export CSV
                  </Button>
                  
                  <Button
                    variant="success"
                    onClick={exportJson}
                    disabled={!filteredResults.length || loading}
                    icon={<Download className="h-5 w-5" />}
                  >
                    Export JSON
                  </Button>
                </div>
              </div>
              
              {error && (
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-amber-200 font-semibold mb-1">Search Limitation</div>
                      <div className="text-amber-300 text-sm mb-3">{error}</div>
                      <div className="flex gap-3">
                        {error.includes('364 days') && (
                          <button
                            onClick={autoFixDateRange}
                            className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-semibold text-sm transition-colors inline-flex items-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Auto-adjust to 364 days
                          </button>
                        )}
                        <button
                          onClick={() => setError(null)}
                          className="px-4 py-2 rounded-lg border border-amber-500/30 hover:bg-amber-500/10 text-amber-300 font-semibold text-sm transition-colors"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Results Section */}
        <div ref={resultsRef} className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900/50 to-slate-950/30 p-6 shadow-2xl">
          {/* Results Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20">
                <Database className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Search Results</h2>
                <div className="flex items-center gap-3 mt-1">
                  {data ? (
                    <span className="text-slate-400">
                      {filteredResults.length} {filteredResults.length === 1 ? 'result' : 'results'}
                      {totalRecords > 0 && filteredResults.length < totalRecords && (
                        <span className="text-slate-500">
                          {' '}of {totalRecords.toLocaleString()}
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-slate-400">
                      Set filters and click "Search Opportunities" to see results
                    </span>
                  )}
                  {loading && (
                    <div className="flex items-center gap-1 text-sm text-slate-500">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Updating...
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Results Controls - Only show when we have results */}
            {data && (
              <div className="flex flex-wrap items-center gap-3">
                {/* Sort Controls */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-400">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="posted">Posted Date</option>
                    <option value="deadline">Deadline</option>
                    <option value="relevance">Relevance</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
                  >
                    {sortOrder === 'asc' ? (
                      <SortAsc className="h-4 w-4 text-slate-400" />
                    ) : (
                      <SortDesc className="h-4 w-4 text-slate-400" />
                    )}
                  </button>
                </div>
                
                {/* View Toggle */}
                <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-900 border border-slate-700">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded transition-colors ${
                      viewMode === 'list' 
                        ? 'bg-slate-800 text-white' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <List className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded transition-colors ${
                      viewMode === 'grid' 
                        ? 'bg-slate-800 text-white' 
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Grid className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Active Filters - Only show after search */}
          {data && (agency || setAside || naics || stateOfPerformance) && (
            <div className="mb-6 p-4 rounded-2xl border border-slate-800 bg-slate-900/20">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-300">Active Filters</span>
                  <span className="text-xs text-slate-500 ml-2">
                    (Update filters and click "Search" to refresh)
                  </span>
                </div>
                <button
                  onClick={clearAllClientFilters}
                  className="text-sm text-slate-400 hover:text-white transition-colors flex items-center gap-1"
                >
                  <X className="h-4 w-4" />
                  Clear All
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {agency && (
                  <Pill 
                    tone="info" 
                    onRemove={() => handleFilterRemoveAndSearch('agency')}
                  >
                    Agency: {agency}
                  </Pill>
                )}
                {setAside && (
                  <Pill 
                    tone="info" 
                    onRemove={() => handleFilterRemoveAndSearch('setAside')}
                  >
                    Set-Aside: {SET_ASIDE_LABEL_BY_CODE[setAside] || setAside}
                  </Pill>
                )}
                {naics && (
                  <Pill 
                    tone="info" 
                    onRemove={() => handleFilterRemoveAndSearch('naics')}
                  >
                    NAICS: {naics}
                  </Pill>
                )}
                {stateOfPerformance && (
                  <Pill 
                    tone="info" 
                    onRemove={() => handleFilterRemoveAndSearch('state')}
                  >
                    State: {US_STATES.find(s => s.value === stateOfPerformance)?.label || stateOfPerformance}
                  </Pill>
                )}
              </div>
              <div className="mt-2 text-xs text-slate-500">
                After removing filters, click "Search Opportunities" to update results
              </div>
            </div>
          )}

          {/* Loading States */}
          {loading && !loadingMore && (
            <div className="py-12 text-center">
              <div className="inline-flex flex-col items-center gap-4">
                <div className="h-12 w-12 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
                <div className="text-slate-400">Searching SAM.gov opportunities...</div>
              </div>
            </div>
          )}

          {/* Results */}
          {!loading && filteredResults.length > 0 && (
            <>
              <div className="space-y-4">
                {filteredResults.map((opp, idx) => (
                  <ResultCard
                    key={`${opp.noticeId || 'no-id'}-${idx}`}
                    opportunity={opp}
                    index={idx}
                    isExpanded={!!expanded[opp.noticeId || String(idx)]}
                    toggleExpanded={(id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }))}
                    isSaved={!!saved[opp.noticeId || String(idx)]}
                    toggleSaved={(id) => toggleSaved(id)}
                    copyText={copyText}
                    copiedId={copiedId}
                  />
                ))}
              </div>

              {/* Load More */}
              {hasMoreResults && (
                <div className="mt-8 pt-6 border-t border-slate-800">
                  <div className="flex flex-col items-center gap-4">
                    <div className="text-sm text-slate-400">
                      Showing {filteredResults.length} of {totalRecords.toLocaleString()} opportunities
                    </div>
                    <Button
                      variant="primary"
                      onClick={loadMoreResults}
                      loading={loadingMore}
                      icon={<Plus className="h-5 w-5" />}
                    >
                      {loadingMore ? 'Loading...' : `Load ${LOAD_MORE_INCREMENT} More`}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Empty State */}
          {!loading && !filteredResults.length && data && (
            <div className="py-12 text-center">
              <div className="inline-flex flex-col items-center gap-4 max-w-md mx-auto">
                <div className="h-16 w-16 rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/50 to-slate-950/30 flex items-center justify-center">
                  <Search className="h-8 w-8 text-slate-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">No matching opportunities</h3>
                  <p className="text-slate-400">
                    Try adjusting your search filters or using different keywords.
                  </p>
                </div>
                <Button
                  variant="secondary"
                  onClick={resetAll}
                  icon={<RefreshCw className="h-5 w-5" />}
                >
                  Reset Filters
                </Button>
              </div>
            </div>
          )}
        </div>

              {/* ==================== Create Alert Modal ==================== */}
              <SearchAlertModal
                isOpen={showAlertBuilder}
                onClose={() => setShowAlertBuilder(false)}
                currentSearch={{
                  keywords: keywords.trim(),
                  naics: naics.trim(),
                  agency: agency.trim(),
                  setAside: setAside.trim(),
                  stateOfPerformance: stateOfPerformance.trim(),
                  procurementType: procurementType || 'o',
                  postedAfter: postedAfter.trim(),
                  postedBefore: postedBefore.trim(),
                }}
              />
              {/* ==================== Save Search Modal ==================== */}
              <SavedSearchModal
                isOpen={showSavedSearchModal}
                onClose={() => setShowSavedSearchModal(false)}
                currentFilters={{
                  keywords: keywords.trim(),
                  naics: naics.trim(),
                  agency: agency.trim(),
                  setAside: setAside.trim(),
                  stateOfPerformance: stateOfPerformance.trim(),
                  procurementType: procurementType || 'o',
                  postedAfter: postedAfter.trim(),
                  postedBefore: postedBefore.trim(),
                }}
                onSave={async (result) => {
                  console.log('Search saved:', result)
                  setShowSavedSearchModal(false)
                }}
              />
      

{/* Reminder Modal - Shows at 10 minutes */}
        {showReminderModal && !showLockoutModal && (
          <AccessControlModal
            isOpen={showReminderModal}
            onClose={() => setShowReminderModal(false)}
            featureName="Continue Browsing"
            onAccessGranted={() => {
              setShowReminderModal(false)
            }}
            initialMode="signup"
          />
        )}

        {/* ✅ NEW - Only show for unauthenticated users */}
        {showLockoutModal && status === 'unauthenticated' && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="max-w-md w-full mx-4">
              <div className="rounded-2xl border border-red-500/30 bg-gradient-to-br from-slate-900 to-slate-950 p-8 shadow-2xl">
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center">
                    <Lock className="h-8 w-8 text-red-400" />
                  </div>
                  
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Browsing Time Expired</h2>
                    <p className="text-slate-400">
                      Your 15-minute free browsing session has ended. Sign up or sign in to continue accessing federal contracting opportunities.
                    </p>
                  </div>

                  <div className="w-full space-y-3 mt-4">
                    <button
                      onClick={() => {
                        setShowLockoutModal(false)
                        signIn()
                      }}
                      className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold hover:from-emerald-600 hover:to-cyan-600 transition-all"
                    >
                      Sign Up Now
                    </button>
                    
                    <button
                      onClick={() => {
                        setShowLockoutModal(false)
                        signIn()
                      }}
                      className="w-full px-6 py-3 rounded-xl border border-slate-700 bg-slate-800/50 text-white font-semibold hover:bg-slate-800 transition-all"
                    >
                      Sign In
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

{/* Access Control Modal */}
        {showAccessModal && (
          <AccessControlModal
            isOpen={showAccessModal}
            onClose={() => {
              setShowAccessModal(false)
              pendingActionRef.current = null
            }}
            featureName={blockedFeature}
            onAccessGranted={() => {
              setShowAccessModal(false)
              // Execute pending action if there was one
              if (pendingActionRef.current) {
                setTimeout(() => {
                  pendingActionRef.current?.()
                  pendingActionRef.current = null
                }, 500)
              }
            }}
          />
        )}
      </div>
    </main>
  )
}


// Suspense wrapper for useSearchParams
export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  )
}