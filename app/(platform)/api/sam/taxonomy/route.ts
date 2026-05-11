// app/api/sam/taxonomy/route.ts (or wherever this lives)
import { NextRequest, NextResponse } from 'next/server'
import { coalesceInFlight } from '@/lib/in-flight-coalescer'
import { resolveSamUrl } from '@/lib/samgov-api'

export const dynamic = 'force-dynamic'

const SAM_API_KEY = process.env.SAMGOVAPIKEY || process.env.SAM_API_KEY || ''
const SAM_BASE_URL = 'https://api.sam.gov/opportunities/v2/search'

// ─── Cache ────────────────────────────────────────────────────────────────────
// Taxonomy (NAICS codes + keywords) changes very slowly — 4 hours is fine
const CACHE_TTL_MS   = 4 * 60 * 60 * 1000  // 4 hours
const FETCH_COOLDOWN = 5 * 60 * 1000        // 5 min cooldown between fetches

let cache: { payload: any; expiresAt: number } | null = null
let lastFetchAt = 0

const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'from', 'that', 'this', 'into', 'your', 'are', 'our', 'you',
  'support', 'services', 'service', 'system', 'systems', 'program', 'office', 'department',
  'contract', 'contracts', 'federal', 'government', 'solicitation', 'notice', 'project',
])

function formatMMDDYYYY(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${mm}/${dd}/${d.getFullYear()}`
}

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return formatMMDDYYYY(d)
}

function keywordCountsFromText(text: string, counts: Map<string, number>) {
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .map(t => t.trim())
    .filter(Boolean)

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    if (token.length < 4 || /^\d+$/.test(token) || STOPWORDS.has(token)) continue
    counts.set(token, (counts.get(token) || 0) + 1)

    if (i < tokens.length - 1) {
      const next = tokens[i + 1]
      if (!next || STOPWORDS.has(next) || next.length < 4) continue
      const bigram = `${token} ${next}`
      counts.set(bigram, (counts.get(bigram) || 0) + 2)
    }
  }
}

const NO_STORE = { 'Cache-Control': 'no-store' } as const

export async function GET(req: NextRequest) {
  if (!SAM_API_KEY) {
    return NextResponse.json({ ok: false, error: 'SAM API key not configured' }, { status: 500 })
  }

  // ── Serve fresh cache ─────────────────────────────────────────────────────
  if (cache && Date.now() < cache.expiresAt) {
    return NextResponse.json({ ...cache.payload, cached: true }, { headers: NO_STORE })
  }

  // ── Cooldown: taxonomy is low-priority, don't refetch within 5 min ────────
  const sinceLastFetch = Date.now() - lastFetchAt
  if (lastFetchAt > 0 && sinceLastFetch < FETCH_COOLDOWN) {
    const waitSec = Math.ceil((FETCH_COOLDOWN - sinceLastFetch) / 1000)
    console.warn(`⏱️ Taxonomy cooldown: ${waitSec}s remaining`)
    // Return stale cache if available — taxonomy data isn't urgent
    if (cache) return NextResponse.json({ ...cache.payload, cached: true, stale: true }, { headers: NO_STORE })
    return NextResponse.json(
      { ok: false, error: 'rate_limited', message: `Taxonomy refresh available in ${waitSec}s`, retryAfter: waitSec },
      { status: 429, headers: { ...NO_STORE, 'Retry-After': String(waitSec) } }
    )
  }

  const limit = Math.min(250, Math.max(50, Number(req.nextUrl.searchParams.get('limit') || 200)))

  const params = new URLSearchParams({
    api_key: SAM_API_KEY,
    limit: String(limit),
    offset: '0',
    postedFrom: daysAgo(30),   // was 120 days — no need to go back 4 months for keyword trends
    postedTo: formatMMDDYYYY(new Date()),
    ptype: 'o,k,r,s,g,i',
    status: 'active',
  })

  const liveOutcome = await coalesceInFlight<
    | { kind: 'success'; payload: any }
    | { kind: 'rate_limited'; nextAccessTime?: string }
    | { kind: 'upstream_error'; status: number; details: string }
  >(`sam:taxonomy:${limit}`, async () => {
    lastFetchAt = Date.now()
    const { url, extraHeaders: samHeaders } = resolveSamUrl(`${SAM_BASE_URL}?${params.toString()}`)
    console.log('📡 Taxonomy fetch from SAM.gov (limit=%d)', limit)

    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json', ...samHeaders },
      cache: 'no-store',
    })

    if (response.status === 429) {
      const errorData = await response.json().catch(() => ({}))
      console.warn('🚫 Taxonomy: SAM.gov rate limit hit')
      lastFetchAt = Date.now() + (10 * 60 * 1000) - FETCH_COOLDOWN
      return { kind: 'rate_limited' as const, nextAccessTime: errorData?.nextAccessTime }
    }

    if (!response.ok) {
      const text = await response.text()
      return { kind: 'upstream_error' as const, status: response.status, details: text.slice(0, 240) }
    }

    const data = await response.json()
    const opportunities = Array.isArray(data?.opportunitiesData) ? data.opportunitiesData : []
    const naicsCounts = new Map<string, number>()
    const keywordCounts = new Map<string, number>()

    for (const opp of opportunities) {
      const code = String(opp?.naicsCode ?? opp?.naics ?? '').trim()
      if (code) naicsCounts.set(code, (naicsCounts.get(code) || 0) + 1)
      const title = String(opp?.title || '')
      const desc = String(opp?.description || '')
      keywordCountsFromText(`${title} ${desc}`, keywordCounts)
    }

    const naics = Array.from(naicsCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 120)
      .map(([code, count]) => ({ value: code, label: `${code} - SAM trending (${count})` }))

    const keywords = Array.from(keywordCounts.entries())
      .filter(([kw]) => kw.length >= 4)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 80)
      .map(([kw]) => kw)

    const payload = {
      ok: true,
      source: 'sam.gov',
      generatedAt: new Date().toISOString(),
      naics,
      keywords,
    }
    cache = { payload, expiresAt: Date.now() + CACHE_TTL_MS }
    return { kind: 'success' as const, payload }
  })

  if (liveOutcome.kind === 'success') {
    return NextResponse.json({ ...liveOutcome.payload, cached: false }, { headers: NO_STORE })
  }
  if (liveOutcome.kind === 'rate_limited') {
    if (cache) return NextResponse.json({ ...cache.payload, cached: true, rateLimited: true }, { headers: NO_STORE })
    return NextResponse.json(
      { ok: false, error: 'rate_limited', message: 'SAM.gov quota exceeded', nextAccessTime: liveOutcome.nextAccessTime },
      { status: 200, headers: NO_STORE }
    )
  }
  return NextResponse.json(
    { ok: false, error: 'SAM taxonomy fetch failed', details: liveOutcome.details },
    { status: liveOutcome.status }
  )
}
