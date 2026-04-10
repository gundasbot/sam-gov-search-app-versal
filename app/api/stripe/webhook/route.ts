// app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email/send'
import { buildBrandEmailHtml, buildBrandEmailText } from '@/lib/email/brandTemplate'
import { sendAdminCreatedUserActivationEmail } from '@/lib/email'

export const runtime = 'nodejs'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-02-25.clover',
})

function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status })
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) return jsonError('Missing STRIPE_WEBHOOK_SECRET', 500)

  const signature = req.headers.get('stripe-signature')
  if (!signature) return jsonError('Missing stripe-signature header', 400)

  const body = await req.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error('❌ Webhook signature verification failed:', err?.message || err)
    return jsonError('Invalid signature', 400)
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpsert(event.data.object as Stripe.Subscription)
        break
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break
      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice)
        break
    }

    return NextResponse.json({ ok: true, received: true })
  } catch (err: any) {
    console.error('❌ Webhook processing error:', err)
    return NextResponse.json(
      { ok: false, error: 'Webhook processing failed', message: err?.message || 'unknown error' },
      { status: 500 }
    )
  }
}

type Tier = 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE' | 'FREE'
type BillingInterval = 'monthly' | 'annual'

function unixToDate(value: number | null | undefined): Date | null {
  if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) return null
  return new Date(value * 1000)
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (session.mode !== 'subscription') return

  const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id || null
  const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id || null

  const email = (session.customer_details?.email as string | undefined) ||
    (session.customer_email as string | undefined) ||
    (session.metadata?.email as string | undefined) || null

  const customerName = (session.customer_details?.name as string | undefined) ||
    (session.metadata?.name as string | undefined) || undefined

  if (!email) {
    console.warn('⚠️ checkout.session.completed missing email; skipping user update')
    return
  }

  let subscription: Stripe.Subscription | null = null
  let tier: Tier | undefined
  let interval: BillingInterval | undefined

  if (subscriptionId) {
    subscription = await stripe.subscriptions.retrieve(subscriptionId, { expand: ['items.data.price'] })
    const priceId = subscription.items.data[0]?.price?.id
    tier = priceId ? getTierFromPriceId(priceId) : undefined
    const recurringInterval = subscription.items.data[0]?.price?.recurring?.interval
    interval = recurringInterval === 'year' ? 'annual' : 'monthly'
  }

  const now = new Date()
  const planTier = tier || 'PROFESSIONAL'
  const subscriptionStatus = subscription?.status || 'active'
  const planStatus = mapStripeStatus(subscriptionStatus)
  const stripePriceId = subscription?.items?.data?.[0]?.price?.id || null
  const trialStartsAt = unixToDate((subscription as any)?.trial_start)
  const trialEndsAt = unixToDate((subscription as any)?.trial_end)
  const currentPeriodEnd = unixToDate((subscription as any)?.current_period_end)
  const trialActive =
    subscriptionStatus === 'trialing' &&
    (!trialEndsAt || trialEndsAt > now)
  const metadataOfferCode = String(session.metadata?.offer_code || '').toUpperCase().trim() || null
  const metadataOfferCodeId = String(session.metadata?.offer_code_id || '').trim() || null
  const codeFields = metadataOfferCode
    ? {
        offer_code: metadataOfferCode,
        offer_code_id: metadataOfferCodeId || undefined,
      }
    : {}
  const planName = planTierToDisplay(planTier)
  const isGuestCheckout = String(session.metadata?.checkout_type || '').toLowerCase() === 'guest'
  const trialDays = Math.max(
    1,
    Math.min(365, Number.parseInt(String(session.metadata?.trial_days || '7'), 10) || 7)
  )

  const user = await prisma.users.upsert({
    where: { email },
    update: {
      stripe_customer_id: customerId || undefined,
      stripe_subscription_id: subscriptionId || undefined,
      stripe_price_id: stripePriceId || undefined,
      plan_tier: planTier,
      plan_status: planStatus,
      subscription_status: subscriptionStatus,
      billing_interval: interval ? interval.toUpperCase() : undefined,
      plan: planName,
      trial_active: trialActive,
      trial_started_at: trialStartsAt,
      trial_expires_at: trialEndsAt,
      trial_ends_at: trialEndsAt,
      current_period_end: currentPeriodEnd,
      stripe_current_period_end: currentPeriodEnd,
      ...codeFields,
    },
    create: {
      id: crypto.randomUUID(),
      updated_at: new Date(),
      email,
      name: customerName,
      stripe_customer_id: customerId || undefined,
      stripe_subscription_id: subscriptionId || undefined,
      stripe_price_id: stripePriceId || undefined,
      plan_tier: planTier,
      plan_status: planStatus,
      subscription_status: subscriptionStatus,
      billing_interval: interval ? interval.toUpperCase() : undefined,
      plan: planName,
      trial_active: trialActive,
      trial_started_at: trialStartsAt,
      trial_expires_at: trialEndsAt,
      trial_ends_at: trialEndsAt,
      current_period_end: currentPeriodEnd,
      stripe_current_period_end: currentPeriodEnd,
      ...codeFields,
    },
  })

  console.log(`✅ Checkout completed for ${user.email}: ${planTier} (${subscriptionStatus})`)

  const missingPasswordSetup = !user.password_hash
  if (isGuestCheckout && missingPasswordSetup) {
    const sent = await sendGuestCheckoutActivationEmail({
      userId: user.id,
      email: user.email,
      firstName: firstNameFromUser(user),
      company: user.company || undefined,
      planTier,
      trialDays,
      offerCode: metadataOfferCode || undefined,
    })

    if (sent) {
      console.log(`✅ Sent guest checkout activation email to ${user.email}`)
      return
    }

    console.warn(`⚠️ Failed to send guest checkout activation email for ${user.email}; falling back to welcome email`)
  }

  await sendSubscriptionEmail(user.email, 'welcome', planTier, undefined, user.name || customerName)
}

