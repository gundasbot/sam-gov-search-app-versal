// app/dashboard/page.tsx
'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useSession as useAuthSession } from 'next-auth/react'
import {
  Search, Bell, TrendingUp, Zap, BarChart3, Users, Brain, Calendar,
  FileText, DollarSign, Filter, Plus, ArrowRight, Loader2, CheckCircle,
  AlertCircle, X, Eye, Download, Share2, Settings, ChevronRight,
  Activity, Clock, Target, Award, Rocket, ArrowUpRight, ArrowDownRight,
  MapPin, Building2, AlertTriangle, Lightbulb, RefreshCw, Grid3X3, List,
  Sparkles
} from 'lucide-react'
import { useSmartAnalytics, MOCK_AI_INSIGHTS, shouldLoadLiveAnalytics } from '@/hooks/useSmartAnalytics'
import { getPersonalizedGreeting, getTimeOfDayEmoji } from '@/lib/greeting'

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

type TrendData = {
  month: string
  opportunities: number
  matches: number
}

// ─── Utilities ────────────────────────────────────────────────────────────────
function clsx(...c: Array<string | boolean | null | undefined>) {
  return c.filter(Boolean).join(' ')
}

function formatRelative(d?: string | null) {
  if (!d) return 'Never'
  const diff = Date.now() - new Date(d).getTime()
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (hours < 1) return 'Just now'
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

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

// ─── Main Component ───────────────────────────────────────────────────────────
function DashboardContent() {
  const { data: session } = useAuthSession()
  const [loading, setLoading] = useState(true)
  const [aiInsightsRequested, setAiInsightsRequested] = useState(false)
  const aiInsights = useSmartAnalytics('insights', session?.user?.id, {})

  const [stats, setStats] = useState<DashboardStats>({
    totalAlerts: 12,
    activeAlerts: 10,
    newMatches: 47,
    savedSearches: 8,
    teamMembers: 3,
    totalWatchlist: 156,
  })

  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([
    { id: '1', name: 'IT Professional Services - GSA', frequency: 'DAILY', active: true, matchesCount: 3, lastRun: new Date(Date.now() - 2 * 3600000).toISOString() },
    { id: '2', name: 'Cybersecurity - SDVOSB Virginia', frequency: 'REAL_TIME', active: true, matchesCount: 8, lastRun: new Date(Date.now() - 1800000).toISOString() },
    { id: '3', name: 'Construction & Facilities', frequency: 'WEEKLY', active: true, matchesCount: 12, lastRun: new Date(Date.now() - 86400000).toISOString() },
  ])

  const [opportunities, setOpportunities] = useState<OpportunityCard[]>([
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
      id: '3',
      title: 'Cloud Services - General Services Administration',
      agency: 'GSA',
      type: 'RFQ',
      value: 1500000,
      dueDate: new Date(Date.now() + 10 * 86400000).toISOString(),
      matchScore: 76,
      description: 'Managed cloud services platform supporting federal agencies with compliance, monitoring, and support.',
      naics: '518210',
      location: 'Remote',
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

  if (loading) {
    return (
      <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1a2332 25%, #1f2937 50%, #1a1f2e 75%, #0f172a 100%)' }} className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-teal-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-300 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1a2332 25%, #1f2937 50%, #1a1f2e 75%, #0f172a 100%)' }} className="min-h-screen">
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

      {/* Main Content */}
      <div className="mx-auto max-w-[1920px] px-3 sm:px-6 lg:px-8 py-8">

        {/* Header Section */}
        <div className="mb-6 text-center animate-in fade-in duration-500">
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-2">
            <span className="text-2xl sm:text-3xl mr-2">{getTimeOfDayEmoji()}</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
              {getPersonalizedGreeting(session?.user?.name)}
            </span>
          </h1>
          <p className="text-slate-300 textm max-w-2xl mx-auto mb-4">Welcome to your federal contracting opportunities</p>
          <div className="flex gap-2 flex-wrap justify-center">
            <Link href="/search" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-teal-600 to-teal-500 text-white font-bold hover:from-teal-700 hover:to-teal-600 transition-all shadow-md hover:shadow-lg transform hover:scale-105 text-xs">
              <Search className="h-4 w-4" /> New Search
            </Link>
            <Link href="/alerts" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold hover:from-orange-700 hover:to-orange-600 transition-all shadow-md hover:shadow-lg transform hover:scale-105 text-xs">
              <Bell className="h-4 w-4" /> Manage Alerts
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-6 animate-in fade-in duration-500 stagger">
          {[
            { label: 'Active Alerts', value: stats.activeAlerts, icon: Bell, color: 'from-orange-500 to-orange-600', subtext: `of ${stats.totalAlerts} total` },
            { label: 'New Matches', value: stats.newMatches, icon: Zap, color: 'from-emerald-500 to-teal-500', subtext: 'This week' },
            { label: 'Saved Searches', value: stats.savedSearches, icon: Search, color: 'from-teal-500 to-cyan-500', subtext: 'Quick access' },
            { label: 'Watchlist Items', value: stats.totalWatchlist, icon: Target, color: 'from-purple-500 to-pink-500', subtext: 'Opportunities' },
            { label: 'Team Members', value: stats.teamMembers, icon: Users, color: 'from-blue-500 to-cyan-500', subtext: 'Collaborating' },
            { label: 'This Month', value: '127', icon: Calendar, color: 'from-orange-500 to-amber-500', subtext: 'Opportunities' },
          ].map(({ label, value, icon: Icon, color, subtext }) => (
            <div key={label} className="bg-gradient-to-br from-slate-800/70 to-slate-800/40 backdrop-blur-sm border border-slate-700 rounded-2xl p-4 hover:border-slate-600 transition-all group cursor-pointer hover:bg-slate-800/60 shadow-lg">
              <div className="flex items-start justify-between mb-3">
                <div className={clsx('rounded-lg p-2 bg-gradient-to-br', color, 'shadow-lg shadow-opacity-30')}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-teal-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wide mb-0.5">{label}</p>
              <p className="text-3xl font-black text-white mb-1">{value}</p>
              <p className="text-xs text-slate-500">{subtext}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
          {/* Main Column - Opportunities */}
          <div className="lg:col-span-2 space-y-5 animate-in fade-in duration-500">

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-slate-800/70 to-slate-800/40 backdrop-blur-sm border border-slate-700 rounded-2xl p-5 shadow-lg">
              <h2 className="text-lg font-black text-white mb-4 flex items-center gap-2">
                <Rocket className="h-5 w-5 text-teal-400" /> Quick Actions
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: Search, label: 'Search SAM.gov', desc: 'Find new opportunities', href: '/search', color: 'from-teal-500 to-cyan-600' },
                  { icon: Brain, label: 'AI Assistant', desc: 'Get smart recommendations', action: () => setShowAiPanel(true), color: 'from-purple-500 to-pink-500' },
                  { icon: BarChart3, label: 'View Analytics', desc: 'Track your metrics', href: '/dashboard', color: 'from-emerald-500 to-teal-500' },
                  { icon: Users, label: 'Team Workspace', desc: 'Collaborate with team', href: '/account', color: 'from-blue-500 to-cyan-500' },
                ].map(({ icon: Icon, label, desc, href, action, color }) => {
                  const content = (
                    <>
                      <div className={clsx('rounded-lg p-2.5 bg-gradient-to-br', color, 'w-fit mb-3 shadow-lg')}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <p className="font-bold text-white text-sm mb-0.5">{label}</p>
                      <p className="text-xs text-slate-400">{desc}</p>
                    </>
                  )

                  if (href) {
                    return (
                      <Link
                        key={label}
                        href={href}
                        className="text-left p-5 rounded-xl border border-slate-700 hover:border-slate-600 bg-gradient-to-br from-slate-700/40 to-slate-800/40 hover:from-slate-700/60 hover:to-slate-800/60 transition-all group shadow-md"
                      >
                        {content}
                      </Link>
                    )
                  }

                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={action}
                      className="text-left p-5 rounded-xl border border-slate-700 hover:border-slate-600 bg-gradient-to-br from-slate-700/40 to-slate-800/40 hover:from-slate-700/60 hover:to-slate-800/60 transition-all group shadow-md"
                    >
                      {content}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Top Matching Opportunities */}
            <div className="bg-gradient-to-br from-slate-800/70 to-slate-800/40 backdrop-blur-sm border border-slate-700 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <Target className="h-5 w-5 text-teal-400" /> Top Matches for You
                  </h2>
                  <p className="text-slate-400 text-xs mt-1">AI-ranked opportunities based on your profile</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setViewMode('grid')} className={clsx('p-2 rounded-lg transition-colors', viewMode === 'grid' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-400 hover:text-white')}>
                    <Grid3X3 className="h-5 w-5" />
                  </button>
                  <button onClick={() => setViewMode('list')} className={clsx('p-2 rounded-lg transition-colors', viewMode === 'list' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-400 hover:text-white')}>
                    <List className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {opportunities.map((opp) => (
                    <div key={opp.id} onClick={() => setSelectedOpp(opp)} className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 border border-slate-600 rounded-xl p-4 hover:border-cyan-500/50 transition-all cursor-pointer group hover:shadow-xl hover:shadow-cyan-500/10">
                      <div className="flex items-start justify-between mb-3">
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
          <div className="space-y-5 animate-in fade-in duration-500 delay-100">

            {/* AI Insights - Featured - On-Demand Loading */}
            <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/40 backdrop-blur-sm rounded-2xl border border-purple-700/60 p-6 shadow-lg hover:shadow-purple-500/10 transition-all">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-amber-400" /> AI Insights
                </h3>
                <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
                  aiInsights.isCached || aiInsights.data
                    ? 'bg-green-600/30 border-green-500/30 text-green-300'
                    : 'bg-purple-600/30 border-purple-500/30 text-purple-300'
                }`}>
                  {aiInsights.isCached ? 'Cached' : 'Personalized'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mb-4 font-medium">
                {aiInsights.data ? 'Live insights based on your activity:' : 'Click "Load Insights" to get AI-powered recommendations'}
              </p>

              <div className="space-y-3 mb-5">
                {aiInsights.loading ? (
                  // Loading state
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-sm text-slate-400">Generating insights...</p>
                  </div>
                ) : aiInsights.error && aiInsightsRequested ? (
                  // Error state
                  <div className="bg-red-900/20 border border-red-700/40 rounded-lg p-4 text-center">
                    <AlertCircle className="h-5 w-5 text-red-400 mx-auto mb-2" />
                    <p className="text-sm text-red-300">{aiInsights.error}</p>
                  </div>
                ) : aiInsights.data && aiInsightsRequested ? (
                  // Live insights data
                  aiInsights.data.map((insight: any, idx: number) => (
                    <div key={idx} className="bg-purple-900/30 border border-purple-700/40 rounded-lg p-3.5 hover:bg-purple-900/40 transition-all">
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                          idx === 0 ? 'bg-gradient-to-r from-purple-400 to-pink-400' :
                          idx === 1 ? 'bg-gradient-to-r from-emerald-400 to-cyan-400' :
                          'bg-gradient-to-r from-orange-400 to-amber-400'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-bold text-sm mb-1">{insight.title || insight.name}</p>
                          <p className="text-xs text-slate-400 mb-2">{insight.description}</p>
                          <div className="flex items-center gap-1.5">
                            <div className="flex-1 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full`} style={{
                                width: `${insight.confidence || insight.strength || 85}%`,
                                background: 'linear-gradient(to right, rgb(168, 85, 247), rgb(236, 72, 153))'
                              }}></div>
                            </div>
                            <span className="text-xs text-purple-300 font-bold">{insight.confidence || insight.strength || 85}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  // Default mock insights
                  MOCK_AI_INSIGHTS.map((insight, idx) => (
                    <div key={idx} className="bg-purple-900/30 border border-purple-700/40 rounded-lg p-3.5 hover:bg-purple-900/40 transition-all cursor-pointer group">
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                          idx === 0 ? 'bg-gradient-to-r from-purple-400 to-pink-400' :
                          idx === 1 ? 'bg-gradient-to-r from-emerald-400 to-cyan-400' :
                          'bg-gradient-to-r from-orange-400 to-amber-400'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-bold text-sm mb-1">{insight.title}</p>
                          <p className="text-xs text-slate-400 mb-2">{insight.description}</p>
                          <div className="flex items-center gap-1.5">
                            <div className="flex-1 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" style={{ width: `${insight.matchScore}%` }}></div>
                            </div>
                            <span className="text-xs text-purple-300 font-bold">{insight.matchScore}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setAiInsightsRequested(true)
                    aiInsights.loadAnalytics()
                  }}
                  disabled={aiInsights.loading}
                  className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-1.5 ${
                    aiInsights.loading
                      ? 'bg-purple-600/50 text-purple-200 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 hover:shadow-xl hover:shadow-purple-500/20'
                  }`}
                >
                  {aiInsights.loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading...
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4" /> {aiInsights.data ? 'Refresh' : 'Load Insights'}
                    </>
                  )}
                </button>
                <Link href="/search" className="flex-1 py-2.5 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-white font-bold text-sm transition-all text-center flex items-center justify-center gap-1.5">
                  <Search className="h-4 w-4" /> Search
                </Link>
              </div>

              {aiInsights.lastUpdated && (
                <p className="text-xs text-slate-500 mt-3 text-center">
                  Updated {new Date(aiInsights.lastUpdated).toLocaleTimeString()}
                </p>
              )}
            </div>

            {/* Recent Alerts */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-5">
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <Bell className="h-4 w-4 text-orange-400" /> Your Alerts
              </h3>
              <div className="space-y-3">
                {recentAlerts.map((alert) => (
                  <Link key={alert.id} href="/alerts/manage-alerts" className="block p-3 rounded-lg bg-slate-700/40 hover:bg-slate-700/60 border border-slate-600 hover:border-slate-500 transition-all group">
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

            {/* Activity Feed */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-5">
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <Activity className="h-4 w-4 text-cyan-400" /> Recent Activity
              </h3>
              <div className="space-y-3 text-xs">
                {activityLog.map((log) => (
                  <div key={log.id} className="flex items-start gap-2.5 pb-2 border-b border-slate-700 last:border-0">
                    <div className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0">
                      {log.type === 'search' && <Search className="h-3.5 w-3.5 text-cyan-400" />}
                      {log.type === 'alert' && <Bell className="h-3.5 w-3.5 text-orange-400" />}
                      {log.type === 'ai' && <Brain className="h-3.5 w-3.5 text-purple-400" />}
                      {log.type === 'share' && <Share2 className="h-3.5 w-3.5 text-blue-400" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-slate-300 font-medium text-xs">{log.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{formatRelative(log.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Trends Chart */}
        <div className="mt-8 bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-5 animate-in fade-in duration-500">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-400" /> Market Trends
          </h2>
          <div className="grid grid-cols-6 gap-2">
            {trendData.map((point) => (
              <div key={point.month} className="flex flex-col items-center">
                <div className="relative w-full h-24 mb-1.5 flex items-end justify-center gap-1">
                  <div className="flex-1 bg-gradient-to-t from-cyan-500 to-cyan-400 rounded-t-lg opacity-70" style={{ height: `${(point.opportunities / 520) * 100}%` }} title={`${point.opportunities} opportunities`}></div>
                  <div className="flex-1 bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-lg" style={{ height: `${(point.matches / 156) * 100}%` }} title={`${point.matches} matches`}></div>
                </div>
                <p className="text-xs font-bold text-slate-300">{point.month}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-4 mt-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
              <span className="text-slate-400 text-xs">Total Opportunities</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <span className="text-slate-400 text-xs">Your Matches</span>
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
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center"><Loader2 className="h-8 w-8 text-cyan-400 animate-spin" /></div>}>
      <DashboardContent />
    </Suspense>
  )
}

