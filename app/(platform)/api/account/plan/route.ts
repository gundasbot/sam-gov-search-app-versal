// app/api/account/plan/route.ts 

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'
import { randomUUID } from 'crypto'

export const dynamic = 'force-dynamic'

// Fixed: Use valid Stripe API version
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
})

type DbUser = {
  id: string
  email: string
  name: string | null
  plan: string | null
  plan_tier: string | null
  subscription_tier: string | null
  subscription_plan: string | null
  plan_status: string | null
  billing_interval: string | null
  subscription_status: string | null
  subscriptions: any
  stripe_current_period_end: Date | null
  cancel_at_period_end: boolean | null
  stripe_subscription_id: string | null
  stripe_customer_id: string | null
  stripe_price_id: string | null
  current_period_end: Date | null
  trial_expires_at: Date | null
  trial_ends_at: Date | null
  trial_active: boolean | null
}

function isNoSuchCustomerError(err: unknown): boolean {
  const e = err as any
  return e?.code === 'resource_missing' && String(e?.message || '').toLowerCase().includes('no such customer')
}

function isNoSuchSubscriptionError(err: unknown): boolean {
  const e = err as any
  return e?.code === 'resource_missing' && String(e?.message || '').toLowerCase().includes('no such subscription')
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

function normalizeTier(input: any): 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE' | 'NONE' {
  const raw = String(input || '').trim().toUpperCase()
  if (!raw || raw === 'NONE' || raw === 'FREE' || raw === 'TRIAL') return 'NONE'
  if (raw.includes('ENTERPRISE')) return 'ENTERPRISE'
  if (raw.includes('PROFESSIONAL') || raw.includes(' PRO ') || raw === 'PRO') return 'PROFESSIONAL'
  if (raw.includes('BASIC')) return 'BASIC'
  if (raw === 'BASIC') return 'BASIC'
  if (raw === 'PROFESSIONAL' || raw === 'PRO') return 'PROFESSIONAL'
  if (raw === 'ENTERPRISE' || raw === 'ENT') return 'ENTERPRISE'
  return 'NONE'
}

function normalizeStatus(input: any): string {
  return String(input || '').trim().toLowerCase()
}

