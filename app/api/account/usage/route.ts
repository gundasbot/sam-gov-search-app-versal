// app/api/account/usage/route.ts - FIXED VERSION
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const email = session.user.email

    // Get user with usage data - USING ONLY FIELDS THAT EXIST
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
        planTier: true,
        billingInterval: true,
        // Check your schema for these fields - they might not exist
        // If they don't exist, you'll need to add them or calculate differently
        // searchesUsed: true,   // Remove if doesn't exist
        // exportsUsed: true,    // Remove if doesn't exist
        // opportunitiesSaved: true, // Remove if doesn't exist
        
        // Let's use what we know exists from your schema
        subscriptionStatus: true,
        stripeCurrentPeriodEnd: true,
        cancelAtPeriodEnd: true,
        stripeSubscriptionId: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // For now, let's calculate usage stats from related tables
    // Since the fields might not exist in your User model
    const searchesCount = await prisma.search.count({
      where: { userId: user.id }
    })

    const savedSearchesCount = await prisma.savedSearch.count({
      where: { userId: user.id }
    })

    const alertExportsCount = await prisma.alertExport.count({
      where: { userId: user.id }
    })

    return NextResponse.json({
      userId: user.id,
      email: user.email,
      name: user.name,
      tier: user.planTier || user.plan || 'FREE',
      interval: user.billingInterval,
      subscriptionStatus: user.subscriptionStatus,
      cancelAtPeriodEnd: user.cancelAtPeriodEnd || false,
      stripeSubscriptionId: user.stripeSubscriptionId,
      
      // Usage stats (calculated)
      searchesUsed: searchesCount,
      exportsUsed: alertExportsCount,
      opportunitiesSaved: savedSearchesCount, // This might be a different metric
      
      // Placeholder limits based on tier (you'll need to define these)
      limits: {
        searches: {
          used: searchesCount,
          total: user.planTier === 'PROFESSIONAL' ? 5000 : 
                 user.planTier === 'ENTERPRISE' ? 999999 : 500
        },
        exports: {
          used: alertExportsCount,
          total: user.planTier === 'PROFESSIONAL' ? 100 : 
                 user.planTier === 'ENTERPRISE' ? 999999 : 10
        },
        savedSearches: {
          used: savedSearchesCount,
          total: user.planTier === 'PROFESSIONAL' ? 50 : 
                 user.planTier === 'ENTERPRISE' ? 999999 : 5
        }
      }
    })
  } catch (error: any) {
    console.error('Error fetching user usage:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user usage', details: error.message },
      { status: 500 }
    )
  }
}