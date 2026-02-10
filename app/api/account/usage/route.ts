// app/api/account/usage/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const email = session.user.email

    // Get user with usage data - USING ONLY FIELDS THAT EXIST
    const user = await prisma.users.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
        plan_tier: true,
        billing_interval: true,

        // Known existing fields from your schema
        subscription_status: true,
        stripe_current_period_end: true,
        cancel_at_period_end: true,
        stripe_subscription_id: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Calculate usage stats from related tables (schema uses user_id)
    const searchesCount = await prisma.searches.count({
      where: { user_id: user.id },
    })

    const savedSearchesCount = await prisma.saved_searches.count({
      where: { user_id: user.id },
    })

    const alertExportsCount = await prisma.alert_exports.count({
      where: { user_id: user.id },
    })

    const tier = (user.plan_tier || user.plan || 'FREE').toString().toUpperCase()

    return NextResponse.json({
      userId: user.id,
      email: user.email,
      name: user.name,
      tier,
      interval: user.billing_interval,
      subscription_status: user.subscription_status,
      cancel_at_period_end: user.cancel_at_period_end || false,
      stripe_subscription_id: user.stripe_subscription_id,

      // Usage stats (calculated)
      searchesUsed: searchesCount,
      exportsUsed: alertExportsCount,
      opportunitiesSaved: savedSearchesCount, // this might be a different metric

      // Placeholder limits based on tier (define real numbers later)
      limits: {
        searches: {
          used: searchesCount,
          total: tier === 'PROFESSIONAL' ? 5000 : tier === 'ENTERPRISE' ? 999999 : 500,
        },
        exports: {
          used: alertExportsCount,
          total: tier === 'PROFESSIONAL' ? 100 : tier === 'ENTERPRISE' ? 999999 : 10,
        },
        savedSearches: {
          used: savedSearchesCount,
          total: tier === 'PROFESSIONAL' ? 50 : tier === 'ENTERPRISE' ? 999999 : 5,
        },
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