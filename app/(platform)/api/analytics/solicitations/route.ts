//C:\Users\owner\Documents\sam-gov-search-app\app\api\analytics\solicitations\route

import { NextResponse } from 'next/server'
import { coalesceInFlight } from '@/lib/in-flight-coalescer'
import { resolveSamUrl } from '@/lib/samgov-api'

export const runtime = 'nodejs'

// ─── In-process cache to protect SAM.gov daily quota ─────────────────────────
const ANALYTICS_CACHE_TTL_MS = 10 * 60 * 1000 // 10 minutes
const ANALYTICS_CACHE_LIMIT = 40
const ANALYTICS_CACHE = new Map<string, { payload: any; expiresAt: number }>()

function getAnalyticsCache(key: string) {
  const hit = ANALYTICS_CACHE.get(key)
  if (!hit) return null
  if (Date.now() > hit.expiresAt) {
    ANALYTICS_CACHE.delete(key)
    return null
  }
  return hit.payload
}

function setAnalyticsCache(key: string, payload: any) {
  if (ANALYTICS_CACHE.size >= ANALYTICS_CACHE_LIMIT) {
    const oldest = ANALYTICS_CACHE.keys().next().value
    if (oldest) ANALYTICS_CACHE.delete(oldest)
  }
  ANALYTICS_CACHE.set(key, { payload, expiresAt: Date.now() + ANALYTICS_CACHE_TTL_MS })
}

type Period = 'today' | 'week' | 'month' | 'year'

function getApiKey() {
  return (
    process.env.SAM_GOV_API_KEY ||
    process.env.SAM_API_KEY ||
    process.env.SAMGOV_API_KEY ||
    process.env.SAM_APIKEY ||
    ''
  )
}

function mmddyyyy(d: Date, timeZone = 'America/New_York') {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d)
  const m = parts.find((p) => p.type === 'month')?.value || '01'
  const day = parts.find((p) => p.type === 'day')?.value || '01'
  const y = parts.find((p) => p.type === 'year')?.value || '1970'
  return `${m}/${day}/${y}`
}

function yyyy(d: Date, timeZone = 'America/New_York') {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, year: 'numeric' }).formatToParts(d)
  return parts.find((p) => p.type === 'year')?.value || String(new Date().getFullYear())
}

function monthOf(d: Date, timeZone = 'America/New_York') {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone, month: '2-digit' }).formatToParts(d)
  return parts.find((p) => p.type === 'month')?.value || '01'
}

function rangeFor(period: Period, now = new Date()) {
  const tz = 'America/New_York'
  const to = mmddyyyy(now, tz)

  if (period === 'today') {
    return { from: to, to }
  }

  if (period === 'week') {
    const fromDate = new Date(now)
    fromDate.setDate(fromDate.getDate() - 6)
    return { from: mmddyyyy(fromDate, tz), to }
  }

  if (period === 'month') {
    const y = yyyy(now, tz)
    const m = monthOf(now, tz)
    return { from: `${m}/01/${y}`, to }
  }

  // year
  const y = yyyy(now, tz)
  return { from: `01/01/${y}`, to }
}

function safeString(v: any) {
  if (v === null || v === undefined) return ''
  return String(v)
}

function firstPathSegment(fullParentPathName: string) {
  const s = safeString(fullParentPathName).trim()
  if (!s) return ''
  const seg = s.split('.').map((x) => x.trim()).filter(Boolean)[0]
  return seg || s
}

function extractState(rec: any): string {
  const candidates = [
    rec?.placeOfPerformance?.state?.code,
    rec?.placeOfPerformance?.state,
    rec?.officeAddress?.state,
    rec?.state,
    rec?.popState,
  ]
  for (const c of candidates) {
    const s = safeString(c).trim().toUpperCase()
    if (s && s.length <= 3) return s
  }
  return 'NA'
}

function extractDept(rec: any): string {
  const fromPath = firstPathSegment(rec?.fullParentPathName)
  if (fromPath) return fromPath
  const org = safeString(rec?.organizationName || rec?.orgName || rec?.agency || rec?.agencyName).trim()
  if (org) return org
  const dept = safeString(rec?.deptindagency || rec?.department || rec?.departmentName).trim()
  return dept || 'Unknown'
}

