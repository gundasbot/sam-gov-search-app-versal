// app/api/sam/opportunities/route.ts
// ✅ FIX: Date format normalization — accepts any format, always sends MM/DD/YYYY to SAM.gov
import { NextResponse } from 'next/server'
import { coalesceInFlight } from '@/lib/in-flight-coalescer'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const SAM_API_KEY = process.env.SAMGOVAPIKEY || process.env.SAM_API_KEY || ''
const SAM_BASE_URL = 'https://api.sam.gov/opportunities/v2/search'

// ─── In-process cache (survives across requests in same Node process) ──────────
const CACHE = new Map<string, { data: any; expiresAt: number }>()
const CACHE_TTL_MS = 30 * 60 * 1000 // 30 minutes — SAM.gov data rarely changes more often than this

// ── Per-key cooldown: prevents hammering the same query from repeated refreshes ──
// Minimum gap between live SAM.gov fetches for the same query = 10 minutes
const FETCH_COOLDOWN_MS = 10 * 60 * 1000
const LAST_FETCH = new Map<string, number>()

function isOnCooldown(key: string): boolean {
  const last = LAST_FETCH.get(key)
  if (!last) return false
  return (Date.now() - last) < FETCH_COOLDOWN_MS
}
function markFetched(key: string) {
  LAST_FETCH.set(key, Date.now())
  // Prune old entries to avoid memory leak
  if (LAST_FETCH.size > 100) {
    const oldest = LAST_FETCH.keys().next().value
    if (oldest) LAST_FETCH.delete(oldest)
  }
}

function getCached(key: string) {
  const entry = CACHE.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) { CACHE.delete(key); return null }
  return entry.data
}
function setCache(key: string, data: any) {
  if (CACHE.size >= 50) {
    const firstKey = CACHE.keys().next().value
    if (firstKey) CACHE.delete(firstKey)
  }
  CACHE.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS })
}

// ─── Date helpers ──────────────────────────────────────────────────────────────

/**
 * ✅ FIX: Normalize ANY date string into MM/DD/YYYY for SAM.gov.
 * Handles:
 *   - YYYY/MM/DD  (what the dashboard was sending — caused 400)
 *   - YYYY-MM-DD  (ISO format)
 *   - MM/DD/YYYY  (already correct)
 *   - ISO datetime strings
 */
function toSAMDate(input: string): string {
  const s = input.trim()

  // Already MM/DD/YYYY? Pass through.
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s

  // YYYY/MM/DD or YYYY-MM-DD
  const ymdMatch = s.match(/^(\d{4})[\/\-](\d{2})[\/\-](\d{2})/)
  if (ymdMatch) {
    return `${ymdMatch[2]}/${ymdMatch[3]}/${ymdMatch[1]}`
  }

  // ISO datetime (2026-03-08T00:00:00.000Z)
  const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})T/)
  if (isoMatch) {
    return `${isoMatch[2]}/${isoMatch[3]}/${isoMatch[1]}`
  }

  // Fallback: try Date parsing
  const d = new Date(s)
  if (!isNaN(d.getTime())) return formatMMDDYYYY(d)

  // Last resort: return as-is (will likely 400, but at least we tried)
  console.warn(`⚠️ Could not normalize date: "${s}"`)
  return s
}

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

function clampInt(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min
  return Math.max(min, Math.min(max, Math.trunc(n)))
}

// ─── SAM.gov set-aside code normalizer ────────────────────────────────────────
const SET_ASIDE_DESC_MAP: Record<string, string> = {
  'total small business':       'SBA',
  'partial small business':     'SBP',
  '8(a)':                       '8A',
  '8(a) sole source':           '8AN',
  'hubzone':                    'HZC',
  'hubzone sole source':        'HZS',
  'service-disabled veteran':   'SDVOSBC',
  'sdvosb sole source':         'SDVOSBS',
  'women-owned small business': 'WOSB',
  'wosb sole source':           'WOSBSS',
  'economically disadvantaged': 'EDWOSB',
  'edwosb sole source':         'EDWOSBSS',
  'veteran-owned small business': 'VSA',
  'veteran-owned small business sole source': 'VSS',
  'vosb sole source':           'VSS',
  'local area set-aside':       'LAS',
  'indian economic enterprise': 'IEE',
}

function normalizeSetAside(code: any, desc: any): { code: string; description: string } {
  const rawCode = (code == null || String(code).toLowerCase() === 'null') ? '' : String(code).trim()
  const rawDesc = (desc == null || String(desc).toLowerCase() === 'null') ? '' : String(desc).trim()

  const KNOWN_CODES = new Set([
    'SBA','SBP','8A','8AN','HZC','HZS','SDVOSBC','SDVOSBS',
    'WOSB','WOSBSS','EDWOSB','EDWOSBSS','VSA','VSS',
    'LAS','IEE','ISBEE','BICIVC','NONE',
  ])

  if (rawCode && rawCode.toUpperCase() !== 'NONE' && KNOWN_CODES.has(rawCode.toUpperCase())) {
    return { code: rawCode.toUpperCase(), description: rawDesc }
  }

  if (rawDesc) {
    const lower = rawDesc.toLowerCase()
    for (const [fragment, mappedCode] of Object.entries(SET_ASIDE_DESC_MAP)) {
      if (lower.includes(fragment)) {
        return { code: mappedCode, description: rawDesc }
      }
    }
  }

  return { code: '', description: rawDesc || '' }
}

