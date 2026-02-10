// app/api/stripe/create-checkout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
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

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
}

function isActiveLike(status: Stripe.Subscription.Status) {
  return (
    status === 'active' ||
    status === 'trialing' ||
    status === 'past_due' ||
    status === 'unpaid' ||
    status === 'incomplete'
  )
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
    const successUrl = (body?.successUrl as string | undefined) || `${appUrl()}/pricing?success=true`
    const cancelUrl = (body?.cancelUrl as string | undefined) || `${appUrl()}/pricing`

    if (!tier || !interval) {
      return NextResponse.json({ error: 'Missing tier or interval' }, { status: 400 })
    }

    const priceId = getPriceId(tier, interval)
    if (!priceId) {
      return NextResponse.json({ error: 'Invalid plan configuration' }, { status: 400 })
    }

    // ---- Load user + ensure Stripe customer ----
    const user = await prisma.users.findUnique({
      where: { email },
      select: { stripe_customer_id: true, id: true },
    })

    if (!user?.id) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let customerId = user.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        metadata: { userId: user.id },
      })
      customerId = customer.id

      await prisma.users.update({
        where: { email },
        data: { stripe_customer_id: customerId },
      })
    }

    // =========================================================
    // CRITICAL FIX:
    // If the customer already has an active/trialing subscription,
    // do NOT create another Checkout subscription (that creates duplicates).
    // Send them to Billing Portal to manage/upgrade/downgrade.
    // =========================================================
    const subs = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 20,
    })

    const activeLike = (subs.data || []).filter((s) => isActiveLike(s.status))

    if (activeLike.length > 0) {
      // They already have a subscription -> manage via Billing Portal
      console.warn(
        `âš ï¸ Customer already has ${activeLike.length} active-like subscription(s). Redirecting to Billing Portal instead of creating new Checkout.`,
        activeLike.map((s) => ({ id: s.id, status: s.status, created: s.created }))
      )

      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: successUrl,
      })

      return NextResponse.json({
        url: portalSession.url,
        mode: 'portal',
        reason: 'existing_subscription',
      })
    }

    // ---- No existing subscription: create Checkout session ----
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      client_reference_id: user.id,
      metadata: {
        userId: user.id,
        tier,
        interval,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          tier,
          interval,
        },
      },
    })

    if (!checkoutSession.url) {
      throw new Error('Failed to create checkout session URL')
    }

    return NextResponse.json({ url: checkoutSession.url, mode: 'checkout' })
  } catch (error: any) {
    console.error('Create checkout error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
