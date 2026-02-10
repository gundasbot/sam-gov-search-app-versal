// app/api/stripe/catalog/route.ts

import { NextResponse } from 'next/server'
import Stripe from 'stripe'

export const runtime = 'nodejs'

// Lazy initialization to avoid build-time errors
function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not configured')
  }
  return new Stripe(key, {
    apiVersion: '2025-12-15.clover',
  })
}

const LOOKUP_KEYS = [
  'professional_monthly',
  'professional_annual',
  'enterprise_monthly',
  'enterprise_annual',
]

export async function GET() {
  try {
    const stripe = getStripe()
    
    const prices = await stripe.prices.list({
      lookup_keys: LOOKUP_KEYS,
      expand: ['data.product'],
      active: true,
      limit: 20,
    })

    const normalized = prices.data
      .filter(p => p.type === 'recurring' && p.recurring)
      .map(p => {
        const product = p.product as Stripe.Product
        return {
          priceId: p.id,
          lookupKey: p.lookup_key,
          unitAmount: p.unit_amount,
          currency: p.currency,
          interval: p.recurring!.interval,
          productName: product?.name ?? 'Plan',
          productDescription: product?.description ?? '',
        }
      })

    return NextResponse.json({ prices: normalized })
  } catch (error: any) {
    console.error('Stripe catalog error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch prices' },
      { status: 500 }
    )
  }
}