// ─── Main handler ──────────────────────────────────────────────────────────────
export async function GET(req: Request) {
  if (!SAM_API_KEY) {
    return NextResponse.json(
      { ok: false, error: 'SAM API key not configured', opportunities: [], totalRecords: 0 },
      { status: 500 }
    )
  }

  const NO_CACHE_HEADERS = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
  }

  try {
    const { searchParams } = new URL(req.url)

    // ?refresh=true bypasses cache for this request key only.
    // It no longer clears the full in-process cache map.
    const refreshParam = (searchParams.get('refresh') || '').toLowerCase()
    const forceLiveRefresh = refreshParam === 'true' || refreshParam === '1'

    // ── Pagination ──────────────────────────────────────────────────────────
    const requestedLimit = Number(searchParams.get('limit') || 20)
    // ✅ FIX: Raised cap from 20 → 1000 so client requests (e.g. limit=250) are honoured.
    // SAM.gov itself supports up to 1000 per request.
    const limit = clampInt(requestedLimit, 1, 1000)
    const offset = clampInt(Number(searchParams.get('offset') || 0), 0, 1_000_000)

    // ── Search params ───────────────────────────────────────────────────────
    const keyword  = (searchParams.get('keyword') || searchParams.get('q') || '').trim()

    // ✅ FIX: Always normalize dates through toSAMDate()
    const rawPostedFrom = (searchParams.get('postedFrom') || '').trim()
    const rawPostedTo   = (searchParams.get('postedTo') || '').trim()
    // 30-day window by default: recent enough that most results still have future deadlines
    const postedFrom = rawPostedFrom ? toSAMDate(rawPostedFrom) : daysAgo(30)
    const postedTo   = rawPostedTo   ? toSAMDate(rawPostedTo)   : formatMMDDYYYY(new Date())

    const setAside   = (searchParams.get('setAside') || searchParams.get('typeOfSetAside') || '').trim()
    const naics      = (searchParams.get('naics') || '').trim()
    const agency     = (searchParams.get('agency') || '').trim()
    const psc        = (searchParams.get('psc') || '').trim()
    const solNum     = (searchParams.get('solicitationNumber') || '').trim()
    const state      = (searchParams.get('state') || '').trim()
    const status     = (searchParams.get('status') || 'active').trim()

    // ── Build SAM.gov params ─────────────────────────────────────────────────
    const params = new URLSearchParams({
      api_key:     SAM_API_KEY,
      limit:       String(limit),
      offset:      String(offset),
      postedFrom,
      postedTo,
    })

    if (!searchParams.get('ptype')) params.append('ptype', 'o,k,r,s,g,i')

    if (keyword)   params.append('q', keyword)
    if (naics)     params.append('naics', naics)
    if (agency)    params.append('deptname', agency)
    if (psc)       params.append('psc', psc)
    if (solNum)    params.append('solnum', solNum)
    if (state)     params.append('state', state)
    if (status === 'active') params.append('status', 'active')

    if (setAside && setAside.toUpperCase() !== 'ALL') {
      params.append('typeOfSetAside', setAside)
    }

    const cacheKey = params.toString().replace(`api_key=${SAM_API_KEY}`, 'KEY')

    // ── Check cache ──────────────────────────────────────────────────────────
    const cached = getCached(cacheKey)
    if (cached && !forceLiveRefresh) {
      console.log('⚡ SAM cache HIT:', cacheKey.substring(0, 80))
      return NextResponse.json({ ...cached, cached: true }, { status: 200, headers: NO_CACHE_HEADERS })
    }

    // ── Cooldown guard: if this exact query was fetched recently,
    // return a 429 instead of hammering SAM.gov (e.g. rapid Refresh clicks) ──
    if (isOnCooldown(cacheKey)) {
      const secondsLeft = Math.ceil((FETCH_COOLDOWN_MS - (Date.now() - (LAST_FETCH.get(cacheKey) ?? 0))) / 1000)
      console.warn(`⏱️ SAM rate-limit cooldown: ${secondsLeft}s remaining for this query`)
      if (cached) {
        return NextResponse.json(
          {
            ...cached,
            cached: true,
            refreshDeferred: true,
            message: `Using cached data. Next live refresh available in ${secondsLeft}s.`,
          },
          { status: 200, headers: { ...NO_CACHE_HEADERS, 'Retry-After': String(secondsLeft) } }
        )
      }
      return NextResponse.json(
        { ok: false, error: 'rate_limited', message: `Please wait ${secondsLeft}s before refreshing again.`, retryAfter: secondsLeft },
        { status: 429, headers: { ...NO_CACHE_HEADERS, 'Retry-After': String(secondsLeft) } }
      )
    }

    const liveOutcome = await coalesceInFlight<
      | { kind: 'success'; result: any }
      | { kind: 'error'; status: number; payload: any }
    >(`sam:opportunities:${cacheKey}`, async () => {
      const apiUrl = `${SAM_BASE_URL}?${params.toString()}`
      console.log('📡 SAM.gov fetch (limit=%d):', limit, apiUrl.replace(SAM_API_KEY, 'KEY'))
      markFetched(cacheKey)

      const response = await fetch(apiUrl, {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      })

      if (!response.ok) {
        const text = await response.text()
        const isSuspended = response.status === 500 && /SUSPENDED/i.test(text)
        const is504 = response.status === 504 || text.includes('Gateway Time-out')

        console.error('❌ SAM.gov API ERROR')
        console.error(`Status: ${response.status}`)
        console.error(`StatusText: ${response.statusText}`)
        console.error(`URL: ${apiUrl.replace(SAM_API_KEY, 'KEY')}`)
        console.error('Headers:', Object.fromEntries(response.headers.entries()))
        console.error('Response Body:', text)
        if (is504) {
          console.error('504 Gateway Timeout detected. Try reducing the limit, checking your API key, or contacting SAM.gov support.')
        }

        return {
          kind: 'error' as const,
          status: is504 ? 504 : isSuspended ? 503 : response.status,
          payload: {
            ok: false,
            upstream: 'sam.gov',
            suspended: isSuspended,
            timedOut: is504,
            message: is504
              ? 'SAM.gov timed out. Try a smaller date range or add more search filters.'
              : isSuspended
                ? 'SAM.gov is temporarily unavailable.'
                : 'SAM.gov request failed',
            details: text.slice(0, 300),
          },
        }
      }

      const data = await response.json()
      const opportunities = (data.opportunitiesData || []).map((opp: any) => {
        const { code: setAsideCode, description: setAsideDesc } = normalizeSetAside(
          opp.typeOfSetAside,
          opp.typeOfSetAsideDescription
        )

        return {
          noticeId:             opp.noticeId ?? '',
          title:                opp.title ?? 'Untitled',
          solicitationNumber:   opp.solicitationNumber ?? opp.solicitation_number ?? opp.noticeId ?? '',
          department:           opp.fullParentPathName?.split(':')?.[0]?.trim()
                                ?? opp.departmentName ?? opp.department ?? 'Unknown',
          fullParentPathName:   opp.fullParentPathName ?? '',
          postedDate:           opp.postedDate ?? opp.publishDate ?? null,
          updatedPostedDate:    opp.updatedPostedDate ?? null,
          responseDeadLine:     opp.responseDeadLine ?? opp.responseDate ?? null,
          responseDeadline:     opp.responseDeadLine ?? opp.responseDate ?? null,
          updatedResponseDeadLine: opp.updatedResponseDeadLine ?? null,
          typeOfSetAside:            setAsideCode,
          typeOfSetAsideDescription: setAsideDesc,
          setAside:                  setAsideCode,
          naicsCode:  Array.isArray(opp.naics) ? opp.naics[0] : (opp.naicsCode ?? opp.naics ?? null),
          naics:      Array.isArray(opp.naics) ? opp.naics.join(', ') : (opp.naicsCode ?? opp.naics ?? null),
          classificationCode: opp.classificationCode ?? null,
          type:               opp.type ?? opp.baseType ?? null,
          active:             opp.active ?? 'Yes',
          uiLink:             opp.uiLink ?? `https://sam.gov/opp/${opp.noticeId}/view`,
          officeAddress:      opp.officeAddress ?? null,
          placeOfPerformance: opp.placeOfPerformance ?? null,
          pointOfContact:     Array.isArray(opp.pointOfContact) ? opp.pointOfContact : [],
          organizationType:   opp.organizationType ?? null,
        }
      })

      const result = {
        ok:           true,
        totalRecords: data.totalRecords ?? 0,
        count:        opportunities.length,
        limit,
        offset,
        opportunities,
        fetchedAt:    new Date().toISOString(),
        cached:       false,
      }

      setCache(cacheKey, result)
      return { kind: 'success' as const, result }
    })

    if (liveOutcome.kind === 'error') {
      return NextResponse.json(liveOutcome.payload, { status: liveOutcome.status, headers: NO_CACHE_HEADERS })
    }

    return NextResponse.json(liveOutcome.result, { status: 200, headers: NO_CACHE_HEADERS })

  } catch (e: any) {
    const isAbort = e?.name === 'AbortError'
    console.error('❌ SAM opportunities route error:', e?.message)
    return NextResponse.json(
      {
        ok: false,
        error: isAbort ? 'SAM.gov timed out — try narrowing your date range or adding filters' : (e?.message ?? 'Unknown error'),
        timedOut: isAbort,
      },
      { status: isAbort ? 504 : 500, headers: {
        'Cache-Control': 'no-store',
        Pragma: 'no-cache',
        Expires: '0',
      }}
    )
  }
}
