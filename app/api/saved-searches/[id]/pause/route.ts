// app/api/saved-searches/[id]/pause/route.ts
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
        userId: session.user.id,
      },
    })

    if (!search) {
      return NextResponse.json({ error: 'Search not found' }, { status: 404 })
    }

    // Get pause duration from request body (default: 24 hours)
    const body = await req.json().catch(() => ({}))
    const durationHours = body.duration || 24

    // Calculate pause until date
    const pausedUntil = new Date()
    pausedUntil.setHours(pausedUntil.getHours() + durationHours)

    // Update the search
    const updated = await prisma.saved_searches_new.update({
      where: { id },
      data: {
        isPaused: true,
        pausedAt: new Date(),
        pausedUntil,
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
      success: true,
      message: `Alert paused for ${durationHours} hours`,
      search: updated,
    })
  } catch (error) {
    console.error('Error pausing alert:', error)
    return NextResponse.json(
      { error: 'Failed to pause alert' },
      { status: 500 }
    )
  }
}