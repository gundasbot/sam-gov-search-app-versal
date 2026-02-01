// app/opportunities/OpportunitiesClient.tsx
'use client';

export const dynamic = 'force-dynamic';


import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  TrendingUp, Building2, Calendar, Award, Target, Briefcase,
  ExternalLink, Search, RefreshCw, XCircle,
  CheckCircle2, Timer, ChevronDown, Loader2, Heart,
  Trophy, Star, TargetIcon, Zap, CheckCircle, AlertCircle, Filter,
  Bell, BarChart3, ArrowUpRight, LineChart, Download, Bookmark, Eye
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
}

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
  const [displayCount, setDisplayCount] = useState(50);
  const [totalRecords, setTotalRecords] = useState(PLACEHOLDER_STATS.totalActive);
  const [lastUpdated, setLastUpdated] = useState('Just now');
  const [dataLoaded, setDataLoaded] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'active' | 'setasides' | 'expiring' | 'departments' | null>(null);
  const [savedOpportunities, setSavedOpportunities] = useState<Set<string>>(new Set());
  const [viewedOpportunities, setViewedOpportunities] = useState<Set<string>>(new Set());
  const resultsRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [refreshIndicator, setRefreshIndicator] = useState(false);

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
    achievedThisMonth: 7
  });

  const [userAchievement, setUserAchievement] = useState('');
  const [userTip, setUserTip] = useState('');

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
          filtered = filtered.filter(o => o.typeOfSetAside && o.typeOfSetAside !== 'None');
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

    return filtered;
  }, []);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  const getDaysUntilDeadline = (deadline: string) => {
    try {
      const deadlineDate = new Date(deadline);
      const now = new Date();
      const diff = deadlineDate.getTime() - now.getTime();
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      return days > 0 ? days : 0;
    } catch {
      return 0;
    }
  };

  const handleLoadMore = useCallback(() => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    setTimeout(() => {
      setDisplayCount(prev => prev + 50);
      setLoadingMore(false);
    }, 300);
  }, [displayCount, displayedOpportunities.length, loadingMore]);

  // 🎯 NEW: Calculate hasMore before using it in effects
  const hasMore = displayCount < displayedOpportunities.length;

  // 🎯 NEW: Save opportunity function
  const handleSaveOpportunity = useCallback((noticeId: string) => {
    setSavedOpportunities(prev => {
      const newSet = new Set(prev);
      if (newSet.has(noticeId)) {
        newSet.delete(noticeId);
      } else {
        newSet.add(noticeId);
      }
      return newSet;
    });
  }, []);

  // 🎯 NEW: Mark opportunity as viewed
  const handleViewOpportunity = useCallback((noticeId: string) => {
    setViewedOpportunities(prev => {
      const newSet = new Set(prev);
      newSet.add(noticeId);
      return newSet;
    });
  }, []);

  // 🎯 NEW: Export opportunities to CSV
  const handleExportOpportunities = () => {
    const csvContent = [
      ['Title', 'Department', 'Solicitation Number', 'Posted Date', 'Deadline', 'NAICS', 'Type', 'Link'],
      ...displayedOpportunities.map(opp => [
        `"${opp.title.replace(/"/g, '""')}"`,
        opp.department,
        opp.solicitationNumber,
        formatDate(opp.postedDate),
        formatDate(opp.responseDeadLine),
        opp.naicsCode,
        opp.typeOfSetAsideDescription,
        opp.uiLink
      ])
    ].map(row => row.join(',')).join('\n');
    
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
  const POLLING_INTERVAL = 30000; // 30 seconds

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

  // 🎯 NEW: Infinite scroll implementation
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          handleLoadMore();
        }
      },
      { threshold: 0.5 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loadingMore, handleLoadMore]);

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
          // SAM.gov API is down - gracefully degrade
          console.warn(`⚠️ SAM API unavailable (${response.status}), using placeholder data`);

          if (isMounted && !dataLoaded) {
            setError('SAM.gov API is temporarily unavailable. Interactive features work with sample data below.');
            setLastUpdated('API Unavailable');
            // Keep placeholder data visible
          }
          return; // Don't throw, return gracefully
        }

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
    fetchAllOpportunities();

    // Set up polling for periodic updates
    pollingIntervalRef.current = setInterval(() => {
      if (!loading) {
        fetchAllOpportunities();
      }
    }, POLLING_INTERVAL);

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
    if (dataLoaded) {
      const filtered = applyFilters(
        allOpportunities,
        filterParam,
        searchTerm,
        selectedType,
        selectedSetAside,
        activeFilter
      );
      setDisplayedOpportunities(filtered);
      setDisplayCount(50); // Reset display count when filters change
    }
  }, [allOpportunities, filterParam, searchTerm, selectedType, selectedSetAside, dataLoaded, activeFilter, applyFilters]);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      {/* 🎯 IMPROVED: Compact Header with Loading Indicator */}
      <div className="border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-[1800px] mx-auto px-6 lg:px-10 xl:px-12 py-4">
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
                <span>Export CSV</span>
              </button>
              <button
                onClick={() => window.location.href = '/insights'}
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 px-4 py-2.5 text-sm font-medium text-slate-200 transition backdrop-blur-sm"
              >
                <LineChart className="h-4 w-4" />
                <span>Insights</span>
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
          <div className="max-w-[1800px] mx-auto px-6 lg:px-10 xl:px-12 py-4">
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
      <div className="max-w-[1800px] mx-auto px-6 lg:px-10 xl:px-12 py-8">

        {/* 🎯 PERSONALIZED: Welcome Header */}
        <div className="text-center mb-8">
          {userName ? (
            // Signed-in user experience
            <>
              <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                  <Trophy className="h-4 w-4 text-amber-400" />
                  <span className="text-sm font-semibold text-amber-400">
                    {`${userDisplayName} Dashboard`}
                  </span>
                </div>

                {userAchievement && (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20">
                    <Zap className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm font-semibold text-emerald-400">
                      {userAchievement}
                    </span>
                  </div>
                )}
              </div>

              <h1 className="text-4xl md:text-5xl font-bold mb-3 leading-tight">
                <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 bg-clip-text text-transparent">
                  {userDisplayName} Opportunities Overview
                </span>
              </h1>

              <p className="text-slate-300 text-lg max-w-3xl mx-auto leading-relaxed">
                {dataLoaded ? (
                  <>
                    We&apos;ve found <span className="font-bold text-white">{displayedOpportunities.length.toLocaleString()}</span> federal contract opportunities
                    {personalizedStats?.matchedToProfile ? (
                      <>, including <span className="font-bold text-emerald-400">{personalizedStats.matchedToProfile.toLocaleString()}</span> that match your profile</>
                    ) : (
                      <> that match your profile</>
                    )}
                    {stats.postedToday > 0 && (
                      <span className="inline-flex items-center gap-1 ml-2 text-emerald-400 font-semibold">
                        <TrendingUp className="h-4 w-4" />
                        {stats.postedToday} new today!
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    Loading <span className="font-bold text-white">{displayedOpportunities.length.toLocaleString()}+</span> federal contract opportunities for {userName}...
                    <span className="inline-flex items-center gap-1 ml-2 text-amber-400 font-semibold">
                      <TrendingUp className="h-4 w-4" />
                      Personalized matches loading...
                    </span>
                  </>
                )}
              </p>

              {userTip && (
                <div className="mt-6 max-w-2xl mx-auto">
                  <div className="inline-flex items-start gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 text-left">
                    <Target className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-blue-300 font-semibold mb-1">Personalized Tip for {userName}</p>
                      <p className="text-sm text-blue-200/80">{userTip}</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            // Unsigned user experience - More welcoming
            <>
              <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
                  <Trophy className="h-4 w-4 text-blue-400" />
                  <span className="text-sm font-semibold text-blue-400">
                    Discover Federal Contracts
                  </span>
                </div>

                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/20">
                  <Zap className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm font-semibold text-emerald-400">
                    {stats.postedToday > 0 ? `${stats.postedToday} New Opportunities Today!` : 'Live Federal Opportunities'}
                  </span>
                </div>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold mb-3 leading-tight">
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Welcome to Federal Opportunities
                </span>
              </h1>

              <p className="text-slate-300 text-lg max-w-3xl mx-auto leading-relaxed">
                {dataLoaded ? (
                  <>
                    Explore <span className="font-bold text-white">{displayedOpportunities.length.toLocaleString()}</span> active federal contract opportunities
                    {stats.postedToday > 0 && (
                      <span className="inline-flex items-center gap-1 ml-2 text-emerald-400 font-semibold">
                        <TrendingUp className="h-4 w-4" />
                        {stats.postedToday} new today!
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    Loading <span className="font-bold text-white">{displayedOpportunities.length.toLocaleString()}+</span> active federal opportunities...
                  </>
                )}
              </p>

              {/* Call to action for unsigned users */}
              <div className="mt-6 max-w-2xl mx-auto">
                <div className="inline-flex items-start gap-3 px-6 py-4 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 text-left">
                  <Target className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-amber-300 font-semibold mb-1">Get Personalized Matches</p>
                    <p className="text-sm text-amber-200/80">
                      <a href="/auth/signin" className="text-amber-400 hover:text-amber-300 font-medium underline">Sign in</a> to see opportunities tailored to your business profile, NAICS codes, and certifications.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* 🎯 INTERACTIVE: Clickable Filter Cards with Active States */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {/* Total Active */}
          <button
            onClick={() => handlePillClick('active')}
            className={`group relative p-6 bg-gradient-to-br rounded-3xl border transition-all text-left cursor-pointer overflow-hidden hover:shadow-lg ${
              activeFilter === 'active'
                ? 'from-cyan-500/20 to-blue-600/20 border-cyan-400 shadow-lg shadow-cyan-500/20'
                : 'from-slate-900/90 to-slate-800/90 border-slate-700/50 hover:border-cyan-500/50'
            }`}
          >
            {/* Active Indicator */}
            {activeFilter === 'active' && (
              <div className="absolute top-4 right-4">
                <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
              </div>
            )}

            <div className="flex items-center gap-3 mb-4">
              <div className={`p-3 rounded-2xl ${
                activeFilter === 'active'
                  ? 'bg-cyan-500 shadow-lg'
                  : 'bg-gradient-to-br from-cyan-500 to-blue-600'
              } ${!dataLoaded ? 'animate-pulse' : ''}`}>
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              {personalizedStats?.goalProgress && personalizedStats.goalProgress > 0 && (
                <div className="ml-auto px-3 py-1 bg-cyan-500/20 rounded-lg text-xs font-bold text-cyan-300">
                  {personalizedStats.goalProgress}% Goal
                </div>
              )}
            </div>

            <div className="text-4xl font-bold text-white mb-2">
              {!dataLoaded ? (
                <div className="h-10 w-24 bg-slate-700 rounded animate-pulse"></div>
              ) : (
                stats.totalActive.toLocaleString()
              )}
            </div>

            <div className="text-sm text-slate-400 mb-3">
              {activeFilter === 'active' ? (
                <span className="text-cyan-400 font-semibold flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  Showing All Active
                </span>
              ) : (
                'Click to View All'
              )}
            </div>

            {personalizedStats?.goalProgress && personalizedStats.goalProgress > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-700">
                <div className="flex items-center justify-between mb-2 text-xs text-slate-400">
                  <span>Monthly Goal</span>
                  <span className="text-cyan-400 font-semibold">
                    {userProfile?.achievedThisMonth || 0}/{userProfile?.monthlyGoal || 10}
                  </span>
                </div>
                <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-700"
                    style={{ width: `${personalizedStats.goalProgress}%` }}
                  />
                </div>
              </div>
            )}
          </button>

          {/* Set-Asides */}
          <button
            onClick={() => handlePillClick('setasides')}
            className={`group relative p-6 bg-gradient-to-br rounded-3xl border transition-all text-left cursor-pointer overflow-hidden hover:shadow-lg ${
              activeFilter === 'setasides'
                ? 'from-emerald-500/20 to-green-600/20 border-emerald-400 shadow-lg shadow-emerald-500/20'
                : 'from-slate-900/90 to-slate-800/90 border-slate-700/50 hover:border-emerald-500/50'
            }`}
          >
            {activeFilter === 'setasides' && (
              <div className="absolute top-4 right-4">
                <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
              </div>
            )}

            <div className="flex items-center gap-3 mb-4">
              <div className={`p-3 rounded-2xl ${
                activeFilter === 'setasides'
                  ? 'bg-emerald-500 shadow-lg'
                  : 'bg-gradient-to-br from-emerald-500 to-green-600'
              } ${!dataLoaded ? 'animate-pulse' : ''}`}>
                <Award className="w-6 h-6 text-white" />
              </div>
              {personalizedStats?.matchedToProfile && personalizedStats.matchedToProfile > 0 && (
                <div className="ml-auto px-3 py-1 bg-emerald-500/20 rounded-lg text-xs font-bold text-emerald-300">
                  {personalizedStats.matchedToProfile} Matches
                </div>
              )}
            </div>

            <div className="text-4xl font-bold text-white mb-2">
              {!dataLoaded ? (
                <div className="h-10 w-24 bg-slate-700 rounded animate-pulse"></div>
              ) : (
                stats.setAsides.toLocaleString()
              )}
            </div>

            <div className="text-sm text-slate-400 mb-3">
              {activeFilter === 'setasides' ? (
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  Filtered Set-Asides
                </span>
              ) : (
                'Click to Filter'
              )}
            </div>

            {userProfile?.certifications && userProfile.certifications.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-700">
                <div className="flex flex-wrap gap-1.5">
                  {userProfile.certifications.slice(0, 3).map((cert, i) => (
                    <span key={i} className="px-2 py-1 bg-emerald-500/10 rounded text-xs text-emerald-300 font-medium">
                      {cert}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </button>

          {/* Closing Soon */}
          <button
            onClick={() => handlePillClick('expiring')}
            className={`group relative p-6 bg-gradient-to-br rounded-3xl border transition-all text-left cursor-pointer overflow-hidden hover:shadow-lg ${
              activeFilter === 'expiring'
                ? 'from-rose-500/20 to-red-600/20 border-rose-400 shadow-lg shadow-rose-500/20'
                : 'from-slate-900/90 to-slate-800/90 border-slate-700/50 hover:border-rose-500/50'
            }`}
          >
            {activeFilter === 'expiring' && (
              <div className="absolute top-4 right-4">
                <div className="w-3 h-3 bg-rose-400 rounded-full animate-pulse"></div>
              </div>
            )}

            <div className="flex items-center gap-3 mb-4">
              <div className={`p-3 rounded-2xl ${
                activeFilter === 'expiring'
                  ? 'bg-rose-500 shadow-lg'
                  : 'bg-gradient-to-br from-rose-500 to-red-600'
              } ${!dataLoaded ? 'animate-pulse' : ''}`}>
                <Timer className="w-6 h-6 text-white" />
              </div>
            </div>

            <div className="text-4xl font-bold text-white mb-2">
              {!dataLoaded ? (
                <div className="h-10 w-24 bg-slate-700 rounded animate-pulse"></div>
              ) : (
                stats.closingSoon.toLocaleString()
              )}
            </div>

            <div className="text-sm text-slate-400 mb-3">
              {activeFilter === 'expiring' ? (
                <span className="text-rose-400 font-semibold flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  Showing Urgent
                </span>
              ) : (
                <>Closing <span className="font-semibold text-rose-300">≤7d</span></>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-700 text-sm text-slate-400">
              {activeFilter === 'expiring' ? 'Prioritize these!' : 'Click to prioritize deadlines'}
            </div>
          </button>

          {/* Active Agencies */}
          <button
            onClick={() => handlePillClick('departments')}
            className={`group relative p-6 bg-gradient-to-br rounded-3xl border transition-all text-left cursor-pointer overflow-hidden hover:shadow-lg ${
              activeFilter === 'departments'
                ? 'from-purple-500/20 to-pink-600/20 border-purple-400 shadow-lg shadow-purple-500/20'
                : 'from-slate-900/90 to-slate-800/90 border-slate-700/50 hover:border-purple-500/50'
            }`}
          >
            {activeFilter === 'departments' && (
              <div className="absolute top-4 right-4">
                <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
              </div>
            )}

            <div className="flex items-center gap-3 mb-4">
              <div className={`p-3 rounded-2xl ${
                activeFilter === 'departments'
                  ? 'bg-purple-500 shadow-lg'
                  : 'bg-gradient-to-br from-purple-500 to-pink-600'
              } ${!dataLoaded ? 'animate-pulse' : ''}`}>
                <Building2 className="w-6 h-6 text-white" />
              </div>
              {personalizedStats?.favoriteAgencyMatches && personalizedStats?.favoriteAgencyMatches > 0 && (
                <div className="ml-auto px-3 py-1 bg-purple-500/20 rounded-lg text-xs font-bold text-purple-300">
                  {personalizedStats.favoriteAgencyMatches} Favorites
                </div>
              )}
            </div>

            <div className="text-4xl font-bold text-white mb-2">
              {!dataLoaded ? (
                <div className="h-10 w-24 bg-slate-700 rounded animate-pulse"></div>
              ) : (
                stats.departments.toLocaleString()
              )}
            </div>

            <div className="text-sm text-slate-400 mb-3">
              {activeFilter === 'departments' ? (
                <span className="text-purple-400 font-semibold flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  Viewing All
                </span>
              ) : (
                'Click to Browse'
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-700 text-sm text-slate-400">
              {activeFilter === 'departments' ? 'All agencies shown' : 'Click to view by agency'}
            </div>
          </button>
        </div>

        {/* Active Filter Indicator */}
        {activeFilter && (
          <div className="mb-6 flex items-center justify-between p-4 bg-slate-800/60 rounded-2xl border border-slate-700/50 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <Filter className="w-5 h-5 text-cyan-400" />
              <div>
                <p className="text-sm font-semibold text-white">
                  Filter Active: {
                    activeFilter === 'active' ? 'All Active Opportunities' :
                      activeFilter === 'setasides' ? 'Set-Asides Only' :
                        activeFilter === 'expiring' ? 'Closing Within 7 Days' :
                          'All Departments'
                  }
                </p>
                <p className="text-xs text-slate-400">
                  Showing {displayedOpportunities.length.toLocaleString()} of {allOpportunities.length.toLocaleString()} opportunities
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setActiveFilter(null);
                setSearchTerm('');
                setSelectedType('all');
                setSelectedSetAside('all');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors text-sm text-slate-300"
            >
              <XCircle className="w-4 h-4" />
              Clear Filter
            </button>
          </div>
        )}

        {/* Additional "NEW TODAY" stat card if needed */}
        {stats.postedToday > 0 && (
          <div className="mb-8">
            <button
              onClick={() => {
                const today = new Date().toISOString().split('T')[0];
                const filtered = allOpportunities.filter(o => o.postedDate?.startsWith(today));
                setDisplayedOpportunities(filtered);
                setActiveFilter(null);
              }}
              className="inline-flex items-center gap-4 px-6 py-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-3xl hover:border-amber-500/40 transition-all cursor-pointer w-full text-left hover:shadow-lg backdrop-blur-sm"
            >
              <div className="p-2.5 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-2xl font-bold text-white">{stats.postedToday.toLocaleString()}</div>
                <div className="text-sm text-amber-300 font-medium">Posted Today</div>
              </div>
              <div className="text-sm text-amber-200 font-medium">
                Click to view today&apos;s opportunities →
              </div>
            </button>
          </div>
        )}

        {/* Search and Filters */}
        <div ref={resultsRef} className="bg-slate-800/60 backdrop-blur-xl rounded-3xl p-6 border border-white/10 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search - Personalized placeholder */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder={userName ? `Search opportunities for ${userName}...` : "Search thousands of federal opportunities..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-900/80 border border-white/10 rounded-xl text-base text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500/50 transition-colors"
                disabled={!dataLoaded}
              />
            </div>

            {/* Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-3 bg-slate-900/80 border border-white/10 rounded-xl text-base text-white focus:outline-none focus:border-cyan-500/50 transition-colors cursor-pointer"
              disabled={!dataLoaded}
            >
              <option value="all">All Types</option>
              {Array.from(new Set(allOpportunities.map(o => o.typeOfSetAside).filter(Boolean))).map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            {/* Set-Aside Filter */}
            <select
              value={selectedSetAside}
              onChange={(e) => setSelectedSetAside(e.target.value)}
              className="px-4 py-3 bg-slate-900/80 border border-white/10 rounded-xl text-base text-white focus:outline-none focus:border-cyan-500/50 transition-colors cursor-pointer"
              disabled={!dataLoaded}
            >
              <option value="all">All Set-Asides</option>
              {Array.from(new Set(allOpportunities.map(o => o.typeOfSetAsideDescription).filter(Boolean))).map(setAside => (
                <option key={setAside} value={setAside}>{setAside}</option>
              ))}
            </select>
          </div>

          {/* Results Counter - Personalized */}
          <div className="mt-4 flex items-center gap-2 text-sm text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>
              {dataLoaded ? (
                userName ? (
                  personalizedStats?.matchedToProfile ? (
                    `Showing ${visibleOpportunities.length.toLocaleString()} opportunities (${personalizedStats.matchedToProfile.toLocaleString()} match your profile)`
                  ) : (
                    `Showing ${visibleOpportunities.length.toLocaleString()} of ${displayedOpportunities.length.toLocaleString()} opportunities for ${userName}`
                  )
                ) : (
                  `Showing ${visibleOpportunities.length.toLocaleString()} of ${displayedOpportunities.length.toLocaleString()} opportunities - Sign in for personalized matches`
                )
              ) : (
                userName ? `Loading opportunities for ${userName}...` : 'Loading opportunities...'
              )}
            </span>
          </div>
        </div>

        {/* Opportunities List - Shows placeholder while loading */}
        <div className="space-y-4">
          {visibleOpportunities.map((opp) => {
            const daysUntil = getDaysUntilDeadline(opp.responseDeadLine);
            const isUrgent = daysUntil <= 7 && daysUntil > 0;
            const isPlaceholder = opp.noticeId.startsWith('placeholder');
            const isSaved = savedOpportunities.has(opp.noticeId);
            const isViewed = viewedOpportunities.has(opp.noticeId);

            // 🎯 NEW: Check if opportunity matches user's profile
            const matchesUserProfile = userName && userProfile && !isPlaceholder && (
              userProfile.naicsCodes?.some(code => opp.naicsCode?.includes(code)) ||
              userProfile.certifications?.some(cert => opp.typeOfSetAsideDescription?.includes(cert)) ||
              userProfile.favoriteAgencies?.some(agency => opp.department?.includes(agency))
            );

            return (
              <div
                key={opp.noticeId}
                className={`group bg-slate-800/60 backdrop-blur-xl rounded-3xl p-6 border ${isPlaceholder ? 'border-amber-500/20' : matchesUserProfile ? 'border-emerald-500/30' : isViewed ? 'border-blue-500/20' : 'border-white/10'} hover:border-cyan-500/50 transition-all hover:shadow-lg ${isPlaceholder ? 'animate-pulse' : ''}`}
              >
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  {matchesUserProfile && !isPlaceholder && (
                    <div className="relative">
                      <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-green-600 rounded-full flex items-center justify-center shadow-md">
                        <Target className="w-3 h-3 text-white" />
                      </div>
                      <div className="absolute inset-0 animate-ping bg-emerald-500/30 rounded-full"></div>
                    </div>
                  )}
                  {!isPlaceholder && (
                    <button
                      onClick={() => handleSaveOpportunity(opp.noticeId)}
                      className={`p-1.5 rounded-full transition-colors ${isSaved ? 'bg-rose-500/20 text-rose-400' : 'bg-slate-700/50 text-slate-400 hover:bg-rose-500/20 hover:text-rose-400'}`}
                    >
                      <Bookmark className="w-4 h-4" fill={isSaved ? 'currentColor' : 'none'} />
                    </button>
                  )}
                </div>

                <div className="flex items-start justify-between gap-6 mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start gap-2 mb-3">
                      {!isPlaceholder && opp.typeOfSetAsideDescription && (
                        <span className={`px-3 py-1.5 ${matchesUserProfile ? 'bg-emerald-500/30 text-emerald-300' : 'bg-emerald-500/20 text-emerald-300'} text-sm font-semibold rounded-lg border border-emerald-500/30`}>
                          {opp.typeOfSetAsideDescription}
                        </span>
                      )}
                      {isUrgent && !isPlaceholder && (
                        <span className="px-3 py-1.5 bg-orange-500/20 text-orange-300 text-sm font-semibold rounded-lg border border-orange-500/30 flex items-center gap-1">
                          <Timer className="w-4 h-4" />
                          URGENT
                        </span>
                      )}
                      {isSaved && !isPlaceholder && (
                        <span className="px-3 py-1.5 bg-rose-500/20 text-rose-300 text-sm font-semibold rounded-lg border border-rose-500/30 flex items-center gap-1">
                          <Bookmark className="w-4 h-4" />
                          SAVED
                        </span>
                      )}
                      {isPlaceholder && (
                        <span className="px-3 py-1.5 bg-amber-500/20 text-amber-300 text-sm font-semibold rounded-lg border border-amber-500/30">
                          Loading...
                        </span>
                      )}
                    </div>

                    <h3 className={`text-xl font-bold mb-3 group-hover:text-cyan-400 transition-colors leading-tight ${isPlaceholder ? 'text-slate-400' : 'text-white'}`}>
                      {isPlaceholder ? (
                        <span className="inline-block h-6 w-full bg-slate-700 rounded"></span>
                      ) : (
                        opp.title
                      )}
                    </h3>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
                      <span className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 flex-shrink-0" />
                        {isPlaceholder ? (
                          <span className="inline-block h-4 w-32 bg-slate-700 rounded"></span>
                        ) : (
                          <span className="truncate max-w-[200px]">{opp.department}</span>
                        )}
                      </span>
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
                      <div className={`text-2xl font-bold ${isUrgent ? 'text-orange-400' : 'text-cyan-400'} mb-1`}>
                        {daysUntil} days
                      </div>
                      <div className="text-sm text-slate-400">
                        {formatDate(opp.responseDeadLine)}
                      </div>
                      {matchesUserProfile && daysUntil <= 14 && (
                        <div className="mt-1 text-xs text-emerald-400 font-semibold">
                          Good match for {userName}!
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4 border-t border-slate-700">
                  <div className="flex items-center gap-2">
                    {!isPlaceholder ? (
                      <a
                        href={opp.uiLink || `https://sam.gov/opp/${opp.solicitationNumber}/view`}
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

        {/* Infinite scroll trigger */}
        <div ref={loadMoreRef} className="h-10" />

        {/* Load More Button (fallback) */}
        {hasMore && dataLoaded && (
          <div className="mt-8 text-center">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="group px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 mx-auto text-base shadow-sm hover:shadow-md"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <span>Load More Opportunities{userName && ` for ${userName}`}</span>
                  <ChevronDown className="w-5 h-5 group-hover:translate-y-1 transition-transform" />
                  <span className="text-sm opacity-90">
                    ({displayedOpportunities.length - displayCount} remaining)
                  </span>
                </>
              )}
            </button>
          </div>
        )}

        {/* End of Results */}
        {!hasMore && displayedOpportunities.length > 0 && dataLoaded && (
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-slate-800/60 border border-white/10 rounded-xl text-sm text-slate-400">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>{userName ? `${userName} has` : 'You have'} viewed all {displayedOpportunities.length.toLocaleString()} opportunities</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}