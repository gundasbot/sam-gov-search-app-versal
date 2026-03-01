// app/api/alert-subscriptions/[id]/toggle/route.ts
// POST /api/alert-subscriptions/[id]/toggle
// Toggles an alert subscription active/inactive

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { mapAlertRow } from '../../route'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const alert = await prisma.alert_subscriptions.findFirst({
      where: { id, user_id: session.user.id },
    })

    if (!alert) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 })
    }

    // Validate before enabling
    if (!alert.active && !alert.recipients?.trim()) {
      return NextResponse.json(
        { error: 'Cannot activate alert: at least one recipient email is required.' },
        { status: 400 }
      )
    }

    const newActive = !alert.active

    const updated = await prisma.alert_subscriptions.update({
      where: { id },
      data: {
        active: newActive,
        updated_at: new Date(),
      },
    })

    return NextResponse.json({
      alert: mapAlertRow(updated),
      message: newActive ? 'Alert activated.' : 'Alert paused.',
    })
  } catch (error) {
    console.error('[POST toggle]', error)
    return NextResponse.json({ error: 'Failed to toggle alert' }, { status: 500 })
  }
}