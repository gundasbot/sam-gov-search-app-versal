// app/api/stripe/checkout/route.ts

//Client-Side Routing handles plan changes

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

console.log('✅ Stripe checkout route.ts loaded')

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const TRIAL_DAYS = 7

type ResolvedOfferCode = {
  id: string
  code: string
  type: string
  trialDays: number
}

function jsonError(message: string, status = 500, extra?: Record<string, any>) {
  return NextResponse.json({ error: message, ...(extra || {}) }, { status })
}

function normalizeOfferCode(raw: any): string | null {
  const value = String(raw || '').toUpperCase().trim()
  return value || null
}

function normalizeTrialDays(value: number | null | undefined, fallback = TRIAL_DAYS): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback
  return Math.min(365, Math.max(1, Math.round(value)))
}

function extractTrialDaysFromText(value: string | null | undefined, fallback = TRIAL_DAYS): number {
  if (!value) return fallback
  const match = String(value).match(/(\d{1,3})/)
  if (!match) return fallback
  return normalizeTrialDays(parseInt(match[1], 10), fallback)
}

async function resolveOfferCode(code: string): Promise<ResolvedOfferCode | null> {
  const offer = await prisma.offer_codes.findFirst({
    where: { code, active: true },
    select: {
      id: true,
      code: true,
      type: true,
      discount: true,
      description: true,
      max_usage: true,
      usage_count: true,
      expires_at: true,
    },
  })

  if (!offer) return null
  if (offer.expires_at && new Date(offer.expires_at) < new Date()) return null
  if (offer.max_usage && offer.usage_count >= offer.max_usage) return null

  const trialDays =
    String(offer.type || '').toLowerCase() === 'trial'
      ? extractTrialDaysFromText(offer.discount || offer.description || '', TRIAL_DAYS)
      : TRIAL_DAYS

  return {
    id: offer.id,
    code: offer.code,
    type: offer.type || 'trial',
    trialDays,
  }
}

type BillingInterval = 'monthly' | 'annual' // ✅ FIXED: Correct type name
type PlanKey = 'basic' | 'professional' | 'enterprise'

const STATIC_PRICE_FALLBACKS: Record<PlanKey, Record<BillingInterval, string>> = {
  basic: {
    monthly: 'price_1SrX4iPBeHrQUcEBcCNR77ti',
    annual:  'price_1SrX5JPBeHrQUcEBp36HLtHq',
  },
  professional: {
    monthly: 'price_1SpKkkPBeHrQUcEBikiRqBhP',
    annual:  'price_1SpKu0PBeHrQUcEBLqvi496k',
  },
  enterprise: {
    monthly: 'price_1SpKx6PBeHrQUcEB8KezJ9dx',
    annual:  'price_1SpKxuPBeHrQUcEB9Ytzoo2N',
  },
}

function normalizePlan(raw: any): 'basic' | 'professional' | 'enterprise' | null {
  const v = String(raw || '').toLowerCase().trim()
  if (!v) return null
  if (v === 'pro') return 'professional'
  if (v === 'ent') return 'enterprise'
  if (v === 'basic' || v === 'professional' || v === 'enterprise') return v
  return null
}

function normalizeBilling(raw: any): BillingInterval | null { // ✅ FIXED: Use correct type
  const v = String(raw || '').toLowerCase().trim()
  if (!v) return null
  if (v === 'month' || v === 'monthly') return 'monthly'
  if (v === 'year' || v === 'yearly' || v === 'annual') return 'annual'
  return null
}

function ensureSessionIdPlaceholder(url: string): string {
  if (url.includes('{CHECKOUT_SESSION_ID}')) return url
  return `${url}${url.includes('?') ? '&' : '?'}session_id={CHECKOUT_SESSION_ID}`
}

function resolveCheckoutRedirectUrl(
  rawUrl: any,
  appUrl: string,
  fallbackPath: string,
  includeSessionId = false
): string {
  const fallbackAbsolute = new URL(fallbackPath, appUrl).toString()
  const fallback = includeSessionId
    ? ensureSessionIdPlaceholder(fallbackAbsolute)
    : fallbackAbsolute

  if (typeof rawUrl !== 'string' || !rawUrl.trim()) return fallback

  try {
    const base = new URL(appUrl)
    const candidate = new URL(rawUrl, appUrl)
    if (candidate.origin !== base.origin) return fallback

    const resolved = candidate.toString()
    return includeSessionId ? ensureSessionIdPlaceholder(resolved) : resolved
  } catch {
    return fallback
  }
}

