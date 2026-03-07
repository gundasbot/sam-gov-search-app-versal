// app/api/stripe/subscription/cancel/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-02-25.clover',
})

// Cancel at period end (soft cancel — user keeps access until billing cycle ends)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const { subscriptionId } = body

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      )
    }

    // Security: verify this subscription actually belongs to the session user
    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
      select: { id: true, stripe_subscription_id: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.stripe_subscription_id !== subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription does not belong to this account' },
        { status: 403 }
      )
    }

    console.log(`🔄 Canceling subscription at period end: ${subscriptionId}`)

    const canceled = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    })

    // ✅ FIXED: Stripe returns snake_case current_period_end, not camelCase
    const subAny = canceled as any
    const periodEndRaw = subAny.current_period_end ?? subAny.currentPeriodEnd ?? null
    const current_period_end =
      typeof periodEndRaw === 'number'
        ? new Date(periodEndRaw * 1000).toISOString()
        : null

    // Sync cancellation flag to DB so the UI updates immediately
    await prisma.users.update({
      where: { id: user.id },
      data: {
        cancel_at_period_end: true,
        ...(current_period_end && { current_period_end: new Date(current_period_end) }),
      },
    }).catch((err) => {
      console.error('Failed to sync cancel_at_period_end to DB:', err)
    })

    console.log(`✅ Subscription ${subscriptionId} set to cancel at period end`)

    return NextResponse.json({
      success: true,
      subscription: {
        id: canceled.id,
        status: canceled.status,
        cancel_at_period_end: canceled.cancel_at_period_end,
        current_period_end,
      },
    })
  } catch (error: any) {
    console.error('❌ Error canceling subscription:', error)
    return NextResponse.json(
      {
        error: error?.message || 'Failed to cancel subscription',
        details: error?.type || 'unknown_error',
      },
      { status: 500 }
    )
  }
}

// Immediate / hard cancel (removes access right away)
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const { subscriptionId } = body

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      )
    }

    // Security: verify ownership
    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
      select: { id: true, stripe_subscription_id: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.stripe_subscription_id !== subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription does not belong to this account' },
        { status: 403 }
      )
    }

    console.log(`🔄 Immediately canceling subscription: ${subscriptionId}`)

    const canceled = await stripe.subscriptions.cancel(subscriptionId)

    // Sync to DB immediately
    await prisma.users.update({
      where: { id: user.id },
      data: {
        plan_tier: 'NONE',
        plan_status: 'CANCELED',
        stripe_subscription_id: null,
        trial_active: false,
        cancel_at_period_end: false,
        current_period_end: null,
      },
    }).catch((err) => {
      console.error('Failed to sync canceled status to DB:', err)
    })

    console.log(`✅ Subscription ${subscriptionId} canceled immediately`)

    return NextResponse.json({
      success: true,
      subscription: {
        id: canceled.id,
        status: canceled.status,
        canceled_at: canceled.canceled_at,
      },
    })
  } catch (error: any) {
    console.error('❌ Error canceling subscription:', error)
    return NextResponse.json(
      {
        error: error?.message || 'Failed to cancel subscription',
        details: error?.type || 'unknown_error',
      },
      { status: 500 }
    )
  }
}
