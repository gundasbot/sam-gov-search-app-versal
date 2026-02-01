// app/api/saved-searches/[id]/runs/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
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
    const search = await prisma.savedSearchNew.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      select: { id: true },
    })

    if (!search) {
      return NextResponse.json({ error: 'Search not found' }, { status: 404 })
    }

    // Get query params
    const url = new URL(req.url)
    const limit = parseInt(url.searchParams.get('limit') || '10')

    // Fetch runs
    const runs = await prisma.searchRun.findMany({
      where: {
        savedSearchId: id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: Math.min(limit, 50), // Max 50
      select: {
        id: true,
        createdAt: true,
        status: true,
        resultCount: true,
        emailSent: true,
        errorMessage: true,
      },
    })

    return NextResponse.json({ runs })
  } catch (error) {
    console.error('Error fetching runs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch runs' },
      { status: 500 }
    )
  }
}
