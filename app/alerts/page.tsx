// app/alerts/page.tsx
'use client'

import Link from 'next/link'
import { Suspense, useEffect, useState } from 'react'
import {
  BellRing, Bookmark, ArrowRight, Search, Plus, Zap, Mail, BarChart3,
  Clock, Edit3, Play, Pause, RefreshCw,
} from 'lucide-react'

function CountUp({ to, duration = 1200 }: { to: number; duration?: number }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    let start = 0
    const step = to / (duration / 16)
    const t = setInterval(() => {
      start += step
      if (start >= to) { setVal(to); clearInterval(t) } else setVal(Math.floor(start))
    }, 16)
    return () => clearInterval(t)
  }, [to, duration])
  return <>{val.toLocaleString()}</>
}

function Step({ num, icon: Icon, title, desc, color }: { num: number; icon: any; title: string; desc: string; color: string }) {
  return (
    <div className="flex gap-4 items-start">
      <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white shadow-sm" style={{ background: color }}>{num}</div>
      <div>
        <div className="flex items-center gap-1.5 mb-1"><Icon className="w-3.5 h-3.5" style={{ color }} /><p className="font-bold text-slate-800 text-sm">{title}</p></div>
        <p className="text-slate-500 text-xs leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

function AlertsHub() {
  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
        
        /* Aptos-like font fallback with system fonts */
        :root {
          --font-aptos: 'Aptos', 'Outfit', 'Segoe UI', system-ui, -apple-system, sans-serif;
        }
        
      `}</style>
      
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" style={{ fontFamily: "var(--font-aptos)" }}>
      {/* Enhanced Toast Notifications */}
      {toast && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 pointer-events-none">
          <div
            className={clsx(
              'relative w-full  mx-4 rounded-2xl shadow-2xl backdrop-blur-xl border-2',
              'animate-in fade-in slide-in-from-top-5 duration-500',
              toast.type === 'success' &&
                'border-emerald-500/50 bg-gradient-to-br from-emerald-950/95 to-emerald-900/95',
              toast.type === 'error' &&
                'border-rose-500/50 bg-gradient-to-br from-rose-950/95 to-rose-900/95',
              toast.type === 'info' &&
                'border-blue-500/50 bg-gradient-to-br from-blue-950/95 to-blue-900/95'
            )}
          >
            <div className="relative p-6">
              <div className="flex items-start gap-4">
                <div
                  className={clsx(
                    'flex-shrink-0 p-3 rounded-2xl',
                    toast.type === 'success' && 'bg-emerald-500/20',
                    toast.type === 'error' && 'bg-rose-500/20',
                    toast.type === 'info' && 'bg-blue-500/20'
                  )}
                >
                  {toast.type === 'success' && <CheckCircle className="h-8 w-8 text-emerald-400" />}
                  {toast.type === 'error' && <AlertCircle className="h-8 w-8 text-rose-400" />}
                  {toast.type === 'info' && <Bell className="h-8 w-8 text-blue-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3
                    className={clsx(
                      'text-lg font-bold mb-1',
                      toast.type === 'success' && 'text-emerald-300',
                      toast.type === 'error' && 'text-rose-300',
                      toast.type === 'info' && 'text-blue-300'
                    )}
                  >
                    {toast.type === 'success' && 'Success!'}
                    {toast.type === 'error' && 'Error'}
                    {toast.type === 'info' && 'Information'}
                  </h3>
                  <p
                    className={clsx(
                      'text-base leading-relaxed',
                      toast.type === 'success' && 'text-emerald-100',
                      toast.type === 'error' && 'text-rose-100',
                      toast.type === 'info' && 'text-blue-100'
                    )}
                  >
                    {toast.message}
                  </p>
                </div>
                <button
                  onClick={() => setToast(null)}
                  className={clsx(
                    'flex-shrink-0 p-2 rounded-lg transition-colors pointer-events-auto',
                    toast.type === 'success' && 'hover:bg-emerald-500/20 text-emerald-300',
                    toast.type === 'error' && 'hover:bg-rose-500/20 text-rose-300',
                    toast.type === 'info' && 'hover:bg-blue-500/20 text-blue-300'
                  )}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="mx-auto px-3 sm:px-4 lg:px-6  py-4 sm:py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl sm:text-3xl font-bold text-white">Precise GovCon Alert Manager</h1>
              <p className="text-slate-300 mt-2">Automate notifications and jump back into search instantly.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {/* New Search */}
              <Link
                href="/search"
                className="pg-btn pg-btn-secondary inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold"
              >
                <Search className="w-5 h-5" />
                New Search
              </Link>

              {/* Create Saved Search - Opens Modal */}
              <button
                onClick={() => setShowCreateSavedSearchModal(true)}
                className="pg-btn pg-btn-secondary inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold shadow-sm"
              >
                <Save className="w-5 h-5" />
                Create Saved Search
              </button>

              {/* Create Subscription Alert - Opens Modal */}
              <button
                onClick={() => setShowCreateSubscriptionModal(true)}
                className="pg-btn pg-btn-primary inline-flex items-center gap-2 px-5 py-3 rounded-xl text-white font-semibold shadow-md"
              >
                <Bell className="w-5 h-5" />
                Create Subscription Alert
              </button>
            </div>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
          <button
            onClick={() => setActiveTab('alerts')}
            className="rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-800 to-slate-700 p-6 hover:border-emerald-500/50 transition-all cursor-pointer text-left"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-300">Alert Subscriptions</p>
                <p className="mt-2 text-2xl sm:text-3xl font-bold text-white">{subscriptions.length}</p>
                <p className="mt-1 text-sm text-slate-400">
                  {activeCount} active • {pausedCount} paused
                </p>
              </div>
              <div className="rounded-full bg-emerald-500/10 p-3">
                <Bell className="h-8 w-8 text-emerald-400" />
              </div>
            </div>
          </button>

        {/* ── HERO ──────────────────────────────────────────────────────── */}
        <div className="grid-bg">
          <div className="max-w-5xl mx-auto px-6 pt-14 pb-12 text-center">

            <div className="fu inline-flex items-center gap-2 bg-white border border-slate-200 rounded-full px-4 py-1.5 text-xs font-semibold text-slate-500 mb-7 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              PreciseGovCon · Alert &amp; Search Suite
            </div>

        {/* Enhanced Tabs with Aptos Font */}
        <div className="mb-8">
          <div className="relative">
            {/* Tab Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 relative z-10">
              <button
                onClick={() => setActiveTab('alerts')}
                className={clsx(
                  'relative min-w-0 flex-1 px-4 sm:px-6 py-3 sm:py-4 rounded-2xl font-semibold transition-all duration-300 overflow-hidden group',
                  'font-[\'Aptos\',_system-ui,_-apple-system,_sans-serif]',
                  activeTab === 'alerts'
                    ? 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-cyan-600 text-white shadow-xl shadow-emerald-500/30 ring-1 ring-white/20'
                    : 'bg-gradient-to-br from-slate-800/80 to-slate-700/80 text-slate-300 hover:text-white hover:from-slate-700/90 hover:to-slate-600/90 border border-slate-600/50'
                )}
              >
                <div className="relative flex items-center justify-center gap-3">
                  <div className={clsx(
                    "p-2 rounded-xl transition-all",
                    activeTab === 'alerts' 
                      ? 'bg-white/20 shadow-lg' 
                      : 'bg-slate-700/50 group-hover:bg-slate-600/50'
                  )}>
                    <Bell className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <div className="text-base font-bold tracking-tight">Alert Subscriptions</div>
                    <div className={clsx(
                      "text-xs font-medium",
                      activeTab === 'alerts' ? '' : 'text-slate-400'
                    )}
                    style={activeTab === 'alerts' ? { color: 'rgba(255,255,255,0.96)' } : undefined}
                    >
                      {activeCount} active • {pausedCount} paused
                    </div>
                  </div>
                  <span className={clsx(
                    "ml-2 px-3 py-1 rounded-full text-xs font-bold",
                    activeTab === 'alerts'
                      ? 'bg-white/30 text-white'
                      : 'bg-slate-700 text-slate-300'
                  )}>
                    {subscriptions.length}
                  </span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('searches')}
                className={clsx(
                  'relative min-w-0 flex-1 px-4 sm:px-6 py-3 sm:py-4 rounded-2xl font-semibold transition-all duration-300 overflow-hidden group',
                  'font-[\'Aptos\',_system-ui,_-apple-system,_sans-serif]',
                  activeTab === 'searches'
                    ? 'bg-gradient-to-br from-cyan-500 via-blue-600 to-purple-600 text-white shadow-xl shadow-cyan-500/30 ring-1 ring-white/20'
                    : 'bg-gradient-to-br from-slate-800/80 to-slate-700/80 text-slate-300 hover:text-white hover:from-slate-700/90 hover:to-slate-600/90 border border-slate-600/50'
                )}
              >
                <div className="relative flex items-center justify-center gap-3">
                  <div className={clsx(
                    "p-2 rounded-xl transition-all",
                    activeTab === 'searches' 
                      ? 'bg-white/20 shadow-lg' 
                      : 'bg-slate-700/50 group-hover:bg-slate-600/50'
                  )}>
                    <Filter className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <div className="text-base font-bold tracking-tight">Saved Searches</div>
                    <div className={clsx(
                      "text-xs font-medium",
                      activeTab === 'searches' ? '' : 'text-slate-400'
                    )}
                    style={activeTab === 'searches' ? { color: 'rgba(255,255,255,0.96)' } : undefined}
                    >
                      Run instantly from alerts
                    </div>
                  </div>
                  <span className={clsx(
                    "ml-2 px-3 py-1 rounded-full text-xs font-bold",
                    activeTab === 'searches'
                      ? 'bg-white/30 text-white'
                      : 'bg-slate-700 text-slate-300'
                  )}>
                    {searches.length}
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-emerald-400" />
          </div>
        ) : activeTab === 'alerts' ? (
          // Alert Subscriptions tab
          <div className="space-y-4">
            {subscriptions.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-slate-700 rounded-2xl bg-slate-900/50">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-800 flex items-center justify-center">
                  <Bell className="w-10 h-10 text-slate-600" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">No alert subscriptions yet</h3>
                <p className="text-slate-300 mb-6 max-w-md mx-auto">
                  Create your first alert to get automated email notifications.
                </p>
                <button
                  onClick={() => setShowCreateSubscriptionModal(true)}
                  className="pg-btn pg-btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white transition-all font-semibold"
                >
                  <Plus className="w-5 h-5" />
                  Create Alert
                </button>
              </div>
            ) : (
              subscriptions.map((alert) => {
                const running = alert.active
                const isEditing = expandedAlertId === alert.id

                return (
                  <div
                    key={alert.id}
                    className={clsx(
                      "relative rounded-2xl p-6 transition-all duration-300 border-2 overflow-hidden",
                      "font-['Aptos',_system-ui,_-apple-system,_sans-serif]",
                      running
                        ? "bg-gradient-to-br from-slate-800 via-slate-800 to-emerald-900/20 border-emerald-500/40 shadow-lg shadow-emerald-500/10"
                        : "bg-gradient-to-br from-slate-800/90 to-slate-700/90 border-slate-600/50 hover:border-slate-500/70"
                    )}
                  >
                    {/* Shine effect for active alerts */}
                    {running && (
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-400/10 to-transparent rounded-full blur-3xl pointer-events-none" />
                    )}
                    {isEditing && editingAlert?.id === alert.id ? (
                      <div className="space-y-6">
                        {/* Header Section */}
                        <div className="flex items-center justify-between">
                          <div className="space-y-1 w-full">
                            <input
                              type="text"
                              value={editingAlert.name}
                              onChange={(e) => setEditingAlert({ ...editingAlert, name: e.target.value })}
                              className="text-2xl font-bold bg-transparent border-b border-slate-600 focus:border-blue-400 outline-none text-white w-full"
                              placeholder="Alert Name"
                            />
                            <textarea
                              value={editingAlert.description || ''}
                              onChange={(e) => setEditingAlert({ ...editingAlert, description: e.target.value })}
                              className="text-sm bg-transparent border-b border-slate-600 focus:border-blue-400 outline-none text-slate-300 w-full resize-none"
                              placeholder="Description (optional)"
                              rows={2}
                            />
                          </div>
                        </div>

                        {/* Search Criteria */}
                        <div className="space-y-4 pt-2">
                          <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Search Criteria</h4>

            {/* ─ ALERT SUBSCRIPTIONS ─ */}
            <div className="card-a rounded-3xl overflow-hidden fu d2">
              <div className="px-7 pt-7 pb-5">
                <div className="flex items-start justify-between mb-5">
                  <div className="badge-a rounded-2xl p-3 text-white"><BellRing className="h-6 w-6" /></div>
                  <span className="pill-a text-xs font-bold px-3 py-1 rounded-full">Automated email delivery</span>
                </div>
                <h2 className="serif text-3xl text-slate-900 mb-2">Alert Subscriptions</h2>
                <p className="text-slate-500 text-sm leading-relaxed mb-5">
                  Configure once, receive forever. Alerts run on your schedule and deliver
                  formatted SAM.gov results directly to any email address — yours, your team's, or a client's.
                </p>
                <button
                  onClick={() => setShowCreateSavedSearchModal(true)}
                  className="pg-btn pg-btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white transition-all font-semibold"
                >
                  <Plus className="w-5 h-5" />
                  Create Saved Search
                </button>
              </div>
            ) : (
              searches.map((search) => {
                const alertsUsingThisSearch = getAlertsForSearch(search.id)
                const hasActiveAlerts = alertsUsingThisSearch.some((a) => a.active)
                const isEditing = expandedSearchId === search.id
                const defaults = getDefault6MonthRangeFromConstants()
                const defaultPostedFrom = defaults.from
                const defaultPostedTo = defaults.to

                return (
                  <div
                    key={search.id}
                    className={clsx(
                      "relative rounded-2xl p-6 transition-all duration-300 border-2 overflow-hidden",
                      "font-['Aptos',_system-ui,_-apple-system,_sans-serif]",
                      "bg-gradient-to-br from-slate-800/90 via-slate-800/90 to-cyan-900/10 border-cyan-500/20",
                      "hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-500/5"
                    )}
                  >
                    {/* Decorative gradient */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-400/10 to-transparent rounded-full blur-3xl pointer-events-none" />
                    {isEditing && editingSearch?.id === search.id ? (
                      // Inline Edit Mode for Saved Search
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <span className="px-2 py-1 bg-orange-500/20 text-orange-300 text-xs font-semibold rounded-full">
                              Editing
                            </span>
                            Edit Saved Search
                          </h3>
                          <div className="flex gap-2">
                            <button
                              onClick={cancelEditingSearch}
                              disabled={busy}
                              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-2"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={saveEditedSearch}
                              disabled={busy}
                              className="px-3 py-2 rounded-xl bg-orange-500 hover:opacity-90 text-white font-semibold flex items-center gap-2"
                            >
                              {busyId === search.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                            </button>
                          </div>
                        </div>

                        {/* Basic Information Section */}
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className={LABEL_CLASS}>Search Name</label>
                              <input
                                type="text"
                                value={editingSearch.name || ''}
                                onChange={(e) => updateEditingSearchField('name', e.target.value)}
                                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-base placeholder-slate-500"
                                placeholder="Enter search name"
                              />
                            </div>

                            <div>
                              <label className={LABEL_CLASS}>Description</label>
                              <input
                                type="text"
                                value={editingSearch.description || ''}
                                onChange={(e) => updateEditingSearchField('description', e.target.value)}
                                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-base placeholder-slate-500"
                                placeholder="Optional description"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Search Criteria Section */}
                        <div className="space-y-4">
                          <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Search Criteria</h4>

                          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                            <div>
                              <label className={LABEL_CLASS}>Keywords (title)</label>
                              <input
                                type="text"
                                value={editingSearch.keywords || ''}
                                onChange={(e) => updateEditingSearchField('keywords', e.target.value)}
                                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-base placeholder-slate-500"
                                placeholder="Enter keywords..."
                              />
                            </div>

                            <div>
                              <label className={LABEL_CLASS}>Solicitation Number (solnum)</label>
                              <input
                                type="text"
                                value={editingSearch.solnum || ''}
                                onChange={(e) => updateEditingSearchField('solnum', e.target.value)}
                                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-base placeholder-slate-500"
                                placeholder="Solicitation number..."
                              />
                            </div>

                            <div>
                              <label className={LABEL_CLASS}>Notice ID (noticeid)</label>
                              <input
                                type="text"
                                value={editingSearch.noticeid || ''}
                                onChange={(e) => updateEditingSearchField('noticeid', e.target.value)}
                                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-base placeholder-slate-500"
                                placeholder="Notice ID..."
                              />
                            </div>

                            <div>
                              <label className={LABEL_CLASS}>Procurement Type (ptype)</label>
                              <select
                                value={editingSearch.procurementType || ''}
                                onChange={(e) => updateEditingSearchField('procurementType', e.target.value)}
                                className="relative z-20 w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-base"
                              >
                                <option value="">All Types</option>
                                {PROCUREMENT_TYPES.map((type) => (
                                  <option key={type.value} value={type.value}>
                                    {type.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className={LABEL_CLASS}>NAICS Code (ncode)</label>
                              <input
                                type="text"
                                value={editingSearch.naics || ''}
                                onChange={(e) => updateEditingSearchField('naics', e.target.value)}
                                maxLength={6}
                                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-base placeholder-slate-500"
                                placeholder="6-digit code..."
                              />
                            </div>

                            <div>
                              <label className={LABEL_CLASS}>Classification Code (ccode)</label>
                              <input
                                type="text"
                                value={editingSearch.ccode || ''}
                                onChange={(e) => updateEditingSearchField('ccode', e.target.value)}
                                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-base placeholder-slate-500"
                                placeholder="Classification code..."
                              />
                            </div>

                            <div>
                              <label className={LABEL_CLASS}>Set-Aside Type (typeOfSetAside)</label>
                              <select
                                value={editingSearch.setAside || ''}
                                onChange={(e) => updateEditingSearchField('setAside', e.target.value)}
                                className="relative z-20 w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-base"
                              >
                                <option value="">No Set-Aside</option>
                                {SET_ASIDE_CODES.map((setAside) => (
                                  <option key={setAside.value} value={setAside.value}>
                                    {setAside.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className={LABEL_CLASS}>Organization Name (organizationName)</label>
                              <input
                                type="text"
                                value={editingSearch.agency || ''}
                                onChange={(e) => updateEditingSearchField('agency', e.target.value)}
                                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-base placeholder-slate-500"
                                placeholder="Department or agency name..."
                              />
                            </div>

                            <div>
                              <label className={LABEL_CLASS}>Organization Code (organizationCode)</label>
                              <input
                                type="text"
                                value={editingSearch.organizationCode || ''}
                                onChange={(e) => updateEditingSearchField('organizationCode', e.target.value)}
                                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-base placeholder-slate-500"
                                placeholder="Organization code..."
                              />
                            </div>

                            <div>
                              <label className={LABEL_CLASS}>Place of Performance - State (state)</label>
                              <select
                                value={editingSearch.stateOfPerformance || ''}
                                onChange={(e) => updateEditingSearchField('stateOfPerformance', e.target.value)}
                                className="relative z-20 w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-base"
                              >
                                <option value="">Any</option>
                                {US_STATES.map((state) => (
                                  <option key={state.value} value={state.value}>
                                    {state.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className={LABEL_CLASS}>Place of Performance - Zip (zip)</label>
                              <input
                                type="text"
                                value={editingSearch.zip || ''}
                                onChange={(e) => updateEditingSearchField('zip', e.target.value)}
                                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-base placeholder-slate-500"
                                placeholder="Zip code..."
                              />
                            </div>

                            <div>
                              <label className={LABEL_CLASS}>Opportunity Status (status)</label>
                              <select
                                value={editingSearch.status || ''}
                                onChange={(e) => updateEditingSearchField('status', e.target.value)}
                                className="relative z-20 w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-base"
                              >
                                <option value="">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="archived">Archived</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="deleted">Deleted</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Date Filters Section */}
                        <div className="space-y-4">
                          <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Date Filters</h4>

                          <div className="grid grid-cols-1 gap-4">
                            <div>
                              <label className={LABEL_CLASS}>Posted Date (postedFrom)</label>
                              <input
                                type="date"
                                value={editingSearch.postedAfter || defaults.from || ''}
                                onChange={(e) => updateEditingSearchField('postedAfter', e.target.value)}
                                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                              />
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <span className="text-xs text-emerald-300 font-bold mr-1">Search posted from:</span>
                                {MONTH_RANGE_PRESETS.map((p) => (
                                  <button
                                    key={`search-posted-${p.months}`}
                                    type="button"
                                    onClick={() => {
                                      const now = new Date()
                                      setEditingSearch({
                                        ...editingSearch,
                                        postedAfter: formatDateInput(clampPostedFrom(subMonths(now, p.months), now)),
                                      })
                                    }}
                                    className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 text-xs font-bold border border-emerald-400/30 transition-colors"
                                  >
                                    {p.label} ago
                                  </button>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingSearch({
                                      ...editingSearch,
                                      postedAfter: '',
                                    })
                                  }}
                                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                                >
                                  Clear
                                </button>
                              </div>
                            </div>

                {/* Live-ish mock card */}
                <div className="mock p-4 mb-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-sm font-bold text-slate-800">IT Professional Services — GSA</span>
                    </div>
                    <span className="text-xs bg-emerald-100 text-emerald-700 font-semibold px-2 py-0.5 rounded-full border border-emerald-200">Daily</span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-slate-400 mb-3">
                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" />3 recipients</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Ran today · 47 results</span>
                  </div>
                  <div className="flex gap-2">
                    {[
                      { Icon: Play,   label: 'Run Now',  cls: 'bg-orange-100 text-orange-700 border-orange-200' },
                      { Icon: Edit3,  label: 'Edit',     cls: 'bg-slate-100 text-slate-600 border-slate-200' },
                      { Icon: Pause,  label: 'Pause',    cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
                    ].map(({ Icon, label, cls }) => (
                      <button key={label} className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border pointer-events-none ${cls}`}>
                        <Icon className="w-3 h-3" />{label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white/55 border-t border-orange-100 px-7 py-5 space-y-3.5">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">How it works</p>
                <Step num={1} icon={Plus}       color="#ea580c" title="Create an alert"        desc="Pick your search filters, add email recipients, and choose a delivery frequency (daily, weekly, real-time, or more)." />
                <Step num={2} icon={RefreshCw}  color="#f97316" title="Runs automatically"     desc="Each scheduled run searches SAM.gov and emails matching results as a clean, formatted report." />
                <Step num={3} icon={Edit3}      color="#c2410c" title="Edit or pause anytime"  desc="Change criteria, swap recipients, update the schedule, or pause without losing your subscription." />
              </div>

              <div className="px-7 py-5 flex flex-col sm:flex-row gap-3">
                <Link href="/alerts/manage-alerts" className="cta-a flex-1 flex items-center justify-center gap-2 text-white font-bold py-3 px-5 rounded-xl text-sm">
                  Manage Alerts <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/alerts/manage-alerts" className="flex items-center justify-center gap-2 bg-white hover:bg-orange-50 text-orange-700 font-bold py-3 px-4 rounded-xl text-sm border border-orange-200 transition-colors">
                  <Plus className="w-4 h-4" /> New Alert
                </Link>
              </div>
            </div>

            {/* ─ SAVED SEARCHES ─ */}
            <div className="card-s rounded-3xl overflow-hidden fu d3">
              <div className="px-7 pt-7 pb-5">
                <div className="flex items-start justify-between mb-5">
                  <div className="badge-s rounded-2xl p-3 text-white"><Bookmark className="h-6 w-6" /></div>
                  <span className="pill-s text-xs font-bold px-3 py-1 rounded-full">One-click on-demand</span>
                </div>
                <h2 className="serif text-3xl text-slate-900 mb-2">Saved Searches</h2>
                <p className="text-slate-500 text-sm leading-relaxed mb-5">
                  Build a complex search once — keywords, NAICS codes, agencies, set-asides, date ranges —
                  and re-run it in a single click. No re-entering filters every session.
                </p>

                {/* Mock saved search card */}
                <div className="mock p-4 mb-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Bookmark className="w-3.5 h-3.5 text-teal-500" />
                      <span className="text-sm font-bold text-slate-800">Cybersecurity — SDVOSB Virginia</span>
                    </div>
                    <span className="text-xs bg-orange-100 text-orange-700 font-semibold px-2 py-0.5 rounded-full border border-orange-200 flex items-center gap-1">
                      <BellRing className="w-3 h-3" /> Alert On
                    </span>
                  </div>
                  <div className="flex gap-1 flex-wrap mb-3">
                    {['NAICS 541512', 'SDVOSB', 'VA', 'Active'].map(t => (
                      <span key={t} className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded border border-teal-100">{t}</span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    {[
                      { Icon: Play,    label: 'Run Search', cls: 'bg-teal-100 text-teal-700 border-teal-200' },
                      { Icon: Edit3,   label: 'Edit',       cls: 'bg-slate-100 text-slate-600 border-slate-200' },
                      { Icon: BellRing,label: 'Alert',      cls: 'bg-orange-100 text-orange-700 border-orange-200' },
                    ].map(({ Icon, label, cls }) => (
                      <button key={label} className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border pointer-events-none ${cls}`}>
                        <Icon className="w-3 h-3" />{label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white/55 border-t border-teal-100 px-7 py-5 space-y-3.5">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">How it works</p>
                <Step num={1} icon={Search}   color="#0d9488" title="Save your filters"       desc="Set any combination of keywords, NAICS, agency, set-aside, state, and date range — name it and save." />
                <Step num={2} icon={Play}     color="#14b8a6" title="Run it instantly"         desc="One click loads the search page with all filters pre-filled and results loading automatically." />
                <Step num={3} icon={BellRing} color="#0f766e" title="Convert to an alert"     desc="Turn any saved search into a scheduled alert with one click — no need to re-enter your criteria." />
              </div>

              <div className="px-7 py-5 flex flex-col sm:flex-row gap-3">
                <Link href="/alerts/manage-searches" className="cta-s flex-1 flex items-center justify-center gap-2 text-white font-bold py-3 px-5 rounded-xl text-sm">
                  Manage Searches <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/alerts/manage-searches" className="flex items-center justify-center gap-2 bg-white hover:bg-teal-50 text-teal-700 font-bold py-3 px-4 rounded-xl text-sm border border-teal-200 transition-colors">
                  <Plus className="w-4 h-4" /> Save Search
                </Link>
              </div>
            </div>
          </div>

          {/* ── CAPABILITY COMPARISON ─────────────────────────────────── */}
          <div className="slab p-6 mb-6 fu d4">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-5 text-center">What you can do with each tool</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: Plus,      label: 'Create',   a: 'New alert with recipients & frequency',    b: 'Save named filter set from any search' },
                { icon: Edit3,     label: 'Edit',     a: 'Update criteria, schedule & recipients',    b: 'Modify keywords, dates & any filter' },
                { icon: Play,      label: 'Run',      a: 'Manual trigger → instant email delivery',   b: 'One-click → pre-filled search results' },
                { icon: RefreshCw, label: 'Automate', a: 'Scheduled delivery on your timetable',      b: 'Convert a saved search into a live alert' },
              ].map(({ icon: Icon, label, a, b }) => (
                <div key={label} className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                  <div className="flex items-center gap-1.5 mb-3">
                    <Icon className="w-3.5 h-3.5 text-slate-500" />
                    <p className="text-xs font-black text-slate-600 uppercase tracking-wide">{label}</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex gap-2 items-start">
                      <span className="w-2 h-2 rounded-full mt-1 flex-shrink-0" style={{ background: '#f97316' }} />
                      <p className="text-xs text-slate-500 leading-snug">{a}</p>
                    </div>
                    <div className="flex gap-2 items-start">
                      <span className="w-2 h-2 rounded-full mt-1 flex-shrink-0" style={{ background: '#14b8a6' }} />
                      <p className="text-xs text-slate-500 leading-snug">{b}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── BOTTOM CTA ────────────────────────────────────────────── */}
          <div className="rounded-2xl bg-slate-800 px-7 py-5 flex flex-col sm:flex-row items-center justify-between gap-4 fu d5">
            <div>
              <p className="text-white font-bold text-sm">Rather start from a live search?</p>
              <p className="text-slate-400 text-xs mt-0.5">Run a search first, then save filters or create an alert directly from the results page.</p>
            </div>
            <Link href="/search" className="flex items-center gap-2 bg-white hover:bg-slate-100 text-slate-800 font-bold py-2.5 px-5 rounded-xl text-sm transition-colors flex-shrink-0">
              <Search className="h-4 w-4" /> Go to Search
            </Link>
          </div>
        </div>

      </div>
    </>
  )
}

export default function AlertsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <AlertsHub />
    </Suspense>
  )
}
