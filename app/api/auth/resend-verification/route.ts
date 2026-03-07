// app/api/auth/resend-verification/route.ts
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as any))
    const email = String(body.email ?? '').trim().toLowerCase()
    if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 })

    const users = await sql`
      SELECT id, first_name, email_verified
      FROM users
      WHERE email = ${email}
      LIMIT 1
    `
    if (!users.length) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const user = users[0]

    if (user.email_verified) {
      return NextResponse.json({ ok: true, alreadyVerified: true })
    }

    // Delete any existing tokens for this user
    await sql`
      DELETE FROM email_verification_tokens WHERE user_id = ${user.id}
    `

    const rawToken = crypto.randomBytes(32).toString('hex')
    const tokenHash = sha256(rawToken)
    const tokenId = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Fixed SQL - no colon syntax
    await sql`
      INSERT INTO email_verification_tokens (id, user_id, token_hash, expires_at, created_at)
      VALUES (${tokenId}, ${user.id}, ${tokenHash}, ${expiresAt.toISOString()}, NOW())
    `

    const appUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://www.precisegovcon.com'
    const verifyUrl = `${appUrl}/api/auth/verify-email?token=${rawToken}`
    const from = process.env.RESEND_FROM_EMAIL || 'Precise GovCon <noreply@precisegovcon.com>'
    const name = String(user.first_name || 'there')

    await resend.emails.send({
      from,
      to: email,
      subject: 'Verify your email – Precise GovCon',
      html: `
        <!DOCTYPE html>
        <html>
          <body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background:#f3f4f6;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td align="center" style="padding:40px 20px;">
                <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;box-shadow:0 4px 6px rgba(0,0,0,0.07);">
                  <tr>
                    <td style="padding:40px;background:linear-gradient(135deg,#0f172a,#1e293b);border-radius:16px 16px 0 0;text-align:center;">
                      <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:900;">PRECISE<span style="color:#f97316;">GOVCON</span></h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:40px;">
                      <p style="margin:0 0 16px;color:#1e293b;font-size:16px;font-weight:700;">Hi ${name},</p>
                      <p style="margin:0 0 24px;color:#334155;font-size:16px;font-weight:600;line-height:1.6;">
                        Please verify your email address to activate your 7-day free trial.
                      </p>
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin:32px 0;">
                        <tr>
                          <td align="center">
                            <a href="${verifyUrl}"
                               style="display:inline-block;padding:16px 40px;background:#059669;color:#ffffff;text-decoration:none;font-weight:900;font-size:16px;border-radius:12px;">
                              Verify Email &amp; Start Trial
                            </a>
                          </td>
                        </tr>
                      </table>
                      <p style="margin:0 0 8px;color:#64748b;font-size:13px;font-weight:600;">
                        Or copy and paste this link:
                      </p>
                      <p style="margin:0 0 24px;padding:12px;background:#f1f5f9;border-radius:8px;color:#334155;font-size:12px;word-break:break-all;font-family:monospace;">
                        ${verifyUrl}
                      </p>
                      <p style="margin:0;color:#94a3b8;font-size:13px;font-weight:600;">
                        Link expires in 24 hours. If you didn't sign up, ignore this email.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:24px 40px;background:#f8fafc;border-radius:0 0 16px 16px;text-align:center;">
                      <p style="margin:0;color:#94a3b8;font-size:12px;font-weight:600;">
                        © ${new Date().getFullYear()} Precise GovCon LLC · Richmond, Virginia
                      </p>
                    </td>
                  </tr>
                </table>
              </td></tr>
            </table>
          </body>
        </html>
      `,
    })

    console.log(`✅ Verification email resent to: ${email}`)
    return NextResponse.json({ ok: true })

  } catch (err: any) {
    console.error('❌ resend-verification error:', err)
    return NextResponse.json({ error: 'Failed to send verification email' }, { status: 500 })
  }
}
