// app/api/trial/activate/route.ts
// NEW FILE - Activates trial for authenticated users without Stripe

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

type Tier = 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE'
type BillingInterval = 'MONTHLY' | 'ANNUAL'

function normalizeTier(raw: any): Tier | null {
  const v = String(raw || '').toUpperCase().trim()
  if (v === 'BASIC' || v === 'PROFESSIONAL' || v === 'ENTERPRISE') return v as Tier
  return null
}

function normalizeInterval(raw: any): BillingInterval {
  const v = String(raw || '').toLowerCase().trim()
  return v === 'annual' ? 'ANNUAL' : 'MONTHLY'
}

export async function POST(req: NextRequest) {
  try {
    console.log('🎫 [TRIAL ACTIVATE] POST /api/trial/activate called')

    // 1. Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'You must be signed in to start a trial' },
        { status: 401 }
      )
    }

    const email = session.user.email
    console.log('👤 User:', email)

    // 2. Parse request
    const body = await req.json()
    const tier = normalizeTier(body?.tier)
    const billingInterval = normalizeInterval(body?.billingInterval)

    if (!tier) {
      return NextResponse.json(
        { error: 'Invalid tier. Must be BASIC, PROFESSIONAL, or ENTERPRISE.' },
        { status: 400 }
      )
    }

    console.log('📋 Activating trial:', { tier, billingInterval })

    // 3. Find user
    const user = await prisma.users.findUnique({
      where: { email },
      select: { 
        id: true,
        email: true,
        trial_active: true,
        trial_expires_at: true,
        plan_tier: true,
        stripe_subscription_id: true,
        email_verified: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // 4. Check if email is verified
    if (!user.email_verified) {
      return NextResponse.json(
        { error: 'Please verify your email before starting a trial' },
        { status: 403 }
      )
    }

    // 5. Check if user already has active subscription
    if (user.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'You already have an active subscription. To change plans, visit your account page.' },
        { status: 400 }
      )
    }

    // 6. Check if trial is already active
    if (user.trial_active && user.trial_expires_at) {
      const expiresAt = new Date(user.trial_expires_at)
      if (expiresAt > new Date()) {
        return NextResponse.json({
          success: true,
          message: 'Trial already active',
          tier: user.plan_tier,
          expiresAt: expiresAt.toISOString(),
        })
      }
    }

    // 7. Check if trial was already used
    if (user.trial_active === false && user.trial_expires_at) {
      return NextResponse.json(
        { error: 'Trial already used. Please subscribe to continue.' },
        { status: 400 }
      )
    }

    // 8. Calculate trial end date (7 days from now)
    const now = new Date()
    const trialExpiresAt = new Date(now)
    trialExpiresAt.setDate(trialExpiresAt.getDate() + 7)
    trialExpiresAt.setHours(23, 59, 59, 999) // End of day

    const trialEndsAt = new Date(trialExpiresAt) // For compatibility

    // 9. Activate trial
    await prisma.users.update({
      where: { id: user.id },
      data: {
        plan_tier: tier,
        plan_status: 'TRIALING',
        plan: tier.charAt(0) + tier.slice(1).toLowerCase(), // 'BASIC' → 'Basic'
        trial_active: true,
        trial_started_at: now,
        trial_expires_at: trialExpiresAt,
        trial_ends_at: trialEndsAt, // Compatibility field
        billing_interval: billingInterval,
        is_active: true,
        updated_at: now,
      },
    })

    console.log('✅ Trial activated:', {
      user: email,
      tier,
      billingInterval,
      expiresAt: trialExpiresAt.toISOString(),
    })

    // 10. TODO: Send trial activation email
    // await sendTrialActivationEmail(email, tier, trialExpiresAt)

    return NextResponse.json({
      success: true,
      tier,
      billingInterval,
      trialExpiresAt: trialExpiresAt.toISOString(),
      trialEndsAt: trialEndsAt.toISOString(),
      message: `Your ${tier} trial has been activated! Trial ends ${trialExpiresAt.toLocaleDateString()}.`,
    })

  } catch (error: any) {
    console.error('❌ [TRIAL ACTIVATE] Error:', error)
    return NextResponse.json(
      { error: 'Failed to activate trial', details: error?.message },
      { status: 500 }
    )
  }
}