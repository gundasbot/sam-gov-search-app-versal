// Debug endpoint to check email status in database
// ONLY for development/testing - remove in production

import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

export async function POST(req: NextRequest) {
  // Check environment - only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  try {
    const body = await req.json().catch(() => ({} as any))
    const email = String(body.email ?? '').trim().toLowerCase()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Check if user exists
    const users = await sql`
      SELECT id, first_name, email, email_verified, created_at, is_active
      FROM users
      WHERE email = ${email}
      LIMIT 1
    ` as any[]

    if (!users.length) {
      return NextResponse.json({
        found: false,
        email,
        message: 'Email not found in database - user needs to sign up first',
      })
    }

    const user = users[0]

    // Check if email is verified
    const isVerified = user.email_verified !== null && user.email_verified !== undefined

    return NextResponse.json({
      found: true,
      email: user.email,
      id: user.id,
      first_name: user.first_name,
      email_verified: isVerified,
      email_verified_at: user.email_verified || null,
      is_active: user.is_active,
      created_at: user.created_at,
      can_use_otp: isVerified,
      message: isVerified
        ? 'Email verified - OTP should work'
        : 'Email exists but NOT verified - user needs to verify email first via verification link',
    })
  } catch (err: any) {
    console.error('debug-check-email error:', err)
    return NextResponse.json(
      { error: 'Failed to check email', details: err?.message },
      { status: 500 }
    )
  }
}
