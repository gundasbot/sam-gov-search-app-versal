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

function normalizeText(value: unknown) {
  if (value == null) return null
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed.length ? trimmed : null
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  return null
}

function normalizeDate(value: unknown) {
  const normalized = normalizeText(value)
  if (!normalized) return null
  if (/^(n\/a|na|none|tbd|\u2014|-|not set aside used)$/i.test(normalized)) return null

  const date = new Date(normalized)
  return Number.isNaN(date.getTime()) ? null : date
}

function errorDetails(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return { code: error.code, meta: error.meta }
  }
  if (error instanceof Prisma.PrismaClientValidationError) {
    return { code: 'PRISMA_VALIDATION' }
  }
  return { code: 'UNKNOWN' }
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

    const normalizedNoticeId = normalizeText(noticeId)
    if (!normalizedNoticeId) {
      return NextResponse.json({ error: 'noticeId is required' }, { status: 400 })
    }

    const opportunityType = normalizeText(type)
    const fields = {
      title: normalizeText(title),
      solicitation_number: normalizeText(solicitationNumber),
      department: normalizeText(department),
      posted_date: normalizeDate(postedDate),
      response_deadline: normalizeDate(responseDeadLine),
      naics_code: normalizeText(naicsCode),
      type: opportunityType,
      opportunity_type: opportunityType,
      set_aside: normalizeText(setAside),
      place_of_performance: normalizeJson(placeOfPerformance),
      ui_link: normalizeText(uiLink),
      organization_name: normalizeText(organizationName),
      updated_at: new Date(),
    }

    const existing = await prisma.saved_opportunities.findFirst({
      where: { user_id: user.id, notice_id: normalizedNoticeId },
    })

    let saved
    if (existing) {
      saved = await prisma.saved_opportunities.update({
        where: { id: existing.id },
        data: fields,
      })
    } else {
      saved = await prisma.saved_opportunities.create({
        data: { user_id: user.id, notice_id: normalizedNoticeId, created_at: new Date(), ...fields },
      })
    }

    return NextResponse.json({ saved }, { status: existing ? 200 : 201 })
  } catch (error) {
    const details = errorDetails(error)
    console.error('POST /api/saved-opportunities error:', details, error)
    return NextResponse.json(
      { error: 'Could not save favorite opportunity', ...details },
      { status: 500 }
    )
  }
}
