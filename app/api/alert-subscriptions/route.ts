// app/api/alert-subscriptions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// GET /api/alert-subscriptions - List all user's alert subscriptions
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get subscriptions with related data
    const subscriptions = await prisma.alert_subscriptions.findMany({
      where: { user_id: session.user.id },
      include: {
        saved_searches_v2: {
          select: {
            id: true,
            name: true,
            keywords: true,
            naics: true,
            agency: true,
            set_aside_code: true,
            state_of_performance: true,
            opportunity_type: true,
            posted_from: true,
            posted_to: true,
          },
        },
        _count: {
          select: {
            subscription_runs: true,
          },
        },
        subscription_runs: {
          orderBy: { created_at: 'desc' },
          take: 1,
          select: {
            id: true,
            status: true,
            result_count: true,
            ran_at: true,
            error_message: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    })

    // Format response
    const formatted = subscriptions.map((sub) => ({
      id: sub.id,
      name: sub.name,
      description: sub.description,
      frequency: sub.frequency,
      active: sub.active,
      recipients: sub.recipients,
      email_notification: sub.email_notification,
      send_empty_results: sub.send_empty_results,
      max_results: sub.max_results,
      delivery_time: sub.delivery_time,
      export_format: sub.export_format,
      include_links: sub.include_links,
      include_attachments: sub.include_attachments,
      include_results_in_body: sub.include_results_in_body,
      last_run_at: sub.last_run_at,
      last_result_count: sub.last_result_count,
      last_error: sub.last_error,
      created_at: sub.created_at,
      updated_at: sub.updated_at,
      
      // Related data
      savedSearch: sub.saved_searches_v2,
      runCount: sub._count.subscription_runs,
      lastRun: sub.subscription_runs[0] || null,
    }))

    return NextResponse.json({
      subscriptions: formatted,
      total: formatted.length,
    })
  } catch (error) {
    console.error('Error fetching alert subscriptions:', error)
    return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 })
  }
}

// POST /api/alert-subscriptions - Create new alert subscription
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    // ========== VALIDATION ==========

    // 1. Validate name
    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Alert name is required' }, { status: 400 })
    }

    const name = body.name.trim()

    // 2. Validate recipients (required)
    if (!body.recipients || body.recipients.length === 0) {
      return NextResponse.json({ error: 'At least one recipient is required' }, { status: 400 })
    }

    // Handle recipients as array or comma-separated string
    const recipientArray = Array.isArray(body.recipients)
      ? body.recipients.map((r: string) => r.toLowerCase().trim())
      : body.recipients
          .split(',')
          .map((r: string) => r.trim().toLowerCase())
          .filter((r: string) => r)

    // Validate email formats
    const invalidEmails = recipientArray.filter((email: string) => !EMAIL_REGEX.test(email))
    if (invalidEmails.length > 0) {
      return NextResponse.json(
        { error: `Invalid email address: ${invalidEmails[0]}` },
        { status: 400 }
      )
    }

    const recipientsString = recipientArray.join(',')

    // 3. Validate frequency (required)
    const validFrequencies = ['DAILY', 'WEEKLY', 'MONTHLY', 'AS_CHANGES', 'MANUAL']
    const frequency = body.frequency?.toUpperCase() || 'DAILY'

    if (!validFrequencies.includes(frequency)) {
      return NextResponse.json(
        { error: `Invalid frequency. Must be one of: ${validFrequencies.join(', ')}` },
        { status: 400 }
      )
    }

    // 4. Validate saved_search_id (required OR create inline search)
    let savedSearchId: string

    if (body.saved_search_id) {
      // Option A: User provided existing search
      const existingSearch = await prisma.saved_searches_v2.findFirst({
        where: {
          id: body.saved_search_id,
          user_id: session.user.id,
        },
      })

      if (!existingSearch) {
        return NextResponse.json({ error: 'Saved search not found' }, { status: 404 })
      }

      savedSearchId = body.saved_search_id
    } else if (body.criteria) {
      // Option B: Create inline search with criteria
      if (!body.criteria.keywords?.trim()) {
        return NextResponse.json(
          { error: 'Either saved_search_id or criteria.keywords is required' },
          { status: 400 }
        )
      }

      // Create new saved search from criteria
      const newSearch = await prisma.saved_searches_v2.create({
        data: {
          id: randomBytes(12).toString('hex'),
          user_id: session.user.id,
          name: `${name} - Search`,
          keywords: body.criteria.keywords?.trim() || null,
          naics: body.criteria.naics?.trim() || null,
          agency: body.criteria.agency?.trim() || null,
          set_aside_code: body.criteria.set_aside?.trim() || null,
          state_of_performance: body.criteria.state?.trim() || null,
          opportunity_type: body.criteria.opportunity_type?.trim() || null,
          posted_from: body.criteria.posted_from ? new Date(body.criteria.posted_from) : null,
          posted_to: body.criteria.posted_to ? new Date(body.criteria.posted_to) : null,
          created_at: new Date(),
          updated_at: new Date(),
        },
      })

      savedSearchId = newSearch.id
    } else {
      return NextResponse.json(
        { error: 'Either saved_search_id or criteria is required' },
        { status: 400 }
      )
    }

    // ========== CREATE SUBSCRIPTION ==========

    const subscription = await prisma.alert_subscriptions.create({
      data: {
        id: randomBytes(12).toString('hex'),
        created_at: new Date(),
        updated_at: new Date(),
        user_id: session.user.id,
        saved_search_id: savedSearchId,
        name,
        description: body.description?.trim() || null,
        recipients: recipientsString,
        email_notification: body.email_notification ?? true,
        send_empty_results: body.send_empty_results ?? false,
        frequency: frequency as any,
        delivery_time: body.delivery_time?.trim() || null,
        export_format: body.export_format?.toLowerCase() || 'csv',
        include_links: body.include_links ?? false,
        include_attachments: body.include_attachments ?? true,
        include_results_in_body: body.include_results_in_body ?? true,
        max_results: Math.max(1, Math.min(body.max_results || 100, 1000)), // 1-1000
        active: true,
        last_run_at: null,
        last_result_count: null,
        last_error: null,
      },
      include: {
        saved_searches_v2: {
          select: {
            id: true,
            name: true,
            keywords: true,
            naics: true,
            agency: true,
          },
        },
      },
    })

    // ========== INCREMENT CONTACT USAGE ==========
    // Mark contacts as used (update use_count and last_used_at)
    for (const email of recipientArray) {
      await prisma.recipient_contacts.updateMany({
        where: {
          user_id: session.user.id,
          email,
        },
        data: {
          use_count: { increment: 1 },
          last_used_at: new Date(),
        },
      })
    }

    // ========== RESPONSE ==========

    return NextResponse.json(
      {
        subscription: {
          id: subscription.id,
          name: subscription.name,
          description: subscription.description,
          frequency: subscription.frequency,
          active: subscription.active,
          recipients: subscription.recipients,
          email_notification: subscription.email_notification,
          send_empty_results: subscription.send_empty_results,
          max_results: subscription.max_results,
          delivery_time: subscription.delivery_time,
          export_format: subscription.export_format,
          include_links: subscription.include_links,
          include_attachments: subscription.include_attachments,
          include_results_in_body: subscription.include_results_in_body,
          created_at: subscription.created_at,
          updated_at: subscription.updated_at,
          savedSearch: subscription.saved_searches_v2,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating alert subscription:', error)
    return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 })
  }
}
