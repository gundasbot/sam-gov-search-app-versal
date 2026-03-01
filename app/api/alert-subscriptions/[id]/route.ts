// app/api/alert-subscriptions/[id]/route.ts
// PATCH  /api/alert-subscriptions/[id]  → update alert
// DELETE /api/alert-subscriptions/[id]  → delete alert

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { mapAlertRow } from '../route'

const freqMap: Record<string, 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'AS_CHANGES' | 'MANUAL'> = {
  DAILY: 'DAILY', WEEKLY: 'WEEKLY', MONTHLY: 'MONTHLY',
  AS_CHANGES: 'AS_CHANGES', MANUAL: 'MANUAL',
}

// ─── PATCH ────────────────────────────────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const existing = await prisma.alert_subscriptions.findFirst({
      where: { id, user_id: session.user.id },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const body = await req.json()
    const {
      name, description, frequency, deliveryTime,
      recipients, recipientsList, params: alertParams,
      isActive, maxResults, sendEmptyResults,
    } = body

    // Rebuild recipients string from list if provided
    let recipientEmails: string | undefined
    if (recipientsList !== undefined) {
      recipientEmails = Array.isArray(recipientsList)
        ? recipientsList.flatMap((r: any) => [r.email].filter(Boolean)).join(',')
        : (typeof recipients === 'string' ? recipients : undefined)
    } else if (recipients !== undefined) {
      recipientEmails = typeof recipients === 'string' ? recipients : undefined
    }

    const updated = await prisma.alert_subscriptions.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description }),
        ...(frequency !== undefined && { frequency: freqMap[String(frequency).toUpperCase()] ?? 'DAILY' }),
        ...(deliveryTime !== undefined && { delivery_time: deliveryTime }),
        ...(recipientEmails !== undefined && { recipients: recipientEmails }),
        ...(recipientsList !== undefined && { recipients_list: JSON.stringify(recipientsList) }),
        ...(alertParams !== undefined && { params: JSON.stringify(alertParams) }),
        ...(isActive !== undefined && { active: isActive }),
        ...(maxResults !== undefined && { max_results: maxResults }),
        ...(sendEmptyResults !== undefined && { send_empty_results: sendEmptyResults }),
        updated_at: new Date(),
      },
    })

    return NextResponse.json(mapAlertRow(updated))
  } catch (error) {
    console.error('[PATCH /api/alert-subscriptions/[id]]', error)
    return NextResponse.json({ error: 'Failed to update alert' }, { status: 500 })
  }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const existing = await prisma.alert_subscriptions.findFirst({
      where: { id, user_id: session.user.id },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await prisma.alert_subscriptions.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/alert-subscriptions/[id]]', error)
    return NextResponse.json({ error: 'Failed to delete alert' }, { status: 500 })
  }
}
