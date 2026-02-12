// app/opportunities/OpportunitiesClient.tsx
'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import OpportunityPreferencesSurvey from '@/components/OpportunityPreferencesSurvey';
import {
  TrendingUp, Building2, Calendar, Award, Target, Briefcase,
  ExternalLink, Search, RefreshCw, XCircle,
  CheckCircle2, Timer, ChevronDown, Loader2, Heart,
  Trophy, Star, TargetIcon, Zap, CheckCircle, AlertCircle, Filter,
  Bell, BarChart3, ArrowUpRight, LineChart, Download, Bookmark, Eye, Sparkles,
  List, Grid3x3, Layers, X, Settings, MapPin, Info,
  Share2, Link2, Mail, Printer, Copy, ChevronUp
} from 'lucide-react';

interface SamOpportunity {
  noticeId: string;
  title: string;
  solicitationNumber: string;
  department: string;
  postedDate: string;
  updatedPostedDate?: string;
  responseDeadLine: string;
  updatedResponseDeadLine?: string;
  naicsCode: string;
  classificationCode?: string;
  typeOfSetAsideDescription: string;
  typeOfSetAside: string;           // SAM.gov setAsideCode: SBA, SDVOSBC, WOSB, etc.
  setAside?: string;                // setAside description from API response
  uiLink: string;
  type?: string;                    // Opportunity type: o, p, a, r, s, etc.
  organizationType?: string;        // department / subtier / office
  fullParentPathName?: string;      // Full org path e.g. "DEPT OF DEFENSE:DEPT OF THE ARMY"
  fullParentPathCode?: string;
  active?: string;                  // "Yes" or "No"
  officeAddress?: {
    city?: string;
    state?: string;
    zip?: string;
  };
  placeOfPerformance?: {
    city?: { code?: string; name?: string };
    state?: { code?: string; name?: string };
    zip?: string;
  };
  pointOfContact?: Array<{
    type?: string;
    title?: string;
    fullname?: string;
    email?: string;
    phone?: string;
  }>;
  aiAnalysis?: {
    matchScore?: number;
    competitionLevel?: string;
    winProbability?: string;
    keyRequirements?: string[];
    risks?: string[];
    opportunities?: string[];
    recommendation?: string;
  };
}

// View mode types
type ViewMode = 'list' | 'grid' | 'compact';
type GroupMode = 'none' | 'department' | 'urgency' | 'setaside';

// 🎯 IMPROVED: Static placeholder data for immediate display
const PLACEHOLDER_OPPORTUNITIES: SamOpportunity[] = Array.from({ length: 10 }, (_, i) => ({
  noticeId: `placeholder-${i}`,
  title: 'Loading opportunity data...',
  solicitationNumber: `XX-XX-XXXX-${i.toString().padStart(4, '0')}`,
  department: 'Federal Agency',
  postedDate: new Date().toISOString(),
  responseDeadLine: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  naicsCode: 'XXXXXX',
  typeOfSetAsideDescription: 'Set-Aside',
  typeOfSetAside: 'SBA',
  uiLink: '#',
  officeAddress: {
    city: 'Washington',
    state: 'DC'
  }
}));

// 🎯 NEW: User profile interface
interface UserProfile {
  first_name: string;
  lastName?: string;
  companyName?: string;
  naicsCodes?: string[];
  certifications?: string[];
  monthlyGoal?: number;
  achievedThisMonth?: number;
  favoriteAgencies?: string[];
  hasCompletedSurvey?: boolean;
}

// 🎯 NEW: Personalized achievement messages
const ACHIEVEMENT_MESSAGES = [
  "You're on track to hit your monthly goal!",
  "Great job staying ahead of deadlines!",
  "Your profile matches 95% of today's opportunities!",
  "You've saved 12 hours of research time this week!",
  "Perfect match found for your certifications!"
];

const PERSONALIZED_TIPS = [
  "Based on your profile, focus on Small Business Set-Asides",
  "Your NAICS codes are in high demand this month",
  "Consider expanding to include HUBZone opportunities",
  "You qualify for 8(a) program opportunities"
];

// ✅ NEW: Neutral styling for opportunities with no response deadline
const getNoDeadlineGradient = () => 'from-slate-800/60 to-slate-900/70 border-slate-700/70';
const getNoDeadlineTextColor = () => 'text-slate-200';
const getNoDeadlineBadgeColor = () => 'bg-slate-900/60 text-slate-200 border-slate-600/60';

// 🎯 NEW: Utility function to get urgency gradient colors
// ✅ FIXED: Proper red-to-green gradient based on business days
const getUrgencyGradient = (businessDays: number) => {
  if (businessDays <= 3) return 'from-red-600/40 to-red-500/30 border-red-500/70';        // 🔴 CRITICAL
  if (businessDays <= 5) return 'from-orange-600/40 to-orange-500/30 border-orange-500/70'; // 🟠 URGENT
  if (businessDays <= 7) return 'from-amber-600/40 to-amber-500/30 border-amber-500/70';   // 🟡 HIGH
  if (businessDays <= 10) return 'from-yellow-500/40 to-yellow-400/30 border-yellow-400/70'; // 🟡 ACT SOON
  if (businessDays <= 14) return 'from-lime-500/40 to-lime-400/30 border-lime-500/70';     // 🟢 NORMAL
  if (businessDays <= 21) return 'from-green-500/40 to-green-400/30 border-green-500/70';  // 🟢 COMFORTABLE
  if (businessDays <= 30) return 'from-emerald-500/40 to-emerald-400/30 border-emerald-500/70'; // 🟢 AMPLE
  return 'from-emerald-600/40 to-emerald-700/30 border-emerald-600/70'; // 🟢 PLENTY
};

const getUrgencyTextColor = (businessDays: number) => {
  if (businessDays <= 3) return 'text-red-400';
  if (businessDays <= 5) return 'text-orange-400';
  if (businessDays <= 7) return 'text-amber-400';
  if (businessDays <= 10) return 'text-yellow-300';
  if (businessDays <= 14) return 'text-lime-400';
  if (businessDays <= 21) return 'text-green-400';
  if (businessDays <= 30) return 'text-emerald-400';
  return 'text-emerald-500';
};

const getUrgencyBadgeColor = (businessDays: number) => {
  if (businessDays <= 3) return 'bg-red-600 text-white border-red-700';
  if (businessDays <= 5) return 'bg-orange-600 text-white border-orange-700';
  if (businessDays <= 7) return 'bg-amber-600 text-white border-amber-700';
  if (businessDays <= 10) return 'bg-yellow-600 text-white border-yellow-700';
  if (businessDays <= 14) return 'bg-lime-600 text-white border-lime-700';
  if (businessDays <= 21) return 'bg-green-600 text-white border-green-700';
  if (businessDays <= 30) return 'bg-emerald-600 text-white border-emerald-700';
  return 'bg-emerald-700 text-white border-emerald-800';
};

const getUrgencyLabel = (businessDays: number) => {
  if (businessDays <= 3) return 'CRITICAL';
  if (businessDays <= 5) return 'URGENT';
  if (businessDays <= 7) return 'HIGH PRIORITY';
  if (businessDays <= 10) return 'ACT SOON';
  if (businessDays <= 14) return 'NORMAL';
  if (businessDays <= 21) return 'COMFORTABLE';
  if (businessDays <= 30) return 'AMPLE TIME';
  return 'PLENTY OF TIME';
};

// ✅ NEW: Rank function so urgent cards sort LEFT in grid
const getUrgencyRank = (businessDays: number | null) => {
  if (businessDays === null || Number.isNaN(businessDays)) return 999;
  if (businessDays <= 3) return 0;
  if (businessDays <= 5) return 1;
  if (businessDays <= 7) return 2;
  if (businessDays <= 10) return 3;
  if (businessDays <= 14) return 4;
  if (businessDays <= 21) return 5;
  if (businessDays <= 30) return 6;
  return 7;
};

// 🎯 NEW: Department color mapping
const getDepartmentGradient = (department: string) => {
  const dept = department?.toUpperCase() || '';
  if (dept.includes('DEFENSE') || dept.includes('ARMY') || dept.includes('NAVY') || dept.includes('AIR FORCE')) 
    return 'from-indigo-500/20 to-blue-600/20 border-indigo-500/40';
  if (dept.includes('HOMELAND') || dept.includes('DHS')) 
    return 'from-red-500/20 to-orange-600/20 border-red-500/40';
  if (dept.includes('HEALTH') || dept.includes('HHS')) 
    return 'from-green-500/20 to-emerald-600/20 border-green-500/40';
  if (dept.includes('ENERGY') || dept.includes('DOE')) 
    return 'from-yellow-500/20 to-amber-600/20 border-yellow-500/40';
  if (dept.includes('NASA') || dept.includes('SPACE')) 
    return 'from-purple-500/20 to-pink-600/20 border-purple-500/40';
  if (dept.includes('VETERANS') || dept.includes('VA')) 
    return 'from-teal-500/20 to-cyan-600/20 border-teal-500/40';
  if (dept.includes('GENERAL SERVICES') || dept.includes('GSA')) 
    return 'from-slate-500/20 to-gray-600/20 border-slate-500/40';
  return 'from-blue-500/20 to-indigo-600/20 border-blue-500/40';
};

// ✅ SECTION 1: Agency abbreviation helper
const getAgencyAbbreviation = (department?: string) => {
  if (!department) return 'FED';
  // fullParentPathName: "DEPT OF DEFENSE:DEPT OF THE ARMY:..." — use first segment
  const dept = (department.split(':')[0]).toUpperCase();
  if (dept.includes('DEFENSE'))          return 'DOD';
  if (dept.includes('ARMY'))             return 'ARMY';
  if (dept.includes('NAVY') || (dept.includes('NAVAL'))) return 'NAVY';
  if (dept.includes('AIR FORCE'))        return 'USAF';
  if (dept.includes('MARINE'))           return 'USMC';
  if (dept.includes('SPACE FORCE'))      return 'USSF';
  if (dept.includes('HOMELAND'))         return 'DHS';
  if (dept.includes('VETERANS'))         return 'VA';
  if (dept.includes('HEALTH'))           return 'HHS';
  if (dept.includes('ENERGY'))           return 'DOE';
  if (dept.includes('NASA'))             return 'NASA';
  if (dept.includes('GENERAL SERVICES')) return 'GSA';
  if (dept.includes('JUSTICE'))          return 'DOJ';
  if (dept.includes('INTERIOR'))         return 'DOI';
  if (dept.includes('AGRICULTURE'))      return 'USDA';
  if (dept.includes('TRANSPORTATION'))   return 'DOT';
  if (dept.includes('TREASURY'))         return 'TREAS';
  if (dept.includes('COMMERCE'))         return 'DOC';
  if (dept.includes('LABOR'))            return 'DOL';
  if (dept.includes('STATE'))            return 'DOS';
  if (dept.includes('EDUCATION'))        return 'ED';
  if (dept.includes('HOUSING'))          return 'HUD';
  if (dept.includes('SOCIAL SECURITY'))  return 'SSA';
  if (dept.includes('ENVIRONMENTAL'))    return 'EPA';
  if (dept.includes('COAST GUARD'))      return 'USCG';
  if (dept.includes('CUSTOMS'))          return 'CBP';
  if (dept.includes('IMMIGRATION'))      return 'ICE';
  // Fallback: initials of meaningful words
  const words = dept.split(/\s+/).filter(w => w.length > 2 && !['OF','THE','AND','FOR','IN'].includes(w));
  return words.slice(0, 3).map(w => w[0]).join('') || 'FED';
};

/**
 * Calculate business days between two dates (excludes weekends)
 */
const calculateBusinessDays = (startDate: Date, endDate: Date): number => {
  let count = 0;
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
};

const getBusinessDaysUntil = (deadline: Date | string | null): number | null => {
  if (!deadline) return null;
  const deadlineDate = typeof deadline === 'string' ? new Date(deadline) : deadline;
  if (isNaN(deadlineDate.getTime())) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  deadlineDate.setHours(0, 0, 0, 0);

  if (deadlineDate < today) return -1; // past deadline

  return calculateBusinessDays(today, deadlineDate);
};

/**
 * Get the effective deadline for an opportunity
 * Returns updated deadline if available, otherwise original deadline, otherwise null
 */
const getEffectiveDeadline = (opportunity: any): Date | null => {
  const possibleDeadlineFields = [
    'updatedResponseDeadLine',
    'responseDeadLine',
    'updatedResponseDeadline',
    'responseDeadline',
    'updated_response_deadline',
    'response_deadline',
    'archiveDate',
    'closingDate',
    'dueDate',
    'dateOffersDue',
    'date_offers_due',
    'offersdue',
    'deadline'
  ];
  
  for (const field of possibleDeadlineFields) {
    const value = opportunity[field];
    if (value) {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return date;
        }
      } catch (e) {
        // Continue trying other fields
      }
    }
  }
  
  return null;
};

/**
 * Get the effective posted date (use updated if available)
 */
const getEffectivePostedDate = (opportunity: any): string => {
  const possiblePostedFields = [
    'updatedPostedDate',
    'postedDate',
    'updated_posted_date',
    'posted_date',
    'publishedDate',
    'published_date',
    'datePublished',
    'date_published'
  ];
  
  for (const field of possiblePostedFields) {
    const value = opportunity[field];
    if (value) {
      return value;
    }
  }
  
  return new Date().toISOString(); // Fallback to current date
};

