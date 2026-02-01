//sam/api/sam/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const SAM_UPSTREAM_BASE =
  process.env.SAM_UPSTREAM_BASE ||
  'https://api.sam.gov/prod/opportunities/v2/search'

function pad2(n: number) {
  return String(n).padStart(2, '0')
}

/**
 * Convert various date formats to MM/dd/yyyy
 * Handles: YYYY-MM-DD, ISO 8601 (with timestamps), and existing MM/dd/yyyy
 */
function normalizeSamDate(input: string) {
  const v = (input || '').trim()
  if (!v) return v

  // Already in MM/dd/yyyy
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(v)) return v

  // Try to parse as Date (handles ISO 8601, YYYY-MM-DD, and other formats)
  const date = new Date(v)
  
  // Check if valid date
  if (!isNaN(date.getTime())) {
    return formatMMDDYYYY(date)
  }

  // Unknown format; let SAM.gov validate (but you'll get a clear error)
  return v
}

function formatMMDDYYYY(d: Date) {
  const mm = pad2(d.getMonth() + 1)
  const dd = pad2(d.getDate())
  const yyyy = d.getFullYear()
  return `${mm}/${dd}/${yyyy}`
}

/**
 * Ensure postedFrom/postedTo exist and are in MM/dd/yyyy
 * Defaults to last 30 days if missing.
 */
function ensurePostedDateRange(params: URLSearchParams) {
  const rawFrom = params.get('postedFrom') || params.get('PostedFrom') || ''
  const rawTo = params.get('postedTo') || params.get('PostedTo') || ''

  // If either is missing, set defaults (last 30 days to today)
  if (!rawFrom || !rawTo) {
    const now = new Date()
    const from = new Date(now)
    from.setDate(from.getDate() - 30)

    params.set('postedFrom', formatMMDDYYYY(from))
    params.set('postedTo', formatMMDDYYYY(now))
    return
  }

  // Normalize existing values
  params.set('postedFrom', normalizeSamDate(rawFrom))
  params.set('postedTo', normalizeSamDate(rawTo))
}

/**
 * Fetch from SAM.gov with api_key injected
 */
async function fetchSAM(upstreamUrl: string) {
  const apiKey =
    process.env.SAM_GOV_API_KEY ||
    process.env.SAM_API_KEY ||
    process.env.SAM_APIKEY ||
    ''

  if (!apiKey) {
    throw new Error('Missing SAM API key (SAM_GOV_API_KEY or SAM_API_KEY)')
  }

  const url = new URL(upstreamUrl)

  // Inject api_key if missing
  if (!url.searchParams.get('api_key')) {
    url.searchParams.set('api_key', apiKey)
  }

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: { accept: 'application/json' },
    cache: 'no-store',
  })

  const text = await res.text()

  if (!res.ok) {
    throw new Error(`SAM.gov request failed ${res.status}: ${text}`)
  }

  try {
    return JSON.parse(text)
  } catch {
    throw new Error(`Invalid JSON returned from SAM.gov: ${text.slice(0, 500)}`)
  }
}

export async function GET(req: NextRequest) {
  try {
    // 🔐 Auth check
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Build upstream SAM.gov URL
    const requestUrl = new URL(req.url)
    const upstreamUrl = new URL(SAM_UPSTREAM_BASE)

    // Pass through all query params from /api/sam
    for (const [key, value] of requestUrl.searchParams.entries()) {
      upstreamUrl.searchParams.set(key, value)
    }

    // ✅ Ensure required postedFrom/postedTo and correct date format
    ensurePostedDateRange(upstreamUrl.searchParams)

    // Execute query
    const data = await fetchSAM(upstreamUrl.toString())
    return NextResponse.json(data)
  } catch (err: any) {
    console.error('SAM API error:', err)

    return NextResponse.json(
      {
        error: 'SAM.gov request failed',
        message: err?.message || 'Unknown error',
      },
      { status: 500 }
    )
  }
}