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
    const search = await prisma.saved_searches_new.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      select: { 
        id: true,
        totalRuns: true,
        totalEmailsSent: true,
      },
    })

    if (!search) {
      return NextResponse.json({ error: 'Search not found' }, { status: 404 })
    }

    // Get query params
    const url = new URL(req.url)
    const limit = parseInt(url.searchParams.get('limit') || '10')

    // Fetch runs from both SearchRun and AlertRun tables
    const searchRuns = await prisma.searchRun.findMany({
      where: {
        savedSearchId: id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: Math.min(limit, 100), // Max 100
      select: {
        id: true,
        createdAt: true,
        status: true,
        resultCount: true,
        emailSent: true,
        errorMessage: true,
      },
    })

    const alertRuns = await prisma.alertRun.findMany({
      where: {
        searchId: id,
      },
      orderBy: {
        startedAt: 'desc',
      },
      take: Math.min(limit, 100), // Max 100
      select: {
        id: true,
        startedAt: true,
        completedAt: true,
        status: true,
        resultCount: true,
        emailsSent: true,
        emailRecipients: true,
        error: true,
      },
    })

    // Combine and sort runs
    const combinedRuns = [
      ...searchRuns.map(run => ({
        id: run.id,
        createdAt: run.createdAt,
        status: run.status,
        resultCount: run.resultCount,
        emailsSent: run.emailSent ? 1 : 0,
        errorMessage: run.errorMessage,
        type: 'search' as const,
      })),
      ...alertRuns.map(run => ({
        id: run.id,
        createdAt: run.startedAt,
        completedAt: run.completedAt,
        status: run.status,
        resultCount: run.resultCount || 0,
        emailsSent: run.emailsSent,
        emailRecipients: run.emailRecipients,
        errorMessage: run.error,
        type: 'alert' as const,
      })),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, limit)

    return NextResponse.json({ 
      success: true,
      runs: combinedRuns,
      stats: {
        total: search.totalRuns,
        totalEmailsSent: search.totalEmailsSent,
      }
    })
  } catch (error) {
    console.error('Error fetching runs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch runs' },
      { status: 500 }
    )
  }
}