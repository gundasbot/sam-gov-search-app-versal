// app/api/alert-subscriptions/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/alert-subscriptions/[id] - Get single alert subscription
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

    const subscription = await prisma.savedSearchNew.findFirst({
      where: {
        id,
        userId: session.user.id,
        subscriptionEnabled: true,
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
        },
      },
    })

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }

    // Format response
    const formatted = {
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
      },
      _count: subscription._count,
      runs: subscription.runs,
    }

    return NextResponse.json({ subscription: formatted })
  } catch (error) {
    console.error('Error fetching subscription:', error)
    return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 })
  }
}

// PUT /api/alert-subscriptions/[id] - Update alert subscription
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

    // Verify ownership
    const existing = await prisma.savedSearchNew.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }

    // Validate recipients if provided
    if (body.recipients) {
      const emails = body.recipients.split(',').map((e: string) => e.trim())
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      const invalidEmails = emails.filter((e: string) => e && !emailRegex.test(e))
      if (invalidEmails.length > 0) {
        return NextResponse.json(
          { error: `Invalid email address: ${invalidEmails[0]}` },
          { status: 400 }
        )
      }
    }

    // Build update data
    const updateData: any = {}
    
    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.frequency !== undefined) updateData.frequency = body.frequency
    if (body.recipients !== undefined) updateData.recipients = body.recipients
    if (body.emailNotification !== undefined) updateData.emailNotification = body.emailNotification
    if (body.sendEmptyResults !== undefined) updateData.sendEmptyResults = body.sendEmptyResults
    if (body.maxResults !== undefined) updateData.maxResults = body.maxResults
    if (body.deliveryTime !== undefined) updateData.deliveryTime = body.deliveryTime
    if (body.exportFormat !== undefined) updateData.exportFormat = body.exportFormat
    if (body.fileFormat !== undefined) updateData.exportFormat = body.fileFormat // Support both names
    if (body.includeLinks !== undefined) updateData.includeLinks = body.includeLinks

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

    // Format response
    const formatted = {
      id: updated.id,
      name: updated.name,
      description: updated.description,
      frequency: updated.frequency,
      active: updated.subscriptionEnabled,
      recipients: updated.recipients,
      emailNotification: updated.emailNotification,
      sendEmptyResults: updated.sendEmptyResults,
      maxResults: updated.maxResults,
      deliveryTime: updated.deliveryTime,
      exportFormat: updated.exportFormat,
      fileFormat: updated.exportFormat,
      includeLinks: updated.includeLinks,
      lastRunAt: updated.lastRunAt,
      lastResultCount: updated.lastResultCount,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      savedSearch: {
        id: updated.id,
        name: updated.name,
        keywords: updated.keywords,
        naics: updated.naics,
        agency: updated.agency,
        setAside: updated.setAside,
        stateOfPerformance: updated.stateOfPerformance,
        procurementType: updated.procurementType,
        postedAfter: updated.postedAfter,
        postedBefore: updated.postedBefore,
      },
      _count: updated._count,
    }

    return NextResponse.json({ subscription: formatted })
  } catch (error) {
    console.error('Error updating subscription:', error)
    return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 })
  }
}

// DELETE /api/alert-subscriptions/[id] - Delete alert subscription
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

    // Verify ownership
    const existing = await prisma.savedSearchNew.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }

    // Delete the subscription
    await prisma.savedSearchNew.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting subscription:', error)
    return NextResponse.json({ error: 'Failed to delete subscription' }, { status: 500 })
  }
}
