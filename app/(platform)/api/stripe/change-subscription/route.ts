// app/api/stripe/change-subscription/route.ts - SECURE VERSION
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
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

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const email = session?.user?.email

    if (!email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const requestedTier = body?.tier as Tier | undefined
    const requestedInterval = body?.interval as Interval | undefined

    if (!requestedTier || !requestedInterval) {
      return NextResponse.json({ error: 'Missing tier or interval' }, { status: 400 })
    }

    // Get user's current subscription
    const user = await prisma.users.findUnique({
      where: { email },
      select: { 
        stripe_subscription_id: true,
        plan_tier: true,
      },
    })

    if (!user?.stripe_subscription_id) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 })
    }

    // Get current subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(user.stripe_subscription_id)
    
    // Get current price
    const currentPriceId = subscription.items.data[0]?.price?.id
    if (!currentPriceId) {
      return NextResponse.json({ error: 'Could not determine current plan' }, { status: 500 })
    }

    // Get current price details
    const currentPrice = await stripe.prices.retrieve(currentPriceId)
    
    // Plan changes (tier and/or interval) are allowed here for existing subscriptions.

    // Get new price ID
    const newPriceId = getPriceId(requestedTier, requestedInterval)
    if (!newPriceId) {
      return NextResponse.json({ error: 'Invalid plan configuration' }, { status: 400 })
    }

    // Don't allow changing to same price
    if (currentPriceId === newPriceId) {
      return NextResponse.json({ 
        error: 'You are already on this billing interval' 
      }, { status: 400 })
    }

    const firstItemId = subscription.items.data[0]?.id
    if (!firstItemId) {
      return NextResponse.json({ error: 'Subscription item not found' }, { status: 500 })
    }

    // Get current and new price details to check interval
    const newPrice = await stripe.prices.retrieve(newPriceId)
    const currentInterval = currentPrice.recurring?.interval
    const newInterval = newPrice.recurring?.interval
    
    // Check if interval is changing (monthly ↔ annual)
    const isIntervalChange = currentInterval !== newInterval
    
    // Prepare update parameters
    const updateParams: Stripe.SubscriptionUpdateParams = {
      items: [{ id: firstItemId, price: newPriceId }],
      proration_behavior: 'create_prorations',
    }

    // Only set billing_cycle_anchor if NOT changing interval
    if (!isIntervalChange) {
      updateParams.billing_cycle_anchor = 'unchanged'
    }

    // Update subscription (interval change only)
    const updatedSubscription = await stripe.subscriptions.update(subscription.id, updateParams)

    // Update user in database
    await prisma.users.update({
      where: { email },
      data: {
        billing_interval: requestedInterval.toUpperCase(),
      },
    })

    // Extract currentPeriodEnd safely
    const periodEnd = (updatedSubscription as any).currentPeriodEnd
    const current_period_end = typeof periodEnd === 'number' 
      ? new Date(periodEnd * 1000).toISOString()
      : new Date().toISOString()

    return NextResponse.json({
      success: true,
      message: `Billing changed to ${requestedInterval}. Changes will take effect immediately.`,
      subscription: {
        id: updatedSubscription.id,
        status: updatedSubscription.status,
        current_period_end, // ✅ FIXED: Use the correct variable name
      },
    })
  } catch (error: any) {
    console.error('Change subscription error:', error)
    
    let errorMessage = 'Failed to change subscription'
    if (error?.type === 'StripeInvalidRequestError') {
      errorMessage = error.message || 'Invalid subscription change request'
    } else if (error?.message) {
      errorMessage = error.message
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
