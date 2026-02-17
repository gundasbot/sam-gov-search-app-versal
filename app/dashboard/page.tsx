// app/dashboard/page.tsx - Dashboard with Real Data + AI Match Scoring
'use client';

import { useSession } from 'next-auth/react';
import {
  Search,
  Bell,
  TrendingUp,
  Bookmark,
  Clock,
  ArrowRight,
  Filter,
  Download,
  Target,
  FileText,
  MapPin,
  Building2,
  Activity,
  BarChart3,
  Eye,
  Heart,
  Share2,
  Settings,
  X,
  ChevronRight,
  Sparkles,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Plus,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// Helper to get user's first name or email-based name
function getWelcomeName(session: any) {
  const name = String(session?.user?.name ?? '').trim();
  if (name) {
    const firstName = name.split(/\s+/)[0];
    return firstName || name;
  }

  // Fallback to email-based name
  const email = String(session?.user?.email ?? '').trim();
  if (!email) return 'there';

  const local = email.split('@')[0] ?? '';
  const cleaned = local.replace(/[._-]+/g, ' ').trim();
  if (!cleaned) return 'there';

  return cleaned
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

type DrawerKey = 'activeSearches' | 'savedOpps' | 'matchInfo' | 'notifications' | 'settings' | 'goalSetup' | null;

type ActiveSearch = {
  id: string;
  name: string;
  query: string;
  filters?: Record<string, string>;
  resultsCount?: number;
  newCount?: number;
};

type SavedOpportunity = {
  id?: string;
  noticeId: string;
  title: string;
  agency: string;
  value?: string;
  posted?: string;
  deadline?: string;
  match?: number;
  naics?: string;
  location?: string;
  saved?: boolean;
};

type DashboardStats = {
  activeSearchesCount: number;
  savedOppCount: number;
  avgMatchScore: number | null;    // null = not yet computed
  thisWeekCount: number;
  activeSearches: ActiveSearch[];
  savedOpportunities: SavedOpportunity[];
  recentOpportunities: SavedOpportunity[];
  notifications: Array<{ type: string; title: string; time: string; iconType: string }>;
  upcomingDeadlines: Array<{ title: string; agency: string; deadline: string; value: string }>;
  userGoals: string[];
  loading: boolean;
  error: string | null;
};

/** Score 0-100: how well an opportunity matches the user's saved search profile */
function computeOpportunityMatchScore(
  opp: SavedOpportunity,
  savedSearches: ActiveSearch[],
  userGoals: string[]
): number {
  if (!savedSearches.length && !userGoals.length) return 0;

  const oppText = `${opp.title} ${opp.agency} ${opp.naics ?? ''}`.toLowerCase();
  let score = 0;
  let signals = 0;

  // Signal 1: NAICS overlap with saved searches
  const savedNaics = savedSearches
    .map(s => s.filters?.naics)
    .filter(Boolean) as string[];
  if (savedNaics.length && opp.naics) {
    const naicsMatch = savedNaics.some(n => opp.naics?.startsWith(n.slice(0, 4)));
    score += naicsMatch ? 40 : 0;
    signals++;
  }

  // Signal 2: Keyword overlap with saved search queries
  const savedKeywords = savedSearches.flatMap(s =>
    s.query.toLowerCase().split(/\s+/).filter(w => w.length > 3)
  );
  if (savedKeywords.length) {
    const hits = savedKeywords.filter(kw => oppText.includes(kw)).length;
    score += Math.min(30, (hits / savedKeywords.length) * 60);
    signals++;
  }

  // Signal 3: User goal keyword overlap
  if (userGoals.length) {
    const goalWords = userGoals
      .join(' ').toLowerCase()
      .split(/\s+/).filter(w => w.length > 3);
    const goalHits = goalWords.filter(w => oppText.includes(w)).length;
    score += Math.min(30, (goalHits / Math.max(goalWords.length, 1)) * 60);
    signals++;
  }

  if (!signals) return 0;
  return Math.min(99, Math.max(50, Math.round(score)));
}

function buildQueryString(params: Record<string, string | number | undefined | null>) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    sp.set(k, String(v));
  });
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

