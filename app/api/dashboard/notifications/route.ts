import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type DashboardNotificationType = 'deadline' | 'search' | 'alert' | 'save' | 'ai'

type DashboardNotification = {
  type: DashboardNotificationType
  title: string
  noticeId: string | null
  createdAt: string
  iconType: DashboardNotificationType
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
    const seventyTwoHoursOut = new Date(now.getTime() + 72 * 60 * 60 * 1000)

    const [deadlineRows, recentSearchRows, recentAlertRows, recentSaveRows] = await Promise.all([
      prisma.saved_opportunities.findMany({
        where: {
          user_id: userId,
          response_deadline: { gte: now, lte: seventyTwoHoursOut },
        },
        orderBy: [{ response_deadline: 'asc' }],
        take: 8,
        select: {
          notice_id: true,
          title: true,
          response_deadline: true,
        },
      }),
      prisma.saved_searches_new.findMany({
        where: { user_id: userId },
        orderBy: [{ updated_at: 'desc' }],
        take: 6,
        select: {
          id: true,
          name: true,
          updated_at: true,
        },
      }),
      prisma.alert_subscriptions.findMany({
        where: { user_id: userId },
        orderBy: [{ updated_at: 'desc' }],
        take: 6,
        select: {
          id: true,
          name: true,
          active: true,
          updated_at: true,
        },
      }),
      prisma.saved_opportunities.findMany({
        where: { user_id: userId },
        orderBy: [{ created_at: 'desc' }],
        take: 6,
        select: {
          notice_id: true,
          title: true,
          created_at: true,
        },
      }),
    ])

    const deadlineNotifications: DashboardNotification[] = deadlineRows
      .filter((row) => Boolean(row.response_deadline))
      .map((row) => {
        const deadline = row.response_deadline as Date
        return {
          type: 'deadline',
          title: `Deadline in ${daysUntil(deadline)} day(s): ${row.title || 'Untitled Opportunity'}`,
          noticeId: row.notice_id,
          createdAt: deadline.toISOString(),
          iconType: 'deadline',
        }
      })

    const searchNotifications: DashboardNotification[] = recentSearchRows.map((row) => ({
      type: 'search',
      title: `Saved search updated: ${row.name || 'Untitled Search'}`,
      noticeId: null,
      createdAt: row.updated_at.toISOString(),
      iconType: 'search',
    }))

    const alertNotifications: DashboardNotification[] = recentAlertRows.map((row) => ({
      type: 'alert',
      title: `${row.active ? 'Alert active' : 'Alert paused'}: ${row.name || 'Untitled Alert'}`,
      noticeId: null,
      createdAt: row.updated_at.toISOString(),
      iconType: 'alert',
    }))

    const saveNotifications: DashboardNotification[] = recentSaveRows.map((row) => ({
      type: 'save',
      title: `Saved opportunity: ${row.title || 'Untitled Opportunity'}`,
      noticeId: row.notice_id,
      createdAt: row.created_at.toISOString(),
      iconType: 'save',
    }))

    const combined = [
      ...deadlineNotifications,
      ...searchNotifications,
      ...alertNotifications,
      ...saveNotifications,
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8)

    return NextResponse.json(combined)
  } catch (error) {
    console.error('[GET /api/dashboard/notifications] failed', error)
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

