// app/api/saved-searches/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { randomBytes } from 'crypto'
import { sendAlertEmail } from '@/lib/email'
import { getCachedSearch, setCachedSearch, generateCacheKey } from '@/lib/sam-cache'

/* ---------------- helpers ---------------- */

const sanitize = (val: any): string | null =>
  typeof val === 'string' ? val.trim() || null : null

const toIntOrDefault = (val: any, def: number): number => {
  const n = typeof val === 'number' ? val : parseInt(String(val ?? ''), 10)
  return Number.isFinite(n) ? n : def
}

// Convert date string (YYYY-MM-DD) to ISO DateTime for Prisma
const toDateTime = (val: any): Date | null => {
  if (!val || typeof val !== 'string') return null
  const trimmed = val.trim()
  if (!trimmed) return null
  
  // If it's already a full ISO string, parse it
  if (trimmed.includes('T')) {
    const date = new Date(trimmed)
    return isNaN(date.getTime()) ? null : date
  }
  
  // If it's just a date (YYYY-MM-DD), convert to DateTime at midnight UTC
  const date = new Date(trimmed + 'T00:00:00.000Z')
  return isNaN(date.getTime()) ? null : date
}

// Convert Date to MM/DD/YYYY format for frontend
const formatDateForFrontend = (date: Date | null): string | null => {
  if (!date) return null
  const d = new Date(date)
  if (isNaN(d.getTime())) return null
  
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const year = d.getFullYear()
  return `${month}/${day}/${year}`
}

// Transform database record to frontend format
const transformSearchForFrontend = (search: any) => {
  return {
    ...search,
    // Map snake_case to camelCase
    userId: search.user_id,
    isPinned: search.is_pinned,
    solicitationNumber: search.solicitation_number,
    noticeId: search.notice_id,
    classificationCode: search.classification_code,
    organizationCode: search.organization_code,
    setAside: search.set_aside,
    stateOfPerformance: search.state_of_performance,
    placeOfPerformanceZip: search.place_of_performance_zip,
    opportunityStatus: search.opportunity_status,
    procurementType: search.procurement_type,
    subscriptionEnabled: search.subscription_enabled,
    emailNotification: search.email_notification,
    sendEmptyResults: search.send_empty_results,
    maxResults: search.max_results,
    deliveryTime: search.delivery_time,
    exportFormat: search.export_format,
    includeLinks: search.include_links,
    lastRunAt: search.last_run_at,
    lastResultCount: search.last_result_count,
    createdAt: search.created_at,
    updatedAt: search.updated_at,
    
    // Date fields - convert to MM/DD/YYYY format
    postedAfter: formatDateForFrontend(search.posted_after),
    postedBefore: formatDateForFrontend(search.posted_before),
    postedFrom: formatDateForFrontend(search.posted_after), // Alias
    postedTo: formatDateForFrontend(search.posted_before), // Alias
    rdlfrom: formatDateForFrontend(search.rdl_from),
    rdlto: formatDateForFrontend(search.rdl_to),
    
    // Keep original snake_case for backwards compatibility
    user_id: search.user_id,
    is_pinned: search.is_pinned,
    solicitation_number: search.solicitation_number,
    notice_id: search.notice_id,
    classification_code: search.classification_code,
    organization_code: search.organization_code,
    set_aside: search.set_aside,
    state_of_performance: search.state_of_performance,
    place_of_performance_zip: search.place_of_performance_zip,
    opportunity_status: search.opportunity_status,
    procurement_type: search.procurement_type,
    posted_after: search.posted_after,
    posted_before: search.posted_before,
    rdl_from: search.rdl_from,
    rdl_to: search.rdl_to,
    subscription_enabled: search.subscription_enabled,
    email_notification: search.email_notification,
    send_empty_results: search.send_empty_results,
    max_results: search.max_results,
    delivery_time: search.delivery_time,
    export_format: search.export_format,
    include_links: search.include_links,
    last_run_at: search.last_run_at,
    last_result_count: search.last_result_count,
    created_at: search.created_at,
    updated_at: search.updated_at,
  }
}