// ── Utility: format a date as relative string ─────────────────────────────────
function formatRelativeDate(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} minute${mins !== 1 ? 's' : ''} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? 's' : ''} ago`;
}

function formatDaysUntil(dateStr: string): string {
  const days = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
  if (days < 0) return 'Expired';
  return `${days} day${days !== 1 ? 's' : ''}`;
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const welcomeName = useMemo(() => getWelcomeName(session), [session]);

  const [drawer, setDrawer] = useState<DrawerKey>(null);

  // ── Real data state ──────────────────────────────────────────────────────────
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

  // ── AI analysis state ────────────────────────────────────────────────────────
  const [claudeAnalysis, setClaudeAnalysis] = useState<{
    summary: string;
    topOpportunities: Array<{ title: string; reason: string; urgency: 'high' | 'medium' | 'low' }>;
    recommendations: string[];
  } | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  // ── Goal setup state ─────────────────────────────────────────────────────────
  const [goalInput, setGoalInput] = useState('');
  const [goalSaving, setGoalSaving] = useState(false);

  // ── Fetch all real data on mount ─────────────────────────────────────────────
  useEffect(() => {
    if (!session?.user?.email) return;

    async function loadDashboard() {
      try {
        const [searchesRes, savedOppsRes, weeklyRes, profileRes, notificationsRes] =
          await Promise.allSettled([
            fetch('/api/saved-searches').then(r => r.ok ? r.json() : { searches: [] }),
            fetch('/api/saved-opportunities').then(r => r.ok ? r.json() : { opportunities: [] }),
            fetch('/api/opportunities/weekly-count').then(r => r.ok ? r.json() : { count: 0, recent: [] }),
            fetch('/api/account/profile').then(r => r.ok ? r.json() : { goals: [] }),
            fetch('/api/notifications?limit=5').then(r => r.ok ? r.json() : { notifications: [] }),
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
                resultsCount: s.resultsCount ?? undefined,
                newCount: s.newResults ?? s.newCount ?? 0,
              }))
            : [];

        const savedOpps: SavedOpportunity[] =
          savedOppsRes.status === 'fulfilled'
            ? (savedOppsRes.value?.opportunities ?? []).map((o: any) => ({
                noticeId: o.noticeId || o.id,
                title: o.title || 'Untitled',
                agency: o.agency || o.department || '',
                value: o.awardValue || o.value || undefined,
                posted: o.postedDate ? formatRelativeDate(o.postedDate) : undefined,
                deadline: o.responseDeadLine ? formatDaysUntil(o.responseDeadLine) : undefined,
                naics: o.naicsCode || o.naics || undefined,
              }))
            : [];

        const weeklyData =
          weeklyRes.status === 'fulfilled' ? weeklyRes.value : { count: 0, recent: [] };

        const profile =
          profileRes.status === 'fulfilled' ? profileRes.value : { goals: [] };

        const goals: string[] = profile?.goals ?? [];

        // ── Compute match scores against real saved-search profile ──
        const scoredSavedOpps = savedOpps.map(o => ({
          ...o,
          match: computeOpportunityMatchScore(o, searches, goals),
        }));

        const recentOpps: SavedOpportunity[] =
          (weeklyData.recent ?? []).slice(0, 3).map((o: any) => ({
            noticeId: o.noticeId || o.id,
            title: o.title || 'Untitled',
            agency: o.agency || o.department || '',
            value: o.awardValue || o.value || undefined,
            posted: o.postedDate ? formatRelativeDate(o.postedDate) : undefined,
            deadline: o.responseDeadLine ? formatDaysUntil(o.responseDeadLine) : undefined,
            naics: o.naicsCode || o.naics || undefined,
            match: computeOpportunityMatchScore(o, searches, goals),
          }));

        const notifs =
          notificationsRes.status === 'fulfilled'
            ? (notificationsRes.value?.notifications ?? []).map((n: any) => ({
                type: n.type || 'update',
                title: n.message || n.title || '',
                time: n.createdAt ? formatRelativeDate(n.createdAt) : '',
                iconType: n.type || 'update',
              }))
            : [];

        // ── Avg match across all scored items ──
        const allScored = [...scoredSavedOpps, ...recentOpps].filter(o => o.match);
        const avgMatch =
          allScored.length > 0
            ? Math.round(allScored.reduce((sum, o) => sum + (o.match ?? 0), 0) / allScored.length)
            : null;

        // ── Upcoming deadlines sorted by urgency ──
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
          thisWeekCount: weeklyData.count ?? 0,
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

  // ── Save user goals ──────────────────────────────────────────────────────────
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

  // ── Claude AI analysis ───────────────────────────────────────────────────────
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

  // ── Navigation helpers ───────────────────────────────────────────────────────
  const closeDrawer = () => setDrawer(null);

  const goToSearch = (s: ActiveSearch) => {
    router.push(`/search${buildQueryString({ q: s.query, naics: s.filters?.naics, state: s.filters?.state, setaside: s.filters?.setaside, type: s.filters?.type, agency: s.filters?.agency, saved_search_id: s.id })}`);
    closeDrawer();
  };

  const goToSavedOpp = (o: SavedOpportunity) => {
    router.push(`/opportunities${buildQueryString({ saved: '1', noticeId: o.noticeId, naics: o.naics })}`);
    closeDrawer();
  };

  // ── Stat cards ───────────────────────────────────────────────────────────────
  const stats = useMemo(() => [
    {
      label: 'Active Searches',
      value: dashData.loading ? '—' : String(dashData.activeSearchesCount || 0),
      change: dashData.activeSearchesCount > 0 ? `${dashData.activeSearchesCount} saved` : 'None yet',
      icon: Search, gradient: 'from-cyan-500 to-blue-600',
      onClick: () => setDrawer('activeSearches'),
      hint: 'See your saved searches', loading: dashData.loading,
    },
    {
      label: 'Saved Opportunities',
      value: dashData.loading ? '—' : String(dashData.savedOppCount || 0),
      change: dashData.savedOppCount > 0 ? `${dashData.savedOppCount} tracked` : 'None yet',
      icon: Bookmark, gradient: 'from-purple-500 to-pink-600',
      onClick: () => setDrawer('savedOpps'),
      hint: 'Open your saved list', loading: dashData.loading,
    },
    {
      label: 'Avg Match Score',
      value: dashData.loading ? '—' : dashData.avgMatchScore !== null ? `${dashData.avgMatchScore}%` : 'Set goals →',
      change: dashData.avgMatchScore !== null ? 'Based on your profile' : 'Not computed yet',
      icon: Target, gradient: 'from-green-500 to-emerald-600',
      onClick: () => setDrawer(dashData.avgMatchScore === null ? 'goalSetup' : 'matchInfo'),
      hint: dashData.avgMatchScore === null ? 'Click to set goals' : 'What does Match mean?',
      loading: dashData.loading,
    },
    {
      label: 'This Week',
      value: dashData.loading ? '—' : String(dashData.thisWeekCount || 0),
      change: dashData.thisWeekCount > 0 ? 'New postings' : 'None yet',
      icon: TrendingUp, gradient: 'from-orange-500 to-red-600',
      onClick: () => router.push(`/opportunities${buildQueryString({ postedRange: '7d' })}`),
      hint: "View this week's postings", loading: dashData.loading,
    },
  ], [dashData, router]);

  const notifIconMap: Record<string, any> = { match: Target, deadline: Clock, update: Activity };
  const notifColorMap: Record<string, string> = { match: 'text-cyan-400', deadline: 'text-orange-400', update: 'text-purple-400' };

  // kept for savedSearches tile section
  const savedSearchTiles = dashData.activeSearches.slice(0, 3).map((s, i) => ({
    name: s.name,
    count: s.resultsCount ?? 0,
    new: s.newCount ?? 0,
    color: ['from-cyan-500 to-blue-600', 'from-purple-500 to-pink-600', 'from-orange-500 to-red-600'][i % 3],
  }));


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      {/* Header - DYNAMIC NAME */}
      <section className="border-b border-white/5 bg-slate-900/30 backdrop-blur-xl sticky top-0 z-10">
        <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-start sm:items-center justify-between gap-4">
            <div className="animate-fadeInLeft min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 truncate">Welcome back, {welcomeName}</h1>
              <p className="text-sm text-slate-400">Here's what's happening with your contracts today</p>
            </div>

            <div className="flex items-center gap-2 animate-fadeInRight flex-shrink-0">
              <button 
                onClick={() => setDrawer('notifications')}
                className="relative p-3 bg-slate-800/50 hover:bg-slate-800 rounded-xl border border-white/10 transition-all duration-300 hover:scale-105"
              >
                <Bell className="w-5 h-5 text-slate-300" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              </button>
              <button 
                onClick={() => setDrawer('settings')}
                className="p-3 bg-slate-800/50 hover:bg-slate-800 rounded-xl border border-white/10 transition-all duration-300 hover:scale-105"
              >
                <Settings className="w-5 h-5 text-slate-300" />
              </button>
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
                    <span className="text-white font-semibold">Match</span> is a score (0�100) that estimates how well an opportunity fits your business and saved search intent.
                  </p>

                  <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                    <div className="text-white font-semibold mb-2">What it represents</div>
                    <ul className="text-sm text-slate-300 space-y-2">
                      <li>� NAICS alignment (your selected NAICS vs solicitation NAICS)</li>
                      <li>� Keyword relevance (title + description vs your search terms)</li>
                      <li>� Agency preference (e.g., DoD, DHS, etc.)</li>
                      <li>� Set-aside fit (if you filter small business, SDVOSB, etc.)</li>
                      <li>� Recency and deadline urgency (optional weighting)</li>
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
                        <button className="mt-2 text-cyan-400 hover:text-cyan-300 transition-colors font-medium">
                          Edit Profile ?
                        </button>
                      </div>
                    </div>

                    {/* Notifications Settings */}
                    <div className="p-4 bg-slate-800/40 rounded-xl border border-white/10">
                      <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <Bell className="w-4 h-4 text-purple-400" />
                        Notifications
                      </h3>
                      <div className="space-y-3">
                        <label className="flex items-center justify-between cursor-pointer">
                          <span className="text-slate-300 text-sm">Email notifications</span>
                          <input type="checkbox" defaultChecked className="w-4 h-4 rounded bg-slate-700 border-slate-600" />
                        </label>
                        <label className="flex items-center justify-between cursor-pointer">
                          <span className="text-slate-300 text-sm">New opportunity alerts</span>
                          <input type="checkbox" defaultChecked className="w-4 h-4 rounded bg-slate-700 border-slate-600" />
                        </label>
                        <label className="flex items-center justify-between cursor-pointer">
                          <span className="text-slate-300 text-sm">Deadline reminders</span>
                          <input type="checkbox" defaultChecked className="w-4 h-4 rounded bg-slate-700 border-slate-600" />
                        </label>
                      </div>
                    </div>

                    {/* Opportunity Preferences */}
                    <div className="p-4 bg-slate-800/40 rounded-xl border border-white/10">
                      <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <Target className="w-4 h-4 text-green-400" />
                        Opportunity Preferences
                      </h3>
                      <button
                        onClick={() => {
                          closeDrawer();
                          router.push('/opportunities');
                        }}
                        className="w-full text-left text-sm text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
                      >
                        Update Preferences ?
                      </button>
                    </div>

                    {/* Account Actions */}
                    <div className="p-4 bg-slate-800/40 rounded-xl border border-white/10">
                      <h3 className="text-white font-semibold mb-3">Account</h3>
                      <div className="space-y-2">
                        <button
                          onClick={() => router.push('/pricing')}
                          className="w-full text-left text-sm text-slate-300 hover:text-white transition-colors py-2"
                        >
                          View Plan & Billing
                        </button>
                        <button
                          onClick={() => router.push('/api/auth/signout')}
                          className="w-full text-left text-sm text-red-400 hover:text-red-300 transition-colors py-2"
                        >
                          Sign Out
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

      <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 py-8">
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

                  <div className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-white/10 group-hover:border-white/20 transition-all">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className={`p-2 sm:p-3 bg-gradient-to-br ${stat.gradient} rounded-xl`}>
                      <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
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

        {/* ── New user empty state: no data yet ── */}
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

        {/* ── Claude AI Analysis Panel ── */}
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
                  {dashData.userGoals.length === 0 && (
                    <button onClick={() => setDrawer('goalSetup')} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-slate-800/60 hover:bg-slate-800 text-slate-200 font-semibold text-sm transition">
                      <Target className="w-4 h-4" /> Set Goals First
                    </button>
                  )}
                  <button onClick={analyzeWithClaude} disabled={analysisLoading} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 disabled:opacity-50 text-white font-semibold text-sm transition">
                    {analysisLoading ? <><Loader2 className="w-4 h-4 animate-spin" />Analyzing...</> : <><Sparkles className="w-4 h-4" />Analyze with AI</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 sm:gap-8">
          {/* Main Content */}
          <div className="xl:col-span-8 space-y-6 sm:space-y-8">
            {/* Recent Opportunities */}
            <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-white/10 animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-white">Recent Opportunities</h2>
                    <p className="text-xs sm:text-sm text-slate-400">Your top matches from the last 24 hours</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button className="p-2 bg-slate-800/50 hover:bg-slate-700 rounded-lg border border-white/10 transition-all duration-300 hover:scale-105">
                    <Filter className="w-4 h-4 text-slate-300" />
                  </button>

                  <Link
                    href="/search"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg font-semibold text-sm transition-all duration-300 hover:scale-105"
                  >
                    View All
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              <div className="space-y-4">
                {dashData.recentOpportunities.map((opp, index) => (
                  <div
                    key={opp.noticeId}
                    role="button"
                    tabIndex={0}
                    onClick={() => router.push(`/opportunities${buildQueryString({ noticeId: String(opp.noticeId) })}`)}

                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        router.push(`/opportunities${buildQueryString({ noticeId: String(opp.noticeId) })}`);
                      }
                    }}
                    className="group bg-slate-900/50 rounded-xl p-5 border border-white/5 hover:border-cyan-500/30 hover:translate-x-1 transition-all duration-300 cursor-pointer animate-slideInLeft outline-none focus:ring-2 focus:ring-cyan-400/40"
                    style={{ animationDelay: `${0.4 + index * 0.1}s` }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="text-base sm:text-lg font-semibold text-white group-hover:text-cyan-400 transition-colors">
                            {opp.title}
                          </h3>
                          <div className="px-2 py-1 rounded-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 flex-shrink-0">
                            <span className="text-green-400 font-bold text-xs">{opp.match}% Match</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm text-slate-400 mb-3">
                          <div className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">{opp.agency}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>{opp.location}</span>
                          </div>
                          <span className="font-mono text-cyan-400 text-xs">{opp.naics}</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm">
                          <div className="flex items-center gap-1 text-slate-400">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Posted {opp.posted}</span>
                          </div>
                          <div className="flex items-center gap-1 text-orange-400">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Closes in {opp.deadline}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 sm:ml-4 flex-shrink-0">
                        <div className="text-lg sm:text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                          {opp.value}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); }}
                            className={`p-1.5 sm:p-2 rounded-lg transition-all duration-300 hover:scale-110 ${
                              opp.saved ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700'
                            }`}
                            aria-label="Save"
                          >
                            <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${opp.saved ? 'fill-current' : ''}`} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); }}
                            className="p-1.5 sm:p-2 bg-slate-800/50 hover:bg-slate-700 rounded-lg text-slate-400 transition-all duration-300 hover:scale-110"
                            aria-label="Share"
                          >
                            <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); router.push(`/opportunities${buildQueryString({ noticeId: String(opp.id) })}`); }}
                            className="p-1.5 sm:p-2 bg-slate-800/50 hover:bg-slate-700 rounded-lg text-slate-400 transition-all duration-300 hover:scale-110"
                            aria-label="View"
                          >
                            <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Saved Searches */}
            <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-white/10 animate-fadeInUp" style={{ animationDelay: '0.5s' }}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
                    <Search className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Saved Searches</h2>
                    <p className="text-sm text-slate-400">Quick access to your favorite searches</p>
                  </div>
                </div>

                <button onClick={() => setDrawer('activeSearches')} className="text-cyan-400 hover:text-cyan-300 text-sm font-semibold transition-colors">
                  Manage
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {savedSearchTiles.map((search, index) => (
                  <div
                    key={index}
                    role="button"
                    tabIndex={0}
                    onClick={() => setDrawer('activeSearches')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setDrawer('activeSearches');
                      }
                    }}
                    className="group relative cursor-pointer animate-scaleIn hover:scale-105 transition-all duration-300 text-left outline-none focus:ring-2 focus:ring-cyan-400/40 rounded-xl"
                    style={{ animationDelay: `${0.6 + index * 0.1}s` }}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${search.color} opacity-0 group-hover:opacity-100 transition-opacity rounded-xl blur-lg`}></div>

                    <div className="relative bg-slate-900/50 rounded-xl p-4 border border-white/5 group-hover:border-white/10 transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-white group-hover:text-cyan-400 transition-colors">
                          {search.name}
                        </h3>
                        {search.new > 0 && (
                          <span className="px-2 py-1 rounded-full bg-red-500 text-white text-xs font-bold animate-pulse">
                            {search.new}
                          </span>
                        )}
                      </div>
                      <div className="text-2xl font-bold text-white mb-1">{search.count}</div>
                      <div className="text-sm text-slate-400">opportunities</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="xl:col-span-4 space-y-6">
            {/* Notifications */}
            <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-white/10 animate-fadeInRight" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-lg font-bold text-white">Notifications</h2>
                </div>
                <span className="px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-bold">3</span>
              </div>

              <div className="space-y-3">
                {dashData.notifications.map((notif, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg hover:bg-slate-900 transition-all duration-300 cursor-pointer animate-slideInRight"
                    style={{ animationDelay: `${0.4 + index * 0.1}s` }}
                  >
                    <div className={`p-2 bg-slate-800 rounded-lg`}>
                      {(() => { const IC = notifIconMap[notif.iconType] || Activity; return <IC className={`w-4 h-4 ${notifColorMap[notif.iconType] || 'text-slate-400'}`} />; })()}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-white mb-1">{notif.title}</p>
                      <p className="text-xs text-slate-400">{notif.time}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button className="w-full mt-4 py-2 text-center text-cyan-400 hover:text-cyan-300 text-sm font-semibold transition-colors">
                View All Notifications
              </button>
            </div>

            {/* Upcoming Deadlines */}
            <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-white/10 animate-fadeInRight" style={{ animationDelay: '0.5s' }}>
              <div className="flex items-center gap-2 mb-6">
                <Clock className="w-5 h-5 text-orange-400" />
                <h2 className="text-lg font-bold text-white">Upcoming Deadlines</h2>
              </div>

              <div className="space-y-4">
                {dashData.upcomingDeadlines.map((deadline, index) => (
                  <div
                    key={index}
                    className="pb-4 border-b border-white/5 last:border-0 last:pb-0 animate-fadeInUp"
                    style={{ animationDelay: `${0.6 + index * 0.1}s` }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-sm font-semibold text-white flex-1">{deadline.title}</h3>
                      <span className="text-orange-400 text-sm font-bold whitespace-nowrap ml-2">
                        {deadline.deadline}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">{deadline.agency}</span>
                      <span className="text-cyan-400 font-semibold">{deadline.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-white/10 animate-fadeInRight" style={{ animationDelay: '0.7s' }}>
              <h2 className="text-lg font-bold text-white mb-4">Quick Actions</h2>

              <div className="space-y-2">
                <Link
                  href="/search"
                  className="w-full flex items-center gap-3 p-3 bg-slate-900/50 hover:bg-slate-900 rounded-lg text-left transition-all duration-300 group hover:translate-x-1"
                >
                  <Search className="w-5 h-5 text-cyan-400" />
                  <span className="text-white group-hover:text-cyan-400 transition-colors">New Search</span>
                </Link>

                <Link
                  href="/insights"
                  className="w-full flex items-center gap-3 p-3 bg-slate-900/50 hover:bg-slate-900 rounded-lg text-left transition-all duration-300 group hover:translate-x-1"
                >
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                  <span className="text-white group-hover:text-purple-400 transition-colors">View Insights</span>
                </Link>

                <button className="w-full flex items-center gap-3 p-3 bg-slate-900/50 hover:bg-slate-900 rounded-lg text-left transition-all duration-300 group hover:translate-x-1">
                  <Download className="w-5 h-5 text-green-400" />
                  <span className="text-white group-hover:text-green-400 transition-colors">Export Data</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fadeInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fadeInUp {
          animation: fadeInUp 0.8s ease-out forwards;
          opacity: 0;
        }

        .animate-fadeInLeft {
          animation: fadeInLeft 0.8s ease-out forwards;
          opacity: 0;
        }

        .animate-fadeInRight {
          animation: fadeInRight 0.8s ease-out forwards;
          opacity: 0;
        }

        .animate-slideInLeft {
          animation: slideInLeft 0.6s ease-out forwards;
          opacity: 0;
        }

        .animate-slideInRight {
          animation: slideInRight 0.6s ease-out forwards;
          opacity: 0;
        }

        .animate-scaleIn {
          animation: scaleIn 0.6s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
}