// app/api/saved-searches/[id]/toggle/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// PATCH /api/saved-searches/[id]/subscription
// Update subscription settings
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify ownership
    const search = await prisma.saved_searches_new.findFirst({
      where: {
        id,
        user_id: session.user.id,
      },
      select: { id: true },
    })

    if (!search) {
      return NextResponse.json(
        { error: 'Saved search not found' },
        { status: 404 }
      )
    }

    const body = await req.json()
    const data: Record<string, any> = {}

    // Handle enabling/disabling subscription
    if (typeof body.enabled === 'boolean') {
      data.subscription_enabled = body.enabled

      if (body.enabled) {
        // Enabling subscription
        data.frequency = body.frequency || 'DAILY'
        data.email_notification = body.email_notification ?? true
        data.send_empty_results = body.send_empty_results ?? false
        data.max_results = body.max_results ?? 100
      } else {
        // Disabling subscription
        data.frequency = null
      }
    }

    // Update individual subscription settings
    if (body.frequency) {
      data.frequency = body.frequency
      data.subscription_enabled = true
    }

    if (typeof body.email_notification === 'boolean') {
      data.email_notification = body.email_notification
    }

    if (typeof body.send_empty_results === 'boolean') {
      data.send_empty_results = body.send_empty_results
    }

    if (typeof body.max_results === 'number') {
      data.max_results = body.max_results
    }

    const updated = await prisma.saved_searches_new.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        subscription_enabled: true,
        frequency: true,
        email_notification: true,
        send_empty_results: true,
        max_results: true,
        lastRunAt: true,
        last_result_count: true,
      },
    })

    return NextResponse.json({ search: updated })
  } catch (error) {
    console.error('Error updating subscription:', error)
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    )
  }
}

// DELETE /api/saved-searches/[id]/subscription
// Disable subscription
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify ownership
    const search = await prisma.saved_searches_new.findFirst({
      where: {
        id,
        user_id: session.user.id,
      },
      select: { id: true },
    })

    if (!search) {
      return NextResponse.json(
        { error: 'Saved search not found' },
        { status: 404 }
      )
    }

    const updated = await prisma.saved_searches_new.update({
      where: { id },
      data: {
        subscription_enabled: false,
        frequency: null,
      },
      select: {
        id: true,
        name: true,
        subscription_enabled: true,
        frequency: true,
      },
    })

    return NextResponse.json({ search: updated })
  } catch (error) {
    console.error('Error disabling subscription:', error)
    return NextResponse.json(
      { error: 'Failed to disable subscription' },
      { status: 500 }
    )
  }
}