// app/api/account/profile/route.ts - FIXED VERSION
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

    // Get user profile data - USING ONLY FIELDS THAT EXIST
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        company: true,
        title: true,
        phone: true,
        image: true,
        firstName: true,
        lastName: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        state: true,
        postalCode: true,
        country: true,
        
        // Subscription info
        plan: true,
        planTier: true,
        planStatus: true,
        billingInterval: true,
        subscriptionStatus: true,
        stripeCurrentPeriodEnd: true,
        cancelAtPeriodEnd: true,
        stripeSubscriptionId: true,
        stripeCustomerId: true,
        stripePriceId: true,
        currentPeriodEnd: true,
        trialExpiresAt: true,
        trialEndsAt: true,
        trialActive: true,
        
        // Account info
        accountStatus: true,
        isActive: true,
        isSuspended: true,
        role: true,
        emailVerified: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Determine subscription info
    const hasSubscription = !!(user.stripeSubscriptionId && 
      (user.subscriptionStatus === 'active' || 
       user.planStatus === 'active' || 
       user.planStatus === 'trialing'))

    let tier = user.planTier || user.plan || 'FREE'
    if (tier.toLowerCase() === 'free' || tier === 'trial') {
      tier = 'FREE'
    }
    tier = tier.toUpperCase()

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      company: user.company,
      title: user.title,
      phone: user.phone,
      image: user.image,
      firstName: user.firstName,
      lastName: user.lastName,
      address: {
        line1: user.addressLine1,
        line2: user.addressLine2,
        city: user.city,
        state: user.state,
        postalCode: user.postalCode,
        country: user.country,
      },
      
      // Subscription info
      subscription: {
        tier: tier,
        interval: user.billingInterval,
        status: user.subscriptionStatus || user.planStatus,
        currentPeriodEnd: user.stripeCurrentPeriodEnd || user.currentPeriodEnd,
        cancelAtPeriodEnd: user.cancelAtPeriodEnd || false,
        hasSubscription: hasSubscription,
        trialActive: user.trialActive,
        trialExpiresAt: user.trialExpiresAt || user.trialEndsAt,
      },
      
      // Account info
      account: {
        status: user.accountStatus,
        isActive: user.isActive,
        isSuspended: user.isSuspended,
        role: user.role,
        emailVerified: user.emailVerified,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }
    })
  } catch (error: any) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user profile', details: error.message },
      { status: 500 }
    )
  }
}