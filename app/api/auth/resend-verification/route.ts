// app/api/auth/resend-verification/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// POST { email }
// Deletes old tokens, creates a fresh one, re-sends the verification email.
// Returns { ok: true } whether or not the account exists (prevents enumeration).
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import { sendEmail } from '@/lib/email/send'
import { getBrand } from '@/lib/email/brand'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body  = await req.json().catch(() => ({} as any))
    const email = String(body.email ?? '').toLowerCase().trim()

    if (!email) return NextResponse.json({ ok: true }) // silent

    const user = await prisma.users.findUnique({
      where: { email },
      select: { id: true, first_name: true, email_verified: true },
    })

    // Always return ok to prevent account enumeration
    if (!user)             return NextResponse.json({ ok: true })
    if (user.email_verified) return NextResponse.json({ ok: true, alreadyVerified: true })

    // Rotate token
    await prisma.email_verification_tokens.deleteMany({ where: { user_id: user.id } })

    const rawToken  = crypto.randomBytes(32).toString('hex')
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await prisma.email_verification_tokens.create({
      data: {
        id:         crypto.randomUUID(),
        user_id:    user.id,
        token_hash: tokenHash,
        expires_at: expiresAt,
        created_at: new Date(),
      },
    })

    const brand     = getBrand()
    const verifyUrl = `${brand.appUrl}/api/auth/verify-email?token=${rawToken}`
    const name      = user.first_name || 'there'

    await sendEmail({
      to:      email,
      subject: `Verify Your Email – ${brand.name}`,
      html:    buildEmail(name, verifyUrl),
      text:    `Hi ${name},\n\nVerify your email:\n${verifyUrl}\n\nExpires in 24 hours.`,
    })

    console.log('✅ Verification email resent to:', email)
    return NextResponse.json({ ok: true })

  } catch (err: any) {
    console.error('❌ resend-verification error:', err.message)
    return NextResponse.json({ ok: true }) // always ok to caller
  }
}

function buildEmail(name: string, verifyUrl: string): string {
  const brand = getBrand()
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background:#f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="600" cellpadding="0" cellspacing="0"
             style="background:#ffffff;border-radius:16px;box-shadow:0 4px 6px rgba(0,0,0,0.07);">
        <tr>
          <td style="padding:32px 40px 24px;background:linear-gradient(135deg,#0f172a,#1e293b);
                     border-radius:16px 16px 0 0;text-align:center;">
            <img src="${brand.logoUrl}" alt="${brand.name}"
                 style="max-width:200px;height:auto;display:block;margin:0 auto 12px;border:0;" />
            <p style="margin:0;color:#cbd5e1;font-size:11px;font-weight:600;letter-spacing:0.05em;">
              ${brand.tagline}
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 8px;color:#1e293b;font-size:16px;font-weight:700;">Hi ${name},</p>
            <p style="margin:0 0 24px;color:#334155;font-size:15px;line-height:1.6;">
              Here's a fresh verification link for your account. Click below to verify your email
              and activate your <strong>7-day free trial</strong>.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td align="center" style="padding:8px 0 28px;">
                <a href="${verifyUrl}"
                   style="display:inline-block;padding:14px 44px;background:#059669;
                          color:#ffffff;text-decoration:none;font-weight:900;font-size:15px;
                          border-radius:12px;">
                  Verify Email &amp; Start Trial →
                </a>
              </td></tr>
            </table>
            <p style="margin:0 0 6px;color:#64748b;font-size:12px;">Or paste this link:</p>
            <p style="margin:0 0 20px;padding:10px;background:#f1f5f9;border-radius:6px;
                      color:#334155;font-size:11px;word-break:break-all;font-family:monospace;">
              ${verifyUrl}
            </p>
            <p style="margin:0;color:#94a3b8;font-size:12px;">
              Link expires in 24 hours. If you didn't request this, ignore this email.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;background:#f8fafc;border-radius:0 0 16px 16px;text-align:center;">
            <p style="margin:0;color:#94a3b8;font-size:11px;">
              © ${new Date().getFullYear()} Precise GovCon LLC · Richmond, Virginia
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}