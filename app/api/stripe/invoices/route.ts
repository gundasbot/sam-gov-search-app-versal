// app/api/stripe/invoices/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/authOptions'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
})

function isNoSuchCustomerError(err: unknown): boolean {
  const e = err as any
  return e?.code === 'resource_missing' && String(e?.message || '').toLowerCase().includes('no such customer')
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const email = session?.user?.email

    if (!email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const user = await prisma.users.findUnique({
      where: { email },
      select: { stripe_customer_id: true },
    })

    if (!user?.stripe_customer_id) {
      return NextResponse.json({ invoices: [] })
    }

    // Fetch customer's invoices from Stripe
    let invoices: Stripe.ApiList<Stripe.Invoice>
    try {
      invoices = await stripe.invoices.list({
        customer: user.stripe_customer_id,
        limit: 12, // Last 12 invoices
      })
    } catch (error) {
      if (isNoSuchCustomerError(error)) {
        await prisma.users.update({
          where: { email },
          data: { stripe_customer_id: null, stripe_subscription_id: null },
        })
        return NextResponse.json({ invoices: [] })
      }
      throw error
    }

    const formattedInvoices = invoices.data.map((invoice) => ({
      id: invoice.id,
      date: new Date(invoice.created * 1000).toISOString(),
      amount: (invoice.amount_paid || 0) / 100, // Convert from cents
      status: invoice.status || 'unknown',
      invoicePdf: invoice.invoice_pdf || '',
      description: invoice.description || `Invoice for ${new Date(invoice.created * 1000).toLocaleDateString()}`,
    }))

    return NextResponse.json({
      invoices: formattedInvoices,
    })
  } catch (error: any) {
    console.error('Failed to fetch invoices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoices', details: error?.message },
      { status: 500 }
    )
  }
}
