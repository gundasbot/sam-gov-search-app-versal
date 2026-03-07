// app/dashboard/page.tsx
'use client'

import { useEffect, useState, useMemo, useCallback, Suspense } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  Search, Bell, TrendingUp, Zap, BarChart3, Users, Brain, Calendar,
  FileText, DollarSign, Filter, Plus, ArrowRight, Loader2, CheckCircle,
  AlertCircle, X, Eye, Download, Share2, Settings, ChevronRight,
  Activity, Clock, Target, Award, Rocket, ArrowUpRight, ArrowDownRight,
  MapPin, Building2, AlertTriangle, Lightbulb, RefreshCw, Grid3X3, List, Sparkles
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────
type OpportunityCard = {
  id: string
  title: string
  agency: string
  type: 'RFP' | 'RFQ' | 'Solicitation' | 'Notice'
  value?: number
  dueDate: string
  matchScore: number
  description: string
  naics?: string
  setAside?: string
  location?: string
  aiSummary?: string
}

type Alert = {
  id: string
  name: string
  frequency: 'REAL_TIME' | 'DAILY' | 'WEEKLY' | 'MONTHLY'
  active: boolean
  matchesCount: number
  lastRun?: string
}

type SearchFilters = {
  naics?: string
  state?: string
  setaside?: string
  agency?: string
  type?: string
}

type ActiveSearch = {
  id: string
  name: string
  query: string
  filters?: SearchFilters
  resultsCount?: number
  newCount?: number
}

type SavedOpportunity = {
  noticeId: string
  title: string
  agency: string
  value?: number
  posted?: string
  deadline?: string
  naics?: string
  match?: number | null
}

type NotificationIcon = 'deadline' | 'match' | 'alert' | 'ai'

type DashboardNotification = {
  type: NotificationIcon
  title: string
  time?: string
  iconType: NotificationIcon
}

type DeadlineItem = {
  title: string
  agency: string
  deadline: string
  value?: number | string
}

type DashboardData = {
  activeSearchesCount: number
  savedOppCount: number
  avgMatchScore: number | null
  thisWeekCount: number
  activeSearches: ActiveSearch[]
  savedOpportunities: SavedOpportunity[]
  recentOpportunities: SavedOpportunity[]
  notifications: DashboardNotification[]
  upcomingDeadlines: DeadlineItem[]
  userGoals: string[]
  loading: boolean
  error: string | null
}

type ActivityLog = {
  id: string
  type: 'search' | 'alert' | 'save' | 'share' | 'ai'
  title: string
  timestamp: string
  icon: string
}

type TrendData = {
  month: string
  opportunities: number
  matches: number
}

type DrawerKey =
  | 'activeSearches'
  | 'savedOpps'
  | 'matchInfo'
  | 'notifications'
  | 'settings'
  | 'goalSetup'
  | 'recentMatches'
  | 'deadlines'
  | null

const USE_MOCK_DASHBOARD = true

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value))
}

const MOCK_DASHBOARD_DATA: DashboardData = {
  activeSearchesCount: 3,
  savedOppCount: 5,
  avgMatchScore: 82,
  thisWeekCount: 12,
  activeSearches: [
    {
      id: 'search-cyber',
      name: 'Cybersecurity - VA',
      query: 'zero trust modernization',
      filters: { naics: '541512', state: 'VA', setaside: 'SDVOSB', agency: 'Department of Veterans Affairs' },
      resultsCount: 186,
      newCount: 5,
    },
    {
      id: 'search-cloud',
      name: 'Cloud Migration - DHS',
      query: 'cloud migration devsecops',
      filters: { naics: '541519', setaside: 'SBA', agency: 'Department of Homeland Security' },
      resultsCount: 142,
      newCount: 3,
    },
    {
      id: 'search-ai',
      name: 'AI & Data Science',
      query: 'machine learning analytics',
      filters: { naics: '541715', state: 'MD' },
      resultsCount: 97,
      newCount: 2,
    },
  ],
  savedOpportunities: [
    {
      noticeId: 'W91-DEF-2412',
      title: 'Zero Trust Engineering Support',
      agency: 'Department of the Army',
      value: 3200000,
      posted: '2 days ago',
      deadline: '5 days',
      naics: '541512',
      match: 90,
    },
    {
      noticeId: '70RD-CLD-2403',
      title: 'DHS Cloud Migration Surge Team',
      agency: 'Department of Homeland Security',
      value: 2100000,
      posted: '4 days ago',
      deadline: '8 days',
      naics: '541519',
      match: 84,
    },
    {
      noticeId: '36C10B-ALR-007',
      title: 'VA Analytics Modernization',
      agency: 'Department of Veterans Affairs',
      value: 1500000,
      posted: '1 week ago',
      deadline: '12 days',
      naics: '541611',
      match: 78,
    },
    {
      noticeId: 'FA-8604-AI-2024',
      title: 'AI-enabled ISR Tooling',
      agency: 'Department of the Air Force',
      value: 5800000,
      posted: '3 days ago',
      deadline: '15 days',
      naics: '541715',
      match: 86,
    },
    {
      noticeId: 'GS-35F-NextGen',
      title: 'GSA NextGen Support Desk',
      agency: 'General Services Administration',
      value: 950000,
      posted: '5 days ago',
      deadline: '21 days',
      naics: '541513',
      match: 74,
    },
  ],
  recentOpportunities: [
    {
      noticeId: 'FA-4801-CYBER',
      title: 'Defensive Cyber Readiness',
      agency: 'Department of the Air Force',
      value: 2600000,
      posted: 'Today',
      deadline: '7 days',
      naics: '541519',
      match: 88,
    },
    {
      noticeId: 'HQ0034-CloudOps',
      title: 'Pentagon Cloud Operations Cell',
      agency: 'Department of Defense',
      value: 4100000,
      posted: '1 day ago',
      deadline: '10 days',
      naics: '541512',
      match: 83,
    },
    {
      noticeId: 'N00189-AI-Naval',
      title: 'Naval AI Decision Support',
      agency: 'Department of the Navy',
      value: 2800000,
      posted: '3 days ago',
      deadline: '6 days',
      naics: '541715',
      match: 79,
    },
  ],
  notifications: [
    {
      type: 'deadline',
      title: 'Deadline in 3 days: Defensive Cyber Readiness',
      time: 'Department of the Air Force',
      iconType: 'deadline',
    },
    {
      type: 'match',
      title: 'Saved: DHS Cloud Migration Surge Team',
      time: 'Posted 4 days ago',
      iconType: 'match',
    },
    {
      type: 'ai',
      title: 'AI flagged 2 expiring SDVOSB set-asides',
      time: 'Review this week',
      iconType: 'ai',
    },
  ],
  upcomingDeadlines: [
    {
      title: 'Defensive Cyber Readiness',
      agency: 'Department of the Air Force',
      deadline: '3 days',
      value: '$2.6M',
    },
    {
      title: 'Zero Trust Engineering Support',
      agency: 'Department of the Army',
      deadline: '5 days',
      value: '$3.2M',
    },
    {
      title: 'VA Analytics Modernization',
      agency: 'Department of Veterans Affairs',
      deadline: '12 days',
      value: '$1.5M',
    },
  ],
  userGoals: ['Capture two VA task orders per quarter', 'Maintain SDVOSB pipeline above $5M'],
  loading: false,
  error: null,
}

const MOCK_CLAUDE_ANALYSIS = {
  summary: 'Your pipeline holds five strong fits with deadlines inside two weeks. Lean into SDVOSB-friendly IT modernization where you already score above an 80 match.',
  topOpportunities: [
    { title: 'Zero Trust Engineering Support', reason: '92% match • Army zero-trust sprint', urgency: 'high' as const },
    { title: 'DHS Cloud Migration Surge Team', reason: '84% match • DevSecOps emphasis', urgency: 'medium' as const },
    { title: 'VA Analytics Modernization', reason: '78% match • Set-aside friendly', urgency: 'medium' as const },
  ],
  recommendations: [
    'Schedule capture calls for Army and DHS pursuits this week',
    'Refine AI & Data Science search with HUBZone filter to unlock more set-aside fits',
    'Prepare capability snippet for zero-trust wins to reuse in proposals',
  ],
}

