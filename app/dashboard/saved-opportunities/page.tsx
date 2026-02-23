//"C:\Users\owner\Documents\sam-gov-search-app\app\dashboard\saved-opportunities\page.tsx"

'use client'

import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis, ResponsiveContainer } from 'recharts'

const data = [
  { month: 'Jan', count: 8 },
  { month: 'Feb', count: 12 },
  { month: 'Mar', count: 15 },
  { month: 'Apr', count: 9 },
]

export default function SavedOpportunitiesPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 px-6 py-8">
      <h1 className="text-2xl font-bold mb-1">Saved opportunities</h1>
      <p className="text-sm text-slate-400 mb-6">
        Track how many opportunities your team is tracking each month.
      </p>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-8">
        <div className="w-full h-64 min-h-[240px]">
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip cursor={{ fill: 'rgba(55,65,81,0.4)' }} />
                <Bar dataKey="count" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full w-full rounded-lg border border-slate-800 bg-slate-950/30 animate-pulse" />
          )}
        </div>
      </div>

      {/* You can pull this from Neon later */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h2 className="text-lg font-semibold mb-3">Latest saved items</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between border-b border-slate-800 pb-2">
            <span>Data Analytics Platform – GSA</span>
            <span className="text-slate-400 text-xs">Saved 2 days ago</span>
          </div>
          {/* more rows here */}
        </div>
      </section>
    </main>
  )
}