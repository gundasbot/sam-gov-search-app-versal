// app/opportunities/OpportunitiesClient.tsx
'use client';

export const dynamic = 'force-dynamic';


import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import OpportunityPreferencesSurvey from '@/components/OpportunityPreferencesSurvey';
import {
  TrendingUp, Building2, Calendar, Award, Target, Briefcase,
  ExternalLink, Search, RefreshCw, XCircle,
  CheckCircle2, Timer, ChevronDown, Loader2, Heart,
  Trophy, Star, TargetIcon, Zap, CheckCircle, AlertCircle, Filter,
  Bell, BarChart3, ArrowUpRight, LineChart, Download, Bookmark, Eye, Sparkles,
  List, Grid3x3, Layers, X, Settings, MapPin
} from 'lucide-react';

interface SamOpportunity {
  noticeId: string;
  title: string;
  solicitationNumber: string;
  department: string;
  postedDate: string;
  responseDeadLine: string;
  naicsCode: string;
  typeOfSetAsideDescription: string;
  typeOfSetAside: string;
  uiLink: string;
  officeAddress?: {
    city?: string;
    state?: string;
  };
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

const PLACEHOLDER_STATS = {
  totalActive: 956,
  setAsides: 423,
  closingSoon: 28,
  departments: 42,
  postedToday: 12
};

// 🎯 NEW: User profile interface
interface UserProfile {
  firstName: string;
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
  if (businessDays <= 3) return 'bg-red-500/20 text-red-400 border-red-500/50';
  if (businessDays <= 5) return 'bg-orange-500/20 text-orange-400 border-orange-500/50';
  if (businessDays <= 7) return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
  if (businessDays <= 10) return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50';
  if (businessDays <= 14) return 'bg-lime-500/20 text-lime-400 border-lime-500/50';
  if (businessDays <= 21) return 'bg-green-500/20 text-green-400 border-green-500/50';
  if (businessDays <= 30) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50';
  return 'bg-emerald-600/20 text-emerald-500 border-emerald-600/50';
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

const getUrgencyIcon = (businessDays: number) => {
  if (businessDays <= 3) return '🔴';
  if (businessDays <= 5) return '🟠';
  if (businessDays <= 7) return '🟡';
  if (businessDays <= 10) return '🟡';
  return '🟢';
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

const getBusinessDaysUntil = (deadline: Date | string): number => {
  const deadlineDate = typeof deadline === 'string' ? new Date(deadline) : deadline;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  deadlineDate.setHours(0, 0, 0, 0);
  
  return calculateBusinessDays(today, deadlineDate);
};


export default function OpportunitiesClient() {
  const searchParams = useSearchParams();
  const filterParam = searchParams?.get('filter') ?? null;
  const { data: session } = useSession();

  const [allOpportunities, setAllOpportunities] = useState<SamOpportunity[]>([]);
  const [displayedOpportunities, setDisplayedOpportunities] = useState<SamOpportunity[]>(PLACEHOLDER_OPPORTUNITIES);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedSetAside, setSelectedSetAside] = useState<string>('all');
  const [displayCount, setDisplayCount] = useState(30); // Increased from 20 for compact view
  const [totalRecords, setTotalRecords] = useState(PLACEHOLDER_STATS.totalActive);
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
  const resultsRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [refreshIndicator, setRefreshIndicator] = useState(false);

  // 🎯 NEW: View mode state
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [groupMode, setGroupMode] = useState<GroupMode>('urgency');
  const [surveyOpen, setSurveyOpen] = useState(false);

  // ✅ NEW: Banner dismissal states
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(true);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // 🎯 FIXED: Get user name from session instead of API call
  const userName = session?.user?.name?.split(' ')[0] || '';
  const userDisplayName = userName 
    ? (userName.endsWith('s') ? `${userName}'` : `${userName}'s`)
    : '';

  // 🎯 FIXED: Create user profile from session
  const [userProfile, setUserProfile] = useState<UserProfile>({
    firstName: userName,
    companyName: 'Your Business',
    monthlyGoal: 10,
    achievedThisMonth: 7,
    hasCompletedSurvey: false
  });

  const [userAchievement, setUserAchievement] = useState('');
  const [userTip, setUserTip] = useState('');

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

  // 🎯 OPTIMIZED: Memoized filter application
  const applyFilters = useCallback((
    opportunities: SamOpportunity[],
    filter: string | null,
    search: string,
    type: string,
    setAside: string,
    active: typeof activeFilter
  ) => {
    let filtered = [...opportunities];

    // 🎯 FIXED: Only apply user preferences if survey is completed
    if (opportunityPreferences && userProfile.hasCompletedSurvey) {
      // Filter by NAICS codes
      if (opportunityPreferences.naicsCodes?.length > 0) {
        filtered = filtered.filter(opp => 
          opportunityPreferences.naicsCodes.some((code: string) => 
            opp.naicsCode?.startsWith(code)
          )
        );
      }
      
      // Filter by set-aside types
      if (opportunityPreferences.setAsideTypes?.length > 0) {
        filtered = filtered.filter(opp =>
          opportunityPreferences.setAsideTypes.some((type: string) =>
            opp.typeOfSetAsideDescription?.includes(type)
          )
        );
      }
      
      // Filter by agencies
      if (opportunityPreferences.agencies?.length > 0) {
        filtered = filtered.filter(opp =>
          opportunityPreferences.agencies.some((agency: string) =>
            opp.department?.toUpperCase().includes(agency.toUpperCase())
          )
        );
      }
      
      // Filter by response deadline minimum
      if (opportunityPreferences.responseDeadlineMin) {
        const today = new Date();
        filtered = filtered.filter(opp => {
          if (!opp.responseDeadLine) return false;
          const deadline = new Date(opp.responseDeadLine);
          const daysUntil = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          return daysUntil >= opportunityPreferences.responseDeadlineMin;
        });
      }
      
      // Filter by keywords (include)
      if (opportunityPreferences.keywords?.length > 0) {
        filtered = filtered.filter(opp =>
          opportunityPreferences.keywords.some((keyword: string) =>
            opp.title?.toLowerCase().includes(keyword.toLowerCase()) ||
            opp.department?.toLowerCase().includes(keyword.toLowerCase())
          )
        );
      }
      
      // Filter by keywords (exclude)
      if (opportunityPreferences.excludeKeywords?.length > 0) {
        filtered = filtered.filter(opp =>
          !opportunityPreferences.excludeKeywords.some((keyword: string) =>
            opp.title?.toLowerCase().includes(keyword.toLowerCase()) ||
            opp.department?.toLowerCase().includes(keyword.toLowerCase())
          )
        );
      }
      
      // Filter by states
      if (opportunityPreferences.states?.length > 0) {
        filtered = filtered.filter(opp =>
          opportunityPreferences.states.some((state: string) =>
            opp.officeAddress?.state?.toLowerCase().includes(state.toLowerCase())
          )
        );
      }
    }

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
        case 'agencies':
          // Show all, but could be modified to show specific agency filter
          break;
      }
    }

    // Apply active filter from pills
    if (active) {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      switch (active) {
        case 'setasides':
          filtered = filtered.filter(o => o.typeOfSetAside && o.typeOfSetAside !== 'None' && o.typeOfSetAside !== '');
          break;
        case 'expiring':
          filtered = filtered.filter(o => {
            if (!o.responseDeadLine) return false;
            const deadline = new Date(o.responseDeadLine);
            return deadline <= nextWeek && deadline >= new Date();
          });
          break;
        case 'departments':
          // Show all, could group by department
          break;
        case 'active':
        default:
          // No additional filtering for active
          break;
      }
    }

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(opp =>
        opp.title?.toLowerCase().includes(searchLower) ||
        opp.department?.toLowerCase().includes(searchLower) ||
        opp.solicitationNumber?.toLowerCase().includes(searchLower)
      );
    }

