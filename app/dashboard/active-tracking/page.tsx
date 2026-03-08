//"C:\Users\owner\Documents\sam-gov-search-app\app\dashboard\active-tracking\page.tsx"

'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Line,
  LineChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Layers,
  Filter,
  ArrowRight,
  Clock,
  Building2,
  Target,
  X,
} from 'lucide-react'

type Stage = 'Identified' | 'Qualified' | 'Capture' | 'Proposal'

type PipelineItem = {
  id: string
  title: string
  agency: string
  stage: Stage
  statusLabel: string
  value?: string
  dueIn?: string
  match?: number
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function stagePillStyle(stage: Stage) {
  switch (stage) {
    case 'Identified':
      return 'bg-sky-500/15 text-sky-200 border-sky-500/25 hover:bg-sky-500/20'
    case 'Qualified':
      return 'bg-emerald-500/15 text-emerald-200 border-emerald-500/25 hover:bg-emerald-500/20'
    case 'Capture':
      return 'bg-amber-500/15 text-amber-200 border-amber-500/25 hover:bg-amber-500/20'
    case 'Proposal':
      return 'bg-purple-500/15 text-purple-200 border-purple-500/25 hover:bg-purple-500/20'
    default:
      return 'bg-slate-500/15 text-slate-200 border-slate-500/25 hover:bg-slate-500/20'
  }
}

export default function ActiveTrackingPage() {
  // Avoid Recharts measuring during SSG/SSR
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // Replace this with real pipeline data later (Neon/Prisma, etc.)
  const pipeline: PipelineItem[] = [
    {
      id: 'N-1001',
      title: 'Network Infrastructure – DHS',
      agency: 'Department of Homeland Security',
      stage: 'Proposal',
      statusLabel: 'Proposal in progress',
      value: '$4.2M',
      dueIn: '5 days',
      match: 92,
    },
    {
      id: 'N-1002',
      title: 'Database Management – GSA',
      agency: 'General Services Administration',
      stage: 'Capture',
      statusLabel: 'Capture plan drafted',
      value: '$2.9M',
      dueIn: '12 days',
      match: 89,
    },
    {
      id: 'N-1003',
      title: 'Mobile App Development – VA',
      agency: 'Commonwealth of Virginia',
      stage: 'Qualified',
      statusLabel: 'Teaming discussion',
      value: '$1.6M',
      dueIn: '18 days',
      match: 84,
    },
    {
      id: 'N-1004',
      title: 'Cloud Migration Services – DoD',
      agency: 'Department of Defense',
      stage: 'Identified',
      statusLabel: 'Newly identified',
      value: '$7.5M',
      dueIn: '26 days',
      match: 86,
    },
    {
      id: 'N-1005',
      title: 'Data Analytics Support – USDA',
      agency: 'US Department of Agriculture',
      stage: 'Qualified',
      statusLabel: 'Qualified (fit confirmed)',
      value: '$3.1M',
      dueIn: '21 days',
      match: 90,
    },
    {
      id: 'N-1006',
      title: 'IT Helpdesk Modernization – VA',
      agency: 'Commonwealth of Virginia',
      stage: 'Capture',
      statusLabel: 'Research phase',
      value: '$980K',
      dueIn: '30 days',
      match: 81,
    },
  ]

  const [selectedStage, setSelectedStage] = useState<Stage | 'All'>('All')

  const stageCounts = useMemo(() => {
    const counts: Record<Stage, number> = {
      Identified: 0,
      Qualified: 0,
      Capture: 0,
      Proposal: 0,
    }
    for (const item of pipeline) counts[item.stage] += 1
    return counts
  }, [pipeline])

  const chartData = useMemo(
    () => [
      { stage: 'Identified', count: stageCounts.Identified },
      { stage: 'Qualified', count: stageCounts.Qualified },
      { stage: 'Capture', count: stageCounts.Capture },
      { stage: 'Proposal', count: stageCounts.Proposal },
    ],
    [stageCounts]
  )

  const filtered = useMemo(() => {
    if (selectedStage === 'All') return pipeline
    return pipeline.filter((p) => p.stage === selectedStage)
  }, [pipeline, selectedStage])

  const total = pipeline.length

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-slate-100">
      {/* Wide header like Insights */}
      <section className="border-b border-white/5 bg-slate-900/30 backdrop-blur-xl sticky top-0 z-10">
        <div className="mx-auto w-full max-w-[1920px] px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-1">Active pipeline</h1>
              <p className="text-sm text-slate-400">
                Opportunities you&apos;re actively tracking across the capture lifecycle.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/opportunities"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-white/10 transition"
              >
                <Layers className="w-4 h-4 text-slate-200" />
                <span className="text-sm font-semibold text-slate-100">Open Opportunities</span>
                <ArrowRight className="w-4 h-4 text-slate-300" />
              </Link>
            </div>
          </div>

          {/* Actionable pills */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedStage('All')}
              className={cx(
                'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition',
                selectedStage === 'All'
                  ? 'bg-cyan-500/15 text-cyan-200 border-cyan-500/30'
                  : 'bg-slate-800/50 text-slate-200 border-white/10 hover:bg-slate-800'
              )}
              aria-label="Show all stages"
            >
              <Target className="w-4 h-4" />
              Total
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">{total}</span>
            </button>

            {(['Identified', 'Qualified', 'Capture', 'Proposal'] as Stage[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSelectedStage(s)}
                className={cx(
                  'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition',
                  selectedStage === s
                    ? stagePillStyle(s)
                    : 'bg-slate-800/50 text-slate-200 border-white/10 hover:bg-slate-800'
                )}
                aria-label={`Filter by ${s}`}
              >
                <span>{s}</span>
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">
                  {stageCounts[s]}
                </span>
              </button>
            ))}

            {selectedStage !== 'All' && (
              <button
                type="button"
                onClick={() => setSelectedStage('All')}
                className="ml-1 inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-800/40 px-3 py-1.5 text-sm font-semibold text-slate-200 hover:bg-slate-800 transition"
                aria-label="Clear filter"
              >
                <X className="w-4 h-4" />
                Clear filter
              </button>
            )}
          </div>

          <div className="mt-2 text-xs text-slate-400">
            Showing{' '}
            <span className="text-slate-200 font-semibold">{filtered.length}</span>{' '}
            {selectedStage === 'All' ? 'items across all stages' : `items in ${selectedStage}`}
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-[1920px] px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Chart */}
          <section className="col-span-12 lg:col-span-7 bg-slate-900/60 border border-white/10 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold">Opportunities by stage</h2>
              <div className="inline-flex items-center gap-2 text-xs text-slate-400">
                <Filter className="w-4 h-4" />
                {selectedStage === 'All' ? 'No filter' : `Filtered: ${selectedStage}`}
              </div>
            </div>

            <div className="w-full h-72 min-h-[260px]">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="stage" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" allowDecimals={false} />
                    <Tooltip
                      cursor={{ stroke: '#22c55e', strokeWidth: 1 }}
                      contentStyle={{
                        background: 'rgba(2,6,23,0.95)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '12px',
                        color: '#e2e8f0',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#22c55e"
                      strokeWidth={2}
                      dot={{ r: 4, stroke: '#22c55e', fill: '#0f172a' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full rounded-xl border border-white/10 bg-slate-950/30 animate-pulse" />
              )}
            </div>
          </section>

          {/* List (actionable) */}
          <section className="col-span-12 lg:col-span-5 bg-slate-900/60 border border-white/10 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold">
                {selectedStage === 'All' ? 'Key opportunities in pipeline' : `${selectedStage} opportunities`}
              </h2>
              <div className="text-xs text-slate-400 inline-flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Click an item to open
              </div>
            </div>

            <div className="space-y-3">
              {filtered.map((item) => (
                <Link
                  key={item.id}
                  href={`/opportunities?noticeId=${encodeURIComponent(item.id)}`}
                  className="group block rounded-2xl border border-white/10 bg-slate-950/40 hover:bg-slate-950/60 hover:border-white/15 transition p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-white group-hover:text-cyan-200 transition truncate">
                        {item.title}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                        <span className="inline-flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5" />
                          {item.agency}
                        </span>
                        <span className={cx('rounded-full border px-2 py-0.5', stagePillStyle(item.stage))}>
                          {item.stage}
                        </span>
                        {item.match != null && (
                          <span className="rounded-full border border-emerald-500/25 bg-emerald-500/15 text-emerald-200 px-2 py-0.5">
                            {item.match}% Match
                          </span>
                        )}
                      </div>

                      <div className="mt-2 text-xs text-slate-300">
                        <span className="text-slate-400">Status:</span> {item.statusLabel}
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      {item.value && (
                        <div className="text-sm font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                          {item.value}
                        </div>
                      )}
                      {item.dueIn && (
                        <div className="mt-1 text-xs text-orange-300">
                          Due in {item.dueIn}
                        </div>
                      )}
                      <div className="mt-2 text-xs text-slate-500 group-hover:text-slate-300 transition">
                        Open →
                      </div>
                    </div>
                  </div>
                </Link>
              ))}

              {filtered.length === 0 && (
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-6 text-center">
                  <p className="text-sm text-slate-300 font-semibold mb-1">No items in this stage</p>
                  <p className="text-xs text-slate-400">
                    Try another stage pill or clear the filter.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
