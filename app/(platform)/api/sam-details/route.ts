import { NextRequest, NextResponse } from 'next/server'
import { coalesceInFlight } from '@/lib/in-flight-coalescer'
import { resolveSamUrl } from '@/lib/samgov-api'

const DETAILS_CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour
const DETAILS_CACHE_LIMIT = 400
const DETAILS_CACHE = new Map<string, { payload: any; expiresAt: number }>()

function getDetailsCache(noticeId: string) {
  const hit = DETAILS_CACHE.get(noticeId)
  if (!hit) return null
  if (Date.now() > hit.expiresAt) {
    DETAILS_CACHE.delete(noticeId)
    return null
  }
  return hit.payload
}

function setDetailsCache(noticeId: string, payload: any) {
  if (DETAILS_CACHE.size >= DETAILS_CACHE_LIMIT) {
    const oldest = DETAILS_CACHE.keys().next().value
    if (oldest) DETAILS_CACHE.delete(oldest)
  }
  DETAILS_CACHE.set(noticeId, { payload, expiresAt: Date.now() + DETAILS_CACHE_TTL_MS })
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const noticeId = searchParams.get('noticeid')
    const refresh = ['1', 'true', 'yes'].includes((searchParams.get('refresh') || '').toLowerCase())

    if (!noticeId) {
      return NextResponse.json({ error: 'Notice ID is required' }, { status: 400 })
    }

    if (!refresh) {
      const cached = getDetailsCache(noticeId)
      if (cached) return NextResponse.json({ ...cached, cached: true, source: 'cache' })
    }

    const apiKey = process.env.SAM_GOV_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: 'SAM.gov API key not configured' }, { status: 500 })
    }

    // Fetch opportunity details from SAM.gov
    const directUrl = `https://api.sam.gov/opportunities/v1/noticedesc?noticeid=${noticeId}&api_key=${apiKey}`
    const { url, extraHeaders: samHeaders } = resolveSamUrl(directUrl)

    const upstream = await coalesceInFlight<{ ok: boolean; status: number; data?: any }>(
      `sam:notice-details:${noticeId}`,
      async () => {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            ...samHeaders,
          },
        })
        if (!response.ok) {
          const errorText = await response.text()
          console.error('SAM.gov API error:', response.status, errorText)
          return { ok: false, status: response.status }
        }
        const data = await response.json()
        return { ok: true, status: 200, data }
      }
    )

    if (!upstream.ok || !upstream.data) {
      return NextResponse.json(
        { error: 'Failed to fetch opportunity details from SAM.gov' },
        { status: upstream.status || 500 }
      )
    }

    const data = upstream.data

    // Extract relevant data
    const result = {
      noticeId: data.noticeId || noticeId,
      setAsideCode: data.typeOfSetAsideCode || data.setAsideCode,
      setAside: data.typeOfSetAsideDescription || data.setAside,
      // Include other useful fields
      title: data.title,
      description: data.description,
      solicitationNumber: data.solicitation_number,
      responseDeadLine: data.responseDeadLine,
      postedDate: data.postedDate,
    }

    setDetailsCache(noticeId, result)
    return NextResponse.json({ ...result, cached: false, source: 'live' })
  } catch (error: any) {
    console.error('Error fetching opportunity details:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
