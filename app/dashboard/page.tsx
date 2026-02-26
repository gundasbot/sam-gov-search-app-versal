// app/dashboard/page.tsx
'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import {
  Search, Bell, TrendingUp, Zap, BarChart3, Users, Brain, Calendar,
  FileText, DollarSign, Filter, Plus, ArrowRight, Loader2, CheckCircle,
  AlertCircle, X, Eye, Download, Share2, Settings, ChevronRight,
  Activity, Clock, Target, Award, Rocket, ArrowUpRight, ArrowDownRight,
  MapPin, Building2, AlertTriangle, Lightbulb, RefreshCw, Grid3X3, List
} from 'lucide-react'

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

type DashboardStats = {
  totalAlerts: number
  activeAlerts: number
  newMatches: number
  savedSearches: number
  teamMembers: number
  totalWatchlist: number
}

type ActivityLog = {
  id: string
  type: 'search' | 'alert' | 'save' | 'share' | 'ai'
  title: string
  timestamp: string
  icon: string
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

// ─── Utilities ────────────────────────────────────────────────────────────────
function clsx(...c: Array<string | boolean | null | undefined>) {
  return c.filter(Boolean).join(' ')
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const welcomeName = useMemo(() => getWelcomeName(session), [session]);

  const [drawer, setDrawer] = useState<DrawerKey>(null);

  // -- Real data state ----------------------------------------------------------
  const [dashData, setDashData] = useState<DashboardStats>({
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

  // -- Fetch all real data on mount ---------------------------------------------
  useEffect(() => {
    if (!session?.user?.email) return;

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
        const notifs = [
          ...scoredSavedOpps
            .filter(o => o.deadline && parseInt(o.deadline) <= 7 && !o.deadline.includes('Expired'))
            .slice(0, 2)
            .map(o => ({
              type: 'deadline',
              title: `Deadline in ${o.deadline}: ${o.title}`,
              time: o.agency,
              iconType: 'deadline',
            })),
          ...scoredSavedOpps.slice(0, 2).map(o => ({
            type: 'match',
            title: `Saved: ${o.title}`,
            time: o.posted ? `Posted ${o.posted}` : '',
            iconType: 'match',
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
      }
    }

    loadDashboard();
  }, [session?.user?.email]);

  // -- Save user goals ----------------------------------------------------------
  const saveGoals = useCallback(async () => {
    const goals = goalInput.split('\n').map((g: string) => g.trim()).filter(Boolean);
    setGoalSaving(true);
    try {
      await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goals }),
      });
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
  const stats = useMemo(() => [
    {
      id: '1',
      title: 'IT Infrastructure Modernization - Department of Defense',
      agency: 'DoD',
      type: 'RFP',
      value: 5000000,
      dueDate: new Date(Date.now() + 21 * 86400000).toISOString(),
      matchScore: 92,
      description: 'Comprehensive IT infrastructure overhaul including cloud migration, security hardening, and modern DevOps practices.',
      naics: '541512',
      setAside: 'Small Business',
      location: 'Washington, DC',
      aiSummary: 'High priority match. Strong alignment with your cybersecurity expertise. Estimated prep time: 2-3 weeks.'
    },
    {
      id: '2',
      title: 'Cybersecurity Services - Veterans Affairs',
      agency: 'VA',
      type: 'Solicitation',
      value: 2500000,
      dueDate: new Date(Date.now() + 14 * 86400000).toISOString(),
      matchScore: 88,
      description: 'Multi-year IDIQ contract for cybersecurity consulting, threat assessment, and incident response planning.',
      setAside: 'Service-Disabled Veteran-Owned',
      location: 'Multiple Locations',
    },
    {
      label: 'Avg Match Score',
      value: dashData.loading ? '—' : dashData.avgMatchScore !== null ? `${dashData.avgMatchScore}%` : 'Set goals ?',
      change: dashData.avgMatchScore !== null ? 'Based on your profile' : 'Not computed yet',
      icon: Target, gradient: 'from-green-500 to-emerald-600',
      onClick: () => setDrawer(dashData.avgMatchScore === null ? 'goalSetup' : 'matchInfo'),
      hint: dashData.avgMatchScore === null ? 'Click to set goals' : 'What does Match mean?',
      loading: dashData.loading,
    },
  ])

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
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    void fetchDashboardData()
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

  async function fetchDashboardData() {
    try {
      setLoading(true)
      // Mock API calls
      await new Promise(r => setTimeout(r, 800))
      setLoading(false)
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to load dashboard' })
      setLoading(false)
    }
  }

  return (
    <div className="pg-theme-cleanup min-h-screen">
      {/* Header - DYNAMIC NAME */}
      <section className="sticky top-0 z-10 border-b border-[#d9e2ef] bg-white/90 backdrop-blur-xl">
        <div className="pg-container py-6">
          <div className="flex items-start sm:items-center justify-between gap-4">
            <div className="animate-fadeInLeft min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 mb-1 truncate">Welcome back, {welcomeName}</h1>
              <p className="text-sm text-slate-600">Here's what's happening with your contracts today</p>
            </div>

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" style={{ fontFamily: "'Outfit', 'Segoe UI', system-ui, sans-serif" }}>
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
      </section>

      {/* Action Drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeDrawer} />
          <div className="absolute right-0 top-0 h-full w-full sm:w-[520px] max-w-full bg-gradient-to-br from-slate-900/95 to-slate-950/95 border-l border-white/10 shadow-2xl overflow-hidden flex flex-col">
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

            <div className="p-5 overflow-y-auto h-[calc(100%-64px)]">
              {drawer === 'activeSearches' && (
                <div>
                  <p className="text-slate-300 text-sm mb-4">These are your saved searches. Click one to run it.</p>

                  <div className="space-y-3">
                    {dashData.activeSearches.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => goToSearch(s)}
                        className="w-full text-left group rounded-2xl border border-white/10 bg-slate-900/60 hover:bg-slate-900 px-4 py-4 transition"
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
                        className="w-full text-left group rounded-2xl border border-white/10 bg-slate-900/60 hover:bg-slate-900 px-4 py-4 transition"
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

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-8 py-8">

        {/* Header Section */}
        <div className="mb-12 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 animate-in fade-in duration-500">
          <div>
            <h1 className="text-4xl sm:text-5xl font-black text-white mb-2">Intelligence Hub</h1>
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

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12 animate-in fade-in duration-500 stagger">
          {[
            { label: 'Active Alerts', value: stats.activeAlerts, icon: Bell, color: 'from-orange-500 to-red-500', subtext: `of ${stats.totalAlerts} total` },
            { label: 'New Matches', value: stats.newMatches, icon: Zap, color: 'from-emerald-500 to-teal-500', subtext: 'This week' },
            { label: 'Saved Searches', value: stats.savedSearches, icon: Search, color: 'from-cyan-500 to-blue-500', subtext: 'Quick access' },
            { label: 'Watchlist Items', value: stats.totalWatchlist, icon: Target, color: 'from-purple-500 to-pink-500', subtext: 'Opportunities' },
            { label: 'Team Members', value: stats.teamMembers, icon: Users, color: 'from-indigo-500 to-purple-500', subtext: 'Collaborating' },
            { label: 'This Month', value: '127', icon: Calendar, color: 'from-amber-500 to-orange-500', subtext: 'Opportunities' },
          ].map(({ label, value, icon: Icon, color, subtext }) => (
            <div key={label} className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-6 hover:border-slate-600 transition-all group cursor-pointer hover:bg-slate-800/70">
              <div className="flex items-start justify-between mb-4">
                <div className={clsx('rounded-xl p-3 bg-gradient-to-br', color)}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <ArrowUpRight className="h-5 w-5 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-slate-400 text-sm font-medium mb-1">{label}</p>
              <p className="text-3xl font-black text-white mb-2">{value}</p>
              <p className="text-xs text-slate-500">{subtext}</p>
            </div>
          ))}
        </div>

      <div className="pg-container py-8">
        {/* Quick Stats */}
        <section className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <button
                type="button"
                key={index}
                onClick={stat.onClick}
                className="group text-left relative animate-fadeInUp hover:-translate-y-1 transition-all duration-300 focus:outline-none"
                style={{ animationDelay: `${index * 0.1}s` }}
                aria-label={`${stat.label} - ${stat.hint ?? 'Open'}`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl blur-xl`}></div>

            {/* Quick Actions */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-8">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Rocket className="h-6 w-6 text-cyan-400" /> Quick Actions
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: Search, label: 'Search SAM.gov', desc: 'Find new opportunities', href: '/search', color: 'from-cyan-500 to-blue-600' },
                  { icon: Brain, label: 'AI Assistant', desc: 'Get smart recommendations', action: () => setShowAiPanel(true), color: 'from-purple-500 to-pink-500' },
                  { icon: BarChart3, label: 'View Analytics', desc: 'Track your metrics', href: '/analytics', color: 'from-emerald-500 to-teal-500' },
                  { icon: Users, label: 'Team Workspace', desc: 'Collaborate with team', href: '/team', color: 'from-indigo-500 to-purple-500' },
                ].map(({ icon: Icon, label, desc, href, action, color }) => (
                  <button key={label}
                    onClick={action}
                    as={href ? 'a' : 'button'}
                    href={href}
                    className="text-left p-4 rounded-xl border border-slate-700 hover:border-slate-600 bg-slate-700/30 hover:bg-slate-700/50 transition-all group"
                  >
                    <div className={clsx('rounded-lg p-2 bg-gradient-to-br', color, 'w-fit mb-3')}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-slate-400 text-xs sm:text-sm font-semibold">
                      {stat.change}
                    </span>
                  </div>
                  {stat.loading ? (
                    <div className="h-8 w-20 bg-slate-700/60 rounded-lg animate-pulse mb-1" />
                  ) : (
                    <div className="text-2xl sm:text-3xl font-bold text-white mb-1">{stat.value}</div>
                  )}
                  <div className="text-xs sm:text-sm text-slate-400 flex items-center justify-between gap-2">
                    <span>{stat.label}</span>
                    <span className="text-xs text-slate-500 group-hover:text-slate-300 transition hidden sm:inline">{stat.hint}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

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

        {/* -- Claude AI Analysis Panel -- */}
        {(dashData.savedOppCount > 0 || dashData.recentOpportunities.length > 0) && (
          <div className="mb-8 animate-fadeInUp" style={{ animationDelay: '0.25s' }}>
            {claudeAnalysis ? (
              <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-900/20 to-blue-900/20 p-5">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <div className="text-white font-bold">AI Analysis by Claude</div>
                      <div className="text-xs text-slate-400">Based on your saved searches, opportunities, and goals</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={analyzeWithClaude} disabled={analysisLoading} className="text-xs text-purple-400 hover:text-purple-300 font-semibold transition">Refresh</button>
                    <button onClick={() => setClaudeAnalysis(null)} className="p-1 rounded hover:bg-white/10 transition"><X className="w-4 h-4 text-slate-400" /></button>
                  </div>
                </div>
                <p className="text-slate-200 text-sm mb-4">{claudeAnalysis.summary}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs font-bold text-purple-400 uppercase mb-2">Top Priorities</div>
                    <div className="space-y-2">
                      {claudeAnalysis.topOpportunities.map((op, i) => (
                        <div key={i} className={`p-3 rounded-xl border text-sm ${op.urgency === 'high' ? 'bg-red-900/20 border-red-500/20' : op.urgency === 'medium' ? 'bg-amber-900/20 border-amber-500/20' : 'bg-slate-800/40 border-white/10'}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <AlertTriangle className={`w-3.5 h-3.5 flex-shrink-0 ${op.urgency === 'high' ? 'text-red-400' : op.urgency === 'medium' ? 'text-amber-400' : 'text-slate-400'}`} />
                            <span className="text-white font-semibold text-xs truncate">{op.title}</span>
                          </div>
                          <p className="text-slate-400 text-xs ml-5">{op.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-purple-400 uppercase mb-2">Recommendations</div>
                    <div className="space-y-2">
                      {claudeAnalysis.recommendations.map((rec, i) => (
                        <div key={i} className="flex items-start gap-2 p-3 rounded-xl border border-white/10 bg-slate-800/40">
                          <CheckCircle className="w-3.5 h-3.5 text-green-400 mt-0.5 flex-shrink-0" />
                          <span className="text-slate-200 text-xs">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl border border-white/10 bg-slate-900/40">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-purple-500/20 to-blue-600/20 border border-purple-500/20 rounded-lg">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <div className="text-white font-semibold text-sm">Get AI Analysis</div>
                    <div className="text-slate-400 text-xs">Claude will analyze your pipeline and surface priorities</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setViewMode('grid')} className={clsx('p-2 rounded-lg transition-colors', viewMode === 'grid' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white')}>
                    <Grid3X3 className="h-5 w-5" />
                  </button>
                  <button onClick={() => setViewMode('list')} className={clsx('p-2 rounded-lg transition-colors', viewMode === 'list' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white')}>
                    <List className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {opportunities.map((opp) => (
                    <div key={opp.id} onClick={() => setSelectedOpp(opp)} className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 border border-slate-600 rounded-xl p-6 hover:border-cyan-500/50 transition-all cursor-pointer group hover:shadow-xl hover:shadow-cyan-500/10">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={clsx('text-xs font-bold px-2 py-1 rounded-lg', opp.type === 'RFP' && 'bg-orange-500/20 text-orange-300', opp.type === 'RFQ' && 'bg-blue-500/20 text-blue-300', opp.type === 'Solicitation' && 'bg-emerald-500/20 text-emerald-300', opp.type === 'Notice' && 'bg-slate-500/20 text-slate-300')}>{opp.type}</span>
                            {opp.setAside && <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-lg">{opp.setAside.split(' ')[0]}</span>}
                          </div>
                          <h3 className="font-bold text-white text-sm mb-1 line-clamp-2 group-hover:text-cyan-300 transition-colors">{opp.title}</h3>
                        </div>
                        <div className={clsx('rounded-full p-2 bg-gradient-to-br', getMatchScoreColor(opp.matchScore), 'flex-shrink-0 text-white font-bold text-xs w-12 h-12 flex items-center justify-center')}>
                          {opp.matchScore}%
                        </div>
                      </div>
                      <p className="text-slate-400 text-xs mb-4 line-clamp-2">{opp.description}</p>
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">Agency</span>
                          <span className="text-slate-300 font-semibold">{opp.agency}</span>
                        </div>
                        {opp.value && <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">Contract Value</span>
                          <span className="text-emerald-400 font-semibold">{formatCurrency(opp.value)}</span>
                        </div>}
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">Due Date</span>
                          <span className={clsx('font-semibold', new Date(opp.dueDate).getTime() - Date.now() < 7 * 86400000 ? 'text-orange-400' : 'text-slate-300')}>{formatRelative(opp.dueDate)}</span>
                        </div>
                      </div>
                      <button className="w-full py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-sm hover:opacity-90 transition-opacity">
                        View Details
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {opportunities.map((opp) => (
                    <div key={opp.id} onClick={() => setSelectedOpp(opp)} className="bg-slate-700/40 border border-slate-600 rounded-xl p-4 hover:border-cyan-500/50 transition-all cursor-pointer hover:bg-slate-700/60 group">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-bold px-2 py-1 rounded-lg bg-orange-500/20 text-orange-300">{opp.type}</span>
                            {opp.setAside && <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-lg truncate">{opp.setAside}</span>}
                            <span className="text-xs text-slate-400 ml-auto">{opp.agency}</span>
                          </div>
                          <h3 className="font-bold text-white text-sm mb-1 line-clamp-2 group-hover:text-cyan-300 transition-colors">{opp.title}</h3>
                          <p className="text-slate-400 text-xs line-clamp-1">{opp.description}</p>
                        </div>
                        <div className={clsx('rounded-full p-2 bg-gradient-to-br', getMatchScoreColor(opp.matchScore), 'flex-shrink-0 text-white font-bold text-xs w-12 h-12 flex items-center justify-center')}>
                          {opp.matchScore}%
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-400 mt-3 pt-3 border-t border-slate-600">
                        <span>{opp.value ? formatCurrency(opp.value) : 'Value TBD'}</span>
                        <span className={new Date(opp.dueDate).getTime() - Date.now() < 7 * 86400000 ? 'text-orange-400 font-semibold' : ''}>{formatRelative(opp.dueDate)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <Link href="/opportunities" className="mt-6 flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-slate-600 hover:border-slate-500 text-slate-300 hover:text-white font-semibold transition-all">
                View All Opportunities <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

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
  );
}