function extractSetAside(rec: any): string {
  const candidates = [
    rec?.setAside,
    rec?.setAsideDescription,
    rec?.typeOfSetAsideDescription,
    rec?.typeOfSetAside,
    rec?.setAsideCode,
  ]
  for (const c of candidates) {
    const s = safeString(c).trim()
    if (s) return s
  }
  return 'None/Unspecified'
}

function extractPostedDate(rec: any): string {
  const candidates = [rec?.postedDate, rec?.postedDateString, rec?.publishDate, rec?.publishDateString]
  for (const c of candidates) {
    const s = safeString(c).trim()
    if (s) return s
  }
  return ''
}

function extractTitle(rec: any): string {
  const candidates = [rec?.title, rec?.solicitationTitle, rec?.noticeTitle, rec?.synopsis]
  for (const c of candidates) {
    const s = safeString(c).trim()
    if (s) return s
  }
  return 'Untitled Solicitation'
}

function extractUiLink(rec: any): string {
  const id = safeString(rec?.noticeId || rec?.noticeId || rec?.id).trim()
  // Prefer the public listing URL (works without a SAM.gov login).
  if (id) return `https://sam.gov/opp/${encodeURIComponent(id)}/view`

  const candidates = [rec?.uiLink, rec?.links?.uiLink, rec?.url, rec?.samUrl]
  for (const c of candidates) {
    const s = safeString(c).trim()
    if (s) return s
  }
  return 'https://sam.gov'
}

async function samSearch(params: {
  apiKey: string
  postedFrom: string
  postedTo: string
  limit: number
  offset: number
}) {
  const url = new URL('https://api.sam.gov/opportunities/v2/search')
  url.searchParams.set('api_key', params.apiKey)
  url.searchParams.set('postedFrom', params.postedFrom)
  url.searchParams.set('postedTo', params.postedTo)
  url.searchParams.set('limit', String(params.limit))
  url.searchParams.set('offset', String(params.offset))
  // Note: request-side status filters vary by environment; we filter for active notices below when the field is present.

  const requestKey = `sam:analytics:solicitations:${url.toString().replace(/api_key=[^&]+/, 'api_key=KEY')}`
  return coalesceInFlight<any>(requestKey, async () => {
    const { url: proxiedUrl, extraHeaders: samHeaders } = resolveSamUrl(url.toString())
    const res = await fetch(proxiedUrl, {
      method: 'GET',
      headers: { Accept: 'application/json', ...samHeaders },
      cache: 'no-store',
    })

    const text = await res.text()
    let json: any = null
    try {
      json = text ? JSON.parse(text) : null
    } catch {
      json = null
    }

    if (!res.ok) {
      const msg =
        json?.error?.message ||
        json?.message ||
        json?.error ||
        (text && text.length < 400 ? text : `SAM.gov API error (HTTP ${res.status})`)
      throw new Error(msg)
    }

    if (!json || typeof json !== 'object') {
      throw new Error('SAM.gov API returned non-JSON or empty response')
    }

    return json
  })
}

function topN(map: Record<string, number>, n = 10) {
  return Object.entries(map)
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, n)
}

