import { NextRequest } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { getToken } from 'next-auth/jwt'

const sql = neon(process.env.DATABASE_URL!)

export type AccessGate =
  | {
      ok: true
      user: {
        id: string
        email: string
        subscription_tier: string | null
        subscription_status: string | null
        trial_end_date: string | null
        trial_active: boolean | null
      }
    }
  | { ok: false; status: number; code: string; error: string }

export async function requireActiveAccess(req: NextRequest): Promise<AccessGate> {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const email = String((token as any)?.email || '').toLowerCase()

  if (!email) {
    return { 
      ok: false, 
      status: 401, 
      code: 'unauthenticated', 
      error: 'Please sign in.' 
    }
  }

  const rows = await sql`
    SELECT 
      id, 
      email, 
      subscription_tier, 
      subscription_status, 
      trial_end_date,
      trial_active,
      status
    FROM users
    WHERE lower(email) = ${email}
    LIMIT 1
  `

  if (!rows.length) {
    return { 
      ok: false, 
      status: 401, 
      code: 'no_account', 
      error: 'Account not found.' 
    }
  }

  const u = rows[0] as any
  
  // Check if account is disabled
  const accountStatus = u.status ?? 'active'
  if (accountStatus !== 'active') {
    return { 
      ok: false, 
      status: 403, 
      code: 'disabled', 
      error: 'Account is disabled.' 
    }
  }

  // Check subscription tier
  const tier = u.subscription_tier ?? 'trial'
  
  // If on trial, check if trial is active and not expired
  if (tier === 'trial') {
    const isTrialActive = u.trial_active ?? false
    const trialEndDate = u.trial_end_date ? new Date(u.trial_end_date).getTime() : NaN

    // If trial is not active or missing end date, deny access
    if (!isTrialActive) {
      return {
        ok: false,
        status: 403,
        code: 'trial_inactive',
        error: 'Trial is not active. Please upgrade to continue.',
      }
    }

    // If trial end date is missing, deny access
    if (Number.isNaN(trialEndDate)) {
      return {
        ok: false,
        status: 403,
        code: 'trial_not_initialized',
        error: 'Trial not properly initialized. Please contact support.',
      }
    }

    // If trial has expired, deny access
    if (trialEndDate <= Date.now()) {
      return {
        ok: false,
        status: 403,
        code: 'trial_expired',
        error: 'Your 7-day trial has ended. Please upgrade to regain access.',
      }
    }
  }
  
  // If on professional or enterprise, check subscription status
  if (tier === 'professional' || tier === 'enterprise') {
    const subStatus = u.subscription_status ?? 'active'
    if (subStatus !== 'active') {
      return {
        ok: false,
        status: 403,
        code: 'subscription_inactive',
        error: 'Your subscription is not active. Please update your billing.',
      }
    }
  }

  return { 
    ok: true, 
    user: {
      id: u.id,
      email: u.email,
      subscription_tier: u.subscription_tier,
      subscription_status: u.subscription_status,
      trial_end_date: u.trial_end_date,
      trial_active: u.trial_active
    }
  }
}