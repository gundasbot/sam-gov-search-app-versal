// app/api/stripe/portal/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover',
})

/**
 * Finds or creates a Stripe customer for the given user.
 * Trial users who never went through checkout won't have one yet —
 * we create it here so the billing portal always works.
 */
async function ensureStripeCustomer(
  userId: string,
  email: string,
  name: string | null,
  existing: string | null
): Promise<string> {
  // 1. Validate the existing customer ID is still live in Stripe
  if (existing) {
    try {
      const cust = await stripe.customers.retrieve(existing)
      if (!(cust as Stripe.DeletedCustomer).deleted) {
        return existing
      }
    } catch {
      // Customer not found in Stripe — fall through to create
    }
  }

  // 2. Check Stripe by email before creating a duplicate
  const list = await stripe.customers.list({ email, limit: 1 })
  if (list.data[0]?.id) {
    const customerId = list.data[0].id
    // Persist back to DB if it was missing
    await prisma.users.update({
      where: { id: userId },
      data: { stripe_customer_id: customerId },
    }).catch(() => {}) // Non-fatal if this fails
    return customerId
  }

  // 3. Create a new customer
  console.log(`📦 [portal] Creating Stripe customer for ${email}`)
  const customer = await stripe.customers.create({
    email,
    name: name || undefined,
    metadata: {
      user_id: userId,
      email,
      created_from: 'billing_portal',
    },
  })

  // Persist the new customer ID
  await prisma.users.update({
    where: { id: userId },
    data: { stripe_customer_id: customer.id },
  }).catch((err) => {
    console.error('Failed to save new Stripe customer ID:', err)
  })

  return customer.id
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const email = session.user.email
    const name = session.user.name || null

    // Load user from DB
    const user = await prisma.users.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        stripe_customer_id: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Always ensure a Stripe customer exists (creates one for trial users)
    const customerId = await ensureStripeCustomer(
      user.id,
      email,
      name || user.name || null,
      user.stripe_customer_id || null
    )

    console.log(`🔗 [portal] Opening portal for customer ${customerId} (${email})`)

    const returnUrl =
      `${process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || ''}/account`

    // Create Stripe Billing Portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (error: any) {
    console.error('❌ Stripe portal error:', error)

    // Give an actionable message if the portal isn't configured in the dashboard
    if (
      error?.code === 'billing_portal_not_configured' ||
      error?.message?.includes('No default configuration')
    ) {
      return NextResponse.json(
        {
          error:
            'Billing portal not yet configured. Please visit stripe.com/dashboard → Customer portal → Activate.',
        },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: error?.message || 'Failed to open Stripe portal' },
      { status: 500 }
    )
  }
}