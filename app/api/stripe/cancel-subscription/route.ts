// app/api/stripe/change-subscription/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover',
})

type Tier = 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE'
type Interval = 'monthly' | 'annual'

function getPriceId(tier: Tier, interval: Interval): string | null {
  const priceMap: Record<string, string | undefined> = {
    'BASIC-monthly': process.env.STRIPE_PRICE_BASIC_MONTHLY,
    'BASIC-annual': process.env.STRIPE_PRICE_BASIC_ANNUAL,
    'PROFESSIONAL-monthly': process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY,
    'PROFESSIONAL-annual': process.env.STRIPE_PRICE_PROFESSIONAL_ANNUAL,
    'ENTERPRISE-monthly': process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY,
    'ENTERPRISE-annual': process.env.STRIPE_PRICE_ENTERPRISE_ANNUAL,
  }

  return priceMap[`${tier}-${interval}`] || null
}

// Stripe SDK in some versions returns Response<T> wrappers.
// Unwrap `.data` when present.
function unwrapStripe<T>(obj: T | Stripe.Response<T>): T {
  return (obj as any)?.data ? (obj as any).data : (obj as any)
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const email = session?.user?.email

    if (!email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const tier = body?.tier as Tier | undefined
    const interval = body?.interval as Interval | undefined

    if (!tier || !interval) {
      return NextResponse.json({ error: 'Missing tier or interval' }, { status: 400 })
    }

    const newPriceId = getPriceId(tier, interval)
    if (!newPriceId) {
      return NextResponse.json({ error: 'Invalid plan configuration' }, { status: 400 })
    }

    const user = await prisma.users.findUnique({
      where: { email },
      select: { stripe_subscription_id: true },
    })

    if (!user?.stripe_subscription_id) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 })
    }

    // Retrieve current subscription (unwrap if needed)
    const subscriptionResp = await stripe.subscriptions.retrieve(user.stripe_subscription_id)
    const subscription = unwrapStripe(subscriptionResp)

    if (!subscription || subscription.status === 'canceled') {
      return NextResponse.json({ error: 'Subscription not found or canceled' }, { status: 404 })
    }

    const firstItemId = subscription.items?.data?.[0]?.id
    if (!firstItemId) {
      return NextResponse.json({ error: 'Subscription item not found' }, { status: 500 })
    }

    // Update subscription (unwrap if needed)
    const updatedResp = await stripe.subscriptions.update(subscription.id, {
      items: [{ id: firstItemId, price: newPriceId }],
      proration_behavior: 'create_prorations',
      billing_cycle_anchor: 'unchanged',
    })

    const updatedSub = unwrapStripe(updatedResp)

    // Stripe typings in your version may not declare snake_case fields.
    const updated = updatedSub as Stripe.Subscription & {
      currentPeriodEnd?: number | null
    }

    return NextResponse.json({
      success: true,
      subscription: {
        id: updated.id,
        status: updated.status,
        current_period_end: updated.currentPeriodEnd ?? null,
      },
    })
  } catch (error: any) {
    console.error('Change subscription error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to change subscription' },
      { status: 500 }
    )
  }
}
