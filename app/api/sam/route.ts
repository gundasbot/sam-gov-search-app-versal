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
 * Normalise postedFrom / postedTo to MM/dd/yyyy.
 * SAM.gov API REQUIRES both postedFrom and postedTo - they're mandatory fields.
 * SAM.gov also rejects ranges >= 365 days apart (must be <= 364 days).
 * 
 * Strategy: If no posted dates provided, default to the maximum allowed range (364 days)
 * to capture as many opportunities as possible (approximately 1 year back).
 */
function ensurePostedDateRange(params: URLSearchParams) {
  const rawFrom = params.get('postedFrom') || params.get('PostedFrom') || ''
  const rawTo   = params.get('postedTo')   || params.get('PostedTo')   || ''

  // Remove the capitalised variants so we don't double-send
  params.delete('PostedFrom')
  params.delete('PostedTo')

  // Helper: zero out time component so all math is pure-date
  function midnight(d: Date): Date {
    d.setHours(0, 0, 0, 0)
    return d
  }

  // Resolve postedTo: use what was sent, or fall back to today
  let resolvedTo: Date
  if (rawTo) {
    const parsed = new Date(rawTo)
    resolvedTo = isNaN(parsed.getTime()) ? new Date() : parsed
  } else {
    resolvedTo = new Date()
  }
  resolvedTo = midnight(resolvedTo)

  // Resolve postedFrom: use what was sent, or default to 364 days ago (SAM.gov max range)
  let resolvedFrom: Date
  if (rawFrom) {
    const parsed = new Date(rawFrom)
    if (!isNaN(parsed.getTime())) {
      resolvedFrom = midnight(parsed)
    } else {
      // unparseable â€” fall back to 364-day window
      const fallback = midnight(new Date(resolvedTo))
      fallback.setDate(fallback.getDate() - 364)
      resolvedFrom = fallback
    }
  } else {
    // ðŸ†• No postedFrom supplied â€” default to 364 DAYS back (SAM.gov maximum, ~1 year)
    // This captures most relevant opportunities while respecting API limits
    const fallback = midnight(new Date(resolvedTo))
    fallback.setDate(fallback.getDate() - 364)
    resolvedFrom = fallback
    console.log('ðŸ“… No posted date filter - using max 364-day range (SAM.gov limit)')
  }

  // âœ… Validate date range is <= 364 days (SAM.gov requirement)
  const diffMs = resolvedTo.getTime() - resolvedFrom.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays > 364) {
    // If range exceeds 364 days, adjust to exactly 364 days
    console.log(`ðŸ“… Date range too large (${diffDays} days). Adjusting to 364 days max.`)
    const adjusted = midnight(new Date(resolvedTo))
    adjusted.setDate(adjusted.getDate() - 364)
    resolvedFrom = adjusted
  }

  params.set('postedTo', formatMMDDYYYY(resolvedTo))
  params.set('postedFrom', formatMMDDYYYY(resolvedFrom))
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

/**
 * ðŸ” DEBUG: Show what SAM.gov actually returns
 */
function debugSAMResponse(data: any, requestedSetAside: string | null) {
  if (!data?.opportunitiesData?.length) {
    console.log('âš ï¸  SAM.gov returned 0 opportunities')
    return
  }
  
  const firstOpp = data.opportunitiesData[0]
  console.log('ðŸ” SAM.gov Response DEBUG:')
  console.log('  Total returned:', data.opportunitiesData.length)
  console.log('  Looking for set-aside:', requestedSetAside || 'N/A')
  console.log('  First opportunity:')
  console.log('    - title:', firstOpp.title?.substring(0, 60))
  console.log('    - typeOfSetAside:', firstOpp.typeOfSetAside)
  console.log('    - typeOfSetAsideDescription:', firstOpp.typeOfSetAsideDescription)
  console.log('    - type:', firstOpp.type)
  
  // Sample 5 opportunities to see variety
  console.log('  Sample of 5 opportunities set-aside values:')
  data.opportunitiesData.slice(0, 5).forEach((opp: any, idx: number) => {
    console.log(`    [${idx}] typeOfSetAside="${opp.typeOfSetAside}" | typeOfSetAsideDescription="${opp.typeOfSetAsideDescription}"`)
  })
}

/**
 * Map frontend parameters to SAM.gov API v2 parameters
 * Based on official SAM.gov API documentation
 */
