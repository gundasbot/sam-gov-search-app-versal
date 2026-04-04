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

function jsonError(message: string, status = 500, extra?: Record<string, any>) {
  return NextResponse.json({ error: message, ...(extra || {}) }, { status })
}

type BillingInterval = 'monthly' | 'annual' // ✅ FIXED: Correct type name

function normalizePlan(raw: any): 'basic' | 'professional' | 'enterprise' | null {
  const v = String(raw || '').toLowerCase().trim()
  if (!v) return null
  if (v === 'pro') return 'professional'
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

function priceFromEnv(plan: 'basic' | 'professional' | 'enterprise', billing: BillingInterval): string | null { // ✅ FIXED: Use correct type
  const envKey = `STRIPE_PRICE_${plan.toUpperCase()}_${billing === 'annual' ? 'ANNUAL' : 'MONTHLY'}`
  const envVal = process.env[envKey]
  if (envVal) return String(envVal)

  const fallback: Record<string, Record<BillingInterval, string>> = {
    basic: {
      monthly: 'price_1SrWKwL0qhATKGOJo4ginD8u',
      annual:  'price_1SrWE8L0qhATKGOJovDYe1T4',
    },
    professional: {
      monthly: 'price_1SpfzWL0qhATKGOJGIiLnkhU',
      annual:  'price_1Spg08L0qhATKGOJlgQeSrUW',
    },
    enterprise: {
      monthly: 'price_1Spg0aL0qhATKGOJZcXETI7D',
      annual:  'price_1Spg1CL0qhATKGOJG9iRaIhq',
    },
  }
  return fallback[plan]?.[billing] || null
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
    const session = await getServerSession(authOptions)
    console.log('👤 Session:', session?.user?.email || 'Not authenticated')
    
    if (!session?.user?.email) {
      console.log('❌ No session - returning 401')
      return jsonError('You must be signed in to manage a subscription.', 401)
    }

    const email = session.user.email
    const name = session.user.name || null

    let body: any = {}
    try {
      body = await req.json()
      console.log('📦 Request body:', body)
    } catch {
      console.log('⚠️ Failed to parse request body')
      body = {}
    }

    const requestedPlan = normalizePlan(body?.plan ?? body?.tier)
    const requestedBilling = normalizeBilling(body?.billing ?? body?.interval) || 'monthly'
    const explicitPriceId = String(body?.priceId || '').trim() || null
    const selectedPaymentMethodId = String(body?.selectedPaymentMethodId || '').trim() || null

    console.log('📋 Plan:', requestedPlan, 'Billing:', requestedBilling)

    if (!requestedPlan && !explicitPriceId) {
      console.log('❌ Missing plan')
      return jsonError('Missing plan. Provide { plan, billing } or { priceId }.', 400)
    }

    const finalPriceId = explicitPriceId || (requestedPlan ? priceFromEnv(requestedPlan, requestedBilling) : null)
    console.log('💰 Price ID:', finalPriceId)
    
    if (!finalPriceId) {
      console.log('❌ Could not determine price ID')
      return jsonError('Could not determine Stripe price ID.', 400)
    }

    // Verify price exists
    try {
      await stripe.prices.retrieve(finalPriceId)
      console.log('✅ Price verified in Stripe')
    } catch (err: any) {
      console.log('❌ Price not found in Stripe:', finalPriceId)
      return jsonError(`Price ID not found in Stripe: ${finalPriceId}`, 400, { hint: 'Check Stripe dashboard price IDs.' })
    }

    // Load user
    const user = await prisma.users.findUnique({
      where: { email },
      select: { id: true, stripe_customer_id: true, stripe_subscription_id: true },
    })
    
    if (!user) {
      console.log('❌ User not found in database')
      return jsonError('User not found', 404)
    }
    
    console.log('👤 User found:', user.id)

    // Ensure customer exists
    const customerId = await ensureCustomerId(email, name, user.stripe_customer_id || null)
    if (!customerId) {
      console.log('❌ Failed to create customer')
      return jsonError('Failed to create or find Stripe customer', 500)
    }
    
    console.log('✅ Customer ID:', customerId)

    // Persist customer id if missing
    if (!user.stripe_customer_id || user.stripe_customer_id !== customerId) {
      await prisma.users.update({ 
        where: { id: user.id }, 
        data: { stripe_customer_id: customerId } 
      }).catch((err) => {
        console.error('Failed to save customer ID:', err)
      })
    }

    let verifiedPaymentMethodId: string | null = null
    if (selectedPaymentMethodId) {
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

    const successUrl = `${appUrl}/pricing?success=true&session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${appUrl}/pricing?canceled=true`

    // ✅ FIXED: Check for existing subscription but don't block
    // Instead, inform client that they should use change-plan API
    const existingSub = await findActiveSubscription(customerId, user.stripe_subscription_id || null)
    
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
          redirectTo: '/account/plan'
        }
      )
    }

    // Create new subscription with Checkout
    // Trial is 7 days free — no card required upfront.
    // Stripe will email the customer before the trial ends to collect payment.
    console.log('🎫 Creating checkout session...')
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      payment_method_collection: 'if_required', // ✅ No card required during trial
      ...(verifiedPaymentMethodId ? { payment_method: verifiedPaymentMethodId } : {}),
      line_items: [{ price: finalPriceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      customer_update: { address: 'auto', name: 'auto' },
      metadata: {
        user_id: user.id,
        email,
        plan: requestedPlan || 'unknown',
        billing: requestedBilling,
        created_at: new Date().toISOString(),
        source: String(body?.source || 'pricing_page'),
      },
      subscription_data: {
        trial_period_days: TRIAL_DAYS,
        ...(verifiedPaymentMethodId ? { default_payment_method: verifiedPaymentMethodId } : {}),
        trial_settings: {
          end_behavior: {
            missing_payment_method: 'cancel', // Cancel if no card added by end of trial
          },
        },
        metadata: { user_id: user.id, email },
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

// Test endpoint for debugging
export async function GET(req: NextRequest) {
  console.log('👋 [STRIPE] GET /api/stripe/checkout called (test endpoint)')
  return NextResponse.json({ 
    status: 'ok',
    message: 'Stripe checkout API route is working!',
    timestamp: new Date().toISOString()
  })
}
