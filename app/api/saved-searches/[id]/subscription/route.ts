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
        userId: session.user.id,
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
      data.subscriptionEnabled = body.enabled

      if (body.enabled) {
        // Enabling subscription
        data.frequency = body.frequency || 'DAILY'
        data.emailNotification = body.emailNotification ?? true
        data.sendEmptyResults = body.sendEmptyResults ?? false
        data.maxResults = body.maxResults ?? 100
      } else {
        // Disabling subscription
        data.frequency = null
      }
    }

    // Update individual subscription settings
    if (body.frequency) {
      data.frequency = body.frequency
      data.subscriptionEnabled = true
    }

    if (typeof body.emailNotification === 'boolean') {
      data.emailNotification = body.emailNotification
    }

    if (typeof body.sendEmptyResults === 'boolean') {
      data.sendEmptyResults = body.sendEmptyResults
    }

    if (typeof body.maxResults === 'number') {
      data.maxResults = body.maxResults
    }

    const updated = await prisma.saved_searches_new.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        subscriptionEnabled: true,
        frequency: true,
        emailNotification: true,
        sendEmptyResults: true,
        maxResults: true,
        lastRunAt: true,
        lastResultCount: true,
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
        userId: session.user.id,
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
        subscriptionEnabled: false,
        frequency: null,
      },
      select: {
        id: true,
        name: true,
        subscriptionEnabled: true,
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