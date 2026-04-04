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

    const { paymentMethodId, nickname } = await req.json()
    const trimmedNickname = typeof nickname === 'string' ? nickname.trim() : ''

    if (!paymentMethodId) {
      return NextResponse.json({ error: 'paymentMethodId is required' }, { status: 400 })
    }

    const user = await prisma.users.findUnique({
      where: { email: session.user.email.toLowerCase().trim() },
      select: { stripe_customer_id: true },
    })

    if (!user?.stripe_customer_id) {
      return NextResponse.json({ error: 'No Stripe customer found' }, { status: 404 })
    }

    const pm = await stripe.paymentMethods.retrieve(paymentMethodId)
    if (!('customer' in pm)) {
      return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 })
    }

    const customerId = typeof pm.customer === 'string' ? pm.customer : pm.customer?.id
    if (customerId !== user.stripe_customer_id) {
      return NextResponse.json({ error: 'Payment method does not belong to this user' }, { status: 403 })
    }

    await stripe.paymentMethods.update(paymentMethodId, {
      metadata: {
        ...(pm.metadata || {}),
        nickname: trimmedNickname,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to save nickname'
    console.error('Payment method nickname update error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
