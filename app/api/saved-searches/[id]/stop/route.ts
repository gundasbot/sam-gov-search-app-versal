// app/api/saved-searches/[id]/stop/route.ts
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

    // Find any running AlertRuns and mark them as stopped
    const runningAlerts = await prisma.alert_runs.findMany({
      where: {
        alert_id: id,
        status: 'SUCCESS',
      },
    })

    // Update all running alerts to stopped
    if (runningAlerts.length > 0) {
      await prisma.alert_runs.updateMany({
        where: {
          alert_id: id,
          status: 'SUCCESS',
        },
        data: {
          status: 'ERROR',
          ran_at: new Date(),
          error_message: 'Manually stopped by user',
        },
      })
    }

    // Update the search's last run time
    await prisma.saved_searches_new.update({
      where: { id },
      data: {
        last_run_at: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: `Stopped ${runningAlerts.length} running alert(s)`,
      stoppedCount: runningAlerts.length,
    })
  } catch (error) {
    console.error('Error stopping alert:', error)
    return NextResponse.json(
      { error: 'Failed to stop alert' },
      { status: 500 }
    )
  }
}