function mapParametersToSAMAPI(params: URLSearchParams): URLSearchParams {
  const samParams = new URLSearchParams()

  // ===== DATE PARAMETERS =====
  if (params.has('postedFrom')) {
    samParams.set('postedFrom', params.get('postedFrom')!)
  }
  if (params.has('postedTo')) {
    samParams.set('postedTo', params.get('postedTo')!)
  }

  // Response Deadline - convert single field to rdlfrom/rdlto
  const responseDeadline = params.get('responseDeadline')
  if (responseDeadline) {
    samParams.set('rdlfrom', responseDeadline)
    samParams.set('rdlto', responseDeadline)
  }

  // ===== PROCUREMENT TYPE =====
  const procurementType = params.get('procurementType') || params.get('ptype')
  if (procurementType && procurementType !== 'all' && procurementType !== '') {
    samParams.set('ptype', procurementType)
  }

  // ===== IDENTIFICATION PARAMETERS =====
  const solNum = params.get('solicitationNumber') || params.get('solnum')
  if (solNum) {
    samParams.set('solnum', solNum)
  }

  const noticeId = params.get('noticeId') || params.get('noticeid')
  if (noticeId) {
    samParams.set('noticeid', noticeId)
  }

  // ===== SEARCH PARAMETERS =====
  const keywords = params.get('keywords')
  if (keywords && !params.has('keywordMode')) {
    samParams.set('title', keywords)
  }
  const title = params.get('title')
  if (title && !keywords) {
    samParams.set('title', title)
  }

  // ===== CLASSIFICATION CODES =====
  const naics = params.get('naicsCode') || params.get('naics') || params.get('ncode')
  if (naics) {
    samParams.set('ncode', naics.substring(0, 6))
  }

  const classCode = params.get('classificationCode') || params.get('pscCode') || params.get('ccode')
  if (classCode) {
    samParams.set('ccode', classCode)
  }

  // ===== SET-ASIDE =====
  const setAside = params.get('setAside') || params.get('typeOfSetAside') || params.get('typeOfSetAsideCode')
  if (setAside && setAside !== '') {
    samParams.set('typeOfSetAside', setAside)
  }

  const setAsideDesc = params.get('typeOfSetAsideDescription')
  if (setAsideDesc) {
    samParams.set('typeOfSetAsideDescription', setAsideDesc)
  }

  // ===== LOCATION PARAMETERS =====
  const state = params.get('state') || params.get('stateOfPerformance')
  if (state) {
    samParams.set('state', state)
  }

  const zip = params.get('zip') || params.get('placeOfPerformanceZip')
  if (zip) {
    samParams.set('zip', zip)
  }

  // ===== ORGANIZATION PARAMETERS =====
  const orgCode = params.get('organizationCode')
  if (orgCode) {
    samParams.set('organizationCode', orgCode)
  }

  const orgName = params.get('organizationName') || params.get('agency')
  if (orgName) {
    samParams.set('organizationName', orgName)
  }

  const deptName = params.get('deptname') || params.get('department')
  if (deptName) {
    samParams.set('deptname', deptName)
  }

  const subtier = params.get('subtier')
  if (subtier) {
    samParams.set('subtier', subtier)
  }

  // ===== STATUS =====
  const status = params.get('status') || params.get('isActive') || params.get('opportunityStatus')
  if (status && status !== 'all' && status !== '') {
    if (status === 'true' || status === 'active') {
      samParams.set('status', 'active')
    } else if (status === 'false' || status === 'inactive') {
      samParams.set('status', 'inactive')
    } else {
      samParams.set('status', status)
    }
  }

  // ===== PAGINATION =====
  const limit = params.get('limit')
  if (limit) {
    const limitNum = Math.max(1, Math.min(1000, parseInt(limit) || 1000))
    samParams.set('limit', limitNum.toString())
  } else {
    samParams.set('limit', '1000')
  }

  const offset = params.get('offset')
  if (offset) {
    samParams.set('offset', offset)
  } else {
    samParams.set('offset', '0')
  }

  // ===== SPECIAL PARAMETERS =====
  const keywordMode = params.get('keywordMode')
  if (keywordMode) {
    samParams.set('keywordMode', keywordMode)
  }

  return samParams
}
/**
 * ðŸ” Filter opportunities by set-aside code (backend filtering)
 * SAM.gov API ignores typeOfSetAsideCode parameter, so we filter manually
 */
function filterBySetAside(data: any, requestedSetAside: string | null): any {
  if (!requestedSetAside || !data?.opportunitiesData) {
    return data
  }

  const originalCount = data.opportunitiesData.length
  const upperSetAside = requestedSetAside.trim().toUpperCase()

  // Filter opportunities that match the requested set-aside
  data.opportunitiesData = data.opportunitiesData.filter((opp: any) => {
    // âœ… CORRECT FIELD NAMES: SAM.gov returns typeOfSetAside and typeOfSetAsideDescription
    const oppSetAsideCode = (opp.typeOfSetAside || opp.setAsideCode || '').toString().trim().toUpperCase()
    const oppSetAsideDesc = (opp.typeOfSetAsideDescription || opp.setAside || '').toString().trim().toUpperCase()
    
    // Match if either field matches or contains the requested code
    const matches = (
      oppSetAsideCode === upperSetAside ||
      oppSetAsideCode.includes(upperSetAside) ||
      oppSetAsideDesc.includes(upperSetAside)
    )
    
    return matches
  })

  const filteredCount = data.opportunitiesData.length
  console.log(`âœ… Backend Set-Aside filter: "${requestedSetAside}" | SAM.gov returned: ${originalCount} â†’ After filter: ${filteredCount}`)

  // Update total count to reflect filtered results
  data.totalRecords = filteredCount

  return data
}

