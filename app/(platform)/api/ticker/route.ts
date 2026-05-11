import { NextRequest, NextResponse } from 'next/server'
import { coalesceInFlight } from '@/lib/in-flight-coalescer'
import { resolveSamUrl } from '@/lib/samgov-api'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 60 // Maximum execution time

// ✅ Simple in-memory cache to prevent hammering SAM.gov
let lastFetchAt = 0
let lastPayload: any = null
const MIN_INTERVAL_MS = 5 * 60_000 // 5 minutes
const FETCH_TIMEOUT_MS = 50_000 // 50 second timeout

// Utility: Fetch with timeout and retry
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = FETCH_TIMEOUT_MS,
  maxRetries: number = 2
): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)
      
      // Don't retry on client errors (4xx)
      if (response.status >= 400 && response.status < 500) {
        return response
      }
      
      // Return successful responses
      if (response.ok) {
        return response
      }
      
      // Retry on server errors (5xx) if we have attempts left
      if (attempt < maxRetries) {
        const backoffMs = 1000 * Math.pow(2, attempt) // Exponential backoff
        console.log(`⚠️ SAM.gov API error ${response.status}, retrying in ${backoffMs}ms... (attempt ${attempt + 1}/${maxRetries})`)
        await new Promise(resolve => setTimeout(resolve, backoffMs))
        continue
      }
      
      return response
    } catch (error: any) {
      clearTimeout(timeoutId)
      
      // Handle timeout
      if (error.name === 'AbortError') {
        if (attempt < maxRetries) {
          const backoffMs = 1000 * Math.pow(2, attempt)
          console.log(`⏱️ Request timeout, retrying in ${backoffMs}ms... (attempt ${attempt + 1}/${maxRetries})`)
          await new Promise(resolve => setTimeout(resolve, backoffMs))
          continue
        }
        throw new Error('SAM.gov API request timed out after retries')
      }
      
      // Handle other errors
      if (attempt < maxRetries) {
        const backoffMs = 1000 * Math.pow(2, attempt)
        console.log(`❌ Fetch error: ${error.message}, retrying in ${backoffMs}ms... (attempt ${attempt + 1}/${maxRetries})`)
        await new Promise(resolve => setTimeout(resolve, backoffMs))
        continue
      }
      
      throw error
    }
  }
  
  throw new Error('Max retries exceeded')
}

export async function GET(request: NextRequest) {
  try {
    const now = Date.now()

    // Return cached result if called too frequently
    if (lastPayload && now - lastFetchAt < MIN_INTERVAL_MS) {
      console.log('📦 Returning cached ticker data')
      return NextResponse.json(lastPayload)
    }

    const apiKey = process.env.SAMGOVAPIKEY

    if (!apiKey) {
      console.error('❌ SAM.gov API key not found')
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
    }

    // Get today's date for filtering new solicitations
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)

    // Format dates as MM/DD/YYYY (SAM.gov expects this format in many endpoints)
    const formatDate = (date: Date) => {
      const mm = String(date.getMonth() + 1).padStart(2, '0')
      const dd = String(date.getDate()).padStart(2, '0')
      const yyyy = date.getFullYear()
      return `${mm}/${dd}/${yyyy}`
    }

    const postedFrom = formatDate(yesterday)
    const postedTo = formatDate(today)

    console.log('📡 Fetching ticker data from SAM.gov...')
    console.log(`📅 Date range: ${postedFrom} - ${postedTo}`)

    // Build SAM.gov search URL
    const url = new URL('https://api.sam.gov/prod/opportunities/v2/search')
    url.searchParams.set('api_key', apiKey)
    url.searchParams.set('postedFrom', postedFrom)
    url.searchParams.set('postedTo', postedTo)
    url.searchParams.set('limit', '100')
    url.searchParams.set('offset', '0')
    url.searchParams.set('sortBy', 'postedDate')
    url.searchParams.set('order', 'desc')
    url.searchParams.set('ptype', 'o') // opportunities

    const liveResult = await coalesceInFlight<
      { ok: true; payload: any } | { ok: false; status: number }
    >(`sam:ticker:${postedFrom}:${postedTo}`, async () => {
      const { url: proxiedUrl, extraHeaders: samHeaders } = resolveSamUrl(url.toString())
      const response = await fetchWithTimeout(proxiedUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SAM-Gov-Search-App/1.0',
          ...samHeaders,
        },
        cache: 'no-store',
      })

      if (!response.ok) {
        console.error('❌ SAM.gov API error:', response.status, response.statusText)
        return { ok: false as const, status: response.status }
      }

      const data = await response.json()
      const opportunities = Array.isArray(data?.opportunitiesData)
        ? data.opportunitiesData
        : []

      console.log('✅ Ticker data fetched:', opportunities.length, 'new opportunities')

      const payload = {
        success: true,
        count: data.totalRecords || opportunities.length || 0,
        opportunities: opportunities.slice(0, 30),
        lastUpdated: new Date().toISOString(),
      }
      lastFetchAt = Date.now()
      lastPayload = payload
      return { ok: true as const, payload }
    })

    if (!liveResult.ok) {
      if (lastPayload) {
        console.log('📦 Returning stale cached data due to API error')
        return NextResponse.json({
          ...lastPayload,
          warning: 'Using cached data due to API issues'
        })
      }
      return NextResponse.json(
        { error: 'Failed to fetch from SAM.gov' },
        { status: liveResult.status }
      )
    }

    return NextResponse.json(liveResult.payload)
  } catch (error: any) {
    console.error('❌ Ticker API error:', error)
    
    // Return last cached data if available on error
    if (lastPayload) {
      console.log('📦 Returning stale cached data due to error')
      return NextResponse.json({
        ...lastPayload,
        warning: 'Using cached data due to temporary issues'
      })
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}