async function handleSubscriptionUpsert(subscription: Stripe.Subscription) {
  const subscriptionId = subscription.id
  const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id

  const priceId = subscription.items.data[0]?.price?.id
  const tier = priceId ? getTierFromPriceId(priceId) : 'PROFESSIONAL'
  const planName = planTierToDisplay(tier)
  const planStatus = mapStripeStatus(subscription.status) // ✅ FIXED: Use consistent naming
  const recurringInterval = subscription.items.data[0]?.price?.recurring?.interval
  const billingInterval = recurringInterval === 'year' ? 'ANNUAL' : recurringInterval === 'month' ? 'MONTHLY' : null
  const trialStartsAt = unixToDate((subscription as any)?.trial_start)
  const trialEndsAt = unixToDate((subscription as any)?.trial_end)
  const currentPeriodEnd = unixToDate((subscription as any)?.current_period_end)
  const trialActive = subscription.status === 'trialing' && (!trialEndsAt || trialEndsAt > new Date())

  const user = await prisma.users.findFirst({
    where: {
      OR: [{ stripe_customer_id: customerId }, { stripe_subscription_id: subscriptionId }],
    },
  }) || null

  if (!user) {
    console.warn('⚠️ Subscription event for unknown user:', { customerId, subscriptionId })
    return
  }

  const previousTier = (user.plan_tier as string | null) || null

  await prisma.users.update({
    where: { id: user.id },
    data: {
      stripe_customer_id: customerId || undefined,
      stripe_subscription_id: subscriptionId || undefined,
      stripe_price_id: priceId || undefined,
      plan_tier: tier,
      plan_status: planStatus, // ✅ FIXED: Use correct variable name
      subscription_status: subscription.status,
      billing_interval: billingInterval,
      plan: planName,
      trial_active: trialActive,
      trial_started_at: trialStartsAt,
      trial_expires_at: trialEndsAt,
      trial_ends_at: trialEndsAt,
      current_period_end: currentPeriodEnd,
      stripe_current_period_end: currentPeriodEnd,
    },
  })

  console.log(`✅ Subscription upsert for ${user.email}: ${tier} (${planStatus})`)

  if (previousTier && previousTier !== tier) {
    await sendSubscriptionEmail(user.email, 'changed', tier, previousTier, user.name || undefined)
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const subscriptionId = subscription.id
  const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id

  const user = await prisma.users.findFirst({
    where: {
      OR: [{ stripe_subscription_id: subscriptionId }, { stripe_customer_id: customerId }],
    },
  }) || null

  if (!user) {
    console.warn('⚠️ subscription.deleted for unknown user:', { customerId, subscriptionId })
    return
  }

  await prisma.users.update({
    where: { id: user.id },
    data: {
      plan_tier: 'FREE',
      plan_status: 'CANCELED',
      subscription_status: 'canceled',
      plan: 'Free',
      stripe_subscription_id: null,
      stripe_price_id: null,
      trial_active: false,
      trial_expires_at: null,
      trial_started_at: null,
      trial_ends_at: null,
    },
  })

  console.log(`✅ Subscription canceled for ${user.email}`)
  await sendSubscriptionEmail(user.email, 'canceled', undefined, undefined, user.name || undefined)
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  // Handle both camelCase and snake_case property names
  const invoiceAny = invoice as any
  const subscription = invoiceAny?.subscription || invoiceAny?.Subscription
  const subscriptionId = typeof subscription === 'string' ? subscription : subscription?.id || null
  
  if (!subscriptionId) return

  const user = await prisma.users.findFirst({
    where: { stripe_subscription_id: subscriptionId },
  })

  if (!user) return

  await prisma.users.update({
    where: { id: user.id },
    data: { plan_status: 'PAST_DUE' },
  })

  console.log(`⚠️ Payment failed for ${user.email}`)
  await sendSubscriptionEmail(user.email, 'payment_failed', undefined, undefined, user.name || undefined)
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  // Handle both camelCase and snake_case property names
  const invoiceAny = invoice as any
  const billingReason = invoiceAny?.billingReason || invoiceAny?.billing_reason
  if (billingReason !== 'subscription_cycle') return

  const subscription = invoiceAny?.subscription || invoiceAny?.Subscription
  const subscriptionId = typeof subscription === 'string' ? subscription : subscription?.id || null
  
  if (!subscriptionId) return

  const user = await prisma.users.findFirst({
    where: { stripe_subscription_id: subscriptionId },
  })

  if (!user) return

  await prisma.users.update({
    where: { id: user.id },
    data: { plan_status: 'ACTIVE' },
  })

  await sendSubscriptionEmail(user.email, 'renewal', user.plan_tier || undefined, undefined, user.name || undefined)
}

function getTierFromPriceId(priceId: string): Exclude<Tier, 'FREE'> {
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

  console.warn('⚠️ Unknown price ID:', priceId, '- defaulting to PROFESSIONAL')
  return 'PROFESSIONAL'
}

function planTierToDisplay(tier: string) {
  const t = (tier || '').toUpperCase()
  if (t === 'BASIC') return 'Basic'
  if (t === 'ENTERPRISE') return 'Enterprise'
  if (t === 'FREE') return 'Free'
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

function firstNameFromUser(user: {
  first_name?: string | null
  firstName?: string | null
  name?: string | null
  email: string
}) {
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
  planTier: string
  trialDays: number
  offerCode?: string
}) {
  try {
    await prisma.email_verification_tokens.deleteMany({ where: { user_id: userId } })

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

    return await sendAdminCreatedUserActivationEmail({
      to: email,
      firstName,
      company,
      activationUrl: activationUrl.toString(),
      planTier,
      activationCode: offerCode,
      trialDays,
      expiresIn: '72 hours',
    })
  } catch (err) {
    console.error('sendGuestCheckoutActivationEmail failed:', err)
    return false
  }
}

async function sendSubscriptionEmail(
  email: string,
  type: 'welcome' | 'changed' | 'canceled' | 'payment_failed' | 'renewal',
  newPlan?: string,
  oldPlan?: string,
  customerName?: string
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    process.env.APP_URL ||
    'https://www.precisegovcon.com'

  let subject = '', headline = '', intro = '', ctaLabel = '', ctaUrl = ''
  const niceNew = newPlan ? planTierToDisplay(newPlan) : undefined
  const niceOld = oldPlan ? planTierToDisplay(oldPlan) : undefined

  switch (type) {
    case 'welcome':
      subject = `Welcome to Precise GovCon${niceNew ? ` – ${niceNew}` : ''}`
      headline = `Welcome${customerName ? `, ${customerName}` : ''}!`
      intro = `Your subscription is active${niceNew ? ` on the ${niceNew} plan` : ''}. You can now access premium tools.`
      ctaLabel = 'Go to Search'
      ctaUrl = `${appUrl}/search`
      break
    case 'changed':
      subject = 'Your Precise GovCon plan was updated'
      headline = 'Plan Updated'
      intro = `Your plan has changed${niceOld && niceNew ? ` from ${niceOld} to ${niceNew}.` : '.'} Updated features available now.`
      ctaLabel = 'View Plan'
      ctaUrl = `${appUrl}/account/plan`
      break
    case 'canceled':
      subject = 'Subscription Canceled'
      headline = 'Subscription Canceled'
      intro = 'Your subscription has been canceled. You can reactivate anytime from the pricing page.'
      ctaLabel = 'View Pricing'
      ctaUrl = `${appUrl}/pricing`
      break
    case 'payment_failed':
      subject = 'Payment Failed – Action Required'
      headline = 'Payment Issue'
      intro = 'We couldn\'t process your payment. Please update your billing method to avoid interruption.'
      ctaLabel = 'Manage Plan'
      ctaUrl = `${appUrl}/account/plan`
      break
    case 'renewal':
      subject = 'Payment Confirmed – Thanks for Renewing'
      headline = 'Renewal Confirmed'
      intro = 'Your subscription renewal payment was processed successfully.'
      ctaLabel = 'Open Dashboard'
      ctaUrl = `${appUrl}/dashboard`
      break
    default:
      return
  }

  const html = buildBrandEmailHtml({ subject, headline, intro, ctaLabel, ctaUrl })
  const text = buildBrandEmailText({ subject, headline, intro, ctaLabel, ctaUrl })
  await sendEmail({ to: email, subject, html, text })
}
