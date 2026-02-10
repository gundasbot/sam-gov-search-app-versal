// app/api/saved-searches/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

// Helper to sanitize string values
const sanitize = (val: any): string | null => {
  return typeof val === 'string' ? val.trim() || null : null
}

// Helper to validate and convert frequency to enum value
const validateFrequency = (
  frequency: any
): 'DAILY' | 'WEEKLY' | 'MONTHLY' | null => {
  if (!frequency) return null

  const upperFreq = String(frequency).toUpperCase()
  if (['DAILY', 'WEEKLY', 'MONTHLY'].includes(upperFreq)) {
    return upperFreq as 'DAILY' | 'WEEKLY' | 'MONTHLY'
  }

  return null
}

// Normalize export format to your schema's conventions (default XLSB)
const normalizeExportFormat = (val: any): string => {
  const s = sanitize(val)
  if (!s) return 'XLSB'
  return s.toUpperCase()
}

// Generate a unique ID
function generateId(): string {
  return randomBytes(12).toString('hex')
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
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    if (!body.name) {
      return NextResponse.json({ error: 'Search name is required' }, { status: 400 })
    }

    // Validate subscription-related fields
    const subscription_enabled = Boolean(body.subscriptionEnabled)

    // Only validate/set frequency if subscription is enabled
    let frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | null = null
    if (subscription_enabled) {
      frequency = validateFrequency(body.frequency) || 'DAILY'
    }

    // Process recipients - convert to comma-separated string
    let recipientsString: string | null = null
    if (body.recipients) {
      if (Array.isArray(body.recipients)) {
        const validRecipients = body.recipients
          .map((r: any) => (typeof r === 'string' ? r.trim() : ''))
          .filter((r: string) => r.length > 0)
        recipientsString = validRecipients.length > 0 ? validRecipients.join(', ') : null
      } else if (typeof body.recipients === 'string') {
        const validRecipients = body.recipients
          .split(',')
          .map((r: string) => r.trim())
          .filter((r: string) => r.length > 0)
        recipientsString = validRecipients.length > 0 ? validRecipients.join(', ') : null
      }
    }

    // For email notifications (non-subscription saves), still allow recipients
    const email_notification = Boolean(body.emailNotification)

    const search = await prisma.savedSearchNew.create({
      data: {
        id: generateId(),
        user_id: session.user.id,
        name: sanitize(body.name) || 'Untitled Search',
        description: sanitize(body.description),
        is_pinned: Boolean(body.isPinned),

        // Search criteria - snake_case field names
        keywords: sanitize(body.keywords),
        solicitation_number: sanitize(body.solnum),
        notice_id: sanitize(body.noticeid),
        naics: sanitize(body.naics),
        classification_code: sanitize(body.ccode),
        agency: sanitize(body.agency),
        organization_code: sanitize(body.organizationCode),
        set_aside: sanitize(body.setAside),
        state_of_performance: sanitize(body.stateOfPerformance),
        place_of_performance_zip: sanitize(body.zip),
        opportunity_status: sanitize(body.status),
        procurement_type: sanitize(body.procurementType) || 'o',
        
        // Date fields - snake_case
        posted_after: body.postedAfter ? new Date(body.postedAfter) : null,
        posted_before: body.postedBefore ? new Date(body.postedBefore) : null,
        rdl_from: body.rdlfrom ? new Date(body.rdlfrom) : null,
        rdl_to: body.rdlto ? new Date(body.rdlto) : null,

        // Subscription settings - snake_case
        subscription_enabled,
        frequency,
        recipients: recipientsString,
        email_notification,
        send_empty_results: Boolean(body.sendEmptyResults),
        max_results: body.maxResults || 100,
        delivery_time: body.deliveryTime || null,
        export_format: normalizeExportFormat(body.exportFormat),
        include_links: Boolean(body.includeLinks ?? true),
        
        // Timestamps
        created_at: new Date(),
        updated_at: new Date(),
      },
      include: {
        _count: {
          select: {
            searchRuns: true,
            searchExports: true,
          },
        },
      },
    })

    return NextResponse.json({ success: true, search: transformSearchForFrontend(search) })
  } catch (error) {
    console.error('Error creating saved search:', error)
    return NextResponse.json({ error: 'Failed to create saved search' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sp = req.nextUrl.searchParams
    const subscribedParam = (sp.get('subscribed') || '').toLowerCase()
    const onlySubscribed =
      subscribedParam === 'true' || subscribedParam === '1' || subscribedParam === 'yes'

    console.log('📋 Fetching saved searches for user:', session.user.id)
    console.log('   Subscribed only:', onlySubscribed)

    const searches = await prisma.savedSearchNew.findMany({
      where: {
        user_id: session.user.id,
        ...(onlySubscribed ? { subscription_enabled: true } : {}),
      },
      include: {
        _count: {
          select: {
            searchRuns: true,
            searchExports: true,
          },
        },
      },
      orderBy: [{ is_pinned: 'desc' }, { updated_at: 'desc' }],
    })

    console.log('✅ Found', searches.length, 'saved searches')

    // Transform all searches to frontend format
    const transformedSearches = searches.map(transformSearchForFrontend)

    return NextResponse.json({ success: true, searches: transformedSearches })
  } catch (error) {
    console.error('❌ Error fetching saved searches:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch saved searches',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}