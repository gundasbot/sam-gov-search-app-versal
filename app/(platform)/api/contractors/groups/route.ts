import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type ContractorRow = {
  id: string
  name: string | null
  email: string | null
  naics_code: string | null
  state: string | null
  business_type: string | null
  cage_code: string | null
  priority: string | null
  synced_at: Date | null
  created_at: Date | null
}

function normalizeKey(value?: string | null) {
  return (value || '').trim()
}

function topGroups(rows: ContractorRow[], getter: (row: ContractorRow) => string, take = 12) {
  const counts = new Map<string, number>()
  for (const row of rows) {
    const key = getter(row)
    if (!key) continue
    counts.set(key, (counts.get(key) || 0) + 1)
  }
  return Array.from(counts.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, take)
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const params = req.nextUrl.searchParams
    const filterNaics = normalizeKey(params.get('naics'))
    const filterState = normalizeKey(params.get('state')).toUpperCase()
    const filterSetAside = normalizeKey(params.get('setAside'))
    const limit = Math.min(Math.max(Number(params.get('limit') || '80'), 10), 200)

    const where: any = {
      AND: [
        { email: { not: null } },
        { email: { not: '' } },
      ],
    }

    if (filterNaics) where.naics_code = filterNaics
    if (filterState) where.state = filterState
    if (filterSetAside) {
      where.business_type = { contains: filterSetAside, mode: 'insensitive' as const }
    }

    const sampled = await prisma.contractors.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        naics_code: true,
        state: true,
        business_type: true,
        cage_code: true,
        priority: true,
        synced_at: true,
        created_at: true,
      },
      orderBy: [{ synced_at: 'desc' }, { created_at: 'desc' }],
      take: 1200,
    })

    const rows = sampled as ContractorRow[]
    const groups = {
      naics: topGroups(rows, r => normalizeKey(r.naics_code)),
      states: topGroups(rows, r => normalizeKey(r.state).toUpperCase()),
      setAsides: topGroups(rows, r => normalizeKey(r.business_type)),
    }

    const contractors = rows.slice(0, limit).map(r => ({
      id: r.id,
      name: normalizeKey(r.name),
      email: normalizeKey(r.email),
      naicsCode: normalizeKey(r.naics_code),
      state: normalizeKey(r.state).toUpperCase(),
      setAside: normalizeKey(r.business_type),
      cageCode: normalizeKey(r.cage_code),
      priority: normalizeKey(r.priority),
      syncedAt: r.synced_at?.toISOString() ?? null,
      createdAt: r.created_at?.toISOString() ?? null,
    }))

    return NextResponse.json({
      contractors,
      groups,
      sampledCount: rows.length,
      filters: {
        naics: filterNaics || null,
        state: filterState || null,
        setAside: filterSetAside || null,
      },
    })
  } catch (error) {
    console.error('[contractors/groups GET]', error)
    return NextResponse.json({ error: 'Failed to load contractor groups' }, { status: 500 })
  }
}
