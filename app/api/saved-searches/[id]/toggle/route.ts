import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// POST /api/saved-searches/[id]/toggle
// Toggle subscription on/off
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

    // Fetch the saved search (ownership enforced)
    const search = await prisma.saved_searches_new.findFirst({
      where: {
        id,
        user_id: session.user.id,
      },
    })

    if (!search) {
      return NextResponse.json({ error: 'Search not found' }, { status: 404 })
    }

    const newStatus = !search.subscriptionEnabled

    // If enabling, ensure required fields exist
    if (newStatus) {
      if (!search.recipients) {
        return NextResponse.json(
          { error: 'Cannot enable subscription: recipients are required' },
          { status: 400 }
        )
      }

      // Default frequency if missing
      if (!search.frequency) {
        await prisma.saved_searches_new.update({
          where: { id },
          data: {
            subscriptionEnabled: true,
            frequency: 'DAILY',
          },
        })

        const updated = await prisma.saved_searches_new.findUnique({
          where: { id },
          include: {
            _count: {
              select: {
                searchRuns: true,
                searchExports: true,
              },
            },
            searchRuns: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        })

        return NextResponse.json({
          search: updated,
          message: 'Subscription enabled with default daily frequency',
        })
      }
    }

    // Toggle subscription
    const updated = await prisma.saved_searches_new.update({
      where: { id },
      data: {
        subscriptionEnabled: newStatus,
        ...(newStatus === false && { frequency: null }),
      },
      include: {
        _count: {
          select: {
            searchRuns: true,
            searchExports: true,
          },
        },
        searchRuns: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    })

    return NextResponse.json({
      search: updated,
      message: newStatus ? 'Subscription enabled' : 'Subscription disabled',
    })
  } catch (error) {
    console.error('Error toggling subscription:', error)
    return NextResponse.json(
      { error: 'Failed to toggle subscription' },
      { status: 500 }
    )
  }
}