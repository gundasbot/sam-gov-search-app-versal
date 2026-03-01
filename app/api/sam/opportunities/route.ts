// app/api/sam/opportunities/route.ts
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const SAM_API_KEY = process.env.SAMGOVAPIKEY || process.env.SAM_API_KEY || ''
const SAM_BASE_URL = 'https://api.sam.gov/opportunities/v2/search'

// ─── In-process cache (survives across requests in same Node process) ──────────
// Key = query string, Value = { data, expiresAt }
const CACHE = new Map<string, { data: any; expiresAt: number }>()
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

function getCached(key: string) {
  const entry = CACHE.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) { CACHE.delete(key); return null }
  return entry.data
}
function setCache(key: string, data: any) {
  // Limit cache size to 50 entries — evict oldest
  if (CACHE.size >= 50) {
    const firstKey = CACHE.keys().next().value
    if (firstKey) CACHE.delete(firstKey)
  }
  CACHE.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS })
}

// ─── Date helpers ──────────────────────────────────────────────────────────────
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
// SAM.gov returns inconsistent values: "null" (string), null, "", code, or description
// This maps both codes AND description fragments to canonical codes
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
  // ✅ KEY FIX: "Veteran-Owned Small Business Sole source" maps to VSS
  'veteran-owned small business sole source': 'VSS',
  'vosb sole source':           'VSS',
  'local area set-aside':       'LAS',
  'indian economic enterprise': 'IEE',
}

function normalizeSetAside(code: any, desc: any): { code: string; description: string } {
  const rawCode = (code == null || String(code).toLowerCase() === 'null') ? '' : String(code).trim()
  const rawDesc = (desc == null || String(desc).toLowerCase() === 'null') ? '' : String(desc).trim()

  // If we have a valid code already, use it
  const KNOWN_CODES = new Set([
    'SBA','SBP','8A','8AN','HZC','HZS','SDVOSBC','SDVOSBS',
    'WOSB','WOSBSS','EDWOSB','EDWOSBSS','VSA','VSS',
    'LAS','IEE','ISBEE','BICIVC','NONE',
  ])

  if (rawCode && rawCode.toUpperCase() !== 'NONE' && KNOWN_CODES.has(rawCode.toUpperCase())) {
    return { code: rawCode.toUpperCase(), description: rawDesc }
  }

  // Try to derive code from description
  if (rawDesc) {
    const lower = rawDesc.toLowerCase()
    for (const [fragment, mappedCode] of Object.entries(SET_ASIDE_DESC_MAP)) {
      if (lower.includes(fragment)) {
        return { code: mappedCode, description: rawDesc }
      }
    }
  }

  // No set-aside
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

    // ── Pagination ──────────────────────────────────────────────────────────
    // PERFORMANCE FIX: cap at 100 for search page, allow up to 250 for bulk loads
    // The search page was sending limit=1000 which causes 60s timeouts on SAM.gov
    const requestedLimit = Number(searchParams.get('limit') || 100)
    const limit = clampInt(requestedLimit, 1, 250)  // Hard cap at 250, never 1000
    const offset = clampInt(Number(searchParams.get('offset') || 0), 0, 1_000_000)

    // ── Search params ───────────────────────────────────────────────────────
    const keyword  = (searchParams.get('keyword') || searchParams.get('q') || '').trim()
    const postedFrom = (searchParams.get('postedFrom') || '').trim() || daysAgo(180) // default 6mo
    const postedTo   = (searchParams.get('postedTo') || '').trim() || formatMMDDYYYY(new Date())
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

    // Only add ptype=o for general searches (not when filtering by specific types)
    if (!searchParams.get('ptype')) params.append('ptype', 'o,k,r,s,g,i') // all active types

    if (keyword)   params.append('q', keyword)
    if (naics)     params.append('naics', naics)
    if (agency)    params.append('deptname', agency)
    if (psc)       params.append('psc', psc)
    if (solNum)    params.append('solnum', solNum)
    if (state)     params.append('state', state)
    if (status === 'active') params.append('status', 'active')

    // ✅ Set-aside: pass directly to SAM.gov so it filters server-side
    // This is faster than fetching 1000 records and filtering client-side
    if (setAside && setAside.toUpperCase() !== 'ALL') {
      params.append('typeOfSetAside', setAside)
    }

    const cacheKey = params.toString().replace(`api_key=${SAM_API_KEY}`, 'KEY')

    // ── Check cache ──────────────────────────────────────────────────────────
    const cached = getCached(cacheKey)
    if (cached) {
      console.log('⚡ SAM cache HIT:', cacheKey.substring(0, 80))
      return NextResponse.json({ ...cached, cached: true }, { status: 200, headers: NO_CACHE_HEADERS })
    }

    const apiUrl = `${SAM_BASE_URL}?${params.toString()}`
    console.log('📡 SAM.gov fetch (limit=%d):', limit, apiUrl.replace(SAM_API_KEY, 'KEY'))

    // ── Fetch with timeout ───────────────────────────────────────────────────
    // PERFORMANCE FIX: timeout scales with limit — 100 records = 15s max, 250 = 25s max
    const timeoutMs = Math.min(10_000 + limit * 100, 25_000)
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    const response = await fetch(apiUrl, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    }).finally(() => clearTimeout(timer))

    if (!response.ok) {
      const text = await response.text()
      const isSuspended = response.status === 500 && /SUSPENDED/i.test(text)
      const is504 = response.status === 504 || text.includes('Gateway Time-out')
      
      console.error(`❌ SAM.gov ${response.status}${is504 ? ' (timeout — reduce limit)' : ''}`)
      
      return NextResponse.json(
        {
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
        { status: is504 ? 504 : isSuspended ? 503 : response.status, headers: NO_CACHE_HEADERS }
      )
    }

    const data = await response.json()

    // ── Normalize opportunities ───────────────────────────────────────────────
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
        responseDeadLine:     opp.responseDeadLine ?? opp.responseDate ?? null,      // camelCase match for OpportunitiesClient
        responseDeadline:     opp.responseDeadLine ?? opp.responseDate ?? null,      // also snake-friendly
        updatedResponseDeadLine: opp.updatedResponseDeadLine ?? null,
        // ✅ FIXED: preserve both code and description, never collapse to one field
        typeOfSetAside:            setAsideCode,
        typeOfSetAsideDescription: setAsideDesc,
        setAside:                  setAsideCode,   // alias for OpportunitiesClient hasSetAside()
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

    // Cache successful responses
    setCache(cacheKey, result)

    return NextResponse.json(result, { status: 200, headers: NO_CACHE_HEADERS })

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