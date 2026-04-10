import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { sendAdminCreatedUserActivationEmail } from '@/lib/email'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-02-25.clover',
})

type Tier = 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE'

function unixToDate(value: number | null | undefined): Date | null {
  if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) return null
  return new Date(value * 1000)
}

function getTierFromPriceId(priceId: string): Tier {
  if (
    priceId === process.env.STRIPE_PRICE_BASIC_MONTHLY ||
    priceId === process.env.STRIPE_PRICE_BASIC_ANNUAL ||
    priceId === 'price_1SrX4iPBeHrQUcEBcCNR77ti' ||
    priceId === 'price_1SrX5JPBeHrQUcEBp36HLtHq'
  ) return 'BASIC'

  if (
    priceId === process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY ||
    priceId === process.env.STRIPE_PRICE_PROFESSIONAL_ANNUAL ||
    priceId === 'price_1SpKkkPBeHrQUcEBikiRqBhP' ||
    priceId === 'price_1SpKu0PBeHrQUcEBLqvi496k'
  ) return 'PROFESSIONAL'

  if (
    priceId === process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY ||
    priceId === process.env.STRIPE_PRICE_ENTERPRISE_ANNUAL ||
    priceId === 'price_1SpKx6PBeHrQUcEB8KezJ9dx' ||
    priceId === 'price_1SpKxuPBeHrQUcEB9Ytzoo2N'
  ) return 'ENTERPRISE'

  return 'PROFESSIONAL'
}

function planTierToDisplay(tier: Tier) {
  if (tier === 'BASIC') return 'Basic'
  if (tier === 'ENTERPRISE') return 'Enterprise'
  return 'Professional'
}

function mapStripeStatus(status: string): string {
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
  return statusMap[status] || 'INACTIVE'
}

function firstNameFromUser(user: { first_name?: string | null; firstName?: string | null; name?: string | null; email: string }) {
  const explicit = String(user.first_name || user.firstName || '').trim()
  if (explicit) return explicit

  const fromName = String(user.name || '').trim()
  if (fromName) return fromName.split(/\s+/)[0]

  const localPart = String(user.email || '').split('@')[0] || 'there'
  return localPart.replace(/[._-]+/g, ' ').trim().split(/\s+/)[0] || 'there'
}

async function sendGuestCheckoutActivationEmail({
  userId,
  email,
  firstName,
  company,
  planTier,
  trialDays,
  offerCode,
}: {
  userId: string
  email: string
  firstName: string
  company?: string
  planTier: Tier
  trialDays: number
  offerCode?: string
}) {
  const now = new Date()
  const existingToken = await prisma.email_verification_tokens.findFirst({
    where: { user_id: userId, expires_at: { gt: now } },
    orderBy: { created_at: 'desc' },
    select: { id: true },
  })

  if (existingToken) {
    return { sent: false, pending: true }
  }

  const rawToken = crypto.randomBytes(32).toString('hex')
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000)

  await prisma.email_verification_tokens.create({
    data: {
      id: crypto.randomUUID(),
      user_id: userId,
      token_hash: tokenHash,
      expires_at: expiresAt,
      created_at: new Date(),
    },
  })

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    process.env.APP_URL ||
    'https://www.precisegovcon.com'

  const activationUrl = new URL('/activate', appUrl)
  activationUrl.searchParams.set('token', rawToken)
  activationUrl.searchParams.set('email', email)
  activationUrl.searchParams.set('firstName', firstName)
  activationUrl.searchParams.set('trialDays', String(trialDays))
  activationUrl.searchParams.set('next', '/account?tab=profile')
  if (offerCode) activationUrl.searchParams.set('code', offerCode)

  const sent = await sendAdminCreatedUserActivationEmail({
    to: email,
    firstName,
    company,
    activationUrl: activationUrl.toString(),
    planTier,
    activationCode: offerCode,
    trialDays,
    expiresIn: '72 hours',
  })

  return { sent, pending: false }
}

