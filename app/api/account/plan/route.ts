// app/api/account/plan/route.ts - FIXED (PICK HIGHEST-TIER ACTIVE SUBSCRIPTION + TRIAL SUPPORT)

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
})

type DbUser = {
  id: string
  email: string
  name: string | null
  plan: string | null
  planTier: string | null
  planStatus: string | null
  billingInterval: string | null
  subscriptionStatus: string | null
  stripeCurrentPeriodEnd: Date | null
  cancelAtPeriodEnd: boolean | null
  stripeSubscriptionId: string | null
  stripeCustomerId: string | null
  stripePriceId: string | null
  currentPeriodEnd: Date | null
  trialExpiresAt: Date | null
  trialEndsAt: Date | null
  trialActive: boolean | null
}

function normalizeInterval(input: any): 'month' | 'year' | null {
  const v = String(input || '').toLowerCase()
  if (v === 'year' || v === 'annual' || v === 'annually') return 'year'
  if (v === 'month' || v === 'monthly') return 'month'
  return null
}

function normalizeBillingIntervalToDb(input: any): 'MONTHLY' | 'ANNUAL' | null {
  const v = String(input || '').toLowerCase()
  if (v === 'year' || v === 'annual') return 'ANNUAL'
  if (v === 'month' || v === 'monthly') return 'MONTHLY'
  return null
}

function getTierFromPriceId(priceId: string): 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE' {
  if (
    priceId === process.env.STRIPE_PRICE_BASIC_MONTHLY ||
    priceId === process.env.STRIPE_PRICE_BASIC_ANNUAL ||
    priceId === 'price_1SrX4iPBeHrQUcEBcCNR77ti' ||
    priceId === 'price_1SrX5JPBeHrQUcEBp36HLtHq'
  ) {
    return 'BASIC'
  }
  if (
    priceId === process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY ||
    priceId === process.env.STRIPE_PRICE_PROFESSIONAL_ANNUAL ||
    priceId === 'price_1SpKkkPBeHrQUcEBikiRqBhP' ||
    priceId === 'price_1SpKu0PBeHrQUcEBLqvi496k'
  ) {
    return 'PROFESSIONAL'
  }
  if (
    priceId === process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY ||
    priceId === process.env.STRIPE_PRICE_ENTERPRISE_ANNUAL ||
    priceId === 'price_1SpKx6PBeHrQUcEB8KezJ9dx' ||
    priceId === 'price_1SpKxuPBeHrQUcEB9Ytzoo2N'
  ) {
    return 'ENTERPRISE'
  }
  console.warn('⚠️ Unknown price ID:', priceId)
  return 'PROFESSIONAL'
}

function tierRank(tier: 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE' | 'NONE'): number {
  if (tier === 'ENTERPRISE') return 3
  if (tier === 'PROFESSIONAL') return 2
  if (tier === 'BASIC') return 1
  return 0
}

function statusRank(status: Stripe.Subscription.Status): number {
  if (status === 'active') return 4
  if (status === 'trialing') return 3
  if (status === 'past_due') return 2
  if (status === 'unpaid') return 1
  if (status === 'incomplete') return 0
  return -1
}

