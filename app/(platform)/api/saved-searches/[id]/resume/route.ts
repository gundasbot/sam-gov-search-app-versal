// app/api/saved-searches/[id]/resume/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify ownership
    const search = await prisma.saved_searches_new.findFirst({
      where: {
        id,
        user_id: session.user.id,
      },
    })

    if (!search) {
      return NextResponse.json({ error: 'Search not found' }, { status: 404 })
    }

    // Update the search to resume
    const updated = await prisma.saved_searches_new.update({
      where: { id },
      data: {
        isPaused: false,
        pausedAt: null,
        pausedUntil: null,
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
      success: true,
      message: 'Alert resumed successfully',
      search: updated,
    })
  } catch (error) {
    console.error('Error resuming alert:', error)
    return NextResponse.json(
      { error: 'Failed to resume alert' },
      { status: 500 }
    )
  }
}