import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { getToken } from 'next-auth/jwt'

export const runtime = 'nodejs'

const sql = neon(process.env.DATABASE_URL!)

function isActiveUser(u: any) {
  const tier = String(u?.plan_tier || u?.plan || 'free').toLowerCase()
  const status = String(u?.plan_status || 'inactive').toLowerCase()

  const trial_active = !!u?.trial_active
  const trialExpires = u?.trial_expires_at ? new Date(u.trial_expires_at).getTime() : null

  const periodEnd = u?.current_period_end ? new Date(u.current_period_end).getTime() : null
  const now = Date.now()

  const paidTier = tier === 'professional' || tier === 'enterprise'
  const statusOk = status === 'active' || status === 'trialing'
  const timeOk = periodEnd ? periodEnd > now : true // webhook may not have filled it yet

  const trialOk = trial_active && (!trialExpires || trialExpires > now)

  return (paidTier && statusOk && timeOk) || trialOk
}

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    const email = String((token as any)?.email || '').toLowerCase().trim()

    if (!email) {
      return NextResponse.json({ authenticated: false, active: false })
    }

    const rows = await sql`
      SELECT
        plan_tier,
        plan_status,
        current_period_end,
        trial_active,
        trial_expires_at,
        stripe_customer_id,
        stripe_subscription_id
      FROM users
      WHERE lower(email) = ${email}
      LIMIT 1
    `

    const user = rows?.[0]
    const active = isActiveUser(user)

    return NextResponse.json({
      authenticated: true,
      active,
      plan_tier: user?.plan_tier || 'free',
      plan_status: user?.plan_status || null,
      current_period_end: user?.current_period_end || null,
      trial_active: !!user?.trial_active,
      trial_expires_at: user?.trial_expires_at || null,
      stripe_customer_id: user?.stripe_customer_id || null,
      stripe_subscription_id: user?.stripe_subscription_id || null,
    })
  } catch (err: any) {
    console.error('âŒ [ACCESS STATUS] error:', err?.message || err)
    return NextResponse.json({ authenticated: false, active: false, error: 'status_failed' }, { status: 500 })
  }
}
