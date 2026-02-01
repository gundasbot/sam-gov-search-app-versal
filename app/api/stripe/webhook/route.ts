// app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email/send'
import { buildBrandEmailHtml, buildBrandEmailText } from '@/lib/email/brandTemplate'

export const runtime = 'nodejs'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-12-15.clover',
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

  let tier: Tier | undefined
  let interval: BillingInterval | undefined

  if (subscriptionId) {
    const sub = await stripe.subscriptions.retrieve(subscriptionId)
    const priceId = sub.items.data[0]?.price?.id
    tier = priceId ? getTierFromPriceId(priceId) : undefined
    const subAny = sub as any
    const recurringInterval = subAny?.items?.data?.[0]?.price?.recurring?.interval
    interval = recurringInterval === 'year' ? 'annual' : 'monthly'
  }

  const planTier = tier || 'PROFESSIONAL'
  const planName = planTierToDisplay(planTier)

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      stripeCustomerId: customerId || undefined,
      stripeSubscriptionId: subscriptionId || undefined,
      planTier: planTier,
      planStatus: 'ACTIVE',
      plan: planName,
      trialActive: false,
      trialExpiresAt: null,
    },
    create: {
      email,
      name: customerName,
      stripeCustomerId: customerId || undefined,
      stripeSubscriptionId: subscriptionId || undefined,
      planTier: planTier,
      planStatus: 'ACTIVE',
      plan: planName,
      trialActive: false,
      trialExpiresAt: null,
    },
  })

  console.log(`✅ Checkout completed for ${user.email}: ${planTier} (${interval || 'monthly'})`)
  await sendSubscriptionEmail(user.email, 'welcome', planTier, undefined, user.name || customerName)
}

async function handleSubscriptionUpsert(subscription: Stripe.Subscription) {
  const subscriptionId = subscription.id
  const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id

  const priceId = subscription.items.data[0]?.price?.id
  const tier = priceId ? getTierFromPriceId(priceId) : 'PROFESSIONAL'
  const planName = planTierToDisplay(tier)
  const planStatus = mapStripeStatus(subscription.status)

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ stripeCustomerId: customerId }, { stripeSubscriptionId: subscriptionId }],
    },
  }) || null

  if (!user) {
    console.warn('⚠️ Subscription event for unknown user:', { customerId, subscriptionId })
    return
  }

  const previousTier = (user.planTier as string | null) || null

  await prisma.user.update({
    where: { id: user.id },
    data: {
      stripeCustomerId: customerId || undefined,
      stripeSubscriptionId: subscriptionId || undefined,
      planTier: tier,
      planStatus: planStatus,
      plan: planName,
      trialActive: subscription.status === 'trialing',
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

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ stripeSubscriptionId: subscriptionId }, { stripeCustomerId: customerId }],
    },
  }) || null

  if (!user) {
    console.warn('⚠️ subscription.deleted for unknown user:', { customerId, subscriptionId })
    return
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      planTier: 'FREE',
      planStatus: 'CANCELED',
      plan: 'Free',
      stripeSubscriptionId: null,
      trialActive: false,
      trialExpiresAt: null,
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

  const user = await prisma.user.findFirst({
    where: { stripeSubscriptionId: subscriptionId },
  })

  if (!user) return

  await prisma.user.update({
    where: { id: user.id },
    data: { planStatus: 'PAST_DUE' },
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

  const user = await prisma.user.findFirst({
    where: { stripeSubscriptionId: subscriptionId },
  })

  if (!user) return

  await prisma.user.update({
    where: { id: user.id },
    data: { planStatus: 'ACTIVE' },
  })

  await sendSubscriptionEmail(user.email, 'renewal', user.planTier || undefined, undefined, user.name || undefined)
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
    'http://localhost:3000'

  let subject = '', headline = '', intro = '', ctaLabel = '', ctaUrl = ''
  const niceNew = newPlan ? planTierToDisplay(newPlan) : undefined
  const niceOld = oldPlan ? planTierToDisplay(oldPlan) : undefined

  switch (type) {
    case 'welcome':
      subject = `Welcome to Precise GovCon${niceNew ? ` — ${niceNew}` : ''}`
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
      subject = 'Payment Failed — Action Required'
      headline = 'Payment Issue'
      intro = 'We couldn\'t process your payment. Please update your billing method to avoid interruption.'
      ctaLabel = 'Manage Plan'
      ctaUrl = `${appUrl}/account/plan`
      break
    case 'renewal':
      subject = 'Payment Confirmed — Thanks for Renewing'
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