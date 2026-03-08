import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const SAM_API_KEY = process.env.SAMGOVAPIKEY || process.env.SAM_API_KEY || ''
const SAM_BASE_URL = 'https://api.sam.gov/opportunities/v2/search'

const CACHE_TTL_MS = 15 * 60 * 1000
let cache: { expiresAt: number; payload: any } | null = null

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

export async function GET(req: NextRequest) {
  if (!SAM_API_KEY) {
    return NextResponse.json({ ok: false, error: 'SAM API key not configured' }, { status: 500 })
  }

  if (cache && Date.now() < cache.expiresAt) {
    return NextResponse.json({ ...cache.payload, cached: true })
  }

  const limit = Math.min(250, Math.max(50, Number(req.nextUrl.searchParams.get('limit') || 200)))

  const params = new URLSearchParams({
    api_key: SAM_API_KEY,
    limit: String(limit),
    offset: '0',
    postedFrom: daysAgo(120),
    postedTo: formatMMDDYYYY(new Date()),
    ptype: 'o,k,r,s,g,i',
    status: 'active',
  })

  const url = `${SAM_BASE_URL}?${params.toString()}`

  const response = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  })

  if (!response.ok) {
    const text = await response.text()
    return NextResponse.json(
      { ok: false, error: 'SAM taxonomy fetch failed', details: text.slice(0, 240) },
      { status: response.status }
    )
  }

  const data = await response.json()
  const opportunities = Array.isArray(data?.opportunitiesData) ? data.opportunitiesData : []

  const naicsCounts = new Map<string, number>()
  const keywordCounts = new Map<string, number>()

  for (const opp of opportunities) {
    const code = String(opp?.naicsCode ?? opp?.naics ?? '').trim()
    if (code) {
      naicsCounts.set(code, (naicsCounts.get(code) || 0) + 1)
    }

    const title = String(opp?.title || '')
    const desc = String(opp?.description || '')
    keywordCountsFromText(`${title} ${desc}`, keywordCounts)
  }

  const naics = Array.from(naicsCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 120)
    .map(([code, count]) => ({
      value: code,
      label: `${code} - SAM trending (${count})`,
    }))

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

  return NextResponse.json({ ...payload, cached: false })
}
