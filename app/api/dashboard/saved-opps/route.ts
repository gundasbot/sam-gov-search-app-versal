import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type DashboardSavedOpportunity = {
  noticeId: string
  title: string
  agency: string
  value: number | null
  posted: string | null
  deadline: string | null
  naics: string | null
  setAside: string | null
  description: string | null
  solicitationLink: string | null
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

function isoDate(value: Date | null | undefined): string | null {
  if (!value) return null
  return value.toISOString()
}

export async function GET() {
  try {
    const userId = await resolveSessionUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rows = await prisma.saved_opportunities.findMany({
      where: { user_id: userId },
      orderBy: [{ created_at: 'desc' }],
      take: 100,
      select: {
        notice_id: true,
        title: true,
        organization_name: true,
        department: true,
        posted_date: true,
        response_deadline: true,
        naics_code: true,
        set_aside: true,
        solicitation_number: true,
        ui_link: true,
      },
    })

    const result: DashboardSavedOpportunity[] = rows.map((row) => ({
      noticeId: row.notice_id,
      title: row.title || 'Untitled Opportunity',
      agency: row.organization_name || row.department || 'Unknown Agency',
      value: null,
      posted: isoDate(row.posted_date),
      deadline: isoDate(row.response_deadline),
      naics: row.naics_code,
      setAside: row.set_aside,
      description: row.solicitation_number || null,
      solicitationLink: row.ui_link || (row.notice_id ? `https://sam.gov/opp/${row.notice_id}/view` : null),
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('[GET /api/dashboard/saved-opps] failed', error)
    return NextResponse.json({ error: 'Failed to fetch saved opportunities' }, { status: 500 })
  }
}

