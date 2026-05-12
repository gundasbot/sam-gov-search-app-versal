// app/api/saved-opportunities/route.ts
// Handles GET (list all saved opportunities) and POST (save a new one)

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { Prisma } from '@prisma/client'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function normalizeJson(value: unknown) {
  if (value == null) return Prisma.JsonNull
  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch {
      return value
    }
  }
  return value
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
    })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const savedOpportunities = await prisma.saved_opportunities.findMany({
      where: { user_id: user.id },
      orderBy: { created_at: 'desc' },
    })

    return NextResponse.json({ savedOpportunities })
  } catch (error) {
    console.error('GET /api/saved-opportunities error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
    })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const {
      noticeId,
      title,
      solicitationNumber,
      department,
      postedDate,
      responseDeadLine,
      naicsCode,
      type,
      setAside,
      placeOfPerformance,
      uiLink,
      organizationName,
    } = body

    if (!noticeId) {
      return NextResponse.json({ error: 'noticeId is required' }, { status: 400 })
    }

    // Upsert — don't error if already saved
    const saved = await prisma.saved_opportunities.upsert({
      where: {
        user_id_notice_id: {
          user_id: user.id,
          notice_id: noticeId,
        },
      },
      update: {
        title,
        solicitation_number: solicitationNumber,
        department,
        posted_date: postedDate ? new Date(postedDate) : null,
        response_deadline: responseDeadLine ? new Date(responseDeadLine) : null,
        naics_code: naicsCode,
        opportunity_type: type,
        set_aside: setAside,
        place_of_performance: normalizeJson(placeOfPerformance),
        ui_link: uiLink,
        organization_name: organizationName,
        updated_at: new Date(),
      },
      create: {
        user_id: user.id,
        notice_id: noticeId,
        title,
        solicitation_number: solicitationNumber,
        department,
        posted_date: postedDate ? new Date(postedDate) : null,
        response_deadline: responseDeadLine ? new Date(responseDeadLine) : null,
        naics_code: naicsCode,
        opportunity_type: type,
        set_aside: setAside,
        place_of_performance: normalizeJson(placeOfPerformance),
        ui_link: uiLink,
        organization_name: organizationName,
        created_at: new Date(),
        updated_at: new Date(),
      },
    })

    return NextResponse.json({ saved }, { status: 201 })
  } catch (error) {
    console.error('POST /api/saved-opportunities error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
