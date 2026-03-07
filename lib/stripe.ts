// lib/stripe.ts
import Stripe from 'stripe'

/**
 * Stripe client singleton with lazy initialization.
 * Safe for Next.js build time when env vars may not be available.
 */
declare global {
  // eslint-disable-next-line no-var
  var __stripeClient: Stripe | undefined
}

function getStripeClient(): Stripe {
  if (globalThis.__stripeClient) {
    return globalThis.__stripeClient
  }

  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    throw new Error('Missing STRIPE_SECRET_KEY environment variable')
  }

  const client = new Stripe(secretKey, {
    apiVersion: '2026-02-25.clover' as any,
    typescript: true,
  })

  if (process.env.NODE_ENV !== 'production') {
    globalThis.__stripeClient = client
  }

  return client
}

// Export a getter instead of the client directly
export const stripe = {
  get client(): Stripe {
    return getStripeClient()
  }
}

// For backwards compatibility - use stripe.client in your code
export function getStripe(): Stripe {
  return getStripeClient()
}

/**
 * Central price-id map used by API routes.
 */
export const STRIPE_PRICE_IDS = {
  PROFESSIONAL_MONTHLY:
    process.env.STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID ||
    process.env.STRIPE_PRICE_PRO_MONTHLY ||
    '',
  PROFESSIONAL_ANNUAL:
    process.env.STRIPE_PROFESSIONAL_ANNUAL_PRICE_ID ||
    process.env.STRIPE_PRICE_PRO_ANNUAL ||
    '',
  ENTERPRISE_MONTHLY:
    process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID ||
    process.env.STRIPE_PRICE_ENT_MONTHLY ||
    '',
  ENTERPRISE_ANNUAL:
    process.env.STRIPE_ENTERPRISE_ANNUAL_PRICE_ID ||
    process.env.STRIPE_PRICE_ENT_ANNUAL ||
    '',
} as const

function requirePriceId(id: string, name: string) {
  if (!id) throw new Error(`Missing ${name} (set it in env vars)`)
  return id
}

export type CreateCheckoutSessionArgs = {
  user_id: string
  email: string
  priceId: string
  trialDays?: number
  successUrl: string
  cancelUrl: string
  metadata?: Record<string, string>
}

/**
 * Creates a Stripe Checkout Session for a subscription.
 */
export async function createCheckoutSession(args: CreateCheckoutSessionArgs) {
  const priceId = requirePriceId(args.priceId, 'Stripe Price ID')
  const stripeClient = getStripeClient()

  return await stripeClient.checkout.sessions.create({
    mode: 'subscription',
    customer_email: args.email,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: args.successUrl,
    cancel_url: args.cancelUrl,
    allow_promotion_codes: true,
    metadata: {
      user_id: args.user_id,
      priceId,
      ...(args.metadata || {}),
    },
    subscription_data:
      args.trialDays && args.trialDays > 0
        ? { trial_period_days: args.trialDays }
        : undefined,
  })
}
