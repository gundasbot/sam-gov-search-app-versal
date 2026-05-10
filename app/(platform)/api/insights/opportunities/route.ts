import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

const MANUAL_REFRESH_LIMIT_PER_WEEK = 2
const SCHEDULED_SYNC_LOOKBACK_DAYS = 180
const MAX_SYNC_LIMIT = 250
const MAX_SYNC_PAGES = 24
const MAX_SYNC_RECORDS = 5000

type DashboardPreferences = {
  naicsCodes?: string[]
  setAsides?: string[]
  states?: string[]
  agencies?: string[]
}

type SessionUser = {
  id: string
  email: string | null
  subscriptions: Prisma.JsonValue | null
}

type SamOpportunity = {
  noticeId?: string
  title?: string
  solicitationNumber?: string
  department?: string
  agency?: string
  postedDate?: string
  responseDeadline?: string
  responseDeadLine?: string
  naicsCode?: string
  setAside?: string
  typeOfSetAside?: string
  typeOfSetAsideDescription?: string
  state?: string
  placeOfPerformance?: {
    state?: { code?: string; name?: string }
  }
  uiLink?: string
  url?: string
  type?: string
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
    agencies: list(prefs.agencies),
  }
}

async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions)
  const sessionUserId = String((session as any)?.user?.id || '').trim()
  const sessionEmail = String(session?.user?.email || '').trim().toLowerCase()

  if (sessionUserId) {
    const byId = await prisma.users.findUnique({
      where: { id: sessionUserId },
      select: { id: true, email: true, subscriptions: true },
    })
    if (byId) {
      return {
        id: byId.id,
        email: byId.email?.toLowerCase() || null,
        subscriptions: byId.subscriptions ?? null,
      }
    }
  }

  if (!sessionEmail) return null

  const byEmail = await prisma.users.findUnique({
    where: { email: sessionEmail },
    select: { id: true, email: true, subscriptions: true },
  })
  if (!byEmail) return null

  return {
    id: byEmail.id,
    email: byEmail.email?.toLowerCase() || null,
    subscriptions: byEmail.subscriptions ?? null,
  }
}

function formatMMDDYYYY(date: Date): string {
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(date.getUTCDate()).padStart(2, '0')
  return `${mm}/${dd}/${date.getUTCFullYear()}`
}

function daysAgoUTC(days: number): Date {
  const now = new Date()
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  d.setUTCDate(d.getUTCDate() - days)
  return d
}

function startOfWeekUTC(now: Date): Date {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const day = start.getUTCDay()
  const offsetToMonday = day === 0 ? 6 : day - 1
  start.setUTCDate(start.getUTCDate() - offsetToMonday)
  return start
}

function startOfCurrentSyncSlotUTC(now: Date): Date {
  const day = now.getUTCDate()
  if (day >= 15) {
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 15))
  }
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
}

function nextSyncSlotUTC(now: Date): Date {
  const day = now.getUTCDate()
  if (day < 15) return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 15))
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))
}

function slotKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function safeDate(value?: string | null): Date | null {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

function normalizeState(opp: SamOpportunity): string | null {
  if (opp.state?.trim()) return opp.state.trim()
  const code = opp.placeOfPerformance?.state?.code?.trim()
  if (code) return code
  const name = opp.placeOfPerformance?.state?.name?.trim()
  return name || null
}

function mapToCachedRecord(opp: SamOpportunity, syncedAt: Date): Prisma.cached_opportunitiesUncheckedCreateInput | null {
  const noticeId = String(opp.noticeId || '').trim()
  const title = String(opp.title || '').trim()
  if (!noticeId || !title) return null

  return {
    id: noticeId,
    sam_notice_id: noticeId,
    title,
    agency: String(opp.department || opp.agency || '').trim() || null,
    naics_code: String(opp.naicsCode || '').trim() || null,
    solicitation_number: String(opp.solicitationNumber || '').trim() || null,
    opportunity_type: String(opp.type || '').trim() || null,
    set_aside: String(opp.setAside || opp.typeOfSetAside || '').trim() || null,
    posted_date: safeDate(opp.postedDate || null),
    response_deadline: safeDate(opp.responseDeadline || opp.responseDeadLine || null),
    description: null,
    contract_value: null,
    url: String(opp.uiLink || opp.url || '').trim() || null,
    active: true,
    synced_at: syncedAt,
    business_state: normalizeState(opp),
    naics_definition: null,
    created_at: syncedAt,
  }
}

async function syncCachedOpportunitiesFromSam(req: NextRequest, reason: 'scheduled' | 'manual', logTag: string) {
  const now = new Date()
  const origin = new URL(req.url).origin
  const postedFrom = formatMMDDYYYY(daysAgoUTC(SCHEDULED_SYNC_LOOKBACK_DAYS))
  const postedTo = formatMMDDYYYY(now)
  const byNotice = new Map<string, SamOpportunity>()

  let offset = 0
  let pages = 0
  let totalRecords: number | null = null

  while (pages < MAX_SYNC_PAGES && byNotice.size < MAX_SYNC_RECORDS) {
    const samUrl = new URL('/api/sam/opportunities', origin)
    samUrl.searchParams.set('limit', String(MAX_SYNC_LIMIT))
    samUrl.searchParams.set('offset', String(offset))
    samUrl.searchParams.set('status', 'active')
    samUrl.searchParams.set('postedFrom', postedFrom)
    samUrl.searchParams.set('postedTo', postedTo)
    samUrl.searchParams.set('source', `insights-${reason}`)
    if (offset === 0) samUrl.searchParams.set('refresh', 'true')

    const response = await fetch(samUrl.toString(), { cache: 'no-store' })
    if (!response.ok) {
      const detail = await response.text()
      throw new Error(`SAM sync failed (${response.status}): ${detail.slice(0, 200)}`)
    }

    const payload = await response.json()
    const pageOpps: SamOpportunity[] = Array.isArray(payload?.opportunities) ? payload.opportunities : []
    const reportedTotal = Number(payload?.totalRecords)
    if (Number.isFinite(reportedTotal) && reportedTotal >= 0) {
      totalRecords = reportedTotal
    }

    const before = byNotice.size
    for (const opp of pageOpps) {
      const noticeId = String(opp?.noticeId || '').trim()
      if (!noticeId) continue
      if (!byNotice.has(noticeId)) byNotice.set(noticeId, opp)
    }
    const added = byNotice.size - before

    pages += 1
    if (!pageOpps.length) break
    offset += pageOpps.length
    if (totalRecords != null && offset >= totalRecords) break
  }

  const opportunities: SamOpportunity[] = Array.from(byNotice.values()).slice(0, MAX_SYNC_RECORDS)
  const syncedAt = new Date()

  let upserted = 0
  for (const opp of opportunities) {
    const mapped = mapToCachedRecord(opp, syncedAt)
    if (!mapped) continue

    await prisma.cached_opportunities.upsert({
      where: { sam_notice_id: mapped.sam_notice_id },
      create: mapped,
      update: {
        title: mapped.title,
        agency: mapped.agency,
        naics_code: mapped.naics_code,
        solicitation_number: mapped.solicitation_number,
        opportunity_type: mapped.opportunity_type,
        set_aside: mapped.set_aside,
        posted_date: mapped.posted_date,
        response_deadline: mapped.response_deadline,
        url: mapped.url,
        active: true,
        synced_at: mapped.synced_at,
        business_state: mapped.business_state,
      },
    })

    upserted += 1
  }

  const pageWindowLikelyPartial =
    pages === 1 && opportunities.length >= MAX_SYNC_LIMIT

  const partialSync =
    pageWindowLikelyPartial ||
    opportunities.length >= MAX_SYNC_RECORDS ||
    pages >= MAX_SYNC_PAGES ||
    totalRecords == null ||
    totalRecords > opportunities.length

  if (!partialSync) {
    await prisma.cached_opportunities.updateMany({
      where: {
        OR: [{ synced_at: null }, { synced_at: { lt: syncedAt } }],
        active: true,
      },
      data: { active: false },
    })
  }

  await prisma.opportunity_sync_log.create({
    data: {
      count: upserted,
      naics_list: logTag,
      synced_at: syncedAt,
    },
  })

  return { upserted, syncedAt, partialSync, totalRecords, pages }
}

async function buildStats(where: Prisma.cached_opportunitiesWhereInput) {
  const now = new Date()
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const [totalActive, newToday, expiringSoon, distinctAgencyRows, topAgencyRows, topSetAsideRows] = await Promise.all([
    prisma.cached_opportunities.count({ where }),
    prisma.cached_opportunities.count({
      where: {
        AND: [where, { posted_date: { gte: oneDayAgo } }],
      },
    }),
    prisma.cached_opportunities.count({
      where: {
        AND: [where, { response_deadline: { gte: now, lte: sevenDaysFromNow } }],
      },
    }),
    prisma.cached_opportunities.findMany({
      where: {
        AND: [where, { agency: { not: null } }],
      },
      distinct: ['agency'],
      select: { agency: true },
    }),
    prisma.cached_opportunities.groupBy({
      by: ['agency'],
      where: {
        AND: [where, { agency: { not: null } }],
      },
      _count: { agency: true },
      orderBy: { _count: { agency: 'desc' } },
      take: 8,
    }),
    prisma.cached_opportunities.groupBy({
      by: ['set_aside'],
      where: {
        AND: [where, { set_aside: { not: null } }],
      },
      _count: { set_aside: true },
      orderBy: { _count: { set_aside: 'desc' } },
      take: 8,
    }),
  ])

  const activeAgencies = new Set(
    distinctAgencyRows
      .map((row) => (row.agency || '').trim())
      .filter(Boolean)
  ).size

  const topAgencies = Object.fromEntries(
    topAgencyRows
      .map((row) => [String(row.agency || '').trim(), row._count.agency] as const)
      .filter(([name]) => !!name)
  )

  const topSetAsides = Object.fromEntries(
    topSetAsideRows
      .map((row) => [String(row.set_aside || '').trim(), row._count.set_aside] as const)
      .filter(([name]) => !!name)
  )

  return {
    totalActive,
    newToday,
    expiringSoon,
    activeAgencies,
    topAgencies,
    topSetAsides,
  }
}

function combineAtLeastMatches(
  baseWhere: Prisma.cached_opportunitiesWhereInput,
  dimensions: Prisma.cached_opportunitiesWhereInput[],
  minMatches: number
): Prisma.cached_opportunitiesWhereInput {
  if (!dimensions.length || minMatches <= 0) return baseWhere
  if (minMatches >= dimensions.length) {
    return { AND: [baseWhere, ...dimensions] }
  }
  if (minMatches === 1) {
    return { AND: [baseWhere, { OR: dimensions }] }
  }

  const combos: Prisma.cached_opportunitiesWhereInput[] = []
  const build = (start: number, chosen: Prisma.cached_opportunitiesWhereInput[]) => {
    if (chosen.length === minMatches) {
      combos.push({ AND: [...chosen] })
      return
    }
    for (let i = start; i < dimensions.length; i += 1) {
      chosen.push(dimensions[i])
      build(i + 1, chosen)
      chosen.pop()
    }
  }

  build(0, [])
  return combos.length ? { AND: [baseWhere, { OR: combos }] } : baseWhere
}

export async function GET(req: NextRequest) {
  try {
    const now = new Date()
    const user = await getSessionUser()
    const refreshMode = (req.nextUrl.searchParams.get('refresh') || '').trim().toLowerCase()
    const manualRefreshRequested = refreshMode === 'manual'

    const syncSlotStart = startOfCurrentSyncSlotUTC(now)
    const syncSlotKey = slotKey(syncSlotStart)
    const nextScheduled = nextSyncSlotUTC(now)
    const weekStart = startOfWeekUTC(now)

    let refreshStatus:
      | 'none'
      | 'manual_sync_completed'
      | 'manual_limit_reached'
      | 'manual_login_required'
      | 'manual_sync_failed'
      | 'scheduled_sync_completed'
      | 'scheduled_sync_failed' = 'none'
    let refreshMessage: string | null = null

    const latestSync = await prisma.cached_opportunities.aggregate({ _max: { synced_at: true } })
    const latestSyncedAt = latestSync._max.synced_at
    const scheduledDue = !latestSyncedAt || latestSyncedAt < syncSlotStart

    const manualLogPrefix = user ? `manual:${user.id}:` : ''
    const manualUsedThisWeek = user
      ? await prisma.opportunity_sync_log.count({
          where: {
            naics_list: { startsWith: manualLogPrefix },
            synced_at: { gte: weekStart },
          },
        })
      : 0

    if (manualRefreshRequested) {
      if (!user) {
        refreshStatus = 'manual_login_required'
        refreshMessage = 'Sign in to request manual Insights refreshes.'
      } else if (manualUsedThisWeek >= MANUAL_REFRESH_LIMIT_PER_WEEK) {
        refreshStatus = 'manual_limit_reached'
        refreshMessage = `Manual refresh limit reached (${MANUAL_REFRESH_LIMIT_PER_WEEK} per week).`
      } else {
        try {
          await syncCachedOpportunitiesFromSam(req, 'manual', `manual:${user.id}:${now.toISOString()}`)
          refreshStatus = 'manual_sync_completed'
          refreshMessage = 'Manual refresh completed from live SAM.gov data.'
        } catch (error) {
          console.error('Manual insights sync failed:', error)
          refreshStatus = 'manual_sync_failed'
          refreshMessage = error instanceof Error ? error.message : 'Manual refresh failed'
        }
      }
    }

    if (scheduledDue) {
      const alreadySyncedThisSlot = await prisma.opportunity_sync_log.findFirst({
        where: {
          naics_list: `scheduled:${syncSlotKey}`,
          synced_at: { gte: syncSlotStart },
        },
        select: { id: true },
      })

      if (!alreadySyncedThisSlot) {
        try {
          await syncCachedOpportunitiesFromSam(req, 'scheduled', `scheduled:${syncSlotKey}`)
          if (refreshStatus === 'none') {
            refreshStatus = 'scheduled_sync_completed'
            refreshMessage = 'Scheduled Insights sync completed.'
          }
        } catch (error) {
          console.error('Scheduled insights sync failed:', error)
          if (refreshStatus === 'none') {
            refreshStatus = 'scheduled_sync_failed'
            refreshMessage = error instanceof Error ? error.message : 'Scheduled refresh failed'
          }
        }
      }
    }

    if (!manualRefreshRequested && !scheduledDue) {
      const activeSnapshotCount = await prisma.cached_opportunities.count({ where: { active: true } })
      const olderThanOneDay = await prisma.cached_opportunities.count({
        where: {
          active: true,
          posted_date: { lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
        },
      })

      const looksLikeTruncatedFreshWindow =
        activeSnapshotCount >= 500 &&
        olderThanOneDay === 0

      if (activeSnapshotCount <= 250 || looksLikeTruncatedFreshWindow) {
        const correctiveKey = `corrective:${now.toISOString().slice(0, 10)}`
        const alreadyCorrected = await prisma.opportunity_sync_log.findFirst({
          where: { naics_list: correctiveKey },
          select: { id: true },
        })
        if (!alreadyCorrected) {
          try {
            await syncCachedOpportunitiesFromSam(req, 'scheduled', correctiveKey)
            if (refreshStatus === 'none') {
              refreshStatus = 'scheduled_sync_completed'
              refreshMessage = 'Corrective sync completed to restore full Insights sample coverage.'
            }
          } catch (error) {
            console.error('Corrective insights sync failed:', error)
          }
        }
      }
    }

    const refreshedSync = await prisma.cached_opportunities.aggregate({ _max: { synced_at: true } })
    const effectiveSyncedAt = refreshedSync._max.synced_at

    const userPrefs = user ? parseDashboardPreferences(user.subscriptions) : {}
    const baseFilters: Prisma.cached_opportunitiesWhereInput = { active: true }
    const preferenceDimensions: Prisma.cached_opportunitiesWhereInput[] = []

    if (user && userPrefs.naicsCodes?.length) {
      preferenceDimensions.push({ naics_code: { in: userPrefs.naicsCodes } })
    }
    if (user && userPrefs.setAsides?.length) {
      preferenceDimensions.push({ set_aside: { in: userPrefs.setAsides } })
    }
    if (user && userPrefs.states?.length) {
      preferenceDimensions.push({ business_state: { in: userPrefs.states } })
    }
    if (user && userPrefs.agencies?.length) {
      const agencyAny = userPrefs.agencies
        .map((agency) => String(agency || '').trim())
        .filter(Boolean)
        .map((agency) => ({ agency: { contains: agency, mode: 'insensitive' as const } }))
      if (agencyAny.length) {
        preferenceDimensions.push({ OR: agencyAny })
      }
    }

    const preferenceFiltersApplied = preferenceDimensions.length > 0
    const strictMinSignals = preferenceDimensions.length >= 2 ? 2 : preferenceDimensions.length
    const feedFilters = preferenceFiltersApplied
      ? combineAtLeastMatches(baseFilters, preferenceDimensions, strictMinSignals)
      : baseFilters

    const selectShape = {
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
    } as const

    const orderShape = [{ response_deadline: 'asc' as const }, { posted_date: 'desc' as const }]

    let opportunities = await prisma.cached_opportunities.findMany({
      where: feedFilters,
      select: selectShape,
      orderBy: orderShape,
      take: 200,
    })

    if (!opportunities.length) {
      try {
        await syncCachedOpportunitiesFromSam(req, 'scheduled', `bootstrap:${syncSlotKey}`)
        opportunities = await prisma.cached_opportunities.findMany({
          where: feedFilters,
          select: selectShape,
          orderBy: orderShape,
          take: 200,
        })
        if (refreshStatus === 'none') {
          refreshStatus = 'scheduled_sync_completed'
          refreshMessage = 'Insights cache was empty and has been repopulated from SAM.gov.'
        }
      } catch (error) {
        console.error('Bootstrap insights sync failed:', error)
      }
    }

    const [feedStats, marketStats] = await Promise.all([
      buildStats(feedFilters),
      buildStats(baseFilters),
    ])

    const latestDailyStat = !user ? await prisma.opportunity_daily_stats.findFirst({
      orderBy: { day: 'desc' },
      select: { total: true, by_dept: true },
    }) : null

    if (latestDailyStat) {
      if (typeof latestDailyStat.total === 'number' && latestDailyStat.total > marketStats.totalActive) {
        marketStats.totalActive = latestDailyStat.total
      }

      if (latestDailyStat.by_dept) {
        try {
          const deptData = typeof latestDailyStat.by_dept === 'string'
            ? JSON.parse(latestDailyStat.by_dept)
            : latestDailyStat.by_dept
          const deptKeys = Object.keys((deptData || {}) as Record<string, unknown>)
          if (deptKeys.length > marketStats.activeAgencies) {
            marketStats.activeAgencies = deptKeys.length
          }
        } catch {
          // Ignore malformed historical stats payloads
        }
      }
    }

    const stats = {
      ...feedStats,
      totalActive: marketStats.totalActive,
      marketActive: marketStats.totalActive,
      preferenceMatches: user
        ? (preferenceFiltersApplied ? feedStats.totalActive : 0)
        : feedStats.newToday,
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

    const latestManualCount = user
      ? await prisma.opportunity_sync_log.count({
          where: {
            naics_list: { startsWith: `manual:${user.id}:` },
            synced_at: { gte: weekStart },
          },
        })
      : 0

    return NextResponse.json({
      opportunities: normalized.slice(0, 80),
      stats,
      total: stats.totalActive,
      feedMode: user ? 'personalized' : 'sample',
      refreshStatus,
      refreshMessage,
      refreshPolicy: {
        cadence: 'Bi-monthly scheduled syncs on the 1st and 15th (UTC)',
        lastSyncedAt: effectiveSyncedAt,
        nextScheduledSyncAt: nextScheduled,
        manual: {
          allowedPerWeek: MANUAL_REFRESH_LIMIT_PER_WEEK,
          usedThisWeek: latestManualCount,
          remainingThisWeek: user ? Math.max(0, MANUAL_REFRESH_LIMIT_PER_WEEK - latestManualCount) : 0,
          available: !!user,
          weekResetAt: new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000),
        },
      },
    })
  } catch (err: unknown) {
    console.error('Insights opportunities error:', err)
    const detail = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to fetch opportunities', detail }, { status: 500 })
  }
}
