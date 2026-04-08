import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type DashboardActiveSearch = {
  id: string
  name: string
  query: string
  filters: {
    naics: string
    agency: string
    setAside: string
    state: string
    opportunityType: string
    postedAfter: string | null
    postedBefore: string | null
    responseDeadline: string | null
    solicitationNumber: string
    pscCode: string
    zip: string
    status: string
  }
  createdAt: string
  updatedAt: string
  subscriptionEnabled: boolean
  frequency: string | null
  lastResultCount: number
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

function toDateString(value: Date | null | undefined): string | null {
  if (!value) return null
  return value.toISOString().slice(0, 10)
}

export async function GET() {
  try {
    const userId = await resolveSessionUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rows = await prisma.saved_searches_new.findMany({
      where: { user_id: userId },
      orderBy: [{ updated_at: 'desc' }],
      take: 100,
      select: {
        id: true,
        name: true,
        keywords: true,
        naics: true,
        agency: true,
        set_aside: true,
        state_of_performance: true,
        procurement_type: true,
        posted_after: true,
        posted_before: true,
        rdl_to: true,
        solicitation_number: true,
        classification_code: true,
        place_of_performance_zip: true,
        opportunity_status: true,
        subscription_enabled: true,
        frequency: true,
        last_result_count: true,
        created_at: true,
        updated_at: true,
      },
    })

    const result: DashboardActiveSearch[] = rows.map((row) => ({
      id: row.id,
      name: row.name || 'Untitled Search',
      query: row.keywords || '',
      filters: {
        naics: row.naics || '',
        agency: row.agency || '',
        setAside: row.set_aside || '',
        state: row.state_of_performance || '',
        opportunityType: row.procurement_type || '',
        postedAfter: toDateString(row.posted_after),
        postedBefore: toDateString(row.posted_before),
        responseDeadline: toDateString(row.rdl_to),
        solicitationNumber: row.solicitation_number || '',
        pscCode: row.classification_code || '',
        zip: row.place_of_performance_zip || '',
        status: row.opportunity_status || '',
      },
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
      subscriptionEnabled: Boolean(row.subscription_enabled),
      frequency: row.frequency ?? null,
      lastResultCount: row.last_result_count ?? 0,
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('[GET /api/dashboard/active-searches] failed', error)
    return NextResponse.json({ error: 'Failed to fetch active searches' }, { status: 500 })
  }
}

