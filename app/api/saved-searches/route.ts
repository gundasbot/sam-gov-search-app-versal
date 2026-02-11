// app/saved-searches/route.ts
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
    const subscriptionEnabled = Boolean(body.subscription_enabled)

    // Only validate/set frequency if subscription is enabled
    let frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | null = null
    if (subscriptionEnabled) {
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
    const emailNotification = Boolean(body.email_notification)

    const search = await prisma.saved_searches_new.create({
      data: {
        id: randomBytes(16).toString('hex'),
        user_id: session.user.id,
        name: sanitize(body.name) || 'Untitled Search',
        description: sanitize(body.description),
        is_pinned: Boolean(body.is_pinned),
        updated_at: new Date(),

        // Search criteria - CORRECT SNAKE_CASE FIELD NAMES
        keywords: sanitize(body.keywords),
        solicitation_number: sanitize(body.solnum),
        notice_id: sanitize(body.noticeId),
        naics: sanitize(body.naics),
        classification_code: sanitize(body.ccode),
        agency: sanitize(body.agency),
        organization_code: sanitize(body.organization_code),
        set_aside: sanitize(body.setAside),
        state_of_performance: sanitize(body.stateOfPerformance),
        place_of_performance_zip: sanitize(body.zip),
        opportunity_status: sanitize(body.status),
        procurement_type: sanitize(body.procurementType) || 'o',
        
        // Date fields - CORRECT SNAKE_CASE
        posted_after: body.posted_after ? new Date(body.posted_after) : null,
        posted_before: body.posted_before ? new Date(body.posted_before) : null,
        rdl_from: body.rdlfrom ? new Date(body.rdlfrom) : null,
        rdl_to: body.rdlto ? new Date(body.rdlto) : null,

        // Subscription settings - CORRECT SNAKE_CASE
        subscription_enabled: subscriptionEnabled,
        frequency, // null if subscriptionEnabled is false
        recipients: recipientsString,
        email_notification: emailNotification,
        send_empty_results: Boolean(body.send_empty_results),
        max_results: body.max_results || 100,
        delivery_time: body.delivery_time || null,
        export_format: normalizeExportFormat(body.export_format),
        include_links: Boolean(body.include_links ?? true),
      },
      include: {
        _count: {
          select: {
            search_runs: true,
            search_exports: true,
          },
        },
      },
    })

    return NextResponse.json({ success: true, search })
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

    const searches = await prisma.saved_searches_new.findMany({
      where: {
        user_id: session.user.id,
        ...(onlySubscribed ? { subscription_enabled: true } : {}),
      },
      include: {
        _count: {
          select: {
            search_runs: true,
            search_exports: true,
          },
        },
      },
      orderBy: [{ is_pinned: 'desc' }, { updated_at: 'desc' }],
    })

    return NextResponse.json({ success: true, searches })
  } catch (error) {
    console.error('Error fetching saved searches:', error)
    return NextResponse.json({ error: 'Failed to fetch saved searches' }, { status: 500 })
  }
}
