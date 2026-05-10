// app/api/stripe/setup-intent/route.ts
// Creates a Stripe SetupIntent so the client can securely collect and attach a payment method.

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

function isNoSuchCustomerError(err: unknown): boolean {
  const e = err as { code?: string; message?: string } | null
  return e?.code === 'resource_missing' && String(e?.message || '').toLowerCase().includes('no such customer')
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
      select: { id: true, stripe_customer_id: true, name: true, email: true },
    })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    // Ensure the user has a Stripe customer record
    let customerId = user.stripe_customer_id
    if (customerId) {
      try {
        await stripe.customers.retrieve(customerId)
      } catch (err) {
        if (isNoSuchCustomerError(err)) {
          customerId = null
          await prisma.users.update({
            where: { id: user.id },
            data: { stripe_customer_id: null, stripe_subscription_id: null },
          })
        } else {
          throw err
        }
      }
    }

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        name: user.name ?? undefined,
      })
      customerId = customer.id
      await prisma.users.update({
        where: { id: user.id },
        data: { stripe_customer_id: customerId },
      })
    }

    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      usage: 'off_session',
    })

    return NextResponse.json({ clientSecret: setupIntent.client_secret })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create setup intent'
    console.error('[setup-intent]', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