/* ---------------- error handler ---------------- */
function handlePrismaError(error: unknown, operation: string) {
  console.error(`❌ [API] Prisma error in ${operation}:`, error)

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2025':
        return NextResponse.json({ error: 'Record not found' }, { status: 404 })
      case 'P2002':
        return NextResponse.json({ error: 'Unique constraint violation' }, { status: 409 })
      case 'P2003':
        return NextResponse.json({ error: 'Foreign key constraint failed' }, { status: 400 })
      case 'P2024':
        return NextResponse.json({ error: 'Connection timeout' }, { status: 503 })
    }
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return NextResponse.json(
      { error: 'Database connection failed', details: 'Please try again in a moment' },
      { status: 503 }
    )
  }

  if (error instanceof Prisma.PrismaClientRustPanicError) {
    return NextResponse.json(
      { error: 'Database error occurred' },
      { status: 503 }
    )
  }

  // Generic error
  return NextResponse.json(
    { 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined 
    },
    { status: 500 }
  )
}

/* =========================================================
   POST – RUN SAVED SEARCH IMMEDIATELY
   ========================================================= */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch user details to get their profile name for email greeting
    const user = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: { name: true }
    })

    const savedSearch = await prisma.saved_searches_new.findFirst({
      where: { id, user_id: session.user.id },
    })

    if (!savedSearch) {
      return NextResponse.json({ error: 'Saved search not found' }, { status: 404 })
    }

    console.log('🚀 Running alert:', savedSearch.name)
    console.log('📧 Recipients:', savedSearch.recipients)
    console.log('⚙️ Frequency:', savedSearch.frequency)

    const searchParams = new URLSearchParams()

    if (savedSearch.keywords) searchParams.set('q', savedSearch.keywords)
    if (savedSearch.naics) searchParams.set('naics', savedSearch.naics)
    if (savedSearch.agency) searchParams.set('organizationId', savedSearch.agency)
    if (savedSearch.set_aside) {
      searchParams.set('typeOfSetAsideFilter', savedSearch.set_aside)
    }

    searchParams.set('limit', String(savedSearch.max_results ?? 100))

    // SAM.gov requires PostedFrom and PostedTo - use max 364-day range
    const today = new Date()
    const postedTo = today.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
    const postedFromDate = new Date(today)
    postedFromDate.setDate(postedFromDate.getDate() - 364)
    const postedFrom = postedFromDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
    
    searchParams.set('postedTo', postedTo)
    searchParams.set('postedFrom', postedFrom)

    const runDate = new Date()
    const runId = randomBytes(12).toString('hex')

    const run = await prisma.searchRun.create({
      data: {
        id: runId,
        saved_search_id: id,
        status: 'SUCCESS',
        result_count: 0,
        new_results_count: 0,
        search_params: Object.fromEntries(searchParams),
        results_snapshot: [],
      },
    })

    try {
      // Generate cache key
      const cacheKey = generateCacheKey(searchParams)
      
      // Try to get from cache first
      let data = await getCachedSearch(cacheKey)
      let fromCache = false

      if (!data) {
        // Cache miss - fetch from SAM.gov API
        const res = await fetch(
          `https://api.sam.gov/prod/opportunities/v2/search?${searchParams.toString()}`,
          {
            headers: {
              'X-Api-Key': process.env.SAM_GOV_API_KEY!,
              'Content-Type': 'application/json',
            },
          }
        )

        // Handle 429 Rate Limit
        if (res.status === 429) {
          const errorText = await res.text()
          let errorData: any = {}
          
          try {
            errorData = JSON.parse(errorText)
          } catch (e) {
            // Parsing failed
          }

          console.warn('⚠️ [API] SAM.gov rate limit exceeded')
          console.warn('Next access time:', errorData.nextAccessTime)

          await prisma.searchRun.update({
            where: { id: run.id },
            data: {
              status: 'RATE_LIMITED',
              error_message: `Rate limit exceeded. Next access: ${errorData.nextAccessTime || 'Unknown'}`
            }
          })

          return NextResponse.json({
            success: false,
            rateLimitExceeded: true,
            nextAccessTime: errorData.nextAccessTime || 'Unknown',
            message: 'SAM.gov API quota exceeded. Please try again after the quota resets.',
            error: null,
            execution: {
              searchName: savedSearch.name,
              keywords: savedSearch.keywords || 'All',
              resultCount: 0,
              recipients: [],
              timestamp: runDate.toISOString(),
              frequency: savedSearch.frequency || 'Manual',
              emailSent: false,
              runId: run.id,
              status: 'RATE_LIMITED'
            }
          }, { status: 200 })
        }

        // Handle other errors
        if (!res.ok) {
          const text = await res.text()
          console.error(`❌ [API] SAM.gov error ${res.status}:`, text)

          await prisma.searchRun.update({
            where: { id: run.id },
            data: {
              status: 'ERROR',
              error_message: `SAM.gov API error: ${res.status}`
            }
          })

          return NextResponse.json({
            success: false,
            rateLimitExceeded: false,
            error: `SAM.gov error (${res.status})`,
            message: 'Unable to fetch opportunities. Please try again later.',
            execution: {
              searchName: savedSearch.name,
              keywords: savedSearch.keywords || 'All',
              resultCount: 0,
              recipients: [],
              timestamp: runDate.toISOString(),
              frequency: savedSearch.frequency || 'Manual',
              emailSent: false,
              runId: run.id,
              status: 'ERROR'
            }
          }, { status: 200 })
        }

        data = await res.json()
        
        // Cache the successful response (4 hour TTL)
        await setCachedSearch(cacheKey, data, 14400)
      } else {
        fromCache = true
        console.log('✅ Using cached SAM.gov results')
      }

      const results = data.opportunitiesData ?? []

      console.log(`✅ SAM.gov returned ${results.length} results ${fromCache ? '(from cache)' : '(fresh)'}`)

      await prisma.searchRun.update({
        where: { id: run.id },
        data: {
          result_count: results.length,
          results_snapshot: results,
        },
      })

      await prisma.saved_searches_new.update({
        where: { id },
        data: {
          last_run_at: runDate,
          last_result_count: results.length,
          totalRuns: { increment: 1 },
        },
      })

      // Send email if recipients are configured
      let emailSent = false
      let recipientList: string[] = []

      if (savedSearch.recipients && savedSearch.recipients.trim()) {
        recipientList = savedSearch.recipients
          .split(',')
          .map(r => r.trim())
          .filter(r => r.length > 0)

        if (recipientList.length > 0) {
          console.log('📧 Preparing to send email...')
          console.log('Recipients:', recipientList)
          console.log('Results count:', results.length)
          
          try {
            // Build search criteria for email
            const searchCriteria: Array<{ label: string; value: string }> = []
            if (savedSearch.keywords) searchCriteria.push({ label: 'Keywords', value: savedSearch.keywords })
            if (savedSearch.naics) searchCriteria.push({ label: 'NAICS', value: savedSearch.naics })
            if (savedSearch.agency) searchCriteria.push({ label: 'Agency', value: savedSearch.agency })
            if (savedSearch.set_aside) searchCriteria.push({ label: 'Set-Aside', value: savedSearch.set_aside })
            if (savedSearch.state_of_performance) searchCriteria.push({ label: 'State', value: savedSearch.state_of_performance })
            if (savedSearch.procurement_type) searchCriteria.push({ label: 'Type', value: savedSearch.procurement_type })

            // Transform results for email
            const topResults = results.slice(0, 10).map((opp: any) => ({
              title: opp.title || 'Untitled',
              agency: opp.fullParentPathName || opp.departmentName || 'Unknown',
              solicitationNumber: opp.solicitationNumber || opp.noticeId,
              naics: opp.naicsCode || '',
              responseDeadline: opp.responseDeadLine || '',
              url: opp.uiLink || `https://sam.gov/opp/${opp.noticeId}/view`
            }))

            await sendAlertEmail({
              to: recipientList,
              searchName: savedSearch.name,
              totalResults: results.length,
              searchCriteria,
              topResults,
              date: runDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
            })
            
            emailSent = true
            console.log('✅ Email sent successfully to:', recipientList.join(', '))

            // Update totalEmailsSent counter
            await prisma.saved_searches_new.update({
              where: { id },
              data: {
                totalEmailsSent: { increment: recipientList.length },
              },
            })
          } catch (emailError) {
            console.error('❌ Email sending failed:', emailError)
            // Don't fail the entire request if email fails
          }
        } else {
          console.warn('⚠️ Recipients field is empty after parsing')
        }
      } else {
        console.warn('⚠️ No email recipients configured')
      }

      // ENHANCED RESPONSE with execution details
      return NextResponse.json({
        success: true,
        rateLimitExceeded: false,
        fromCache,
        execution: {
          searchName: savedSearch.name,
          keywords: savedSearch.keywords || 'All',
          resultCount: results.length,
          recipients: recipientList,
          timestamp: runDate.toISOString(),
          frequency: savedSearch.frequency || 'Manual',
          emailSent,
          runId: run.id,
          status: 'SUCCESS'
        },
        // Legacy format for backward compatibility
        searchName: savedSearch.name,
        keywords: savedSearch.keywords || 'All',
        resultCount: results.length,
        recipients: recipientList,
        timestamp: runDate.toISOString(),
        frequency: savedSearch.frequency || 'Manual',
        emailSent,
      })
    } catch (err: any) {
      // Handle unexpected errors
      console.error('❌ [API] Unexpected error:', err)
      
      try {
        await prisma.searchRun.update({
          where: { id: run.id },
          data: {
            status: 'ERROR',
            error_message: err.message,
          },
        })
      } catch (updateError) {
        console.error('❌ [API] Failed to update searchRun with error:', updateError)
      }

      return NextResponse.json({
        success: false,
        rateLimitExceeded: false,
        error: 'Unexpected error occurred',
        message: 'Failed to execute alert. Please try again.',
        execution: {
          searchName: savedSearch.name,
          keywords: savedSearch.keywords || 'All',
          resultCount: 0,
          recipients: [],
          timestamp: runDate.toISOString(),
          frequency: savedSearch.frequency || 'Manual',
          emailSent: false,
          runId: run.id,
          status: 'ERROR'
        }
      }, { status: 200 })
    }
  } catch (error) {
    return handlePrismaError(error, 'POST /api/saved-searches/[id]')
  }
}