function pickBestSubscription(subs: Stripe.ApiList<Stripe.Subscription>): Stripe.Subscription | null {
  const list = subs?.data || []
  if (!list.length) return null

  const scored = list
    .map((s) => {
      const priceId = s.items?.data?.[0]?.price?.id || null
      const t = priceId ? getTierFromPriceId(priceId) : 'NONE'
      return {
        sub: s,
        scoreStatus: statusRank(s.status),
        scoreTier: tierRank(t),
        created: s.created || 0,
        priceId,
        tier: t,
      }
    })
    .sort((a, b) => {
      if (b.scoreStatus !== a.scoreStatus) return b.scoreStatus - a.scoreStatus
      if (b.scoreTier !== a.scoreTier) return b.scoreTier - a.scoreTier
      return b.created - a.created
    })

  const best = scored[0]
  const actives = scored.filter((x) => x.sub.status === 'active' || x.sub.status === 'trialing')
  if (actives.length > 1) {
    console.warn('⚠️ Multiple active subscriptions:', actives.map((x) => ({ id: x.sub.id, tier: x.tier })))
  }

  return best.sub
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const email = session.user.email
    const user = (await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
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
      },
    })) as DbUser | null

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let shouldUpdateUser = false
    const updates: Record<string, any> = {}

    let bestSub: Stripe.Subscription | null = null
    if (user.stripeCustomerId) {
      try {
        console.log(`🔎 Listing subscriptions for ${user.stripeCustomerId}`)
        const subs = await stripe.subscriptions.list({
          customer: user.stripeCustomerId,
          status: 'all',
          limit: 20,
        })
        
        bestSub = pickBestSubscription(subs)
        
        if (bestSub) {
          console.log('✅ Best subscription:', bestSub.id, bestSub.status)
          
          if (bestSub.id !== user.stripeSubscriptionId) {
            updates.stripeSubscriptionId = bestSub.id
            shouldUpdateUser = true
          }

          updates.subscriptionStatus = bestSub.status
          updates.cancelAtPeriodEnd = bestSub.cancel_at_period_end
          
          const currentPeriodEnd = (bestSub as any).current_period_end as number | undefined
          if (typeof currentPeriodEnd === 'number') {
            updates.stripeCurrentPeriodEnd = new Date(currentPeriodEnd * 1000)
          }

          const priceId = bestSub.items?.data?.[0]?.price?.id || null
          if (priceId) {
            const tier = getTierFromPriceId(priceId)
            updates.stripePriceId = priceId
            updates.planTier = tier
            updates.plan = tier.toLowerCase()
            
            const interval = bestSub.items?.data?.[0]?.price?.recurring?.interval || null
            const newBillingInterval = normalizeBillingIntervalToDb(interval)
            if (newBillingInterval) updates.billingInterval = newBillingInterval

            if (priceId !== user.stripePriceId) shouldUpdateUser = true
            if (tier !== (user.planTier || '').toUpperCase()) shouldUpdateUser = true
            if (newBillingInterval && user.billingInterval !== newBillingInterval) shouldUpdateUser = true
          }

          if (updates.subscriptionStatus !== user.subscriptionStatus) shouldUpdateUser = true
          if (updates.cancelAtPeriodEnd !== user.cancelAtPeriodEnd) shouldUpdateUser = true
        }
      } catch (err: any) {
        console.error('❌ Failed to list subscriptions:', err?.message)
      }
    }

    const subscriptionIdToFetch = (bestSub?.id as string | undefined) || user.stripeSubscriptionId || undefined

    if (subscriptionIdToFetch) {
      try {
        console.log(`🔄 Fetching subscription: ${subscriptionIdToFetch}`)
        const subscription = await stripe.subscriptions.retrieve(subscriptionIdToFetch)
        
        const priceId = subscription.items.data[0]?.price?.id || null
        if (priceId) {
          const tier = getTierFromPriceId(priceId)
          if (tier !== (updates.planTier || user.planTier || '').toUpperCase()) {
            updates.planTier = tier
            updates.plan = tier.toLowerCase()
            shouldUpdateUser = true
          }

          if (priceId !== (updates.stripePriceId || user.stripePriceId)) {
            updates.stripePriceId = priceId
            shouldUpdateUser = true
          }

          const stripeInterval = subscription.items.data[0]?.price?.recurring?.interval
          const newBillingInterval = normalizeBillingIntervalToDb(stripeInterval)
          if (newBillingInterval && (updates.billingInterval || user.billingInterval) !== newBillingInterval) {
            updates.billingInterval = newBillingInterval
            shouldUpdateUser = true
          }
        }

        if (subscription.status !== (updates.subscriptionStatus || user.subscriptionStatus)) {
          updates.subscriptionStatus = subscription.status
          shouldUpdateUser = true
        }

        const currentPeriodEnd = (subscription as any).current_period_end as number | undefined
        const stripePeriodEnd = typeof currentPeriodEnd === 'number' ? new Date(currentPeriodEnd * 1000) : null
        const dbPeriodEnd = updates.stripeCurrentPeriodEnd || user.stripeCurrentPeriodEnd || user.currentPeriodEnd
        const dbTime = dbPeriodEnd ? new Date(dbPeriodEnd).getTime() : null
        const stripeTime = stripePeriodEnd ? stripePeriodEnd.getTime() : null

        if (stripeTime !== dbTime) {
          updates.stripeCurrentPeriodEnd = stripePeriodEnd
          shouldUpdateUser = true
        }

        if (subscription.cancel_at_period_end !== (updates.cancelAtPeriodEnd ?? user.cancelAtPeriodEnd)) {
          updates.cancelAtPeriodEnd = subscription.cancel_at_period_end
          shouldUpdateUser = true
        }
      } catch (error: any) {
        console.error('❌ Error fetching subscription:', error?.message)
      }
    }

    if (shouldUpdateUser) {
      console.log('🔄 Updating user from Stripe:', updates)
      await prisma.user.update({
        where: { email },
        data: updates,
      })
    }

    const finalUser = (await prisma.user.findUnique({
      where: { email },
      select: {
        planTier: true,
        plan: true,
        subscriptionStatus: true,
        billingInterval: true,
        stripeSubscriptionId: true,
        stripeCustomerId: true,
        stripeCurrentPeriodEnd: true,
        currentPeriodEnd: true,
        cancelAtPeriodEnd: true,
        trialActive: true,
        trialExpiresAt: true,
        trialEndsAt: true,
      },
    })) as any

    // TRIAL CHECK
    const now = new Date()
    const trialExpiryDate = finalUser?.trialExpiresAt || user.trialExpiresAt || finalUser?.trialEndsAt || user.trialEndsAt
    const trialIsActive = Boolean(
      (finalUser?.trialActive ?? user.trialActive) && 
      trialExpiryDate && 
      new Date(trialExpiryDate) > now
    )

    console.log('🔍 Trial check:', {
      trialActive: finalUser?.trialActive ?? user.trialActive,
      trialExpiresAt: trialExpiryDate,
      trialIsActive,
    })

    // HAS SUBSCRIPTION
    const statusRaw = finalUser?.subscriptionStatus || user.subscriptionStatus || user.planStatus || null
    const statusLower = String(statusRaw || '').toLowerCase()
    
    const hasStripeSubscription =
      Boolean(finalUser?.stripeSubscriptionId) &&
      (statusLower === 'active' || statusLower === 'trialing' || statusLower === 'trial' || statusLower === 'past_due')

    const hasSubscription = hasStripeSubscription || trialIsActive

    console.log('🔍 Subscription check:', { hasStripeSubscription, trialIsActive, hasSubscription })

    // TIER
    let tier = finalUser?.planTier || user.planTier || user.plan || 'NONE'
    if (String(tier).toLowerCase() === 'free' || String(tier).toLowerCase() === 'trial') {
      tier = 'NONE'
    }

    if (trialIsActive && (tier === 'NONE' || !tier)) {
      tier = 'BASIC'
      console.log('✅ Setting tier to BASIC for trial user')
    }

    tier = String(tier).toUpperCase()

    // STATUS
    let status = statusRaw
    if (trialIsActive && !hasStripeSubscription) {
      status = 'trialing'
      console.log('✅ Setting status to trialing for trial user')
    }

    const interval = normalizeInterval(finalUser?.billingInterval || user.billingInterval)

    let currentPeriodEnd: string | null = null
    if (trialIsActive && !finalUser?.stripeCurrentPeriodEnd) {
      currentPeriodEnd = new Date(trialExpiryDate!).toISOString()
    } else {
      const periodEndDate: Date | null =
        finalUser?.stripeCurrentPeriodEnd || finalUser?.currentPeriodEnd || user.stripeCurrentPeriodEnd || user.currentPeriodEnd
      if (periodEndDate) currentPeriodEnd = new Date(periodEndDate).toISOString()
    }

    console.log('✅ Final data:', { email, tier, status, hasSubscription, trialIsActive })

    return NextResponse.json({
      tier,
      interval,
      status,
      currentPeriodEnd,
      cancelAtPeriodEnd: finalUser?.cancelAtPeriodEnd || false,
      hasSubscription,
      subscriptionId: finalUser?.stripeSubscriptionId || null,
      stripeSubscriptionId: finalUser?.stripeSubscriptionId || null,
      stripeCustomerId: finalUser?.stripeCustomerId || null,
    })
  } catch (error: any) {
    console.error('❌ Error fetching user plan:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user plan', details: error.message },
      { status: 500 }
    )
  }
}
