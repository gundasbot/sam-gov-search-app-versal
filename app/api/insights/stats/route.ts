// app/api/insights/stats/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface Stats {
  totalActive: number
  newToday: number
  expiringSoon: number
  activeAgencies: number
  topAgencies: { [key: string]: number }
  topSetAsides: { [key: string]: number }
}

export async function GET(req: NextRequest) {
  try {
    // Get latest daily stats if available
    const latestDailyStat = await prisma.opportunity_daily_stats.findFirst({
      orderBy: { day: 'desc' },
      take: 1,
    })

    let stats: Stats = {
      totalActive: 0,
      newToday: 0,
      expiringSoon: 0,
      activeAgencies: 0,
      topAgencies: {},
      topSetAsides: {},
    }

    // If we have recent cached stats, use them
    if (latestDailyStat && new Date(latestDailyStat.day).getTime() > Date.now() - 24 * 60 * 60 * 1000) {
      stats.totalActive = latestDailyStat.total || 0
      if (latestDailyStat.by_dept) {
        const deptData = typeof latestDailyStat.by_dept === 'string' 
          ? JSON.parse(latestDailyStat.by_dept) 
          : latestDailyStat.by_dept
        stats.topAgencies = deptData
        stats.activeAgencies = Object.keys(deptData).length
      }
      if (latestDailyStat.by_set_aside) {
        const setAsideData = typeof latestDailyStat.by_set_aside === 'string' 
          ? JSON.parse(latestDailyStat.by_set_aside) 
          : latestDailyStat.by_set_aside
        stats.topSetAsides = setAsideData
      }
    } else {
      // Compute stats from cached_opportunities in real-time
      const opportunities = await prisma.cached_opportunities.findMany({
        select: {
          agency: true,
          set_aside: true,
          posted_date: true,
          response_deadline: true,
        },
      })

      stats.totalActive = opportunities.length

      // New today
      const now = Date.now()
      const oneDayAgo = now - 24 * 60 * 60 * 1000
      stats.newToday = opportunities.filter(
        (o) => o.posted_date && new Date(o.posted_date).getTime() > oneDayAgo
      ).length

      // Expiring soon (72 hours)
      const threeDaysFromNow = now + 72 * 60 * 60 * 1000
      stats.expiringSoon = opportunities.filter(
        (o) => o.response_deadline && new Date(o.response_deadline).getTime() < threeDaysFromNow
      ).length

      // Top agencies
      const agencyCounts: { [key: string]: number } = {}
      opportunities.forEach((o) => {
        if (o.agency) {
          agencyCounts[o.agency] = (agencyCounts[o.agency] || 0) + 1
        }
      })
      stats.topAgencies = Object.fromEntries(
        Object.entries(agencyCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
      )
      stats.activeAgencies = Object.keys(agencyCounts).length

      // Top set-asides
      const setAsideCounts: { [key: string]: number } = {}
      opportunities.forEach((o) => {
        if (o.set_aside) {
          setAsideCounts[o.set_aside] = (setAsideCounts[o.set_aside] || 0) + 1
        }
      })
      stats.topSetAsides = Object.fromEntries(
        Object.entries(setAsideCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
      )
    }

    return NextResponse.json(stats)
  } catch (err: any) {
    console.error('Insights stats error:', err)
    return NextResponse.json({ error: 'Failed to fetch stats', detail: err?.message }, { status: 500 })
  }
}
