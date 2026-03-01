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
  try { return JSON.parse(raw) } catch { return [] }
}

export function parseParams(raw: string | null): Record<string, any> {
  if (!raw) return {}
  try { return JSON.parse(raw) } catch { return {} }
}

export function mapAlertRow(row: any) {
  const recipientsList = parseRecipientsList(row.recipients_list)
  const params = parseParams(row.params)
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
    params,
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

    // Build saved_searches_v2 relation object
    let savedSearchesRelation: any = undefined
    if (savedSearchConnectOrCreate) {
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
        recipients_list: JSON.stringify(recipientsList),
        params: JSON.stringify(params),
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