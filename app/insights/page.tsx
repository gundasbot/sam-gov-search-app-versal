//app/insights/page.tsx
'use client';

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  BarChart3,
  Target,
  Calendar,
  Sparkles,
  Briefcase,
  Loader2,
  RefreshCw,
  Building,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Zap,
  LineChart,
  PieChart,
  Shield,
  Database,
  Users,
  CheckCircle,
  Bell,
  Activity,
  Star,
  Flag,
  ChevronRight,
} from 'lucide-react';

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */
interface Opportunity {
  noticeId: string;
  title: string;
  solicitationNumber?: string;
  agency?: string;
  department?: string;
  postedDate?: string;
  responseDeadline?: string;
  responseDeadLine?: string;
  naicsCode?: string;
  setAside?: string;
  typeOfSetAsideDescription?: string;
  state?: string;
  url?: string;
}

interface AIInsight {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: 'opportunity' | 'trend' | 'recommendation' | 'alert';
}

interface MarketTrend {
  trend: string;
  direction: 'up' | 'down' | 'stable';
  percentage: number;
  description: string;
  timeframe: string;
}

type ExecutionTone = 'critical' | 'active' | 'info' | 'neutral';

interface Stats {
  totalActive: number;
  newToday: number;
  expiringSoon: number;
  activeAgencies: number;
  topAgencies: { [key: string]: number };
  topSetAsides: { [key: string]: number };
  preferenceMatches?: number;
  marketActive?: number;
}

interface CachedData {
  opportunities: Opportunity[];
  stats: Stats;
  aiInsights: AIInsight[];
  marketTrends: MarketTrend[];
  feedMode?: 'sample' | 'personalized';
  refreshPolicy?: RefreshPolicy | null;
  timestamp: number;
}

interface RefreshPolicy {
  cadence?: string;
  lastSyncedAt?: string | null;
  nextScheduledSyncAt?: string | null;
  manual?: {
    allowedPerWeek?: number;
    usedThisWeek?: number;
    remainingThisWeek?: number;
    available?: boolean;
    weekResetAt?: string | null;
  };
}

/* ─────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────── */
const CACHE_DURATION = 30 * 60 * 1000; // 30 min — preserve API quota
const CACHE_KEY = 'insightsCacheV5';

const PLACEHOLDER_STATS: Stats = {
  totalActive: 0,
  newToday: 0,
  expiringSoon: 0,
  activeAgencies: 0,
  topAgencies: {},
  topSetAsides: {},
};

const PLACEHOLDER_INSIGHTS: AIInsight[] = [
  {
    title: 'Triage deadlines within 72 hours — now',
    description:
      'Opportunities expiring soonest demand immediate go/no-go decisions. Assign an owner before the window closes.',
    priority: 'high',
    category: 'alert',
  },
  {
    title: 'Target agencies buying in your NAICS codes',
    description:
      'Concentrate outreach on the agencies with the highest repeat-buy volume in your category. Relationship investment here returns fastest.',
    priority: 'high',
    category: 'opportunity',
  },
  {
    title: 'Set-aside alignment is your competitive edge',
    description:
      'Opportunities with matching set-aside designations give you a structural win-rate advantage. Narrow your filters to these first.',
    priority: 'medium',
    category: 'recommendation',
  },
  {
    title: 'Replace broad searches with focused alerts',
    description:
      'Wide searches dilute signal. Set tight filters on NAICS, agency, and contract size — then save as named alerts with dedicated owners.',
    priority: 'medium',
    category: 'recommendation',
  },
];

const PLACEHOLDER_TRENDS: MarketTrend[] = [
  {
    trend: 'AI & Machine Learning Services',
    direction: 'up',
    percentage: 34,
    description: 'Growing demand for AI solutions across federal agencies.',
    timeframe: 'Last 30 days',
  },
  {
    trend: 'Cybersecurity Initiatives',
    direction: 'up',
    percentage: 22,
    description: 'Increased focus on zero-trust and security modernization.',
    timeframe: 'Last 30 days',
  },
  {
    trend: 'Cloud Migration Projects',
    direction: 'stable',
    percentage: 8,
    description: 'Sustained investment in cloud modernization programs.',
    timeframe: 'Last 30 days',
  },
];

const WELCOME_MESSAGES = [
  "Here's what matters most in today's federal market.",
  'Your GovCon intelligence dashboard is ready.',
  "Let's prioritize your next bids and alerts.",
  'Fresh signals, clear next steps.',
];

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
const fmt = (n: number) => {
  try {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(n);
  } catch {
    return String(n);
  }
};

const fmtFull = (n: number) =>
  new Intl.NumberFormat('en-US').format(n);

function getDeadline(opp: Opportunity): string | undefined {
  return opp.responseDeadline || opp.responseDeadLine;
}

function getAgency(opp: Opportunity): string {
  return opp.agency || opp.department || 'Unknown agency';
}

function getSetAside(opp: Opportunity): string | undefined {
  return opp.setAside || opp.typeOfSetAsideDescription;
}