function staticFallbackPrice(plan: 'basic' | 'professional' | 'enterprise', billing: BillingInterval): string | null {
  return STATIC_PRICE_FALLBACKS[plan]?.[billing] || null
}

function priceFromEnv(plan: 'basic' | 'professional' | 'enterprise', billing: BillingInterval): string | null { // ✅ FIXED: Use correct type
  const period = billing === 'annual' ? 'ANNUAL' : 'MONTHLY'
  const planUpper = plan.toUpperCase()
  const aliases: Record<PlanKey, string[]> = {
    basic: ['BASIC'],
    professional: ['PROFESSIONAL', 'PRO'],
    enterprise: ['ENTERPRISE', 'ENT'],
  }

  for (const keyPlan of aliases[plan]) {
    const envKey = `STRIPE_PRICE_${keyPlan}_${period}`
    const envVal = process.env[envKey]
    if (envVal) return String(envVal)
  }

  const canonicalEnvKey = `STRIPE_PRICE_${planUpper}_${period}`
  const canonical = process.env[canonicalEnvKey]
  if (canonical) return String(canonical)

  return staticFallbackPrice(plan, billing)
}

function toStripeRecurringInterval(billing: BillingInterval): 'month' | 'year' {
  return billing === 'annual' ? 'year' : 'month'
}

function checkoutLookupKeys(plan: PlanKey, billing: BillingInterval): string[] {
  const annualOrMonthly = billing === 'annual' ? 'annual' : 'monthly'
  return Array.from(
    new Set([
      `${plan}_${annualOrMonthly}`,
      `${plan}-${annualOrMonthly}`,
      `${plan}_${toStripeRecurringInterval(billing)}`,
      `${plan}-${toStripeRecurringInterval(billing)}`,
      `plan_${plan}_${annualOrMonthly}`,
    ])
  )
}

function getExpandedProduct(product: Stripe.Price['product']): Stripe.Product | null {
  if (!product || typeof product === 'string') return null
  if ('deleted' in product && product.deleted) return null
  return product
}

function extractSearchText(price: Stripe.Price): string {
  const product = getExpandedProduct(price.product)
  const productMetadata = product?.metadata ? Object.values(product.metadata) : []
  const metadata = price.metadata ? Object.values(price.metadata) : []

  return [
    price.lookup_key || '',
    price.nickname || '',
    ...metadata,
    product?.name || '',
    product?.description || '',
    ...productMetadata,
  ]
    .join(' ')
    .toLowerCase()
}

function scorePriceCandidate(price: Stripe.Price, plan: PlanKey, billing: BillingInterval): number {
  const product = getExpandedProduct(price.product)
  const text = extractSearchText(price)
  const desiredLookup = `${plan}_${billing}`
  const desiredInterval = toStripeRecurringInterval(billing)
  const planTerms: Record<PlanKey, string[]> = {
    basic: ['basic', 'starter'],
    professional: ['professional'],
    enterprise: ['enterprise'],
  }
  const billingTerms = billing === 'annual' ? ['annual', 'year', 'yearly'] : ['month', 'monthly']

  let score = 0

  if (price.lookup_key === desiredLookup) score += 200
  if (price.lookup_key?.includes(plan)) score += 35
  if (price.lookup_key?.includes(billing === 'annual' ? 'annual' : 'month')) score += 20
  if (price.metadata?.tier?.toLowerCase() === plan) score += 120
  if (price.metadata?.plan?.toLowerCase() === plan) score += 120
  if (price.metadata?.billing?.toLowerCase() === billing) score += 60
  if (price.metadata?.interval?.toLowerCase() === desiredInterval) score += 60
  if (product?.metadata?.tier?.toLowerCase() === plan) score += 100
  if (product?.metadata?.plan?.toLowerCase() === plan) score += 100

  if (planTerms[plan].some((term) => text.includes(term))) score += 40
  if (billingTerms.some((term) => text.includes(term))) score += 25

  return score
}