/* =========================================================
   PATCH – UPDATE SAVED SEARCH
   ========================================================= */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    const body = await req.json()

    console.log('📝 PATCH /api/saved-searches/[id]')
    console.log('Body received:', JSON.stringify(body, null, 2))

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const existing = await prisma.saved_searches_new.findUnique({ where: { id } })

    if (!existing || existing.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Build update data object - ONLY UPDATE FIELDS THAT ARE PROVIDED
    const updateData: any = {}

    // Basic fields
    if (body.name !== undefined) {
      updateData.name = sanitize(body.name) ?? existing.name
    }
    if (body.description !== undefined) {
      updateData.description = sanitize(body.description)
    }
    
    // Search criteria fields
    if (body.keywords !== undefined) {
      updateData.keywords = sanitize(body.keywords)
    }
    if (body.naics !== undefined) {
      updateData.naics = sanitize(body.naics)
    }
    if (body.agency !== undefined) {
      updateData.agency = sanitize(body.agency)
    }
    if (body.setAside !== undefined) {
      updateData.set_aside = sanitize(body.setAside)
    }
    if (body.maxResults !== undefined) {
      updateData.max_results = toIntOrDefault(body.maxResults, existing.max_results ?? 100)
    }
    
    // Date fields - convert to DateTime
    if (body.postedAfter !== undefined) {
      updateData.posted_after = toDateTime(body.postedAfter)
    }
    if (body.postedBefore !== undefined) {
      updateData.posted_before = toDateTime(body.postedBefore)
    }
    
    // CRITICAL FIX: Use lowercase field names that frontend actually sends
    if (body.rdlfrom !== undefined) {
      updateData.rdl_from = toDateTime(body.rdlfrom)
    }
    if (body.rdlto !== undefined) {
      updateData.rdl_to = toDateTime(body.rdlto)
    }
    
    // Additional search fields
    if (body.stateOfPerformance !== undefined) {
      updateData.state_of_performance = sanitize(body.stateOfPerformance)
    }
    
    // CRITICAL FIX: procurement_type - only update if non-empty value provided
    if (body.procurementType !== undefined) {
      const sanitizedType = sanitize(body.procurementType)
      // Only update if there's an actual value, otherwise leave unchanged
      if (sanitizedType !== null && sanitizedType !== '') {
        updateData.procurement_type = sanitizedType
      }
      // If empty/null, don't include in update - leaves existing value unchanged
    }
    
    if (body.solicitationNumber !== undefined) {
      updateData.solicitation_number = sanitize(body.solicitationNumber)
    }
    if (body.classificationCode !== undefined) {
      updateData.classification_code = sanitize(body.classificationCode)
    }
    if (body.noticeId !== undefined) {
      updateData.notice_id = sanitize(body.noticeId)
    }
    
    // CRITICAL FIX: opportunity_status - DON'T apply defaults, allow null
    if (body.opportunityStatus !== undefined) {
      const sanitizedStatus = sanitize(body.opportunityStatus)
      // Empty string should be saved as null (no filter)
      updateData.opportunity_status = sanitizedStatus === '' ? null : sanitizedStatus
    }
    
    if (body.placeOfPerformanceZip !== undefined) {
      updateData.place_of_performance_zip = sanitize(body.placeOfPerformanceZip)
    }
    if (body.organizationCode !== undefined) {
      updateData.organization_code = sanitize(body.organizationCode)
    }

    // Handle subscription fields
    if (body.subscriptionEnabled !== undefined) {
      updateData.subscription_enabled = Boolean(body.subscriptionEnabled)
    }

    if (body.frequency !== undefined) {
      const upperFreq = String(body.frequency).toUpperCase()
      if (['DAILY', 'WEEKLY', 'MONTHLY'].includes(upperFreq)) {
        updateData.frequency = upperFreq as 'DAILY' | 'WEEKLY' | 'MONTHLY'
      }
    }

    // Process recipients - convert to comma-separated string
    if (body.recipients !== undefined) {
      if (Array.isArray(body.recipients)) {
        const validRecipients = body.recipients
          .map((r: any) => (typeof r === 'string' ? r.trim() : ''))
          .filter((r: string) => r.length > 0)
        updateData.recipients = validRecipients.length > 0 ? validRecipients.join(', ') : null
      } else if (typeof body.recipients === 'string') {
        const validRecipients = body.recipients
          .split(',')
          .map((r: string) => r.trim())
          .filter((r: string) => r.length > 0)
        updateData.recipients = validRecipients.length > 0 ? validRecipients.join(', ') : null
      }
    }

    if (body.emailNotification !== undefined) {
      updateData.email_notification = Boolean(body.emailNotification)
    }

    if (body.sendEmptyResults !== undefined) {
      updateData.send_empty_results = Boolean(body.sendEmptyResults)
    }

    if (body.deliveryTime !== undefined) {
      updateData.delivery_time = sanitize(body.deliveryTime)
    }

    // CRITICAL FIX: export_format - handle empty strings properly
    if (body.exportFormat !== undefined) {
      const sanitizedFormat = sanitize(body.exportFormat)
      if (sanitizedFormat && sanitizedFormat.trim()) {
        updateData.export_format = sanitizedFormat.toUpperCase()
      } else {
        updateData.export_format = 'CSV' // Sensible default
      }
    }

    if (body.includeLinks !== undefined) {
      updateData.include_links = Boolean(body.includeLinks)
    }

    console.log('📊 Update data prepared:', JSON.stringify(updateData, null, 2))

    const updated = await prisma.saved_searches_new.update({
      where: { id },
      data: updateData,
    })

    console.log('✅ Search updated successfully')
    console.log('   procurement_type:', updated.procurement_type)
    console.log('   opportunity_status:', updated.opportunity_status)
    console.log('   export_format:', updated.export_format)
    console.log('   rdl_from:', updated.rdl_from)
    console.log('   rdl_to:', updated.rdl_to)

    return NextResponse.json({ success: true, search: transformSearchForFrontend(updated) })
  } catch (error) {
    console.error('❌ PATCH error:', error)
    return handlePrismaError(error, 'PATCH /api/saved-searches/[id]')
  }
}
/* =========================================================
   DELETE – DELETE SAVED SEARCH
   ========================================================= */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const existing = await prisma.saved_searches_new.findUnique({ where: { id } })

    if (!existing || existing.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    await prisma.saved_searches_new.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    return handlePrismaError(error, 'DELETE /api/saved-searches/[id]')
  }
}

/* =========================================================
   GET – FETCH SINGLE SAVED SEARCH
   ========================================================= */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const search = await prisma.saved_searches_new.findUnique({
      where: { id },
      include: { searchRuns: true },
    })

    if (!search || search.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, search: transformSearchForFrontend(search) })
  } catch (error) {
    return handlePrismaError(error, 'GET /api/saved-searches/[id]')
  }
}