    // Apply type filter
    if (type !== 'all') {
      filtered = filtered.filter(opp => opp.typeOfSetAside === type);
    }

    // Apply set-aside filter
    if (setAside !== 'all') {
      filtered = filtered.filter(opp => opp.typeOfSetAside === setAside);
    }


    // Apply agency filter
    if (selectedAgency !== 'all') {
      filtered = filtered.filter(opp => 
        opp.department?.toUpperCase().includes(selectedAgency.toUpperCase())
      );
    }

    // Apply NAICS filter
    if (selectedNAICS !== 'all') {
      filtered = filtered.filter(opp => 
        opp.naicsCode?.startsWith(selectedNAICS)
      );
    }

    // Apply urgency filter
    if (selectedUrgency !== 'all') {
      filtered = filtered.filter(opp => {
        if (!opp.responseDeadLine) return false;
        const deadline = new Date(opp.responseDeadLine);
        const today = new Date();
        const daysUntil = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        switch (selectedUrgency) {
          case 'critical': return daysUntil <= 3;
          case 'urgent': return daysUntil >= 4 && daysUntil <= 5;
          case 'high': return daysUntil >= 6 && daysUntil <= 7;
          case 'normal': return daysUntil >= 8 && daysUntil <= 14;
          case 'comfortable': return daysUntil >= 15;
          default: return true;
        }
      });
    }

