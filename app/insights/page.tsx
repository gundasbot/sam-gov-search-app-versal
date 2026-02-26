'use client';

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  BarChart3,
  Target,
  Calendar,
  Sparkles,
  Award,
  FileText,
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
  Cloud,
  Database,
  Globe,
  Users,
  CheckCircle,
  Bell,
  Heart,
} from 'lucide-react';

interface Opportunity {
  noticeId: string;
  title: string;
  solicitationNumber: string;
  department: string;
  postedDate: string;
  responseDeadLine?: string;
  naicsCode?: string;
  typeOfSetAsideDescription?: string;
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

interface Stats {
  totalActive: number;
  newToday: number;
  expiringSoon: number;
  activeAgencies: number;
  topAgencies: { [key: string]: number };
  topSetAsides: { [key: string]: number };
}

interface CachedData {
  opportunities: Opportunity[];
  allOpportunities?: Opportunity[];
  stats: Stats;
  aiInsights: AIInsight[];
  marketTrends: MarketTrend[];
  timestamp: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Placeholder data
const PLACEHOLDER_OPPORTUNITIES: Opportunity[] = Array.from(
  { length: 5 },
  (_, i) => ({
    noticeId: `placeholder-${i}`,
    title: 'Analyzing market opportunities.',
    solicitationNumber: `INS-XX-${i.toString().padStart(4, '0')}`,
    department: 'Federal Agency',
    postedDate: new Date().toISOString(),
    responseDeadLine: new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    ).toISOString(),
    naicsCode: 'XXXXXX',
    typeOfSetAsideDescription: 'Set-Aside Program',
  })
);

const PLACEHOLDER_STATS: Stats = {
  totalActive: 956,
  newToday: 12,
  expiringSoon: 28,
  activeAgencies: 42,
  topAgencies: {
    'Department of Defense': 8234,
    'Department of Homeland Security': 5621,
    'Department of Veterans Affairs': 4892,
    'General Services Administration': 3456,
    'Department of Energy': 2987,
  },
  topSetAsides: {
    'Small Business': 12453,
    'Woman-Owned Small Business': 6789,
    '8a Small Business': 4321,
    HUBZone: 3456,
    SDVOSB: 2876,
  },
};

const PLACEHOLDER_TRENDS: MarketTrend[] = [
  {
    trend: 'AI & Machine Learning Services',
    direction: 'up',
    percentage: 34,
    description:
      'Growing demand for AI solutions across federal agencies.',
    timeframe: 'Last 30 days',
  },
  {
    trend: 'Cybersecurity Initiatives',
    direction: 'up',
    percentage: 22,
    description:
      'Increased focus on zero-trust and security modernization.',
    timeframe: 'Last 30 days',
  },
  {
    trend: 'Cloud Migration Projects',
    direction: 'stable',
    percentage: 8,
    description:
      'Sustained investment in cloud modernization programs.',
    timeframe: 'Last 30 days',
  },
];

const PLACEHOLDER_INSIGHTS: AIInsight[] = [
  {
    title: 'Loading insights',
    description:
      'Claude is analyzing your market signals and opportunities.',
    priority: 'medium',
    category: 'recommendation',
  },
  {
    title: 'Identifying quick wins',
    description:
      'Prioritizing opportunities by urgency, set-aside, and agency behavior.',
    priority: 'low',
    category: 'trend',
  },
  {
    title: 'Scanning deadline risk',
    description:
      'Detecting expiring solicitations that need immediate action.',
    priority: 'high',
    category: 'alert',
  },
  {
    title: 'Building your focus list',
    description:
      'Surfacing the most actionable opportunities from the feed.',
    priority: 'medium',
    category: 'opportunity',
  },
];

const WELCOME_MESSAGES = [
  "Here's what matters most in today’s federal market.",
  'Your GovCon intelligence dashboard is ready.',
  'Let’s prioritize your next bids and alerts.',
  'Fresh signals, clear next steps.',
];

// Helper format
const formatCompact = (n: number) => {
  try {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(n);
  } catch {
    return String(n);
  }
};

function MiniSparkline({ values }: { values: number[] }) {
  const max = Math.max(1, ...values);
  const points = values
    .map((v, i) => {
      const x =
        (i / Math.max(1, values.length - 1)) * 100;
      const y = 100 - (v / max) * 100;
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <svg
      viewBox="0 0 100 100"
      className="h-10 w-24"
      preserveAspectRatio="none"
    >
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth={6}
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
        opacity={0.35}
      />
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth={4}
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
      />
    </svg>
  );
}

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
        <div key={`${it.name}-${idx}`} className="space-y-1">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-semibold text-gray-900 truncate">
              {it.name}
            </div>
            <div className="text-sm font-bold text-gray-700">
              {formatCompact(it.count)}
            </div>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-500"
              style={{
                width: `${Math.max(
                  4,
                  Math.round((it.count / max) * 100)
                )}%`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function Donut({
  series,
}: {
  series: { name: string; count: number }[];
}) {
  const total =
    series.reduce(
      (s, x) => s + Number(x.count || 0),
      0
    ) || 1;
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

    const colorClass =
      idx % 4 === 0
        ? 'text-emerald-600'
        : idx % 4 === 1
        ? 'text-orange-500'
        : idx % 4 === 2
        ? 'text-blue-500'
        : 'text-purple-500';

    return (
      <circle
        key={`${s.name}-${idx}`}
        r={radius}
        cx={60}
        cy={60}
        fill="transparent"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeDasharray={`${dash} ${gap}`}
        strokeDashoffset={offset}
        className={colorClass}
        strokeLinecap="butt"
      />
    );
  });

  return (
    <div className="flex items-center gap-5">
      <div className="relative">
        <svg
          viewBox="0 0 120 120"
          className="h-28 w-28 -rotate-90"
        >
          <circle
            r={radius}
            cx={60}
            cy={60}
            fill="transparent"
            stroke="rgb(243,244,246)"
            strokeWidth={stroke}
          />
          {segments}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-sm text-gray-500">
              Total
            </div>
            <div className="text-lg font-extrabold text-gray-900">
              {formatCompact(total)}
            </div>
          </div>
        </div>
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        {series.slice(0, 5).map((s, idx) => (
          <div
            key={`${s.name}-${idx}`}
            className="flex items-center justify-between gap-3"
          >
            <div className="text-sm font-semibold text-gray-900 truncate">
              {s.name}
            </div>
            <div className="text-sm font-bold text-gray-700">
              {Math.round((s.count / total) * 100)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function InsightsPage() {
  const router = useRouter();

  const [opportunities, setOpportunities] =
    useState<Opportunity[]>(PLACEHOLDER_OPPORTUNITIES);
  const [allOpportunities, setAllOpportunities] =
    useState<Opportunity[]>(PLACEHOLDER_OPPORTUNITIES);
  const [stats, setStats] = useState<Stats>(PLACEHOLDER_STATS);
  const [aiInsights, setAiInsights] =
    useState<AIInsight[]>(PLACEHOLDER_INSIGHTS);
  const [marketTrends, setMarketTrends] =
    useState<MarketTrend[]>(PLACEHOLDER_TRENDS);
  const [error, setError] = useState<string | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [lastUpdated, setLastUpdated] =
    useState('Just now');
  const [syncing, setSyncing] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const pollingIntervalRef =
    useRef<NodeJS.Timeout | null>(null);

  const POLLING_INTERVAL = 45_000;

  useEffect(() => {
    const randomMessage =
      WELCOME_MESSAGES[
        Math.floor(Math.random() * WELCOME_MESSAGES.length)
      ];
    setWelcomeMessage(randomMessage);
  }, []);

  const loadData = async (
    isRefresh = false,
    skipCache = false
  ) => {
    if (isRefresh) {
      setRefreshing(true);
    } else if (!skipCache) {
      setSyncing(true);
    }
    setError(null);

    try {
      if (!skipCache && !isRefresh && typeof window !== 'undefined') {
        const cached = window.localStorage.getItem(
          'insightsCache'
        );
        if (cached) {
          try {
            const data =
              JSON.parse(cached) as CachedData;
            const age =
              Date.now() - data.timestamp;
            if (age < CACHE_DURATION) {
              setOpportunities(data.opportunities);
              setAllOpportunities(
                data.allOpportunities || data.opportunities
              );
              setStats(data.stats);
              setAiInsights(data.aiInsights);
              setMarketTrends(data.marketTrends);
              setDataLoaded(true);
              setLastUpdated(
                new Date(
                  data.timestamp
                ).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              );
              if (!isRefresh) {
                setSyncing(false);
                setLoading(false);
              }
              return;
            }
          } catch {
            // ignore cache parse errors
          }
        }
      }

      const response = await fetch(
        `/api/sam/opportunities?limit=100&t=${Date.now()}`
      );
      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status} ${response.statusText}`
        );
      }
      const data = await response.json();

      if (
        !data.opportunities ||
        !Array.isArray(data.opportunities)
      ) {
        throw new Error(
          'Invalid response format from API'
        );
      }

      const fetchedOpportunities =
        data.opportunities.slice(0, 8);
      setOpportunities(fetchedOpportunities);
      setAllOpportunities(data.opportunities);

      const today =
        new Date().toISOString().split('T')[0];
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      const newToday =
        data.opportunities.filter(
          (opp: Opportunity) =>
            opp.postedDate?.startsWith(today)
        ).length;

      const expiringSoon =
        data.opportunities.filter((opp: Opportunity) => {
          if (!opp.responseDeadLine) return false;
          const deadline = new Date(
            opp.responseDeadLine
          );
          return (
            deadline <= nextWeek &&
            deadline >= new Date()
          );
        }).length;

      const agencyCounts: Record<string, number> = {};
      const setAsideCounts: Record<string, number> = {};

      data.opportunities.forEach(
        (opp: Opportunity) => {
          const agency =
            opp.department || 'Unknown agency';
          agencyCounts[agency] =
            (agencyCounts[agency] || 0) + 1;

          if (opp.typeOfSetAsideDescription) {
            const setAside =
              opp.typeOfSetAsideDescription;
            setAsideCounts[setAside] =
              (setAsideCounts[setAside] || 0) + 1;
          }
        }
      );

      const calculatedStats: Stats = {
        totalActive:
          data.total ?? data.opportunities.length,
        newToday,
        expiringSoon,
        activeAgencies: Object.keys(
          agencyCounts
        ).length,
        topAgencies: agencyCounts,
        topSetAsides: setAsideCounts,
      };

      setStats(calculatedStats);
      setDataLoaded(true);
      setLastUpdated(
        new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })
      );

      setTimeout(async () => {
        try {
          const [insightsData, trendsData] =
            await Promise.all([
              generateAIInsights(
                calculatedStats,
                data.opportunities
              ),
              generateMarketTrends(
                data.opportunities
              ),
            ]);

          if (typeof window !== 'undefined') {
            const cacheData: CachedData = {
              opportunities: fetchedOpportunities,
              allOpportunities: data.opportunities,
              stats: calculatedStats,
              aiInsights: insightsData,
              marketTrends: trendsData,
              timestamp: Date.now(),
            };
            window.localStorage.setItem(
              'insightsCache',
              JSON.stringify(cacheData)
            );
          }

          setAiInsights(insightsData);
          setMarketTrends(trendsData);
        } catch {
          // AI errors are non-fatal
        }
      }, 0);
    } catch (err: any) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load insights'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    loadData(false, false);
    if (!pollingIntervalRef.current) {
      pollingIntervalRef.current =
        setInterval(() => {
          if (!loading && !refreshing) {
            loadData(false, false);
          }
        }, POLLING_INTERVAL);
    }
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateAIInsights = async (
    statistics: Stats,
    opps: Opportunity[]
  ): Promise<AIInsight[]> => {
    try {
      const response = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          statistics,
          opportunities: opps,
          userProfile: null,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to generate insights');
      }
      const data = await response.json();
      const raw = Array.isArray(data?.insights)
        ? data.insights
        : null;
      if (!raw) return PLACEHOLDER_INSIGHTS;

      return raw.map((x: any): AIInsight => ({
        title: String(x?.title ?? ''),
        description:
          String(x?.description ?? x?.summary ?? ''),
        priority:
          x?.priority === 'high'
            ? 'high'
            : x?.priority === 'medium'
            ? 'medium'
            : x?.priority === 'low'
            ? 'low'
            : 'medium',
        category:
          x?.category === 'opportunity'
            ? 'opportunity'
            : x?.category === 'trend'
            ? 'trend'
            : x?.category === 'recommendation'
            ? 'recommendation'
            : x?.category === 'alert'
            ? 'alert'
            : 'recommendation',
      }));
    } catch {
      return PLACEHOLDER_INSIGHTS;
    }
  };

  const generateMarketTrends = async (
    opps: Opportunity[]
  ): Promise<MarketTrend[]> => {
    try {
      const response = await fetch('', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ opportunities: opps }),
      });
      if (!response.ok) {
        throw new Error('Failed to generate trends');
      }
      const data = await response.json();
      return data.trends || PLACEHOLDER_TRENDS;
    } catch {
      return PLACEHOLDER_TRENDS;
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData(true, true);
  };

  const handlePillClick = (
    type: 'active' | 'today' | 'expiring' | 'agencies'
  ) => {
    switch (type) {
      case 'active':
        router.push('/opportunities');
        break;
      case 'today':
        router.push('/opportunities?filter=today');
        break;
      case 'expiring':
        router.push('/opportunities?filter=expiring');
        break;
      case 'agencies':
        router.push('/opportunities?filter=agencies');
        break;
    }
  };

  const dashboard = useMemo(() => {
    const opps = Array.isArray(allOpportunities)
      ? allOpportunities
      : [];
    const now = new Date();

    const withDeadlines = opps
      .filter((o) => !!o.responseDeadLine)
      .map((o) => {
        const d = new Date(
          o.responseDeadLine as string
        );
        const ms = d.getTime() - now.getTime();
        const days = ms / (1000 * 60 * 60 * 24);
        return {
          ...o,
          deadlineDate: d,
          daysToDeadline: days,
        };
      })
      .filter((o: any) =>
        Number.isFinite(o.daysToDeadline)
      );

    const expiringSorted = withDeadlines
      .slice()
      .sort(
        (a: any, b: any) =>
          a.daysToDeadline - b.daysToDeadline
      );

    const expiring24h = expiringSorted.filter(
      (o: any) =>
        o.daysToDeadline <= 1 &&
        o.daysToDeadline >= 0
    ).length;
    const expiring72h = expiringSorted.filter(
      (o: any) =>
        o.daysToDeadline <= 3 &&
        o.daysToDeadline >= 0
    ).length;

    const deadlineBuckets = [
      {
        label: '<24h',
        count: expiringSorted.filter(
          (o: any) =>
            o.daysToDeadline <= 1 &&
            o.daysToDeadline >= 0
        ).length,
      },
      {
        label: '1–3d',
        count: expiringSorted.filter(
          (o: any) =>
            o.daysToDeadline > 1 &&
            o.daysToDeadline <= 3
        ).length,
      },
      {
        label: '4–7d',
        count: expiringSorted.filter(
          (o: any) =>
            o.daysToDeadline > 3 &&
            o.daysToDeadline <= 7
        ).length,
      },
      {
        label: '>7d',
        count: expiringSorted.filter(
          (o: any) => o.daysToDeadline > 7
        ).length,
      },
    ];

    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const key = d.toISOString().split('T')[0];
      return {
        key,
        label: d.toLocaleDateString([], {
          weekday: 'short',
        }),
      };
    });

    const postedByDay = days.map((d) => ({
      label: d.label,
      count: opps.filter((o) =>
        o.postedDate?.startsWith(d.key)
      ).length,
    }));

    const agenciesSeries = Object.entries(
      stats?.topAgencies || {}
    )
      .sort(
        (a, b) =>
          (b[1] as number) - (a[1] as number)
      )
      .slice(0, 6)
      .map(([name, count]) => ({
        name,
        count: Number(count || 0),
      }));

    const setAsideSeries = Object.entries(
      stats?.topSetAsides || {}
    )
      .sort(
        (a, b) =>
          (b[1] as number) - (a[1] as number)
      )
      .slice(0, 6)
      .map(([name, count]) => ({
        name,
        count: Number(count || 0),
      }));

    const naicsCounts: Record<string, number> = {};
    for (const o of opps) {
      const code = (o.naicsCode || '').trim();
      if (!code) continue;
      naicsCounts[code] = (naicsCounts[code] || 0) + 1;
    }
    const naicsSeries = Object.entries(naicsCounts)
      .sort(
        (a, b) =>
          (b[1] as number) - (a[1] as number)
      )
      .slice(0, 6)
      .map(([name, count]) => ({ name, count }));

    const highPriority = aiInsights.filter(
      (i) => i.priority === 'high'
    ).length;
    const mediumPriority = aiInsights.filter(
      (i) => i.priority === 'medium'
    ).length;
    const lowPriority = aiInsights.filter(
      (i) => i.priority === 'low'
    ).length;

    const nearest = expiringSorted.find(
      (o: any) => o.daysToDeadline >= 0
    );
    const timeToActDays =
      nearest != null
        ? Math.max(
            0,
            Math.ceil(nearest.daysToDeadline)
          )
        : null;

    const setAsideFriendlyPct = opps.length
      ? Math.round(
          (opps.filter(
            (o) =>
              !!o.typeOfSetAsideDescription &&
              o.typeOfSetAsideDescription !== 'None'
          ).length /
            opps.length) *
            100
        )
      : 0;

    const actions = [
      {
        label: 'Review expiring <72h',
        sub: `${expiring72h} opportunities`,
        kind: 'route' as const,
        href: '/opportunities?filter=expiring',
      },
      {
        label: 'See new today',
        sub: `${stats?.newToday ?? 0} posted today`,
        kind: 'route' as const,
        href: '/opportunities?filter=today',
      },
      {
        label: 'Browse all opportunities',
        sub: 'Advanced filters & export',
        kind: 'route' as const,
        href: '/opportunities',
      },
      {
        label: 'Create alert',
        sub: 'Save this market view',
        kind: 'route' as const,
        href: '/opportunities?openAlert=1',
      },
    ] as const;

    const focusNow = expiringSorted
      .filter((o: any) => o.daysToDeadline >= 0)
      .slice(0, 6);

    return {
      expiring24h,
      expiring72h,
      deadlineBuckets,
      postedByDay,
      agenciesSeries,
      setAsideSeries,
      naicsSeries,
      highPriority,
      mediumPriority,
      lowPriority,
      setAsideFriendlyPct,
      timeToActDays,
      focusNow,
      actions,
      allOpportunities: opps,
      aiInsights,
      stats,
    };
  }, [allOpportunities, aiInsights, stats]);

  const priorityColor: Record<
    AIInsight['priority'],
    string
  > = {
    high: 'from-orange-500 to-red-500',
    medium: 'from-emerald-500 to-green-500',
    low: 'from-blue-500 to-cyan-500',
  };

  const priorityIcon: Record<
    AIInsight['priority'],
    React.ReactNode
  > = {
    high: <AlertCircle className="h-4 w-4" />,
    medium: <Target className="h-4 w-4" />,
    low: <Clock className="h-4 w-4" />,
  };

  const categoryIcon: Record<
    AIInsight['category'],
    React.ComponentType<{ className?: string }>
  > = {
    opportunity: Target,
    trend: TrendingUp,
    recommendation: Sparkles,
    alert: AlertCircle,
  };

  const trendColors = [
    'from-emerald-500 to-green-500',
    'from-orange-500 to-amber-500',
    'from-blue-500 to-cyan-500',
    'from-purple-500 to-pink-500',
  ];

  return (
    <div className="pg-theme-cleanup pg-insights-modern min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 text-[14px] sm:text-[15px]">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white/95 backdrop-blur-xl shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-4 sm:py-5">
          <div className="flex flex-col lg:flex-row lg:items-center items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-emerald-500 flex items-center justify-center shadow-md flex-shrink-0">
                  <LineChart className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">
                    Insights Dashboard
                  </h1>
                  <p className="text-sm text-gray-600 truncate">
                    {welcomeMessage || 'Your intelligence hub'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-sm text-gray-700">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span>Last updated</span>
                  <span className="font-semibold text-gray-900">
                    {lastUpdated}
                  </span>
                </div>

                {syncing && (
                  <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-sm text-emerald-700">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="font-semibold">
                      Syncing
                    </span>
                  </div>
                )}

                {dashboard?.timeToActDays !== null && (
                  <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1.5 text-sm text-orange-700">
                    <Bell className="h-4 w-4" />
                    <span>Time to act</span>
                    <span className="font-bold">
                      {dashboard.timeToActDays}d
                    </span>
                  </div>
                )}

                {!!error && (
                  <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1.5 text-sm text-red-700">
                    <AlertCircle className="h-4 w-4" />
                    <span className="font-semibold">
                      Data issue
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
              <button
                onClick={handleRefresh}
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-gray-800 transition disabled:opacity-70"
                disabled={refreshing}
              >
                {refreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span>Refresh</span>
              </button>
              <button
                onClick={() =>
                  router.push('/opportunities')
                }
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-gray-900 border border-gray-200 shadow-sm hover:bg-gray-50 transition"
              >
                <ArrowUpRight className="h-4 w-4" />
                <span>Open Opportunities</span>
              </button>
            </div>
          </div>

          {/* Action strip */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {dashboard.actions.map((a, index) => (
              <button
                key={`${a.label}-${index}`}
                onClick={() => router.push(a.href)}
                className="group text-left rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm hover:shadow-md transition flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="text-sm font-extrabold text-gray-900 truncate">
                    {a.label}
                  </div>
                  <div className="text-xs text-gray-600 truncate">
                    {a.sub}
                  </div>
                </div>
                <div className="h-9 w-9 rounded-xl bg-gray-100 flex items-center justify-center group-hover:bg-gray-900 transition flex-shrink-0">
                  <ArrowUpRight className="h-4 w-4 text-gray-700 group-hover:text-white transition" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6">
        {!!error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 mt-0.5" />
            <div className="min-w-0">
              <div className="font-bold">
                Insights could not fully refresh
              </div>
              <div className="text-red-700 break-words">
                {error}
              </div>
            </div>
          </div>
        )}

        {/* KPI row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <button
            onClick={() => handlePillClick('active')}
            className="text-left rounded-3xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                  Active opportunities
                </div>
                <div className="mt-1 text-2xl font-extrabold text-gray-900">
                  {formatCompact(stats.totalActive)}
                </div>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-gray-100 flex items-center justify-center">
                <Briefcase className="h-6 w-6 text-gray-900" />
              </div>
            </div>
            <div className="mt-3 text-sm text-gray-600">
              Tap to open the full opportunity explorer with
              filters.
            </div>
          </button>

          <button
            onClick={() => handlePillClick('today')}
            className="text-left rounded-3xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                  New today
                </div>
                <div className="mt-1 text-2xl font-extrabold text-gray-900">
                  {formatCompact(stats.newToday)}
                </div>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
                <Zap className="h-6 w-6 text-emerald-700" />
              </div>
            </div>
            <div className="mt-3 text-sm text-gray-600">
              Quickly review fresh postings and decide pursue /
              watch / pass.
            </div>
          </button>

          <button
            onClick={() => handlePillClick('expiring')}
            className="text-left rounded-3xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                  Expiring &le;7d
                </div>
                <div className="mt-1 text-2xl font-extrabold text-gray-900">
                  {formatCompact(stats.expiringSoon)}
                </div>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-orange-50 flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-700" />
              </div>
            </div>
            <div className="mt-3 text-sm text-gray-600">
              Focus first on deadlines to reduce missed bids.
            </div>
          </button>

          <button
            onClick={() => handlePillClick('agencies')}
            className="text-left rounded-3xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                  Active agencies
                </div>
                <div className="mt-1 text-2xl font-extrabold text-gray-900">
                  {formatCompact(stats.activeAgencies)}
                </div>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                <Building className="h-6 w-6 text-blue-700" />
              </div>
            </div>
            <div className="mt-3 text-sm text-gray-600">
              Track repeat-buyers and build a capture short-list.
            </div>
          </button>
        </div>

        {/* Layout grid */}
        <div className="mt-7 grid grid-cols-1 2xl:grid-cols-12 gap-6">
          {/* Left analytics */}
          <div className="2xl:col-span-8 space-y-6">
            {/* Charts row */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="rounded-3xl bg-white border border-gray-200 shadow-sm p-6">
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div>
                    <div className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-gray-900" />
                      <span>Top agencies</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Where the volume is coming from; use this
                      to focus outreach.
                    </div>
                  </div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                    Live
                  </div>
                </div>
                <SimpleBarList
                  items={dashboard.agenciesSeries}
                />
              </div>

              <div className="rounded-3xl bg-white border border-gray-200 shadow-sm p-6">
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div>
                    <div className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                      <PieChart className="h-5 w-5 text-gray-900" />
                      <span>Set-aside mix</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      How often postings have set-aside
                      designations.
                    </div>
                  </div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                    {dashboard.setAsideFriendlyPct}% set-aside
                  </div>
                </div>
                <Donut series={dashboard.setAsideSeries} />
              </div>
            </div>

            {/* Momentum / deadlines */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="rounded-3xl bg-white border border-gray-200 shadow-sm p-6">
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div>
                    <div className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                      <LineChart className="h-5 w-5 text-gray-900" />
                      <span>Posting momentum (7d)</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Daily posting count last 7 days.
                    </div>
                  </div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                    Sparkline
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    {dashboard.postedByDay.map((d) => (
                      <div
                        key={d.label}
                        className="flex items-center justify-between gap-4"
                      >
                        <div className="text-sm font-semibold text-gray-800 w-10">
                          {d.label}
                        </div>
                        <div className="h-2 w-40 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"
                            style={{
                              width: `${Math.max(
                                4,
                                Math.round(
                                  (d.count /
                                    Math.max(
                                      1,
                                      ...dashboard.postedByDay.map(
                                        (x) => x.count
                                      )
                                    )) *
                                    100
                                )
                              )}%`,
                            }}
                          />
                        </div>
                        <div className="text-sm font-bold text-gray-700 w-10 text-right">
                          {d.count}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="text-blue-600">
                    <MiniSparkline
                      values={dashboard.postedByDay.map(
                        (d) => d.count
                      )}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-3xl bg-white border border-gray-200 shadow-sm p-6">
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div>
                    <div className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-gray-900" />
                      <span>Deadline urgency</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      How many opportunities are expiring soon.
                    </div>
                  </div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                    <span className="text-orange-600">
                      {dashboard.expiring24h}
                    </span>{' '}
                    &lt;24h ·{' '}
                    <span className="text-orange-600">
                      {dashboard.expiring72h}
                    </span>{' '}
                    &lt;72h
                  </div>
                </div>

                <div className="space-y-3">
                  {(() => {
                    const max = Math.max(
                      1,
                      ...dashboard.deadlineBuckets.map(
                        (x) => x.count
                      )
                    );
                    return dashboard.deadlineBuckets.map(
                      (b) => (
                        <div
                          key={b.label}
                          className="space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-semibold text-gray-900">
                              {b.label}
                            </div>
                            <div className="text-sm font-bold text-gray-700">
                              {b.count}
                            </div>
                          </div>
                          <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-500"
                              style={{
                                width: `${Math.max(
                                  4,
                                  Math.round(
                                    (b.count / max) * 100
                                  )
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      )
                    );
                  })()}
                </div>

                <div className="mt-4 rounded-2xl bg-gray-50 border border-gray-200 p-4">
                  <div className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    <span>Quick rule</span>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    If it’s a good fit and &lt;72 hours to
                    deadline, assign an owner and decide today.
                  </div>
                </div>
              </div>
            </div>

            {/* Focus Now */}
            <div className="rounded-3xl bg-white border border-gray-200 shadow-sm p-6">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <div className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-gray-900" />
                    <span>Focus now</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    The soonest deadlines to review first
                    (highest urgency).
                  </div>
                </div>
                <button
                  onClick={() =>
                    router.push(
                      '/opportunities?filter=expiring'
                    )
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-bold text-white hover:bg-gray-800 transition"
                >
                  <span>View expiring list</span>
                  <ArrowUpRight className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {dashboard.focusNow.length ? (
                  dashboard.focusNow.map((opp: any) => {
                    const days = opp.daysToDeadline;
                    const badge =
                      days <= 1
                        ? {
                            label: '<24h',
                            cls: 'bg-red-50 text-red-700 border-red-200',
                          }
                        : days <= 3
                        ? {
                            label: '<72h',
                            cls: 'bg-orange-50 text-orange-700 border-orange-200',
                          }
                        : days <= 7
                        ? {
                            label: '≤7d',
                            cls: 'bg-amber-50 text-amber-800 border-amber-200',
                          }
                        : {
                            label: '>7d',
                            cls: 'bg-gray-50 text-gray-700 border-gray-200',
                          };

                    return (
                      <div
                        key={opp.noticeId}
                        className="rounded-2xl border border-gray-200 bg-white p-4 hover:shadow-md transition"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-extrabold text-gray-900 line-clamp-2">
                              {opp.title || 'Untitled opportunity'}
                            </div>
                            <div className="mt-1 text-xs text-gray-600 flex flex-wrap gap-x-3 gap-y-1">
                              <span className="inline-flex items-center gap-1">
                                <Building className="h-3.5 w-3.5" />
                                <span>
                                  {opp.department ||
                                    'Unknown agency'}
                                </span>
                              </span>
                              {opp.naicsCode && (
                                <span className="inline-flex items-center gap-1">
                                  <Database className="h-3.5 w-3.5" />
                                  <span>
                                    NAICS {opp.naicsCode}
                                  </span>
                                </span>
                              )}
                              {opp.typeOfSetAsideDescription && (
                                <span className="inline-flex items-center gap-1">
                                  <Users className="h-3.5 w-3.5" />
                                  <span>
                                    {
                                      opp.typeOfSetAsideDescription
                                    }
                                  </span>
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="shrink-0 inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold">
                            <span
                              className={badge.cls}
                              style={{
                                borderRadius: '9999px',
                                padding: '2px 8px',
                              }}
                            >
                              {badge.label}
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
                          <div>
                            Deadline{' '}
                            <span className="font-semibold text-gray-700">
                              {opp.responseDeadLine
                                ? new Date(
                                    opp.responseDeadLine
                                  ).toLocaleDateString()
                                : 'N/A'}
                            </span>
                          </div>
                          <button
                            onClick={() =>
                              router.push(
                                `/opportunities?noticeId=${encodeURIComponent(
                                  opp.noticeId
                                )}`
                              )
                            }
                            className="inline-flex items-center gap-2 rounded-xl bg-gray-100 px-3 py-2 text-xs font-bold text-gray-900 hover:bg-gray-200 transition"
                          >
                            <span>Open</span>
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-2 rounded-2xl bg-gray-50 border border-gray-200 p-6 text-center">
                    <div className="text-sm font-extrabold text-gray-900">
                      No deadline data available
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      If the feed lacks deadlines, this panel will
                      populate once deadlines are present.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right column: AI & trends */}
          <div className="2xl:col-span-4 space-y-6">
            {/* Claude summary */}
            <div className="rounded-3xl bg-white border border-gray-200 shadow-sm p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-gray-900" />
                    <span>Claude analytics</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    A compact briefing based on live signals and AI
                    interpretation.
                  </div>
                </div>
              </div>

              <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
                Brief
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4">
                  <div className="text-xs text-gray-500 font-bold uppercase tracking-wide">
                    High priority
                  </div>
                  <div className="mt-1 text-2xl font-extrabold text-gray-900">
                    {dashboard.highPriority}
                  </div>
                  <div className="mt-1 text-xs text-gray-600">
                    Immediate attention
                  </div>
                </div>
                <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4">
                  <div className="text-xs text-gray-500 font-bold uppercase tracking-wide">
                    Medium
                  </div>
                  <div className="mt-1 text-2xl font-extrabold text-gray-900">
                    {dashboard.mediumPriority}
                  </div>
                  <div className="mt-1 text-xs text-gray-600">
                    Schedule this
                  </div>
                </div>
                <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4">
                  <div className="text-xs text-gray-500 font-bold uppercase tracking-wide">
                    Low
                  </div>
                  <div className="mt-1 text-2xl font-extrabold text-gray-900">
                    {dashboard.lowPriority}
                  </div>
                  <div className="mt-1 text-xs text-gray-600">
                    Optional
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-gray-200 bg-gradient-to-r from-gray-50 to-white p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-extrabold text-gray-900">
                    Suggested operating rhythm
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Review{' '}
                    <span className="font-bold text-gray-900">
                      expiring &lt;72h
                    </span>
                    , then scan{' '}
                    <span className="font-bold text-gray-900">
                      new today
                    </span>
                    , then build alerts.
                  </div>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-gray-900 flex items-center justify-center text-white">
                  <CheckCircle className="h-6 w-6" />
                </div>
              </div>
            </div>

            {/* Market trends */}
            <div className="rounded-3xl bg-white border border-gray-200 shadow-sm p-6">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <div className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-gray-900" />
                    <span>Market trends</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    What’s rising or falling in your opportunity
                    stream.
                  </div>
                </div>
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                  30d
                </div>
              </div>

              <div className="space-y-4">
                {marketTrends.map((trend, index) => (
                  <div
                    key={trend.trend}
                    className="rounded-2xl border border-gray-200 bg-white p-4 hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-extrabold text-gray-900 truncate">
                          {trend.trend}
                        </div>
                        <div className="mt-1 text-xs text-gray-600">
                          {trend.description}
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          {trend.timeframe}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="inline-flex items-center gap-1 text-sm font-extrabold text-gray-900">
                          {trend.direction === 'up' ? (
                            <>
                              <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                              <span className="text-emerald-700">
                                {trend.percentage}%
                              </span>
                            </>
                          ) : trend.direction === 'down' ? (
                            <>
                              <ArrowDownRight className="h-4 w-4 text-red-600" />
                              <span className="text-red-700">
                                -{trend.percentage}%
                              </span>
                            </>
                          ) : (
                            <>
                              <TrendingDown className="h-4 w-4 text-gray-600" />
                              <span className="text-gray-700">
                                {trend.percentage}%
                              </span>
                            </>
                          )}
                        </div>
                        <div className="mt-2 h-2 w-20 rounded-full bg-gradient-to-r bg-gray-100 overflow-hidden">
                          <div
                            className={`h-full w-full rounded-full bg-gradient-to-r ${
                              trendColors[
                                index % trendColors.length
                              ]
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI insights list */}
            <div className="rounded-3xl bg-white border border-gray-200 shadow-sm p-6">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <div className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-gray-900" />
                    <span>Actionable insights</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Prioritized recommendations and alerts
                    (AI-assisted).
                  </div>
                </div>
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                  {aiInsights.length} items
                </div>
              </div>

              <div className="space-y-4">
                {aiInsights.map((insight, index) => {
                  const CategoryIcon =
                    categoryIcon[insight.category] ||
                    Sparkles;
                  const grad =
                    priorityColor[insight.priority] ||
                    'from-gray-500 to-gray-600';
                  const badge =
                    priorityIcon[insight.priority];

                  return (
                    <div
                      key={`${insight.title}-${index}`}
                      className="rounded-2xl border border-gray-200 bg-white p-4 hover:shadow-md transition"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`h-10 w-10 rounded-2xl bg-gradient-to-br ${grad} text-white flex items-center justify-center shadow-sm shrink-0`}
                        >
                          <CategoryIcon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-sm font-extrabold text-gray-900 line-clamp-2">
                                {insight.title}
                              </div>
                              <div className="mt-1 text-sm text-gray-600 line-clamp-3">
                                {insight.description}
                              </div>
                            </div>
                            <div className="shrink-0 text-right">
                              <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-800 border border-gray-200">
                                {badge}
                                <span className="capitalize">
                                  {insight.priority}
                                </span>
                              </div>
                              <div className="mt-2 text-xs font-bold text-gray-500 uppercase tracking-wide">
                                {insight.category}
                              </div>
                            </div>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {insight.priority === 'high' && (
                              <button
                                onClick={() =>
                                  router.push(
                                    '/opportunities?filter=expiring'
                                  )
                                }
                                className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-3 py-2 text-xs font-bold text-white hover:bg-gray-800 transition"
                              >
                                <span>Review expiring</span>
                                <ArrowUpRight className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {insight.category ===
                              'recommendation' && (
                              <button
                                onClick={() =>
                                  router.push(
                                    '/opportunities?openAlert=1'
                                  )
                                }
                                className="inline-flex items-center gap-2 rounded-xl bg-gray-100 px-3 py-2 text-xs font-bold text-gray-900 hover:bg-gray-200 transition"
                              >
                                <span>Create alert</span>
                                <Bell className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() =>
                                router.push('/opportunities')
                              }
                              className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-bold text-gray-900 border border-gray-200 hover:bg-gray-50 transition"
                            >
                              <span>Explore</span>
                              <ArrowUpRight className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* NAICS snapshot */}
              <div className="mt-6 rounded-2xl bg-gray-50 border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    <span>Top NAICS codes</span>
                  </div>
                  <div className="text-xs text-gray-500 font-bold uppercase tracking-wide">
                    Live
                  </div>
                </div>
                {dashboard.naicsSeries.length ? (
                  <SimpleBarList
                    items={dashboard.naicsSeries.map(
                      (x) => ({
                        name: x.name,
                        count: x.count,
                      })
                    )}
                    maxItems={6}
                  />
                ) : (
                  <div className="text-sm text-gray-600">
                    No NAICS codes present in the current feed.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Latest opportunities */}
        <div className="mt-7 rounded-3xl bg-white border border-gray-200 shadow-sm p-6">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <div className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                <Globe className="h-5 w-5 text-gray-900" />
                <span>Latest federal opportunities</span>
              </div>
              <div className="text-sm text-gray-600">
                Quick preview of recent opportunities; tap
                “Open” to view in the explorer.
              </div>
            </div>
            <button
              onClick={() =>
                router.push('/opportunities')
              }
              className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-bold text-white hover:bg-gray-800 transition"
            >
              <span>View all</span>
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
            {opportunities.map((opp) => (
              <div
                key={opp.noticeId}
                className="rounded-2xl border border-gray-200 bg-white p-4 hover:shadow-md transition"
              >
                <div className="text-sm font-extrabold text-gray-900 line-clamp-2">
                  {opp.title || 'Untitled opportunity'}
                </div>
                <div className="mt-2 text-xs text-gray-600 space-y-1">
                  <div className="flex items-center gap-2">
                    <Building className="h-3.5 w-3.5" />
                    <span className="truncate">
                      {opp.department || 'Unknown agency'}
                    </span>
                  </div>
                  {opp.naicsCode && (
                    <div className="flex items-center gap-2">
                      <Database className="h-3.5 w-3.5" />
                      <span>
                        NAICS {opp.naicsCode}
                      </span>
                    </div>
                  )}
                  {opp.typeOfSetAsideDescription && (
                    <div className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5" />
                      <span className="truncate">
                        {opp.typeOfSetAsideDescription}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    Posted{' '}
                    <span className="font-semibold text-gray-700">
                      {opp.postedDate
                        ? new Date(
                            opp.postedDate
                          ).toLocaleDateString()
                        : 'N/A'}
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      router.push(
                        `/opportunities?noticeId=${encodeURIComponent(
                          opp.noticeId
                        )}`
                      )
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-gray-100 px-3 py-2 text-xs font-bold text-gray-900 hover:bg-gray-200 transition"
                  >
                    <span>Open</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {loading && !dataLoaded && (
            <div className="mt-6 rounded-2xl bg-gray-50 border border-gray-200 p-5 flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-gray-600" />
              <div className="text-sm text-gray-700">
                Loading live data; you’ll see real analytics
                once the SAM feed arrives.
              </div>
            </div>
          )}

          <div className="h-10" />
        </div>
      </div>
    </div>
  );
}