function pickFirst(...values: any[]): any {
  for (const v of values) {
    if (v !== undefined && v !== null && String(v).trim() !== '') return v
  }
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
  console.log('🔵 /api/account/plan called')
  
  try {
    const session = await getServerSession(authOptions)
    console.log('🔍 Session check:', { hasSession: !!session, email: session?.user?.email })
    
    if (!session?.user?.email) {
      console.log('❌ Unauthorized - no session or email')
      return NextResponse.json({ 
        error: 'Unauthorized',
        tier: 'NONE',
        hasSubscription: false,
        status: 'inactive'
      }, { status: 401 })
    }

    const email = session.user.email
    console.log('📧 Fetching user:', email)
    
    let user = (await prisma.users.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
        plan_tier: true,
        subscription_tier: true,
        subscription_plan: true,
        plan_status: true,
        billing_interval: true,
        subscription_status: true,
        subscriptions: true,
        stripe_current_period_end: true,
        cancel_at_period_end: true,
        stripe_subscription_id: true,
        stripe_customer_id: true,
        stripe_price_id: true,
        current_period_end: true,
        trial_expires_at: true,
        trial_ends_at: true,
        trial_active: true,
      },
    })) as DbUser | null

    // AUTO-CREATE USER IF MISSING (fixes the issue after prisma push --force)
    if (!user) {
      console.log('⚠️ User not found in database, creating new user record for:', email)
      try {
        const now = new Date()
        user = await prisma.users.create({
          data: {
            id: randomUUID(),          // ✅ REQUIRED by your Prisma schema
            email,
            name: session.user.name || null,
            email_verified: now,
            updated_at: now,           // ✅ REQUIRED by your Prisma schema
          },
          select: {
            id: true,
            email: true,
            name: true,
            plan: true,
            plan_tier: true,
            subscription_tier: true,
            subscription_plan: true,
            plan_status: true,
            billing_interval: true,
            subscription_status: true,
            subscriptions: true,
            stripe_current_period_end: true,
            cancel_at_period_end: true,
            stripe_subscription_id: true,
            stripe_customer_id: true,
            stripe_price_id: true,
            current_period_end: true,
            trial_expires_at: true,
            trial_ends_at: true,
            trial_active: true,
          },
        }) as DbUser
        console.log('✅ Created new user:', email)
      } catch (createError: any) {
        console.error('❌ Error creating user:', createError.message)
        return NextResponse.json({ 
          error: 'Failed to create user', 
          details: createError.message,
          tier: 'NONE',
          hasSubscription: false,
          status: 'inactive'
        }, { status: 500 })
      }
    }

    console.log('👤 User data:', { 
      email: user.email, 
      tier: user.plan_tier, 
      status: user.subscription_status,
      stripe_customer_id: user.stripe_customer_id,
      stripe_subscription_id: user.stripe_subscription_id
    })

    let shouldUpdateUser = false
    const updates: Record<string, any> = {}
    let liveStripeSubscriptionId: string | null = null
    let liveStripeStatus: string | null = null
    let liveStripeTier: 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE' | 'NONE' = 'NONE'
    let liveStripeInterval: 'month' | 'year' | null = null
    let liveStripeCurrentPeriodEnd: string | null = null
    let liveStripeCancelAtPeriodEnd: boolean | null = null

    let bestSub: Stripe.Subscription | null = null
    if (user.stripe_customer_id) {
      try {
        console.log(`🔎 Listing subscriptions for ${user.stripe_customer_id}`)
        const subs = await stripe.subscriptions.list({
          customer: user.stripe_customer_id,
          status: 'all',
          limit: 20,
        })
        
        bestSub = pickBestSubscription(subs)
        
        if (bestSub) {
          console.log('✅ Best subscription:', bestSub.id, bestSub.status)
          liveStripeSubscriptionId = bestSub.id
          liveStripeStatus = bestSub.status
          liveStripeCancelAtPeriodEnd = Boolean(bestSub.cancel_at_period_end)
          
          if (bestSub.id !== user.stripe_subscription_id) {
            updates.stripe_subscription_id = bestSub.id
            shouldUpdateUser = true
          }

          updates.subscription_status = bestSub.status
          updates.cancel_at_period_end = bestSub.cancel_at_period_end
          
          const current_period_end = ((bestSub as any).current_period_end as number | undefined) ?? ((bestSub as any).currentPeriodEnd as number | undefined)
          if (typeof current_period_end === 'number') {
            const d = new Date(current_period_end * 1000)
            updates.stripe_current_period_end = d
            liveStripeCurrentPeriodEnd = d.toISOString()
          }

          const priceId = bestSub.items?.data?.[0]?.price?.id || null
          if (priceId) {
            const tier = getTierFromPriceId(priceId)
            liveStripeTier = tier
            updates.stripe_price_id = priceId
            updates.plan_tier = tier
            updates.plan = tier.toLowerCase()
            
            const interval = bestSub.items?.data?.[0]?.price?.recurring?.interval || null
            liveStripeInterval = normalizeInterval(interval)
            const newBillingInterval = normalizeBillingIntervalToDb(interval)
            if (newBillingInterval) updates.billing_interval = newBillingInterval

            if (priceId !== user.stripe_price_id) shouldUpdateUser = true
            if (tier !== (user.plan_tier || '').toUpperCase()) shouldUpdateUser = true
            if (newBillingInterval && user.billing_interval !== newBillingInterval) shouldUpdateUser = true
          }

          if (updates.subscription_status !== user.subscription_status) shouldUpdateUser = true
          if (updates.cancel_at_period_end !== user.cancel_at_period_end) shouldUpdateUser = true
        }
      } catch (err: any) {
        console.error('❌ Failed to list subscriptions:', err?.message)
        if (isNoSuchCustomerError(err)) {
          updates.stripe_customer_id = null
          updates.stripe_subscription_id = null
          shouldUpdateUser = true
        }
      }
    }

    const subscriptionIdToFetch = (bestSub?.id as string | undefined) || user.stripe_subscription_id || undefined

    if (subscriptionIdToFetch) {
      try {
        console.log(`🔄 Fetching subscription: ${subscriptionIdToFetch}`)
        const subscription = await stripe.subscriptions.retrieve(subscriptionIdToFetch)
        
        const priceId = subscription.items.data[0]?.price?.id || null
        if (priceId) {
          const tier = getTierFromPriceId(priceId)
          liveStripeTier = tier
          if (tier !== (updates.plan_tier || user.plan_tier || '').toUpperCase()) {
            updates.plan_tier = tier
            updates.plan = tier.toLowerCase()
            shouldUpdateUser = true
          }

          if (priceId !== (updates.stripe_price_id || user.stripe_price_id)) {
            updates.stripe_price_id = priceId
            shouldUpdateUser = true
          }

          const stripeInterval = subscription.items.data[0]?.price?.recurring?.interval
          const newBillingInterval = normalizeBillingIntervalToDb(stripeInterval)
          liveStripeInterval = normalizeInterval(stripeInterval)
          if (newBillingInterval && (updates.billing_interval || user.billing_interval) !== newBillingInterval) {
            updates.billing_interval = newBillingInterval
            shouldUpdateUser = true
          }
        }

        if (subscription.status !== (updates.subscription_status || user.subscription_status)) {
          updates.subscription_status = subscription.status
          shouldUpdateUser = true
        }
        liveStripeStatus = subscription.status
        liveStripeSubscriptionId = subscription.id
        liveStripeCancelAtPeriodEnd = Boolean(subscription.cancel_at_period_end)

        const current_period_end = ((subscription as any).current_period_end as number | undefined) ?? ((subscription as any).currentPeriodEnd as number | undefined)
        const stripePeriodEnd = typeof current_period_end === 'number' ? new Date(current_period_end * 1000) : null
        const dbPeriodEnd = updates.stripe_current_period_end || user.current_period_end
        const dbTime = dbPeriodEnd ? new Date(dbPeriodEnd).getTime() : null
        const stripeTime = stripePeriodEnd ? stripePeriodEnd.getTime() : null

        if (stripeTime !== dbTime) {
          updates.stripe_current_period_end = stripePeriodEnd
          shouldUpdateUser = true
        }
        if (stripePeriodEnd) liveStripeCurrentPeriodEnd = stripePeriodEnd.toISOString()

        if (subscription.cancel_at_period_end !== (updates.cancel_at_period_end ?? user.cancel_at_period_end)) {
          updates.cancel_at_period_end = subscription.cancel_at_period_end
          shouldUpdateUser = true
        }
      } catch (error: any) {
        console.error('❌ Error fetching subscription:', error?.message)
        if (isNoSuchSubscriptionError(error)) {
          updates.stripe_subscription_id = null
          shouldUpdateUser = true
        }
      }
    }

    if (shouldUpdateUser) {
      console.log('🔄 Updating user from Stripe:', updates)
      await prisma.users.update({
        where: { email },
        data: updates,
      })
    }

    const finalUser = (await prisma.users.findUnique({
      where: { email },
      select: {
        plan_tier: true,
        plan: true,
        subscription_tier: true,
        subscription_plan: true,
        subscription_status: true,
        plan_status: true,
        billing_interval: true,
        subscriptions: true,
        stripe_price_id: true,
        stripe_subscription_id: true,
        stripe_customer_id: true,
        stripe_current_period_end: true,
        current_period_end: true,
        cancel_at_period_end: true,
        trial_active: true,
        trial_expires_at: true,
        trial_ends_at: true,
      },
    })) as any

    // TRIAL CHECK
    const now = new Date()
    const trialExpiryDate = finalUser?.trial_expires_at || user.trial_expires_at || finalUser?.trial_ends_at || user.trial_ends_at
    const trialIsActive = Boolean(
      (finalUser?.trial_active ?? user.trial_active) && 
      trialExpiryDate && 
      new Date(trialExpiryDate) > now
    )

    console.log('🔍 Trial check:', {
      trial_active: finalUser?.trial_active ?? user.trial_active,
      trial_expires_at: trialExpiryDate,
      trialIsActive,
    })

    // HAS SUBSCRIPTION
    const jsonSub = (finalUser?.subscriptions && typeof finalUser.subscriptions === 'object') ? finalUser.subscriptions :
      (user.subscriptions && typeof user.subscriptions === 'object' ? user.subscriptions : null)

    const manualTierFromJson = pickFirst(
      jsonSub?.adminOverride?.plan_tier,
      jsonSub?.adminOverride?.planTier,
      jsonSub?.admin?.plan_tier,
      jsonSub?.admin?.planTier,
      jsonSub?.override?.plan_tier,
      jsonSub?.override?.planTier,
      jsonSub?.override?.tier,
      jsonSub?.plan_tier,
      jsonSub?.planTier,
      jsonSub?.subscription_tier,
      jsonSub?.subscriptionTier,
      jsonSub?.plan?.tier,
      jsonSub?.tier,
    )

    const manualStatusFromJson = pickFirst(
      jsonSub?.adminOverride?.plan_status,
      jsonSub?.adminOverride?.planStatus,
      jsonSub?.admin?.plan_status,
      jsonSub?.admin?.planStatus,
      jsonSub?.override?.plan_status,
      jsonSub?.override?.planStatus,
      jsonSub?.override?.status,
      jsonSub?.plan_status,
      jsonSub?.planStatus,
      jsonSub?.subscription_status,
      jsonSub?.subscriptionStatus,
      jsonSub?.plan?.status,
      jsonSub?.status,
    )

    const statusRaw =
      !finalUser?.stripe_subscription_id
        ? pickFirst(
            liveStripeStatus,
            finalUser?.plan_status,
            finalUser?.subscription_status,
            user.plan_status,
            user.subscription_status,
            manualStatusFromJson,
          )
        : pickFirst(
            liveStripeStatus,
            finalUser?.subscription_status,
            finalUser?.plan_status,
            user.subscription_status,
            user.plan_status,
            manualStatusFromJson,
          )
    const statusLower = normalizeStatus(statusRaw)
    
    const hasStripeSubscription =
      Boolean(liveStripeSubscriptionId || finalUser?.stripe_subscription_id) &&
      (statusLower === 'active' || statusLower === 'trialing' || statusLower === 'trial' || statusLower === 'past_due' || statusLower === 'unpaid')

    const finalUserPriceId = finalUser?.stripe_price_id ?? null
    const userPriceId = user?.stripe_price_id ?? null
    const finalUserPriceTier = finalUserPriceId ? getTierFromPriceId(finalUserPriceId) : 'NONE'
    const userPriceTier = userPriceId ? getTierFromPriceId(userPriceId) : 'NONE'

    const dbAssignedTier =
      liveStripeTier !== 'NONE' ? liveStripeTier :
      normalizeTier(manualTierFromJson) !== 'NONE' ? normalizeTier(manualTierFromJson) :
      normalizeTier(finalUser?.plan_tier) !== 'NONE' ? normalizeTier(finalUser?.plan_tier) :
      normalizeTier(finalUser?.subscription_tier) !== 'NONE' ? normalizeTier(finalUser?.subscription_tier) :
      normalizeTier(finalUser?.subscription_plan) !== 'NONE' ? normalizeTier(finalUser?.subscription_plan) :
      normalizeTier(finalUser?.plan) !== 'NONE' ? normalizeTier(finalUser?.plan) :
      finalUserPriceTier !== 'NONE' ? finalUserPriceTier :
      normalizeTier(user.plan_tier) !== 'NONE' ? normalizeTier(user.plan_tier) :
      normalizeTier(user.subscription_tier) !== 'NONE' ? normalizeTier(user.subscription_tier) :
      normalizeTier(user.subscription_plan) !== 'NONE' ? normalizeTier(user.subscription_plan) :
      normalizeTier(user.plan) !== 'NONE' ? normalizeTier(user.plan) :
      userPriceTier !== 'NONE' ? userPriceTier :
      normalizeTier(jsonSub?.plan_tier) !== 'NONE' ? normalizeTier(jsonSub?.plan_tier) :
      normalizeTier(jsonSub?.subscription_tier) !== 'NONE' ? normalizeTier(jsonSub?.subscription_tier) :
      normalizeTier(jsonSub?.plan?.tier)

    const isManualInactive = ['inactive', 'none', 'canceled', 'cancelled', 'locked', 'pending_verification'].includes(statusLower)

    const hasManualAssignedSubscription =
      dbAssignedTier !== 'NONE' &&
      !finalUser?.stripe_subscription_id &&
      !isManualInactive

    const hasSubscription = hasStripeSubscription || trialIsActive || hasManualAssignedSubscription

    console.log('🔍 Subscription check:', { hasStripeSubscription, trialIsActive, hasSubscription })

    // TIER
    let tier = dbAssignedTier

    if (trialIsActive && (tier === 'NONE' || !tier)) {
      tier = 'BASIC'
      console.log('✅ Setting tier to BASIC for trial user')
    }

    tier = normalizeTier(tier || 'NONE')

    // STATUS
    let status = statusRaw
    if (trialIsActive && !hasStripeSubscription) {
      status = 'trialing'
      console.log('✅ Setting status to trialing for trial user')
    }

    const interval = liveStripeInterval || normalizeInterval(finalUser?.billing_interval || user.billing_interval)

    let current_period_end: string | null = null
    if (trialIsActive && !finalUser?.stripe_current_period_end) {
      current_period_end = new Date(trialExpiryDate!).toISOString()
    } else {
      const periodEndDate: Date | null =
        finalUser?.stripe_current_period_end || finalUser?.current_period_end || user.current_period_end
      if (liveStripeCurrentPeriodEnd) current_period_end = liveStripeCurrentPeriodEnd
      else if (periodEndDate) current_period_end = new Date(periodEndDate).toISOString()
    }

    const responseData = {
      tier,
      interval,
      status,
      current_period_end,
      cancel_at_period_end: (liveStripeCancelAtPeriodEnd ?? finalUser?.cancel_at_period_end) || false,
      hasSubscription,
      is_manual_assigned: hasManualAssignedSubscription,
      subscription_source: hasManualAssignedSubscription ? 'admin_assigned' : (hasStripeSubscription ? 'stripe' : (trialIsActive ? 'trial' : 'none')),
      subscription_id: liveStripeSubscriptionId || finalUser?.stripe_subscription_id || null,
      stripe_subscription_id: liveStripeSubscriptionId || finalUser?.stripe_subscription_id || null,
      stripe_customer_id: finalUser?.stripe_customer_id || null,
    }

    console.log('✅ Returning plan data:', responseData)

    return NextResponse.json(responseData)
  } catch (error: any) {
    console.error('❌ Error in /api/account/plan:', error)
    console.error('Stack trace:', error.stack)
    return NextResponse.json(
      { 
        error: 'Failed to fetch user plan', 
        details: error.message,
        tier: 'NONE',
        hasSubscription: false,
        status: 'inactive'
      },
      { status: 500 }
    )
  }
}
