// app/api/saved-searches/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/saved-searches/[id] - Get single saved search
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

    const search = await prisma.savedSearchNew.findFirst({
      where: {
        id,
        userId: session.user.id,
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
          take: 5,
          select: {
            id: true,
            status: true,
            resultCount: true,
            createdAt: true,
            errorMessage: true,
          },
        },
      },
    })

    if (!search) {
      return NextResponse.json({ error: 'Search not found' }, { status: 404 })
    }

    return NextResponse.json({ search })
  } catch (error) {
    console.error('Error fetching search:', error)
    return NextResponse.json({ error: 'Failed to fetch search' }, { status: 500 })
  }
}

// PUT /api/saved-searches/[id] - Update saved search
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    // Verify search exists and belongs to user
    const existing = await prisma.savedSearchNew.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Search not found' }, { status: 404 })
    }

    // Validate frequency if provided
    if (body.frequency) {
      const validFrequencies = ['DAILY', 'WEEKLY', 'MONTHLY', 'AS_CHANGES', 'MANUAL']
      if (!validFrequencies.includes(body.frequency)) {
        return NextResponse.json({ error: 'Invalid frequency' }, { status: 400 })
      }
    }

    // Validate recipients if subscription is being enabled
    if (body.subscriptionEnabled && !body.recipients?.trim() && !existing.recipients) {
      return NextResponse.json(
        { error: 'Recipients are required when subscription is enabled' },
        { status: 400 }
      )
    }

    // Build update data object (only update provided fields)
    const updateData: any = {}
    
    // Basic info
    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.isPinned !== undefined) updateData.isPinned = body.isPinned
    
    // Search criteria
    if (body.keywords !== undefined) updateData.keywords = body.keywords?.trim() || null
    if (body.naics !== undefined) updateData.naics = body.naics?.trim() || null
    if (body.agency !== undefined) updateData.agency = body.agency?.trim() || null
    if (body.setAside !== undefined) updateData.setAside = body.setAside?.trim() || null
    if (body.stateOfPerformance !== undefined) updateData.stateOfPerformance = body.stateOfPerformance?.trim() || null
    if (body.postedAfter !== undefined) updateData.postedAfter = body.postedAfter ? new Date(body.postedAfter) : null
    if (body.postedBefore !== undefined) updateData.postedBefore = body.postedBefore ? new Date(body.postedBefore) : null
    if (body.procurementType !== undefined) updateData.procurementType = body.procurementType
    
    // Subscription settings
    if (body.subscriptionEnabled !== undefined) {
      updateData.subscriptionEnabled = body.subscriptionEnabled
      // If disabling subscription, clear frequency
      if (!body.subscriptionEnabled) {
        updateData.frequency = null
      }
    }
    if (body.frequency !== undefined) updateData.frequency = body.frequency
    if (body.recipients !== undefined) updateData.recipients = body.recipients
    if (body.emailNotification !== undefined) updateData.emailNotification = body.emailNotification
    if (body.sendEmptyResults !== undefined) updateData.sendEmptyResults = body.sendEmptyResults
    if (body.maxResults !== undefined) updateData.maxResults = body.maxResults
    if (body.deliveryTime !== undefined) updateData.deliveryTime = body.deliveryTime
    if (body.exportFormat !== undefined) updateData.exportFormat = body.exportFormat
    if (body.fileFormat !== undefined) updateData.exportFormat = body.fileFormat // Support both names
    if (body.includeLinks !== undefined) updateData.includeLinks = body.includeLinks

    // Update search
    const updated = await prisma.savedSearchNew.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            runs: true,
            exports: true,
          },
        },
      },
    })

    return NextResponse.json({ search: updated })
  } catch (error) {
    console.error('Error updating search:', error)
    return NextResponse.json({ error: 'Failed to update search' }, { status: 500 })
  }
}

// DELETE /api/saved-searches/[id] - Delete saved search
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

    // Verify search exists and belongs to user
    const existing = await prisma.savedSearchNew.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Search not found' }, { status: 404 })
    }

    // Delete the search (and all related runs/exports via cascade)
    await prisma.savedSearchNew.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting search:', error)
    return NextResponse.json({ error: 'Failed to delete search' }, { status: 500 })
  }
}