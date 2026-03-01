'use client'

import React, { useMemo } from 'react'

type StateCounts = Record<string, number>

// A lightweight US tile map (not geographically perfect, but good for quick "heatmap" storytelling).
// 12 columns; null cells are blanks.
const TILE_MAP: (string | null)[][] = [
  ['AK', null, null, null, null, null, null, null, null, null, null, 'ME'],
  ['HI', null, null, null, null, null, null, null, null, 'VT', 'NH', null],
  [null, 'WA', 'MT', 'ND', 'MN', 'WI', 'MI', null, 'NY', 'MA', null, null],
  [null, 'OR', 'ID', 'SD', 'IA', 'IL', 'IN', 'OH', 'PA', 'NJ', 'CT', 'RI'],
  [null, 'CA', 'NV', 'WY', 'NE', 'MO', 'KY', 'WV', 'VA', 'MD', 'DE', null],
  [null, null, 'UT', 'CO', 'KS', 'AR', 'TN', 'NC', 'SC', 'DC', null, null],
  [null, null, 'AZ', 'NM', 'OK', 'LA', 'MS', 'AL', 'GA', null, null, null],
  [null, null, null, 'TX', null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, 'FL', null, null, null],
]

function levelClass(v: number, max: number) {
  if (!v || max <= 0) return 'bg-white/5 text-slate-300/70 border-white/10'
  const p = v / max
  if (p <= 0.15) return 'bg-cyan-500/10 text-cyan-200 border-cyan-500/20'
  if (p <= 0.35) return 'bg-cyan-500/20 text-cyan-100 border-cyan-500/30'
  if (p <= 0.65) return 'bg-cyan-500/30 text-white border-cyan-500/40'
  return 'bg-cyan-500/45 text-white border-cyan-500/60'
}

export default function StateTileMap({ counts }: { counts: StateCounts }) {
  const max = useMemo(() => {
    let m = 0
    for (const k of Object.keys(counts || {})) m = Math.max(m, Number(counts[k] || 0))
    return m
  }, [counts])

  return (
    <div className="w-full">
      <div className="grid grid-cols-12 gap-1">
        {TILE_MAP.flatMap((row, r) =>
          row.map((code, c) => {
            if (!code) {
              return <div key={`${r}-${c}`} className="h-10 rounded-md" />
            }
            const v = Number(counts?.[code] || 0)
            return (
              <div
                key={`${r}-${c}-${code}`}
                title={`${code}: ${v.toLocaleString()} new`}
                className={`h-10 rounded-md border flex flex-col items-center justify-center text-[10px] font-semibold tracking-wide ${levelClass(
                  v,
                  max
                )}`}
              >
                <div className="leading-none">{code}</div>
                <div className="leading-none opacity-80">{v ? v.toLocaleString() : ''}</div>
              </div>
            )
          })
        )}
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
        <span>Lower</span>
        <div className="flex items-center gap-1">
          <span className="h-2 w-6 rounded bg-white/5 border border-white/10" />
          <span className="h-2 w-6 rounded bg-cyan-500/10 border border-cyan-500/20" />
          <span className="h-2 w-6 rounded bg-cyan-500/20 border border-cyan-500/30" />
          <span className="h-2 w-6 rounded bg-cyan-500/30 border border-cyan-500/40" />
          <span className="h-2 w-6 rounded bg-cyan-500/45 border border-cyan-500/60" />
        </div>
        <span>Higher</span>
      </div>
    </div>
  )
}