const MOCK_REFRESH_INTERVAL_MS = 20000

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generateLiveMockDashboardData(): DashboardData {
  const base = clone(MOCK_DASHBOARD_DATA)

  base.activeSearches = base.activeSearches.map((search) => {
    const results = Math.max(40, (search.resultsCount ?? 0) + randomBetween(-18, 24))
    const newCount = Math.max(0, randomBetween(0, 7))
    return {
      ...search,
      resultsCount: results,
      newCount,
    }
  })

  base.savedOpportunities = base.savedOpportunities.map((opp) => {
    const match = Math.min(97, Math.max(65, (opp.match ?? 80) + randomBetween(-6, 6)))
    const deadlineDays = randomBetween(3, 21)
    const valueJitter = opp.value ? Math.max(250000, opp.value + randomBetween(-250000, 250000)) : undefined
    return {
      ...opp,
      match,
      value: valueJitter,
      deadline: `${deadlineDays} days`,
      posted: formatRelativeDate(new Date(Date.now() - randomBetween(0, 6) * 86400000).toISOString()),
    }
  })

  base.recentOpportunities = base.recentOpportunities.map((opp) => {
    const match = Math.min(95, Math.max(60, (opp.match ?? 75) + randomBetween(-8, 8)))
    const deadlineDays = randomBetween(4, 14)
    return {
      ...opp,
      match,
      deadline: `${deadlineDays} days`,
      posted: formatRelativeDate(new Date(Date.now() - randomBetween(0, 3) * 86400000).toISOString()),
    }
  })

  const allScored = [...base.savedOpportunities, ...base.recentOpportunities].filter((o) => typeof o.match === 'number')
  base.avgMatchScore = allScored.length
    ? Math.round(allScored.reduce((sum, o) => sum + (o.match ?? 0), 0) / allScored.length)
    : base.avgMatchScore

  base.thisWeekCount = Math.max(
    6,
    base.activeSearches.reduce((sum, s) => sum + (s.newCount ?? 0), 0) + randomBetween(4, 9),
  )

  base.notifications = [
    ...base.savedOpportunities.slice(0, 2).map((opp) => ({
      type: 'deadline' as const,
      title: `Deadline in ${opp.deadline}: ${opp.title}`,
      time: opp.agency,
      iconType: 'deadline' as const,
    })),
    {
      type: 'ai' as const,
      title: `${randomBetween(2, 4)} AI highlights ready`,
      time: 'Review insights in Intelligence Hub',
      iconType: 'ai' as const,
    },
    {
      type: 'match' as const,
      title: `${randomBetween(8, 15)} fresh matches synced`,
      time: 'Live mock feed',
      iconType: 'match' as const,
    },
  ].slice(0, 4)

  base.upcomingDeadlines = base.savedOpportunities
    .slice(0, 3)
    .map((opp) => ({
      title: opp.title,
      agency: opp.agency,
      deadline: opp.deadline ?? '',
      value: opp.value ? `$${(opp.value / 1_000_000).toFixed(1)}M` : 'TBD',
    }))

  base.loading = false
  base.error = null

  return base
}

