import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { encode } from 'next-auth/jwt'

export const runtime = 'nodejs'

const sql = neon(process.env.DATABASE_URL!)

function sha256(s: string) {
  return crypto.createHash('sha256').update(s).digest('hex')
}

function jsonError(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as any))
    const email = String(body.email ?? '').trim().toLowerCase()
    const code = String(body.code ?? '').trim()

    if (!email || !code) {
      return jsonError('Email and code are required', 400)
    }

    // Validate code format
    if (!/^\d{6}$/.test(code)) {
      return jsonError('Invalid code format', 400)
    }

    const codeHash = sha256(code)
    const now = new Date()

    // Find and validate OTP code
    const otpRecords = await sql`
      SELECT id, expires_at, used_at
      FROM otp_codes
      WHERE email = ${email} AND code_hash = ${codeHash}
      LIMIT 1
    ` as any[]

    if (!otpRecords.length) {
      return jsonError('Invalid code', 400)
    }

    const otpRecord = otpRecords[0]

    // Check if already used
    if (otpRecord.used_at) {
      return jsonError('Code already used', 400)
    }

    // Check if expired
    if (new Date(otpRecord.expires_at) < now) {
      // Clean up expired code
      await sql`
        DELETE FROM otp_codes
        WHERE id = ${otpRecord.id}
      `
      return jsonError('Code expired', 400)
    }

    // Find user
    const users = await prisma.users.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        first_name: true,
        last_name: true,
        email_verified: true,
        plan_tier: true,
      },
    })

    if (!users) {
      return jsonError('Account not found', 404)
    }

    // Email must be verified
    if (!users.email_verified) {
      return jsonError('Email_Not_Verified', 400)
    }

    // Mark OTP as used (non-critical if fails)
    await sql`
      UPDATE otp_codes
      SET used_at = ${now.toISOString()}
      WHERE id = ${otpRecord.id}
    `.catch(() => {})

    // Generate auto-login token for NextAuth credentials flow
    const secret = process.env.NEXTAUTH_SECRET!
    const autoLoginTokenRaw = crypto.randomBytes(32).toString('hex')
    const autoLoginTokenHash = sha256(autoLoginTokenRaw)
    const autoLoginTokenId = crypto.randomUUID()
    const autoLoginExpiry = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes to use it

    await prisma.auto_login_tokens.create({
      data: {
        id: autoLoginTokenId,
        user_id: users.id,
        token_hash: autoLoginTokenHash,
        expires_at: autoLoginExpiry,
      },
    })

    // Return the raw token (frontend will use this to login)
    const userName = users.name || `${users.first_name || ''} ${users.last_name || ''}`.trim() || null

    return NextResponse.json({
      ok: true,
      autoLoginToken: autoLoginTokenRaw,
      user: {
        id: users.id,
        email: users.email,
        name: userName,
      },
    })
  } catch (err: any) {
    console.error('verify-otp error:', err)
    return jsonError('Verification failed', 500, err?.message)
  }
}
