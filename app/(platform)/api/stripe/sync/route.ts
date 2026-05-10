// app/api/stripe/sync/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import Stripe from 'stripe'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
})

type PlanTier = 'NONE' | 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE'
type BillingInterval = 'MONTHLY' | 'YEARLY'

function mapStripeStatus(status: string | null | undefined): string {
  const value = String(status || '').toLowerCase()
  const statusMap: Record<string, string> = {
    active: 'ACTIVE',
    trialing: 'TRIALING',
    past_due: 'PAST_DUE',
    canceled: 'CANCELED',
    unpaid: 'UNPAID',
    incomplete: 'INACTIVE',
    incomplete_expired: 'INACTIVE',
    paused: 'PAUSED',
  }
  return statusMap[value] || 'INACTIVE'
}

function unixToDate(value: number | null | undefined): Date | null {
  if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) return null
  return new Date(value * 1000)
}

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
    priceId === process.env.STRIPE_PRICE_PRO_ANNUAL ||
    priceId === process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY ||
    priceId === process.env.STRIPE_PRICE_PROFESSIONAL_ANNUAL
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
          plan_status: 'INACTIVE',
          billing_interval: null,
          stripe_subscription_id: null,
          stripe_price_id: null,
          subscription_status: 'inactive',
          cancel_at_period_end: false,
          current_period_end: null,
          stripe_current_period_end: null,
          trial_active: false,
          trial_started_at: null,
          trial_expires_at: null,
          trial_ends_at: null,
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
      unixToDate((subscription as any).current_period_end)
    const trialEndsAt = unixToDate((subscription as any).trial_end)
    const trialStartsAt = unixToDate((subscription as any).trial_start)
    const trialActive =
      subscription.status === 'trialing' &&
      (!trialEndsAt || trialEndsAt > new Date())
    const planStatus = mapStripeStatus(subscription.status)

    /* ═══════════════════════ UPDATE DB ═══════════════════════ */
    await prisma.users.update({
      where: { id: user.id },
      data: {
        plan_tier: tier,
        plan_status: planStatus,
        billing_interval: billingInterval, // ✅ FIXED: Use correct variable name
        stripe_subscription_id: subscription.id,
        stripe_price_id: price?.id || null,
        subscription_status: subscription.status,
        cancel_at_period_end: subscription.cancel_at_period_end ?? false,
        current_period_end: currentPeriodEnd, // ✅ FIXED: Use correct variable name
        stripe_current_period_end: currentPeriodEnd,
        trial_active: trialActive,
        trial_started_at: trialStartsAt,
        trial_expires_at: trialEndsAt,
        trial_ends_at: trialEndsAt,
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
        plan_status: planStatus,
        stripe_subscription_id: subscription.id,
        cancel_at_period_end: subscription.cancel_at_period_end ?? false,
        current_period_end: currentPeriodEnd?.toISOString() ?? null,
        trial_active: trialActive,
        trial_expires_at: trialEndsAt?.toISOString() ?? null,
        trial_ends_at: trialEndsAt?.toISOString() ?? null,
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
