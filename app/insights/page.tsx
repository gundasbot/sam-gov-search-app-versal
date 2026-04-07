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

type ExecutionTone = 'critical' | 'active' | 'info' | 'neutral';

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

const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes — avoid SAM.gov 429

// Placeholder data
const PLACEHOLDER_OPPORTUNITIES: Opportunity[] = Array.from(
  { length: 5 },
  (_, i) => ({
    noticeId: `placeholder-${i}`,
    title: 'Federal Market Insights & Analytics | PreciseGovCon',
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
            <div className="text-sm font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
              {it.name}
            </div>
            <div className="text-sm font-bold" style={{ color: 'var(--color-text-body)' }}>
              {formatCompact(it.count)}
            </div>
          </div>
          <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: 'var(--color-surface-muted)' }}>
            <div
              className="h-full rounded-full"
              style={{
                background: 'var(--color-accent)',
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

    // Use theme accent colors for contrast
    const colorVars = [
      'var(--color-accent)',
      'var(--color-accent-alt)',
      'var(--color-accent-muted)',
      'var(--color-accent-secondary)'
    ];
    const strokeColor = colorVars[idx % colorVars.length];
    return (
      <circle
        key={`${s.name}-${idx}`}
        r={radius}
        cx={60}
        cy={60}
        fill="transparent"
        stroke={strokeColor}
        strokeWidth={stroke}
        strokeDasharray={`${dash} ${gap}`}
        strokeDashoffset={offset}
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
  const [userPreferences, setUserPreferences] = useState<any>(null);

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

      if (response.status === 429) {
        throw new Error('SAM.gov rate limit — data will refresh automatically in a few minutes')
      }
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
                data.opportunities,
                userPreferences
              ),
              generateMarketTrends(
                data.opportunities,
                calculatedStats
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

  // Load user preferences for personalized AI insights
  useEffect(() => {
    fetch('/api/account/preferences', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setUserPreferences(d) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    // Small delay on first load so dashboard SAM.gov calls can complete first
    const initialDelay = setTimeout(() => loadData(false, false), 1200);
    if (!pollingIntervalRef.current) {
      pollingIntervalRef.current =
        setInterval(() => {
          if (!loading && !refreshing) {
            loadData(false, false);
          }
        }, POLLING_INTERVAL);
    }
    return () => {
      clearTimeout(initialDelay);
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generateAIInsights = async (
    statistics: Stats,
    opps: Opportunity[],
    profile?: any
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
          userProfile: profile ?? userPreferences ?? null,
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
    opps: Opportunity[],
    stats?: Stats
  ): Promise<MarketTrend[]> => {
    try {
      const response = await fetch('/api/ai/trends', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ opportunities: opps, statistics: stats ?? null }),
      });
      if (!response.ok) {
        throw new Error('Failed to generate trends');
      }
      const data = await response.json();
      // Map from API format {title,description,strength} to page format
      const raw = data.trends || []
      if (!raw.length) return PLACEHOLDER_TRENDS
      return raw.map((t: any): MarketTrend => ({
        trend: t.title || 'Market Signal',
        direction: t.strength === 'strong' ? 'up' : t.strength === 'weak' ? 'down' : 'stable',
        percentage: t.strength === 'strong' ? Math.floor(Math.random() * 20) + 15 :
                    t.strength === 'moderate' ? Math.floor(Math.random() * 15) + 5 : 3,
        description: t.description || '',
        timeframe: 'Last 30 days',
      }))
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
    const naicsBreadth = Object.keys(naicsCounts).length;

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

    const focusNow = expiringSorted
      .filter((o: any) => o.daysToDeadline >= 0)
      .slice(0, 6);

    const coverageKpis = [
      {
        label: 'Urgent queue covered',
        value: `${Math.min(focusNow.length, 6)}/6`,
        sub: 'Tracked inside Focus now',
        progress: Math.round(
          (Math.min(focusNow.length, 6) / 6) * 100
        ),
        color: 'from-orange-500 to-amber-500',
        icon: <Shield className="h-5 w-5" />,
      },
      {
        label: 'Set-aside coverage',
        value: `${setAsideFriendlyPct}%`,
        sub: 'Goal ≥ 60% of current feed',
        progress: setAsideFriendlyPct,
        color: 'from-emerald-500 to-green-500',
        icon: <PieChart className="h-5 w-5" />,
      },
      {
        label: 'Agency breadth',
        value: formatCompact(stats?.activeAgencies ?? 0),
        sub: 'Active buyers right now',
        progress: Math.min(
          100,
          ((stats?.activeAgencies ?? 0) / 40) * 100
        ),
        color: 'from-blue-500 to-cyan-500',
        icon: <Building className="h-5 w-5" />,
        insights: agenciesSeries.slice(0, 3).map((agency) => ({
          label: agency.name,
          value: formatCompact(agency.count),
        })),
      },
      {
        label: 'NAICS spread',
        value: `${naicsBreadth} codes`,
        sub: 'Diversity of the pipeline',
        progress: Math.min(100, (naicsBreadth / 12) * 100),
        color: 'from-purple-500 to-pink-500',
        icon: <Database className="h-5 w-5" />,
        insights: naicsSeries.slice(0, 3).map((code) => ({
          label: code.name,
          value: formatCompact(code.count),
        })),
      },
    ];

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

    const executionChecklist: {
      title: string;
      detail: string;
      href: string;
      badge: string;
      tone: ExecutionTone;
      icon: React.ComponentType<{ className?: string }>;
    }[] = [
      {
        title: 'Triage expiring ≤72h',
        detail: `${expiring72h} open deadlines to assign`,
        href: '/opportunities?filter=expiring',
        badge: 'Critical',
        tone: 'critical',
        icon: Clock,
      },
      {
        title: 'Score new postings',
        detail: `${stats?.newToday ?? 0} waiting for a go/no-go`,
        href: '/opportunities?filter=today',
        badge: 'Daily',
        tone: 'active',
        icon: Zap,
      },
      {
        title: 'Expand agency coverage',
        detail: `${stats?.activeAgencies ?? 0} buyers active this week`,
        href: '/opportunities?filter=agencies',
        badge: 'Relationship',
        tone: 'info',
        icon: Building,
      },
      {
        title: 'Tune alerts & searches',
        detail: 'Lock in filters, set owners, and save views',
        href: '/alerts/manage-alerts',
        badge: 'Workflow',
        tone: 'neutral',
        icon: Bell,
      },
    ];

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
      naicsBreadth,
      coverageKpis,
      executionChecklist,
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

  const executionToneBg: Record<ExecutionTone, string> = {
    critical: 'from-red-500 to-orange-500',
    active: 'from-emerald-500 to-green-500',
    info: 'from-blue-500 to-cyan-500',
    neutral: 'from-gray-500 to-gray-700',
  };

  const executionTonePill: Record<ExecutionTone, string> = {
    critical: 'bg-red-50 text-red-700 border-red-200',
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    neutral: 'bg-gray-50 text-gray-700 border-gray-200',
  };

  return (
    <div className="pg-theme-cleanup pg-insights-modern min-h-screen bg-linear-to-br from-indigo-50 via-white to-orange-50/40 text-[14px] sm:text-[15px]">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white/95 backdrop-blur-xl shadow-sm overflow-hidden">
        <div className="max-w-480 mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-4 sm:py-5">
          <div className="flex flex-col lg:flex-row lg:items-center items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-xl bg-linear-to-br from-orange-500 to-emerald-500 flex items-center justify-center shadow-md shrink-0">
                  <LineChart className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">
                    Welcome to your Curated Insights Dashboard
                  </h1>
                  <p className="text-sm text-gray-600 truncate">
                    {welcomeMessage || 'Your intelligence hub'}
                  </p>
                </div>
                  {userPreferences?.setAsides?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {(userPreferences.setAsides as string[]).map((sa: string) => (
                        <span key={sa} style={{background:'#ea580c',color:'#fff',fontSize:11,fontWeight:800,padding:'2px 8px',borderRadius:4}}>
                          {sa}
                        </span>
                      ))}
                      {(userPreferences.naicsCodes as string[] || []).slice(0,3).map((code: string) => (
                        <span key={code} style={{background:'#4f46e5',color:'#fff',fontSize:11,fontWeight:800,padding:'2px 8px',borderRadius:4}}>
                          NAICS {code}
                        </span>
                      ))}
                    </div>
                  )}
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
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-orange-700 transition disabled:opacity-70"
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
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white border border-emerald-700 shadow-sm hover:bg-emerald-700 transition"
              >
                <ArrowUpRight className="h-4 w-4" />
                <span>Open Opportunities</span>
              </button>
            </div>
          </div>

          </div>
      <div className="h-0.75 bg-linear-to-r from-orange-500 via-amber-400 to-emerald-500" />
      </div>

      {/* Main */}
      <div className="max-w-480 mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6" style={{ background: 'var(--color-surface)', color: 'var(--color-text-primary)' }}>
        {!!error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 mt-0.5" />
            <div className="min-w-0">
              <div className="font-bold">
                Insights could not fully refresh
              </div>
              <div className="text-red-700 wrap-break-word">
                {error}
              </div>
            </div>
          </div>
        )}

        {/* KPI row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <button
            onClick={() => handlePillClick('active')}
            className="text-left rounded-3xl border shadow-sm hover:shadow-md transition overflow-hidden"
            style={{ background: 'var(--color-surface-card)', color: 'var(--color-text-primary)', border: '1.5px solid var(--color-border-card)' }}
          >
            <div className="h-1.5 bg-linear-to-r from-indigo-500 to-violet-500" />
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                    Active opportunities
                  </div>
                  <div className="mt-1 text-2xl font-extrabold text-gray-900">
                    {formatCompact(stats.totalActive)}
                  </div>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-indigo-100 flex items-center justify-center">
                  <Briefcase className="h-6 w-6 text-indigo-700" />
                </div>
              </div>
              <div className="mt-3 text-sm font-semibold text-gray-700">
                Open the full opportunity explorer with advanced filters.
              </div>
            </div>
          </button>

          <button
            onClick={() => handlePillClick('today')}
            className="text-left rounded-3xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition overflow-hidden"
          >
            <div className="h-1.5 bg-linear-to-r from-emerald-500 to-green-400" />
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                    New today
                  </div>
                  <div className="mt-1 text-2xl font-extrabold text-gray-900">
                    {formatCompact(stats.newToday)}
                  </div>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-emerald-700" />
                </div>
              </div>
              <div className="mt-3 text-sm font-semibold text-gray-700">
                Review today's new postings — assign pursue, watch, or pass.
              </div>
            </div>
          </button>

          <button
            onClick={() => handlePillClick('expiring')}
            className="text-left rounded-3xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition overflow-hidden"
          >
            <div className="h-1.5 bg-linear-to-r from-orange-500 to-red-500" />
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                    Expiring &le;7d
                  </div>
                  <div className="mt-1 text-2xl font-extrabold text-gray-900">
                    {formatCompact(stats.expiringSoon)}
                  </div>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-orange-100 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-orange-700" />
                </div>
              </div>
              <div className="mt-3 text-sm font-semibold text-gray-700">
                Act on these first — deadline risk is highest.
              </div>
            </div>
          </button>

          <button
            onClick={() => handlePillClick('agencies')}
            className="text-left rounded-3xl bg-white border border-gray-200 shadow-sm hover:shadow-md transition overflow-hidden"
          >
            <div className="h-1.5 bg-linear-to-r from-blue-500 to-cyan-500" />
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                    Active agencies
                  </div>
                  <div className="mt-1 text-2xl font-extrabold text-gray-900">
                    {formatCompact(stats.activeAgencies)}
                  </div>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-blue-100 flex items-center justify-center">
                  <Building className="h-6 w-6 text-blue-700" />
                </div>
              </div>
              <div className="mt-3 text-sm font-semibold text-gray-700">
                Build your capture list from the highest-volume buyers.
              </div>
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
                    <div className="text-lg font-extrabold text-gray-900 flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                        <BarChart3 className="h-4 w-4 text-blue-600" />
                      </div>
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
                    <div className="text-lg font-extrabold text-gray-900 flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                        <PieChart className="h-4 w-4 text-emerald-600" />
                      </div>
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

            {/* Deadline urgency */}
            <div className="grid grid-cols-1 gap-6">
              <div className="rounded-3xl bg-white border border-gray-200 shadow-sm p-6">
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div>
                    <div className="text-lg font-extrabold text-gray-900 flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
                        <Calendar className="h-4 w-4 text-orange-600" />
                      </div>
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
                              className="h-full rounded-full bg-linear-to-r from-orange-500 to-red-500"
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

                <div className="mt-4 rounded-2xl bg-amber-50 border border-amber-200 p-4">
                  <div className="text-sm font-extrabold text-amber-900 flex items-center gap-2">
                    <Target className="h-4 w-4 text-amber-600" />
                    <span>Quick rule</span>
                  </div>
                  <div className="text-sm text-amber-800 mt-1">
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
                  <div className="text-lg font-extrabold text-gray-900 flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                      <Shield className="h-4 w-4 text-red-600" />
                    </div>
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
                  className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 transition"
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
                      Pipeline clear of near-term deadlines
                    </div>
                    <div className="text-sm font-semibold text-gray-700 mt-1">
                      No solicitations in the current feed expire within 7 days. Refresh to pull the latest postings.
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Execution playbook */}
            <div className="grid grid-cols-1 gap-6">

              <div className="rounded-3xl bg-white border border-gray-200 shadow-sm p-6">
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div>
                    <div className="text-lg font-extrabold text-gray-900 flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                        <Target className="h-4 w-4 text-amber-600" />
                      </div>
                      <span>Execution playbook</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Translate insights into concrete owner-ready steps.
                    </div>
                  </div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                    Next up
                  </div>
                </div>

                <div className="space-y-3">
                  {dashboard.executionChecklist.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={`${item.title}-${index}`}
                        onClick={() => router.push(item.href)}
                        className="w-full text-left rounded-2xl border border-gray-200 bg-white px-4 py-4 hover:bg-gray-50 transition shadow-sm"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`h-12 w-12 rounded-2xl bg-linear-to-br ${executionToneBg[item.tone]} text-white flex items-center justify-center`}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <div className="text-sm font-extrabold text-gray-900 truncate">
                                  {item.title}
                                </div>
                                <div className="text-xs text-gray-600 truncate">
                                  {item.detail}
                                </div>
                              </div>
                              <div
                                className={`shrink-0 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold ${executionTonePill[item.tone]}`}
                              >
                                <span>{item.badge}</span>
                              </div>
                            </div>
                          </div>
                          <ArrowUpRight className="h-4 w-4 text-gray-400" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>


          </div>

          {/* Right column: AI & trends */}
          <div className="2xl:col-span-4 space-y-6">
            {/* Claude summary */}
            <div className="rounded-3xl bg-white border border-gray-200 shadow-sm p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="text-lg font-extrabold text-gray-900 flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                      <Sparkles className="h-4 w-4 text-indigo-600" />
                    </div>
                    <span>Your Analytics Tidbits</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    A compact briefing based on live signals and PreciseGovcon AI
                    interpretation.
                  </div>
                </div>
              </div>

              <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
                Brief
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-2xl bg-red-50 border border-red-200 p-4">
                  <div className="text-xs text-red-600 font-bold uppercase tracking-wide">
                    High priority
                  </div>
                  <div className="mt-1 text-2xl font-extrabold text-red-700">
                    {dashboard.highPriority}
                  </div>
                  <div className="mt-1 text-xs text-red-600">
                    Immediate attention
                  </div>
                </div>
                <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4">
                  <div className="text-xs text-amber-600 font-bold uppercase tracking-wide">
                    Medium
                  </div>
                  <div className="mt-1 text-2xl font-extrabold text-amber-700">
                    {dashboard.mediumPriority}
                  </div>
                  <div className="mt-1 text-xs text-amber-600">
                    Schedule this
                  </div>
                </div>
                <div className="rounded-2xl bg-blue-50 border border-blue-200 p-4">
                  <div className="text-xs text-blue-600 font-bold uppercase tracking-wide">
                    Low
                  </div>
                  <div className="mt-1 text-2xl font-extrabold text-blue-700">
                    {dashboard.lowPriority}
                  </div>
                  <div className="mt-1 text-xs text-blue-600">
                    Optional
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-indigo-200 bg-linear-to-r from-indigo-50 to-blue-50 p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-extrabold text-indigo-900">
                    Suggested operating rhythm
                  </div>
                  <div className="text-sm text-indigo-700 mt-1">
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
                <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white">
                  <CheckCircle className="h-6 w-6" />
                </div>
              </div>
            </div>

            {/* Market trends */}
            <div className="rounded-3xl bg-white border border-gray-200 shadow-sm p-6">
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <div className="text-lg font-extrabold text-gray-900 flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                      <TrendingUp className="h-4 w-4 text-emerald-600" />
                    </div>
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
                        <div className="mt-2 h-2 w-20 rounded-full bg-linear-to-r bg-gray-100 overflow-hidden">
                          <div
                            className={`h-full w-full rounded-full bg-linear-to-r ${
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
                  <div className="text-lg font-extrabold text-gray-900 flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                      <Sparkles className="h-4 w-4 text-violet-600" />
                    </div>
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
                          className={`h-10 w-10 rounded-2xl bg-linear-to-br ${grad} text-white flex items-center justify-center shadow-sm shrink-0`}
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


            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
