//app/api/payment-methods/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/(platform)/api/auth/[...nextauth]/route'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
})

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database to get Stripe customer ID
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()

    try {
      const user = await prisma.users.findUnique({
        where: { email: session.user.email },
        select: { stripe_customer_id: true },
      })

      if (!user?.stripe_customer_id) {
        // No Stripe customer yet, return empty array
        return NextResponse.json([])
      }

      // Fetch payment methods from Stripe
      const paymentMethods = await stripe.paymentMethods.list({
        customer: user.stripe_customer_id,
        type: 'card',
      })

      // Get default payment method from customer
      const customer = await stripe.customers.retrieve(user.stripe_customer_id)
      const defaultPaymentMethodId =
        'deleted' in customer && !customer.deleted ? customer.invoice_settings.default_payment_method : null

      // Transform to our format
      const methods = paymentMethods.data.map((pm) => ({
        id: pm.id,
        brand: pm.card?.brand || 'card',
        last4: pm.card?.last4 || '****',
        expMonth: pm.card?.exp_month || 0,
        expYear: pm.card?.exp_year || 0,
        isDefault: pm.id === defaultPaymentMethodId,
      }))

      return NextResponse.json(methods)
    } finally {
      await prisma.$disconnect()
    }
  } catch (error) {
    console.error('Error fetching payment methods:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
