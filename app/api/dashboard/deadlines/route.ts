import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type DashboardDeadline = {
  noticeId: string
  title: string
  agency: string
  deadline: string
  value: number | null
  daysUntil: number
}

async function resolveSessionUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions)
  const directId = session?.user?.id?.trim()
  if (directId) return directId

  const email = session?.user?.email?.toLowerCase().trim()
  if (!email) return null

  const user = await prisma.users.findUnique({
    where: { email },
    select: { id: true },
  })
  return user?.id ?? null
}

function daysUntil(deadline: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000
  return Math.max(0, Math.ceil((deadline.getTime() - Date.now()) / msPerDay))
}

export async function GET() {
  try {
    const userId = await resolveSessionUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const threeDaysOut = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

    const rows = await prisma.saved_opportunities.findMany({
      where: {
        user_id: userId,
        response_deadline: {
          gte: now,
          lte: threeDaysOut,
        },
      },
      orderBy: [{ response_deadline: 'asc' }],
      take: 100,
      select: {
        notice_id: true,
        title: true,
        organization_name: true,
        department: true,
        response_deadline: true,
      },
    })

    const result: DashboardDeadline[] = rows
      .filter((row) => Boolean(row.response_deadline))
      .map((row) => {
        const deadline = row.response_deadline as Date
        return {
          noticeId: row.notice_id,
          title: row.title || 'Untitled Opportunity',
          agency: row.organization_name || row.department || 'Unknown Agency',
          deadline: deadline.toISOString(),
          value: null,
          daysUntil: daysUntil(deadline),
        }
      })

    return NextResponse.json(result)
  } catch (error) {
    console.error('[GET /api/dashboard/deadlines] failed', error)
    return NextResponse.json({ error: 'Failed to fetch deadlines' }, { status: 500 })
  }
}

