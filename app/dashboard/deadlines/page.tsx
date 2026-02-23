//"C:\Users\owner\Documents\sam-gov-search-app\app\dashboard\deadlines\page.tsx"

'use client'

import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const data = [
  { bucket: '0–7 days', count: 4 },
  { bucket: '8–14 days', count: 3 },
  { bucket: '15–21 days', count: 3 },
  { bucket: '22–30 days', count: 2 },
]

export default function DeadlinesPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 px-6 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Upcoming deadlines</h1>
        <p className="text-sm text-slate-400">
          Visibility into all key dates within the next 30 days.
        </p>
      </header>

      <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-8">
        <h2 className="text-sm font-semibold mb-3">Deadlines by time window</h2>
        <div className="w-full h-64 min-h-[240px]">
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="bucket" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip cursor={{ fill: 'rgba(55,65,81,0.4)' }} />
                <Bar dataKey="count" fill="#fbbf24" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full w-full rounded-lg border border-slate-800 bg-slate-950/30 animate-pulse" />
          )}
        </div>
      </section>

      <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-sm font-semibold mb-3">Next critical milestones</h2>
        <ul className="space-y-2 text-sm">
          <li className="flex justify-between border-b border-slate-800 pb-2">
            <span>System Integration – Navy</span>
            <span className="text-xs text-red-400">5 days – Proposal due</span>
          </li>
          <li className="flex justify-between border-b border-slate-800 pb-2">
            <span>Technical Writing – VA</span>
            <span className="text-xs text-amber-400">8 days – Questions due</span>
          </li>
          <li className="flex justify-between">
            <span>IT Infrastructure – Army</span>
            <span className="text-xs text-emerald-400">12 days – Proposal due</span>
          </li>
        </ul>
      </section>
    </main>
  )
}