import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/(platform)/api/auth/[...nextauth]/route'
import { PrismaClient } from '@prisma/client'
import Stripe from 'stripe'

export const runtime = 'nodejs'

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

const prisma = global.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') global.prisma = prisma

// ✅ FIX: do NOT hardcode apiVersion
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

function isNoSuchCustomerError(err: unknown): boolean {
  const e = err as any
  return e?.code === 'resource_missing' && String(e?.message || '').toLowerCase().includes('no such customer')
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const email = session.user.email.toLowerCase().trim()

    const user = await prisma.users.findUnique({
      where: { email },
      select: { stripe_customer_id: true },
    })

    if (!user?.stripe_customer_id) {
      return NextResponse.json({
        paymentMethods: [],
        defaultPaymentMethod: null,
      })
    }

    let paymentMethods: Stripe.ApiList<Stripe.PaymentMethod>
    let customer: Stripe.Customer
    try {
      paymentMethods = await stripe.paymentMethods.list({
        customer: user.stripe_customer_id,
        type: 'card',
      })

      customer = await stripe.customers.retrieve(
        user.stripe_customer_id
      ) as Stripe.Customer
    } catch (error) {
      if (isNoSuchCustomerError(error)) {
        await prisma.users.update({
          where: { email },
          data: { stripe_customer_id: null, stripe_subscription_id: null },
        })
        return NextResponse.json({
          paymentMethods: [],
          defaultPaymentMethod: null,
        })
      }
      throw error
    }

    return NextResponse.json({
      paymentMethods: paymentMethods.data,
      defaultPaymentMethod:
        typeof customer.invoice_settings.default_payment_method === 'string'
          ? customer.invoice_settings.default_payment_method
          : customer.invoice_settings.default_payment_method?.id ?? null,
    })
  } catch (error: any) {
    console.error('Payment methods fetch error:', error)

    return NextResponse.json(
      {
        error: 'Failed to fetch payment methods',
        details: error?.message ?? String(error),
      },
      { status: 500 }
    )
  }
}
