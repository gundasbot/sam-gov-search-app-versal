// app/api/alert-subscriptions/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/alert-subscriptions/[id] - Get single alert subscription
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const subscription = await prisma.saved_searches_new.findFirst({
      where: {
        id,
        user_id: session.user.id,
        subscription_enabled: true,
      },
      include: {
        _count: {
          select: {
            search_runs: true,
            search_exports: true,
          },
        },
        search_runs: {
          orderBy: { created_at: 'desc' },
          take: 5,
        },
      },
    })

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }

    // Format response
    const formatted = {
      id: subscription.id,
      name: subscription.name,
      description: subscription.description,
      frequency: subscription.frequency,
      active: subscription.subscription_enabled,
      recipients: subscription.recipients,
      email_notification: subscription.email_notification,
      send_empty_results: subscription.send_empty_results,
      max_results: subscription.max_results,
      delivery_time: subscription.delivery_time,
      export_format: subscription.export_format,
      file_format: subscription.export_format,
      include_links: subscription.include_links,
      lastRunAt: subscription.last_run_at,
      last_result_count: subscription.last_result_count,
      created_at: subscription.created_at,
      updated_at: subscription.updated_at,
      savedSearch: {
        id: subscription.id,
        name: subscription.name,
        keywords: subscription.keywords,
        naics: subscription.naics,
        agency: subscription.agency,
        setAside: subscription.set_aside,
        stateOfPerformance: subscription.state_of_performance,
        procurementType: subscription.procurement_type,
        postedAfter: subscription.posted_after,
        postedBefore: subscription.posted_before,
      },
      _count: subscription._count,
      runs: subscription.search_runs,
    }

    return NextResponse.json({ subscription: formatted })
  } catch (error) {
    console.error('Error fetching subscription:', error)
    return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 })
  }
}

// PUT /api/alert-subscriptions/[id] - Update alert subscription
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    // Verify ownership
    const existing = await prisma.saved_searches_new.findFirst({
      where: { id, user_id: session.user.id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }

    // Validate email recipients if provided
    if (body.recipients !== undefined) {
      const emails = Array.isArray(body.recipients)
        ? body.recipients
        : typeof body.recipients === 'string'
          ? body.recipients
              .split(',')
              .map((s: string) => s.trim())
              .filter(Boolean)
          : []

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      const invalidEmails = emails.filter((e: string) => e && !emailRegex.test(e))
      if (invalidEmails.length > 0) {
        return NextResponse.json(
          { error: `Invalid email address: ${invalidEmails[0]}` },
          { status: 400 }
        )
      }
    }

    // Build update data
    const updateData: any = {}

    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.frequency !== undefined) updateData.frequency = body.frequency
    if (body.recipients !== undefined) updateData.recipients = body.recipients
    if (body.email_notification !== undefined) updateData.email_notification = body.email_notification
    if (body.send_empty_results !== undefined) updateData.send_empty_results = body.send_empty_results
    if (body.max_results !== undefined) updateData.max_results = body.max_results
    if (body.delivery_time !== undefined) updateData.delivery_time = body.delivery_time
    if (body.export_format !== undefined) updateData.export_format = body.export_format
    if (body.file_format !== undefined) updateData.export_format = body.file_format // Support both names
    if (body.include_links !== undefined) updateData.include_links = body.include_links

    const updated = await prisma.saved_searches_new.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            search_runs: true,
            search_exports: true,
          },
        },
      },
    })

    // Format response
    const formatted = {
      id: updated.id,
      name: updated.name,
      description: updated.description,
      frequency: updated.frequency,
      active: updated.subscription_enabled,
      recipients: updated.recipients,
      email_notification: updated.email_notification,
      send_empty_results: updated.send_empty_results,
      max_results: updated.max_results,
      delivery_time: updated.delivery_time,
      export_format: updated.export_format,
      file_format: updated.export_format,
      include_links: updated.include_links,
      lastRunAt: updated.last_run_at,
      last_result_count: updated.last_result_count,
      created_at: updated.created_at,
      updated_at: updated.updated_at,
      savedSearch: {
        id: updated.id,
        name: updated.name,
        keywords: updated.keywords,
        naics: updated.naics,
        agency: updated.agency,
        setAside: updated.set_aside,
        stateOfPerformance: updated.state_of_performance,
        procurementType: updated.procurement_type,
        postedAfter: updated.posted_after,
        postedBefore: updated.posted_before,
      },
      _count: updated._count,
    }

    return NextResponse.json({ subscription: formatted })
  } catch (error) {
    console.error('Error updating subscription:', error)
    return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 })
  }
}

// DELETE /api/alert-subscriptions/[id] - Delete alert subscription
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

    // Verify ownership
    const existing = await prisma.saved_searches_new.findFirst({
      where: { id, user_id: session.user.id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }

    // Delete the subscription
    await prisma.saved_searches_new.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting subscription:', error)
    return NextResponse.json({ error: 'Failed to delete subscription' }, { status: 500 })
  }
}
