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

    // Check if user exists and email is verified
    const users = await sql`
      SELECT id, first_name, email_verified
      FROM users
      WHERE email = ${email}
      LIMIT 1
    ` as any[]

    if (!users.length) {
      // Return silent success to prevent account enumeration
      return NextResponse.json({ ok: true })
    }

    const user = users[0]

    // User must have verified their email to use OTP
    if (!user.email_verified) {
      return NextResponse.json({ ok: true })
    }

    // Generate 6-digit code
    const code = crypto.randomInt(100000, 999999).toString()
    const codeHash = sha256(code)
    const otpId = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    // Delete any existing unexpired codes for this email (only keep latest)
    await sql`
      DELETE FROM otp_codes
      WHERE email = ${email} AND used_at IS NULL AND expires_at > NOW()
    `

    // Store OTP code
    await sql`
      INSERT INTO otp_codes (id, email, code_hash, expires_at)
      VALUES (${otpId}, ${email}, ${codeHash}, ${expiresAt.toISOString()})
    `

    const from = process.env.EMAIL_FROM || 'Precise GovCon <no-reply@precisegovcon.com>'
    const name = String(user.first_name || 'there')

    // Send OTP code via email
    try {
      await resend.emails.send({
        from,
        to: email,
        subject: `Your Precise GovCon Sign-In Code: ${code}`,
        html: `
          <div style="font-family:Arial,sans-serif;line-height:1.6;max-width:600px">
            <h2>Sign in to Precise GovCon</h2>
            <p>Hi ${name},</p>
            <p>Your 6-digit sign-in code is:</p>
            <div style="background:#f1f5f9;border-radius:12px;padding:24px;text-align:center;margin:20px 0">
              <p style="font-size:32px;font-weight:900;letter-spacing:8px;margin:0;color:#0ea5e9;font-family:monospace">${code}</p>
            </div>
            <p style="color:#64748b">This code expires in 15 minutes.</p>
            <p style="color:#64748b;font-size:12px">
              If you didn't request this code, you can ignore this email. Your account is secure.
            </p>
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0" />
            <p style="color:#94a3b8;font-size:11px">
              Precise GovCon · Federal Opportunity Intelligence
            </p>
          </div>
        `,
      })
    } catch (emailErr) {
      console.error('Failed to send OTP email:', emailErr)
      // Don't fail the request - code was stored successfully
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('send-otp error:', err)
    // Return silent success to prevent account enumeration
    return NextResponse.json({ ok: true })
  }
}
