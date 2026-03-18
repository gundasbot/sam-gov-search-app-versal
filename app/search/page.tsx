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
import ExportSharePanel from '@/components/ExportSharePanel'
// Import verified SAM.gov constants
import {
  SET_ASIDE_OPTIONS,
  US_STATES_AND_TERRITORIES,
  PROCUREMENT_TYPE_OPTIONS,
  STATUS_OPTIONS,
  getSetAsideLabel,
  getLocationLabel,
  SET_ASIDE_CODE_BY_LABEL,
  setAsideCodesToString,
  stringToSetAsideCodes,
  locationCodesToString,
  stringToLocationCodes,
} from '@/lib/samGovConstants'
import { MultiSelectDropdown } from '@/components/MultiSelectDropdown'
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
  Home,
  ArrowRight,
} from 'lucide-react'
import AccessControlModal from '@/components/AccessControlModal'

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
        
      if (elapsed >= 1200000) {
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

      // Show reminder at 13 minutes (7 minutes left)
      if (elapsed >= 780000 && elapsed < 781000) {
        setShowReminderModal(true)
      }
      // Show lockout at 20 minutes
      if (elapsed >= 1200000) {
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
]

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
    className={`group relative rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)] transition-all duration-300 hover:shadow-[var(--shadow-md)] cursor-pointer ${
      onClick ? 'hover:scale-[1.02] active:scale-[0.98]' : ''
    }`}
  >
    {trend && (
      <div className={`absolute -top-2 -right-2 px-2 py-1 rounded-full text-xs font-bold ${
        trend > 0 
          ? 'bg-[var(--color-accent-soft)] text-[var(--color-primary)] border border-[var(--color-border)]' 
          : 'bg-red-100 text-red-900 border-2 border-red-600'
      }`}>
        {trend > 0 ? '+' : ''}{trend}%
      </div>
    )}
    <div className="flex items-center gap-3">
      <div className="rounded-xl bg-[var(--color-accent-soft)] p-3 text-[var(--color-primary)] shadow-sm">
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-xs font-bold text-[var(--color-text-secondary)]">{label}</div>
        {loading ? (
          <div className="mt-1 h-8 w-20 animate-pulse rounded-lg bg-[var(--color-surface-muted)]" />
        ) : (
          <div className="mt-1 text-2xl font-bold text-[var(--color-text-primary)]">{value}</div>
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
    default: 'bg-[var(--color-surface)] text-[var(--color-text-primary)] border border-[var(--color-border)]',
    primary: 'bg-[var(--color-accent-soft)] text-[var(--color-primary)] border-[var(--color-border)]',
    success: 'bg-[var(--color-accent-soft)] text-[var(--color-primary)] border-[var(--color-border)]',
    warning: 'bg-[var(--color-surface-muted)] text-[var(--color-text-primary)] border-[var(--color-border)]',
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
  const baseClasses = 'pg-btn inline-flex items-center justify-center font-bold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95'
  
  const variants = {
    primary: 'pg-btn-primary text-white',
    secondary: 'pg-btn-secondary',
    tertiary: 'pg-btn-tertiary',
    ghost: 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-muted)]',
    danger: 'bg-red-600 text-white border border-red-700 hover:bg-red-700',
    success: 'pg-btn-primary text-white',
  }
  
  const sizes = {
    sm: 'px-3.5 py-2 text-sm gap-1.5',
    md: 'px-4.5 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5',
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
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--color-text-secondary)]">
        {icon}
      </div>
    )}
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`pg-input w-full px-3.5 py-2.5 text-sm sm:text-base ${
        error ? 'border-red-600' : ''
      } transition-colors ${
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
      <label className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center gap-1">
        {label}
        {required && <span className="text-[var(--color-primary)]">*</span>}
      </label>
      {tooltip && (
        <button type="button" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
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
    neutral: 'bg-[var(--color-surface)] text-[var(--color-text-primary)] border border-[var(--color-border)]',
    info: 'bg-[var(--color-accent-soft)] text-[var(--color-primary)] border border-[var(--color-border)]',
    success: 'bg-[var(--color-accent-soft)] text-[var(--color-primary)] border border-[var(--color-border)]',
    warning: 'bg-[var(--color-surface-muted)] text-[var(--color-text-primary)] border border-[var(--color-border)]',
    danger: 'bg-rose-50 text-rose-700 border border-rose-300',
  }
  
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${tones[tone]}`}>
      {children}
      {onRemove && (
        <button
          onClick={onRemove}
          className="hover:opacity-70 transition-opacity ml-1 p-1 hover:bg-black/10 rounded-full"
          aria-label="Remove filter"
        >
          <X className="h-4 w-4" />
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
  toggleSaved: (id: string, data?: any) => void
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
                        (opportunity.typeOfSetAside && getSetAsideLabel(opportunity.typeOfSetAside)) ||
                        (opportunity.setAside && getSetAsideLabel(opportunity.setAside)) ||
                        opportunity.setAside ||
                        'Not specified'
  const naics = opportunity.naicsCode || 'N/A'
  
  const daysUntilDeadline = opportunity.responseDeadLine 
    ? Math.ceil((new Date(opportunity.responseDeadLine).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null
  
  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]">
      {/* Header with Badge and Bookmark */}
      <div className="flex-shrink-0 border-b border-[var(--color-border)] p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="mb-3 inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-accent-soft)] px-3 py-1.5 text-sm font-semibold text-[var(--color-primary)]">
              <FileText className="h-4 w-4" />
              {type}
            </div>
            {opportunity.uiLink ? (
              <a
                href={opportunity.uiLink}
                target="_blank"
                rel="noopener noreferrer"
                className="group/title mb-2 block line-clamp-2 cursor-pointer text-lg font-bold text-[var(--color-text-primary)] transition-colors hover:text-[var(--color-primary)]"
              >
                {title}
                <ExternalLink className="h-4 w-4 inline ml-1 opacity-0 group-hover/title:opacity-100 transition-opacity" />
              </a>
            ) : (
              <h3 className="mb-2 line-clamp-2 text-lg font-bold text-[var(--color-text-primary)]">
                {title}
              </h3>
            )}
          </div>
          <button
            onClick={() => toggleSaved(id, opportunity)}
            className={`flex-shrink-0 rounded-lg p-2 transition-all ${isSaved ? 'bg-[var(--color-accent-soft)] hover:bg-[var(--color-accent-soft)]' : 'hover:bg-[var(--color-surface-muted)]'}`}
            aria-label={isSaved ? 'Remove from saved' : 'Save opportunity'}
            title={isSaved ? 'Saved — click to unsave' : 'Save this opportunity'}
          >
            {isSaved ? (
              <div className="relative w-5 h-5">
                <Shield className="h-5 w-5 text-[var(--color-text-secondary)] fill-amber-400" />
                <Check className="h-3 w-3 text-white absolute top-0.5 left-0.5" strokeWidth={3} />
              </div>
            ) : (<Bookmark className="h-5 w-5 text-[var(--color-text-subtle)]" />)}
          </button>
        </div>
        
        <div className="mb-2 flex items-center gap-2 text-base text-[var(--color-text-secondary)]">
          <Building2 className="h-4 w-4 flex-shrink-0 text-[var(--color-text-subtle)]" />
          <span className="truncate font-bold">{department}</span>
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
                    ? 'bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]'
                    : daysUntilDeadline <= 30
                      ? 'bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]'
                      : 'bg-[var(--color-surface-muted)] text-[var(--color-primary)]'
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
      <div className="flex-1 space-y-3 overflow-y-auto p-5">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 flex-shrink-0 text-[var(--color-primary)]" />
          <span className="text-sm font-extrabold uppercase tracking-wide text-[var(--color-text-secondary)]">Posted:</span>
          <span className="text-base font-extrabold text-[var(--color-text-primary)]">{postedDate}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-red-600 flex-shrink-0" />
          <span className="text-sm font-extrabold uppercase tracking-wide text-[var(--color-text-secondary)]">Deadline:</span>
          <span className="text-base font-extrabold text-red-700">{responseDeadline}</span>
        </div>

        {/* Place of Performance */}
        {(opportunity.placeOfPerformance?.city?.name || opportunity.placeOfPerformance?.state?.code) && (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 flex-shrink-0 text-[var(--color-primary)]" />
            <span className="text-sm font-extrabold uppercase tracking-wide text-[var(--color-text-secondary)]">Location:</span>
            <span className="text-base font-extrabold text-[var(--color-primary)]">
              {[opportunity.placeOfPerformance?.city?.name, opportunity.placeOfPerformance?.state?.code].filter(Boolean).join(', ')}
            </span>
          </div>
        )}
        
        {setAsideLabel !== 'Not specified' && (
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-[var(--color-primary)] flex-shrink-0" />
            <span className="text-base font-extrabold text-[var(--color-primary)] line-clamp-1">{setAsideLabel}</span>
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <Hash className="h-4 w-4 flex-shrink-0 text-[var(--color-primary)]" />
          <span className="text-sm font-extrabold uppercase tracking-wide text-[var(--color-text-secondary)]">NAICS:</span>
          <span className="text-base font-extrabold text-[var(--color-primary)]">{naics}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="p-5 pt-0 flex-shrink-0">
        {opportunity.uiLink && (
          <a
            href={opportunity.uiLink}
            target="_blank"
            rel="noopener noreferrer"
            className="pg-btn pg-btn-primary flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-base font-semibold"
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
  toggleSaved: (id: string, data?: any) => void,
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
                      (opportunity.typeOfSetAside && getSetAsideLabel(opportunity.typeOfSetAside)) ||
                      (opportunity.setAside && getSetAsideLabel(opportunity.setAside)) ||
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
      className="group relative rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)] transition-all duration-300 hover:shadow-[var(--shadow-md)]"
    >
      {/* Quick Actions */}
      <div className="absolute right-4 top-4 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={() => copyText(id)}
          className="rounded-lg bg-[var(--color-surface-muted)] p-1.5 transition-colors hover:bg-[var(--color-accent-soft)]"
          title="Copy Notice ID"
          aria-label="Copy Notice ID"
        >
          {copiedId === id ? (
            <Check className="h-4 w-4 text-[var(--color-primary)]" />
          ) : (
            <Copy className="h-4 w-4 text-[var(--color-text-secondary)]" />
          )}
        </button>
        <button
          onClick={() => toggleSaved(id, opportunity)}
          className={`rounded-lg p-1.5 transition-all ${isSaved ? 'bg-[var(--color-accent-soft)] hover:bg-[var(--color-accent-soft)]' : 'hover:bg-[var(--color-surface-muted)]'}`}
          title={isSaved ? 'Saved — click to unsave' : 'Save this opportunity'}
          aria-label={isSaved ? 'Remove from saved' : 'Save opportunity'}
        >
          {isSaved ? (
            <div className="relative w-4 h-4">
              <Shield className="h-4 w-4 text-[var(--color-text-secondary)] fill-amber-400" />
              <Check className="h-2.5 w-2.5 text-white absolute top-0.5 left-0.5" strokeWidth={3} />
            </div>
          ) : (<Bookmark className="h-4 w-4 text-[var(--color-text-secondary)]" />)}
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
                className="group/title flex cursor-pointer items-center gap-2 text-lg font-bold text-[var(--color-text-primary)] transition-colors hover:text-[var(--color-primary)]"
              >
                {opportunity.title || 'Untitled Opportunity'}
                <ExternalLink className="h-4 w-4 opacity-0 group-hover/title:opacity-100 transition-opacity" />
              </a>
            ) : (
              <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
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
                        ? 'bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]'
                        : daysUntilDeadline <= 30
                          ? 'bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]'
                          : 'bg-[var(--color-surface-muted)] text-[var(--color-primary)]'
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
          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {/* Solicitation Number */}
            {opportunity.solicitationNumber && (
              <div className="flex items-start gap-2">
                <FileText className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--color-text-subtle)]" />
                <div>
                  <div className="text-sm font-bold text-[var(--color-text-secondary)]">Solicitation #</div>
                  <div className="text-sm font-medium text-[var(--color-text-primary)]">{opportunity.solicitationNumber}</div>
                </div>
              </div>
            )}
            
            {/* Department/Agency */}
            <div className="flex items-start gap-2">
              <Building2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--color-text-subtle)]" />
              <div>
                <div className="text-sm font-bold text-[var(--color-text-secondary)]">Department/Agency</div>
                <div className="line-clamp-2 break-words text-sm font-medium text-[var(--color-text-primary)]" title={department}>
                  {department}
                </div>
              </div>
            </div>
            
            {/* Set-Aside */}
            <div className="flex items-start gap-2">
              <Target className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--color-text-subtle)]" />
              <div>
                <div className="text-sm font-bold text-[var(--color-text-secondary)]">Set-Aside</div>
                <div className="line-clamp-2 break-words text-sm font-medium text-[var(--color-text-primary)]" title={setAsideLabel}>
                  {setAsideLabel}
                </div>
              </div>
            </div>
            
            {/* Place of Performance (City/State) */}
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--color-primary)]" />
              <div>
                <div className="text-sm font-extrabold text-[var(--color-text-secondary)]">Place of Performance</div>
                <div className="break-words text-sm font-extrabold text-[var(--color-primary)]">{placeOfPerformance || 'N/A'}</div>
              </div>
            </div>
            
            {/* Published Date */}
            <div className="flex items-start gap-2">
              <Calendar className="mt-0.5 h-5 w-5 flex-shrink-0 text-[var(--color-primary)]" />
              <div>
                <div className="text-xs font-extrabold uppercase tracking-wide text-[var(--color-primary)]">Published</div>
                <div className="text-base font-extrabold text-[var(--color-text-primary)]">{postedDate}</div>
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
                <Tag className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--color-text-subtle)]" />
                <div>
                  <div className="text-sm font-extrabold text-[var(--color-text-secondary)]">NAICS Code</div>
                  <div className="text-base font-extrabold text-[var(--color-primary)]">{opportunity.naicsCode}</div>
                </div>
              </div>
            )}
            
            {/* Type */}
            {opportunity.type && (
              <div className="flex items-start gap-2">
                <Layers className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--color-text-subtle)]" />
                <div>
                  <div className="text-sm font-bold text-[var(--color-text-secondary)]">Type</div>
                  <div className="text-sm font-medium text-[var(--color-text-primary)]">{opportunity.type}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* REMOVED Active/Archived tags */}
      
      {/* Collapsible Details */}
      {isExpanded && (
        <div className="mt-4 space-y-4 border-t border-[var(--color-border)] pt-4">
          {/* Description */}
          {opportunity.description && (
            <div>
              <h4 className="mb-2 text-sm font-semibold text-[var(--color-text-secondary)]">Description</h4>
              <p className="line-clamp-6 text-base font-medium text-[var(--color-text-primary)]">
                {opportunity.description}
              </p>
            </div>
          )}
          
          {/* Contact & Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Point of Contact */}
            {opportunity.pointOfContact && (
              <div>
                <h4 className="mb-2 text-sm font-semibold text-[var(--color-text-secondary)]">Point of Contact</h4>
                <div className="space-y-2 text-base font-medium text-[var(--color-text-primary)]">
                  {opportunity.pointOfContact.fullname && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-[var(--color-text-subtle)]" />
                      <span className="font-medium">{opportunity.pointOfContact.fullname}</span>
                    </div>
                  )}
                  {opportunity.pointOfContact.title && (
                    <div className="text-[var(--color-text-secondary)]">{opportunity.pointOfContact.title}</div>
                  )}
                  {opportunity.pointOfContact.email && (
                    <a 
                      href={`mailto:${opportunity.pointOfContact.email}`}
                      className="flex items-center gap-2 text-[var(--color-text-primary)] transition-colors hover:text-[var(--color-primary)]"
                    >
                      <MessageSquare className="h-4 w-4" />
                      {opportunity.pointOfContact.email}
                    </a>
                  )}
                  {opportunity.pointOfContact.phone && (
                    <a 
                      href={`tel:${opportunity.pointOfContact.phone.replace(/\D/g, '')}`}
                      className="flex items-center gap-2 text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
                    >
                      <Phone className="h-4 w-4 text-[var(--color-text-subtle)]" />
                      {opportunity.pointOfContact.phone}
                    </a>
                  )}
                </div>
              </div>
            )}
            
            {/* Links */}
            <div>
              <h4 className="mb-2 text-sm font-semibold text-[var(--color-text-secondary)]">Links & Resources</h4>
              <div className="space-y-2">
                {/* SAM.gov UI Link */}
                {opportunity.uiLink && (
                  <a
                    href={opportunity.uiLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-2 text-sm text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-primary)]"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <div className="flex-1">
                      <div className="font-medium">View on SAM.gov</div>
                      <div className="truncate text-xs text-[var(--color-text-secondary)]">{opportunity.uiLink}</div>
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
                    className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-2 text-base font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-accent-soft)] hover:text-[var(--color-primary)]"
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
            <div className="border-t border-[var(--color-border)] pt-4">
              <h4 className="mb-2 text-sm font-semibold text-[var(--color-text-secondary)]">Additional Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {opportunity.baseType && (
                  <div>
                    <div className="text-xs text-[var(--color-text-secondary)]">Original Type</div>
                    <div className="text-sm text-[var(--color-text-primary)]">{opportunity.baseType}</div>
                  </div>
                )}
                {opportunity.archiveType && (
                  <div>
                    <div className="text-xs text-[var(--color-text-secondary)]">Archive Type</div>
                    <div className="text-sm text-[var(--color-text-primary)]">{opportunity.archiveType}</div>
                  </div>
                )}
                {opportunity.award?.date && (
                  <div>
                    <div className="text-xs text-[var(--color-text-secondary)]">Award Date</div>
                    <div className="text-sm text-[var(--color-text-primary)]">{formatDate(opportunity.award.date)}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Footer - UPDATED */}
      <div className="mt-4 flex items-center justify-between border-t border-[var(--color-border)] pt-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => toggleExpanded(id)}
            className="flex items-center gap-1 text-base font-medium text-[var(--color-text-primary)] transition-colors hover:text-[var(--color-primary)]"
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
            <div className="flex items-center gap-1 text-base font-medium text-[var(--color-text-primary)]">
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
  return getSetAsideLabel(code) || code
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
      parts.push(getSetAsideLabel(typeOfSetAside) || `Set-Aside: ${typeOfSetAside}`)
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

// Opportunity Management Hook — persists to DB via API so dashboard & alerts show saved opps
const useOpportunityManagement = (showToast?: (msg: string) => void) => {
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  // Store full opportunity data keyed by id so we can POST it to the API
  const opportunityDataRef = React.useRef<Record<string, any>>({});

  const toggleSaved = useCallback((id: string, opportunityData?: any) => {
    setSaved((p) => {
      const isNowSaved = !p[id]
      const newSaved = { ...p, [id]: isNowSaved }

      // Show toast notification
      if (showToast) {
        if (isNowSaved && opportunityData) {
          showToast(`✓ Saved: ${opportunityData.title?.slice(0, 45) || 'Opportunity'}`)
        } else if (!isNowSaved) {
          showToast('Removed from saved opportunities')
        }
      }

      // Persist to localStorage as a fallback
      try {
        localStorage.setItem('govcon_saved_opportunities', JSON.stringify(newSaved))
      } catch (error) {
        console.error('Failed to save to localStorage:', error)
      }

      // Persist to DB via API
      if (isNowSaved && opportunityData) {
        opportunityDataRef.current[id] = opportunityData
        fetch('/api/saved-opportunities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            noticeId: id,
            title: opportunityData.title,
            solicitationNumber: opportunityData.solicitationNumber,
            department: opportunityData.department || opportunityData.fullParentPathName,
            postedDate: opportunityData.postedDate,
            responseDeadLine: opportunityData.responseDeadLine,
            naicsCode: opportunityData.naicsCode,
            type: opportunityData.type,
            setAside: opportunityData.typeOfSetAsideDescription || opportunityData.typeOfSetAside || opportunityData.setAside,
            placeOfPerformance: opportunityData.placeOfPerformance,
            uiLink: opportunityData.uiLink,
            organizationName: opportunityData.organizationName,
          }),
        }).catch(err => console.error('Failed to save opportunity to DB:', err))
      } else if (!isNowSaved) {
        // Remove from DB
        fetch(`/api/saved-opportunities/${id}`, { method: 'DELETE' })
          .catch(err => console.error('Failed to delete saved opportunity from DB:', err))
      }

      return newSaved
    });
  }, [showToast]);

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
              className="px-6 py-3 bg-[var(--color-surface-muted)] text-white rounded-lg hover:bg-[var(--color-surface-muted)] transition-colors"
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
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border-2 border-[var(--color-border)] shadow-lg mb-4">
      {/* Header row: title on left, Save/Alert buttons on right */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div>
          <h3 style={{ fontFamily: 'var(--font-ui), system-ui, sans-serif' }} className="text-2xl font-bold text-blue-900 uppercase tracking-wide leading-none">
            Quick Solicitations Lookup
          </h3>
          <p className="text-sm text-blue-700 font-semibold mt-0.5">Fast search with date quick-fills — refine further with Advanced Filters</p>
        </div>
        {/* Save Search + Create Alert */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onSaveSearch}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] text-white font-bold text-sm hover:shadow-lg hover:shadow-emerald-500/25 transition-all"
            aria-label="Save current search"
          >
            <Save className="h-4 w-4 flex-shrink-0" />
            Save Search
          </button>
          <button
            onClick={onCreateAlert}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] text-white font-bold text-sm hover:shadow-lg hover:shadow-violet-500/25 transition-all"
            aria-label="Create email alert"
          >
            <Bell className="h-4 w-4 flex-shrink-0" />
            Create Alert
          </button>
          <Link href="/alerts">
            <button
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--color-surface-muted)] text-white font-bold text-sm hover:bg-[var(--color-surface-muted)] hover:shadow-lg transition-all"
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
          <label style={{ fontFamily: 'var(--font-ui), system-ui, sans-serif' }} className="block text-base font-bold text-gray-900 mb-2">
            Keyword:
          </label>
          <input
            type="text"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') onRunSearch() }}
            placeholder="e.g., Data Analytics"
            className="w-full px-4 py-2.5 text-base font-semibold rounded-lg bg-white border-2 border-gray-400 text-gray-900 placeholder-gray-500 hover:border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-[var(--color-border)] transition-colors"
          />
        </div>

        {/* Solicitation Posted Date */}
        <div>
          <label style={{ fontFamily: 'var(--font-ui), system-ui, sans-serif' }} className="block text-base font-bold text-gray-900 mb-2">
            Solicitation Posted Date:
          </label>
          <input
            type="date"
            value={postedAfter}
            onChange={(e) => setPostedAfter(e.target.value)}
            className="w-full px-4 py-2.5 text-base font-semibold rounded-lg bg-white border-2 border-gray-400 text-gray-900 hover:border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-[var(--color-border)] mb-2"
          />
          <div style={{ fontFamily: 'var(--font-ui), system-ui, sans-serif' }} className="text-xs font-bold text-gray-700 mb-1">POSTED WITHIN:</div>
          <div className="flex flex-wrap gap-1">
            {[['1 Mo', -1], ['3 Mo', -3], ['6 Mo', -6], ['9 Mo', -9], ['12 Mo', -12]].map(([label, months]) => {
              const colors = ['from-[var(--color-primary)] to-[var(--color-primary-hover)]', 'from-[var(--color-primary)] to-[var(--color-primary-hover)]', 'from-[var(--color-primary)] to-[var(--color-primary-hover)]', 'from-[var(--color-primary)] to-[var(--color-primary-hover)]', 'from-slate-600 to-slate-800']
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
          <label style={{ fontFamily: 'var(--font-ui), system-ui, sans-serif' }} className="block text-base font-bold text-gray-900 mb-2">
            Submission Deadline Date:
          </label>
          <input
            type="date"
            value={responseDeadlineBefore}
            onChange={(e) => setResponseDeadlineBefore(e.target.value)}
            className="w-full px-4 py-2.5 text-base font-semibold rounded-lg bg-white border-2 border-gray-400 text-gray-900 hover:border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-[var(--color-border)] mb-2"
          />
          <div style={{ fontFamily: 'var(--font-ui), system-ui, sans-serif' }} className="text-xs font-bold text-gray-700 mb-1">DEADLINE WITHIN:</div>
          <div className="flex flex-wrap gap-1">
            {[['1 Mo', 1, 'from-[var(--color-primary)] to-[var(--color-primary-hover)]'], ['3 Mo', 3, 'from-[var(--color-primary)] to-[var(--color-primary-hover)]'], ['6 Mo', 6, 'from-[var(--color-primary)] to-[var(--color-primary-hover)]'], ['9 Mo', 9, 'from-[var(--color-primary)] to-[var(--color-primary-hover)]'], ['12 Mo', 12, 'from-[var(--color-primary)] to-[var(--color-primary-hover)]']].map(([label, months, color]) => (
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
          className="pg-btn pg-btn-primary inline-flex items-center justify-center gap-2 px-8 py-3 text-base font-bold rounded-lg text-white transition-all shadow-md disabled:opacity-50 whitespace-nowrap"
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
        <div className="w-px h-8 bg-[var(--color-surface-muted)] mx-1 hidden sm:block" />
        <button
          onClick={onSaveSearch}
          className="inline-flex items-center gap-1.5 px-4 py-3 rounded-lg bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] text-white font-bold text-sm hover:shadow-lg hover:shadow-emerald-500/25 transition-all whitespace-nowrap"
          aria-label="Save current search"
        >
          <Save className="h-4 w-4 flex-shrink-0" />
          Save Search
        </button>
        <button
          onClick={onCreateAlert}
          className="inline-flex items-center gap-1.5 px-4 py-3 rounded-lg bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] text-white font-bold text-sm hover:shadow-lg hover:shadow-violet-500/25 transition-all whitespace-nowrap"
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

// ── STEP 2: Add these helpers OUTSIDE the component (above SearchPageContent) ──

/** Write last search to sessionStorage so Dashboard & Insights can read it */
function writeSearchContext(results: any[], params: Record<string, string>) {
  try {
    sessionStorage.setItem('lastSearchResults', JSON.stringify({
      results: results.slice(0, 50),
      params,
      searchedAt: new Date().toISOString(),
      count: results.length,
    }))
  } catch { /* quota — ignore */ }
}

/** Simple toast hook (paste once near the top of the file) */
function useToast() {
  const [toast, setToast] = useState<string | null>(null)
  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }, [])
  const ToastUI = toast ? (
    <div className="fixed bottom-6 right-6 z-[200] flex items-center gap-2 px-5 py-3 bg-gray-900 text-white rounded-xl shadow-2xl text-sm font-bold">
      <Check className="h-4 w-4 text-[var(--color-primary)]" />
      {toast}
    </div>
  ) : null
  return { showToast, ToastUI }
}

// ── STEP 8: Add sticky prompt component + render ──
// Add this component definition above SearchPageContent:
function StickyResultsPrompt({
  count, keywords, postedAfter, responseDeadlineBefore, selectedSetAsides, selectedStates, onSave, onAlert, onDismiss,
}: { 
  count: number; keywords: string; 
  postedAfter?: string; responseDeadlineBefore?: string;
  selectedSetAsides?: string[]; selectedStates?: string[];
  onSave: () => void; onAlert: () => void; onDismiss: () => void 
}) {
  // Build a compact description
  const parts: string[] = []
  if (keywords) parts.push(`"${keywords}"`)
  if (postedAfter) parts.push(`posted ≥ ${new Date(postedAfter + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`)
  if (responseDeadlineBefore) parts.push(`due on or after ${new Date(responseDeadlineBefore + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`)
  if (selectedSetAsides && selectedSetAsides.length > 0) parts.push(`${selectedSetAsides.length} set-aside${selectedSetAsides.length > 1 ? 's' : ''}`)
  if (selectedStates && selectedStates.length > 0) parts.push(`${selectedStates.length} state${selectedStates.length > 1 ? 's' : ''}`)

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-800 to-slate-900 text-white px-4 py-3 shadow-2xl border-t-2 border-[var(--color-border)]">
      <div className="max-w-[1760px] mx-auto flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-[var(--color-primary)] flex-shrink-0" />
          <span className="font-bold text-sm">
            Found <span className="text-[var(--color-primary)] text-base">{count.toLocaleString()}</span> results
            {parts.length > 0 && <> for <span className="text-[var(--color-primary)]">{parts.join(' · ')}</span></>}
            {' '}— save this search or get alerts so you never miss an update
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onSave}
            className="flex items-center gap-1.5 px-4 py-2 bg-white text-slate-800 font-bold text-sm rounded-lg hover:bg-[var(--color-surface-muted)] transition-colors shadow-sm"
          >
            <Save className="h-4 w-4" />Save Search
          </button>
          <button
            onClick={onAlert}
            className="pg-btn pg-btn-secondary flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg transition-colors border border-[var(--color-border)]"
          >
            <Bell className="h-4 w-4" />Get Alerts
          </button>
          <button
            onClick={onDismiss}
            className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// --- Main Component ---
// ============================================================
// ANIMATED COMPONENTS FOR DYNAMIC SEARCH PAGE
// ============================================================

// Animated Tips Carousel Component
function AnimatedTipsCarousel() {
  const [currentTip, setCurrentTip] = useState(0)
  
  const tips = [
    {
      icon: <FileText className="h-5 w-5" />,
      text: "Pro tip: Use specific keywords like 'cybersecurity services' instead of broad terms like 'IT'.",
      color: "from-[var(--color-primary)] to-[var(--color-primary-hover)]"
    },
    {
      icon: <Calendar className="h-5 w-5" />,
      text: "Quick trick: Use the date buttons below to instantly apply common time ranges.",
      color: "from-[var(--color-primary)] to-[var(--color-primary-hover)]"
    },
    {
      icon: <Bell className="h-5 w-5" />,
      text: "Set up alerts to get notified when new opportunities match your saved filters.",
      color: "from-[var(--color-primary)] to-[var(--color-primary-hover)]"
    },
    {
      icon: <Shield className="h-5 w-5" />,
      text: "VOSB advantage: apply set-aside filters to surface contracts reserved for eligible firms.",
      color: "from-[var(--color-primary)] to-[var(--color-primary-hover)]"
    },
    {
      icon: <MapPin className="h-5 w-5" />,
      text: "Local advantage: filter by state to find nearby opportunities with lower competition.",
      color: "from-[var(--color-primary)] to-[var(--color-primary-hover)]"
    },
    {
      icon: <Clock className="h-5 w-5" />,
      text: "Heads up: prioritize items with near deadlines first so you don't miss submission windows.",
      color: "from-[var(--color-primary)] to-[var(--color-primary-hover)]"
    }
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % tips.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [tips.length])

  return (
    <div className="relative mt-3 h-[84px] overflow-hidden sm:h-[66px]">
      {tips.map((tip, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-all duration-700 ease-in-out ${
            index === currentTip 
              ? 'opacity-100 translate-y-0' 
              : index < currentTip 
                ? 'opacity-0 -translate-y-full' 
                : 'opacity-0 translate-y-full'
          }`}
        >
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-2.5 shadow-sm sm:p-3">
            <div className="flex items-center gap-2.5 text-[var(--color-text-primary)] sm:gap-3">
              <div className="flex-shrink-0 rounded-lg bg-[var(--color-accent-soft)] p-2">
                {tip.icon}
              </div>
              <p className="text-xs font-semibold leading-snug text-[var(--color-text-primary)] sm:text-sm">
                {tip.text}
              </p>
            </div>
          </div>
        </div>
      ))}
      
      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 flex gap-1.5">
        {tips.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentTip(index)}
            className={`w-1.5 h-1.5 rounded-full transition-all ${
              index === currentTip 
                ? 'bg-[var(--color-surface-muted)] w-4' 
                : 'bg-gray-500 hover:bg-gray-400'
            }`}
            aria-label={`Go to tip ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}

// Quick Start Guide Component
function QuickStartGuide() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="mt-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3.5 bg-white rounded-xl border border-gray-300 hover:border-[var(--color-border)] transition-all shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[var(--color-surface-muted)] rounded-lg flex items-center justify-center">
            <HelpCircle className="h-5 w-5 text-white" />
          </div>
          <span className="text-sm sm:text-base font-semibold text-gray-900">
            {isOpen ? 'Hide Quick Start Guide' : 'New here? Click for Quick Start Guide'}
          </span>
        </div>
        {isOpen ? <ChevronUp className="h-5 w-5 text-gray-600" /> : <ChevronDown className="h-5 w-5 text-gray-600" />}
      </button>

      {isOpen && (
        <div className="mt-2.5 bg-gray-50 rounded-xl p-4 sm:p-5 border border-gray-300 shadow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-[var(--color-surface-muted)] rounded-lg flex items-center justify-center text-white font-black text-sm">
                  1
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">Enter Your Search</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Type keywords, company names, products, or services. Leave blank to see all opportunities.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-[var(--color-surface-muted)] rounded-lg flex items-center justify-center text-white font-black text-sm">
                  2
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">Select Date Ranges</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Use quick-fill buttons or pick custom dates to narrow your search.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-[var(--color-surface-muted)] rounded-lg flex items-center justify-center text-white font-black text-sm">
                  3
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">Click Search</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Hit the green Search button to find matching opportunities from SAM.gov.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-[var(--color-surface-muted)] rounded-lg flex items-center justify-center text-white font-black text-sm">
                  4
                </div>
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">Refine & Save</h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  Use filters to narrow results, then save your search or create an email alert.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-300">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Pro Tips</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle className="h-4 w-4 text-[var(--color-primary)] flex-shrink-0 mt-0.5" />
                <span><strong>Be Specific:</strong> "Cloud services" beats "IT"</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle className="h-4 w-4 text-[var(--color-primary)] flex-shrink-0 mt-0.5" />
                <span><strong>Check Daily:</strong> New opportunities posted constantly</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle className="h-4 w-4 text-[var(--color-primary)] flex-shrink-0 mt-0.5" />
                <span><strong>Save Searches:</strong> Rerun successful searches quickly</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-gray-700">
                <CheckCircle className="h-4 w-4 text-[var(--color-primary)] flex-shrink-0 mt-0.5" />
                <span><strong>Set Alerts:</strong> Get emailed automatically</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Searching Facts Component
function SearchingFacts({ duration }: { duration: number }) {
  const [currentFact, setCurrentFact] = useState(0)

  const facts = [
    "💼 The U.S. government spends over $600 billion annually on contracts",
    "📊 Small businesses win over 25% of federal contract dollars each year",
    "🎯 Set-aside opportunities give small businesses exclusive access to bids",
    "⚡ SAM.gov posts thousands of new opportunities every week",
    "🏆 Veterans can access special set-asides through the SDVOSB program",
    "🌟 Women-owned businesses have dedicated WOSB opportunities",
    "📈 Federal contracts can transform small businesses into major players",
    "🔍 Being specific in searches helps you find better-matched opportunities"
  ]

  useEffect(() => {
    if (duration > 0 && duration % 3 === 0) {
      setCurrentFact((prev) => (prev + 1) % facts.length)
    }
  }, [duration, facts.length])

  return (
    <div className="mt-4 pt-4 border-t-2 border-[var(--color-border)]">
      <div className="flex items-center gap-3">
        <Sparkles className="h-5 w-5 text-blue-600 animate-pulse" />
        <p className="text-base font-semibold text-blue-800">
          <strong>Did you know?</strong> {facts[currentFact]}
        </p>
      </div>
    </div>
  )
}


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
  const [selectedSetAsides, setSelectedSetAsides] = useState<string[]>([])
  const [selectedStates, setSelectedStates] = useState<string[]>([])
  // ✅ QUICK SEARCH STATE
  const [quickKeyword, setQuickKeyword] = useState('')
  const [quickPostedDate, setQuickPostedDate] = useState(getSixMonthsAgo())
  const [quickDeadlineDate, setQuickDeadlineDate] = useState(getToday())
  
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
  const [advResponseDeadline, setAdvResponseDeadline] = useState(getToday())

  // ===== NEW CRITICAL SEARCH PARAMETERS =====
  // Phase 1: Critical
  const [solicitationNumber, setSolicitationNumber] = useState('') // Priority 1B - Direct lookup
  const [classificationCode, setClassificationCode] = useState('') // Priority 1C - PSC codes
  const [responseDeadline, setResponseDeadline] = useState(getToday())// Priority 1A - CRITICAL - Filter by specific deadline date (default: today)
  // Empty by default - no upper limit
  const [responseDeadlineAfter, setResponseDeadlineAfter] = useState('')
  const [responseDeadlineBefore, setResponseDeadlineBefore] = useState(getToday())

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
  const [showSavedOnly, setShowSavedOnly] = useState(false)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
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
  const { showToast, ToastUI } = useToast()
  const [showStickyPrompt, setShowStickyPrompt] = useState(false)
  const [stickyPromptDismissed, setStickyPromptDismissed] = useState(false)
  const { saved, toggleSaved, setSaved } = useOpportunityManagement(showToast);
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
        setSelectedSetAsides(stringToSetAsideCodes(mappedParams.setAside));
        setSelectedStates(stringToLocationCodes(mappedParams.stateOfPerformance));
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
    keywords, naics, agency, selectedSetAsides, selectedStates,  // ✅ FIXED
    postedAfter, postedBefore, procurementType, isActive,
    solicitationNumber, classificationCode, responseDeadline,
    noticeId, opportunityStatus, placeOfPerformanceZip, organizationCode
  };
  saveSearchState(searchState);
}, [
  keywords, naics, agency, selectedSetAsides, selectedStates,  // ✅ FIXED
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

    // For search, allow running even if browsing window expired; modal will be shown after results
    if (featureName.includes('Search')) {
      return true;
    }

    // For other features, check BOTH hasValidAccess AND canBrowse
    if (!hasValidAccess && !canBrowse) {
      setBlockedFeature(featureName)
      setShowAccessModal(true)
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
    // TODO: Reinstate this blocking mechanism after search testing
    // if (!canBrowse) {
    //   console.log('Search blocked: canBrowse is false');
    //   setShowLockoutModal(true);
    //   return;
    // }

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

      // ── STEP 5: In runSearch(), after setData(payload) on a successful search, add: ──
      writeSearchContext(opps || [], Object.fromEntries(qs.entries()))
      if (!stickyPromptDismissed) setShowStickyPrompt(true)
      
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
      selectedSetAsides,
      selectedStates,
      keywords,
      currentPage 
    })
    
    // CRITICAL: Check if user can browse for unauthenticated/expired users
    // TODO: Reinstate this blocking mechanism after search testing
    // if (!canBrowse) {
    //   console.log('❌ Search blocked: canBrowse is false')
    //   setShowLockoutModal(true)
    //   return
    // }
    
    // CRITICAL FIX: Prevent duplicate simultaneous searches
    if (!isLoadMore && loading) {
      console.log('❌ Search blocked: already in progress')
      return
    }
    
    if (isLoadMore && loadingMore) {
      console.log('❌ Load more blocked: already in progress')
      return
    }
    
    // Gate the search action (only block if requireAccess returns false, but allow search to run for browsing window expired)
    if (!requireAccess('Search Federal Opportunities')) {
      // Only block if requireAccess returns false for non-search features
      if (!hasValidAccess && !canBrowse) {
        pendingActionRef.current = () => runSearch(isLoadMore)
        return
      }
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
        const kw = debouncedKeywords.trim()
        const isNaicsLike = /^\d{2,6}$/.test(kw)
        if (isNaicsLike && !naics.trim()) { qs.set('ncode', kw) }
        else if (!isNaicsLike) { qs.set('title', kw) }
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
      
      // SET-ASIDE TYPE - convert array to comma-separated string for API
      const setAsideString = setAsideCodesToString(selectedSetAsides)
      if (setAsideString) {
        qs.set('typeOfSetAside', setAsideString)
      }

      // Procurement Type (ptype)
      if (procurementType.trim()) {
        qs.set('ptype', procurementType.trim())
      }
      
      // STATE — skip if ncode is set (SAM.gov returns 0 when both sent together)
      const stateString = locationCodesToString(selectedStates)
      if (stateString && !qs.has('ncode')) { qs.set('state', stateString) }
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
      // Use responseDeadlineBefore (the UI date picker) as rdlto upper bound.
      // Fall back to legacy responseDeadline for saved-search compatibility.
      const deadlineUpperBound = responseDeadlineBefore.trim() || responseDeadline.trim()
      if (deadlineUpperBound) {
        qs.set('rdlto', formatDateForAPI(deadlineUpperBound))
      }
      // Only send rdlfrom if user explicitly set it (avoids conflicting with route.ts default)
      if (responseDeadlineAfter.trim()) {
        qs.set('rdlfrom', formatDateForAPI(responseDeadlineAfter.trim()))
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
        // ── STEP 5: In runSearch(), after setData(payload) on a successful search, add: ──
        writeSearchContext(opps || [], Object.fromEntries(qs.entries()))
        if (!stickyPromptDismissed) setShowStickyPrompt(true)
        // After results, if browsing window has elapsed, show access modal
        if (!hasValidAccess && !canBrowse) {
          setBlockedFeature('Search Federal Opportunities');
          setShowAccessModal(true);
        }
      }

      console.log('API Search successful', { 
        results: (opps?.length ?? 0), 
        totalRecords: total,
        hasMoreResults: currentTotalLoaded < total,
        procurementType: procurementType,
        setAsideFilter: setAsideCodesToString(selectedSetAsides),
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
    setQuickDeadlineDate(getToday())

    // ── Shared state (synced from Quick Search) ──
    setKeywords('')
    setPostedAfter(getSixMonthsAgo())
    setResponseDeadlineBefore(getToday())
    setResponseDeadline(getToday())

    // ── Advanced filter state ──
    setAdvKeywords('')
    setAdvPostedAfter(getSixMonthsAgo())
    setAdvResponseDeadline(getToday())
    setAdvancedApplied(false)

    // ── All other filters ──
    setNaics('')
    setAgency('')
    setSelectedSetAsides([])
    setSelectedStates([])
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
    setSelectedSetAsides(setAsideCode ? [setAsideCode] : [])
    setShowSetAsideDrilldown(false)
  }

  const filterByState = (state: string) => {
    setSelectedStates(state ? [state] : [])
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
        setSelectedSetAsides(filterValue ? [filterValue] : [])
        break
      case 'naics':
        setNaics(filterValue)
        break
      case 'agency':
        setAgency(filterValue)
        break
      case 'state':
        setSelectedStates(filterValue ? [filterValue] : [])
        break
    }

    // Collapse the breakdown
    setExpandedBreakdown(null)
  }, [])

  // Clear specific filters - NO AUTO-REFRESH
  const clearAllClientFilters = () => {
    setAgency('')
    setSelectedSetAsides([])
    setNaics('')
    setSelectedStates([])
  }

  // Update search when filter is removed (user must click search button)
  const handleFilterRemoveAndSearch = (filterType: string) => {
    switch (filterType) {
      case 'agency':
        setAgency('')
        break
      case 'setAside':
        setSelectedSetAsides([])
        break
      case 'naics':
        setNaics('')
        break
      case 'state':
        setSelectedStates([])
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
      // Only sync if user hasn't typed their own filter keyword yet
      if (!advKeywords) setAdvKeywords(keywords)
      setAdvPostedAfter(postedAfter)
      setAdvResponseDeadline(responseDeadlineBefore || responseDeadline)
      setAdvancedApplied(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

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
      if (advResponseDeadline) setAdvResponseDeadline(advResponseDeadline)
      
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
  }, [results.length, advPostedAfter, advResponseDeadline, advKeywords, postedAfter, responseDeadline, keywords, selectedSetAsides, naics, selectedStates])

  const clearAdvancedFilters = useCallback(() => {
    setAdvancedApplied(false)
    setActiveFilter(null)
  }, [])

  const filteredResults = useMemo(() => {
    let arr = results.slice()

    // ── ALWAYS filter by set-aside if selected (SAM.gov API doesn't filter reliably) ──
    if (selectedSetAsides.length > 0) {
      arr = arr.filter(o => {
        const oppSetAside = (o.typeOfSetAside || o.setAside || o.setAsideCode || '').toUpperCase()
        const oppSetAsideDesc = (o.typeOfSetAsideDescription || '').toUpperCase()
        return selectedSetAsides.some(code => {
          const selectedCode = code.toUpperCase()
          return oppSetAside === selectedCode || oppSetAsideDesc.includes(selectedCode)
        })
      })
    }

    // ── ALWAYS filter by status if selected ──
    if (!opportunityStatus.trim() || opportunityStatus.toLowerCase() === 'active') {
      // When status=active: ALSO drop past-deadline opportunities.
      // SAM.gov status=active means "not archived", NOT "deadline in future".
      // Opportunities with no responseDeadLine are kept (open-ended contracts).
      const now = Date.now()
      arr = arr.filter(o => {
        if (!o.responseDeadLine) return true
        return new Date(o.responseDeadLine).getTime() >= now
      })
    } else {
      // User selected a specific non-active status (archived, cancelled, etc.)
      arr = arr.filter(o => {
        const oppActive = (o.active || '').toString().toLowerCase()
        const oppStatus = (o.status || '').toLowerCase()
        return oppActive === opportunityStatus.toLowerCase() || oppStatus === opportunityStatus.toLowerCase()
      })
    }

    // ── Always-on Refine Filters (instant client-side) ──
    if (agency.trim()) { const ag = agency.trim().toLowerCase(); arr = arr.filter(o => (o.organizationName||'').toLowerCase().includes(ag)||(o.fullParentPathName||'').toLowerCase().includes(ag)) }
    if (naics.trim()) { arr = arr.filter(o => (o.naicsCode||'').startsWith(naics.trim())) }
    if (classificationCode.trim()) { arr = arr.filter(o => (o.classificationCode||'').toLowerCase().startsWith(classificationCode.trim().toLowerCase())) }
    if (selectedStates.length > 0) { arr = arr.filter(o => selectedStates.some(code => (o.placeOfPerformance?.state?.code||'').toUpperCase()===code.toUpperCase())) }
    if (procurementType.trim()) { arr = arr.filter(o => (o.type||'').toLowerCase().startsWith(procurementType.toLowerCase())||(o.baseType||'').toLowerCase().startsWith(procurementType.toLowerCase())) }
    if (solicitationNumber.trim()) { arr = arr.filter(o => (o.solicitationNumber||'').toLowerCase().includes(solicitationNumber.trim().toLowerCase())) }
    if (organizationCode.trim()) { arr = arr.filter(o => (o.organizationId||'').toLowerCase().includes(organizationCode.trim().toLowerCase())) }
    if (advancedApplied) {
      const kw = advKeywords.trim().toLowerCase()
      if (kw) { arr = arr.filter(o => (o.title||'').toLowerCase().includes(kw)||(o.description||'').toLowerCase().includes(kw)) }
      if (advPostedAfter) { const from = new Date(advPostedAfter).getTime(); arr = arr.filter(o => new Date(o.postedDate||0).getTime()>=from) }
      if (advResponseDeadline) { const to = new Date(advResponseDeadline).getTime(); arr = arr.filter(o => new Date(o.responseDeadLine||0).getTime()<=to) }
    } else {
      if (activeFilter !== null) { arr = arr.filter(o => { const isActiveOpp = o.active==="Yes"||o.active==="true"||o.active===(true as any); return activeFilter==="true"?isActiveOpp:!isActiveOpp }) }
    }

    // ── Saved-only toggle ──
    if (showSavedOnly) { arr = arr.filter(o => saved[o.noticeId || '']) }

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
  }, [results, sortBy, activeFilter, advancedApplied, showSavedOnly, saved,
      advKeywords, advPostedAfter, advResponseDeadline,
      agency, selectedSetAsides, naics, classificationCode, selectedStates,
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

  // Google-style color palette
  const companyBlue = '#1a73e8'
  const companyGreen = '#0f9d58'
  const companyYellow = '#f4b400'
  const companyRed = '#db4437'

  return (
    <SearchErrorBoundary>
      <main className="pg-theme-cleanup pg-search-modern pg-flow-modern min-h-screen bg-transparent flex flex-col text-[14px] sm:text-[15px]">
        {/* ── STEP 6: Add ToastUI render at the top of the JSX return ── */}
        {ToastUI}
        {/* Main content - full height utilization */}
        <div className="pg-container px-3.5 sm:px-5 lg:px-6 py-3 flex-1 flex flex-col">

          {/* Professional Welcome Banner */}
          <div className="mb-2">
            {/* Main Welcome Card - Professional Gray */}
            <div className="rounded-2xl border border-[#d9e2ef] bg-white p-3.5 sm:p-4 shadow-sm">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                {/* Icon - Simple Target */}
                <div className="flex-shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-surface-muted)] shadow-sm">
                    <Target className="h-6 w-6 text-[var(--color-primary)]" />
                  </div>
                </div>
                
                {/* Content */}
                <div className="flex-1">
                  {session?.user?.name && (
                    <p className="mb-1 text-sm font-medium text-[var(--color-text-secondary)]">
                      Welcome back, {session.user.name.split(' ')[0]}!
                    </p>
                  )}
                  <p className="max-w-3xl text-xs sm:text-sm leading-6 text-[var(--color-text-secondary)] md:text-base">
                    Search SAM.gov opportunities quickly with focused filters and real-time federal data.
                  </p>
                </div>

                {/* ── STEP 9: Add navigation links inside the welcome banner ── */}
                <div className="flex flex-wrap items-center gap-2 flex-shrink-0 justify-end">
                  <Link
                    href="/alerts/manage-searches"
                    className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(255,122,24,0.35)] transition-transform hover:scale-[1.02]"
                    style={{ background: 'linear-gradient(135deg, #ff7a18, #ffb347)' }}
                  >
                    <Bookmark className="h-4 w-4" />Saved Searches
                  </Link>
                  <Link
                    href="/dashboard"
                    className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-[#043524] shadow-[0_12px_30px_rgba(0,214,125,0.25)] transition-transform hover:scale-[1.02]"
                    style={{ background: 'linear-gradient(135deg, #00d67d, #8dffb5)' }}
                  >
                    <BarChart3 className="h-4 w-4" />Dashboard
                  </Link>
                  <Link
                    href="/insights"
                    className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-[#3d2200] shadow-[0_10px_24px_rgba(255,179,71,0.25)] transition-transform hover:scale-[1.02]"
                    style={{ background: 'linear-gradient(135deg, #ffb347, #ffe78f)' }}
                  >
                    <TrendingUp className="h-4 w-4" />Insights
                  </Link>
                  <Link
                    href="/alerts/manage-alerts"
                    className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-[#012b2d] shadow-[0_12px_28px_rgba(0,178,169,0.35)] transition-transform hover:scale-[1.02]"
                    style={{ background: 'linear-gradient(135deg, #00b2a9, #6bffe5)' }}
                  >
                    <Bell className="h-4 w-4" />Alert Subscriptions
                  </Link>
                </div>
              </div>

              {/* Animated Tips Carousel - Professional */}
              <AnimatedTipsCarousel />
            </div>

            {/* Quick Start Guide */}
            <QuickStartGuide />
          </div>



          {/* Search Card - compact with full width */}
          <div className="flex-1 flex flex-col">
            <div className="overflow-hidden rounded-2xl shadow-xl" style={{border:'2px solid #f97316'}}>

              {/* ── HERO SEARCH STRIP — white + orange, fully light ── */}
              <div className="px-6 pt-5 pb-5 bg-white" style={{borderBottom:'2px solid #fed7aa'}}>

                {/* First-Time Visit Guide (Professional) */}
                {typeof window !== 'undefined' && !window.localStorage.getItem('searchGuideDismissed') && (
                  <div id="first-time-guide" className="mb-6 rounded-2xl border border-[--color-border] bg-white shadow p-6 flex flex-col md:flex-row items-center gap-6 relative">
                    <div className="flex-1">
                      <h2 className="text-2xl md:text-3xl font-black text-[--color-primary] mb-2">Welcome to Precise GovCon Search</h2>
                      <ol className="list-decimal list-inside text-base font-semibold text-[--color-text-primary] space-y-1 pl-2">
                        <li>Enter keywords, NAICS, agency, or solicitation number in the search bar below.</li>
                        <li>Click <span className="inline-block bg-[--color-primary] text-white px-2 py-0.5 rounded font-black">Search</span> or press <span className="font-black">Enter</span>.</li>
                        <li>Use filters to refine results. Save searches or set up alerts as needed.</li>
                      </ol>
                    </div>
                    <button
                      className="absolute top-3 right-3 text-[--color-primary] hover:text-[--color-primary-hover] text-xl font-black bg-white rounded-full p-2 border border-[--color-border] shadow"
                      onClick={() => { window.localStorage.setItem('searchGuideDismissed', '1'); document.getElementById('first-time-guide')?.remove(); }}
                      aria-label="Dismiss guide"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                )}

                {/* Professional Search Bar Section */}
                <div className="rounded-2xl border border-[--color-border] bg-white shadow-md px-8 py-8 mb-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-[--color-primary] flex items-center justify-center shadow-md">
                        <Search className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h1 className="text-2xl md:text-3xl font-black text-[--color-primary] mb-1 tracking-tight">Search Federal Opportunities</h1>
                        <p className="text-base font-semibold text-[--color-text-secondary] tracking-tight">Find, track, and win government contracts. Start your search below.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-[--color-text-secondary]">
                        {(data?.totalRecords ?? 2143921).toLocaleString()} <span className="font-medium">active opportunities</span>
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-3 items-stretch mb-3 mt-2">
                    <div className="flex-1 relative">
                      <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-7 w-7 text-[--color-primary] pointer-events-none z-10" />
                      <input
                        type="text"
                        value={keywords}
                        onChange={(e) => setKeywords(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && runSearch()}
                        placeholder='Enter keywords, NAICS, agency, or solicitation #'
                        autoFocus
                        className="w-full rounded-2xl border-2 border-[--color-primary] bg-white py-5 pl-20 pr-6 text-xl font-semibold text-[--color-text-primary] placeholder-[--color-primary] shadow focus:border-[--color-primary-hover] focus:ring-2 focus:ring-[--color-primary]/10 outline-none transition-all"
                      />
                    </div>
                    <button onClick={() => runSearch()} disabled={loading}
                      className="px-10 rounded-2xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 whitespace-nowrap hover:scale-105 active:scale-95 min-w-36 text-white shadow bg-[--color-primary] hover:bg-[--color-primary-hover]"
                    >
                      {loading
                        ? <><Loader2 className="h-6 w-6 animate-spin" />Searching</>
                        : <><Search className="h-6 w-6" />Search</>}
                    </button>
                  </div>
                </div>



                {/* Secondary actions + quick chips */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button onClick={resetAll}
                    className="px-4 py-2 rounded-xl font-semibold text-sm flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-all">
                    <RefreshCw className="h-3.5 w-3.5" />Reset
                  </button>
                  <button onClick={() => handleOpenSaveModal('save')}
                    className="px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white transition-all shadow-sm">
                    <Save className="h-3.5 w-3.5" />Save Search
                  </button>
                  <button onClick={() => handleOpenSaveModal('alert')}
                    className="px-4 py-2 rounded-xl font-semibold text-sm flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-all">
                    <Bell className="h-3.5 w-3.5" />Get Alerts
                  </button>
                  <div className="flex-1" />
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Try:</span>
                  {['data analytics','cybersecurity','IT services','541511'].map(term => (
                    <button key={term} onClick={() => { setKeywords(term); runSearch() }}
                      className="px-3 py-1.5 rounded-full text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 hover:border-orange-400 transition-colors">
                      {term}
                    </button>
                  ))}
                  {results.length > 0 && keywords && (
                    <span className="text-xs font-bold text-green-700 bg-green-50 px-3 py-1.5 rounded-full border border-green-300">
                      ✓ "{keywords}"
                    </span>
                  )}
                </div>
              </div>

              <div className="p-6 bg-white dark:bg-slate-800">
                <div className="w-full">

                  {/* Loading message */}
                  {loading && (
                    <div className="mb-4 p-3.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-xl">
                      <div className="flex items-center gap-3 text-emerald-700 dark:text-emerald-400">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span className="text-base font-semibold">
                          Searching {keywords ? `"${keywords}"` : ''} opportunities... ({searchDuration}s)
                        </span>
                      </div>
                    </div>
                  )}

                  {/* ── Date filters ── */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

                    {/* LEFT: Posted Date — emerald accent */}
                    <div className="space-y-3">
                      <div className="rounded-xl border-2 border-emerald-200 dark:border-emerald-700 overflow-hidden">
                        <div className="px-4 py-2.5 flex items-center gap-2 bg-emerald-100 dark:bg-emerald-900/40">
                          <Calendar className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                          <span className="text-sm font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-wide">Solicitation Posted Date</span>
                        </div>
                        <div className="p-4 bg-white dark:bg-slate-800">
                          <input
                            type="date"
                            value={postedAfter}
                            onChange={(e) => setPostedAfter(e.target.value)}
                            className="w-full rounded-lg border-2 border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-white transition-all focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900 outline-none"
                          />
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Find solicitations posted on or after this date</p>
                        </div>
                      </div>
                      <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="px-4 py-2 flex items-center gap-2 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                          <Calendar className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                          <span className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-wide">Posted within the last:</span>
                        </div>
                        <div className="p-3 bg-white dark:bg-slate-800 flex flex-wrap gap-2">
                          {[{label:'12 months',days:-365},{label:'9 months',days:-274},{label:'6 months',days:-182},{label:'3 months',days:-91},{label:'30 days',days:-30},{label:'2 weeks',days:-14}].map(({label,days}) => (
                            <button key={label} onClick={() => { const d=new Date(); d.setDate(d.getDate()+days); setPostedAfter(d.toISOString().split('T')[0]) }}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 hover:bg-emerald-50 hover:border-emerald-400 hover:text-emerald-700 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-300 transition-all">
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* RIGHT: Due Date — amber accent */}
                    <div className="space-y-3">
                      <div className="rounded-xl border-2 border-amber-200 dark:border-amber-700 overflow-hidden">
                        <div className="px-4 py-2.5 flex items-center gap-2 bg-amber-100 dark:bg-amber-900/40">
                          <Clock className="h-4 w-4 text-amber-700 dark:text-amber-400" />
                          <span className="text-sm font-black text-amber-800 dark:text-amber-300 uppercase tracking-wide">Solicitation Due Date</span>
                        </div>
                        <div className="p-4 bg-white dark:bg-slate-800">
                          <input
                            type="date"
                            value={responseDeadlineBefore}
                            onChange={(e) => setResponseDeadlineBefore(e.target.value)}
                            className="w-full rounded-lg border-2 border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-white transition-all focus:border-amber-400 focus:ring-2 focus:ring-amber-100 dark:focus:ring-amber-900 outline-none"
                          />
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Find solicitations with response due date up to the selected date</p>
                        </div>
                      </div>
                      <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="px-4 py-2 flex items-center gap-2 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                          <Clock className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                          <span className="text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-wide">Due within the next:</span>
                        </div>
                        <div className="p-3 bg-white dark:bg-slate-800 flex flex-wrap gap-2">
                          {[{label:'2 weeks',days:14},{label:'30 days',days:30},{label:'45 days',days:45},{label:'60 days',days:60},{label:'90 days',days:90}].map(({label,days}) => (
                            <button key={label} onClick={() => { const d=new Date(); d.setDate(d.getDate()+days); setResponseDeadlineBefore(d.toISOString().split('T')[0]) }}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 hover:bg-amber-50 hover:border-amber-400 hover:text-amber-700 dark:hover:bg-amber-900/30 dark:hover:text-amber-300 transition-all">
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Stop button — red, only when loading */}
                  {loading && (
                    <div className="mt-4 flex justify-center">
                      <button onClick={stopSearch}
                        className="px-8 py-4 bg-red-500 hover:bg-red-600 text-white font-bold text-lg rounded-xl transition-colors shadow-md flex items-center gap-3">
                        <StopCircle className="h-6 w-6" />Stop Search
                      </button>
                    </div>
                  )}

                  {/* Error display */}
                  {error && (
                    <div className="mt-4 p-5 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-700 rounded-xl">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-6 w-6 text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-red-700 dark:text-red-400 text-lg mb-1">Search Error</h4>
                          <p className="text-red-600 dark:text-red-300 text-base">{error}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Results section - only shown after search */}
          {results.length > 0 && (
            <div ref={resultsRef} className="transition-all duration-500 mt-6">
              {/* Results header with filter toggle */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-4xl font-bold text-[var(--color-text-primary)]">
                    {filteredResults.length.toLocaleString()} opportunities found
                  </h2>
                  {/* ── SMART CONTEXTUAL DESCRIPTION ── */}
                  <p className="text-lg font-bold mt-2 leading-relaxed flex flex-wrap items-center gap-x-1 gap-y-1">
                    <span className="text-[var(--color-text-secondary)]">Search for</span>

                    {keywords && (
                      <span className="text-[var(--color-primary)] bg-[var(--color-surface-muted)] px-2 py-0.5 rounded-md border border-[var(--color-border)]">"{keywords}"</span>
                    )}

                    {postedAfter && (
                      <>
                        <span className="text-[var(--color-text-secondary)] mx-0.5">·</span>
                        <span className="text-[var(--color-text-secondary)]">posted on or after</span>
                        <span className="rounded-md border border-[var(--color-border)] bg-[var(--color-accent-soft)] px-2 py-0.5 text-[var(--color-primary)]">
                          {new Date(postedAfter + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </>
                    )}

                    {responseDeadlineBefore && (
                      <>
                        <span className="text-[var(--color-text-secondary)] mx-0.5">·</span>
                        <span className="text-[var(--color-text-secondary)]">due on or after</span>
                        <span className="text-[var(--color-primary)] bg-[var(--color-surface-muted)] px-2 py-0.5 rounded-md border border-[var(--color-border)]">
                          {new Date(responseDeadlineBefore + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} (Today)
                        </span>
                      </>
                    )}

                    {selectedSetAsides.length > 0 && (
                      <>
                        <span className="text-[var(--color-text-secondary)] mx-0.5">·</span>
                        <span className="text-[var(--color-text-secondary)]">set-aside:</span>
                        <span className="text-[var(--color-text-secondary)] bg-[var(--color-surface-muted)] px-2 py-0.5 rounded-md border border-[var(--color-border)]">
                          {selectedSetAsides.length === 1 ? (getSetAsideLabel(selectedSetAsides[0]) || selectedSetAsides[0]) : `${selectedSetAsides.length} set-aside types`}
                        </span>
                      </>
                    )}

                    {selectedStates.length > 0 && (
                      <>
                        <span className="text-[var(--color-text-secondary)] mx-0.5">·</span>
                        <span className="text-[var(--color-text-secondary)]">state:</span>
                        <span className="rounded-md border border-[var(--color-border)] bg-[var(--color-accent-soft)] px-2 py-0.5 text-[var(--color-primary)]">
                          {selectedStates.length === 1 ? (getLocationLabel(selectedStates[0]) || selectedStates[0]) : `${selectedStates.length} states`}
                        </span>
                      </>
                    )}

                    <span className="text-[var(--color-text-secondary)]">successfully returned</span>
                    <span className="text-[var(--color-text-primary)] bg-[var(--color-accent-soft)] px-2.5 py-0.5 rounded-md font-extrabold text-xl border border-[var(--color-border)]">
                      {filteredResults.length.toLocaleString()}
                    </span>

                    {data?.totalRecords && data.totalRecords > filteredResults.length && (
                      <span className="text-base font-semibold text-[var(--color-text-secondary)]">(filtered from {data.totalRecords.toLocaleString()} total)</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                      showFilters 
                        ? 'border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-primary)]' 
                        : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/40 text-[var(--color-text-secondary)]'
                    }`}
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    Filters
                    {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                  
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-4 py-2 rounded-lg border-2 border-[var(--color-border)] bg-[var(--color-surface)] focus:border-[var(--color-primary)]/40 outline-none text-[var(--color-text-primary)] font-semibold"
                  >
                    <option value="deadline-asc">Deadline (Soonest)</option>
                    <option value="deadline-desc">Deadline (Latest)</option>
                    <option value="posted-desc">Newest first</option>
                    <option value="posted-asc">Oldest first</option>
                  </select>

                  <div className="flex items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-1">
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded transition-all ${
                        viewMode === 'list' ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-sm' : 'text-[var(--color-text-subtle)]'
                      }`}
                    >
                      <List className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded transition-all ${
                        viewMode === 'grid' ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-sm' : 'text-[var(--color-text-subtle)]'
                      }`}
                    >
                      <Grid className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Filter panel - collapsible */}
              {showFilters && (
                <div className="mb-8 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)]">
                  <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-[var(--color-text-primary)]">
                    <Filter className="h-5 w-5 text-[var(--color-primary)]" />
                    Refine Results
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {/* KEYWORD - FIRST */}
                    <div>
                      <label style={{ fontFamily: 'var(--font-ui), system-ui, sans-serif' }} className="block text-lg font-bold text-[var(--color-text-secondary)] mb-2">Keyword</label>
                      <input
                        type="text"
                        value={advKeywords}
                        onChange={(e) => {
                          setAdvKeywords(e.target.value)
                          setAdvancedApplied(true)
                        }}
                        placeholder="e.g., Data Analytics"
                        className="w-full rounded-lg border-2 border-[var(--color-border)] px-4 py-3 text-base font-semibold text-[var(--color-text-primary)] transition-all focus:border-[var(--color-primary)]/40 focus:ring-4 focus:ring-[var(--color-accent-soft)]"
                      />
                      <p className="mt-1 text-xs text-[var(--color-text-subtle)]">Filters shown results instantly</p>
                    </div>
                    {/* SET-ASIDE - SECOND */}
                    <div>
                      <MultiSelectDropdown
                        label="Set-Aside"
                        options={SET_ASIDE_OPTIONS.filter(opt => opt.code !== '')}
                        selected={selectedSetAsides}
                        onChange={setSelectedSetAsides}
                        placeholder="Any Set-Aside"
                      />
                    </div>
                    {/* STATE - THIRD */}
                    <div>
                      <MultiSelectDropdown
                        label="State"
                        options={US_STATES_AND_TERRITORIES.filter(loc => loc.code !== '').map(loc => ({ code: loc.code, label: loc.label }))}
                        selected={selectedStates}
                        onChange={setSelectedStates}
                        placeholder="Any State/Territory"
                      />
                    </div>
                    {/* AGENCY */}
                    <div>
                      <label style={{ fontFamily: 'var(--font-ui), system-ui, sans-serif' }} className="block text-lg font-bold text-[var(--color-text-secondary)] mb-2">Agency</label>
                      <input
                        type="text"
                        value={agency}
                        onChange={(e) => setAgency(e.target.value)}
                        placeholder="e.g., Department of Defense"
                        className="w-full rounded-lg border-2 border-[var(--color-border)] px-4 py-3 text-base font-semibold text-[var(--color-text-primary)] transition-all focus:border-[var(--color-primary)]/40 focus:ring-4 focus:ring-[var(--color-accent-soft)]"
                      />
                    </div>
                    {/* NAICS CODE */}
                    <div>
                      <label style={{ fontFamily: 'var(--font-ui), system-ui, sans-serif' }} className="block text-lg font-bold text-[var(--color-text-secondary)] mb-2">NAICS Code</label>
                      <input
                        type="text"
                        value={naics}
                        onChange={(e) => setNaics(e.target.value)}
                        placeholder="e.g., 541511"
                        className="w-full rounded-lg border-2 border-[var(--color-border)] px-4 py-3 text-base font-semibold text-[var(--color-text-primary)] transition-all focus:border-[var(--color-primary)]/40 focus:ring-4 focus:ring-[var(--color-accent-soft)]"
                      />
                    </div>
                    {/* PROCUREMENT TYPE */}
                    <div>
                      <label style={{ fontFamily: 'var(--font-ui), system-ui, sans-serif' }} className="block text-lg font-bold text-[var(--color-text-secondary)] mb-2">Procurement Type</label>
                      <select
                        value={procurementType}
                        onChange={(e) => setProcurementType(e.target.value)}
                        className="w-full rounded-lg border-2 border-[var(--color-border)] px-4 py-3 text-base font-semibold text-[var(--color-text-primary)] transition-all focus:border-[var(--color-primary)]/40 focus:ring-4 focus:ring-[var(--color-accent-soft)]"
                      >
                        <option value="">All Opportunity Types</option>
                        <option value="o">Solicitation — Formal request for bids/proposals</option>
                        <option value="k">Combined Synopsis/Solicitation — Simplified bid request</option>
                        <option value="p">Pre-Solicitation — Early notice before bidding opens</option>
                        <option value="r">Sources Sought — Agency researching vendors</option>
                        <option value="a">Award Notice — Contract already awarded</option>
                        <option value="u">Justification (J&A) — Sole-source justification</option>
                        <option value="s">Special Notice — General announcements</option>
                      </select>
                    </div>
                    {/* PSC CODE */}
                    <div>
                      <label style={{ fontFamily: 'var(--font-ui), system-ui, sans-serif' }} className="block text-lg font-bold text-[var(--color-text-secondary)] mb-2">PSC Code</label>
                      <input
                        type="text"
                        value={classificationCode}
                        onChange={(e) => setClassificationCode(e.target.value)}
                        placeholder="e.g., R425"
                        className="w-full rounded-lg border-2 border-[var(--color-border)] px-4 py-3 text-base font-semibold text-[var(--color-text-primary)] transition-all focus:border-[var(--color-primary)]/40 focus:ring-4 focus:ring-[var(--color-accent-soft)]"
                      />
                    </div>
                    {/* SOLICITATION # */}
                    <div>
                      <label style={{ fontFamily: 'var(--font-ui), system-ui, sans-serif' }} className="block text-lg font-bold text-[var(--color-text-secondary)] mb-2">Solicitation #</label>
                      <input
                        type="text"
                        value={solicitationNumber}
                        onChange={(e) => setSolicitationNumber(e.target.value)}
                        placeholder="e.g., W912DY24R0001"
                        className="w-full rounded-lg border-2 border-[var(--color-border)] px-4 py-3 text-base font-semibold text-[var(--color-text-primary)] transition-all focus:border-[var(--color-primary)]/40 focus:ring-4 focus:ring-[var(--color-accent-soft)]"
                      />
                    </div>
                    {/* STATUS */}
                    <div>
                      <label style={{ fontFamily: 'var(--font-ui), system-ui, sans-serif' }} className="block text-lg font-bold text-[var(--color-text-secondary)] mb-2">Status</label>
                      <select
                        value={opportunityStatus}
                        onChange={(e) => setOpportunityStatus(e.target.value)}
                        className="w-full rounded-lg border-2 border-[var(--color-border)] px-4 py-3 text-base font-semibold text-[var(--color-text-primary)] transition-all focus:border-[var(--color-primary)]/40 focus:ring-4 focus:ring-[var(--color-accent-soft)]"
                      >
                        <option value="">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="archived">Archived</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Active Filters bar — always visible with Reset button */}
                  <div className="pg-search-filter-meta mt-4 border-t border-[var(--color-border)] pt-4">
                    <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-[var(--color-text-primary)]">Active Refine Filters</span>
                        {(agency || selectedSetAsides.length > 0 || naics || selectedStates.length > 0 || procurementType || classificationCode || solicitationNumber || opportunityStatus) ? (
                          <span className="text-xs font-bold px-2 py-0.5 bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] rounded-full">
                            {[agency, ...selectedSetAsides, naics, ...selectedStates, procurementType, classificationCode, solicitationNumber, opportunityStatus].filter(Boolean).length} active
                          </span>
                        ) : (
                          <span className="text-sm font-medium text-[var(--color-text-subtle)]">None — showing all results</span>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setAgency('')
                          setSelectedSetAsides([])
                          setNaics('')
                          setSelectedStates([])
                          setProcurementType('')
                          setClassificationCode('')
                          setSolicitationNumber('')
                          setOpportunityStatus('active')
                          setAdvancedApplied(false)
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg transition-colors shadow-sm whitespace-nowrap"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Reset Refine Filters
                      </button>
                    </div>
                    {(agency || selectedSetAsides.length > 0 || naics || selectedStates.length > 0 || procurementType || classificationCode || solicitationNumber || opportunityStatus) && (
                      <div className="flex flex-wrap gap-2">
                        {agency && (
                          <span className="px-3 py-1.5 bg-slate-100 text-slate-800 border border-slate-200 rounded-full text-sm font-semibold flex items-center gap-1.5">
                            Agency: {agency}
                            <button onClick={() => setAgency('')} className="hover:text-red-600 transition-colors"><X className="h-4 w-4" /></button>
                          </span>
                        )}
                        {selectedSetAsides.length > 0 && (
                          <span className="px-3 py-1.5 bg-slate-100 text-slate-800 border border-slate-200 rounded-full text-sm font-semibold flex items-center gap-1.5">
                            Set-Aside: {selectedSetAsides.length === 1 ? (getSetAsideLabel(selectedSetAsides[0]) || selectedSetAsides[0]) : `${selectedSetAsides.length} selected`}
                            <button onClick={() => setSelectedSetAsides([])} className="hover:text-red-600 transition-colors"><X className="h-4 w-4" /></button>
                          </span>
                        )}
                        {naics && (
                          <span className="px-3 py-1.5 bg-slate-100 text-slate-800 border border-slate-200 rounded-full text-sm font-semibold flex items-center gap-1.5">
                            NAICS: {naics}
                            <button onClick={() => setNaics('')} className="hover:text-red-600 transition-colors"><X className="h-4 w-4" /></button>
                          </span>
                        )}
                        {selectedStates.length > 0 && (
                          <span className="px-3 py-1.5 bg-slate-100 text-slate-800 border border-slate-200 rounded-full text-sm font-semibold flex items-center gap-1.5">
                            State: {selectedStates.length === 1 ? (getLocationLabel(selectedStates[0]) || selectedStates[0]) : `${selectedStates.length} selected`}
                            <button onClick={() => setSelectedStates([])} className="hover:text-red-600 transition-colors"><X className="h-4 w-4" /></button>
                          </span>
                        )}
                        {procurementType && (
                          <span className="px-3 py-1.5 bg-slate-100 text-slate-800 border border-slate-200 rounded-full text-sm font-semibold flex items-center gap-1.5">
                            Type: {({'o':'Solicitation','k':'Combined Synopsis','p':'Pre-Solicitation','r':'Sources Sought','a':'Award Notice','u':'J&A','s':'Special Notice'} as Record<string,string>)[procurementType] || procurementType}
                            <button onClick={() => setProcurementType('')} className="hover:text-red-600 transition-colors"><X className="h-4 w-4" /></button>
                          </span>
                        )}
                        {classificationCode && (
                          <span className="px-3 py-1.5 bg-slate-100 text-slate-800 border border-slate-200 rounded-full text-sm font-semibold flex items-center gap-1.5">
                            PSC: {classificationCode}
                            <button onClick={() => setClassificationCode('')} className="hover:text-red-600 transition-colors"><X className="h-4 w-4" /></button>
                          </span>
                        )}
                        {solicitationNumber && (
                          <span className="px-3 py-1.5 bg-slate-100 text-slate-800 border border-slate-200 rounded-full text-sm font-semibold flex items-center gap-1.5">
                            Sol #: {solicitationNumber}
                            <button onClick={() => setSolicitationNumber('')} className="hover:text-red-600 transition-colors"><X className="h-4 w-4" /></button>
                          </span>
                        )}
                        {opportunityStatus && (
                          <span className="px-3 py-1.5 bg-slate-100 text-slate-800 border border-slate-200 rounded-full text-sm font-semibold flex items-center gap-1.5">
                            Status: {opportunityStatus}
                            <button onClick={() => setOpportunityStatus('active')} className="hover:text-red-600 transition-colors"><X className="h-4 w-4" /></button>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Results count and action bar */}
              {(results.length > 0) && (
                <div className="pg-search-results-toolbar mb-6 p-4 bg-[var(--color-surface-muted)] rounded-xl border border-[var(--color-border)] shadow-sm">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <CheckCircle className="h-5 w-5 text-[var(--color-primary)] flex-shrink-0" />
                      <span className="text-base font-bold text-[var(--color-text-primary)]">
                        {showSavedOnly
                          ? <><span className="text-[var(--color-text-secondary)]">Showing {filteredResults.length} saved</span> of {results.length} results</>
                          : <>
                              {filteredResults.length >= 100 ? '🎯 Excellent! ' : filteredResults.length >= 10 ? '✅ Great! ' : ''}
                              Found{' '}
                              <span className="font-bold text-[var(--color-primary)]">{filteredResults.length.toLocaleString()}</span>
                              {' '}{filteredResults.length === 1 ? 'opportunity' : 'opportunities'}
                              {keywords && <> for <span className="text-[var(--color-primary)]">"{keywords}"</span></>}
                              {' '}—{' '}
                              <button onClick={() => handleOpenSaveModal('save')} className="text-slate-700 underline underline-offset-2 hover:text-[var(--color-primary)] font-bold transition-colors">save this search</button>
                              {' '}or{' '}
                              <button onClick={() => handleOpenSaveModal('alert')} className="text-[var(--color-text-secondary)] underline underline-offset-2 hover:text-[var(--color-text-secondary)] font-bold transition-colors">get email alerts</button>
                              {' '}so you never miss an update
                            </>
                        }
                      </span>
                      {Object.values(saved).filter(Boolean).length > 0 && (
                        <button
                          onClick={() => setShowSavedOnly(prev => !prev)}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold shadow-sm transition-all ${showSavedOnly ? 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]' : 'pg-btn-tertiary text-[var(--color-text-primary)]'}`}
                        >
                          <Shield className="h-3.5 w-3.5 fill-current" />
                          {showSavedOnly ? '← Back To All Results' : `View Saved (${Object.values(saved).filter(Boolean).length})`}
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* NEW — Export & Share */}
                      <ExportSharePanel
                        results={filteredResults}
                        searchLabel={[
                          keywords || 'All opportunities',
                          postedAfter ? `from ${postedAfter}` : '',
                          responseDeadlineBefore ? `due by ${responseDeadlineBefore}` : '',
                        ].filter(Boolean).join(' · ')}
                      />

                      <button onClick={() => handleOpenSaveModal('save')} className="pg-btn pg-btn-secondary px-4 py-2 rounded-lg transition-colors text-sm font-bold flex items-center gap-1.5 shadow-sm">
                        <Save className="h-3.5 w-3.5" />Save Search
                      </button>
                      <button onClick={() => router.push('/alerts')} className="pg-btn pg-btn-tertiary px-4 py-2 rounded-lg transition-colors text-sm font-bold flex items-center gap-1.5 shadow-sm">
                        <ExternalLink className="h-3.5 w-3.5" />Saved &amp; Alerts
                      </button>
                      <button onClick={() => handleOpenSaveModal('alert')} className="pg-btn pg-btn-primary px-4 py-2 rounded-lg transition-colors text-sm font-bold flex items-center gap-1.5 shadow-sm">
                        <Bell className="h-3.5 w-3.5" />Get Alerts
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Results display */}
              {filteredResults.length > 0 ? (
                <>
                  {viewMode === 'list' ? (
                    <div className="pg-search-results-list space-y-4">
                      {filteredResults.map((opp, idx) => (
                        <ResultCard
                          key={`${opp.noticeId || idx}`}
                          opportunity={opp}
                          index={idx}
                          isExpanded={!!expanded[opp.noticeId || String(idx)]}
                          toggleExpanded={toggleExpanded}
                          isSaved={!!saved[opp.noticeId || String(idx)]}
                          toggleSaved={toggleSaved}
                          copyText={copyText}
                          copiedId={copiedId}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="pg-search-results-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {filteredResults.map((opp, idx) => (
                        <OpportunityCard
                          key={`${opp.noticeId || idx}`}
                          opportunity={opp}
                          index={idx}
                          isSaved={!!saved[opp.noticeId || String(idx)]}
                          toggleSaved={toggleSaved}
                          copyText={copyText}
                          copiedId={copiedId}
                        />
                      ))}
                    </div>
                  )}

                  {/* Load more */}
                  {hasMoreResults && (
                    <div className="mt-8 text-center">
                      <button
                        onClick={loadMoreResults}
                        disabled={loadingMore}
                        className="inline-flex items-center gap-2 rounded-xl border-2 border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-3 font-medium transition-all hover:border-[var(--color-primary)]/40 hover:text-[var(--color-primary)]"
                      >
                        {loadingMore ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4" />
                            Load more results
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="pg-search-empty rounded-xl border-2 border-[var(--color-border)] bg-[var(--color-surface)] py-16 text-center shadow-sm">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
                    <AlertCircle className="h-9 w-9 text-red-500" />
                  </div>
                  <h3 className="mb-2 text-2xl font-black text-[var(--color-text-primary)]">No Results Found</h3>
                  <p className="mx-auto mb-6 max-w-sm text-base font-bold text-[var(--color-text-secondary)]">Your filters returned 0 opportunities. Try adjusting your search.</p>
                  <div className="text-left max-w-sm mx-auto mb-8 space-y-2 bg-[var(--color-surface-muted)] rounded-xl p-5 border border-[var(--color-border)]">
                    <p className="text-sm font-bold text-[var(--color-text-secondary)] uppercase tracking-wide mb-2">Suggestions</p>
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">✓ Remove or relax active filters</p>
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">✓ Use broader keywords (e.g., &quot;IT services&quot;)</p>
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">✓ Expand your date range</p>
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">✓ Try a different state or remove state filter</p>
                  </div>
                  <button onClick={resetAll} className="pg-btn pg-btn-primary px-8 py-3.5 rounded-lg transition-colors font-black text-base shadow-md">
                    Clear All Filters &amp; Start Fresh
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── STEP 8: Add sticky prompt render just before closing main tag ── */}
        {showStickyPrompt && !stickyPromptDismissed && filteredResults.length > 0 && (
          <StickyResultsPrompt
            count={filteredResults.length}
            keywords={keywords}
            postedAfter={postedAfter}
            responseDeadlineBefore={responseDeadlineBefore}
            selectedSetAsides={selectedSetAsides}
            selectedStates={selectedStates}
            onSave={() => { handleOpenSaveModal('save'); setStickyPromptDismissed(true); setShowStickyPrompt(false) }}
            onAlert={() => { handleOpenSaveModal('alert'); setStickyPromptDismissed(true); setShowStickyPrompt(false) }}
            onDismiss={() => { setStickyPromptDismissed(true); setShowStickyPrompt(false) }}
          />
        )}

        {/* Modals */}
        <UnifiedSaveSearchModal
          mode={saveModalMode}
          isOpen={showSaveModal}
          onClose={() => setShowSaveModal(false)}
          searchParams={{
            title: keywords.trim(),
            postedFrom: postedAfter.trim(),
            rdlto: responseDeadlineBefore.trim(),
            solnum: solicitationNumber.trim(),
            ptype: procurementType,
            typeOfSetAside: setAsideCodesToString(selectedSetAsides),
            status: opportunityStatus.trim(),
            state: locationCodesToString(selectedStates),
            ncode: naics.trim(),
            ccode: classificationCode.trim(),
            organizationName: agency.trim(),
          }}
          onSave={handleSaveSuccess}
        />

        <SaveSearchSuccessModal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          searchName={successData.searchName}
          isSubscription={successData.isSubscription}
        />
                <AccessControlModal
          isOpen={showAccessModal}
          onClose={() => setShowAccessModal(false)}
          featureName={blockedFeature}
        />

      </main>
    </SearchErrorBoundary>
  )
}

// Export with Suspense wrapper
export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-[var(--color-border)] border-t-transparent rounded-full"></div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  )
}