/* ─────────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────────── */
function SimpleBarList({
  items,
  maxItems = 6,
}: {
  items: { name: string; count: number }[];
  maxItems?: number;
}) {
  const slice = items.slice(0, maxItems);
  const max = Math.max(1, ...slice.map((i) => i.count));
  return (
    <div className="space-y-3">
      {slice.map((it, idx) => (
        <div key={`${it.name}-${idx}`} className="space-y-1.5">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-gray-800 truncate">{it.name}</div>
            <div className="text-sm font-bold text-gray-700 tabular-nums shrink-0">{fmt(it.count)}</div>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all duration-500"
              style={{ width: `${Math.max(4, Math.round((it.count / max) * 100))}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function Donut({ series }: { series: { name: string; count: number }[] }) {
  const colors = ['#6366f1', '#f97316', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6'];
  const total = series.reduce((s, x) => s + Number(x.count || 0), 0) || 1;
  const radius = 44;
  const stroke = 10;
  const c = 2 * Math.PI * radius;
  let acc = 0;
  const segments = series.map((s, idx) => {
    const val = Number(s.count || 0);
    const frac = val / total;
    const dash = frac * c;
    const gap = c - dash;
    const offset = c * (1 - acc - frac);
    acc += frac;
    return (
      <circle
        key={`${s.name}-${idx}`}
        r={radius} cx={60} cy={60}
        fill="transparent"
        stroke={colors[idx % colors.length]}
        strokeWidth={stroke}
        strokeDasharray={`${dash} ${gap}`}
        strokeDashoffset={offset}
        strokeLinecap="butt"
      />
    );
  });

  return (
    <div className="flex items-center gap-5">
      <div className="relative shrink-0">
        <svg viewBox="0 0 120 120" className="h-28 w-28 -rotate-90">
          <circle r={radius} cx={60} cy={60} fill="transparent" stroke="#f3f4f6" strokeWidth={stroke} />
          {segments}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-xs text-gray-500">Total</div>
            <div className="text-lg font-extrabold text-gray-900">{fmt(total)}</div>
          </div>
        </div>
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        {series.slice(0, 5).map((s, idx) => (
          <div key={`${s.name}-${idx}`} className="flex items-center gap-2">
            <div
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{ background: colors[idx % colors.length] }}
            />
            <div className="text-sm font-semibold text-gray-800 truncate flex-1">{s.name}</div>
            <div className="text-sm font-bold text-gray-700 tabular-nums shrink-0">
              {Math.round((s.count / total) * 100)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
export default function InsightsPage() {
  const router = useRouter();
  const { status: sessionStatus } = useSession();
  const isAuthenticated = sessionStatus === 'authenticated';
  const isGuest = sessionStatus === 'unauthenticated';

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [stats, setStats] = useState<Stats>(PLACEHOLDER_STATS);
  const [aiInsights, setAiInsights] = useState<AIInsight[]>(PLACEHOLDER_INSIGHTS);
  const [marketTrends, setMarketTrends] = useState<MarketTrend[]>(PLACEHOLDER_TRENDS);
  const [error, setError] = useState<string | null>(null);
  const [rateLimited, setRateLimited] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('Just now');
  const [dataLoaded, setDataLoaded] = useState(false);
  const [userPreferences, setUserPreferences] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [feedMode, setFeedMode] = useState<'sample' | 'personalized'>('sample');
  const [refreshPolicy, setRefreshPolicy] = useState<RefreshPolicy | null>(null);
  const [refreshNotice, setRefreshNotice] = useState<string | null>(null);
  const [kpiNotice, setKpiNotice] = useState<string | null>(null);
  const unauthorized = !!error && /\b401\b/.test(error);
  const loadSignatureRef = useRef<string>('');

  useEffect(() => {
    setWelcomeMessage(WELCOME_MESSAGES[Math.floor(Math.random() * WELCOME_MESSAGES.length)]);
  }, []);

  // Load preferences for authenticated users
  useEffect(() => {
    if (sessionStatus === 'loading') return;
    if (!isAuthenticated) {
      setUserPreferences(null);
      return;
    }

    fetch('/api/account/preferences', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setUserPreferences(d); })
      .catch(() => {});
  }, [isAuthenticated, sessionStatus]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onPreferencesUpdated = () => {
      fetch('/api/account/preferences', { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => { if (d) setUserPreferences(d); })
        .catch(() => {});
    };

    window.addEventListener('preferences-updated', onPreferencesUpdated as EventListener);
    return () => {
      window.removeEventListener('preferences-updated', onPreferencesUpdated as EventListener);
    };
  }, []);

  const preferenceSignature = useMemo(() => {
    const list = (value: unknown) =>
      Array.isArray(value)
        ? value.map((item) => String(item || '').trim()).filter(Boolean).sort()
        : [];
    return JSON.stringify({
      naicsCodes: list(userPreferences?.naicsCodes),
      setAsides: list(userPreferences?.setAsides),
      states: list(userPreferences?.states),
    });
  }, [userPreferences]);

  /* ── Primary data loader — DB-backed, no polling ── */
  const loadData = async (
    forceRefresh = false,
    refreshMode: 'none' | 'manual' = 'none',
    options?: { bypassCache?: boolean }
  ) => {
    if (forceRefresh) {
      setRefreshing(true);
    } else {
      setSyncing(true);
    }
    setError(null);
    setRateLimited(false);
    if (forceRefresh) setRefreshNotice(null);

    // 1. Check localStorage cache first (30-min window)
    const useCache = !forceRefresh && !options?.bypassCache && !isAuthenticated;
    const cacheKey = `${CACHE_KEY}:${isAuthenticated ? 'auth' : 'guest'}`;
    if (useCache && typeof window !== 'undefined') {
      const cached = window.localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const data = JSON.parse(cached) as CachedData;
          if (Date.now() - data.timestamp < CACHE_DURATION) {
            setOpportunities(data.opportunities);
            setStats(data.stats);
            setAiInsights(data.aiInsights);
            setMarketTrends(data.marketTrends);
            if (data.feedMode === 'sample' || data.feedMode === 'personalized') setFeedMode(data.feedMode);
            if (data.refreshPolicy) setRefreshPolicy(data.refreshPolicy);
            setDataLoaded(true);
            setLastUpdated(
              new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            );
            setLoading(false);
            setSyncing(false);
            return;
          }
        } catch { /* ignore corrupt cache */ }
      }
    }

    try {
      // 2. Hit DB-backed endpoint — NOT raw SAM.gov (avoids 429)
      const query = new URLSearchParams({ t: String(Date.now()) });
      if (forceRefresh && refreshMode === 'manual') query.set('refresh', 'manual');
      const res = await fetch(`/api/insights/opportunities?${query.toString()}`);

      if (res.status === 429) {
        setRateLimited(true);
        setError('Rate limit reached — showing cached data. Will auto-recover shortly.');
        setLoading(false);
        setRefreshing(false);
        setSyncing(false);
        return;
      }

      if (!res.ok) {
        if (isGuest) {
          setFeedMode('sample');
          setError(null);
          setRefreshNotice('Showing sample insights while live routes are unavailable. Sign up or log in for your personalized feed.');
          setDataLoaded(true);
          return;
        }
        throw new Error(`HTTP ${res.status} — ${res.statusText}`);
      }

      const data = await res.json();
      const opps: Opportunity[] = Array.isArray(data.opportunities) ? data.opportunities : [];
      const fetchedStats: Stats = data.stats ?? buildStatsFromOpps(opps);
      const mode = data?.feedMode === 'personalized' ? 'personalized' : 'sample';
      const nextPolicy: RefreshPolicy | null = data?.refreshPolicy ?? null;

      setOpportunities(opps);
      setStats(fetchedStats);
      setFeedMode(mode);
      setRefreshPolicy(nextPolicy);
      setDataLoaded(true);

      if (forceRefresh) {
        const status = String(data?.refreshStatus || 'none');
        const message = typeof data?.refreshMessage === 'string' ? data.refreshMessage : '';
        if (status === 'manual_limit_reached') {
          setRefreshNotice(message || 'Manual refresh limit reached for this week.');
        } else if (status === 'manual_login_required') {
          setRefreshNotice(message || 'Sign in to request manual Insights refreshes.');
        } else if (status === 'manual_sync_failed') {
          setRefreshNotice(message || 'Manual refresh failed. Showing latest synced data.');
        } else if (status === 'manual_sync_completed') {
          setRefreshNotice(message || 'Manual refresh completed with live SAM.gov data.');
        } else if (message) {
          setRefreshNotice(message);
        }
      }

      const ts = new Date();
      setLastUpdated(ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

      // 3. Fire AI calls async — non-blocking
      if (opps.length > 0) {
        setAiLoading(true);
        Promise.all([
          generateAIInsights(fetchedStats, opps, userPreferences),
          generateMarketTrends(opps, fetchedStats),
        ])
          .then(([insights, trends]) => {
            setAiInsights(insights);
            setMarketTrends(trends);
            setAiLoading(false);
            if (typeof window !== 'undefined' && !isAuthenticated) {
              try {
                window.localStorage.setItem(cacheKey, JSON.stringify({
                  opportunities: opps,
                  stats: fetchedStats,
                  aiInsights: insights,
                  marketTrends: trends,
                  feedMode: mode,
                  refreshPolicy: nextPolicy,
                  timestamp: ts.getTime(),
                } as CachedData));
              } catch { /* quota */ }
            }
          })
          .catch(() => setAiLoading(false));
      }
    } catch (err: any) {
      if (isGuest) {
        setFeedMode('sample');
        setError(null);
        setRefreshNotice('Showing sample insights while live routes are unavailable. Sign up or log in for your personalized feed.');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load insights');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setSyncing(false);
    }
  };

  function buildStatsFromOpps(opps: Opportunity[]): Stats {
    const now = Date.now();
    const agencyCounts: Record<string, number> = {};
    const setAsideCounts: Record<string, number> = {};
    opps.forEach((o) => {
      const ag = getAgency(o);
      agencyCounts[ag] = (agencyCounts[ag] || 0) + 1;
      const sa = getSetAside(o);
      if (sa && sa !== 'None') setAsideCounts[sa] = (setAsideCounts[sa] || 0) + 1;
    });
    return {
      totalActive: opps.length,
      newToday: opps.filter((o) => o.postedDate && new Date(o.postedDate).getTime() > now - 86400000).length,
      expiringSoon: opps.filter((o) => {
        const dl = getDeadline(o); if (!dl) return false;
        const t = new Date(dl).getTime();
        return t > now && t < now + 7 * 86400000;
      }).length,
      activeAgencies: Object.keys(agencyCounts).length,
      topAgencies: agencyCounts,
      topSetAsides: setAsideCounts,
    };
  }

  // Reload after auth/pref changes so personalized metrics stay current
  useEffect(() => {
    if (sessionStatus === 'loading') return;
    const signature = `${sessionStatus}:${preferenceSignature}`;
    if (loadSignatureRef.current === signature && dataLoaded) return;
    loadSignatureRef.current = signature;
    loadData(false, 'none', { bypassCache: isAuthenticated });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionStatus, preferenceSignature, isAuthenticated]);

  /* ── AI generators ── */
  const generateAIInsights = async (statistics: Stats, opps: Opportunity[], profile?: any): Promise<AIInsight[]> => {
    try {
      const res = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statistics, opportunities: opps.slice(0, 30), userProfile: profile ?? null }),
      });
      if (!res.ok) return PLACEHOLDER_INSIGHTS;
      const data = await res.json();
      const raw = Array.isArray(data?.insights) ? data.insights : null;
      if (!raw || !raw.length) return PLACEHOLDER_INSIGHTS;
      return raw.map((x: any): AIInsight => ({
        title: String(x?.title ?? ''),
        description: String(x?.description ?? x?.summary ?? ''),
        priority: ['high', 'medium', 'low'].includes(x?.priority) ? x.priority : 'medium',
        category: ['opportunity', 'trend', 'recommendation', 'alert'].includes(x?.category) ? x.category : 'recommendation',
      }));
    } catch { return PLACEHOLDER_INSIGHTS; }
  };

  const generateMarketTrends = async (opps: Opportunity[], statsData?: Stats): Promise<MarketTrend[]> => {
    try {
      const res = await fetch('/api/ai/trends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunities: opps.slice(0, 30), statistics: statsData ?? null }),
      });
      if (!res.ok) return PLACEHOLDER_TRENDS;
      const data = await res.json();
      const raw = data.trends || [];
      if (!raw.length) return PLACEHOLDER_TRENDS;
      return raw.map((t: any): MarketTrend => ({
        trend: t.title || 'Market Signal',
        direction: t.strength === 'strong' ? 'up' : t.strength === 'weak' ? 'down' : 'stable',
        percentage: t.strength === 'strong' ? Math.floor(Math.random() * 20) + 15 : t.strength === 'moderate' ? Math.floor(Math.random() * 15) + 5 : 3,
        description: t.description || '',
        timeframe: 'Last 30 days',
      }));
    } catch { return PLACEHOLDER_TRENDS; }
  };

  const handleRefresh = () => loadData(true, 'manual');

  const handlePillClick = (type: 'active' | 'matched' | 'expiring' | 'agencies') => {
    const marketActive = typeof stats.marketActive === 'number' ? stats.marketActive : stats.totalActive;
    const preferenceMatches = typeof stats.preferenceMatches === 'number'
      ? stats.preferenceMatches
      : (isAuthenticated ? 0 : stats.newToday);
    const countByType: Record<typeof type, number> = {
      active: marketActive,
      matched: preferenceMatches,
      expiring: stats.expiringSoon,
      agencies: stats.activeAgencies,
    };

    if ((countByType[type] || 0) <= 0) {
      setKpiNotice('No matching opportunities in this segment yet. Refresh Insights or adjust filters.');
      return;
    }

    setKpiNotice(null);

    const topAgency = Object.entries(stats.topAgencies || {})
      .sort(([, a], [, b]) => Number(b) - Number(a))[0]?.[0];

    if (type === 'active') {
      routeToOpportunities({
        source: 'insights',
        from: 'active-opportunities-pill',
        detail: `${marketActive} active opportunities available`,
        sort: 'posted_desc',
      });
      return;
    }

    if (type === 'matched') {
      routeToOpportunities({
        source: 'insights',
        from: 'preference-matches-pill',
        detail: isAuthenticated
          ? `${preferenceMatches} opportunities matching your saved preferences`
          : `${preferenceMatches} opportunities in this sample focus set`,
        sort: 'posted_desc',
      });
      return;
    }

    if (type === 'expiring') {
      routeToOpportunities({
        source: 'insights',
        from: 'expiring-7d-pill',
        detail: `${stats.expiringSoon} opportunities expiring within 7 days`,
        filter: 'expiring',
        sort: 'deadline_asc',
      });
      return;
    }

    routeToOpportunities({
      source: 'insights',
      from: 'active-agencies-pill',
      detail: topAgency ? `Top active agency: ${topAgency}` : `${stats.activeAgencies} active agencies in this feed`,
      agency: topAgency || undefined,
      sort: 'agency_asc',
    });
  };

  const routeToOpportunities = (params: Record<string, string | undefined> = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value && value.trim()) query.set(key, value.trim());
    });
    const suffix = query.toString();
    router.push(suffix ? `/opportunities?${suffix}` : '/opportunities');
  };

  /* ── Derived dashboard data ── */
  const dashboard = useMemo(() => {
    const opps = Array.isArray(opportunities) ? opportunities : [];
    const now = new Date();

    const withDeadlines = opps
      .filter((o) => !!getDeadline(o))
      .map((o) => {
        const d = new Date(getDeadline(o) as string);
        const ms = d.getTime() - now.getTime();
        return { ...o, deadlineDate: d, daysToDeadline: ms / (1000 * 60 * 60 * 24) };
      })
      .filter((o) => Number.isFinite(o.daysToDeadline));

    const expiringSorted = [...withDeadlines].sort((a, b) => a.daysToDeadline - b.daysToDeadline);

    const expiring24h = expiringSorted.filter((o) => o.daysToDeadline <= 1 && o.daysToDeadline >= 0).length;
    const expiring72h = expiringSorted.filter((o) => o.daysToDeadline <= 3 && o.daysToDeadline >= 0).length;

    const deadlineBuckets = [
      { label: '<24h', count: expiringSorted.filter((o) => o.daysToDeadline <= 1 && o.daysToDeadline >= 0).length, color: '#ef4444' },
      { label: '1–3d', count: expiringSorted.filter((o) => o.daysToDeadline > 1 && o.daysToDeadline <= 3).length, color: '#f97316' },
      { label: '4–7d', count: expiringSorted.filter((o) => o.daysToDeadline > 3 && o.daysToDeadline <= 7).length, color: '#f59e0b' },
      { label: '>7d', count: expiringSorted.filter((o) => o.daysToDeadline > 7).length, color: '#10b981' },
    ];

    const agenciesSeries = Object.entries(stats?.topAgencies || {})
      .sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, 6)
      .map(([name, count]) => ({ name, count: Number(count || 0) }));

    const setAsideSeries = Object.entries(stats?.topSetAsides || {})
      .sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, 6)
      .map(([name, count]) => ({ name, count: Number(count || 0) }));

    const naicsCounts: Record<string, number> = {};
    for (const o of opps) {
      const code = (o.naicsCode || '').trim();
      if (!code) continue;
      naicsCounts[code] = (naicsCounts[code] || 0) + 1;
    }
    const naicsSeries = Object.entries(naicsCounts).sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, 6).map(([name, count]) => ({ name, count }));
    const naicsBreadth = Object.keys(naicsCounts).length;

    const highPriority = aiInsights.filter((i) => i.priority === 'high').length;
    const mediumPriority = aiInsights.filter((i) => i.priority === 'medium').length;
    const lowPriority = aiInsights.filter((i) => i.priority === 'low').length;
    const preferenceMatches = typeof stats?.preferenceMatches === 'number'
      ? stats.preferenceMatches
      : (isAuthenticated ? 0 : (stats?.newToday ?? 0));

    const nearest = expiringSorted.find((o) => o.daysToDeadline >= 0);
    const timeToActDays = nearest != null ? Math.max(0, Math.ceil(nearest.daysToDeadline)) : null;

    const setAsideFriendlyPct = opps.length
      ? Math.round((opps.filter((o) => { const sa = getSetAside(o); return !!sa && sa !== 'None'; }).length / opps.length) * 100)
      : 0;

    const focusNow = expiringSorted.filter((o) => o.daysToDeadline >= 0).slice(0, 6);

    const executionChecklist: { title: string; detail: string; href: string; badge: string; tone: ExecutionTone; icon: React.ComponentType<{ className?: string }>; }[] = [
      { title: 'Triage expiring ≤72h', detail: `${expiring72h} open deadlines to assign`, href: '/opportunities?filter=expiring', badge: expiring72h > 0 ? 'Critical' : 'Clear', tone: expiring72h > 0 ? 'critical' : 'neutral', icon: Clock },
      { title: 'Review preference matches', detail: `${preferenceMatches} aligned opportunities ready for triage`, href: '/opportunities?source=insights&from=preference-matches-checklist', badge: 'Daily', tone: 'active', icon: Zap },
      { title: 'Expand agency coverage', detail: `${stats?.activeAgencies ?? 0} buyers active this week`, href: '/opportunities?filter=agencies', badge: 'Relationship', tone: 'info', icon: Building },
      { title: 'Tune alerts & searches', detail: 'Lock in filters, set owners, and save views', href: '/alerts/manage-alerts', badge: 'Workflow', tone: 'neutral', icon: Bell },
    ];

    return { expiring24h, expiring72h, deadlineBuckets, agenciesSeries, setAsideSeries, naicsSeries, highPriority, mediumPriority, lowPriority, setAsideFriendlyPct, timeToActDays, focusNow, naicsBreadth, executionChecklist };
  }, [opportunities, aiInsights, stats, isAuthenticated]);

  /* ── Style maps ── */
  const categoryIcon: Record<AIInsight['category'], React.ComponentType<{ className?: string }>> = {
    opportunity: Target, trend: TrendingUp, recommendation: Sparkles, alert: AlertCircle,
  };
  const executionToneBg: Record<ExecutionTone, string> = {
    critical: 'from-red-500 to-orange-500', active: 'from-emerald-500 to-green-500',
    info: 'from-blue-500 to-cyan-500', neutral: 'from-gray-400 to-gray-600',
  };
  const executionTonePill: Record<ExecutionTone, string> = {
    critical: 'bg-red-50 text-red-700 border-red-200', active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200', neutral: 'bg-gray-50 text-gray-600 border-gray-200',
  };

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="pg-theme-cleanup pg-insights-modern pg-insights-aptos min-h-screen bg-linear-to-br from-indigo-50 via-white to-orange-50/40 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="h-14 w-14 rounded-2xl bg-linear-to-br from-orange-500 to-indigo-500 flex items-center justify-center mx-auto shadow-lg animate-pulse">
            <Activity className="h-7 w-7 text-white" />
          </div>
          <div className="text-gray-900 font-extrabold text-lg">Loading Intelligence Dashboard</div>
          <div className="text-gray-500 text-sm">Pulling live federal market data…</div>
          <div className="flex gap-1.5 justify-center mt-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-2 w-2 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── MAIN RENDER ── */
  return (
    <div className="pg-theme-cleanup pg-insights-modern pg-insights-aptos min-h-screen bg-linear-to-br from-indigo-50 via-white to-orange-50/40 text-[16px] sm:text-[17px]">

      {/* ── Header — white, matches original ── */}
      <div className="pg-insights-hero border-b border-gray-200 bg-white/95 backdrop-blur-xl shadow-sm overflow-hidden">
        <div className="max-w-480 mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-4 sm:py-5">
          <div className="flex flex-col lg:flex-row lg:items-center items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-xl bg-linear-to-br from-orange-500 to-indigo-500 flex items-center justify-center shadow-md shrink-0">
                  <LineChart className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0">
                  <h2 className="insights-hero-title text-2xl sm:text-3xl font-extrabold text-gray-900">
                    Federal Market Intelligence
                  </h2>
                  <p className="insights-hero-subtitle text-base text-gray-600">
                    {welcomeMessage || 'AI-powered insights · Live federal market data'}
                  </p>
                </div>
              </div>

              {/* Personalization badges */}
              {(userPreferences?.setAsides?.length > 0 || userPreferences?.naicsCodes?.length > 0) && (
                <div className="flex flex-wrap gap-1.5 mt-1 mb-2">
                  {(userPreferences.setAsides as string[]).map((sa: string) => (
                    <button
                      key={sa}
                      type="button"
                      onClick={() => routeToOpportunities({ setAside: sa, source: 'insights' })}
                      className="inline-flex min-h-[40px] items-center rounded-lg bg-orange-600 px-3 py-1.5 text-sm font-extrabold text-white hover:bg-orange-700 transition"
                    >
                      {sa}
                    </button>
                  ))}
                  {(userPreferences.naicsCodes as string[] || []).slice(0, 3).map((code: string) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => routeToOpportunities({ naics: code, source: 'insights' })}
                      className="inline-flex min-h-[40px] items-center rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-extrabold text-white hover:bg-indigo-700 transition"
                    >
                      NAICS {code}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-base text-gray-700">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span>Updated</span>
                  <span className="font-semibold text-gray-900">{lastUpdated}</span>
                </div>
                {refreshPolicy && (
                  <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-base text-slate-700 border border-slate-200">
                    <Database className="h-4 w-4 text-slate-500" />
                    <span>Syncs 1st & 15th</span>
                    {isAuthenticated ? (
                      <span className="font-semibold text-slate-900">
                        {refreshPolicy?.manual?.remainingThisWeek ?? 0}/2 manual left
                      </span>
                    ) : (
                      <span className="font-semibold text-slate-900">Sign in for manual refresh</span>
                    )}
                  </div>
                )}
                {syncing && (
                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-base text-emerald-700">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="font-semibold">Syncing</span>
                  </div>
                )}
                {aiLoading && (
                  <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-base text-indigo-700">
                    <Sparkles className="h-4 w-4" />
                    <span className="font-semibold">Generating AI insights…</span>
                  </div>
                )}
                {dashboard?.timeToActDays !== null && (
                  <button
                    type="button"
                    onClick={() => router.push('/opportunities?filter=expiring')}
                    className="inline-flex items-center gap-2 rounded-full bg-orange-600 px-3 py-1.5 text-base text-white border border-orange-700 hover:bg-orange-700 transition"
                  >
                    <Bell className="h-4 w-4" />
                    <span>Time to act</span>
                    <span className="font-bold">{dashboard.timeToActDays}d</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-orange-700 transition disabled:opacity-70"
              >
                {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                <span>{refreshing ? 'Refreshing…' : isAuthenticated ? 'Manual Refresh' : 'Refresh'}</span>
              </button>
              <button
                onClick={() =>
                  routeToOpportunities({
                    source: 'insights',
                    from: 'update-opportunities-btn',
                    detail: 'Manual opportunity refresh requested from Insights',
                    update: '1',
                  })
                }
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 transition"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Update Opportunities</span>
              </button>
              <button
                onClick={() => router.push('/opportunities')}
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white border border-emerald-700 shadow-sm hover:bg-emerald-700 transition"
              >
                <ArrowUpRight className="h-4 w-4" />
                <span>Open Opportunities</span>
              </button>
            </div>
          </div>
        </div>
        <div className="max-w-480 mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 pb-1">
          <div className="h-0.75 w-full rounded-full bg-linear-to-r from-orange-500 via-amber-400 to-emerald-500" />
        </div>
      </div>

      {/* ── Main body ── */}
      <div className="max-w-480 mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6" style={{ color: 'var(--color-text-primary)' }}>

        {feedMode === 'sample' && !error && !isAuthenticated && (
          <div className="mb-6 rounded-2xl border border-indigo-200 bg-indigo-50 px-5 py-4 sm:px-6 sm:py-5 text-indigo-900">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 mt-1 shrink-0" />
              <div className="min-w-0 flex-1 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-black text-xl sm:text-2xl leading-tight">Viewing intelligence sample data from SAM.gov</div>
                  <div className="mt-1.5 break-words text-base sm:text-lg leading-relaxed">
                    This feed uses sample SAM.gov opportunities analyzed by our intelligence suite to show targeted insights.
                    Sign up or log in to unlock your personalized feed.
                  </div>
                </div>
                <div className="flex flex-row flex-wrap xl:flex-nowrap gap-3 shrink-0">
                  <button
                    onClick={() => router.push('/signup')}
                    className="inline-flex min-h-[50px] items-center justify-center rounded-xl bg-orange-600 px-6 py-3 text-base sm:text-lg font-extrabold text-white hover:bg-orange-700 transition whitespace-nowrap"
                  >
                    Sign up free
                  </button>
                  <button
                    onClick={() => router.push('/login')}
                    className="inline-flex min-h-[50px] items-center justify-center rounded-xl border-2 border-indigo-300 bg-white px-6 py-3 text-base sm:text-lg font-extrabold text-indigo-900 hover:bg-indigo-100 transition whitespace-nowrap"
                  >
                    Log in
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {isAuthenticated && feedMode === 'sample' && !error && (
          <div className="mb-6 rounded-2xl border border-indigo-200 bg-indigo-50 px-5 py-4 sm:px-6 sm:py-5 text-indigo-900">
            <div className="flex items-start gap-4">
              <AlertCircle className="h-6 w-6 mt-1 shrink-0" />
              <div className="min-w-0">
                <div className="font-black text-xl sm:text-2xl leading-tight">Personalized feed is syncing</div>
                <div className="mt-1.5 break-words text-base sm:text-lg leading-relaxed">
                  We are temporarily showing analyzed SAM.gov sample data while your personalized Insights refreshes.
                  Click <strong>Manual Refresh</strong> to pull the latest matched opportunities.
                </div>
              </div>
            </div>
          </div>
        )}

        {!!refreshNotice && (
          <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm flex items-start gap-3 text-slate-800">
            <Bell className="h-5 w-5 mt-0.5 shrink-0 text-slate-500" />
            <div className="min-w-0 break-words">{refreshNotice}</div>
          </div>
        )}

        {/* Error / 429 banner */}
        {!!error && !isGuest && (
          <div className={`mb-5 rounded-2xl border px-4 py-3 text-sm flex items-start gap-3 ${rateLimited ? 'border-amber-200 bg-amber-50 text-amber-800' : unauthorized ? 'border-indigo-200 bg-indigo-50 text-indigo-900' : 'border-red-200 bg-red-50 text-red-800'}`}>
            <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
            <div className="min-w-0">
              <div className="font-bold">
                {rateLimited ? 'API rate limit reached (HTTP 429) — cached view' : unauthorized ? 'Viewing intelligence sample data from SAM.gov' : 'Insights could not fully refresh'}
              </div>
              {unauthorized ? (
                <>
                  <div className="mt-1 break-words text-base sm:text-lg leading-relaxed">
                    {isAuthenticated
                      ? 'Your personalized Insights feed is syncing. Showing analyzed SAM.gov sample data in the meantime.'
                      : 'You are viewing sample SAM.gov data analyzed by our intelligence suite to provide a targeted feed. Sign up or log in to unlock your personalized feed.'}
                  </div>
                  {!isAuthenticated && (
                    <div className="mt-3 flex flex-row flex-wrap xl:flex-nowrap gap-3">
                      <button
                        onClick={() => router.push('/signup')}
                        className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-orange-600 px-6 py-2.5 text-base font-extrabold text-white hover:bg-orange-700 transition whitespace-nowrap"
                      >
                        Sign up free
                      </button>
                      <button
                        onClick={() => router.push('/login')}
                        className="inline-flex min-h-[48px] items-center justify-center rounded-xl border-2 border-indigo-300 bg-white px-6 py-2.5 text-base font-extrabold text-indigo-900 hover:bg-indigo-100 transition whitespace-nowrap"
                      >
                        Log in
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="mt-0.5 break-words">{error}</div>
              )}
            </div>
          </div>
        )}

        {!!kpiNotice && (
          <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {kpiNotice}
          </div>
        )}

        {/* ── KPI row ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          {(() => {
            const activeMarket = typeof stats.marketActive === 'number' ? stats.marketActive : stats.totalActive;
            const preferenceMatches = typeof stats.preferenceMatches === 'number'
              ? stats.preferenceMatches
              : (isAuthenticated ? 0 : stats.newToday);
            return [
              { key: 'active' as const, label: 'Active Opportunities', value: fmtFull(activeMarket), sub: 'Open the full opportunity explorer with advanced filters.', icon: Briefcase, topColor: 'from-indigo-500 to-violet-500', iconBg: 'bg-indigo-100', iconColor: 'text-indigo-700' },
              { key: 'matched' as const, label: isAuthenticated ? 'Preference Matches' : 'Sample Focus Set', value: fmtFull(preferenceMatches), sub: isAuthenticated ? 'Opportunities currently aligned to your saved preferences.' : 'Focused SAM.gov opportunities selected for this sample feed.', icon: Zap, topColor: 'from-emerald-500 to-green-400', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-700' },
              { key: 'expiring' as const, label: 'Expiring ≤7d', value: fmtFull(stats.expiringSoon), sub: 'Act on these first — deadline risk is highest.', icon: Clock, topColor: 'from-orange-500 to-red-500', iconBg: 'bg-orange-100', iconColor: 'text-orange-700', urgent: stats.expiringSoon > 0 },
              { key: 'agencies' as const, label: 'Active Agencies', value: fmtFull(stats.activeAgencies), sub: 'Build your capture list from the highest-volume buyers.', icon: Building, topColor: 'from-blue-500 to-cyan-500', iconBg: 'bg-blue-100', iconColor: 'text-blue-700' },
            ];
          })().map((kpi) => {
            const Icon = kpi.icon;
            return (
              <button
                key={kpi.key}
                onClick={() => handlePillClick(kpi.key)}
                className="text-left rounded-3xl border shadow-sm hover:shadow-md transition overflow-hidden"
                style={{ background: 'var(--color-surface-card)', color: 'var(--color-text-primary)', border: '1.5px solid var(--color-border-card)' }}
              >
                <div className={`h-1.5 bg-linear-to-r ${kpi.topColor}`} />
                <div className="p-4 sm:p-5">
                  <div className="flex items-center justify-between">
                      <div>
                      <div className="text-sm font-bold text-gray-500 uppercase tracking-wide">{kpi.label}</div>
                      <div className="mt-1 text-3xl sm:text-4xl font-extrabold text-gray-900 tabular-nums">{kpi.value}</div>
                      {kpi.urgent && (
                        <div className="mt-0.5 text-sm font-bold text-orange-600 uppercase tracking-wide animate-pulse">⚠ Urgent</div>
                      )}
                    </div>
                    <div className={`h-12 w-12 rounded-2xl ${kpi.iconBg} flex items-center justify-center shrink-0`}>
                      <Icon className={`h-6 w-6 ${kpi.iconColor}`} />
                    </div>
                  </div>
                  <div className="mt-3 text-base font-medium text-gray-600">{kpi.sub}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* ── AI Intelligence Briefing ── */}
        <div className="rounded-3xl border border-gray-200 bg-white shadow-sm mb-6 overflow-hidden">
          {/* Header row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                <Sparkles className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <div className="text-lg font-extrabold text-gray-900">AI-Powered Intelligence Briefing</div>
                <div className="text-base text-gray-500">
                  {aiLoading ? 'Generating personalized insights…' : 'Personalized for your NAICS, set-asides & market activity'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => routeToOpportunities({ sort: 'match', source: 'insights' })}
                className="rounded-full bg-gray-100 border border-gray-200 px-3 py-1.5 text-base font-bold text-gray-700 hover:bg-gray-200 transition min-h-[38px]"
              >
                {aiInsights.length} Insights
              </button>
              {aiLoading && <Loader2 className="h-4 w-4 text-indigo-400 animate-spin" />}
            </div>
          </div>

          {/* Priority columns */}
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">

            {/* HIGH */}
            <div className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-3 w-3 rounded-full bg-red-500 shrink-0" />
                <span className="text-sm font-black text-red-600 uppercase tracking-widest">High Priority</span>
                <span className="ml-auto text-xl font-extrabold text-red-600 tabular-nums">{dashboard.highPriority}</span>
              </div>
              <div className="space-y-3">
                {aiInsights.filter((i) => i.priority === 'high').map((insight, idx) => {
                  const Icon = categoryIcon[insight.category];
                  return (
                    <div key={idx} className="rounded-2xl border border-red-100 bg-red-50 p-4">
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-xl bg-linear-to-br from-red-500 to-orange-500 flex items-center justify-center shrink-0 mt-0.5">
                          <Icon className="h-4 w-4 text-white" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-extrabold text-gray-900 leading-snug">{insight.title}</div>
                          <div className="mt-1.5 text-sm text-gray-600 leading-relaxed">{insight.description}</div>
                          <div className="mt-3">
                            <button onClick={() => router.push('/opportunities?filter=expiring')}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-3 py-2.5 text-sm font-bold text-white hover:bg-red-700 transition min-h-[40px]">
                              Review now <ArrowUpRight className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {dashboard.highPriority === 0 && (
                  <div className="rounded-2xl bg-gray-50 border border-gray-200 px-4 py-5 text-sm text-gray-400 italic text-center">No high priority items at this time.</div>
                )}
              </div>
            </div>

            {/* MEDIUM */}
            <div className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-3 w-3 rounded-full bg-amber-500 shrink-0" />
                <span className="text-sm font-black text-amber-600 uppercase tracking-widest">Medium Priority</span>
                <span className="ml-auto text-xl font-extrabold text-amber-600 tabular-nums">{dashboard.mediumPriority}</span>
              </div>
              <div className="space-y-3">
                {aiInsights.filter((i) => i.priority === 'medium').map((insight, idx) => {
                  const Icon = categoryIcon[insight.category];
                  return (
                    <div key={idx} className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-xl bg-linear-to-br from-amber-400 to-yellow-500 flex items-center justify-center shrink-0 mt-0.5">
                          <Icon className="h-4 w-4 text-white" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-extrabold text-gray-900 leading-snug">{insight.title}</div>
                          <div className="mt-1.5 text-sm text-gray-600 leading-relaxed">{insight.description}</div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {insight.category === 'recommendation' && (
                              <button onClick={() => router.push('/opportunities?openAlert=1')}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 border border-amber-300 px-3 py-2.5 text-sm font-bold text-amber-800 hover:bg-amber-100 transition min-h-[40px]">
                                <Bell className="h-3.5 w-3.5" /> Create alert
                              </button>
                            )}
                            <button onClick={() => router.push('/opportunities')}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-gray-200 px-3 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 transition">
                              Explore <ArrowUpRight className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {dashboard.mediumPriority === 0 && (
                  <div className="rounded-2xl bg-gray-50 border border-gray-200 px-4 py-5 text-sm text-gray-400 italic text-center">No medium priority items at this time.</div>
                )}
              </div>
            </div>

            {/* LOW */}
            <div className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-3 w-3 rounded-full bg-blue-500 shrink-0" />
                <span className="text-sm font-black text-blue-600 uppercase tracking-widest">Low Priority</span>
                <span className="ml-auto text-xl font-extrabold text-blue-600 tabular-nums">{dashboard.lowPriority}</span>
              </div>
              <div className="space-y-3">
                {aiInsights.filter((i) => i.priority === 'low').map((insight, idx) => {
                  const Icon = categoryIcon[insight.category];
                  return (
                    <div key={idx} className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                      <div className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-xl bg-linear-to-br from-blue-500 to-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
                          <Icon className="h-4 w-4 text-white" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-extrabold text-gray-900 leading-snug">{insight.title}</div>
                          <div className="mt-1.5 text-sm text-gray-600 leading-relaxed">{insight.description}</div>
                          <div className="mt-3">
                            <button onClick={() => router.push('/opportunities')}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-gray-200 px-3 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50 transition">
                              Explore <ArrowUpRight className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {dashboard.lowPriority === 0 && (
                  <div className="rounded-2xl bg-gray-50 border border-gray-200 px-4 py-5 text-sm text-gray-400 italic text-center">No low priority items at this time.</div>
                )}
              </div>
            </div>
          </div>

          {/* Operating rhythm footer */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-5 py-3 bg-indigo-50 border-t border-indigo-100">
            <div className="flex items-center gap-2 text-sm text-indigo-800 min-w-0">
              <CheckCircle className="h-4 w-4 text-indigo-500 shrink-0" />
              <span className="font-semibold shrink-0">Suggested operating rhythm:</span>
              <span className="truncate">Review <strong>expiring &lt;72h</strong> first → score <strong>preference matches</strong> → build <strong>alerts</strong></span>
            </div>
            <button onClick={() => router.push('/opportunities?filter=expiring')}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700 transition shrink-0">
              Start triage <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* ── Two-column analytics grid ── */}
        <div className="grid grid-cols-1 2xl:grid-cols-12 gap-7">

          {/* Left 8-col */}
          <div className="2xl:col-span-8 space-y-7">

            {/* Charts row */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-7">

              {/* Top agencies */}
              <div className="rounded-3xl bg-white border border-gray-200 shadow-sm p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div>
                    <div className="text-lg font-extrabold text-gray-900 flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                        <BarChart3 className="h-4 w-4 text-blue-600" />
                      </div>
                      <span>Top Agencies</span>
                    </div>
                    <div className="text-base text-gray-600 mt-1 leading-relaxed">Where the volume is coming from; use this to focus outreach.</div>
                  </div>
                  <span className="text-sm font-bold text-gray-400 uppercase tracking-wide shrink-0">Live</span>
                </div>
                {dashboard.agenciesSeries.length > 0
                  ? <SimpleBarList items={dashboard.agenciesSeries} />
                  : <div className="text-sm text-gray-400 italic text-center py-8">Loading agency data…</div>
                }
              </div>

              {/* Set-aside mix */}
              <div className="rounded-3xl bg-white border border-gray-200 shadow-sm p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div>
                    <div className="text-lg font-extrabold text-gray-900 flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                        <PieChart className="h-4 w-4 text-emerald-600" />
                      </div>
                      <span>Set-Aside Mix</span>
                    </div>
                    <div className="text-base text-gray-600 mt-1 leading-relaxed">How often postings have set-aside designations.</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => routeToOpportunities({ filter: 'setaside', source: 'insights' })}
                    className={`text-sm font-bold uppercase tracking-wide shrink-0 rounded-full px-3 py-1.5 border hover:brightness-95 transition min-h-[38px] ${dashboard.setAsideFriendlyPct >= 60 ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}
                  >
                    {dashboard.setAsideFriendlyPct}% set-aside
                  </button>
                </div>
                {dashboard.setAsideSeries.length > 0
                  ? <Donut series={dashboard.setAsideSeries} />
                  : <div className="text-sm text-gray-400 italic text-center py-8">Loading set-aside data…</div>
                }
              </div>
            </div>

            {/* Deadline urgency */}
            <div className="rounded-3xl bg-white border border-gray-200 shadow-sm p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <div className="text-lg font-extrabold text-gray-900 flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
                      <Calendar className="h-4 w-4 text-orange-600" />
                    </div>
                    <span>Deadline Urgency</span>
                  </div>
                  <div className="text-base text-gray-600 mt-1 leading-relaxed">How many opportunities are expiring soon.</div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {dashboard.expiring24h > 0 && (
                    <button
                      type="button"
                      onClick={() => router.push('/opportunities?filter=expiring')}
                      className="rounded-full bg-red-100 border border-red-200 px-3 py-1.5 text-sm font-bold text-red-700 animate-pulse hover:bg-red-200 transition min-h-[38px]"
                    >
                      ⚠ {dashboard.expiring24h} &lt;24h
                    </button>
                  )}
                  <span className="text-sm font-bold text-gray-500 uppercase tracking-wide">
                    <span className="text-orange-600">{dashboard.expiring24h}</span> &lt;24H ·{' '}
                    <span className="text-orange-600">{dashboard.expiring72h}</span> &lt;72H
                  </span>
                </div>
              </div>

              {/* Bucket cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                {dashboard.deadlineBuckets.map((b) => (
                  <div key={b.label} className="rounded-2xl border p-4 text-center"
                    style={{ borderColor: `${b.color}35`, background: `${b.color}08` }}>
                    <div className="text-2xl font-extrabold tabular-nums" style={{ color: b.color }}>{b.count}</div>
                    <div className="text-xs font-bold text-gray-500 mt-1">{b.label}</div>
                    <div className="mt-2 h-1.5 w-full rounded-full overflow-hidden" style={{ background: `${b.color}20` }}>
                      <div className="h-full rounded-full transition-all duration-500" style={{ background: b.color, width: b.count > 0 ? '100%' : '8%' }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-2 rounded-2xl bg-amber-50 border border-amber-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-amber-600 shrink-0" />
                    <div className="text-sm text-amber-800">
                      <span className="font-extrabold">Quick rule:</span> If it's a good fit and &lt;72h to deadline, assign an owner and decide today.
                    </div>
                  </div>
                  <button onClick={() => router.push('/opportunities?filter=expiring')}
                    className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-3 py-2.5 text-sm font-bold text-white hover:bg-amber-700 transition min-h-[40px]">
                    Act now
                  </button>
                </div>
              </div>
            </div>

            {/* Focus Now */}
            <div className="rounded-3xl bg-white border border-gray-200 shadow-sm p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <div className="text-lg font-extrabold text-gray-900 flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                      <Shield className="h-4 w-4 text-red-600" />
                    </div>
                    <span>Focus Now</span>
                  </div>
                  <div className="text-base text-gray-600 mt-1 leading-relaxed">The soonest deadlines to review first (highest urgency).</div>
                </div>
                <button onClick={() => router.push('/opportunities?filter=expiring')}
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 transition shrink-0">
                  View expiring list <ArrowUpRight className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {dashboard.focusNow.length > 0 ? (
                  dashboard.focusNow.map((opp: any, idx: number) => {
                    const days = opp.daysToDeadline;
                    const urgency = days <= 1
                      ? { label: '<24h', borderColor: '#fecaca', bg: '#fef2f2', textColor: '#dc2626' }
                      : days <= 3
                      ? { label: '<72h', borderColor: '#fed7aa', bg: '#fff7ed', textColor: '#c2410c' }
                      : { label: '≤7d', borderColor: '#fde68a', bg: '#fefce8', textColor: '#92400e' };
                    return (
                      <div key={opp.noticeId || idx} className="rounded-2xl border p-4 hover:shadow-md transition"
                        style={{ borderColor: urgency.borderColor, background: urgency.bg }}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-extrabold text-gray-900 line-clamp-2">{opp.title || 'Untitled opportunity'}</div>
                            <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-sm text-gray-600">
                              <span className="inline-flex items-center gap-1"><Building className="h-3.5 w-3.5" />{getAgency(opp)}</span>
                              {opp.naicsCode && <span className="inline-flex items-center gap-1"><Database className="h-3.5 w-3.5" />NAICS {opp.naicsCode}</span>}
                              {getSetAside(opp) && <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" />{getSetAside(opp)}</span>}
                            </div>
                          </div>
                          <span className="shrink-0 rounded-full border px-2.5 py-1 text-xs font-black"
                            style={{ color: urgency.textColor, borderColor: urgency.borderColor, background: '#fff' }}>
                            {urgency.label}
                          </span>
                        </div>
                        <div className="mt-3 flex items-center justify-between">
                          <div className="text-sm text-gray-600">
                            Deadline <span className="font-bold text-gray-800">
                              {getDeadline(opp) ? new Date(getDeadline(opp) as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                            </span>
                          </div>
                          <button onClick={() => router.push(`/opportunities?noticeId=${encodeURIComponent(opp.noticeId)}`)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-gray-200 px-3 py-2 text-sm font-bold text-gray-900 hover:bg-gray-50 transition shadow-sm">
                            Open <ArrowUpRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-2 rounded-2xl bg-emerald-50 border border-emerald-200 p-6 text-center">
                    <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                    <div className="text-sm font-extrabold text-gray-900">Pipeline clear of near-term deadlines</div>
                    <div className="text-sm text-gray-600 mt-1">No solicitations expire within 7 days. Refresh to pull the latest postings.</div>
                  </div>
                )}
              </div>
            </div>

            {/* Execution playbook */}
            <div className="rounded-3xl bg-white border border-gray-200 shadow-sm p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <div className="text-lg font-extrabold text-gray-900 flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                      <Target className="h-4 w-4 text-amber-600" />
                    </div>
                    <span>Execution Playbook</span>
                  </div>
                  <div className="text-base text-gray-600 mt-1 leading-relaxed">Translate insights into concrete owner-ready steps.</div>
                </div>
                <span className="text-sm font-bold text-gray-400 uppercase tracking-wide shrink-0">Next up</span>
              </div>

              <div className="space-y-3">
                {dashboard.executionChecklist.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <button key={`${item.title}-${index}`} onClick={() => router.push(item.href)}
                      className="w-full text-left rounded-2xl border border-gray-200 bg-white px-4 py-4 hover:bg-gray-50 transition shadow-sm group">
                      <div className="flex items-center gap-4">
                        <div className={`h-12 w-12 rounded-2xl bg-linear-to-br ${executionToneBg[item.tone]} text-white flex items-center justify-center shrink-0`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-sm font-extrabold text-gray-900 truncate">{item.title}</div>
                              <div className="text-sm text-gray-600 truncate mt-0.5">{item.detail}</div>
                            </div>
                            <span className={`shrink-0 inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm font-bold ${executionTonePill[item.tone]}`}>
                              {item.badge}
                            </span>
                          </div>
                        </div>
                        <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition shrink-0" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>{/* end left col */}

          {/* Right 4-col — fills height with flex column */}
          <div className="2xl:col-span-4 flex flex-col gap-7">

            {/* Analytics Tidbits summary */}
            <div className="rounded-3xl bg-white border border-gray-200 shadow-sm p-5 sm:p-6 min-h-[20rem]">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="text-lg font-extrabold text-gray-900 flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                      <Sparkles className="h-4 w-4 text-indigo-600" />
                    </div>
                    <span>Your Analytics Tidbits</span>
                  </div>
                  <div className="text-base text-gray-600 mt-1 leading-relaxed">A compact briefing based on live signals and PreciseGovcon AI interpretation.</div>
                </div>
              </div>

              <div className="text-base font-bold text-gray-500 uppercase tracking-wide mb-3">Brief</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => router.push('/opportunities?filter=expiring')}
                  className="rounded-2xl bg-red-50 border border-red-200 p-4 text-left hover:bg-red-100 transition"
                >
                  <div className="text-sm text-red-600 font-bold uppercase tracking-wide">High</div>
                  <div className="mt-1 text-2xl font-extrabold text-red-700 tabular-nums">{dashboard.highPriority}</div>
                  <div className="mt-1 text-sm text-red-600">Immediate attention</div>
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/opportunities?source=insights&from=preference-matches-brief')}
                  className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-left hover:bg-amber-100 transition"
                >
                  <div className="text-sm text-amber-600 font-bold uppercase tracking-wide">Medium</div>
                  <div className="mt-1 text-2xl font-extrabold text-amber-700 tabular-nums">{dashboard.mediumPriority}</div>
                  <div className="mt-1 text-sm text-amber-600">Schedule this</div>
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/opportunities?filter=agencies')}
                  className="rounded-2xl bg-blue-50 border border-blue-200 p-4 text-left hover:bg-blue-100 transition"
                >
                  <div className="text-sm text-blue-600 font-bold uppercase tracking-wide">Low</div>
                  <div className="mt-1 text-2xl font-extrabold text-blue-700 tabular-nums">{dashboard.lowPriority}</div>
                  <div className="mt-1 text-sm text-blue-600">Optional</div>
                </button>
              </div>

              <div className="mt-4 rounded-2xl border border-indigo-200 bg-indigo-50 p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-extrabold text-indigo-900">Suggested operating rhythm</div>
                  <div className="text-sm text-indigo-700 mt-1">
                    Review <span className="font-bold text-gray-900">expiring &lt;72h</span>, then scan <span className="font-bold text-gray-900">preference matches</span>, then build alerts.
                  </div>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shrink-0">
                  <CheckCircle className="h-6 w-6" />
                </div>
              </div>
            </div>

            {/* Market trends */}
            <div className="rounded-3xl bg-white border border-gray-200 shadow-sm p-5 sm:p-6 min-h-[19rem]">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <div className="text-lg font-extrabold text-gray-900 flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                      <TrendingUp className="h-4 w-4 text-emerald-600" />
                    </div>
                    <span>Market Trends</span>
                  </div>
                  <div className="text-base text-gray-600 mt-1 leading-relaxed">What's rising or falling in your opportunity stream.</div>
                </div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wide shrink-0">30D</span>
              </div>

              <div className="space-y-4">
                {marketTrends.map((trend, index) => {
                  const trendColor = trend.direction === 'up' ? '#10b981' : trend.direction === 'down' ? '#ef4444' : '#6b7280';
                  return (
                    <div key={trend.trend} className="rounded-2xl border border-gray-200 bg-white p-4 hover:shadow-md transition">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-extrabold text-gray-900 truncate">{trend.trend}</div>
                          <div className="mt-1 text-sm text-gray-600">{trend.description}</div>
                          <div className="mt-1.5 text-xs text-gray-400">{trend.timeframe}</div>
                        </div>
                        <div className="shrink-0 text-right">
                          <div className="inline-flex items-center gap-1 text-sm font-extrabold">
                            {trend.direction === 'up' ? (
                              <><ArrowUpRight className="h-4 w-4 text-emerald-600" /><span className="text-emerald-700">+{trend.percentage}%</span></>
                            ) : trend.direction === 'down' ? (
                              <><ArrowDownRight className="h-4 w-4 text-red-600" /><span className="text-red-700">-{trend.percentage}%</span></>
                            ) : (
                              <><TrendingDown className="h-4 w-4 text-gray-500" /><span className="text-gray-600">{trend.percentage}%</span></>
                            )}
                          </div>
                          <div className="mt-2 h-2 w-20 rounded-full bg-gray-100 overflow-hidden ml-auto">
                            <div className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(100, trend.percentage * 2)}%`, background: trendColor }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action center (non-duplicative quick routing) */}
            <div className="rounded-3xl bg-white border border-gray-200 shadow-sm p-5 sm:p-6 min-h-[19rem]">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <div className="text-lg font-extrabold text-gray-900 flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                      <Flag className="h-4 w-4 text-violet-600" />
                    </div>
                    <span>Action Center</span>
                  </div>
                  <div className="text-base text-gray-600 mt-1 leading-relaxed">Jump straight into your highest-impact workflows.</div>
                </div>
                <div className="text-sm font-bold text-gray-400 uppercase tracking-wide shrink-0">Quick routes</div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => router.push('/opportunities?filter=expiring')}
                  className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-left hover:bg-red-100 transition"
                >
                  <div className="text-base font-extrabold text-red-800">Review expiring deadlines</div>
                  <div className="text-sm text-red-700 mt-1">Prioritize items due in the next 72 hours.</div>
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/opportunities?source=insights&from=preference-matches-action-center')}
                  className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-left hover:bg-emerald-100 transition"
                >
                  <div className="text-base font-extrabold text-emerald-800">Work preference matches</div>
                  <div className="text-sm text-emerald-700 mt-1">Run go / no-go on opportunities aligned to your profile.</div>
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/alerts/manage-alerts')}
                  className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-left hover:bg-blue-100 transition"
                >
                  <div className="text-base font-extrabold text-blue-800">Manage alerts</div>
                  <div className="text-sm text-blue-700 mt-1">Tune subscriptions, recipients, and delivery cadence.</div>
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/alerts/manage-searches')}
                  className="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-left hover:bg-indigo-100 transition"
                >
                  <div className="text-base font-extrabold text-indigo-800">Open saved searches</div>
                  <div className="text-sm text-indigo-700 mt-1">Adjust filters and rerun targeted views.</div>
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => router.push('/opportunities?filter=expiring')}
                  className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-bold text-red-700 hover:bg-red-100 transition"
                >
                  {dashboard.expiring72h} expiring ≤72h
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/opportunities?source=insights&from=preference-matches-chip')}
                  className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-bold text-emerald-700 hover:bg-emerald-100 transition"
                >
                  {(typeof stats.preferenceMatches === 'number' ? stats.preferenceMatches : (isAuthenticated ? 0 : stats.newToday)).toLocaleString()} preference matches
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/opportunities?filter=agencies')}
                  className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-bold text-blue-700 hover:bg-blue-100 transition"
                >
                  {stats.activeAgencies} active agencies
                </button>
              </div>
            </div>

            {/* NAICS breakdown — fills remaining space if present */}
            {dashboard.naicsSeries.length > 0 && (
              <div className="rounded-3xl bg-white border border-gray-200 shadow-sm p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div>
                    <div className="text-lg font-extrabold text-gray-900 flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                        <Database className="h-4 w-4 text-purple-600" />
                      </div>
                      <span>NAICS Distribution</span>
                    </div>
                    <div className="text-base text-gray-600 mt-1 leading-relaxed">{dashboard.naicsBreadth} codes active in your feed.</div>
                  </div>
                </div>
                <SimpleBarList items={dashboard.naicsSeries} />
              </div>
            )}

          </div>{/* end right col */}
        </div>
      </div>
    </div>
  );
}