function buildMockAnalysis(data: DashboardData) {
  const top = [...data.savedOpportunities]
    .filter((opp) => typeof opp.match === 'number')
    .sort((a, b) => (b.match ?? 0) - (a.match ?? 0))
    .slice(0, 3)

  return {
    summary: `Live feed is tracking ${data.thisWeekCount} curated matches with an average fit of ${data.avgMatchScore ?? '—'}%. Prioritize high-score SDVOSB-friendly IT pursuits to stay ahead.`,
    topOpportunities: top.map((opp) => ({
      title: opp.title,
      reason: `${opp.match ?? '--'}% match • ${opp.agency}`,
      urgency: (parseInt(opp.deadline ?? '30', 10) <= 7 ? 'high' : parseInt(opp.deadline ?? '30', 10) <= 14 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
    })),
    recommendations: [
      'Review deadlines inside 7 days first to keep pipeline momentum',
      'Use Alerts to duplicate high-performing searches into new NAICS codes',
      'Share the weekly pipeline snapshot with capture leads before Friday',
    ],
  }
}

// -- Utility: format a date as relative string ---------------------------------
function formatRelativeDate(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} minute${mins !== 1 ? 's' : ''} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? 's' : ''} ago`;
}

function formatRelative(dateStr: string): string {
  if (!dateStr) return 'just now'
  const parsed = new Date(dateStr)
  if (Number.isNaN(parsed.getTime())) return dateStr
  return formatRelativeDate(dateStr)
}

// ─── Utilities ────────────────────────────────────────────────────────────────
function clsx(...c: Array<string | boolean | null | undefined>) {
  return c.filter(Boolean).join(' ')
}

function getWelcomeName(session: any): string {
  const fullName = session?.user?.name?.trim?.() || ''
  if (fullName) return fullName.split(' ')[0]

  const email = session?.user?.email || ''
  if (typeof email === 'string' && email.includes('@')) {
    return email.split('@')[0]
  }

  return 'there'
}

function formatDaysUntil(dateStr?: string): string {
  if (!dateStr) return ''
  const deadline = new Date(dateStr)
  if (Number.isNaN(deadline.getTime())) return ''
  const diffDays = Math.ceil((deadline.getTime() - Date.now()) / 86400000)
  if (diffDays < 0) return 'Expired'
  if (diffDays === 0) return '0 days'
  if (diffDays === 1) return '1 day'
  return `${diffDays} days`
}

function computeOpportunityMatchScore(
  opportunity: any,
  searches: ActiveSearch[] = [],
  goals: string[] = [],
): number | null {
  if (!opportunity || (searches.length === 0 && goals.length === 0)) {
    return null
  }

  let score = 40
  const normalizedTitle = String(opportunity.title || opportunity.name || '').toLowerCase()
  const normalizedDescription = String(opportunity.description || '').toLowerCase()
  const combinedText = `${normalizedTitle} ${normalizedDescription}`.trim()

  const keywordSet = new Set(
    searches
      .map((s) => s.query)
      .filter(Boolean)
      .flatMap((q) => q.toLowerCase().split(/\s+/).filter(Boolean)),
  )

  keywordSet.forEach((keyword) => {
    if (combinedText.includes(keyword)) {
      score += 4
    }
  })

  const naics = String(opportunity.naics || opportunity.naics_code || opportunity.naicsCode || '').trim()
  if (naics && searches.some((s) => s.filters?.naics && s.filters.naics === naics)) {
    score += 20
  }

  const setAside = String(opportunity.setAside || opportunity.set_aside || opportunity.setAsideType || '').toLowerCase()
  if (setAside && searches.some((s) => s.filters?.setaside && setAside.includes(s.filters.setaside.toLowerCase()))) {
    score += 10
  }

  if (goals.length) {
    const goalsText = goals.join(' ').toLowerCase()
    if (naics && goalsText.includes(naics.toLowerCase())) score += 8
    if (setAside && goalsText.includes(setAside)) score += 4
    if (combinedText && goals.some((goal) => goal.length > 3 && combinedText.includes(goal.toLowerCase()))) {
      score += 4
    }
  }

  const agency = String(opportunity.agency || opportunity.department || opportunity.organization_name || '').toLowerCase()
  if (agency && searches.some((s) => s.filters?.agency && agency.includes(s.filters.agency.toLowerCase()))) {
    score += 6
  }

  const value = Number(opportunity.value || opportunity.estimated_value || opportunity.awardValue || 0)
  if (value > 5_000_000) score += 5
  else if (value > 1_000_000) score += 3

  return Math.min(100, Math.max(35, Math.round(score)))
}

function buildQueryString(params: Record<string, string | number | undefined | null>): string {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value))
    }
  })
  const query = searchParams.toString()
  return query ? `?${query}` : ''
}

const notifIconMap: Record<NotificationIcon, LucideIcon> = {
  deadline: AlertTriangle,
  match: Target,
  alert: Bell,
  ai: Sparkles,
}

const notifColorMap: Record<NotificationIcon, string> = {
  deadline: 'text-orange-300',
  match: 'text-emerald-300',
  alert: 'text-rose-300',
  ai: 'text-purple-300',
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const welcomeName = useMemo(() => getWelcomeName(session), [session]);

  const [drawer, setDrawer] = useState<DrawerKey>(null);

  // -- Real data state ----------------------------------------------------------
  const [dashData, setDashData] = useState<DashboardData>({
    activeSearchesCount: 0,
    savedOppCount: 0,
    avgMatchScore: null,
    thisWeekCount: 0,
    activeSearches: [],
    savedOpportunities: [],
    recentOpportunities: [],
    notifications: [],
    upcomingDeadlines: [],
    userGoals: [],
    loading: true,
    error: null,
  });

  // -- AI analysis state --------------------------------------------------------
  const [claudeAnalysis, setClaudeAnalysis] = useState<{
    summary: string;
    topOpportunities: Array<{ title: string; reason: string; urgency: 'high' | 'medium' | 'low' }>;
    recommendations: string[];
  } | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  // -- Goal setup state ---------------------------------------------------------
  const [goalInput, setGoalInput] = useState('');
  const [goalSaving, setGoalSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // -- Fetch all real data on mount ---------------------------------------------
  useEffect(() => {
    if (USE_MOCK_DASHBOARD) {
      const pushMockSnapshot = () => {
        const mockData = generateLiveMockDashboardData()
        setDashData(mockData)
        if (mockData.userGoals.length) {
          setGoalInput((prev) => (prev.trim().length ? prev : mockData.userGoals.join('\n')))
        }
        setClaudeAnalysis(buildMockAnalysis(mockData))
        setAnalysisLoading(false)
      }

      pushMockSnapshot()
      const interval = setInterval(pushMockSnapshot, MOCK_REFRESH_INTERVAL_MS)
      return () => clearInterval(interval)
    }

    if (!session?.user?.email) return

    async function loadDashboard() {
      try {
        const sevenDaysAgo = new Date(Date.now() - 7 * 86400000)
          .toISOString().split('T')[0].replace(/-/g, '/')

        const [searchesRes, savedOppsRes, weeklyRes, profileRes] =
          await Promise.allSettled([
            fetch('/api/saved-searches').then(r => r.ok ? r.json() : { searches: [] }),
            fetch('/api/saved-opportunities').then(r => r.ok ? r.json() : { savedOpportunities: [] }),
            fetch(`/api/sam/opportunities?limit=5&postedFrom=${sevenDaysAgo}`).then(r => r.ok ? r.json() : { ok: false, totalRecords: 0, opportunities: [] }),
            fetch('/api/account/profile').then(r => r.ok ? r.json() : { goals: [] }),
          ]);

        const searches: ActiveSearch[] =
          searchesRes.status === 'fulfilled'
            ? (searchesRes.value?.searches ?? []).map((s: any) => ({
                id: s.id,
                name: s.name,
                query: s.keywords || s.query || '',
                filters: {
                  naics: s.naics || s.naicsCode || '',
                  state: s.stateOfPerformance || s.state || '',
                  setaside: s.setAside || '',
                  agency: s.agency || '',
                  type: s.procurementType || '',
                },
                resultsCount: s._count?.search_runs ?? s.resultsCount ?? undefined,
                newCount: s.newResults ?? s.newCount ?? 0,
              }))
            : [];

        const savedOpps: SavedOpportunity[] =
          savedOppsRes.status === 'fulfilled'
            ? (savedOppsRes.value?.savedOpportunities ?? []).map((o: any) => ({
                noticeId: o.notice_id || o.noticeId || o.id,
                title: o.title || 'Untitled',
                agency: o.organization_name || o.department || o.agency || '',
                value: o.awardValue || o.value || undefined,
                posted: (o.posted_date || o.postedDate) ? formatRelativeDate(o.posted_date || o.postedDate) : undefined,
                deadline: (o.response_deadline || o.responseDeadLine) ? formatDaysUntil(o.response_deadline || o.responseDeadLine) : undefined,
                naics: o.naics_code || o.naicsCode || o.naics || undefined,
              }))
            : [];

        const weeklyData =
          weeklyRes.status === 'fulfilled' ? weeklyRes.value : { totalRecords: 0, opportunities: [] };

        const profile =
          profileRes.status === 'fulfilled' ? profileRes.value : { goals: [] };

        const goals: string[] = profile?.goals ?? [];

        // -- Compute match scores against real saved-search profile --
        const scoredSavedOpps = savedOpps.map(o => ({
          ...o,
          match: computeOpportunityMatchScore(o, searches, goals),
        }));

        const recentOpps: SavedOpportunity[] =
          (weeklyData.opportunities ?? []).slice(0, 3).map((o: any) => ({
            noticeId: o.noticeId || o.id,
            title: o.title || 'Untitled',
            agency: o.department || o.agency || '',
            value: o.awardValue || o.value || undefined,
            posted: o.postedDate ? formatRelativeDate(o.postedDate) : undefined,
            deadline: (o.responseDeadline || o.responseDeadLine) ? formatDaysUntil(o.responseDeadline || o.responseDeadLine) : undefined,
            naics: o.naics || o.naicsCode || undefined,
            match: computeOpportunityMatchScore(o, searches, goals),
          }));

        // Generate notifications from real data: upcoming deadlines + recent saves
        const notifs: DashboardNotification[] = [
          ...scoredSavedOpps
            .filter(o => o.deadline && parseInt(o.deadline) <= 7 && !o.deadline.includes('Expired'))
            .slice(0, 2)
            .map(o => ({
              type: 'deadline' as const,
              title: `Deadline in ${o.deadline}: ${o.title}`,
              time: o.agency,
              iconType: 'deadline' as const,
            })),
          ...scoredSavedOpps.slice(0, 2).map(o => ({
            type: 'match' as const,
            title: `Saved: ${o.title}`,
            time: o.posted ? `Posted ${o.posted}` : '',
            iconType: 'match' as const,
          })),
        ].slice(0, 5);

        // -- Avg match across all scored items --
        const allScored = [...scoredSavedOpps, ...recentOpps].filter(o => o.match);
        const avgMatch =
          allScored.length > 0
            ? Math.round(allScored.reduce((sum, o) => sum + (o.match ?? 0), 0) / allScored.length)
            : null;

        // -- Upcoming deadlines sorted by urgency --
        const deadlines = scoredSavedOpps
          .filter(o => o.deadline && !o.deadline.includes('Expired'))
          .sort((a, b) => parseInt(a.deadline ?? '999') - parseInt(b.deadline ?? '999'))
          .slice(0, 3)
          .map(o => ({ title: o.title, agency: o.agency, deadline: o.deadline ?? '', value: o.value ?? '' }));

        if (goals.length) setGoalInput(goals.join('\n'));

        setDashData({
          activeSearchesCount: searches.length,
          savedOppCount: scoredSavedOpps.length,
          avgMatchScore: avgMatch,
          thisWeekCount: weeklyData.totalRecords ?? weeklyData.opportunities?.length ?? 0,
          activeSearches: searches,
          savedOpportunities: scoredSavedOpps,
          recentOpportunities: recentOpps,
          notifications: notifs,
          upcomingDeadlines: deadlines,
          userGoals: goals,
          loading: false,
          error: null,
        });
      } catch (err) {
        console.error('Dashboard load error:', err);
        setDashData(prev => ({ ...prev, loading: false, error: 'Failed to load dashboard data' }));
        setToast({ type: 'error', message: 'Failed to load dashboard data' });
      }
    }

    loadDashboard()
  }, [session?.user?.email])

  // -- Save user goals ----------------------------------------------------------
  const saveGoals = useCallback(async () => {
    const goals = goalInput.split('\n').map((g: string) => g.trim()).filter(Boolean);
    setGoalSaving(true);
    try {
      if (!USE_MOCK_DASHBOARD) {
        await fetch('/api/account/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ goals }),
        })
      }
      setDashData(prev => {
        const rescored = {
          ...prev,
          userGoals: goals,
          savedOpportunities: prev.savedOpportunities.map(o => ({
            ...o, match: computeOpportunityMatchScore(o, prev.activeSearches, goals),
          })),
          recentOpportunities: prev.recentOpportunities.map(o => ({
            ...o, match: computeOpportunityMatchScore(o, prev.activeSearches, goals),
          })),
        };
        const allScored = [...rescored.savedOpportunities, ...rescored.recentOpportunities].filter(o => o.match);
        return {
          ...rescored,
          avgMatchScore: allScored.length
            ? Math.round(allScored.reduce((s, o) => s + (o.match ?? 0), 0) / allScored.length)
            : null,
        };
      });
      closeDrawer();
    } catch (err) {
      console.error('Failed to save goals:', err);
    } finally {
      setGoalSaving(false);
    }
  }, [goalInput]);

  // -- Claude AI analysis -------------------------------------------------------
  const analyzeWithClaude = useCallback(async () => {
    if (USE_MOCK_DASHBOARD) {
      setClaudeAnalysis(buildMockAnalysis(dashData))
      setAnalysisLoading(false)
      return
    }
    if (analysisLoading) return;
    setAnalysisLoading(true);
    setClaudeAnalysis(null);
    try {
      const response = await fetch('/api/anthropic/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 800,
          system: `You are a federal contracting advisor. Analyze user dashboard data and return ONLY valid JSON. No markdown.${dashData.userGoals.length ? ` User goals: ${dashData.userGoals.join('; ')}` : ''}`,
          messages: [{
            role: 'user',
            content: `Data: ${JSON.stringify({
              searches: dashData.activeSearches.slice(0, 8).map(s => ({ name: s.name, query: s.query, naics: s.filters?.naics, newCount: s.newCount })),
              recentOpps: dashData.recentOpportunities.map(o => ({ title: o.title, agency: o.agency, naics: o.naics, match: o.match, deadline: o.deadline })),
              stats: { savedCount: dashData.savedOppCount, weeklyNew: dashData.thisWeekCount, avgMatch: dashData.avgMatchScore },
              goals: dashData.userGoals,
            })}

