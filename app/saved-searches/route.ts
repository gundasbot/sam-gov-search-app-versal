// app/saved-searches/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
    const subscriptionEnabled = Boolean(body.subscriptionEnabled)

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
    const emailNotification = Boolean(body.emailNotification)

    const search = await prisma.saved_searches_new.create({
      data: {
        userId: session.user.id,
        name: sanitize(body.name) || 'Untitled Search',
        description: sanitize(body.description),
        isPinned: Boolean(body.isPinned),

        // Search criteria - FIXED FIELD NAMES
        keywords: sanitize(body.keywords),
        solicitationNumber: sanitize(body.solnum),
        noticeId: sanitize(body.noticeid),
        naics: sanitize(body.naics),
        classificationCode: sanitize(body.ccode),
        agency: sanitize(body.agency),
        organizationCode: sanitize(body.organizationCode),
        setAside: sanitize(body.setAside),
        stateOfPerformance: sanitize(body.stateOfPerformance),
        placeOfPerformanceZip: sanitize(body.zip),
        opportunityStatus: sanitize(body.status),
        procurementType: sanitize(body.procurementType) || 'o',
        
        // Date fields - FIXED: lowercase rdlfrom and rdlto
        postedAfter: body.postedAfter ? new Date(body.postedAfter) : null,
        postedBefore: body.postedBefore ? new Date(body.postedBefore) : null,
        rdlfrom: body.rdlfrom ? new Date(body.rdlfrom) : null,
        rdlto: body.rdlto ? new Date(body.rdlto) : null,

        // Subscription settings
        subscriptionEnabled,
        frequency, // null if subscriptionEnabled is false
        recipients: recipientsString,
        emailNotification,
        sendEmptyResults: Boolean(body.sendEmptyResults),
        maxResults: body.maxResults || 100,
        deliveryTime: body.deliveryTime || null,
        exportFormat: normalizeExportFormat(body.exportFormat),
        includeLinks: Boolean(body.includeLinks ?? true),
      },
      include: {
        _count: {
          select: {
            runs: true,
            exports: true,
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
        userId: session.user.id,
        ...(onlySubscribed ? { subscriptionEnabled: true } : {}),
      },
      include: {
        _count: {
          select: {
            runs: true,
            exports: true,
          },
        },
      },
      orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }],
    })

    return NextResponse.json({ success: true, searches })
  } catch (error) {
    console.error('Error fetching saved searches:', error)
    return NextResponse.json({ error: 'Failed to fetch saved searches' }, { status: 500 })
  }
}