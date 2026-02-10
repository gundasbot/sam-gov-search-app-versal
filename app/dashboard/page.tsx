﻿// app/dashboard/page.tsx - Dashboard with Dynamic User Name + Actionable Stats
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
} from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
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

type DrawerKey = 'activeSearches' | 'savedOpps' | 'matchInfo' | 'notifications' | 'settings' | null;

type ActiveSearch = {
  id: string;
  name: string;
  query: string;
  filters?: Record<string, string>;
  resultsCount?: number;
  newCount?: number;
};

type SavedOpportunity = {
  noticeId: string;
  title: string;
  agency: string;
  value?: string;
  posted?: string;
  deadline?: string;
  match?: number;
  naics?: string;
};

function buildQueryString(params: Record<string, string | number | undefined | null>) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    sp.set(k, String(v));
  });
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const welcomeName = useMemo(() => getWelcomeName(session), [session]);

  const [drawer, setDrawer] = useState<DrawerKey>(null);

  /**
   * Replace these with real data later:
   * - active searches: from DB saved searches table
   * - saved opportunities: from DB saved opportunities table
   * - match: computed score (see “matchInfo” drawer)
   */
  const activeSearches: ActiveSearch[] = [
    { id: 's1', name: 'IT Services (Federal)', query: 'IT services', filters: { naics: '541512', level: 'federal' }, resultsCount: 142, newCount: 12 },
    { id: 's2', name: 'Cybersecurity', query: 'cybersecurity', filters: { naics: '541690' }, resultsCount: 98, newCount: 7 },
    { id: 's3', name: 'Data Analytics', query: 'data analytics', filters: { naics: '541511' }, resultsCount: 67, newCount: 8 },
    { id: 's4', name: 'Construction (VA)', query: 'construction', filters: { state: 'VA' }, resultsCount: 89, newCount: 5 },
    { id: 's5', name: 'Software Development', query: 'software development', filters: { naics: '541511' }, resultsCount: 121, newCount: 9 },
    { id: 's6', name: 'Cloud Migration', query: 'cloud migration', filters: { setaside: 'small business' }, resultsCount: 54, newCount: 3 },
    { id: 's7', name: 'IDIQ Vehicles', query: 'IDIQ', filters: { type: 'IDIQ' }, resultsCount: 44, newCount: 2 },
    { id: 's8', name: 'DoD IT Support', query: 'IT support', filters: { agency: 'DoD' }, resultsCount: 77, newCount: 6 },
  ];

  const savedOpportunities: SavedOpportunity[] = [
    { noticeId: 'N-001', title: 'Cloud Infrastructure Management Services', agency: 'GSA', value: '$12.5M', posted: '2 hours ago', deadline: '25 days', match: 94, naics: '541512' },
    { noticeId: 'N-002', title: 'Cybersecurity Assessment and Remediation', agency: 'DHS', value: '$8.3M', posted: '5 hours ago', deadline: '30 days', match: 91, naics: '541690' },
    { noticeId: 'N-003', title: 'Data Analytics Platform Development', agency: 'DoD', value: '$15.7M', posted: '1 day ago', deadline: '45 days', match: 88, naics: '541511' },
    // ...you can keep adding or map from your DB
  ];

  // Keep these for the tiles/cards in the page
  const savedSearches = [
    { name: 'IT Services - Federal', count: 142, new: 12, color: 'from-cyan-500 to-blue-600' },
    { name: 'Construction - Virginia', count: 89, new: 5, color: 'from-purple-500 to-pink-600' },
    { name: 'Consulting - DoD', count: 67, new: 8, color: 'from-orange-500 to-red-600' },
  ];

  const recentOpportunities = [
    {
      id: 1,
      title: 'Cloud Infrastructure Management Services',
      agency: 'General Services Administration',
      value: '$12.5M',
      naics: '541512',
      location: 'Nationwide',
      posted: '2 hours ago',
      deadline: '25 days',
      match: 94,
      saved: true,
    },
    {
      id: 2,
      title: 'Cybersecurity Assessment and Remediation',
      agency: 'Department of Homeland Security',
      value: '$8.3M',
      naics: '541690',
      location: 'Washington, DC',
      posted: '5 hours ago',
      deadline: '30 days',
      match: 91,
      saved: false,
    },
    {
      id: 3,
      title: 'Data Analytics Platform Development',
      agency: 'Department of Defense',
      value: '$15.7M',
      naics: '541511',
      location: 'Multiple Locations',
      posted: '1 day ago',
      deadline: '45 days',
      match: 88,
      saved: true,
    },
  ];

  const notifications = [
    {
      type: 'match',
      title: '12 new opportunities match your criteria',
      time: '10 minutes ago',
      icon: Target,
      color: 'text-cyan-400',
    },
    {
      type: 'deadline',
      title: '3 saved opportunities closing this week',
      time: '2 hours ago',
      icon: Clock,
      color: 'text-orange-400',
    },
    {
      type: 'update',
      title: 'Amendment posted for "IT Modernization"',
      time: '1 day ago',
      icon: Activity,
      color: 'text-purple-400',
    },
  ];

  // Counts can be driven by arrays for now (later replace with real)
  const activeSearchCount = activeSearches.length; // 8
  const savedOppCount = 24; // keep number as your real count; replace with DB count later
  const avgMatch = 87; // replace with computed average over saved/recent results
  const thisWeekCount = 156; // replace with real query count

  const stats = [
    {
      label: 'Active Searches',
      value: String(activeSearchCount),
      change: '+2',
      icon: Search,
      gradient: 'from-cyan-500 to-blue-600',
      onClick: () => setDrawer('activeSearches'),
      hint: 'See your saved searches',
    },
    {
      label: 'Saved Opportunities',
      value: String(savedOppCount),
      change: '+6',
      icon: Bookmark,
      gradient: 'from-purple-500 to-pink-600',
      onClick: () => setDrawer('savedOpps'),
      hint: 'Open your saved list',
    },
    {
      label: 'Avg Match Score',
      value: `${avgMatch}%`,
      change: '+5%',
      icon: Target,
      gradient: 'from-green-500 to-emerald-600',
      onClick: () => setDrawer('matchInfo'),
      hint: 'What does Match mean?',
    },
    {
      label: 'This Week',
      value: String(thisWeekCount),
      change: '+23',
      icon: TrendingUp,
      gradient: 'from-orange-500 to-red-600',
      onClick: () => router.push(`/opportunities${buildQueryString({ postedRange: '7d' })}`),
      hint: 'View this week’s postings',
    },
  ];

  const upcomingDeadlines = [
    { title: 'Network Security Services RFP', agency: 'GSA', deadline: '3 days', value: '$4.2M' },
    { title: 'Software Development IDIQ', agency: 'VA', deadline: '5 days', value: '$8.9M' },
    { title: 'IT Support Services', agency: 'DoD', deadline: '7 days', value: '$2.1M' },
  ];

  const closeDrawer = () => setDrawer(null);

  const goToSearch = (s: ActiveSearch) => {
    // Route to your search page with query params
    const qs = buildQueryString({
      q: s.query,
      naics: s.filters?.naics,
      level: s.filters?.level,
      state: s.filters?.state,
      setaside: s.filters?.setaside,
      type: s.filters?.type,
      agency: s.filters?.agency,
      savedSearchId: s.id, // helpful for analytics/restore
    });
    router.push(`/search${qs}`);
    closeDrawer();
  };

  const goToSavedOpp = (o: SavedOpportunity) => {
    // If you later add /opportunities/[noticeId], change to that.
    // For now: send to opportunities page with filter params so user lands in context.
    const qs = buildQueryString({
      saved: '1',
      noticeId: o.noticeId,
      naics: o.naics,
    });
    router.push(`/opportunities${qs}`);
    closeDrawer();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      {/* Header - DYNAMIC NAME */}
      <section className="border-b border-white/5 bg-slate-900/30 backdrop-blur-xl sticky top-0 z-10">
        <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="animate-fadeInLeft">
              <h1 className="text-3xl font-bold text-white mb-2">Welcome back, {welcomeName}</h1>
              <p className="text-slate-400">Here's what's happening with your contracts today</p>
            </div>

            <div className="flex items-center gap-3 animate-fadeInRight">
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
          <div className="absolute right-0 top-0 h-full w-full sm:w-[520px] bg-gradient-to-br from-slate-900/95 to-slate-950/95 border-l border-white/10 shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div className="text-white font-bold text-lg">
                {drawer === 'activeSearches' && 'Active Searches'}
                {drawer === 'savedOpps' && 'Saved Opportunities'}
                {drawer === 'matchInfo' && 'Match Score'}
                {drawer === 'notifications' && 'Notifications'}
                {drawer === 'settings' && 'Settings'}
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
                    {activeSearches.map((s) => (
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
                    {savedOpportunities.map((o) => (
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
                    <span className="text-white font-semibold">Match</span> is a score (0–100) that estimates how well an opportunity fits your business and saved search intent.
                  </p>

                  <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                    <div className="text-white font-semibold mb-2">What it represents</div>
                    <ul className="text-sm text-slate-300 space-y-2">
                      <li>• NAICS alignment (your selected NAICS vs solicitation NAICS)</li>
                      <li>• Keyword relevance (title + description vs your search terms)</li>
                      <li>• Agency preference (e.g., DoD, DHS, etc.)</li>
                      <li>• Set-aside fit (if you filter small business, SDVOSB, etc.)</li>
                      <li>• Recency and deadline urgency (optional weighting)</li>
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
                    {notifications.map((notif, index) => {
                      const IconComponent = notif.icon;
                      return (
                        <div
                          key={index}
                          className="p-4 bg-slate-800/40 hover:bg-slate-800/60 rounded-xl border border-white/10 hover:border-white/20 transition-all cursor-pointer"
                        >
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-slate-700/50 rounded-lg">
                              <IconComponent className={`w-5 h-5 ${notif.color}`} />
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
                          Edit Profile →
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
                        Update Preferences →
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

                <div className="relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl p-6 border border-white/10 group-hover:border-white/20 transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 bg-gradient-to-br ${stat.gradient} rounded-xl`}>
                      <stat.icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-green-400 text-sm font-semibold flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      {stat.change}
                    </span>
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-sm text-slate-400 flex items-center justify-between gap-3">
                    <span>{stat.label}</span>
                    <span className="text-xs text-slate-500 group-hover:text-slate-300 transition">{stat.hint}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-12 gap-8">
          {/* Main Content */}
          <div className="col-span-12 xl:col-span-8 space-y-8">
            {/* Recent Opportunities */}
            <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl p-6 border border-white/10 animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Recent Opportunities</h2>
                    <p className="text-sm text-slate-400">Your top matches from the last 24 hours</p>
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
                {recentOpportunities.map((opp, index) => (
                  <div
                    key={opp.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => router.push(`/opportunities${buildQueryString({ noticeId: String(opp.id) })}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        router.push(`/opportunities${buildQueryString({ noticeId: String(opp.id) })}`);
                      }
                    }}
                    className="group bg-slate-900/50 rounded-xl p-5 border border-white/5 hover:border-cyan-500/30 hover:translate-x-1 transition-all duration-300 cursor-pointer animate-slideInLeft outline-none focus:ring-2 focus:ring-cyan-400/40"
                    style={{ animationDelay: `${0.4 + index * 0.1}s` }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-white group-hover:text-cyan-400 transition-colors">
                            {opp.title}
                          </h3>
                          <div className="px-2 py-1 rounded-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30">
                            <span className="text-green-400 font-bold text-xs">{opp.match}% Match</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400 mb-3">
                          <div className="flex items-center gap-1">
                            <Building2 className="w-4 h-4" />
                            <span>{opp.agency}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{opp.location}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="font-mono text-cyan-400">{opp.naics}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1 text-slate-400">
                            <Clock className="w-4 h-4" />
                            <span>Posted {opp.posted}</span>
                          </div>
                          <div className="flex items-center gap-1 text-orange-400">
                            <Clock className="w-4 h-4" />
                            <span>Closes in {opp.deadline}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right ml-4">
                        <div className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">
                          {opp.value}
                        </div>
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              // TODO: hook up save action
                            }}
                            className={`p-2 rounded-lg transition-all duration-300 hover:scale-110 ${
                              opp.saved
                                ? 'bg-cyan-500/20 text-cyan-400'
                                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700'
                            }`}
                            aria-label="Save"
                          >
                            <Heart className={`w-4 h-4 ${opp.saved ? 'fill-current' : ''}`} />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              // TODO: hook up share action
                            }}
                            className="p-2 bg-slate-800/50 hover:bg-slate-700 rounded-lg text-slate-400 transition-all duration-300 hover:scale-110"
                            aria-label="Share"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/opportunities${buildQueryString({ noticeId: String(opp.id) })}`);
                            }}
                            className="p-2 bg-slate-800/50 hover:bg-slate-700 rounded-lg text-slate-400 transition-all duration-300 hover:scale-110"
                            aria-label="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Saved Searches */}
            <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl p-6 border border-white/10 animate-fadeInUp" style={{ animationDelay: '0.5s' }}>
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {savedSearches.map((search, index) => (
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
          <div className="col-span-12 xl:col-span-4 space-y-6">
            {/* Notifications */}
            <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl p-6 border border-white/10 animate-fadeInRight" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-lg font-bold text-white">Notifications</h2>
                </div>
                <span className="px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-bold">3</span>
              </div>

              <div className="space-y-3">
                {notifications.map((notif, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg hover:bg-slate-900 transition-all duration-300 cursor-pointer animate-slideInRight"
                    style={{ animationDelay: `${0.4 + index * 0.1}s` }}
                  >
                    <div className={`p-2 bg-slate-800 rounded-lg ${notif.color}`}>
                      <notif.icon className="w-4 h-4" />
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
            <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl p-6 border border-white/10 animate-fadeInRight" style={{ animationDelay: '0.5s' }}>
              <div className="flex items-center gap-2 mb-6">
                <Clock className="w-5 h-5 text-orange-400" />
                <h2 className="text-lg font-bold text-white">Upcoming Deadlines</h2>
              </div>

              <div className="space-y-4">
                {upcomingDeadlines.map((deadline, index) => (
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
            <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl p-6 border border-white/10 animate-fadeInRight" style={{ animationDelay: '0.7s' }}>
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