import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { PrismaClient } from '@prisma/client'
import Stripe from 'stripe'

export const runtime = 'nodejs'

declare global {
  var prisma: PrismaClient | undefined
}

const prisma = global.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') global.prisma = prisma

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { paymentMethodId } = await req.json()
    if (!paymentMethodId || typeof paymentMethodId !== 'string') {
      return NextResponse.json({ error: 'paymentMethodId is required' }, { status: 400 })
    }

    const user = await prisma.users.findUnique({
      where: { email: session.user.email.toLowerCase().trim() },
      select: { stripe_customer_id: true },
    })

    if (!user?.stripe_customer_id) {
      return NextResponse.json({ error: 'No Stripe customer found' }, { status: 404 })
    }

    // Verify the payment method belongs to this customer before detaching
    const pm = await stripe.paymentMethods.retrieve(paymentMethodId)
    const pmCustomerId = typeof pm.customer === 'string' ? pm.customer : pm.customer?.id
    if (pmCustomerId !== user.stripe_customer_id) {
      return NextResponse.json({ error: 'Payment method not found' }, { status: 404 })
    }

    await stripe.paymentMethods.detach(paymentMethodId)

    return NextResponse.json({ success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to remove card'
    console.error('[payment-methods/delete]', err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
