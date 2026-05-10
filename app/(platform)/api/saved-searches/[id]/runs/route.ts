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
        user_id: session.user.id,
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
    const searchRuns = await prisma.search_runs.findMany({
      where: {
        saved_search_id: id,
      },
      orderBy: {
        created_at: 'desc',
      },
      take: Math.min(limit, 100), // Max 100
      select: {
        id: true,
        created_at: true,
        status: true,
        result_count: true,
        email_sent: true,
        error_message: true,
      },
    })

    const alertRuns = await prisma.alert_runs.findMany({
      where: {
        alert_id: id,
      },
      orderBy: {
        ran_at: 'desc',
      },
      take: Math.min(limit, 100), // Max 100
      select: {
        id: true,
        ran_at: true,
        status: true,
        result_count: true,
        error_message: true,
      },
    })

    // Combine and sort runs
    const combinedRuns = [
      ...searchRuns.map(run => ({
        id: run.id,
        created_at: run.created_at,
        status: run.status,
        result_count: run.result_count,
        emails_sent: run.email_sent ? 1 : 0,
        error_message: run.error_message,
        type: 'search' as const,
      })),
      ...alertRuns.map(run => ({
        id: run.id,
        created_at: run.ran_at,
        status: run.status,
        result_count: run.result_count || 0,
        emails_sent: 0,  // alert_runs does not track emails_sent
        emailRecipients: null,  // alert_runs does not have emailRecipients
        error_message: run.error_message,
        type: 'alert' as const,
      })),
    ].sort((a, b) => b.created_at.getTime() - a.created_at.getTime()).slice(0, limit)

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