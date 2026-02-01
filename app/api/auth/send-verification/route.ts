import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import crypto from 'crypto'
import { Resend } from 'resend'

export const runtime = 'nodejs'

const sql = neon(process.env.DATABASE_URL!)
const resend = new Resend(process.env.RESEND_API_KEY!)

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
    if (!email) return jsonError('Email is required', 400)

    const users = await sql`
      SELECT id, first_name, email_verified
      FROM users
      WHERE email = ${email}
      LIMIT 1
    `
    if (!users.length) return jsonError('User not found', 404)

    const user = users[0]

    // If email_verified is not null, user is already verified
    if (user.email_verified) {
      return NextResponse.json({ ok: true, alreadyVerified: true })
    }

    const rawToken = crypto.randomBytes(32).toString('hex')
    const tokenHash = sha256(rawToken)
    const tokenId = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await sql`
      INSERT INTO email_verification_tokens (id, user_id, token_hash, expires_at)
      VALUES (${tokenId}, ${user.id}, ${tokenHash}, ${expiresAt.toISOString()})
    `

    const appUrl = process.env.APP_URL || 'http://localhost:3000'
    const verifyUrl = `${appUrl}/api/auth/verify-email?token=${rawToken}`
    const from = process.env.EMAIL_FROM || 'Precise GovCon <no-reply@precisegovcon.com>'
    const name = String(user.first_name || 'there')

    await resend.emails.send({
      from,
      to: email,
      subject: 'Verify your email for Precise GovCon',
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6">
          <h2>Hello ${name} 👋</h2>
          <p>Please verify your email to activate your account:</p>
          <p>
            <a href="${verifyUrl}"
               style="display:inline-block;padding:12px 18px;border-radius:10px;background:#0ea5e9;color:#ffffff;text-decoration:none;font-weight:600">
              Verify Email
            </a>
          </p>
          <p style="color:#64748b;font-size:12px">
            This link expires in 1 hour. If you didn't create an account, you can ignore this email.
          </p>
        </div>
      `,
    })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('send-verification error:', err)
    return jsonError('Failed to send verification email', 500, err?.message)
  }
}