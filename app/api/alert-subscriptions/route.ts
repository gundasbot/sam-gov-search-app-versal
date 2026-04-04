// app/api/alert-subscriptions/route.ts
// GET  /api/alert-subscriptions  → list all alerts for session user
// POST /api/alert-subscriptions  → create new alert

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

// ─── Shared helpers ───────────────────────────────────────────────────────────

export function parseRecipientsList(raw: string | null): any[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed
  } catch {}

  return raw
    .split(',')
    .map(part => part.trim())
    .filter(Boolean)
    .map(email => ({ email }))
}

function normalizeCsvArray(value: unknown): string[] {
  if (!value) return []
  if (Array.isArray(value)) {
    return value.map(v => String(v).trim()).filter(Boolean)
  }

  return String(value)
    .split(',')
    .map(v => v.trim())
    .filter(Boolean)
}

export function mapSavedSearchToParams(savedSearch?: any): Record<string, any> {
  if (!savedSearch) return {}

  const ptypes = normalizeCsvArray(savedSearch.procurement_type)
  const states = normalizeCsvArray(savedSearch.state_of_performance)
  const setAsides = normalizeCsvArray(savedSearch.set_aside)

  return {
    keyword: savedSearch.keywords ?? undefined,
    title: savedSearch.keywords ?? undefined,
    ptypes: ptypes.length ? ptypes : undefined,
    ptype: ptypes.length ? ptypes.join(',') : undefined,
    states: states.length ? states : undefined,
    state: states.length ? states.join(',') : undefined,
    setAsides: setAsides.length ? setAsides : undefined,
    typeOfSetAside: setAsides.length ? setAsides.join(',') : undefined,
    setAside: setAsides.length ? setAsides.join(',') : undefined,
    ncode: savedSearch.naics ?? undefined,
    ccode: undefined,
    organizationName: savedSearch.agency ?? undefined,
    deptname: savedSearch.agency ?? undefined,
    postedFrom: savedSearch.posted_after ?? undefined,
    postedTo: savedSearch.posted_before ?? undefined,
    format: savedSearch.export_format ?? undefined,
  }
}

export function buildSavedSearchData(params: Record<string, any>, fallbackName: string, description?: string | null) {
  const ptypes = normalizeCsvArray(params.ptypes ?? params.ptype)
  const states = normalizeCsvArray(params.states ?? params.state)
  const setAsides = normalizeCsvArray(params.setAsides ?? params.typeOfSetAside ?? params.setAside)

  return {
    name: fallbackName,
    description: description ?? null,
    keywords: params.keyword ?? params.keywords ?? params.title ?? null,
    naics: params.ncode ?? params.naics ?? null,
    agency: params.organizationName ?? params.deptname ?? params.agency ?? null,
    set_aside: setAsides.length ? setAsides.join(',') : null,
    state_of_performance: states.length ? states.join(',') : null,
    posted_after: params.postedFrom ?? params.posted_after ?? null,
    posted_before: params.postedTo ?? params.rdlto ?? params.posted_before ?? null,
    procurement_type: ptypes.length ? ptypes.join(',') : null,
  }
}

export function mapAlertRow(row: any) {
  const recipientsList = parseRecipientsList(row.recipients)
  const params = mapSavedSearchToParams(row.saved_searches_v2)
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? null,
    frequency: row.frequency,
    deliveryTime: row.delivery_time ?? '09:00',
    isActive: row.active,
    lastSentAt: row.last_run_at?.toISOString() ?? null,
    lastResultCount: row.last_result_count ?? 0,
    lastError: row.last_error ?? null,
    recipients: row.recipients ?? '',
    recipientsList,
    params: { ...params, format: row.export_format ?? params.format ?? 'CSV' },
    maxResults: row.max_results ?? 100,
    sendEmptyResults: row.send_empty_results,
    emailNotification: row.email_notification,
    createdAt: row.created_at.toISOString(),
  }
}

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rows = await prisma.alert_subscriptions.findMany({
      where: { user_id: session.user.id },
      orderBy: { created_at: 'desc' },
      include: { saved_searches_v2: true },
    })

    return NextResponse.json(rows.map(mapAlertRow))
  } catch (error) {
    console.error('[GET /api/alert-subscriptions]', error)
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 })
  }
}

// ─── POST ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      name,
      description,
      frequency = 'DAILY',
      deliveryTime = '09:00',
      recipients = '',
      recipientsList = [],
      params = {},
      isActive = true,
      maxResults = 100,
      sendEmptyResults = false,
      savedSearchId, // optional: connect to existing
      savedSearch,   // optional: create new
      savedSearchConnectOrCreate, // optional: connectOrCreate
      usersId, // optional: connect to existing user
      users,   // optional: create new user
      usersConnectOrCreate, // optional: connectOrCreate user
    } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Alert name is required' }, { status: 400 })
    }

    const freqMap: Record<string, 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'AS_CHANGES' | 'MANUAL'> = {
      DAILY: 'DAILY', WEEKLY: 'WEEKLY', MONTHLY: 'MONTHLY',
      AS_CHANGES: 'AS_CHANGES', MANUAL: 'MANUAL',
    }
    const freq = freqMap[String(frequency).toUpperCase()] ?? 'DAILY'

    // Extract plain email string from recipientsList for the required recipients column
    const recipientEmails = recipientsList.length > 0
      ? recipientsList
          .flatMap((r: any) => [r.email].filter(Boolean))
          .join(',')
      : (typeof recipients === 'string' ? recipients : '')

    const savedSearchData = buildSavedSearchData(params, name.trim(), description)

    // Build saved_searches_v2 relation object
    let savedSearchesRelation: any = undefined
    if (Object.keys(savedSearchData).some(key => savedSearchData[key as keyof typeof savedSearchData] != null)) {
      savedSearchesRelation = {
        create: {
          id: randomBytes(12).toString('hex'),
          user_id: session.user.id,
          updated_at: new Date(),
          ...savedSearchData,
        },
      }
    } else if (savedSearchConnectOrCreate) {
      savedSearchesRelation = { connectOrCreate: savedSearchConnectOrCreate }
    } else if (savedSearchId) {
      savedSearchesRelation = { connect: { id: savedSearchId } }
    } else if (savedSearch) {
      savedSearchesRelation = { create: savedSearch }
    }

    // Build users relation object
    let usersRelation: any = undefined
    if (usersConnectOrCreate) {
      usersRelation = { connectOrCreate: usersConnectOrCreate }
    } else if (usersId) {
      usersRelation = { connect: { id: usersId } }
    } else if (users) {
      usersRelation = { create: users }
    }

    const row = await prisma.alert_subscriptions.create({
      data: {
        id: randomBytes(12).toString('hex'),
        user_id: session.user.id,
        name: name.trim(),
        description: description ?? null,
        frequency: freq,
        delivery_time: deliveryTime,
        recipients: recipientEmails,
        export_format: String(params.format || 'CSV'),
        active: isActive,
        max_results: maxResults,
        send_empty_results: sendEmptyResults,
        email_notification: true,
        updated_at: new Date(),
        ...(savedSearchesRelation ? { saved_searches_v2: savedSearchesRelation } : {}),
        ...(usersRelation ? { users: usersRelation } : {}),
      },
    })

    return NextResponse.json(mapAlertRow(row), { status: 201 })
  } catch (error) {
    console.error('[POST /api/alert-subscriptions]', error)
    return NextResponse.json({ error: 'Failed to create alert' }, { status: 500 })
  }
}
