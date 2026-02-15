//app/search/page.tsx
'use client'

import React, { useMemo, useState, useEffect, useRef, useCallback, Suspense } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import WelcomeBanner from '@/components/WelcomeBanner'
import { useSession, signIn } from 'next-auth/react'
import SavedSearchActions from '@/components/SavedSearchActions'
import UnifiedSaveSearchModal from '@/components/UnifiedSaveSearchModal'
import ProfileCompletionReminder from '@/components/ProfileCompletionReminder'
import AIAnalytics from '@/components/AIAnalytics'
import InlineDatePicker from '@/components/InlineDatePicker'
import SaveSearchSuccessModal from '@/components/SaveSearchSuccessModal'
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
  StopCircle,
  Settings,
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
          current_period_end: data.current_period_end || null,
          cancel_at_period_end: data.cancel_at_period_end || false,
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
    current_period_end: planData?.current_period_end || (session?.user as any)?.current_period_end || null,
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

// Utility: Format Date to YYYY-MM-DD (for HTML date input)
function formatDateToInput(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Utility: Get today's date
function getToday(): string {
  return formatDateToInput(new Date())
}

// Utility: Get date one month from now
function getOneMonthFromNow(): string {
  const date = new Date()
  date.setMonth(date.getMonth() + 1)
  return formatDateToInput(date)
}

// Utility: Get date six months ago
function getSixMonthsAgo(): string {
  const date = new Date()
  date.setMonth(date.getMonth() - 6)
  return formatDateToInput(date)
}

// --- ACCESS CONTROL HOOK (Fixed) ---
function useBrowsingSession() {
  const { data: session, status } = useSession()
  const { hasActiveSubscription, tier, status: plan_status, loading: planLoading } = useSubscription()
  const [browsingStartTime, setBrowsingStartTime] = useState<number | null>(null)
  const [showReminderModal, setShowReminderModal] = useState(false)
  const [showLockoutModal, setShowLockoutModal] = useState(false)
  
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
        plan_status,
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
        console.log('✅ Access granted: Active subscription', { tier, status: plan_status })
        return true
      }
      
      console.log('❌ Access denied: No valid subscription')
      return false
    }
    
    console.log('❌ Access denied: Not authenticated')
    return false
  }, [status, session, hasActiveSubscription, tier, plan_status, planLoading])

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
    isAuthenticated: status === 'authenticated',
    tier,
    plan_status,
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
  // SAM.gov often returns both a set-aside *code* and a human-readable description.
  // Different endpoints / export formats may use different field names, so we support both.
  typeOfSetAside?: string
  typeOfSetAsideDescription?: string
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
  status?: string          // opportunity status (active/inactive/archived/cancelled)
  organizationName?: string // agency / org name
  organizationId?: string   // agency / org identifier
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
  // Territories and Federal District
  { value: 'AS', label: 'American Samoa' },
  { value: 'DC', label: 'District of Columbia' },
  { value: 'FM', label: 'Federated States of Micronesia' },
  { value: 'GU', label: 'Guam' },
  { value: 'MH', label: 'Marshall Islands' },
  { value: 'MP', label: 'Northern Mariana Islands' },
  { value: 'PW', label: 'Palau' },
  { value: 'PR', label: 'Puerto Rico' },
  { value: 'VI', label: 'U.S. Virgin Islands' },
  { value: 'UM', label: 'U.S. Minor Outlying Islands' }
]

// Set-Aside options
const SET_ASIDE_OPTIONS = [
  { value: '', label: 'Any Set-Aside' },
  { value: 'SBA', label: 'Total Small Business Set-Aside' },
  { value: 'SBP', label: 'Partial Small Business Set-Aside' },
  { value: '8A', label: '8(a) Set-Aside' },
  { value: '8AN', label: '8(a) Sole Source' },
  { value: 'HZC', label: 'HUBZone Set-Aside' },
  { value: 'SDV', label: 'VETERAN-OWNED' },
  { value: 'SDVOSBC', label: 'VETERAN-OWNED Small Business Set Aside' },
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
  'SDV': 'VETERAN-OWNED',
  'SDVOSBC': 'VETERAN-OWNED Small Business Set Aside',
  'WOSB': 'Woman-Owned Small Business',
  'EDWOSB': 'Economically Disadvantaged WOSB',
  'SDB': 'Small Disadvantaged Business',
  'NONE': 'No Set-Aside',
  // Common variations
  'HUBZone': 'HUBZone Set-Aside',
  'SDVOSB': 'VETERAN-OWNED'
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
    className={`group relative p-4 rounded-lg border-2 border-gray-300 bg-white hover:border-gray-400 hover:shadow-md transition-all duration-300 cursor-pointer ${
      onClick ? 'hover:scale-[1.02] active:scale-[0.98]' : ''
    }`}
  >
    {trend && (
      <div className={`absolute -top-2 -right-2 px-2 py-1 rounded-full text-xs font-bold ${
        trend > 0 
          ? 'bg-green-100 text-green-900 border-2 border-green-700' 
          : 'bg-red-100 text-red-900 border-2 border-red-600'
      }`}>
        {trend > 0 ? '+' : ''}{trend}%
      </div>
    )}
    <div className="flex items-center gap-3">
      <div className="p-3 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 shadow-md">
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-xs text-gray-600 font-bold">{label}</div>
        {loading ? (
          <div className="h-8 w-20 bg-gray-100 rounded-lg animate-pulse mt-1" />
        ) : (
          <div className="text-2xl font-bold text-gray-900 mt-1">{value}</div>
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
    default: 'bg-white text-gray-900 border border-gray-300 hover:bg-gray-50',
    primary: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    success: 'bg-emerald-500/20 text-white border-emerald-500/30',
    warning: 'bg-amber-500/20 text-white border-amber-500/30',
    danger: 'bg-rose-500/20 text-white border-rose-500/30',
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
  icon,
  className = ''
}: { 
  children: React.ReactNode, 
  onClick?: () => void, 
  disabled?: boolean,
  loading?: boolean,
  variant?: 'primary' | 'secondary' | 'tertiary' | 'ghost' | 'danger' | 'success',
  size?: 'sm' | 'md' | 'lg',
  fullWidth?: boolean,
  icon?: React.ReactNode,
  className?: string
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-bold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 shadow-sm'
  
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 border-2 border-blue-700',
    secondary: 'bg-white text-gray-900 border-2 border-gray-400 hover:bg-gray-50 hover:border-gray-500',
    tertiary: 'bg-orange-500 text-white hover:bg-orange-600 border-2 border-orange-600',
    ghost: 'text-gray-700 hover:text-gray-900 hover:bg-gray-100',
    danger: 'bg-red-600 text-white border-2 border-red-700 hover:bg-red-700',
    success: 'bg-green-700 text-white border-2 border-green-800 hover:bg-green-800',
  }
  
  const sizes = {
    sm: 'px-4 py-2.5 text-base gap-2',
    md: 'px-6 py-3.5 text-lg gap-2.5',
    lg: 'px-8 py-4 text-xl gap-3',
  }
  
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
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
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
        {icon}
      </div>
    )}
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full px-4 py-3 text-lg font-semibold rounded-lg bg-white border-2 ${
        error ? 'border-red-600' : 'border-gray-400'
      } text-gray-900 placeholder-gray-500 hover:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-600 transition-colors ${
        icon ? 'pl-10' : ''
      }`}
    />
    {error && (
      <p className="mt-1 text-sm font-semibold text-red-600">{error}</p>
    )}
  </div>
)

const Field = ({ 
  label, 
  children, 
  tooltip,
  required = false 
}: { 
  label: React.ReactNode, 
  children: React.ReactNode, 
  tooltip?: string,
  required?: boolean 
}) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <label className="text-base font-medium text-orange-400 flex items-center gap-1">
        {label}
        {required && <span className="text-white">*</span>}
      </label>
      {tooltip && (
        <button type="button" className="text-gray-600 hover:text-gray-700">
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
    neutral: 'bg-white text-gray-900 border-2 border-gray-400 hover:bg-gray-50',
    info: 'bg-blue-100 text-blue-900 border-2 border-blue-500',
    success: 'bg-emerald-100 text-emerald-900 border-2 border-emerald-600',
    warning: 'bg-amber-100 text-amber-900 border-2 border-amber-600',
    danger: 'bg-rose-100 text-rose-900 border-2 border-rose-600',
  }
  
  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-lg font-bold ${tones[tone]}`}>
      {children}
      {onRemove && (
        <button
          onClick={onRemove}
          className="hover:opacity-70 transition-opacity ml-1 p-1 hover:bg-black/10 rounded-full"
          aria-label="Remove filter"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  )
}

// --- COMPACT OPPORTUNITY CARD FOR GRID VIEW ---
interface OpportunityCardProps {
  opportunity: Opp
  index: number
  isSaved: boolean
  toggleSaved: (id: string) => void
  copyText: (text: string) => void
  copiedId: string | null
}