export async function GET(req: Request) {
  const apiKey = getApiKey()
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          'Missing SAM.gov API key. Set SAM_GOV_API_KEY (recommended) or SAM_API_KEY in your environment variables.',
      },
      { status: 500 }
    )
  }

  const { searchParams } = new URL(req.url)
  const period = (searchParams.get('period') || 'month') as Period
  const selected: Period = ['today', 'week', 'month', 'year'].includes(period) ? period : 'month'

  const maxRecords = Math.min(Math.max(Number(searchParams.get('maxRecords') || 5000), 1000), 20000)
  const sampleLimit = Math.min(Math.max(Number(searchParams.get('sampleLimit') || 12), 5), 50)
  const refresh = ['1', 'true', 'yes'].includes((searchParams.get('refresh') || '').toLowerCase())

  const now = new Date()
  const cacheDay = mmddyyyy(now, 'America/New_York')
  const cacheKey = `period=${selected}|max=${maxRecords}|sample=${sampleLimit}|day=${cacheDay}`
  if (!refresh) {
    const cached = getAnalyticsCache(cacheKey)
    if (cached) {
      return new NextResponse(JSON.stringify({ ...cached, cached: true, source: 'cache' }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 's-maxage=60, stale-while-revalidate=300',
        },
      })
    }
  }

  const periods: Period[] = ['today', 'week', 'month', 'year']

  try {
    // Counts for each timeframe using totalRecords (fast)
    const countsEntries = await Promise.all(
      periods.map(async (p) => {
        const { from, to } = rangeFor(p, now)
        const json = await samSearch({ apiKey, postedFrom: from, postedTo: to, limit: 1, offset: 0 })
        const total = Number(json?.totalRecords || json?.totalRecordsCount || 0)
        return [p, isFinite(total) ? total : 0] as const
      })
    )

    const counts = Object.fromEntries(countsEntries) as Record<Period, number>

    // Breakdown for selected period (paginate up to maxRecords)
    const { from, to } = rangeFor(selected, now)
    const limit = 1000

    const deptCounts: Record<string, number> = {}
    const setAsideCounts: Record<string, number> = {}
    const stateCounts: Record<string, number> = {}

    let offset = 0
    let fetched = 0
    let totalRecords = 0
    const sample: any[] = []

    while (true) {
      const json = await samSearch({ apiKey, postedFrom: from, postedTo: to, limit, offset })
      const data: any[] = Array.isArray(json?.opportunitiesData) ? json.opportunitiesData : []

      if (offset === 0) {
        const t = Number(json?.totalRecords || json?.totalRecordsCount || data.length || 0)
        totalRecords = isFinite(t) ? t : data.length
      }

      for (const rec of data) {
        const activeRaw = safeString((rec as any)?.active || (rec as any)?.is_active || (rec as any)?.status)
        const activeNorm = activeRaw.trim().toLowerCase()
        if (activeNorm && !['yes', 'y', 'true', 'active'].includes(activeNorm)) {
          continue
        }
        const dept = extractDept(rec)
        const setAside = extractSetAside(rec)
        const state = extractState(rec)

        deptCounts[dept] = (deptCounts[dept] || 0) + 1
        setAsideCounts[setAside] = (setAsideCounts[setAside] || 0) + 1
        stateCounts[state] = (stateCounts[state] || 0) + 1

        if (sample.length < sampleLimit) {
          sample.push({
            noticeId: rec?.noticeId || rec?.id || rec?.noticeId || null,
            title: extractTitle(rec),
            postedDate: extractPostedDate(rec),
            organizationName: safeString(rec?.organizationName || rec?.orgName || ''),
            department: dept,
            setAside,
            state,
            uiLink: extractUiLink(rec),
            solicitationNumber: safeString(rec?.solicitation_number || rec?.solNum || ''),
            noticeType: safeString(rec?.noticeType || rec?.type || ''),
          })
        }
      }

      fetched += data.length
      offset += limit

      if (data.length === 0) break
      if (fetched >= totalRecords) break
      if (fetched >= maxRecords) break
    }

    const isSampled = fetched < totalRecords

    const payload = {
      generatedAt: new Date().toISOString(),
      period: selected,
      ranges: {
        today: rangeFor('today', now),
        week: rangeFor('week', now),
        month: rangeFor('month', now),
        year: rangeFor('year', now),
        selected: { from, to },
      },
      counts,
      breakdown: {
        byDepartment: topN(deptCounts, 12),
        bySetAside: topN(setAsideCounts, 12),
        byState: topN(stateCounts, 12),
      },
      map: {
        states: stateCounts,
      },
      sample,
      meta: {
        totalRecords,
        fetchedRecords: fetched,
        isSampled,
        maxRecords,
        note: isSampled
          ? `Breakdowns are based on the newest ${fetched.toLocaleString()} records (out of ${totalRecords.toLocaleString()}). Increase maxRecords if you need more coverage.`
          : 'Breakdowns cover all records returned for the selected period.',
      },
    }

    setAnalyticsCache(cacheKey, payload)

    return new NextResponse(JSON.stringify(payload), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 's-maxage=60, stale-while-revalidate=300',
      },
    })
  } catch (err: any) {
    return NextResponse.json(
      {
        error: err?.message || 'Failed to load solicitations analytics.',
      },
      { status: 500 }
    )
  }
}
