// app/api/alert-subscriptions/[id]/toggle/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/alert-subscriptions/[id]/toggle - Toggle subscription on/off
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

    // Fetch the subscription
    const subscription = await prisma.savedSearchNew.findFirst({
      where: {
        id,
        userId: session.user.id
      },
    })

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }

    // Toggle subscription enabled status
    const newStatus = !subscription.subscriptionEnabled

    // If enabling subscription, ensure we have required fields
    if (newStatus) {
      if (!subscription.recipients) {
        return NextResponse.json(
          { error: 'Cannot enable subscription: recipients are required' },
          { status: 400 }
        )
      }
      if (!subscription.frequency) {
        // Set default frequency if not set
        await prisma.savedSearchNew.update({
          where: { id },
          data: {
            subscriptionEnabled: true,
            frequency: 'DAILY',
          },
        })
        const updated = await prisma.savedSearchNew.findUnique({
          where: { id },
          include: {
            _count: {
              select: {
                runs: true,
                exports: true,
              },
            },
          },
        })
        
        return NextResponse.json({
          subscription: {
            ...updated,
            active: updated?.subscriptionEnabled,
            fileFormat: updated?.exportFormat,
          },
          message: 'Subscription enabled with default daily frequency'
        })
      }
    }

    // Update subscription status
    const updated = await prisma.savedSearchNew.update({
      where: { id },
      data: {
        subscriptionEnabled: newStatus,
        // Clear frequency if disabling
        ...(newStatus === false && { frequency: null }),
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

    return NextResponse.json({
      subscription: {
        ...updated,
        active: updated.subscriptionEnabled,
        fileFormat: updated.exportFormat,
      },
      message: newStatus ? 'Subscription enabled' : 'Subscription disabled'
    })
  } catch (error) {
    console.error('Error toggling subscription:', error)
    return NextResponse.json(
      { error: 'Failed to toggle subscription' },
      { status: 500 }
    )
  }
}
