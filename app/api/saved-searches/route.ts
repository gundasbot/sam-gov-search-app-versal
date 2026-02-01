// app/api/saved-searches/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/saved-searches - List all saved searches
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(req.url)
    const subscribedOnly = url.searchParams.get('subscribed') === 'true'

    const where: any = {
      userId: session.user.id,
    }

    if (subscribedOnly) {
      where.subscriptionEnabled = true
    }

    const searches = await prisma.savedSearchNew.findMany({
      where,
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
        { isPinned: 'desc' },
        { updatedAt: 'desc' },
      ],
    })

    return NextResponse.json({ searches })
  } catch (error) {
    console.error('Error fetching saved searches:', error)
    return NextResponse.json(
      { error: 'Failed to fetch saved searches' },
      { status: 500 }
    )
  }
}

// POST /api/saved-searches - Create new saved search
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

    // Helper function to handle array or string values
    const normalizeValue = (val: any): string | null => {
      if (!val) return null
      if (Array.isArray(val)) {
        return val.length > 0 ? val.join(',') : null
      }
      return typeof val === 'string' ? val.trim() || null : null
    }

    // Create the search
    const search = await prisma.savedSearchNew.create({
      data: {
        userId: session.user.id,
        name: body.name.trim(),
        description: body.description?.trim() || null,
        isPinned: body.isPinned || false,

        // Search criteria - handle arrays or strings
        keywords: body.keywords?.trim() || null,
        naics: body.naics?.trim() || null,
        agency: body.agency?.trim() || null,
        setAside: normalizeValue(body.setAside),
        stateOfPerformance: normalizeValue(body.stateOfPerformance),
        postedAfter: body.postedAfter ? new Date(body.postedAfter) : null,
        postedBefore: body.postedBefore ? new Date(body.postedBefore) : null,
        procurementType: body.procurementType || 'o',

        // Subscription settings
        subscriptionEnabled: body.subscriptionEnabled || false,
        frequency: body.frequency || null,
        recipients: body.recipients?.trim() || null,
        emailNotification: body.emailNotification ?? true,
        sendEmptyResults: body.sendEmptyResults ?? false,
        maxResults: body.maxResults || 100,
        deliveryTime: body.deliveryTime || null,
        exportFormat: body.exportFormat || body.fileFormat || 'CSV',
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

    console.log(`✅ Saved search created: ${search.id}`)

    return NextResponse.json({ search }, { status: 201 })
  } catch (error) {
    console.error('Error creating saved search:', error)
    return NextResponse.json(
      { error: 'Failed to create saved search' },
      { status: 500 }
    )
  }
}
