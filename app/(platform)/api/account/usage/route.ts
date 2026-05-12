// app/api/account/usage/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Seat limits per plan tier
const SEAT_LIMITS: Record<string, number> = {
  BASIC: 1,
  PROFESSIONAL: 3,
  ENTERPRISE: 10,
  TRIAL: 1,
  FREE: 1,
}

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const email = session.user.email

    const user = await prisma.users.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
        plan_tier: true,
        billing_interval: true,
        subscription_status: true,
        stripe_current_period_end: true,
        cancel_at_period_end: true,
        stripe_subscription_id: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const savedSearchesCount = await prisma.saved_searches.count({
      where: { user_id: user.id },
    })

    const tier = (user.plan_tier || user.plan || 'FREE').toString().toUpperCase()
    const maxSeats = SEAT_LIMITS[tier] ?? 1

    return NextResponse.json({
      user_id: user.id,
      email: user.email,
      name: user.name,
      tier,
      interval: user.billing_interval,
      subscription_status: user.subscription_status,
      cancel_at_period_end: user.cancel_at_period_end || false,
      stripe_subscription_id: user.stripe_subscription_id,

      // Seat usage — seatsUsed is always 1 until multi-user teams are added
      seatsUsed: 1,
      maxSeats,

      // Activity counts (informational, not capped)
      opportunitiesSaved: savedSearchesCount,

      limits: {
        seats: { used: 1, total: maxSeats },
        searches: { used: null, total: null },  // unlimited
        exports:  { used: null, total: null },   // unlimited
      },
    })
  } catch (error: any) {
    console.error('Error fetching user usage:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user usage', details: error.message },
      { status: 500 }
    )
  }
}
