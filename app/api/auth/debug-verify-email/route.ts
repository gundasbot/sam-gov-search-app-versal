// Development-only endpoint to verify an email for testing OTP
// This bypasses email verification for easier testing
// REMOVE in production

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

    // Find user
    const users = await sql`
      SELECT id FROM users WHERE email = ${email} LIMIT 1
    ` as any[]

    if (!users.length) {
      return NextResponse.json(
        { error: 'User not found - create account first' },
        { status: 404 }
      )
    }

    const userId = users[0].id
    const now = new Date()

    // Verify the email
    await sql`
      UPDATE users
      SET email_verified = ${now.toISOString()},
          is_active = true,
          updated_at = ${now.toISOString()}
      WHERE id = ${userId}
    `

    return NextResponse.json({
      ok: true,
      message: 'Email verified successfully for testing',
      email,
      user_id: userId,
      verified_at: now.toISOString(),
    })
  } catch (err: any) {
    console.error('debug-verify-email error:', err)
    return NextResponse.json(
      { error: 'Failed to verify email', details: err?.message },
      { status: 500 }
    )
  }
}