const OpportunityCard: React.FC<OpportunityCardProps> = ({
  opportunity,
  index,
  isSaved,
  toggleSaved,
  copyText,
  copiedId,
}) => {
  const id = opportunity.noticeId || String(index)
  const title = opportunity.title || 'Untitled Opportunity'
  const department = opportunity.department || opportunity.fullParentPathName || 'Unknown Department'
  const postedDate = opportunity.postedDate ? formatDate(opportunity.postedDate) : 'N/A'
  const responseDeadline = opportunity.responseDeadLine ? formatDate(opportunity.responseDeadLine) : 'N/A'
  const type = opportunity.type || 'N/A'
  const setAsideLabel = opportunity.typeOfSetAsideDescription || 
                        (opportunity.typeOfSetAside && SET_ASIDE_LABEL_BY_CODE[opportunity.typeOfSetAside]) ||
                        (opportunity.setAside && SET_ASIDE_LABEL_BY_CODE[opportunity.setAside]) ||
                        opportunity.setAside ||
                        'Not specified'
  const naics = opportunity.naicsCode || 'N/A'
  
  const daysUntilDeadline = opportunity.responseDeadLine 
    ? Math.ceil((new Date(opportunity.responseDeadLine).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null
  
  return (
    <div className="group relative bg-white rounded-2xl border-2 border-gray-200 hover:border-blue-500 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col h-full">
      {/* Header with Badge and Bookmark */}
      <div className="p-5 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-sm font-semibold mb-3">
              <FileText className="h-4 w-4" />
              {type}
            </div>
            {opportunity.uiLink ? (
              <a
                href={opportunity.uiLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg font-bold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer block mb-2 line-clamp-2 group/title"
              >
                {title}
                <ExternalLink className="h-4 w-4 inline ml-1 opacity-0 group-hover/title:opacity-100 transition-opacity" />
              </a>
            ) : (
              <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                {title}
              </h3>
            )}
          </div>
          <button
            onClick={() => toggleSaved(id)}
            className="flex-shrink-0 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label={isSaved ? 'Remove from saved' : 'Save opportunity'}
          >
            {isSaved ? (
              <BookmarkCheck className="h-5 w-5 text-blue-600" />
            ) : (
              <Bookmark className="h-5 w-5 text-gray-400" />
            )}
          </button>
        </div>
        
        <div className="flex items-center gap-2 text-base text-gray-700 mb-2">
          <Building2 className="h-4 w-4 flex-shrink-0 text-gray-400" />
          <span className="truncate">{department}</span>
        </div>
        
        {daysUntilDeadline !== null && (
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-extrabold ${
            daysUntilDeadline < 0
              ? 'bg-gray-200 text-gray-600'
              : daysUntilDeadline <= 3
                ? 'bg-red-600 text-white'
                : daysUntilDeadline <= 7
                  ? 'bg-red-100 text-red-700'
                  : daysUntilDeadline <= 14
                    ? 'bg-orange-100 text-orange-700'
                    : daysUntilDeadline <= 30
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-green-100 text-green-700'
          }`}>
            <Clock className="h-3.5 w-3.5" />
            {daysUntilDeadline < 0
              ? 'Expired'
              : `${daysUntilDeadline} day${daysUntilDeadline !== 1 ? 's' : ''} left`
            }
          </div>
        )}
      </div>

      {/* Details */}
      <div className="p-5 space-y-3 flex-1 overflow-y-auto">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-600 flex-shrink-0" />
          <span className="text-sm font-bold text-gray-500 uppercase tracking-wide">Posted:</span>
          <span className="text-base font-extrabold text-gray-900">{postedDate}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-red-600 flex-shrink-0" />
          <span className="text-sm font-bold text-gray-500 uppercase tracking-wide">Deadline:</span>
          <span className="text-base font-extrabold text-red-700">{responseDeadline}</span>
        </div>
        
        {setAsideLabel !== 'Not specified' && (
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-emerald-500 flex-shrink-0" />
            <span className="text-base font-medium text-emerald-700 line-clamp-1">{setAsideLabel}</span>
          </div>
        )}
        
        <div className="flex items-center gap-2 text-base text-gray-600">
          <Hash className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <span className="text-sm text-gray-500">NAICS:</span>
          <span className="font-mono font-medium">{naics}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="p-5 pt-0 flex-shrink-0">
        {opportunity.uiLink && (
          <a
            href={opportunity.uiLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors text-base"
          >
            View on SAM.gov
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>
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
  
  // Set-Aside display - FIXED: Use correct variable name
  const setAsideLabel = opportunity.typeOfSetAsideDescription || 
                      (opportunity.typeOfSetAside && SET_ASIDE_LABEL_BY_CODE[opportunity.typeOfSetAside]) ||
                      (opportunity.setAside && SET_ASIDE_LABEL_BY_CODE[opportunity.setAside]) ||
                      opportunity.setAside ||
                      'Not specified'
 
  // Place of performance
  const city = opportunity.placeOfPerformance?.city?.name || ''
  const state = opportunity.placeOfPerformance?.state?.code || ''
  const placeOfPerformance = city && state ? `${city}, ${state}` : (city || state || 'Not specified')
  
  // Department/Agency
  const department = opportunity.department || opportunity.fullParentPathName || 'Not specified'
  
  return (
    <div 
      key={id}
      className="group relative rounded-2xl border border-gray-200 bg-white p-6 transition-all duration-300 hover:border-gray-400 hover: hover:bg-white"
    >
      {/* Quick Actions */}
      <div className="absolute right-4 top-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => copyText(id)}
          className="p-1.5 rounded-lg bg-white/6 hover:bg-white/7 transition-colors"
          title="Copy Notice ID"
          aria-label="Copy Notice ID"
        >
          {copiedId === id ? (
            <Check className="h-4 w-4 text-white" />
          ) : (
            <Copy className="h-4 w-4 text-gray-600" />
          )}
        </button>
        <button
          onClick={() => toggleSaved(id)}
          className="p-1.5 rounded-lg bg-white/6 hover:bg-white/7 transition-colors"
          title={isSaved ? 'Remove from saved' : 'Save opportunity'}
          aria-label={isSaved ? 'Remove from saved' : 'Save opportunity'}
        >
          {isSaved ? (
            <BookmarkCheck className="h-4 w-4 text-white" />
          ) : (
            <Bookmark className="h-4 w-4 text-gray-600" />
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
                className="text-lg font-bold text-gray-900 hover:text-emerald-300 transition-colors cursor-pointer flex items-center gap-2 group/title"
              >
                {opportunity.title || 'Untitled Opportunity'}
                <ExternalLink className="h-4 w-4 opacity-0 group-hover/title:opacity-100 transition-opacity" />
              </a>
            ) : (
              <h3 className="text-lg font-bold text-gray-900">
                {opportunity.title || 'Untitled Opportunity'}
              </h3>
            )}
            {daysUntilDeadline !== null && (
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold ${
                daysUntilDeadline < 0
                  ? 'bg-gray-200 text-gray-600'
                  : daysUntilDeadline <= 3
                    ? 'bg-red-600 text-white'
                    : daysUntilDeadline <= 7
                      ? 'bg-red-100 text-red-700'
                      : daysUntilDeadline <= 14
                        ? 'bg-orange-100 text-orange-700'
                        : daysUntilDeadline <= 30
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-green-100 text-green-700'
              }`}>
                <Clock className="h-3 w-3" />
                {daysUntilDeadline < 0
                  ? 'Expired'
                  : `${daysUntilDeadline} day${daysUntilDeadline !== 1 ? 's' : ''} left`
                }
              </div>
            )}
          </div>
          
          {/* Key Information Grid - UPDATED with important criteria */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            {/* Solicitation Number */}
            {opportunity.solicitationNumber && (
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-sm font-bold text-orange-500">Solicitation #</div>
                  <div className="text-sm text-gray-700 font-medium">{opportunity.solicitationNumber}</div>
                </div>
              </div>
            )}
            
            {/* Department/Agency */}
            <div className="flex items-start gap-2">
              <Building2 className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-sm font-bold text-orange-500">Department/Agency</div>
                <div className="text-sm text-gray-700 font-medium break-words line-clamp-2" title={department}>
                  {department}
                </div>
              </div>
            </div>
            
            {/* Set-Aside */}
            <div className="flex items-start gap-2">
              <Target className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-sm font-bold text-orange-500">Set-Aside</div>
                <div className="text-sm text-gray-700 font-medium break-words line-clamp-2" title={setAsideLabel}>
                  {setAsideLabel}
                </div>
              </div>
            </div>
            
            {/* Place of Performance (City/State) - NEW */}
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-sm font-bold text-orange-500">Place of Performance</div>
                <div className="text-sm text-gray-700 font-medium break-words">{placeOfPerformance}</div>
              </div>
            </div>
            
            {/* Published Date */}
            <div className="flex items-start gap-2">
              <Calendar className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-xs font-extrabold text-blue-700 uppercase tracking-wide">Published</div>
                <div className="text-base font-extrabold text-gray-900">{postedDate}</div>
              </div>
            </div>
            
            {/* Response Deadline */}
            {opportunity.responseDeadLine && (
              <div className="flex items-start gap-2">
                <Clock className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-xs font-extrabold text-red-700 uppercase tracking-wide">Response Deadline</div>
                  <div className="text-base font-extrabold text-red-800">{deadlineDate}</div>
                </div>
              </div>
            )}
            
            {/* NAICS Code */}
            {opportunity.naicsCode && (
              <div className="flex items-start gap-2">
                <Tag className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-sm font-bold text-orange-500">NAICS Code</div>
                  <div className="text-sm text-gray-700 font-medium">{opportunity.naicsCode}</div>
                </div>
              </div>
            )}
            
            {/* Type */}
            {opportunity.type && (
              <div className="flex items-start gap-2">
                <Layers className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-sm font-bold text-orange-500">Type</div>
                  <div className="text-sm text-gray-700 font-medium">{opportunity.type}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* REMOVED Active/Archived tags */}
      
      {/* Collapsible Details */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
          {/* Description */}
          {opportunity.description && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Description</h4>
              <p className="text-base text-gray-900 font-medium line-clamp-6">
                {opportunity.description}
              </p>
            </div>
          )}
          
          {/* Contact & Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Point of Contact */}
            {opportunity.pointOfContact && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Point of Contact</h4>
                <div className="text-base text-gray-900 font-medium space-y-2">
                  {opportunity.pointOfContact.fullname && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-600" />
                      <span className="font-medium">{opportunity.pointOfContact.fullname}</span>
                    </div>
                  )}
                  {opportunity.pointOfContact.title && (
                    <div className="text-gray-600">{opportunity.pointOfContact.title}</div>
                  )}
                  {opportunity.pointOfContact.email && (
                    <a 
                      href={`mailto:${opportunity.pointOfContact.email}`}
                      className="flex items-center gap-2 text-white hover:text-emerald-300 transition-colors"
                    >
                      <MessageSquare className="h-4 w-4" />
                      {opportunity.pointOfContact.email}
                    </a>
                  )}
                  {opportunity.pointOfContact.phone && (
                    <a 
                      href={`tel:${opportunity.pointOfContact.phone.replace(/\D/g, '')}`}
                      className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
                    >
                      <Phone className="h-4 w-4 text-gray-600" />
                      {opportunity.pointOfContact.phone}
                    </a>
                  )}
                </div>
              </div>
            )}
            
            {/* Links */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Links & Resources</h4>
              <div className="space-y-2">
                {/* SAM.gov UI Link */}
                {opportunity.uiLink && (
                  <a
                    href={opportunity.uiLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/6 hover:bg-white/7 border border-gray-300 hover:border-gray-400 text-sm text-white hover:text-emerald-300 transition-colors w-full"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <div className="flex-1">
                      <div className="font-medium">View on SAM.gov</div>
                      <div className="text-xs text-gray-600 truncate">{opportunity.uiLink}</div>
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
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/6 hover:bg-white/7 border border-gray-300 hover:border-gray-400 text-base text-gray-900 font-medium hover:text-gray-700 transition-colors"
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
            <div className="pt-4 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Additional Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {opportunity.baseType && (
                  <div>
                    <div className="text-xs text-gray-600">Original Type</div>
                    <div className="text-sm text-gray-700">{opportunity.baseType}</div>
                  </div>
                )}
                {opportunity.archiveType && (
                  <div>
                    <div className="text-xs text-gray-600">Archive Type</div>
                    <div className="text-sm text-gray-700">{opportunity.archiveType}</div>
                  </div>
                )}
                {opportunity.award?.date && (
                  <div>
                    <div className="text-xs text-gray-600">Award Date</div>
                    <div className="text-sm text-gray-700">{formatDate(opportunity.award.date)}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Footer - UPDATED */}
      <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => toggleExpanded(id)}
            className="text-base text-gray-900 font-medium hover:text-gray-900 transition-colors flex items-center gap-1"
            aria-label={isExpanded ? 'Show less details' : 'Show more details'}
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
            <div className="text-base text-gray-900 font-medium flex items-center gap-1">
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
            aria-label="Share opportunity"
          >
            Share
          </Button>
          {opportunity.uiLink && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => window.open(opportunity.uiLink, '_blank')}
              icon={<ExternalLink className="h-4 w-4" />}
              aria-label="View on SAM.gov"
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

/**
 * Retry a fetch request with exponential backoff for SAM.gov reliability
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3,
  initialDelay = 2000
): Promise<Response> {
  let last_error: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    // Bail out immediately if the request was intentionally cancelled
    if (options.signal?.aborted) {
      throw new DOMException('Search stopped by user', 'AbortError');
    }

    try {
      const response = await fetch(url, options);
      
      // If response is OK or it's a client error (4xx), return immediately
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        if (attempt > 0) {
          console.log(`✅ Request succeeded after ${attempt} ${attempt === 1 ? 'retry' : 'retries'}`);
        }
        return response;
      }
      
      // For 5xx errors (server errors), we'll retry
      if (response.status >= 500 && attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt);
        console.log(`⚠️  Server error ${response.status}, retrying in ${delay/1000}s... (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      return response;
    } catch (error) {
      last_error = error as Error;

      // Don't retry aborted requests — user cancelled intentionally
      if (last_error.name === 'AbortError' || options.signal?.aborted) {
        throw last_error;
      }
      
      if (attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt);
        console.log(`❌ Request failed: ${last_error.message}, retrying in ${delay/1000}s... (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // Only log as error for genuine failures, not user cancellations
  console.error(`🚫 Max retries (${maxRetries}) exceeded. Last error:`, last_error);
  throw last_error || new Error('Max retries exceeded');
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

// --- Custom Hooks ---

// Search History Hook
const useSearchHistory = () => {
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const saveSearchToHistory = useCallback((searchParams: string) => {
    try {
      const updated = [searchParams, ...recentSearches.filter(s => s !== searchParams)].slice(0, 10)
      setRecentSearches(updated)
      localStorage.setItem('govcon_recent_searches', JSON.stringify(updated))
    } catch (error) {
      console.error('Failed to save search history:', error)
    }
  }, [recentSearches]);

  return { recentSearches, saveSearchToHistory, setRecentSearches };
};

// Opportunity Management Hook
const useOpportunityManagement = () => {
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  const toggleSaved = useCallback((id: string) => {
    setSaved((p) => {
      const newSaved = { ...p, [id]: !p[id] }
      try {
        localStorage.setItem('govcon_saved_opportunities', JSON.stringify(newSaved))
      } catch (error) {
        console.error('Failed to save opportunities:', error)
      }
      return newSaved
    });
  }, []);

  return { saved, toggleSaved, setSaved };
};

// Search State Persistence Hook
const useSearchStatePersistence = () => {
  const saveSearchState = useCallback((state: any) => {
    try {
      sessionStorage.setItem('searchState', JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save search state:', error);
    }
  }, []);

  const restoreSearchState = useCallback(() => {
    try {
      const saved = sessionStorage.getItem('searchState');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to restore search state:', error);
    }
    return null;
  }, []);

  return { saveSearchState, restoreSearchState };
};

// Error Boundary Component
class SearchErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Search Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center p-8">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Search Failed to Load</h2>
            <p className="text-gray-600 mb-4">Please refresh the page and try again.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Dismissable warning banner shown when no Quick Search results are loaded yet
function WarnBanner() {
  const [dismissed, setDismissed] = React.useState(false)
  if (dismissed) return null
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-white font-bold text-sm shadow-lg"
      style={{ background: 'linear-gradient(90deg, #92400e 0%, #78350f 100%)' }}>
      <AlertTriangle className="h-5 w-5 flex-shrink-0 text-yellow-300" />
      <span className="flex-1">
        ⚠️ Run Quick Search first to load results — then use these filters to narrow them down client-side.
      </span>
      <button
        onClick={() => setDismissed(true)}
        className="ml-2 px-3 py-1 rounded bg-white/20 hover:bg-white/30 text-white font-bold text-xs transition-all flex-shrink-0"
        aria-label="Dismiss"
      >
        Got it ✓
      </button>
    </div>
  )
}

// Quick Date Lookup Card (promoted above Advanced Filters, replaces the basic Quick Search card)
interface QuickDateLookupProps {
  keywords: string
  setKeywords: (v: string) => void
  postedAfter: string
  setPostedAfter: (v: string) => void
  responseDeadlineBefore: string
  setResponseDeadlineBefore: (v: string) => void
  onRunSearch: () => void
  onStopSearch: () => void
  onReset: () => void
  loading: boolean
  searchDuration: number
  onSaveSearch: () => void
  onCreateAlert: () => void
}

function QuickDateLookup({
  keywords,
  setKeywords,
  postedAfter,
  setPostedAfter,
  responseDeadlineBefore,
  setResponseDeadlineBefore,
  onRunSearch,
  onStopSearch,
  onReset,
  loading,
  searchDuration,
  onSaveSearch,
  onCreateAlert,
}: QuickDateLookupProps) {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border-2 border-blue-500 shadow-lg mb-4">
      {/* Header row: logo + title on left, Save/Alert buttons on right */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-3">
          {/* PreciseGovCon logo */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="PreciseGovCon"
            className="h-10 w-auto object-contain"
            onError={(e) => {
              const img = e.currentTarget as HTMLImageElement
              img.onerror = null
              img.style.display = 'none'
            }}
          />
          <div>
            <h3 style={{ fontFamily: 'Aptos, sans-serif' }} className="text-2xl font-bold text-blue-900 uppercase tracking-wide leading-none">
              Quick Date Lookup
            </h3>
            <p className="text-sm text-blue-700 font-semibold mt-0.5">Fast search with date quick-fills — refine further with Advanced Filters below</p>
          </div>
        </div>
        {/* Save Search + Create Alert */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onSaveSearch}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold text-sm hover:shadow-lg hover:shadow-emerald-500/25 transition-all"
            aria-label="Save current search"
          >
            <Save className="h-4 w-4 flex-shrink-0" />
            Save Search
          </button>
          <button
            onClick={onCreateAlert}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold text-sm hover:shadow-lg hover:shadow-violet-500/25 transition-all"
            aria-label="Create email alert"
          >
            <Bell className="h-4 w-4 flex-shrink-0" />
            Create Alert
          </button>
          <Link href="/alerts">
            <button
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 text-white font-bold text-sm hover:bg-amber-600 hover:shadow-lg transition-all"
              aria-label="Manage alerts"
            >
              <Settings className="h-4 w-4 flex-shrink-0" />
              Manage Alerts
            </button>
          </Link>
        </div>
      </div>

      {/* 3-column: keyword + posted date (with quick-fills) + deadline date (with quick-fills) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Keyword */}
        <div>
          <label style={{ fontFamily: 'Aptos, sans-serif' }} className="block text-base font-bold text-gray-900 mb-2">
            Keyword:
          </label>
          <input
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') onRunSearch() }}
            placeholder="e.g., Data Analytics"
            className="w-full px-4 py-2.5 text-base font-semibold rounded-lg bg-white border-2 border-gray-400 text-gray-900 placeholder-gray-500 hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Solicitation Posted Date */}
        <div>
          <label style={{ fontFamily: 'Aptos, sans-serif' }} className="block text-base font-bold text-gray-900 mb-2">
            Solicitation Posted Date:
          </label>
          <input
            type="date"
            value={postedAfter}
            onChange={(e) => setPostedAfter(e.target.value)}
            className="w-full px-4 py-2.5 text-base font-semibold rounded-lg bg-white border-2 border-gray-400 text-gray-900 hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 mb-2"
          />
          <div style={{ fontFamily: 'Aptos, sans-serif' }} className="text-xs font-bold text-gray-700 mb-1">POSTED WITHIN:</div>
          <div className="flex flex-wrap gap-1">
            {[['1 Mo', -1], ['3 Mo', -3], ['6 Mo', -6], ['9 Mo', -9], ['12 Mo', -12]].map(([label, months]) => {
              const colors = ['from-blue-500 to-cyan-500', 'from-indigo-500 to-purple-500', 'from-violet-500 to-purple-500', 'from-purple-500 to-pink-500', 'from-slate-600 to-slate-800']
              const idx = ['-1', '-3', '-6', '-9', '-12'].indexOf(String(months))
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    const d = new Date()
                    d.setMonth(d.getMonth() + (months as number))
                    setPostedAfter(d.toISOString().split('T')[0])
                  }}
                  className={`px-3 py-1.5 text-xs font-bold bg-gradient-to-r ${colors[idx]} text-white rounded-lg hover:shadow-md transition-all`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Submission Deadline Date */}
        <div>
          <label style={{ fontFamily: 'Aptos, sans-serif' }} className="block text-base font-bold text-gray-900 mb-2">
            Submission Deadline Date:
          </label>
          <input
            type="date"
            value={responseDeadlineBefore}
            onChange={(e) => setResponseDeadlineBefore(e.target.value)}
            className="w-full px-4 py-2.5 text-base font-semibold rounded-lg bg-white border-2 border-gray-400 text-gray-900 hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 mb-2"
          />
          <div style={{ fontFamily: 'Aptos, sans-serif' }} className="text-xs font-bold text-gray-700 mb-1">DEADLINE WITHIN:</div>
          <div className="flex flex-wrap gap-1">
            {[['1 Mo', 1, 'from-rose-500 to-pink-500'], ['3 Mo', 3, 'from-orange-500 to-amber-500'], ['6 Mo', 6, 'from-amber-500 to-yellow-500'], ['9 Mo', 9, 'from-emerald-500 to-teal-500'], ['12 Mo', 12, 'from-cyan-500 to-blue-500']].map(([label, months, color]) => (
              <button
                key={label as string}
                type="button"
                onClick={() => {
                  const d = new Date()
                  d.setMonth(d.getMonth() + (months as number))
                  setResponseDeadlineBefore(d.toISOString().split('T')[0])
                }}
                className={`px-3 py-1.5 text-xs font-bold bg-gradient-to-r ${color} text-white rounded-lg hover:shadow-md transition-all`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Action row: Run / Stop / Save / Alert */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={onRunSearch}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-8 py-3 text-base font-bold rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white transition-all shadow-md disabled:opacity-50 whitespace-nowrap"
        >
          {loading ? (
            <><Loader2 className="h-5 w-5 animate-spin" />Searching...</>
          ) : (
            <><Search className="h-5 w-5" />RUN QUICK SEARCH</>
          )}
        </button>
        <button
          onClick={onStopSearch}
          disabled={!loading}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 text-base font-bold rounded-lg bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
        >
          <StopCircle className="h-5 w-5" />
          STOP
          {loading && searchDuration > 0 && <span className="text-sm opacity-90">({searchDuration}s)</span>}
        </button>
        <div className="w-px h-8 bg-blue-300 mx-1 hidden sm:block" />
        <button
          onClick={onSaveSearch}
          className="inline-flex items-center gap-1.5 px-4 py-3 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold text-sm hover:shadow-lg hover:shadow-emerald-500/25 transition-all whitespace-nowrap"
          aria-label="Save current search"
        >
          <Save className="h-4 w-4 flex-shrink-0" />
          Save Search
        </button>
        <button
          onClick={onCreateAlert}
          className="inline-flex items-center gap-1.5 px-4 py-3 rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold text-sm hover:shadow-lg hover:shadow-violet-500/25 transition-all whitespace-nowrap"
          aria-label="Create email alert"
        >
          <Bell className="h-4 w-4 flex-shrink-0" />
          Create Alert
        </button>
        <button
          onClick={onReset}
          className="inline-flex items-center gap-1.5 px-4 py-3 rounded-lg bg-white border-2 border-gray-400 hover:bg-gray-50 text-gray-800 font-bold text-sm transition-all whitespace-nowrap shadow-sm"
          aria-label="Reset all fields"
        >
          <RefreshCw className="h-4 w-4 flex-shrink-0" />
          Reset All
        </button>
      </div>
    </div>
  )
}

// Keep a thin shim so existing call sites compile — unused after JSX update
interface QuickSearchProps {
  quickKeyword: string; setQuickKeyword: (v: string) => void
  quickPostedDate: string; setQuickPostedDate: (v: string) => void
  quickDeadlineDate: string; setQuickDeadlineDate: (v: string) => void
  onRunSearch: () => void; onStopSearch: () => void
  isSearching: boolean; isLoading: boolean
}
function QuickSearch(_p: QuickSearchProps) { return null }

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
    isAuthenticated,
    planLoading,
  } = useBrowsingSession()

  const DEFAULT_LIMIT = 10000  // Increased to get more results
  const LOAD_MORE_INCREMENT = 1000

  // Search form states
  const [keywords, setKeywords] = useState('')
  const [naics, setNaics] = useState('')
  const [agency, setAgency] = useState('')
  const [setAside, setSetAside] = useState('')
  const [stateOfPerformance, setStateOfPerformance] = useState('')
  // ✅ QUICK SEARCH STATE
  const [quickKeyword, setQuickKeyword] = useState('')
  const [quickPostedDate, setQuickPostedDate] = useState(getSixMonthsAgo())
  const [quickDeadlineDate, setQuickDeadlineDate] = useState(getOneMonthFromNow())
  
  // Calculate default dates: 6 months back for "from", 1 month ahead for response deadline (both auto-update daily)
  const defaults = useMemo(() => {
    const today = new Date()
    const lookback = new Date()
    lookback.setMonth(lookback.getMonth() - 6) // Always 6 months back from today
    const responseDeadlineDate = new Date()
    responseDeadlineDate.setMonth(responseDeadlineDate.getMonth() + 1) // Always 1 month ahead from today
    return {
      from: lookback.toISOString().split('T')[0],
      responseDeadline: responseDeadlineDate.toISOString().split('T')[0]
    }
  }, []) // Recalculates on component mount (each day)

  const [postedAfter, setPostedAfter] = useState(getSixMonthsAgo())
  const [postedBefore, setPostedBefore] = useState('') // Removed default - field will be hidden
  const [showDateWarning, setShowDateWarning] = useState(false)
  const [dateWarningMessage, setDateWarningMessage] = useState('')

  // Validate date range doesn't exceed 364 days
  const validateDateRange = useCallback((startDate: string, endDate: string) => {
    if (!startDate || !endDate) return true
    
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays > 364) {
      setDateWarningMessage(
        `⚠️ Your date range is ${diffDays} days. SAM.gov's API limits searches to 364 days (1 year). Please select a shorter date range for better results.`
      )
      setShowDateWarning(true)
      return false
    }
    
    setShowDateWarning(false)
    return true
  }, [])

  const [procurementType, setProcurementType] = useState('') // '' = All Types
  const [isActive, setIsActive] = useState('') // 'true' | 'false' | '' (all)
  const [activeFilter, setActiveFilter] = useState<string | null>(null) // null = show all; "true"/"false" = subset view

  // ===== ADVANCED SEARCH — client-side filter applied flag =====
  const [advancedApplied, setAdvancedApplied] = useState(false) // true = filter results client-side
  // Separate keyword/date fields for Advanced Search client-side filtering
  const [advKeywords, setAdvKeywords] = useState('')
  const [advPostedAfter, setAdvPostedAfter] = useState(getSixMonthsAgo())
  const [advResponseDeadline, setAdvResponseDeadline] = useState(getOneMonthFromNow())

  // ===== NEW CRITICAL SEARCH PARAMETERS =====
  // Phase 1: Critical
  const [solicitationNumber, setSolicitationNumber] = useState('') // Priority 1B - Direct lookup
  const [classificationCode, setClassificationCode] = useState('') // Priority 1C - PSC codes
  const [responseDeadline, setResponseDeadline] = useState(getOneMonthFromNow())// Priority 1A - CRITICAL - Filter by specific deadline date (default: 1 month forward)
  // Empty by default - no upper limit
  const [responseDeadlineAfter, setResponseDeadlineAfter] = useState('')
  const [responseDeadlineBefore, setResponseDeadlineBefore] = useState(getOneMonthFromNow())

  // Phase 2: High Value
  const [noticeId, setNoticeId] = useState('') // Priority 2B - Direct ID
  const [opportunityStatus, setOpportunityStatus] = useState('active') // Priority 2A - Default to Active status

  // Phase 3: Medium Value
  const [placeOfPerformanceZip, setPlaceOfPerformanceZip] = useState('') // Priority 3A - ZIP
  const [organizationCode, setOrganizationCode] = useState('') // Priority 3B - Org code

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
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [sortBy, setSortBy] = useState<"posted-desc" | "posted-asc" | "deadline-desc" | "deadline-asc" | "relevance">("posted-desc")
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  // Search timer for stop button
  const [searchStartTime, setSearchStartTime] = useState<Date | null>(null)
  const [searchDuration, setSearchDuration] = useState(0)

  // Access control - with feature-specific gating
  const [showAccessModal, setShowAccessModal] = useState(false)
  const [blockedFeature, setBlockedFeature] = useState('Advanced Federal Bid Search')
  const pendingActionRef = useRef<(() => void) | null>(null)

  const [isSignUp, setIsSignUp] = useState(true)

  // ✅ FIXED: Unified modal state
  const [showSaveModal, setShowSaveModal] = useState(false)
  
  // ✅ Alert builder modal state (used when arriving with ?action=create-alert)
  const [showAlertBuilder, setShowAlertBuilder] = useState(false)
const [saveModalMode, setSaveModalMode] = useState<'save' | 'alert'>('save')
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successData, setSuccessData] = useState({
    searchName: '',
    isSubscription: false,
    saved_search_id: null as string | null
  })

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

  // Refs
  const resultsRef = useRef<HTMLDivElement>(null)
  const filtersRef = useRef<HTMLDivElement>(null)
  const lastSearchParamsRef = useRef<string>('') // CRITICAL FIX: Track last search to prevent duplicates

  // Custom hooks
  const { recentSearches, saveSearchToHistory, setRecentSearches } = useSearchHistory();
  const { saved, toggleSaved, setSaved } = useOpportunityManagement();
  const { saveSearchState, restoreSearchState } = useSearchStatePersistence();

  // Timer effect - updates search duration every second
  useEffect(() => {
    if (!loading || !searchStartTime) {
      setSearchDuration(0)
      return
    }

    const interval = setInterval(() => {
      const duration = Math.floor((Date.now() - searchStartTime.getTime()) / 1000)
      setSearchDuration(duration)
    }, 1000)

    return () => clearInterval(interval)
  }, [loading, searchStartTime])

  // Stop/Cancel search function with keyboard shortcut
  const stopSearch = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort('Search stopped by user')
      abortControllerRef.current = null
    }
    setLoading(false)
    setLoadingMore(false)
    setSearchStartTime(null)
    setSearchDuration(0)
    console.log('🛑 Search stopped by user')
  }, [])

  // Add keyboard shortcut for stopping search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && loading) {
        stopSearch();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [loading, stopSearch]);

  const scrollToResults = useCallback(() => {
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  // Load saved data from localStorage
  useEffect(() => {
    try {
      const savedSearches = localStorage.getItem('govcon_recent_searches')
      if (savedSearches) setRecentSearches(JSON.parse(savedSearches).slice(0, 5))
      
      const savedData = localStorage.getItem('govcon_saved_opportunities')
      if (savedData) setSaved(JSON.parse(savedData))

      // Restore search state from sessionStorage
      const restoredState = restoreSearchState();
      if (restoredState) {
        // Optionally restore state here
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    }
  }, [setRecentSearches, setSaved, restoreSearchState])

  const searchParams = useSearchParams()
  // Auto-load saved search if loadSavedSearch param is present
  useEffect(() => {
    const savedSearchId = searchParams?.get('loadSavedSearch');
    const runImmediately = searchParams?.get('run') === '1';
    
    if (!savedSearchId) return;
    
    // Wait for subscription to load before running
    if (planLoading) {
      console.log('Waiting for subscription data before loading saved search...');
      return;
    }

    (async () => {
      try {
        console.log('Loading saved search:', savedSearchId);
        const res = await fetch(`/api/saved-searches/${savedSearchId}`);
        if (!res.ok) {
          console.error('Failed to load saved search:', res.status);
          return;
        }
        
        const { search } = await res.json();
        console.log('✅ Loaded saved search:', search);
        console.log('🔍 Date fields in saved search:', {
          posted_after: search.posted_after,
          posted_before: search.posted_before,
          rdl_from: search.rdl_from,
          rdl_to: search.rdl_to,
          postedAfter: search.posted_after,
          postedBefore: search.posted_before,
        });

        // Helper to convert DateTime to date string (YYYY-MM-DD)
        const toDateString = (dateTime: any): string => {
          if (!dateTime) return '';
          try {
            // If it's already just a date string, return it
            if (typeof dateTime === 'string' && !dateTime.includes('T')) {
              return dateTime;
            }
            // Otherwise parse and extract date part
            const date = new Date(dateTime);
            return date.toISOString().split('T')[0];
          } catch {
            return '';
          }
        };

        // Map database field names to UI/API field names
        const mappedParams = {
          keywords: search.keywords || '',
          naics: search.naics || '',
          agency: search.agency || '',
          setAside: search.setAside || '',  // Database uses set_aside
          stateOfPerformance: search.stateOfPerformance || '',  // Database uses state_of_performance
          procurementType: search.procurementType || '',  // Database uses procurement_type
          postedAfter: toDateString(search.posted_after),  // Convert DateTime to date string
          postedBefore: toDateString(search.posted_before),  // Convert DateTime to date string
          is_active: search.is_active !== null && search.is_active !== undefined && search.is_active !== 'undefined' ? search.is_active : '',
          solicitationNumber: search.solicitation_number || '',  // Database uses solicitation_number
          classificationCode: search.classification_code || '',  // Database uses classification_code
          responseDeadlineFrom: toDateString(search.rdl_from),  // Database uses rdl_from
          responseDeadlineTo: toDateString(search.rdl_to),  // Database uses rdl_to
          noticeId: search.noticeId || '',  // Database uses notice_id
          opportunityStatus: search.opportunity_status || '',  // Database uses opportunity_status
          placeOfPerformanceZip: search.place_of_performance_zip || '',  // Database uses place_of_performance_zip
          organizationCode: search.organization_code || '',  // Database uses organization_code
        };

        // Apply the filters to UI state for display
        console.log('📝 Setting UI state from saved search...');
        setKeywords(mappedParams.keywords);
        setNaics(mappedParams.naics);
        setAgency(mappedParams.agency);
        setSetAside(mappedParams.setAside);
        setStateOfPerformance(mappedParams.stateOfPerformance);
        setProcurementType(mappedParams.procurementType);
        setPostedAfter(mappedParams.postedAfter);
        setPostedBefore(mappedParams.postedBefore);
        setIsActive(mappedParams.is_active);
        setSolicitationNumber(mappedParams.solicitationNumber);
        setClassificationCode(mappedParams.classificationCode);
        // Note: Currently UI only supports single deadline field, using rdl_to
        setResponseDeadline(mappedParams.responseDeadlineTo || mappedParams.responseDeadlineFrom);
        setNoticeId(mappedParams.noticeId);
        setOpportunityStatus(mappedParams.opportunityStatus);
        setPlaceOfPerformanceZip(mappedParams.placeOfPerformanceZip);
        setOrganizationCode(mappedParams.organizationCode);
        
        console.log('✅ UI state updated with mapped params:', mappedParams);

        // CRITICAL FIX: If run=1, execute search IMMEDIATELY with mapped parameters
        // No timeout needed since we're passing params directly, not relying on state
        if (runImmediately) {
          console.log('🚀 Auto-running search with loaded parameters...');
          console.log('📋 Mapped parameters:', mappedParams);
          
          // Execute immediately - no timeout needed since we pass params directly
          executeSearchWithParams(mappedParams);
        }
      } catch (e) {
        console.error('Failed to auto-load saved search:', e);
      }
    })();
  }, [searchParams, planLoading]);
  
  // Handle URL action parameters from Alerts page
  useEffect(() => {
    const action = searchParams?.get('action')
    
    if (action === 'create-saved-search') {
      // Open saved search modal
      setTimeout(() => setShowSaveModal(true), 300)
    } else if (action === 'create-alert') {
      // Open alert modal  
      setTimeout(() => setShowAlertBuilder(true), 300)
    }
  }, [searchParams])

  useEffect(() => {
    try {
      const from = searchParams?.get('from')
      if (from !== 'cta') return
      // ✅ CRITICAL FIX: Don't show modal if user has valid access OR is in browsing window
      if (hasValidAccess || canBrowse) return

      const shown = sessionStorage.getItem('govcon_gate_shown')
      if (shown) return
      sessionStorage.setItem('govcon_gate_shown', 'true')

      setBlockedFeature('Advanced Federal Bid Search')
      pendingActionRef.current = () => { void runSearch(false) }
      setTimeout(() => setShowAccessModal(true), 350)
    } catch {
      // ignore
    }
  }, [searchParams, hasValidAccess, canBrowse])

  // Save current search state
  useEffect(() => {
    const searchState = {
      keywords, naics, agency, setAside, stateOfPerformance,
      postedAfter, postedBefore, procurementType, isActive,
      solicitationNumber, classificationCode, responseDeadline,
      noticeId, opportunityStatus, placeOfPerformanceZip, organizationCode
    };
    saveSearchState(searchState);
  }, [
    keywords, naics, agency, setAside, stateOfPerformance,
    postedAfter, postedBefore, procurementType, isActive,
    solicitationNumber, classificationCode, responseDeadline,
    noticeId, opportunityStatus, placeOfPerformanceZip, organizationCode,
    saveSearchState
  ]);

  // Check if user has access - Robust version
  /**
   * Gate a premium action - if user doesn't have access, show modal
   * @param featureName - The name of the feature being accessed (shown in modal)
   * @returns true if user has access, false if gated (modal shown)
   */

  // ✅ CORRECT: Define requireAccess FIRST (before line 1898)
  const requireAccess = useCallback((featureName: string): boolean => {
    // Don't show modal while still loading
    if (planLoading || status === 'loading') {
      console.log('⏳ Still loading, deferring access check...')
      return false
    }

    // Saving/alerting always requires a real account — browsing guest access is not enough
    const requiresAuth = featureName.toLowerCase().includes('save') ||
                         featureName.toLowerCase().includes('alert') ||
                         featureName.toLowerCase().includes('subscription')
    
    if (requiresAuth && status === 'unauthenticated') {
      setBlockedFeature(featureName)
      setShowAccessModal(true)
      return false
    }
    
    // For other features, check BOTH hasValidAccess AND canBrowse
    if (!hasValidAccess && !canBrowse) {
      setBlockedFeature(featureName)
      setShowAccessModal(true)
      
      if (featureName.includes('Search')) {
        pendingActionRef.current = null
      }
      
      return false
    }
    
    return true
  }, [hasValidAccess, canBrowse, planLoading, status])

  // ✅ Then define handleOpenSaveModal (line 1898)
  const handleOpenSaveModal = useCallback((mode: 'save' | 'alert') => {
    if (!requireAccess(mode === 'save' ? 'Save Searches' : 'Email Alerts for New Opportunities')) {
      return
    }
    setSaveModalMode(mode)
    setShowSaveModal(true)
  }, [requireAccess])

  // ✅ Handle successful save
  const handleSaveSuccess = useCallback(async (payload: any) => {
    try {
      console.log('💾 Saving search with payload:', payload)
      
      const endpoint = payload.subscription_enabled 
        ? '/api/saved-searches/with-subscription' 
        : '/api/saved-searches'
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        // 401 means unauthenticated — prompt sign-in instead of showing a generic error
        if (response.status === 401) {
          setShowSaveModal(false)
          setShowAccessModal(true)
          setBlockedFeature('Save Searches')
          return
        }
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save search')
      }

      const result = await response.json()
      console.log('✅ Save successful:', result)
      
      setShowSaveModal(false)
      setSuccessData({
        searchName: result.search?.name || payload.name,
        isSubscription: Boolean(payload.subscription_enabled),
        saved_search_id: result.search?.id || null
      })
      setShowSuccessModal(true)
      router.refresh()
    } catch (error: any) {
      console.error('❌ Failed to save:', error)
      throw error
    }
  }, [router])





  const handleCreateAlert = () => {
    if (status === 'loading') return
    if (!requireAccess('Email Alerts for New Opportunities')) return
    setShowAlertBuilder(true)
  }
  
  // Dashboard should be accessible to everyone
  const handleViewDashboard = () => {
    router.push('/dashboard')
  }

  // Helper: Convert YYYY-MM-DD to MM/dd/yyyy for SAM.gov API
  function formatDateForAPI(isoDate: string): string {
    if (!isoDate) return ''
    const date = new Date(isoDate)
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const year = date.getFullYear()
    return `${month}/${day}/${year}` // MM/dd/yyyy format required by SAM.gov
  }

  // Data validation function
  const validateSearchParams = useCallback((params: any) => {
    const errors: string[] = [];
    
    if (params.postedAfter && params.postedBefore) {
      const start = new Date(params.postedAfter);
      const end = new Date(params.postedBefore);
      if (start > end) {
        errors.push('Start date must be before end date');
      }
    }
    
    if (params.naics && !/^\d{2,6}$/.test(params.naics)) {
      errors.push('NAICS code must be 2-6 digits');
    }
    
    if (params.placeOfPerformanceZip && !/^\d{5}(-\d{4})?$/.test(params.placeOfPerformanceZip)) {
      errors.push('ZIP code must be 5 digits or 5+4 format');
    }
    
    return errors;
  }, []);

  /**
   * Execute search with explicit parameters (used for saved searches)
   * This bypasses state variables to avoid race conditions
   */
  const executeSearchWithParams = async (params: any) => {
    console.log('executeSearchWithParams called with:', params);
    
    // Validate parameters
    const validationErrors = validateSearchParams(params);
    if (validationErrors.length > 0) {
      setError(validationErrors.join('. '));
      return;
    }

    // CRITICAL: Check if user can browse
    if (!canBrowse) {
      console.log('Search blocked: canBrowse is false');
      setShowLockoutModal(true);
      return;
    }

    // Gate the search action
    if (!requireAccess('Search Federal Opportunities')) {
      console.log('Search blocked: requireAccess failed');
      return;
    }

    console.log('All checks passed, executing search with saved params...');

    // Cancel any pending requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort('New search started');
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setLoading(true);
    setSearchStartTime(new Date());
    setResultsLimit(DEFAULT_LIMIT);
    setCurrentPage(1);
    setError(null);

    try {
      const qs = new URLSearchParams();

      // Build query from explicit params instead of state variables
      if (params.solicitationNumber?.trim()) {
        qs.set('solnum', params.solicitationNumber.trim());
      }
      if (params.noticeId?.trim()) {
        qs.set('noticeid', params.noticeId.trim());
      }
      if (params.keywords?.trim()) {
        qs.set('title', params.keywords.trim());
      }
      if (params.naics?.trim()) {
        qs.set('ncode', clamp(params.naics.trim(), 6));
      }
      if (params.classificationCode?.trim()) {
        qs.set('ccode', params.classificationCode.trim());
      }
      if (params.agency?.trim()) {
        qs.set('organizationName', clamp(params.agency.trim(), 120));
      }
      if (params.organizationCode?.trim()) {
        qs.set('organizationCode', params.organizationCode.trim());
      }
      if (params.setAside && params.setAside.trim() !== '') {
        qs.set('typeOfSetAside', params.setAside.trim());
      }
      if (params.procurementType?.trim()) {
        qs.set('ptype', params.procurementType.trim());
      }
      if (params.stateOfPerformance?.trim() && params.stateOfPerformance !== '') {
        qs.set('state', params.stateOfPerformance.trim());
      }
      if (params.placeOfPerformanceZip?.trim()) {
        qs.set('zip', params.placeOfPerformanceZip.trim());
      }
      if (params.opportunityStatus?.trim()) {
        qs.set('status', params.opportunityStatus.trim());
      }
      if (params.is_active && params.is_active !== '' && params.is_active !== 'undefined') {
        qs.set('isActive', params.is_active);
      }
      if (params.postedAfter?.trim()) {
        qs.set('postedFrom', formatDateForAPI(params.postedAfter.trim()));
      }
      if (params.postedBefore?.trim()) {
        qs.set('postedTo', formatDateForAPI(params.postedBefore.trim()));
      }
      // Handle response deadline range
      if (params.responseDeadlineFrom?.trim()) {
        qs.set('responseDeadlineFrom', formatDateForAPI(params.responseDeadlineFrom.trim()));
      }
      if (params.responseDeadlineTo?.trim()) {
        qs.set('responseDeadlineTo', formatDateForAPI(params.responseDeadlineTo.trim()));
      }
      // Fallback for single deadline field (backward compatibility)
      if (params.responseDeadline?.trim() && !params.responseDeadlineFrom && !params.responseDeadlineTo) {
        qs.set('responseDeadline', formatDateForAPI(params.responseDeadline.trim()));
      }

      qs.set('limit', '1000');
      qs.set('offset', '0');

      console.log('Calling API with saved search parameters:', Object.fromEntries(qs.entries()));

      const res = await fetchWithRetry(`/api/sam?${qs.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(canBrowse && !isAuthenticated ? { 'x-browsing-session': 'true' } : {}),
        },
        signal: abortController.signal,
      }, 3, 2000); // 3 retries, 2 second initial delay

      if (!res.ok) {
        const errorText = await res.text();
        console.error('API request failed:', { status: res.status, errorText });
        
        // Handle payment-required status
        if (res.status === 402) {
          if (!canBrowse && !hasValidAccess) {
            setBlockedFeature('Search Federal Opportunities');
            setShowAccessModal(true);
            setError('Your trial has ended. Please upgrade to continue searching.');
            setLoading(false);
            return; // Don't throw - just return early
          }
        }

        // Build user-friendly error message
        let userMessage = 'Search failed. Please try again.';
        if (res.status === 400) {
          userMessage = 'Invalid search parameters. Please check your filters and try again.';
        } else if (res.status === 401 || res.status === 403) {
          userMessage = 'You need to sign in to search. Please log in and try again.';
        } else if (res.status === 404) {
          userMessage = 'Search service not found. Please refresh the page and try again.';
        } else if (res.status === 429) {
          userMessage = 'Too many searches. Please wait a moment and try again.';
        } else if (res.status === 500) {
          userMessage = 'SAM.gov service is temporarily unavailable. Please try again in a few moments.';
        } else if (res.status === 502 || res.status === 503 || res.status === 504) {
          userMessage = 'Connection to SAM.gov failed. The service may be down. Please try again later.';
        }
        
        // Set error state instead of throwing
        setError(userMessage);
        setData(null);
        setLoading(false);
        return; // Exit early instead of throwing
      }

      const json = await res.json();
      const payload = json as ApiResponse;
      const opps = payload.opportunitiesData || [];

      const total = payload.totalCount || 0;
      const loaded = (opps?.length ?? 0);
      const currentTotalLoaded = loaded;
      
      setHasMoreResults(currentTotalLoaded < total);
      setData(payload);
      setActiveFilter(null);
      
      saveSearchToHistory(qs.toString());
      
      console.log('API Search successful:', {
        results: (opps?.length ?? 0),
        totalRecords: total,
        hasMoreResults: currentTotalLoaded < total,
      });

    } catch (e: any) {
      if (e.name === 'AbortError' || abortController.signal.aborted) {
        console.log('Request aborted');
        return;
      }
      
      console.error('Search error:', e);
      setError(e?.message || 'Search failed. Please try again.');
      setData(null);
    } finally {
      if (!abortController.signal.aborted) {
        setLoading(false);
        setSearchStartTime(null);
        setSearchDuration(0);
      }
    }
  };

  // ✅ NEW: Run Quick Search - Auto-populate advanced fields  
  const runQuickSearch = useCallback(() => {
    // Auto-populate advanced search fields from quick search
    setKeywords(quickKeyword)
    setPostedAfter(quickPostedDate)
    setResponseDeadline(quickDeadlineDate)
    
    // Also populate advanced search fields so they're in sync
    setAdvKeywords(quickKeyword)
    setAdvPostedAfter(quickPostedDate)
    setAdvResponseDeadline(quickDeadlineDate)
    
    // Trigger the actual search
    runSearch(false)
  }, [quickKeyword, quickPostedDate, quickDeadlineDate])

  // ✅ NEW: Stop Quick Search
  const stopQuickSearch = useCallback(() => {
    setLoading(false)
    setLoadingMore(false)
    if (abortControllerRef.current) {
      abortControllerRef.current.abort('Search stopped by user')
      abortControllerRef.current = null
    }
  }, [])

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
    
    
    // PERFORMANCE FIX: Cancel any pending requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort('New search started')
    }

    // PERFORMANCE FIX: Create new AbortController for this request
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    if (isLoadMore) {
      setLoadingMore(true)
    } else {
      setLoading(true)
      setSearchStartTime(new Date()) // Start timer
      setResultsLimit(DEFAULT_LIMIT)
      setCurrentPage(1)
    }
    
    setError(null)

    try {
      const qs = new URLSearchParams()
      
      // ===== DIRECT LOOKUPS (Priority - Skip other filters if provided) =====
      if (solicitationNumber.trim()) {
        qs.set('solnum', solicitationNumber.trim())
      }
      if (noticeId.trim()) {
        qs.set('noticeid', noticeId.trim())
      }
      
      // ===== TEXT SEARCH =====
      // PERFORMANCE FIX: Use debounced keywords
      if (debouncedKeywords.trim()) {
        const keywords = debouncedKeywords.trim()
        
        // Use 'title' parameter to search ONLY in opportunity titles
        // This gives more relevant results than 'q' which searches all fields
        qs.set('title', keywords)
        
        // NOTE: Searching titles only ensures results actually contain the search term
        // in the opportunity name, not buried in description text
      }
      
      // ===== CLASSIFICATION CODES =====
      // NAICS Code
      if (naics.trim()) {
        qs.set('ncode', clamp(naics.trim(), 6))
      }
      // PSC Code (NEW - CRITICAL)
      if (classificationCode.trim()) {
        qs.set('ccode', classificationCode.trim())
      }
      
      // ===== ORGANIZATION =====
      // Agency/Department
      if (agency.trim()) {
        qs.set('organizationName', clamp(agency.trim(), 120))
      }
      // Organization Code (NEW)
      if (organizationCode.trim()) {
        qs.set('organizationCode', organizationCode.trim())
      }
      
      // SET-ASIDE TYPE - Only filter if user selected a specific set-aside
      if (setAside && setAside.trim() !== '') {
        qs.set('typeOfSetAside', setAside.trim());
      }

      // Procurement Type (ptype)
      if (procurementType.trim()) {
        qs.set('ptype', procurementType.trim())
      }
      
      // ===== LOCATION =====
      // State
      if (stateOfPerformance.trim() && stateOfPerformance !== '') {
        qs.set('state', stateOfPerformance.trim())
      }
      // ZIP Code (NEW)
      if (placeOfPerformanceZip.trim()) {
        qs.set('zip', placeOfPerformanceZip.trim())
      }
      
      // ===== STATUS =====
      // Full status filter (NEW)
      if (opportunityStatus.trim()) {
        qs.set('status', opportunityStatus.trim())
      }
      // Active / Inactive status (existing)
      if (isActive && isActive !== '' && isActive !== 'undefined') {
        qs.set('isActive', isActive)
      }

      // ===== POSTED DATE RANGE =====
      // Only apply postedFrom if user has chosen a specific date (not the auto-default of today)
      if (postedAfter.trim()) {
        qs.set('postedFrom', formatDateForAPI(postedAfter.trim()))
      }
      // postedTo (upper bound on posted date) — only if explicitly set by user
      if (postedBefore.trim()) {
        qs.set('postedTo', formatDateForAPI(postedBefore.trim()))
      }
      // NOTE: Do NOT add postedTo=today automatically — it restricts to 1 day and filters too aggressively
      
      // ===== RESPONSE DEADLINE (DEADLINE BY - LESS THAN OR EQUAL TO) =====
      if (responseDeadline.trim()) {
        qs.set('rdlto', formatDateForAPI(responseDeadline.trim()))
      }
      
      // ===== PAGINATION =====
      qs.set('limit', '1000')  // SAM.gov max per request is 1000
      qs.set('offset', String((currentPage - 1) * DEFAULT_LIMIT))

      // CRITICAL FIX: Prevent duplicate identical searches
      const searchParamsString = qs.toString()
      if (!isLoadMore && searchParamsString === lastSearchParamsRef.current) {
        console.log('⚠️ Duplicate search prevented - params unchanged')
        setLoading(false)
        setSearchStartTime(null)
        setSearchDuration(0)
        return
      }
      lastSearchParamsRef.current = searchParamsString

      console.log('Calling API with corrected SAM.gov parameters:', Object.fromEntries(qs.entries()))

      // PERFORMANCE FIX: Pass signal to fetch for cancellation + RELIABILITY FIX: Retry on failures
      const res = await fetchWithRetry(`/api/sam?${qs.toString()}`, { 
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(canBrowse && !isAuthenticated ? { 'x-browsing-session': 'true' } : {}),
        },
        signal: abortController.signal
      }, 3, 2000) // 3 retries, 2 second initial delay
      
      if (!res.ok) {
        const errorText = await res.text()
        console.error('API request failed:', { status: res.status, errorText })
        
        // Handle payment required (trial ended)
        // ✅ CRITICAL FIX: Only show modal if user is NOT in free browsing window
        if (res.status === 402) {
          if (!canBrowse && !hasValidAccess) {
            setBlockedFeature('Search Federal Opportunities')
            setShowAccessModal(true)
            setError('Your trial has ended. Please upgrade to continue searching.')
            if (isLoadMore) {
              setLoadingMore(false)
            } else {
              setLoading(false)
            }
            return // Don't throw - just return early
          }
        }
        
        // ===== USER-FRIENDLY ERROR MESSAGES =====
        let userMessage = 'Search failed. Please try again.'
        
        if (res.status === 400) {
          userMessage = 'Invalid search parameters. Please check your filters and try again.'
        } else if (res.status === 401 || res.status === 403) {
          userMessage = 'You need to sign in to search. Please log in and try again.'
        } else if (res.status === 404) {
          userMessage = 'Search service not found. Please refresh the page and try again.'
        } else if (res.status === 429) {
          userMessage = 'Too many searches. Please wait a moment and try again.'
        } else if (res.status === 500) {
          userMessage = 'SAM.gov service is temporarily unavailable. Please try again in a few moments.'
        } else if (res.status === 502 || res.status === 503 || res.status === 504) {
          userMessage = 'Connection to SAM.gov failed. The service may be down. Please try again later.'
        }
        
        // Set error state instead of throwing
        setError(userMessage)
        setData(null)
        if (isLoadMore) {
          setLoadingMore(false)
        } else {
          setLoading(false)
        }
        return // Exit early instead of throwing
      }
      
      let json = await res.json()

      const payload: ApiResponse = json
      const opps = payload.opportunitiesData

      
      // Check if there are more results available
      const total = payload.totalCount || 0
      const loaded = (opps?.length ?? 0)
      const currentTotalLoaded = isLoadMore 
        ? (data?.opportunitiesData?.length || 0) + loaded
        : loaded
      setHasMoreResults(currentTotalLoaded < total)
      
      if (isLoadMore) {
        setData(prev => ({
          ...prev,
          totalRecords: total,
          opportunitiesData: [...(prev?.opportunitiesData || []), ...(opps ?? [])]
        }))
        setCurrentPage(prev => prev + 1)
      } else {
        setData(payload)
        setActiveFilter(null) // reset subset view on fresh search
        // Save search to history
        saveSearchToHistory(qs.toString())
      }

      console.log('API Search successful', { 
        results: (opps?.length ?? 0), 
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
          setSearchStartTime(null)
          setSearchDuration(0)
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
    // ── Quick Date Lookup card fields ──
    setQuickKeyword('')
    setQuickPostedDate(getSixMonthsAgo())
    setQuickDeadlineDate(getOneMonthFromNow())

    // ── Shared state (synced from Quick Search) ──
    setKeywords('')
    setPostedAfter(getSixMonthsAgo())
    setResponseDeadlineBefore(getOneMonthFromNow())
    setResponseDeadline(getOneMonthFromNow())

    // ── Advanced filter state ──
    setAdvKeywords('')
    setAdvPostedAfter(getSixMonthsAgo())
    setAdvResponseDeadline(getOneMonthFromNow())
    setAdvancedApplied(false)

    // ── All other filters ──
    setNaics('')
    setAgency('')
    setSetAside('')
    setStateOfPerformance('')
    setPostedBefore('')
    setProcurementType('')
    setIsActive('')
    setSolicitationNumber('')
    setClassificationCode('')
    setResponseDeadlineAfter('')
    setNoticeId('')
    setOpportunityStatus('')
    setPlaceOfPerformanceZip('')
    setOrganizationCode('')

    // ── UI state ──
    setError(null)
    setData(null)
    setResultsLimit(DEFAULT_LIMIT)
    setCurrentPage(1)
    setSortBy('deadline-asc')
    setSortOrder('asc')
    setActiveFilter(null)
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

  const exportTxt = () => {
    if (!filteredResults.length) return
    if (!requireAccess('Export to TXT')) return
    
    const txtContent = filteredResults.map((opp, idx) => {
      return `
==========================================
OPPORTUNITY ${idx + 1}
==========================================
Title: ${opp.title || 'N/A'}
Solicitation Number: ${opp.solicitationNumber || 'N/A'}
Agency: ${opp.department || 'N/A'}
Posted Date: ${opp.postedDate || 'N/A'}
Response Deadline: ${opp.responseDeadLine || 'N/A'}
Set-Aside: ${opp.setAside || 'N/A'}
NAICS Code: ${opp.naicsCode || 'N/A'}
Location: ${opp.placeOfPerformance?.city?.name || ''}, ${opp.placeOfPerformance?.state?.code || ''}
Notice ID: ${opp.noticeId || 'N/A'}
Link: ${opp.uiLink || 'N/A'}
==========================================
`
    }).join('\n')
    
    const blob = new Blob([txtContent], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `opportunities-${new Date().toISOString().split('T')[0]}.txt`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const exportXml = () => {
    if (!filteredResults.length) return
    if (!requireAccess('Export to XML')) return
    
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<opportunities>
${filteredResults.map(opp => `  <opportunity>
    <title>${escapeXml(opp.title || '')}</title>
    <solicitationNumber>${escapeXml(opp.solicitationNumber || '')}</solicitationNumber>
    <agency>${escapeXml(opp.department || '')}</agency>
    <postedDate>${escapeXml(opp.postedDate || '')}</postedDate>
    <responseDeadline>${escapeXml(opp.responseDeadLine || '')}</responseDeadline>
    <setAside>${escapeXml(opp.setAside || '')}</setAside>
    <naicsCode>${escapeXml(opp.naicsCode || '')}</naicsCode>
    <noticeId>${escapeXml(opp.noticeId || '')}</noticeId>
    <uiLink>${escapeXml(opp.uiLink || '')}</uiLink>
  </opportunity>`).join('\n')}
</opportunities>`
    
    const blob = new Blob([xmlContent], { type: 'application/xml' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `opportunities-${new Date().toISOString().split('T')[0]}.xml`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const exportEmail = () => {
    if (!filteredResults.length) return
    if (!requireAccess('Email Export')) return
    
    const subject = `Government Contract Opportunities - ${new Date().toLocaleDateString()}`
    const body = filteredResults.slice(0, 10).map((opp, idx) => {
      return `${idx + 1}. ${opp.title}\n   Agency: ${opp.department || 'N/A'}\n   Deadline: ${opp.responseDeadLine || 'N/A'}\n   Link: ${opp.uiLink || 'N/A'}\n`
    }).join('\n')
    
    const fullBody = `Found ${filteredResults.length} opportunities:\n\n${body}\n\n${filteredResults.length > 10 ? `... and ${filteredResults.length - 10} more opportunities. Export to CSV/JSON for full list.` : ''}`
    
    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(fullBody)}`
    window.location.href = mailtoLink
  }

  const exportBinary = () => {
    if (!filteredResults.length) return
    if (!requireAccess('Export to Binary')) return
    
    // Create a binary format (MessagePack-like structure)
    const binaryData = new TextEncoder().encode(JSON.stringify({
      version: '1.0',
      exportDate: new Date().toISOString(),
      count: filteredResults.length,
      opportunities: filteredResults
    }))
    
    const blob = new Blob([binaryData], { type: 'application/octet-stream' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `opportunities-${new Date().toISOString().split('T')[0]}.bin`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Helper function for XML escaping
  const escapeXml = (str: string) => {
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&apos;')
  }

  const toggleExpanded = (k: string) => setExpanded((p) => ({ ...p, [k]: !p[k] }))

  const copyText = async (txt: string) => {
    try {
      await navigator.clipboard.writeText(txt)
      setCopiedId(txt)
      setTimeout(() => setCopiedId(null), 1200)
    } catch {}
  }

  // Results data
  const totalRecords = data?.totalRecords ?? 0
  const results = data?.opportunitiesData ?? []

  // When Quick Search returns results, pre-populate the Advanced Search date/keyword fields
  // so they're ready to refine — but DON'T auto-apply the advanced filter
  useEffect(() => {
    if (results.length > 0) {
      setAdvKeywords(keywords)
      setAdvPostedAfter(postedAfter)
      setAdvResponseDeadline(responseDeadline)
      setAdvancedApplied(false) // reset so advanced doesn't auto-filter
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]) // fire only when data (search results) change

  // Filtered results with memoization - PERFORMANCE OPTIMIZED
  // ===== APPLY ADVANCED FILTERS (client-side if results exist, API search if not) =====
  const applyAdvancedFilters = useCallback(() => {
    if (results.length === 0) {
      // No Quick Search results loaded — run a full SAM.gov API search using ONLY advanced fields
      // DO NOT sync to quick search state - keep them separate
      // We'll use the advanced field values directly in runSearch
      
      // Temporarily set the main search state to advanced values
      const prevKeywords = keywords
      const prevPostedAfter = postedAfter  
      const prevResponseDeadline = responseDeadline
      
      if (advKeywords) setKeywords(advKeywords)
      if (advPostedAfter) setPostedAfter(advPostedAfter)
      if (advResponseDeadline) setResponseDeadline(advResponseDeadline)
      
      // Defer to next tick so state is flushed before runSearch reads it
      setTimeout(() => {
        runSearch(false)
        // Don't restore - let advanced values persist
      }, 0)
    } else {
      // Results already loaded — filter client-side, no API call
      if (!advPostedAfter) setAdvPostedAfter(postedAfter)
      if (!advResponseDeadline) setAdvResponseDeadline(responseDeadline)
      if (!advKeywords) setAdvKeywords(keywords)
      setAdvancedApplied(true)
      setActiveFilter(null)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results.length, advPostedAfter, advResponseDeadline, advKeywords, postedAfter, responseDeadline, keywords, setAside, naics, stateOfPerformance])

  const clearAdvancedFilters = useCallback(() => {
    setAdvancedApplied(false)
    setActiveFilter(null)
  }, [])

  const filteredResults = useMemo(() => {
    let arr = results.slice()

    // ── ALWAYS filter by set-aside if selected (SAM.gov API doesn't filter reliably) ──
    if (setAside.trim()) {
      arr = arr.filter(o => {
        const oppSetAside = (o.typeOfSetAside || o.setAside || o.setAsideCode || '').toUpperCase()
        return oppSetAside === setAside.toUpperCase()
      })
    }

    // ── ALWAYS filter by status if selected ──
    // NOTE: Only filter OUT if explicitly inactive/archived - assume active if field missing
    if (opportunityStatus.trim() && opportunityStatus.toLowerCase() !== 'active') {
      // User selected a specific non-active status (archived, cancelled, etc.)
      arr = arr.filter(o => {
        const oppActive = (o.active || '').toString().toLowerCase()
        const oppStatus = (o.status || '').toLowerCase()
        return oppActive === opportunityStatus.toLowerCase() || oppStatus === opportunityStatus.toLowerCase()
      })
    }
    // If status is "active" (default), don't filter - SAM.gov doesn't always include status field

    if (advancedApplied) {
      // ── Client-side advanced filtering ──

      // Keyword match (title or description)
      const kw = advKeywords.trim().toLowerCase()
      if (kw) {
        arr = arr.filter(o =>
          (o.title || '').toLowerCase().includes(kw) ||
          (o.description || '').toLowerCase().includes(kw)
        )
      }

      // Agency
      if (agency.trim()) {
        const ag = agency.trim().toLowerCase()
        arr = arr.filter(o =>
          (o.organizationName || '').toLowerCase().includes(ag) ||
          (o.fullParentPathName || '').toLowerCase().includes(ag)
        )
      }

      // NAICS
      if (naics.trim()) {
        arr = arr.filter(o =>
          (o.naicsCode || '').startsWith(naics.trim())
        )
      }

      // PSC / Classification code
      if (classificationCode.trim()) {
        arr = arr.filter(o =>
          (o.classificationCode || '').toLowerCase().startsWith(classificationCode.trim().toLowerCase())
        )
      }

      // State
      if (stateOfPerformance.trim()) {
        arr = arr.filter(o =>
          (o.placeOfPerformance?.state?.code || '').toUpperCase() === stateOfPerformance.toUpperCase()
        )
      }

      // Procurement Type
      if (procurementType.trim()) {
        arr = arr.filter(o =>
          (o.type || '').toLowerCase().startsWith(procurementType.toLowerCase()) ||
          (o.baseType || '').toLowerCase().startsWith(procurementType.toLowerCase())
        )
      }

      // Solicitation number
      if (solicitationNumber.trim()) {
        arr = arr.filter(o =>
          (o.solicitationNumber || '').toLowerCase().includes(solicitationNumber.trim().toLowerCase())
        )
      }

      // Organization code
      if (organizationCode.trim()) {
        arr = arr.filter(o =>
          (o.organizationId || '').toLowerCase().includes(organizationCode.trim().toLowerCase())
        )
      }

      // Posted date (from)
      if (advPostedAfter) {
        const from = new Date(advPostedAfter).getTime()
        arr = arr.filter(o => {
          const d = new Date(o.postedDate || 0).getTime()
          return d >= from
        })
      }

      // Response deadline (up to)
      if (advResponseDeadline) {
        const to = new Date(advResponseDeadline).getTime()
        arr = arr.filter(o => {
          const d = new Date(o.responseDeadLine || 0).getTime()
          return d <= to
        })
      }
    } else {
      // Filter by active/inactive subset pill only
      if (activeFilter !== null) {
        arr = arr.filter(o => {
          const isActiveOpp = o.active === "Yes" || o.active === "true" || o.active === (true as any)
          return activeFilter === "true" ? isActiveOpp : !isActiveOpp
        })
      }
    }

    // Apply sorting (always)
    arr.sort((a, b) => {
      let aVal, bVal
      const [field, direction] = sortBy.split('-')
      switch (field) {
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
          return 0
      }
      return direction === 'asc' ? aVal - bVal : bVal - aVal
    })

    return arr
  }, [results, sortBy, activeFilter, advancedApplied,
      advKeywords, advPostedAfter, advResponseDeadline,
      agency, setAside, naics, classificationCode, stateOfPerformance,
      procurementType, opportunityStatus, solicitationNumber, organizationCode])

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

  // Status breakdown counts from the full loaded set (not filteredResults)
  // so pills always show accurate totals regardless of selection
  const statusCounts = useMemo(() => {
    const active = results.filter(o => o.active === "Yes" || o.active === "true" || o.active === (true as any)).length
    const inactive = results.length - active
    return { active, inactive, all: results.length }
  }, [results])

  // Performance monitoring
  useEffect(() => {
    if (loading) {
      const startTime = performance.now();
      return () => {
        const endTime = performance.now();
        console.log(`Search took ${endTime - startTime}ms`);
        // Could send to analytics here
      };
    }
  }, [loading]);

  return (
    <SearchErrorBoundary>
      <main style={{ fontFamily: 'Aptos, sans-serif', fontSize: '18px' }} className="min-h-screen bg-white text-gray-900">
        <div className="fixed inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
        <div className="relative z-10 w-full px-3 sm:px-6 lg:px-10 xl:px-12 py-4 sm:py-6 lg:py-10">
          <div className="w-full max-w-full sm:max-w-[95%] lg:max-w-[90%] xl:max-w-[85%] mx-auto">

          {/* Welcome Banner for Authenticated Users */}
          
          <ProfileCompletionReminder />
          {/* Enhanced Welcome Banner - MORE PROMINENT */}
          <div className="mb-6 rounded-2xl border-2 border-blue-400 bg-gradient-to-r from-white to-blue-50 px-6 py-5 shadow-lg">
            <div className="flex flex-wrap items-center gap-4">
              {/* Icon + title */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-md">
                  <Search className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 style={{ fontFamily: 'Aptos, sans-serif' }} className="text-xl font-bold text-gray-900 leading-none flex items-center gap-2">
                    Welcome to Precise Govcon Bid Search
                    <span className="px-2 py-1 text-xs font-bold bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-full shadow-sm">
                      Pro
                    </span>
                  </h1>
                  <p style={{ fontFamily: 'Aptos, sans-serif' }} className="text-sm text-gray-700 mt-1 font-semibold">
                    Find, analyze, and track federal contracting opportunities
                  </p>
                </div>
              </div>

              {/* Feature dots — visible on medium screens and up */}
              <div className="hidden md:flex items-center gap-4 text-sm text-gray-700 font-semibold">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-blue-600 inline-block" />
                  Real-time SAM.gov
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-blue-600 inline-block" />
                  Advanced filtering
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-blue-600 inline-block" />
                  Export ready
                </span>
              </div>

              {/* Buttons — pushed to the right */}
              <div className="flex items-center gap-2 ml-auto flex-wrap">
                <button
                  onClick={() => handleOpenSaveModal('save')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold hover:shadow-lg transition-all text-sm"
                  aria-label="Save current search"
                >
                  <Save className="h-4 w-4 flex-shrink-0" />
                  Save Search
                </button>

                <button
                  onClick={() => handleOpenSaveModal('alert')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold hover:shadow-lg transition-all text-sm"
                  aria-label="Create email alert"
                >
                  <Bell className="h-4 w-4 flex-shrink-0" />
                  Create Alert
                </button>

                <Link href="/alerts">
                  <button
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-white font-bold hover:bg-amber-600 hover:shadow-lg transition-all text-sm"
                    aria-label="Manage alerts"
                  >
                    <Settings className="h-4 w-4 flex-shrink-0" />
                    Manage Alerts
                  </button>
                </Link>

                <Link href="/dashboard">
                  <button
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-gray-900 border-2 border-gray-400 font-bold hover:bg-gray-50 hover:shadow-lg transition-all text-sm"
                    aria-label="View dashboard"
                  >
                    <BarChart3 className="h-4 w-4 flex-shrink-0" />
                    Dashboard
                  </button>
                </Link>
              </div>
            </div>
            
            {/* Results Analytics - Interactive with Expandable Lists */}
            {filteredResults.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                  <PieChart className="h-5 w-5 text-white" />
                  <span className="text-lg font-semibold text-gray-900">Results Breakdown</span>
                  <span className="ml-auto text-base text-gray-900 font-medium">
                    {summaryStats.total.toLocaleString()} total records
                  </span>
                </div>

                {/* AI-Powered Analytics */}
                {filteredResults.length > 0 && (
                  <AIAnalytics 
                    opportunities={filteredResults}
                    filters={{
                      setAside,
                      procurementType,
                      naics,
                      agency
                    }}
                  />
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Set-Asides Breakdown - INTERACTIVE */}
                  <div className="rounded-xl border border-gray-200 bg-white/6 p-4 hover:border-gray-300 transition-colors">
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="h-4 w-4 text-white" />
                      <h4 className="font-semibold text-white/85">Set-Asides</h4>
                    </div>
                    <div className="space-y-2">
                      <button
                        onClick={() => setExpandedBreakdown(expandedBreakdown === 'setAsides' ? null : 'setAsides')}
                        className="w-full text-left hover:bg-white/6 rounded-lg p-2 -m-2 transition-colors group"
                        aria-label={expandedBreakdown === 'setAsides' ? 'Collapse set-asides breakdown' : 'Expand set-asides breakdown'}
                      >
                        <div className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                          {summaryStats.uniqueSetAsides}
                          <ChevronDown className={`h-4 w-4 text-gray-600 transition-transform ${expandedBreakdown === 'setAsides' ? 'rotate-180' : ''}`} />
                        </div>
                        <div className="text-xs text-gray-600">
                          {expandedBreakdown === 'setAsides' ? 'Click to collapse' : 'Click to expand all'}
                        </div>
                      </button>
                      <div className={`space-y-1.5 overflow-y-auto transition-all ${expandedBreakdown === 'setAsides' ? 'max-h-96' : 'max-h-32'}`}>
                        {(expandedBreakdown === 'setAsides' ? summaryStats.topSetAsides : summaryStats.topSetAsides.slice(0, 5)).map(([name, count]) => (
                          <button
                            key={name}
                            onClick={() => handleBreakdownFilter('setAside', name)}
                            className="w-full flex items-center justify-between text-xs hover:bg-white/6 rounded px-2 py-1.5 transition-colors cursor-pointer group"
                            title={`Click to filter by: ${name}`}
                            aria-label={`Filter by ${name}, ${count} opportunities`}
                          >
                            <span className="text-gray-700 truncate mr-2 group-hover:text-gray-900 transition-colors">
                              {name.length > 20 ? name.substring(0, 20) + '...' : name}
                            </span>
                            <span className="text-white font-medium whitespace-nowrap flex items-center gap-1">
                              {count}
                              <Filter className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* NAICS Codes Breakdown - INTERACTIVE */}
                  <div className="rounded-xl border border-gray-200 bg-white/6 p-4 hover:border-gray-300 transition-colors">
                    <div className="flex items-center gap-2 mb-3">
                      <Tag className="h-4 w-4 text-cyan-400" />
                      <h4 className="font-semibold text-white/85">NAICS Codes</h4>
                    </div>
                    <div className="space-y-2">
                      <button
                        onClick={() => setExpandedBreakdown(expandedBreakdown === 'naics' ? null : 'naics')}
                        className="w-full text-left hover:bg-white/6 rounded-lg p-2 -m-2 transition-colors group"
                        aria-label={expandedBreakdown === 'naics' ? 'Collapse NAICS breakdown' : 'Expand NAICS breakdown'}
                      >
                        <div className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                          {summaryStats.uniqueNaics}
                          <ChevronDown className={`h-4 w-4 text-gray-600 transition-transform ${expandedBreakdown === 'naics' ? 'rotate-180' : ''}`} />
                        </div>
                        <div className="text-xs text-gray-600">
                          {expandedBreakdown === 'naics' ? 'Click to collapse' : 'Click to expand all'}
                        </div>
                      </button>
                      <div className={`space-y-1.5 overflow-y-auto transition-all ${expandedBreakdown === 'naics' ? 'max-h-96' : 'max-h-32'}`}>
                        {(expandedBreakdown === 'naics' ? summaryStats.topNaics : summaryStats.topNaics.slice(0, 5)).map(([code, count]) => (
                          <button
                            key={code}
                            onClick={() => handleBreakdownFilter('naics', code)}
                            className="w-full flex items-center justify-between text-xs hover:bg-white/6 rounded px-2 py-1.5 transition-colors cursor-pointer group"
                            title={`Click to filter by NAICS: ${code}`}
                            aria-label={`Filter by NAICS ${code}, ${count} opportunities`}
                          >
                            <span className="text-gray-700 font-mono group-hover:text-gray-900 transition-colors">{code}</span>
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
                  <div className="rounded-xl border border-gray-200 bg-white/6 p-4 hover:border-gray-300 transition-colors">
                    <div className="flex items-center gap-2 mb-3">
                      <Building2 className="h-4 w-4 text-white" />
                      <h4 className="font-semibold text-white/85">Agencies</h4>
                    </div>
                    <div className="space-y-2">
                      <button
                        onClick={() => setExpandedBreakdown(expandedBreakdown === 'agencies' ? null : 'agencies')}
                        className="w-full text-left hover:bg-white/6 rounded-lg p-2 -m-2 transition-colors group"
                        aria-label={expandedBreakdown === 'agencies' ? 'Collapse agencies breakdown' : 'Expand agencies breakdown'}
                      >
                        <div className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                          {summaryStats.uniqueAgencies}
                          <ChevronDown className={`h-4 w-4 text-gray-600 transition-transform ${expandedBreakdown === 'agencies' ? 'rotate-180' : ''}`} />
                        </div>
                        <div className="text-xs text-gray-600">
                          {expandedBreakdown === 'agencies' ? 'Click to collapse' : 'Click to expand all'}
                        </div>
                      </button>
                      <div className={`space-y-1.5 overflow-y-auto transition-all ${expandedBreakdown === 'agencies' ? 'max-h-96' : 'max-h-32'}`}>
                        {(expandedBreakdown === 'agencies' ? summaryStats.topAgencies : summaryStats.topAgencies.slice(0, 5)).map(([name, count]) => (
                          <button
                            key={name}
                            onClick={() => handleBreakdownFilter('agency', name)}
                            className="w-full flex items-center justify-between text-xs hover:bg-white/6 rounded px-2 py-1.5 transition-colors cursor-pointer group"
                            title={`Click to filter by agency: ${name}`}
                            aria-label={`Filter by ${name}, ${count} opportunities`}
                          >
                            <span className="text-gray-700 truncate mr-2 group-hover:text-gray-900 transition-colors">
                              {name.length > 20 ? name.substring(0, 20) + '...' : name}
                            </span>
                            <span className="text-white font-medium whitespace-nowrap flex items-center gap-1">
                              {count}
                              <Filter className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* States Breakdown - INTERACTIVE */}
                  <div className="rounded-xl border border-gray-200 bg-white/6 p-4 hover:border-gray-300 transition-colors">
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="h-4 w-4 text-white" />
                      <h4 className="font-semibold text-white/85">States</h4>
                    </div>
                    <div className="space-y-2">
                      <button
                        onClick={() => setExpandedBreakdown(expandedBreakdown === 'states' ? null : 'states')}
                        className="w-full text-left hover:bg-white/6 rounded-lg p-2 -m-2 transition-colors group"
                        aria-label={expandedBreakdown === 'states' ? 'Collapse states breakdown' : 'Expand states breakdown'}
                      >
                        <div className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                          {summaryStats.uniqueStates}
                          <ChevronDown className={`h-4 w-4 text-gray-600 transition-transform ${expandedBreakdown === 'states' ? 'rotate-180' : ''}`} />
                        </div>
                        <div className="text-xs text-gray-600">
                          {expandedBreakdown === 'states' ? 'Click to collapse' : 'Click to expand all'}
                        </div>
                      </button>
                      <div className={`space-y-1.5 overflow-y-auto transition-all ${expandedBreakdown === 'states' ? 'max-h-96' : 'max-h-32'}`}>
                        {(expandedBreakdown === 'states' ? summaryStats.topStates : summaryStats.topStates.slice(0, 5)).map(([code, count]) => (
                          <button
                            key={code}
                            onClick={() => handleBreakdownFilter('state', code)}
                            className="w-full flex items-center justify-between text-xs hover:bg-white/6 rounded px-2 py-1.5 transition-colors cursor-pointer group"
                            title={`Click to filter by state: ${code}`}
                            aria-label={`Filter by ${code}, ${count} opportunities`}
                          >
                            <span className="text-gray-700 font-medium group-hover:text-gray-900 transition-colors">{code}</span>
                            <span className="text-white font-medium flex items-center gap-1">
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
              icon={<TrendingUp className="h-5 w-5 text-white" />}
              onClick={scrollToResults}
              loading={loading}
            />
            
            <StatCard 
              label="Urgent (=7 days)" 
              value={summaryStats.urgentCount.toLocaleString()}
              icon={<AlertTriangle className="h-5 w-5 text-white" />}
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
              icon={<Target className="h-5 w-5 text-white" />}
              onClick={() => {
                setSetAside('SBA')
                // User needs to click search button
              }}
              loading={loading}
            />
            
            <StatCard 
              label="Saved Opportunities" 
              value={summaryStats.savedCount.toLocaleString()}
              icon={<BookmarkCheck className="h-5 w-5 text-white" />}
              onClick={() => router.push('/alerts?tab=searches')}
              loading={loading}
            />
          </div>

          {/* ✅ QUICK DATE LOOKUP — standalone card above Advanced Filters */}
          <QuickDateLookup
            keywords={keywords}
            setKeywords={setKeywords}
            postedAfter={postedAfter}
            setPostedAfter={setPostedAfter}
            responseDeadlineBefore={responseDeadlineBefore}
            setResponseDeadlineBefore={setResponseDeadlineBefore}
            onRunSearch={() => runSearch(false)}
            onStopSearch={stopSearch}
            onReset={resetAll}
            loading={loading}
            searchDuration={searchDuration}
            onSaveSearch={() => handleOpenSaveModal('save')}
            onCreateAlert={() => handleOpenSaveModal('alert')}
          />

          {/* Enhanced Search Filters - IMPROVED COMPACT VERSION */}
          <div ref={filtersRef} className="mb-4 rounded-lg border-2 border-lime-400 bg-white shadow-lg p-3 sm:p-4">
            <div className="flex items-center justify-between gap-3 mb-3 pb-2 border-b-2 border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-gradient-to-br from-lime-500 to-emerald-500 shadow-lg">
                  <SlidersHorizontal className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 style={{ fontFamily: 'Aptos, sans-serif' }} className="text-2xl font-bold text-green-900 uppercase tracking-wide">Advanced Search Filters</h2>
                  <p style={{ fontFamily: 'Aptos, sans-serif' }} className="text-sm font-semibold text-gray-700">Refine your search with detailed filters</p>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                icon={showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                aria-label={showFilters ? 'Hide filters' : 'Show filters'}
              >
                {showFilters ? 'Hide' : 'Show'}
              </Button>
            </div>

            {showFilters && (
              <div className="space-y-3">

                {/* Flow status banner */}
                {advancedApplied ? (
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-bold shadow">
                    <CheckCircle className="h-4 w-4 flex-shrink-0" />
                    <span>Advanced filters active — showing {filteredResults.length.toLocaleString()} of {results.length.toLocaleString()} results.</span>
                  </div>
                ) : results.length > 0 ? (
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-bold shadow">
                    <Info className="h-4 w-4 flex-shrink-0" />
                    <span>{results.length.toLocaleString()} results loaded. Set filters below then click <span className="underline">APPLY ADVANCED FILTERS</span> — no extra API call.</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 px-6 py-5 rounded-xl text-white shadow-lg" style={{ background: 'linear-gradient(90deg, #1e40af 0%, #1e3a8a 100%)' }}>
                    <Info className="h-7 w-7 flex-shrink-0 text-blue-200" />
                    <span className="flex-1 text-lg font-bold leading-snug">
                      Set any filters below and click <span className="underline font-extrabold text-yellow-300">RUN ADVANCED SEARCH</span> to query SAM.gov directly — or use Quick Search above first to load results and filter them here.
                    </span>
                  </div>
                )}

                {/* Advanced Filters — 6 columns × 2 rows */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">

                  {/* ── ROW 1 — Keywords + dates with quick-fills first, then remaining ── */}

                  {/* 1. Keywords */}
                  <div>
                    <label style={{ fontFamily: 'Aptos, sans-serif' }} className="block text-base font-bold text-gray-900 mb-2">Keywords</label>
                    <div onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyAdvancedFilters() } }} className="relative">
                      <Input
                        value={advKeywords}
                        onChange={setAdvKeywords}
                        placeholder="e.g., 'Data Analytics'"
                        icon={<Search className="h-4 w-4" />}
                      />
                    </div>
                  </div>

                  {/* 2. Posted Date — with quick-fill month buttons */}
                  <div>
                    <label style={{ fontFamily: 'Aptos, sans-serif' }} className="block text-base font-bold text-gray-900 mb-2">Solicitation Posted Date</label>
                    <input
                      type="date"
                      value={advPostedAfter}
                      onChange={(e) => setAdvPostedAfter(e.target.value)}
                      className="w-full px-4 py-2.5 text-base font-semibold rounded-lg bg-white border-2 border-gray-300 text-gray-900 hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 mb-2"
                      aria-label="Posted after date"
                    />
                    <div style={{ fontFamily: 'Aptos, sans-serif' }} className="text-xs font-bold text-gray-600 mb-1">POSTED WITHIN:</div>
                    <div className="flex flex-wrap gap-1">
                      {([['1 Mo', -1, 'from-blue-500 to-cyan-500'], ['3 Mo', -3, 'from-indigo-500 to-purple-500'], ['6 Mo', -6, 'from-violet-500 to-purple-500'], ['9 Mo', -9, 'from-purple-500 to-pink-500'], ['12 Mo', -12, 'from-slate-600 to-slate-800']] as [string, number, string][]).map(([label, months, color]) => (
                        <button
                          key={label}
                          type="button"
                          onClick={() => {
                            const d = new Date()
                            d.setMonth(d.getMonth() + months)
                            setAdvPostedAfter(d.toISOString().split('T')[0])
                          }}
                          className={`px-2.5 py-1 text-xs font-bold bg-gradient-to-r ${color} text-white rounded-lg hover:shadow-md transition-all`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3. Response Deadline — with quick-fill month buttons */}
                  <div>
                    <label style={{ fontFamily: 'Aptos, sans-serif' }} className="block text-base font-bold text-gray-900 mb-2">Response Deadline</label>
                    <input
                      type="date"
                      value={advResponseDeadline}
                      onChange={(e) => setAdvResponseDeadline(e.target.value)}
                      className="w-full px-4 py-2.5 text-base font-semibold rounded-lg bg-white border-2 border-gray-300 text-gray-900 hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 mb-2"
                      aria-label="Response deadline date filter"
                    />
                    <div style={{ fontFamily: 'Aptos, sans-serif' }} className="text-xs font-bold text-gray-600 mb-1">DEADLINE WITHIN:</div>
                    <div className="flex flex-wrap gap-1">
                      {([['1 Mo', 1, 'from-rose-500 to-pink-500'], ['3 Mo', 3, 'from-orange-500 to-amber-500'], ['6 Mo', 6, 'from-amber-500 to-yellow-500'], ['9 Mo', 9, 'from-emerald-500 to-teal-500'], ['12 Mo', 12, 'from-cyan-500 to-blue-500']] as [string, number, string][]).map(([label, months, color]) => (
                        <button
                          key={label}
                          type="button"
                          onClick={() => {
                            const d = new Date()
                            d.setMonth(d.getMonth() + months)
                            setAdvResponseDeadline(d.toISOString().split('T')[0])
                          }}
                          className={`px-2.5 py-1 text-xs font-bold bg-gradient-to-r ${color} text-white rounded-lg hover:shadow-md transition-all`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 4. Set-Aside */}
                  <div>
                    <label style={{ fontFamily: 'Aptos, sans-serif' }} className="block text-base font-bold text-gray-900 mb-2">Set-Aside</label>
                    <select
                      value={setAside}
                      onChange={(e) => setSetAside(e.target.value)}
                      className="w-full px-4 py-2.5 text-base font-semibold rounded-lg bg-white border-2 border-gray-300 text-gray-900 hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors"
                      aria-label="Set-aside type filter"
                    >
                      <option value="">Any Set-Aside</option>
                      <option value="8A">8(a) Set-Aside (FAR 19.8)</option>
                      <option value="8AN">8(a) Sole Source (FAR 19.8)</option>
                      <option value="BICiv">Buy Indian Set-Aside (IHS)</option>
                      <option value="EDWOSB">EDWOSB Set-Aside (FAR 19.15)</option>
                      <option value="EDWOSBSS">EDWOSB Sole Source (FAR 19.15)</option>
                      <option value="HZC">HUBZone Set-Aside (FAR 19.13)</option>
                      <option value="HZS">HUBZone Sole Source (FAR 19.13)</option>
                      <option value="IEE">Indian Economic Enterprise (Interior)</option>
                      <option value="ISBEE">Indian Small Business EE (Interior)</option>
                      <option value="LAS">Local Area Set-Aside (FAR 26.2)</option>
                      <option value="SBA">Total Small Business (FAR 19.5)</option>
                      <option value="SBP">Partial Small Business (FAR 19.5)</option>
                      <option value="SDVOSBC">SDVOSB Set-Aside (FAR 19.14)</option>
                      <option value="SDVOSBS">SDVOSB Sole Source (FAR 19.14)</option>
                      <option value="VSA">Veteran-Owned SB Set-Aside (VA)</option>
                      <option value="VSS">Veteran-Owned SB Sole Source (VA)</option>
                      <option value="WOSB">WOSB Set-Aside (FAR 19.15)</option>
                      <option value="WOSBSS">WOSB Sole Source (FAR 19.15)</option>
                    </select>
                  </div>

                  {/* 5. Status */}
                  <div>
                    <label style={{ fontFamily: 'Aptos, sans-serif' }} className="block text-base font-bold text-gray-900 mb-2">Status</label>
                    <select
                      value={opportunityStatus}
                      onChange={(e) => setOpportunityStatus(e.target.value)}
                      className="w-full px-4 py-2.5 text-base font-semibold rounded-lg bg-white border-2 border-gray-300 text-gray-900 hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors"
                      aria-label="Opportunity status filter"
                    >
                      <option value="">All Statuses</option>
                      <option value="active">Active</option>
                      <option value="archived">Archived</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="deleted">Deleted</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>

                  {/* 6. State / Territory */}
                  <div>
                    <label style={{ fontFamily: 'Aptos, sans-serif' }} className="block text-base font-bold text-gray-900 mb-2">State / Territory</label>
                    <select
                      value={stateOfPerformance}
                      onChange={(e) => setStateOfPerformance(e.target.value)}
                      className="w-full px-4 py-2.5 text-base font-semibold rounded-lg bg-white border-2 border-gray-300 text-gray-900 hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors"
                      aria-label="State filter"
                    >
                      {US_STATES.map(state => (
                        <option key={state.value} value={state.value}>{state.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* ── ROW 2 ── */}

                  {/* 7. Procurement Type */}
                  <div>
                    <label style={{ fontFamily: 'Aptos, sans-serif' }} className="block text-base font-bold text-gray-900 mb-2">Procurement Type</label>
                    <select
                      value={procurementType}
                      onChange={(e) => setProcurementType(e.target.value)}
                      className="w-full px-4 py-2.5 text-base font-semibold rounded-lg bg-white border-2 border-gray-300 text-gray-900 hover:border-blue-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors"
                      aria-label="Procurement type filter"
                    >
                      <option value="">All Types</option>
                      <option value="a">Award Notice</option>
                      <option value="k">Combined Synopsis/Solicitation</option>
                      <option value="i">Intent to Bundle (DoD)</option>
                      <option value="u">Justification (J&amp;A)</option>
                      <option value="p">Pre-Solicitation</option>
                      <option value="g">Sale of Surplus Property</option>
                      <option value="o">Solicitation</option>
                      <option value="s">Special Notice</option>
                      <option value="r">Sources Sought</option>
                    </select>
                  </div>

                  {/* 8. Agency / Department */}
                  <div>
                    <label style={{ fontFamily: 'Aptos, sans-serif' }} className="block text-base font-bold text-gray-900 mb-2">Agency / Department</label>
                    <Input
                      value={agency}
                      onChange={setAgency}
                      placeholder="e.g., Dept of Defense"
                      icon={<Building2 className="h-4 w-4" />}
                    />
                  </div>

                  {/* 9. NAICS Code */}
                  <div>
                    <label style={{ fontFamily: 'Aptos, sans-serif' }} className="block text-base font-bold text-gray-900 mb-2">NAICS Code</label>
                    <Input
                      value={naics}
                      onChange={setNaics}
                      placeholder="e.g., 541511, 541512"
                      icon={<Tag className="h-4 w-4" />}
                    />
                  </div>

                  {/* 10. PSC Code */}
                  <div>
                    <label style={{ fontFamily: 'Aptos, sans-serif' }} className="block text-base font-bold text-gray-900 mb-2">PSC Code</label>
                    <Input
                      value={classificationCode}
                      onChange={setClassificationCode}
                      placeholder="e.g., R425, 7030"
                      icon={<Layers className="h-4 w-4" />}
                    />
                  </div>

                  {/* 11. Solicitation Number */}
                  <div>
                    <label style={{ fontFamily: 'Aptos, sans-serif' }} className="block text-base font-bold text-gray-900 mb-2">Solicitation Number</label>
                    <Input
                      value={solicitationNumber}
                      onChange={setSolicitationNumber}
                      placeholder="e.g., W912DY24R0001"
                      icon={<FileText className="h-4 w-4" />}
                    />
                  </div>

                  {/* 12. Organization Code */}
                  <div>
                    <label style={{ fontFamily: 'Aptos, sans-serif' }} className="block text-base font-bold text-gray-900 mb-2">Organization Code</label>
                    <Input
                      value={organizationCode}
                      onChange={setOrganizationCode}
                      placeholder="e.g., DOD, HHS"
                      icon={<Building className="h-4 w-4" />}
                    />
                  </div>

                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200">
                  <button
                    onClick={applyAdvancedFilters}
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label={results.length === 0 ? 'Run SAM.gov search using advanced fields' : 'Filter loaded results with advanced fields'}
                    title={results.length === 0 ? 'Runs a new SAM.gov search using these fields' : 'Filters the already-loaded results client-side'}
                  >
                    {results.length === 0 ? (
                      <><Search className="h-4 w-4" />RUN ADVANCED SEARCH</>
                    ) : advancedApplied ? (
                      <><Filter className="h-4 w-4" />UPDATE FILTERS</>
                    ) : (
                      <><Filter className="h-4 w-4" />APPLY ADVANCED FILTERS</>
                    )}
                  </button>

                  {advancedApplied && (
                    <button
                      onClick={clearAdvancedFilters}
                      className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-lg bg-white border-2 border-gray-400 text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
                      aria-label="Clear advanced filters"
                    >
                      <X className="h-4 w-4" />
                      CLEAR FILTERS
                    </button>
                  )}

                  {/* Save Search */}
                  <button
                    onClick={() => handleOpenSaveModal('save')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:shadow-lg hover:shadow-emerald-500/25 transition-all shadow-md"
                    aria-label="Save current search"
                  >
                    <Save className="h-4 w-4" />
                    Save Search
                  </button>

                  {/* Create Alert */}
                  <button
                    onClick={() => handleOpenSaveModal('alert')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:shadow-lg hover:shadow-violet-500/25 transition-all shadow-md"
                    aria-label="Create email alert"
                  >
                    <Bell className="h-4 w-4" />
                    Create Alert
                  </button>
                  
                  <button
                    onClick={resetAll}
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm font-bold rounded-lg bg-white border-2 border-gray-400 hover:bg-gray-50 text-gray-900 transition-all shadow-sm disabled:opacity-50"
                    aria-label="Reset all filters"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Reset All
                  </button>
                  
                  {/* Export/Share Dropdown */}
                  <div className="ml-auto relative">
                    <button
                      onClick={() => setShowExportMenu(!showExportMenu)}
                      disabled={!filteredResults.length || loading}
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm font-bold rounded-lg bg-white border-2 border-gray-400 hover:bg-gray-50 text-gray-900 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Export and share options"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      Export / Share
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {showExportMenu && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                        <div className="px-3 py-2 border-b border-gray-200">
                          <p className="text-xs font-bold text-gray-900">Export Results</p>
                          <p className="text-xs text-gray-500">Download in your preferred format</p>
                        </div>
                        
                        <button
                          onClick={() => { exportCsv(); setShowExportMenu(false); }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                        >
                          <Download className="h-4 w-4 text-green-600" />
                          <div>
                            <div className="font-semibold">CSV</div>
                            <div className="text-xs text-gray-500">Excel-compatible spreadsheet</div>
                          </div>
                        </button>
                        
                        <button
                          onClick={() => { exportJson(); setShowExportMenu(false); }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                        >
                          <Download className="h-4 w-4 text-blue-600" />
                          <div>
                            <div className="font-semibold">JSON</div>
                            <div className="text-xs text-gray-500">For developers & integrations</div>
                          </div>
                        </button>
                        
                        <button
                          onClick={() => { exportTxt(); setShowExportMenu(false); }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                        >
                          <FileText className="h-4 w-4 text-gray-600" />
                          <div>
                            <div className="font-semibold">TXT</div>
                            <div className="text-xs text-gray-500">Plain text file</div>
                          </div>
                        </button>
                        
                        <button
                          onClick={() => { exportXml(); setShowExportMenu(false); }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                        >
                          <FileText className="h-4 w-4 text-orange-600" />
                          <div>
                            <div className="font-semibold">XML</div>
                            <div className="text-xs text-gray-500">Structured data format</div>
                          </div>
                        </button>
                        
                        <div className="border-t border-gray-200 my-1"></div>
                        
                        <button
                          onClick={() => { exportEmail(); setShowExportMenu(false); }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                        >
                          <MessageSquare className="h-4 w-4 text-cyan-600" />
                          <div>
                            <div className="font-semibold">Email Results</div>
                            <div className="text-xs text-gray-500">Send via email</div>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                {error && (
                  <div className="rounded-lg border border-amber-300 bg-amber-50 p-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="text-amber-900 font-semibold text-sm">Search Limitation</div>
                        <div className="text-amber-700 text-xs">{error}</div>
                        <button
                          onClick={() => setError(null)}
                          className="mt-2 px-3 py-1 rounded-lg border border-amber-400 hover:bg-amber-100 text-amber-700 font-semibold text-xs transition-colors"
                          aria-label="Dismiss error"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Results Section */}
          <div ref={resultsRef} className="rounded-3xl border border-gray-200 bg-white p-3 sm:p-6">
            {/* Results Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
              <div className="flex flex-col gap-3 flex-1">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 shadow-md">
                    <Database className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Search Results</h2>
                    {!data && !loading && (
                      <p className="text-base text-gray-900 font-medium mt-0.5">Set filters and click "Search Opportunities" to see results</p>
                    )}
                  </div>
                  {loading && (
                    <div className="flex items-center gap-1.5 text-base text-gray-900 font-medium ml-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Searching...
                    </div>
                  )}
                </div>

                {/* 💡 Save & Subscribe Prompt Banner */}
                {data && filteredResults.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm" data-save-prompt>
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-600 rounded-lg flex-shrink-0">
                        <Bell className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                            Found opportunities you like?
                          </h3>
                          <button
                            onClick={() => {
                              const banner = document.querySelector('[data-save-prompt]');
                              if (banner) (banner as HTMLElement).style.display = 'none';
                            }}
                            className="text-gray-400 hover:text-gray-600 flex-shrink-0 p-0.5 rounded"
                            title="Dismiss"
                            aria-label="Dismiss save prompt"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mb-3">
                          Save this search to get automatic email alerts when new matching opportunities appear.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => {
                              if (!requireAccess("Save Searches")) return;
                              const params = new URLSearchParams({
                                tab: 'saved-searches',
                                title: keywords.trim(),
                                naics: naics.trim(),
                                agency: agency.trim(),
                                setAside: setAside.trim(),
                                state: stateOfPerformance.trim(),
                                ptype: procurementType,
                                status: opportunityStatus.trim(),
                                solnum: solicitationNumber.trim(),
                                noticeid: noticeId.trim(),
                                ccode: classificationCode.trim(),
                                zip: placeOfPerformanceZip.trim(),
                                organizationCode: organizationCode.trim(),
                                postedFrom: postedAfter.trim(),
                                postedTo: postedBefore.trim(),
                                rdlfrom: responseDeadline.trim(),
                              });
                              const filteredParams = new URLSearchParams();
                              for (const [key, value] of params.entries()) {
                                if (value) filteredParams.set(key, value);
                              }
                              window.location.href = `/alerts?${filteredParams.toString()}`;
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
                            aria-label="Save this search"
                          >
                            <Save className="h-3.5 w-3.5" />
                            Save This Search
                          </button>
                          <button
                            onClick={() => {
                              if (!requireAccess("Manage Alerts")) return;
                              window.location.href = '/alerts?tab=subscriptions';
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold transition-colors"
                            aria-label="Manage subscriptions"
                          >
                            <Bell className="h-3.5 w-3.5" />
                            Manage Subscriptions
                          </button>
                          <button
                            onClick={() => { window.location.href = '/alerts'; }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold transition-colors"
                            aria-label="Manage your alerts and subscriptions"
                          >
                            <Bell className="h-3.5 w-3.5" />
                            Manage Alerts
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Search Parameters Summary — always visible when results exist ── */}
                {data && (
                  <div className="rounded-xl border-2 border-blue-800 bg-blue-900 shadow-lg p-5">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <Search className="h-5 w-5 text-blue-300 flex-shrink-0" />
                      <span className="text-base font-extrabold text-white uppercase tracking-widest">
                        {advancedApplied ? 'Quick Search + Advanced Filters Applied' : 'Quick Search Parameters'}
                      </span>
                      {advancedApplied && (
                        <span className="ml-auto px-3 py-1 rounded-full bg-emerald-500 text-white text-sm font-extrabold whitespace-nowrap">
                          FILTERED: {filteredResults.length} of {results.length}
                        </span>
                      )}
                    </div>

                    {/* ── SECTION 1: Quick Search fields — always shown ── */}
                    <div className="flex flex-wrap gap-3 mb-3">

                      {/* Keyword */}
                      <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-700 border-2 border-blue-500">
                        <Search className="h-4 w-4 text-blue-200 flex-shrink-0" />
                        <span className="text-sm font-extrabold text-blue-200 uppercase tracking-wide">Keyword:</span>
                        <span className="text-base font-extrabold text-white">
                          {keywords ? `"${keywords}"` : <span className="text-blue-300 italic font-semibold">Any</span>}
                        </span>
                      </div>

                      {/* Posted From */}
                      <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-700 border-2 border-blue-500">
                        <Calendar className="h-4 w-4 text-blue-200 flex-shrink-0" />
                        <span className="text-sm font-extrabold text-blue-200 uppercase tracking-wide">Posted From:</span>
                        <span className="text-base font-extrabold text-white">
                          {postedAfter ? formatDate(postedAfter) : <span className="text-blue-300 italic font-semibold">Any</span>}
                        </span>
                      </div>

                      {/* Submission Deadline */}
                      <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-700 border-2 border-amber-500">
                        <Clock className="h-4 w-4 text-amber-200 flex-shrink-0" />
                        <span className="text-sm font-extrabold text-amber-200 uppercase tracking-wide">Deadline By:</span>
                        <span className="text-base font-extrabold text-white">
                          {responseDeadlineBefore ? formatDate(responseDeadlineBefore) : <span className="text-amber-300 italic font-semibold">Any</span>}
                        </span>
                      </div>

                    </div>

                    {/* ── SECTION 2: Advanced filters — only shown when applied ── */}
                    {advancedApplied && (
                      <>
                        <div className="border-t-2 border-emerald-700 my-3" />
                        <div className="text-sm font-extrabold text-emerald-300 uppercase tracking-widest mb-3">Advanced Filters Active</div>
                        <div className="flex flex-wrap gap-3">

                          {advKeywords && advKeywords !== keywords && (
                            <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-700 border-2 border-emerald-500">
                              <Search className="h-4 w-4 text-emerald-200 flex-shrink-0" />
                              <span className="text-sm font-extrabold text-emerald-200 uppercase tracking-wide">Keyword:</span>
                              <span className="text-base font-extrabold text-white">"{advKeywords}"</span>
                            </div>
                          )}
                          {advPostedAfter && advPostedAfter !== postedAfter && (
                            <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-700 border-2 border-emerald-500">
                              <Calendar className="h-4 w-4 text-emerald-200 flex-shrink-0" />
                              <span className="text-sm font-extrabold text-emerald-200 uppercase tracking-wide">Posted From:</span>
                              <span className="text-base font-extrabold text-white">{formatDate(advPostedAfter)}</span>
                            </div>
                          )}
                          {advResponseDeadline && (
                            <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-700 border-2 border-emerald-500">
                              <Clock className="h-4 w-4 text-emerald-200 flex-shrink-0" />
                              <span className="text-sm font-extrabold text-emerald-200 uppercase tracking-wide">Deadline By:</span>
                              <span className="text-base font-extrabold text-white">{formatDate(advResponseDeadline)}</span>
                            </div>
                          )}
                          {agency && (
                            <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-700 border-2 border-emerald-500">
                              <Building2 className="h-4 w-4 text-emerald-200 flex-shrink-0" />
                              <span className="text-sm font-extrabold text-emerald-200 uppercase tracking-wide">Agency:</span>
                              <span className="text-base font-extrabold text-white">{agency}</span>
                            </div>
                          )}
                          {setAside && (
                            <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-700 border-2 border-emerald-500">
                              <Shield className="h-4 w-4 text-emerald-200 flex-shrink-0" />
                              <span className="text-sm font-extrabold text-emerald-200 uppercase tracking-wide">Set-Aside:</span>
                              <span className="text-base font-extrabold text-white">{SET_ASIDE_LABEL_BY_CODE[setAside] || setAside}</span>
                            </div>
                          )}
                          {naics && (
                            <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-700 border-2 border-emerald-500">
                              <Tag className="h-4 w-4 text-emerald-200 flex-shrink-0" />
                              <span className="text-sm font-extrabold text-emerald-200 uppercase tracking-wide">NAICS:</span>
                              <span className="text-base font-extrabold text-white">{naics}</span>
                            </div>
                          )}
                          {classificationCode && (
                            <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-700 border-2 border-emerald-500">
                              <Layers className="h-4 w-4 text-emerald-200 flex-shrink-0" />
                              <span className="text-sm font-extrabold text-emerald-200 uppercase tracking-wide">PSC:</span>
                              <span className="text-base font-extrabold text-white">{classificationCode}</span>
                            </div>
                          )}
                          {stateOfPerformance && (
                            <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-700 border-2 border-emerald-500">
                              <MapPin className="h-4 w-4 text-emerald-200 flex-shrink-0" />
                              <span className="text-sm font-extrabold text-emerald-200 uppercase tracking-wide">State:</span>
                              <span className="text-base font-extrabold text-white">{US_STATES.find(s => s.value === stateOfPerformance)?.label || stateOfPerformance}</span>
                            </div>
                          )}
                          {procurementType && (
                            <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-700 border-2 border-emerald-500">
                              <FileText className="h-4 w-4 text-emerald-200 flex-shrink-0" />
                              <span className="text-sm font-extrabold text-emerald-200 uppercase tracking-wide">Type:</span>
                              <span className="text-base font-extrabold text-white">{procurementType}</span>
                            </div>
                          )}
                          {opportunityStatus && (
                            <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-700 border-2 border-emerald-500">
                              <CheckCircle className="h-4 w-4 text-emerald-200 flex-shrink-0" />
                              <span className="text-sm font-extrabold text-emerald-200 uppercase tracking-wide">Status:</span>
                              <span className="text-base font-extrabold text-white capitalize">{opportunityStatus}</span>
                            </div>
                          )}
                          {solicitationNumber && (
                            <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-700 border-2 border-emerald-500">
                              <Hash className="h-4 w-4 text-emerald-200 flex-shrink-0" />
                              <span className="text-sm font-extrabold text-emerald-200 uppercase tracking-wide">Sol #:</span>
                              <span className="text-base font-extrabold text-white">{solicitationNumber}</span>
                            </div>
                          )}
                          {organizationCode && (
                            <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-700 border-2 border-emerald-500">
                              <Building className="h-4 w-4 text-emerald-200 flex-shrink-0" />
                              <span className="text-sm font-extrabold text-emerald-200 uppercase tracking-wide">Org Code:</span>
                              <span className="text-base font-extrabold text-white">{organizationCode}</span>
                            </div>
                          )}
                          {!advKeywords && !advPostedAfter && !advResponseDeadline && !agency && !setAside && !naics && !classificationCode && !stateOfPerformance && !procurementType && !opportunityStatus && !solicitationNumber && !organizationCode && (
                            <span className="text-base font-semibold text-emerald-300 italic">No additional advanced filters — showing all Quick Search results</span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Showing X of Y + status pills */}
                {data && results.length > 0 && (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <span className="text-sm text-gray-900">
                      Showing <span className="font-semibold text-blue-600">{filteredResults.length.toLocaleString()}</span> of <span className="font-semibold text-blue-600">{totalRecords > 0 ? totalRecords.toLocaleString() : results.length.toLocaleString()}</span> returned results
                    </span>
                    <span className="text-slate-700 hidden sm:inline">|</span>
                    {/* Status pills — only when Status filter is "All" */}
                    {isActive === '' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setActiveFilter(null)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                            activeFilter === null
                              ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                              : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-800'
                          }`}
                          aria-label="Show all opportunities"
                        >
                          All <span className={`font-normal ml-1 ${activeFilter === null ? 'text-blue-100' : 'text-gray-400'}`}>{statusCounts.all.toLocaleString()}</span>
                        </button>
                        <button
                          onClick={() => setActiveFilter('true')}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                            activeFilter === 'true'
                              ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                              : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-800'
                          }`}
                          aria-label="Show active opportunities"
                        >
                          Active <span className={`font-normal ml-1 ${activeFilter === 'true' ? 'text-emerald-100' : 'text-gray-400'}`}>{statusCounts.active.toLocaleString()}</span>
                        </button>
                        <button
                          onClick={() => setActiveFilter('false')}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                            activeFilter === 'false'
                              ? 'bg-gray-700 border-gray-700 text-white shadow-sm'
                              : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-800'
                          }`}
                          aria-label="Show inactive opportunities"
                        >
                          Inactive <span className={`font-normal ml-1 ${activeFilter === 'false' ? 'text-gray-300' : 'text-gray-400'}`}>{statusCounts.inactive.toLocaleString()}</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Results Controls - Only show when we have results */}
              {data && (
                <div className="flex flex-wrap items-center gap-3">
                  {/* Sort Controls */}
                  <div className="flex items-center gap-2">
                    <span className="text-base text-gray-900 font-medium">Sort by:</span>
                    <select 
                      value={sortBy} 
                      onChange={(e) =>
                        setSortBy(
                          e.target.value as
                            | 'posted-desc'
                            | 'posted-asc'
                            | 'deadline-desc'
                            | 'deadline-asc'
                            | 'relevance'
                        )
                      }
                      className="px-3 py-2 border-2 border-gray-400 rounded-lg bg-white text-gray-900 font-semibold"
                      aria-label="Sort results by"
                    >
                      <option value="posted-desc">Posted Date (Newest First)</option>
                      <option value="posted-asc">Posted Date (Oldest First)</option>
                      <option value="deadline-desc">Deadline (Latest First)</option>
                      <option value="deadline-asc">Deadline (Soonest First)</option>
                      <option value="relevance">Relevance</option>
                    </select>

                    <button
                      onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                      className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-100 transition-colors"
                      aria-label={sortOrder === 'asc' ? 'Sort ascending' : 'Sort descending'}
                    >
                      {sortOrder === 'asc' ? (
                        <SortAsc className="h-4 w-4 text-gray-600" />
                      ) : (
                        <SortDesc className="h-4 w-4 text-gray-600" />
                      )}
                    </button>
                  </div>
                  
                  {/* View Toggle - List and Grid */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-600 font-medium">View:</span>
                    <div className="flex items-center gap-1 p-1 rounded-lg bg-gradient-to-r from-slate-100 to-blue-100 border-2 border-blue-300">
                      <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded transition-all ${
                          viewMode === 'list' 
                            ? 'bg-white text-blue-600 shadow-sm' 
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                        title="List view"
                        aria-label="List view"
                      >
                        <List className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded transition-all ${
                          viewMode === 'grid' 
                            ? 'bg-white text-blue-600 shadow-sm' 
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                        title="Grid view"
                        aria-label="Grid view"
                      >
                        <Grid className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Active Filters - Only show after search */}
            {data && (agency || setAside || naics || stateOfPerformance) && (
              <div className="mb-6 p-6 rounded-xl border-2 border-amber-400 bg-amber-50 shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Filter className="h-6 w-6 text-amber-700" />
                    <span className="text-xl font-bold text-amber-900">Active Filters</span>
                    <span className="text-base font-semibold text-amber-800 ml-2">
                      (Update filters and click "Search" to refresh)
                    </span>
                  </div>
                  <button
                    onClick={clearAllClientFilters}
                    className="text-base text-amber-900 font-bold hover:text-amber-950 transition-colors flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-amber-200 border-2 border-amber-400"
                    aria-label="Clear all filters"
                  >
                    <X className="h-5 w-5" />
                    Clear All
                  </button>
                </div>
                <div className="flex flex-wrap gap-3">
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
                <div className="mt-3 text-base font-semibold text-amber-900">
                  After removing filters, click "Search Opportunities" to update results
                </div>
              </div>
            )}

            {/* Loading States */}
            {loading && !loadingMore && (
              <div className="py-12 text-center">
                <div className="inline-flex flex-col items-center gap-4">
                  <div className="h-12 w-12 rounded-full border-2 border-blue-600/30 border-t-blue-600 animate-spin" />
                  <div className="text-gray-600">Searching SAM.gov opportunities...</div>
                </div>
              </div>
            )}

            {/* Results - List View */}
            {!loading && filteredResults.length > 0 && viewMode === 'list' && (
              <>
                <div className="space-y-6">
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
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <div className="flex flex-col items-center gap-4">
                      <div className="text-base text-gray-900 font-medium">
                        Showing {filteredResults.length} of {totalRecords.toLocaleString()} opportunities
                      </div>
                      <Button
                        variant="primary"
                        onClick={loadMoreResults}
                        loading={loadingMore}
                        icon={<Plus className="h-5 w-5" />}
                        aria-label="Load more results"
                      >
                        {loadingMore ? 'Loading...' : `Load ${LOAD_MORE_INCREMENT} More`}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Results - Grid View */}
            {!loading && filteredResults.length > 0 && viewMode === 'grid' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-6">
                  {filteredResults.map((opp, idx) => (
                    <OpportunityCard
                      key={`${opp.noticeId || 'no-id'}-${idx}`}
                      opportunity={opp}
                      index={idx}
                      isSaved={!!saved[opp.noticeId || String(idx)]}
                      toggleSaved={(id) => toggleSaved(id)}
                      copyText={copyText}
                      copiedId={copiedId}
                    />
                  ))}
                </div>

                {/* Load More */}
                {hasMoreResults && (
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <div className="flex flex-col items-center gap-4">
                      <div className="text-lg text-gray-900 font-medium">
                        Showing {filteredResults.length} of {totalRecords.toLocaleString()} opportunities
                      </div>
                      <Button
                        variant="primary"
                        onClick={loadMoreResults}
                        loading={loadingMore}
                        icon={<Plus className="h-5 w-5" />}
                        aria-label="Load more results"
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
                  <div className="h-16 w-16 rounded-2xl border border-gray-200 bg-white flex items-center justify-center">
                    <Search className="h-8 w-8 text-slate-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No matching opportunities</h3>
                    <p className="text-gray-600">
                      Try adjusting your search filters or using different keywords.
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={resetAll}
                    icon={<RefreshCw className="h-5 w-5" />}
                    aria-label="Reset all filters"
                  >
                    Reset Filters
                  </Button>
                </div>
              </div>
            )}
          </div>

                {/* ✅ FIXED: Unified Save/Alert Modal */}
                <UnifiedSaveSearchModal
                  mode={saveModalMode}
                  isOpen={showSaveModal}
                  onClose={() => setShowSaveModal(false)}
                  searchParams={{
                    title: keywords.trim(),
                    solnum: solicitationNumber.trim(),
                    noticeid: noticeId.trim(),
                    ptype: procurementType,
                    typeOfSetAside: setAside.trim(),
                    status: opportunityStatus.trim(),
                    state: stateOfPerformance.trim(),
                    ncode: naics.trim(),
                    ccode: classificationCode.trim(),
                    zip: placeOfPerformanceZip.trim(),
                    organizationName: agency.trim(),
                    organizationCode: organizationCode.trim(),
                    postedFrom: postedAfter.trim(),
                    postedTo: postedBefore.trim(),
                    rdlfrom: responseDeadline.trim(),
                  }}
                  onSave={handleSaveSuccess}
                />


                {/* ✅ FIXED: Success Modal */}
                <SaveSearchSuccessModal
                  isOpen={showSuccessModal}
                  onClose={() => setShowSuccessModal(false)}
                  searchName={successData.searchName}
                  isSubscription={successData.isSubscription}
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
                        <div className="rounded-2xl bg-white p-8 shadow-2xl">
                          <div className="flex flex-col items-center text-center gap-4">
                            <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                              <Lock className="h-8 w-8 text-red-600" />
                            </div>
                            
                            <div>
                              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                                Session Expired
                              </h2>
                              <p className="text-slate-600 leading-relaxed">
                                Your 15-minute free browsing session has ended. Sign up or sign in to continue accessing federal contracting opportunities.
                              </p>
                            </div>

                            <div className="w-full space-y-3 mt-4">
                              <button
                                onClick={() => {
                                  setShowLockoutModal(false)
                                  setShowAccessModal(true)
                                }}
                                className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold hover:shadow-lg transition-all"
                                aria-label="Sign up now"
                              >
                                Sign Up Now
                              </button>
                              
                              <button
                                onClick={() => {
                                  setShowLockoutModal(false)
                                  setShowAccessModal(true)
                                }}
                                className="w-full px-6 py-3 rounded-xl border-2 border-slate-300 bg-white text-slate-700 font-semibold hover:bg-slate-50 transition-all"
                                aria-label="Sign in"
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
                  </div> {/* Close max-w-[85%] container */}
                </div>
              </main>
            </SearchErrorBoundary>
          )
        }


        // Suspense wrapper for useSearchParams
        export default function SearchPage() {
          return (
            <Suspense fallback={
              <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="animate-spin h-12 w-12 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
              </div>
            }>
              <SearchPageContent />
            </Suspense>
          )
        }