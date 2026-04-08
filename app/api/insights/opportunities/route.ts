import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

type DashboardPreferences = {
  naicsCodes?: string[]
  setAsides?: string[]
  states?: string[]
}

function parseDashboardPreferences(subscriptions: Prisma.JsonValue | null | undefined): DashboardPreferences {
  if (!subscriptions || typeof subscriptions !== 'object' || Array.isArray(subscriptions)) {
    return {}
  }

  const container = subscriptions as Record<string, unknown>
  const rawPrefs = container.dashboardPreferences
  if (!rawPrefs || typeof rawPrefs !== 'object' || Array.isArray(rawPrefs)) {
    return {}
  }

  const prefs = rawPrefs as Record<string, unknown>
  const list = (value: unknown): string[] =>
    Array.isArray(value) ? value.map((item) => String(item || '').trim()).filter(Boolean) : []

  return {
    naicsCodes: list(prefs.naicsCodes),
    setAsides: list(prefs.setAsides),
    states: list(prefs.states),
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database
    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        subscriptions: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userPrefs = parseDashboardPreferences(user.subscriptions)

    // Build filters from preferences
    const filters: Prisma.cached_opportunitiesWhereInput = { active: true }

    if (userPrefs.naicsCodes?.length) {
      filters.naics_code = { in: userPrefs.naicsCodes }
    }
    if (userPrefs.setAsides?.length) {
      filters.set_aside = { in: userPrefs.setAsides }
    }
    if (userPrefs.states?.length) {
      filters.business_state = { in: userPrefs.states }
    }

    // Fetch cached opportunities (limit to 100 for analysis)
    const opportunities = await prisma.cached_opportunities.findMany({
      where: filters,
      select: {
        sam_notice_id: true,
        title: true,
        solicitation_number: true,
        agency: true,
        posted_date: true,
        response_deadline: true,
        naics_code: true,
        set_aside: true,
        business_state: true,
        url: true,
      },
      orderBy: { posted_date: 'desc' },
      take: 100,
    })

    // Calculate stats from opportunities
    const stats = {
      totalActive: opportunities.length,
      newToday: opportunities.filter(
        (o) => o.posted_date && new Date(o.posted_date).getTime() > Date.now() - 24 * 60 * 60 * 1000
      ).length,
      expiringSoon: opportunities.filter(
        (o) => o.response_deadline && new Date(o.response_deadline).getTime() < Date.now() + 72 * 60 * 60 * 1000
      ).length,
      activeAgencies: new Set(opportunities.map((o) => o.agency).filter(Boolean)).size,
    }

    const normalized = opportunities.map((o) => ({
      noticeId: o.sam_notice_id,
      title: o.title,
      solicitationNumber: o.solicitation_number,
      agency: o.agency,
      postedDate: o.posted_date,
      responseDeadline: o.response_deadline,
      naicsCode: o.naics_code,
      setAside: o.set_aside,
      state: o.business_state,
      url: o.url,
    }))

    return NextResponse.json({
      opportunities: normalized.slice(0, 50), // Return top 50 for UI
      stats,
      total: normalized.length,
    })
  } catch (err: unknown) {
    console.error('Insights opportunities error:', err)
    const detail = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to fetch opportunities', detail }, { status: 500 })
  }
}