const formatDate = (dateString: string | Date | null | undefined) => {
  if (!dateString) return '—';
  try {
    // Treat bare YYYY-MM-DD as local date to avoid UTC off-by-one shift
    let date: Date;
    if (typeof dateString === 'string' && /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(dateString)) {
      const parts = dateString.split('-');
      date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    } else {
      date = typeof dateString === 'string' ? new Date(dateString) : dateString as Date;
    }
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return '—';
  }
};

// Checks if an opportunity has any set-aside designation
// API sends: setAside = code (e.g. "SBA"), typeOfSetAsideDescription = full text
const hasSetAside = (o: SamOpportunity): boolean => {
  const NONE_VALUES = new Set(['', 'none', 'n/a', 'not applicable', 'no set aside used']);
  const code = ((o as any).setAside || (o as any).typeOfSetAside || '').trim().toLowerCase();
  const desc = ((o as any).typeOfSetAsideDescription || '').trim().toLowerCase();
  if (!NONE_VALUES.has(code) && code.length > 0) return true;
  if (!NONE_VALUES.has(desc) && desc.length > 2) return true;
  return false;
};

// Set-aside code → { label, color, bg, text } based on SAM.gov official codes
const SET_ASIDE_STYLES: Record<string, { label: string; color: string; bg: string; text: string }> = {
  SBA:       { label: 'Small Business',           color: '#eab308', bg: 'rgba(234,179,8,0.15)',   text: '#fde047' },
  SBP:       { label: 'Partial SB',               color: '#f59e0b', bg: 'rgba(245,158,11,0.15)',  text: '#fcd34d' },
  '8A':      { label: '8(a)',                      color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)',  text: '#c4b5fd' },
  '8AN':     { label: '8(a) Sole Source',          color: '#7c3aed', bg: 'rgba(124,58,237,0.15)',  text: '#a78bfa' },
  HZC:       { label: 'HUBZone',                   color: '#06b6d4', bg: 'rgba(6,182,212,0.15)',   text: '#67e8f9' },
  HZS:       { label: 'HUBZone Sole',              color: '#0891b2', bg: 'rgba(8,145,178,0.15)',   text: '#38bdf8' },
  SDVOSBC:   { label: 'SDVOSB',                    color: '#22c55e', bg: 'rgba(34,197,94,0.15)',   text: '#86efac' },
  SDVOSBS:   { label: 'SDVOSB Sole',               color: '#16a34a', bg: 'rgba(22,163,74,0.15)',   text: '#4ade80' },
  WOSB:      { label: 'WOSB',                      color: '#ec4899', bg: 'rgba(236,72,153,0.15)',  text: '#f9a8d4' },
  WOSBSS:    { label: 'WOSB Sole',                 color: '#db2777', bg: 'rgba(219,39,119,0.15)',  text: '#f472b6' },
  EDWOSB:    { label: 'EDWOSB',                    color: '#f43f5e', bg: 'rgba(244,63,94,0.15)',   text: '#fda4af' },
  EDWOSBSS:  { label: 'EDWOSB Sole',               color: '#e11d48', bg: 'rgba(225,29,72,0.15)',   text: '#fb7185' },
  VSA:       { label: 'VOSB',                      color: '#3b82f6', bg: 'rgba(59,130,246,0.15)',  text: '#93c5fd' },
  VSS:       { label: 'VOSB Sole',                 color: '#2563eb', bg: 'rgba(37,99,235,0.15)',   text: '#60a5fa' },
  LAS:       { label: 'Local Area',                color: '#14b8a6', bg: 'rgba(20,184,166,0.15)',  text: '#5eead4' },
  IEE:       { label: 'Indian Econ',               color: '#f97316', bg: 'rgba(249,115,22,0.15)',  text: '#fdba74' },
  ISBEE:     { label: 'Indian SB Econ',            color: '#ea580c', bg: 'rgba(234,88,12,0.15)',   text: '#fb923c' },
  BICIVC:    { label: 'Buy Indian',                color: '#d97706', bg: 'rgba(217,119,6,0.15)',   text: '#fbbf24' },
};

const getSetAsideStyle = (opp: SamOpportunity) => {
  const code = ((opp as any).setAside || opp.typeOfSetAside || '').trim().toUpperCase();
  return SET_ASIDE_STYLES[code] || null;
};


