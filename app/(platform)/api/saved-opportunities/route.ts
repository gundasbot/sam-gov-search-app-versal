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

function jsonbParam(value: unknown) {
  if (value == null) return Prisma.sql`NULL::jsonb`
  if (typeof value === 'string') {
    try {
      return Prisma.sql`${JSON.stringify(JSON.parse(value))}::jsonb`
    } catch {
      return Prisma.sql`${JSON.stringify(value)}::jsonb`
    }
  }
  return Prisma.sql`${JSON.stringify(value)}::jsonb`
}

function errorDetails(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return { code: error.code, meta: error.meta, message: error.message }
  }
  if (error instanceof Prisma.PrismaClientValidationError) {
    return { code: 'PRISMA_VALIDATION', message: error.message }
  }
  if (error instanceof Error) {
    return { code: 'UNKNOWN', message: error.message }
  }
  return { code: 'UNKNOWN', message: String(error) }
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
    const savedRows = await prisma.$queryRaw<Array<Record<string, unknown>>>`
      INSERT INTO public.saved_opportunities (
        user_id,
        notice_id,
        title,
        solicitation_number,
        department,
        posted_date,
        response_deadline,
        naics_code,
        type,
        opportunity_type,
        set_aside,
        place_of_performance,
        ui_link,
        organization_name,
        created_at,
        updated_at
      )
      VALUES (
        ${user.id},
        ${normalizedNoticeId},
        ${normalizeText(title)},
        ${normalizeText(solicitationNumber)},
        ${normalizeText(department)},
        ${normalizeDate(postedDate)},
        ${normalizeDate(responseDeadLine)},
        ${normalizeText(naicsCode)},
        ${opportunityType},
        ${opportunityType},
        ${normalizeText(setAside)},
        ${jsonbParam(placeOfPerformance)},
        ${normalizeText(uiLink)},
        ${normalizeText(organizationName)},
        NOW(),
        NOW()
      )
      ON CONFLICT (user_id, notice_id)
      DO UPDATE SET
        title = EXCLUDED.title,
        solicitation_number = EXCLUDED.solicitation_number,
        department = EXCLUDED.department,
        posted_date = EXCLUDED.posted_date,
        response_deadline = EXCLUDED.response_deadline,
        naics_code = EXCLUDED.naics_code,
        type = EXCLUDED.type,
        opportunity_type = EXCLUDED.opportunity_type,
        set_aside = EXCLUDED.set_aside,
        place_of_performance = EXCLUDED.place_of_performance,
        ui_link = EXCLUDED.ui_link,
        organization_name = EXCLUDED.organization_name,
        updated_at = NOW()
      RETURNING *
    `

    return NextResponse.json({ saved: savedRows[0] }, { status: 201 })
  } catch (error) {
    const details = errorDetails(error)
    console.error('POST /api/saved-opportunities error:', details, error)
    return NextResponse.json(
      { error: 'Could not save favorite opportunity', ...details },
      { status: 500 }
    )
  }
}
