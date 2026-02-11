// app/api/sam/opportunities/route.ts
import { NextResponse } from 'next/server'

// ?? Disable all Next.js caching for this route
export const dynamic = 'force-dynamic'
export const revalidate = 0

const SAM_API_KEY = process.env.SAMGOVAPIKEY || process.env.SAM_API_KEY || ''
const SAM_BASE_URL = 'https://api.sam.gov/opportunities/v2/search'

// SAM.gov requires MM/dd/yyyy
function formatDateMMDDYYYY(d: Date) {
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${mm}/${dd}/${yyyy}`
}

function daysAgo(days: number) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return formatDateMMDDYYYY(d)
}

function clampInt(n: number, min: number, max: number) {
  if (!Number.isFinite(n)) return min
  return Math.max(min, Math.min(max, Math.trunc(n)))
}

export async function GET(req: Request) {
  if (!SAM_API_KEY) {
    return NextResponse.json(
      {
        ok: false,
        error: 'SAM API key not configured',
        opportunities: [],
        totalRecords: 0,
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    )
  }

  try {
    const { searchParams } = new URL(req.url)

    // ? HARD SAFETY LIMIT (keep payload small)
    const limit = clampInt(Number(searchParams.get('limit') || 200), 1, 250)
    const offset = clampInt(Number(searchParams.get('offset') || 0), 0, 1_000_000)

    // support both "keyword" and "q"
    const keyword = (searchParams.get('keyword') || searchParams.get('q') || '').trim()

    // optional overrides (still default to last 30 days)
    const postedFrom = (searchParams.get('postedFrom') || '').trim() || daysAgo(30)
    const postedTo = (searchParams.get('postedTo') || '').trim() || formatDateMMDDYYYY(new Date())

    const params = new URLSearchParams({
      api_key: SAM_API_KEY,
      ptype: 'o',
      limit: String(limit),
      offset: String(offset),
      postedFrom,
      postedTo,
    })

    if (keyword) params.append('q', keyword)

    const apiUrl = `${SAM_BASE_URL}?${params.toString()}`
    console.log('?? SAM.gov fetch:', apiUrl)

    // ? Timeout to avoid hanging requests
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 20_000)

    const response = await fetch(apiUrl, {
      cache: 'no-store', // ? critical fix
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout))

    if (!response.ok) {
      const text = await response.text()

      const isSuspended = response.status === 500 && /SUSPENDED/i.test(text)

      return NextResponse.json(
        {
          ok: false,
          upstream: 'sam.gov',
          suspended: isSuspended,
          message: isSuspended
            ? 'SAM.gov is temporarily unavailable. Please retry later.'
            : 'SAM.gov request failed',
          details: text.slice(0, 500),
        },
        {
          status: isSuspended ? 503 : response.status,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            Pragma: 'no-cache',
            Expires: '0',
          },
        }
      )
    }

    const data = await response.json()

    const opportunities = (data.opportunitiesData || []).map((opp: any) => ({
      noticeId: opp.noticeId ?? '',
      title: opp.title ?? 'Untitled Opportunity',
      solicitationNumber: opp.solicitation_number ?? opp.noticeId ?? 'N/A',
      department: opp.departmentName ?? opp.department ?? 'Unknown',
      postedDate: opp.postedDate ?? opp.publishDate ?? null,
      responseDeadline: opp.responseDeadLine ?? opp.responseDate ?? null,
      setAside: opp.typeOfSetAside ?? opp.typeOfSetAsideDescription ?? null,
      naics: Array.isArray(opp.naics) ? opp.naics.join(', ') : opp.naicsCode ?? null,
    }))

    return NextResponse.json(
      {
        ok: true,
        totalRecords: data.totalRecords ?? 0,
        count: opportunities.length,
        limit,
        offset,
        opportunities,
        fetchedAt: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    )
  } catch (e: any) {
    const isAbort = String(e?.name || '').toLowerCase().includes('abort')
    console.error('? SAM route error:', e)

    return NextResponse.json(
      {
        ok: false,
        error: isAbort ? 'SAM.gov request timed out' : e?.message ?? 'Unknown error',
      },
      {
        status: isAbort ? 504 : 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    )
  }
}