export default function OpportunitiesClient() {
  const searchParams = useSearchParams();
  const filterParam = searchParams?.get('filter') ?? null;
  const { data: session, status: sessionStatus } = useSession();
  const isLoggedIn = sessionStatus === 'authenticated';

  const [allOpportunities, setAllOpportunities] = useState<SamOpportunity[]>([]);
  const [displayedOpportunities, setDisplayedOpportunities] = useState<SamOpportunity[]>(PLACEHOLDER_OPPORTUNITIES);
  const [filteredOpportunities, setFilteredOpportunities] = useState<SamOpportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [keywordSearch, setKeywordSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedSetAside, setSelectedSetAside] = useState<string>('all');
  const [displayCount, setDisplayCount] = useState(250);
  const [totalRecords, setTotalRecords] = useState(0);
  const [lastUpdated, setLastUpdated] = useState('Just now');
  const [dataLoaded, setDataLoaded] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'active' | 'setasides' | 'expiring' | 'departments' | null>(null);
  const [savedOpportunities, setSavedOpportunities] = useState<Set<string>>(new Set());
  const [viewedOpportunities, setViewedOpportunities] = useState<Set<string>>(new Set());
  const [analyzingOpps, setAnalyzingOpps] = useState<Set<string>>(new Set());
  const [opportunityPreferences, setOpportunityPreferences] = useState<any>(null);
  const [selectedAgency, setSelectedAgency] = useState<string>('all');
  const [selectedNAICS, setSelectedNAICS] = useState<string>('all');
  const [selectedUrgency, setSelectedUrgency] = useState<string>('all');
  const [selectedUrgencyFilters, setSelectedUrgencyFilters] = useState<Set<string>>(new Set());
  const resultsRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [refreshIndicator, setRefreshIndicator] = useState(false);

  // 🎯 NEW: View mode state
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [groupMode, setGroupMode] = useState<GroupMode>('urgency');
  const [surveyOpen, setSurveyOpen] = useState(false);
  const [showPrefsReminder, setShowPrefsReminder] = useState(false);
  const [selectedOpp, setSelectedOpp] = useState<SamOpportunity | null>(null);
  const [showMoreBands, setShowMoreBands] = useState<Record<string, boolean>>({});

  // ✅ NEW: Banner dismissal states
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(true);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  
  // ✅ NEW: Toggle for showing/hiding all opportunities including no-deadline
  const [showAllOpportunities, setShowAllOpportunities] = useState(false);

  // Share tray state
  const [shareOpen, setShareOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // 🎯 FIXED: Get user name from session
  const userName = session?.user?.name?.split(' ')[0] || '';
  const userDisplayName = userName 
    ? (userName.endsWith('s') ? `${userName}'` : `${userName}'s`)
    : '';

  // 🎯 FIXED: Create user profile from session
  const [userProfile, setUserProfile] = useState<UserProfile>({
    first_name: userName,
    companyName: 'Your Business',
    monthlyGoal: 10,
    achievedThisMonth: 7,
    hasCompletedSurvey: false
  });

  const [userAchievement, setUserAchievement] = useState('');
  const [userTip, setUserTip] = useState('');

  // 🎯 IMPROVED: Accurate stats calculation based on actual data
  const stats = useMemo(() => {
    if (!dataLoaded) {
      return {
        totalActive: 0,
        setAsides: 0,
        closingSoon: 0,
        departments: 0,
        postedToday: 0
      };
    }
    
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);

    // Use all opportunities for stats, not just displayed ones
    return {
      totalActive: allOpportunities.length,
      setAsides: allOpportunities.filter(o => {
        const code = (o.typeOfSetAside || o.setAside || '').trim().toUpperCase();
        const desc = (o.typeOfSetAsideDescription || '').trim();
        const knownCodes = ['SBA','SBP','8A','8AN','HZC','HZS','SDVOSBC','SDVOSBS','WOSB','WOSBSS','EDWOSB','EDWOSBSS','LAS','IEE','ISBEE','BICIVC','VSA','VSS'];
        return knownCodes.includes(code) ||
               (desc && !['None','none','NONE','N/A',''].includes(desc.trim()));
      }).length,
      closingSoon: allOpportunities.filter(o => {
        const deadline = getEffectiveDeadline(o);
        if (!deadline) return false;
        const daysUntil = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return daysUntil <= 7 && daysUntil > 0;
      }).length,
      departments: new Set(allOpportunities.map(o => o.department).filter(Boolean)).size,
      postedToday: allOpportunities.filter(o => {
        const posted = getEffectivePostedDate(o);
        return posted.startsWith(today);
      }).length
    };
  }, [dataLoaded, allOpportunities]);

  // 🎯 OPTIMIZED: Memoized filter application - FIXED to not filter everything out
  const applyFilters = useCallback((opportunities: SamOpportunity[],
    filter: string | null,
    search: string,
    type: string,
    setAside: string,
    active: typeof activeFilter,
    agency: string,
    naics: string,
    urgency: string,
    selectedUrgencyFilters: Set<string>,
    showAll: boolean
  ) => {
    let filtered = [...opportunities];

    // Apply URL filter parameter
    if (filter) {
      const today = new Date().toISOString().split('T')[0];
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      switch (filter) {
        case 'today':
          filtered = filtered.filter(opp => opp.postedDate?.startsWith(today));
          break;
        case 'expiring':
          filtered = filtered.filter(opp => {
            if (!opp.responseDeadLine) return false;
            const deadline = new Date(opp.responseDeadLine);
            return deadline <= nextWeek && deadline >= new Date();
          });
          break;
      }
    }

    // Apply active filter from pills
    if (active) {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      switch (active) {
        case 'setasides':
          filtered = filtered.filter(o => hasSetAside(o));
          break;
        case 'expiring':
          filtered = filtered.filter(o => {
            const deadline = getEffectiveDeadline(o);
            if (!deadline) return false;
            return deadline <= nextWeek && deadline >= new Date();
          });
          break;
      }
    }

    // Text search handled by keywordFiltered below applyFilters

    // Apply type filter
    if (type !== 'all') {
      filtered = filtered.filter(opp => opp.typeOfSetAside === type);
    }

    // Apply set-aside filter
    if (setAside !== 'all') {
      filtered = filtered.filter(opp => opp.typeOfSetAside === setAside);
    }

    // Apply agency filter
    if (agency !== 'all') {
      filtered = filtered.filter(opp => 
        opp.department?.toLowerCase().includes(agency.toLowerCase())
      );
    }

    // Apply NAICS filter
    if (naics !== 'all') {
      filtered = filtered.filter(opp => 
        opp.naicsCode?.startsWith(naics)
      );
    }

    // Urgency filter from legend pills — for list/compact view
    // Board view handles this via column dimming (not pre-filtering)
    if (selectedUrgencyFilters.size > 0) {
      filtered = filtered.filter(opp => {
        const deadline = getEffectiveDeadline(opp);
        if (!deadline) return false;
        const bd = getBusinessDaysUntil(deadline);
        if (bd === null) return false;
        // Map bd to column key
        let colKey = '';
        if (bd <= 3) colKey = 'CRITICAL';
        else if (bd <= 5) colKey = 'URGENT';
        else if (bd <= 7) colKey = 'HIGH';
        else if (bd <= 10) colKey = 'ACT SOON';
        else if (bd <= 14) colKey = 'NORMAL';
        else if (bd <= 21) colKey = 'COMFORTABLE';
        else if (bd <= 30) colKey = 'AMPLE';
        else colKey = 'PLENTY';
        return selectedUrgencyFilters.has(colKey);
      });
    }

    // Apply urgency dropdown filter
    if (urgency !== 'all') {
      filtered = filtered.filter(opp => {
        const deadline = getEffectiveDeadline(opp);
        if (!deadline) return false;

        const businessDays = getBusinessDaysUntil(deadline);
        if (businessDays === null) return false;

        switch (urgency) {
          case 'critical': return businessDays <= 3;
          case 'urgent': return businessDays >= 4 && businessDays <= 5;
          case 'high': return businessDays >= 6 && businessDays <= 7;
          case 'normal': return businessDays >= 8 && businessDays <= 14;
          case 'comfortable': return businessDays >= 15;
          default: return true;
        }
      });
    }

    // Date-based filtering - only filter out expired opportunities
    // Only filter out expired opportunities — no future cap, all opps show
    const now = new Date();
    filtered = filtered.filter(opp => {
      const deadline = getEffectiveDeadline(opp);
      if (!deadline) return showAll;
      return deadline >= now;
    });

    // Sort by urgency (most urgent FIRST)
    filtered.sort((a, b) => {
      const deadlineA = getEffectiveDeadline(a);
      const deadlineB = getEffectiveDeadline(b);
      
      const bdA = getBusinessDaysUntil(deadlineA) ?? 9999;
      const bdB = getBusinessDaysUntil(deadlineB) ?? 9999;
      
      return bdA - bdB;
    });

    return filtered;
  }, []);

  const analyzeOpportunity = async (opportunity: SamOpportunity) => {
    try {
      setAnalyzingOpps(prev => new Set(prev).add(opportunity.noticeId));
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || '',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          messages: [{
            role: 'user',
            content: `Analyze this federal contract opportunity for ${userProfile.companyName}:
Title: ${opportunity.title}
Department: ${opportunity.department}
NAICS: ${opportunity.naicsCode}
Set-Aside: ${opportunity.typeOfSetAsideDescription}
Response Deadline: ${opportunity.responseDeadLine}

Provide analysis in JSON format with:
- matchScore (0-100)
- competitionLevel (Low/Medium/High)
- winProbability (Low/Medium/High)
- keyRequirements (array of 3-5 key requirements)
- risks (array of 2-3 potential risks)
- opportunities (array of 2-3 competitive advantages)
- recommendation (one sentence recommendation)`
          }]
        })
      });
      if (!response.ok) return null;
      const data = await response.json();
      const analysisText = data.content[0].text;
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
      return null;
    } catch (error) {
      console.error('Error analyzing opportunity:', error);
      return null;
    } finally {
      setAnalyzingOpps(prev => {
        const next = new Set(prev);
        next.delete(opportunity.noticeId);
        return next;
      });
    }
  };

  const handleSaveOpportunity = (noticeId: string) => {
    setSavedOpportunities(prev => {
      const next = new Set(prev);
      if (next.has(noticeId)) {
        next.delete(noticeId);
      } else {
        next.add(noticeId);
      }
      return next;
    });
  };

  const handleViewOpportunity = (noticeId: string) => {
    setViewedOpportunities(prev => new Set(prev).add(noticeId));
  };

  const handleLoadMore = useCallback(() => {
    if (loadingMore) return;
    
    setLoadingMore(true);
    setTimeout(() => {
      setDisplayCount(prev => Math.min(prev + 30, displayedOpportunities.length));
      setLoadingMore(false);
    }, 500);
  }, [loadingMore, displayedOpportunities.length]);

  const handleExportOpportunities = () => {
    const header = ['Title', 'Department', 'NAICS', 'Posted Date', 'Deadline', 'Type', 'Link'].join(',');
    const rows = visibleOpportunities.map(opp => [
      `"${opp.title?.replace(/"/g, '""') || ''}"`,
      `"${opp.department?.replace(/"/g, '""') || ''}"`,
      opp.naicsCode || '',
      formatDate(opp.postedDate),
      opp.responseDeadLine ? formatDate(opp.responseDeadLine) : 'No deadline',
      opp.typeOfSetAsideDescription || '',
      opp.uiLink || ''
    ].join(','));
    
    const csvContent = [header, ...rows].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `opportunities-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleRefresh = () => {
    setRefreshIndicator(true);
    window.location.reload();
  };

  const handlePillClick = (type: 'active' | 'setasides' | 'expiring' | 'departments') => {
    if (activeFilter === type) {
      setActiveFilter(null);
    } else {
      setActiveFilter(type);
    }
  };

  // 🎯 NEW: Listen for survey completion
  useEffect(() => {
    const handleSurveyCompleted = (event: CustomEvent) => {
      setUserProfile(prev => ({
        ...prev,
        hasCompletedSurvey: true
      }));
      setOpportunityPreferences(event.detail);
    };

    window.addEventListener('surveyCompleted', handleSurveyCompleted as EventListener);
    return () => {
      window.removeEventListener('surveyCompleted', handleSurveyCompleted as EventListener);
    };
  }, []);

  // 🎯 FIXED: Set achievement messages based on session
  useEffect(() => {
    if (userName) {
      const randomAchievement = ACHIEVEMENT_MESSAGES[Math.floor(Math.random() * ACHIEVEMENT_MESSAGES.length)];
      const randomTip = PERSONALIZED_TIPS[Math.floor(Math.random() * PERSONALIZED_TIPS.length)];
      setUserAchievement(randomAchievement);
      setUserTip(randomTip);

      setUserProfile(prev => ({
        ...prev,
        first_name: userName
      }));
    } else {
      setUserAchievement('Discover thousands of federal opportunities!');
      setUserTip('Sign up to get personalized matches for your business');
    }
  }, [userName]);

  // 🎯 NEW: Listen for preference updates
  useEffect(() => {
    const handlePreferencesUpdate = (event: CustomEvent) => {
      setOpportunityPreferences(event.detail);
    };
    
    window.addEventListener('preferences-updated' as any, handlePreferencesUpdate);
    
    const savedPreferences = localStorage.getItem('opportunity-preferences');
    if (savedPreferences) {
      try {
        setOpportunityPreferences(JSON.parse(savedPreferences));
      } catch (e) {
        console.error('Error loading preferences:', e);
      }
    }
    
    return () => {
      window.removeEventListener('preferences-updated' as any, handlePreferencesUpdate);
    };
  }, []);

  // ✅ NEW: Check if banner was dismissed in localStorage
  useEffect(() => {
    const dismissed = localStorage.getItem('welcomeBannerDismissed') === 'true';
    setBannerDismissed(dismissed);
    if (dismissed) {
      setShowWelcomeBanner(false);
    }
  }, []);

  // ✅ NEW: Listen for survey completion to hide banner
  useEffect(() => {
    const handleSurveyCompleted = () => {
      setShowWelcomeBanner(false);
      localStorage.setItem('welcomeBannerDismissed', 'true');
    };
    
    window.addEventListener('surveyCompleted', handleSurveyCompleted);
    return () => window.removeEventListener('surveyCompleted', handleSurveyCompleted);
  }, []);

  // ✅ NEW: Handle banner dismissal
  const handleDismissBanner = () => {
    setShowWelcomeBanner(false);
    setBannerDismissed(true);
    localStorage.setItem('welcomeBannerDismissed', 'true');
  };

  // Fetch ALL opportunities from SAM.gov
  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const fetchAllOpportunities = async () => {
      try {
        if (!dataLoaded) {
          setLoading(true);
        }

        const response = await fetch(`/api/sam/opportunities?limit=1000&t=${Date.now()}`, {
          signal: abortController.signal
        });

        if (!response.ok) {
          if (response.status === 429) {
            console.warn(`⚠️ Rate limited by SAM.gov.`);
            if (isMounted && !dataLoaded) {
              setError('SAM.gov rate limit reached. Using sample data.');
              setLastUpdated('Rate Limited');
            }
          } else {
            console.warn(`⚠️ SAM API unavailable (${response.status}), using current data`);
            if (isMounted && !dataLoaded) {
              setError('SAM.gov API is temporarily unavailable. Showing sample data.');
              setLastUpdated('API Unavailable');
            }
          }
          return;
        }

        const result = await response.json();

        if (isMounted) {
          // Debug: dump full first opportunity to find real field names
          if (result.opportunities?.[0]) {
            const s = result.opportunities[0];
            console.log('🔍 FULL opportunity keys:', Object.keys(s));
            console.log('🔍 FULL opportunity:', JSON.stringify(s, null, 2));
          }
          
          // Normalize every opportunity — handle all possible API field name variants
          const opportunities = (result.opportunities || []).map((raw: any): SamOpportunity => {
            const o: SamOpportunity = { ...raw };

            // ── Department / Org ─────────────────────────────────────────
            // SAM v2 deprecated 'department'; real data is in fullParentPathName
            if (!o.department || o.department === 'Unknown') {
              o.department =
                (raw.fullParentPathName || '').split(':')[0].trim() ||
                raw.organizationName || raw.deptname || raw.subtier || '';
            }
            // Ensure fullParentPathName is populated
            if (!o.fullParentPathName) {
              o.fullParentPathName = raw.fullParentPathName || raw.organizationName || '';
            }

            // ── Set-Aside ────────────────────────────────────────────────
            // API field 'setAside' holds the CODE (SBA, WOSB, etc.)
            // 'typeOfSetAsideDescription' holds the human label
            const saCode = raw.setAside || raw.typeOfSetAside || raw.setAsideCode || '';
            const saDesc = raw.typeOfSetAsideDescription || raw.setAsideDescription || raw.setAsideType || '';
            o.typeOfSetAside = saCode.trim();
            o.typeOfSetAsideDescription = saDesc.trim();
            (o as any).setAside = saCode.trim(); // keep for hasSetAside()

            // ── NAICS ────────────────────────────────────────────────────
            if (!o.naicsCode) {
              o.naicsCode = raw.naicsCode || raw.naics || raw.naicsCodes?.[0] || '';
            }

            // ── Classification (PSC) ─────────────────────────────────────
            if (!o.classificationCode) {
              o.classificationCode = raw.classificationCode || raw.pscCode || raw.productServiceCode || '';
            }

            // ── Office Address ───────────────────────────────────────────
            if (!o.officeAddress && (raw.officeAddress || raw.city || raw.state)) {
              o.officeAddress = raw.officeAddress || {
                city: raw.city, state: raw.state, zip: raw.zip
              };
            }

            // ── Place of Performance ─────────────────────────────────────
            if (!o.placeOfPerformance && raw.placeOfPerformance) {
              o.placeOfPerformance = raw.placeOfPerformance;
            }

            // ── Point of Contact ─────────────────────────────────────────
            if (!o.pointOfContact && raw.pointOfContact) {
              o.pointOfContact = Array.isArray(raw.pointOfContact)
                ? raw.pointOfContact
                : [raw.pointOfContact];
            }

            // ── Opportunity Type ─────────────────────────────────────────
            if (!o.type) {
              o.type = raw.type || raw.opportunityType || raw.baseType || '';
            }

            return o;
          });
          
          // Only accept non-empty results — ignore the fast empty cache response
          if (opportunities.length > 0) {
            setAllOpportunities(opportunities);
            setTotalRecords(opportunities.length);
            setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            setDataLoaded(true);
            setError(null);
          } else if (!dataLoaded) {
            console.log('⏳ Empty response from API — waiting for real data...');
          }
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        console.error('Error fetching opportunities:', err);
        if (isMounted && !dataLoaded) {
          setError('Unable to connect to SAM.gov. Showing sample data.');
          setLastUpdated('Connection Failed');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          setRefreshIndicator(false);
        }
      }
    };

    fetchAllOpportunities();
    console.log("✅ Auto-fetch DISABLED. Use Refresh button to manually fetch from SAM.gov");

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, []);

  // Apply filters whenever dependencies change
  useEffect(() => {
    if (dataLoaded && allOpportunities.length > 0) {
      const filtered = applyFilters(
        allOpportunities,
        filterParam,
        searchTerm,
        selectedType,
        selectedSetAside,
        activeFilter,
        selectedAgency,
        selectedNAICS,
        selectedUrgency,
        selectedUrgencyFilters,
        showAllOpportunities
      );
      setFilteredOpportunities(filtered);
      setDisplayedOpportunities(filtered);
      setDisplayCount(250);
    }
  }, [
    allOpportunities, filterParam, searchTerm, selectedType, selectedSetAside, 
    dataLoaded, activeFilter, applyFilters, selectedAgency, selectedNAICS, 
    selectedUrgency, selectedUrgencyFilters, showAllOpportunities
  ]);

  // 🎯 NEW: Personalized stats
  const personalizedStats = useMemo(() => {
    if (!dataLoaded || !userProfile) return null;
    
    return {
      matchedToProfile: allOpportunities.filter(opp =>
        userProfile.naicsCodes?.some(code => opp.naicsCode?.includes(code)) ||
        userProfile.certifications?.some(cert => opp.typeOfSetAsideDescription?.includes(cert))
      ).length,
      favoriteAgencyMatches: allOpportunities.filter(opp =>
        userProfile.favoriteAgencies?.some(agency => opp.department?.includes(agency))
      ).length,
      goalProgress: userProfile.monthlyGoal ?
        Math.min(100, Math.round(((userProfile.achievedThisMonth || 0) / userProfile.monthlyGoal) * 100)) : 0
    };
  }, [dataLoaded, userProfile, allOpportunities]);

  // Normalize search term: expand common synonyms to match actual field values
  const normalizeSearch = (raw: string): string[] => {
    const t = raw.trim().toLowerCase();
    // Map human phrases → actual field value fragments
    const SYNONYMS: Record<string, string[]> = {
      'set-aside': ['sba','sbp','wosb','sdvosb','sdvosbc','8a','hubzone','hzc','vosb','vsa','edwosb'],
      'setaside': ['sba','sbp','wosb','sdvosbc','8a','hubzone','hzc','vosb'],
      'small business': ['sba','sbp','small business'],
      'veteran': ['sdvosbc','sdvosbs','vsa','vss','veteran'],
      'sdvosb': ['sdvosbc','sdvosbs','service-disabled'],
      'vosb': ['vsa','vss','veteran-owned'],
      'women': ['wosb','edwosb','women-owned'],
      'wosb': ['wosb','wosbss','women-owned'],
      'hubzone': ['hzc','hzs','historically underutilized'],
      '8a': ['8a','8an'],
      'indian': ['iee','isbee','bicivc','indian'],
      'sole source': ['sole','8an','hzs','sdvosbs','wosbss'],
    };
    if (SYNONYMS[t]) return SYNONYMS[t];
    // Partial match on synonym keys
    for (const [key, vals] of Object.entries(SYNONYMS)) {
      if (t.includes(key) || key.includes(t)) return [...vals, t];
    }
    return [t];
  };

  const searchTerms = normalizeSearch(keywordSearch || searchTerm);

  // Board source: same as keywordFiltered but urgency filter handled by column dimming
  const boardFiltered = useMemo(() => {
    const terms = normalizeSearch(keywordSearch || searchTerm);
    // Re-run filters without urgency pre-filter for board view
    let base = allOpportunities.filter(opp => !opp.noticeId.startsWith('placeholder'));
    // Apply non-urgency filters from applyFilters manually
    if (activeFilter === 'setasides') base = base.filter(o => hasSetAside(o));
    if (activeFilter === 'expiring') {
      const nw = new Date(); nw.setDate(nw.getDate() + 7);
      base = base.filter(o => { const d = getEffectiveDeadline(o); return d && d <= nw && d >= new Date(); });
    }
    if (terms.length === 0 || (terms.length === 1 && terms[0] === '')) return base;
    return base.filter(opp => {
      const fields = [
        opp.title, opp.department, opp.solicitationNumber, opp.naicsCode,
        opp.classificationCode, opp.typeOfSetAsideDescription, opp.typeOfSetAside,
        (opp as any).setAside, opp.officeAddress?.city, opp.officeAddress?.state,
        opp.fullParentPathName,
        ...(opp.pointOfContact?.map(p => [p.fullname, p.email].join(' ')) || []),
      ].filter(Boolean).join(' ').toLowerCase();
      return terms.some(t => t && fields.includes(t));
    });
  }, [allOpportunities, keywordSearch, searchTerm, activeFilter]);

  // Combined search across ALL static SAM.gov fields with synonym expansion
  const keywordFiltered = useMemo(() => {
    const terms = normalizeSearch(keywordSearch || searchTerm);
    if (terms.length === 0 || (terms.length === 1 && terms[0] === '')) return displayedOpportunities;
    return displayedOpportunities.filter(opp => {
      const fields = [
        opp.title,
        opp.department,
        opp.solicitationNumber,
        opp.naicsCode,
        opp.classificationCode,
        opp.typeOfSetAsideDescription,
        opp.typeOfSetAside,
        (opp as any).setAside,
        opp.type,
        opp.organizationType,
        opp.fullParentPathName,
        opp.officeAddress?.city,
        opp.officeAddress?.state,
        opp.officeAddress?.zip,
        opp.placeOfPerformance?.city?.name,
        opp.placeOfPerformance?.state?.name,
        opp.placeOfPerformance?.state?.code,
        opp.placeOfPerformance?.zip,
        ...(opp.pointOfContact?.map(p => [p.fullname, p.email, p.title].join(' ')) || []),
      ].filter(Boolean).join(' ').toLowerCase();
      return terms.some(t => t && fields.includes(t));
    });
  }, [displayedOpportunities, keywordSearch, searchTerm]);
  const visibleOpportunities = keywordFiltered.slice(0, displayCount);
  const hasMore = displayCount < displayedOpportunities.length;

  // 🎯 NEW: Group opportunities by selected criteria
  const groupedOpportunities = useMemo(() => {
    if (groupMode === 'none') {
      return { 'All Opportunities': visibleOpportunities };
    }

    const groups: Record<string, SamOpportunity[]> = {};

    visibleOpportunities.forEach(opp => {
      let groupKey = 'Other';

      switch (groupMode) {
        case 'department':
          groupKey = opp.department || "Other"
          break

        case 'urgency':
          const deadline = getEffectiveDeadline(opp);
          if (!deadline) {
            groupKey = 'No Deadline';
          } else {
            const bd = getBusinessDaysUntil(deadline);
            groupKey = getUrgencyLabel(bd ?? 999);
          }
          break;
        case 'setaside':
            groupKey = opp.typeOfSetAsideDescription || "Other"
            break
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(opp);
    });

    if (groupMode === 'urgency') {
      const urgencyOrder = [
        'CRITICAL',
        'URGENT',
        'HIGH PRIORITY',
        'ACT SOON',
        'NORMAL',
        'COMFORTABLE',
        'AMPLE TIME',
        'PLENTY OF TIME',
        'No Deadline'
      ];

      return Object.fromEntries(
        Object.entries(groups).sort((a, b) =>
          urgencyOrder.indexOf(a[0]) - urgencyOrder.indexOf(b[0])
        )
      );
    }

    return groups;
  }, [visibleOpportunities, groupMode]);

  // Periodic reminder to fill preferences (every 3 mins if no survey, logged in)
  useEffect(() => {
    if (!isLoggedIn || userProfile.hasCompletedSurvey) return;
    const alreadyShown = sessionStorage.getItem('prefsReminderShown');
    if (alreadyShown) return;
    const timer = setTimeout(() => {
      setShowPrefsReminder(true);
      sessionStorage.setItem('prefsReminderShown', '1');
    }, 3 * 60 * 1000); // 3 minutes
    return () => clearTimeout(timer);
  }, [isLoggedIn, userProfile.hasCompletedSurvey]);

  // Show full-screen loading when first fetching and no real data yet
  if (loading && allOpportunities.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin mx-auto mb-6 text-cyan-400" />
          <h2 className="text-2xl font-bold text-white mb-2">Loading Federal Opportunities</h2>
          <p className="text-slate-300">Fetching live data from SAM.gov...</p>
        </div>
      </div>
    );
  }

  // ── UNAUTHENTICATED: show teaser/locked page ──
  if (!isLoggedIn && sessionStatus !== 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
        {/* Blurred dummy feed behind the gate */}
        <div className="relative">
          <div className="pointer-events-none select-none blur-sm opacity-40 px-6 py-8 max-w-[1900px] mx-auto">
            {/* Fake stat pills */}
            <div className="grid grid-cols-5 gap-4 mb-8">
              {['250 Active','47 Set-Asides','12 Closing Soon','8 Agencies','3 Posted Today'].map(t => (
                <div key={t} className="p-4 rounded-xl bg-slate-800/60 border border-slate-700">
                  <div className="text-xl font-bold text-white">{t.split(' ')[0]}</div>
                  <div className="text-xs text-slate-400">{t.split(' ').slice(1).join(' ')}</div>
                </div>
              ))}
            </div>
            {/* Fake opportunity cards */}
            {Array.from({length: 6}).map((_,i) => (
              <div key={i} className="mb-4 p-5 rounded-xl bg-slate-800/60 border border-slate-700 flex gap-4">
                <div className="w-24 h-12 rounded-lg bg-red-600/60 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-600 rounded w-3/4" />
                  <div className="h-3 bg-slate-700 rounded w-1/2" />
                  <div className="h-3 bg-slate-700 rounded w-1/3" />
                </div>
                <div className="w-32 h-10 bg-cyan-700/40 rounded-lg flex-shrink-0" />
              </div>
            ))}
          </div>

          {/* Gate overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="mx-4 w-full max-w-lg bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 border-2 border-cyan-500/40 rounded-3xl p-10 shadow-2xl text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center overflow-hidden">
                <Image src="/logo.png" alt="Precise GovCon" width={64} height={64} className="w-14 h-14 object-contain" />
              </div>
              <p className="text-xs text-cyan-400 font-bold tracking-widest uppercase mb-3">Precise GovCon</p>
              <h2 className="text-3xl font-black text-white mb-3">
                Curated <span className="text-orange-400">GovCon</span> Opportunities
              </h2>
              <p className="text-slate-300 text-lg mb-2 leading-relaxed">
                Sign in to access <span className="text-cyan-400 font-bold">live federal solicitations</span> curated by our proprietary analytics engine — sorted by urgency, personalized to your profile.
              </p>
              <div className="mt-6 mb-8 grid grid-cols-1 gap-3 text-left">
                {[
                  { icon: '🎯', text: 'Personalized matches based on your NAICS codes and certifications' },
                  { icon: '⚡', text: 'Real-time data from SAM.gov, filtered and deadline-sorted' },
                  { icon: '🔔', text: 'Urgency alerts so you never miss a critical deadline' },
                  { icon: '📊', text: 'Proprietary win-probability & competition analysis' },
                ].map(({icon, text}) => (
                  <div key={text} className="flex items-start gap-3 px-4 py-3 bg-white/5 rounded-xl border border-white/10">
                    <span className="text-xl flex-shrink-0">{icon}</span>
                    <span className="text-sm text-slate-300">{text}</span>
                  </div>
                ))}
              </div>
              <a
                href="/login"
                className="block w-full py-4 rounded-xl text-white font-black text-lg shadow-xl transition-all hover:scale-[1.02]"
                style={{background: 'linear-gradient(135deg,#059669,#06b6d4)'}}
              >
                Sign In to View Opportunities
              </a>
              <p className="mt-4 text-slate-500 text-sm">
                No account?{' '}
                <a href="/login?mode=register" className="text-cyan-400 hover:underline font-semibold">
                  Create one free →
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 pb-40">
      {/* Header with status */}
      <div className="border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-[1900px] mx-auto px-3 sm:px-6 lg:px-10 xl:px-12 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${dataLoaded ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`}></div>
                <span>Last updated: <span className="font-semibold text-slate-300">{lastUpdated}</span></span>
                {!dataLoaded && (
                  <span className="text-amber-400 text-sm flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Syncing live data...
                  </span>
                )}
                {refreshIndicator && (
                  <span className="text-cyan-400 text-sm flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Refreshing...
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="font-medium text-slate-300">
                  {error ? (
                    <span className="text-red-400">SAM.gov API Unavailable (sample data)</span>
                  ) : dataLoaded ? (
                    'Live data from SAM.gov'
                  ) : (
                    'Loading from SAM.gov...'
                  )}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {userProfile && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg border border-purple-500/30">
                  <TargetIcon className="w-3 h-3 text-purple-400" />
                  <span className="text-xs text-purple-300 font-medium">
                    Goal: {userProfile.achievedThisMonth || 0}/{userProfile.monthlyGoal || 10} this month
                  </span>
                </div>
              )}
              <button
                onClick={handleExportOpportunities}
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 px-4 py-2.5 text-sm font-medium text-slate-200 transition backdrop-blur-sm"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export CSV</span>
              </button>
              <button
                onClick={() => window.location.href = '/insights'}
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 px-4 py-2.5 text-sm font-medium text-slate-200 transition backdrop-blur-sm"
              >
                <LineChart className="h-4 w-4" />
                <span className="hidden sm:inline">Insights</span>
              </button>
              <button
                onClick={() => setSurveyOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 px-4 py-2.5 text-sm font-bold text-white transition shadow-lg hover:shadow-xl"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Update Preferences</span>
              </button>
              <button
                onClick={handleRefresh}
                disabled={refreshIndicator}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-200 text-sm font-medium transition-colors disabled:opacity-50 border border-white/10"
              >
                <RefreshCw className={`w-4 h-4 ${refreshIndicator ? 'animate-spin' : ''}`} />
                {refreshIndicator ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="border-b border-red-500/20 bg-red-500/10 backdrop-blur-xl">
          <div className="max-w-[1900px] mx-auto px-3 sm:px-6 lg:px-10 xl:px-12 py-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-red-300 mb-1">
                  SAM.gov API Temporarily Unavailable
                </h3>
                <p className="text-sm text-red-200/80 leading-relaxed">
                  {error} All interactive features are fully functional.
                </p>
              </div>
              <button
                onClick={() => {
                  setError(null);
                  setRefreshIndicator(true);
                  window.location.reload();
                }}
                className="flex-shrink-0 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-xs text-red-300 font-medium transition-colors"
              >
                Retry Now
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[1900px] mx-auto px-3 sm:px-6 lg:px-10 xl:px-12 py-2">
        {/* 🎯 HERO SECTION - What we're showing and how */}
        <div className="mb-2 p-2 sm:p-3 bg-gradient-to-br from-blue-900/30 via-indigo-900/20 to-purple-900/30 rounded-xl border border-blue-500/30">
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-3 sm:mb-4">
                <Image 
                  src="/logo.png" 
                  alt="Company Logo" 
                  width={56}
                  height={56}
                  className="w-8 h-8 object-contain flex-shrink-0"
                />
                <h1 className="text-base sm:text-lg font-bold leading-tight">
                  {(() => {
                    const h = new Date().getHours();
                    const g = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : h < 21 ? 'Good evening' : 'Good night';
                    return (<><span className="text-white">{g}, </span><span className="text-orange-400">{userName || 'there'}</span><span className="text-white">! Welcome to your curated opportunities provided by </span><span className="text-orange-400">Precise GovCon</span><span className="text-white"> ®</span></>);
                  })()}
                </h1>
              </div>
            </div>
          </div>
        </div>

        {/* Welcome Banner */}
        {showWelcomeBanner && !userProfile.hasCompletedSurvey && (
          <div className="mb-6 p-4 sm:p-6 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-cyan-500/10 rounded-2xl border border-white/10 relative">
            <button
              onClick={handleDismissBanner}
              className="absolute top-4 right-4 p-2 hover:bg-red-500/20 rounded-lg transition-colors text-slate-400 hover:text-red-400"
              aria-label="Dismiss"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-start justify-between gap-4 pr-12">
              <div className="w-12 h-12 flex-shrink-0 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center overflow-hidden">
                <Image src="/logo.png" alt="Precise GovCon" width={40} height={40} className="w-9 h-9 object-contain" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-2">
                  {userName ? `Welcome, ${userName}! 👋` : 'Welcome! 👋'}
                </h2>
                <p className="text-slate-300 text-base mb-3">
                  Complete your opportunity preferences survey to get personalized recommendations
                </p>
                <button
                  onClick={() => setSurveyOpen(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold rounded-xl transition-all shadow-lg"
                >
                  <Sparkles className="w-5 h-5" />
                  Get AI-powered curated opportunities
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Survey Success Banner */}
        {userProfile.hasCompletedSurvey && !bannerDismissed && (
          <div className="mb-6 p-4 sm:p-6 bg-gradient-to-br from-emerald-500/10 via-cyan-500/10 to-blue-500/10 rounded-2xl border border-emerald-500/30 relative">
            <button
              onClick={handleDismissBanner}
              className="absolute top-4 right-4 p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400"
              aria-label="Dismiss"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-start justify-between gap-4 pr-12">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                  Your Feed is Personalized, {userName}!
                </h2>
                <p className="text-slate-300 text-base mb-3">
                  Showing {displayedOpportunities.length} opportunities matching your preferences
                </p>
                <button
                  onClick={() => setSurveyOpen(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold rounded-xl transition-all shadow-lg"
                >
                  <Settings className="w-5 h-5" />
                  Update Preferences
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 🎯 ACCURATE STATS PILLS - Interactive */}
        <div className="mb-2 flex gap-2">
          {[
            { filter: 'active' as const,      icon: <CheckCircle2 className="w-3.5 h-3.5" />, value: stats.totalActive, label: 'Active',        accent: 'text-emerald-400', border: 'border-emerald-700', activeBg: 'bg-emerald-500/10' },
            { filter: 'setasides' as const,    icon: <Award className="w-3.5 h-3.5" />,        value: stats.setAsides,   label: 'Set-Asides',   accent: 'text-violet-400',  border: 'border-violet-700',  activeBg: 'bg-violet-500/10'  },
            { filter: 'expiring' as const,     icon: <Timer className="w-3.5 h-3.5" />,        value: stats.closingSoon, label: 'Closing ≤7d',  accent: 'text-rose-400',    border: 'border-rose-700',    activeBg: 'bg-rose-500/10'    },
            { filter: 'departments' as const,  icon: <Building2 className="w-3.5 h-3.5" />,    value: stats.departments, label: 'Agencies',     accent: 'text-teal-400',    border: 'border-teal-700',    activeBg: 'bg-teal-500/10'    },
          ].map(s => (
            <button key={s.filter} onClick={() => handlePillClick(s.filter)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-left transition-all flex-1 ${
                activeFilter === s.filter ? `${s.activeBg} ${s.border}` : 'bg-slate-800/40 border-slate-700 hover:border-slate-500'
              }`}>
              <span className={s.accent}>{s.icon}</span>
              <span className="text-white font-black text-sm">{s.value.toLocaleString()}</span>
              <span className="text-slate-400 text-xs font-medium">{s.label}</span>
            </button>
          ))}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-amber-700 bg-amber-500/10 flex-1">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-white font-black text-sm">{stats.postedToday.toLocaleString()}</span>
            <span className="text-amber-400 text-xs font-medium">Posted Today</span>
          </div>
        </div>

        {/* 🎯 PROMINENT SEARCH BAR - White background, enhanced visibility */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-slate-600 w-6 h-6" />
            <input
              type="text"
              placeholder="🔍 Search title, department, NAICS, set-aside, solicitation #, city, state, contact name, org path..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setKeywordSearch(e.target.value); }}
              className="w-full pl-16 pr-16 py-5 bg-white text-slate-900 border-2 border-slate-300 rounded-2xl placeholder-slate-500 focus:outline-none focus:ring-4 focus:ring-cyan-500 focus:border-transparent transition-all text-lg font-medium shadow-xl"
            />
            {searchTerm && (
              <button
                onClick={() => { setSearchTerm(''); setKeywordSearch(''); }}
                className="absolute right-5 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors bg-slate-200 hover:bg-slate-300 rounded-full p-2"
              >
                <XCircle className="w-5 h-5" />
              </button>
            )}
          </div>
          {(searchTerm || keywordSearch) && (
            <p className="mt-1 text-xs text-cyan-400 pl-1">
              {keywordFiltered.length === 0 
                ? `No results for "${searchTerm || keywordSearch}" — try: veteran, army, wosb, 8a, hubzone, or a state abbreviation`
                : `${keywordFiltered.length} result${keywordFiltered.length !== 1 ? 's' : ''} for "${searchTerm || keywordSearch}"`
              }
            </p>
          )}
          <div className="mt-2 flex flex-wrap gap-2 text-sm text-slate-400">
            <span className="flex items-center gap-1"><Search className="w-3 h-3" /> Searchable fields:</span>
            <span className="px-2 py-1 bg-slate-800 rounded-md">Title</span>
            <span className="px-2 py-1 bg-slate-800 rounded-md">Department / Org</span>
            <span className="px-2 py-1 bg-slate-800 rounded-md">Solicitation #</span>
            <span className="px-2 py-1 bg-slate-800 rounded-md">NAICS</span>
            <span className="px-2 py-1 bg-slate-800 rounded-md">Set-Aside Code</span>
            <span className="px-2 py-1 bg-slate-800 rounded-md">City / State / Zip</span>
            <span className="px-2 py-1 bg-slate-800 rounded-md">Contact Name</span>
            <span className="px-2 py-1 bg-slate-800 rounded-md">Full Org Path</span>
          </div>
        </div>

        {/* View Controls */}
        <div className="mb-2 flex flex-row items-center justify-between gap-3 p-2 bg-slate-800/40 rounded-xl border border-slate-700">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-300">View:</span>
            <div className="flex items-center gap-2 p-1 bg-slate-900/50 rounded-lg">
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-bold ${
                  viewMode === 'list' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <List className="w-4 h-4" /> List
              </button>
              <button
                onClick={() => { setViewMode('grid'); setGroupMode('none'); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-bold ${
                  viewMode === 'grid' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Grid3x3 className="w-4 h-4" /> Board
              </button>
              <button
                onClick={() => setViewMode('compact')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-bold ${
                  viewMode === 'compact' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-4 h-4" /> Compact
              </button>
            </div>
          </div>

          {viewMode !== 'grid' && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-slate-300">Group By:</span>
              <select
                value={groupMode}
                onChange={(e) => setGroupMode(e.target.value as GroupMode)}
                className="px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="none">No Grouping</option>
                <option value="urgency">Deadline Urgency</option>
                <option value="department">Department</option>
                <option value="setaside">Set-Aside Type</option>
              </select>
            </div>
          )}
        </div>

        {/* EXPANDED URGENCY LEGEND - Positioned immediately above results */}
        <div className="mb-2 p-2 bg-slate-800/60 rounded-xl border border-slate-700">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-3">
              <Timer className="w-6 h-6 text-cyan-400" />
              <h3 className="text-base font-black text-white tracking-wide">Submission Deadline</h3>
              <span className="px-3 py-1 bg-slate-900 rounded-full text-sm font-bold" style={{color:"#ff6a00"}}>
                Business Days Remaining
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  const next = !showAllOpportunities;
                  setShowAllOpportunities(next);
                  setDisplayCount(next ? 999999 : 250);
                  if (next) {
                    // Expand all column bands so +N more disappears
                    setShowMoreBands({ CRITICAL: true, URGENT: true, HIGH: true, 'ACT SOON': true, NORMAL: true, COMFORTABLE: true, AMPLE: true, PLENTY: true });
                  } else {
                    setShowMoreBands({});
                  }
                }}
                className={`px-6 py-3 rounded-lg font-bold text-base transition-all ${
                  showAllOpportunities
                    ? 'bg-cyan-600 text-white hover:bg-cyan-700'
                    : 'bg-slate-700 text-white hover:bg-slate-600'
                }`}
              >
                {showAllOpportunities ? 'Showing All Opportunities' : 'Show All Opportunities'}
              </button>
              {selectedUrgencyFilters.size > 0 && (
                <button
                  onClick={() => setSelectedUrgencyFilters(new Set())}
                  className="px-4 py-3 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-sm font-semibold text-red-400 flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Clear Filter
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {[
              { label: 'CRITICAL', range: '≤3 days', days: 3, color: 'bg-red-600' },
              { label: 'URGENT', range: '4-5 days', days: 5, color: 'bg-orange-600' },
              { label: 'HIGH', range: '6-7 days', days: 7, color: 'bg-amber-600' },
              { label: 'ACT SOON', range: '8-10 days', days: 10, color: 'bg-yellow-600' },
              { label: 'NORMAL', range: '11-14 days', days: 14, color: 'bg-lime-600' },
              { label: 'COMFORTABLE', range: '15-21 days', days: 21, color: 'bg-green-600' },
              { label: 'AMPLE', range: '22-30 days', days: 30, color: 'bg-emerald-600' },
              { label: 'PLENTY', range: '31+ days', days: 31, color: 'bg-emerald-700' },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => setSelectedUrgencyFilters(prev => { const next = new Set(prev); if (next.has(item.label)) { next.delete(item.label); } else { next.add(item.label); } return next; })}
                className={`${item.color} px-2 py-1 rounded-md text-white shadow-md hover:shadow-lg transform hover:scale-105 transition-all ${
                  selectedUrgencyFilters.has(item.label) ? 'ring-4 ring-white ring-offset-2 ring-offset-slate-900 scale-105' : ''
                }`}
              >
                <div className="text-xs font-black tracking-wider uppercase leading-none">{item.label}</div>
                <div className="text-xs font-semibold opacity-75 leading-none mt-0.5">{item.range}</div>
              </button>
            ))}
          </div>

          <p className="mt-4 text-sm text-slate-400 text-center">
            {selectedUrgencyFilters.size > 0
              ? `✓ Active filters: ${Array.from(selectedUrgencyFilters).join(' · ')} — click to deselect`
              : 'Click one or more deadline categories to filter. Multi-select supported.'}
          </p>
        </div>



        {/* Results Header */}
        <div ref={resultsRef} className="mb-2 flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">
            {displayedOpportunities.length === 0 ? (
              'No opportunities match your criteria'
            ) : (
              <>
                Showing <span className="text-cyan-400">{visibleOpportunities.length.toLocaleString()}</span> of{' '}
                <span className="text-cyan-400">{displayedOpportunities.length.toLocaleString()}</span> curated opportunities
                {activeFilter && (
                  <span className="ml-2 text-base font-normal text-slate-400">
                    (filtered by {activeFilter === 'setasides' ? 'set-asides' : activeFilter})
                  </span>
                )}
              </>
            )}
          </h3>
          {activeFilter && (
            <button
              onClick={() => setActiveFilter(null)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-sm text-slate-300 transition-colors"
            >
              <XCircle className="w-4 h-4" />
              Clear Filter
            </button>
          )}
        </div>

        {/* Opportunities Display */}

        {/* GRID VIEW — 8 columns side by side, each full-width column = one category */}
        {viewMode === 'grid' && (() => {
          const COLS = [
            { key: 'CRITICAL',    min: 0,  max: 3,     label: 'CRITICAL',    range: '≤3 days',    hdr: '#dc2626', bg: '#1c0606' },
            { key: 'URGENT',      min: 4,  max: 5,     label: 'URGENT',      range: '4–5 days',   hdr: '#ea580c', bg: '#1c0d04' },
            { key: 'HIGH',        min: 6,  max: 7,     label: 'HIGH',        range: '6–7 days',   hdr: '#d97706', bg: '#1c1404' },
            { key: 'ACT SOON',    min: 8,  max: 10,    label: 'ACT SOON',    range: '8–10 days',  hdr: '#ca8a04', bg: '#1c1804' },
            { key: 'NORMAL',      min: 11, max: 14,    label: 'NORMAL',      range: '11–14 days', hdr: '#65a30d', bg: '#0b1803' },
            { key: 'COMFORTABLE', min: 15, max: 21,    label: 'COMFORTABLE', range: '15–21 days', hdr: '#16a34a', bg: '#031809' },
            { key: 'AMPLE',       min: 22, max: 30,    label: 'AMPLE',       range: '22–30 days', hdr: '#059669', bg: '#02140f' },
            { key: 'PLENTY',      min: 31, max: 99999, label: 'PLENTY',      range: '31+ days',        hdr: '#0d9488', bg: '#021718' },
          ];

          type Tagged = SamOpportunity & { bd: number };
          const buckets: Record<string, Tagged[]> = {};
          COLS.forEach(c => { buckets[c.key] = []; });

          // Board uses boardFiltered — bypasses urgency pre-filter (columns handle it)
          boardFiltered.forEach(opp => {
            if (opp.noticeId.startsWith('placeholder')) return;
            const dl = getEffectiveDeadline(opp);
            if (!dl) return;
            const bd = getBusinessDaysUntil(dl) ?? -1;
            if (bd < 0) return;
            const col = COLS.find(c => bd >= c.min && bd <= c.max);
            if (col) buckets[col.key].push({ ...opp, bd });
          });
          COLS.forEach(c => buckets[c.key].sort((a, b) => a.bd - b.bd));

          return (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(8, 1fr)',
              gap: '4px',
              width: '100%',
            }}>
              {COLS.map(col => {
                const all    = buckets[col.key];
                // When urgency filters are active, only show cards for selected columns
                const urgencyActive = selectedUrgencyFilters.size > 0;
                const colSelected   = !urgencyActive || selectedUrgencyFilters.has(col.label) || selectedUrgencyFilters.has(col.key);
                const filteredAll   = urgencyActive && !colSelected ? [] : all;
                const shown  = showMoreBands?.[col.key] ? filteredAll : filteredAll.slice(0, 12);
                const hidden = filteredAll.length - shown.length;
                return (
                  <div key={col.key} style={{
                    display: 'flex', flexDirection: 'column', minWidth: 0,
                    opacity: urgencyActive && !colSelected ? 0.25 : 1,
                    transition: 'opacity 0.2s',
                  }}>

                    {/* Column header */}
                    <div style={{
                      background: col.hdr,
                      padding: '8px 4px',
                      textAlign: 'center',
                      borderRadius: '6px 6px 0 0',
                      marginBottom: '2px',
                      position: 'sticky',
                      top: 0,
                      zIndex: 10,
                    }}>
                      <div style={{ color: 'white', fontWeight: 900, fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{col.label}</div>
                      <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '10px', marginTop: '1px' }}>{col.range}</div>
                      <div style={{
                        display: 'inline-block', marginTop: '4px',
                        background: 'rgba(0,0,0,0.3)', color: 'white',
                        fontWeight: 800, fontSize: '11px',
                        borderRadius: '999px', padding: '0 7px', lineHeight: '16px',
                      }}>{all.length}</div>
                    </div>

                    {/* Cards — every card is full width of this column, stacks down */}
                    {shown.map(opp => {
                      const dl       = getEffectiveDeadline(opp);
                      const isSaved  = savedOpportunities.has(opp.noticeId);
                      const isViewed = viewedOpportunities.has(opp.noticeId);
                      return (
                        <div
                          key={opp.noticeId}
                          onClick={() => setSelectedOpp(opp)}
                          style={{
                            background: col.bg,
                            border: `1px solid ${col.hdr}55`,
                            borderRadius: '5px',
                            padding: '8px 9px',
                            marginBottom: '2px',
                            cursor: 'pointer',
                            opacity: isViewed ? 0.45 : 1,
                            width: '100%',
                            boxSizing: 'border-box',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.6)')}
                          onMouseLeave={e => (e.currentTarget.style.filter = '')}
                        >
                          {/* Top row: days badge + agency */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                            <span style={{
                              background: col.hdr, color: 'white',
                              fontWeight: 900, fontSize: '12px',
                              borderRadius: '4px', padding: '2px 7px', flexShrink: 0,
                            }}>{opp.bd}d</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', minWidth: 0 }}>
                              <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {getAgencyAbbreviation(opp.department)}
                              </span>
                              {isSaved && <Bookmark style={{ width: 11, height: 11, color: '#fb7185', flexShrink: 0 }} fill="#fb7185" />}
                            </div>
                          </div>
                          {/* Title */}
                          <p style={{
                            color: 'white', fontSize: '12px', fontWeight: 700,
                            lineHeight: 1.3, marginBottom: '6px',
                            display: '-webkit-box', WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical', overflow: 'hidden',
                          }}>{opp.title}</p>
                          {/* Deadline */}
                          <div style={{ marginBottom: '3px' }}>
                            <span style={{ color: '#94a3b8', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Due </span>
                            <span style={{ color: col.hdr, fontSize: '13px', fontWeight: 800 }}>
                              {dl ? formatDate(dl) : '—'}
                            </span>
                          </div>
                          {/* Posted */}
                          {opp.postedDate && (
                            <div>
                              <span style={{ color: '#64748b', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Posted </span>
                              <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 700 }}>
                                {formatDate(opp.postedDate)}
                              </span>
                            </div>
                          )}
                          {/* Set-aside badge */}
                          {(() => {
                            const sa = getSetAsideStyle(opp);
                            if (!sa) return null;
                            return (
                              <div style={{ marginTop: '5px' }}>
                                <span style={{
                                  display: 'inline-block',
                                  background: sa.bg,
                                  color: sa.text,
                                  border: `1px solid ${sa.color}55`,
                                  borderRadius: '4px',
                                  padding: '1px 6px',
                                  fontSize: '10px',
                                  fontWeight: 800,
                                  letterSpacing: '0.04em',
                                  textTransform: 'uppercase',
                                }}>{sa.label}</span>
                              </div>
                            );
                          })()}
                        </div>
                      );
                    })}

                    {/* Load more */}
                    {hidden > 0 && (
                      <button
                        onClick={() => setShowMoreBands((prev: Record<string,boolean>) => ({ ...prev, [col.key]: true }))}
                        style={{
                          background: col.hdr, color: 'white',
                          fontWeight: 700, fontSize: '11px',
                          padding: '7px 4px', border: 'none',
                          cursor: 'pointer', width: '100%',
                          borderRadius: '0 0 6px 6px',
                          opacity: 0.9,
                        }}
                        onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                        onMouseLeave={e => (e.currentTarget.style.opacity = '0.9')}
                      >
                        +{hidden} more
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* COMPACT + LIST VIEWS — grouped loop */}
        {viewMode !== 'grid' && Object.entries(groupedOpportunities).map(([groupName, opportunities]) => {
          const sortedOpportunities = opportunities;

          return (
            <div key={groupName} className="mb-8">
              {groupMode !== 'none' && (
                <div className="mb-4 flex items-center gap-3">
                  <h4 className="text-lg font-bold text-white">{groupName}</h4>
                  <div className="flex-1 h-px bg-gradient-to-r from-slate-700 to-transparent"></div>
                  <span className="text-sm text-slate-400 font-semibold">{sortedOpportunities.length} opportunities</span>
                </div>
              )}

              {/* COMPACT VIEW */}
              {viewMode === 'compact' && (
                <div className="space-y-2">
                  {sortedOpportunities.map((opp) => {
                    const isPlaceholder = opp.noticeId.startsWith('placeholder');
                    const deadline = isPlaceholder ? null : getEffectiveDeadline(opp);
                    const postedDate = getEffectivePostedDate(opp);
                    const businessDays = deadline ? getBusinessDaysUntil(deadline) : null;
                    const isSaved = savedOpportunities.has(opp.noticeId);
                    const isViewed = viewedOpportunities.has(opp.noticeId);
                    const hasRealDeadline = !!opp.responseDeadLine;

                    const urgencyGradient = businessDays !== null ? getUrgencyGradient(businessDays) : getNoDeadlineGradient();
                    const urgencyTextColor = businessDays !== null ? getUrgencyTextColor(businessDays) : getNoDeadlineTextColor();
                    const urgencyLabel = businessDays !== null ? getUrgencyLabel(businessDays) : 'NO DEADLINE';

                    return (
                      <div
                        key={opp.noticeId}
                        className={`group p-3 bg-gradient-to-r ${urgencyGradient} rounded-lg border-2 hover:shadow-lg transition-all ${
                          isPlaceholder ? 'animate-pulse' : ''
                        } ${isViewed ? 'opacity-75' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Urgency Badge */}
                          {!isPlaceholder && (
                            <div className="flex flex-col gap-2 w-[190px] flex-shrink-0">
                              <div className={`px-3 py-1 rounded-lg font-bold text-sm ${urgencyTextColor} bg-slate-900/60 border border-current inline-flex items-center justify-between`}>
                                <span>{urgencyLabel}</span>
                                <span className="ml-2">{businessDays !== null ? `${businessDays}bd` : '∞'}</span>
                              </div>
                            </div>
                          )}

                          {/* Response Deadline */}
                          {!isPlaceholder && (
                            <div className="mb-0 p-2 bg-slate-900/40 rounded-lg border border-slate-700 flex-shrink-0">
                              <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                                <Calendar className="w-3 h-3" />
                                <span>Response Deadline</span>
                              </div>
                              <div className={`text-sm font-bold ${urgencyTextColor}`}>
                                {deadline ? formatDate(deadline) : 'No deadline'}
                                {opp.updatedResponseDeadLine && (
                                  <span className="ml-2 text-xs text-cyan-400">(Updated)</span>
                                )}
                              </div>
                              <div className="mt-1 pt-1 border-t border-slate-700/50 text-xs text-slate-400">
                                Posted: {formatDate(postedDate)}
                                {opp.updatedPostedDate && opp.updatedPostedDate !== opp.postedDate && (
                                  <span className="ml-2 text-cyan-400">• Updated: {formatDate(opp.updatedPostedDate)}</span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Title and Department */}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-white mb-0.5 truncate">
                              {isPlaceholder ? (
                                <span className="inline-block h-4 w-64 bg-slate-700 rounded"></span>
                              ) : (
                                opp.title
                              )}
                            </h4>
                            <div className="flex items-center gap-3 text-xs text-slate-400">
                              <span className="flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                {isPlaceholder ? (
                                  <span className="inline-block h-3 w-32 bg-slate-700 rounded"></span>
                                ) : (
                                  opp.department
                                )}
                              </span>
                              {!isPlaceholder && (
                                <>
                                  <span className="px-2 py-0.5 bg-slate-900/60 border border-slate-700 rounded text-xs text-white font-bold">
                                    {getAgencyAbbreviation(opp.department)}
                                  </span>
                                </>
                              )}
                              {!isPlaceholder && opp.typeOfSetAsideDescription && opp.typeOfSetAsideDescription !== 'None' && (
                                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs font-semibold">
                                  {opp.typeOfSetAsideDescription}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {!isPlaceholder && (
                              <>
                                <button
                                  onClick={() => handleSaveOpportunity(opp.noticeId)}
                                  className="p-2 rounded-lg bg-slate-900/60 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                                  title={isSaved ? 'Remove bookmark' : 'Bookmark'}
                                >
                                  <Bookmark className="w-4 h-4" fill={isSaved ? 'currentColor' : 'none'} />
                                </button>
                                <a
                                  href={opp.uiLink || `https://sam.gov/opp/${opp.noticeId}/view`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={() => handleViewOpportunity(opp.noticeId)}
                                  className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all text-xs flex items-center gap-2"
                                >
                                  View
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}


              {/* LIST VIEW */}
              {viewMode === 'list' && (
                <div className="space-y-4">
                  {sortedOpportunities.map((opp) => {
                    const isPlaceholder = opp.noticeId.startsWith('placeholder');
                    const deadline = isPlaceholder ? null : getEffectiveDeadline(opp);
                    const postedDate = getEffectivePostedDate(opp);
                    const businessDays = deadline ? getBusinessDaysUntil(deadline) : null;
                    const isUrgent = businessDays !== null && businessDays <= 7;
                    const isSaved = savedOpportunities.has(opp.noticeId);
                    const isViewed = viewedOpportunities.has(opp.noticeId);
                    const hasAnalysis = opp.aiAnalysis !== undefined;
                    const isAnalyzing = analyzingOpps.has(opp.noticeId);
                    const hasRealDeadline = !!opp.responseDeadLine;

                    const urgencyGradient = businessDays !== null ? getUrgencyGradient(businessDays) : getNoDeadlineGradient();
                    const urgencyTextColor = businessDays !== null ? getUrgencyTextColor(businessDays) : getNoDeadlineTextColor();

                    return (
                      <div
                        key={opp.noticeId}
                        className={`group p-4 sm:p-6 bg-gradient-to-br ${urgencyGradient} rounded-xl border-2 hover:shadow-xl transition-all ${
                          isPlaceholder ? 'animate-pulse' : ''
                        } ${isViewed ? 'opacity-75' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-3 sm:gap-6">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2 sm:mb-3">
                              {!isPlaceholder && isSaved && (
                                <div className="px-2 sm:px-3 py-1 bg-rose-500/20 rounded-lg flex items-center gap-1.5 border border-rose-500/40">
                                  <Bookmark className="w-3.5 h-3.5 text-rose-400" fill="currentColor" />
                                  <span className="text-xs font-bold text-rose-400">Saved</span>
                                </div>
                              )}
                              {!isPlaceholder && hasAnalysis && (
                                <div className="px-2 sm:px-3 py-1 bg-purple-500/20 rounded-lg flex items-center gap-1.5 border border-purple-500/40">
                                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                                  <span className="text-xs font-bold text-purple-400">AI Analyzed</span>
                                </div>
                              )}
                            </div>

                            <h3 className="text-base sm:text-xl font-bold text-white mb-2 sm:mb-3 leading-tight">
                              {isPlaceholder ? (
                                <>
                                  <span className="inline-block h-6 w-full max-w-2xl bg-slate-700 rounded mb-2"></span>
                                  <span className="inline-block h-6 w-3/4 max-w-xl bg-slate-700 rounded"></span>
                                </>
                              ) : (
                                opp.title
                              )}
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 sm:gap-x-6 gap-y-1.5 sm:gap-y-2 text-xs sm:text-sm text-slate-300">
                              <span className="flex items-center gap-2">
                                <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                                {isPlaceholder ? (
                                  <span className="inline-block h-4 w-48 bg-slate-700 rounded"></span>
                                ) : (
                                  opp.department
                                )}
                              </span>
                              {!isPlaceholder && opp.typeOfSetAsideDescription && opp.typeOfSetAsideDescription !== 'None' && (
                                <span className="flex items-center gap-2">
                                  <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                                  <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs font-semibold">
                                    {opp.typeOfSetAsideDescription}
                                  </span>
                                </span>
                              )}
                              <span className="flex items-center gap-2">
                                <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                                {isPlaceholder ? (
                                  <span className="inline-block h-4 w-24 bg-slate-700 rounded"></span>
                                ) : (
                                  `NAICS: ${opp.naicsCode || 'N/A'}`
                                )}
                              </span>
                              <span className="flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                                {isPlaceholder ? (
                                  <span className="inline-block h-4 w-32 bg-slate-700 rounded"></span>
                                ) : (
                                  <>
                                    <span>Posted: {formatDate(postedDate)}</span>
                                    {opp.updatedPostedDate && opp.updatedPostedDate !== opp.postedDate && (
                                      <span className="text-cyan-400 ml-1">• Updated</span>
                                    )}
                                  </>
                                )}
                              </span>
                            </div>
                          </div>

                          {!isPlaceholder && (
                            <div className="text-right flex-shrink-0 min-w-[56px]">
                              {businessDays !== null ? (
                                <>
                                  <div className={`text-xl sm:text-2xl font-bold ${urgencyTextColor} mb-0.5`}>
                                    {businessDays}
                                  </div>
                                  <div className="text-xs text-slate-400 mb-1.5">
                                    {businessDays === 1 ? 'day' : 'days'}
                                  </div>
                                </>
                              ) : (
                                <div className="text-sm text-slate-400 mb-2">
                                  No deadline
                                </div>
                              )}
                              <div className="text-xs sm:text-sm text-slate-300">
                                {deadline ? formatDate(deadline) : '—'}
                                {opp.updatedResponseDeadLine && (
                                  <span className="ml-1 text-xs text-cyan-400">(Updated)</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {hasAnalysis && opp.aiAnalysis && (
                          <div className="mt-4 p-4 bg-slate-900/60 rounded-lg border border-slate-700">
                            <div className="grid grid-cols-3 gap-4 mb-3">
                              <div>
                                <div className="text-xs text-slate-400 mb-1">Competition</div>
                                <div className="text-sm font-bold text-white">{opp.aiAnalysis.competitionLevel}</div>
                              </div>
                              <div>
                                <div className="text-xs text-slate-400 mb-1">Win Probability</div>
                                <div className="text-sm font-bold text-white">{opp.aiAnalysis.winProbability}</div>
                              </div>
                              <div>
                                <div className="text-xs text-slate-400 mb-1">Match Score</div>
                                <div className="text-sm font-bold text-white">{opp.aiAnalysis.matchScore}%</div>
                              </div>
                            </div>
                            {opp.aiAnalysis.recommendation && (
                              <p className="text-sm text-cyan-300 italic">{opp.aiAnalysis.recommendation}</p>
                            )}
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4 border-t border-slate-700 mt-4">
                          <div className="flex items-center gap-2">
                            {!isPlaceholder ? (
                              <a
                                href={opp.uiLink || `https://sam.gov/opp/${opp.noticeId}/view`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => handleViewOpportunity(opp.noticeId)}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold rounded-xl transition-all text-sm shadow-sm hover:shadow-md"
                              >
                                View on SAM.gov
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            ) : (
                              <div className="w-full sm:w-auto px-5 py-3 bg-slate-700/50 rounded-xl animate-pulse">
                                <span className="text-transparent">Loading...</span>
                              </div>
                            )}
                            {!isPlaceholder && (
                              <button
                                onClick={() => handleSaveOpportunity(opp.noticeId)}
                                className="p-2.5 rounded-xl bg-slate-700/50 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                              >
                                <Bookmark className="w-4 h-4" fill={isSaved ? 'currentColor' : 'none'} />
                              </button>
                            )}
                            {!hasAnalysis && !isPlaceholder && process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY && (
                              <button
                                onClick={async () => {
                                  const analysis = await analyzeOpportunity(opp);
                                  if (analysis) {
                                    setAllOpportunities(prev => prev.map(o => 
                                      o.noticeId === opp.noticeId ? { ...o, aiAnalysis: analysis } : o
                                    ));
                                  }
                                }}
                                disabled={isAnalyzing}
                                className="p-2.5 rounded-xl bg-slate-700/50 hover:bg-purple-500/20 text-slate-400 hover:text-purple-400 transition-colors disabled:opacity-50"
                                title="Analyze with AI"
                              >
                                {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                              </button>
                            )}
                          </div>
                          <span className="text-sm text-slate-500 font-mono">
                            {isPlaceholder ? (
                              <span className="inline-block h-4 w-32 bg-slate-700 rounded"></span>
                            ) : (
                              opp.solicitationNumber
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Load More Button */}
        {hasMore && dataLoaded && (
          <div className="mt-12 mb-24 text-center">
            <div className="mb-6">
              <p className="text-slate-300 text-base mb-2 font-semibold">
                Showing {displayCount} of {displayedOpportunities.length.toLocaleString()} opportunities
              </p>
              <div className="h-1 w-64 mx-auto bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-300"
                  style={{ width: `${(displayCount / displayedOpportunities.length) * 100}%` }}
                />
              </div>
            </div>
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="group px-10 py-5 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 hover:from-orange-600 hover:via-orange-700 hover:to-orange-800 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 mx-auto text-lg shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Loading More Opportunities...</span>
                </>
              ) : (
                <>
                  <span>Load More Opportunities</span>
                  <ChevronDown className="w-6 h-6 group-hover:translate-y-1 transition-transform" />
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-semibold">
                    +{(displayedOpportunities.length - displayCount).toLocaleString()} more
                  </span>
                </>
              )}
            </button>
          </div>
        )}

        {/* End of Results */}
        {!hasMore && displayedOpportunities.length > 0 && dataLoaded && (
          <div className="mt-8 mb-8 text-center">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-slate-800/60 border border-white/10 rounded-xl text-sm text-slate-400">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>You've viewed all {displayedOpportunities.length.toLocaleString()} opportunities</span>
            </div>
          </div>
        )}

        {/* ── Opportunity Detail Modal ── */}
        {selectedOpp && (() => {
          const opp = selectedOpp;
          const dl = getEffectiveDeadline(opp);
          const bd = dl ? getBusinessDaysUntil(dl) : null;
          const urgencyGradient = bd !== null ? getUrgencyGradient(bd) : getNoDeadlineGradient();
          const urgencyTextColor = bd !== null ? getUrgencyTextColor(bd) : getNoDeadlineTextColor();
          const urgencyBadge = bd !== null ? getUrgencyBadgeColor(bd) : getNoDeadlineBadgeColor();
          const urgencyLabel = bd !== null ? getUrgencyLabel(bd) : 'NO DEADLINE';
          const isSaved = savedOpportunities.has(opp.noticeId);
          const postedDate = getEffectivePostedDate(opp);
          return (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4 py-8"
              onClick={e => { if (e.target === e.currentTarget) setSelectedOpp(null); }}
            >
              <div className={`relative w-full max-w-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 border-2 rounded-2xl shadow-2xl overflow-hidden ${urgencyGradient.replace('from-','border-').split(' ')[0]}`}
                style={{borderColor: undefined}}>
                {/* Coloured urgency bar at top */}
                <div className={`w-full py-1 ${urgencyBadge.split(' ')[0]}`} />

                {/* Header: logo + title area */}
                <div className="flex items-start gap-4 p-6 pb-4 border-b border-white/10">
                  {/* Company logo */}
                  <div className="w-14 h-14 flex-shrink-0 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center overflow-hidden">
                    <Image
                      src="/logo.png"
                      alt="Precise GovCon"
                      width={48}
                      height={48}
                      className="w-10 h-10 object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-md text-xs font-black ${urgencyBadge}`}>{urgencyLabel}</span>
                      {bd !== null && <span className={`text-lg font-black ${urgencyTextColor}`}>{bd} business days</span>}
                    </div>
                    <h2 className="text-lg font-bold text-white leading-snug line-clamp-3">{opp.title}</h2>
                  </div>
                  <button
                    onClick={() => setSelectedOpp(null)}
                    className="flex-shrink-0 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Body — scrollable */}
                <div className="overflow-y-auto max-h-[60vh]">

                  {/* ── Set-aside badge row (prominent, full width) ── */}
                  {(() => {
                    const sa = getSetAsideStyle(opp);
                    const rawCode = ((opp as any).setAside || opp.typeOfSetAside || '').trim();
                    const desc = opp.typeOfSetAsideDescription || (opp as any).setAsideDescription || '';
                    if (!sa && !rawCode && !desc) return null;
                    return (
                      <div className="px-6 pt-4 pb-2 flex flex-wrap items-center gap-2">
                        {sa ? (
                          <span style={{ background: sa.bg, color: sa.text, border: `1.5px solid ${sa.color}88` }}
                            className="px-3 py-1.5 rounded-lg text-sm font-black uppercase tracking-wider flex items-center gap-1.5">
                            <span style={{ background: sa.color }} className="w-2 h-2 rounded-full inline-block" />
                            {sa.label}
                          </span>
                        ) : rawCode ? (
                          <span className="px-3 py-1.5 bg-blue-500/20 text-blue-300 border border-blue-500/40 rounded-lg text-sm font-black uppercase tracking-wider">{rawCode}</span>
                        ) : null}
                        {desc && desc !== 'None' && desc !== 'N/A' && (
                          <span className="text-slate-400 text-xs">{desc}</span>
                        )}
                      </div>
                    );
                  })()}

                  {/* ── Main info grid ── */}
                  <div className="px-6 py-3 grid grid-cols-2 gap-x-6 gap-y-4 text-sm">

                    {/* LEFT column */}
                    <div className="space-y-4">

                      {/* Department / Agency */}
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                          🏛 Department / Agency
                        </p>
                        {(() => {
                          const dept = opp.fullParentPathName || opp.department || '';
                          if (!dept || dept === 'Unknown') return <p className="text-slate-500 italic text-xs">Not available — view on SAM.gov</p>;
                          const parts = dept.split(':').map((p: string) => p.trim()).filter(Boolean);
                          return (
                            <div>
                              <p className="text-white font-semibold text-sm leading-snug">{parts[0]}</p>
                              {parts.length > 1 && (
                                <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">{parts.slice(1).join(' › ')}</p>
                              )}
                            </div>
                          );
                        })()}
                      </div>

                      {/* Solicitation # — only show if it looks like a real solicitation number */}
                      {opp.solicitationNumber && !opp.solicitationNumber.match(/^[0-9a-f]{32,}$/i) && (
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">📋 Solicitation #</p>
                          <p className="text-cyan-300 font-mono text-xs break-all leading-relaxed">{opp.solicitationNumber}</p>
                        </div>
                      )}

                      {/* NAICS + PSC — only show if we have values */}
                      {(opp.naicsCode || opp.classificationCode) && (
                        <div className="flex gap-4">
                          {opp.naicsCode && (
                            <div>
                              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">📊 NAICS</p>
                              <p className="text-slate-200 font-mono font-bold">{opp.naicsCode}</p>
                            </div>
                          )}
                          {opp.classificationCode && (
                            <div>
                              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">PSC Code</p>
                              <p className="text-slate-200 font-mono font-bold">{opp.classificationCode}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Office location */}
                      {(opp.officeAddress?.city || opp.officeAddress?.state) && (
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">📍 Office Location</p>
                          <p className="text-slate-200 text-sm">
                            {[opp.officeAddress?.city, opp.officeAddress?.state, opp.officeAddress?.zip].filter(Boolean).join(', ')}
                          </p>
                        </div>
                      )}

                      {/* Place of Performance */}
                      {(opp.placeOfPerformance?.city?.name || opp.placeOfPerformance?.state?.name || opp.placeOfPerformance?.state?.code) && (
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">🗺 Place of Performance</p>
                          <p className="text-slate-200 text-sm">
                            {[
                              opp.placeOfPerformance?.city?.name,
                              opp.placeOfPerformance?.state?.name || opp.placeOfPerformance?.state?.code,
                              opp.placeOfPerformance?.zip
                            ].filter(Boolean).join(', ')}
                          </p>
                        </div>
                      )}

                      {/* Contact */}
                      {opp.pointOfContact && opp.pointOfContact.length > 0 && (
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1.5">👤 Point of Contact</p>
                          {opp.pointOfContact.slice(0, 2).map((poc, i) => (
                            <div key={i} className="mb-2 pl-2 border-l-2 border-slate-700">
                              {poc.fullname && (
                                <p className="text-white text-xs font-semibold">
                                  {poc.fullname}
                                  {poc.title && <span className="text-slate-400 font-normal ml-1 text-xs">· {poc.title}</span>}
                                </p>
                              )}
                              {poc.email && (
                                <a href={`mailto:${poc.email}`} className="text-cyan-400 text-xs hover:underline block truncate">{poc.email}</a>
                              )}
                              {poc.phone && <p className="text-slate-400 text-xs">{poc.phone}</p>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* RIGHT column */}
                    <div className="space-y-4">

                      {/* Deadline */}
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">⏰ Response Deadline</p>
                        <p className={`text-lg font-black ${urgencyTextColor}`}>{dl ? formatDate(dl) : 'No deadline'}</p>
                        {bd !== null && <p className="text-xs text-slate-400 mt-0.5">{bd} business days remaining</p>}
                        {opp.updatedResponseDeadLine && opp.updatedResponseDeadLine !== opp.responseDeadLine && (
                          <p className="text-xs text-amber-400 mt-0.5">⚠ Deadline was updated</p>
                        )}
                      </div>

                      {/* Posted */}
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">📅 Posted Date</p>
                        <p className="text-slate-200 font-semibold">{formatDate(postedDate)}</p>
                        {opp.updatedPostedDate && opp.updatedPostedDate !== opp.postedDate && (
                          <p className="text-xs text-cyan-400 mt-0.5">Updated: {formatDate(opp.updatedPostedDate)}</p>
                        )}
                      </div>

                      {/* Opportunity type */}
                      {opp.type && (
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">📄 Opportunity Type</p>
                          <p className="text-slate-200 capitalize">{
                            ({ o: 'Solicitation', p: 'Pre-Solicitation', a: 'Award Notice', r: 'Sources Sought',
                               s: 'Special Notice', k: 'Combined Synopsis', u: 'Justification (J&A)',
                               i: 'Intent to Bundle' } as any)[opp.type] || opp.type
                          }</p>
                        </div>
                      )}

                      {/* Notice ID */}
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">🔑 Notice ID</p>
                        <p className="text-slate-400 font-mono text-xs break-all">{opp.noticeId}</p>
                      </div>

                      {/* AI Analysis */}
                      {opp.aiAnalysis && (
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">🤖 AI Analysis</p>
                          <div className="grid grid-cols-3 gap-2 text-center mb-2">
                            <div className="bg-slate-800/60 rounded-lg p-2">
                              <p className="text-xs text-slate-400">Match</p>
                              <p className="text-sm font-bold text-cyan-300">{opp.aiAnalysis.matchScore}%</p>
                            </div>
                            <div className="bg-slate-800/60 rounded-lg p-2">
                              <p className="text-xs text-slate-400">Competition</p>
                              <p className="text-sm font-bold text-white">{opp.aiAnalysis.competitionLevel}</p>
                            </div>
                            <div className="bg-slate-800/60 rounded-lg p-2">
                              <p className="text-xs text-slate-400">Win Prob</p>
                              <p className="text-sm font-bold text-emerald-300">{opp.aiAnalysis.winProbability}</p>
                            </div>
                          </div>
                          {opp.aiAnalysis.recommendation && (
                            <p className="text-xs text-cyan-300 italic leading-relaxed">{opp.aiAnalysis.recommendation}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer actions */}
                <div className="flex items-center gap-3 px-6 py-4 border-t border-white/10 bg-slate-900/60">
                  <a
                    href={opp.uiLink || `https://sam.gov/opp/${opp.noticeId}/view`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleViewOpportunity(opp.noticeId)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold rounded-xl transition-all shadow-lg text-sm"
                  >
                    View on SAM.gov
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => handleSaveOpportunity(opp.noticeId)}
                    className={`p-3 rounded-xl border transition-all ${isSaved ? 'bg-rose-500/20 border-rose-500/50 text-rose-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-rose-400 hover:border-rose-500/50'}`}
                    title={isSaved ? 'Remove bookmark' : 'Bookmark'}
                  >
                    <Bookmark className="w-5 h-5" fill={isSaved ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    onClick={() => setSelectedOpp(null)}
                    className="p-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Preferences Reminder Modal */}
        {showPrefsReminder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
            <div className="w-full max-w-md bg-gradient-to-br from-slate-900 to-blue-950 border border-cyan-500/30 rounded-3xl p-8 shadow-2xl text-center">
              <button onClick={() => setShowPrefsReminder(false)}
                className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                <X className="w-5 h-5" />
              </button>
              <div className="w-16 h-16 mx-auto mb-2 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center overflow-hidden">
                <Image src="/logo.png" alt="Precise GovCon" width={48} height={48} className="w-10 h-10 object-contain" />
              </div>
              <p className="text-xs text-orange-400 font-bold tracking-widest uppercase mb-3">Precise GovCon</p>
              <h3 className="text-2xl font-black text-white mb-2">
                Get Better <span className="text-orange-400">Curated</span> Opportunities
              </h3>
              <p className="text-slate-300 text-base leading-relaxed mb-6">
                Fill out your opportunity preferences to unlock <strong className="text-white">personalized recommendations</strong> powered by our proprietary analytics tools — matching your NAICS codes, certifications, and target agencies.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => { setShowPrefsReminder(false); setSurveyOpen(true); }}
                  className="w-full py-4 rounded-xl text-white font-black text-base transition-all hover:scale-[1.02]"
                  style={{background: 'linear-gradient(135deg,#ea580c,#f97316)'}}
                >
                  <Sparkles className="inline w-4 h-4 mr-2" />
                  Set My Preferences Now
                </button>
                <button
                  onClick={() => setShowPrefsReminder(false)}
                  className="w-full py-3 rounded-xl text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 text-sm font-medium transition-all"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Opportunity Preferences Survey */}
        <OpportunityPreferencesSurvey 
          isOpen={surveyOpen}
          onClose={() => setSurveyOpen(false)}
          onComplete={(preferences) => {
            setOpportunityPreferences(preferences);
            setUserProfile(prev => ({
              ...prev,
              hasCompletedSurvey: true
            }));
            setSurveyOpen(false);
            window.dispatchEvent(new Event('surveyCompleted'));
          }}
        />
      </div>
    </div>

    {/* ── Floating action strip ────────────────────────────────────── */}
    {/* Positioned at bottom-right, lifted high enough to never overlap
        the app's native Menu / Support buttons that sit at the very bottom */}
    <div style={{
      position: 'fixed',
      bottom: '100px',   // ← clears the Menu + Support buttons below
      right: '20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: '8px',
      zIndex: 9999,
    }}>

      {/* ── Share tray (slides in above main buttons) ── */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '6px',
        overflow: 'hidden',
        maxHeight: shareOpen ? '320px' : '0px',
        opacity: shareOpen ? 1 : 0,
        transition: 'max-height 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.22s ease',
        pointerEvents: shareOpen ? 'auto' : 'none',
      }}>
        {/* Copy link */}
        <button
          onClick={() => {
            navigator.clipboard.writeText(window.location.href).catch(() => {});
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 2000);
            setShareOpen(false);
          }}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '9px 16px',
            background: '#0e2038',
            border: '1.5px solid rgba(56,189,248,0.3)',
            borderRadius: '28px',
            color: '#7dd3fc',
            fontSize: '13px', fontWeight: 600,
            cursor: 'pointer', whiteSpace: 'nowrap',
            boxShadow: '0 4px 18px rgba(0,0,0,0.45)',
            transition: 'all 0.18s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#133352'; e.currentTarget.style.borderColor = 'rgba(56,189,248,0.7)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#0e2038'; e.currentTarget.style.borderColor = 'rgba(56,189,248,0.3)'; }}
        >
          <Link2 size={15} />
          Copy Link
        </button>

        {/* Email */}
        <button
          onClick={() => {
            window.location.href = `mailto:?subject=Government%20Contracting%20Opportunities&body=${encodeURIComponent(window.location.href)}`;
            setShareOpen(false);
          }}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '9px 16px',
            background: '#1f1408',
            border: '1.5px solid rgba(251,146,60,0.3)',
            borderRadius: '28px',
            color: '#fdba74',
            fontSize: '13px', fontWeight: 600,
            cursor: 'pointer', whiteSpace: 'nowrap',
            boxShadow: '0 4px 18px rgba(0,0,0,0.45)',
            transition: 'all 0.18s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#3a210a'; e.currentTarget.style.borderColor = 'rgba(251,146,60,0.7)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#1f1408'; e.currentTarget.style.borderColor = 'rgba(251,146,60,0.3)'; }}
        >
          <Mail size={15} />
          Share via Email
        </button>

        {/* LinkedIn */}
        <button
          onClick={() => {
            window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, '_blank');
            setShareOpen(false);
          }}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '9px 16px',
            background: '#071626',
            border: '1.5px solid rgba(14,165,233,0.3)',
            borderRadius: '28px',
            color: '#38bdf8',
            fontSize: '13px', fontWeight: 600,
            cursor: 'pointer', whiteSpace: 'nowrap',
            boxShadow: '0 4px 18px rgba(0,0,0,0.45)',
            transition: 'all 0.18s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#0d2a44'; e.currentTarget.style.borderColor = 'rgba(14,165,233,0.7)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#071626'; e.currentTarget.style.borderColor = 'rgba(14,165,233,0.3)'; }}
        >
          {/* LinkedIn wordmark icon */}
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/>
            <rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>
          </svg>
          Share on LinkedIn
        </button>

        {/* Print / Save PDF */}
        <button
          onClick={() => { window.print(); setShareOpen(false); }}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '9px 16px',
            background: '#160f2e',
            border: '1.5px solid rgba(167,139,250,0.3)',
            borderRadius: '28px',
            color: '#c4b5fd',
            fontSize: '13px', fontWeight: 600,
            cursor: 'pointer', whiteSpace: 'nowrap',
            boxShadow: '0 4px 18px rgba(0,0,0,0.45)',
            transition: 'all 0.18s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#2a1a52'; e.currentTarget.style.borderColor = 'rgba(167,139,250,0.7)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#160f2e'; e.currentTarget.style.borderColor = 'rgba(167,139,250,0.3)'; }}
        >
          <Printer size={15} />
          Print / Save PDF
        </button>
      </div>

      {/* ── Link copied toast ── */}
      {linkCopied && (
        <div style={{
          padding: '7px 16px',
          background: '#0e2038',
          border: '1.5px solid rgba(56,189,248,0.4)',
          borderRadius: '20px',
          color: '#38bdf8',
          fontSize: '12px',
          fontWeight: 600,
          whiteSpace: 'nowrap',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          animation: 'fadeInUp 0.2s ease',
        }}>
          ✓ Link copied!
        </div>
      )}

      {/* ── Main action row ── */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>

        {/* Back to top */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          title="Back to top"
          style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            padding: '10px 15px',
            background: 'linear-gradient(135deg, #1e3a5f, #0f2744)',
            border: '1.5px solid rgba(6,182,212,0.45)',
            borderRadius: '28px',
            color: '#67e8f9',
            fontSize: '13px', fontWeight: 600,
            cursor: 'pointer', whiteSpace: 'nowrap',
            boxShadow: '0 0 14px rgba(6,182,212,0.25), 0 4px 14px rgba(0,0,0,0.5)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #0e7490, #0369a1)';
            e.currentTarget.style.borderColor = 'rgba(6,182,212,0.85)';
            e.currentTarget.style.boxShadow = '0 0 22px rgba(6,182,212,0.55), 0 4px 16px rgba(0,0,0,0.6)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #1e3a5f, #0f2744)';
            e.currentTarget.style.borderColor = 'rgba(6,182,212,0.45)';
            e.currentTarget.style.boxShadow = '0 0 14px rgba(6,182,212,0.25), 0 4px 14px rgba(0,0,0,0.5)';
          }}
        >
          <ChevronUp size={16} />
          Top
        </button>

        {/* Export CSV */}
        <button
          onClick={handleExportOpportunities}
          title="Export to CSV"
          style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            padding: '10px 15px',
            background: 'linear-gradient(135deg, #1a3a2a, #0d2418)',
            border: '1.5px solid rgba(16,185,129,0.45)',
            borderRadius: '28px',
            color: '#6ee7b7',
            fontSize: '13px', fontWeight: 600,
            cursor: 'pointer', whiteSpace: 'nowrap',
            boxShadow: '0 0 14px rgba(16,185,129,0.2), 0 4px 14px rgba(0,0,0,0.5)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #059669, #047857)';
            e.currentTarget.style.borderColor = 'rgba(16,185,129,0.85)';
            e.currentTarget.style.boxShadow = '0 0 22px rgba(16,185,129,0.45), 0 4px 16px rgba(0,0,0,0.6)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #1a3a2a, #0d2418)';
            e.currentTarget.style.borderColor = 'rgba(16,185,129,0.45)';
            e.currentTarget.style.boxShadow = '0 0 14px rgba(16,185,129,0.2), 0 4px 14px rgba(0,0,0,0.5)';
          }}
        >
          <Download size={16} />
          Export
        </button>

        {/* Refresh */}
        <button
          onClick={handleRefresh}
          title="Refresh from SAM.gov"
          style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            padding: '10px 15px',
            background: 'linear-gradient(135deg, #1e1a3f, #130f2e)',
            border: '1.5px solid rgba(139,92,246,0.45)',
            borderRadius: '28px',
            color: '#c4b5fd',
            fontSize: '13px', fontWeight: 600,
            cursor: 'pointer', whiteSpace: 'nowrap',
            boxShadow: '0 0 14px rgba(139,92,246,0.2), 0 4px 14px rgba(0,0,0,0.5)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #7c3aed, #6d28d9)';
            e.currentTarget.style.borderColor = 'rgba(139,92,246,0.85)';
            e.currentTarget.style.boxShadow = '0 0 22px rgba(139,92,246,0.45), 0 4px 16px rgba(0,0,0,0.6)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #1e1a3f, #130f2e)';
            e.currentTarget.style.borderColor = 'rgba(139,92,246,0.45)';
            e.currentTarget.style.boxShadow = '0 0 14px rgba(139,92,246,0.2), 0 4px 14px rgba(0,0,0,0.5)';
          }}
        >
          <RefreshCw size={16} />
          Refresh
        </button>

        {/* Share — toggles the tray above */}
        <button
          onClick={() => setShareOpen(s => !s)}
          title="Share"
          style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            padding: '10px 15px',
            background: shareOpen
              ? 'linear-gradient(135deg, #1d6ef5, #1558d6)'
              : 'linear-gradient(135deg, #132238, #0e1c2e)',
            border: `1.5px solid ${shareOpen ? 'rgba(59,130,246,0.85)' : 'rgba(255,255,255,0.14)'}`,
            borderRadius: '28px',
            color: shareOpen ? '#fff' : '#94a3b8',
            fontSize: '13px', fontWeight: 600,
            cursor: 'pointer', whiteSpace: 'nowrap',
            boxShadow: shareOpen
              ? '0 4px 22px rgba(29,110,245,0.45), 0 0 0 1px rgba(59,130,246,0.15)'
              : '0 4px 14px rgba(0,0,0,0.4)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            if (!shareOpen) {
              e.currentTarget.style.background = 'linear-gradient(135deg, #1a2e48, #132238)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.26)';
              e.currentTarget.style.color = '#e2e8f0';
            }
          }}
          onMouseLeave={e => {
            if (!shareOpen) {
              e.currentTarget.style.background = 'linear-gradient(135deg, #132238, #0e1c2e)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)';
              e.currentTarget.style.color = '#94a3b8';
            }
          }}
        >
          <Share2 size={16} />
          Share
          <ChevronDown
            size={13}
            style={{
              opacity: 0.7,
              transform: shareOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.25s ease',
            }}
          />
        </button>
      </div>
    </div>
    </>
  );
}