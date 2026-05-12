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

    const fields = {
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
    }

    const existing = await prisma.saved_opportunities.findFirst({
      where: { user_id: user.id, notice_id: noticeId },
    })

    let saved
    if (existing) {
      saved = await prisma.saved_opportunities.update({
        where: { id: existing.id },
        data: fields,
      })
    } else {
      saved = await prisma.saved_opportunities.create({
        data: { user_id: user.id, notice_id: noticeId, created_at: new Date(), ...fields },
      })
    }

    return NextResponse.json({ saved }, { status: existing ? 200 : 201 })
  } catch (error) {
    console.error('POST /api/saved-opportunities error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
