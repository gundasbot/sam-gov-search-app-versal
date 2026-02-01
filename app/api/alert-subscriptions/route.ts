// app/api/alert-subscriptions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/alert-subscriptions - List all alert subscriptions (saved searches with subscriptionEnabled = true)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const subscriptions = await prisma.savedSearchNew.findMany({
      where: {
        userId: session.user.id,
        subscriptionEnabled: true, // Only get active subscriptions
      },
      include: {
        _count: {
          select: {
            runs: true,
            exports: true,
          },
        },
        runs: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            createdAt: true,
            status: true,
            resultCount: true,
          },
        },
      },
      orderBy: [
        { updatedAt: 'desc' },
      ],
    })

    // Transform to match expected AlertSubscription format
    const formattedSubscriptions = subscriptions.map(sub => ({
      id: sub.id,
      name: sub.name,
      description: sub.description,
      frequency: sub.frequency,
      active: sub.subscriptionEnabled,
      recipients: sub.recipients,
      emailNotification: sub.emailNotification,
      sendEmptyResults: sub.sendEmptyResults,
      maxResults: sub.maxResults,
      deliveryTime: sub.deliveryTime,
      exportFormat: sub.exportFormat,
      fileFormat: sub.exportFormat, // Alias for compatibility
      includeLinks: sub.includeLinks,
      lastRunAt: sub.lastRunAt,
      lastResultCount: sub.lastResultCount,
      createdAt: sub.createdAt,
      updatedAt: sub.updatedAt,
      // Nested savedSearch info
      savedSearch: {
        id: sub.id,
        name: sub.name,
        keywords: sub.keywords,
        naics: sub.naics,
        agency: sub.agency,
        setAside: sub.setAside,
        stateOfPerformance: sub.stateOfPerformance,
        procurementType: sub.procurementType,
        postedAfter: sub.postedAfter,
        postedBefore: sub.postedBefore,
        createdAt: sub.createdAt,
      },
      _count: sub._count,
    }))

    return NextResponse.json({ subscriptions: formattedSubscriptions })
  } catch (error) {
    console.error('Error fetching alert subscriptions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch alert subscriptions' },
      { status: 500 }
    )
  }
}

// POST /api/alert-subscriptions - Create new alert subscription
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    // Validate required fields
    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    if (!body.recipients?.trim()) {
      return NextResponse.json(
        { error: 'At least one recipient email is required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emails = body.recipients.split(',').map((e: string) => e.trim())
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const invalidEmails = emails.filter((e: string) => e && !emailRegex.test(e))
    if (invalidEmails.length > 0) {
      return NextResponse.json(
        { error: `Invalid email address: ${invalidEmails[0]}` },
        { status: 400 }
      )
    }

    // Check if we have savedSearchId or need to get filters from body
    let savedSearchId = body.savedSearchId
    
    // If no savedSearchId provided, create with inline filters
    if (!savedSearchId) {
      // This handles creating alert directly from search page
      // The search criteria comes in the request body
    }

    // Create the alert subscription (saved search with subscription enabled)
    const subscription = await prisma.savedSearchNew.create({
      data: {
        userId: session.user.id,
        name: body.name.trim(),
        description: body.description?.trim() || null,
        isPinned: false,

        // Search criteria (from savedSearch or inline)
        keywords: body.keywords?.trim() || null,
        naics: body.naics?.trim() || null,
        agency: body.agency?.trim() || null,
        setAside: body.setAside?.trim() || null,
        stateOfPerformance: body.stateOfPerformance?.trim() || null,
        postedAfter: body.postedAfter ? new Date(body.postedAfter) : null,
        postedBefore: body.postedBefore ? new Date(body.postedBefore) : null,
        procurementType: body.procurementType || 'o',

        // Subscription settings (ENABLED)
        subscriptionEnabled: true,
        frequency: body.frequency || 'DAILY',
        recipients: body.recipients.trim(),
        emailNotification: body.emailNotification ?? true,
        sendEmptyResults: body.sendEmptyResults ?? false,
        maxResults: body.maxResults || 100,
        deliveryTime: body.deliveryTime || '09:00',
        exportFormat: body.exportFormat || body.fileFormat || 'csv',
        includeLinks: body.includeLinks ?? true,
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

    // Format response
    const formattedSubscription = {
      id: subscription.id,
      name: subscription.name,
      description: subscription.description,
      frequency: subscription.frequency,
      active: subscription.subscriptionEnabled,
      recipients: subscription.recipients,
      emailNotification: subscription.emailNotification,
      sendEmptyResults: subscription.sendEmptyResults,
      maxResults: subscription.maxResults,
      deliveryTime: subscription.deliveryTime,
      exportFormat: subscription.exportFormat,
      fileFormat: subscription.exportFormat,
      includeLinks: subscription.includeLinks,
      lastRunAt: subscription.lastRunAt,
      lastResultCount: subscription.lastResultCount,
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt,
      savedSearch: {
        id: subscription.id,
        name: subscription.name,
        keywords: subscription.keywords,
        naics: subscription.naics,
        agency: subscription.agency,
        setAside: subscription.setAside,
        stateOfPerformance: subscription.stateOfPerformance,
        procurementType: subscription.procurementType,
        postedAfter: subscription.postedAfter,
        postedBefore: subscription.postedBefore,
        createdAt: subscription.createdAt,
      },
      _count: subscription._count,
    }

    return NextResponse.json({ subscription: formattedSubscription }, { status: 201 })
  } catch (error) {
    console.error('Error creating alert subscription:', error)
    return NextResponse.json(
      { error: 'Failed to create alert subscription' },
      { status: 500 }
    )
  }
}