async function discoverLivePriceId(plan: PlanKey, billing: BillingInterval): Promise<string | null> {
  const desiredInterval = toStripeRecurringInterval(billing)

  try {
    const lookupMatches = await stripe.prices.list({
      lookup_keys: checkoutLookupKeys(plan, billing),
      active: true,
      limit: 20,
      expand: ['data.product'],
    })

    const lookupPrice = lookupMatches.data.find(
      (p) => p.type === 'recurring' && p.recurring?.interval === desiredInterval
    )
    if (lookupPrice) return lookupPrice.id
  } catch (err) {
    console.warn('Lookup-key price discovery failed:', err)
  }

  try {
    const recurringPrices = await stripe.prices.list({
      active: true,
      type: 'recurring',
      limit: 100,
      expand: ['data.product'],
    })

    const candidates = recurringPrices.data
      .filter((p) => p.recurring?.interval === desiredInterval)
      .map((p) => ({ id: p.id, score: scorePriceCandidate(p, plan, billing) }))
      .filter((p) => p.score > 0)
      .sort((a, b) => b.score - a.score)

    if (candidates.length === 0) return null
    if (candidates.length === 1) return candidates[0].id

    // Avoid ambiguous selection when scores are too close.
    if (candidates[0].score - candidates[1].score >= 20) {
      return candidates[0].id
    }

    return null
  } catch (err) {
    console.warn('Catalog price discovery failed:', err)
    return null
  }
}

async function ensureCustomerId(email: string, name: string | null, existing?: string | null) {
  if (existing) {
    try {
      await stripe.customers.retrieve(existing)
      return existing
    } catch (err) {
      console.log('Existing customer not found in Stripe, creating new one')
    }
  }
  
  const list = await stripe.customers.list({ email, limit: 1 })
  if (list.data[0]?.id) {
    return list.data[0].id
  }
  
  console.log('Creating new Stripe customer for:', email)
  const customer = await stripe.customers.create({
    email,
    name: name || undefined,
    metadata: {
      email,
      created_from: 'checkout_api',
    },
  })
  
  return customer.id
}

async function findActiveSubscription(customerId: string, existingSubId?: string | null) {
  if (existingSubId) {
    try {
      const sub = await stripe.subscriptions.retrieve(existingSubId, { expand: ['items.data.price'] })
      if (['active', 'trialing', 'past_due', 'unpaid'].includes(sub.status)) return sub
    } catch {
      // continue
    }
  }

  const subs = await stripe.subscriptions.list({
    customer: customerId,
    status: 'all',
    limit: 10,
    expand: ['data.items.data.price'],
  })

  return subs.data.find((s) => ['active', 'trialing', 'past_due', 'unpaid'].includes(s.status)) || null
}