export async function GET(req: NextRequest) {
  try {
    const sessionId = String(req.nextUrl.searchParams.get('session_id') || '').trim()
    if (!sessionId) {
      return NextResponse.json({ ok: false, error: 'Missing session_id' }, { status: 400 })
    }

    const checkout = await stripe.checkout.sessions.retrieve(sessionId)
    if (checkout.mode !== 'subscription') {
      return NextResponse.json({ ok: false, error: 'Unsupported checkout mode' }, { status: 400 })
    }

    const customerId = typeof checkout.customer === 'string' ? checkout.customer : checkout.customer?.id || null
    const subscriptionId = typeof checkout.subscription === 'string' ? checkout.subscription : checkout.subscription?.id || null
    const email =
      (checkout.customer_details?.email as string | undefined) ||
      (checkout.customer_email as string | undefined) ||
      (checkout.metadata?.email as string | undefined) ||
      null

    if (!email) {
      return NextResponse.json({ ok: false, error: 'Checkout session missing email' }, { status: 400 })
    }

    const customerName =
      (checkout.customer_details?.name as string | undefined) ||
      (checkout.metadata?.name as string | undefined) ||
      null

    let planTier: Tier = 'PROFESSIONAL'
    let subscriptionStatus = 'active'
    let billingInterval: 'MONTHLY' | 'ANNUAL' | null = null
    let stripePriceId: string | null = null
    let trialStartsAt: Date | null = null
    let trialEndsAt: Date | null = null
    let currentPeriodEnd: Date | null = null

    if (subscriptionId) {
      const sub = await stripe.subscriptions.retrieve(subscriptionId, { expand: ['items.data.price'] })
      const priceId = sub.items.data[0]?.price?.id || null
      const interval = sub.items.data[0]?.price?.recurring?.interval || null
      if (priceId) {
        planTier = getTierFromPriceId(priceId)
        stripePriceId = priceId
      }
      subscriptionStatus = sub.status || 'active'
      if (interval === 'month') billingInterval = 'MONTHLY'
      if (interval === 'year') billingInterval = 'ANNUAL'
      trialStartsAt = unixToDate((sub as any)?.trial_start)
      trialEndsAt = unixToDate((sub as any)?.trial_end)
      currentPeriodEnd = unixToDate((sub as any)?.current_period_end)
    }

    const metadataOfferCode = String(checkout.metadata?.offer_code || '').toUpperCase().trim() || null
    const metadataOfferCodeId = String(checkout.metadata?.offer_code_id || '').trim() || null
    const trialDays = Math.max(
      1,
      Math.min(365, Number.parseInt(String(checkout.metadata?.trial_days || '7'), 10) || 7)
    )
    const isGuestCheckout = String(checkout.metadata?.checkout_type || '').toLowerCase() === 'guest'

    const user = await prisma.users.upsert({
      where: { email },
      update: {
        stripe_customer_id: customerId || undefined,
        stripe_subscription_id: subscriptionId || undefined,
        stripe_price_id: stripePriceId || undefined,
        plan_tier: planTier,
        plan_status: mapStripeStatus(subscriptionStatus),
        subscription_status: subscriptionStatus,
        billing_interval: billingInterval || undefined,
        plan: planTierToDisplay(planTier),
        trial_active: subscriptionStatus === 'trialing',
        trial_started_at: trialStartsAt,
        trial_expires_at: trialEndsAt,
        trial_ends_at: trialEndsAt,
        current_period_end: currentPeriodEnd,
        stripe_current_period_end: currentPeriodEnd,
        offer_code: metadataOfferCode || undefined,
        offer_code_id: metadataOfferCodeId || undefined,
      },
      create: {
        id: crypto.randomUUID(),
        updated_at: new Date(),
        email,
        name: customerName || undefined,
        stripe_customer_id: customerId || undefined,
        stripe_subscription_id: subscriptionId || undefined,
        stripe_price_id: stripePriceId || undefined,
        plan_tier: planTier,
        plan_status: mapStripeStatus(subscriptionStatus),
        subscription_status: subscriptionStatus,
        billing_interval: billingInterval || undefined,
        plan: planTierToDisplay(planTier),
        trial_active: subscriptionStatus === 'trialing',
        trial_started_at: trialStartsAt,
        trial_expires_at: trialEndsAt,
        trial_ends_at: trialEndsAt,
        current_period_end: currentPeriodEnd,
        stripe_current_period_end: currentPeriodEnd,
        offer_code: metadataOfferCode || undefined,
        offer_code_id: metadataOfferCodeId || undefined,
      },
    })

    let activationEmailSent = false
    let activationEmailPending = false

    if (isGuestCheckout && !user.password_hash) {
      const result = await sendGuestCheckoutActivationEmail({
        userId: user.id,
        email: user.email,
        firstName: firstNameFromUser(user),
        company: user.company || undefined,
        planTier,
        trialDays,
        offerCode: metadataOfferCode || undefined,
      })
      activationEmailSent = result.sent
      activationEmailPending = result.pending
    }

    return NextResponse.json({
      ok: true,
      email,
      needsPasswordSetup: !user.password_hash,
      activationEmailSent,
      activationEmailPending,
      planTier,
      subscriptionStatus,
    })
  } catch (err: any) {
    console.error('❌ verify-session failed:', err)
    return NextResponse.json(
      { ok: false, error: 'Failed to verify session', message: err?.message || 'unknown' },
      { status: 500 }
    )
  }
}

