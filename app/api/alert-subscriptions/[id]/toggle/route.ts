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
    const subscription = await prisma.saved_searches_new.findFirst({
      where: {
        id,
        user_id: session.user.id,
      },
    })

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }

    // Toggle subscription enabled status
    const newStatus = !subscription.subscription_enabled

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
        await prisma.saved_searches_new.update({
          where: { id },
          data: {
            subscription_enabled: true,
            frequency: 'DAILY',
          },
        })
        const updated = await prisma.saved_searches_new.findUnique({
          where: { id },
          include: {
            _count: {
              select: {
                search_runs: true,
                search_exports: true,
              },
            },
          },
        })

        return NextResponse.json({
          subscription: {
            ...updated,
            active: updated?.subscription_enabled,
            fileFormat: updated?.export_format,
          },
          message: 'Subscription enabled with default daily frequency',
        })
      }
    }

    // Update subscription status
    const updated = await prisma.saved_searches_new.update({
      where: { id },
      data: {
        subscription_enabled: newStatus,
        // Clear frequency if disabling
        ...(newStatus === false && { frequency: null }),
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

    return NextResponse.json({
      subscription: {
        ...updated,
        active: updated.subscription_enabled,
        fileFormat: updated.export_format,
      },
      message: newStatus ? 'Subscription enabled' : 'Subscription disabled',
    })
  } catch (error) {
    console.error('Error toggling subscription:', error)
    return NextResponse.json({ error: 'Failed to toggle subscription' }, { status: 500 })
  }
}