    return filtered;
  }, [opportunityPreferences, selectedAgency, selectedNAICS, selectedUrgency]);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'Invalid date';
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
      setDisplayCount(prev => Math.min(prev + 30, displayedOpportunities.length)); // Increased from 20
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
      formatDate(opp.responseDeadLine),
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
    // Toggle off if clicking the same pill
    if (activeFilter === type) {
      setActiveFilter(null);
      setSearchTerm('');
      setSelectedType('all');
      setSelectedSetAside('all');
      return;
    }

    // Set new active filter
    setActiveFilter(type);

    // Clear other filters
    setSearchTerm('');
    setSelectedType('all');
    setSelectedSetAside('all');

    // Scroll to results after a brief delay
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // 🎯 IMPROVED: Polling interval for periodic updates
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const POLLING_INTERVAL = 300000; // 5 minutes (reduced from 30 seconds to avoid rate limiting)
  const rateLimitBackoffRef = useRef<number>(0);
  const lastSuccessfulFetchRef = useRef<number>(Date.now());

  // 🎯 NEW: Listen for survey completion events

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
        firstName: userName
      }));
    } else {
      // For unsigned users, use more generic achievements/tips
      setUserAchievement('Discover thousands of federal opportunities!');
      setUserTip('Sign up to get personalized matches for your business');
    }
  }, [userName]);

  // 🎯 NEW: Listen for preference updates and apply curation
  useEffect(() => {
    const handlePreferencesUpdate = (event: CustomEvent) => {
      setOpportunityPreferences(event.detail);
    };
    
    window.addEventListener('preferences-updated' as any, handlePreferencesUpdate);
    
    // Load saved preferences on mount
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

// DISABLED:   // 🎯 NEW: Infinite scroll implementation
// DISABLED:   useEffect(() => {
// DISABLED:     const observer = new IntersectionObserver(
// DISABLED:       (entries) => {
// DISABLED:         if (entries[0].isIntersecting && hasMore && !loadingMore) {
// DISABLED:           handleLoadMore();
// DISABLED:         }
// DISABLED:       },
// DISABLED:       { threshold: 0.5 }
// DISABLED:     );
// DISABLED: 
// DISABLED:     if (loadMoreRef.current) {
// DISABLED:       observer.observe(loadMoreRef.current);
// DISABLED:     }
// DISABLED: 
// DISABLED:     return () => observer.disconnect();
// DISABLED:   }, [hasMore, loadingMore, handleLoadMore]);

  // Fetch ALL opportunities from SAM.gov
  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const fetchAllOpportunities = async () => {
      try {
        if (!dataLoaded) {
          setLoading(true);
        }

        // Fetch with high limit to get as many as possible
        const response = await fetch(`/api/sam/opportunities?limit=1000&t=${Date.now()}`, {
          signal: abortController.signal
        });

        if (!response.ok) {
          // Handle rate limiting (429) specially
          if (response.status === 429) {
            rateLimitBackoffRef.current = Math.min(rateLimitBackoffRef.current + 1, 5);
            const waitMinutes = Math.pow(2, rateLimitBackoffRef.current);
            console.warn(`⚠️ Rate limited by SAM.gov. Backing off for ${waitMinutes} minutes.`);
            
            if (isMounted) {
              setError(`SAM.gov rate limit reached. Pausing requests for ${waitMinutes} minutes. All features work with current data.`);
              setLastUpdated('Rate Limited');
            }
            
            // Stop polling temporarily
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
            }
            
            // Resume polling after backoff period
            setTimeout(() => {
              if (isMounted) {
                pollingIntervalRef.current = setInterval(() => {
                  if (!loading) {
                    fetchAllOpportunities();
                  }
                }, POLLING_INTERVAL);
              }
            }, waitMinutes * 60 * 1000);
            
            return;
          }
          
          // Other errors - gracefully degrade
          console.warn(`⚠️ SAM API unavailable (${response.status}), using current data`);

          if (isMounted && !dataLoaded) {
            setError('SAM.gov API is temporarily unavailable. Interactive features work with sample data below.');
            setLastUpdated('API Unavailable');
            // Keep placeholder data visible
          }
          return; // Don't throw, return gracefully
        }

        // Success! Reset backoff counter
        rateLimitBackoffRef.current = 0;
        lastSuccessfulFetchRef.current = Date.now();

        const result = await response.json();

        if (isMounted) {
          const opportunities = result.opportunities || [];
          setAllOpportunities(opportunities);
          setTotalRecords(result.total || result.totalRecords || opportunities.length || 0);
          setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
          setDataLoaded(true);
          setError(null); // Clear any previous errors
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        console.error('Error fetching opportunities:', err);
        if (isMounted && !dataLoaded) {
          setError('Unable to connect to SAM.gov. Interactive features work with sample data below.');
          setLastUpdated('Connection Failed');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          setRefreshIndicator(false);
        }
      }
    };

    // Initial fetch
    // DISABLED AUTO-FETCH:     fetchAllOpportunities();

    // Set up polling for periodic updates
    //     pollingIntervalRef.current = setInterval(() => {
    //       if (!loading) {
    //         fetchAllOpportunities();
    //       }
    //     }, POLLING_INTERVAL);
    console.log("✅ Auto-fetch DISABLED. Use Refresh button to manually fetch from SAM.gov");

    return () => {
      isMounted = false;
      abortController.abort();
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []); // Run only once on mount

  // Apply filters based on URL parameter or user selection
  useEffect(() => {
    if (dataLoaded && allOpportunities.length > 0) {
      const filtered = applyFilters(
        allOpportunities,
        filterParam,
        searchTerm,
        selectedType,
        selectedSetAside,
        activeFilter
      );
      setDisplayedOpportunities(filtered);
      setDisplayCount(30); // Reset display count when filters change - increased for compact view
    }
  }, [allOpportunities, filterParam, searchTerm, selectedType, selectedSetAside, dataLoaded, activeFilter, applyFilters, selectedAgency, selectedNAICS, selectedUrgency]);

  // 🎯 OPTIMIZED: Memoized statistics
  const stats = useMemo(() => {
    if (!dataLoaded) return PLACEHOLDER_STATS;
    
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);

    return {
      totalActive: totalRecords || 0,
      setAsides: allOpportunities.filter(o => o.typeOfSetAside && o.typeOfSetAside !== 'None').length,
      closingSoon: allOpportunities.filter(o => {
        if (!o.responseDeadLine) return false;
        const deadline = new Date(o.responseDeadLine);
        const daysUntil = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return daysUntil <= 7 && daysUntil > 0;
      }).length,
      departments: new Set(allOpportunities.map(o => o.department)).size,
      postedToday: allOpportunities.filter(o => o.postedDate?.startsWith(today)).length
    };
  }, [dataLoaded, totalRecords, allOpportunities]);

  // 🎯 NEW: Calculate personalized stats
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

  // 🎯 REMOVED: Loading and error screens that block UI
  const visibleOpportunities = displayedOpportunities.slice(0, displayCount);
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
          groupKey = opp.department || 'Unknown Department';
          break;
        case 'urgency':
          if (opp.responseDeadLine) {
            const deadline = new Date(opp.responseDeadLine);
            const today = new Date();
            const daysUntil = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            groupKey = getUrgencyLabel(daysUntil);
          } else {
            groupKey = 'No Deadline';
          }
          break;
        case 'setaside':
          groupKey = opp.typeOfSetAsideDescription || 'No Set-Aside';
          break;
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(opp);
    });

    // Sort groups by urgency if grouping by urgency
    if (groupMode === 'urgency') {
      const urgencyOrder = ['URGENT', 'Closing Soon', 'Act Fast', 'Good Time', 'Ample Time', 'No Deadline'];
      return Object.fromEntries(
        Object.entries(groups).sort((a, b) => 
          urgencyOrder.indexOf(a[0]) - urgencyOrder.indexOf(b[0])
        )
      );
    }

    return groups;
  }, [visibleOpportunities, groupMode]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 pb-40">
      {/* 🎯 IMPROVED: Non-blocking, non-sticky header */}
      <div className="border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-[1900px] mx-auto px-6 lg:px-10 xl:px-12 py-4">
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

      {/* 🚨 Error Banner - SAM.gov API Issues */}
      {error && (
        <div className="border-b border-red-500/20 bg-red-500/10 backdrop-blur-xl">
          <div className="max-w-[1900px] mx-auto px-6 lg:px-10 xl:px-12 py-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-red-300 mb-1">
                  SAM.gov API Temporarily Unavailable
                </h3>
                <p className="text-sm text-red-200/80 leading-relaxed">
                  {error} All interactive features (pills, filters, search) are fully functional.
                  Real data will load automatically when SAM.gov&apos;s service is restored (auto-retry every 30 seconds).
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

      {/* 🎯 IMPROVED: Better responsive container */}
      <div className="max-w-[1900px] mx-auto px-6 lg:px-10 xl:px-12 py-8">

        {/* 🎯 PERSONALIZED: Welcome Header */}
        {/* ✅ UPDATED: Smart Welcome Banner with Dismissal */}
        {showWelcomeBanner && !userProfile.hasCompletedSurvey && (
          <div className="mb-8 p-6 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-cyan-500/10 rounded-2xl border border-white/10 relative" style={{ fontFamily: 'Aptos, sans-serif' }}>
            {/* Close button */}
            <button
              onClick={handleDismissBanner}
              className="absolute top-4 right-4 p-2 hover:bg-red-500/20 rounded-lg transition-colors text-slate-400 hover:text-red-400"
              aria-label="Dismiss"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-start justify-between gap-4 pr-12">
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

        {/* ✅ NEW: Success message after survey completion */}
        {userProfile.hasCompletedSurvey && !bannerDismissed && (
          <div className="mb-8 p-6 bg-gradient-to-br from-emerald-500/10 via-cyan-500/10 to-blue-500/10 rounded-2xl border border-emerald-500/30 relative" style={{ fontFamily: 'Aptos, sans-serif' }}>
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


        {/* 🎯 NEW: Stats Pills with Better Visuals */}
        <div className="mb-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <button
            onClick={() => handlePillClick('active')}
            className={`group p-4 rounded-xl border-2 transition-all ${
              activeFilter === 'active'
                ? 'bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border-emerald-500/50'
                : 'bg-slate-800/40 border-slate-700 hover:border-emerald-500/50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <CheckCircle2 className={`w-5 h-5 ${activeFilter === 'active' ? 'text-emerald-400' : 'text-slate-400'}`} />
              <TrendingUp className="w-4 h-4 text-emerald-400 opacity-50" />
            </div>
            <div className="text-left">
              <div className="text-2xl font-bold text-white mb-1">{stats.totalActive.toLocaleString()}</div>
              <div className="text-xs text-slate-400 font-medium">Active Opportunities</div>
            </div>
          </button>

          <button
            onClick={() => handlePillClick('setasides')}
            className={`group p-4 rounded-xl border-2 transition-all ${
              activeFilter === 'setasides'
                ? 'bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border-blue-500/50'
                : 'bg-slate-800/40 border-slate-700 hover:border-blue-500/50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <Award className={`w-5 h-5 ${activeFilter === 'setasides' ? 'text-blue-400' : 'text-slate-400'}`} />
              <Star className="w-4 h-4 text-blue-400 opacity-50" />
            </div>
            <div className="text-left">
              <div className="text-2xl font-bold text-white mb-1">{stats.setAsides.toLocaleString()}</div>
              <div className="text-xs text-slate-400 font-medium">Set-Asides</div>
            </div>
          </button>

          <button
            onClick={() => handlePillClick('expiring')}
            className={`group p-4 rounded-xl border-2 transition-all ${
              activeFilter === 'expiring'
                ? 'bg-gradient-to-br from-orange-500/20 to-red-500/20 border-orange-500/50'
                : 'bg-slate-800/40 border-slate-700 hover:border-orange-500/50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <Timer className={`w-5 h-5 ${activeFilter === 'expiring' ? 'text-orange-400' : 'text-slate-400'}`} />
              <Zap className="w-4 h-4 text-orange-400 opacity-50" />
            </div>
            <div className="text-left">
              <div className="text-2xl font-bold text-white mb-1">{stats.closingSoon.toLocaleString()}</div>
              <div className="text-xs text-slate-400 font-medium">Closing Soon</div>
            </div>
          </button>

          <button
            onClick={() => handlePillClick('departments')}
            className={`group p-4 rounded-xl border-2 transition-all ${
              activeFilter === 'departments'
                ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/50'
                : 'bg-slate-800/40 border-slate-700 hover:border-purple-500/50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <Building2 className={`w-5 h-5 ${activeFilter === 'departments' ? 'text-purple-400' : 'text-slate-400'}`} />
              <Briefcase className="w-4 h-4 text-purple-400 opacity-50" />
            </div>
            <div className="text-left">
              <div className="text-2xl font-bold text-white mb-1">{stats.departments.toLocaleString()}</div>
              <div className="text-xs text-slate-400 font-medium">Departments</div>
            </div>
          </button>

          <div className="p-4 rounded-xl border-2 bg-slate-800/40 border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="w-5 h-5 text-slate-400" />
              <Bell className="w-4 h-4 text-cyan-400 opacity-50" />
            </div>
            <div className="text-left">
              <div className="text-2xl font-bold text-white mb-1">{stats.postedToday.toLocaleString()}</div>
              <div className="text-xs text-slate-400 font-medium">Posted Today</div>
            </div>
          </div>
        </div>

        {/* 🎯 NEW: View Controls */}
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-slate-800/40 rounded-xl border border-slate-700">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-300">View:</span>
            <div className="flex items-center gap-2 p-1 bg-slate-900/50 rounded-lg">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-slate-300'
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-slate-300'
                }`}
                title="Grid View"
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('compact')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'compact' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-slate-300'
                }`}
                title="Compact View"
              >
                <Layers className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-300">Group By:</span>
            <select
              value={groupMode}
              onChange={(e) => setGroupMode(e.target.value as GroupMode)}
              className="px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="none">No Grouping</option>
              <option value="urgency">Urgency (Days Until Deadline)</option>
              <option value="department">Department</option>
              <option value="setaside">Set-Aside Type</option>
            </select>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search opportunities by title, department, or solicitation number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-12 py-4 bg-slate-800/60 border-2 border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>


        {/* 🎯 NEW: Advanced Filters - SAM.gov Parameters */}
        <div className="mb-6 p-4 bg-slate-800/40 rounded-xl border border-slate-700">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-bold text-white">Filter Curated Opportunities</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Agency Filter */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Federal Agency
              </label>
              <select
                value={selectedAgency}
                onChange={(e) => setSelectedAgency(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              >
                <option value="all">All Agencies</option>
                <option value="DEPT OF DEFENSE">DEPT OF DEFENSE</option>
                <option value="DEPT OF THE ARMY">DEPT OF THE ARMY</option>
                <option value="DEPT OF THE NAVY">DEPT OF THE NAVY</option>
                <option value="DEPT OF THE AIR FORCE">DEPT OF THE AIR FORCE</option>
                <option value="GENERAL SERVICES ADMINISTRATION">GSA</option>
                <option value="DEPT OF HOMELAND SECURITY">DHS</option>
                <option value="DEPT OF VETERANS AFFAIRS">VA</option>
                <option value="DEPT OF HEALTH AND HUMAN SERVICES">HHS</option>
                <option value="DEPT OF ENERGY">DOE</option>
                <option value="NATIONAL AERONAUTICS AND SPACE ADMINISTRATION">NASA</option>
              </select>
            </div>

            {/* Set-Aside Filter */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Set-Aside Type
              </label>
              <select
                value={selectedSetAside}
                onChange={(e) => setSelectedSetAside(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              >
                <option value="all">All Set-Asides</option>
                <option value="SBA">Total Small Business</option>
                <option value="8A">8(a) Set-Aside</option>
                <option value="HZC">HUBZone</option>
                <option value="SDVOSBC">SDVOSB</option>
                <option value="WOSB">WOSB</option>
                <option value="EDWOSB">EDWOSB</option>
              </select>
            </div>

            {/* NAICS Filter */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                NAICS Code
              </label>
              <select
                value={selectedNAICS}
                onChange={(e) => setSelectedNAICS(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              >
                <option value="all">All NAICS</option>
                <option value="541">Professional Services</option>
                <option value="541330">Engineering Services</option>
                <option value="541511">Custom Programming</option>
                <option value="541512">Systems Design</option>
                <option value="541519">IT Services</option>
                <option value="541611">Admin Consulting</option>
                <option value="541618">Management Consulting</option>
              </select>
            </div>

            {/* Urgency Filter */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Urgency Level
              </label>
              <select
                value={selectedUrgency}
                onChange={(e) => setSelectedUrgency(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              >
                <option value="all">All Deadlines</option>
                <option value="critical">🔥 Critical (≤3 days)</option>
                <option value="urgent">⚠️ Urgent (4-5 days)</option>
                <option value="high">⏰ High Priority (6-7 days)</option>
                <option value="normal">📅 Normal (8-14 days)</option>
                <option value="comfortable">✓ Comfortable (15+ days)</option>
              </select>
            </div>
          </div>

          {/* Active Filters Display */}
          {(selectedAgency !== 'all' || selectedSetAside !== 'all' || selectedNAICS !== 'all' || selectedUrgency !== 'all') && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-sm text-slate-400 font-semibold">Active Filters:</span>
              {selectedAgency !== 'all' && (
                <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-semibold flex items-center gap-1">
                  Agency: {selectedAgency.length > 25 ? selectedAgency.substring(0, 25) + '...' : selectedAgency}
                  <button onClick={() => setSelectedAgency('all')} className="hover:text-blue-300">
                    <XCircle className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedSetAside !== 'all' && (
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-semibold flex items-center gap-1">
                  Set-Aside: {selectedSetAside}
                  <button onClick={() => setSelectedSetAside('all')} className="hover:text-emerald-300">
                    <XCircle className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedNAICS !== 'all' && (
                <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs font-semibold flex items-center gap-1">
                  NAICS: {selectedNAICS}
                  <button onClick={() => setSelectedNAICS('all')} className="hover:text-purple-300">
                    <XCircle className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedUrgency !== 'all' && (
                <span className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs font-semibold flex items-center gap-1">
                  Urgency: {selectedUrgency}
                  <button onClick={() => setSelectedUrgency('all')} className="hover:text-orange-300">
                    <XCircle className="w-3 h-3" />
                  </button>
                </span>
              )}
              <button
                onClick={() => {
                  setSelectedAgency('all');
                  setSelectedSetAside('all');
                  setSelectedNAICS('all');
                  setSelectedUrgency('all');
                }}
                className="px-3 py-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-full text-xs font-semibold transition-colors"
              >
                Clear All
              </button>
            </div>
          )}
        </div>


        {/* ✅ NEW: Active Solicitations Statement */}
        {dataLoaded && displayedOpportunities.length > 0 && (
          <div className="mb-6 p-4 bg-emerald-500/10 border-l-4 border-emerald-500 rounded-r-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <CheckCircle className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Aptos, sans-serif' }}>
                  Showing Active Solicitations Only
                </h3>
                <p className="text-sm text-slate-300" style={{ fontFamily: 'Aptos, sans-serif' }}>
                  All <span className="font-bold text-emerald-400">{displayedOpportunities.length}</span> opportunities are currently accepting responses and sorted by deadline (earliest first)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Results Header */}
        <div ref={resultsRef} className="mb-6 flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">
            {displayedOpportunities.length === 0 ? (
              'No opportunities found'
            ) : (
              <>Showing <span className="text-cyan-400">{visibleOpportunities.length.toLocaleString()}</span> of <span className="text-cyan-400">{displayedOpportunities.length.toLocaleString()}</span> opportunities</>
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

        {/* 🎯 NEW: Opportunities Display with Multiple View Modes */}
        {Object.entries(groupedOpportunities).map(([groupName, opportunities]) => (
          <div key={groupName} className="mb-8">
            {groupMode !== 'none' && (
              <div className="mb-4 flex items-center gap-3">
                <h4 className="text-lg font-bold text-white">{groupName}</h4>
                <div className="flex-1 h-px bg-gradient-to-r from-slate-700 to-transparent"></div>
                <span className="text-sm text-slate-400 font-semibold">{opportunities.length} opportunities</span>
              </div>
            )}

            {/* COMPACT VIEW */}
            {viewMode === 'compact' && (
              <div className="space-y-2">
                {opportunities.map((opp) => {
                  const isPlaceholder = opp.noticeId.startsWith('placeholder');
                  const deadline = opp.responseDeadLine ? new Date(opp.responseDeadLine) : null;
                  const today = new Date();
                  const businessDays = deadline ? getBusinessDaysUntil(deadline) : null;
                  const calendarDays = deadline ? Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null;
                  const isSaved = savedOpportunities.has(opp.noticeId);
                  const isViewed = viewedOpportunities.has(opp.noticeId);
                  const hasAnalysis = opp.aiAnalysis !== undefined;
                  const isAnalyzing = analyzingOpps.has(opp.noticeId);
                  const urgencyGradient = businessDays !== null ? getUrgencyGradient(businessDays) : getDepartmentGradient(opp.department);
                  const urgencyTextColor = businessDays !== null ? getUrgencyTextColor(businessDays) : 'text-cyan-400';
                  const urgencyLabel = businessDays !== null ? getUrgencyLabel(businessDays) : '';
                  const urgencyIcon = businessDays !== null ? getUrgencyIcon(businessDays) : '';

                  return (
                    <div
                      key={opp.noticeId}
                      className={`group p-3 bg-gradient-to-r ${urgencyGradient} rounded-lg border-2 hover:shadow-lg transition-all ${
                        isPlaceholder ? 'animate-pulse' : ''
                      } ${isViewed ? 'opacity-75' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Urgency Badge */}
                        {businessDays !== null && !isPlaceholder && (
                          <div className={`flex-shrink-0 px-3 py-1.5 rounded-lg font-bold text-xs ${urgencyTextColor} bg-slate-900/60 border border-current`}>
                            {businessDays}bd
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
                            <span className="flex items-center gap-1">
                              <Target className="w-3 h-3" />
                              {isPlaceholder ? (
                                <span className="inline-block h-3 w-16 bg-slate-700 rounded"></span>
                              ) : (
                                `NAICS: ${opp.naicsCode}`
                              )}
                            </span>
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

            {/* GRID VIEW */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {opportunities.map((opp) => {
                  const isPlaceholder = opp.noticeId.startsWith('placeholder');
                  const deadline = opp.responseDeadLine ? new Date(opp.responseDeadLine) : null;
                  const today = new Date();
                  const businessDays = deadline ? getBusinessDaysUntil(deadline) : null;
                  const calendarDays = deadline ? Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null;
                  const isSaved = savedOpportunities.has(opp.noticeId);
                  const isViewed = viewedOpportunities.has(opp.noticeId);
                  const hasAnalysis = opp.aiAnalysis !== undefined;
                  const isAnalyzing = analyzingOpps.has(opp.noticeId);
                  const urgencyGradient = businessDays !== null ? getUrgencyGradient(businessDays) : getDepartmentGradient(opp.department);
                  const urgencyTextColor = businessDays !== null ? getUrgencyTextColor(businessDays) : 'text-cyan-400';
                  const urgencyLabel = businessDays !== null ? getUrgencyLabel(businessDays) : '';
                  const urgencyIcon = businessDays !== null ? getUrgencyIcon(businessDays) : '';

                  return (
                    <div
                      key={opp.noticeId}
                      className={`group p-4 bg-gradient-to-br ${urgencyGradient} rounded-xl border-2 hover:shadow-xl transition-all ${
                        isPlaceholder ? 'animate-pulse' : ''
                      } ${isViewed ? 'opacity-75' : ''}`}
                    >
                      {/* Urgency Badge */}
                      {businessDays !== null && !isPlaceholder && (
                        <div className="flex items-center justify-between mb-3">
                          <div className={`px-3 py-1 rounded-lg font-bold text-sm ${urgencyTextColor} bg-slate-900/60 border border-current`}>
                            {urgencyLabel}
                          </div>
                          <div className={`text-2xl font-bold ${urgencyTextColor}`}>
                            {businessDays}bd
                          </div>
                        </div>
                      )}

                      {/* Title */}
                      <h4 className="text-base font-bold text-white mb-2 line-clamp-2 min-h-[3rem]">
                        {isPlaceholder ? (
                          <>
                            <span className="inline-block h-4 w-full bg-slate-700 rounded mb-2"></span>
                            <span className="inline-block h-4 w-3/4 bg-slate-700 rounded"></span>
                          </>
                        ) : (
                          opp.title
                        )}
                      </h4>

                      {/* Department */}
                      <div className="flex items-center gap-2 text-sm text-slate-300 mb-2">
                        <Building2 className="w-4 h-4 flex-shrink-0" />
                        {isPlaceholder ? (
                          <span className="inline-block h-4 w-40 bg-slate-700 rounded"></span>
                        ) : (
                          <span className="line-clamp-1">{opp.department}</span>
                        )}
                      </div>

                      {/* NAICS and Set-Aside */}
                      <div className="flex items-center gap-2 mb-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          {isPlaceholder ? (
                            <span className="inline-block h-3 w-16 bg-slate-700 rounded"></span>
                          ) : (
                            `NAICS: ${opp.naicsCode}`
                          )}
                        </span>
                      </div>

                      {!isPlaceholder && opp.typeOfSetAsideDescription && opp.typeOfSetAsideDescription !== 'None' && (
                        <div className="mb-3">
                          <span className="inline-block px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-semibold">
                            {opp.typeOfSetAsideDescription}
                          </span>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {!isPlaceholder ? (
                          <>
                            <a
                              href={opp.uiLink || `https://sam.gov/opp/${opp.noticeId}/view`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => handleViewOpportunity(opp.noticeId)}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all text-sm"
                            >
                              View
                              <ExternalLink className="w-3 h-3" />
                            </a>
                            <button
                              onClick={() => handleSaveOpportunity(opp.noticeId)}
                              className="p-2 rounded-lg bg-slate-900/60 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                            >
                              <Bookmark className="w-4 h-4" fill={isSaved ? 'currentColor' : 'none'} />
                            </button>
                          </>
                        ) : (
                          <div className="flex-1 px-4 py-2 bg-slate-700/50 rounded-lg animate-pulse">
                            <span className="text-transparent">Loading...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* LIST VIEW - Original detailed view */}
            {viewMode === 'list' && (
              <div className="space-y-4">
                {opportunities.map((opp) => {
                  const isPlaceholder = opp.noticeId.startsWith('placeholder');
                  const deadline = opp.responseDeadLine ? new Date(opp.responseDeadLine) : null;
                  const today = new Date();
                  const businessDays = deadline ? getBusinessDaysUntil(deadline) : null;
                  const calendarDays = deadline ? Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null;
                  const isUrgent = businessDays !== null && businessDays <= 7;
                  const isSaved = savedOpportunities.has(opp.noticeId);
                  const isViewed = viewedOpportunities.has(opp.noticeId);
                  const hasAnalysis = opp.aiAnalysis !== undefined;
                  const isAnalyzing = analyzingOpps.has(opp.noticeId);
                  const matchesUserProfile = userProfile.naicsCodes?.some(code => opp.naicsCode?.includes(code)) ||
                    userProfile.certifications?.some(cert => opp.typeOfSetAsideDescription?.includes(cert));
                  const urgencyGradient = businessDays !== null ? getUrgencyGradient(businessDays) : getDepartmentGradient(opp.department);
                  const urgencyTextColor = businessDays !== null ? getUrgencyTextColor(businessDays) : 'text-cyan-400';

                  return (
                    <div
                      key={opp.noticeId}
                      className={`group p-6 bg-gradient-to-br ${urgencyGradient} rounded-xl border-2 hover:shadow-xl transition-all ${
                        isPlaceholder ? 'animate-pulse' : ''
                      } ${isViewed ? 'opacity-75' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-6">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-3">
                            {!isPlaceholder && matchesUserProfile && (
                              <div className="px-3 py-1 bg-emerald-500/20 rounded-lg flex items-center gap-2 border border-emerald-500/40">
                                <Star className="w-4 h-4 text-emerald-400" />
                                <span className="text-xs font-bold text-emerald-400">Matched to {userName}!</span>
                              </div>
                            )}
                            {!isPlaceholder && isSaved && (
                              <div className="px-3 py-1 bg-rose-500/20 rounded-lg flex items-center gap-2 border border-rose-500/40">
                                <Bookmark className="w-4 h-4 text-rose-400" fill="currentColor" />
                                <span className="text-xs font-bold text-rose-400">Saved</span>
                              </div>
                            )}
                            {!isPlaceholder && hasAnalysis && (
                              <div className="px-3 py-1 bg-purple-500/20 rounded-lg flex items-center gap-2 border border-purple-500/40">
                                <Sparkles className="w-4 h-4 text-purple-400" />
                                <span className="text-xs font-bold text-purple-400">AI Analyzed</span>
                              </div>
                            )}
                          </div>

                          <h3 className="text-xl font-bold text-white mb-3 leading-tight">
                            {isPlaceholder ? (
                              <>
                                <span className="inline-block h-6 w-full max-w-2xl bg-slate-700 rounded mb-2"></span>
                                <span className="inline-block h-6 w-3/4 max-w-xl bg-slate-700 rounded"></span>
                              </>
                            ) : (
                              opp.title
                            )}
                          </h3>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-slate-300">
                            <span className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 flex-shrink-0" />
                              {isPlaceholder ? (
                                <span className="inline-block h-4 w-48 bg-slate-700 rounded"></span>
                              ) : (
                                opp.department
                              )}
                            </span>
                            {!isPlaceholder && opp.typeOfSetAsideDescription && opp.typeOfSetAsideDescription !== 'None' && (
                              <span className="flex items-center gap-2">
                                <Award className="w-4 h-4 flex-shrink-0" />
                                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs font-semibold">
                                  {opp.typeOfSetAsideDescription}
                                </span>
                              </span>
                            )}
                            <span className="flex items-center gap-2">
                              <Target className="w-4 h-4 flex-shrink-0" />
                              {isPlaceholder ? (
                                <span className="inline-block h-4 w-24 bg-slate-700 rounded"></span>
                              ) : (
                                `NAICS: ${opp.naicsCode || 'N/A'}`
                              )}
                            </span>
                            <span className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 flex-shrink-0" />
                              {isPlaceholder ? (
                                <span className="inline-block h-4 w-32 bg-slate-700 rounded"></span>
                              ) : (
                                `Posted: ${formatDate(opp.postedDate)}`
                              )}
                            </span>
                          </div>
                        </div>

                        {opp.responseDeadLine && !isPlaceholder && (
                          <div className="text-right flex-shrink-0">
                            <div className={`text-2xl font-bold ${urgencyTextColor} mb-1`}>
                              {businessDays} days
                            </div>
                            <div className="text-sm text-slate-400">
                              {formatDate(opp.responseDeadLine)}
                            </div>
                            {matchesUserProfile && businessDays !== null && businessDays <= 14 && (
                              <div className="mt-1 text-xs text-emerald-400 font-semibold">
                                Good match for {userName}!
                              </div>
                            )}
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
                              {matchesUserProfile ? (
                                <>
                                  <Target className="w-4 h-4" />
                                  Pursue This Opportunity
                                </>
                              ) : (
                                <>
                                  View on SAM.gov
                                  <ExternalLink className="w-4 h-4" />
                                </>
                              )}
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
        ))}

        {/* Load More Button - Manual Control (No Auto-Scroll) */}
        {hasMore && dataLoaded && (
          <div className="mt-12 mb-24 text-center">
            <div className="mb-6">
              <p className="text-slate-300 text-base mb-2 font-semibold">
                Showing {displayCount} of {displayedOpportunities.length} opportunities
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
                  <span>Loading More Curated Opportunities...</span>
                </>
              ) : (
                <>
                  <span>Load More Curated Opportunities{userName && ` for ${userName}`}</span>
                  <ChevronDown className="w-6 h-6 group-hover:translate-y-1 transition-transform" />
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-semibold">
                    +{displayedOpportunities.length - displayCount} more
                  </span>
                </>
              )}
            </button>
            <p className="text-slate-400 text-sm mt-4 flex items-center justify-center gap-2">
              <span>👆 Click button above to load 30 more</span>
              <span className="text-slate-600">•</span>
              <span>Scrolling won't auto-load</span>
            </p>
          </div>
        )}

        {/* End of Results */}
        {!hasMore && displayedOpportunities.length > 0 && dataLoaded && (
          <div className="mt-8 mb-8 text-center">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-slate-800/60 border border-white/10 rounded-xl text-sm text-slate-400">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>{userName ? `${userName} has` : 'You have'} viewed all {displayedOpportunities.length.toLocaleString()} opportunities</span>
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
  );
}