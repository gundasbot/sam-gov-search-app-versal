// app/api/stripe/prices/route.ts
//
// Fetches the 6 plan prices directly by Price ID from env vars.
// Much faster than listing all prices and filtering by name.
//
// Required env vars (all in .env.local):
//   STRIPE_SECRET_KEY
//   STRIPE_PRICE_BASIC_MONTHLY
//   STRIPE_PRICE_BASIC_ANNUAL
//   STRIPE_PRICE_PROFESSIONAL_MONTHLY
//   STRIPE_PRICE_PROFESSIONAL_ANNUAL
//   STRIPE_PRICE_ENTERPRISE_MONTHLY
//   STRIPE_PRICE_ENTERPRISE_ANNUAL

import { NextResponse } from 'next/server'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic'

type TierId = 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE'
type IntervalKey = 'monthly' | 'annual'

export interface PriceEntry {
  tier: TierId
  interval: IntervalKey
  unitAmount: number // cents
  currency: string
  priceId: string
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
})

// Map each env var directly to its tier + interval
const PRICE_ENV_MAP: Array<{
  envKey: string
  tier: TierId
  interval: IntervalKey
}> = [
  { envKey: 'STRIPE_PRICE_BASIC_MONTHLY',        tier: 'BASIC',        interval: 'monthly' },
  { envKey: 'STRIPE_PRICE_BASIC_ANNUAL',          tier: 'BASIC',        interval: 'annual'  },
  { envKey: 'STRIPE_PRICE_PROFESSIONAL_MONTHLY',  tier: 'PROFESSIONAL', interval: 'monthly' },
  { envKey: 'STRIPE_PRICE_PROFESSIONAL_ANNUAL',   tier: 'PROFESSIONAL', interval: 'annual'  },
  { envKey: 'STRIPE_PRICE_ENTERPRISE_MONTHLY',    tier: 'ENTERPRISE',   interval: 'monthly' },
  { envKey: 'STRIPE_PRICE_ENTERPRISE_ANNUAL',     tier: 'ENTERPRISE',   interval: 'annual'  },
]

export async function GET() {
  try {
    // Collect all price IDs that are configured
    const configured = PRICE_ENV_MAP.flatMap((entry) => {
      const priceId = process.env[entry.envKey]
      if (!priceId) {
        console.warn(`⚠️  Missing env var: ${entry.envKey}`)
        return []
      }
      return [{ ...entry, priceId }]
    })

    if (configured.length === 0) {
      console.error('❌ No Stripe price IDs configured in env vars')
      return NextResponse.json([], { status: 200 })
    }

    // Fetch all 6 prices in a single parallel Stripe API call
    const fetched = await Promise.all(
      configured.map(({ priceId }) =>
        stripe.prices.retrieve(priceId).catch((err) => {
          console.error(`❌ Failed to retrieve price ${priceId}:`, err.message)
          return null
        })
      )
    )

    const result: PriceEntry[] = []

    for (let i = 0; i < configured.length; i++) {
      const price = fetched[i]
      if (!price || price.unit_amount === null) continue

      result.push({
        tier:       configured[i].tier,
        interval:   configured[i].interval,
        unitAmount: price.unit_amount,
        currency:   price.currency,
        priceId:    price.id,
      })
    }

    // Cache for 5 min, stale-while-revalidate 10 min
    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })
  } catch (err: unknown) {
    console.error('❌ /api/stripe/prices error:', err)
    // Return empty array → PricingClient falls back to hardcoded prices
    return NextResponse.json([], { status: 200 })
  }
}