export async function GET(req: NextRequest) {
  try {
    // ðŸ”’ Auth check
    // Unauthenticated users still inside their free 15-minute browse window
    // send X-Browsing-Session: true.  Skip auth for those requests.
    const isBrowsingSession = req.headers.get('x-browsing-session') === 'true'

    if (!isBrowsingSession) {
      const session = await getServerSession(authOptions)
      if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    // Build upstream SAM.gov URL
    const requestUrl = new URL(req.url)
    const upstreamUrl = new URL(SAM_UPSTREAM_BASE)

    // Map frontend parameters to SAM.gov API parameters
    console.log('ðŸ“¥ Frontend params received:', Array.from(requestUrl.searchParams.entries()).slice(0, 10))
    const mappedParams = mapParametersToSAMAPI(requestUrl.searchParams)
    
    // Apply mapped parameters to upstream URL
    for (const [key, value] of mappedParams.entries()) {
      upstreamUrl.searchParams.set(key, value)
    }

    // âœ… Ensure required postedFrom/postedTo and correct date format
    ensurePostedDateRange(upstreamUrl.searchParams)

    // ðŸ” Log the exact URL for debugging
    console.log('ðŸ“¤ SAM.gov params:', Array.from(upstreamUrl.searchParams.entries()).slice(0, 10))
    console.log('ðŸ” SAM.gov URL:', upstreamUrl.toString().replace(/api_key=[^&]+/, 'api_key=***'))

    // ðŸ” Capture the requested set-aside for backend filtering
    const requestedSetAside = requestUrl.searchParams.get('typeOfSetAsideCode') || 
                               requestUrl.searchParams.get('setAside') ||
                               requestUrl.searchParams.get('typeOfSetAside')
    
    // ðŸ”Ž Optional: broader keyword search by fanning out title searches per token and merging results.
    // The SAM Opportunities API doesn't support full-text keyword search across description like sam.gov UI.
    // For multi-word searches, we approximate "ANY word" by querying title for each token and merging/deduping.
    const keywordMode = (upstreamUrl.searchParams.get('keywordMode') || '').toLowerCase()
    const keywords = (upstreamUrl.searchParams.get('keywords') || '').trim()

    if (keywordMode === 'any' && keywords) {
      // Remove control params so they don't get forwarded to SAM API
      upstreamUrl.searchParams.delete('keywordMode')
      upstreamUrl.searchParams.delete('keywords')

      // Remove any existing title to avoid overly strict phrase matching
      upstreamUrl.searchParams.delete('title')

      // Tokenize: split on whitespace, drop short tokens, de-dupe
      const tokens = Array.from(
        new Set(
          keywords
            .split(/\s+/g)
            .map((t) => t.trim())
            .filter((t) => t.length >= 3)
        )
      ).slice(0, 5) // safety cap

      // Fan out requests (up to 5 tokens)
      const urls = tokens.map((tok) => {
        const u = new URL(upstreamUrl.toString())
        u.searchParams.set('title', tok)
        return u.toString()
      })

      const results = await Promise.all(urls.map((u) => fetchSAM(u)))

      // Merge + dedupe
      const merged: any[] = []
      const seen = new Set<string>()

      for (const r of results) {
        const items = Array.isArray((r as any)?.opportunitiesData) ? (r as any).opportunitiesData : []
        for (const it of items) {
          const key =
            (it as any)?.noticeId ||
            (it as any)?.noticeID ||
            (it as any)?.id ||
            JSON.stringify([it?.solnum, it?.title, it?.postedDate])
          if (seen.has(key)) continue
          seen.add(key)
          merged.push(it)
        }
      }

      // Respect original limit if present
      const limitStr = upstreamUrl.searchParams.get('limit') || ''
      const limit = limitStr ? Math.max(1, Math.min(1000, Number(limitStr) || 1000)) : 1000

      const responsePayload: any = results[0] || {}
      responsePayload.opportunitiesData = merged.slice(0, limit)
      responsePayload.totalRecords = merged.length
      responsePayload.hasMoreResults = merged.length > limit

      // ðŸ” DEBUG & Filter
      debugSAMResponse(responsePayload, requestedSetAside)
      return NextResponse.json(filterBySetAside(responsePayload, requestedSetAside))
    }

    // Execute query
    let data = await fetchSAM(upstreamUrl.toString())
    
    // ðŸ” DEBUG: Show what SAM.gov returned
    debugSAMResponse(data, requestedSetAside)
    
    // ðŸ” Apply set-aside filtering before returning
    data = filterBySetAside(data, requestedSetAside)
    
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