export async function POST(req: NextRequest) {
  console.log('🔔 [STRIPE] POST /api/stripe/checkout called')

  try {
    let body: any = {}
    try {
      body = await req.json()
      console.log('📦 Request body:', body)
    } catch {
      console.log('⚠️ Failed to parse request body')
      body = {}
    }

    const session = await getServerSession(authOptions)
    const sessionEmail = String(session?.user?.email || '').trim().toLowerCase()
    const guestEmail = String(body?.email || body?.customerEmail || '').trim().toLowerCase()
    const email = sessionEmail || guestEmail || null
    const name = session?.user?.name || String(body?.name || body?.customerName || '').trim() || null
    const isGuestCheckout = !sessionEmail

    if (guestEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)) {
      return jsonError('Please provide a valid email address for checkout.', 400)
    }

    const requestedPlan = normalizePlan(body?.plan ?? body?.tier)
    const requestedBilling = normalizeBilling(body?.billing ?? body?.interval) || 'monthly'
    const explicitPriceId = String(body?.priceId || '').trim() || null
    const selectedPaymentMethodId = String(body?.selectedPaymentMethodId || '').trim() || null
    const requestedOfferCode =
      normalizeOfferCode(body?.offerCode) ||
      normalizeOfferCode(body?.offer_code) ||
      normalizeOfferCode(body?.code)

    console.log('📋 Plan:', requestedPlan, 'Billing:', requestedBilling)

    if (!requestedPlan && !explicitPriceId) {
      console.log('❌ Missing plan')
      return jsonError('Missing plan. Provide { plan, billing } or { priceId }.', 400)
    }

    let finalPriceId = explicitPriceId || (requestedPlan ? priceFromEnv(requestedPlan, requestedBilling) : null)
    console.log('💰 Price ID:', finalPriceId)
    
    if (!finalPriceId) {
      console.log('❌ Could not determine price ID')
      return jsonError('Could not determine Stripe price ID.', 400)
    }

    // Verify price exists (and auto-recover if env var points to a retired price ID).
    try {
      await stripe.prices.retrieve(finalPriceId)
      console.log('✅ Price verified in Stripe')
    } catch (err: any) {
      console.log('❌ Price not found in Stripe:', finalPriceId)
      let recovered = false

      const fallbackPriceId = requestedPlan ? staticFallbackPrice(requestedPlan, requestedBilling) : null

      if (fallbackPriceId && fallbackPriceId !== finalPriceId) {
        try {
          await stripe.prices.retrieve(fallbackPriceId)
          console.log('✅ Recovered with static fallback price ID:', fallbackPriceId)
          finalPriceId = fallbackPriceId
          recovered = true
        } catch {
          // Keep original error path below with a clearer hint.
        }
      }

      if (!recovered && requestedPlan) {
        const discoveredPriceId = await discoverLivePriceId(requestedPlan, requestedBilling)
        if (discoveredPriceId && discoveredPriceId !== finalPriceId) {
          try {
            await stripe.prices.retrieve(discoveredPriceId)
            console.log('✅ Recovered with discovered live price ID:', discoveredPriceId)
            finalPriceId = discoveredPriceId
            recovered = true
          } catch {
            // Continue to final error response.
          }
        }
      }

      if (!recovered) {
        return jsonError(`Price ID not found in Stripe: ${finalPriceId}`, 400, {
          hint: 'Configured Stripe price IDs are invalid for this Stripe key and no matching active catalog price was found. Update deployment STRIPE_PRICE_* env vars.',
        })
      }
    }

    // Load user for authenticated checkout (guest checkout is allowed without a local account)
    const user = email
      ? await prisma.users.findUnique({
          where: { email },
          select: {
            id: true,
            stripe_customer_id: true,
            stripe_subscription_id: true,
            offer_code_id: true,
            offer_code: true,
          },
        })
      : null

    const fallbackUserOfferCode = !isGuestCheckout ? normalizeOfferCode(user?.offer_code) : null
    const checkoutOfferCode = requestedOfferCode || fallbackUserOfferCode

    const resolvedOffer = checkoutOfferCode ? await resolveOfferCode(checkoutOfferCode) : null
    if (requestedOfferCode && !resolvedOffer) {
      return jsonError('Invalid or expired offer code.', 400, { code: requestedOfferCode })
    }
    const trialDays = resolvedOffer?.trialDays ?? TRIAL_DAYS
    const appliedOfferCode = resolvedOffer?.code ?? null

    let customerId: string | null = null
    if (user?.stripe_customer_id || email) {
      customerId = await ensureCustomerId(email || '', name, user?.stripe_customer_id || null)
      if (!customerId) {
        console.log('❌ Failed to create customer')
        return jsonError('Failed to create or find Stripe customer', 500)
      }
      console.log('✅ Customer ID:', customerId)
    }

    // Persist customer id if authenticated user exists and changed
    if (user && customerId && (!user.stripe_customer_id || user.stripe_customer_id !== customerId)) {
      await prisma.users.update({
        where: { id: user.id },
        data: { stripe_customer_id: customerId },
      }).catch((err) => {
        console.error('Failed to save customer ID:', err)
      })
    }

    if (
      user &&
      resolvedOffer &&
      (user.offer_code !== resolvedOffer.code || user.offer_code_id !== resolvedOffer.id)
    ) {
      await prisma.users.update({
        where: { id: user.id },
        data: {
          offer_code: resolvedOffer.code,
          offer_code_id: resolvedOffer.id,
        },
      }).catch((err) => {
        console.error('Failed to persist offer code on user before checkout:', err)
      })
    }

    let verifiedPaymentMethodId: string | null = null
    if (selectedPaymentMethodId) {
      if (!customerId) {
        return jsonError('Sign in to use a saved payment method.', 400)
      }
      try {
        const pm = await stripe.paymentMethods.retrieve(selectedPaymentMethodId)
        const pmCustomerId = typeof pm.customer === 'string' ? pm.customer : pm.customer?.id
        if (pm.type !== 'card') {
          return jsonError('Selected payment method must be a card.', 400)
        }
        if (pmCustomerId !== customerId) {
          return jsonError('Selected payment method does not belong to this customer.', 403)
        }
        verifiedPaymentMethodId = pm.id
        await stripe.customers.update(customerId, {
          invoice_settings: {
            default_payment_method: verifiedPaymentMethodId,
          },
        })
      } catch (err) {
        console.error('Failed to verify selected payment method:', err)
        return jsonError('Could not verify selected payment method.', 400)
      }
    }

    const appUrl =
      process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || req.nextUrl.origin

    console.log('🌐 App URL:', appUrl)

    const successUrl = resolveCheckoutRedirectUrl(
      body?.successUrl,
      appUrl,
      user ? '/account?success=true' : '/checkout/success',
      true
    )
    const cancelUrl = resolveCheckoutRedirectUrl(
      body?.cancelUrl,
      appUrl,
      '/pricing?canceled=true'
    )

    // ✅ FIXED: Check for existing subscription but don't block
    // Instead, inform client that they should use change-plan API
    const existingSub = customerId ? await findActiveSubscription(customerId, user?.stripe_subscription_id || null) : null

    if (existingSub?.id) {
      console.log('⚠️ User already has active subscription:', existingSub.id)
      console.log('💡 Client should have routed to change-plan API instead')
      
      // Return informative error that client can handle
      return jsonError(
        'You already have an active subscription. To change plans, please use the account page.',
        400,
        { 
          hasSubscription: true,
          currentSubscriptionId: existingSub.id,
          redirectTo: user ? '/account/plan' : '/pricing'
        }
      )
    }

    // Create new subscription with Checkout.
    // Trial is still 7 days, but card collection is required at checkout.
    console.log('🎫 Creating checkout session...')
    const checkoutSession = await stripe.checkout.sessions.create({
      ...(customerId ? { customer: customerId } : {}),
      ...(!customerId && email ? { customer_email: email } : {}),
      mode: 'subscription',
      payment_method_types: ['card'],
      payment_method_collection: 'always',
      ...(verifiedPaymentMethodId ? { payment_method: verifiedPaymentMethodId } : {}),
      line_items: [{ price: finalPriceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      ...(customerId ? { customer_update: { address: 'auto', name: 'auto' } } : {}),
      metadata: {
        user_id: user?.id || 'guest',
        email: email || '',
        checkout_type: isGuestCheckout ? 'guest' : 'authenticated',
        plan: requestedPlan || 'unknown',
        billing: requestedBilling,
        trial_days: String(trialDays),
        offer_code: appliedOfferCode || '',
        offer_code_id: resolvedOffer?.id || '',
        created_at: new Date().toISOString(),
        source: String(body?.source || 'pricing_page'),
      },
      subscription_data: {
        trial_period_days: trialDays,
        ...(verifiedPaymentMethodId ? { default_payment_method: verifiedPaymentMethodId } : {}),
        trial_settings: {
          end_behavior: {
            missing_payment_method: 'cancel', // Cancel if no card added by end of trial
          },
        },
        metadata: {
          user_id: user?.id || 'guest',
          email: email || '',
          trial_days: String(trialDays),
          offer_code: appliedOfferCode || '',
          offer_code_id: resolvedOffer?.id || '',
        },
      },
    })

    console.log('✅ Checkout session created:', checkoutSession.id)
    console.log('🔗 Checkout URL:', checkoutSession.url)
    
    return NextResponse.json({ 
      url: checkoutSession.url, 
      sessionId: checkoutSession.id, 
      mode: 'checkout_new' 
    })
  } catch (error: any) {
    console.error('❌ [STRIPE] Checkout fatal error:', error)
    console.error('Stack trace:', error.stack)
    return jsonError('Failed to create Stripe checkout session', 500, {
      details: error?.message,
      type: error?.type || 'Unknown',
    })
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}
