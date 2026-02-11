// app/api/stripe/sync/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import Stripe from 'stripe'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover',
})

type PlanTier = 'NONE' | 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE'
type BillingInterval = 'MONTHLY' | 'YEARLY'

function tierFromPrice(priceId?: string | null): PlanTier {
  if (!priceId) return 'NONE'

  if (
    priceId === process.env.STRIPE_PRICE_BASIC_MONTHLY ||
    priceId === process.env.STRIPE_PRICE_BASIC_ANNUAL
  ) {
    return 'BASIC'
  }

  if (
    priceId === process.env.STRIPE_PRICE_PRO_MONTHLY ||
    priceId === process.env.STRIPE_PRICE_PRO_ANNUAL
  ) {
    return 'PROFESSIONAL'
  }

  if (
    priceId === process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY ||
    priceId === process.env.STRIPE_PRICE_ENTERPRISE_ANNUAL
  ) {
    return 'ENTERPRISE'
  }

  return 'NONE'
}

export async function POST(_req: NextRequest) {
  try {
    /* ═══════════════════════ AUTH ═══════════════════════ */
    const session = await getServerSession(authOptions)
    const email = session?.user?.email
    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.users.findUnique({
      where: { email },
    })

    if (!user || !user.stripe_customer_id) {
      return NextResponse.json({
        ok: true,
        synced: false,
        reason: 'No Stripe customer',
      })
    }

    /* ═══════════════════════ FETCH STRIPE ═══════════════════════ */
    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripe_customer_id,
      status: 'all',
      limit: 5,
    })

    const subscription =
      subscriptions.data.find((s) => s.status === 'active') ||
      subscriptions.data.find((s) => s.status === 'trialing') ||
      subscriptions.data[0]

    if (!subscription) {
      // User has no subscription at all
      await prisma.users.update({
        where: { id: user.id },
        data: {
          plan_tier: 'NONE',
          billing_interval: null,
          stripe_subscription_id: null,
          subscription_status: 'inactive',
          cancel_at_period_end: false,
          current_period_end: null,
        },
      })

      return NextResponse.json({
        ok: true,
        synced: true,
        plan: {
          tier: 'NONE',
          hasSubscription: false,
        },
      })
    }

    /* ═══════════════════════ DERIVE PLAN ═══════════════════════ */
    const item = subscription.items.data[0]
    const price = item?.price

    const tier: PlanTier =
      (subscription.metadata?.tier as PlanTier) ||
      tierFromPrice(price?.id)

    const billingInterval: BillingInterval | null =
      subscription.metadata?.interval === 'annual'
        ? 'YEARLY'
        : subscription.metadata?.interval === 'monthly'
          ? 'MONTHLY'
          : price?.recurring?.interval === 'year'
            ? 'YEARLY'
            : price?.recurring?.interval === 'month'
              ? 'MONTHLY'
              : null

    const currentPeriodEnd =
      typeof (subscription as any).current_period_end === 'number'
        ? new Date((subscription as any).current_period_end * 1000)
        : null

    /* ═══════════════════════ UPDATE DB ═══════════════════════ */
    await prisma.users.update({
      where: { id: user.id },
      data: {
        plan_tier: tier,
        billing_interval: billingInterval, // ✅ FIXED: Use correct variable name
        stripe_subscription_id: subscription.id,
        subscription_status: subscription.status,
        cancel_at_period_end: subscription.cancel_at_period_end ?? false,
        current_period_end: currentPeriodEnd, // ✅ FIXED: Use correct variable name
      },
    })

    /* ═══════════════════════ RESPONSE ═══════════════════════ */
    return NextResponse.json({
      ok: true,
      synced: true,
      plan: {
        tier,
        billingInterval,
        status: subscription.status,
        stripe_subscription_id: subscription.id,
        cancel_at_period_end: subscription.cancel_at_period_end ?? false,
        current_period_end: currentPeriodEnd?.toISOString() ?? null,
        hasSubscription:
          subscription.status === 'active' ||
          subscription.status === 'trialing',
      },
    })
  } catch (err: any) {
    console.error('❌ Stripe sync failed:', err)
    return NextResponse.json(
      { error: 'Failed to sync subscription' },
      { status: 500 }
    )
  }
}