Return: {"summary":"2 sentence insight","topOpportunities":[{"title":"...","reason":"...","urgency":"high|medium|low"}],"recommendations":["action1","action2","action3"]}`,
          }],
        }),
      });
      if (!response.ok) throw new Error('API error');
      const data = await response.json();
      const text = data.content?.[0]?.text || '';
      setClaudeAnalysis(JSON.parse(text.replace(/```json|```/g, '').trim()));
    } catch {
      // Local fallback
      setClaudeAnalysis({
        summary: `You have ${dashData.savedOppCount} saved opportunities and ${dashData.thisWeekCount} new postings this week.${dashData.avgMatchScore ? ` Your avg match score is ${dashData.avgMatchScore}%.` : ' Set your goals to activate match scoring.'}`,
        topOpportunities: dashData.recentOpportunities.slice(0, 3).map(o => ({
          title: o.title,
          reason: `${o.match ?? '--'}% match with your search profile`,
          urgency: (parseInt(o.deadline ?? '99') <= 7 ? 'high' : parseInt(o.deadline ?? '99') <= 14 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
        })),
        recommendations: [
          'Review opportunities closing within 7 days first',
          dashData.userGoals.length === 0 ? 'Set your business goals to improve match scoring' : 'Refine saved searches based on recent wins',
          `Run a new search for ${dashData.activeSearches[0]?.query || 'your top keywords'} this week`,
        ],
      });
    } finally {
      setAnalysisLoading(false);
    }
  }, [dashData, analysisLoading]);

  // -- Navigation helpers -------------------------------------------------------
  const closeDrawer = () => setDrawer(null);

  const openActiveSearches = useCallback(() => {
    if (dashData.activeSearchesCount === 0) {
      router.push('/search')
      return
    }
    setDrawer('activeSearches')
  }, [dashData.activeSearchesCount, router])

  const openSavedOpportunities = useCallback(() => {
    if (dashData.savedOppCount === 0) {
      router.push('/opportunities')
      return
    }
    setDrawer('savedOpps')
  }, [dashData.savedOppCount, router])

  const openLatestMatches = useCallback(() => {
    if (dashData.recentOpportunities.length === 0) {
      router.push('/search')
      return
    }
    setDrawer('recentMatches')
  }, [dashData.recentOpportunities.length, router])

  const openDeadlineView = useCallback(() => {
    if (dashData.upcomingDeadlines.length === 0) {
      router.push('/opportunities')
      return
    }
    setDrawer('deadlines')
  }, [dashData.upcomingDeadlines.length, router])

  const goToSearch = useCallback((search: ActiveSearch) => {
    const query = buildQueryString({
      keywords: search.query,
      naics: search.filters?.naics,
      state: search.filters?.state,
      setAside: search.filters?.setaside,
      agency: search.filters?.agency,
      type: search.filters?.type,
      searchId: search.id,
    })
    router.push(`/search${query}`)
    setDrawer(null)
  }, [router])

  const goToSavedOpp = useCallback((opp: SavedOpportunity) => {
    const query = buildQueryString({ noticeId: opp.noticeId })
    router.push(`/opportunities${query}`)
    setDrawer(null)
  }, [router])

function formatCurrency(v?: number) {
  if (!v) return 'TBD'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 0 }).format(v)
}

function getMatchScoreColor(score: number) {
  if (score >= 85) return 'from-emerald-500 to-teal-500'
  if (score >= 70) return 'from-blue-500 to-cyan-500'
  if (score >= 50) return 'from-amber-500 to-orange-500'
  return 'from-slate-400 to-slate-500'
}

  // -- Stat cards ---------------------------------------------------------------
  const summaryCards = useMemo((): Array<{ label: string; value: string | number; icon: LucideIcon; color: string; subtext: string; onClick?: () => void }> => [
    {
      label: 'Active Searches',
      value: dashData.activeSearchesCount,
      icon: Search,
      color: 'from-sky-100 to-blue-100',
      subtext: 'Configured alerts',
      onClick: openActiveSearches,
    },
    {
      label: 'Saved Opportunities',
      value: dashData.savedOppCount,
      icon: Target,
      color: 'from-rose-100 to-orange-100',
      subtext: 'Watchlist items',
      onClick: openSavedOpportunities,
    },
    {
      label: 'New This Week',
      value: dashData.thisWeekCount,
      icon: Zap,
      color: 'from-emerald-100 to-lime-100',
      subtext: 'Matches detected',
      onClick: openLatestMatches,
    },
    {
      label: 'Avg Match Score',
      value: dashData.avgMatchScore !== null ? `${dashData.avgMatchScore}%` : 'Set goals',
      icon: Target,
      color: 'from-violet-100 to-indigo-100',
      subtext: dashData.avgMatchScore !== null ? 'Based on profile' : 'Click to personalize',
      onClick: () => setDrawer(dashData.avgMatchScore === null ? 'goalSetup' : 'matchInfo'),
    },
    {
      label: 'Notifications',
      value: dashData.notifications.length,
      icon: Bell,
      color: 'from-amber-100 to-orange-100',
      subtext: 'Latest signals',
      onClick: () => setDrawer('notifications'),
    },
    {
      label: 'Upcoming Deadlines',
      value: dashData.upcomingDeadlines.length,
      icon: Calendar,
      color: 'from-cyan-100 to-sky-100',
      subtext: 'Next 7 days',
      onClick: openDeadlineView,
    },
  ], [
    dashData.activeSearchesCount,
    dashData.savedOppCount,
    dashData.thisWeekCount,
    dashData.avgMatchScore,
    dashData.notifications.length,
    dashData.upcomingDeadlines.length,
    openActiveSearches,
    openSavedOpportunities,
    openLatestMatches,
    openDeadlineView,
  ])

  const heroHighlights = useMemo(
    () => [
      { label: 'Live matches streaming', value: dashData.thisWeekCount, accent: 'from-emerald-400 via-emerald-500 to-teal-400', icon: Sparkles },
      { label: 'Average fit score', value: dashData.avgMatchScore !== null ? `${dashData.avgMatchScore}%` : 'Set goals', accent: 'from-cyan-400 via-blue-500 to-indigo-500', icon: Target },
      { label: 'Saved watchlist', value: dashData.savedOppCount, accent: 'from-amber-400 via-orange-500 to-rose-500', icon: Award },
    ] satisfies Array<{ label: string; value: string | number; accent: string; icon: LucideIcon }>,
    [dashData.thisWeekCount, dashData.avgMatchScore, dashData.savedOppCount]
  )

  const [activityLog, setActivityLog] = useState<ActivityLog[]>([
    { id: '1', type: 'search', title: 'Searched: "Cloud Services"', timestamp: new Date(Date.now() - 3600000).toISOString(), icon: 'Search' },
    { id: '2', type: 'alert', title: 'Alert triggered: 3 new matches', timestamp: new Date(Date.now() - 7200000).toISOString(), icon: 'Bell' },
    { id: '3', type: 'ai', title: 'AI summary generated for 2 opportunities', timestamp: new Date(Date.now() - 14400000).toISOString(), icon: 'Brain' },
    { id: '4', type: 'share', title: 'Shared search with team', timestamp: new Date(Date.now() - 86400000).toISOString(), icon: 'Share2' },
  ])

  const [trendData] = useState<TrendData[]>([
    { month: 'Jan', opportunities: 240, matches: 45 },
    { month: 'Feb', opportunities: 310, matches: 68 },
    { month: 'Mar', opportunities: 280, matches: 52 },
    { month: 'Apr', opportunities: 390, matches: 87 },
    { month: 'May', opportunities: 450, matches: 123 },
    { month: 'Jun', opportunities: 520, matches: 156 },
  ])

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showAiPanel, setShowAiPanel] = useState(false)
  const [selectedOpp, setSelectedOpp] = useState<OpportunityCard | null>(null)

  const recentAlerts: Alert[] = dashData.activeSearches.slice(0, 4).map((search) => ({
    id: search.id,
    name: search.name,
    frequency: 'REAL_TIME',
    active: true,
    matchesCount: search.newCount ?? 0,
    lastRun: undefined,
  }))

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

  const primarySearch = dashData.activeSearches[0]

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-[var(--color-bg)] text-[var(--color-text-primary)]"
      style={{ fontFamily: 'var(--font-ui), system-ui, sans-serif' }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-60" style={{ background: 'radial-gradient(circle at 20% 0%, rgba(14,165,233,0.18), transparent 60%)' }} aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 opacity-50" style={{ background: 'radial-gradient(circle at 80% 100%, rgba(236,72,153,0.18), transparent 65%)' }} aria-hidden="true" />
      <div className="pg-dashboard-modern relative z-10 min-h-screen">
      {/* Toast */}
      {toast && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 pointer-events-none">
          <div className={clsx('relative w-full max-w-xl mx-4 rounded-2xl shadow-2xl border-2 p-5',
            toast.type === 'success' && 'border-emerald-400 bg-emerald-50',
            toast.type === 'error' && 'border-rose-400 bg-rose-50')}>
            <div className="flex items-center gap-3 pointer-events-auto">
              {toast.type === 'success' && <CheckCircle className="h-6 w-6 text-emerald-600 flex-shrink-0" />}
              {toast.type === 'error' && <AlertCircle className="h-6 w-6 text-rose-600 flex-shrink-0" />}
              <p className={clsx('flex-1 text-sm font-medium', toast.type === 'success' && 'text-emerald-800', toast.type === 'error' && 'text-rose-800')}>{toast.message}</p>
              <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
            </div>
          </div>
        </div>
      )}
      {/* Action Drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeDrawer} />
          <div className="pg-drawer-shell absolute right-0 top-0 h-full w-full sm:w-[520px] max-w-full bg-gradient-to-br from-slate-900/95 to-slate-950/95 border-l border-white/10 shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div className="text-white font-bold text-lg">
                {drawer === 'activeSearches' && 'Active Searches'}
                {drawer === 'savedOpps' && 'Saved Opportunities'}
                {drawer === 'matchInfo' && 'Match Score'}
                {drawer === 'notifications' && 'Notifications'}
                {drawer === 'settings' && 'Settings'}
                {drawer === 'goalSetup' && 'Set My Business Goals'}
              </div>
              <button
                onClick={closeDrawer}
                className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-white/10 transition"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-slate-200" />
              </button>
            </div>

            <div className="pg-drawer-body p-5 overflow-y-auto h-[calc(100%-64px)]">
              {drawer === 'activeSearches' && (
                <div>
                  <p className="text-slate-300 text-sm mb-4">These are your saved searches. Click one to run it.</p>

                  <div className="space-y-3">
                    {dashData.activeSearches.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => goToSearch(s)}
                        className="pg-drawer-item w-full text-left group rounded-2xl border border-white/10 bg-slate-900/60 hover:bg-slate-900 px-4 py-4 transition"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-white font-semibold group-hover:text-cyan-300 transition">
                              {s.name}
                            </div>
                            <div className="text-xs text-slate-400 mt-1">
                              Query: <span className="text-slate-200">"{s.query}"</span>
                              {s.filters?.naics ? (
                                <span className="ml-2 text-cyan-300 font-mono">NAICS {s.filters.naics}</span>
                              ) : null}
                              {s.filters?.state ? (
                                <span className="ml-2 text-slate-300">State {s.filters.state}</span>
                              ) : null}
                              {s.filters?.agency ? <span className="ml-2 text-slate-300">{s.filters.agency}</span> : null}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {typeof s.newCount === 'number' && s.newCount > 0 && (
                              <span className="px-2 py-1 rounded-full bg-red-500 text-white text-xs font-bold">
                                +{s.newCount}
                              </span>
                            )}
                            <span className="px-2 py-1 rounded-full bg-cyan-500/15 text-cyan-300 text-xs font-bold border border-cyan-500/25">
                              {s.resultsCount ?? '--'} results
                            </span>
                            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-200 transition" />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="mt-5">
                    <Link
                      href="/search"
                      onClick={() => closeDrawer()}
                      className="block w-full text-center rounded-xl py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold transition"
                    >
                      Go to Search
                    </Link>
                  </div>
                </div>
              )}

              {drawer === 'savedOpps' && (
                <div>
                  <p className="text-slate-300 text-sm mb-4">Your saved opportunities live here. Click one to open it.</p>

                  <div className="space-y-3">
                    {dashData.savedOpportunities.map((o) => (
                      <button
                        key={o.noticeId}
                        onClick={() => goToSavedOpp(o)}
                        className="pg-drawer-item w-full text-left group rounded-2xl border border-white/10 bg-slate-900/60 hover:bg-slate-900 px-4 py-4 transition"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-white font-semibold group-hover:text-purple-300 transition truncate">
                              {o.title}
                            </div>
                            <div className="text-xs text-slate-400 mt-1 flex flex-wrap gap-2">
                              <span className="text-slate-300">{o.agency}</span>
                              {o.naics ? <span className="text-cyan-300 font-mono">NAICS {o.naics}</span> : null}
                              {o.posted ? <span>Posted {o.posted}</span> : null}
                              {o.deadline ? <span className="text-orange-300">Closes in {o.deadline}</span> : null}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {typeof o.match === 'number' && (
                              <span className="px-2 py-1 rounded-lg bg-green-500/15 text-green-300 text-xs font-bold border border-green-500/25">
                                {o.match}% Match
                              </span>
                            )}
                            {o.value ? (
                              <span className="px-2 py-1 rounded-lg bg-slate-800/60 text-slate-200 text-xs font-bold border border-white/10">
                                {o.value}
                              </span>
                            ) : null}
                            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-200 transition" />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="mt-5">
                    <button
                      onClick={() => {
                        router.push(`/opportunities${buildQueryString({ saved: '1' })}`);
                        closeDrawer();
                      }}
                      className="w-full rounded-xl py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold transition"
                    >
                      View All Saved Opportunities
                    </button>
                  </div>
                </div>
              )}

              {drawer === 'recentMatches' && (
                <div>
                  <p className="text-slate-300 text-sm mb-4">Live feed of the freshest matches we pulled for you this week.</p>

                  {dashData.recentOpportunities.length === 0 ? (
                    <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 text-center text-slate-400 text-sm">
                      No live matches yet. Run a search to populate this list.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {dashData.recentOpportunities.map((opp) => (
                        <button
                          key={opp.noticeId}
                          onClick={() => goToSavedOpp(opp)}
                          className="w-full text-left group rounded-2xl border border-white/10 bg-slate-900/60 hover:bg-slate-900 px-4 py-4 transition"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-white font-semibold group-hover:text-emerald-300 transition truncate">
                                {opp.title}
                              </div>
                              <div className="text-xs text-slate-400 mt-1 flex flex-wrap gap-3">
                                <span className="font-semibold text-slate-200">
                                  <span className="text-slate-500 font-bold uppercase tracking-wide mr-1">Agency</span>
                                  {opp.agency}
                                </span>
                                {opp.naics ? (
                                  <span className="font-semibold text-cyan-200">
                                    <span className="text-cyan-500 font-bold uppercase tracking-wide mr-1">NAICS</span>
                                    {opp.naics}
                                  </span>
                                ) : null}
                                {opp.posted ? (
                                  <span>
                                    <span className="text-slate-500 font-bold uppercase tracking-wide mr-1">Posted</span>
                                    {opp.posted}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1 shrink-0 text-right">
                              {typeof opp.match === 'number' && (
                                <span className="px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 text-xs font-bold border border-emerald-500/25">
                                  {opp.match}% match
                                </span>
                              )}
                              {opp.deadline ? (
                                <span className="text-xs font-semibold text-orange-300">
                                  <span className="text-orange-500 font-bold uppercase tracking-wide mr-1">Deadline</span>
                                  {opp.deadline}
                                </span>
                              ) : null}
                              {opp.value ? (
                                <span className="text-xs text-slate-200 font-semibold">
                                  <span className="text-slate-500 font-bold uppercase tracking-wide mr-1">Value</span>
                                  {formatCurrency(opp.value)}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <button
                      onClick={() => {
                        router.push('/search')
                        closeDrawer()
                      }}
                      className="flex-1 rounded-xl py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold transition"
                    >
                      Run New Search
                    </button>
                    <button
                      onClick={closeDrawer}
                      className="flex-1 rounded-xl py-3 bg-slate-800/70 hover:bg-slate-800 text-slate-100 font-semibold border border-white/10 transition"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}

              {drawer === 'deadlines' && (
                <div>
                  <p className="text-slate-300 text-sm mb-4">Deadlines that need attention in the next two weeks.</p>

                  {dashData.upcomingDeadlines.length === 0 ? (
                    <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6 text-center text-slate-400 text-sm">
                      No approaching deadlines yet. Save opportunities to start tracking them here.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {dashData.upcomingDeadlines.map((deadline, idx) => (
                        <div key={`${deadline.title}-${idx}`} className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-white font-semibold">{deadline.title}</div>
                              <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                                <span className="text-slate-500 font-bold uppercase tracking-wide">Agency</span>
                                <span className="inline-flex items-center gap-1 text-slate-200">
                                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                                  {deadline.agency}
                                </span>
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-orange-300 flex items-center justify-end gap-1">
                                <span className="text-orange-500 font-bold uppercase tracking-wide">Deadline</span>
                                <Clock className="w-4 h-4" />
                                {deadline.deadline}
                              </p>
                              {deadline.value ? (
                                <p className="text-xs text-slate-300 mt-1">
                                  <span className="text-slate-500 font-bold uppercase tracking-wide mr-1">Value</span>
                                  {deadline.value}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <button
                      onClick={() => {
                        router.push('/opportunities')
                        closeDrawer()
                      }}
                      className="flex-1 rounded-xl py-3 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-semibold transition"
                    >
                      Review Pipeline
                    </button>
                    <button
                      onClick={closeDrawer}
                      className="flex-1 rounded-xl py-3 bg-slate-800/70 hover:bg-slate-800 text-slate-100 font-semibold border border-white/10 transition"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}

              {drawer === 'matchInfo' && (
                <div className="space-y-4">
                  <p className="text-slate-300 text-sm">
                    <span className="text-white font-semibold">Match</span> is a score (0?100) that estimates how well an opportunity fits your business and saved search intent.
                  </p>

                  <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                    <div className="text-white font-semibold mb-2">What it represents</div>
                    <ul className="text-sm text-slate-300 space-y-2">
                      <li>? NAICS alignment (your selected NAICS vs solicitation NAICS)</li>
                      <li>? Keyword relevance (title + description vs your search terms)</li>
                      <li>? Agency preference (e.g., DoD, DHS, etc.)</li>
                      <li>? Set-aside fit (if you filter small business, SDVOSB, etc.)</li>
                      <li>? Recency and deadline urgency (optional weighting)</li>
                    </ul>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                    <div className="text-white font-semibold mb-2">Why your Avg Match can change</div>
                    <p className="text-sm text-slate-300">
                      As new opportunities arrive, your average will shift depending on how many high-fit vs low-fit records appear in your feed and saved lists.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        router.push('/insights');
                        closeDrawer();
                      }}
                      className="flex-1 rounded-xl py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold transition"
                    >
                      Open Insights
                    </button>
                    <button
                      onClick={closeDrawer}
                      className="flex-1 rounded-xl py-3 bg-slate-800/70 hover:bg-slate-800 text-slate-100 font-semibold border border-white/10 transition"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}

              {/* Notifications Drawer */}
              {drawer === 'notifications' && (
                <div>
                  <p className="text-slate-400 text-sm mb-6">
                    Stay updated with your latest opportunity matches and deadlines
                  </p>
                  <div className="space-y-3">
                    {dashData.notifications.map((notif, index) => {
                      const IconComponent = notifIconMap[notif.iconType] || Activity;
                      return (
                        <div
                          key={index}
                          className="p-4 bg-slate-800/40 hover:bg-slate-800/60 rounded-xl border border-white/10 hover:border-white/20 transition-all cursor-pointer"
                        >
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-slate-700/50 rounded-lg">
                              <IconComponent className={`w-5 h-5 ${notifColorMap[notif.iconType] || 'text-slate-400'}`} />
                            </div>
                            <div className="flex-1">
                              <p className="text-white font-semibold text-sm mb-1">{notif.title}</p>
                              <p className="text-slate-400 text-xs">{notif.time}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-6">
                    <button
                      onClick={() => {
                        closeDrawer();
                        router.push('/opportunities');
                      }}
                      className="w-full px-4 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      View All Opportunities
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}


              {/* Goal Setup Drawer */}
              {drawer === 'goalSetup' && (
                <div className="space-y-5">
                  <p className="text-slate-300 text-sm">
                    Tell us what contracts you're pursuing. We'll use this to compute your <span className="text-white font-semibold">Match Score</span> and personalize your AI analysis.
                  </p>

                  <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 space-y-3">
                    <div className="text-white font-semibold text-sm">Your business goals <span className="text-slate-400 font-normal">(one per line)</span></div>
                    <textarea
                      value={goalInput}
                      onChange={e => setGoalInput(e.target.value)}
                      placeholder={"e.g.\nCybersecurity contracts for DHS\n8(a) set-aside opportunities\nIT modernization — NAICS 541512\nDoD construction projects"}
                      rows={6}
                      className="w-full rounded-xl bg-slate-800/70 border border-white/10 text-white text-sm p-3 focus:outline-none focus:border-cyan-500/50 resize-none placeholder-slate-500"
                    />
                    <p className="text-xs text-slate-400">Include NAICS codes, agencies, set-aside types, or keywords you specialize in.</p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                    <div className="text-white font-semibold text-sm mb-3">Quick picks</div>
                    <div className="flex flex-wrap gap-2">
                      {['IT & Cybersecurity', 'Construction & Engineering', 'Healthcare & Medical', '8(a) Set-Asides', 'SDVOSB Contracts', 'HUBZone Opportunities', 'WOSB Contracts', 'DoD Contracts', 'GSA Schedules', 'IDIQ Vehicles'].map(t => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setGoalInput(prev => prev ? `${prev}\n${t}` : t)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-700/60 border border-white/10 text-slate-200 text-xs font-semibold hover:bg-slate-700 hover:border-cyan-500/30 transition"
                        >
                          <Plus className="w-3 h-3" />{t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={saveGoals}
                    disabled={goalSaving || !goalInput.trim()}
                    className="w-full rounded-xl py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 text-white font-semibold transition flex items-center justify-center gap-2"
                  >
                    {goalSaving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : <><CheckCircle className="w-4 h-4" />Save Goals & Compute Match Score</>}
                  </button>
                </div>
              )}

              {/* Settings Drawer */}
              {drawer === 'settings' && (
                <div>
                  <p className="text-slate-400 text-sm mb-6">
                    Manage your account preferences and notification settings
                  </p>
                  <div className="space-y-4">
                    {/* Profile Section */}
                    <div className="p-4 bg-slate-800/40 rounded-xl border border-white/10">
                      <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-cyan-400" />
                        Profile
                      </h3>
                      <div className="space-y-2 text-sm">
                        <p className="text-slate-300">Name: <span className="text-white font-semibold">{welcomeName}</span></p>
                        <p className="text-slate-300">Email: <span className="text-white font-semibold">{session?.user?.email}</span></p>
                        <button onClick={() => { closeDrawer(); router.push('/account'); }} className="mt-2 text-cyan-400 hover:text-cyan-300 transition-colors font-medium">
                          Edit Profile ?
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="pg-container py-8">

        {/* Header Section */}
        <div className="mb-12 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 animate-in fade-in duration-500">
          <div>
            <h1 className="text-4xl sm:text-5xl font-black text-white mb-2">Welcome to your personalized Analytics Intelligence Hub</h1>
            <p className="text-slate-400 text-lg">Your gateway to federal contracting opportunities</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Link href="/search" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold hover:opacity-90 transition-all shadow-lg hover:shadow-xl">
              <Search className="h-5 w-5" /> New Search
            </Link>
            <Link href="/alerts" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold transition-colors">
              <Bell className="h-5 w-5" /> Manage Alerts
            </Link>
          </div>
        </div>

        <div className="mb-12 grid gap-8 rounded-[32px] border border-[var(--color-border)] bg-gradient-to-r from-[var(--color-surface)] via-[var(--color-surface-muted)] to-[var(--color-surface)] p-6 text-[var(--color-text-primary)] shadow-[0_30px_80px_-50px_rgba(14,165,233,0.45)] md:p-10 lg:grid-cols-[1.2fr,0.9fr]">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-muted)]/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-[var(--color-text-secondary)]">
              Live Mock Feed
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Beta</span>
            </div>
            <div>
              <p className="text-sm text-[var(--color-text-secondary)]">Hello {welcomeName},</p>
              <h2 className="mt-2 text-3xl font-black text-[var(--color-text-primary)] sm:text-4xl">Your pipeline is refreshing with new intelligence every few seconds.</h2>
              <p className="mt-3 max-w-2xl text-sm text-[var(--color-text-secondary)] sm:text-base">
                We blend saved searches, AI scoring, and deadline risk to keep the dashboard readable. Watch the live counters update as new opportunities stream in.
              </p>
            </div>
            {primarySearch && (
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm text-[var(--color-text-secondary)] shadow-inner">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-xs font-bold uppercase tracking-[0.25em] text-[var(--color-text-tertiary)]">Featured Search</span>
                  <span className="rounded-full bg-cyan-500/10 px-3 py-0.5 text-xs font-semibold text-cyan-700">
                    {primarySearch.resultsCount ?? '--'} results · +{primarySearch.newCount ?? 0} new
                  </span>
                </div>
                <p className="mt-2 text-base font-semibold text-[var(--color-text-primary)]">{primarySearch.name}</p>
                <p className="text-xs text-[var(--color-text-secondary)]">Keywords: “{primarySearch.query}” · NAICS {primarySearch.filters?.naics ?? '—'} · {primarySearch.filters?.setaside ?? 'No set-aside filter'}</p>
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {heroHighlights.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.label} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-lg">
                  <div className={`mb-4 h-10 w-10 rounded-xl bg-gradient-to-r ${item.accent} flex items-center justify-center text-white`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="text-xs uppercase tracking-[0.25em] text-[var(--color-text-tertiary)]">{item.label}</p>
                  <p className="mt-3 text-3xl font-black text-[var(--color-text-primary)]">{dashData.loading ? '—' : item.value}</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">Auto-refreshed mock data</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="pg-card-grid mb-12 animate-in fade-in duration-500 stagger">
          {summaryCards.map(({ label, value, icon: Icon, color, subtext, onClick }) => (
            <div
              key={label}
              role={onClick ? 'button' : undefined}
              tabIndex={onClick ? 0 : undefined}
              onClick={onClick}
              onKeyDown={(event) => {
                if (onClick && (event.key === 'Enter' || event.key === ' ')) {
                  event.preventDefault()
                  onClick()
                }
              }}
              className={clsx(
                'rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-[var(--color-text-primary)] shadow-[0_20px_45px_-25px_rgba(15,23,42,0.35)] transition-all group hover:-translate-y-1 hover:shadow-2xl',
                onClick ? 'cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60' : 'cursor-default',
              )}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={clsx('rounded-xl p-3 bg-gradient-to-br', color)}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                {onClick ? (
                  <button type="button" className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition" aria-label="View details">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                ) : (
                  <div className="text-[var(--color-text-tertiary)] text-sm font-semibold">Live</div>
                )}
              </div>
              <div className="text-[var(--color-text-secondary)] text-sm font-semibold tracking-wide">{label}</div>
              <div className="mt-2 text-3xl font-black text-[var(--color-text-primary)]">
                {dashData.loading ? <Loader2 className="h-6 w-6 animate-spin" /> : value ?? '—'}
              </div>
              {subtext ? <p className="text-[var(--color-text-secondary)] text-sm mt-1">{subtext}</p> : null}
            </div>
          ))}
        </div>

      <div className="pg-container py-8">
        {/* -- New user empty state: no data yet -- */}
        {!dashData.loading && dashData.activeSearchesCount === 0 && dashData.savedOppCount === 0 && (
          <div className="mb-8 rounded-2xl border border-dashed border-white/20 bg-slate-900/40 p-8 text-center animate-fadeInUp">
            <div className="flex flex-col items-center gap-4 max-w-md mx-auto">
              <div className="p-4 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-2xl border border-cyan-500/20">
                <Target className="w-8 h-8 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg mb-1">Welcome — let's get you started</h3>
                <p className="text-slate-400 text-sm">Your dashboard will show real data once you run your first search and save opportunities. Start by telling us what you're looking for.</p>
              </div>
              <div className="flex flex-wrap gap-3 justify-center">
                <button onClick={() => setDrawer('goalSetup')} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold text-sm transition">
                  <Target className="w-4 h-4" /> Set My Goals
                </button>
                <Link href="/search" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold text-sm transition">
                  <Search className="w-4 h-4" /> Run First Search
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* -- Claude AI Analysis Panel -- */}
        {(dashData.savedOppCount > 0 || dashData.recentOpportunities.length > 0) && (
          <div className="mb-8 animate-fadeInUp" style={{ animationDelay: '0.25s' }}>
            <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-purple-500/20 to-blue-600/20 border border-purple-500/20 rounded-lg">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <div className="text-white font-semibold text-sm">
                      {claudeAnalysis ? 'AI Augmented Analyticcs by Precise Govcon Intelligence' : 'Get AI Analysis'}
                    </div>
                    <div className="text-slate-400 text-xs">
                      Precise Govcon Intelligence will analyze your pipeline and surface priorities
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={analyzeWithClaude}
                    disabled={analysisLoading}
                    className="text-xs text-purple-400 hover:text-purple-300 font-semibold transition"
                  >
                    {analysisLoading ? 'Analyzing…' : 'Refresh'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

          {/* Sidebar */}
          <div className="space-y-8 animate-in fade-in duration-500 delay-100">

            {/* Recent Alerts */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-6">
              <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                <Bell className="h-5 w-5 text-orange-400" /> Your Alerts
              </h3>
              <div className="space-y-3">
                {recentAlerts.map((alert) => (
                  <Link key={alert.id} href={`/alerts/${alert.id}`} className="block p-3 rounded-lg bg-slate-700/40 hover:bg-slate-700/60 border border-slate-600 hover:border-slate-500 transition-all group">
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-semibold text-sm text-white group-hover:text-cyan-300 transition-colors line-clamp-2">{alert.name}</p>
                      <span className={clsx('text-xs font-bold px-2 py-0.5 rounded-full', alert.active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-500/20 text-slate-400')}>{alert.active ? '● Active' : '⏸ Paused'}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>{alert.frequency.replace('_', ' ')}</span>
                      <span className="text-emerald-400 font-semibold">{alert.matchesCount} matches</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{alert.lastRun ? `Last run ${formatRelative(alert.lastRun)}` : 'Never run'}</p>
                  </Link>
                ))}
              </div>
              <Link href="/alerts" className="mt-4 flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold transition-colors">
                <Plus className="h-4 w-4" /> New Alert
              </Link>
            </div>

            {/* AI Insights */}
            <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 backdrop-blur-sm rounded-2xl border border-purple-700/50 p-6 hover:border-purple-600 transition-all">
              <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-amber-400" /> AI Insights
              </h3>
              <p className="text-sm text-slate-300 mb-4">Based on your activity and profile, here are top recommendations:</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 text-purple-400 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-300">Your cybersecurity expertise matches 3 high-value DoD contracts</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 text-purple-400 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-300">SDVOSB set-aside opportunities trending up (+45% this month)</span>
                </li>
                <li className="flex items-start gap-2">
                  <ChevronRight className="h-4 w-4 text-purple-400 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-300">Cloud services demand peaks in Q3. Start prep now.</span>
                </li>
              </ul>
              <button onClick={() => setShowAiPanel(true)} className="mt-5 w-full py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold text-sm hover:opacity-90 transition-opacity">
                <Brain className="h-4 w-4 inline mr-2" /> Get AI Recommendations
              </button>
            </div>

            {/* Activity Feed */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-6">
              <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                <Activity className="h-5 w-5 text-cyan-400" /> Recent Activity
              </h3>
              <div className="space-y-4 text-sm">
                {activityLog.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 pb-3 border-b border-slate-700 last:border-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0">
                      {log.type === 'search' && <Search className="h-4 w-4 text-cyan-400" />}
                      {log.type === 'alert' && <Bell className="h-4 w-4 text-orange-400" />}
                      {log.type === 'ai' && <Brain className="h-4 w-4 text-purple-400" />}
                      {log.type === 'share' && <Share2 className="h-4 w-4 text-blue-400" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-slate-300 font-medium">{log.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{formatRelative(log.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Trends Chart */}
        <div className="mt-12 bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-8 animate-in fade-in duration-500">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-emerald-400" /> Market Trends
          </h2>
          <div className="grid grid-cols-6 gap-3">
            {trendData.map((point) => (
              <div key={point.month} className="flex flex-col items-center">
                <div className="relative w-full h-32 mb-2 flex items-end justify-center gap-1">
                  <div className="flex-1 bg-gradient-to-t from-cyan-500 to-cyan-400 rounded-t-lg opacity-70" style={{ height: `${(point.opportunities / 520) * 100}%` }} title={`${point.opportunities} opportunities`}></div>
                  <div className="flex-1 bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-lg" style={{ height: `${(point.matches / 156) * 100}%` }} title={`${point.matches} matches`}></div>
                </div>
                <p className="text-xs font-bold text-slate-300">{point.month}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-6 mt-8 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
              <span className="text-slate-400">Total Opportunities</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span className="text-slate-400">Your Matches</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Panel Overlay */}
      {showAiPanel && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-b border-slate-700 px-8 py-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">AI Assistant</h2>
              </div>
              <button onClick={() => setShowAiPanel(false)} className="p-2 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div className="bg-slate-700/40 rounded-xl p-6 border border-slate-600">
                <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-400" /> Smart Recommendations
                </h3>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li className="flex items-start gap-2">
                    <Award className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Pursue DoD IT Contracts</p>
                      <p className="text-xs text-slate-400 mt-0.5">Your team's DoD 8(a) certification and security clearances align perfectly with 12 active RFPs valued at $45M+ total</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <TrendingUp className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Timing: Cloud Services Boom</p>
                      <p className="text-xs text-slate-400 mt-0.5">36% increase in cloud modernization RFPs in Q2. Your cloud expertise is in high demand—prepare proposals now</p>
                    </div>
                  </li>
                </ul>
              </div>
              <button onClick={() => setShowAiPanel(false)} className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold hover:opacity-90 transition-opacity">
                Generate Full Analysis
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Opportunity Detail Modal */}
      {selectedOpp && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-slate-700/50 border-b border-slate-600 px-8 py-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Opportunity Details</h2>
              <button onClick={() => setSelectedOpp(null)} className="p-2 hover:bg-slate-600 rounded-lg text-slate-300 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold px-3 py-1 rounded-lg bg-orange-500/20 text-orange-300">{selectedOpp.type}</span>
                  {selectedOpp.setAside && <span className="text-xs bg-purple-500/20 text-purple-300 px-3 py-1 rounded-lg">{selectedOpp.setAside}</span>}
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{selectedOpp.title}</h3>
                <p className="text-slate-400 mb-4">{selectedOpp.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-700/40 rounded-lg p-4">
                  <p className="text-xs text-slate-400 mb-1">Agency</p>
                  <p className="font-bold text-white">{selectedOpp.agency}</p>
                </div>
                <div className="bg-slate-700/40 rounded-lg p-4">
                  <p className="text-xs text-slate-400 mb-1">Contract Value</p>
                  <p className="font-bold text-emerald-400">{formatCurrency(selectedOpp.value)}</p>
                </div>
                {selectedOpp.location && <div className="bg-slate-700/40 rounded-lg p-4">
                  <p className="text-xs text-slate-400 mb-1">Location</p>
                  <p className="font-bold text-white flex items-center gap-1"><MapPin className="h-4 w-4" /> {selectedOpp.location}</p>
                </div>}
                <div className="bg-slate-700/40 rounded-lg p-4">
                  <p className="text-xs text-slate-400 mb-1">Due Date</p>
                  <p className="font-bold text-white">{new Date(selectedOpp.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </div>
              </div>

              {selectedOpp.aiSummary && <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-xl p-4 border border-purple-700/50">
                <p className="text-xs text-purple-300 font-semibold mb-2 flex items-center gap-1"><Brain className="h-4 w-4" /> AI ASSESSMENT</p>
                <p className="text-sm text-slate-300">{selectedOpp.aiSummary}</p>
              </div>}

              <div className="flex gap-3 pt-4 border-t border-slate-700">
                <button className="flex-1 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                  <Download className="h-4 w-4" /> View Solicitation
                </button>
                <button className="flex-1 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold transition-colors flex items-center justify-center gap-2">
                  <Share2 className="h-4 w-4" /> Share
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

